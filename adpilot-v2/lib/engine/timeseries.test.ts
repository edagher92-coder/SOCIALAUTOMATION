import { describe, it, expect } from "vitest";
import { mean, median, mad, slope, movingAverage, wowDelta, anomalyIndices, trend, summariseSeries } from "./timeseries";

describe("timeseries helpers", () => {
  it("mean/median handle empty + odd/even", () => {
    expect(mean([])).toBeNull();
    expect(mean([2, 4, 6])).toBe(4);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("slope is positive for a rising series, null for <2 points", () => {
    expect(slope([10])).toBeNull();
    expect(slope([1, 2, 3, 4])! > 0).toBe(true);
    expect(slope([4, 3, 2, 1])! < 0).toBe(true);
    expect(slope([5, 5, 5])).toBe(0);
  });

  it("movingAverage uses the trailing window", () => {
    expect(movingAverage([1, 2, 3, 10, 20], 2)).toBe(15);
    expect(movingAverage([], 3)).toBeNull();
  });

  it("wowDelta compares last 7 vs prior 7 (needs ≥14 points)", () => {
    expect(wowDelta([1, 2, 3])).toBeNull();
    const prev = Array(7).fill(100);
    const last = Array(7).fill(120);
    expect(wowDelta([...prev, ...last])).toBeCloseTo(0.2, 5); // +20%
  });

  it("anomalyIndices flags a clear outlier via median±MAD", () => {
    const xs = [10, 11, 10, 12, 11, 10, 200]; // 200 is the anomaly
    const idx = anomalyIndices(xs);
    expect(idx).toContain(6);
    expect(idx).not.toContain(0);
  });

  it("trend classifies rising/falling/flat", () => {
    expect(trend([1, 2, 3, 4, 5])).toBe("rising");
    expect(trend([5, 4, 3, 2, 1])).toBe("falling");
    expect(trend([10, 10, 10, 10])).toBe("flat");
  });

  it("summariseSeries returns a compact diagnostic + flags today's anomaly", () => {
    const xs = [10, 11, 10, 12, 11, 10, 11, 10, 12, 11, 10, 11, 10, 300];
    const s = summariseSeries(xs);
    expect(s.n).toBe(14);
    expect(s.current).toBe(300);
    expect(s.anomalyToday).toBe(true);
    expect(typeof s.avg7).toBe("number");
    expect(["rising", "falling", "flat"]).toContain(s.trend);
  });
});
