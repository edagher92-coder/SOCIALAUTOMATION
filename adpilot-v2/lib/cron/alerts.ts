// Threshold-alert rule library — pure + testable. Evaluates synced snapshots against objective
// thresholds and returns dedup'd hits. Read-only: alerts inform; they never change an ad.
// Used by the scheduled scoring path (lib/cron/score.ts) on top of the coarse CRITICAL breaches.

export type AlertSeverity = "warning" | "critical";

export interface AlertHit {
  rule_id: string;
  severity: AlertSeverity;
  campaign_name: string;
  metric: string;
  value: number | null;
  threshold: number;
  message: string;
  dedupe_key: string; // rule + campaign — one hit per campaign per run
}

export interface AlertThresholds {
  frequency_warning: number;   // fatigue watch
  frequency_critical: number;
  ctr_floor: number;           // fraction (0.008 = 0.8%)
  min_impressions: number;     // ignore tiny samples
  zero_conversion_spend: number; // $ spent with 0 leads & 0 purchases
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  frequency_warning: 4,
  frequency_critical: 6,
  ctr_floor: 0.008,
  min_impressions: 500,
  zero_conversion_spend: 20,
};

type Snap = Record<string, any>;

// Aggregate snapshots to one row per campaign (sum spend/impressions/leads/purchases; max frequency).
function byCampaign(snaps: Snap[]): Map<string, { name: string; spend: number; impressions: number; clicks: number; leads: number; purchases: number; frequency: number | null; ctr: number | null }> {
  const m = new Map<string, any>();
  for (const s of snaps) {
    const name = s.campaign_name || "(campaign)";
    const cur = m.get(name) || { name, spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, frequency: null, ctr: null };
    cur.spend += Number(s.spend) || 0;
    cur.impressions += Number(s.impressions) || 0;
    cur.clicks += Number(s.clicks) || 0;
    cur.leads += Number(s.leads) || 0;
    cur.purchases += Number(s.purchases) || 0;
    if (s.frequency != null) cur.frequency = Math.max(cur.frequency ?? 0, Number(s.frequency));
    m.set(name, cur);
  }
  // derive ctr from the aggregate
  for (const c of m.values()) c.ctr = c.impressions > 0 ? c.clicks / c.impressions : null;
  return m;
}

export function evaluateAlertRules(snaps: Snap[], thresholds: AlertThresholds = DEFAULT_THRESHOLDS): AlertHit[] {
  const hits: AlertHit[] = [];
  if (!Array.isArray(snaps) || snaps.length === 0) return hits;
  const push = (h: Omit<AlertHit, "dedupe_key">) => hits.push({ ...h, dedupe_key: `${h.rule_id}:${h.campaign_name}` });

  for (const c of byCampaign(snaps).values()) {
    // Creative fatigue (frequency)
    if (c.frequency != null && c.frequency >= thresholds.frequency_critical) {
      push({ rule_id: "frequency", severity: "critical", campaign_name: c.name, metric: "frequency", value: c.frequency, threshold: thresholds.frequency_critical, message: `High frequency (${c.frequency.toFixed(1)}) on "${c.name}" — likely creative fatigue. Propose refreshing the creative as a paused duplicate.` });
    } else if (c.frequency != null && c.frequency >= thresholds.frequency_warning) {
      push({ rule_id: "frequency", severity: "warning", campaign_name: c.name, metric: "frequency", value: c.frequency, threshold: thresholds.frequency_warning, message: `Frequency climbing (${c.frequency.toFixed(1)}) on "${c.name}" — watch for fatigue.` });
    }
    // Spend with zero recorded conversions (after the WS8 fix this means a real tracking/offer issue)
    if (c.spend >= thresholds.zero_conversion_spend && c.leads === 0 && c.purchases === 0) {
      push({ rule_id: "zero_conversion_spend", severity: "critical", campaign_name: c.name, metric: "spend", value: c.spend, threshold: thresholds.zero_conversion_spend, message: `"${c.name}" has spent $${c.spend.toFixed(0)} with zero recorded conversions — check tracking first, then offer/creative. Do not scale.` });
    }
    // Weak CTR on a meaningful sample
    if (c.ctr != null && c.impressions >= thresholds.min_impressions && c.ctr < thresholds.ctr_floor) {
      push({ rule_id: "low_ctr", severity: "warning", campaign_name: c.name, metric: "ctr", value: c.ctr, threshold: thresholds.ctr_floor, message: `Low CTR (${(c.ctr * 100).toFixed(2)}%) on "${c.name}" — likely a hook/creative/audience-fit problem.` });
    }
  }
  return hits;
}
