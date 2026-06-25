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
import {
  syncOrgPlatform, extractMetaConversions, extractMetaRoas, metaPull,
  isMetaRateLimited, metaBackoffMs, classifyIngestionError, RateLimitError,
} from "@/lib/sync/pull";

// Insert helpers: every sync now also writes a best-effort `ingestion_runs` audit row in a
// finally block, so assertions that care about the data write must scope to campaign_snapshots.
const snapshotInserts = (admin: any) => admin.__calls.inserts.filter((i: any) => i.table === "campaign_snapshots");
const ingestionRuns = (admin: any) => admin.__calls.inserts.filter((i: any) => i.table === "ingestion_runs");

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

    const ins = snapshotInserts(admin);
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

    // A successful pull records exactly one `ingestion_runs` audit row — status ok, the right row
    // count and Graph version — and NEVER a token (read-only audit trail).
    const runs = ingestionRuns(admin);
    expect(runs).toHaveLength(1);
    expect(runs[0].rows).toMatchObject({ organisation_id: "org-1", platform: "meta", status: "ok", rows_written: 2 });
    expect(runs[0].rows.graph_version).toMatch(/^v\d+\.\d+$/);
    expect(JSON.stringify(runs[0].rows)).not.toMatch(/access_token|ciphertext|META_TOKEN/);

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
    expect(snapshotInserts(admin)[0].rows).toHaveLength(3);
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
    // no snapshot writes attempted when the pull fails (delete/insert of campaign data)
    expect((admin as any).__calls.deletes).toHaveLength(0);
    expect(snapshotInserts(admin)).toHaveLength(0);
    // …but the failure is still recorded honestly as an audit row (auth_failed).
    const runs = ingestionRuns(admin);
    expect(runs).toHaveLength(1);
    expect(runs[0].rows).toMatchObject({ platform: "meta", status: "auth_failed", rows_written: 0 });
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
    const ins = snapshotInserts(admin)[0].rows;
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
    expect(snapshotInserts(admin)).toHaveLength(0);
    // TikTok failures are audited too, with no Graph version attached (Meta-only field).
    const runs = ingestionRuns(admin);
    expect(runs).toHaveLength(1);
    expect(runs[0].rows).toMatchObject({ platform: "tiktok", status: "auth_failed", graph_version: null });
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
    const rows = await metaPull("TOK", "555", "org-1");
    expect(rows[0].ctr).toBeCloseTo(0.025, 6); // 2.5% → 0.025
  });
});

// ---------------------------------------------------------------------------
// purchase_roas reconciliation (Meta's reported ROAS) — capture only, never scored.
// ---------------------------------------------------------------------------
describe("extractMetaRoas", () => {
  it("returns the purchase-type ROAS value", () => {
    expect(extractMetaRoas([{ action_type: "omni_purchase", value: "2.5" }])).toBeCloseTo(2.5, 6);
    expect(extractMetaRoas([{ action_type: "purchase", value: "4" }])).toBe(4);
  });
  it("falls back to the first entry when no purchase type matches", () => {
    expect(extractMetaRoas([{ action_type: "offsite_conversion", value: "1.8" }])).toBeCloseTo(1.8, 6);
  });
  it("returns null for empty / null / non-positive", () => {
    expect(extractMetaRoas(null)).toBeNull();
    expect(extractMetaRoas([])).toBeNull();
    expect(extractMetaRoas([{ action_type: "purchase", value: "0" }])).toBeNull();
  });
});

