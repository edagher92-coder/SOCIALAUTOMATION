import { describe, it, expect } from "vitest";
import { recommendTests } from "./recommender";

describe("recommendTests (P6.4)", () => {
  it("returns an ICE-ranked, propose-only backlog from weak factors + break-even budget", () => {
    const payload = {
      summary: { break_even_cpa: 60 },
      health: { weakest: [{ label: "creative" }, "offer_strength", "landing_page_alignment"] },
      decisions: [{ verdict: "refresh", name: "Ad A" }],
    };
    const ideas = recommendTests(payload);
    expect(ideas.length).toBeGreaterThanOrEqual(3);
    // ICE-ranked: scores are non-increasing.
    for (let i = 1; i < ideas.length; i++) expect(ideas[i - 1].ice.score).toBeGreaterThanOrEqual(ideas[i].ice.score);
    // hook test should top the list (highest impact×ease, plus the refresh + weak-creative confidence bumps).
    expect(ideas[0].variable).toBe("hook");
    // required budget = break-even CPA × 15 conversions.
    expect(ideas[0].requiredBudgetAud).toBe(900);
    // every idea is a paused-duplicate proposal with a read-out window.
    expect(ideas.every((t) => /PAUSED DUPLICATE/.test(t.setup))).toBe(true);
    expect(ideas.every((t) => t.readoutDays >= 7 && t.readoutDays <= 14)).toBe(true);
  });

  it("deduplicates by variable and strengthens confidence on a second signal", () => {
    // 'creative' (weak factor) and a 'refresh' verdict both point at the hook test → one idea, higher confidence.
    const a = recommendTests({ health: { weakest: ["creative"] }, decisions: [] });
    const b = recommendTests({ health: { weakest: ["creative"] }, decisions: [{ verdict: "refresh" }] });
    const hookA = a.find((t) => t.variable === "hook")!;
    const hookB = b.find((t) => t.variable === "hook")!;
    expect(a.filter((t) => t.variable === "hook")).toHaveLength(1);
    expect(hookB.ice.confidence).toBeGreaterThan(hookA.ice.confidence);
  });

  it("leaves requiredBudget null when break-even CPA is unknown, and recommends nothing without signal", () => {
    expect(recommendTests({ health: { weakest: ["creative"] } })[0].requiredBudgetAud).toBeNull();
    expect(recommendTests({ health: { weakest: [] }, decisions: [] })).toEqual([]);
  });

  it("never proposes a test for a tracking problem (that's a fix, not an A/B)", () => {
    const ideas = recommendTests({ health: { weakest: ["tracking"] }, decisions: [{ verdict: "fix-tracking" }] });
    expect(ideas).toEqual([]);
  });
});
