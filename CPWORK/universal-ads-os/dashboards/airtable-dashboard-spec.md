# AdPilot OS — Airtable Base Specification

**System:** AdPilot OS — Universal Meta + TikTok Paid-Ads Operating System  
**Purpose:** Full Airtable implementation spec for a resellable client base  
**Currency:** AUD ({{client.currency}})  
**Safety principle:** No live ad edits; changes ship as paused duplicates/drafts/proposals only; never delete (archive); money moves require typed YES confirmation; no API keys, account IDs or private data — use `{{client.*}}` variables throughout

---

## Base Name

```
AdPilot OS — [Client Name]
```

Replace `[Client Name]` with `{{client.business_name}}` at setup time.

---

## Config Variables Reference

| Variable | Description |
|---|---|
| `{{client.business_name}}` | Business trading name |
| `{{client.industry}}` | Industry/vertical |
| `{{client.location}}` | Primary market location |
| `{{client.currency}}` | Currency code (default: AUD) |
| `{{client.main_offer}}` | Core product or service being advertised |
| `{{client.average_sale_value}}` | Average revenue per sale |
| `{{client.gross_margin}}` | Gross margin as a decimal (e.g. 0.40 for 40%) |
| `{{client.monthly_budget}}` | Total monthly ad spend budget |
| `{{client.platform_focus}}` | Meta / TikTok / Both |
| `{{client.reporting_frequency}}` | Weekly / Fortnightly / Monthly |

---

## Metrics Definitions (Applied Throughout)

| Metric | Formula |
|---|---|
| CTR | `clicks / impressions` |
| CPC | `spend / clicks` |
| CPM | `(spend / impressions) * 1000` |
| CPL | `spend / leads` |
| CPA | `spend / purchases` |
| ROAS | `revenue / spend` |
| MER | `total_revenue / total_ad_spend` |
| Hook Rate | `three_second_views / impressions` |
| Hold Rate | `thruplays / three_second_views` |
| Break-Even CPA | `average_sale_value * gross_margin` |
| Break-Even ROAS | `1 / gross_margin` |

---

## Health Score System

**Scale:** 0–100  
**Bands:** Green 80–100 | Yellow 60–79 | Orange 40–59 | Red 0–39

| Component | Weight |
|---|---|
| Tracking integrity | 15 |
| CPA vs break-even | 15 |
| Spend efficiency | 12 |
| Conversion rate | 10 |
| CTR | 8 |
| Lead quality | 8 |
| Creative freshness | 8 |
| CPC | 7 |
| Naming convention compliance | 5 |
| Offer strength | 5 |
| Landing-page alignment | 4 |
| Budget pacing | 2 |
| Data confidence | 1 |
| **Total** | **100** |

---

## Table 1 — Businesses

**Purpose:** One record per client business. The master config table. All other tables link back here directly or via Campaigns.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `business_id` | Autonumber | Primary key; auto-increments |
| `business_name` | Single line text | `{{client.business_name}}` — display name |
| `industry` | Single line text | `{{client.industry}}` |
| `location` | Single line text | `{{client.location}}` |
| `currency` | Single line text | Default: AUD |
| `main_offer` | Single line text | `{{client.main_offer}}` |
| `average_sale_value` | Currency | AUD; `{{client.average_sale_value}}` |
| `gross_margin` | Percent | Stored as decimal (0–1); `{{client.gross_margin}}` |
| `monthly_budget` | Currency | AUD; `{{client.monthly_budget}}` |
| `platform_focus` | Single select | Options: **Meta** / **TikTok** / **Both** |
| `reporting_frequency` | Single select | Options: **Weekly** / **Fortnightly** / **Monthly** |
| `break_even_cpa` | Formula (Currency) | `{average_sale_value} * {gross_margin}` |
| `break_even_roas` | Formula (Number, 2dp) | `1 / {gross_margin}` |
| `health_score` | Rollup | Source: Campaigns → `health_score`; Aggregation: AVG; rounded to 0dp |
| `active_campaigns` | Count | Count of linked Campaigns where `status = "Active"` |
| `total_monthly_spend` | Rollup | Source: Campaigns → DailyMetrics → `spend` for current month; SUM |
| `notes` | Long text | Free-form; rich text enabled |
| `created_date` | Created time | Auto |
| `last_modified` | Last modified time | Auto |

### Views

| View Name | Type | Config |
|---|---|---|
| All Businesses | Grid | Default; all fields visible; sorted by `business_name` A→Z |
| Active Clients | Grid | Filter: `active_campaigns > 0`; fields: name, platform, monthly_budget, health_score, break_even_cpa, break_even_roas |
| Health Overview | Grid | Sorted by `health_score` ASC (worst first); colour-coded health_score field by band |
| Config Sheet | Grid | All config fields visible; used for onboarding setup |

