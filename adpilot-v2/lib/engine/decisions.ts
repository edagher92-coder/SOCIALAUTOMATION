// AdPilot OS V2 — safe decision engine (TS port). Proposals only; never edits a live ad.
import type { Row, Cfg, Decision } from "./types";
import * as M from "./metrics";
import { rateConfidence } from "./stats";

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

  // Statistical-significance gate (Wilson): is the purchase rate confidently on one side of the
  // break-even rate, or just noise? cpa<=be <=> convRate >= cpc/be, so the break-even purchase
  // rate is cpc/be. We use this ONLY to make the two aggressive verdicts safer — never to act
  // harder on a noisy sample: scale needs a confident win; kill (>1.5x) needs a confident loss.
  const cpcVal = clicks > 0 ? spend / clicks : null;
  const beConvRate = be > 0 && cpcVal != null && cpcVal > 0 ? cpcVal / be : null;
  const sig = beConvRate != null ? rateConfidence(purchases, clicks, beConvRate) : "inconclusive";

  if (cpa != null) {
    if (cpa <= be) {
      if (health != null && health >= 70 && tracking === "ok" && sig === "above")
        return out("scale", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)}, health ${Math.round(health)} ≥ 70, and the win is statistically significant.`, "Prepare a ≤20% budget-increase proposal for human review in Ads Manager, and duplicate the winning angle as a paused draft.");
      const why = sig !== "above" ? "the win isn't yet statistically significant" : "health/tracking aren't clear-to-scale";
      return out("keep", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)} but ${why}.`, "Keep running; duplicate the angle; let the sample build (and clean tracking) before scaling.");
    }
    if (cpa <= be * 1.5) return out("reduce", `CPA ${M.fmt(cpa)} above break-even ${M.fmt(be)} but recoverable.`, "Reduce budget; test a new angle as a paused duplicate.");
    // Above 1.5x break-even: only KILL when the loss is statistically confident; else REDUCE first.
    if (sig === "below")
      return out("kill", `CPA ${M.fmt(cpa)} > 1.5× break-even ${M.fmt(be)}, and the loss is statistically significant.`, "Pause this ad (reversible). Reallocate to a winner.");
    return out("reduce", `CPA ${M.fmt(cpa)} > 1.5× break-even ${M.fmt(be)}, but the sample isn't yet a statistically confident loss.`, "Reduce budget and let the result confirm before pausing; test a fresh angle as a paused duplicate.");
  }
  if (leads > 0 && purchases === 0) {
    const cplVal = M.cpl(spend, leads);
    // Break-even CPL split: when a lead→sale close rate is configured we can judge CPL against a
    // modelled break-even CPL; without it, we keep the conservative lead-quality routing (no kill —
    // lead-gen sales are often offline, so the most we ever propose here is a reversible reduce).
    const beCpl = M.breakEvenCpl(cfg.average_sale_value, cfg.gross_margin, cfg.lead_close_rate ?? null);
    if (beCpl != null && cplVal != null) {
      const ratePct = Math.round((cfg.lead_close_rate || 0) * 100);
      if (cplVal > beCpl * 1.5)
        return out("reduce", `CPL ${M.fmt(cplVal)} is above 1.5× the modelled break-even CPL ${M.fmt(beCpl)} (at a ${ratePct}% close rate), with no sales recorded.`, "Reduce budget; review lead quality + offer before adding spend. Reversible — no live edit.");
      if (cplVal <= beCpl)
        return out("keep", `CPL ${M.fmt(cplVal)} is within the modelled break-even CPL ${M.fmt(beCpl)} (${ratePct}% close rate), but no sales are recorded yet.`, "Keep running; confirm the lead→sale close rate and offline-conversion tracking before any budget increase.");
      return out("keep", `CPL ${M.fmt(cplVal)} is modestly above the break-even CPL ${M.fmt(beCpl)} (${ratePct}% close rate); lead quality / close rate matter more than media here.`, "Monitor; tighten lead quality + follow-up; don't scale on CPL alone.");
    }
    return out("keep", `CPL ${M.fmt(cplVal)} but no sales recorded — likely a lead quality / qualification / follow-up / offer issue, not media.`, "Route to lead-quality + offer/funnel review; don't scale on CPL alone.");
  }
  return out("keep", "Within acceptable range.", "Monitor; no change proposed.");
}
