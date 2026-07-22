import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildInteractiveDemoSnapshots } from "@/lib/demo/workspace";
import { analyse } from "@/lib/engine";
import { refreshOpenRecommendations } from "@/lib/proposals";

// Founder accounts are stored as one-way hashes so personal email addresses are
// never committed to the public repository or emitted to the browser bundle.
const FOUNDER_EMAIL_HASHES = new Set([
  "33d0afba909a62ade6fac81bf4032f2d9dbc22cc149a5194a9c8be73cb05bedc",
  "f10942cbeceea2899209c430a0284e176d6a1c8cfde155e4c7da4e02615a2853",
]);

export function isFounderAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return FOUNDER_EMAIL_HASHES.has(hash);
}

export async function ensureFounderExpertPlan(input: { userId: string; email?: string | null; orgId: string }) {
  if (!isFounderAccount(input.email)) return false;

  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("role")
    .eq("organisation_id", input.orgId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (membershipError) throw new Error(`Founder access check failed: ${membershipError.message}`);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) return false;

  const { data: existing, error: existingError } = await admin
    .from("billing_subscriptions")
    .select("id")
    .eq("organisation_id", input.orgId)
    .eq("plan", "expert")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(`Founder plan lookup failed: ${existingError.message}`);
  if (existing) return true;

  const periodEnd = new Date();
  periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 10);
  const { error: insertError } = await admin.from("billing_subscriptions").insert({
    organisation_id: input.orgId,
    plan: "expert",
    status: "active",
    current_period_end: periodEnd.toISOString(),
  });
  if (insertError) throw new Error(`Founder plan activation failed: ${insertError.message}`);

  await admin.from("audit_logs").insert({
    organisation_id: input.orgId,
    user_id: input.userId,
    action: "billing.founder_expert_activated",
    detail: { plan: "expert", billing_mode: "complimentary", stripe_changed: false },
  });
  return true;
}

const demoDate = (daysAgo: number) => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
};
const demoIso = (daysAgo: number) => demoDate(daysAgo).toISOString();
const demoDay = (daysAgo: number) => demoIso(daysAgo).slice(0, 10);
const demoRound = (value: number) => Math.round(value * 100) / 100;

async function insertDemoRows(admin: ReturnType<typeof createAdminClient>, table: string, rows: Record<string, unknown>[], chunkSize = 400) {
  await Promise.all(Array.from({ length: Math.ceil(rows.length / chunkSize) }, async (_, index) => {
    const { error } = await admin.from(table).insert(rows.slice(index * chunkSize, (index + 1) * chunkSize));
    if (error) throw new Error(`${table}: ${error.message}`);
  }));
}

function demoAggregate(rows: Record<string, any>[], windowEndOffset: number, days = 30) {
  const daysInWindow = new Set(Array.from({ length: days }, (_, index) => demoDay(windowEndOffset + index)));
  const grouped = new Map<string, Record<string, any>>();
  for (const row of rows) {
    if (!daysInWindow.has(row.date)) continue;
    const key = `${row.platform}:${row.ad_id}`;
    const current = grouped.get(key) || { platform: row.platform, campaign_name: row.campaign_name, ad_name: row.ad_name, spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0, frequency: row.frequency, tracking_status: row.tracking_status };
    for (const metric of ["spend", "impressions", "reach", "clicks", "leads", "purchases", "revenue"]) current[metric] += Number(row[metric] || 0);
    grouped.set(key, current);
  }
  return [...grouped.values()].map((row) => ({ ...row, ctr: row.impressions ? row.clicks / row.impressions : 0 }));
}

/**
 * Seeds only an entirely empty founder workspace. This is intentionally a
 * one-way safety gate: a workspace with reporting, accounts, or reports is
 * treated as real and is never modified by the demo loader.
 */
