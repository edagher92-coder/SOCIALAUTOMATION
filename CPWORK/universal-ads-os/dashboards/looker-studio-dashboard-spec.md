# AdPilot OS — Looker Studio Dashboard Spec

**Product:** AdPilot OS (Universal Meta + TikTok Paid-Ads Operating System)
**Report name:** AdPilot OS — Performance Dashboard
**Version:** 1.0
**Currency:** {{client.currency}} (default AUD)
**Audience:** Agency builders implementing the report; clients receive view-only link

---

## Overview

This spec defines a six-page Looker Studio report that connects to the AdPilot OS universal schema. Each section is written so a builder can implement it without guessing — field names, formula syntax, chart types, filter wiring, and layout are all explicit.

**Golden rules carried into this report:**
- No live ad edits are surfaced or triggered from this report.
- No raw account IDs, API keys, or private data appear in the report — only `{{client.*}}` variable references and display-safe labels.
- All monetary values display in {{client.currency}}.
- Tone throughout is numbers-first, plain English.

---

## 1. Data Source Setup

### 1A. Option A — Google Sheets Connector

**Step-by-step:**

1. In Looker Studio, click **Add data > Google Sheets**.
2. Select the client's AdPilot OS master spreadsheet.
3. Set **Worksheet** to the tab named `Raw Data`.
4. Enable **Use first row as headers**.
5. Enable **Include hidden and filtered cells** — OFF (only export clean rows).
6. Set **Refresh rate** to every 15 minutes or 1 hour depending on client tier.

**Naming convention for the data source:**
`AdPilot OS — Raw Data — {{client.business_name}}`

**Sheet URL variable:** Store the Google Sheet URL in the report's embedded notes field, referencing it as `{{client.sheet_url}}`. Never hard-code it in a visible report element.

---

### 1B. Option B — BigQuery Connector

**Step-by-step:**

1. In Looker Studio, click **Add data > BigQuery**.
2. Select project, dataset, and table.
3. Recommended table path: `adpilot_os.universal_schema` (partitioned by `date`, clustered by `business_id`, `platform`).
4. Use **Custom Query** mode if you need to filter by `business_id` at source level (recommended for multi-client BigQuery deployments):

```sql
SELECT *
FROM `adpilot_os.universal_schema`
WHERE business_id = '{{client.business_id}}'
```

5. Set **Data freshness** to match pipeline schedule (hourly or daily).

**BigQuery table notes:**
- Partition on `date` (DATE type) for cost control.
- Cluster on `business_id`, `platform`, `campaign_id`.
- All monetary columns stored as FLOAT64.
- All count columns stored as INTEGER.
- `tracking_status`, `recommendation`, `notes` stored as STRING.

---

### 1C. Field Types — Full Universal Schema Column Reference

Every column from the universal schema must be mapped as follows when the data source is configured. Set the **Aggregation** for Metrics to **Sum** unless otherwise noted.

| Column | Looker Studio Type | Data Type | Aggregation |
|---|---|---|---|
| business_id | Dimension | Text | — |
| business_name | Dimension | Text | — |
| platform | Dimension | Text | — |
| ad_account_id | Dimension | Text | — |
| campaign_id | Dimension | Text | — |
| campaign_name | Dimension | Text | — |
| adset_id | Dimension | Text | — |
| adset_name | Dimension | Text | — |
| ad_id | Dimension | Text | — |
| ad_name | Dimension | Text | — |
| date | Dimension | Date (YYYYMMDD) | — |
| objective | Dimension | Text | — |
| budget_type | Dimension | Text | — |
| daily_budget | Metric | Currency ({{client.currency}}) | Sum |
| lifetime_budget | Metric | Currency ({{client.currency}}) | Sum |
| spend | Metric | Currency ({{client.currency}}) | Sum |
| impressions | Metric | Number (integer) | Sum |
| reach | Metric | Number (integer) | Sum |
| frequency | Metric | Number (decimal, 2dp) | Average |
| clicks | Metric | Number (integer) | Sum |
| ctr | Metric | Percent (2dp) | Auto (see calculated fields) |
| cpc | Metric | Currency ({{client.currency}}) | Auto |
| cpm | Metric | Currency ({{client.currency}}) | Auto |
| landing_page_views | Metric | Number (integer) | Sum |
| leads | Metric | Number (integer) | Sum |
| purchases | Metric | Number (integer) | Sum |
| revenue | Metric | Currency ({{client.currency}}) | Sum |
| cost_per_lead | Metric | Currency ({{client.currency}}) | Auto |
| cost_per_purchase | Metric | Currency ({{client.currency}}) | Auto |
| roas | Metric | Number (decimal, 2dp) | Auto |
| video_views | Metric | Number (integer) | Sum |
| three_second_views | Metric | Number (integer) | Sum |
| six_second_views | Metric | Number (integer) | Sum |
| thruplays | Metric | Number (integer) | Sum |
| hook_rate | Metric | Percent (2dp) | Auto |
| hold_rate | Metric | Percent (2dp) | Auto |
| comments | Metric | Number (integer) | Sum |
| shares | Metric | Number (integer) | Sum |
| saves | Metric | Number (integer) | Sum |
| lead_quality_score | Metric | Number (decimal, 1dp) | Average |
| sales_count | Metric | Number (integer) | Sum |
| gross_profit | Metric | Currency ({{client.currency}}) | Sum |
| utm_source | Dimension | Text | — |
| utm_medium | Dimension | Text | — |
| utm_campaign | Dimension | Text | — |
| utm_content | Dimension | Text | — |
| utm_term | Dimension | Text | — |
| tracking_status | Dimension | Text | — |
| recommendation | Dimension | Text | — |
| notes | Dimension | Text | — |

