import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// connect/meta-pages route: auth (401), entitlement gate (api_connect → 402 on
// free/starter), input validation, the Graph /me/accounts discovery call, and
// the no-Pages and token-error cases. Supabase + org helpers are mocked; the
// real entitlements gate is exercised.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "pro";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));

import { POST } from "./route";

const fetchMock = vi.fn();

function post(body: any) {
  return new Request("https://x/api/connect/meta-pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ACCOUNTS_OK = {
  ok: true, status: 200,
  json: async () => ({ data: [{ id: "100", name: "Acme AU", instagram_business_account: { id: "999", username: "acme" } }] }),
};

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "pro";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("auth", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("entitlement gate", () => {
  it("402 when the org plan lacks api_connect (free/starter)", async () => {
    CURRENT_PLAN = "starter";
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows pro and expert through the gate", async () => {
    fetchMock.mockResolvedValue(ACCOUNTS_OK);
    for (const plan of ["pro", "expert"]) {
      CURRENT_PLAN = plan;
      const r = await POST(post({ token: "tok-1234567890" }));
      expect(r.status).toBe(200);
    }
  });
});

describe("input validation", () => {
  it("400 when the token is too short", async () => {
    const r = await POST(post({ token: "short" }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/token/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("discovery", () => {
  it("returns Pages with id + igUserId and never the page token", async () => {
    fetchMock.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ data: [{ id: "100", name: "Acme AU", access_token: "PAGE-SECRET", instagram_business_account: { id: "999", username: "acme" } }] }),
    });
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.pages).toEqual([{ id: "100", name: "Acme AU", igUserId: "999", igUsername: "acme" }]);
    expect(JSON.stringify(body)).not.toContain("PAGE-SECRET");
  });

  it("502 with guidance when the token manages no Pages", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) });
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(502);
    const j = await r.json();
    expect(j.error).toMatch(/doesn't manage any Facebook Pages/i);
    expect(j.tokenHelp).toBe(true);
  });

  it("502 with a precise expired message + tokenHelp when Meta rejects the token", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { code: 190, error_subcode: 463, message: "Session expired" } }) });
    const r = await POST(post({ token: "tok-1234567890" }));
    expect(r.status).toBe(502);
    const j = await r.json();
    expect(j.error).toMatch(/expired/i);
    expect(j.tokenHelp).toBe(true);
  });
});