export async function ensureFounderDemoData(input: { userId: string; email?: string | null; orgId: string }) {
  if (!isFounderAccount(input.email)) return false;
  const admin = createAdminClient();
  const [snapshots, accounts, reports] = await Promise.all([
    admin.from("campaign_snapshots").select("id", { count: "exact", head: true }).eq("organisation_id", input.orgId),
    admin.from("connected_ad_accounts").select("id", { count: "exact", head: true }).eq("organisation_id", input.orgId),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("organisation_id", input.orgId),
  ]);
  if (snapshots.error || accounts.error || reports.error) throw new Error("The workspace could not be checked before loading demo data.");
  if ((snapshots.count || 0) > 0 || (accounts.count || 0) > 0 || (reports.count || 0) > 0) return false;

  const rows = buildInteractiveDemoSnapshots(input.orgId) as Record<string, any>[];
  const config = { business_name: "AdPilot Growth Lab", average_sale_value: 149, gross_margin: 0.74, currency: "AUD", monthly_budget: 18000, lead_close_rate: 0.18 };
  const analyses = Array.from({ length: 6 }, (_, month) => {
    const offset = (5 - month) * 30;
    return { offset, result: analyse(demoAggregate(rows, offset) as any, config) };
  });
  const latest = analyses[analyses.length - 1].result;
  const daily = new Map<string, Record<string, any>>();
  for (const row of rows) {
    const current = daily.get(row.date) || { organisation_id: input.orgId, date: row.date, spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0 };
    for (const metric of ["spend", "impressions", "clicks", "leads", "purchases", "revenue"]) current[metric] += Number(row[metric] || 0);
    daily.set(row.date, current);
  }
  const dailyRows = [...daily.values()].map((row, index) => ({ ...row, spend: demoRound(row.spend), revenue: demoRound(row.revenue), health_total: demoRound(62 + (index / 180) * 18 + Math.sin(index / 8) * 2.5), health_band: index > 130 ? "Green" : index > 65 ? "Yellow" : "Orange" }));
  const pageSuffix = `${input.userId.slice(0, 8)}-${input.orgId.slice(0, 8)}`;
  const now = new Date().toISOString();

  await admin.from("organisations").update({ average_sale_value: 149, gross_margin: 0.74, monthly_budget: 18000, lead_close_rate: 0.18, sync_interval_hours: 6, last_synced_at: now }).eq("id", input.orgId);
  try {
    await insertDemoRows(admin, "campaign_snapshots", rows);
    await Promise.all([
      insertDemoRows(admin, "connected_ad_accounts", [
        { organisation_id: input.orgId, platform: "meta", external_account_id: `act_DEMO_${pageSuffix}`, display_name: "AdPilot Growth Lab · Meta", status: "connected" },
        { organisation_id: input.orgId, platform: "tiktok", external_account_id: `tt_DEMO_${pageSuffix}`, display_name: "@adpilotgrowth · TikTok", status: "connected" },
      ]),
      insertDemoRows(admin, "account_daily_metrics", dailyRows),
      insertDemoRows(admin, "health_scores", analyses.map(({ offset, result }) => ({ organisation_id: input.orgId, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown, data_confidence: (result.health as any).breakdown?.data_confidence?.score ?? null, period_start: demoDay(offset + 29), period_end: demoDay(offset), created_at: demoIso(offset) }))),
      insertDemoRows(admin, "reports", analyses.map(({ offset, result }) => ({ organisation_id: input.orgId, title: `${demoDate(offset).toLocaleString("en-AU", { month: "long", year: "numeric" })} performance review`, period: demoDay(offset), payload: result, created_by: input.userId, created_at: demoIso(offset) }))),
      insertDemoRows(admin, "ad_actions", [
        { organisation_id: input.orgId, platform: "meta", entity_level: "campaign", external_entity_id: "DEMO-LEGACY", entity_name: "Legacy Interest Stack", action: "pause", params: {}, prior_state: { status: "ACTIVE" }, status: "proposed", confirm_phrase: "YES PAUSE LEGACY INTEREST STACK", requested_by: input.userId },
        { organisation_id: input.orgId, platform: "meta", entity_level: "campaign", external_entity_id: "DEMO-PROOF", entity_name: "Customer Proof Carousel", action: "set_budget", params: { current_daily_budget: 92, proposed_daily_budget: 110 }, prior_state: { daily_budget: 92 }, status: "proposed", confirm_phrase: "YES SET BUDGET 110", requested_by: input.userId },
        { organisation_id: input.orgId, platform: "tiktok", entity_level: "ad", external_entity_id: "DEMO-HOOK-C", entity_name: "Hook Test C — Stop Guessing", action: "pause", params: {}, prior_state: { status: "ACTIVE" }, status: "done", confirm_phrase: "YES PAUSE HOOK TEST C", result: "Demo approval recorded; no live account was changed.", requested_by: input.userId, approved_by: input.userId, executed_at: demoIso(11) },
      ]),
      insertDemoRows(admin, "content_posts", [
        ["instagram", "The three numbers we check before touching any ad budget.", "reel", "published", 6], ["tiktok", "POV: your campaign is profitable but your dashboard says panic.", "reel", "published", 4], ["facebook", "A calm Monday account-health checklist for small teams.", "image", "published", 2], ["instagram", "Creative fatigue is a signal—not a reason to rebuild everything.", "image", "scheduled", -2], ["tiktok", "Three tracking checks before you blame the creative.", "reel", "draft", 0],
      ].map(([platform, caption, media_type, status, when]) => ({ organisation_id: input.orgId, platform, caption, media_type, status, source: "studio", created_by: input.userId, published_at: status === "published" ? demoIso(Number(when)) : null, scheduled_at: status === "scheduled" ? demoIso(Number(when)) : null }))),
      insertDemoRows(admin, "organic_posts", Array.from({ length: 12 }, (_, index) => ({ organisation_id: input.orgId, platform: index % 3 === 0 ? "tiktok" : "meta", name: ["Founder lesson", "Monday dashboard", "Customer proof", "Hook teardown"][index % 4], posted_at: demoDay(index * 6 + 2), reach: 4200 + index * 730, impressions: 5300 + index * 920, engagements: 210 + index * 38, external_id: `DEMO-ORGANIC-${pageSuffix}-${index}`, source: index % 3 === 0 ? "tiktok_sync" : "meta_sync" }))),
      insertDemoRows(admin, "alert_rules", [
        { organisation_id: input.orgId, name: "High CPA after meaningful spend", metric: "cpa", operator: "gt", threshold: 110, min_spend_gate: 250, severity: "critical", scope: "campaign", enabled: true, message: "CPA is above the workspace guardrail." },
        { organisation_id: input.orgId, name: "Creative fatigue watch", metric: "frequency", operator: "gte", threshold: 4, min_volume_gate: 5000, severity: "warning", scope: "ad", enabled: true, message: "Frequency is high enough to inspect creative fatigue." },
      ]),
      insertDemoRows(admin, "alert_events", [
        { organisation_id: input.orgId, rule_id: "DEMO-CPA", severity: "critical", campaign_name: "Legacy Interest Stack", metric: "cpa", value: 126, threshold: 110, message: "CPA exceeded the guardrail after meaningful spend.", status: "open", dedupe_key: `DEMO-CPA-${pageSuffix}` },
        { organisation_id: input.orgId, rule_id: "DEMO-TRACKING", severity: "critical", campaign_name: "Checkout Recovery", metric: "purchases", value: 0, threshold: 0, message: "Tracking validation is required before optimisation.", status: "open", dedupe_key: `DEMO-TRACKING-${pageSuffix}` },
      ]),
      insertDemoRows(admin, "lead_events", Array.from({ length: 30 }, (_, index) => ({ organisation_id: input.orgId, event_id: `DEMO-LEAD-${pageSuffix}-${index}`, lead_id: `lead_${1000 + index}`, platform: index % 4 === 0 ? "tiktok" : "meta", campaign_name: "Free Growth Workshop", status: ["new", "qualified", "proposal_sent", "won", "lost"][index % 5], sale_value_aud: index % 5 === 3 ? 149 : null, lead_quality_score: 48 + ((index * 13) % 49), email_hash: createHash("sha256").update(`adpilot-demo-${pageSuffix}-${index}`).digest("hex"), source: "crm_webhook", closed_date: index % 5 > 2 ? demoDay(index * 2) : null }))),
      insertDemoRows(admin, "ingestion_runs", Array.from({ length: 8 }, (_, index) => ({ organisation_id: input.orgId, platform: index % 3 === 0 ? "tiktok" : "meta", account_id: index % 3 === 0 ? `tt_DEMO_${pageSuffix}` : `act_DEMO_${pageSuffix}`, started_at: demoIso(index * 3), finished_at: new Date(demoDate(index * 3).getTime() + 42000).toISOString(), window_days: 30, rows_written: 236 + index * 31, status: "ok", graph_version: "demo" }))),
    ]);
    await refreshOpenRecommendations(admin, input.orgId, latest.decisions as any[]);
    await insertDemoRows(admin, "audit_logs", [{ organisation_id: input.orgId, user_id: input.userId, action: "demo.empty_workspace_seeded", detail: { records: rows.length, synthetic: true, live_ad_changes: false } }]);
    return true;
  } catch (error) {
    // Only rows created for an initially empty workspace are removed. The user
    // asked for demo data, but never a half-complete demo.
    await Promise.all([
      admin.from("campaign_snapshots").delete().eq("organisation_id", input.orgId).eq("source", "csv"),
      admin.from("connected_ad_accounts").delete().eq("organisation_id", input.orgId).like("external_account_id", "act_DEMO_%"),
      admin.from("connected_ad_accounts").delete().eq("organisation_id", input.orgId).like("external_account_id", "tt_DEMO_%"),
      admin.from("account_daily_metrics").delete().eq("organisation_id", input.orgId),
      admin.from("health_scores").delete().eq("organisation_id", input.orgId),
      admin.from("reports").delete().eq("organisation_id", input.orgId),
      admin.from("recommendations").delete().eq("organisation_id", input.orgId),
    ]);
    throw error;
  }
}
