import "server-only";
import { median, mad, mean } from "@/lib/engine/timeseries";
import { type AlertRule, type RuleHit, type RuleMetric, type RuleOperator, type RuleScope, isRolling } from "./schema";

// P5.2 — pure rules evaluator. No I/O; null-safe; never throws. Mirrors lib/cron/alerts.ts testability.
// Read-only: every hit is a proposal (inert until a human acts).

type Snap = Record<string, any>;
interface DayAgg {
  date: string; spend: number; impressions: number; clicks: number;
  leads: number; purchases: number; revenue: number; frequency: number | null;
}

function entityKeyOf(scope: RuleScope, s: Snap): string {
  if (scope === "account") return "account";
  if (scope === "campaign") return String(s.campaign_name || "(campaign)");
  return String(s.ad_name || s.ad_id || s.campaign_name || "(ad)");
}

const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Group snaps into entity → (date → aggregate). Sums additive fields; frequency is the day's max.
function aggregate(snaps: Snap[], scope: RuleScope): Map<string, Map<string, DayAgg>> {
  const out = new Map<string, Map<string, DayAgg>>();
  for (const s of snaps) {
    const ent = entityKeyOf(scope, s);
    const date = String(s.date ?? "");
    if (!date) continue;
    let days = out.get(ent);
    if (!days) { days = new Map(); out.set(ent, days); }
    const a = days.get(date) || { date, spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0, frequency: null };
    a.spend += num(s.spend); a.impressions += num(s.impressions); a.clicks += num(s.clicks);
    a.leads += num(s.leads); a.purchases += num(s.purchases); a.revenue += num(s.revenue);
    if (s.frequency != null) a.frequency = Math.max(a.frequency ?? 0, num(s.frequency));
    days.set(date, a);
  }
  return out;
}

function sumAgg(days: DayAgg[]): DayAgg {
  const t: DayAgg = { date: "", spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0, frequency: null };
  for (const d of days) {
    t.spend += d.spend; t.impressions += d.impressions; t.clicks += d.clicks;
    t.leads += d.leads; t.purchases += d.purchases; t.revenue += d.revenue;
    if (d.frequency != null) t.frequency = Math.max(t.frequency ?? 0, d.frequency);
  }
  return t;
}

function metricValue(metric: RuleMetric, a: DayAgg): number | null {
  switch (metric) {
    case "spend": return a.spend;
    case "leads": return a.leads;
    case "purchases": return a.purchases;
    case "conversions": return a.leads + a.purchases;
    case "cpl": return a.leads > 0 ? a.spend / a.leads : null;
    case "cpa": return a.purchases > 0 ? a.spend / a.purchases : null;
    case "cpc": return a.clicks > 0 ? a.spend / a.clicks : null;
    case "cpm": return a.impressions > 0 ? (a.spend / a.impressions) * 1000 : null;
    case "ctr": return a.impressions > 0 ? a.clicks / a.impressions : null;
    case "roas": return a.spend > 0 ? a.revenue / a.spend : null;
    case "frequency": return a.frequency;
    default: return null;
  }
}

function fmt(v: number | null): string {
  if (v == null) return "n/a";
  return Math.abs(v) < 1 && v !== 0 ? v.toFixed(4) : (Math.round(v * 100) / 100).toLocaleString();
}

function buildMessage(rule: AlertRule, entity: string, value: number | null, baseline: number | null): string {
  if (rule.message) return rule.message;
  const where = rule.scope === "account" ? "the account" : `"${entity}"`;
  const head = `${rule.name}: ${rule.metric} ${fmt(value)}`;
  const tail = "Read-only proposal — investigate before acting; nothing changes without a typed YES.";
  return baseline != null
    ? `${head} vs baseline ${fmt(baseline)} on ${where} — ${rule.severity.toUpperCase()}. ${tail}`
    : `${head} crossed ${fmt(rule.threshold)} on ${where} — ${rule.severity.toUpperCase()}. ${tail}`;
}

