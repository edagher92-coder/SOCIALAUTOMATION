// AdPilot OS V2 — safe decision engine (TS port). Proposals only; never edits a live ad.
import type { Row, Cfg, Decision } from "./types";
import * as M from "./metrics";

export function decide(row: Row, cfg: Cfg, ctrPeak?: number | null, health?: number | null): Decision {
  const g = (k: string): number => row[k] || 0;
  const spend = g("spend"), clicks = g("clicks"), leads = g("leads"), purchases = g("purchases"), revenue = g("revenue");
  const freq = row.frequency || M.frequency(g("impressions"), g("reach")) || 0;
  let curCtr: number | null = row.ctr;
  if (curCtr == null) curCtr = M.ctr(clicks, g("impressions"));
  const be = M.breakEvenCpa(cfg.average_sale_value, cfg.gross_margin);
  const cpa = M.cpa(spend, purchases), roas = M.roas(revenue, spend);
  const tracking = (row.tracking_status || "ok").toLowerCase();
  const out = (verdict: Decision["verdict"], reason: string, proposal: string): Decision => ({ verdict, reason, proposal, safe: true });

  if (tracking === "broken" || tracking === "review" || (spend > 0 && purchases === 0 && leads === 0)) {
    if (spend >= be)
      return out("fix-tracking", "Spend with zero recorded results and/or tracking flagged — verify pixel/events before any budget or scale decision.", "Audit pixel + events. Do NOT scale or cut yet.");
  }
  const conf = clicks >= 50 || (purchases || leads) >= 15;
  if (!conf) return out("insufficient-data", "Below decision floor (<50 clicks and <15 conversions). Not statistically reliable.", "Let spend accumulate; re-evaluate later. No change.");
  if (M.isRoasAnomaly(roas)) return out("fix-tracking", `ROAS ${M.fmt(roas)} is implausibly high — likely a tracking anomaly.`, "Verify conversion values before acting on this number.");
  const ctrDropped = !!ctrPeak && curCtr != null && ctrPeak > 0 && (ctrPeak - curCtr) / ctrPeak >= 0.25;
  if (freq >= 4 && (ctrDropped || (curCtr != null && curCtr < 0.01)))
    return out("refresh", `Creative fatigue: frequency ${freq.toFixed(1)} ≥ 4.0 with falling/low CTR.`, "Build 3-5 fresh variants of the winning angle as PAUSED duplicates; broaden audience. Original untouched.");
  if (cpa != null) {
    if (cpa <= be) {
      if (health != null && health >= 70 && tracking === "ok")
        return out("scale", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)}, health ${Math.round(health)} ≥ 70.`, "Propose ≤20% budget increase (needs typed YES) AND duplicate the winning angle.");
      return out("keep", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)} but not clear-to-scale (health/tracking).`, "Keep running; duplicate the angle; clean tracking before scaling.");
    }
    if (cpa <= be * 1.5) return out("reduce", `CPA ${M.fmt(cpa)} above break-even ${M.fmt(be)} but recoverable.`, "Reduce budget; test a new angle as a paused duplicate.");
    return out("kill", `CPA ${M.fmt(cpa)} > 1.5× break-even ${M.fmt(be)}.`, "Pause this ad (reversible). Reallocate to a winner.");
  }
  if (leads > 0 && purchases === 0)
    return out("keep", `CPL ${M.fmt(M.cpl(spend, leads))} but no sales recorded — likely a lead quality / qualification / follow-up / offer issue, not media.`, "Route to lead-quality + offer/funnel review; don't scale on CPL alone.");
  return out("keep", "Within acceptable range.", "Monitor; no change proposed.");
}
