# Make.com Scenarios — AdPilot OS V2

**Purpose:** Replace manual CSV exports with automated data pulls, alerting, reporting, and lead capture using Make.com (formerly Integromat).

---

## Safety Rules (mandatory — every scenario)

- `live_edit_block: true` — no Make.com scenario may call any ad platform WRITE endpoint.
- `use_paused_duplicates_only: true` — any proposed ad change is a paused draft only, never applied to a live ad.
- All API tokens and account IDs are stored in Make.com **Environment Secrets** or **Connection** objects. Never hardcode tokens in module fields or scenario names.
- Use `{{client.meta_account_id}}` and `{{client.tiktok_account_id}}` as display references in documentation only.
- Scenarios may READ data and ALERT freely. Any WRITE action (to Sheets, CRM, etc.) is append-only.
- Money-moving decisions (budget changes, bid changes) require human typed YES via an approval step — not automated.
- No deletion of any ad, campaign, or data record. Archive only, and only via proposal.
- Prefer official platform APIs over browser automation of Ads Manager.
- Request least-privilege API scopes: `ads_read` + `read_insights` first; `ads_management` only for the human-gated approver role.

---

## Overview — Four Scenarios

| # | Scenario Name | Trigger | Purpose |
|---|---|---|---|
| A | Daily Metrics Pull → Sheets | Schedule: 07:00 AEST daily | Pull yesterday's ad metrics from Meta + TikTok APIs → write to Raw Data tab |
| B | Daily Alert on Threshold Breach | Schedule: 08:00 AEST daily (runs after A) | Read Alerts tab, check thresholds, send email/Slack if breached |
| C | Weekly Report Generation + Email | Schedule: Monday 09:00 AEST | Aggregate last 7 days → trigger riley skill → email PDF report |
| D | New Lead → CRM + Lead Quality Log | Webhook: Meta/TikTok Lead Form submission | Write lead to CRM and Lead Quality tab in Sheets |

---

## Scenario A — Daily Metrics Pull → Sheets

**Trigger:** Schedule module — every day at 07:00 AEST

**Goal:** Pull yesterday's ad-level data from Meta and TikTok APIs, transform to universal schema, append to the Raw Data tab in Google Sheets.

### Data Path

```
[Schedule Trigger 07:00 AEST]
    → [Set Variables: date_from = yesterday, date_to = yesterday, business_id, platform]
    → [HTTP: Meta Graph API — GET campaigns list]   (READ ONLY)
    → [HTTP: Meta Graph API — GET adsets by campaign]
    → [HTTP: Meta Graph API — GET ads insights — ad level, yesterday]
    → [Iterator: loop over ad insight rows]
        → [Tools: Map fields to universal schema]
        → [Google Sheets: Append Row to "Raw Data" tab]
    → [HTTP: TikTok Marketing API — GET ad reports]  (READ ONLY)
    → [Iterator: loop over TikTok ad rows]
        → [Tools: Map TikTok fields to universal schema]
        → [Google Sheets: Append Row to "Raw Data" tab]
    → [Google Sheets: Append Row to "Audit Log" tab — timestamp + row count]
```

### Modules Detail

**Module 1 — Schedule**
- Type: Schedule
- Interval: Every day
- Time: 07:00
- Timezone: Australia/Sydney

**Module 2 — Set Variables**
- `date_from`: `{{formatDate(addDays(now; -1); "YYYY-MM-DD")}}`
- `date_to`: `{{formatDate(addDays(now; -1); "YYYY-MM-DD")}}`
- `business_id`: pulled from Make.com Data Store (keyed to scenario)

**Module 3 — HTTP: Meta Campaigns (READ ONLY)**
- Method: GET
- URL: `https://graph.facebook.com/v21.0/act_{{env.META_ACCOUNT_ID}}/campaigns`
- Query params: `fields=id,name,objective,status`, `limit=500`
- Headers: `Authorization: Bearer {{env.META_ACCESS_TOKEN}}`
- Connection: Make.com Connection object — token stored as secret, never in URL

