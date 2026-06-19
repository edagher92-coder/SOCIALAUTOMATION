import { describe, it, expect } from "vitest";
import { projectBoost } from "@/lib/organic/boost";

// ---------------------------------------------------------------------------
// projectBoost — PURE organic boost projection (no I/O). The crux is the
// significance gate: we only ever say "worth boosting" when the post's organic
// engagement is CONFIDENTLY above the platform benchmark (Wilson lower bound),
// mirroring the ads engine's "only scale a proven winner" discipline.
// ---------------------------------------------------------------------------

describe("projectBoost — reach maths", () => {
  it("buys impressions at the account CPM and converts to unique reach via frequency", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 5000, impressions: 12000, engagements: 150 },
      budget: 100,
      cpm: 10,
    });
    expect(p.cpmSource).toBe("account");
    expect(p.cpmUsed).toBe(10);
    // $100 at $10 CPM = 10,000 impressions; /1.15 freq = ~8,696 unique reach.
    expect(p.paidImpressions).toBe(10000);
    expect(Math.round(p.incrementalReach)).toBe(8696);
    expect(p.totalProjectedReach).toBeCloseTo(5000 + p.incrementalReach, 6);
    // cost per 1k incremental reach = 100 / (8696/1000) ≈ $11.50
    expect(p.costPer1kIncrementalReach).toBeCloseTo(11.5, 1);
    // range brackets the point estimate (more repeats -> fewer unique people)
    expect(p.incrementalReachRange.low).toBeLessThan(p.incrementalReach);
    expect(p.incrementalReachRange.high).toBeGreaterThan(p.incrementalReach);
  });

  it("falls back to a labelled benchmark CPM when the account has no ad data", () => {
    const p = projectBoost({
      post: { platform: "tiktok", reach: 8000, impressions: 20000, engagements: 480 },
      budget: 200,
      cpm: null,
    });
    expect(p.cpmSource).toBe("benchmark");
    expect(p.cpmUsed).toBe(10); // TikTok benchmark
    expect(p.paidImpressions).toBe(20000);
  });
});

describe("projectBoost — significance-gated verdict", () => {
  it("recommends boosting a PROVEN winner (engagement confidently above benchmark)", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 5000, impressions: 12000, engagements: 150 }, // 3% > 2%
      budget: 100,
      cpm: 10,
    });
    expect(p.confidence).toBe("above");
    expect(p.verdict).toBe("worth-boosting");
  });

  it("says improve-organic-first when engagement is confidently BELOW benchmark", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 4000, impressions: 9000, engagements: 24 }, // 0.6% << 2%
      budget: 50,
      cpm: null,
    });
    expect(p.confidence).toBe("below");
    expect(p.verdict).toBe("improve-organic-first");
  });

  it("holds (improve-organic-first) when a small sample can't confirm a winner", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 300, impressions: 600, engagements: 9 }, // 3% but tiny n
      budget: 30,
      cpm: 10,
    });
    expect(p.confidence).toBe("inconclusive");
    expect(p.verdict).toBe("improve-organic-first");
  });

  it("returns insufficient-data below the reach floor", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 100, impressions: 200, engagements: 8 },
      budget: 20,
      cpm: 10,
    });
    expect(p.verdict).toBe("insufficient-data");
    expect(p.confidence).toBe("inconclusive");
  });
});

describe("projectBoost — guards", () => {
  it("produces finite zeros (no NaN/Infinity) when the budget is zero", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 5000, impressions: 12000, engagements: 150 },
      budget: 0,
      cpm: 10,
    });
    for (const v of [p.paidImpressions, p.incrementalReach, p.costPer1kIncrementalReach, p.projectedAddedEngagements]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBe(0);
    }
  });

  it("engagement rate divides engagements by reach", () => {
    const p = projectBoost({
      post: { platform: "tiktok", reach: 8000, impressions: 20000, engagements: 480 },
      budget: 200,
      cpm: null,
    });
    expect(p.engagementRate).toBeCloseTo(0.06, 6);
    expect(p.engagementRateRange.low).toBeLessThanOrEqual(p.engagementRate);
    expect(p.engagementRateRange.high).toBeGreaterThanOrEqual(p.engagementRate);
  });
});

describe("projectBoost — edge fixes", () => {
  it("calls a high-reach, zero-engagement post BELOW benchmark (not insufficient-data)", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 50000, impressions: 100000, engagements: 0 },
      budget: 100,
      cpm: 10,
    });
    // 0 engagements over 50k reach is conclusive — improve organically, don't "wait for more data".
    expect(p.confidence).toBe("below");
    expect(p.verdict).toBe("improve-organic-first");
  });

  it("caps engagement rate at 100% so the point never exceeds its own (clamped) CI", () => {
    const p = projectBoost({
      post: { platform: "meta", reach: 5000, impressions: 8000, engagements: 8000 }, // 160% raw
      budget: 100,
      cpm: 10,
    });
    expect(p.engagementRate).toBeLessThanOrEqual(1);
    expect(p.engagementRate).toBeLessThanOrEqual(p.engagementRateRange.high);
    // damped + bounded: projected added engagements can't exceed the incremental reach
    expect(p.projectedAddedEngagements).toBeLessThanOrEqual(p.incrementalReach);
  });
});
