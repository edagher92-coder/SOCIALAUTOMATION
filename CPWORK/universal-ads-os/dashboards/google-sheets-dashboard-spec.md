# AdPilot OS — Google Sheets Dashboard Spec

**Version:** 1.0
**System:** AdPilot OS (Universal Meta + TikTok Paid Ads Operating System)
**Currency:** AUD ({{client.currency}})
**Language:** Australian English

---

## SAFETY RULES (apply to this dashboard)

- This dashboard is read/analyse only. No action inside Sheets edits a live ad.
- Any recommendation generated is exported as a proposal. Changes ship as paused duplicates only.
- No API keys, account IDs, or private credentials appear in the sheet. All client identity uses `{{client.*}}` named cells from the Config tab.
- Money-movement actions (budget increases, new spend) require a separate typed YES confirmation outside the sheet.
- Nothing is deleted. Archived rows are flagged with `status = ARCHIVED` in the notes column.

---

## TAB STRUCTURE OVERVIEW

| Tab # | Tab Name | Purpose |
|-------|----------|---------|
| 1 | `RAW_DATA` | Source of truth — universal schema import |
| 2 | `CONFIG` | Client variables, break-even targets, named ranges |
| 3 | `DAILY` | Daily spend/leads/CPL/CPA/ROAS/MER summary |
| 4 | `CAMPAIGN_SUMMARY` | Per-campaign rollup |
| 5 | `HEALTH_SCORE` | Weighted health score calculation |
| 6 | `CREATIVE` | Per-ad creative performance |
| 7 | `LEADS` | Lead volume, CPL trend, lead quality |
| 8 | `REPORT` | Auto-populating client-facing summary |

---

## TAB 1 — RAW_DATA

### Purpose
Single import destination for all ad data. Every formula tab reads from here using SUMIFS, QUERY, or ARRAYFORMULA. Never build derived metrics directly in this tab — keep it as raw source only.

