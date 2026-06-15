import { describe, it, expect } from "vitest";
import {
  can,
  normalisePlan,
  requiredPlan,
  PLAN_RANK,
  FEATURE_MIN_PLAN,
  type Plan,
} from "./entitlements";

describe("normalisePlan", () => {
  it("passes through the known tiers (case/space-insensitive)", () => {
    expect(normalisePlan("free")).toBe("free");
    expect(normalisePlan("starter")).toBe("starter");
    expect(normalisePlan("pro")).toBe("pro");
    expect(normalisePlan("expert")).toBe("expert");
    expect(normalisePlan("PRO")).toBe("pro");
    expect(normalisePlan("  Starter  ")).toBe("starter");
  });

  it("aliases 'agency' and 'enterprise' to 'expert'", () => {
    expect(normalisePlan("agency")).toBe("expert");
    expect(normalisePlan("AGENCY")).toBe("expert");
    expect(normalisePlan(" enterprise ")).toBe("expert");
  });

  it("defaults unknown / empty / nullish values to 'free'", () => {
    expect(normalisePlan("wizard")).toBe("free");
    expect(normalisePlan("")).toBe("free");
    expect(normalisePlan(undefined)).toBe("free");
    expect(normalisePlan(null)).toBe("free");
  });
});

describe("PLAN_RANK ordering", () => {
  it("ranks low → high: free < starter < pro < expert", () => {
    expect(PLAN_RANK.free).toBe(0);
    expect(PLAN_RANK.starter).toBe(1);
    expect(PLAN_RANK.pro).toBe(2);
    expect(PLAN_RANK.expert).toBe(3);
    expect(PLAN_RANK.free).toBeLessThan(PLAN_RANK.starter);
    expect(PLAN_RANK.starter).toBeLessThan(PLAN_RANK.pro);
    expect(PLAN_RANK.pro).toBeLessThan(PLAN_RANK.expert);
  });
});

describe("can", () => {
  it("free unlocks only free-tier features", () => {
    expect(can("free", "csv_import")).toBe(true);
    expect(can("free", "health_score")).toBe(true);
    expect(can("free", "reports")).toBe(false);
    expect(can("free", "api_connect")).toBe(false);
    expect(can("free", "expert_plugins")).toBe(false);
  });

  it("starter unlocks free + starter features but not pro/expert", () => {
    expect(can("starter", "csv_import")).toBe(true);
    expect(can("starter", "reports")).toBe(true);
    expect(can("starter", "content_publish")).toBe(true);
    expect(can("starter", "api_connect")).toBe(false);
    expect(can("starter", "creative_studio")).toBe(false);
    expect(can("starter", "white_label")).toBe(false);
  });

  it("pro unlocks pro-and-below features but not expert-only", () => {
    expect(can("pro", "api_connect")).toBe(true);
    expect(can("pro", "auto_sync")).toBe(true);
    expect(can("pro", "ai_team")).toBe(true);
    expect(can("pro", "creative_studio")).toBe(true);
    expect(can("pro", "multi_client")).toBe(true);
    expect(can("pro", "messenger_automation")).toBe(false);
    expect(can("pro", "white_label")).toBe(false);
    expect(can("pro", "expert_plugins")).toBe(false);
  });

  it("expert unlocks every feature", () => {
    for (const feature of Object.keys(FEATURE_MIN_PLAN) as Array<keyof typeof FEATURE_MIN_PLAN>) {
      expect(can("expert", feature)).toBe(true);
    }
  });

  it("is monotonic: a higher plan never loses access a lower plan had", () => {
    const ladder: Plan[] = ["free", "starter", "pro", "expert"];
    for (const feature of Object.keys(FEATURE_MIN_PLAN) as Array<keyof typeof FEATURE_MIN_PLAN>) {
      for (let i = 1; i < ladder.length; i++) {
        if (can(ladder[i - 1], feature)) {
          expect(can(ladder[i], feature)).toBe(true);
        }
      }
    }
  });
});

describe("requiredPlan", () => {
  it("returns the minimum plan that unlocks a feature", () => {
    expect(requiredPlan("csv_import")).toBe("free");
    expect(requiredPlan("reports")).toBe("starter");
    expect(requiredPlan("api_connect")).toBe("pro");
    expect(requiredPlan("creative_studio")).toBe("pro");
    expect(requiredPlan("messenger_automation")).toBe("expert");
    expect(requiredPlan("white_label")).toBe("expert");
    expect(requiredPlan("expert_plugins")).toBe("expert");
  });

  it("the returned plan actually satisfies can() and the tier below does not (when one exists)", () => {
    const ladder: Plan[] = ["free", "starter", "pro", "expert"];
    for (const feature of Object.keys(FEATURE_MIN_PLAN) as Array<keyof typeof FEATURE_MIN_PLAN>) {
      const req = requiredPlan(feature);
      expect(can(req, feature)).toBe(true);
      const idx = ladder.indexOf(req);
      if (idx > 0) {
        expect(can(ladder[idx - 1], feature)).toBe(false);
      }
    }
  });
});
