import { describe, it, expect } from "vitest";
import { PLANS, planPriceLabel, planAnnualLabel, planById } from "./plans";
import { can, PLAN_RANK, type Plan } from "./entitlements";

// DRIFT ALARM: marketing copy (PLANS) must never advertise a feature a tier can't actually use.
// Every headline feature must be gated at-or-below its plan in entitlements.ts.
describe("PLANS ↔ entitlements coherence", () => {
  it("covers all four tiers exactly once, low→high", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["free", "starter", "pro", "expert"]);
  });

  it("every headline feature is unlocked at that tier (no over-promise)", () => {
    for (const card of PLANS) {
      for (const f of card.headlineFeatures) {
        expect(can(card.id as Plan, f), `${card.id} advertises ${f} it cannot use`).toBe(true);
      }
    }
  });

  it("labels free as Free and shows the owner-confirmed AUD figures", () => {
    expect(planPriceLabel(planById("free")!)).toBe("Free");
    expect(planPriceLabel(planById("starter")!)).toBe("$49/mo AUD");
    expect(planPriceLabel(planById("pro")!)).toBe("$149/mo AUD");
    expect(planPriceLabel(planById("expert")!)).toBe("$399/mo AUD");
  });

  it("annual label shows ~2-months-free savings for paid tiers, empty for Free", () => {
    expect(planAnnualLabel(planById("free")!)).toBe("");
    // $1,490/yr vs $149×12=$1,788 → ~17% saving.
    expect(planAnnualLabel(planById("pro")!)).toBe("or $1,490/yr — save ~17%");
  });

  it("only the top tier carries the highest-ranked features", () => {
    const expert = planById("expert")!;
    // white_label is expert-only; assert no lower tier advertises it.
    for (const card of PLANS) {
      if (card.id !== "expert") expect(card.headlineFeatures).not.toContain("white_label");
    }
    expect(expert.headlineFeatures).toContain("white_label");
    expect(PLAN_RANK[expert.id]).toBe(3);
  });
});