### Setup Instructions
- Freeze row 1 (View > Freeze > 1 row).
- Lock row 1 cells against editing (protect the header range `RAW_DATA!A1:AX1`).
- Set tab colour to **dark grey** (#37474F).

### Column Definitions and Header Colour Coding

Apply header background colours by group using Format > Alternating colours (disabled) then manually paint ranges:

| Colour | Hex | Column Group |
|--------|-----|-------------|
| Steel Blue | `#1565C0` | Identity columns (A–J) |
| Teal | `#00695C` | Date + objective + budget (K–O) |
| Orange | `#E65100` | Spend + delivery (P–U) |
| Purple | `#4A148C` | Conversion + revenue (V–AF) |
| Dark Red | `#B71C1C` | Video metrics (AG–AL) |
| Olive | `#827717` | Engagement (AM–AO) |
| Dark Teal | `#004D40` | Quality + outcome (AP–AR) |
| Grey | `#424242` | UTM tracking (AS–AW) |
| Charcoal | `#212121` | Meta columns (AX) |

### Full Column List (Universal Schema)

Row 1 headers, exactly as listed — do not rename:

```
A   business_id
B   business_name
C   platform
D   ad_account_id
E   campaign_id
F   campaign_name
G   adset_id
H   adset_name
I   ad_id
J   ad_name
K   date
L   objective
M   budget_type
N   daily_budget
O   lifetime_budget
P   spend
Q   impressions
R   reach
S   frequency
T   clicks
U   ctr
V   cpc
W   cpm
X   landing_page_views
Y   leads
Z   purchases
AA  revenue
AB  cost_per_lead
AC  cost_per_purchase
AD  roas
AE  video_views
AF  three_second_views
AG  six_second_views
AH  thruplays
AI  hook_rate
AJ  hold_rate
AK  comments
AL  shares
AM  saves
AN  lead_quality_score
AO  sales_count
AP  gross_profit
AQ  utm_source
AR  utm_medium
AS  utm_campaign
AT  utm_content
AU  utm_term
AV  tracking_status
AW  recommendation
AX  notes
```

### Data Validation Rules

Apply these validations after selecting entire columns (not headers):

| Column | Validation Type | Allowed Values / Rule |
|--------|-----------------|-----------------------|
| C (platform) | Dropdown list | `meta, tiktok` (lowercase — matches the universal schema) |
| K (date) | Date | Valid date format, not future |
| L (objective) | Dropdown list | `AWARENESS, TRAFFIC, LEADS, SALES, ENGAGEMENT, APP_INSTALL` |
| M (budget_type) | Dropdown list | `DAILY, LIFETIME` |
| P–AP (numeric cols) | Number | Greater than or equal to 0 |
| AV (tracking_status) | Dropdown list | `OK, FIRING_DELAYED, MISSING, PARTIAL, UNVERIFIED` |

### Notes on Raw Data Import
- Computed columns (ctr, cpc, cpm, cost_per_lead, cost_per_purchase, roas, hook_rate, hold_rate) may arrive pre-computed from the export source. Accept them as-is. Formulas on other tabs recalculate independently from raw columns so there is no double-count risk.
- If a row has zero impressions and zero spend, it is a paused ad with no data — leave it in but flag `notes = NO_DELIVERY`.
- The `business_id` column should match the value in `CONFIG!B2` (named range `client_business_id`). Mismatches flag a data mix-up.

---

## TAB 2 — CONFIG

### Purpose
Single source of truth for all client variables and targets. Every formula on other tabs references named cells from here — never hardcode client values elsewhere.

### Setup Instructions
- Set tab colour to **amber** (#F9A825).
- Protect entire tab from editing by non-admins.
- Column A = label, Column B = value, Column C = notes/formula explanation.

### Layout

| Row | A (Label) | B (Value — enter here) | C (Notes) |
|-----|-----------|------------------------|-----------|
| 1 | **CLIENT CONFIGURATION** | | |
| 2 | business_id | *(enter client ID)* | Internal reference only |
| 3 | business_name | {{client.business_name}} | e.g. Smith Dental |
| 4 | industry | {{client.industry}} | e.g. Healthcare |
| 5 | location | {{client.location}} | e.g. Brisbane, QLD |
| 6 | currency | {{client.currency}} | AUD |
| 7 | main_offer | {{client.main_offer}} | e.g. Free Consultation |
| 8 | average_sale_value | {{client.average_sale_value}} | Dollar value, no $ sign |
| 9 | gross_margin | {{client.gross_margin}} | Decimal, e.g. 0.45 for 45% |
| 10 | monthly_budget | {{client.monthly_budget}} | Total monthly ad spend AUD |
| 11 | platform_focus | {{client.platform_focus}} | e.g. Meta, TikTok, Both |
| 12 | reporting_frequency | {{client.reporting_frequency}} | Daily, Weekly, Monthly |
| 13 | | | |
| 14 | **CALCULATED TARGETS** | | |
| 15 | break_even_CPA | `=B8*B9` | average_sale_value × gross_margin |
| 16 | break_even_ROAS | `=1/B9` | 1 ÷ gross_margin |
| 17 | target_CPA | *(enter manually)* | Usually 70–80% of break_even_CPA |
| 18 | target_ROAS | *(enter manually)* | Usually 20–30% above break_even_ROAS |
| 19 | target_CPL | *(enter manually)* | Lead-gen clients; leave blank for e-comm |
| 20 | | | |
| 21 | **REPORTING DATE RANGE** | | |
| 22 | report_start_date | *(enter date)* | Format: YYYY-MM-DD |
| 23 | report_end_date | *(enter date)* | Format: YYYY-MM-DD |
| 24 | | | |
| 25 | **HEALTH SCORE WEIGHTS** | | |
| 26 | weight_tracking | 0.15 | 15% |
| 27 | weight_CPA | 0.15 | 15% |
| 28 | weight_spend_efficiency | 0.12 | 12% |
| 29 | weight_conversion_rate | 0.10 | 10% |
| 30 | weight_CTR | 0.08 | 8% |
| 31 | weight_lead_quality | 0.08 | 8% |
| 32 | weight_creative_freshness | 0.08 | 8% |
| 33 | weight_CPC | 0.07 | 7% |
| 34 | weight_naming | 0.05 | 5% |
| 35 | weight_offer_strength | 0.05 | 5% |
| 36 | weight_lp_alignment | 0.04 | 4% |
| 37 | weight_budget_pacing | 0.02 | 2% |
| 38 | weight_data_confidence | 0.01 | 1% |
| 39 | weight_total_check | `=SUM(B26:B38)` | Must equal 1.00 |

### Named Ranges (define in Data > Named ranges)

| Named Range | Cell | Description |
|-------------|------|-------------|
| `client_business_id` | CONFIG!B2 | |
| `client_business_name` | CONFIG!B3 | |
| `client_industry` | CONFIG!B4 | |
| `client_location` | CONFIG!B5 | |
| `client_currency` | CONFIG!B6 | |
| `client_main_offer` | CONFIG!B7 | |
| `client_average_sale_value` | CONFIG!B8 | |
| `client_gross_margin` | CONFIG!B9 | |
| `client_monthly_budget` | CONFIG!B10 | |
| `client_platform_focus` | CONFIG!B11 | |
| `client_reporting_frequency` | CONFIG!B12 | |
| `break_even_CPA` | CONFIG!B15 | |
| `break_even_ROAS` | CONFIG!B16 | |
| `target_CPA` | CONFIG!B17 | |
| `target_ROAS` | CONFIG!B18 | |
| `target_CPL` | CONFIG!B19 | |
| `report_start_date` | CONFIG!B22 | |
| `report_end_date` | CONFIG!B23 | |
| `w_tracking` | CONFIG!B26 | |
| `w_CPA` | CONFIG!B27 | |
| `w_spend_efficiency` | CONFIG!B28 | |
| `w_conversion_rate` | CONFIG!B29 | |
| `w_CTR` | CONFIG!B30 | |
| `w_lead_quality` | CONFIG!B31 | |
| `w_creative_freshness` | CONFIG!B32 | |
| `w_CPC` | CONFIG!B33 | |
| `w_naming` | CONFIG!B34 | |
| `w_offer_strength` | CONFIG!B35 | |
| `w_lp_alignment` | CONFIG!B36 | |
| `w_budget_pacing` | CONFIG!B37 | |
| `w_data_confidence` | CONFIG!B38 | |

---

## TAB 3 — DAILY

### Purpose
Day-by-day summary of all spend, leads, conversions, and efficiency metrics across both platforms combined, plus per-platform breakdown rows.

### Setup Instructions
- Set tab colour to **blue** (#1976D2).
- Freeze row 1.
- Column A = date (auto-generated or manually entered).

### Column Layout

```
A   date
B   total_spend
C   total_impressions
D   total_clicks
E   total_leads
F   total_purchases
G   total_revenue
H   CTR
I   CPC
J   CPL
K   CPA
L   ROAS
M   MER
N   meta_spend
O   meta_leads
P   meta_CPA
Q   tiktok_spend
R   tiktok_leads
S   tiktok_CPA
T   notes
```

### Key Formulas

All formulas assume RAW_DATA is the source tab and column references match the universal schema above.

Row 2 assumes date in A2 = first data date. Extend rows down for each day.

**B2 — Total Spend for date in A2, all platforms:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, A2)
```

**Total Spend filtered by date RANGE (for summary row using CONFIG dates):**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date)
```

**Total Spend filtered by date range AND platform:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date, RAW_DATA!$C:$C, "Meta")
```

**C2 — Total Impressions for date:**
```
=SUMIFS(RAW_DATA!$Q:$Q, RAW_DATA!$K:$K, A2)
```

**D2 — Total Clicks for date:**
```
=SUMIFS(RAW_DATA!$T:$T, RAW_DATA!$K:$K, A2)
```

**E2 — Total Leads (SUMIFS formula for total leads filtered by date):**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2)
```

**Total Leads filtered by date range and platform (Meta):**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date, RAW_DATA!$C:$C, "Meta")
```

**F2 — Total Purchases:**
```
=SUMIFS(RAW_DATA!$Z:$Z, RAW_DATA!$K:$K, A2)
```

**G2 — Total Revenue:**
```
=SUMIFS(RAW_DATA!$AA:$AA, RAW_DATA!$K:$K, A2)
```

**H2 — CTR (calculated field, recalculated from base columns):**
```
=IFERROR(D2/C2, 0)
```
Format as percentage. This recalculates from base columns to avoid division errors in raw data.

**I2 — CPC:**
```
=IFERROR(B2/D2, 0)
```

**J2 — CPL:**
```
=IFERROR(B2/E2, 0)
```

**K2 — CPA (cost per purchase):**
```
=IFERROR(B2/F2, 0)
```

**L2 — ROAS:**
```
=IFERROR(G2/B2, 0)
```

**M2 — MER (Marketing Efficiency Ratio):**
```
=IFERROR(G2/B2, 0)
```
Note: True MER = total business revenue / total ad spend. If total business revenue is tracked in a separate column (e.g. column U = total_business_revenue), update to:
```
=IFERROR(U2/B2, 0)
```

**N2 — Meta Spend for that date:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "Meta")
```

**O2 — Meta Leads:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "Meta")
```

**P2 — Meta CPA:**
```
=IFERROR(N2/SUMIFS(RAW_DATA!$Z:$Z, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "Meta"), 0)
```

**Q2 — TikTok Spend:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "TikTok")
```