---

## Table 2 — Campaigns

**Purpose:** One record per ad campaign per platform. The operational hub — drives decisions, health scoring and rollups from DailyMetrics.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `campaign_id` | Single line text | Platform-native campaign ID — entered manually; no auto-sync |
| `campaign_name` | Single line text | Must follow naming convention: `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` |
| `platform` | Single select | Options: **Meta** / **TikTok** |
| `objective` | Single select | Options: **Awareness** / **Traffic** / **Leads** / **Conversions** / **Sales** |
| `budget_type` | Single select | Options: **Daily** / **Lifetime** |
| `daily_budget` | Currency | AUD; populate if budget_type = Daily |
| `lifetime_budget` | Currency | AUD; populate if budget_type = Lifetime |
| `status` | Single select | Options: **Active** / **Paused** / **Archived** |
| `business` | Link to Businesses | Many-to-one; required |
| `start_date` | Date | Campaign launch date |
| `end_date` | Date | Optional; for lifetime budget campaigns |
| `total_spend` | Rollup | Source: DailyMetrics → `spend`; Aggregation: SUM |
| `total_impressions` | Rollup | Source: DailyMetrics → `impressions`; Aggregation: SUM |
| `total_clicks` | Rollup | Source: DailyMetrics → `clicks`; Aggregation: SUM |
| `total_leads` | Rollup | Source: DailyMetrics → `leads`; Aggregation: SUM |
| `total_purchases` | Rollup | Source: DailyMetrics → `purchases`; Aggregation: SUM |
| `total_revenue` | Rollup | Source: DailyMetrics → `revenue`; Aggregation: SUM |
| `CPL` | Formula (Currency) | `IF({total_leads} > 0, {total_spend} / {total_leads}, 0)` |
| `CPA` | Formula (Currency) | `IF({total_purchases} > 0, {total_spend} / {total_purchases}, 0)` |
| `ROAS` | Formula (Number, 2dp) | `IF({total_spend} > 0, {total_revenue} / {total_spend}, 0)` |
| `CTR` | Formula (Percent, 2dp) | `IF({total_impressions} > 0, {total_clicks} / {total_impressions}, 0)` |
| `CPM` | Formula (Currency) | `IF({total_impressions} > 0, ({total_spend} / {total_impressions}) * 1000, 0)` |
| `health_score` | Formula (Number, 0dp) | See Health Score Formula section below |
| `health_band` | Formula (Single line text) | `IF({health_score} >= 80, "Green", IF({health_score} >= 60, "Yellow", IF({health_score} >= 40, "Orange", "Red")))` |
| `break_even_cpa_lookup` | Lookup | Source: business → `break_even_cpa` |
| `break_even_roas_lookup` | Lookup | Source: business → `break_even_roas` |
| `cpa_vs_breakeven` | Formula (Percent, 1dp) | `IF({break_even_cpa_lookup} > 0, {CPA} / {break_even_cpa_lookup}, 0)` — values > 1 = above break-even (bad) |
| `roas_vs_breakeven` | Formula (Number, 2dp) | `IF({break_even_roas_lookup} > 0, {ROAS} / {break_even_roas_lookup}, 0)` — values < 1 = below break-even (bad) |
| `days_running` | Formula (Number, 0dp) | `DATETIME_DIFF(TODAY(), {start_date}, 'days')` |
| `recommendation` | Long text | Analyst/AI-generated recommendation text; rich text enabled |
| `decision` | Single select | Options: **Scale** / **Test** / **Hold** / **Kill** |
| `linked_creatives_count` | Count | Count of linked Creatives |
| `notes` | Long text | Internal notes |
| `created_date` | Created time | Auto |
| `last_modified` | Last modified time | Auto |

### Health Score Formula — Campaigns

The `health_score` formula approximates the 13-component weighted score. Airtable formulas are single-expression; implement as a nested IF/scoring formula. Below is the component logic; the builder should combine into one formula:

