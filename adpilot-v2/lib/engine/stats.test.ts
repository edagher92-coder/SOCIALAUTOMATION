import { describe, it, expect } from "vitest";
import { wilsonInterval, confidentlyAbove, confidentlyBelow, enoughData, rateConfidence } from "./stats";

describe("significance helpers", () => {
  it("wilsonInterval is null for no data and brackets the point estimate", () => {
    expect(wilsonInterval(5, 0)).toBeNull();
    const ci = wilsonInterval(50, 100)!;
    expect(ci.point).toBeCloseTo(0.5, 5);
    expect(ci.low).toBeLessThan(0.5);
    expect(ci.high).toBeGreaterThan(0.5);
    expect(ci.low).toBeGreaterThanOrEqual(0);
    expect(ci.high).toBeLessThanOrEqual(1);
  });

  it("a tiny sample is wide and inconclusive vs a mid target", () => {
    // 1/2 conversions — point 0.5 but the interval is huge → can't confidently beat/miss 0.3
    expect(confidentlyAbove(1, 2, 0.3)).toBe(false);
    expect(confidentlyBelow(1, 2, 0.7)).toBe(false);
    expect(rateConfidence(1, 2, 0.3)).toBe("inconclusive");
  });

  it("a large clearly-good sample confidently beats the target (scale-worthy)", () => {
    // 60/1000 = 6% vs a 3% target → lower bound well above 3%
    expect(confidentlyAbove(60, 1000, 0.03)).toBe(true);
    expect(rateConfidence(60, 1000, 0.03)).toBe("above");
  });

  it("a large clearly-bad sample confidently misses the target (kill-worthy)", () => {
    // 5/1000 = 0.5% vs a 3% target → upper bound below 3%
    expect(confidentlyBelow(5, 1000, 0.03)).toBe(true);
    expect(rateConfidence(5, 1000, 0.03)).toBe("below");
  });

  it("enoughData enforces a minimum sample", () => {
    expect(enoughData(40)).toBe(false);
    expect(enoughData(150)).toBe(true);
    expect(enoughData(20, 10)).toBe(true);
  });
});