**R2 — TikTok Leads:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "TikTok")
```

**S2 — TikTok CPA:**
```
=IFERROR(Q2/SUMIFS(RAW_DATA!$Z:$Z, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "TikTok"), 0)
```

### ARRAYFORMULA Example — Auto-compute CTR for entire Daily column H

Instead of copying H2 down manually, replace H2 with this single ARRAYFORMULA in H2 and leave H3:H1000 empty:

```
=ARRAYFORMULA(IFERROR(IF(A2:A1000="", "", D2:D1000/C2:C1000), 0))
```

This computes CTR for every row where column A has a date, stops on blank rows, and handles division by zero.

### Summary Row

Put a summary row at the bottom (or pin at top in row 2 with data starting row 4):

**Total spend over report period:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date)
```

**Average daily CPL over report period:**
```
=AVERAGEIF(J4:J1000, ">"&0)
```

---

## TAB 4 — CAMPAIGN_SUMMARY

### Purpose
One row per campaign showing rolled-up performance over the report date range. Used for budget reallocation decisions and campaign health assessment.

### Setup Instructions
- Set tab colour to **green** (#388E3C).
- Freeze row 1.
- Manually add one row per active campaign, or use the QUERY formula below to auto-populate.

### Column Layout

```
A   campaign_name
B   platform
C   objective
D   total_spend
E   total_impressions
F   total_clicks
G   total_leads
H   total_purchases
I   total_revenue
J   CTR
K   CPC
L   CPL
M   CPA
N   ROAS
O   avg_hook_rate
P   avg_hold_rate
Q   avg_lead_quality_score
R   health_flag
S   recommendation
```

### QUERY Formula — Auto-populate Campaign Summary from Raw Data

Place in cell A1 of CAMPAIGN_SUMMARY (this outputs headers + all data rows):

```
=QUERY(
  RAW_DATA!A:AX,
  "SELECT F, C, L,
          SUM(P), SUM(Q), SUM(T), SUM(Y), SUM(Z), SUM(AA),
          SUM(T)/SUM(Q),
          SUM(P)/SUM(T),
          SUM(P)/SUM(Y),
          SUM(P)/SUM(Z),
          SUM(AA)/SUM(P),
          AVG(AI), AVG(AJ), AVG(AN)
   WHERE K >= date '"&TEXT(report_start_date,"yyyy-mm-dd")&"'
   AND K <= date '"&TEXT(report_end_date,"yyyy-mm-dd")&"'
   AND P > 0
   GROUP BY F, C, L
   ORDER BY SUM(P) DESC
   LABEL F 'Campaign', C 'Platform', L 'Objective',
         SUM(P) 'Spend', SUM(Q) 'Impressions', SUM(T) 'Clicks',
         SUM(Y) 'Leads', SUM(Z) 'Purchases', SUM(AA) 'Revenue',
         SUM(T)/SUM(Q) 'CTR', SUM(P)/SUM(T) 'CPC',
         SUM(P)/SUM(Y) 'CPL', SUM(P)/SUM(Z) 'CPA',
         SUM(AA)/SUM(P) 'ROAS',
         AVG(AI) 'Avg Hook Rate', AVG(AJ) 'Avg Hold Rate',
         AVG(AN) 'Avg Lead Quality'",
  1
)
```

QUERY uses column letter references from the RAW_DATA sheet. If RAW_DATA headers shift, update the letters. QUERY date syntax requires the `date 'yyyy-mm-dd'` format shown above.

### Manual SUMIFS Alternative

If QUERY auto-population is not used, manually enter campaign names in column A and platform in column B, then use these formulas per row. Example for row 2:

**D2 — Spend for that campaign over report period:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$F:$F, A2, RAW_DATA!$C:$C, B2, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date)
```

**G2 — Leads:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$F:$F, A2, RAW_DATA!$C:$C, B2, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date)
```

**J2 — CTR:**
```
=IFERROR(F2/E2, 0)
```

**K2 — CPC:**
```
=IFERROR(D2/F2, 0)
```

**L2 — CPL:**
```
=IFERROR(D2/G2, 0)
```

**M2 — CPA:**
```
=IFERROR(D2/H2, 0)
```

**N2 — ROAS:**
```
=IFERROR(I2/D2, 0)
```

**R2 — Health flag (traffic light based on CPA vs break-even):**
```
=IF(D2=0, "NO_SPEND", IF(M2=0, "NO_CONV", IF(M2<=break_even_CPA*0.7, "GREEN", IF(M2<=break_even_CPA, "YELLOW", IF(M2<=break_even_CPA*1.3, "ORANGE", "RED")))))
```

---

## TAB 5 — HEALTH_SCORE

### Purpose
Calculates the 0-100 composite health score using the 13 weighted components. Scores are per account (all campaigns combined) over the report period. Extend to per-campaign scoring by filtering by campaign name.