```
Component scoring guide (each returns a 0–100 sub-score; multiply by weight):

tracking_score     = IF({tracking_status_latest} = "Active", 100, 0)              × 0.15
cpa_score          = IF({CPA} = 0, 50, IF({CPA} <= {break_even_cpa_lookup}, 100, MAX(0, 100 - (({CPA}/{break_even_cpa_lookup}) - 1) * 100)))  × 0.15
spend_eff_score    = IF({ROAS} >= {break_even_roas_lookup}, 100, MAX(0, ({ROAS}/{break_even_roas_lookup}) * 100))  × 0.12
conv_rate_score    = IF({total_clicks} > 0 AND {total_leads} > 0, MIN(100, ({total_leads}/{total_clicks}) * 1000), 50)  × 0.10
ctr_score          = IF({CTR} >= 0.02, 100, IF({CTR} >= 0.01, 70, 40))            × 0.08
lead_quality_score = [Lookup avg from Leads table, scaled 0-100]                   × 0.08
creative_fresh     = IF({linked_creatives_count} > 0 AND {days_running} <= 14, 100, 60)  × 0.08
cpc_score          = IF({CPM} > 0, MIN(100, (10 / MAX({CPC}, 0.01)) * 10), 50)    × 0.07
naming_score       = IF(FIND("_", {campaign_name}) > 0, 100, 0)                    × 0.05
offer_score        = 75  [static default; update manually]                          × 0.05
lp_align_score     = 75  [static default; update manually]                          × 0.04
budget_pace_score  = IF({budget_type} = "Daily", 100, 75)                          × 0.02
data_conf_score    = IF({total_impressions} > 1000, 100, ({total_impressions}/1000)*100)  × 0.01

health_score = SUM(all above)
```

Note: Airtable does not support cross-table lookups inside formulas directly. The `tracking_status_latest` and `lead_quality_score` components require Rollup fields to surface values before the formula references them.

### Views

| View Name | Type | Config |
|---|---|---|
| All Campaigns | Grid | Default; all columns; sorted by `last_modified` DESC |
| Active Only | Grid | Filter: `status = "Active"`; sorted by `health_score` ASC (worst first) |
| Needs Attention | Grid | Filter: `health_band` is **Orange** or **Red**; highlighted rows |
| By Business | Grid | Grouped by `business`; sorted by `total_spend` DESC within group |
| Decision Board | Kanban | Group by `decision` (Scale / Test / Hold / Kill); card shows: campaign_name, platform, health_score, ROAS, CPA; sorted by health_score within column |
| Scale Candidates | Grid | Filter: `decision = "Scale"` AND `health_score >= 70`; sorted by ROAS DESC |
| Kill List | Grid | Filter: `decision = "Kill"` OR `health_band = "Red"` |
| Meta Only | Grid | Filter: `platform = "Meta"` |
| TikTok Only | Grid | Filter: `platform = "TikTok"` |

---

## Table 3 — DailyMetrics

**Purpose:** One record per campaign per date. The raw data table. Populated manually, via CSV import, or via integration (Zapier/Make). Drives all rollup calculations.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `record_id` | Autonumber | Primary key |
| `date` | Date | Required; format: DD/MM/YYYY |
| `campaign` | Link to Campaigns | Required; many-to-one |
| `platform` | Lookup | Source: campaign → `platform`; auto-populated |
| `spend` | Currency | AUD; required |
| `impressions` | Number (integer) | Required |
| `reach` | Number (integer) | Unique accounts reached |
| `frequency` | Number (2dp) | `impressions / reach` — enter if known, or formula below |
| `frequency_calc` | Formula (Number, 2dp) | `IF({reach} > 0, {impressions} / {reach}, 0)` |
| `clicks` | Number (integer) | Link clicks (not all clicks) |
| `ctr` | Formula (Percent, 2dp) | `IF({impressions} > 0, {clicks} / {impressions}, 0)` |
| `cpc` | Formula (Currency) | `IF({clicks} > 0, {spend} / {clicks}, 0)` |
| `cpm` | Formula (Currency) | `IF({impressions} > 0, ({spend} / {impressions}) * 1000, 0)` |
| `landing_page_views` | Number (integer) | Post-click landing page loads |
| `leads` | Number (integer) | Form fills / lead events |
| `purchases` | Number (integer) | Purchase conversion events |
| `revenue` | Currency | AUD; attributed revenue |
| `cpl` | Formula (Currency) | `IF({leads} > 0, {spend} / {leads}, 0)` |
| `cpa` | Formula (Currency) | `IF({purchases} > 0, {spend} / {purchases}, 0)` |
| `roas` | Formula (Number, 2dp) | `IF({spend} > 0, {revenue} / {spend}, 0)` |
| `video_views` | Number (integer) | Total video views (platform definition varies) |
| `three_second_views` | Number (integer) | Views reaching 3 seconds |
| `six_second_views` | Number (integer) | Views reaching 6 seconds |
| `thruplays` | Number (integer) | Views reaching 97%+ of video duration |
| `hook_rate` | Formula (Percent, 2dp) | `IF({impressions} > 0, {three_second_views} / {impressions}, 0)` |
| `hold_rate` | Formula (Percent, 2dp) | `IF({three_second_views} > 0, {thruplays} / {three_second_views}, 0)` |
| `comments` | Number (integer) | |
| `shares` | Number (integer) | |
| `saves` | Number (integer) | |
| `utm_source` | Single line text | e.g. meta, tiktok |
| `utm_medium` | Single line text | e.g. paid_social |
| `utm_campaign` | Single line text | Campaign slug |
| `utm_content` | Single line text | Ad creative identifier |
| `utm_term` | Single line text | Audience or keyword tag |
| `tracking_status` | Single select | Options: **Active** / **Broken** / **Partial** / **Unverified** |
| `break_even_cpa_lookup` | Lookup | Source: campaign → business → `break_even_cpa` (via campaign lookup) |
| `cpa_alert` | Formula (Checkbox) | `IF({cpa} > {break_even_cpa_lookup} AND {purchases} > 0, TRUE(), FALSE())` |
| `recommendation` | Single line text | Short auto or manual note |
| `notes` | Long text | Free-form |
| `created_date` | Created time | Auto |