**Module 4 — HTTP: Meta Ad Insights (READ ONLY)**
- Method: GET
- URL: `https://graph.facebook.com/v21.0/act_{{env.META_ACCOUNT_ID}}/insights`
- Query params:
  - `level=ad`
  - `time_range={"since":"{{date_from}}","until":"{{date_to}}"}`
  - `fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,action_values,video_play_actions,video_avg_percent_watched_actions`
  - `limit=500`
- Note: `actions` array contains leads, purchases etc — parse by `action_type` in iterator

**Module 5 — Iterator (Meta)**
- Iterates over Module 4 array output

**Module 6 — Tools: Map Meta Fields**
- `business_id`: from Data Store
- `business_name`: `{{client.business_name}}` from Data Store
- `platform`: `meta`
- `ad_account_id`: `{{env.META_ACCOUNT_ID}}`
- `campaign_id`: `{{4.campaign_id}}`
- `campaign_name`: `{{4.campaign_name}}`
- `adset_id`: `{{4.adset_id}}`
- `adset_name`: `{{4.adset_name}}`
- `ad_id`: `{{4.ad_id}}`
- `ad_name`: `{{4.ad_name}}`
- `date`: `{{date_from}}`
- `spend`: `{{toNumber(4.spend)}}`
- `impressions`: `{{toNumber(4.impressions)}}`
- `reach`: `{{toNumber(4.reach)}}`
- `frequency`: `{{toNumber(4.frequency)}}`
- `clicks`: `{{toNumber(4.clicks)}}`
- `ctr`: `{{divide(toNumber(4.ctr); 100)}}` (Meta returns CTR as %, convert to decimal)
- `cpc`: `{{toNumber(4.cpc)}}`
- `cpm`: `{{toNumber(4.cpm)}}`
- `leads`: parsed from `actions` array where `action_type = "lead"`
- `purchases`: parsed from `actions` array where `action_type = "purchase"`
- `revenue`: parsed from `action_values` where `action_type = "purchase"`
- `video_views`: parsed from `video_play_actions`
- `three_second_views`: parsed from `video_play_actions` where threshold = 3s
- `thruplays`: parsed from `video_play_actions` where threshold = thruplay
- `cost_per_lead`: `{{if(leads > 0; divide(spend; leads); "")}}`
- `cost_per_purchase`: `{{if(purchases > 0; divide(spend; purchases); "")}}`
- `roas`: `{{if(spend > 0; divide(revenue; spend); "")}}`
- `hook_rate`: `{{if(impressions > 0; divide(three_second_views; impressions); "")}}`
- `hold_rate`: `{{if(three_second_views > 0; divide(thruplays; three_second_views); "")}}`
- `tracking_status`: `OK` (to be validated later by dana skill)
- `utm_source`: `meta` (default; override if UTM params captured in landing page view data)

**Module 7 — Google Sheets: Append Row**
- Connection: Service account with Sheets Editor scope (limited to this Sheet only)
- Spreadsheet: `{{env.CLIENT_SHEET_ID}}`
- Sheet: `Raw Data`
- Values: all mapped fields in universal schema column order

**Modules 8–11 — TikTok equivalent** (same pattern, different API — see tiktok-api-plan.md)

**Module 12 — Google Sheets: Audit Log**
- Append row: `[timestamp, "make_daily_pull", row_count, "scenario_A"]`

### Error Handling

- Each HTTP module: set error handler → route to **Error Notification** module
- Error Notification: Send email to `{{env.ALERT_EMAIL}}` with scenario name, module, error code, timestamp
- On rate limit (HTTP 429): Wait 60 seconds, retry up to 3 times (Make.com built-in retry)
- On auth failure (HTTP 401): Send alert — do not retry automatically (token may be expired)

---

