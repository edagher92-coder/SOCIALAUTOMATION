# AdPilot OS — Google Sheets Dashboard Spec
**Version:** 1.0 | **Platform:** Google Sheets | **Tier:** V1 (Manual CSV Import)

---

## Overview

This spec defines a Google Sheets workbook that ingests the AdPilot OS universal schema and produces a live operating dashboard for Meta and TikTok paid ads. A developer or builder should be able to implement this end-to-end without further clarification.

**Safety rules embedded throughout:**
- Never edit live ads from this sheet; all output is proposals/drafts only
- Changes ship as paused duplicates or proposals
- No account IDs, API keys, or private data stored here — use `{{client.*}}` config variables
- Money-move recommendations require a typed YES to confirm

---

## Workbook Structure — Tabs

| # | Tab Name | Colour Code | Purpose |
|---|----------|-------------|---------|
| 1 | `Config` | Dark grey | Client variables, thresholds, settings |
| 2 | `Raw Data` | White | Universal schema data, imported via CSV |
| 3 | `Daily` | Blue | Today/yesterday snapshot, single-screen |
| 4 | `Campaign Summary` | Green | Rolled-up campaign performance table |
| 5 | `Health Score` | Amber | Weighted health score per account/campaign |
| 6 | `Creative` | Purple | Creative performance table, hook/hold rates |
| 7 | `Leads` | Teal | Lead volume, CPL, quality score trends |
| 8 | `Report` | Red | Auto-composed weekly/monthly report block |

---

## Tab 1: Config

**Purpose:** All client-specific variables live here. No hard-coded business data anywhere else in the workbook.

### Layout (Column A = Label, Column B = Value)

| Row | A (Label) | B (Value) | Notes |
|-----|-----------|-----------|-------|
| 1 | `business_name` | `{{client.business_name}}` | Free text |
| 2 | `industry` | `{{client.industry}}` | Free text |
| 3 | `location` | `{{client.location}}` | e.g. Sydney, AU |
| 4 | `currency` | `{{client.currency}}` | AUD |
| 5 | `main_offer` | `{{client.main_offer}}` | e.g. Free Consultation |
| 6 | `average_sale_value` | `{{client.average_sale_value}}` | Numeric, e.g. 2500 |
| 7 | `gross_margin` | `{{client.gross_margin}}` | Decimal, e.g. 0.35 |
| 8 | `monthly_budget` | `{{client.monthly_budget}}` | Numeric, e.g. 8000 |
| 9 | `platform_focus` | `{{client.platform_focus}}` | Meta / TikTok / Both |
| 10 | `reporting_frequency` | `{{client.reporting_frequency}}` | Daily / Weekly / Monthly |
| 12 | **THRESHOLDS** | | |
| 13 | `break_even_cpa` | `=B6*B7` | Auto-calculated |
| 14 | `break_even_roas` | `=1/B7` | Auto-calculated |
| 15 | `target_ctr_floor` | 0.01 | 1% minimum CTR |
| 16 | `target_cpc_ceiling` | 3.00 | Max acceptable CPC |
| 17 | `target_cpl_ceiling` | 80 | Max acceptable CPL |
| 18 | `frequency_warning` | 4.0 | Frequency flag threshold |
| 19 | `daily_budget_floor` | 20 | Minimum daily budget |
| 21 | **HEALTH WEIGHTS** | | |
| 22 | `w_tracking` | 0.15 | |
| 23 | `w_cpa` | 0.15 | |
| 24 | `w_spend_efficiency` | 0.12 | |
| 25 | `w_conversion_rate` | 0.10 | |
| 26 | `w_ctr` | 0.08 | |
| 27 | `w_lead_quality` | 0.08 | |
| 28 | `w_creative_freshness` | 0.08 | |
| 29 | `w_cpc` | 0.07 | |
| 30 | `w_naming` | 0.05 | |
| 31 | `w_offer_strength` | 0.05 | |
| 32 | `w_lp_alignment` | 0.04 | |
| 33 | `w_budget_pacing` | 0.02 | |
| 34 | `w_data_confidence` | 0.01 | |

