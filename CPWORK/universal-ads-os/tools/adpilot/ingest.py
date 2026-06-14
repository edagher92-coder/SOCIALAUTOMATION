"""
AdPilot OS — CSV ingestion. Reads a Meta/TikTok export or an already-universal
CSV, maps to the schema, and back-fills computed metrics. Pure stdlib (csv).
"""

from __future__ import annotations
import csv
from . import metrics
from .schema import normalise_row, detect_platform


def _fill_computed(row: dict) -> dict:
    """Compute rate/cost metrics from raw fields where missing."""
    g = lambda k: row.get(k) or 0
    if row.get("frequency") is None:
        row["frequency"] = metrics.frequency(g("impressions"), g("reach"))
    if row.get("ctr") is None:
        row["ctr"] = metrics.ctr(g("clicks"), g("impressions"))
    if row.get("cpc") is None:
        row["cpc"] = metrics.cpc(g("spend"), g("clicks"))
    if row.get("cpm") is None:
        row["cpm"] = metrics.cpm(g("spend"), g("impressions"))
    if row.get("cost_per_lead") is None:
        row["cost_per_lead"] = metrics.cpl(g("spend"), g("leads"))
    if row.get("cost_per_purchase") is None:
        row["cost_per_purchase"] = metrics.cpa(g("spend"), g("purchases"))
    if row.get("roas") is None:
        row["roas"] = metrics.roas(g("revenue"), g("spend"))
    if row.get("hook_rate") is None:
        row["hook_rate"] = metrics.hook_rate(g("three_second_views"), g("impressions"))
    if row.get("hold_rate") is None:
        row["hold_rate"] = metrics.hold_rate(g("thruplays"), g("three_second_views"))
    return row


def load_csv(path: str, platform: str | None = None) -> list[dict]:
    """Load a CSV into normalised, metric-filled universal rows."""
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        headers = reader.fieldnames or []
        plat = platform or detect_platform(headers)
        rows = [_fill_computed(normalise_row(raw, plat)) for raw in reader]
    return rows
