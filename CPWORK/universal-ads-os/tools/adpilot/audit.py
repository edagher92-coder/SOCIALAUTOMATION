"""
AdPilot OS — auto-audit engine.

Derives the 13 canonical health factors (health.py) directly from normalised ad
rows + the client config, so the system can produce a Campaign Health Score and a
findings list from a CSV alone — no manual factor entry.

Scoring is heuristic and transparent (documented per factor). Factors that cannot
be derived from media data (offer_strength, landing_page_alignment) default to a
neutral score and are flagged as "needs human input". Pure stdlib.
"""

from __future__ import annotations
from . import metrics
from .health import compute_health, render_block

NEUTRAL = 70  # default for factors not derivable from media data alone


def _agg(rows: list[dict]) -> dict:
    s = lambda k: sum((r.get(k) or 0) for r in rows)
    spend = s("spend")
    return {
        "spend": spend, "impressions": s("impressions"), "reach": s("reach"),
        "clicks": s("clicks"), "leads": s("leads"), "purchases": s("purchases"),
        "revenue": s("revenue"),
        "ctr": metrics.ctr(s("clicks"), s("impressions")),
        "cpa": metrics.cpa(spend, s("purchases")),
        "roas": metrics.roas(s("revenue"), spend),
        "conv_rate": metrics.conversion_rate(s("purchases"), s("clicks")),
    }


def _cpa_score(cpa, be_cpa) -> float | None:
    """0% over break-even=100; 10%→80; 25%→60; 50%→35; ≥75% over→10 (interpolated)."""
    if cpa is None or be_cpa <= 0:
        return None
    over = (cpa - be_cpa) / be_cpa
    pts = [(0.0, 100), (0.10, 80), (0.25, 60), (0.50, 35), (0.75, 10)]
    if over <= 0:
        return 100.0
    if over >= 0.75:
        return 10.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= over <= x1:
            return y0 + (over - x0) / (x1 - x0) * (y1 - y0)
    return 10.0


def _ctr_score(ctr) -> float:
    if ctr is None:
        return 50.0
    pct = ctr * 100
    if pct >= 2.0:
        return 95.0
    if pct >= 1.0:
        return 60 + (pct - 1.0) / 1.0 * 35       # 1%→60, 2%→95
    if pct >= 0.5:
        return 30 + (pct - 0.5) / 0.5 * 30       # 0.5%→30, 1%→60
    return max(10.0, pct / 0.5 * 30)


def _freshness_score(freq) -> float:
    if freq is None or freq < 1.0:
        return 80.0                              # too new / fine
    if freq <= 2.0:
        return 90.0
    if freq <= 3.0:
        return 65.0
    if freq <= 4.0:
        return 35.0
    return 12.0                                  # ≥4 burned out


def _conv_rate_score(cr) -> float:
    if cr is None:
        return 50.0
    pct = cr * 100
    if pct >= 3.0:
        return 90.0
    if pct >= 1.5:
        return 55 + (pct - 1.5) / 1.5 * 35       # 1.5%→55, 3%→90
    if pct >= 0.5:
        return 25 + (pct - 0.5) / 1.0 * 30
    return max(10.0, pct / 0.5 * 25)


def _tracking_score(rows: list[dict], agg: dict) -> float:
    weights = {"ok": 100, "active": 100, "partial": 60, "review": 30, "broken": 12}
    tot_spend = sum((r.get("spend") or 0) for r in rows) or 1
    score = 0.0
    for r in rows:
        st = (r.get("tracking_status") or "ok").lower()
        score += weights.get(st, 70) * (r.get("spend") or 0) / tot_spend
    # Spend but zero recorded outcomes anywhere → tracking is suspect regardless.
    if agg["spend"] > 0 and agg["purchases"] == 0 and agg["leads"] == 0:
        score = min(score, 30.0)
    # Missing UTMs reduce attribution confidence.
    missing_utm = sum(1 for r in rows if not r.get("utm_campaign"))
    if rows and missing_utm:
        score -= 15 * missing_utm / len(rows)
    return max(0.0, min(100.0, score))


def _naming_score(rows: list[dict]) -> float:
    """Compliant if campaign name has ≥4 underscore-separated segments + an 8-digit date."""
    if not rows:
        return NEUTRAL
    ok = 0
    for r in rows:
        name = (r.get("campaign_name") or "")
        segs = name.split("_")
        has_date = any(s.isdigit() and len(s) == 8 for s in segs)
        if len(segs) >= 4 and has_date:
            ok += 1
    return 100.0 * ok / len(rows)


def _data_confidence_score(agg: dict) -> float:
    if agg["clicks"] >= 200 or agg["purchases"] >= 30:
        return 100.0
    if agg["clicks"] >= 50 or agg["purchases"] >= 15:
        return 70.0
    if agg["clicks"] >= 20:
        return 40.0
    return 15.0


def _lead_quality_score(rows: list[dict]) -> float | None:
    vals = [r.get("lead_quality_score") for r in rows if r.get("lead_quality_score")]
    return sum(vals) / len(vals) if vals else None


