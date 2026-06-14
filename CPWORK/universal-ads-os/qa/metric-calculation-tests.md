# Metric Calculation Tests — AdPilot OS
Concrete numeric cases. Every metric the system reports must match these exactly.
Run them whenever formulas, the schema, or the health score change. AUD throughout.

Formulas under test (from `config/universal-defaults.yaml`):
ctr=clicks/impressions · cpc=spend/clicks · cpm=spend/impressions×1000 ·
cpl=spend/leads · cpa=spend/purchases · roas=revenue/spend ·
frequency=impressions/reach · hook_rate=3s_views/impressions ·
hold_rate=thruplays/3s_views · mer=total_revenue/total_ad_spend ·
break_even_cpa=avg_sale×margin · break_even_roas=1/margin ·
lead_to_sale_rate=sales/leads.

---

## Case A — clean profitable ad (assert exact)
Inputs: spend 500, clicks 250, impressions 25000, reach 12500, leads 20,
purchases 5, revenue 2500, three_second_views 5000, thruplays 1000.
Client: average_sale_value 200, gross_margin 0.60.

| metric | expected |
|---|---|
| ctr | 0.0100 (1.00%) |
| cpc | $2.00 |
| cpm | $20.00 |
| cpl | $25.00 |
| cpa | $100.00 |
| roas | 5.00 |
| frequency | 2.00 |
| hook_rate | 0.20 (20%) |
| hold_rate | 0.20 (20%) |
| break_even_cpa | $120.00 |
| break_even_roas | 1.67 (1/0.6) |
**Verdict:** CPA $100 < break-even $120 and ROAS 5.0 > 1.67 → **profitable → keep/scale candidate** (scale only if health ≥70 and tracking OK, in ≤20% steps).

## Case B — zero-division edge cases (assert no crash)
Inputs: spend 80, clicks 0, impressions 4000, leads 0, purchases 0, revenue 0.
Expected: ctr 0.00%; cpc = **N/A** (not error, clicks=0); cpl = **N/A**;
cpa = **N/A**; roas = 0.00; cpm = $20.00. The system must render blanks/N/A,
**never** `#DIV/0!` or an exception, and must flag `tracking_status: review`
(spend with zero results).

## Case C — account-level MER
Inputs: total_revenue 10000 (Meta 6000 + TikTok 4000), total_ad_spend 2500.
Expected: **MER = 4.00**. (MER is account-wide; never average per-row ROAS.)

## Case D — lead-to-sale & cost-per-sale
Inputs: leads 20, sales_count 5, spend 500.
Expected: lead_to_sale_rate = 25%; cost_per_sale = $100.00.

## Case E — fatigue signal
Inputs (ad, 7 days): frequency 4.2; today CTR 0.72%; 7-day peak CTR 1.05%.
Checks: frequency ≥ 4.0 → **act**; CTR drop = (1.05−0.72)/1.05 = **31.4% ≥ 25%**
→ fatigue confirmed. Expected recommendation: **refresh** (new creative as paused
duplicate) and/or broaden audience. Must NOT recommend scale.

## Case F — decision floor (data confidence)
Inputs: ad with 18 clicks, 0 conversions, spend $22.
Expected: **No kill/keep verdict** — below floor (≥50 clicks OR ≥15 conversions).
Output: "insufficient data, keep gathering," confidence = low.

---

## Worked Health Score (assert total = 74.8 → Yellow)
weighted = factor_score × weight ÷ 100.

| factor | weight | score | weighted |
|---|---|---|---|
| tracking_quality | 15 | 90 | 13.5 |
| CPA | 15 | 70 | 10.5 |
| spend_efficiency | 12 | 80 | 9.6 |
| conversion_rate | 10 | 75 | 7.5 |
| CTR | 8 | 60 | 4.8 |
| lead_quality | 8 | 65 | 5.2 |
| creative_freshness | 8 | 50 | 4.0 |
| CPC | 7 | 70 | 4.9 |
| naming | 5 | 100 | 5.0 |
| offer_strength | 5 | 80 | 4.0 |
| landing_page_alignment | 4 | 75 | 3.0 |
| budget_pacing | 2 | 90 | 1.8 |
| data_confidence | 1 | 100 | 1.0 |
| **TOTAL** | **100** | — | **74.8** |

Expected output band: **Yellow (60–79)**. Main issue should surface
`creative_freshness` (lowest weighted contributor relative to weight).

## Pass criteria
All A–F values match to 2 dp; health total = 74.8; band = Yellow; zero-division
cases render N/A without errors; weights sum to 100.