**Important:** Do NOT use the raw `ctr`, `cpc`, `cpm`, `cost_per_lead`, `cost_per_purchase`, `roas`, `hook_rate`, or `hold_rate` columns from the sheet as your primary metrics in charts. These are stored as row-level calculations and will aggregate incorrectly (averaging ratios). Use the **Calculated Fields** defined in Section 2 instead. The raw columns serve as a reference or for row-level tables only.

---

### 1D. Blended Data Source — Combining Meta + TikTok

Use a **Blended Data Source** when you want a single chart that combines both platforms and the raw data source keeps them as separate rows identified by the `platform` column. In most cases, a single data source with `platform` as a Dimension is sufficient — blending is needed only when you pull from two separate connectors (e.g., a Meta-only connector and a TikTok-only connector).

**If using two separate connectors:**

1. In the chart edit panel, click **Blend data**.
2. Set **Data source 1:** AdPilot OS Meta connector; **Join key:** `date`.
3. Set **Data source 2:** AdPilot OS TikTok connector; **Join key:** `date`.
4. Set **Join type:** Full outer join.
5. Add shared dimensions: `date`, `campaign_name`, `objective`.
6. Add metrics from each source: `spend`, `leads`, `purchases`, `revenue`.
7. Name the blend: `AdPilot OS — Meta+TikTok Blend`.

**Preferred approach:** Keep both platforms in the single universal schema sheet with the `platform` column as a Dimension filter. This avoids blend complexity and keeps calculated fields working correctly across both platforms.

---

## 2. Calculated Fields

Create all of the following as **Calculated Fields** inside the data source (not inside individual charts) so they are reusable across all pages. Navigate to: Data source > Edit > Add a field.

Field names use snake_case. Formulas use Looker Studio formula syntax.

---

### 2.1 CTR — Click-Through Rate

**Field name:** `calc_ctr`
**Type:** Percent, 2 decimal places

```
clicks / impressions
```

**Note:** Looker Studio will automatically handle divide-by-zero as null when impressions = 0. If you want an explicit null guard:

```
CASE WHEN impressions = 0 THEN NULL ELSE clicks / impressions END
```

---

### 2.2 CPC — Cost Per Click

**Field name:** `calc_cpc`
**Type:** Currency ({{client.currency}}), 2 decimal places

```
spend / clicks
```

Null guard version:

```
CASE WHEN clicks = 0 THEN NULL ELSE spend / clicks END
```

---

### 2.3 CPL — Cost Per Lead

**Field name:** `calc_cpl`
**Type:** Currency ({{client.currency}}), 2 decimal places

```
spend / leads
```

Null guard version:

```
CASE WHEN leads = 0 THEN NULL ELSE spend / leads END
```

---

### 2.4 CPA — Cost Per Acquisition (Purchase)

**Field name:** `calc_cpa`
**Type:** Currency ({{client.currency}}), 2 decimal places

```
spend / purchases
```

Null guard version:

```
CASE WHEN purchases = 0 THEN NULL ELSE spend / purchases END
```

---

### 2.5 ROAS — Return on Ad Spend

**Field name:** `calc_roas`
**Type:** Number, 2 decimal places

```
revenue / spend
```

Null guard version:

```
CASE WHEN spend = 0 THEN NULL ELSE revenue / spend END
```

---

### 2.6 MER — Marketing Efficiency Ratio

**Field name:** `calc_mer`
**Type:** Number, 2 decimal places

```
SUM(revenue) / SUM(spend)
```

**Aggregation context — important:** MER must be calculated at the report or page level across ALL ad spend and ALL revenue, not per-row. In Looker Studio, when this field is used in a **Scorecard** with no dimension breakdown, `SUM(revenue) / SUM(spend)` evaluates correctly as a blended ratio. When used in a **Table** with a dimension like `campaign_name`, it evaluates per-campaign, which becomes per-campaign ROAS (same formula). True cross-platform MER should only be displayed in a Scorecard on the Overview page with no dimension grouping. Label it clearly: "MER (All Platforms)".

---

### 2.7 Hook Rate

**Field name:** `calc_hook_rate`
**Type:** Percent, 2 decimal places

```
three_second_views / impressions
```

Null guard version:

```
CASE WHEN impressions = 0 THEN NULL ELSE three_second_views / impressions END
```

**Definition displayed on report:** "% of people who watched at least 3 seconds."

---

### 2.8 Hold Rate

**Field name:** `calc_hold_rate`
**Type:** Percent, 2 decimal places

```
thruplays / three_second_views
```

Null guard version:

```
CASE WHEN three_second_views = 0 THEN NULL ELSE thruplays / three_second_views END
```

**Definition displayed on report:** "% of 3-second viewers who watched to completion."

