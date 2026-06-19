import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// syncOrgPlatform unit tests.
//
// We import pull.ts directly. It depends on @/lib/crypto.decrypt — rather than
// mock the module, we set a real 32-byte TOKEN_ENCRYPTION_KEY and feed the mock
// Supabase a genuinely-encrypted token, so the decrypt path is exercised for real.
//
// Supabase is an inline hand-rolled chainable mock (no network, no @supabase/*).
// global.fetch is mocked per-test to emulate the Meta / TikTok report endpoints.
// ---------------------------------------------------------------------------

// A 32-byte base64 key so lib/crypto can encrypt/decrypt the stored token for real.
const KEY_B64 = Buffer.alloc(32, 7).toString("base64");
process.env.TOKEN_ENCRYPTION_KEY = KEY_B64;

import { encrypt } from "@/lib/crypto";
import { syncOrgPlatform, extractMetaConversions } from "@/lib/sync/pull";

// ---- Inline mock Supabase -------------------------------------------------
// Each table is a small builder that records the filters applied and resolves
// to a configured result. delete()/insert() resolve to { error }. select chains
// resolve (or .maybeSingle()) to { data }.
type TableConfig = {
  // result returned for a plain awaited select-chain or maybeSingle()
  selectData?: any;
  // result returned for maybeSingle() specifically (falls back to selectData)
  singleData?: any;
  deleteError?: any;
  insertError?: any;
};