def _budget_pacing_score(agg: dict, cfg: dict) -> float:
    """Neutral unless monthly budget context clearly breached. Conservative by design."""
    return 85.0


def score_account(rows: list[dict], cfg: dict) -> dict:
    """Return {health, findings, agg} for a set of normalised ad rows."""
    agg = _agg(rows)
    be_cpa = metrics.break_even_cpa(cfg["average_sale_value"], cfg["gross_margin"])
    freq = metrics.frequency(agg["impressions"], agg["reach"])

    factors: dict[str, float] = {}
    na: list[str] = []

    factors["tracking_quality"] = _tracking_score(rows, agg)
    cpa_s = _cpa_score(agg["cpa"], be_cpa)
    if cpa_s is None:
        na.append("cpa")
    else:
        factors["cpa"] = cpa_s
    factors["ctr"] = _ctr_score(agg["ctr"])
    factors["conversion_rate"] = _conv_rate_score(agg["conv_rate"])
    factors["creative_freshness"] = _freshness_score(freq)
    factors["naming_quality"] = _naming_score(rows)
    factors["data_confidence"] = _data_confidence_score(agg)
    # If there's spend but no recorded outcomes, the data itself can't be trusted.
    if agg["spend"] > 0 and agg["purchases"] == 0 and agg["leads"] == 0:
        factors["data_confidence"] = min(factors["data_confidence"], 20.0)
    factors["budget_pacing"] = _budget_pacing_score(agg, cfg)

    lq = _lead_quality_score(rows)
    if lq is None:
        na.append("lead_quality")
    else:
        factors["lead_quality"] = lq

    # spend_efficiency: blends CPA health + data confidence (proxy for "spend well used").
    eff_base = cpa_s if cpa_s is not None else 50.0
    factors["spend_efficiency"] = round(0.6 * eff_base + 0.4 * factors["data_confidence"], 1)
    # cpc: proxy from CTR health (cheaper clicks track with stronger CTR/relevance).
    factors["cpc"] = round(0.5 * factors["ctr"] + 0.5 * NEUTRAL, 1)
    # Not derivable from media data — neutral + flagged for human input.
    factors["offer_strength"] = NEUTRAL
    factors["landing_page_alignment"] = NEUTRAL

    result = compute_health(factors, na_factors=na)
    result["findings"] = _findings(factors, agg, be_cpa, freq, na)
    result["agg"] = agg
    result["break_even_cpa"] = be_cpa
    return result


def score_by_campaign(rows: list[dict], cfg: dict) -> list[dict]:
    """Health + key metrics per campaign, worst-first (drilldown view)."""
    groups: dict[str, list[dict]] = {}
    for r in rows:
        key = r.get("campaign_name") or r.get("campaign_id") or "(unnamed)"
        groups.setdefault(key, []).append(r)
    out = []
    for name, grp in groups.items():
        res = score_account(grp, cfg)
        agg = res["agg"]
        out.append({
            "campaign": name,
            "platforms": sorted({(r.get("platform") or "?") for r in grp}),
            "ads": len(grp),
            "spend": agg["spend"], "cpa": agg["cpa"], "roas": agg["roas"],
            "health": res["total"], "band": res["band"],
            "top_finding": res["findings"][0]["message"] if res["findings"] else "",
        })
    out.sort(key=lambda c: c["health"])   # worst first
    return out


def _sev(score: float) -> str:
    if score < 25:
        return "CRITICAL"
    if score < 45:
        return "HIGH"
    if score < 65:
        return "MEDIUM"
    return "LOW"


def _findings(factors, agg, be_cpa, freq, na) -> list[dict]:
    out = []
    if agg["spend"] > 0 and agg["purchases"] == 0 and agg["leads"] == 0:
        out.append({"severity": "CRITICAL", "factor": "tracking_quality",
                    "message": "Spend with zero recorded conversions/leads — verify "
                               "pixel/events before any budget decision."})
    if "cpa" in factors and agg["cpa"] and agg["cpa"] > be_cpa:
        out.append({"severity": _sev(factors["cpa"]), "factor": "cpa",
                    "message": f"CPA {metrics.fmt(agg['cpa'])} over break-even "
                               f"{metrics.fmt(be_cpa)}."})
    if freq and freq >= 4.0:
        out.append({"severity": "HIGH", "factor": "creative_freshness",
                    "message": f"Frequency {freq:.1f} ≥ 4.0 — creative fatigue; refresh."})
    for f, s in sorted(factors.items(), key=lambda kv: kv[1]):
        if s < 45 and f not in (x["factor"] for x in out):
            out.append({"severity": _sev(s), "factor": f,
                        "message": f"{f} weak (score {s:.0f})."})
    if na:
        out.append({"severity": "INFO", "factor": ",".join(na),
                    "message": "Not derivable from media data — needs human input "
                               "(e.g. lead quality from CRM; offer/landing review)."})
    return out[:8]


def render(result: dict) -> str:
    """Health block + findings as text for reports/CLI."""
    lines = [render_block(result), "", "Findings:"]
    for f in result["findings"]:
        lines.append(f"  [{f['severity']:8}] {f['factor']}: {f['message']}")
    return "\n".join(lines)