---

### 2.9 Break-Even ROAS — Parameter-Based

**Field name:** `calc_break_even_roas`
**Type:** Number, 2 decimal places

Looker Studio does not support native parameters in the same way as Tableau. Implement this in one of two ways:

**Option A — Hard-coded per client (simplest):**
Replace `{{client.gross_margin}}` with the client's actual gross margin decimal (e.g., 0.35 for 35%) when setting up the client's report copy.

```
1 / 0.35
```

**Option B — Google Sheets cell reference:**
Add a Config tab in the Google Sheet with `gross_margin` in cell B2. Reference it via a second data source (the Config tab), then create a Blend or use a Scorecard that pulls the value. This adds complexity; Option A is preferred for most clients.

**Display:** Show `calc_break_even_roas` as a reference line on any ROAS chart and as a Scorecard labelled "Break-Even ROAS". Use a conditional format: if `calc_roas` >= `calc_break_even_roas`, colour green; else red.

---

### 2.10 Break-Even CPA — Parameter-Based

**Field name:** `calc_break_even_cpa`
**Type:** Currency ({{client.currency}}), 2 decimal places

Same parameter approach as above. Replace `{{client.average_sale_value}}` and `{{client.gross_margin}}` with client actuals.

```
500 * 0.35
```
*(Example: $500 average sale value × 35% gross margin = $175 break-even CPA)*

**Display:** Show as a reference line on CPL/CPA charts and as a Scorecard labelled "Break-Even CPA". Conditional format: if `calc_cpa` <= `calc_break_even_cpa`, colour green; else red.

---

### 2.11 Health Score — Component Scores

Health Score is a composite 0-100 metric. Because Looker Studio does not natively support multi-condition weighted scoring in a single formula without nesting, build it as a series of component fields and sum them.

**Component fields (each returns 0 or its max weight):**

```
// tracking_score (max 15)
CASE WHEN tracking_status = 'active' THEN 15 ELSE 0 END

// cpa_score (max 15) — scores 15 if calc_cpa <= break_even_cpa, 8 if within 20%, else 0
CASE
  WHEN spend = 0 THEN 0
  WHEN purchases = 0 THEN 0
  WHEN (spend / purchases) <= (500 * 0.35) THEN 15
  WHEN (spend / purchases) <= (500 * 0.35) * 1.2 THEN 8
  ELSE 0
END

// spend_efficiency_score (max 12) — scores 12 if ROAS >= break_even_roas
CASE
  WHEN spend = 0 THEN 0
  WHEN (revenue / spend) >= (1 / 0.35) THEN 12
  WHEN (revenue / spend) >= (1 / 0.35) * 0.8 THEN 6
  ELSE 0
END

// ctr_score (max 8) — benchmark: >1.5% = 8, 0.8–1.5% = 4, <0.8% = 0
CASE
  WHEN impressions = 0 THEN 0
  WHEN (clicks / impressions) >= 0.015 THEN 8
  WHEN (clicks / impressions) >= 0.008 THEN 4
  ELSE 0
END

// hook_rate_score (max 8) — benchmark: >30% = 8, 15–30% = 4, <15% = 0
CASE
  WHEN impressions = 0 THEN 0
  WHEN (three_second_views / impressions) >= 0.30 THEN 8
  WHEN (three_second_views / impressions) >= 0.15 THEN 4
  ELSE 0
END
```

**Total Health Score field:**

**Field name:** `calc_health_score`
**Type:** Number, 0 decimal places

```
tracking_score + cpa_score + spend_efficiency_score + ctr_score + hook_rate_score
```

*(Add remaining component fields as you build them for conversion rate, lead quality, creative freshness, CPC, naming, offer, landing page, pacing, data confidence.)*

**Health Score band field:**

**Field name:** `calc_health_band`
**Type:** Text

```
CASE
  WHEN calc_health_score >= 80 THEN 'Green'
  WHEN calc_health_score >= 60 THEN 'Yellow'
  WHEN calc_health_score >= 40 THEN 'Orange'
  ELSE 'Red'
END
```

---

## 3. Report Pages — Detailed Layout

### Report-Level Settings (applies to all pages)

- **Canvas size:** 1280 × 900 px (widescreen) or 1440 × 900 px for larger screens.
- **Theme:** Custom (see Section 5 for white-label setup).
- **Report name:** AdPilot OS — {{client.business_name}} — Performance Dashboard
- **Report-level filter:** `business_id = '{{client.business_id}}'` applied via a report-level filter control so all pages show only this client's data.

---

### Page 1 — Overview

**Purpose:** Give the client or account manager an instant read on overall account health for the selected period.

**Page name:** Overview

**Layout (top to bottom, left to right):**

**Row 1 — Header bar (full width, ~60px tall):**
- Left: Client logo image placeholder ({{client.logo_url}}, 120×40px)
- Centre: Report title text — "{{client.business_name}} — Paid Ads Overview"
- Right: "Powered by AdPilot OS" text (remove for white-label, see Section 5)

**Row 2 — Controls (~80px tall):**
- Date Range Selector: default = Last 30 days; position top-right of the control row
- Platform Filter (dropdown): field = `platform`; options = All / Meta / TikTok
- Campaign Filter (dropdown): field = `campaign_name`; sort A–Z

