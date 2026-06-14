# Zapier Zaps — AdPilot OS V2

**Purpose:** Zapier-based equivalent of the Make.com scenarios. Use when the client or operator prefers Zapier over Make.com. Covers lead capture, alerting, reporting, and CRM sync.

---

## Safety Rules (mandatory — every Zap)

- `live_edit_block: true` — no Zap may call any ad platform WRITE endpoint.
- `use_paused_duplicates_only: true` — any proposed ad change is a paused draft only; Zaps do not execute ad changes.
- All API tokens and account IDs are stored in Zapier **App Connections** or **Environment Variables** (Zapier Team/Company plan). Never paste raw tokens in Zap fields or Zap names.
- Use `{{client.meta_account_id}}` and `{{client.tiktok_account_id}}` as display references in documentation only.
- Zaps may READ data and ALERT freely. Any WRITE action to Sheets or CRM is append-only.
- Money-moving decisions require human typed YES — never automated in a Zap.
- No deletion of any ad, campaign, or CRM record.
- Prefer official platform APIs via Zapier's native integrations or HTTP action.
- Request least-privilege scopes: `ads_read` + `read_insights`; no `ads_management` scope in Zap connections.

---

## Overview — Five Zaps

| # | Zap Name | Trigger | Purpose |
|---|---|---|---|
| 1 | Meta Lead → CRM + Sheet | Meta Lead Ads: New Lead | Capture Meta lead form submission → CRM + Lead Quality Sheet |
| 2 | TikTok Lead → CRM + Sheet | Webhook (TikTok Lead Gen) | Capture TikTok lead form submission → CRM + Lead Quality Sheet |
| 3 | Daily Spend Alert | Schedule: Daily 08:00 AEST | Read Sheets data, check thresholds, send alert if breached |
| 4 | Weekly Report Email | Schedule: Monday 09:00 AEST | Aggregate weekly data, generate report, email PDF |
| 5 | CRM Status Change → Lead Quality Update | CRM: Deal/Contact Updated | Write CRM status update back to Lead Quality Sheet |

---

## Zap 1 — Meta Lead → CRM + Sheet

**Trigger:** Meta Lead Ads — New Lead

**Setup:**
1. Connect your Meta Business account (scope: `leads_retrieval`)
2. Select the Ad Account: `{{client.meta_account_id}}` (select from dropdown — Zapier stores the connection, not the ID)
3. Select the Form: choose the active lead form

### Step-by-Step Actions

**Action 1 — Paths (Zapier Paths feature)**

Path A: CRM is HubSpot
- App: HubSpot
- Action: Create or Update Contact
- Fields:
  - First Name: `{{lead.first_name}}`
  - Last Name: `{{lead.last_name}}`
  - Email: `{{lead.email}}`
  - Phone: `{{lead.phone_number}}`
  - Lead Source: `Meta Lead Ad`
  - Campaign ID (custom property): `{{lead.campaign_id}}`
  - Ad ID (custom property): `{{lead.ad_id}}`
  - UTM Source: `meta`
  - UTM Campaign: `{{lead.campaign_name}}`

Path B: CRM is Pipedrive
- App: Pipedrive
- Action: Create Person → then Create Deal
- Person fields: Name, Email, Phone
- Deal fields: Title = `{{lead.first_name}} — Meta Lead`, Stage = "Lead In", Source = "Meta"

Path C: CRM is GoHighLevel (via Webhook)
- App: Webhooks by Zapier
- Method: POST
- URL: `https://rest.gohighlevel.com/v1/contacts/`
- Headers: `Authorization: Bearer {{zap_env.GHL_API_KEY}}`
- Payload: `{"firstName": "{{lead.first_name}}", "lastName": "{{lead.last_name}}", "email": "{{lead.email}}", "phone": "{{lead.phone_number}}", "source": "meta_lead_ad", "customField": {"campaign_id": "{{lead.campaign_id}}", "ad_id": "{{lead.ad_id}}"}}`

Path D: No CRM — Sheets only
- Skip to Action 2