**Named ranges to define:**
- `CFG_BREAK_EVEN_CPA` → `Config!B13`
- `CFG_BREAK_EVEN_ROAS` → `Config!B14`
- `CFG_MONTHLY_BUDGET` → `Config!B8`
- `CFG_MARGIN` → `Config!B7`
- `CFG_ASV` → `Config!B6`

---

## Tab 2: Raw Data

**Purpose:** The single source of truth. All other tabs derive from this via SUMIFS/QUERY.

### Column Order (exactly matching universal schema)

```
A: business_id          B: business_name        C: platform
D: ad_account_id        E: campaign_id          F: campaign_name
G: adset_id             H: adset_name           I: ad_id
J: ad_name              K: date                 L: objective
M: budget_type          N: daily_budget         O: lifetime_budget
P: spend                Q: impressions          R: reach
S: frequency            T: clicks               U: ctr
V: cpc                  W: cpm                  X: landing_page_views
Y: leads                Z: purchases            AA: revenue
AB: cost_per_lead       AC: cost_per_purchase   AD: roas
AE: video_views         AF: three_second_views  AG: six_second_views
AH: thruplays           AI: hook_rate           AJ: hold_rate
AK: comments            AL: shares              AM: saves
AN: lead_quality_score  AO: sales_count         AP: gross_profit
AQ: utm_source          AR: utm_medium          AS: utm_campaign
AT: utm_content         AU: utm_term            AV: tracking_status
AW: recommendation      AX: notes
```

**Row 1:** Header labels (bold, frozen)
**Row 2 onwards:** Data rows

### Computed Columns (add to the right of imported data, cols AY onwards)

| Col | Header | Formula (Row 2) |
|-----|--------|-----------------|
| AY | `ctr_check` | `=IF(Q2>0, T2/Q2, 0)` |
| AZ | `cpc_check` | `=IF(T2>0, P2/T2, 0)` |
| BA | `cpm_check` | `=IF(Q2>0, P2/Q2*1000, 0)` |
| BB | `cpl_check` | `=IF(Y2>0, P2/Y2, 0)` |
| BC | `cpa_check` | `=IF(Z2>0, P2/Z2, 0)` |
| BD | `roas_check` | `=IF(P2>0, AA2/P2, 0)` |
| BE | `hook_rate_check` | `=IF(Q2>0, AF2/Q2, 0)` |
| BF | `hold_rate_check` | `=IF(AF2>0, AH2/AF2, 0)` |
| BG | `above_break_even` | `=IF(BC2<=CFG_BREAK_EVEN_CPA, "YES", "NO")` |

**Freeze rows 1. Freeze columns A:C. Apply filter to row 1.**

### V1 Import (Manual CSV)

1. Export CSV from Meta Ads Manager or TikTok Ads Manager using the column mapping defined above
2. In Sheets: `File → Import → Upload` → select CSV → "Replace current sheet" → Import
3. Paste into `Raw Data` tab, starting at A2
4. Date column (K) must be formatted as `YYYY-MM-DD` (use `Format → Number → Date`)
5. Numeric columns (P, Q, T, Y, Z, AA, etc.) must be plain numbers, no currency symbols
6. Recommended import frequency: daily, after 10:00 AM (platform data stabilises)

### V2/V3 Automation Hooks (future)

- **V2:** Google Apps Script scheduled trigger → fetch from AdPilot OS API → auto-populate Raw Data tab
- **V3:** BigQuery connector or Supermetrics/Porter integration → live streaming data, no manual import
- Sheet structure does not change between V1/V2/V3 — only the import mechanism changes

---

## Tab 3: Daily

**Purpose:** Single-screen snapshot of the current day and previous day. Designed for a 90-second morning review.

### Layout

**Section A — Today vs Yesterday (rows 2–12)**

