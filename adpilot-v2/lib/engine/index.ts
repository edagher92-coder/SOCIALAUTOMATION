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
  const decisions = rows.map((r) => ({
    ...decide(r, cfg),
    name: r.ad_name || r.campaign_name || r.ad_id || "(ad)",
    platform: r.platform || "?",
  }));
  return {
    config: cfg,
    summary: {
      spend: res.agg.spend, leads: res.agg.leads, purchases: res.agg.purchases, revenue: res.agg.revenue,
      cpa: res.agg.cpa, roas: res.agg.roas, mer: M.mer(res.agg.revenue, res.agg.spend),
      break_even_cpa: res.break_even_cpa, break_even_roas: M.breakEvenRoas(cfg.gross_margin),
    },
    health: { total: res.total, band: res.band, guidance: res.guidance, findings: res.findings, weakest: res.weakest, breakdown: res.breakdown },
    campaigns,
    decisions,
    safety: "Read-only analysis. No live ad was changed. Budget moves need a typed YES.",
  };
}
