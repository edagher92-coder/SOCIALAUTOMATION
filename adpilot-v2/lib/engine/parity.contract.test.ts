// DRIFT ALARM: pin the engine's load-bearing constants so any silent change to
// the ROAS anomaly threshold or the 13 health weights breaks a test immediately.
import { describe, it, expect } from "vitest";
import { ROAS_ANOMALY_THRESHOLD } from "./metrics";
import { HEALTH_WEIGHTS, weightsSum } from "./health";

describe("parity contract — ROAS anomaly threshold", () => {
  it("is exactly 20", () => {
    expect(ROAS_ANOMALY_THRESHOLD).toBe(20);
  });
});

describe("parity contract — HEALTH_WEIGHTS (13 keys + exact values)", () => {
  const EXPECTED: Record<string, number> = {
    tracking_quality: 15,
    cpa: 15,
    spend_efficiency: 12,
    conversion_rate: 10,
    ctr: 8,
    lead_quality: 8,
    creative_freshness: 8,
    cpc: 7,
    naming_quality: 5,
    offer_strength: 5,
    landing_page_alignment: 4,
    budget_pacing: 2,
    data_confidence: 1,
  };

  it("has exactly the 13 committed keys", () => {
    expect(Object.keys(HEALTH_WEIGHTS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("every key maps to its committed weight", () => {
    expect(HEALTH_WEIGHTS).toEqual(EXPECTED);
  });

  it("weights sum to 100", () => {
    expect(weightsSum()).toBe(100);
    expect(Object.values(HEALTH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