### Views

| View Name | Type | Config |
|---|---|---|
| All Metrics | Grid | Default; sorted by `date` DESC |
| This Month | Grid | Filter: `date` is within current month; sorted by `date` DESC |
| Last 7 Days | Grid | Filter: `date` is within last 7 days |
| CPA Alerts | Grid | Filter: `cpa_alert = TRUE`; sorted by `cpa` DESC |
| Broken Tracking | Grid | Filter: `tracking_status` is **Broken** or **Unverified** |
| By Campaign | Grid | Grouped by `campaign`; sorted by `date` DESC within group |
| Calendar | Calendar | Date field: `date`; record title: campaign name + spend |
| Video Performance | Grid | Filter: `three_second_views > 0`; columns: date, campaign, hook_rate, hold_rate, three_second_views, thruplays |

---

## Table 4 — Creatives

**Purpose:** One record per ad creative. Tracks performance over lifetime, flags fatigue, drives creative decisions.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `ad_id` | Single line text | Platform ad ID — entered manually |
| `ad_name` | Single line text | Must follow naming convention: `[Format]_[Hook]_[Audience]_[Date]` |
| `campaign` | Link to Campaigns | Required; many-to-one |
| `platform` | Lookup | Source: campaign → `platform` |
| `creative_type` | Single select | Options: **Video** / **Image** / **Carousel** |
| `hook_text` | Single line text | Opening line or visual hook text |
| `body_copy` | Long text | Ad copy body |
| `cta` | Single line text | Call to action text |
| `thumbnail_url` | URL | Direct image URL for gallery view |
| `thumbnail_attachment` | Attachment | Optional; upload creative asset |
| `launch_date` | Date | Date creative first went live |
| `status` | Single select | Options: **Active** / **Paused** / **Archived** |
| `total_spend` | Rollup | Source: DailyMetrics (via campaign) — Note: requires creative-level DailyMetrics or manual entry; see implementation note below |
| `total_impressions` | Number (integer) | Cumulative — entered or imported |
| `total_clicks` | Number (integer) | Cumulative — entered or imported |
| `total_leads` | Number (integer) | Cumulative — entered or imported |
| `total_purchases` | Number (integer) | Cumulative — entered or imported |
| `total_revenue` | Currency | Cumulative attributed revenue |
| `avg_hook_rate` | Number (Percent, 2dp) | Entered or averaged from ad-level data |
| `avg_hold_rate` | Number (Percent, 2dp) | Entered or averaged from ad-level data |
| `ctr` | Formula (Percent, 2dp) | `IF({total_impressions} > 0, {total_clicks} / {total_impressions}, 0)` |
| `cpl` | Formula (Currency) | `IF({total_leads} > 0, {total_spend} / {total_leads}, 0)` |
| `cpa` | Formula (Currency) | `IF({total_purchases} > 0, {total_spend} / {total_purchases}, 0)` |
| `roas` | Formula (Number, 2dp) | `IF({total_spend} > 0, {total_revenue} / {total_spend}, 0)` |
| `days_running` | Formula (Number, 0dp) | `IF({launch_date}, DATETIME_DIFF(TODAY(), {launch_date}, 'days'), 0)` |
| `fatigue_flag` | Formula (Checkbox) | `IF({days_running} > 14 AND {ctr} < 0.01, TRUE(), FALSE())` — proxy for CTR decline; adjust threshold per client |
| `fatigue_reason` | Formula (Single line text) | `IF({fatigue_flag}, "Running " & {days_running} & " days; CTR " & ROUND({ctr}*100,2) & "% — review creative", "")` |
| `decision` | Single select | Options: **Scale** / **Refresh** / **Kill** |
| `linked_leads_count` | Count | Count of linked Leads records |
| `notes` | Long text | Creative testing notes, iteration history |
| `created_date` | Created time | Auto |
| `last_modified` | Last modified time | Auto |

