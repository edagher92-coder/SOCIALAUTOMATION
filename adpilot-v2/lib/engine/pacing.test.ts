import { describe, it, expect } from "vitest";
import { pace, pacingScore } from "./pacing";

describe("budget pacing", () => {
  it("is Unknown (no guess) when budget or days are missing", () => {
    const p = pace({ monthlyBudget: null, spendToDate: 100, daysElapsed: 5, daysInMonth: 30 });
    expect(p.status).toBe("Unknown");
    expect(p.proRataTarget).toBeNull();
    expect(pacingScore(p)).toBeNull();
  });

  it("is Green and scores 100 when spend is on the pro-rata target", () => {
    // day 15 of 30, $1500 budget → target $750
    const p = pace({ monthlyBudget: 1500, spendToDate: 750, daysElapsed: 15, daysInMonth: 30 });
    expect(p.proRataTarget).toBe(750);
    expect(p.variance).toBe(0);
    expect(p.status).toBe("Green");
    expect(p.projectedMonthEnd).toBe(1500);
    expect(pacingScore(p)).toBe(100);
  });

  it("flags Red when materially over-pacing and projects an overspend", () => {
    // day 10 of 30, $3000 budget → target $1000, but spent $1800 (80% over)
    const p = pace({ monthlyBudget: 3000, spendToDate: 1800, daysElapsed: 10, daysInMonth: 30 });
    expect(p.variance).toBeGreaterThan(0);
    expect(p.status).toBe("Red");
    expect(p.projectedMonthEnd).toBe(5400); // 180/day × 30
    // recommend cutting daily spend (negative delta)
    expect(p.recommendedDailyDelta as number).toBeLessThan(0);
  });

  it("is Amber for moderate drift (10–25%)", () => {
    // day 10 of 30, $3000 → target $1000, spent $1200 (20% over)
    const p = pace({ monthlyBudget: 3000, spendToDate: 1200, daysElapsed: 10, daysInMonth: 30 });
    expect(p.status).toBe("Amber");
    expect(pacingScore(p)! < 100 && pacingScore(p)! > 20).toBe(true);
  });
});