### Setup Instructions
- Set tab colour to **red/pink** (#C62828).
- Freeze row 1.
- Columns: A = Component name, B = Raw score (0-100), C = Weight (pulled from CONFIG), D = Weighted score, E = Notes/pass criteria.

### Layout

| Row | A (Component) | B (Raw Score 0-100) | C (Weight) | D (Weighted) | E (Notes) |
|-----|---------------|---------------------|------------|--------------|-----------|
| 1 | **Component** | **Raw Score** | **Weight** | **Weighted Score** | **Notes** |
| 2 | Tracking | *formula below* | `=w_tracking` | `=B2*C2` | % of rows with tracking_status=OK |
| 3 | CPA vs Break-Even | *formula below* | `=w_CPA` | `=B3*C3` | Scaled vs break_even_CPA |
| 4 | Spend Efficiency | *formula below* | `=w_spend_efficiency` | `=B4*C4` | ROAS vs break_even_ROAS |
| 5 | Conversion Rate | *formula below* | `=w_conversion_rate` | `=B5*C5` | Purchases/clicks |
| 6 | CTR | *formula below* | `=w_CTR` | `=B6*C6` | Benchmark 1.5-2.5% |
| 7 | Lead Quality | *formula below* | `=w_lead_quality` | `=B7*C7` | Avg lead_quality_score |
| 8 | Creative Freshness | *manual V1* | `=w_creative_freshness` | `=B8*C8` | Manual 0/50/100 |
| 9 | CPC | *formula below* | `=w_CPC` | `=B9*C9` | vs target CPC |
| 10 | Naming Compliance | *manual V1* | `=w_naming` | `=B10*C10` | Manual naming audit |
| 11 | Offer Strength | *manual V1* | `=w_offer_strength` | `=B11*C11` | Manual offer review |
| 12 | Landing Page Alignment | *manual V1* | `=w_lp_alignment` | `=B12*C12` | Manual LP review |
| 13 | Budget Pacing | *formula below* | `=w_budget_pacing` | `=B13*C13` | Spend vs expected pacing |
| 14 | Data Confidence | *formula below* | `=w_data_confidence` | `=B14*C14` | Row count in period |
| 15 | **TOTAL HEALTH SCORE** | | | `=SUM(D2:D14)` | |
| 16 | **HEALTH BAND** | | | *formula below* | |

### Individual Component Raw Score Formulas (Column B)

Each raw score is 0-100.

**B2 — Tracking Score:**
Count rows where tracking_status = "OK" divided by total rows in period, scaled to 100:
```
=IFERROR(
  COUNTIFS(RAW_DATA!$AV:$AV, "OK", RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date) /
  COUNTIFS(RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date) * 100,
  0
)
```

**B3 — CPA Score (vs break-even):**
Place the actual CPA in a helper cell first (e.g. H3), then score it:

Helper cell H3:
```
=IFERROR(SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)/SUMIFS(RAW_DATA!$Z:$Z,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date),999)
```

B3 score formula:
```
=IF(H3=999,0,IF(H3<=break_even_CPA*0.7,100,IF(H3<=break_even_CPA,80,IF(H3<=break_even_CPA*1.15,50,IF(H3<=break_even_CPA*1.3,20,0)))))
```

Alternatively with LET (Sheets 2023+):
```
=LET(
  period_spend, SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  period_purchases, SUMIFS(RAW_DATA!$Z:$Z, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  actual_CPA, IFERROR(period_spend/period_purchases, 999),
  IF(actual_CPA=999, 0,
    IF(actual_CPA <= break_even_CPA*0.7, 100,
      IF(actual_CPA <= break_even_CPA, 80,
        IF(actual_CPA <= break_even_CPA*1.15, 50,
          IF(actual_CPA <= break_even_CPA*1.3, 20, 0)))))
)
```

**B4 — Spend Efficiency (ROAS-based):**
```
=LET(
  period_revenue, SUMIFS(RAW_DATA!$AA:$AA, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  period_spend, SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  actual_ROAS, IFERROR(period_revenue/period_spend, 0),
  IF(actual_ROAS >= break_even_ROAS*1.3, 100,
    IF(actual_ROAS >= break_even_ROAS, 80,
      IF(actual_ROAS >= break_even_ROAS*0.85, 50,
        IF(actual_ROAS >= break_even_ROAS*0.7, 20, 0))))
)
```

**B5 — Conversion Rate Score:**
Conversion rate = purchases / clicks. Benchmark: 3%+ is strong, 1.5%+ is acceptable, below 0.8% is poor:
```
=LET(
  period_clicks, SUMIFS(RAW_DATA!$T:$T, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  period_purchases, SUMIFS(RAW_DATA!$Z:$Z, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  conv_rate, IFERROR(period_purchases/period_clicks, 0),
  IF(conv_rate >= 0.03, 100, IF(conv_rate >= 0.015, 70, IF(conv_rate >= 0.008, 40, 10)))
)
```

**B6 — CTR Score (benchmark: >2% is good for Meta feed, >1% for TikTok):**
```
=LET(
  period_clicks, SUMIFS(RAW_DATA!$T:$T, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  period_impr, SUMIFS(RAW_DATA!$Q:$Q, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  ctr_val, IFERROR(period_clicks/period_impr, 0),
  IF(ctr_val >= 0.025, 100, IF(ctr_val >= 0.015, 80, IF(ctr_val >= 0.008, 50, IF(ctr_val >= 0.004, 25, 0))))
)
```

**B7 — Lead Quality Score (average of lead_quality_score column):**
```
=IFERROR(
  AVERAGEIFS(RAW_DATA!$AN:$AN, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date, RAW_DATA!$AN:$AN, ">"&0),
  50
)
```
Default is 50 when the column is empty (lead quality data usually comes from CRM).

**B8 — Creative Freshness:** Manual input for V1.
```
*(manual input — 100 = new creatives tested this week; 50 = same creative 2-4 weeks; 0 = creative >4 weeks, no new tests)*
```

**B9 — CPC Score:**
Target CPC is estimated as 3% of break_even_CPA (adjust to industry benchmarks):
```
=LET(
  period_spend, SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  period_clicks, SUMIFS(RAW_DATA!$T:$T, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  actual_CPC, IFERROR(period_spend/period_clicks, 999),
  target_cpc_val, break_even_CPA*0.03,
  IF(actual_CPC <= target_cpc_val*0.7, 100, IF(actual_CPC <= target_cpc_val, 75, IF(actual_CPC <= target_cpc_val*1.3, 40, 10)))
)
```

**B10 — Naming Compliance Score:** Manual input for V1.
```
*(manual input — score 0/50/100 based on naming audit against the naming convention doc)*
```

**B11 — Offer Strength:** Manual input 0-100 based on offer review.
```
*(manual input — reassessed each period)*
```

**B12 — Landing Page Alignment:** Manual input 0-100.
```
*(manual input — reassessed each period)*
```

**B13 — Budget Pacing:**
```
=LET(
  days_total, report_end_date - report_start_date + 1,
  days_elapsed, MIN(TODAY(), report_end_date) - report_start_date + 1,
  expected_pct, days_elapsed / days_total,
  period_spend, SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date),
  actual_pct, period_spend / client_monthly_budget,
  pacing_ratio, IFERROR(actual_pct / expected_pct, 1),
  IF(ABS(pacing_ratio - 1) <= 0.05, 100, IF(ABS(pacing_ratio - 1) <= 0.15, 70, IF(ABS(pacing_ratio - 1) <= 0.25, 40, 10)))
)
```

**B14 — Data Confidence:**
Row count for period. Less than 30 rows = low confidence. Scaled 0-100:
```
=MIN(100, COUNTIFS(RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&report_end_date) / 30 * 100)
```

### Total Health Score Formula (D15)

```
=SUM(D2:D14)
```

### Health Band Label (D16)

```
=IF(D15>=80, "GREEN — Healthy", IF(D15>=60, "YELLOW — Monitor", IF(D15>=40, "ORANGE — Action Required", "RED — Critical")))
```

### Named Ranges for Health Score Tab

| Named Range | Cell Reference | Description |
|-------------|---------------|-------------|
| `health_score_total` | HEALTH_SCORE!D15 | Final 0-100 score |
| `health_score_band` | HEALTH_SCORE!D16 | Text band label |

---

## TAB 6 — CREATIVE

### Purpose
Per-ad creative performance to identify top performers, fatigued creatives, and new winners. Sorted by hook rate descending to surface attention-grabbing creatives first.

### Setup Instructions
- Set tab colour to **purple** (#7B1FA2).
- Freeze row 1.

### Column Layout

```
A   ad_id
B   ad_name
C   campaign_name
D   platform
E   total_spend
F   total_impressions
G   total_clicks
H   total_leads
I   total_three_second_views
J   total_thruplays
K   CTR
L   CPL
M   hook_rate
N   hold_rate
O   avg_lead_quality_score
P   creative_age_flag
Q   recommendation
```

### QUERY Formula — Auto-populate Creative tab

Place in A1 (outputs headers + data):

```
=QUERY(
  RAW_DATA!A:AX,
  "SELECT I, J, F, C,
          SUM(P), SUM(Q), SUM(T), SUM(Y),
          SUM(AF), SUM(AH),
          SUM(T)/SUM(Q),
          SUM(P)/SUM(Y),
          SUM(AF)/SUM(Q),
          SUM(AH)/SUM(AF),
          AVG(AN)
   WHERE K >= date '"&TEXT(report_start_date,"yyyy-mm-dd")&"'
   AND K <= date '"&TEXT(report_end_date,"yyyy-mm-dd")&"'
   AND P > 0
   GROUP BY I, J, F, C
   ORDER BY SUM(AF)/SUM(Q) DESC
   LABEL I 'Ad ID', J 'Ad Name', F 'Campaign', C 'Platform',
         SUM(P) 'Spend', SUM(Q) 'Impressions', SUM(T) 'Clicks',
         SUM(Y) 'Leads', SUM(AF) '3s Views', SUM(AH) 'Thruplays',
         SUM(T)/SUM(Q) 'CTR', SUM(P)/SUM(Y) 'CPL',
         SUM(AF)/SUM(Q) 'Hook Rate', SUM(AH)/SUM(AF) 'Hold Rate',
         AVG(AN) 'Avg Lead Quality'",
  1
)
```

### ARRAYFORMULA for Hook Rate Column (if using manual layout instead of QUERY)

Place in M2 only, leave M3:M1000 blank:

```
=ARRAYFORMULA(
  IF(F2:F1000="", "",
    IFERROR(I2:I1000/F2:F1000, 0)
  )
)
```

This computes hook_rate = three_second_views / impressions for every row where impressions data exists.

---

## TAB 7 — LEADS

### Purpose
Lead volume tracking, CPL trend over time, and lead quality scoring. Focused on lead-gen clients. E-commerce clients can hide this tab.

### Setup Instructions
- Set tab colour to **orange** (#E65100).
- Freeze row 1.

### Column Layout

```
A   date
B   total_leads
C   meta_leads
D   tiktok_leads
E   CPL_overall
F   CPL_meta
G   CPL_tiktok
H   avg_lead_quality_score
I   cumulative_leads
J   cumulative_spend
K   cumulative_CPL
L   notes
```

### Key Formulas

**B2 — Total leads for date A2:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2)
```

**C2 — Meta leads:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "Meta")
```

**D2 — TikTok leads:**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, A2, RAW_DATA!$C:$C, "TikTok")
```

**E2 — Overall CPL:**
```
=IFERROR(SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,A2)/B2, 0)
```

**F2 — Meta CPL:**
```
=IFERROR(SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,A2,RAW_DATA!$C:$C,"Meta")/C2, 0)
```

**G2 — TikTok CPL:**
```
=IFERROR(SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,A2,RAW_DATA!$C:$C,"TikTok")/D2, 0)
```

**H2 — Average lead quality score:**
```
=IFERROR(AVERAGEIFS(RAW_DATA!$AN:$AN, RAW_DATA!$K:$K, A2, RAW_DATA!$AN:$AN, ">"&0), 0)
```

**I2 — Cumulative leads (running total):**
```
=SUMIFS(RAW_DATA!$Y:$Y, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&A2)
```

**J2 — Cumulative spend:**
```
=SUMIFS(RAW_DATA!$P:$P, RAW_DATA!$K:$K, ">="&report_start_date, RAW_DATA!$K:$K, "<="&A2)
```

**K2 — Cumulative CPL:**
```
=IFERROR(J2/I2, 0)
```

### CPL Trend Summary (add below daily rows, e.g. starting row 35)

**7-day rolling average CPL:**
```
=IFERROR(AVERAGE(E2:E8), 0)
```
Adjust range to cover last 7 rows of data.

**CPL vs target comparison:**
```
=IFERROR(E2/target_CPL, 0)
```
Format as percentage. Values >1 = over target, <1 = under target (good).

---

## TAB 8 — REPORT

### Purpose
Auto-populating client-facing summary that pulls headline numbers from other tabs. This is the tab exported to PDF or shared with the client. Plain language, no raw data, no formulas visible to the client.

### Setup Instructions
- Set tab colour to **dark navy** (#0D47A1).
- Freeze row 1.
- Set print area to A1:D50.
- Hide gridlines for this tab (View > Gridlines — uncheck).
- Use large text and clear section breaks. This is the client's view.

### Layout

| Row | A | B | C | D |
|-----|---|---|---|---|
| 1 | AdPilot OS — Performance Report | | | |
| 2 | Client: | `=client_business_name` | Period: | `=TEXT(report_start_date,"d mmm yyyy")&" – "&TEXT(report_end_date,"d mmm yyyy")` |
| 3 | Platform(s): | `=client_platform_focus` | Generated: | `=TEXT(TODAY(),"d mmm yyyy")` |
| 4 | | | | |
| 5 | **ACCOUNT HEALTH** | | | |
| 6 | Health Score | `=health_score_total` | Band | `=health_score_band` |
| 7 | | | | |
| 8 | **SPEND SUMMARY** | | | |
| 9 | Total Spend | `=SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)` | | |
| 10 | Monthly Budget | `=client_monthly_budget` | Pacing | `=TEXT(B9/client_monthly_budget,"0%")` |
| 11 | Meta Spend | `=SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date,RAW_DATA!$C:$C,"Meta")` | | |
| 12 | TikTok Spend | `=SUMIFS(RAW_DATA!$P:$P,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date,RAW_DATA!$C:$C,"TikTok")` | | |
| 13 | | | | |
| 14 | **CONVERSION RESULTS** | | | |
| 15 | Total Leads | `=SUMIFS(RAW_DATA!$Y:$Y,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)` | | |
| 16 | Total Purchases | `=SUMIFS(RAW_DATA!$Z:$Z,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)` | | |
| 17 | Total Revenue | `=SUMIFS(RAW_DATA!$AA:$AA,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)` | | |
| 18 | | | | |
| 19 | **EFFICIENCY METRICS** | | | |
| 20 | CPL | `=IFERROR(B9/B15,0)` | Target CPL | `=target_CPL` |
| 21 | CPA | `=IFERROR(B9/B16,0)` | Break-Even CPA | `=break_even_CPA` |
| 22 | ROAS | `=IFERROR(B17/B9,0)` | Break-Even ROAS | `=break_even_ROAS` |
| 23 | CTR | `=IFERROR(SUMIFS(RAW_DATA!$T:$T,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date)/SUMIFS(RAW_DATA!$Q:$Q,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date),0)` | | |
| 24 | CPC | `=IFERROR(B9/SUMIFS(RAW_DATA!$T:$T,RAW_DATA!$K:$K,">="&report_start_date,RAW_DATA!$K:$K,"<="&report_end_date),0)` | | |
| 25 | | | | |
| 26 | **TOP CAMPAIGN** | | | |
| 27 | Name | `=INDEX(CAMPAIGN_SUMMARY!A:A,MATCH(MAX(CAMPAIGN_SUMMARY!D:D),CAMPAIGN_SUMMARY!D:D,0))` | Spend | `=MAX(CAMPAIGN_SUMMARY!D:D)` |
| 28 | | | | |
| 29 | **ACCOUNT RECOMMENDATIONS** | | | |
| 30 | (manual entry or paste from AI output) | | | |

### Report Tab Notes

- All metrics reference `report_start_date` and `report_end_date` named ranges from CONFIG, so changing the CONFIG dates automatically updates this entire tab.
- The REPORT tab should never be edited directly except for the manual recommendation rows (29+).
- To share with client: File > Download > PDF, or File > Share > specific person (view only).

---

## CONDITIONAL FORMATTING RULES

Apply these rules to the specified tabs and ranges via Format > Conditional Formatting.

### 1. Health Score — Green/Yellow/Orange/Red Bands

**Apply to:** `HEALTH_SCORE!D15` and `REPORT!B6`

| Condition | Format | Rule |
|-----------|--------|------|
| Value >= 80 | Background `#1B5E20`, text white | Green — Healthy |
| Value >= 60 and < 80 | Background `#F9A825`, text black | Yellow — Monitor |
| Value >= 40 and < 60 | Background `#E65100`, text white | Orange — Action Required |
| Value < 40 | Background `#B71C1C`, text white | Red — Critical |

