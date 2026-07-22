import { describe, expect, it } from "vitest";
import { alertRuleToInsert, alertRulesForOrg, rowToAlertRule } from "./persistence";

const savedRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Meta frequency review",
  metric: "frequency",
  operator: "gte",
  threshold: "5",
  window_days: null,
  min_volume_gate: 1000,
  min_spend_gate: null,
  severity: "warning",
  scope: "campaign",
  platform: "meta",
  rule_group: null,
  group_logic: null,
  enabled: false,
  message: "Review the evidence.",
};

function adminReturning(data: unknown[], error: unknown = null) {
  const builder: any = {
    select() { return builder; },
    eq() { return builder; },
    order: async () => ({ data, error }),
  };
  return { from: () => builder };
}

describe("alert-rule persistence", () => {
  it("normalises database rows into evaluator rules", () => {
    expect(rowToAlertRule(savedRow)).toMatchObject({
      id: savedRow.id,
      threshold: 5,
      min_volume_gate: 1000,
      platform: "meta",
      enabled: false,
    });
  });

  it("treats a saved library as authoritative, including disabled rules", async () => {
    const rules = await alertRulesForOrg(adminReturning([savedRow]), "org-1");
    expect(rules).toHaveLength(1);
    expect(rules[0].enabled).toBe(false);
  });

  it("falls back to the 13 safe presets for a new or unmigrated workspace", async () => {
    expect(await alertRulesForOrg(adminReturning([]), "org-1")).toHaveLength(13);
    expect(await alertRulesForOrg(adminReturning([], new Error("missing table")), "org-1")).toHaveLength(13);
  });

  it("scopes inserts to the workspace without persisting evaluator-only fields", () => {
    expect(alertRuleToInsert(rowToAlertRule(savedRow), "org-1")).toMatchObject({
      organisation_id: "org-1",
      name: savedRow.name,
      enabled: false,
      rule_group: null,
    });
  });
});