**Implementation note on Creatives rollups:** Airtable rollups require a direct linked-record relationship. If DailyMetrics is linked to Campaigns (not individual Creatives), the spend/impressions/clicks/leads fields on Creatives must be populated via manual entry, CSV import, or a Zapier automation that pushes ad-level data from platform exports. The preferred architecture is to add a `creative` link field to DailyMetrics once ad-level reporting is enabled, then convert these fields to true Rollups.

### Views

| View Name | Type | Config |
|---|---|---|
| All Creatives | Grid | Default; all fields; sorted by `last_modified` DESC |
| Active Creatives | Grid | Filter: `status = "Active"`; sorted by `cpl` ASC |
| Fatigue Watch | Grid | Filter: `fatigue_flag = TRUE`; sorted by `days_running` DESC |
| Top Performers | Grid | Filter: `total_impressions > 500`; sorted by `roas` DESC; then `cpl` ASC |
| Decision Board | Kanban | Group by `decision` (Scale / Refresh / Kill); card shows: ad_name, creative_type, hook_text, cpl, roas, fatigue_flag |
| Gallery | Gallery | Image field: `thumbnail_attachment` (or thumbnail_url); card shows: ad_name, cpl, roas, decision, fatigue_flag |
| Video Only | Grid | Filter: `creative_type = "Video"`; columns: ad_name, avg_hook_rate, avg_hold_rate, ctr, cpl, days_running, fatigue_flag |
| By Campaign | Grid | Grouped by `campaign`; sorted by `roas` DESC within group |

---

## Table 5 — Leads

**Purpose:** One record per inbound lead. Tracks quality, conversion outcome and attributed revenue. Feeds lead quality scores back to Campaigns.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `lead_id` | Autonumber | Primary key |
| `lead_date` | Date | Date lead was received |
| `lead_name` | Single line text | First name or full name (optional; privacy-aware) |
| `campaign` | Link to Campaigns | Which campaign generated this lead |
| `creative` | Link to Creatives | Which creative generated this lead (if known) |
| `lead_source` | Single select | Options: **Meta Lead Form** / **TikTok Lead Form** / **Landing Page** / **DM** / **Other** |
| `utm_campaign` | Single line text | UTM campaign value for attribution |
| `utm_content` | Single line text | UTM content value (links to creative) |
| `lead_quality_score` | Rating (1–5) | 1 = poor/spam, 5 = highly qualified; scored by sales team |
| `quality_notes` | Single line text | Brief note on quality (e.g. "wrong suburb", "ready to buy") |
| `outcome` | Single select | Options: **Converted** / **No Show** / **In Progress** / **Lost** / **Disqualified** |
| `follow_up_date` | Date | Next scheduled contact |
| `close_date` | Date | Date sale was won |
| `revenue_attributed` | Currency | AUD; sale value if converted |
| `time_to_close_days` | Formula (Number, 0dp) | `IF({close_date} AND {lead_date}, DATETIME_DIFF({close_date}, {lead_date}, 'days'), 0)` |
| `conversion_flag` | Formula (Checkbox) | `IF({outcome} = "Converted", TRUE(), FALSE())` |
| `notes` | Long text | CRM-style notes on lead interaction |
| `created_date` | Created time | Auto |
| `last_modified` | Last modified time | Auto |

### Views

| View Name | Type | Config |
|---|---|---|
| All Leads | Grid | Default; sorted by `lead_date` DESC |
| This Month | Grid | Filter: `lead_date` is within current month |
| Needs Follow Up | Grid | Filter: `outcome = "In Progress"` AND `follow_up_date <= TODAY()`; sorted by `follow_up_date` ASC |
| High Quality | Grid | Filter: `lead_quality_score >= 4` |
| Converted | Grid | Filter: `outcome = "Converted"`; sorted by `revenue_attributed` DESC |
| Lost | Grid | Filter: `outcome = "Lost"` OR `outcome = "Disqualified"` |
| By Campaign | Grid | Grouped by `campaign`; shows: lead_date, lead_quality_score, outcome, revenue_attributed |
| Quality Distribution | Grid | Grouped by `lead_quality_score`; count and revenue by score band |