**Action 2 — Google Sheets: Append Row to Lead Quality tab**
- App: Google Sheets
- Action: Create Spreadsheet Row
- Spreadsheet: `{{zap_env.CLIENT_SHEET_ID}}`
- Worksheet: `Lead Quality`
- Row data:
  - timestamp: `{{zap_meta.timestamp}}`
  - lead_id: `{{lead.id}}`
  - business_id: `{{zap_env.BUSINESS_ID}}`
  - platform: `meta`
  - campaign_id: `{{lead.campaign_id}}`
  - adset_id: `{{lead.adset_id}}`
  - ad_id: `{{lead.ad_id}}`
  - form_id: `{{lead.form_id}}`
  - first_name: `{{lead.first_name}}`
  - email_hash: (use Formatter step to SHA-256 hash email before this step)
  - phone_hash: (use Formatter step to SHA-256 hash phone)
  - lead_quality_score: (leave blank — filled by CRM feedback loop)
  - status: `new`

**Filter (before Action 2):** Only continue if `{{lead.email}}` exists OR `{{lead.phone_number}}` exists. Rejects blank submissions.

### Email Hash Step (between Trigger and Action 2)

- App: Formatter by Zapier
- Transform: Text → Convert to SHA-256 hash
- Input: `{{lead.email}}`
- Output: `email_hash`

---

## Zap 2 — TikTok Lead → CRM + Sheet

**Trigger:** Webhooks by Zapier — Catch Hook

**Setup:**
1. In TikTok Ads Manager → Tools → Lead Generation → Webhook Settings
2. Paste the Zapier Catch Hook URL
3. Map TikTok's webhook payload fields (see webhook-schema.json and webhook-structure.md)

**TikTok Webhook Payload (expected):**
```json
{
  "advertiser_id": "...",
  "form_id": "...",
  "lead_id": "...",
  "ad_id": "...",
  "adgroup_id": "...",
  "campaign_id": "...",
  "create_time": 1700000000,
  "question_list": [
    {"question_id": "q1", "answer": "First Name"},
    {"question_id": "q2", "answer": "email@example.com"}
  ]
}
```

**Actions:** Same as Zap 1, but:
- platform = `tiktok`
- adset_id = `{{payload.adgroup_id}}`
- UTM Source = `tiktok`

**Filter:** Verify webhook signature (add Zapier Code step to validate `X-TikTok-Signature` header — see webhook-structure.md for signing logic).

---

## Zap 3 — Daily Spend Alert

**Trigger:** Schedule by Zapier
- Frequency: Every day
- Time: 08:00 AM
- Timezone: Australia/Sydney

**Purpose:** Read yesterday's aggregated metrics from Google Sheets, check against thresholds, send alert if any rule fires.

### Actions

**Action 1 — Google Sheets: Lookup Row**
- App: Google Sheets
- Action: Lookup Spreadsheet Row(s)
- Spreadsheet: `{{zap_env.CLIENT_SHEET_ID}}`
- Worksheet: `Raw Data`
- Lookup Column: `date`
- Lookup Value: yesterday's date (use Formatter to compute `today - 1 day`)
- Returns: all rows for yesterday

Note: Zapier has a 100-row lookup limit on the free tier. Use the Google Sheets API via Zapier's HTTP action for large datasets, or aggregate in a Sheets formula and read a single summary row from a "Daily Summary" tab.

**Recommended approach — Daily Summary tab in Sheets:**
- Add a "Daily Summary" tab with SUMIF formulas computing totals for each day
- Zap reads a single row from Daily Summary (much more reliable than multi-row lookup)

**Action 2 — Code by Zapier (JavaScript) — Threshold Check**

