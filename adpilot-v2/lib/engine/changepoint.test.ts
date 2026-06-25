import { describe, it, expect } from "vitest";
import { changePoint, confidenceLabel } from "./changepoint";

describe("changePoint (AMOC least-squares segmentation)", () => {
  it("returns null for a perfectly flat series (no change)", () => {
    expect(changePoint([5, 5, 5, 5, 5, 5])).toBeNull();
  });

  it("returns null for a too-short series (n < 2*minSeg)", () => {
    expect(changePoint([1, 5])).toBeNull();
  });

  it("detects a clear downward step and locates the onset index", () => {
    const cp = changePoint([10, 10, 10, 10, 3, 3, 3, 3])!; // steps down at index 4
    expect(cp).not.toBeNull();
    expect(cp.index).toBe(4);
    expect(cp.delta).toBeLessThan(0);
    expect(cp.meanBefore).toBeCloseTo(10, 6);
    expect(cp.meanAfter).toBeCloseTo(3, 6);
    expect(cp.varianceExplained).toBeGreaterThan(0.9);
    expect(cp.confidence).toBeGreaterThan(0.3);
  });

  it("detects an upward step with a positive delta", () => {
    const cp = changePoint([2, 2, 2, 9, 9, 9])!;
    expect(cp.index).toBe(3);
    expect(cp.delta).toBeGreaterThan(0);
  });

  it("returns null when no split beats a single mean by the threshold", () => {
    // small wiggle around a level — no sustained step
    expect(changePoint([5, 5.01, 4.99, 5, 5.01, 4.99], { minVarianceExplained: 0.5 })).toBeNull();
  });

  it("respects minSeg so a single-day blip is not a level change", () => {
    // one outlier at the end — with minSeg 2 it cannot be its own segment
    const cp = changePoint([5, 5, 5, 5, 5, 50], { minSeg: 2 });
    // either null (blip rejected) or a split that is NOT the lone final point
    if (cp) expect(cp.index).toBeLessThanOrEqual(4);
  });

  it("confidenceLabel buckets sensibly", () => {
    expect(confidenceLabel(0.8)).toBe("high");
    expect(confidenceLabel(0.5)).toBe("moderate");
    expect(confidenceLabel(0.1)).toBe("low");
  });
});
