// Parity for the 13-factor health score: weight invariants, all-80 baseline,
// N/A weight redistribution, the REAL band boundaries, the all-N/A throw, and
// `weakest` ordering.
import { describe, it, expect } from "vitest";
import { HEALTH_WEIGHTS, computeHealth, weightsSum, band } from "./health";

const FACTORS = [
  "tracking_quality", "cpa", "spend_efficiency", "conversion_rate", "ctr",
  "lead_quality", "creative_freshness", "cpc", "naming_quality",
  "offer_strength", "landing_page_alignment", "budget_pacing", "data_confidence",
];
const all = (v: number): Record<string, number> => {
  const o: Record<string, number> = {};
  FACTORS.forEach((f) => (o[f] = v));
  return o;
};

describe("health — weights", () => {
  it("there are exactly 13 factors", () => {
    expect(Object.keys(HEALTH_WEIGHTS).length).toBe(13);
    expect(FACTORS.every((f) => f in HEALTH_WEIGHTS)).toBe(true);
  });

  it("weights sum to 100", () => {
    expect(weightsSum()).toBe(100);
  });
});

describe("health — scoring", () => {
  it("all factors at 80 => total 80 / Green", () => {
    const r = computeHealth(all(80));
    expect(r.total).toBe(80);
    expect(r.band).toBe("Green");
  });

  it("all factors at 100 => total 100 / Green", () => {
    const r = computeHealth(all(100));
    expect(r.total).toBe(100);
    expect(r.band).toBe("Green");
  });

  it("N/A redistribution: dropping one factor but keeping the rest at 80 keeps total 80", () => {
    // Mark lead_quality N/A; its weight redistributes across the active factors,
    // and since every active factor is still 80, the weighted total stays 80.
    const scores = all(80);
    delete scores.lead_quality;
    const r = computeHealth(scores, ["lead_quality"]);
    expect(r.total).toBe(80);
    expect(r.band).toBe("Green");
    // the N/A factor is reported with score null and adjusted_weight 0
    expect(r.breakdown.lead_quality.score).toBeNull();
    expect(r.breakdown.lead_quality.adjusted_weight).toBe(0);
    // active adjusted weights still sum to 100
    const activeAdj = FACTORS.filter((f) => f !== "lead_quality")
      .reduce((a, f) => a + r.breakdown[f].adjusted_weight, 0);
    expect(Math.round(activeAdj)).toBe(100);
  });

  it("N/A redistribution with several factors dropped still keeps an all-80 total at 80", () => {
    const scores = all(80);
    ["lead_quality", "offer_strength", "landing_page_alignment"].forEach((f) => delete scores[f]);
    const r = computeHealth(scores, ["lead_quality", "offer_strength", "landing_page_alignment"]);
    expect(r.total).toBe(80);
  });

  it("throws when ALL factors are N/A", () => {
    expect(() => computeHealth({}, FACTORS)).toThrow();
    // also throws when simply given no scores at all (every factor implicitly N/A)
    expect(() => computeHealth({})).toThrow();
  });
});

describe("health — REAL band boundaries", () => {
  it("Green is the >=80 band", () => {
    expect(band(80)[0]).toBe("Green");
    expect(band(100)[0]).toBe("Green");
  });

  it("Yellow is the 60..79.99 band", () => {
    expect(band(79.99)[0]).toBe("Yellow");
    expect(band(60)[0]).toBe("Yellow");
  });

  it("Orange is the 40..59.99 band", () => {
    expect(band(59.99)[0]).toBe("Orange");
    expect(band(59)[0]).toBe("Orange");
    expect(band(40)[0]).toBe("Orange");
  });

  it("Red is the <40 band (incl. 0)", () => {
    expect(band(39.99)[0]).toBe("Red");
    expect(band(0)[0]).toBe("Red");
  });

  it("each band carries its guidance string", () => {
    expect(band(85)[1]).toMatch(/scale-eligible/i);
    expect(band(65)[1]).toMatch(/watch/i);
    expect(band(45)[1]).toMatch(/needs work/i);
    expect(band(10)[1]).toMatch(/critical/i);
  });
});

describe("health — weakest ordering", () => {
  it("orders the biggest weighted point-losses first (lowest score on a heavy weight)", () => {
    const scores = all(90);
    scores.tracking_quality = 10; // heaviest weight (15) + lowest score => biggest loss
    scores.cpa = 30;              // weight 15, moderate loss
    scores.data_confidence = 0;  // lowest weight (1) — small loss despite score 0
    const r = computeHealth(scores);
    expect(r.weakest[0]).toBe("tracking_quality");
    expect(r.weakest).toContain("cpa");
    expect(r.weakest.length).toBe(3);
    // the tiny-weight factor should not crowd out the heavy losses
    expect(r.weakest).not.toContain("data_confidence");
  });
});
