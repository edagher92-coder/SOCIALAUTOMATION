import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Inline mocks for the route's dependencies -----------------------------
// We stub the auth client, the admin client and org resolution so we exercise the
// REAL PATCH handler logic (validation, org scoping, status update, 404 mapping)
// without a live Supabase.

let mockUser: any = { id: "user-1", email: "owner@example.com" };
let mockOrgId = "org-1";

// Captures the .update() / .eq() chain so assertions can inspect what the handler
// asked Supabase to do, and lets each test control the resolved row/error.
function makeAdmin(result: { data: any; error: any }) {
  const calls: any = { table: null, update: null, eqs: [] as any[], select: null };
  const builder: any = {
    update(patch: any) { calls.update = patch; return builder; },
    eq(col: string, val: any) { calls.eqs.push([col, val]); return builder; },
    select(cols: string) { calls.select = cols; return builder; },
    maybeSingle() { return Promise.resolve(result); },
  };
  const admin = {
    from(table: string) { calls.table = table; return builder; },
  };
  return { admin, calls };
}

let adminHandle: ReturnType<typeof makeAdmin>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminHandle.admin,
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => mockOrgId,
}));

import { PATCH } from "./route";

function req(body: any) {
  return new Request("http://test/api/recommendations/rec-1", {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("PATCH /api/recommendations/[id]", () => {
  beforeEach(() => {
    mockUser = { id: "user-1", email: "owner@example.com" };
    mockOrgId = "org-1";
    adminHandle = makeAdmin({ data: { id: "rec-1", status: "approved" }, error: null });
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockUser = null;
    const res = await PATCH(req({ status: "approved" }), { params: Promise.resolve({ id: "rec-1" }) });
    expect(res.status).toBe(401);
  });

  it("rejects a missing id with 400", async () => {
    const res = await PATCH(req({ status: "approved" }), { params: Promise.resolve({ id: "  " }) });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status with 400", async () => {
    const res = await PATCH(req({ status: "banana" }), { params: Promise.resolve({ id: "rec-1" }) });
    expect(res.status).toBe(400);
    expect(adminHandle.calls.update).toBeNull(); // never reached the DB
  });

  it("rejects a non-JSON body with 400", async () => {
    const res = await PATCH(req(undefined), { params: Promise.resolve({ id: "rec-1" }) });
    expect(res.status).toBe(400);
  });

  it("updates the status and scopes the query to id + active org", async () => {
    const res = await PATCH(req({ status: "approved" }), { params: Promise.resolve({ id: "rec-1" }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, id: "rec-1", status: "approved" });
    expect(adminHandle.calls.table).toBe("recommendations");
    expect(adminHandle.calls.update).toEqual({ status: "approved" });
    // Both the row id and the org are part of the WHERE clause (org scoping).
    expect(adminHandle.calls.eqs).toContainEqual(["id", "rec-1"]);
    expect(adminHandle.calls.eqs).toContainEqual(["organisation_id", "org-1"]);
  });

  it("returns 404 when no row matches the id within the active org", async () => {
    adminHandle = makeAdmin({ data: null, error: null });
    const res = await PATCH(req({ status: "dismissed" }), { params: Promise.resolve({ id: "rec-x" }) });
    expect(res.status).toBe(404);
  });

  it("maps a DB error to 502", async () => {
    adminHandle = makeAdmin({ data: null, error: { message: "boom" } });
    const res = await PATCH(req({ status: "done" }), { params: Promise.resolve({ id: "rec-1" }) });
    expect(res.status).toBe(502);
  });

  it("accepts every valid lifecycle status (open/approved/dismissed/done)", async () => {
    for (const status of ["open", "approved", "dismissed", "done"]) {
      adminHandle = makeAdmin({ data: { id: "rec-1", status }, error: null });
      const res = await PATCH(req({ status }), { params: Promise.resolve({ id: "rec-1" }) });
      expect(res.status).toBe(200);
      expect((await res.json()).status).toBe(status);
    }
  });

  it("is idempotent: re-PATCHing the same status still resolves 200 with that status", async () => {
    adminHandle = makeAdmin({ data: { id: "rec-1", status: "approved" }, error: null });
    const first = await PATCH(req({ status: "approved" }), { params: Promise.resolve({ id: "rec-1" }) });
    const second = await PATCH(req({ status: "approved" }), { params: Promise.resolve({ id: "rec-1" }) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await second.json()).status).toBe("approved");
  });
});