| Cell | Label | Formula |
|------|-------|---------|
| B1 | Date label | `=TODAY()` |
| C1 | "Yesterday" | `=TODAY()-1` |
| B3 | Total Spend | `=SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,TODAY())` |
| C3 | Total Spend YD | `=SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,TODAY()-1)` |
| B4 | Leads | `=SUMIFS('Raw Data'!Y:Y,'Raw Data'!K:K,TODAY())` |
| C4 | Leads YD | `=SUMIFS('Raw Data'!Y:Y,'Raw Data'!K:K,TODAY()-1)` |
| B5 | CPL | `=IFERROR(B3/B4,"–")` |
| C5 | CPL YD | `=IFERROR(C3/C4,"–")` |
| B6 | Purchases | `=SUMIFS('Raw Data'!Z:Z,'Raw Data'!K:K,TODAY())` |
| C6 | Purchases YD | `=SUMIFS('Raw Data'!Z:Z,'Raw Data'!K:K,TODAY()-1)` |
| B7 | CPA | `=IFERROR(B3/B6,"–")` |
| C7 | CPA YD | `=IFERROR(C3/C6,"–")` |
| B8 | Revenue | `=SUMIFS('Raw Data'!AA:AA,'Raw Data'!K:K,TODAY())` |
| C8 | Revenue YD | `=SUMIFS('Raw Data'!AA:AA,'Raw Data'!K:K,TODAY()-1)` |
| B9 | ROAS | `=IFERROR(B8/B3,"–")` |
| C9 | ROAS YD | `=IFERROR(C8/C3,"–")` |
| B10 | Impressions | `=SUMIFS('Raw Data'!Q:Q,'Raw Data'!K:K,TODAY())` |
| B11 | Clicks | `=SUMIFS('Raw Data'!T:T,'Raw Data'!K:K,TODAY())` |
| B12 | CTR | `=IFERROR(B11/B10,"–")` |

**Section B — Platform Split Today (rows 15–22)**

Use SUMIFS with platform filter:

```
=SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,TODAY(),'Raw Data'!C:C,"Meta")
=SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,TODAY(),'Raw Data'!C:C,"TikTok")
```

**Section C — Top Ad Today (rows 25–30)**

Use QUERY to return ad with lowest CPA today:

```
=QUERY('Raw Data'!A:AX,
  "SELECT J, P, Y, AB, Z, AC
   WHERE K = date '"&TEXT(TODAY(),"yyyy-mm-dd")&"'
   AND Z > 0
   ORDER BY AC ASC
   LIMIT 1
   LABEL J 'Ad Name', P 'Spend', Y 'Leads', AB 'CPL', Z 'Sales', AC 'CPA'")
```

**Section D — Bottom Ad Today (rows 32–37)**

```
=QUERY('Raw Data'!A:AX,
  "SELECT J, P, Y, AB, Z, AC
   WHERE K = date '"&TEXT(TODAY(),"yyyy-mm-dd")&"'
   AND P > 50
   ORDER BY AC DESC
   LIMIT 1
   LABEL J 'Ad Name', P 'Spend', Y 'Leads', AB 'CPL', Z 'Sales', AC 'CPA'")
```

**Section E — Flag Cell (row 40)**

```
=IF(B5>CFG_BREAK_EVEN_CPA, "⚠ CPL above break-even ("&TEXT(B5,"$#,##0.00")&" vs "&TEXT(CFG_BREAK_EVEN_CPA,"$#,##0.00")&")", "✓ CPL within target")
```

---

## Tab 4: Campaign Summary

**Purpose:** Rolled-up performance table by campaign, for a selectable date range.

### Date Range Controls

- `F1` = "Start Date" label, `G1` = start date input (default `=TODAY()-30`)
- `F2` = "End Date" label, `G2` = end date input (default `=TODAY()`)

### Summary Table (starts row 4)

Headers: Campaign Name | Platform | Spend | Impressions | Clicks | CTR | CPC | CPM | Leads | CPL | Purchases | CPA | Revenue | ROAS | Break-Even Status

Use QUERY to build the table dynamically:

