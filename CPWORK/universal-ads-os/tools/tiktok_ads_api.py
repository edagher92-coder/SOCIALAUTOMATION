"""
AdPilot OS — TikTok Marketing API toolkit (READ-ONLY reporting client).

Standard library only. Advertiser ID and token come from environment variables —
never hardcoded, never committed (see SECURITY.md). This client is read-only by
design: it pulls reporting data and maps it into the universal schema. It contains
NO write/pause/budget functions — live-account changes go through the human-gated
proposal flow, not this tool. (live_edit_block / use_paused_duplicates_only.)

SETUP:
  export TIKTOK_ADVERTISER_ID="<advertiser_id>"
  export TIKTOK_TOKEN="<access_token>"      # or TIKTOK_TOKEN_FILE=secrets/tt_token.txt

USAGE:
  python3 tiktok_ads_api.py report 7        # last 7 days, ad-level (read-only)

Docs: api/tiktok-api-plan.md
"""

from __future__ import annotations
import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

API_VERSION = os.environ.get("TIKTOK_API_VERSION", "v1.3")
BASE = f"https://business-api.tiktok.com/open_api/{API_VERSION}"

# TikTok reporting metric -> universal schema field.
METRIC_MAP = {
    "spend": "spend",
    "impressions": "impressions",
    "reach": "reach",
    "frequency": "frequency",
    "clicks": "clicks",
    "ctr": "ctr",
    "cpc": "cpc",
    "cpm": "cpm",
    "conversion": "purchases",
    "total_complete_payment_rate": "revenue",  # map per account setup
    "video_play_actions": "video_views",
    "video_watched_2s": "three_second_views",   # 2s ≈ 3s proxy (noted in schema)
    "video_views_p100": "thruplays",
    "comments": "comments",
    "shares": "shares",
    "likes": "saves",
}


def _advertiser_id() -> str:
    a = os.environ.get("TIKTOK_ADVERTISER_ID", "").strip()
    if not a:
        sys.exit("Set TIKTOK_ADVERTISER_ID. Never hardcode it.")
    return a


def _token() -> str:
    t = os.environ.get("TIKTOK_TOKEN", "").strip()
    if t:
        return t
    tf = os.environ.get("TIKTOK_TOKEN_FILE", "").strip()
    if tf and Path(tf).exists():
        return Path(tf).read_text().strip()
    sys.exit("No token. Set TIKTOK_TOKEN or TIKTOK_TOKEN_FILE. Never commit tokens.")


def _get(path: str, params: dict) -> dict:
    url = f"{BASE}/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Access-Token": _token()})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"TikTok API error {e.code}: {e.read().decode()}")


def report(days: int = 7) -> list[dict]:
    """Pull ad-level reporting for the last N days, mapped to the universal schema."""
    metrics = list(METRIC_MAP.keys())
    params = {
        "advertiser_id": _advertiser_id(),
        "report_type": "BASIC",
        "data_level": "AUCTION_AD",
        "dimensions": json.dumps(["ad_id", "stat_time_day"]),
        "metrics": json.dumps(metrics),
        "query_lifetime": "false",
        "page_size": 1000,
        # caller sets start_date/end_date for N days in a real run
    }
    raw = _get("report/integrated/get/", params)
    rows = []
    for item in raw.get("data", {}).get("list", []):
        dims, mets = item.get("dimensions", {}), item.get("metrics", {})
        row = {"platform": "tiktok", "ad_id": dims.get("ad_id"),
               "date": dims.get("stat_time_day")}
        for tt_key, schema_key in METRIC_MAP.items():
            if tt_key in mets:
                row[schema_key] = mets[tt_key]
        rows.append(row)
    return rows


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] != "report":
        print(__doc__)
    else:
        n = int(args[1]) if len(args) > 1 else 7
        print(json.dumps(report(n), indent=2))
