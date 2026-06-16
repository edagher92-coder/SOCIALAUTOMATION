// Exact-value parity for the metric helpers (documented QA cases asserted against
// the real implementation in metrics.ts). effectiveQualifiedCpl is intentionally
// NOT covered here — it is not implemented in this module (the reports stream owns it).
import { describe, it, expect } from "vitest";
import * as M from "./metrics";

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

describe("metrics — exact-value parity", () => {
  it("ctr(clicks,imp) is a ratio; ratio*100 = percentage", () => {
    expect(M.ctr(4200, 280000)).toBeCloseTo(0.015, 6);
    expect(round2((M.ctr(4200, 280000) as number) * 100)).toBe(1.5);
  });

  it("cpc(spend,clicks) = spend / clicks", () => {
    expect(round2(M.cpc(2100, 4200))).toBe(0.5);
  });

  it("cpm(spend,imp) = spend / imp * 1000", () => {
    expect(round2(M.cpm(2100, 280000))).toBe(7.5);
  });

  it("cpl(spend,leads) = spend / leads", () => {
    expect(round2(M.cpl(600, 40))).toBe(15);
  });

  it("cpa(spend,purchases) = spend / purchases", () => {
    expect(round2(M.cpa(8000, 118))).toBe(67.8);
  });

  it("roas(rev,spend) = rev / spend", () => {
    expect(round2(M.roas(45000, 9800))).toBe(4.59);
  });

  it("mer(rev,spend) = rev / spend (same formula as roas at account level)", () => {
    expect(round2(M.mer(45000, 9800))).toBe(4.59);
  });

  it("hookRate(3s_views,imp) = 3s / imp", () => {
    expect(round2(M.hookRate(4000, 30000))).toBe(0.13);
    expect(round2(M.hookRate(15000, 30000))).toBe(0.5);
  });

  it("holdRate(thruplays,3s_views) = thruplays / 3s", () => {
    expect(round2(M.holdRate(9000, 4000))).toBe(2.25);
    expect(round2(M.holdRate(2000, 4000))).toBe(0.5);
  });

  it("breakEvenCpa(avg_sale, gross_margin) = avg * gm", () => {
    expect(round2(M.breakEvenCpa(185, 0.42))).toBe(77.7);
    expect(round2(M.breakEvenCpa(200, 0.6))).toBe(120);
  });

  it("breakEvenRoas(gross_margin) = 1 / gm", () => {
    expect(round2(M.breakEvenRoas(0.42))).toBe(2.38);
    expect(round2(M.breakEvenRoas(0.6))).toBeCloseTo(1.67, 2);
  });

  it("variancePct(actual,target) = (a - t) / t * 100", () => {
    expect(round2(M.variancePct(110, 100))).toBe(10);
    expect(round2(M.variancePct(90, 100))).toBe(-10);
    expect(round2(M.variancePct(77.7, 67.8))).toBeCloseTo(14.6, 1);
  });

  it("blendedCpa(spends[],convs[]) = sum(spends) / sum(convs)", () => {
    expect(round2(M.blendedCpa([100, 200], [5, 15]))).toBe(15);
    expect(round2(M.blendedCpa([8000], [118]))).toBe(67.8);
  });
});