---

## Table 6 — Reports

**Purpose:** Archive of all client-facing reports. Tracks draft-to-approved workflow. Stores health score snapshot at time of reporting.

### Fields

| Field Name | Field Type | Notes / Formula |
|---|---|---|
| `report_id` | Autonumber | Primary key |
| `report_name` | Single line text | Auto-suggested: `[Business] — [Type] Report — [Date]` |
| `report_date` | Date | Date of report / reporting period end |
| `report_type` | Single select | Options: **Weekly** / **Monthly** / **Quarterly** / **Audit** / **Ad Hoc** |
| `reporting_period_start` | Date | Start of data window |
| `reporting_period_end` | Date | End of data window |
| `business` | Link to Businesses | Required |
| `campaigns_covered` | Link to Campaigns | Multi-link; campaigns included in this report |
| `summary` | Long text | High-level narrative summary; rich text enabled |
| `key_wins` | Long text | What worked; rich text enabled |
| `key_issues` | Long text | What didn't work; rich text enabled |
| `recommendations` | Long text | Action items for next period; rich text enabled |
| `health_score_at_time` | Number (0dp) | Snapshot of overall health score at time of report; entered manually or via automation |
| `total_spend_period` | Currency | AUD; total spend in reporting period |
| `total_leads_period` | Number (integer) | Leads in reporting period |
| `total_purchases_period` | Number (integer) | Purchases in reporting period |
| `total_revenue_period` | Currency | AUD; attributed revenue in period |
| `cpl_period` | Formula (Currency) | `IF({total_leads_period} > 0, {total_spend_period} / {total_leads_period}, 0)` |
| `cpa_period` | Formula (Currency) | `IF({total_purchases_period} > 0, {total_spend_period} / {total_purchases_period}, 0)` |
| `roas_period` | Formula (Number, 2dp) | `IF({total_spend_period} > 0, {total_revenue_period} / {total_spend_period}, 0)` |
| `file_attachment` | Attachment | PDF or slide deck upload |
| `google_doc_link` | URL | Link to external report document |
| `status` | Single select | Options: **Draft** / **In Review** / **Sent** / **Approved** |
| `sent_date` | Date | Date emailed/shared to client |
| `client_approved_date` | Date | Date client acknowledged |
| `created_by` | Collaborator | Airtable user who created the record |
| `created_date` | Created time | Auto |
| `last_modified` | Last modified time | Auto |

### Views

| View Name | Type | Config |
|---|---|---|
| All Reports | Grid | Default; sorted by `report_date` DESC |
| Drafts | Grid | Filter: `status = "Draft"` |
| Sent | Grid | Filter: `status = "Sent"` OR `status = "Approved"` |
| By Business | Grid | Grouped by `business`; sorted by `report_date` DESC |
| Weekly Reports | Grid | Filter: `report_type = "Weekly"` |
| Monthly Reports | Grid | Filter: `report_type = "Monthly"` |
| Calendar | Calendar | Date field: `report_date`; title: `report_name` |

---

## Interface Dashboard

**Location:** Airtable Interfaces → create a new Interface for this base  
**Page title:** AdPilot OS — [Client Name] Dashboard  
**Audience:** Agency operator or client viewer (read-only share link)

### Layout — Elements in Order

---

#### Section 1: This Month at a Glance

**Element type:** Summary numbers block (4 metrics side by side)

| Metric | Source | Format |
|---|---|---|
| Total Spend (MTD) | DailyMetrics → SUM(spend) filtered to current month | AUD currency |
| Total Leads (MTD) | DailyMetrics → SUM(leads) filtered to current month | Integer |
| Cost Per Lead (MTD) | Formula on filtered data: spend / leads | AUD currency |
| ROAS (MTD) | Formula: revenue / spend for current month | Number 2dp |

Config: filter all four to `date` is within current month. Show previous month delta if Interface supports it.

---

#### Section 2: Campaign Health Table

**Element type:** Grid / Record list from Campaigns table  
**Filter:** `status = "Active"`  
**Fields shown:** campaign_name, platform, health_score, health_band, total_spend, CPL, CPA, ROAS, decision  
**Sorting:** health_score ASC (worst at top)  
**Conditional colouring:**
- health_band = Green → row or badge green
- health_band = Yellow → yellow
- health_band = Orange → orange
- health_band = Red → red

**Purpose:** Operator sees at a glance which campaigns need attention before anything else.

---

#### Section 3: Creative Performance Gallery

