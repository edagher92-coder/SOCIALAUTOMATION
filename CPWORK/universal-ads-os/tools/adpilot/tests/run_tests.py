"""
AdPilot OS — self-verifying QA suite (pure stdlib, no pytest).

Executes the documented test cases from:
  - qa/metric-calculation-tests.md  (MC-01..MC-14, MP-01, EC-01/02/04)
  - qa/sample-data-tests.md          (decision verdicts on fixtures)
  - SYSTEM_OVERVIEW health-score model (weights sum, bands, redistribution)

Run:  python3 -m adpilot selftest      (exit 0 = all pass)
"""

from __future__ import annotations
import os
from .. import metrics, health, ingest, decisions

_FIX = os.path.join(os.path.dirname(__file__), "fixtures")
_results = []


def check(name, got, want, dp=2):
    ok = (got is None and want is None) or (
        got is not None and want is not None and round(got, dp) == round(want, dp))
    _results.append((ok, name, got, want))


def check_true(name, cond, got="-"):
    _results.append((bool(cond), name, got, True))


def test_metrics():
    check("MC-01 CTR %", (metrics.ctr(4200, 280000) or 0) * 100, 1.50)
    check("MC-02 CPC", metrics.cpc(2100, 4200), 0.50)
    check("MC-03 CPM", metrics.cpm(2100, 280000), 7.50)
    check("MC-04 CPL", metrics.cpl(1500, 12), 125.00)
    check("MC-05 CPA", metrics.cpa(8000, 118), 67.80)
    check("MC-06 ROAS", metrics.roas(16800, 5000), 3.36)
    check("MC-07 MER", metrics.mer(45000, 9800), 4.59)
    check("MC-08 hook %", (metrics.hook_rate(85000, 380000) or 0) * 100, 22.37)
    check("MC-09 hold %", (metrics.hold_rate(24000, 85000) or 0) * 100, 28.24)
    check("MC-10 break-even CPA", metrics.break_even_cpa(185, 0.42), 77.70)
    check("MC-11 break-even ROAS", metrics.break_even_roas(0.42), 2.38)
    check("MC-12 eff. qualified CPL", metrics.effective_qualified_cpl(71.43, 0.39), 183.15)
    check("MC-13 CPA variance %", metrics.variance_pct(67.80, 40), 69.5, dp=1)
    check("MC-14 ROAS variance %", metrics.variance_pct(2.1, 3.0), -30.0, dp=1)
    check("MP-01 blended CPA", metrics.blended_cpa([5000, 4500], [148, 130]), 34.17)
    check_true("EC-01 zero-conv CPA is N/A", metrics.cpa(800, 0) is None)
    check("EC-02 ROAS value", metrics.roas(50000, 500), 100.0)
    check_true("EC-02 ROAS flagged anomaly", metrics.is_roas_anomaly(metrics.roas(50000, 500)))
    check_true("EC-04 below decision floor", not decisions.has_confidence(7, 1))


def test_health():
    check("Health weights sum to 100", health.weights_sum(), 100.0)
    allgood = health.compute_health({f: 80 for f in health.HEALTH_WEIGHTS})
    check("All-80 health total", allgood["total"], 80.0)
    check_true("All-80 band Green", allgood["band"] == "Green")
    # Lead-quality N/A redistributed -> still 80.0 out of 100.
    na = health.compute_health({f: 80 for f in health.HEALTH_WEIGHTS
                                if f != "lead_quality"}, na_factors=["lead_quality"])
    check("N/A-redistribution total", na["total"], 80.0)
    check_true("Band Yellow at 60", health.band(60)[0] == "Yellow")
    check_true("Band Orange at 59", health.band(59)[0] == "Orange")
    check_true("Band Red at 39", health.band(39)[0] == "Red")


def test_ingest_mapping():
    rows = ingest.load_csv(os.path.join(_FIX, "meta_export_sample.csv"))
    r = rows[0]
    check_true("Meta export detected as meta", r["platform"] == "meta")
    check("Mapped spend", r["spend"], 500.0)
    check("Computed CTR", r["ctr"], 0.01, dp=4)
    check("Computed CPC", r["cpc"], 2.0)
    check("Computed CPA", r["cost_per_purchase"], 100.0)
    check("Computed ROAS", r["roas"], 5.0)
    check("Computed hook_rate", r["hook_rate"], 0.2, dp=4)


def test_decisions():
    cfg = {"average_sale_value": 200.0, "gross_margin": 0.6}  # break-even CPA 120
    rows = {r["ad_name"]: r for r in ingest.load_csv(
        os.path.join(_FIX, "universal_sample.csv"))}

    winner = decisions.decide(rows["pain-point_UGC_v3"], cfg, health=85)
    check_true("Winner -> scale (healthy, clean)", winner["verdict"] == "scale", winner["verdict"])

    winner_lowhealth = decisions.decide(rows["pain-point_UGC_v3"], cfg, health=55)
    check_true("Winner low-health -> keep (not scale)",
               winner_lowhealth["verdict"] == "keep", winner_lowhealth["verdict"])

    kill = decisions.decide(rows["discount_static_v1"], cfg)
    check_true("Loser -> kill", kill["verdict"] == "kill", kill["verdict"])

    broken = decisions.decide(rows["broken_promo_v2"], cfg)
    check_true("Broken tracking -> fix-tracking", broken["verdict"] == "fix-tracking", broken["verdict"])

    insuff = decisions.decide(rows["new_test_v1"], cfg)
    check_true("Below floor -> insufficient-data", insuff["verdict"] == "insufficient-data", insuff["verdict"])

    quality = decisions.decide(rows["cheap-lead_UGC_v4"], cfg)
    check_true("Cheap leads, no sales -> keep + quality reason",
               quality["verdict"] == "keep" and "quality" in quality["reason"].lower(),
               quality["verdict"])

    # Safety invariant: every verdict is a safe proposal, never a live edit.
    for r in rows.values():
        d = decisions.decide(r, cfg)
        check_true(f"Safety: {r['ad_name']} verdict is a proposal", d["safe"] is True)


def main() -> int:
    for t in (test_metrics, test_health, test_ingest_mapping, test_decisions):
        t()
    passed = sum(1 for ok, *_ in _results if ok)
    total = len(_results)
    print("AdPilot OS — self-test")
    print("=" * 56)
    for ok, name, got, want in _results:
        if not ok:
            print(f"  FAIL  {name}: got {got!r}, want {want!r}")
    print("-" * 56)
    print(f"{passed}/{total} checks passed")
    print("RESULT:", "ALL PASS ✅" if passed == total else "FAILURES ❌")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