// Evaluate one rule against one entity's day series (sorted oldest→newest). Returns a hit or null.
function evalOnEntity(rule: AlertRule, entity: string, days: DayAgg[]): RuleHit | null {
  if (!days.length) return null;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const total = sumAgg(sorted);
  const rolling = isRolling(rule.operator);

  // Min-volume / min-spend gate. Rolling ops gate the LATEST day (the principled false-CRITICAL fix);
  // absolute ops gate the window total.
  const gateImpr = rolling ? (sorted[sorted.length - 1]?.impressions ?? 0) : total.impressions;
  if (rule.min_volume_gate != null && gateImpr < rule.min_volume_gate) return null;
  if (rule.min_spend_gate != null && total.spend < rule.min_spend_gate) return null;

  let value: number | null = null;
  let baseline: number | null = null;
  let fire = false;

  if (!rolling) {
    value = metricValue(rule.metric, total);
    if (value == null) return null;
    switch (rule.operator) {
      case "gt":  fire = value > rule.threshold; break;
      case "gte": fire = value >= rule.threshold; break;
      case "lt":  fire = value < rule.threshold; break;
      case "lte": fire = value <= rule.threshold; break;
      case "eq":  fire = value === rule.threshold; break;
    }
  } else {
    const series = sorted.map((d) => metricValue(rule.metric, d)).filter((v): v is number => Number.isFinite(v as number));
    if (rule.operator === "zscore_gt" || rule.operator === "zscore_lt") {
      if (series.length < 5) return null;          // need a baseline + the latest point
      const latest = series[series.length - 1];
      const hist = series.slice(0, -1);
      const med = median(hist), spread = mad(hist);
      if (med == null || spread == null || spread === 0) return null; // flat → no manufactured alarm
      const z = (latest - med) / spread;           // signed
      value = latest; baseline = med;
      fire = rule.operator === "zscore_gt" ? z >= rule.threshold : z <= -rule.threshold;
    } else {
      // week-over-week % change: mean(last 7) vs mean(prior 7)
      if (series.length < 14) return null;
      const last = mean(series.slice(-7)), prev = mean(series.slice(-14, -7));
      if (last == null || prev == null || prev === 0) return null;
      const delta = (last - prev) / prev;
      value = last; baseline = prev;
      fire = rule.operator === "pct_change_gt" ? delta >= rule.threshold : delta <= rule.threshold;
    }
  }

  if (!fire) return null;
  return {
    rule_id: rule.id, rule_name: rule.name, severity: rule.severity, scope: rule.scope,
    entity, metric: rule.metric, operator: rule.operator, value, baseline, threshold: rule.threshold,
    message: buildMessage(rule, entity, value, baseline), dedupe_key: `${rule.id}:${entity}`, proposal: true,
  };
}

// AND-group filter: a grouped rule's hit survives only when EVERY enabled member of its group also
// produced a hit on the same entity (collective anomaly). Ungrouped hits always survive.
function applyGroups(rules: AlertRule[], hits: RuleHit[]): RuleHit[] {
  const groupMembers = new Map<string, string[]>();
  for (const r of rules) {
    if (r.enabled && r.group && r.group_logic === "and") {
      groupMembers.set(r.group, [...(groupMembers.get(r.group) || []), r.id]);
    }
  }
  if (!groupMembers.size) return hits;
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  return hits.filter((h) => {
    const rule = ruleById.get(h.rule_id);
    if (!rule?.group || rule.group_logic !== "and") return true;
    const members = groupMembers.get(rule.group) || [];
    const firedHere = new Set(hits.filter((c) => c.entity === h.entity && members.includes(c.rule_id)).map((c) => c.rule_id));
    return members.every((id) => firedHere.has(id));
  });
}

export interface EvaluateOpts { platform?: "meta" | "tiktok" }

// Evaluate a rule set against synced snapshots. Returns dedup'd, group-filtered hits (proposals only).
export function evaluateRules(rules: AlertRule[], snaps: Snap[], opts: EvaluateOpts = {}): RuleHit[] {
  if (!Array.isArray(snaps) || !snaps.length) return [];
  const hits: RuleHit[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const platform = rule.platform ?? opts.platform;
    const rows = platform ? snaps.filter((s) => s.platform === platform) : snaps;
    if (!rows.length) continue;
    for (const [entity, dayMap] of aggregate(rows, rule.scope)) {
      const hit = evalOnEntity(rule, entity, [...dayMap.values()]);
      if (hit) hits.push(hit);
    }
  }
  return applyGroups(rules, hits);
}

// Dry-run preview: how many days in the trailing `lookbackDays` would this rule have fired at least
// once? Re-evaluates the rule "as of" each recent day (snaps with date ≤ that day). Cheap planning aid.
export function dryRunRule(rule: AlertRule, snaps: Snap[], lookbackDays = 14): number {
  const dates = Array.from(new Set(snaps.map((s) => String(s.date ?? "")).filter(Boolean))).sort();
  let fired = 0;
  for (const asOf of dates.slice(-lookbackDays)) {
    const upto = snaps.filter((s) => String(s.date ?? "") <= asOf);
    if (evaluateRules([{ ...rule, group: null, group_logic: null }], upto).length) fired++;
  }
  return fired;
}
