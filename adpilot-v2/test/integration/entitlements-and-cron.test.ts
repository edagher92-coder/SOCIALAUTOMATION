import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeMockSupabase, type MockSupabase } from "../helpers/mockSupabase";
import { makeAuthState, jsonRequest, type AuthState } from "../helpers/mockAuth";

// ---------------------------------------------------------------------------
// Integration tests built on the reusable test/helpers harness:
//
//   1. Entitlement 402 gating on a representative gated route (POST /api/content,
//      which gates on the `content_publish` feature). The REAL entitlements module
//      (can/planForOrg-shape) is exercised; only the data layer + auth are mocked.
//
//   2. Cron fail-closed posture on a representative cron route (GET /api/cron/publish):
//        - no CRON_SECRET configured            → 503 (fail closed)
//        - wrong key / no key supplied          → 401
//        - correct key                          → 200
//
// makeMockSupabase provides a chainable, awaitable mock client and records writes;
// makeAuthState provides a controllable authenticated user + plan.
// ---------------------------------------------------------------------------

// ===== Shared mock wiring (hoisted so vi.mock factories can see them) =====
const { auth, db, cronDb } = vi.hoisted(() => {
  // late-bound holders; the real objects are assigned in the test modules below
  return { auth: { current: null as AuthState | null }, db: { current: null as MockSupabase | null }, cronDb: { current: null as MockSupabase | null } };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => auth.current!.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  // The content route uses admin for the write; cron uses admin for everything.
  createAdminClient: () => (cronDb.current ?? db.current)!.client,
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => auth.current!.orgId,
  planForOrg: async () => auth.current!.plan,
}));
// The publish cron calls into the publish providers — keep it deterministic.
const publishPost = vi.fn();
vi.mock("@/lib/publish/providers", () => ({
  publishPost: (...a: any[]) => publishPost(...a),
}));

// Routes under test (imported after mocks are registered).
import { POST as contentPOST } from "@/app/api/content/route";
import { GET as publishCronGET } from "@/app/api/cron/publish/route";

const CRON_SECRET = "test-cron-secret";

function cronReq(opts: { auth?: string; key?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.auth) headers.authorization = opts.auth;
  if (opts.key) headers.authorization = `Bearer ${opts.key}`;
  return new Request("https://x/api/cron/publish", { headers });
}

beforeEach(() => {
  auth.current = makeAuthState({ user: { id: "u1", email: "user@example.com" }, orgId: "org-1", plan: "free" });
  db.current = makeMockSupabase();
  cronDb.current = null;
  publishPost.mockReset().mockResolvedValue({ externalId: "ext-1" });
  delete process.env.CRON_SECRET;
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

// ===========================================================================
describe("entitlement 402 gating — POST /api/content (content_publish)", () => {
  const validBody = { platform: "instagram", caption: "hello", source: "upload" };

  it("401 when unauthenticated (before any gate check)", async () => {
    auth.current!.setUser(null);
    const r = await contentPOST(jsonRequest("https://x/api/content", validBody));
    expect(r.status).toBe(401);
    expect(db.current!.writes).toHaveLength(0);
  });

  it("402 with upgrade flag when the plan lacks content_publish (free)", async () => {
    auth.current!.setPlan("free");
    const r = await contentPOST(jsonRequest("https://x/api/content", validBody));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(j.error).toMatch(/upgrade/i);
    // Gate must block BEFORE persisting anything.
    expect(db.current!.writes).toHaveLength(0);
  });

  it("allows starter and above through the gate, persisting a draft", async () => {
    for (const plan of ["starter", "pro", "expert"] as const) {
      db.current = makeMockSupabase();
      auth.current!.setPlan(plan);
      const r = await contentPOST(jsonRequest("https://x/api/content", validBody));
      expect(r.status, `plan=${plan}`).toBe(200);
      const j = await r.json();
      expect(j.ok).toBe(true);
      expect(j.id).toBeTruthy(); // mock synthesised an id for the insert().select().single()
      // exactly one insert into content_posts, scoped to the active org, status draft
      const inserts = db.current!.writes.filter((w) => w.table === "content_posts" && w.op === "insert");
      expect(inserts).toHaveLength(1);
      expect(inserts[0].values).toMatchObject({ organisation_id: "org-1", created_by: "u1", status: "draft", platform: "instagram" });
    }
  });

  it("400 on invalid input (bad platform) without touching the gate or DB", async () => {
    auth.current!.setPlan("pro");
    const r = await contentPOST(jsonRequest("https://x/api/content", { platform: "myspace" }));
    expect(r.status).toBe(400);
    expect(db.current!.writes).toHaveLength(0);
  });
});

// ===========================================================================
describe("cron fail-closed — GET /api/cron/publish", () => {
  it("503 when CRON_SECRET is not configured (fail closed)", async () => {
    // no process.env.CRON_SECRET set
    const r = await publishCronGET(cronReq({ key: "anything" }));
    expect(r.status).toBe(503);
    const j = await r.json();
    expect(j.error).toMatch(/cron not configured/i);
  });

  it("401 when the key is wrong", async () => {
    process.env.CRON_SECRET = CRON_SECRET;
    const r = await publishCronGET(cronReq({ key: "wrong-key" }));
    expect(r.status).toBe(401);
  });

  it("401 when no credential is supplied at all", async () => {
    process.env.CRON_SECRET = CRON_SECRET;
    const r = await publishCronGET(cronReq());
    expect(r.status).toBe(401);
  });

  it("200 with the correct key, and a gated org's post is skipped (free plan)", async () => {
    process.env.CRON_SECRET = CRON_SECRET;
    // due post belongs to a free-plan org → content_publish denied → skipped, not published
    cronDb.current = makeMockSupabase({
      content_posts: [{ id: "p1", organisation_id: "org-free", platform: "instagram", status: "scheduled", scheduled_at: "2020-01-01T00:00:00Z" }],
      billing_subscriptions: [{ organisation_id: "org-free", plan: "free", status: "active" }],
    });
    const r = await publishCronGET(cronReq({ key: CRON_SECRET }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.skipped).toBe(1);
    expect(j.published).toBe(0);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("200 and publishes a due post for an entitled org (starter+)", async () => {
    process.env.CRON_SECRET = CRON_SECRET;
    cronDb.current = makeMockSupabase({
      content_posts: [{ id: "p1", organisation_id: "org-paid", platform: "instagram", status: "scheduled", scheduled_at: "2020-01-01T00:00:00Z" }],
      billing_subscriptions: [{ organisation_id: "org-paid", plan: "starter", status: "active" }],
    });
    const r = await publishCronGET(cronReq({ auth: `Bearer ${CRON_SECRET}` }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.published).toBe(1);
    expect(j.skipped).toBe(0);
    expect(publishPost).toHaveBeenCalledTimes(1);
    // the post row was marked published
    const upd = cronDb.current!.writes.filter((w) => w.table === "content_posts" && w.op === "update");
    expect(upd.some((w) => w.values?.status === "published")).toBe(true);
  });
});