```
=QUERY('Raw Data'!A:AX,
  "SELECT F, C,
          SUM(P), SUM(Q), SUM(T),
          SUM(T)/SUM(Q),
          SUM(P)/SUM(T),
          SUM(P)/SUM(Q)*1000,
          SUM(Y),
          SUM(P)/SUM(Y),
          SUM(Z),
          SUM(P)/SUM(Z),
          SUM(AA),
          SUM(AA)/SUM(P)
   WHERE K >= date '"&TEXT(G1,"yyyy-mm-dd")&"'
   AND K <= date '"&TEXT(G2,"yyyy-mm-dd")&"'
   GROUP BY F, C
   ORDER BY SUM(P) DESC
   LABEL F 'Campaign', C 'Platform',
         SUM(P) 'Spend', SUM(Q) 'Impressions', SUM(T) 'Clicks',
         SUM(T)/SUM(Q) 'CTR', SUM(P)/SUM(T) 'CPC', SUM(P)/SUM(Q)*1000 'CPM',
         SUM(Y) 'Leads', SUM(P)/SUM(Y) 'CPL',
         SUM(Z) 'Sales', SUM(P)/SUM(Z) 'CPA',
         SUM(AA) 'Revenue', SUM(AA)/SUM(P) 'ROAS'")
```

### MER Row (below table)

Label in col A: "MER (Total Period)"
Formula: `=SUMIFS('Raw Data'!AA:AA,'Raw Data'!K:K,">="&G1,'Raw Data'!K:K,"<="&G2) / SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,">="&G1,'Raw Data'!K:K,"<="&G2)`

---

## Tab 5: Health Score

**Purpose:** Compute the weighted 0–100 health score per campaign.

### Score Components Table

For each campaign (one row per campaign), score each dimension 0–100, then compute weighted sum.

**Component scoring logic (enter as helper columns):**

| Dimension | Weight | Score Formula Logic |
|-----------|--------|---------------------|
| tracking | 0.15 | `=IF(COUNTIFS('Raw Data'!AV:AV,"verified",'Raw Data'!F:F,A2)>0,100,IF(COUNTIFS('Raw Data'!AV:AV,"partial",'Raw Data'!F:F,A2)>0,50,0))` |
| CPA | 0.15 | `=MIN(100, MAX(0, (1 - (CPA_val - CFG_BREAK_EVEN_CPA)/CFG_BREAK_EVEN_CPA)*100))` |
| spend_efficiency | 0.12 | Score 100 if ROAS > break_even_roas*1.5, 50 if >= break_even, 0 if below |
| conversion_rate | 0.10 | Score 100 if CVR >= 3%, 50 if >= 1%, 0 if < 0.5% |
| CTR | 0.08 | Score 100 if CTR >= 2%, 50 if >= 1%, 0 if < 0.5% |
| lead_quality | 0.08 | Score = lead_quality_score (0–100 direct from data) |
| creative_freshness | 0.08 | Score 100 if newest creative < 14 days old, 50 if < 30 days, 0 if >= 30 days |
| CPC | 0.07 | Score 100 if CPC <= $1.50, 50 if <= $3.00, 0 if > $5.00 |
| naming | 0.05 | Manual 0–100 input (check naming convention compliance) |
| offer_strength | 0.05 | Manual 0–100 input |
| lp_alignment | 0.04 | Manual 0–100 input |
| budget_pacing | 0.02 | Score 100 if spend within 10% of target pacing, 50 if within 25%, 0 if > 50% off |
| data_confidence | 0.01 | Score 100 if >= 30 days data, 50 if >= 7 days, 0 if < 3 days |

**Weighted Total Formula:**

```
=SUMPRODUCT(
  B2:N2,          -- individual scores (0-100)
  {0.15,0.15,0.12,0.10,0.08,0.08,0.08,0.07,0.05,0.05,0.04,0.02,0.01}
)
```

**Health Band Label:**

```
=IFS(O2>=80,"GREEN",O2>=60,"YELLOW",O2>=40,"ORANGE",TRUE,"RED")
```

### Conditional Formatting Rules for Health Score Column (O)

Apply to column O (Health Score total):

