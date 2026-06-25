// AdPilot OS V2 — engine barrel. Same logic as the parity-tested demo engine.
export * as metrics from "./metrics";
export * from "./types";
export { HEALTH_WEIGHTS, computeHealth, band, weightsSum } from "./health";
export { scoreAccount, scoreByCampaign, aggregate } from "./audit";
export { decide } from "./decisions";
export { parseCsvText } from "./ingest";
export { detectPlatform } from "./schema";

import type { Row, Cfg } from "./types";
import { scoreAccount, scoreByCampaign } from "./audit";
import { decide } from "./decisions";
import { predictFatigue, type FatiguePoint } from "./fatigue";
import { detectLatestAnomaly, type MetricAnomaly } from "./anomaly";
import * as M from "./metrics";

export interface AdFatigue {
  ad: string;
  status: "watch" | "fatigued";
  onsetDaysAgo: number | null;
  dropPct: number | null;
  confidence: "low" | "moderate" | "high" | null;
  reason: string;
}

// Per-ad creative-fatigue diagnostic (read-only, additive). Group the daily rows by ad, build the
// engagement series oldest→newest, and run the change-point fatigue detector. Surfaces ONLY the ads
// on WATCH or FATIGUED with the pinned onset — never a health-score or verdict input.
function fatigueByAd(rows: Row[]): AdFatigue[] {
  const groups: Record<string, Row[]> = {};
  for (const r of rows) {
    const k = (r.ad_id || r.ad_name || r.campaign_name || "(ad)") as string;
    (groups[k] = groups[k] || []).push(r);
  }
  const out: AdFatigue[] = [];
  for (const [ad, grp] of Object.entries(groups)) {
    if (grp.length < 3) continue; // need daily history to detect a change point
    const series: FatiguePoint[] = [...grp]
      .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")))
      .map((r) => ({
        ctr: Number(r.ctr),
        holdRate: r.hold_rate != null ? Number(r.hold_rate) : null,
        frequency: r.frequency != null ? Number(r.frequency) : null,
      }));
    const f = predictFatigue(series);
    if (f.status === "healthy") continue;
    out.push({
      ad: (grp[0].ad_name || grp[0].campaign_name || ad) as string,
      status: f.status,
      onsetDaysAgo: f.onset?.daysAgo ?? null,
      dropPct: f.onset?.dropPct ?? null,
      confidence: f.onset?.confidenceLabel ?? null,
      reason: f.reason,
    });
  }
  // Worst first: fatigued before watch.
  out.sort((a, b) => (a.status === "fatigued" ? 0 : 1) - (b.status === "fatigued" ? 0 : 1));
  return out;
}

// Account-level "sudden change" scan (read-only, additive). Aggregate the per-ad rows into ONE daily
// account series, then check whether the latest day is a robust anomaly (median/MAD) on each headline
// metric. Surfaces only the HARMFUL moves (cost spiking up / efficiency dropping). Distinct from the
// per-ad fatigue scan: this catches an account-wide jolt (a CPL/spend spike today), not creative decay.
function anomaliesByDay(rows: Row[]): MetricAnomaly[] {
  const byDate: Record<string, { spend: number; impressions: number; clicks: number; leads: number; purchases: number; revenue: number }> = {};
  for (const r of rows) {
    const d = String(r.date ?? "");
    if (!d) continue;
    const a = (byDate[d] = byDate[d] || { spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0 });
    a.spend += Number(r.spend) || 0;
    a.impressions += Number(r.impressions) || 0;
    a.clicks += Number(r.clicks) || 0;
    a.leads += Number(r.leads) || 0;
    a.purchases += Number(r.purchases) || 0;
    a.revenue += Number(r.revenue) || 0;
  }
  const dates = Object.keys(byDate).sort();
  if (dates.length < 6) return []; // need a baseline window before a "latest day" means anything
  const day = dates.map((d) => byDate[d]);
  // Ratio metrics only count days with a non-zero denominator (a 0-lead day has no defined CPL).
  const series: Record<string, number[]> = {
    spend: day.map((x) => x.spend),
    cpl: day.filter((x) => x.leads > 0).map((x) => x.spend / x.leads),
    cpa: day.filter((x) => x.purchases > 0).map((x) => x.spend / x.purchases),
    cpc: day.filter((x) => x.clicks > 0).map((x) => x.spend / x.clicks),
    cpm: day.filter((x) => x.impressions > 0).map((x) => (x.spend / x.impressions) * 1000),
    ctr: day.filter((x) => x.impressions > 0).map((x) => x.clicks / x.impressions),
    roas: day.filter((x) => x.spend > 0).map((x) => x.revenue / x.spend),
  };
  const out: MetricAnomaly[] = [];
  for (const [metric, xs] of Object.entries(series)) {
    const a = detectLatestAnomaly(metric, xs);
    if (a && a.bad) out.push(a);
  }
  out.sort((a, b) => b.zMad - a.zMad); // most severe first
  return out;
}

