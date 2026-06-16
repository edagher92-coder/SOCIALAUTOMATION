import { describe, it, expect, beforeEach, vi } from "vitest";

// White-label POST must enforce the Expert-tier gate before the admin (RLS-bypassing) upsert.
let USER: any = { id: "u1", email: "a@b.com" };
let PLAN = "expert";
const upserts: any[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ upsert: (v: any) => { upserts.push(v); return Promise.resolve({ error: null }); } }) }),
}));
vi.mock("@/lib/org", () => ({ getActiveOrgId: async () => "org-1", planForOrg: async () => PLAN }));

import { POST } from "./route";

const req = (body: any = { brand_name: "X" }) =>
  new Request("https://x/api/white-label", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => { USER = { id: "u1", email: "a@b.com" }; PLAN = "expert"; upserts.length = 0; });

describe("white-label POST entitlement gate", () => {
  it("401 when unauthenticated (no write)", async () => {
    USER = null;
    const r = await POST(req());
    expect(r.status).toBe(401);
    expect(upserts.length).toBe(0);
  });

  it("402 for a non-expert plan (no branding write)", async () => {
    PLAN = "pro";
    const r = await POST(req());
    expect(r.status).toBe(402);
    expect((await r.json()).upgrade).toBe(true);
    expect(upserts.length).toBe(0);
  });

  it("writes branding for an expert plan", async () => {
    PLAN = "expert";
    const r = await POST(req({ brand_name: "Acme" }));
    expect(r.status).toBe(200);
    expect(upserts.length).toBe(1);
    expect(upserts[0].brand_name).toBe("Acme");
  });
});