describe("metaPull — roas_meta capture", () => {
  it("captures Meta's purchase_roas as roas_meta on the row", async () => {
    const fetchLocal = vi.fn().mockReturnValue(okJson({ data: [metaRow({ purchase_roas: [{ action_type: "omni_purchase", value: "3.45" }] })] }));
    vi.stubGlobal("fetch", fetchLocal);
    const rows = await metaPull("TOK", "1", "org-1");
    expect(rows[0].roas_meta).toBeCloseTo(3.45, 6);
  });
  it("sets roas_meta null when purchase_roas is absent (e.g. lead-gen)", async () => {
    const fetchLocal = vi.fn().mockReturnValue(okJson({ data: [metaRow()] }));
    vi.stubGlobal("fetch", fetchLocal);
    const rows = await metaPull("TOK", "1", "org-1");
    expect(rows[0].roas_meta).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Gap A — rate-limit handling. Pure helpers + the bounded retry / fail-closed loop.
// ---------------------------------------------------------------------------
describe("isMetaRateLimited", () => {
  it("flags HTTP 429", () => {
    expect(isMetaRateLimited(429, {})).toBe(true);
  });
  it("flags documented throttling error codes (4/17/32/613/80000-series)", () => {
    for (const code of [4, 17, 32, 613, 80001]) expect(isMetaRateLimited(200, { error: { code } })).toBe(true);
  });
  it("flags an at-ceiling X-App-Usage header (flat object form)", () => {
    expect(isMetaRateLimited(200, {}, { "x-app-usage": JSON.stringify({ call_count: 99, total_cputime: 20, total_time: 15 }) })).toBe(true);
  });
  it("flags an X-Business-Use-Case-Usage header with a regain-time set ({id:[buckets]} form)", () => {
    const h = { "x-business-use-case-usage": JSON.stringify({ "123": [{ type: "ads_insights", call_count: 10, estimated_time_to_regain_access: 12 }] }) };
    expect(isMetaRateLimited(200, {}, h)).toBe(true);
  });
  it("does NOT flag a healthy response (200, low usage, no throttle code)", () => {
    expect(isMetaRateLimited(200, { data: [] }, { "x-app-usage": JSON.stringify({ call_count: 12 }) })).toBe(false);
  });
  it("does NOT flag a generic 400 error (not a throttle)", () => {
    expect(isMetaRateLimited(400, { error: { code: 190, message: "Invalid OAuth access token" } })).toBe(false);
  });
});

describe("metaBackoffMs", () => {
  it("is bounded and grows with attempt", () => {
    for (let a = 0; a < 6; a++) {
      const ms = metaBackoffMs(a);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(5000); // 4s cap + ≤25% jitter
    }
  });
});

describe("metaPull — rate-limit / partial", () => {
  it("backs off then FAILS CLOSED with RateLimitError when the throttle persists", async () => {
    const fetchLocal = vi.fn().mockReturnValue(Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({ error: { message: "rate limited" } }) }));
    vi.stubGlobal("fetch", fetchLocal);
    // Inject an instant sleep so the test doesn't actually wait out the backoff.
    await expect(metaPull("TOK", "999", "org-1", { sleep: () => Promise.resolve(), maxRetries: 2 }))
      .rejects.toBeInstanceOf(RateLimitError);
    // attempt 0,1 retried; attempt 2 throws → 3 fetches.
    expect(fetchLocal).toHaveBeenCalledTimes(3);
  });

  it("retries a transient 429 then succeeds when the next page is clean", async () => {
    const fetchLocal = vi.fn()
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) }))
      .mockReturnValueOnce(okJson({ data: [metaRow()] }));
    vi.stubGlobal("fetch", fetchLocal);
    const rows = await metaPull("TOK", "1", "org-1", { sleep: () => Promise.resolve() });
    expect(rows).toHaveLength(1);
    expect(fetchLocal).toHaveBeenCalledTimes(2);
  });

  it("signals partial when the page guard cuts pagination short (more pages remained)", async () => {
    // Every page reports a `next` cursor, so the pull can never naturally exhaust.
    const fetchLocal = vi.fn().mockReturnValue(okJson({ data: [metaRow()], paging: { next: "https://graph.facebook.com/next" } }));
    vi.stubGlobal("fetch", fetchLocal);
    const meta = { partial: false };
    const rows = await metaPull("TOK", "1", "org-1", { meta, maxPages: 2 });
    expect(meta.partial).toBe(true);
    expect(rows).toHaveLength(2); // capped at maxPages
  });

  it("does NOT signal partial when pagination exhausts naturally", async () => {
    const fetchLocal = vi.fn().mockReturnValue(okJson({ data: [metaRow()] })); // no paging.next
    vi.stubGlobal("fetch", fetchLocal);
    const meta = { partial: false };
    await metaPull("TOK", "1", "org-1", { meta, maxPages: 5 });
    expect(meta.partial).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Gap D — honest empty state + ingestion-run status classification.
// ---------------------------------------------------------------------------
describe("classifyIngestionError", () => {
  it("maps a RateLimitError to rate_limited", () => {
    expect(classifyIngestionError(new RateLimitError("123"), "whatever")).toBe("rate_limited");
  });
  it("maps token / scope / permission signals to auth_failed", () => {
    for (const m of ["Invalid OAuth access token", "missing the read-only ads_read scope", "HTTP 401", "code 190", "owner has not granted permission"]) {
      expect(classifyIngestionError(new Error(m), m)).toBe("auth_failed");
    }
  });
  it("maps anything else to a generic error", () => {
    expect(classifyIngestionError(new Error("Failed to write snapshots"), "Failed to write snapshots")).toBe("error");
  });
});

describe("syncOrgPlatform — honest empty state", () => {
  it("records status `empty` (not a failure, no snapshot insert) when a clean pull returns zero rows", async () => {
    const admin = makeAdmin({
      platform_tokens: { singleData: encToken("META_TOKEN") },
      connected_ad_accounts: { selectData: [{ external_account_id: "123" }] },
      campaign_snapshots: {},
    });
    fetchMock.mockReturnValueOnce(okJson({ data: [] })); // no delivery in the window

    const n = await syncOrgPlatform(admin as any, "org-1", "meta");
    expect(n).toBe(0);
    // No snapshot rows written, but the run is audited honestly as `empty`.
    expect(snapshotInserts(admin)).toHaveLength(0);
    const runs = ingestionRuns(admin);
    expect(runs).toHaveLength(1);
    expect(runs[0].rows).toMatchObject({ platform: "meta", status: "empty", rows_written: 0 });
  });
});
