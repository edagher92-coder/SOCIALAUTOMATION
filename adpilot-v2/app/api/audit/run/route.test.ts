import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// audit/run route: the one-click "Run my first audit". Verifies auth, the
// api_connect entitlement gate, the "no connected account" guard, the pull→score
// reuse (shared syncOrgPlatform + scoreAndAlertOrg, NOT duplicated engine logic),
// and that it returns the freshly-written score for the UI to celebrate.
//
// The shared puller and scorer are mocked so success/failure is deterministic;
// @/lib/entitlements (pure) runs for real so the real gate is exercised.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "pro";
let CONNECTED: Array<{ platform: string }> = [{ platform: "meta" }];
let LATEST_SCORE: any = { total: 82, band: "Green" };

const syncOrgPlatform = vi.fn();
const scoreAndAlertOrg = vi.fn();
const updates: Array<{ table: string; values: any }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const api: any = {
        select() { return api; },
        eq() { return api; },
        order() { return api; },
        limit() { return api; },
        update(values: any) { updates.push({ table, values }); const u: any = { eq() { return u; }, then(res: any) { return Promise.resolve({ error: null }).then(res); } }; return u; },
        maybeSingle() {
          if (table === "organisations") return Promise.resolve({ data: { id: "org-1", name: "Org", average_sale_value: 200, gross_margin: 0.6 }, error: null });
          if (table === "health_scores") return Promise.resolve({ data: LATEST_SCORE, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        then(res: any) {
          if (table === "connected_ad_accounts") return Promise.resolve({ data: CONNECTED, error: null }).then(res);
          return Promise.resolve({ data: null, error: null }).then(res);
        },
      };
      return api;
    },
  }),
}));
vi.mock("@/lib/org", () => ({ getActiveOrgId: async () => "org-1", planForOrg: async () => CURRENT_PLAN }));
vi.mock("@/lib/sync/pull", () => ({ syncOrgPlatform: (...a: any[]) => syncOrgPlatform(...a) }));
vi.mock("@/lib/cron/score", () => ({ scoreAndAlertOrg: (...a: any[]) => scoreAndAlertOrg(...a) }));

import { POST } from "./route";

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "pro";
  CONNECTED = [{ platform: "meta" }];
  LATEST_SCORE = { total: 82, band: "Green" };
  syncOrgPlatform.mockReset().mockResolvedValue(12);
  scoreAndAlertOrg.mockReset().mockResolvedValue({ scored: true, alerted: false });
  updates.length = 0;
});

describe("auth & gate", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    expect((await POST()).status).toBe(401);
  });

  it("402 when the plan lacks api_connect", async () => {
    CURRENT_PLAN = "starter";
    const r = await POST();
    expect(r.status).toBe(402);
    expect((await r.json()).upgrade).toBe(true);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });

  it("409 when no account is connected yet", async () => {
    CONNECTED = [];
    const r = await POST();
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/connect/i);
    expect(scoreAndAlertOrg).not.toHaveBeenCalled();
  });
});

describe("pull → score happy path", () => {
  it("pulls, scores via the shared cron path, and returns the new score", async () => {
    const r = await POST();
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.rows).toBe(12);
    expect(j.scored).toBe(true);
    expect(j.total).toBe(82);
    expect(j.band).toBe("Green");
    expect(syncOrgPlatform).toHaveBeenCalledWith(expect.anything(), "org-1", "meta");
    expect(scoreAndAlertOrg).toHaveBeenCalledTimes(1); // engine logic reused, not duplicated
    // advanced the cadence clock so the next auto-sync isn't immediate
    expect(updates.find((u) => u.table === "organisations" && u.values.last_synced_at)).toBeTruthy();
  });

  it("still 200 and scores when one of two platforms fails to pull", async () => {
    CONNECTED = [{ platform: "meta" }, { platform: "tiktok" }];
    syncOrgPlatform.mockImplementation(async (_a: any, _o: string, p: string) => {
      if (p === "tiktok") throw new Error("rate limited");
      return 5;
    });
    const r = await POST();
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.rows).toBe(5);
    expect(j.scored).toBe(true);
    expect(j.syncErrors?.[0]).toMatch(/tiktok/i);
  });

  it("502 with the platform message when nothing could be pulled", async () => {
    syncOrgPlatform.mockRejectedValue(new Error("Meta token is invalid"));
    const r = await POST();
    expect(r.status).toBe(502);
    expect((await r.json()).error).toMatch(/invalid/i);
    expect(scoreAndAlertOrg).not.toHaveBeenCalled(); // don't score on a total pull failure
  });
});
