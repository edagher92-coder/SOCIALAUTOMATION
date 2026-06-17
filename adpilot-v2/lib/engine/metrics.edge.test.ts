// Edge cases for the metric helpers: divide-by-zero returns null (never throws),
// fmt(null) renders "N/A", and the ROAS-anomaly threshold behaviour.
import { describe, it, expect } from "vitest";
import * as M from "./metrics";

describe("metrics — divide-by-zero returns null", () => {
  it("cpa with zero purchases is null", () => {
    expect(M.cpa(800, 0)).toBeNull();
  });

  it("ctr with zero impressions is null (any numerator)", () => {
    expect(M.ctr(4200, 0)).toBeNull();
    expect(M.ctr(0, 0)).toBeNull();
  });

  it("roas with zero spend is null", () => {
    expect(M.roas(45000, 0)).toBeNull();
  });

  it("cpc/cpm/cpl/mer/frequency/conv with zero denominator are null", () => {
    expect(M.cpc(2100, 0)).toBeNull();
    expect(M.cpm(2100, 0)).toBeNull();
    expect(M.cpl(600, 0)).toBeNull();
    expect(M.mer(45000, 0)).toBeNull();
    expect(M.frequency(30000, 0)).toBeNull();
    expect(M.convRate(12, 0)).toBeNull();
  });

  it("breakEvenRoas with zero gross margin is null (safeDiv)", () => {
    expect(M.breakEvenRoas(0)).toBeNull();
  });

  it("safeDiv returns null only for a falsy denominator, never throws", () => {
    expect(M.safeDiv(10, 0)).toBeNull();
    expect(M.safeDiv(10, 5)).toBe(2);
  });
});

describe("fmt", () => {
  it("fmt(null) is 'N/A'", () => {
    expect(M.fmt(null)).toBe("N/A");
  });

  it("fmt of a number uses 2 dp by default", () => {
    expect(M.fmt(67.8)).toBe("67.80");
    expect(M.fmt(2.381)).toBe("2.38");
  });

  it("fmt respects an explicit decimal-place argument", () => {
    expect(M.fmt(1.5, 0)).toBe("2");
    expect(M.fmt(1.5, 1)).toBe("1.5");
  });
});

describe("ROAS anomaly threshold", () => {
  it("the constant is the committed value (20)", () => {
    expect(M.ROAS_ANOMALY_THRESHOLD).toBe(20);
  });

  it("isRoasAnomaly is true at/above the threshold, false below, false for null", () => {
    expect(M.isRoasAnomaly(M.ROAS_ANOMALY_THRESHOLD)).toBe(true);
    expect(M.isRoasAnomaly(M.ROAS_ANOMALY_THRESHOLD + 1)).toBe(true);
    expect(M.isRoasAnomaly(M.ROAS_ANOMALY_THRESHOLD - 0.01)).toBe(false);
    expect(M.isRoasAnomaly(4.59)).toBe(false);
    expect(M.isRoasAnomaly(null)).toBe(false);
  });

  it("a real implausible ROAS (rev 50000 / spend 500 = 100) is flagged", () => {
    expect(M.isRoasAnomaly(M.roas(50000, 500))).toBe(true);
  });
});
