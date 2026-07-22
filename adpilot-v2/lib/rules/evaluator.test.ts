import { describe, it, expect } from "vitest";
import { evaluateRules, dryRunRule } from "./evaluator";
import { PRESET_RULES, COLLECTIVE_EXAMPLE } from "./presets";
import type { AlertRule } from "./schema";

type Snap = Record<string, any>;
const day = (i: number) => `2026-06-${String(i + 1).padStart(2, "0")}`;
// Build N daily snaps for one meta campaign "C". `fn(i)` supplies the per-day metric fields.
function series(n: number, fn: (i: number) => Partial<Snap>): Snap[] {
  return Array.from({ length: n }, (_, i) => ({
    platform: "meta", campaign_name: "C", date: day(i),
    spend: 100, impressions: 1000, clicks: 30, leads: 10, purchases: 0, revenue: 0, frequency: 1, ...fn(i),
  }));
}
const rule = (id: string) => PRESET_RULES.find((r) => r.id === id)!;

describe("rules presets", () => {
  it("ships the 13 ALT presets, all enabled", () => {
    expect(PRESET_RULES).toHaveLength(13);
    expect(PRESET_RULES.every((r) => r.enabled)).toBe(true);
    expect(PRESET_RULES.map((r) => r.id)).toContain("ALT-013");
  });
});

describe("absolute operators", () => {
  it("frequency ≥ 6 fires the critical fatigue rule", () => {
    const hits = evaluateRules([rule("ALT-002")], series(1, () => ({ frequency: 7 })));
    expect(hits[0]?.severity).toBe("critical");
    expect(hits[0]?.value).toBe(7);
  });

  it("weak-CTR rule is suppressed below the min-volume gate and fires above it", () => {
    const thin = evaluateRules([rule("ALT-003")], series(1, () => ({ impressions: 300, clicks: 1 })));   // ctr .0033, <500 impr
    const ok = evaluateRules([rule("ALT-003")], series(1, () => ({ impressions: 1000, clicks: 3 })));    // ctr .003, ≥500 impr
    expect(thin).toHaveLength(0);
    expect(ok).toHaveLength(1);
  });

  it("zero-conversion-spend fires only past the min-spend gate", () => {
    const below = evaluateRules([rule("ALT-004")], series(1, () => ({ spend: 10, leads: 0, purchases: 0 })));
    const above = evaluateRules([rule("ALT-004")], series(1, () => ({ spend: 50, leads: 0, purchases: 0 })));
    expect(below).toHaveLength(0);
    expect(above[0]?.severity).toBe("critical");
  });

  it("separates same-named campaigns by platform and keeps the strongest threshold", () => {
    const rows = [
      ...series(1, () => ({ frequency: 7 })),
      ...series(1, () => ({ platform: "tiktok", frequency: 7 })),
    ];
    const hits = evaluateRules([rule("ALT-001"), rule("ALT-002")], rows);
    expect(hits).toHaveLength(2);
    expect(hits.every((hit) => hit.severity === "critical")).toBe(true);
    expect(hits.map((hit) => hit.entity).sort()).toEqual(["Meta · C", "TikTok · C"]);
    expect(hits[0].message).toContain("across 1 data day");
    expect(hits[0].message).toContain("AdPilot did not change a live paid ad");
  });
});

describe("rolling-baseline operators (z-score / WoW) — always volume-gated", () => {
  // Calm CPL (~$10 with variation) then a $50 spike on the last day.
  const leads = [10, 11, 9, 10, 11, 9, 10, 11, 9, 10, 11, 9, 10, 2];
  const spikeRows = (latestImpr = 1000) => series(14, (i) => ({ leads: leads[i], impressions: i === 13 ? latestImpr : 1000 }));

  it("CPL z-score spike fires on a real jolt", () => {
    const hits = evaluateRules([rule("ALT-005")], spikeRows());
    expect(hits).toHaveLength(1);
    expect(hits[0].value).toBeCloseTo(50, 0);
    expect(hits[0].baseline).toBeCloseTo(10, 0);
  });

  it("the same spike is SUPPRESSED when the latest day is below the volume gate", () => {
    const hits = evaluateRules([rule("ALT-005")], spikeRows(100)); // latest day only 100 impressions
    expect(hits).toHaveLength(0);
  });

  it("CTR dropping ≥25% week-over-week fires", () => {
    // clicks 30/day for the prior week, 20/day for the latest week → ctr 0.03 → 0.02 (−33%).
    const rows = series(14, (i) => ({ clicks: i < 7 ? 30 : 20 }));
    const hits = evaluateRules([rule("ALT-010")], rows);
    expect(hits).toHaveLength(1);
  });

  it("returns nothing with too little history for a baseline", () => {
    expect(evaluateRules([rule("ALT-005")], series(3, (i) => ({ leads: leads[i] })))).toHaveLength(0);
  });
});

describe("AND-group collective anomaly", () => {
  const leads = [10, 11, 9, 10, 11, 9, 10, 11, 9, 10, 11, 9, 10, 2]; // CPL spikes on the last day

  it("keeps grouped hits only when the whole group fires on the same entity", () => {
    // CPL spikes AND CTR drops WoW → both members fire → group satisfied.
    const both = evaluateRules(COLLECTIVE_EXAMPLE, series(14, (i) => ({ leads: leads[i], clicks: i < 7 ? 30 : 20 })));
    expect(both.length).toBe(2);
    // CPL spikes but CTR stays flat → ALT-010C doesn't fire → group not satisfied → CPL hit dropped.
    const one = evaluateRules(COLLECTIVE_EXAMPLE, series(14, (i) => ({ leads: leads[i], clicks: 30 })));
    expect(one).toHaveLength(0);
  });
});

describe("dry-run preview", () => {
  it("counts how many trailing days a rule would have fired", () => {
    const fires = dryRunRule(rule("ALT-002"), series(5, () => ({ frequency: 7 })));
    expect(fires).toBe(5);
    const never = dryRunRule(rule("ALT-013"), series(5, () => ({ spend: 100, revenue: 500 }))); // roas 5× ≥ 1
    expect(never).toBe(0);
  });
});