**Element type:** Gallery from Creatives table  
**Filter:** `status = "Active"`  
**Image field:** `thumbnail_attachment`  
**Card fields:** ad_name, creative_type, cpl, roas, avg_hook_rate, fatigue_flag, decision  
**Sorting:** roas DESC  
**Fatigue flag display:** show as badge or icon when `fatigue_flag = TRUE`

---

#### Section 4: Alerts

**Element type:** Record list (filtered)  
**Title:** Campaigns Below Break-Even

Sub-list 1 — CPA Alerts:
- Source: DailyMetrics
- Filter: `cpa_alert = TRUE` AND `date` within last 7 days
- Fields: date, campaign, cpa, break_even_cpa_lookup, spend
- Sorted: cpa DESC

Sub-list 2 — Creative Fatigue:
- Source: Creatives
- Filter: `fatigue_flag = TRUE` AND `status = "Active"`
- Fields: ad_name, days_running, ctr, decision
- Sorted: days_running DESC

Sub-list 3 — Broken Tracking:
- Source: DailyMetrics
- Filter: `tracking_status = "Broken"` OR `tracking_status = "Unverified"` within last 7 days
- Fields: date, campaign, tracking_status
- Sorted: date DESC

---

#### Section 5: Quick Actions

**Element type:** Button group  
**Buttons:**

| Button Label | Action |
|---|---|
| + Add Report | Opens new record form in Reports table |
| + Add Creative | Opens new record form in Creatives table |
| Mark Campaign Decision | Opens Campaigns Decision Board (Kanban view) |
| + Log Daily Metrics | Opens new record form in DailyMetrics table |
| View Lead Pipeline | Opens Leads → Needs Follow Up view |

**Note:** All buttons open forms or filtered views — no buttons trigger direct data writes without user review. Consistent with safety principle (no automated live changes).

---

## Automations

### Automation 1 — CPA Alert Notification

**Name:** CPA Breach Alert  
**Trigger:** When a DailyMetrics record is created or updated  
**Condition:** `{cpa_alert} = TRUE` (i.e. `cpa > break_even_cpa_lookup` and `purchases > 0`)  
**Action:** Send notification (Airtable in-app or email) to base collaborators:

```
Subject: ⚠️ CPA Alert — {{campaign_name}}

Campaign {{campaign_name}} on {{platform}} has exceeded break-even CPA.

Today's CPA: {{cpa}}
Break-even CPA: {{break_even_cpa_lookup}}
Spend today: {{spend}}

Review in AdPilot OS and update the decision field.

Note: Do NOT pause or edit live ads without review. Log a proposal in the Campaigns recommendation field first.
```

**Frequency cap:** Add a condition to prevent re-triggering if the same campaign already sent an alert today — use a `last_alert_date` field on Campaigns updated by the automation.

---

### Automation 2 — Weekly Report Reminder

**Name:** Weekly Report Due  
**Trigger:** Scheduled — every Monday at 8:00 AM AEST  
**Condition:** At least one Business record exists where `reporting_frequency = "Weekly"`  
**Action:** Create a draft Records in Reports table for each qualifying business:
- `report_name` = `[business_name] — Weekly Report — [today's date]`
- `report_date` = today
- `report_type` = Weekly
- `status` = Draft
- `reporting_period_start` = last Monday
- `reporting_period_end` = last Sunday

Then send notification to collaborators: "Weekly report draft created for [business_name]. Open AdPilot OS to complete and send."

---

### Automation 3 — Health Score Timestamp

**Name:** Log Health Score on Report Creation  
**Trigger:** When a Reports record is created  
**Condition:** `status = "Draft"`  
**Action:** Find linked Business record → lookup current `health_score` → write value to `health_score_at_time` on the new Report record.

**Purpose:** Preserves a point-in-time snapshot since the live health_score is a rolling formula.

---

### Automation 4 — Creative Fatigue Notification

**Name:** Creative Fatigue Alert  
**Trigger:** Scheduled — every Monday at 8:30 AM AEST  
**Condition:** Creatives where `fatigue_flag = TRUE` AND `status = "Active"` AND `decision` is empty  
**Action:** Send notification to collaborators listing all flagged creatives with `ad_name`, `days_running`, `ctr`.

Message: "The following active creatives may be fatigued and have no decision logged. Review and mark Scale / Refresh / Kill in AdPilot OS."

---

### Automation 5 — Monthly Report Reminder

**Name:** Monthly Report Due  
**Trigger:** Scheduled — 1st of each month at 8:00 AM AEST  
**Condition:** At least one Business where `reporting_frequency = "Monthly"`  
**Action:** Create draft Report records (same logic as Automation 2 but for monthly period).