Google Sheets processes conditional formatting rules top to bottom — enter in the order shown (>=80 first).

**Apply the same banding to health_flag column R in CAMPAIGN_SUMMARY using text-contains rules:**
- Contains "GREEN" → background `#1B5E20`, text white
- Contains "YELLOW" → background `#F9A825`, text black
- Contains "ORANGE" → background `#E65100`, text white
- Contains "RED" → background `#B71C1C`, text white

### 2. CPA vs Break-Even CPA — Red Highlight

**Apply to:** CAMPAIGN_SUMMARY column M (CPA), DAILY column K (CPA), REPORT!B21

Select column M from M2 downward. Use custom formula:

CPA over break-even (bad — red):
```
=AND(M2>0, M2>break_even_CPA)
```
Format: Background `#FFCDD2`, text `#B71C1C`.

CPA well under break-even (good — green):
```
=AND(M2>0, M2<=break_even_CPA*0.7)
```
Format: Background `#C8E6C9`, text `#1B5E20`.

### 3. ROAS vs Break-Even ROAS — Green Highlight

**Apply to:** CAMPAIGN_SUMMARY column N (ROAS), DAILY column L (ROAS), REPORT!B22

ROAS at or above break-even (good — green):
```
=AND(N2>0, N2>=break_even_ROAS)
```
Format: Background `#C8E6C9`, text `#1B5E20`.

