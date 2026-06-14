"""
AdPilot OS — universal schema + platform column mapping.

Maps raw Meta / TikTok CSV export headers into the universal schema
(api/data-schema.md). One normalised row = one ad per day. Pure stdlib.
"""

from __future__ import annotations

# Canonical field order (mirrors templates/daily-performance-tracker.csv).
UNIVERSAL_FIELDS = [
    "business_id", "business_name", "platform", "ad_account_id",
    "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id",
    "ad_name", "date", "objective", "budget_type", "daily_budget",
    "lifetime_budget", "spend", "impressions", "reach", "frequency", "clicks",
    "ctr", "cpc", "cpm", "landing_page_views", "leads", "purchases", "revenue",
    "cost_per_lead", "cost_per_purchase", "roas", "video_views",
    "three_second_views", "six_second_views", "thruplays", "hook_rate",
    "hold_rate", "comments", "shares", "saves", "lead_quality_score",
    "sales_count", "gross_profit", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "tracking_status", "recommendation", "notes",
]

NUMERIC_FIELDS = {
    "daily_budget", "lifetime_budget", "spend", "impressions", "reach",
    "frequency", "clicks", "ctr", "cpc", "cpm", "landing_page_views", "leads",
    "purchases", "revenue", "cost_per_lead", "cost_per_purchase", "roas",
    "video_views", "three_second_views", "six_second_views", "thruplays",
    "hook_rate", "hold_rate", "comments", "shares", "saves",
    "lead_quality_score", "sales_count", "gross_profit",
}

# Common Meta Ads Manager export headers -> schema field.
META_COLUMN_MAP = {
    "Campaign name": "campaign_name",
    "Ad set name": "adset_name",
    "Ad name": "ad_name",
    "Day": "date",
    "Reporting starts": "date",
    "Amount spent (AUD)": "spend",
    "Amount spent": "spend",
    "Impressions": "impressions",
    "Reach": "reach",
    "Frequency": "frequency",
    "Link clicks": "clicks",
    "Clicks (all)": "clicks",
    "CTR (link click-through rate)": "ctr",
    "Landing page views": "landing_page_views",
    "Leads": "leads",
    "Purchases": "purchases",
    "Purchases conversion value": "revenue",
    "3-second video plays": "three_second_views",
    "ThruPlays": "thruplays",
    "Post comments": "comments",
    "Post shares": "shares",
    "Post saves": "saves",
}

# Common TikTok Ads Manager export headers -> schema field.
TIKTOK_COLUMN_MAP = {
    "Campaign name": "campaign_name",
    "Ad group name": "adset_name",
    "Ad name": "ad_name",
    "Date": "date",
    "Cost": "spend",
    "Impressions": "impressions",
    "Reach": "reach",
    "Frequency": "frequency",
    "Clicks": "clicks",
    "CTR": "ctr",
    "Landing page views": "landing_page_views",
    "Leads (form)": "leads",
    "Conversions": "purchases",
    "Total conversion value": "revenue",
    "Video views": "video_views",
    "2-second video views": "three_second_views",  # TikTok 2s ≈ Meta 3s proxy
    "Video views at 100%": "thruplays",
    "Comments": "comments",
    "Shares": "shares",
    "Likes": "saves",  # closest engagement proxy; noted in data-schema.md
}


def _to_number(value: str):
    if value is None:
        return None
    s = str(value).strip().replace(",", "").replace("$", "").replace("%", "")
    if s == "" or s.upper() in ("N/A", "NA", "-"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def detect_platform(headers: list[str]) -> str:
    """Best-effort platform detection from a CSV header row."""
    h = set(headers)
    if {"Ad group name"} & h or "Cost" in h:
        return "tiktok"
    if {"Ad set name", "Amount spent (AUD)", "ThruPlays"} & h:
        return "meta"
    return "universal"


def normalise_row(raw: dict, platform: str | None = None) -> dict:
    """Map one raw export row (or an already-universal row) into the schema."""
    if platform is None:
        platform = detect_platform(list(raw.keys()))

    row = {f: None for f in UNIVERSAL_FIELDS}
    row["platform"] = platform if platform in ("meta", "tiktok") else row["platform"]

    if platform == "meta":
        colmap = META_COLUMN_MAP
    elif platform == "tiktok":
        colmap = TIKTOK_COLUMN_MAP
    else:
        colmap = {f: f for f in UNIVERSAL_FIELDS}  # already-universal CSV

    for raw_key, value in raw.items():
        field = colmap.get(raw_key, raw_key if raw_key in UNIVERSAL_FIELDS else None)
        if not field:
            continue
        row[field] = _to_number(value) if field in NUMERIC_FIELDS else value

    if platform in ("meta", "tiktok"):
        row["platform"] = platform
    return row
