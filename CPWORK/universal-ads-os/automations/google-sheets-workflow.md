# Google Sheets Workflow — AdPilot OS Hub

**Purpose:** Google Sheets acts as the central data hub for AdPilot OS. All ingestion methods (manual CSV, Make.com, n8n, Zapier) write to this Sheet. All analysis skills read from it. Reports are generated from it.

---

## Safety Rules (mandatory)

- The Sheet is a READ + ANALYSE layer. No cell formula, Apps Script, or connected automation may push changes to a live ad account.
- No API keys, tokens, or account IDs are stored in the Sheet. Use named ranges with `{{client.meta_account_id}}` / `{{client.tiktok_account_id}}` in a Config tab — these are reference labels, not real credentials.
- `live_edit_block: true` — the Sheet may generate recommendations in a "Proposals" tab, but execution requires a human typed YES in a separate approval flow.

---

## Sheet Structure

Each client gets one dedicated Google Sheet. Naming convention:
`AdPilot OS — {{client.business_name}} — {{YYYY}}`

### Tabs (in order)

| Tab Name | Purpose |
|---|---|
| **Config** | Client config variables, break-even thresholds, reporting settings |
| **Raw Data** | Universal schema rows — one row per ad per day, all platforms |
| **Meta Import** | Staging tab for Meta CSV paste (pre-mapping) |
| **TikTok Import** | Staging tab for TikTok CSV paste (pre-mapping) |
| **Lead Quality** | CRM feedback data — sale outcomes, lead_quality_score updates |
| **Alerts** | Auto-generated alert log (dana skill output) |
| **Weekly Report** | riley skill output — narrative summary, proposals |
| **Dashboard** | QUERY-based pivot charts and KPI tiles — read-only display |
| **Validation** | Formula checks on Raw Data — flags missing fields, bad values |
| **Audit Log** | Timestamped record of every import, skill run, and approval |

---

## Config Tab Structure

| Parameter | Value |
|---|---|
| business_id | (set by operator — not a secret, just an internal ID) |
| business_name | {{client.business_name}} |
| meta_account_id | {{client.meta_account_id}} |
| tiktok_account_id | {{client.tiktok_account_id}} |
| crm_type | {{client.crm}} |
| monthly_budget_aud | {{client.monthly_budget}} |
| conversion_events | {{client.conversion_events}} |
| reporting_frequency | {{client.reporting_frequency}} |
| gross_margin | (decimal, e.g. 0.35) |
| average_sale_value_aud | (AUD) |
| break_even_cpa | =average_sale_value_aud * gross_margin |
| break_even_roas | =1 / gross_margin |
| alert_email | operator alert recipient |
| lead_sources | {{client.lead_sources}} |

---

## Raw Data Tab — Universal Schema

Header row (row 1) matches the universal schema exactly:

```
business_id, business_name, platform, ad_account_id, campaign_id, campaign_name,
adset_id, adset_name, ad_id, ad_name, date, objective, budget_type, daily_budget,
lifetime_budget, spend, impressions, reach, frequency, clicks, ctr, cpc, cpm,
landing_page_views, leads, purchases, revenue, cost_per_lead, cost_per_purchase,
roas, video_views, three_second_views, six_second_views, thruplays, hook_rate,
hold_rate, comments, shares, saves, lead_quality_score, sales_count, gross_profit,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, tracking_status,
recommendation, notes
```

**Computed columns (formula-driven, not pasted):**
- `cost_per_lead` = `=IF(leads>0, spend/leads, "")` — column AC
- `cost_per_purchase` = `=IF(purchases>0, spend/purchases, "")` — column AD
- `roas` = `=IF(spend>0, revenue/spend, "")` — column AE
- `hook_rate` = `=IF(video_views>0, three_second_views/video_views, "")` — column AJ
- `hold_rate` = `=IF(three_second_views>0, thruplays/three_second_views, "")` — column AK

---

## IMPORTRANGE for Multi-Sheet Setups

If different operators manage Meta and TikTok in separate sheets, consolidate with IMPORTRANGE:

```
=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SHEET_ID_A", "Raw Data!A:AX")
```

Replace `SHEET_ID_A` with the actual sheet ID (not a secret — Sheets IDs are not credentials, but share with restricted permissions). Stack multiple IMPORTRANGE results using VSTACK (Google Sheets 2023+):

```
=VSTACK(
  IMPORTRANGE("META_SHEET_ID", "Raw Data!A2:AX"),
  IMPORTRANGE("TIKTOK_SHEET_ID", "Raw Data!A2:AX")
)
```

Place this formula in a "Consolidated" tab if running separate sheets per platform.

---

## Scheduled Refresh

Google Sheets IMPORTRANGE does not auto-refresh on a schedule by default. Options:

