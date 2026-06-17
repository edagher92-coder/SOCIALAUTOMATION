// V6 — break-even-CPL split for lead-gen accounts. With a configured lead→sale close rate the
// engine judges CPL against a modelled break-even CPL (beCpl = avg × margin × closeRate); without
// one it keeps the conservative lead-quality routing. It never KILLs on CPL (lead-gen sales are
// often offline) — the most it proposes is a reversible reduce.
import { describe, it, expect } from "vitest";
import { decide } from "./decisions";
import { breakEvenCpl } from "./metrics";
import type { Cfg, Row } from "./types";

const base = { average_sale_value: 200, gross_margin: 0.6 }; // break-even CPA = 120
const withRate: Cfg = { ...base, lead_close_rate: 0.1 };     // break-even CPL = 12
const noRate: Cfg = { ...base };

describe("breakEvenCpl metric", () => {
  it("is avg × margin × closeRate when a positive close rate is given", () => {
    expect(breakEvenCpl(200, 0.6, 0.1)).toBeCloseTo(12, 6);
  });
  it("is null without a positive close rate", () => {
    expect(breakEvenCpl(200, 0.6, null)).toBeNull();
    expect(breakEvenCpl(200, 0.6, 0)).toBeNull();
  });
});

describe("decisions — break-even-CPL split (lead-gen)", () => {
  it("reduces when CPL is well above the modelled break-even CPL", () => {
    const row: Row = { spend: 600, leads: 20, purchases: 0, revenue: 0, tracking_status: "ok" }; // CPL 30 > 1.5×12
    const d = decide(row, withRate, undefined, 60);
    expect(d.verdict).toBe("reduce");
    expect(d.proposal.toLowerCase()).not.toContain("delete");
    expect(d.safe).toBe(true);
  });

  it("keeps (verify tracking) when CPL is within the modelled break-even CPL", () => {
    const row: Row = { spend: 200, leads: 40, purchases: 0, revenue: 0, tracking_status: "ok" }; // CPL 5 ≤ 12
    const d = decide(row, withRate, undefined, 60);
    expect(d.verdict).toBe("keep");
    expect(d.reason.toLowerCase()).toContain("within the modelled break-even");
  });

  it("never kills on CPL — a borderline CPL is a keep, not a kill", () => {
    const row: Row = { spend: 300, leads: 20, purchases: 0, revenue: 0, tracking_status: "ok" }; // CPL 15, between 12 and 18
    const d = decide(row, withRate, undefined, 60);
    expect(d.verdict).toBe("keep");
    expect(d.reason.toLowerCase()).toContain("modestly above");
  });

  it("falls back to the lead-quality routing when no close rate is configured", () => {
    const row: Row = { spend: 600, leads: 40, purchases: 0, revenue: 0, tracking_status: "ok" };
    const d = decide(row, noRate, undefined, 60);
    expect(d.verdict).toBe("keep");
    expect(d.reason.toLowerCase()).toMatch(/lead quality|qualification|offer/);
  });
});