## Scenario B — Daily Alert on Threshold Breach

**Trigger:** Schedule module — every day at 08:00 AEST (runs after Scenario A completes)

**Goal:** Read the Raw Data tab, compute daily metrics, compare to thresholds, send alerts if breached.

### Data Path

```
[Schedule Trigger 08:00 AEST]
    → [Google Sheets: Read Rows — Raw Data, last 7 days]
    → [Tools: Aggregate — compute 7-day averages for CTR, CPL, frequency]
    → [Tools: Compute — today's metrics vs thresholds]
    → [Filter: any threshold breached?]
        → YES → [Iterator: loop over breached rules]
            → [Email/Slack: send alert per rule]
            → [Google Sheets: Append Row to Alerts tab]
        → NO → [Tools: Log "no alerts" to Audit Log]
```

### Threshold Filters

See `daily-alerts-workflow.md` for the full rules engine. Summary for Make.com filter conditions:

| Condition | Filter Expression | Severity |
|---|---|---|
| Spend pacing off by >20% | `daily_spend > (monthly_budget / 30) * 1.2` OR `< 0.8` | Medium |
| CPA above break-even | `cost_per_purchase > break_even_cpa` AND `purchases > 0` | High |
| Frequency ≥ 4 | `frequency >= 4` | Medium |
| CTR drop ≥ 25% from 7-day peak | `ctr < (7day_peak_ctr * 0.75)` | Medium |
| Tracking not OK | `tracking_status != "OK"` | High |
| Zero conversions on spend > $20 | `spend > 20 AND leads = 0 AND purchases = 0` | High |

### Alert Output Modules

- **Email (primary):** Gmail or SMTP module → `{{env.ALERT_EMAIL}}`
- **Slack (optional):** Slack module → `#adpilot-alerts` channel
- **Sheets append:** Google Sheets → Alerts tab

---

## Scenario C — Weekly Report Generation + Email

**Trigger:** Schedule module — every Monday at 09:00 AEST

**Goal:** Aggregate last 7 days of data, call the riley reporting skill, generate PDF, email to operator and (optionally) client.

### Data Path

```
[Schedule Trigger Monday 09:00 AEST]
    → [Google Sheets: Read Rows — Raw Data, last 7 days]
    → [Tools: Aggregate — spend, leads, purchases, revenue by platform and campaign]
    → [Tools: Compute week-on-week change for each KPI]
    → [HTTP: POST to riley skill endpoint]
        Body: aggregated JSON + client config + prior week comparison
    → [Google Sheets: Write Output to "Weekly Report" tab]
    → [PDF Export: generate PDF from "Weekly Report" tab via Sheets API]
    → [Email: Send PDF to operator + cc client if enabled]
    → [Google Sheets: Append to Audit Log]
```

### riley Skill HTTP Module

- Method: POST
- URL: `{{env.RILEY_SKILL_ENDPOINT}}`
- Headers: `Authorization: Bearer {{env.RILEY_API_KEY}}`
- Body (JSON):
```json
{
  "business_id": "{{business_id}}",
  "date_from": "{{last_monday}}",
  "date_to": "{{last_sunday}}",
  "data": "{{aggregated_rows}}",
  "config": {
    "break_even_cpa": "{{env.BREAK_EVEN_CPA}}",
    "break_even_roas": "{{env.BREAK_EVEN_ROAS}}",
    "monthly_budget": "{{env.MONTHLY_BUDGET}}",
    "business_name": "{{client.business_name}}"
  }
}
```
- Note: Write actions from riley are proposals only — the HTTP response contains recommendation text, not API calls.

### Email Module

- To: `{{env.ALERT_EMAIL}}`
- CC: `{{env.CLIENT_EMAIL}}` (if `{{env.SEND_REPORT_TO_CLIENT}} = true`)
- Subject: `AdPilot OS — Weekly Report — {{client.business_name}} — w/e {{last_sunday}}`
- Body: White-label header + riley narrative summary
- Attachment: PDF export from Sheets

