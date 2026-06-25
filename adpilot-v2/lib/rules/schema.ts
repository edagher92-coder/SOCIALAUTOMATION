import "server-only";

// P5.2 — configurable rules engine: type surface.
//
// A rule is DATA, evaluated by a pure function (lib/rules/evaluator.ts). It NEVER changes an ad — a
// fired rule produces an alert/proposal that is inert until a human acts. Two operator families:
//   • absolute   — compare the window-aggregate metric to a fixed threshold (gt/gte/lt/lte/eq)
//   • rolling    — compare the latest day to its own recent baseline (robust z-score, or WoW % change)
// Rolling operators are ALWAYS paired with a min-volume gate (the principled false-CRITICAL fix:
// a thin/learning-phase day can't trip a baseline alarm).

export type RuleMetric =
  | "spend" | "cpl" | "cpa" | "cpc" | "cpm" | "ctr" | "roas" | "frequency"
  | "leads" | "purchases" | "conversions";

export type RuleOperator =
  | "gt" | "gte" | "lt" | "lte" | "eq"          // absolute threshold
  | "zscore_gt" | "zscore_lt"                    // robust z-score (median/MAD) vs baseline window
  | "pct_change_gt" | "pct_change_lt";           // week-over-week % change (fraction)

export type RuleSeverity = "info" | "warning" | "critical";
export type RuleScope = "account" | "campaign" | "ad";

export interface AlertRule {
  id: string;                  // preset id (ALT-001) or DB uuid
  name: string;
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;           // absolute value · z-score k (MADs) · or fraction for pct_change
  window_days?: number;        // baseline window for rolling operators (default 7)
  min_volume_gate?: number;    // min impressions before the rule may fire (absolute: window total; rolling: latest day)
  min_spend_gate?: number;     // optional: only fire when spend ≥ this (e.g. zero-conversion-spend)
  severity: RuleSeverity;
  scope: RuleScope;
  platform?: "meta" | "tiktok" | null; // null/undefined = any platform
  enabled: boolean;
  message?: string;            // optional custom message (else a default is built)
  group?: string | null;       // AND-group id — a grouped rule fires only when the whole group fires
  group_logic?: "and" | null;  // only "and" (collective anomaly) is supported
}

export interface RuleHit {
  rule_id: string;
  rule_name: string;
  severity: RuleSeverity;
  scope: RuleScope;
  entity: string;              // "account" | campaign name | ad name
  metric: RuleMetric;
  operator: RuleOperator;
  value: number | null;
  baseline: number | null;     // baseline for rolling operators (median / prior-week mean)
  threshold: number;
  message: string;
  dedupe_key: string;          // rule + entity — one hit per entity per run
  proposal: true;              // ALWAYS a proposal: inert until a human acts (read-only invariant)
}

export const ROLLING_OPERATORS: RuleOperator[] = ["zscore_gt", "zscore_lt", "pct_change_gt", "pct_change_lt"];
export function isRolling(op: RuleOperator): boolean {
  return ROLLING_OPERATORS.includes(op);
}