| Rule | Condition | Background | Text |
|------|-----------|------------|------|
| Green | `>=80` | `#34A853` | White |
| Yellow | `>=60` | `#FBBC04` | Dark grey |
| Orange | `>=40` | `#FF6D00` | White |
| Red | `<40` | `#EA4335` | White |

Apply same rules to the Health Band label column (P):
- Text is "GREEN" → green background
- Text is "YELLOW" → yellow background
- Text is "ORANGE" → orange background
- Text is "RED" → red background

---

## Tab 6: Creative

**Purpose:** Per-ad creative performance, sorted by hook rate and hold rate.

### QUERY for Creative Table

```
=QUERY('Raw Data'!A:AX,
  "SELECT J, C, F,
          SUM(P), SUM(Q), SUM(AF)/SUM(Q), SUM(AH)/SUM(AF),
          SUM(Y), SUM(P)/SUM(Y),
          SUM(Z), SUM(P)/SUM(Z),
          COUNT(K)
   WHERE K >= date '"&TEXT(G1,"yyyy-mm-dd")&"'
   AND K <= date '"&TEXT(G2,"yyyy-mm-dd")&"'
   GROUP BY J, C, F
   ORDER BY SUM(AF)/SUM(Q) DESC
   LABEL J 'Ad Name', C 'Platform', F 'Campaign',
         SUM(P) 'Spend', SUM(Q) 'Impressions',
         SUM(AF)/SUM(Q) 'Hook Rate', SUM(AH)/SUM(AF) 'Hold Rate',
         SUM(Y) 'Leads', SUM(P)/SUM(Y) 'CPL',
         SUM(Z) 'Sales', SUM(P)/SUM(Z) 'CPA',
         COUNT(K) 'Days Running'")
```

### Conditional Formatting — Hook Rate Column

- `>=0.35` → Green (strong hook)
- `>=0.20` → Yellow (acceptable)
- `<0.20` → Red (weak hook, flag for creative refresh)

### Conditional Formatting — Hold Rate Column

- `>=0.50` → Green
- `>=0.30` → Yellow
- `<0.30` → Red

### Creative Age Flag

Add column: `=IF(MAX_DATE - MIN_DATE > 30, "STALE - "&(MAX_DATE-MIN_DATE)&" days", "Fresh")`

Highlight stale creatives in orange.

---

## Tab 7: Leads

**Purpose:** Lead volume and quality trend, CPL tracking.

### Daily Lead Volume Chart Data

```
=QUERY('Raw Data'!A:AX,
  "SELECT K, SUM(Y), SUM(P)/SUM(Y), AVG(AN)
   WHERE K >= date '"&TEXT(TODAY()-30,"yyyy-mm-dd")&"'
   GROUP BY K
   ORDER BY K ASC
   LABEL K 'Date', SUM(Y) 'Leads', SUM(P)/SUM(Y) 'CPL', AVG(AN) 'Avg Quality Score'")
```

### Platform Lead Split

```
=QUERY('Raw Data'!A:AX,
  "SELECT C, SUM(Y), SUM(P)/SUM(Y), AVG(AN)
   WHERE K >= date '"&TEXT(G1,"yyyy-mm-dd")&"'
   AND K <= date '"&TEXT(G2,"yyyy-mm-dd")&"'
   GROUP BY C
   LABEL C 'Platform', SUM(Y) 'Total Leads', SUM(P)/SUM(Y) 'CPL', AVG(AN) 'Avg Quality'")
```

### Charts to Build

1. **Line chart:** Leads per day (last 30 days), dual axis with CPL
2. **Bar chart:** Lead volume by platform (current period vs prior period)
3. **Scatter chart:** CPL vs Lead Quality Score by campaign

---

## Tab 8: Report

**Purpose:** Auto-compose a weekly or monthly report block that can be copied into a client email or doc.

### Report Header

```
Cell A1: ="AdPilot OS — "&Config!B10&" Report"
Cell A2: =Config!B1&" | "&Config!B4&" | Generated: "&TEXT(NOW(),"dd mmm yyyy")
```

### Auto-Composed Summary Block

