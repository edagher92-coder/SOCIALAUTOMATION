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
import * as M from "./metrics";

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
  return {
    config: cfg,
    summary: {
      spend: res.agg.spend, leads: res.agg.leads, purchases: res.agg.purchases, revenue: res.agg.revenue,
      // Delivery metrics — additive; cpc/cpm/cpl/frequency are not on agg, computed here via M.*.
      impressions: res.agg.impressions, reach: res.agg.reach, clicks: res.agg.clicks,
      ctr: res.agg.ctr, cpc: M.cpc(res.agg.spend, res.agg.clicks), cpm: M.cpm(res.agg.spend, res.agg.impressions),
      frequency: M.frequency(res.agg.impressions, res.agg.reach), conv_rate: res.agg.conv_rate,
      cpl: M.cpl(res.agg.spend, res.agg.leads),
      cpa: res.agg.cpa, roas: res.agg.roas, mer: M.mer(res.agg.revenue, res.agg.spend),
      break_even_cpa: res.break_even_cpa, break_even_cpl: res.break_even_cpl ?? null, break_even_roas: M.breakEvenRoas(cfg.gross_margin),
    },
    health: { total: res.total, band: res.band, guidance: res.guidance, findings: res.findings, weakest: res.weakest, breakdown: res.breakdown },
    campaigns,
    decisions,
    safety: "Read-only analysis. No live ad was changed. Budget moves need a typed YES.",
  };
}