function makeAdmin(tables: Record<string, TableConfig>) {
  const calls = {
    deletes: [] as Array<{ table: string; filters: Record<string, any> }>,
    inserts: [] as Array<{ table: string; rows: any }>,
  };

  function builder(table: string, mode: "select" | "delete" | "insert", rows?: any) {
    const cfg = tables[table] || {};
    const filters: Record<string, any> = {};
    const api: any = {
      eq(col: string, val: any) { filters[col] = val; return api; },
      gte(col: string, val: any) { filters[`${col}>=`] = val; return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle() {
        return Promise.resolve({ data: cfg.singleData ?? cfg.selectData ?? null, error: null });
      },
      // make the chain itself awaitable for select-without-maybeSingle and delete
      then(resolve: any, reject: any) {
        if (mode === "delete") {
          calls.deletes.push({ table, filters });
          return Promise.resolve({ data: null, error: cfg.deleteError ?? null }).then(resolve, reject);
        }
        return Promise.resolve({ data: cfg.selectData ?? null, error: null }).then(resolve, reject);
      },
    };
    if (mode === "insert") {
      calls.inserts.push({ table, rows });
      // insert() result is awaited directly: return a resolved-shaped object.
      return Promise.resolve({ data: null, error: cfg.insertError ?? null });
    }
    return api;
  }

  const admin = {
    from(table: string) {
      return {
        select: () => builder(table, "select"),
        delete: () => builder(table, "delete"),
        insert: (rows: any) => builder(table, "insert", rows),
        update: () => builder(table, "select"),
      };
    },
    __calls: calls,
  };
  return admin;
}

function encToken(plain: string) {
  const e = encrypt(plain);
  return { ciphertext: e.ciphertext, iv: e.iv, auth_tag: e.authTag };
}

function metaRow(over: Record<string, any> = {}) {
  return {
    campaign_id: "c1", campaign_name: "Camp A", adset_id: "as1", adset_name: "AdSet A",
    ad_id: "ad1", ad_name: "Ad A", date_start: "2026-06-01", spend: "10.5", impressions: "1000",
    reach: "800", frequency: "1.25", clicks: "50", ctr: "5", cpc: "0.21", cpm: "10.5",
    actions: [
      { action_type: "lead", value: "4" },
      { action_type: "purchase", value: "3" },
      { action_type: "landing_page_view", value: "30" }, // LPV comes from actions[], not a field
    ],
    action_values: [{ action_type: "purchase", value: "600" }],
    video_play_actions: [{ action_type: "video_view", value: "400" }],
    video_thruplay_watched_actions: [{ action_type: "video_view", value: "120" }],
    ...over,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function okJson(body: any, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
}

describe("syncOrgPlatform — Meta", () => {
  it("clears the rolling 30-day API window then inserts the pulled rows (idempotent)", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "123" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValueOnce(okJson({ data: [metaRow(), metaRow({ campaign_name: "Camp B" })] }));

    const n = await syncOrgPlatform(admin as any, "org-1", "meta");
    expect(n).toBe(2);

    // delete-before-insert against the API source within the window
    const del = (admin as any).__calls.deletes;
    expect(del).toHaveLength(1);
    expect(del[0].table).toBe("campaign_snapshots");
    expect(del[0].filters.organisation_id).toBe("org-1");
    expect(del[0].filters.platform).toBe("meta");
    expect(del[0].filters.source).toBe("meta_api");
    expect(del[0].filters["date>="]).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const ins = (admin as any).__calls.inserts;
    expect(ins).toHaveLength(1);
    expect(ins[0].rows).toHaveLength(2);
    // ctr is normalised from percent → fraction; spend coerced to number; ad-grain
    // identity + extracted conversions (leads/purchases/revenue) are written.
    expect(ins[0].rows[0]).toMatchObject({
      organisation_id: "org-1", platform: "meta", spend: 10.5, ctr: 0.05, source: "meta_api",
      campaign_id: "c1", adset_id: "as1", ad_id: "ad1", ad_name: "Ad A",
      leads: 4, purchases: 3, revenue: 600, landing_page_views: 30,
      three_second_views: 400, thruplays: 120,
    });

    // the act_ prefix is added to the account id; pull is at AD level.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const metaUrl = String(fetchMock.mock.calls[0][0]);
    expect(metaUrl).toContain("act_123/insights");
    expect(metaUrl).toContain("level=ad");
    expect(metaUrl).toContain("action_values");
  });

  it("accumulates rows across multiple connected accounts", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "111" }, { external_account_id: "222" }] },
      campaign_snapshots: {},
    });
    fetchMock
      .mockReturnValueOnce(okJson({ data: [metaRow()] }))
      .mockReturnValueOnce(okJson({ data: [metaRow(), metaRow()] }));

    const n = await syncOrgPlatform(admin as any, "org-1", "meta");
    expect(n).toBe(3); // 1 + 2 accumulated
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((admin as any).__calls.inserts[0].rows).toHaveLength(3);
  });

  it("de-duplicates repeated account ids so they are pulled only once", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "111" }, { external_account_id: "111" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValue(okJson({ data: [metaRow()] }));

    const n = await syncOrgPlatform(admin as any, "org-1", "meta");
    expect(fetchMock).toHaveBeenCalledTimes(1); // not twice
    expect(n).toBe(1);
  });

  it("throws a clear error when there is no stored token", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: null },
      connected_ad_accounts: { selectData: [{ external_account_id: "111" }] },
    });
    await expect(syncOrgPlatform(admin as any, "org-1", "meta")).rejects.toThrow(/No connected meta account/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a clear error when there is no connected ad account", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [] },
    });
    await expect(syncOrgPlatform(admin as any, "org-1", "meta")).rejects.toThrow(/No meta ad account on file/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces a Meta API error (HTTP not ok)", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "111" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValueOnce(okJson({ error: { message: "Invalid OAuth access token" } }, false, 400));
    await expect(syncOrgPlatform(admin as any, "org-1", "meta")).rejects.toThrow(/Invalid OAuth access token/i);
    // no DB writes attempted when the pull fails
    expect((admin as any).__calls.deletes).toHaveLength(0);
    expect((admin as any).__calls.inserts).toHaveLength(0);
  });
});