```javascript
const spend = parseFloat(inputData.spend) || 0;
const leads = parseInt(inputData.leads) || 0;
const purchases = parseInt(inputData.purchases) || 0;
const cpa = purchases > 0 ? spend / purchases : null;
const frequency = parseFloat(inputData.frequency) || 0;
const ctr = parseFloat(inputData.ctr) || 0;
const ctr_7day_peak = parseFloat(inputData.ctr_7day_peak) || ctr;
const monthly_budget = parseFloat(inputData.monthly_budget) || 1;
const break_even_cpa = parseFloat(inputData.break_even_cpa) || 999999;
const daily_budget_expected = monthly_budget / 30;

const alerts = [];

if (spend > daily_budget_expected * 1.2) {
  alerts.push({ rule: 'spend_overpace', severity: 'medium', message: `Spend AUD ${spend.toFixed(2)} is >20% above daily target AUD ${daily_budget_expected.toFixed(2)}` });
}
if (spend < daily_budget_expected * 0.8 && spend > 0) {
  alerts.push({ rule: 'spend_underpace', severity: 'medium', message: `Spend AUD ${spend.toFixed(2)} is >20% below daily target AUD ${daily_budget_expected.toFixed(2)}` });
}
if (cpa !== null && cpa > break_even_cpa) {
  alerts.push({ rule: 'cpa_above_breakeven', severity: 'high', message: `CPA AUD ${cpa.toFixed(2)} exceeds break-even AUD ${break_even_cpa.toFixed(2)}` });
}
if (frequency >= 4) {
  alerts.push({ rule: 'high_frequency', severity: 'medium', message: `Ad frequency ${frequency.toFixed(1)} ≥ 4 — audience fatigue risk` });
}
if (ctr < ctr_7day_peak * 0.75 && ctr_7day_peak > 0) {
  alerts.push({ rule: 'ctr_drop', severity: 'medium', message: `CTR ${(ctr*100).toFixed(2)}% dropped ≥25% from 7-day peak ${(ctr_7day_peak*100).toFixed(2)}%` });
}
if (spend > 20 && leads === 0 && purchases === 0) {
  alerts.push({ rule: 'zero_conversions', severity: 'high', message: `AUD ${spend.toFixed(2)} spent with zero conversions` });
}

return { alert_count: alerts.length, alerts: JSON.stringify(alerts), has_alerts: alerts.length > 0 };
```

**Filter:** Only continue if `has_alerts` is `true`.

**Action 3 — Paths: Alert Channel**

Path A: Email (always on)
- App: Gmail (or Email by Zapier)
- To: `{{zap_env.ALERT_EMAIL}}`
- Subject: `[AdPilot OS ALERT] {{client.business_name}} — {{alert_count}} rule(s) fired — {{date}}`
- Body: formatted list of alerts from `{{alerts}}` JSON

Path B: Slack (if enabled)
- App: Slack
- Channel: `#adpilot-alerts`
- Message: same alert content, formatted as Slack blocks

**Action 4 — Google Sheets: Append Alert Row**
- App: Google Sheets
- Worksheet: `Alerts`
- Row: timestamp, business_id, platform, alert rule, severity, message, status=`open`

---

## Zap 4 — Weekly Report Email

**Trigger:** Schedule by Zapier
- Frequency: Every week
- Day: Monday
- Time: 09:00 AM
- Timezone: Australia/Sydney

### Actions

**Action 1 — Google Sheets: Read Weekly Summary**
- Read the `Weekly Report` tab (which is populated by the riley skill run)
- OR: Read last 7 days from `Raw Data` and aggregate via Code step

**Action 2 — Code by Zapier (JavaScript) — Build Report Summary**

```javascript
const rows = JSON.parse(inputData.weekly_data || '[]');
const spend = rows.reduce((s, r) => s + (parseFloat(r.spend) || 0), 0);
const leads = rows.reduce((s, r) => s + (parseInt(r.leads) || 0), 0);
const purchases = rows.reduce((s, r) => s + (parseInt(r.purchases) || 0), 0);
const revenue = rows.reduce((s, r) => s + (parseFloat(r.revenue) || 0), 0);
const cpl = leads > 0 ? spend / leads : null;
const cpa = purchases > 0 ? spend / purchases : null;
const roas = spend > 0 ? revenue / spend : null;

return {
  spend: spend.toFixed(2),
  leads: leads,
  purchases: purchases,
  revenue: revenue.toFixed(2),
  cpl: cpl ? cpl.toFixed(2) : 'N/A',
  cpa: cpa ? cpa.toFixed(2) : 'N/A',
  roas: roas ? roas.toFixed(2) : 'N/A',
  week_ending: inputData.week_ending
};
```

