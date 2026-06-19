import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// organic/posts route: POST ingest (explicit posts[] or pasted csv), the
// content_publish entitlement gate (402), auth (401), and GET list.
// Plus parseOrganicCsv exercised directly (pure, no mocks).
//
// Supabase server/admin and org helpers are mocked; @/lib/entitlements (pure)
// runs for real so the actual feature gate is exercised. lib/organic/store is
// real too (only its admin-client dependency is faked via the mock below).
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "starter";
let LIST_ROWS: any[] = [];
const inserted: Array<{ table: string; rows: any }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      // Chainable query builder. The list path ends on .order() (awaited);
      // the insert path resolves the chain itself. Both yield { data, error }.
      const result = { data: LIST_ROWS, error: null };
      const api: any = {
        insert(rows: any) { inserted.push({ table, rows }); return Promise.resolve({ data: null, error: null }); },
        select() { return api; },
        eq() { return api; },
        order() { return api; },
        then(resolve: any) { return Promise.resolve(result).then(resolve); },
      };
      return api;
    },
  }),
}));

vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));

import { GET, POST } from "./route";
import { parseOrganicCsv } from "@/lib/organic/store";

function post(body: any) {
  return new Request("https://x/api/organic/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "starter";
  LIST_ROWS = [];
  inserted.length = 0;
});

describe("auth", () => {
  it("401 when unauthenticated (POST)", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ posts: [{ platform: "meta", reach: 1, impressions: 1, engagements: 1 }] }));
    expect(r.status).toBe(401);
    expect(inserted).toHaveLength(0);
  });

  it("401 when unauthenticated (GET)", async () => {
    CURRENT_USER = null;
    const r = await GET();
    expect(r.status).toBe(401);
  });
});

describe("POST ingest", () => {
  it("inserts an explicit posts[] payload and returns the count", async () => {
    const r = await POST(post({
      posts: [
        { platform: "meta", name: "A", reach: 1000, impressions: 2000, engagements: 50 },
        { platform: "tiktok", name: "B", reach: 500, impressions: 900, engagements: 40 },
      ],
    }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.added).toBe(2);
    const ins = inserted.find((x) => x.table === "organic_posts");
    expect(ins?.rows).toHaveLength(2);
    expect(ins?.rows[0]).toMatchObject({ organisation_id: "org-1", platform: "meta", name: "A", reach: 1000, source: "manual" });
  });

  it("clamps negative metrics to 0 and skips non meta/tiktok platforms", async () => {
    const r = await POST(post({
      posts: [
        { platform: "meta", reach: -5, impressions: 10, engagements: -1 },
        { platform: "snapchat", reach: 100, impressions: 100, engagements: 100 },
      ],
    }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.added).toBe(1); // snapchat dropped
    const ins = inserted.find((x) => x.table === "organic_posts");
    expect(ins?.rows).toHaveLength(1);
    expect(ins?.rows[0]).toMatchObject({ platform: "meta", reach: 0, impressions: 10, engagements: 0 });
  });

  it("ingests a pasted CSV via parseOrganicCsv", async () => {
    const csv = "name,platform,reach,impressions,engagements\nSummer sale,meta,1200,3000,80\nDance clip,tiktok,800,2000,120";
    const r = await POST(post({ csv }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.added).toBe(2);
    const ins = inserted.find((x) => x.table === "organic_posts");
    expect(ins?.rows.map((row: any) => row.platform)).toEqual(["meta", "tiktok"]);
  });
});

describe("entitlement gate", () => {
  it("402 (POST) when the org plan lacks content_publish (free) — nothing stored", async () => {
    CURRENT_PLAN = "free";
    const r = await POST(post({ posts: [{ platform: "meta", reach: 1, impressions: 1, engagements: 1 }] }));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(inserted).toHaveLength(0);
  });

  it("402 (GET) when the org plan lacks content_publish (free)", async () => {
    CURRENT_PLAN = "free";
    const r = await GET();
    expect(r.status).toBe(402);
  });
});

describe("GET list", () => {
  it("returns the org's stored posts mapped to OrganicPostInput, newest first", async () => {
    LIST_ROWS = [
      { id: "p2", platform: "tiktok", name: "Newer", posted_at: "2026-06-02", reach: 500, impressions: 900, engagements: 40 },
      { id: "p1", platform: "meta", name: "Older", posted_at: "2026-06-01", reach: 1000, impressions: 2000, engagements: 50 },
    ];
    const r = await GET();
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.posts).toHaveLength(2);
    expect(j.posts[0]).toEqual({ id: "p2", platform: "tiktok", name: "Newer", date: "2026-06-02", reach: 500, impressions: 900, engagements: 40 });
    expect(j.posts[1].platform).toBe("meta");
  });
});

describe("parseOrganicCsv (pure)", () => {
  it("parses valid rows tolerating header order and casing", () => {
    const csv = "Platform,Engagements,Reach,Impressions,Name\nmeta,50,1000,2000,Hello\ntiktok,120,800,2000,Clip";
    const rows = parseOrganicCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ platform: "meta", name: "Hello", reach: 1000, impressions: 2000, engagements: 50 });
    expect(rows[1]).toMatchObject({ platform: "tiktok", reach: 800, engagements: 120 });
  });

  it("maps facebook/instagram aliases to meta and tiktok alias", () => {
    const csv = "platform,reach,impressions,engagements\nfacebook,100,200,10\ninstagram,300,400,20\ntt,500,600,30";
    const rows = parseOrganicCsv(csv);
    expect(rows.map((r) => r.platform)).toEqual(["meta", "meta", "tiktok"]);
  });

  it("skips junk: bad platform, all-zero metrics, blank lines", () => {
    const csv = [
      "name,platform,reach,impressions,engagements",
      "Good,meta,1000,2000,50",
      "Junk,snapchat,1,2,3", // unknown platform -> skipped
      "Empty,meta,0,0,0", // no numeric signal -> skipped
      "", // blank -> skipped
      "  ", // whitespace -> skipped
    ].join("\n");
    const rows = parseOrganicCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Good");
  });

  it("strips thousands separators in quoted numbers", () => {
    const csv = 'name,platform,reach,impressions,engagements\n"Big post",meta,"12,000","30,000","1,500"';
    const rows = parseOrganicCsv(csv);
    expect(rows[0]).toMatchObject({ reach: 12000, impressions: 30000, engagements: 1500 });
  });

  it("returns [] when there is no header/data or no platform column", () => {
    expect(parseOrganicCsv("")).toEqual([]);
    expect(parseOrganicCsv("name,reach,impressions,engagements\nx,1,2,3")).toEqual([]); // no platform col
    expect(parseOrganicCsv("just one line")).toEqual([]);
  });
});
