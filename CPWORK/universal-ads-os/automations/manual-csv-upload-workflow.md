# Manual CSV Upload Workflow (V1 — No-Code)

**Purpose:** Allow any client to feed Meta and TikTok ad data into AdPilot OS without API access. Operator exports CSVs from each platform, maps columns to the universal schema, pastes into Google Sheets, and triggers analysis skills.

---

## Safety Rules (mandatory)

- This workflow is READ + ANALYSE only. No data from this file touches a live ad account.
- No API keys, tokens, or account IDs are stored in spreadsheets or this document. Use `{{client.meta_account_id}}` and `{{client.tiktok_account_id}}` as placeholders in the Sheet header only.
- `live_edit_block: true` — any recommendation produced by analysis must remain a proposal until a human types YES.

---

## Step-by-Step Flow

### Step 1 — Export from Meta Ads Manager

1. Open Meta Ads Manager → **Reports** → **Export Table Data**
2. Set date range (default: last 7 or 30 days)
3. Level: **Ad** (most granular — captures ad_id, adset_id, campaign_id)
4. Columns to include (select manually or use a saved preset called "AdPilot OS Export"):
   - Campaign name, Campaign ID, Ad Set name, Ad Set ID, Ad name, Ad ID, Objective
   - Daily budget, Lifetime budget
   - Amount spent, Impressions, Reach, Frequency, Link clicks, CTR (link click-through rate), CPC (cost per link click), CPM
   - Landing page views, Leads (if lead gen), Purchases (if conversion), Purchase ROAS, Purchase conversion value
   - Video plays, 3-second video plays, ThruPlays
   - Post comments, Post shares, Post saves
5. Export as **CSV**
6. Filename convention: `meta_YYYYMMDD_{{client.business_name}}.csv`

### Step 2 — Export from TikTok Ads Manager

1. Open TikTok Ads Manager → **Reporting** → **Custom Report** → **Ad** level
2. Date range: match Meta export
3. Dimensions: Ad ID, Ad Name, Ad Group ID, Ad Group Name, Campaign ID, Campaign Name, Objective Type
4. Metrics: Budget, Spend, Impressions, Reach, Frequency, Clicks, CTR, CPC, CPM, Landing Page Views, Conversions (lead/purchase), Cost per Conversion, ROAS (if applicable), Video Views, 2-second views, 6-second views, Video Views at 100%, Likes, Comments, Shares
5. Export as **CSV**
6. Filename convention: `tiktok_YYYYMMDD_{{client.business_name}}.csv`

### Step 3 — Column Mapping

Map each platform's export column headers to the universal schema fields. Use the table below. Rename CSV headers before pasting, or use the **"Column Mapper" tab** in the Google Sheet (see google-sheets-workflow.md).

#### Meta → Universal Schema Mapping

| Meta Export Column | Universal Schema Field | Notes |
|---|---|---|
| Campaign name | campaign_name | |
| Campaign ID | campaign_id | |
| Ad set name | adset_name | |
| Ad set ID | adset_id | |
| Ad name | ad_name | |
| Ad ID | ad_id | |
| Objective | objective | normalise: LEAD_GENERATION → lead_gen |
| Daily budget | daily_budget | AUD; blank if lifetime |
| Lifetime budget | lifetime_budget | AUD; blank if daily |
| Amount spent (AUD) | spend | |
| Impressions | impressions | |
| Reach | reach | |
| Frequency | frequency | |
| Link clicks | clicks | |
| CTR (link click-through rate) | ctr | as decimal e.g. 0.02 not 2% |
| CPC (cost per link click) | cpc | AUD |
| CPM (cost per 1,000 impressions) | cpm | AUD |
| Landing page views | landing_page_views | |
| Leads | leads | from Lead Ads form submissions |
| Purchases | purchases | from pixel events |
| Purchase conversion value | revenue | AUD |
| Purchase ROAS | roas | raw ratio e.g. 3.2 |
| Video plays | video_views | |
| 3-second video plays | three_second_views | |
| ThruPlays | thruplays | Meta-specific; ~15s or full video |
| Post comments | comments | |
| Post shares | shares | |
| Post saves | saves | |
| Reporting starts | date | use start date as the row date |
| Ad account ID | ad_account_id | value = {{client.meta_account_id}} |
| — (add manually) | platform | value = meta |
| — (add manually) | business_id | value from config |
| — (add manually) | business_name | {{client.business_name}} |

