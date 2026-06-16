import { describe, it, expect } from "vitest";
import { evaluateAlertRules, DEFAULT_THRESHOLDS } from "./alerts";

describe("threshold alert rules", () => {
  it("returns nothing for an empty set", () => {
    expect(evaluateAlertRules([])).toEqual([]);
  });

  it("flags critical frequency fatigue", () => {
    const hits = evaluateAlertRules([{ campaign_name: "A", spend: 100, impressions: 10000, clicks: 200, leads: 5, purchases: 1, frequency: 6.5 }]);
    const f = hits.find((h) => h.rule_id === "frequency");
    expect(f?.severity).toBe("critical");
    expect(f?.dedupe_key).toBe("frequency:A");
  });

  it("flags zero-conversion spend (spend over threshold, no leads or purchases)", () => {
    const hits = evaluateAlertRules([{ campaign_name: "B", spend: 80, impressions: 9000, clicks: 50, leads: 0, purchases: 0, frequency: 1.2 }]);
    expect(hits.some((h) => h.rule_id === "zero_conversion_spend" && h.severity === "critical")).toBe(true);
  });

  it("does NOT flag zero-conversion when spend is below threshold", () => {
    const hits = evaluateAlertRules([{ campaign_name: "C", spend: 5, impressions: 400, clicks: 2, leads: 0, purchases: 0, frequency: 1 }]);
    expect(hits.some((h) => h.rule_id === "zero_conversion_spend")).toBe(false);
  });

  it("flags weak CTR only on a meaningful sample", () => {
    const big = evaluateAlertRules([{ campaign_name: "D", spend: 50, impressions: 5000, clicks: 10, leads: 2, purchases: 1, frequency: 2 }]); // ctr 0.2%
    expect(big.some((h) => h.rule_id === "low_ctr")).toBe(true);
    const tiny = evaluateAlertRules([{ campaign_name: "E", spend: 50, impressions: 100, clicks: 0, leads: 2, purchases: 1, frequency: 2 }]);
    expect(tiny.some((h) => h.rule_id === "low_ctr")).toBe(false); // below min_impressions
  });

  it("dedupes to one hit per rule per campaign and aggregates daily rows", () => {
    const hits = evaluateAlertRules([
      { campaign_name: "F", spend: 40, impressions: 6000, clicks: 6, leads: 0, purchases: 0, frequency: 7 },
      { campaign_name: "F", spend: 40, impressions: 6000, clicks: 6, leads: 0, purchases: 0, frequency: 5 },
    ]);
    expect(hits.filter((h) => h.rule_id === "frequency").length).toBe(1); // one campaign, one freq hit
    expect(DEFAULT_THRESHOLDS.frequency_critical).toBe(6);
  });
});