describe("syncOrgPlatform — TikTok", () => {
  it("pulls and inserts TikTok report rows", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("TT_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "adv-9" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValueOnce(okJson({
      code: 0,
      data: { list: [{ metrics: { campaign_id: "c1", campaign_name: "TT Camp", adgroup_id: "ag1", ad_id: "ad9", ad_name: "TT Ad", spend: "5", impressions: "200", clicks: "10", ctr: "2", cpc: "0.5", cpm: "25", reach: "150", frequency: "1.3", conversion: "7", total_complete_payment: "350", video_play_actions: "180", video_watched_2s: "120", video_watched_6s: "60", video_views_p100: "40" }, dimensions: { ad_id: "ad9", stat_time_day: "2026-06-02 00:00:00" } }] },
    }));

    const n = await syncOrgPlatform(admin as any, "org-1", "tiktok");
    expect(n).toBe(1);
    const ins = (admin as any).__calls.inserts[0].rows;
    expect(ins[0]).toMatchObject({
      organisation_id: "org-1", platform: "tiktok", campaign_name: "TT Camp", spend: 5, ctr: 0.02, source: "tiktok_api",
      campaign_id: "c1", adset_id: "ag1", ad_id: "ad9", ad_name: "TT Ad",
      purchases: 7, revenue: 350, video_views: 180, three_second_views: 120, six_second_views: 60, thruplays: 40,
    });
    expect(ins[0].date).toBe("2026-06-02"); // stat_time_day truncated to date
    // delete window filter targets the tiktok_api source
    expect((admin as any).__calls.deletes[0].filters.source).toBe("tiktok_api");
    // pull is at AD level (AUCTION_AD), not campaign.
    expect(String(fetchMock.mock.calls[0][0])).toContain("AUCTION_AD");
  });

  it("surfaces a TikTok API error (non-zero code in a 200 body)", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("TT_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "adv-9" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValueOnce(okJson({ code: 40105, message: "Access token is invalid" }));
    await expect(syncOrgPlatform(admin as any, "org-1", "tiktok")).rejects.toThrow(/Access token is invalid/i);
    expect((admin as any).__calls.inserts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// extractMetaConversions — PURE helper unit tests (no network, no Supabase).
// This is the crux of the fix: pulling at ad level with conversions so accounts
// stop reporting "spend with zero results" and tripping a FALSE CRITICAL finding.
// ---------------------------------------------------------------------------
describe("extractMetaConversions", () => {
  it("extracts leads, purchases and revenue from a sample Meta actions/action_values payload", () => {
    const actions = [
      { action_type: "lead", value: "3" },
      { action_type: "onsite_conversion.lead_grouped", value: "2" },
      { action_type: "leadgen.other", value: "1" },
      { action_type: "purchase", value: "4" },
      { action_type: "omni_purchase", value: "1" },
      { action_type: "landing_page_view", value: "7" }, // LPV is an action type, not a field
      { action_type: "link_click", value: "999" }, // ignored
    ];
    const actionValues = [
      { action_type: "purchase", value: "480.50" },
      { action_type: "omni_purchase", value: "19.50" },
      { action_type: "lead", value: "12345" }, // ignored: leads carry no revenue here
    ];
    expect(extractMetaConversions(actions, actionValues)).toEqual({
      leads: 6,        // 3 + 2 + 1 across the three lead action types
      purchases: 5,    // 4 + 1 (purchase + omni_purchase)
      revenue: 500,    // 480.50 + 19.50 from action_values purchase types only
      landing_page_views: 7,
    });
  });

  it("returns zeroes for null / empty / unmatched payloads", () => {
    expect(extractMetaConversions(null, null)).toEqual({ leads: 0, purchases: 0, revenue: 0, landing_page_views: 0 });
    expect(extractMetaConversions([], [])).toEqual({ leads: 0, purchases: 0, revenue: 0, landing_page_views: 0 });
    expect(extractMetaConversions([{ action_type: "video_view", value: "10" }], []))
      .toEqual({ leads: 0, purchases: 0, revenue: 0, landing_page_views: 0 });
    // non-numeric values coerce to 0 rather than NaN
    expect(extractMetaConversions([{ action_type: "lead", value: "n/a" }], []))
      .toEqual({ leads: 0, purchases: 0, revenue: 0, landing_page_views: 0 });
  });
});

describe("metaPull — CTR normalisation", () => {
  it("divides the percent CTR returned by Meta by 100 into a fraction", async () => {
    const fetchLocal = vi.fn().mockReturnValue(
      okJson({ data: [metaRow({ ctr: "2.5" })] }),
    );
    vi.stubGlobal("fetch", fetchLocal);
    const { metaPull } = await import("@/lib/sync/pull");
    const rows = await metaPull("TOK", "555", "org-1");
    expect(rows[0].ctr).toBeCloseTo(0.025, 6); // 2.5% → 0.025
  });
});
