import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// score route (CSV-paste "Analyze"): auth, validation, and — the regression
// this guards — that a successful analysis also persists the parsed rows into
// campaign_snapshots (source: "csv"), not just health_scores + reports. Mission
// Control's trend chart and budget guardrails read only from campaign_snapshots,
// so without this the CSV-paste flow silently never populated them.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
const insertedRows: Array<{ table: string; rows: any }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      return {
        insert: (rows: any) => {
          insertedRows.push({ table, rows });
          return {
            select: () => ({ single: async () => ({ data: { id: "report-1" } }) }),
          };
        },
      };
    },
  }),
}));
const getActiveOrgId = vi.fn(async (..._a: any[]) => "org-1");
vi.mock("@/lib/org", () => ({ getActiveOrgId: (...a: any[]) => getActiveOrgId(...a) }));
vi.mock("@/lib/proposals", () => ({ refreshOpenRecommendations: vi.fn(async () => ({ inserted: 0, cleared: 0 })) }));

import { POST } from "./route";

const META_CSV = `Campaign name,Amount spent (AUD),Impressions,Reach,Link clicks,Purchases,Purchases conversion value
exampleco_hotwater_leads_brisbane_20260601,2100,280000,160000,4200,118,9639`;

function post(body: any) {
  return new Request("https://x/api/score", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  insertedRows.length = 0;
  getActiveOrgId.mockReset().mockResolvedValue("org-1");
});

describe("auth", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ csv: META_CSV }));
    expect(r.status).toBe(401);
  });
});

describe("input validation", () => {
  it("400 on an unparseable body", async () => {
    const req = new Request("https://x/api/score", { method: "POST", body: "not json" });
    const r = await POST(req);
    expect(r.status).toBe(400);
  });

  it("422 when the CSV has no parseable rows", async () => {
    const r = await POST(post({ csv: "not,a,valid,csv\n" }));
    expect(r.status).toBe(422);
  });
});

describe("persistence on a successful analysis", () => {
  it("saves campaign_snapshots (source: csv) alongside health_scores + reports", async () => {
    const r = await POST(post({ csv: META_CSV }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.saved).toBe(true);

    expect(insertedRows.find((x) => x.table === "health_scores")).toBeTruthy();
    expect(insertedRows.find((x) => x.table === "reports")).toBeTruthy();

    const snapIns = insertedRows.find((x) => x.table === "campaign_snapshots");
    expect(snapIns).toBeTruthy();
    expect(snapIns?.rows).toHaveLength(1);
    expect(snapIns?.rows[0]).toMatchObject({
      organisation_id: "org-1",
      platform: "meta",
      campaign_name: "exampleco_hotwater_leads_brisbane_20260601",
      spend: 2100,
      impressions: 280000,
      clicks: 4200,
      purchases: 118,
      revenue: 9639,
      source: "csv",
    });
    // No "Day"/"Reporting starts" column in this fixture — falls back to today.
    expect(snapIns?.rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("chunks large row sets into batches of 500", async () => {
    const header = "Campaign name,Amount spent (AUD),Impressions,Reach,Link clicks,Purchases,Purchases conversion value";
    const lines = Array.from({ length: 1200 }, (_, i) => `camp_${i},10,100,50,5,1,20`);
    const csv = [header, ...lines].join("\n");
    const r = await POST(post({ csv }));
    expect(r.status).toBe(200);

    const snapBatches = insertedRows.filter((x) => x.table === "campaign_snapshots");
    expect(snapBatches).toHaveLength(3); // 500 + 500 + 200
    expect(snapBatches[0].rows).toHaveLength(500);
    expect(snapBatches[2].rows).toHaveLength(200);
  });

  it("still returns the analysis (saved: false) if persistence throws", async () => {
    getActiveOrgId.mockRejectedValueOnce(new Error("db down"));
    const r = await POST(post({ csv: META_CSV }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.saved).toBe(false);
    expect(insertedRows).toHaveLength(0);
  });
});
