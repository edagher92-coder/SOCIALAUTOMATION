"""
AdPilot OS — decision rules engine.

Turns a metrics row + client config into ONE of the allowed verdicts:
keep / kill / duplicate / scale / reduce / refresh / fix-tracking / insufficient-data.

Safety is enforced here: every verdict is a PROPOSAL. The engine never returns an
"edit the live ad" instruction — at most it proposes a paused duplicate, a pause,
or a budget change that still requires a human YES. (AGENTS.md §1.)
"""

from __future__ import annotations
from . import metrics

# Tunable thresholds (mirror config/universal-defaults.yaml -> thresholds).
MIN_CLICKS = 50
MIN_CONVERSIONS = 15
HIGH_FREQ_ACT = 4.0
HIGH_FREQ_WARN = 3.0
LOW_CTR = 0.01            # 1%
FATIGUE_CTR_DROP = 0.25  # 25% from 7-day peak
SCALE_HEALTH_MIN = 70
SCALE_STEP_PCT = 20


def has_confidence(clicks: float, conversions: float) -> bool:
    """Decision floor: enough data to judge an ad (QA EC-04 / Fixture 6)."""
    clicks = clicks or 0
    conversions = conversions or 0
    return clicks >= MIN_CLICKS or conversions >= MIN_CONVERSIONS


def decide(row: dict, cfg: dict, ctr_peak_7d: float | None = None,
           health: float | None = None) -> dict:
    """
    Return {verdict, reason, proposal, safe} for one ad row.
    cfg needs: average_sale_value, gross_margin, (optional) tracking_status.
    `safe` is always True — verdicts are proposals, never live edits.
    """
    spend = row.get("spend") or 0
    clicks = row.get("clicks") or 0
    leads = row.get("leads") or 0
    purchases = row.get("purchases") or 0
    revenue = row.get("revenue") or 0
    freq = row.get("frequency") or metrics.frequency(row.get("impressions") or 0,
                                                     row.get("reach") or 0) or 0
    cur_ctr = row.get("ctr")
    if cur_ctr is None:
        cur_ctr = metrics.ctr(clicks, row.get("impressions") or 0)

    be_cpa = metrics.break_even_cpa(cfg["average_sale_value"], cfg["gross_margin"])
    cpa = metrics.cpa(spend, purchases)
    cpl = metrics.cpl(spend, leads)
    roas = metrics.roas(revenue, spend)

    tracking = (row.get("tracking_status") or "ok").lower()

    def out(verdict, reason, proposal):
        return {"verdict": verdict, "reason": reason,
                "proposal": proposal, "safe": True}

    # 1. Tracking first: high spend, no results, or flagged tracking → fix tracking.
    if tracking in ("broken", "review") or (spend > 0 and purchases == 0 and leads == 0):
        if spend >= be_cpa:  # spent at least one target sale's worth with nothing
            return out("fix-tracking",
                       "Spend with zero recorded results and/or tracking flagged — "
                       "verify pixel/events before any budget or scale decision.",
                       "Audit pixel + events (atlas). Do NOT scale or cut yet.")

    # 2. Decision floor.
    if not has_confidence(clicks, purchases or leads):
        return out("insufficient-data",
                   f"Below decision floor (<{MIN_CLICKS} clicks and "
                   f"<{MIN_CONVERSIONS} conversions). Not statistically reliable.",
                   "Let spend accumulate; re-evaluate later. No change.")

    # 3. ROAS anomaly (likely tracking, not a real winner).
    if metrics.is_roas_anomaly(roas):
        return out("fix-tracking",
                   f"ROAS {metrics.fmt(roas)} is implausibly high — likely a "
                   "tracking anomaly (double-firing pixel / inflated values).",
                   "Verify conversion values before acting on this number.")

    # 4. Fatigue: high frequency + CTR collapse → refresh.
    ctr_dropped = (ctr_peak_7d and cur_ctr is not None and ctr_peak_7d > 0
                   and (ctr_peak_7d - cur_ctr) / ctr_peak_7d >= FATIGUE_CTR_DROP)
    if freq >= HIGH_FREQ_ACT and (ctr_dropped or (cur_ctr is not None and cur_ctr < LOW_CTR)):
        return out("refresh",
                   f"Creative fatigue: frequency {freq:.1f} ≥ {HIGH_FREQ_ACT} with "
                   f"falling/low CTR.",
                   "Build 3-5 fresh variants of the winning angle as PAUSED "
                   "duplicates; broaden audience. Original untouched.")

    # 5. Profitability verdicts (need a conversion outcome).
    if cpa is not None:
        if cpa <= be_cpa:
            # Winner. Scale only if healthy + clean tracking.
            if health is not None and health >= SCALE_HEALTH_MIN and tracking == "ok":
                return out("scale",
                           f"CPA {metrics.fmt(cpa)} ≤ break-even {metrics.fmt(be_cpa)}, "
                           f"health {health:.0f} ≥ {SCALE_HEALTH_MIN}.",
                           f"Propose ≤{SCALE_STEP_PCT}% budget increase (needs typed "
                           "YES) AND duplicate the winning angle.")
            return out("keep",
                       f"CPA {metrics.fmt(cpa)} ≤ break-even {metrics.fmt(be_cpa)} but "
                       "not clear-to-scale (health/tracking).",
                       "Keep running; duplicate the angle; clean tracking before scaling.")
        if cpa <= be_cpa * 1.5:
            return out("reduce",
                       f"CPA {metrics.fmt(cpa)} above break-even {metrics.fmt(be_cpa)} "
                       "but recoverable.",
                       "Reduce budget; test a new angle as a paused duplicate.")
        return out("kill",
                   f"CPA {metrics.fmt(cpa)} > 1.5× break-even {metrics.fmt(be_cpa)}.",
                   "Pause this ad (reversible). Reallocate to a winner.")

    # 6. Leads but no sales tracked → quality, not media.
    if leads > 0 and purchases == 0:
        return out("keep",
                   f"CPL {metrics.fmt(cpl)} but no sales recorded — likely a lead "
                   "quality / qualification / follow-up / offer issue, not media.",
                   "Route to lead-quality-analyser + titan; don't scale on CPL alone.")

    return out("keep", "Within acceptable range.", "Monitor; no change proposed.")