1. **Apps Script time-based trigger** — run a dummy function every morning at 06:00 AEST that opens the Sheet, forcing IMPORTRANGE to re-fetch (see snippet below)
2. **Make.com / Zapier** — write directly to Raw Data via the Sheets API on a schedule (see make-scenarios.md)
3. **Manual:** Operator opens the Sheet each morning before running analysis skills

---

## Apps Script — Import Timestamp Recorder

This snippet is READ-ONLY. It does not connect to any ad platform API. It records when data was last refreshed into the Audit Log tab.

```javascript
// AdPilot OS — Sheets Import Timestamp Recorder
// Paste into Extensions > Apps Script > Code.gs
// Permissions: this script only reads/writes to THIS spreadsheet.
// It does NOT call any external ad platform API. No tokens are stored here.

const SHEET_NAME_AUDIT = 'Audit Log';
const SHEET_NAME_RAW   = 'Raw Data';

function recordImportTimestamp(source) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const audit   = ss.getSheetByName(SHEET_NAME_AUDIT);
  const raw     = ss.getSheetByName(SHEET_NAME_RAW);
  const lastRow = raw.getLastRow();
  const now     = new Date();

  // Append a row to Audit Log: timestamp, source, row count
  audit.appendRow([
    Utilities.formatDate(now, 'Australia/Sydney', 'yyyy-MM-dd HH:mm:ss'),
    source || 'manual',
    lastRow - 1,  // subtract header row
    Session.getActiveUser().getEmail()
  ]);
}

// Set up a time-based trigger: runs daily at 06:00 AEST to refresh IMPORTRANGE links
function scheduledMorningRefresh() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Accessing any range forces IMPORTRANGE to refresh
  ss.getSheetByName(SHEET_NAME_RAW).getRange('A1').getValue();
  recordImportTimestamp('scheduled_refresh');
}

// Call this manually after a CSV paste
function onManualPaste() {
  recordImportTimestamp('manual_csv_paste');
}

// Install the daily trigger (run once)
function installDailyTrigger() {
  ScriptApp.newTrigger('scheduledMorningRefresh')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .inTimezone('Australia/Sydney')
    .create();
}
```

**Audit Log tab headers:** `timestamp | source | raw_data_row_count | operator_email`

---

## Validation Tab

The Validation tab runs QUERY checks against Raw Data and flags issues. Each row in Validation corresponds to a Raw Data row with a problem.

```
=QUERY('Raw Data'!A:AX,
  "SELECT A,B,C,K,P WHERE P IS NULL OR P < 0 OR C NOT IN ('meta','tiktok') LABEL A 'business_id', B 'business_name', C 'platform', K 'date', P 'spend'",
  1)
```

Key checks:
- `spend` is null or negative
- `platform` not in [meta, tiktok]
- `date` is blank
- `campaign_id` is blank
- `ctr` > 1 (likely not converted from percentage)
- `budget_type` not in [DAILY, LIFETIME]
- `tracking_status` is blank

---

## How Skills Read from the Sheet

Skills (dana, riley, etc.) read from the Sheet via the Google Sheets API using a read-only service account (oauth scope: `https://www.googleapis.com/auth/spreadsheets.readonly`). The service account credentials are stored as environment secrets in the hosting environment — never in the Sheet or this file.

Skills accept the Sheet ID as a parameter: `sheet_id={{SHEET_ID_ENV_VAR}}`

Data is pulled from the **Raw Data** tab, filtered by date range and business_id. Skills never write back to Raw Data — they write only to **Alerts** and **Weekly Report** tabs, and only append (never overwrite existing rows).

---

## Dashboard Tab

Key KPI tiles (using QUERY or SUMPRODUCT against Raw Data):

- Total spend MTD (AUD)
- CPL vs break-even CPL
- CPA vs break-even CPA
- ROAS vs break-even ROAS
- Average frequency (last 7 days)
- Hook rate (last 7 days)
- Spend by platform (Meta vs TikTok pie)
- Top 5 ads by ROAS
- Bottom 5 ads by CPL (i.e. cheapest leads — note these need lead_quality_score to be useful)

All charts reference Raw Data via QUERY — no manual data entry in Dashboard.

---

## Access Control

- **Operator (you):** Editor
- **Client:** Viewer only (or restricted Viewer — hide Config tab)
- **Skills/automation service account:** Editor on Alerts + Weekly Report tabs only; Viewer on all others
- **No public sharing** — all sharing is by specific Google account

---

## Upgrade Path

| V1 | V2 |
|---|---|
| Manual CSV paste | Make.com or n8n API pull (see make-scenarios.md) |
| Manual skill trigger | Scheduled Apps Script or Make.com trigger |
| Single sheet | Multi-sheet with IMPORTRANGE consolidation |
| Email report | Automated PDF export + email via riley skill |