---

## Universal Schema Column Mapping

The following maps the universal schema to Airtable tables in this base:

| Universal Schema Column | Airtable Table | Field |
|---|---|---|
| business_id | Businesses | business_id |
| business_name | Businesses | business_name |
| platform | Campaigns / DailyMetrics | platform |
| ad_account_id | Campaigns | (not stored — use {{client.*}} reference only) |
| campaign_id | Campaigns | campaign_id |
| campaign_name | Campaigns | campaign_name |
| adset_id | (not a primary table — can add Adsets table in v2) | — |
| adset_name | (same) | — |
| ad_id | Creatives | ad_id |
| ad_name | Creatives | ad_name |
| date | DailyMetrics | date |
| objective | Campaigns | objective |
| budget_type | Campaigns | budget_type |
| daily_budget | Campaigns | daily_budget |
| lifetime_budget | Campaigns | lifetime_budget |
| spend | DailyMetrics | spend |
| impressions | DailyMetrics | impressions |
| reach | DailyMetrics | reach |
| frequency | DailyMetrics | frequency_calc |
| clicks | DailyMetrics | clicks |
| ctr | DailyMetrics | ctr (formula) |
| cpc | DailyMetrics | cpc (formula) |
| cpm | DailyMetrics | cpm (formula) |
| landing_page_views | DailyMetrics | landing_page_views |
| leads | DailyMetrics | leads |
| purchases | DailyMetrics | purchases |
| revenue | DailyMetrics | revenue |
| cost_per_lead | DailyMetrics | cpl (formula) |
| cost_per_purchase | DailyMetrics | cpa (formula) |
| roas | DailyMetrics | roas (formula) |
| video_views | DailyMetrics | video_views |
| three_second_views | DailyMetrics | three_second_views |
| six_second_views | DailyMetrics | six_second_views |
| thruplays | DailyMetrics | thruplays |
| hook_rate | DailyMetrics | hook_rate (formula) |
| hold_rate | DailyMetrics | hold_rate (formula) |
| comments | DailyMetrics | comments |
| shares | DailyMetrics | shares |
| saves | DailyMetrics | saves |
| lead_quality_score | Leads | lead_quality_score |
| sales_count | Leads | (count of Leads where outcome = Converted) |
| gross_profit | Leads | revenue_attributed × gross_margin (not stored; derive in reporting) |
| utm_source | DailyMetrics | utm_source |
| utm_medium | DailyMetrics | utm_medium |
| utm_campaign | DailyMetrics | utm_campaign |
| utm_content | DailyMetrics | utm_content |
| utm_term | DailyMetrics | utm_term |
| tracking_status | DailyMetrics | tracking_status |
| recommendation | Campaigns | recommendation |
| notes | DailyMetrics / Campaigns | notes |

---

## Implementation Checklist for Airtable Builder

- [ ] Create base named `AdPilot OS — [Client Name]`
- [ ] Build all 6 tables in order (Businesses → Campaigns → DailyMetrics → Creatives → Leads → Reports)
- [ ] Set up all link fields before creating Rollup/Lookup fields that depend on them
- [ ] Add all formula fields after all source number fields exist
- [ ] Create all views per table as specified
- [ ] Build Interface Dashboard with 5 sections
- [ ] Set up all 5 automations; test triggers with sample data before going live
- [ ] Populate one test Business record using `{{client.*}}` values
- [ ] Import historical DailyMetrics data via CSV if available
- [ ] Verify health_score formula returns values in 0–100 range with test data
- [ ] Confirm CPA alert fires correctly on test record with CPA > break-even CPA
- [ ] Share base with client as Editor (Campaigns, Reports, Leads) / Commenter (DailyMetrics) / Interface-only (read-only dashboard link)
- [ ] Document any platform-specific field differences (Meta vs TikTok column names in exports) in the Businesses `notes` field

---

## Safety Reminders (Embedded in Base)

Add the following as a locked Long Text field called `safety_notice` on the Businesses table, visible in all Grid views:

```
SAFETY: This base is for analysis and proposals only. Never use data here to directly edit live ads.
All changes must be shipped as paused duplicates or drafts on the ad platform.
Archiving is preferred over deletion. Budget increases require typed YES confirmation outside this system.
No API keys, account IDs or private credentials are stored here — use {{client.*}} variables.
```

---

*Spec version: 1.0 — AdPilot OS*  
*Last updated: 2026-06-14*  
*Applies to: Meta Ads Manager + TikTok Ads Manager*  
*Currency: AUD*
