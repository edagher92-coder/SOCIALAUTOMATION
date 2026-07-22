import { describe, it, expect, vi, beforeEach } from "vitest";

// Email is best-effort and external — mock it. Everything else (the real engine,
// the real recommendation refresh/dedupe in lib/proposals) runs for real.
const sendEmail: any = vi.fn(async () => {});
vi.mock("@/lib/email/resend", () => ({ sendEmail: (...a: any[]) => sendEmail(...a) }));

import { scoreAndAlertOrg } from "./score";

// Inline mock Supabase admin: a chained query builder that records writes and
// serves canned reads. Covers the tables score.ts touches.
function makeAdmin(opts: {
  snapshots: any[];
  priorOpenIds?: string[];
  notificationRule?: any;
  alertRules?: any[];
  openAlertEvents?: { id: string; dedupe_key: string }[];
}) {
  const writes: Record<string, any[]> = { health_scores: [], reports: [], recommendations_insert: [], alert_events: [] };
  const deletes: { table: string; ids?: any[] }[] = [];
  const updates: { table: string; values: any; ids?: any[] }[] = [];

  function from(table: string) {
    const state: any = { eqs: [] as any[], mode: null };
    const builder: any = {
      select(_cols: string) { state.mode = "select"; return builder; },
      eq(col: string, val: any) { state.eqs.push([col, val]); return builder; },
      gte() { return builder; },
      limit() {
        // campaign_snapshots read resolves here
        if (table === "campaign_snapshots") return Promise.resolve({ data: opts.snapshots, error: null });
        if (table === "alert_events") return Promise.resolve({ data: opts.openAlertEvents ?? [], error: null });
        return builder;
      },
      order() {
        if (table === "alert_rules") return Promise.resolve({ data: opts.alertRules ?? [], error: null });
        return builder;
      },
      maybeSingle() {
        if (table === "notification_rules") return Promise.resolve({ data: opts.notificationRule ?? null, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      insert(rows: any) {
        if (table === "recommendations") writes.recommendations_insert.push(...(Array.isArray(rows) ? rows : [rows]));
        else (writes[table] ||= []).push(rows);
        return Promise.resolve({ data: null, error: null });
      },
      upsert(rows: any) {
        if (table === "alert_events") writes.alert_events.push(...(Array.isArray(rows) ? rows : [rows]));
        return Promise.resolve({ data: null, error: null });
      },
      update(values: any) { updates.push({ table, values }); return builder; },
      delete() { state.mode = "delete"; return builder; },
      in(_col: string, ids: any[]) {
        if (state.mode === "delete") deletes.push({ table, ids });
        else updates.push({ table, values: null, ids });
        return builder;
      },
      // the open-recommendations snapshot read awaits the builder directly
      then(resolve: any) {
        if (table === "recommendations" && state.mode === "select") {
          resolve({ data: (opts.priorOpenIds ?? []).map((id) => ({ id })), error: null });
        } else {
          resolve({ data: null, error: null });
        }
      },
    };
    return builder;
  }

  return { admin: { from }, writes, deletes, updates };
}

// Real-engine snapshots: two KillCamp rows (meta + tiktok) => two distinct 'kill'
// recommendations; one ScaleCamp row => 'scale' (a healthy, statistically-significant
// winner — now reachable via the per-campaign gate, and actionable).
const snapshots = [
  { campaign_name: "KillCamp", platform: "meta", date: "2026-06-13", spend: 2000, impressions: 50000, reach: 20000, clicks: 600, leads: 5, purchases: 4, revenue: 400, tracking_status: "ok" },
  { campaign_name: "ScaleCamp", platform: "meta", date: "2026-06-13", spend: 600, impressions: 30000, reach: 16000, clicks: 600, leads: 40, purchases: 12, revenue: 3600, tracking_status: "ok", lead_quality_score: 82 },
  { campaign_name: "KillCamp", platform: "tiktok", date: "2026-06-13", spend: 2000, impressions: 50000, reach: 20000, clicks: 600, leads: 5, purchases: 4, revenue: 400, tracking_status: "ok" },
];

const ORG = { id: "org-1", name: "Acme", average_sale_value: 200, gross_margin: 0.6 };

describe("scoreAndAlertOrg", () => {
  beforeEach(() => sendEmail.mockClear());

  it("returns {scored:false} and writes nothing when there are no snapshots", async () => {
    const { admin, writes } = makeAdmin({ snapshots: [] });
    const res = await scoreAndAlertOrg(admin, ORG);
    expect(res).toEqual({ scored: false, alerted: false });
    expect(writes.health_scores).toHaveLength(0);
    expect(writes.recommendations_insert).toHaveLength(0);
  });

  it("scores, saves a report, and refreshes the open recommendations (actionable + platform-aware dedupe)", async () => {
    const { admin, writes, deletes } = makeAdmin({ snapshots, priorOpenIds: ["old-rec"] });
    const res = await scoreAndAlertOrg(admin, ORG);

    expect(res.scored).toBe(true);
    expect(writes.health_scores).toHaveLength(1);
    expect(writes.health_scores[0].organisation_id).toBe("org-1");
    expect(writes.reports).toHaveLength(1);

    // ScaleCamp is a healthy, significant winner -> 'scale' (actionable, kept). The two KillCamp
    // rows survive on different platforms (platform-aware dedupe keeps them distinct), in row order.
    const recs = writes.recommendations_insert;
    expect(recs.map((r) => r.verdict)).toEqual(["kill", "scale", "kill"]);
    expect(recs.map((r) => r.entity_name)).toEqual(["KillCamp", "ScaleCamp", "KillCamp"]);
    expect(recs.filter((r) => r.verdict === "kill").map((r) => r.platform).sort()).toEqual(["meta", "tiktok"]);
    expect(recs.every((r) => r.organisation_id === "org-1")).toBe(true);

    // the previously-open row is cleared (insert-before-delete safety)
    expect(deletes.find((d) => d.table === "recommendations")).toMatchObject({ ids: ["old-rec"] });
  });

  it("exact-duplicate decisions collapse to a single recommendation", async () => {
    const dupSnaps = [
      { campaign_name: "KillCamp", platform: "meta", date: "2026-06-13", spend: 2000, impressions: 50000, reach: 20000, clicks: 600, leads: 5, purchases: 4, revenue: 400, tracking_status: "ok" },
      { campaign_name: "KillCamp", platform: "meta", date: "2026-06-13", spend: 2000, impressions: 50000, reach: 20000, clicks: 600, leads: 5, purchases: 4, revenue: 400, tracking_status: "ok" },
    ];
    const { admin, writes } = makeAdmin({ snapshots: dupSnaps });
    await scoreAndAlertOrg(admin, ORG);
    expect(writes.recommendations_insert).toHaveLength(1);
  });

  it("does not send an alert when no notification rule is configured", async () => {
    const { admin } = makeAdmin({ snapshots });
    const res = await scoreAndAlertOrg(admin, ORG);
    expect(res.alerted).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("runs the saved watch-rule library and resolves stale alert events", async () => {
    const watched = [{
      campaign_name: "WatchMe", platform: "meta", date: "2026-06-13",
      spend: 100, impressions: 2000, clicks: 40, leads: 5, purchases: 1,
      revenue: 300, frequency: 7, tracking_status: "ok",
    }];
    const alertRules = [{
      id: "11111111-1111-4111-8111-111111111111", name: "Frequency guard",
      metric: "frequency", operator: "gte", threshold: 6, window_days: null,
      min_volume_gate: null, min_spend_gate: null, severity: "critical",
      scope: "campaign", platform: "meta", rule_group: null, group_logic: null,
      enabled: true, message: null,
    }];
    const { admin, writes, updates } = makeAdmin({
      snapshots: watched,
      alertRules,
      openAlertEvents: [{ id: "stale-1", dedupe_key: "old:Meta · Old" }],
    });
    await scoreAndAlertOrg(admin, ORG);
    expect(writes.alert_events).toHaveLength(1);
    expect(writes.alert_events[0]).toMatchObject({
      rule_id: alertRules[0].id,
      campaign_name: "Meta · WatchMe",
      status: "open",
    });
    expect(updates).toContainEqual(expect.objectContaining({ table: "alert_events", values: { status: "resolved" } }));
    expect(updates).toContainEqual(expect.objectContaining({ table: "alert_events", ids: ["stale-1"] }));
  });

  it("sends a critical alert when there are breaches and the rule opts in", async () => {
    // A RED-band account (or CRITICAL finding) triggers a breach. Force a broken
    // tracking + zero-results-with-spend row to drive the band down hard.
    const redSnaps = Array.from({ length: 6 }, (_, i) => ({
      campaign_name: `Broken${i}`, platform: "meta", date: "2026-06-13",
      spend: 5000, impressions: 100000, reach: 40000, clicks: 800, leads: 0, purchases: 0, revenue: 0, tracking_status: "broken",
    }));
    const { admin } = makeAdmin({
      snapshots: redSnaps,
      notificationRule: { email: "alerts@acme.com", critical_alerts: true },
    });
    const res = await scoreAndAlertOrg(admin, ORG);
    expect(res.scored).toBe(true);
    // The broken-tracking, zero-result rows push the account into the RED band,
    // which breaches() flags -> an alert email is sent to the configured address.
    expect(res.alerted).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]?.[0]).toBe("alerts@acme.com");
  });

  it("escapes workspace-controlled text in alert email HTML", async () => {
    const redSnaps = [{
      campaign_name: "Broken", platform: "meta", date: "2026-06-13",
      spend: 5000, impressions: 100000, reach: 40000, clicks: 800,
      leads: 0, purchases: 0, revenue: 0, tracking_status: "broken",
    }];
    const { admin } = makeAdmin({
      snapshots: redSnaps,
      notificationRule: { email: "alerts@acme.com", critical_alerts: true },
    });
    await scoreAndAlertOrg(admin, { ...ORG, name: '<img src=x onerror="alert(1)">' });
    const html = sendEmail.mock.calls[0]?.[2] as string;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
