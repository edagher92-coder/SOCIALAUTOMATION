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
import { syncOrgPlatform } from "@/lib/sync/pull";

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
    campaign_name: "Camp A", date_start: "2026-06-01", spend: "10.5", impressions: "1000",
    reach: "800", frequency: "1.25", clicks: "50", ctr: "5", cpc: "0.21", cpm: "10.5", ...over,
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
    // ctr is normalised from percent → fraction; spend coerced to number
    expect(ins[0].rows[0]).toMatchObject({ organisation_id: "org-1", platform: "meta", spend: 10.5, ctr: 0.05, source: "meta_api" });

    // the act_ prefix is added to the account id in the request URL
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("act_123/insights");
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
      data: { list: [{ metrics: { campaign_name: "TT Camp", spend: "5", impressions: "200", clicks: "10", ctr: "2", cpc: "0.5", cpm: "25", reach: "150", frequency: "1.3" }, dimensions: { campaign_id: "c1", stat_time_day: "2026-06-02 00:00:00" } }] },
    }));

    const n = await syncOrgPlatform(admin as any, "org-1", "tiktok");
    expect(n).toBe(1);
    const ins = (admin as any).__calls.inserts[0].rows;
    expect(ins[0]).toMatchObject({ organisation_id: "org-1", platform: "tiktok", campaign_name: "TT Camp", spend: 5, ctr: 0.02, source: "tiktok_api" });
    expect(ins[0].date).toBe("2026-06-02"); // stat_time_day truncated to date
    // delete window filter targets the tiktok_api source
    expect((admin as any).__calls.deletes[0].filters.source).toBe("tiktok_api");
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
