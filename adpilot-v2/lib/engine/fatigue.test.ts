import { describe, it, expect } from "vitest";
import { predictFatigue, type FatiguePoint } from "./fatigue";

const flat = (ctr: number, n: number, extra: Partial<FatiguePoint> = {}): FatiguePoint[] =>
  Array.from({ length: n }, () => ({ ctr, ...extra }));

describe("predictFatigue", () => {
  it("is healthy with stable CTR and stable hold-rate", () => {
    const r = predictFatigue(flat(0.02, 10, { holdRate: 0.45, frequency: 2 }));
    expect(r.status).toBe("healthy");
  });

  it("needs ≥3 points", () => {
    expect(predictFatigue([{ ctr: 0.02 }, { ctr: 0.02 }]).status).toBe("healthy");
  });

  it("flags FATIGUED when frequency is high and CTR is falling", () => {
    const series: FatiguePoint[] = Array.from({ length: 8 }, (_, i) => ({ ctr: 0.03 - i * 0.003, frequency: 5, holdRate: 0.4 }));
    const r = predictFatigue(series);
    expect(r.status).toBe("fatigued");
    expect(r.daysToFatigue).toBe(0);
  });

  it("gives a predictive WATCH when hold-rate falls while CTR still holds (leading signal)", () => {
    // CTR roughly flat, hold-rate clearly declining
    const series: FatiguePoint[] = Array.from({ length: 8 }, (_, i) => ({ ctr: 0.02, holdRate: 0.5 - i * 0.03, frequency: 2.5 }));
    const r = predictFatigue(series);
    expect(r.status).toBe("watch");
    expect(r.holdTrend).toBe("falling");
  });

  it("forecasts days-to-fatigue for a steadily declining CTR", () => {
    const series: FatiguePoint[] = Array.from({ length: 6 }, (_, i) => ({ ctr: 0.02 - i * 0.001, frequency: 2 }));
    const r = predictFatigue(series);
    expect(["watch", "fatigued"]).toContain(r.status);
    expect(r.daysToFatigue == null || r.daysToFatigue >= 0).toBe(true);
  });
});
