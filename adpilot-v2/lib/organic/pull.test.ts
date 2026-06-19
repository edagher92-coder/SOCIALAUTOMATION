import { describe, it, expect, vi, afterEach } from "vitest";
import {
  mapMetaPagePosts, mapInstagramMedia, fetchMetaPageOrganic, fetchInstagramOrganic, syncMetaOrganic,
} from "@/lib/organic/pull";

// Meta returns insights nested as { data: [{ name, values: [{ value }] }] }.
const ins = (entries: Record<string, number>) => ({
  data: Object.entries(entries).map(([name, value]) => ({ name, values: [{ value }] })),
});

afterEach(() => vi.unstubAllGlobals());

describe("mapMetaPagePosts", () => {
  it("maps Page post insights to OrganicPostInput (reach/impr/engaged)", () => {
    const rows = mapMetaPagePosts([
      {
        id: "p1", message: "Launch reel  🎬", created_time: "2026-06-10T10:00:00+0000",
        insights: ins({ post_impressions_unique: 4200, post_impressions: 9000, post_engaged_users: 180 }),
      },
    ]);
    expect(rows).toEqual([
      { id: "p1", platform: "meta", name: "Launch reel 🎬", date: "2026-06-10", reach: 4200, impressions: 9000, engagements: 180 },
    ]);
  });

  it("drops posts with no signal (all-zero / missing insights)", () => {
    const rows = mapMetaPagePosts([
      { id: "z", message: "dud", created_time: "2026-06-01T00:00:00+0000", insights: ins({ post_impressions_unique: 0, post_impressions: 0, post_engaged_users: 0 }) },
      { id: "n", message: "no insights", created_time: "2026-06-01T00:00:00+0000" },
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe("mapInstagramMedia", () => {
  it("maps IG media insights to OrganicPostInput under the meta platform", () => {
    const rows = mapInstagramMedia([
      { id: "m1", caption: "Sale post", timestamp: "2026-06-12T08:00:00+0000", media_type: "IMAGE", insights: ins({ reach: 3000, impressions: 5000, engagement: 120 }) },
    ]);
    expect(rows[0]).toMatchObject({ id: "m1", platform: "meta", name: "Sale post", date: "2026-06-12", reach: 3000, impressions: 5000, engagements: 120 });
  });
});

describe("fetch wrappers", () => {
  it("fetchMetaPageOrganic hits the Page /posts edge and maps the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ data: [{ id: "p1", message: "Hi", created_time: "2026-06-10T10:00:00+0000", insights: ins({ post_impressions_unique: 100, post_impressions: 200, post_engaged_users: 10 }) }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const rows = await fetchMetaPageOrganic("TOK", "1234567890", 30);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "p1", reach: 100, impressions: 200, engagements: 10 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/1234567890/posts");
    expect(url).toContain("post_impressions_unique");
  });

  it("throws a clear error on a non-ok Meta response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "(#10) permission missing" } }) }));
    await expect(fetchInstagramOrganic("TOK", "ig1")).rejects.toThrow(/permission missing/i);
  });
});

describe("syncMetaOrganic", () => {
  it("is INERT (no network, returns 0) when no token/ids are configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const n = await syncMetaOrganic({} as any, "org-1", {}); // no config
    expect(n).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