---

## Scenario D — New Lead → CRM + Lead Quality Log

**Trigger:** Webhook — Meta Lead Ads or TikTok Lead Gen form submission

**Goal:** On every new lead form submission, write lead to CRM and log to Lead Quality tab in Sheets.

### Data Path

```
[Webhook: inbound from Meta/TikTok lead form]
    → [Tools: Parse payload — name, email, phone, form_id, ad_id, adset_id, campaign_id, platform, timestamp]
    → [Filter: is platform == meta OR tiktok?]
    → [CRM Module: Create Contact — {{client.crm}}]
        Fields: first_name, last_name, email, phone, lead_source, utm_source, utm_campaign, utm_content, ad_id, form_id
    → [Google Sheets: Append Row to "Lead Quality" tab]
        Fields: timestamp, lead_id, platform, campaign_id, ad_id, email (hashed), lead_quality_score (default: null), status (default: new)
    → [Webhook Response: 200 OK]
```

### CRM Module — Platform Variants

- **HubSpot:** HubSpot module → Create Contact → set properties including UTM custom fields
- **Pipedrive:** Pipedrive module → Create Person → Create Deal (in "Lead In" stage)
- **GoHighLevel:** HTTP POST to `https://rest.gohighlevel.com/v1/contacts/` with `Authorization: Bearer {{env.GHL_API_KEY}}`
- **Sheets-only (no CRM):** Skip CRM module, write full lead detail to Lead Quality tab

### Lead Quality Tab Columns

```
timestamp, lead_id, business_id, platform, campaign_id, adset_id, ad_id, 
form_id, first_name, email_hash, phone_hash, lead_quality_score, 
status, sale_value_aud, closed_date, notes
```

Note: Email and phone are hashed (SHA-256) before writing to Sheets. Full PII lives in the CRM only.

### Write-Action Safety

- Scenario D WRITES to CRM (create contact) and Sheets (append row) — these are not ad platform writes.
- No ad platform write actions occur in this scenario.
- Lead form webhooks are configured in Meta Lead Ads / TikTok Lead Gen — not by this scenario.

---

## Shared Make.com Setup

### Connections Required

| Connection | Scope | Stored as |
|---|---|---|
| Meta Graph API | `ads_read`, `read_insights` | Make.com OAuth Connection |
| TikTok Marketing API | `report:read` | Make.com OAuth Connection |
| Google Sheets | Editor (limited to client Sheet) | Make.com OAuth Connection |
| Gmail / SMTP | Send mail | Make.com Connection |
| Slack (optional) | Incoming Webhook | Make.com Webhook Connection |
| CRM (varies) | Contacts write | Make.com Connection or HTTP |

### Data Stores

Create a Make.com Data Store named `adpilot_client_config` with fields:

| Field | Value |
|---|---|
| business_id | internal ID |
| business_name | {{client.business_name}} |
| break_even_cpa | number (AUD) |
| break_even_roas | number |
| monthly_budget | number (AUD) |
| alert_email | string |
| client_sheet_id | Google Sheet ID |

### Environment Secrets (Make.com)

Store in Make.com → Organisation → Variables (encrypted):
- `META_ACCESS_TOKEN` — never in scenario module fields
- `META_ACCOUNT_ID`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_ACCOUNT_ID`
- `CLIENT_SHEET_ID`
- `GHL_API_KEY` (or other CRM key)
- `RILEY_API_KEY`
- `ALERT_EMAIL`

---

## Upgrade Path

| Current | Next |
|---|---|
| Scenario A: single account | Multi-account: router module per client |
| Scenario B: email/Slack alerts | Add WhatsApp via Twilio module |
| Scenario C: manual riley call | Agent-to-agent pipeline (dana feeds riley automatically) |
| Scenario D: single CRM | Multi-CRM routing based on `{{client.crm}}` variable |
