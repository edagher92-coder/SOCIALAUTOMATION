import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// content [id] PATCH: the publishNow status guard (only approved/scheduled/failed
// may be sent — a raw draft is rejected), provider dispatch + NotConfigured (503)
// vs API-error (502), and the "scheduled_at must be in the future" guard.
//
// @/lib/publish/providers is mocked so we drive publish success/failure/not-configured.
// Supabase + org helpers mocked; @/lib/entitlements (pure) runs for real.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "starter";
let POST_ROW: any = { platform: "facebook", caption: "c", media_url: null, media_type: null, status: "approved" };
const updates: Array<{ values: any }> = [];

const publishPost = vi.fn();
class NotConfiguredError extends Error { constructor(p: string) { super(`${p} not configured`); this.name = "NotConfiguredError"; } }

vi.mock("@/lib/publish/providers", () => ({
  publishPost: (...a: any[]) => publishPost(...a),
  isNotConfigured: (e: any) => e?.name === "NotConfiguredError",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(_table: string) {
      const api: any = {
        select() { return api; },
        eq() { return api; },
        neq() { return api; },
        maybeSingle: async () => ({ data: api.__mode === "update" ? { id: "post-1", status: api.__patch?.status } : POST_ROW, error: null }),
        update(values: any) { api.__mode = "update"; api.__patch = values; updates.push({ values }); return api; },
      };
      return api;
    },
  }),
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));

import { DELETE, PATCH } from "./route";

function patch(body: any) {
  const req = new Request("https://x/api/content/post-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return PATCH(req, { params: Promise.resolve({ id: "post-1" }) });
}

function archive() {
  const req = new Request("https://x/api/content/post-1", { method: "DELETE" });
  return DELETE(req, { params: Promise.resolve({ id: "post-1" }) });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "starter";
  POST_ROW = { platform: "facebook", caption: "c", media_url: null, media_type: null, status: "approved" };
  publishPost.mockReset();
  updates.length = 0;
});

describe("auth + entitlement", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(401);
  });
  it("402 when plan lacks content_publish (free)", async () => {
    CURRENT_PLAN = "free";
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(402);
    expect(publishPost).not.toHaveBeenCalled();
  });
});

describe("publishNow status guard", () => {
  it("rejects a raw DRAFT (400) and never calls the provider", async () => {
    POST_ROW = { ...POST_ROW, status: "draft" };
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/approve/i);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("rejects an already-published post (400)", async () => {
    POST_ROW = { ...POST_ROW, status: "published" };
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(400);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("404 when the post does not exist", async () => {
    POST_ROW = null;
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(404);
  });

  it("publishes an APPROVED post and marks it published", async () => {
    publishPost.mockResolvedValue({ externalId: "ext-1" });
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.status).toBe("published");
    expect(j.externalId).toBe("ext-1");
    expect(publishPost).toHaveBeenCalledTimes(1);
    expect(updates.at(-1)?.values).toMatchObject({ status: "published", error: null });
  });

  it("allows retrying a FAILED post", async () => {
    POST_ROW = { ...POST_ROW, status: "failed" };
    publishPost.mockResolvedValue({ externalId: "ext-2" });
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(200);
    expect(publishPost).toHaveBeenCalled();
  });
});

describe("provider error mapping on publishNow", () => {
  it("503 + notConfigured flag when the provider isn't configured; marks post failed", async () => {
    publishPost.mockRejectedValue(new NotConfiguredError("Facebook"));
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(503);
    const j = await r.json();
    expect(j.notConfigured).toBe(true);
    expect(updates.at(-1)?.values).toMatchObject({ status: "failed" });
  });

  it("502 on a generic API error; marks post failed with the message", async () => {
    publishPost.mockRejectedValue(new Error("Invalid page token"));
    const r = await patch({ publishNow: true });
    expect(r.status).toBe(502);
    const j = await r.json();
    expect(j.notConfigured).toBe(false);
    expect(j.error).toMatch(/Invalid page token/);
    expect(updates.at(-1)?.values).toMatchObject({ status: "failed", error: "Invalid page token" });
  });
});

describe("scheduled_at future guard", () => {
  it("400 when scheduling without a time", async () => {
    const r = await patch({ status: "scheduled" });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/scheduled_at/i);
  });

  it("400 when scheduled_at is in the PAST", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const r = await patch({ status: "scheduled", scheduled_at: past });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/future/i);
    expect(updates).toHaveLength(0); // never written
  });

  it("accepts a future scheduled_at", async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const r = await patch({ status: "scheduled", scheduled_at: future });
    expect(r.status).toBe(200);
    expect(updates.at(-1)?.values).toMatchObject({ status: "scheduled", scheduled_at: future });
  });
});

describe("archive", () => {
  it("preserves an unpublished item as archived instead of deleting it", async () => {
    const r = await archive();
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, archived: true });
    expect(updates.at(-1)?.values).toMatchObject({ status: "archived", scheduled_at: null });
    expect(updates.at(-1)?.values.archived_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
