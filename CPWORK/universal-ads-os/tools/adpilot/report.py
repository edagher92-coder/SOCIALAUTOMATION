"""
AdPilot OS — text report builder. Aggregates normalised rows into a numbers-first
summary with per-platform splits, MER/break-even, a health score, and per-ad
decision proposals. Output is plain text (no deps) — riley/dashboards can reuse.
"""

from __future__ import annotations
from . import metrics, decisions, audit
from .health import compute_health, render_block


def _sum(rows, key):
    return sum((r.get(key) or 0) for r in rows)


def _totals(rows: list[dict]) -> dict:
    spend = _sum(rows, "spend")
    return {
        "spend": spend,
        "impressions": _sum(rows, "impressions"),
        "clicks": _sum(rows, "clicks"),
        "leads": _sum(rows, "leads"),
        "purchases": _sum(rows, "purchases"),
        "revenue": _sum(rows, "revenue"),
        "ctr": metrics.ctr(_sum(rows, "clicks"), _sum(rows, "impressions")),
        "cpl": metrics.cpl(spend, _sum(rows, "leads")),
        "cpa": metrics.cpa(spend, _sum(rows, "purchases")),
        "roas": metrics.roas(_sum(rows, "revenue"), spend),
    }


def summarise(rows: list[dict], cfg: dict, health_factors: dict | None = None) -> str:
    """Build a full text report for a set of ad-day rows."""
    biz = cfg.get("business_name", "Business")
    cur = cfg.get("currency", "AUD")
    t = _totals(rows)
    be_cpa = metrics.break_even_cpa(cfg["average_sale_value"], cfg["gross_margin"])
    be_roas = metrics.break_even_roas(cfg["gross_margin"])
    mer = metrics.mer(t["revenue"], t["spend"])

    lines = [
        f"AdPilot OS — Performance Summary: {biz} ({cur})",
        "=" * 60,
        f"Spend {metrics.fmt(t['spend'])} | Leads {int(t['leads'])} | "
        f"Purchases {int(t['purchases'])} | Revenue {metrics.fmt(t['revenue'])}",
        f"CTR {metrics.fmt((t['ctr'] or 0)*100)}% | CPL {metrics.fmt(t['cpl'])} | "
        f"CPA {metrics.fmt(t['cpa'])} | ROAS {metrics.fmt(t['roas'])} | "
        f"MER {metrics.fmt(mer)}",
        f"Break-even: CPA {metrics.fmt(be_cpa)} | ROAS {metrics.fmt(be_roas)}",
    ]

    # Per-platform split.
    platforms = sorted({(r.get("platform") or "unknown") for r in rows})
    if len(platforms) > 1:
        lines.append("-" * 60)
        lines.append("By platform:")
        for p in platforms:
            pr = [r for r in rows if (r.get("platform") or "unknown") == p]
            pt = _totals(pr)
            lines.append(
                f"  {p:7} spend {metrics.fmt(pt['spend'])} | "
                f"CPA {metrics.fmt(pt['cpa'])} | ROAS {metrics.fmt(pt['roas'])}")

    # Health score: use supplied factor scores, else auto-derive from the data.
    lines.append("-" * 60)
    if health_factors:
        lines.append(render_block(compute_health(health_factors)))
    else:
        lines.append(audit.render(audit.score_account(rows, cfg)))

    # Per-campaign drilldown (worst-first).
    camps = audit.score_by_campaign(rows, cfg)
    if len(camps) > 1:
        lines.append("-" * 60)
        lines.append("By campaign (worst-first):")
        for c in camps:
            lines.append(
                f"  {c['health']:5.1f} {c['band']:6} {c['campaign']}  "
                f"(spend {metrics.fmt(c['spend'])}, CPA {metrics.fmt(c['cpa'])}, "
                f"ROAS {metrics.fmt(c['roas'])})")

    # Per-ad decisions.
    lines.append("-" * 60)
    lines.append("Proposals (no live-ad edits — paused duplicates / proposals only):")
    for r in rows:
        d = decisions.decide(r, cfg)
        name = r.get("ad_name") or r.get("campaign_name") or r.get("ad_id") or "(ad)"
        lines.append(f"  [{d['verdict'].upper():17}] {name}")
        lines.append(f"      why: {d['reason']}")
        lines.append(f"      proposal: {d['proposal']}")

    lines.append("=" * 60)
    lines.append("Safety: nothing here edits a live ad. Budget changes need a "
                 "typed YES. (AGENTS.md §1)")
    return "\n".join(lines)