**Action 3 — Gmail: Send Report Email**
- To: `{{zap_env.ALERT_EMAIL}}`
- CC: `{{zap_env.CLIENT_EMAIL}}` (if report sharing is enabled)
- Subject: `AdPilot OS — Weekly Report — {{client.business_name}} — w/e {{week_ending}}`
- Body:
```
{{client.business_name}} — Weekly Ad Performance Report
Week ending: {{week_ending}}

SUMMARY
Total Spend:     AUD {{spend}}
Total Leads:     {{leads}}
Cost Per Lead:   AUD {{cpl}}
Total Purchases: {{purchases}}
Cost Per Purchase: AUD {{cpa}}
Total Revenue:   AUD {{revenue}}
ROAS:            {{roas}}x

Full report: {{google_sheets_link}}

Note: All recommendations in the attached report are proposals only.
No changes have been made to any live ad account.
```
- Attachment: PDF link from Google Sheets (use Sheets API or Drive API to export — see google-sheets-workflow.md)

**Action 4 — Google Sheets: Audit Log**
- Append: timestamp, "zapier_weekly_report", week_ending, "sent"

---

## Zap 5 — CRM Status Change → Lead Quality Update

**Trigger:** CRM-specific trigger (choose based on `{{client.crm}}`)

- **HubSpot:** HubSpot — Deal Stage Changed → filter: stage changed to Closed Won or Closed Lost
- **Pipedrive:** Pipedrive — Deal Updated → filter: stage_id changed
- **GoHighLevel:** Webhook from GHL pipeline stage change
- **Generic:** Webhooks by Zapier — Catch Hook (CRM sends webhook on status change)

### Actions

**Action 1 — Filter:** Only continue if deal stage = Closed Won OR Closed Lost

**Action 2 — Google Sheets: Lookup Lead Quality Row**
- Lookup by: `lead_id` OR `email_hash`

**Action 3 — Google Sheets: Update Row — Lead Quality tab**
- Status: `closed_won` or `closed_lost`
- Sale value AUD: `{{crm.deal_value}}`
- Closed date: `{{crm.closed_date}}`
- Lead quality score: computed in next step

**Action 4 — Code by Zapier — Compute Lead Quality Score**

```javascript
const status = inputData.status; // 'closed_won' or 'closed_lost'
const sale_value = parseFloat(inputData.sale_value) || 0;
const avg_sale_value = parseFloat(inputData.avg_sale_value) || 1;
// Score: 0-10 scale. Won = base 7, scaled by deal size vs average.
const base = status === 'closed_won' ? 7 : 2;
const size_multiplier = status === 'closed_won' ? Math.min(sale_value / avg_sale_value, 1.5) : 1;
const score = Math.min(Math.round(base * size_multiplier), 10);
return { lead_quality_score: score };
```

**Action 5 — Google Sheets: Update Lead Quality Score**
- Update the row found in Action 2 with `lead_quality_score` from Action 4

---

## Zapier Environment Variables

Store in Zapier → Org Settings → Environment Variables (Zapier Team plan):

| Variable | Description |
|---|---|
| `META_ACCOUNT_ID` | Client Meta ad account ID |
| `TIKTOK_ACCOUNT_ID` | Client TikTok ad account ID |
| `CLIENT_SHEET_ID` | Google Sheet ID |
| `GHL_API_KEY` | GoHighLevel API key (if CRM = GHL) |
| `BUSINESS_ID` | Internal business ID |
| `ALERT_EMAIL` | Primary alert recipient email |
| `CLIENT_EMAIL` | Client email for report CC |
| `BREAK_EVEN_CPA` | Break-even CPA in AUD |
| `MONTHLY_BUDGET` | Monthly budget in AUD |

**Never store:** raw access tokens for Meta or TikTok in Env Variables — use Zapier's native App Connection for these (OAuth-based, scoped to `ads_read` + `read_insights`).

---

## Zapier Plan Requirements

| Feature | Required Plan |
|---|---|
| Paths (Zap 1) | Zapier Professional+ |
| Code by Zapier | Zapier Professional+ |
| Multi-step Zaps | Zapier Starter+ |
| Environment Variables | Zapier Team+ |
| Webhook trigger | Zapier Starter+ |

---

## Upgrade Path

| Current | Next |
|---|---|
| Zap 3: single summary row | Multi-campaign breakdown via Sheets API HTTP action |
| Zap 4: manual riley text | Agent API call to riley skill endpoint |
| Zap 5: manual quality score | ML-based quality scoring via HTTP step to scoring endpoint |
| Single client | Multi-client: use Zapier Tables to store client configs |
