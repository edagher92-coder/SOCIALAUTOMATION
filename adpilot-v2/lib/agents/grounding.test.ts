import { describe, it, expect } from "vitest";
import { buildGrounding, buildStructuredGrounding } from "./grounding";

const payload = {
  summary: { spend: 4980, leads: 100, purchases: 12, revenue: 10500, cpa: 415, roas: 2.1, mer: 2.1, break_even_cpa: 600, break_even_roas: 1.8 },
  health: { total: 72, band: "Yellow", weakest: [{ label: "creative" }, "offer_strength"], findings: [{ severity: "CRITICAL", message: "Pixel firing on page load" }] },
  decisions: [
    { name: "Ad A", verdict: "scale", platform: "meta", reason: "above break-even" },
    { name: "Ad B", verdict: "kill", platform: "meta", reason: "CPA 3× break-even" },
    { name: "Ad C", verdict: "keep" },
  ],
  campaigns: [{ campaign: "Prospecting", spend: 3000, cpa: 500, roas: 1.6, health: 60, band: "Yellow" }],
  anomalies: [{ metric: "cpl", direction: "spike", severity: "alert" }],
  fatigue: [{ ad: "Ad A", status: "fatigued", onsetDaysAgo: 3 }],
};

describe("buildGrounding (back-compat string)", () => {
  it("returns the no-data sentence when there is nothing analysed", () => {
    expect(buildGrounding(null, [])).toMatch(/no analysed data yet/);
  });
  it("renders the core lines plus the new winners/losers/anomalies/fatigue sections", () => {
    const g = buildGrounding(payload, [{ verdict: "kill", entity_name: "Ad B" }]);
    expect(g).toMatch(/Spend \$4,980/);
    expect(g).toMatch(/Health 72\/100 \(Yellow\)/);
    expect(g).toMatch(/Critical findings: Pixel firing/);
    expect(g).toMatch(/Top performers:.*scale → Ad A/);
    expect(g).toMatch(/Underperformers:.*kill → Ad B/);
    expect(g).toMatch(/Sudden changes:.*cpl spike \(alert\)/);
    expect(g).toMatch(/Creative fatigue:.*Ad A \(fatigued\) ~3d ago/);
    expect(g).toMatch(/Open proposals:.*kill → Ad B/);
  });
  it("adds a 'what changed' delta when a previous payload is supplied", () => {
    const prev = { summary: { roas: 2.6, cpa: 380, spend: 4000 }, health: { total: 80 } };
    const g = buildGrounding(payload, [], prev);
    expect(g).toMatch(/What changed since last report:/);
    expect(g).toMatch(/Health 80→72 \(-8\)/);
    expect(g).toMatch(/ROAS 2\.60×→2\.10×/);
  });
});

describe("buildStructuredGrounding", () => {
  it("splits winners and losers by verdict and exposes structured fields", () => {
    const g = buildStructuredGrounding(payload, []);
    expect(g.hasData).toBe(true);
    expect(g.winners.map((w) => w.verdict)).toEqual(["scale", "keep"]);
    expect(g.losers.map((w) => w.verdict)).toEqual(["kill"]);
    expect(g.health?.weakest).toEqual(["creative", "offer_strength"]);
    expect(g.anomalies[0].metric).toBe("cpl");
    expect(g.campaigns[0].campaign).toBe("Prospecting");
  });
  it("is null-safe on an empty payload", () => {
    const g = buildStructuredGrounding(undefined, undefined as any);
    expect(g.hasData).toBe(false);
    expect(g.winners).toEqual([]);
    expect(g.whatChanged).toEqual([]);
  });
});