**Row 3 — Scorecards (~140px tall, 6 across):**
All scorecards use the date range from the date range selector. Comparison period = previous equivalent period (auto-calculated by Looker Studio when comparison date range is enabled).

| Position | Label | Field | Format | Comparison |
|---|---|---|---|---|
| 1 | Total Spend | `spend` (SUM) | Currency, 0dp | vs prior period |
| 2 | Total Leads | `leads` (SUM) | Number, 0dp | vs prior period |
| 3 | Cost Per Lead | `calc_cpl` | Currency, 2dp | vs prior period (down = good) |
| 4 | ROAS | `calc_roas` | Number, 2dp | vs prior period |
| 5 | MER (All Platforms) | `calc_mer` | Number, 2dp | vs prior period |
| 6 | Health Score | `calc_health_score` (AVG) | Number, 0dp | no comparison |

**Scorecard conditional formatting:**
- CPL scorecard: value > `calc_break_even_cpa` → text colour red; value <= → green
- ROAS scorecard: value < `calc_break_even_roas` → text colour red; value >= → green
- Health Score: apply background colour via band (Green/Yellow/Orange/Red map to #28a745 / #ffc107 / #fd7e14 / #dc3545)

**Row 4 — Primary Charts (~300px tall):**

**Left chart (65% width) — Time Series: Spend + Leads over Time**
- Chart type: Combo chart (line + bar)
- X-axis: `date` (Day granularity; allow user to change to Week/Month via dimension drill)
- Left Y-axis (bar): `spend` (SUM) — bar colour = {{client.primary_colour}}
- Right Y-axis (line): `leads` (SUM) — line colour = {{client.secondary_colour}}
- Title: "Spend & Leads Over Time"
- Show data labels: OFF (too cluttered at day level)
- Legend: bottom

**Right chart (35% width) — Platform Split**
- Chart type: Pie chart (or Donut chart)
- Dimension: `platform`
- Metric: `spend` (SUM)
- Title: "Spend by Platform"
- Slice colours: Meta = #1877F2 (Facebook blue), TikTok = #000000 or #EE1D52
- Show percentage labels: ON
- Show legend: bottom

**Row 5 — Secondary summary table (~280px tall, full width):**
- Chart type: Table with heatmap
- Dimensions: `platform`, `campaign_name`
- Metrics: `spend`, `leads`, `calc_cpl`, `purchases`, `calc_cpa`, `calc_roas`, `calc_health_score`
- Sort default: `spend` descending
- Rows per page: 10
- Heatmap on: `calc_roas` (green = high), `calc_cpl` (red = high)
- Title: "Campaign Summary"

---

### Page 2 — Platform Comparison (Meta vs TikTok)

**Purpose:** Side-by-side performance view to show where budget is working harder.

**Page name:** Platform Compare

**Row 1 — Header + controls:**
Same date range selector and campaign filter as Page 1. Platform filter not needed here (page is designed to show both).

**Row 2 — Side-by-side Scorecards (Meta | TikTok):**

Build two sets of Scorecards using a **Report-level Filter** applied per scorecard group:
- Meta scorecards: add chart-level filter `platform = 'Meta'`
- TikTok scorecards: add chart-level filter `platform = 'TikTok'`

Label columns with platform name as a static text label above each group.

| Metric | Meta Scorecard | TikTok Scorecard |
|---|---|---|
| Spend | `spend` SUM | `spend` SUM |
| Leads | `leads` SUM | `leads` SUM |
| CPL | `calc_cpl` | `calc_cpl` |
| ROAS | `calc_roas` | `calc_roas` |
| CTR | `calc_ctr` | `calc_ctr` |
| Hook Rate | `calc_hook_rate` | `calc_hook_rate` |

Scorecard sizing: 6 per row × 2 rows = 12 scorecards total across the two platforms.

**Row 3 — Comparison Bar Charts (side by side):**

**Left chart — Spend by Platform over Time:**
- Chart type: Stacked bar
- X-axis: `date` (Week)
- Dimension breakdown: `platform`
- Metric: `spend`
- Colours: Meta = #1877F2, TikTok = #EE1D52
- Title: "Weekly Spend: Meta vs TikTok"

**Right chart — CPL by Platform over Time:**
- Chart type: Line chart
- X-axis: `date` (Week)
- Line 1: `calc_cpl` filtered to Meta (chart-level filter)
- Line 2: `calc_cpl` filtered to TikTok (chart-level filter)
- Add reference line: `calc_break_even_cpa` (dashed, labelled "Break-Even CPA")
- Title: "Weekly CPL: Meta vs TikTok"

**Row 4 — Platform Efficiency Table:**
- Chart type: Pivot table
- Row dimension: `platform`
- Column dimension: `objective`
- Metrics: `spend`, `leads`, `calc_cpl`, `purchases`, `calc_cpa`, `calc_roas`, `calc_ctr`, `calc_hook_rate`, `calc_hold_rate`
- Sort: `spend` descending
- Grand totals: ON (row and column)
- Title: "Platform × Objective Efficiency"
- Cell formatting: percent fields formatted as %, currency fields as {{client.currency}}

---

### Page 3 — Campaign Drilldown

**Purpose:** Sortable campaign-level performance table with pacing indicator.

**Page name:** Campaign Drilldown

**Row 1 — Controls:**
- Date range selector
- Platform filter
- Objective filter (field = `objective`)
- Budget type filter (field = `budget_type`; options = Daily / Lifetime / All)

**Row 2 — Campaign Performance Table (full width, ~400px tall):**
- Chart type: Table with sorting enabled
- Dimensions: `platform`, `campaign_name`, `objective`, `budget_type`
- Metrics (in this order): `spend`, `daily_budget`, `leads`, `calc_cpl`, `purchases`, `calc_cpa`, `revenue`, `calc_roas`, `impressions`, `calc_ctr`, `calc_cpc`, `calc_health_score`
- Default sort: `spend` descending
- Rows per page: 15
- Allow column sorting: ON (user can click column headers)
- Conditional formatting:
  - `calc_roas` column: background colour scale from red (low) to green (high); midpoint = `calc_break_even_roas`
  - `calc_cpl` column: background colour scale from green (low) to red (high); midpoint = `calc_break_even_cpa`
  - `calc_health_score` column: background = band colour (see band definitions in Section 2.11)
- Title: "Campaign Performance — Sortable"

**Row 3 — Campaign Time Series (left) + Budget Pacing (right):**

**Left chart (60% width) — Campaign-level Spend + Leads Over Time:**
- Chart type: Line chart
- X-axis: `date` (Day)
- Dimension breakdown: `campaign_name`
- Metric: `spend`
- Limit series to top 5 by spend (Looker Studio: use "Top N" sort on the dimension)
- Add second line: `leads`
- Title: "Daily Spend by Campaign (Top 5)"
- Enable legend toggle

**Right chart (40% width) — Budget Pacing Indicator:**
- Chart type: Bullet chart (use a bar chart as a workaround since Looker Studio has no native bullet chart)
- Construction:
  - Create a calculated field: `calc_budget_pacing_pct` = `spend / daily_budget`
  - Bar metric: `calc_budget_pacing_pct`
  - Dimension: `campaign_name`
  - Add reference line at 1.0 (100% of budget)
  - Colour bar: green if <= 0.9, yellow if 0.9–1.0, red if > 1.0
- Title: "Budget Pacing (Spend / Daily Budget)"
- Note below chart: "Values above 100% indicate overspend. This is informational only — no budget changes are made from this report."

---

### Page 4 — Creative Performance

**Purpose:** Identify which individual ads (creatives) are driving results and which are fatiguing.

**Page name:** Creative Performance

**Row 1 — Controls:**
- Date range selector
- Platform filter
- Campaign filter
- Adset filter (field = `adset_name`)

**Row 2 — Creative Performance Table (full width, ~380px tall):**
- Chart type: Table
- Dimensions: `platform`, `campaign_name`, `ad_name`
- Metrics: `spend`, `impressions`, `calc_ctr`, `calc_hook_rate`, `calc_hold_rate`, `leads`, `calc_cpl`, `video_views`, `three_second_views`, `thruplays`
- Default sort: `spend` descending
- Rows per page: 20
- Conditional formatting:
  - `calc_hook_rate`: green if >= 30%, yellow if 15–29%, red if < 15%
  - `calc_hold_rate`: green if >= 25%, yellow if 10–24%, red if < 10%
  - `calc_ctr`: green if >= 1.5%, yellow if 0.8–1.49%, red if < 0.8%
  - `calc_cpl`: green if <= break-even, red if above
- Title: "Ad-Level Creative Metrics"

**Row 3 — Top vs Bottom Performers:**

**Left chart (50% width) — Top 5 Ads by ROAS:**
- Chart type: Horizontal bar chart
- Dimension: `ad_name`
- Metric: `calc_roas`
- Sort: `calc_roas` descending, top 5
- Bar colour: green (#28a745)
- Title: "Top 5 Ads by ROAS"
- Add reference line: `calc_break_even_roas` (dashed)

**Right chart (50% width) — Bottom 5 Ads by CPL (highest cost = worst):**
- Chart type: Horizontal bar chart
- Dimension: `ad_name`
- Metric: `calc_cpl`
- Sort: `calc_cpl` descending, top 5 (these are the worst performers)
- Bar colour: red (#dc3545)
- Title: "Bottom 5 Ads by CPL (Highest Cost)"
- Add reference line: `calc_break_even_cpa` (dashed)

**Row 4 — Video Funnel Chart:**
- Chart type: Bar chart (horizontal, stacked — use to simulate a funnel)
- Dimension: `ad_name`
- Metrics (each as a separate bar/segment): `impressions`, `three_second_views`, `six_second_views`, `thruplays`
- Limit to top 10 ads by spend
- Alternatively: Use a single-row table with the funnel metrics totalled (no dimension) as a header funnel for the page

**Funnel Scorecard row (total across filtered ads):**
Four scorecards in a row:
1. Total Impressions
2. 3-Second Views (+ % of impressions = calc_hook_rate)
3. 6-Second Views
4. Thruplays (+ % of 3-second views = calc_hold_rate)

Each scorecard labelled with definition tooltip text.

---

### Page 5 — Leads & Sales

**Purpose:** Show the lead generation and revenue pipeline in detail.

**Page name:** Leads & Sales

**Row 1 — Controls:**
- Date range selector
- Platform filter
- Campaign filter

**Row 2 — Lead Volume Trend (full width, ~240px tall):**
- Chart type: Bar chart (bars = leads volume)
- X-axis: `date` (Week)
- Metric: `leads` (SUM)
- Overlay line: `calc_cpl`
- Right Y-axis: `calc_cpl`
- Reference line on CPL axis: `calc_break_even_cpa`
- Title: "Weekly Lead Volume & Cost Per Lead"
- Colour: bars = {{client.primary_colour}}, line = {{client.secondary_colour}}

**Row 3 — Scorecards (5 across):**

| Label | Field | Format |
|---|---|---|
| Total Leads | `leads` SUM | Number, 0dp |
| Avg CPL | `calc_cpl` | Currency, 2dp |
| Lead → Purchase Rate | `purchases / leads` (calculated field: `calc_conversion_rate`) | Percent, 2dp |
| Avg Lead Quality Score | `lead_quality_score` AVG | Number, 1dp |
| Total Revenue | `revenue` SUM | Currency, 0dp |

**Calculated field for conversion rate:**
**Field name:** `calc_conversion_rate`

```
CASE WHEN leads = 0 THEN NULL ELSE purchases / leads END
```

**Row 4 — Left: CPL Trend | Right: Lead Quality Distribution:**

**Left chart (50% width) — CPL Trend by Platform:**
- Chart type: Line chart
- X-axis: `date` (Week)
- Dimension breakdown: `platform`
- Metric: `calc_cpl`
- Reference line: `calc_break_even_cpa`
- Title: "CPL Trend: Meta vs TikTok"

**Right chart (50% width) — Lead Quality Score Distribution:**
- Chart type: Bar chart
- Dimension: Score bucket (create a calculated field `calc_lqs_bucket`)

```
CASE
  WHEN lead_quality_score >= 8 THEN '8–10 (High)'
  WHEN lead_quality_score >= 5 THEN '5–7 (Medium)'
  WHEN lead_quality_score >= 1 THEN '1–4 (Low)'
  ELSE 'Unscored'
END
```

- Metric: COUNT(leads) — use `leads` SUM as a proxy (each row = one day's aggregate; for true lead count, ensure data is at ad/day granularity)
- Colours: High = green, Medium = yellow, Low = red, Unscored = grey
- Title: "Lead Quality Score Distribution"

**Row 5 — Revenue & ROAS Over Time (full width, ~240px tall):**
- Chart type: Combo chart
- X-axis: `date` (Week)
- Bar metric: `revenue` SUM — {{client.primary_colour}}
- Line metric: `calc_roas` — {{client.secondary_colour}}, right Y-axis
- Reference line on ROAS axis: `calc_break_even_roas`
- Title: "Weekly Revenue & ROAS"

---

### Page 6 — Health Score

**Purpose:** Give an account-level view of AdPilot OS Health Scores per campaign so the team knows where to focus.

**Page name:** Health Score

**Row 1 — Controls:**
- Date range selector
- Platform filter

**Row 2 — Account-Level Health Scorecard (centre of page, large):**
- Chart type: Scorecard (large, centred)
- Metric: `calc_health_score` AVG across all campaigns
- Format: Number, 0dp
- Background colour: dynamic via `calc_health_band` (requires a workaround — see note)
- Label: "Overall Account Health Score"
- Below scorecard: static text showing band definitions
  - Green: 80–100 | Yellow: 60–79 | Orange: 40–59 | Red: 0–39

**Workaround for dynamic scorecard background in Looker Studio:** Looker Studio does not support dynamic background colours on Scorecards based on field values. To simulate it:
1. Use a Table with a single row (no dimension, total row only) and apply conditional formatting to the `calc_health_score` column.
2. Size the table cell to look like a scorecard.
3. Alternatively, add four invisible rectangle shapes in Green/Yellow/Orange/Red, and use a Blended data source to control visibility — this is complex and not recommended. The single-cell Table workaround is preferred.

**Row 3 — Campaign Health Score Table (full width, ~380px tall):**
- Chart type: Table with conditional formatting
- Dimensions: `platform`, `campaign_name`, `objective`
- Metrics: `calc_health_score`, `calc_health_band`, `spend`, `calc_roas`, `calc_cpl`, `leads`, tracking_status
- Default sort: `calc_health_score` ascending (worst first)
- Rows per page: 20
- Conditional formatting on `calc_health_score` column:
  - >= 80: background #28a745 (green), text white
  - 60–79: background #ffc107 (yellow), text black
  - 40–59: background #fd7e14 (orange), text white
  - 0–39: background #dc3545 (red), text white
- Conditional formatting on `tracking_status`:
  - 'active': text green
  - anything else: text red
- Title: "Campaign Health Scores"

**Row 4 — Health Score Component Breakdown (full width, ~280px tall):**
- Chart type: Stacked bar chart (horizontal)
- Dimension: `campaign_name`
- Metrics (stacked): each component score field (tracking_score, cpa_score, spend_efficiency_score, ctr_score, hook_rate_score, and remaining components)
- Max bar length = 100 (total possible score)
- Colour each component segment distinctly
- Title: "Health Score Component Breakdown by Campaign"
- Legend: show component name for each colour

**Row 5 — Health Score Trend Over Time:**
- Chart type: Line chart
- X-axis: `date` (Week)
- Metric: `calc_health_score` AVG
- Dimension breakdown: `campaign_name`
- Limit to top 5 campaigns by spend
- Title: "Health Score Trend (Top 5 Campaigns)"
- Add reference lines: 80 (green threshold), 60 (yellow threshold), 40 (orange threshold)

---

## 4. Filters & Controls

### 4.1 Date Range Selector

- **Component:** Date range control (built-in Looker Studio control)
- **Default range:** Last 30 days
- **Allow comparison period:** ON (show vs prior period toggle)
- **Placement:** Top-right of each page, same vertical position across all pages
- **Apply to:** All data sources used on the page
- **Builder note:** After placing the control, click it, go to Data > Applied to data sources, and ensure all data sources on that page are checked.

### 4.2 Platform Filter

- **Component:** Drop-down list control
- **Data source:** Primary data source
- **Control field:** `platform`
- **Options (metric):** COUNT of records (so dropdown populates automatically)
- **Default selection:** All (no filter)
- **Allow multiple selection:** No (single select — Meta / TikTok / All)
- **Placement:** Below date range selector or beside it
- **Apply to:** All relevant data sources on page

### 4.3 Campaign Filter

- **Component:** Drop-down list control
- **Control field:** `campaign_name`
- **Default selection:** All
- **Allow multiple selection:** Yes (client may want to compare two campaigns)
- **Sort options:** A–Z
- **Placement:** On pages where campaign-level data is shown (Pages 1, 3, 4, 5)

### 4.4 Objective Filter

- **Component:** Drop-down list control
- **Control field:** `objective`
- **Values expected:** LEAD_GENERATION, CONVERSIONS, TRAFFIC, AWARENESS, VIDEO_VIEWS (populate from actual data)
- **Default selection:** All
- **Placement:** Page 3 (Campaign Drilldown) and Page 6 (Health Score)

### 4.5 Data Segment Control (Advanced)

- **Purpose:** Allow toggling between views of a single campaign's adsets vs all campaigns
- **Component:** Drop-down list control
- **Control field:** `adset_name`
- **Default:** All
- **Placement:** Pages 4 (Creative Performance) and 5 (Leads & Sales)

### 4.6 Filter Interaction Notes

- All controls on a page should apply to all charts on that page unless a chart has a deliberate chart-level filter (e.g., Meta-only or TikTok-only scorecards on Page 2).
- To exclude a control from applying to a specific chart: click the chart > Data > Filter by > uncheck the relevant control.
- Report-level filter (`business_id = '{{client.business_id}}'`) is applied at the report level and cannot be overridden by page-level controls. This is the client isolation mechanism.

---

## 5. White-Label Per Client

### 5.1 Theme Settings

**Access:** Report > Theme and layout > Customise

**Settings to configure per client:**

| Setting | Where | Value |
|---|---|---|
| Primary colour | Theme > Accent colour 1 | {{client.primary_colour}} (hex) |
| Secondary colour | Theme > Accent colour 2 | {{client.secondary_colour}} (hex) |
| Background colour | Theme > Background | #FFFFFF or {{client.bg_colour}} |
| Font family | Theme > Font | {{client.font}} (use Google Font name or 'Roboto' as default) |
| Report title font size | Theme > Title | 18pt |
| Label font size | Theme > Label | 10pt |

**Logo placement:**
- Insert > Image > Upload image file ({{client.logo_url}} — download and upload as PNG with transparent background)
- Position: top-left of each page, 120×40px maximum
- Do not use an external URL for the logo in the image element — upload the file so it persists if the URL changes.

### 5.2 Business ID Filter for Client Isolation

Every client's report copy must have a **Report-level filter** applied:

1. Go to Resource > Manage report filters.
2. Click **Add a filter**.
3. Name: `Client Isolation — {{client.business_name}}`
4. Condition: `business_id` equals `{{client.business_id}}`
5. Apply to: All pages.

This ensures that even if the underlying data source contains multiple clients' data (e.g., a shared BigQuery table), each report copy only displays data for that specific business.

**Never expose `business_id` as a visible column in any table shown to clients.** It is for filtering only.

### 5.3 How to Copy and Template for Each New Client

**Process for onboarding a new client:**

1. Open the AdPilot OS master template report (keep one locked master copy that is never shared with clients).
2. Click the three-dot menu > **Make a copy**.
3. Name the copy: `AdPilot OS — {{client.business_name}} — Performance Dashboard — v1`
4. In the copy: update data source to point to the client's Google Sheet or apply the BigQuery filter for their `business_id`.
5. Update the report-level filter (Section 5.2) with the client's `business_id`.
6. Update all hard-coded client parameter values:
   - Break-Even ROAS formula: replace gross_margin decimal
   - Break-Even CPA formula: replace average_sale_value and gross_margin
   - Health Score component thresholds if client has non-standard benchmarks
7. Update theme settings (logo, colours, font).
8. Remove or replace any AdPilot OS branding for white-label delivery (Section 5.5).
9. Set viewer permissions (Section 5.4).
10. Send the view-only link to the client.

**Keep a client registry** (in the AdPilot OS Config spreadsheet) with:
- Client name
- business_id
- Report URL
- Data source URL
- Date created
- Owner

### 5.4 Viewer Permissions

**To share a view-only link:**

1. Click **Share** (top right) > **Manage access**.
2. Set sharing to **Anyone with the link** > **Viewer**.
3. Do NOT grant Editor access to clients — they cannot modify filters, layouts, or data sources.
4. Alternatively: share with specific Google email addresses at Viewer level for added security.
5. For extra security on sensitive accounts: share with specific emails only, not "anyone with the link".

**Builder / editor access:**
- Agency staff who maintain reports: Editor
- Agency owners: Editor + can manage (Owner)
- Clients: Viewer only
- Client-side analyst who needs to adjust date ranges: Viewer (date range controls work for Viewer-level users)

**Important:** Looker Studio Viewer access allows users to change date range controls and filter controls. It does not allow them to edit charts, add fields, or see the underlying data source connection details.

### 5.5 Removing AdPilot OS Branding for Resale

When delivering to clients under your own agency brand (not AdPilot OS brand):

1. **Report header:** Replace "Powered by AdPilot OS" text element with your agency name or remove it entirely.
2. **Report title:** Change to "{{client.business_name}} — Paid Ads Dashboard" with your agency's name if desired.
3. **Footer text:** Remove or replace any AdPilot OS references in footer text elements.
4. **Favicon/thumbnail:** Looker Studio uses the first page thumbnail as the report icon. Ensure the first page does not prominently feature AdPilot OS branding visible in the thumbnail.
5. **Embedded text references:** Search all pages for any static text elements containing "AdPilot OS" and update or remove them.
6. **Data source names:** Update the data source display name (in Resource > Manage added data sources) to remove AdPilot OS references — clients can sometimes see the data source name in the report footer area.

**What you cannot remove:** Looker Studio's own "Made with Looker Studio" watermark in the bottom-left of the report view. This is a Google requirement and cannot be removed on free-tier Looker Studio. Looker Studio Pro (paid) does not remove this watermark either — it is always present.

---

## Appendix A — Metric Reference Benchmarks

These are default benchmarks used in conditional formatting and health score calculations. Override per client as needed.

| Metric | Below Benchmark | At Benchmark | Above Benchmark |
|---|---|---|---|
| CTR (Meta) | < 0.8% | 0.8–1.5% | > 1.5% |
| CTR (TikTok) | < 0.5% | 0.5–1.2% | > 1.2% |
| Hook Rate | < 15% | 15–30% | > 30% |
| Hold Rate | < 10% | 10–25% | > 25% |
| CPL | > break-even | at break-even | < break-even |
| ROAS | < break-even | at break-even | > break-even |
| Lead Quality Score | < 5 | 5–7 | > 7 |
| Frequency | < 1.5 | 1.5–4 | > 4 (fatigue risk) |

---

## Appendix B — Naming Conventions for Looker Studio Elements

Follow these naming conventions when building to keep the report maintainable.

| Element | Convention | Example |
|---|---|---|
| Report | `AdPilot OS — [Client] — Performance Dashboard — v[N]` | AdPilot OS — Acme Co — Performance Dashboard — v1 |
| Data source | `AdPilot OS — Raw Data — [Client]` | AdPilot OS — Raw Data — Acme Co |
| Calculated field | `calc_[metric_name]` | calc_cpl |
| Component score field | `score_[component]` | score_tracking |
| Report-level filter | `Client Isolation — [Client]` | Client Isolation — Acme Co |
| Page | Title case, concise | Campaign Drilldown |
| Chart title | Sentence case, descriptive | "Weekly lead volume & CPL" |

---

## Appendix C — Troubleshooting Common Looker Studio Issues

**Problem: Calculated field returns null for all rows**
Cause: Division by zero or field name mismatch.
Fix: Check that field names in the formula exactly match the data source field names (case-sensitive). Add null guards as shown in Section 2.

**Problem: Metrics aggregate incorrectly in tables (e.g., CTR looks wrong)**
Cause: Using the raw `ctr` column instead of `calc_ctr` calculated field.
Fix: Replace raw ratio columns with calculated fields in all charts.

**Problem: Date range selector not affecting a chart**
Cause: The chart's data source is not linked to the date range control.
Fix: Click the date range control > select all applicable data sources.

**Problem: Platform filter not working on blended data source**
Cause: Blend join keys do not include `platform`, so the filter cannot match.
Fix: Add `platform` as a join key in the blend, or apply separate chart-level filters per platform.

**Problem: Report shows all clients' data despite business_id filter**
Cause: Report-level filter was not saved or was accidentally removed.
Fix: Go to Resource > Manage report filters > verify the business_id filter exists and is applied to all pages.

**Problem: Break-even reference lines not showing on charts**
Cause: Calculated field `calc_break_even_roas` or `calc_break_even_cpa` is missing or has wrong formula.
Fix: Verify the calculated field exists in the data source (Resource > Manage added data sources > Edit) and that the gross_margin/average_sale_value values have been substituted correctly.