ROAS below break-even (bad — red):
```
=AND(N2>0, N2<break_even_ROAS)
```
Format: Background `#FFCDD2`, text `#B71C1C`.

### 4. Tracking Status — Traffic Light

**Apply to:** RAW_DATA column AV (tracking_status)

Use "Text is exactly" condition for each:

| Rule | Background | Text Colour | Meaning |
|------|------------|-------------|---------|
| Text is exactly: `OK` | `#C8E6C9` | `#1B5E20` | Tracking firing correctly |
| Text is exactly: `FIRING_DELAYED` | `#FFF9C4` | `#827717` | Delay detected, monitor |
| Text is exactly: `PARTIAL` | `#FFE0B2` | `#E65100` | Some events missing |
| Text is exactly: `MISSING` | `#FFCDD2` | `#B71C1C` | No tracking firing |
| Text is exactly: `UNVERIFIED` | `#F3E5F5` | `#4A148C` | Not yet confirmed |

### 5. CPL vs Target CPL

**Apply to:** DAILY column J (CPL), LEADS column E (CPL_overall)

CPL over target (bad — red):
```
=AND(J2>0, J2>target_CPL)
```
Format: Background `#FFCDD2`.

CPL well under target (good — green):
```
=AND(J2>0, J2<=target_CPL*0.8)
```
Format: Background `#C8E6C9`.

### 6. Hook Rate — Performance Bands

**Apply to:** CREATIVE column M (hook_rate)

| Condition | Format | Meaning |
|-----------|--------|---------|
| Value >= 0.30 | Background `#1B5E20`, text white | Exceptional hook (30%+) |
| Value >= 0.20 | Background `#C8E6C9`, text `#1B5E20` | Strong hook (20-30%) |
| Value >= 0.10 | Background `#FFF9C4`, text `#827717` | Average hook (10-20%) |
| Value < 0.10 | Background `#FFCDD2`, text `#B71C1C` | Weak hook (<10%) |

---

## REFRESH / IMPORT INSTRUCTIONS

### V1 — Manual CSV Import

This is the baseline workflow for the initial build. No automation, no scripts.

**Step 1 — Export data from ad platform**
- Meta Ads Manager: Reports > Custom Report > select columns matching universal schema > Export as CSV.
- TikTok Ads Manager: Dashboard > Campaign/Ad level > Export > CSV.
- Both exports should cover the same date range.

**Step 2 — Prepare the CSV**
- Open the CSV in a text editor or Excel.
- Ensure column names exactly match the universal schema headers (RAW_DATA tab, Row 1).
- If column names differ, rename them before importing.
- Add a `platform` column with value `Meta` or `TikTok` for every row if the export does not include it.
- Ensure `date` column is formatted as `YYYY-MM-DD`. Convert if needed.
- Ensure numeric columns have no currency symbols or commas (clean `$1,234.56` to `1234.56`).

**Step 3 — Import to RAW_DATA**
- Open the Google Sheet.
- Click on the RAW_DATA tab.
- Click on cell A2 (first data row — never overwrite row 1 headers).
- File > Import > Upload > select your CSV.
- In the import dialog:
  - Import location: select "Insert rows" (not "Replace sheet" — this preserves headers and formatting).
  - Separator type: Comma.
  - Convert text to numbers and dates: Yes.
- Click Import Data.

**Step 4 — Verify**
- Check that column A (business_id) has a value matching `CONFIG!B2`.
- Check that column AV (tracking_status) has values from the allowed dropdown list.
- Check that date column (K) is formatted as dates, not text. Click a cell — it should show a formatted date. If it shows a string like "2024-01-15" in plain text, select column K > Format > Number > Date.
- Check the DAILY tab auto-updates — if sums show 0, dates may be text strings rather than date values.