Use CONCATENATE or `&` to build a text block:

```
=Config!B1&" spent "&TEXT(SUMIFS('Raw Data'!P:P,'Raw Data'!K:K,">="&G1,'Raw Data'!K:K,"<="&G2),"$#,##0")&
" across "&TEXT(G2-G1+1,"0")&" days. "&
"Generated "&TEXT(SUMIFS('Raw Data'!Y:Y,'Raw Data'!K:K,">="&G1,'Raw Data'!K:K,"<="&G2),"#,##0")&" leads at a CPL of "&
TEXT(SUMIFS('Raw Data'!P:P,...)/SUMIFS('Raw Data'!Y:Y,...),"$#,##0.00")&"."
```

*(Build each metric as a named intermediate cell for readability, then concatenate in the summary cell.)*

### Recommendation Block

Manual input cell (I22): Free text where analyst types the weekly recommendation.
This cell is highlighted in light yellow to indicate it requires human input before sending.

Note: This report block is a **proposal only**. No changes are executed from this sheet.

---

## Conditional Formatting — Global Rules Summary

Apply these rules across all metric columns where relevant:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| ROAS | >= break_even_roas | >= break_even_roas * 0.8 | < break_even_roas * 0.8 |
| CPA | <= break_even_cpa | <= break_even_cpa * 1.2 | > break_even_cpa * 1.2 |
| CTR | >= 2% | >= 1% | < 1% |
| CPC | <= $1.50 | <= $3.00 | > $3.00 |
| CPL | <= target_cpl | <= target_cpl * 1.2 | > target_cpl * 1.2 |
| Hook Rate | >= 35% | >= 20% | < 20% |
| Hold Rate | >= 50% | >= 30% | < 30% |
| Frequency | <= 2.5 | <= 4.0 | > 4.0 |
| Health Score | 80–100 | 60–79 | < 60 |

For conditional formatting using Config values, use indirect references:
- `=B3<=Config!$B$13` for CPA <= break_even_cpa

---

## ARRAYFORMULA Usage

Use ARRAYFORMULA to apply computed columns to entire columns without dragging:

```
-- In Raw Data AY1:
=ARRAYFORMULA(IF(ROW(A:A)=1,"ctr_check",IF(Q2:Q>0,T2:T/Q2:Q,0)))
```

This fills the entire column automatically when new rows are added.

---

## V1 Refresh Instructions (Manual)

1. Export data from Meta Ads Manager: Business Suite → Ads Manager → Export → Custom columns matching universal schema → CSV
2. Export data from TikTok Ads Manager: Dashboard → Download → CSV
3. Normalise both CSVs to universal schema column order (use a normalisation script or manual remap)
4. In the workbook: `Raw Data` tab → select all data from A2 down → Delete
5. Paste new combined data starting at A2
6. Check that date column (K) is formatted as date, numeric columns are numbers
7. All other tabs update automatically via QUERY/SUMIFS

**Recommended:** Do this once daily, before 9:00 AM client review.

---

## Naming Convention Checker (Optional — Advanced)

In Raw Data, add a helper column to flag campaigns not matching the convention `[PLATFORM]_[OBJECTIVE]_[AUDIENCE]_[OFFER]_[DATE]`:

```
=IF(REGEXMATCH(F2,"^(META|TT)_[A-Z]+_[A-Z0-9]+_.+_\d{6}$"),"OK","⚠ Name Error")
```

---

## Sheet Protection Settings

- **Config tab:** Protect B1:B34. Only account manager can edit.
- **Raw Data tab:** Protect row 1 (headers). Data rows unlocked for import.
- **All formula cells in Daily/Campaign/Health/Creative/Leads tabs:** Lock all formula cells. Only input cells (date ranges, manual scores) unlocked.
- **Report tab:** Lock header and auto-composed cells. Unlock the recommendation input cell (I22).

---

## Sharing Settings

- Account manager: Edit access
- Client: View-only access (share link, view only)
- Never share the Raw Data tab with clients — use a client-safe view via the Report tab only

*End of Google Sheets Dashboard Spec*