**Computed fields to add after paste:**
- `cost_per_lead` = spend / leads (formula in Sheet)
- `cost_per_purchase` = spend / purchases
- `hook_rate` = three_second_views / impressions (where impressions > 0)
- `hold_rate` = thruplays / three_second_views (proxy)
- `six_second_views` — not directly available from Meta; leave blank or map from 6s plays if custom metric added
- `cpl` = cost_per_lead (alias)
- `cpa` = cost_per_purchase (alias)

#### TikTok → Universal Schema Mapping

| TikTok Export Column | Universal Schema Field | Notes |
|---|---|---|
| Campaign Name | campaign_name | |
| Campaign ID | campaign_id | |
| Ad Group Name | adset_name | TikTok "Ad Group" = Meta "Ad Set" |
| Ad Group ID | adset_id | |
| Ad Name | ad_name | |
| Ad ID | ad_id | |
| Objective Type | objective | normalise: TRAFFIC, CONVERSIONS, LEAD_GENERATION |
| Budget | daily_budget | check budget type column |
| Budget Type | budget_type | DAILY or LIFETIME |
| Spend (AUD) | spend | |
| Impressions | impressions | |
| Reach | reach | |
| Frequency | frequency | |
| Clicks | clicks | |
| Click Through Rate (CTR) | ctr | as decimal |
| Cost Per Click (CPC) | cpc | AUD |
| CPM | cpm | AUD |
| Conversions (Lead) | leads | filter by conversion event type |
| Conversions (Complete Payment) | purchases | |
| Conversion Value | revenue | AUD |
| Cost Per Lead | cost_per_lead | |
| Cost Per Conversion | cost_per_purchase | |
| ROAS | roas | |
| Video Views | video_views | |
| 2-Second Video Views | three_second_views | closest proxy; note in column |
| 6-Second Video Views | six_second_views | |
| Video Views at 100% | thruplays | closest proxy |
| Likes | saves | TikTok "Likes" maps closest; note |
| Comments | comments | |
| Shares | shares | |
| Date | date | |
| Ad Account ID | ad_account_id | {{client.tiktok_account_id}} |
| — (add manually) | platform | value = tiktok |
| — (add manually) | business_id | from config |
| — (add manually) | business_name | {{client.business_name}} |

**Computed fields:**
- `hook_rate` = three_second_views / impressions
- `hold_rate` = thruplays / three_second_views
- `ctr` — convert from percentage to decimal if TikTok exports as "2.1%" → divide by 100

---

### Step 4 — Paste into Google Sheets

1. Open the client's AdPilot OS Sheet (see google-sheets-workflow.md)
2. Navigate to the **Raw Data** tab
3. Delete any existing placeholder/example rows (keep the header row)
4. Paste Meta CSV data starting at row 2
5. Paste TikTok CSV data directly below (headers should already match after mapping)
6. Verify: row count = expected number of ads × days in range
7. Check the **Validation** tab — it flags:
   - Missing required fields (spend, campaign_id, date, platform)
   - CTR values > 1 (likely left as percentage)
   - Negative spend or impressions
   - `budget_type` not in [DAILY, LIFETIME]

### Step 5 — Run Analysis Skills

After paste and validation, trigger the following skills in order:

1. **dana** — runs spend pacing, frequency, hook/hold rate, and CPL/CPA vs break-even checks. Outputs to the Alerts tab.
2. **riley** — synthesises dana's alerts into a narrative report with recommendations (all proposals, no live edits).
3. **export-report** skill — packages Sheet data + riley output into a PDF/email format.

Skills are triggered from the **Skills Menu** (custom Google Apps Script menu) or manually by the operator.

---

## Column Mapping Quick Reference (One-Liner)

For each CSV column not in the table above, apply this decision logic:
1. Is it a spend/cost field? → map to the most specific cost field (spend, cpc, cpm, cpl, cpa)
2. Is it a count field (events, views, clicks)? → map to the matching count field
3. Is it a rate (CTR, frequency)? → confirm decimal vs percentage; divide by 100 if needed
4. Is it a name/ID? → map to the matching _name or _id field
5. Not mappable? → put in `notes` column

---

## Frequency

- **Minimum:** weekly (sufficient for the weekly report cycle)
- **Recommended:** daily (enables daily alerts; requires daily export discipline)
- **V2 upgrade path:** Replace manual export with Make.com or n8n API pull (see make-scenarios.md, n8n-workflows.md)

---

## Limitations

- Data is as fresh as the last export — no real-time data
- Attribution windows may differ between Meta and TikTok exports; document the window used in the `notes` column
- Lead quality data (won/lost, sale value) must be added separately from CRM (see lead-quality-feedback-loop.md)
