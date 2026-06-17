import { describe, it, expect } from "vitest";
import { featuresFor, can, requiredPlan, FEATURE_MIN_PLAN, FEATURE_DESC, PLAN_RANK, type Plan, type Feature } from "./entitlements";

// The tier-comparison matrix + nav lock badges are driven off these helpers. Lock the invariants
// (monotone, genuinely-differentiated tiers; correct required-plan) without a DOM render harness.
describe("featuresFor (tier matrix driver)", () => {
  const ladder: Plan[] = ["free", "starter", "pro", "expert"];

  it("free has the fewest, expert has all", () => {
    const all = Object.keys(FEATURE_MIN_PLAN) as Feature[];
    expect(featuresFor("expert").sort()).toEqual([...all].sort());
    expect(featuresFor("free").length).toBeLessThan(featuresFor("expert").length);
  });

  it("is monotonic across the ladder (a higher tier never offers fewer)", () => {
    for (let i = 1; i < ladder.length; i++) {
      expect(featuresFor(ladder[i - 1]).length).toBeLessThanOrEqual(featuresFor(ladder[i]).length);
    }
  });

  it("every step up unlocks at least one new feature (real differentiation)", () => {
    for (let i = 1; i < ladder.length; i++) {
      const gained = featuresFor(ladder[i]).filter((f) => !can(ladder[i - 1], f));
      expect(gained.length, `${ladder[i]} adds nothing over ${ladder[i - 1]}`).toBeGreaterThan(0);
    }
  });

  it("every feature has a non-empty benefit line for the matrix subtext", () => {
    for (const f of Object.keys(FEATURE_MIN_PLAN) as Feature[]) {
      expect(FEATURE_DESC[f]?.trim().length, `${f} has no description`).toBeGreaterThan(0);
    }
  });

  it("the nav lock badge uses the true required plan", () => {
    expect(PLAN_RANK[requiredPlan("ai_team")]).toBe(PLAN_RANK.pro);
    expect(requiredPlan("white_label")).toBe("expert");
    expect(requiredPlan("reports")).toBe("starter");
  });
});
