import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// connect-token route: entitlement 402 (api_connect is Pro+), auth, input
// validation, Meta token validation, and the automation-first immediate pull.
//
// Supabase server/admin, org helpers, crypto.encrypt and the puller are mocked;
// @/lib/entitlements (pure) is used for real so the real gate is exercised.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "pro";
const syncOrgPlatform = vi.fn();
const insertedRows: Array<{ table: string; rows: any }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      return { insert: (rows: any) => { insertedRows.push({ table, rows }); return Promise.resolve({ error: null }); } };
    },
  }),
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));
vi.mock("@/lib/crypto", () => ({
  encrypt: (_t: string) => ({ ciphertext: "ct", iv: "iv", authTag: "tag" }),
}));
vi.mock("@/lib/sync/pull", () => ({
  syncOrgPlatform: (...a: any[]) => syncOrgPlatform(...a),
}));

import { POST } from "./route";

const fetchMock = vi.fn();

function post(body: any) {
  return new Request("https://x/api/connect/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "pro";
  syncOrgPlatform.mockReset().mockResolvedValue(7);
  insertedRows.length = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("auth", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
    expect(r.status).toBe(401);
  });
});

describe("entitlement gate", () => {
  it("402 when the org plan lacks api_connect (free/starter)", async () => {
    CURRENT_PLAN = "starter";
    const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(j.error).toMatch(/Pro & Expert/i);
    // nothing stored, no API call attempted
    expect(insertedRows).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows pro and expert plans through the gate", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ account_id: "123", name: "Acct" }] }) });
    for (const plan of ["pro", "expert"]) {
      CURRENT_PLAN = plan;
      insertedRows.length = 0;
      const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
      expect(r.status).toBe(200);
    }
  });
});

describe("input validation", () => {
  it("400 with a token-specific message when the token is too short", async () => {
    const r = await POST(post({ platform: "meta", token: "short" }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/token/i);
  });

  it("400 when platform is missing/invalid", async () => {
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/platform/i);
  });

  it("400 on an unparseable body", async () => {
    const req = new Request("https://x/api/connect/token", { method: "POST", body: "not json" });
    const r = await POST(req);
    expect(r.status).toBe(400);
  });
});

describe("meta connect flow", () => {
  it("validates the token, stores it, and triggers an immediate pull", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ account_id: "123", name: "My Acct" }] }) });
    const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.connected).toBe("meta");
    expect(j.accounts).toBe(1);
    expect(j.inserted).toBe(7); // from the mocked puller
    expect(j.syncError).toBeUndefined();

    // token + account rows were stored
    expect(insertedRows.find((x) => x.table === "platform_tokens")).toBeTruthy();
    const acctIns = insertedRows.find((x) => x.table === "connected_ad_accounts");
    expect(acctIns?.rows[0]).toMatchObject({ organisation_id: "org-1", platform: "meta", external_account_id: "123", status: "connected" });
    expect(syncOrgPlatform).toHaveBeenCalledWith(expect.anything(), "org-1", "meta");
  });

  it("502 with the platform's message when Meta rejects the token", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "Invalid OAuth access token" } }) });
    const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
    expect(r.status).toBe(502);
    expect((await r.json()).error).toMatch(/Invalid OAuth access token/i);
    expect(insertedRows).toHaveLength(0); // nothing stored when validation fails
  });

  it("reports syncError but still 200 when the immediate pull fails", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ account_id: "123", name: "A" }] }) });
    syncOrgPlatform.mockRejectedValue(new Error("rate limited"));
    const r = await POST(post({ platform: "meta", token: "tok-1234567890" }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.syncError).toMatch(/rate limited/i);
    // account is still connected even though the first pull failed
    expect(insertedRows.find((x) => x.table === "connected_ad_accounts")).toBeTruthy();
  });
});

describe("tiktok connect flow", () => {
  it("502 when no advertiser_id is supplied (TikTok requires it)", async () => {
    const r = await POST(post({ platform: "tiktok", token: "tok-1234567890" }));
    expect(r.status).toBe(502);
    expect((await r.json()).error).toMatch(/advertiser_id/i);
    expect(fetchMock).not.toHaveBeenCalled(); // no token introspection for TikTok
  });

  it("connects with an advertiser_id without calling a discovery endpoint", async () => {
    const r = await POST(post({ platform: "tiktok", token: "tok-1234567890", accountId: "adv-99" }));
    expect(r.status).toBe(200);
    const acctIns = insertedRows.find((x) => x.table === "connected_ad_accounts");
    expect(acctIns?.rows[0]).toMatchObject({ platform: "tiktok", external_account_id: "adv-99" });
    expect(syncOrgPlatform).toHaveBeenCalledWith(expect.anything(), "org-1", "tiktok");
  });
});
