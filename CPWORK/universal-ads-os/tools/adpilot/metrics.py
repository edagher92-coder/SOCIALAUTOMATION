"""
AdPilot OS — metric formulas (single executable source of truth).

Pure standard library, no dependencies. Every formula matches
config/universal-defaults.yaml and api/data-schema.md. Zero-division returns
None (rendered as "N/A"), never an exception — see qa/metric-calculation-tests.md
cases EC-01 etc.
"""

from __future__ import annotations
from typing import Optional

Number = Optional[float]

# Above this, a ROAS is almost certainly a tracking anomaly (QA case EC-02).
ROAS_ANOMALY_THRESHOLD = 20.0


def safe_div(numerator: float, denominator: float) -> Number:
    """Divide, or return None when the denominator is zero/blank (N/A)."""
    if not denominator:
        return None
    return numerator / denominator


def ctr(clicks: float, impressions: float) -> Number:
    """Click-through rate as a decimal (0.015 == 1.50%)."""
    return safe_div(clicks, impressions)


def cpc(spend: float, clicks: float) -> Number:
    return safe_div(spend, clicks)


def cpm(spend: float, impressions: float) -> Number:
    v = safe_div(spend, impressions)
    return None if v is None else v * 1000.0


def cpl(spend: float, leads: float) -> Number:
    return safe_div(spend, leads)


def cpa(spend: float, purchases: float) -> Number:
    return safe_div(spend, purchases)


def roas(revenue: float, spend: float) -> Number:
    return safe_div(revenue, spend)


def mer(total_revenue: float, total_ad_spend: float) -> Number:
    """Account-wide media efficiency ratio. Never average per-row ROAS."""
    return safe_div(total_revenue, total_ad_spend)


def frequency(impressions: float, reach: float) -> Number:
    return safe_div(impressions, reach)


def hook_rate(three_second_views: float, impressions: float) -> Number:
    return safe_div(three_second_views, impressions)


def hold_rate(thruplays: float, three_second_views: float) -> Number:
    return safe_div(thruplays, three_second_views)


def conversion_rate(purchases: float, clicks: float) -> Number:
    return safe_div(purchases, clicks)


def break_even_cpa(average_sale_value: float, gross_margin: float) -> float:
    """The most you can pay per sale and break even."""
    return average_sale_value * gross_margin


def break_even_roas(gross_margin: float) -> Number:
    """The minimum ROAS to break even."""
    return safe_div(1.0, gross_margin)


def effective_qualified_cpl(raw_cpl: float, qualification_rate: float) -> Number:
    """What a *qualified* lead really costs (QA case MC-12)."""
    return safe_div(raw_cpl, qualification_rate)


def lead_to_sale_rate(sales_count: float, leads: float) -> Number:
    return safe_div(sales_count, leads)


def variance_pct(actual: float, target: float) -> Number:
    """% over/under target. Positive = above target. (QA cases MC-13/14)."""
    return safe_div((actual - target) * 100.0, target)


def is_roas_anomaly(roas_value: Number) -> bool:
    """Flag implausible ROAS as a likely tracking anomaly (QA case EC-02)."""
    return roas_value is not None and roas_value >= ROAS_ANOMALY_THRESHOLD


def blended_cpa(spends: list[float], conversions: list[float]) -> Number:
    """Blended CPA across platforms = total spend / total conversions (MP-01)."""
    return safe_div(sum(spends), sum(conversions))


def fmt(value: Number, dp: int = 2) -> str:
    """Render a metric for reports: 'N/A' when None, else rounded."""
    if value is None:
        return "N/A"
    return f"{round(value, dp):.{dp}f}"