/** One-call analysis used by the API route. */
export function analyse(rows: Row[], cfg: Cfg) {
  const res = scoreAccount(rows, cfg);
  const campaigns = scoreByCampaign(rows, cfg);

  // Per-campaign verdict context. `scale` is only ever proposed for a winner whose OWN campaign is
  // healthy (≥70) — not merely the account average — and creative-fatigue (`refresh`) needs that
  // campaign's peak CTR to detect a real drop. Grouped by the same key scoreByCampaign uses, so a
  // row's decision is gated on its campaign, not the whole account.
  const campKey = (r: Row) => r.campaign_name || r.campaign_id || "(unnamed)";
  const campHealth: Record<string, number> = {};
  for (const c of campaigns) campHealth[c.campaign] = c.health;
  const campCtrPeak: Record<string, number> = {};
  for (const r of rows) {
    const k = campKey(r);
    const c = r.ctr != null ? r.ctr : M.ctr(r.clicks || 0, r.impressions || 0);
    if (c != null && Number.isFinite(c)) campCtrPeak[k] = Math.max(campCtrPeak[k] ?? 0, c);
  }

  const decisions = rows.map((r) => {
    const k = campKey(r);
    return {
      ...decide(r, cfg, campCtrPeak[k] ?? null, campHealth[k] ?? null),
      name: r.ad_name || r.campaign_name || r.ad_id || "(ad)",
      platform: r.platform || "?",
    };
  });

  // Meta-reported ROAS (`purchase_roas`), spend-weighted across the rows that report it. Surfaced
  // ONLY as an attribution-window cross-check beside the derived revenue/spend ROAS — it is NEVER a
  // health factor, verdict input, or a replacement for the derived value. Null unless ≥1 row reports it.
  let mrNum = 0, mrSpend = 0;
  for (const r of rows) {
    const rm = Number(r.roas_meta), sp = Number(r.spend) || 0;
    if (Number.isFinite(rm) && rm > 0 && sp > 0) { mrNum += rm * sp; mrSpend += sp; }
  }
  const roas_meta = mrSpend > 0 ? mrNum / mrSpend : null;

  return {
    config: cfg,
    summary: {
      spend: res.agg.spend, leads: res.agg.leads, purchases: res.agg.purchases, revenue: res.agg.revenue,
      // Delivery metrics — additive; cpc/cpm/cpl/frequency are not on agg, computed here via M.*.
      impressions: res.agg.impressions, reach: res.agg.reach, clicks: res.agg.clicks,
      ctr: res.agg.ctr, cpc: M.cpc(res.agg.spend, res.agg.clicks), cpm: M.cpm(res.agg.spend, res.agg.impressions),
      frequency: M.frequency(res.agg.impressions, res.agg.reach), conv_rate: res.agg.conv_rate,
      cpl: M.cpl(res.agg.spend, res.agg.leads),
      cpa: res.agg.cpa, roas: res.agg.roas, roas_meta, mer: M.mer(res.agg.revenue, res.agg.spend),
      break_even_cpa: res.break_even_cpa, break_even_cpl: res.break_even_cpl ?? null, break_even_roas: M.breakEvenRoas(cfg.gross_margin),
    },
    health: { total: res.total, band: res.band, guidance: res.guidance, findings: res.findings, weakest: res.weakest, breakdown: res.breakdown },
    campaigns,
    decisions,
    fatigue: fatigueByAd(rows),
    anomalies: anomaliesByDay(rows),
    safety: "Read-only analysis. No live ad was changed. Budget moves need a typed YES.",
  };
}
