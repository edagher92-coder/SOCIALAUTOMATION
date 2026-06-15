import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// cron/publish route: auth/config guards, the content_publish plan gate, the
// status='scheduled' + due-time selection, and PER-POST ISOLATION (one failing
// post must not stop the batch — others still publish).
//
// @/lib/publish/providers is mocked to drive success/failure per post. The inline
// mock Supabase records updates and replays a configurable due-list + subs. The
// real (pure) @/lib/entitlements gate runs.
// ---------------------------------------------------------------------------

const publishPost = vi.fn();
vi.mock("@/lib/publish/providers", () => ({ publishPost: (...a: any[]) => publishPost(...a) }));

// Inline mock Supabase. `select(...).eq(...).lte(...).limit(...)` resolves the due
// posts; `select(...)` on billing_subscriptions resolves subs. update() records calls.
let DUE: any[] = [];
let SUBS: any[] = [];
const updates: Array<{ id: any; values: any }> = [];
// Records the eq() filters applied to the content_posts select so we can assert
// the route only selects status='scheduled'.
let lastSelectFilters: Record<string, any> = {};

function makeAdmin() {
  return {
    from(table: string) {
      const filters: Record<string, any> = {};
      const api: any = {
        select() { return api; },
        eq(col: string, val: any) {
          filters[col] = val;
          if (table === "content_posts") lastSelectFilters = filters;
          return api;
        },
        lte(_c: string, _v: any) { return api; },
        limit() { return Promise.resolve({ data: table === "content_posts" ? DUE : SUBS, error: null }); },
        update(values: any) {
          return { eq: (_c: string, id: any) => { updates.push({ id, values }); return Promise.resolve({ error: null }); } };
        },
        then(resolve: any, reject: any) {
          return Promise.resolve({ data: table === "content_posts" ? DUE : SUBS, error: null }).then(resolve, reject);
        },
      };
      return api;
    },
  };
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeAdmin() }));

import { GET } from "./route";

const SECRET = "cron-secret-xyz";
function req(key = SECRET) {
  return new Request(`https://x/api/cron/publish?key=${key}`);
}
const proSub = (org: string) => ({ organisation_id: org, plan: "pro", status: "active" });

beforeEach(() => {
  publishPost.mockReset();
  DUE = [];
  SUBS = [];
  updates.length = 0;
  lastSelectFilters = {};
  process.env.CRON_SECRET = SECRET;
});
afterEach(() => { delete process.env.CRON_SECRET; });

describe("auth + config guards", () => {
  it("503 when CRON_SECRET is unset (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req("anything"))).status).toBe(503);
  });
  it("401 on a wrong secret", async () => {
    expect((await GET(req("nope"))).status).toBe(401);
  });
  it("accepts the bearer header", async () => {
    const r = await GET(new Request("https://x/api/cron/publish", { headers: { authorization: `Bearer ${SECRET}` } }));
    expect(r.status).toBe(200);
  });
});

describe("selection", () => {
  it("queries only status='scheduled' posts", async () => {
    DUE = [];
    await GET(req());
    expect(lastSelectFilters.status).toBe("scheduled");
  });

  it("returns 0/0 when nothing is due", async () => {
    DUE = [];
    const j = await (await GET(req())).json();
    expect(j).toMatchObject({ published: 0, failed: 0 });
    expect(publishPost).not.toHaveBeenCalled();
  });
});

describe("plan gate", () => {
  it("skips a post whose org lacks content_publish (free / no active sub)", async () => {
    DUE = [{ id: "p1", organisation_id: "orgFree", platform: "facebook", caption: "c" }];
    SUBS = []; // no active sub → free
    const j = await (await GET(req())).json();
    expect(j.skipped).toBe(1);
    expect(j.published).toBe(0);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("publishes a post whose org has an active qualifying plan", async () => {
    DUE = [{ id: "p1", organisation_id: "orgPro", platform: "facebook", caption: "c" }];
    SUBS = [proSub("orgPro")];
    publishPost.mockResolvedValue({ externalId: "ext-1" });
    const j = await (await GET(req())).json();
    expect(j.published).toBe(1);
    expect(updates.find((u) => u.id === "p1")?.values).toMatchObject({ status: "published" });
  });
});

describe("per-post isolation", () => {
  it("one failing post does NOT stop the batch — others still publish", async () => {
    DUE = [
      { id: "p1", organisation_id: "orgPro", platform: "facebook", caption: "a" },
      { id: "p2", organisation_id: "orgPro", platform: "instagram", media_url: "https://cdn/x.jpg", media_type: "image", caption: "b" },
      { id: "p3", organisation_id: "orgPro", platform: "tiktok", media_url: "https://cdn/v.mp4", media_type: "video", caption: "c" },
    ];
    SUBS = [proSub("orgPro")];
    publishPost.mockImplementation(async (p: any) => {
      if (p.id === "p2") throw new Error("instagram blew up");
      return { externalId: `ext-${p.id}` };
    });
    const j = await (await GET(req())).json();
    expect(j.published).toBe(2); // p1 + p3
    expect(j.failed).toBe(1); // p2
    expect(publishPost).toHaveBeenCalledTimes(3); // batch continued past the failure
    expect(updates.find((u) => u.id === "p2")?.values).toMatchObject({ status: "failed", error: "instagram blew up" });
    expect(updates.find((u) => u.id === "p1")?.values).toMatchObject({ status: "published" });
    expect(updates.find((u) => u.id === "p3")?.values).toMatchObject({ status: "published" });
  });
});
