import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// auto-sync cron route: due-time gating, plan gate, and the PARTIAL-FAILURE rule
// (advance last_synced_at only when at least one platform pull succeeds).
//
// @/lib/sync/pull and @/lib/cron/score are mocked so we drive success/failure
// deterministically. @/lib/supabase/admin returns an inline mock Supabase whose
// data tables we configure per test. @/lib/entitlements is the real (pure) module.
// ---------------------------------------------------------------------------

const syncOrgPlatform = vi.fn();
const scoreAndAlertOrg = vi.fn();

vi.mock("@/lib/sync/pull", () => ({
  syncOrgPlatform: (...a: any[]) => syncOrgPlatform(...a),
  // PLATFORMS order is defined in the route itself; nothing else needed here.
}));
vi.mock("@/lib/cron/score", () => ({
  scoreAndAlertOrg: (...a: any[]) => scoreAndAlertOrg(...a),
}));

// Inline mock Supabase. Records organisations.update() calls so we can assert
// whether last_synced_at advanced.
const updates: Array<{ table: string; values: any; id: any }> = [];
let DB: Record<string, any[]> = {};

function makeAdmin() {
  return {
    from(table: string) {
      const filters: Record<string, any> = {};
      const api: any = {
        select() { return api; },
        eq(col: string, val: any) { filters[col] = val; return api; },
        update(values: any) {
          // chainable .eq() (Supabase supports .eq().eq()…), awaitable; records once on resolve
          const u: any = {
            eq(c: string, v: any) { filters[c] = v; return u; },
            then(resolve: any, reject: any) { updates.push({ table, values, id: filters.id }); return Promise.resolve({ error: null }).then(resolve, reject); },
          };
          return u;
        },
        then(resolve: any, reject: any) {
          // resolve a select chain with the configured rows for the table
          return Promise.resolve({ data: DB[table] ?? [], error: null }).then(resolve, reject);
        },
      };
      return api;
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeAdmin() }));

import { GET } from "./route";

const SECRET = "cron-secret-xyz";

function req(opts: { auth?: string; key?: string } = {}) {
  const url = opts.key ? `https://x/api/cron/auto-sync?key=${opts.key}` : "https://x/api/cron/auto-sync";
  const headers: Record<string, string> = {};
  if (opts.auth) headers["authorization"] = opts.auth;
  return new Request(url, { headers });
}

beforeEach(() => {
  syncOrgPlatform.mockReset();
  scoreAndAlertOrg.mockReset().mockResolvedValue({ scored: true, alerted: false });
  updates.length = 0;
  DB = {};
  process.env.CRON_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("auth + config guards", () => {
  it("503 when CRON_SECRET is not configured (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    const r = await GET(req({ key: "anything" }));
    expect(r.status).toBe(503);
  });

  it("401 when the secret is wrong", async () => {
    const r = await GET(req({ key: "nope" }));
    expect(r.status).toBe(401);
  });

  it("accepts the bearer authorization header", async () => {
    DB = { organisations: [], billing_subscriptions: [] };
    const r = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(r.status).toBe(200);
  });
});

describe("plan gate", () => {
  it("skips orgs whose active plan lacks auto_sync (e.g. starter)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: [{ organisation_id: "o1", plan: "starter", status: "active" }],
    };
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.skipped).toBe(1);
    expect(j.synced).toBe(0);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });

  it("runs orgs on a pro plan", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: [{ organisation_id: "o1", plan: "pro", status: "active" }],
      connected_ad_accounts: [{ platform: "meta" }],
    };
    syncOrgPlatform.mockResolvedValue(3);
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.synced).toBe(1);
    expect(j.rows).toBe(3);
    expect(updates.find((u) => u.table === "organisations")).toBeTruthy(); // last_synced_at advanced
  });

  it("ignores an inactive subscription (treated as free → skipped)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: [{ organisation_id: "o1", plan: "pro", status: "canceled" }],
    };
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.skipped).toBe(1);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });
});

describe("cadence due-time gating", () => {
  const proSub = [{ organisation_id: "o1", plan: "pro", status: "active" }];

  it("skips when cadence is off (0)", async () => {
    DB = { organisations: [{ id: "o1", sync_interval_hours: 0, last_synced_at: null }], billing_subscriptions: proSub };
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).skipped).toBe(1);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });

  it("skips when the interval has not elapsed yet (synced 1h ago, daily cadence)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: new Date(Date.now() - 3_600_000).toISOString() }],
      billing_subscriptions: proSub,
    };
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).skipped).toBe(1);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });

  it("runs when the interval has elapsed (synced 25h ago, daily cadence)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }],
    };
    syncOrgPlatform.mockResolvedValue(2);
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).synced).toBe(1);
  });

  it("runs within the jitter slack window (synced 23h56m ago is treated as due)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: new Date(Date.now() - (24 * 3_600_000 - 4 * 60_000)).toISOString() }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }],
    };
    syncOrgPlatform.mockResolvedValue(1);
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).synced).toBe(1); // 4-min-early run allowed by the 5-min slack
  });

  it("runs immediately when never synced (last_synced_at null)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }],
    };
    syncOrgPlatform.mockResolvedValue(5);
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).synced).toBe(1);
  });

  it("skips a due org with no connected accounts", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [],
    };
    const r = await GET(req({ key: SECRET }));
    expect((await r.json()).skipped).toBe(1);
    expect(syncOrgPlatform).not.toHaveBeenCalled();
  });
});

describe("partial-failure handling", () => {
  const proSub = [{ organisation_id: "o1", plan: "pro", status: "active" }];

  it("does NOT advance last_synced_at when every platform pull fails", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }, { platform: "tiktok" }],
    };
    syncOrgPlatform.mockRejectedValue(new Error("token expired"));
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.synced).toBe(0);
    expect(j.failed).toBe(1);
    expect(updates.find((u) => u.table === "organisations")).toBeUndefined(); // clock NOT advanced
    expect(scoreAndAlertOrg).not.toHaveBeenCalled(); // no scoring on a fully-failed org
  });

  it("advances last_synced_at when at least one platform succeeds (the other fails)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }, { platform: "tiktok" }],
    };
    // meta succeeds (4 rows), tiktok throws
    syncOrgPlatform.mockImplementation(async (_admin: any, _org: string, p: string) => {
      if (p === "meta") return 4;
      throw new Error("tiktok token expired");
    });
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.synced).toBe(1);
    expect(j.rows).toBe(4);
    expect(j.failed).toBe(0);
    expect(updates.find((u) => u.table === "organisations")).toBeTruthy(); // advanced on partial success
    expect(scoreAndAlertOrg).toHaveBeenCalledTimes(1);
  });

  it("still counts the org as synced even if scoring throws (scoring is isolated)", async () => {
    DB = {
      organisations: [{ id: "o1", sync_interval_hours: 24, last_synced_at: null }],
      billing_subscriptions: proSub,
      connected_ad_accounts: [{ platform: "meta" }],
    };
    syncOrgPlatform.mockResolvedValue(2);
    scoreAndAlertOrg.mockRejectedValue(new Error("scoring blew up"));
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.synced).toBe(1);
    expect(j.scored).toBe(0);
    expect(updates.find((u) => u.table === "organisations")).toBeTruthy();
  });
});