**Step 5 — Update CONFIG dates**
- Update `CONFIG!B22` (report_start_date) and `CONFIG!B23` (report_end_date) to cover the imported data period.
- All formula tabs update automatically.

**Refresh frequency:**
- Weekly refresh: export last 7 days, import and append (use "Insert rows" each time).
- Monthly refresh: export full month, clear RAW_DATA rows 2 onwards (select rows 2:5000, right-click > Delete rows), then import fresh.
- Keep at least 90 days of data in RAW_DATA at all times for trend analysis.

**Column Mapping Reference (Meta and TikTok export column names differ from schema)**

| Universal Schema Column | Meta Export Column Name | TikTok Export Column Name |
|------------------------|------------------------|--------------------------|
| campaign_name | Campaign name | Campaign Name |
| adset_name | Ad Set Name | Ad Group Name |
| ad_name | Ad Name | Ad Name |
| spend | Amount spent (AUD) | Cost |
| impressions | Impressions | Impressions |
| clicks | Link clicks | Clicks (All) |
| leads | Leads | Conversions (Lead) |
| purchases | Purchases | Conversions (Purchase) |
| revenue | Purchase conversion value | Total Purchase Value |
| three_second_views | 3-second video plays | 3-Second Video Views |
| thruplays | ThruPlays | Video Views (100%) |
| hook_rate | *(calculate: 3s views / impressions)* | *(calculate)* |
| hold_rate | *(calculate: thruplays / 3s views)* | *(calculate)* |

---

### V2 — Google Apps Script Automation Hooks

**Where to add the script:** Extensions > Apps Script in the Google Sheet.

**Automation points to build in V2:**

1. **Scheduled CSV import:** Use Apps Script `DriveApp` to read a CSV dropped into a designated Google Drive folder. The script runs on a time-based trigger (e.g. daily at 6 AM AEST). It appends only rows with dates not already present in RAW_DATA.

2. **Auto-date update:** After import, the script updates `CONFIG!B22` to `MIN(date column)` and `CONFIG!B23` to `MAX(date column)` automatically.

3. **Health score recalculation trigger:** Apps Script time trigger recalculates health score component cells that require manual input (B8, B10, B11, B12) via a sidecar scoring worksheet, and writes a timestamp to `CONFIG!B40` (`last_updated`).

4. **Email report trigger:** Apps Script exports REPORT tab to PDF and emails it to a list. Add a named cell `CONFIG!B41` (`report_email_recipients`) with a comma-separated email list. Script fires after each import run.

5. **Recommendation logging:** A script reads the `recommendation` column (AW) from RAW_DATA and copies unique values to a separate `IMPORT_LOG` sheet with timestamps.

**V2 hook cells (add to CONFIG tab, rows 39+):**

| Row | Label | Named Range | Notes |
|-----|-------|-------------|-------|
| 39 | v2_drive_folder_id | `v2_drive_folder_id` | Google Drive folder ID where CSVs are dropped |
| 40 | v2_last_import_timestamp | `v2_last_import` | Script writes here after each run |
| 41 | v2_report_email_recipients | `v2_email_recipients` | Comma-separated email list |
| 42 | v2_auto_import_enabled | `v2_auto_import` | TRUE/FALSE toggle |

---

### V3 — Direct API Connector Hooks

**Purpose:** Replace manual CSV exports with automated data pipelines writing directly into RAW_DATA.

**Connector options by tier:**

| Tool | Complexity | Cost Tier | Best For |
|------|-----------|-----------|---------|
| Supermetrics for Sheets | Low | Paid subscription | Fastest path, Meta + TikTok in one connector |
| Google Looker Studio | Medium | Free | Visualisation layer on top of Sheets data |
| n8n (self-hosted) | Medium | Low (infra cost) | Custom pipeline, full data control |
| Make (formerly Integromat) | Low-Medium | Low | No-code pipeline builder |
| Custom Python → GSheets API | High | Low (infra cost) | Maximum control, enterprise scale |

**V3 integration points in this sheet:**

1. **RAW_DATA!A2 onwards:** The connector writes directly here in the same column order as the universal schema. Headers in row 1 are the data contract — never change column positions after a connector is live.

2. **CONFIG!B22/B23 (report dates):** The connector can update these after each import run to reflect the latest data window.

3. **CONFIG!B39:** Repurpose as `v3_connector_source` to document which connector feeds this sheet (e.g. "Supermetrics — Meta Ads — {{client.ad_account_id}}").

4. **Deduplication key:** Add a helper column AY in RAW_DATA with a row hash. Place this ARRAYFORMULA in AY2:
```
=ARRAYFORMULA(IF(A2:A="","",A2:A&"|"&C2:C&"|"&E2:E&"|"&K2:K))
```
This concatenates business_id + platform + campaign_id + date as a deduplication key. The connector script checks for existing hashes before inserting new rows.

5. **Import log:** Add a tab `IMPORT_LOG` (hidden from client view). The V3 connector writes one row per import run: timestamp, rows inserted, rows skipped (duplicates), error count, connector name. This tab is never shared externally.

---

## COMPLETE NAMED RANGES LIST

Define all of the following in Data > Named ranges. Every formula in this spec uses these names in place of hardcoded cell references.

### CONFIG Named Ranges

| Named Range | Cell Reference | Description |
|-------------|---------------|-------------|
| `client_business_id` | CONFIG!B2 | Internal client ID |
| `client_business_name` | CONFIG!B3 | Client business name |
| `client_industry` | CONFIG!B4 | Industry vertical |
| `client_location` | CONFIG!B5 | Geographic location |
| `client_currency` | CONFIG!B6 | Currency code |
| `client_main_offer` | CONFIG!B7 | Primary ad offer |
| `client_average_sale_value` | CONFIG!B8 | Average sale value in AUD |
| `client_gross_margin` | CONFIG!B9 | Gross margin as decimal |
| `client_monthly_budget` | CONFIG!B10 | Monthly ad spend budget AUD |
| `client_platform_focus` | CONFIG!B11 | Active platforms |
| `client_reporting_frequency` | CONFIG!B12 | Report cadence |
| `break_even_CPA` | CONFIG!B15 | Calculated: average_sale_value × gross_margin |
| `break_even_ROAS` | CONFIG!B16 | Calculated: 1 ÷ gross_margin |
| `target_CPA` | CONFIG!B17 | Target CPA (manual) |
| `target_ROAS` | CONFIG!B18 | Target ROAS (manual) |
| `target_CPL` | CONFIG!B19 | Target CPL (manual) |
| `report_start_date` | CONFIG!B22 | Report period start date |
| `report_end_date` | CONFIG!B23 | Report period end date |
| `w_tracking` | CONFIG!B26 | Health weight: tracking (0.15) |
| `w_CPA` | CONFIG!B27 | Health weight: CPA (0.15) |
| `w_spend_efficiency` | CONFIG!B28 | Health weight: spend efficiency (0.12) |
| `w_conversion_rate` | CONFIG!B29 | Health weight: conversion rate (0.10) |
| `w_CTR` | CONFIG!B30 | Health weight: CTR (0.08) |
| `w_lead_quality` | CONFIG!B31 | Health weight: lead quality (0.08) |
| `w_creative_freshness` | CONFIG!B32 | Health weight: creative freshness (0.08) |
| `w_CPC` | CONFIG!B33 | Health weight: CPC (0.07) |
| `w_naming` | CONFIG!B34 | Health weight: naming (0.05) |
| `w_offer_strength` | CONFIG!B35 | Health weight: offer strength (0.05) |
| `w_lp_alignment` | CONFIG!B36 | Health weight: LP alignment (0.04) |
| `w_budget_pacing` | CONFIG!B37 | Health weight: budget pacing (0.02) |
| `w_data_confidence` | CONFIG!B38 | Health weight: data confidence (0.01) |

