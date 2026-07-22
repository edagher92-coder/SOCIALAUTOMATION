import "server-only";
import type { AlertRule } from "./schema";
import { PRESET_RULES } from "./presets";

export const ALERT_RULE_COLUMNS = "id,name,metric,operator,threshold,window_days,min_volume_gate,min_spend_gate,severity,scope,platform,rule_group,group_logic,enabled,message,created_at,updated_at";

export function rowToAlertRule(row: Record<string, unknown>): AlertRule {
  return {
    id: String(row.id),
    name: String(row.name),
    metric: row.metric as AlertRule["metric"],
    operator: row.operator as AlertRule["operator"],
    threshold: Number(row.threshold),
    window_days: row.window_days == null ? undefined : Number(row.window_days),
    min_volume_gate: row.min_volume_gate == null ? undefined : Number(row.min_volume_gate),
    min_spend_gate: row.min_spend_gate == null ? undefined : Number(row.min_spend_gate),
    severity: row.severity as AlertRule["severity"],
    scope: row.scope as AlertRule["scope"],
    platform: (row.platform as AlertRule["platform"]) ?? null,
    enabled: Boolean(row.enabled),
    message: row.message ? String(row.message) : undefined,
    group: row.rule_group ? String(row.rule_group) : null,
    group_logic: row.group_logic === "and" ? "and" : null,
  };
}

export function alertRuleToInsert(rule: AlertRule, organisationId: string) {
  return {
    organisation_id: organisationId,
    name: rule.name,
    metric: rule.metric,
    operator: rule.operator,
    threshold: rule.threshold,
    window_days: rule.window_days ?? null,
    min_volume_gate: rule.min_volume_gate ?? null,
    min_spend_gate: rule.min_spend_gate ?? null,
    severity: rule.severity,
    scope: rule.scope,
    platform: rule.platform ?? null,
    rule_group: rule.group ?? null,
    group_logic: rule.group_logic ?? null,
    enabled: rule.enabled,
    message: rule.message ?? null,
  };
}

// A saved library is authoritative, including an all-disabled library. New or
// unmigrated workspaces use the safe preset set so monitoring still works.
export async function alertRulesForOrg(admin: any, organisationId: string): Promise<AlertRule[]> {
  try {
    const { data, error } = await admin.from("alert_rules")
      .select(ALERT_RULE_COLUMNS)
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: true });
    if (!error && (data?.length || 0) > 0) return (data || []).map((row: Record<string, unknown>) => rowToAlertRule(row));
  } catch { /* a pre-migration workspace falls back to presets */ }
  return PRESET_RULES;
}
