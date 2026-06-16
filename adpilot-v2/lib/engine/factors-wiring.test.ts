import { describe, it, expect } from "vitest";
import { analyse } from "./index";

// Verifies the v4 Wave B factor wiring: budget_pacing uses the real pacing score when the caller
// supplies month context, and lead_quality accepts a caller-supplied account average — while both
// fall back safely (no score shift) when those inputs are absent.

const rows = [
  { campaign_name: "A", platform: "meta", spend: 1000, impressions: 80000, reach: 40000, clicks: 1600, leads: 40, purchases: 12, revenue: 4000, frequency: 2, ctr: 0.02 },
];
const baseCfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as const;

describe("budget_pacing factor wiring", () => {
  it("defaults to neutral 85 when no pacing context is supplied (no regression)", () => {
    const r = analyse(rows, { ...baseCfg });
    expect(r.health.breakdown.budget_pacing.score).toBe(85);
  });

  it("uses the real pacing score when a budget + month context is supplied (over-pacing → lower)", () => {
    const r = analyse(rows, { ...baseCfg, pacing: { monthlyBudget: 1500, spendToDate: 1400, daysElapsed: 10, daysInMonth: 30 } });
    // day 10/30 target = $500, spent $1400 → heavily over-pacing → score well below neutral
    expect(r.health.breakdown.budget_pacing.score).toBeLessThan(85);
  });

  it("stays neutral when a budget is unknown (null) even with month context", () => {
    const r = analyse(rows, { ...baseCfg, pacing: { monthlyBudget: null, spendToDate: 1400, daysElapsed: 10, daysInMonth: 30 } });
    expect(r.health.breakdown.budget_pacing.score).toBe(85);
  });
});

describe("lead_quality factor wiring", () => {
  it("is N/A (score null, weight redistributed) when neither rows nor cfg provide it", () => {
    const r = analyse(rows, { ...baseCfg });
    expect(r.health.breakdown.lead_quality.score).toBeNull();
    expect(r.health.breakdown.lead_quality.adjusted_weight).toBe(0);
  });

  it("uses a caller-supplied account average (e.g. from CRM lead_events)", () => {
    const r = analyse(rows, { ...baseCfg, lead_quality_avg: 80 });
    expect(r.health.breakdown.lead_quality?.score).toBe(80);
  });
});