### HEALTH_SCORE Named Ranges

| Named Range | Cell Reference | Description |
|-------------|---------------|-------------|
| `health_score_total` | HEALTH_SCORE!D15 | Final 0-100 composite score |
| `health_score_band` | HEALTH_SCORE!D16 | Text band label |

### RAW_DATA Column Named Ranges (optional — improves formula readability)

These name entire columns so formulas can use `rd_spend` instead of `RAW_DATA!$P:$P`:

| Named Range | Cell Reference | Column |
|-------------|---------------|--------|
| `rd_business_id` | RAW_DATA!A:A | A |
| `rd_platform` | RAW_DATA!C:C | C |
| `rd_campaign_name` | RAW_DATA!F:F | F |
| `rd_adset_name` | RAW_DATA!H:H | H |
| `rd_ad_id` | RAW_DATA!I:I | I |
| `rd_ad_name` | RAW_DATA!J:J | J |
| `rd_date` | RAW_DATA!K:K | K |
| `rd_spend` | RAW_DATA!P:P | P |
| `rd_impressions` | RAW_DATA!Q:Q | Q |
| `rd_clicks` | RAW_DATA!T:T | T |
| `rd_leads` | RAW_DATA!Y:Y | Y |
| `rd_purchases` | RAW_DATA!Z:Z | Z |
| `rd_revenue` | RAW_DATA!AA:AA | AA |
| `rd_three_sec_views` | RAW_DATA!AF:AF | AF |
| `rd_thruplays` | RAW_DATA!AH:AH | AH |
| `rd_hook_rate` | RAW_DATA!AI:AI | AI |
| `rd_hold_rate` | RAW_DATA!AJ:AJ | AJ |
| `rd_lead_quality` | RAW_DATA!AN:AN | AN |
| `rd_tracking_status` | RAW_DATA!AV:AV | AV |

With these ranges defined, the spend SUMIFS formula becomes:
```
=SUMIFS(rd_spend, rd_date, ">="&report_start_date, rd_date, "<="&report_end_date, rd_platform, "Meta")
```

---

## BUILD CHECKLIST

Use this checklist when implementing the dashboard from scratch.

**Setup (do once):**
- [ ] Create all 8 tabs in order with correct names, set tab colours as specified
- [ ] Set up RAW_DATA row 1 headers (all 50 columns A–AX), freeze row 1, apply header colour coding by group
- [ ] Apply data validations to RAW_DATA columns (platform, date, objective, budget_type, numeric, tracking_status)
- [ ] Fill CONFIG tab rows 2–39 with all client variables, test break_even formulas in B15 and B16
- [ ] Define all Named Ranges in Data > Named ranges (start with CONFIG ranges, then HEALTH_SCORE, then RAW_DATA columns)
- [ ] Verify `weight_total_check` (CONFIG!B39) equals exactly 1.00

**Formulas:**
- [ ] DAILY tab: SUMIFS for spend, leads, CPL, CPA, ROAS, MER for both platforms — test with sample data
- [ ] DAILY tab: ARRAYFORMULA for CTR in H2 — confirm it populates all rows without manual copy-down
- [ ] CAMPAIGN_SUMMARY: QUERY formula in A1 — confirm it returns correct headers and grouped data
- [ ] CREATIVE: QUERY formula in A1 — confirm hook_rate and hold_rate compute correctly, sorted by hook rate descending
- [ ] LEADS: daily lead/CPL rows, cumulative formulas (I, J, K columns)
- [ ] HEALTH_SCORE: all 13 component raw score formulas in column B, weighted scores in column D, total in D15, band label in D16
- [ ] REPORT: all pull formulas reference CONFIG named ranges, verify that changing report dates in CONFIG updates REPORT correctly

**Conditional formatting:**
- [ ] Health score bands (80/60/40 thresholds) on HEALTH_SCORE!D15 and REPORT!B6
- [ ] Health flag text-contains bands on CAMPAIGN_SUMMARY column R
- [ ] CPA > break_even_CPA red highlight on DAILY column K and CAMPAIGN_SUMMARY column M
- [ ] CPA <= break_even_CPA * 0.7 green highlight on same columns
- [ ] ROAS >= break_even_ROAS green on DAILY column L and CAMPAIGN_SUMMARY column N
- [ ] ROAS < break_even_ROAS red on same columns
- [ ] Tracking status traffic light on RAW_DATA column AV (5 rules for 5 statuses)
- [ ] CPL vs target CPL red/green on DAILY column J and LEADS column E
- [ ] Hook rate performance bands on CREATIVE column M

**Refresh:**
- [ ] Document the V1 manual import steps in a separate tab called `HOW_TO` (visible to operators, hidden from client)
- [ ] Add V2 hook cells to CONFIG rows 39–42
- [ ] Add V3 dedup helper column formula in RAW_DATA!AY2
- [ ] Add `IMPORT_LOG` tab (hidden) for V3 connector logging

**QA with sample data:**
- [ ] Import 2 weeks of test data (anonymised or dummy values)
- [ ] Confirm DAILY tab sums match raw totals when manually cross-checked
- [ ] Confirm CAMPAIGN_SUMMARY QUERY groups by campaign correctly
- [ ] Confirm HEALTH_SCORE total is between 0 and 100 and is not a formula error
- [ ] Confirm REPORT tab auto-populates all cells correctly and period header shows correct dates
- [ ] Change report_start_date and report_end_date in CONFIG — verify all formula tabs update without manual refresh
- [ ] Confirm conditional formatting fires correctly (test a CPA value above break_even_CPA and confirm red highlight appears)

---

*AdPilot OS — Google Sheets Dashboard Spec v1.0*
*System: Universal Meta + TikTok Paid Ads Operating System*
*All client data uses {{client.*}} variables. No private credentials, account IDs, or API keys in this document.*
