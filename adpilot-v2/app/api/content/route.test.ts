import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// content POST: create validation (https media_url, max caption length, enum
// platform), auth (401), and the content_publish entitlement gate (402).
//
// Supabase server/admin and org helpers are mocked; @/lib/entitlements (pure)
// runs for real so the actual feature gate is exercised.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "starter";
const inserted: Array<{ table: string; row: any }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const api: any = {
        insert(row: any) { inserted.push({ table, row }); return api; },
        select() { return api; },
        single: async () => ({ data: { id: "post-1" }, error: null }),
      };
      return api;
    },
  }),
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));

import { POST } from "./route";

function post(body: any) {
  return new Request("https://x/api/content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "starter";
  inserted.length = 0;
});

describe("auth", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ platform: "instagram", caption: "hi" }));
    expect(r.status).toBe(401);
  });
});

describe("input validation", () => {
  it("400 on an invalid platform", async () => {
    const r = await POST(post({ platform: "snapchat", caption: "hi" }));
    expect(r.status).toBe(400);
    expect(inserted).toHaveLength(0);
  });

  it("400 when media_url is not https", async () => {
    const r = await POST(post({ platform: "instagram", media_url: "http://cdn/x.jpg", media_type: "image" }));
    expect(r.status).toBe(400);
    const j = await r.json();
    expect(JSON.stringify(j)).toMatch(/https/i);
    expect(inserted).toHaveLength(0);
  });

  it("400 when media_url is not a URL at all", async () => {
    const r = await POST(post({ platform: "instagram", media_url: "not-a-url" }));
    expect(r.status).toBe(400);
  });

  it("400 when caption exceeds the max length (2200)", async () => {
    const r = await POST(post({ platform: "facebook", caption: "x".repeat(2201) }));
    expect(r.status).toBe(400);
    expect(inserted).toHaveLength(0);
  });

  it("accepts a caption at exactly the max length", async () => {
    const r = await POST(post({ platform: "facebook", caption: "x".repeat(2200) }));
    expect(r.status).toBe(200);
  });
});

describe("entitlement gate", () => {
  it("402 when the org plan lacks content_publish (free)", async () => {
    CURRENT_PLAN = "free";
    const r = await POST(post({ platform: "instagram", media_url: "https://cdn/x.jpg", media_type: "image" }));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(inserted).toHaveLength(0); // nothing stored when gated
  });

  it("creates a draft for a plan with content_publish (starter+)", async () => {
    const r = await POST(post({ platform: "instagram", caption: "hi", media_url: "https://cdn/x.jpg", media_type: "image" }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.id).toBe("post-1");
    const ins = inserted.find((x) => x.table === "content_posts");
    expect(ins?.row).toMatchObject({ organisation_id: "org-1", created_by: "u1", status: "draft", platform: "instagram" });
  });
});
