// THE SAFETY INVARIANT for the decision engine: every decision is a reversible
// proposal (never a live edit). Across a spread of fixture rows we assert:
//   - decide(...).safe === true ALWAYS
//   - verdict is only ever in the safe set declared in types.ts
//   - no proposal contains the word "delete"
//   - a kill verdict proposes "Pause"
//   - scale only when health is high AND tracking is ok
//   - broken tracking => fix-tracking, never scale
import { describe, it, expect } from "vitest";
import { decide } from "./decisions";
import type { Cfg, Row, Decision } from "./types";

// Mirrors the Decision["verdict"] union in types.ts.
const SAFE_VERDICTS: Decision["verdict"][] = [
  "keep", "kill", "duplicate", "scale", "reduce", "refresh", "fix-tracking", "insufficient-data",
];

const cfg: Cfg = { average_sale_value: 200, gross_margin: 0.6 }; // break-even CPA = 120

// A spread of fixtures exercising each branch of decide().
const rows: { label: string; row: Row; ctrPeak?: number | null; health?: number | null }[] = [
  // strong winner, clean tracking, high health => scale-eligible
  { label: "winner clean high-health", row: { spend: 1000, clicks: 400, purchases: 20, revenue: 6000, impressions: 50000, reach: 25000, tracking_status: "ok" }, health: 88 },
  // good CPA but health low => keep (not clear to scale)
  { label: "good cpa low health", row: { spend: 1000, clicks: 400, purchases: 20, revenue: 6000, impressions: 50000, reach: 25000, tracking_status: "ok" }, health: 55 },
  // CPA above BE but recoverable (<1.5x) => reduce
  { label: "cpa recoverable", row: { spend: 2800, clicks: 400, purchases: 20, revenue: 3000, impressions: 50000, reach: 25000, tracking_status: "ok" }, health: 70 },
  // CPA way over (>1.5x BE) => kill
  { label: "cpa blown", row: { spend: 6000, clicks: 400, purchases: 20, revenue: 1000, impressions: 50000, reach: 25000, tracking_status: "ok" }, health: 50 },
  // broken tracking with real spend => fix-tracking
  { label: "broken tracking", row: { spend: 1800, clicks: 540, purchases: 0, leads: 0, impressions: 90000, reach: 40000, tracking_status: "broken" }, health: 30 },
  // spend with zero results, tracking nominally ok => fix-tracking
  { label: "spend zero results", row: { spend: 600, clicks: 300, purchases: 0, leads: 0, impressions: 30000, reach: 16000, tracking_status: "ok" }, health: 40 },
  // below the decision floor => insufficient-data
  { label: "below floor", row: { spend: 50, clicks: 10, purchases: 1, revenue: 200, impressions: 2000, reach: 1500, tracking_status: "ok" }, health: 60 },
  // implausible ROAS => fix-tracking (anomaly)
  { label: "roas anomaly", row: { spend: 500, clicks: 400, purchases: 20, revenue: 60000, impressions: 50000, reach: 25000, tracking_status: "ok" }, health: 90 },
  // frequency fatigue with low CTR => refresh
  { label: "fatigue", row: { spend: 1000, clicks: 200, purchases: 18, revenue: 3000, impressions: 60000, reach: 12000, frequency: 5, ctr: 0.003, tracking_status: "ok" }, ctrPeak: 0.02, health: 70 },
  // leads but no sales => keep / route to lead-quality review
  { label: "leads no sales", row: { spend: 600, clicks: 300, leads: 40, purchases: 0, revenue: 0, impressions: 30000, reach: 16000, tracking_status: "ok" }, health: 70 },
];

describe("decisions — safety invariant across fixtures", () => {
  for (const { label, row, ctrPeak, health } of rows) {
    const d = decide(row, cfg, ctrPeak, health);

    it(`[${label}] is always a safe proposal`, () => {
      expect(d.safe).toBe(true);
    });

    it(`[${label}] verdict is in the safe set`, () => {
      expect(SAFE_VERDICTS).toContain(d.verdict);
    });

    it(`[${label}] proposal never contains the word "delete"`, () => {
      expect(d.proposal.toLowerCase()).not.toContain("delete");
      expect(d.reason.toLowerCase()).not.toContain("delete");
    });
  }
});

describe("decisions — branch behaviour", () => {
  const find = (label: string) => rows.find((r) => r.label === label)!;
  const run = (label: string) => {
    const f = find(label);
    return decide(f.row, cfg, f.ctrPeak, f.health);
  };

  it("a kill verdict proposes Pause (reversible), not delete", () => {
    const d = run("cpa blown");
    expect(d.verdict).toBe("kill");
    expect(d.proposal).toMatch(/pause/i);
    expect(d.proposal.toLowerCase()).not.toContain("delete");
  });

  it("scale happens only when CPA<=BE AND health>=70 AND tracking ok", () => {
    const d = run("winner clean high-health");
    expect(d.verdict).toBe("scale");

    // same economics but low health => not scale (keep)
    const lowHealth = run("good cpa low health");
    expect(lowHealth.verdict).not.toBe("scale");
    expect(lowHealth.verdict).toBe("keep");

    // same economics, high health, but tracking not "ok" => not scale
    const winner = find("winner clean high-health");
    const dirtyTracking = decide({ ...winner.row, tracking_status: "partial" }, cfg, undefined, 88);
    expect(dirtyTracking.verdict).not.toBe("scale");
  });

  it("broken tracking => fix-tracking, never scale", () => {
    const d = run("broken tracking");
    expect(d.verdict).toBe("fix-tracking");
    expect(d.verdict).not.toBe("scale");
  });

  it("spend with zero recorded results => fix-tracking", () => {
    expect(run("spend zero results").verdict).toBe("fix-tracking");
  });

  it("implausible ROAS is treated as a tracking anomaly (fix-tracking)", () => {
    expect(run("roas anomaly").verdict).toBe("fix-tracking");
  });

  it("below the decision floor => insufficient-data (no keep/kill/scale)", () => {
    expect(run("below floor").verdict).toBe("insufficient-data");
  });

  it("creative fatigue => refresh proposing PAUSED duplicates", () => {
    const d = run("fatigue");
    expect(d.verdict).toBe("refresh");
    expect(d.proposal.toLowerCase()).toContain("paused");
  });

  it("leads but no sales => keep and route to lead-quality / offer review", () => {
    const d = run("leads no sales");
    expect(d.verdict).toBe("keep");
    expect(d.reason.toLowerCase()).toMatch(/lead quality|qualification|offer/);
  });
});
