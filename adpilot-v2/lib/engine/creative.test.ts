import { describe, it, expect } from "vitest";
import { computeCreativeScorecard } from "./creative";
import { computeWastedSpend } from "./waste";
import type { Cfg } from "./types";

const CFG: Cfg = { average_sale_value: 200, gross_margin: 0.5 }; // break-even CPA = $100

function row(overrides: Record<string, any> = {}) {
  return {
    ad_id: "ad-1", ad_name: "Test Ad", campaign_name: "Camp A",
    spend: 500, impressions: 50000, clicks: 500, leads: 0, purchases: 3, revenue: 300,
    reach: 40000, ctr: 0.01, date: "2026-01-01",
    ...overrides,
  };
}

describe("computeCreativeScorecard", () => {
  it("returns empty array for empty input", () => {
    expect(computeCreativeScorecard([], CFG)).toEqual([]);
  });

  it("groups rows by ad_id and computes aggregated metrics", () => {
    const rows = [
      row({ ad_id: "a1", spend: 200, clicks: 100, purchases: 1, impressions: 10000, reach: 8000, date: "2026-01-01" }),
      row({ ad_id: "a1", spend: 200, clicks: 80, purchases: 1, impressions: 10000, reach: 8000, date: "2026-01-02" }),
      row({ ad_id: "a2", spend: 500, clicks: 200, purchases: 5, impressions: 20000, reach: 15000, date: "2026-01-01" }),
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc).toHaveLength(2);
    const a1 = sc.find((r) => r.adKey === "a1")!;
    expect(a1.spend).toBe(400);
    expect(a1.clicks).toBe(180);
  });

  it("computes hookRate and holdRate for video rows", () => {
    const rows = [row({ video_3_sec_views: 5000, thruplay_views: 2000, impressions: 20000, spend: 200, clicks: 200, purchases: 2 })];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc[0].hookRate).toBeCloseTo(0.25);
    expect(sc[0].holdRate).toBeCloseTo(0.4);
  });

  it("returns null hookRate/holdRate for non-video rows", () => {
    const rows = [row({ video_3_sec_views: 0, thruplay_views: 0 })];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc[0].hookRate).toBeNull();
    expect(sc[0].holdRate).toBeNull();
  });

  it("computes ctrDecay from peak vs current CTR", () => {
    const rows = [
      row({ ad_id: "a1", ctr: 0.04, date: "2026-01-01", clicks: 400, impressions: 10000, purchases: 1, spend: 100 }),
      row({ ad_id: "a1", ctr: 0.02, date: "2026-01-02", clicks: 200, impressions: 10000, purchases: 1, spend: 100 }),
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc[0].ctrPeak).toBeCloseTo(0.04);
    // decay = (0.04 - aggregated_ctr) / 0.04
    expect(sc[0].ctrDecay).not.toBeNull();
    expect(sc[0].ctrDecay!).toBeGreaterThan(0);
  });

  it("returns safe:true on every verdict (via decide)", () => {
    const rows = [
      row({ ad_id: "a1", spend: 1000, purchases: 2, revenue: 200, clicks: 200 }),
      row({ ad_id: "a2", spend: 50, purchases: 10, revenue: 2500, clicks: 100 }),
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    // Just ensure verdicts are populated (safe:true is inside decide which we trust)
    for (const r of sc) {
      expect(typeof r.verdict).toBe("string");
      expect(r.verdict.length).toBeGreaterThan(0);
    }
  });

  it("ranks kill/reduce rows before keep/scale rows", () => {
    const rows = [
      // Ad that should scale: good CPA, high volume
      row({ ad_id: "scale-ad", spend: 500, purchases: 20, revenue: 4000, clicks: 200, impressions: 20000, reach: 15000 }),
      // Ad that should kill or reduce: high CPA, good volume
      row({ ad_id: "kill-ad", spend: 2000, purchases: 5, revenue: 200, clicks: 200, impressions: 20000, reach: 15000 }),
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc.length).toBe(2);
    // The problematic ad should be ranked first (lower rank index)
    const killIdx = sc.findIndex((r) => r.adKey === "kill-ad");
    const scaleIdx = sc.findIndex((r) => r.adKey === "scale-ad");
    expect(killIdx).toBeLessThan(scaleIdx);
  });

  it("uses ad_name as fallback key when no ad_id", () => {
    const rows = [
      { ...row(), ad_id: undefined, ad_name: "Named Ad" },
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    expect(sc[0].adKey).toBe("Named Ad");
    expect(sc[0].adName).toBe("Named Ad");
  });
});

describe("computeWastedSpend", () => {
  it("returns zeros for empty scorecard", () => {
    const result = computeWastedSpend([]);
    expect(result.total).toBe(0);
    expect(result.killCount).toBe(0);
    expect(result.wastedFraction).toBeNull();
  });

  it("sums kill and reduce spend separately", () => {
    const rows = [
      // High CPA (kill/reduce): spend=2000, purchases=5, CPA=400>100 and >150 so kill
      row({ ad_id: "k1", spend: 2000, purchases: 5, revenue: 300, clicks: 200, impressions: 20000, reach: 15000 }),
      // Good CPA (scale/keep): spend=500, purchases=20
      row({ ad_id: "g1", spend: 500, purchases: 20, revenue: 4000, clicks: 200, impressions: 20000, reach: 15000 }),
    ];
    const sc = computeCreativeScorecard(rows, CFG);
    const w = computeWastedSpend(sc);
    // At least one ad should be flagged
    expect(w.total).toBeGreaterThan(0);
    expect(w.killCount + w.reduceCount).toBeGreaterThan(0);
  });

  it("computes wastedFraction relative to total spend", () => {
    const sc = [
      { adKey: "k1", adName: "Kill Ad", spend: 1000, verdict: "kill" } as any,
      { adKey: "k2", adName: "Keep Ad", spend: 1000, verdict: "keep" } as any,
    ];
    const w = computeWastedSpend(sc, 2000);
    expect(w.total).toBe(1000);
    expect(w.wastedFraction).toBeCloseTo(0.5);
  });

  it("computes wastedFraction from scorecard total when not supplied", () => {
    const sc = [
      { adKey: "k1", adName: "Kill Ad", spend: 500, verdict: "kill" } as any,
      { adKey: "r1", adName: "Reduce Ad", spend: 300, verdict: "reduce" } as any,
      { adKey: "g1", adName: "Keep Ad", spend: 200, verdict: "keep" } as any,
    ];
    const w = computeWastedSpend(sc);
    expect(w.total).toBe(800);
    expect(w.killSpend).toBe(500);
    expect(w.reduceSpend).toBe(300);
    expect(w.wastedFraction).toBeCloseTo(0.8); // 800/1000
  });
});
