"""
AdPilot OS — Campaign Health Score (0-100).

CANONICAL 13-factor weighted model. This is the single source of truth and
matches config/universal-defaults.yaml -> health_score_weights. Where any other
document showed a different grouping, THIS model wins (see CHANGELOG 1.1.0).

Supports N/A factors (e.g. lead_quality for an ecommerce account): their weight
is redistributed proportionally across the remaining factors, so the score is
always out of 100.
"""

from __future__ import annotations
from typing import Iterable, Optional

# Canonical weights — must sum to 100.
HEALTH_WEIGHTS: dict[str, float] = {
    "tracking_quality": 15,
    "cpa": 15,
    "spend_efficiency": 12,
    "conversion_rate": 10,
    "ctr": 8,
    "lead_quality": 8,
    "creative_freshness": 8,
    "cpc": 7,
    "naming_quality": 5,
    "offer_strength": 5,
    "landing_page_alignment": 4,
    "budget_pacing": 2,
    "data_confidence": 1,
}

BANDS = (
    (80, "Green", "Healthy — scale-eligible if tracking is clean."),
    (60, "Yellow", "Watch — fix the weak factors before scaling."),
    (40, "Orange", "Needs work — significant issues, act this week."),
    (0, "Red", "Critical — stop and fix before spending more."),
)


def band(score: float) -> tuple[str, str]:
    """Return (band_name, guidance) for a 0-100 score."""
    for floor, name, guidance in BANDS:
        if score >= floor:
            return name, guidance
    return "Red", BANDS[-1][2]


def compute_health(
    factor_scores: dict[str, float],
    na_factors: Iterable[str] = (),
) -> dict:
    """
    factor_scores: {factor_name: 0-100}. Missing factors are treated as N/A.
    na_factors: factors explicitly not applicable (weight redistributed).

    Returns a dict with total (rounded 2dp), band, guidance, and a per-factor
    breakdown of {score, weight, adjusted_weight, weighted_points}.
    """
    na = set(na_factors)
    # Any factor with no score provided is also N/A.
    for f in HEALTH_WEIGHTS:
        if f not in factor_scores:
            na.add(f)

    active = {f: w for f, w in HEALTH_WEIGHTS.items() if f not in na}
    active_weight = sum(active.values())
    if active_weight == 0:
        raise ValueError("All health factors are N/A — cannot score.")

    breakdown: dict[str, dict] = {}
    total = 0.0
    for f, w in HEALTH_WEIGHTS.items():
        if f in na:
            breakdown[f] = {"score": None, "weight": w,
                            "adjusted_weight": 0.0, "weighted_points": 0.0}
            continue
        # Redistribute N/A weight proportionally so active weights re-sum to 100.
        adj_w = w * 100.0 / active_weight
        score = float(factor_scores[f])
        pts = score * adj_w / 100.0
        total += pts
        breakdown[f] = {"score": score, "weight": w,
                        "adjusted_weight": round(adj_w, 4),
                        "weighted_points": round(pts, 4)}

    total = round(total, 2)
    name, guidance = band(total)
    return {
        "total": total,
        "band": name,
        "guidance": guidance,
        "breakdown": breakdown,
        "weakest": _weakest(breakdown),
    }


def _weakest(breakdown: dict, n: int = 3) -> list[str]:
    """The factors dragging the score down most (by lost weighted points)."""
    losses = []
    for f, b in breakdown.items():
        if b["score"] is None:
            continue
        lost = b["adjusted_weight"] * (100 - b["score"]) / 100.0
        losses.append((lost, f))
    losses.sort(reverse=True)
    return [f for _, f in losses[:n]]


def render_block(result: dict, main_issue: str = "", next_test: str = "",
                 risk: str = "") -> str:
    """The standard health-score output block (SYSTEM_OVERVIEW §4)."""
    weakest = ", ".join(result["weakest"]) or "n/a"
    return (
        f"Campaign Health Score: {result['total']:.0f} / 100\n"
        f"Status: {result['band']}\n"
        f"Main issue: {main_issue or 'weakest factors: ' + weakest}\n"
        f"Recommended action: {result['guidance']}\n"
        f"Next test: {next_test or 'refresh weakest factor, retest in 7 days'}\n"
        f"Risk: {risk or 'low — proposal only, no live-ad edits'}"
    )


def weights_sum() -> float:
    return sum(HEALTH_WEIGHTS.values())
