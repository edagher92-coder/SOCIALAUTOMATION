# n8n Workflows — AdPilot OS V2 (Self-Hosted Option)

**Purpose:** n8n-based equivalent of Make.com scenarios. Preferred when the client or operator wants self-hosted automation with full data sovereignty — no third-party SaaS holds ad data.

---

## Safety Rules (mandatory — every workflow)

- `live_edit_block: true` — no n8n workflow may call any ad platform WRITE endpoint.
- `use_paused_duplicates_only: true` — any proposed ad change is a paused draft only; n8n does not execute ad changes.
- All API tokens and account IDs are stored in n8n **Credentials** (encrypted in the n8n database) or injected as **Environment Variables** at the host level. Never hardcode tokens in node parameters.
- Use `{{client.meta_account_id}}` and `{{client.tiktok_account_id}}` as display references in documentation only.
- Workflows may READ data and ALERT freely. Any WRITE to Sheets or CRM is append-only.
- Money-moving decisions require human typed YES — no automated budget or bid changes.
- No deletion of any ad, campaign, or CRM record.
- Prefer official platform APIs; no Puppeteer/browser automation of Ads Manager.
- Request least-privilege scopes: `ads_read` + `read_insights` only. `ads_management` scope is not requested.

---

## Deployment Notes

- **n8n version:** 1.x (self-hosted via Docker recommended)
- **Docker Compose example:**
  ```yaml
  services:
    n8n:
      image: n8nio/n8n
      environment:
        - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
        - META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
        - META_ACCOUNT_ID=${META_ACCOUNT_ID}
        - TIKTOK_ACCESS_TOKEN=${TIKTOK_ACCESS_TOKEN}
        - TIKTOK_ACCOUNT_ID=${TIKTOK_ACCOUNT_ID}
        - GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}
        - ALERT_EMAIL=${ALERT_EMAIL}
        - BREAK_EVEN_CPA=${BREAK_EVEN_CPA}
        - MONTHLY_BUDGET=${MONTHLY_BUDGET}
      volumes:
        - n8n_data:/home/node/.n8n
  ```
- All env vars come from a `.env` file on the host — never committed to version control.
- Credentials in n8n UI are encrypted with `N8N_ENCRYPTION_KEY` — rotate this key and backup regularly.

---

## Overview — Four Workflows

| # | Workflow Name | Trigger | Purpose |
|---|---|---|---|
| WF-1 | Daily Metrics Pull | Cron: 07:00 AEST | Pull Meta + TikTok ad insights → Google Sheets Raw Data |
| WF-2 | Daily Alert Engine | Cron: 08:00 AEST | Read Sheets, evaluate thresholds, send alerts |
| WF-3 | Weekly Report | Cron: Monday 09:00 AEST | Aggregate weekly data, call riley, email report |
| WF-4 | Lead Capture | Webhook trigger | Inbound lead → CRM + Lead Quality Sheet |

---

## WF-1 — Daily Metrics Pull

### Nodes

```
[Cron] → [Set: Date Variables] → [HTTP: Meta Insights] → [Function: Map Meta → Schema]
       → [Google Sheets: Append Rows]
       → [HTTP: TikTok Report] → [Function: Map TikTok → Schema]
       → [Google Sheets: Append Rows]
       → [Google Sheets: Audit Log]
       → [Error: IF node routes failures → Email alert]
```

### Node 1 — Cron

- Type: Cron
- Schedule: `0 7 * * *` (07:00 AEST = 21:00 UTC if running on UTC host; adjust for AEST offset)
- Timezone: `Australia/Sydney`

### Node 2 — Set: Date Variables

- Type: Set
- Values:
  - `date_yesterday`: `{{ $now.minus({days: 1}).toFormat('yyyy-MM-dd') }}`
  - `date_today`: `{{ $now.toFormat('yyyy-MM-dd') }}`
  - `meta_account_id`: `{{ $env.META_ACCOUNT_ID }}`
  - `tiktok_account_id`: `{{ $env.TIKTOK_ACCOUNT_ID }}`

### Node 3 — HTTP Request: Meta Ad Insights (READ ONLY)

- Type: HTTP Request
- Method: GET
- URL: `https://graph.facebook.com/v21.0/act_{{ $json.meta_account_id }}/insights`
- Authentication: Header Auth → Header: `Authorization`, Value: `Bearer {{ $env.META_ACCESS_TOKEN }}`
- Query Parameters:
  - `level`: `ad`
  - `time_range`: `{"since":"{{ $json.date_yesterday }}","until":"{{ $json.date_yesterday }}"}`
  - `fields`: `campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,action_values,video_play_actions`
  - `limit`: `500`
- Response Format: JSON

Note: For accounts with >500 ads, implement pagination using the `after` cursor from `paging.cursors.after` and a Loop node.

### Node 4 — Function: Map Meta Fields → Universal Schema

- Type: Function
- Code:
```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const d = item.json;
  
  // Parse actions array for leads and purchases
  const actions = d.actions || [];
  const actionValues = d.action_values || [];
  const leads = (actions.find(a => a.action_type === 'lead') || {}).value || 0;
  const purchases = (actions.find(a => a.action_type === 'purchase') || {}).value || 0;
  const revenue = (actionValues.find(a => a.action_type === 'purchase') || {}).value || 0;
  
  // Parse video actions
  const videoActions = d.video_play_actions || [];
  const video_views = parseInt((videoActions.find(a => a.action_type === 'video_view') || {}).value || 0);
  const three_sec = parseInt((videoActions.find(a => a.action_type === 'video_play_actions_3s') || {}).value || 0);
  const thruplays = parseInt((videoActions.find(a => a.action_type === 'video_thruplay_watched') || {}).value || 0);
  
  const spend = parseFloat(d.spend) || 0;
  const ctr_raw = parseFloat(d.ctr) || 0;
  const leadsNum = parseInt(leads);
  const purchasesNum = parseInt(purchases);
  const revenueNum = parseFloat(revenue);
  
  results.push({
    json: {
      business_id: $env.BUSINESS_ID,
      business_name: $env.BUSINESS_NAME,
      platform: 'meta',
      ad_account_id: $env.META_ACCOUNT_ID,
      campaign_id: d.campaign_id,
      campaign_name: d.campaign_name,
      adset_id: d.adset_id,
      adset_name: d.adset_name,
      ad_id: d.ad_id,
      ad_name: d.ad_name,
      date: $('Set: Date Variables').first().json.date_yesterday,
      objective: d.objective || '',
      budget_type: '',
      daily_budget: '',
      lifetime_budget: '',
      spend: spend,
      impressions: parseInt(d.impressions) || 0,
      reach: parseInt(d.reach) || 0,
      frequency: parseFloat(d.frequency) || 0,
      clicks: parseInt(d.clicks) || 0,
      ctr: ctr_raw / 100, // Meta returns CTR as percentage; convert to decimal
      cpc: parseFloat(d.cpc) || 0,
      cpm: parseFloat(d.cpm) || 0,
      landing_page_views: 0,
      leads: leadsNum,
      purchases: purchasesNum,
      revenue: revenueNum,
      cost_per_lead: leadsNum > 0 ? spend / leadsNum : null,
      cost_per_purchase: purchasesNum > 0 ? spend / purchasesNum : null,
      roas: spend > 0 ? revenueNum / spend : null,
      video_views: video_views,
      three_second_views: three_sec,
      six_second_views: 0,
      thruplays: thruplays,
      hook_rate: impressions > 0 ? three_sec / impressions : null,
      hold_rate: three_sec > 0 ? thruplays / three_sec : null,
      comments: 0,
      shares: 0,
      saves: 0,
      lead_quality_score: null,
      sales_count: purchasesNum,
      gross_profit: null,
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: d.campaign_name || '',
      utm_content: d.ad_name || '',
      utm_term: '',
      tracking_status: 'OK',
      recommendation: '',
      notes: ''
    }
  });
}

return results;
```

### Node 5 — Google Sheets: Append Rows (Meta)

- Type: Google Sheets
- Operation: Append or Update
- Sheet ID: `{{ $env.GOOGLE_SHEET_ID }}`
- Sheet Name: `Raw Data`
- Column Mapping: map each json key to its corresponding column header

### Nodes 6–8 — TikTok Equivalent

**Node 6 — HTTP Request: TikTok Ad Report (READ ONLY)**

- Method: POST (TikTok reporting API uses POST)
- URL: `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/`
- Headers: `Access-Token: {{ $env.TIKTOK_ACCESS_TOKEN }}`
- Body (JSON):
```json
{
  "advertiser_id": "{{ $env.TIKTOK_ACCOUNT_ID }}",
  "report_type": "BASIC",
  "dimensions": ["ad_id", "stat_time_day"],
  "metrics": ["spend", "impressions", "reach", "frequency", "clicks", "ctr", "cpc", "cpm",
               "conversion", "cost_per_conversion", "video_play_actions", "video_watched_2s",
               "video_watched_6s", "video_views_p100", "comments", "shares", "likes"],
  "start_date": "{{ $json.date_yesterday }}",
  "end_date": "{{ $json.date_yesterday }}",
  "page": 1,
  "page_size": 1000
}
```

**Node 7 — Function: Map TikTok Fields → Universal Schema**

```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const d = item.json;
  const m = d.metrics || {};
  const dims = d.dimensions || {};
  const spend = parseFloat(m.spend) || 0;
  const conversions = parseInt(m.conversion) || 0;
  const video_views = parseInt(m.video_play_actions) || 0;
  const three_sec = parseInt(m.video_watched_2s) || 0; // closest proxy
  const six_sec = parseInt(m.video_watched_6s) || 0;
  const thruplays = parseInt(m.video_views_p100) || 0;
  const ctr_raw = parseFloat(m.ctr) || 0;
  
  results.push({
    json: {
      business_id: $env.BUSINESS_ID,
      business_name: $env.BUSINESS_NAME,
      platform: 'tiktok',
      ad_account_id: $env.TIKTOK_ACCOUNT_ID,
      campaign_id: dims.campaign_id || '',
      campaign_name: dims.campaign_name || '',
      adset_id: dims.adgroup_id || '',
      adset_name: dims.adgroup_name || '',
      ad_id: dims.ad_id || '',
      ad_name: dims.ad_name || '',
      date: dims.stat_time_day || $('Set: Date Variables').first().json.date_yesterday,
      objective: dims.objective_type || '',
      budget_type: '',
      daily_budget: '',
      lifetime_budget: '',
      spend: spend,
      impressions: parseInt(m.impressions) || 0,
      reach: parseInt(m.reach) || 0,
      frequency: parseFloat(m.frequency) || 0,
      clicks: parseInt(m.clicks) || 0,
      ctr: ctr_raw / 100,
      cpc: parseFloat(m.cpc) || 0,
      cpm: parseFloat(m.cpm) || 0,
      landing_page_views: 0,
      leads: 0, // TikTok: filter by conversion event type if needed
      purchases: 0,
      revenue: 0,
      cost_per_lead: null,
      cost_per_purchase: conversions > 0 ? spend / conversions : null,
      roas: null,
      video_views: video_views,
      three_second_views: three_sec,
      six_second_views: six_sec,
      thruplays: thruplays,
      hook_rate: impressions > 0 ? three_sec / impressions : null,
      hold_rate: three_sec > 0 ? thruplays / three_sec : null,
      comments: parseInt(m.comments) || 0,
      shares: parseInt(m.shares) || 0,
      saves: parseInt(m.likes) || 0,
      lead_quality_score: null,
      sales_count: 0,
      gross_profit: null,
      utm_source: 'tiktok',
      utm_medium: 'paid_social',
      utm_campaign: dims.campaign_name || '',
      utm_content: dims.ad_name || '',
      utm_term: '',
      tracking_status: 'OK',
      recommendation: '',
      notes: 'three_second_views proxied from 2s; saves proxied from likes'
    }
  });
}

return results;
```

**Node 8 — Google Sheets: Append Rows (TikTok)**
- Same as Node 5, same sheet tab

### Node 9 — Google Sheets: Audit Log

- Append row: `[timestamp, "n8n_daily_pull", "WF-1", "success", row_count]`

### Node 10 — Error Handler (IF + Email)

- Type: IF node — condition: `{{ $execution.status === 'error' }}`
- On error: Email node → send to `{{ $env.ALERT_EMAIL }}`
- Error email subject: `[n8n ERROR] AdPilot OS WF-1 — {{ $now.toISO() }}`
- Body: `{{ $execution.error.message }}` + node name

---

## WF-2 — Daily Alert Engine

### Nodes

```
[Cron 08:00] → [Google Sheets: Read Daily Summary] → [Function: Evaluate Thresholds]
             → [IF: has_alerts?]
               YES → [Function: Format Alert Messages]
                   → [Email: Send Alert]
                   → [Slack: Post Alert (optional)]
                   → [Google Sheets: Append to Alerts tab]
               NO  → [Google Sheets: Audit Log — no alerts]
```

### Node 1 — Cron

- Schedule: `0 8 * * *` (08:00 AEST)

### Node 2 — Google Sheets: Read Daily Summary

- Read a single summary row from the `Daily Summary` tab (pre-aggregated by Sheets formulas)
- OR: Read all rows from yesterday in Raw Data and aggregate in Node 3

### Node 3 — Function: Evaluate Thresholds

```javascript
const d = $input.first().json;
const spend = parseFloat(d.spend) || 0;
const leads = parseInt(d.leads) || 0;
const purchases = parseInt(d.purchases) || 0;
const frequency = parseFloat(d.frequency) || 0;
const ctr = parseFloat(d.ctr) || 0;
const ctr_7day_peak = parseFloat(d.ctr_7day_peak) || ctr;
const monthly_budget = parseFloat($env.MONTHLY_BUDGET) || 1;
const break_even_cpa = parseFloat($env.BREAK_EVEN_CPA) || 999999;
const daily_target = monthly_budget / 30;
const cpa = purchases > 0 ? spend / purchases : null;

const alerts = [];

if (spend > daily_target * 1.2)
  alerts.push({ rule: 'spend_overpace', severity: 'medium', detail: `Spend AUD ${spend.toFixed(2)} vs target AUD ${daily_target.toFixed(2)}` });
if (spend < daily_target * 0.8 && spend > 0)
  alerts.push({ rule: 'spend_underpace', severity: 'medium', detail: `Spend AUD ${spend.toFixed(2)} vs target AUD ${daily_target.toFixed(2)}` });
if (cpa && cpa > break_even_cpa)
  alerts.push({ rule: 'cpa_above_breakeven', severity: 'high', detail: `CPA AUD ${cpa.toFixed(2)} > break-even AUD ${break_even_cpa.toFixed(2)}` });
if (frequency >= 4)
  alerts.push({ rule: 'high_frequency', severity: 'medium', detail: `Frequency ${frequency.toFixed(1)} ≥ 4` });
if (ctr < ctr_7day_peak * 0.75 && ctr_7day_peak > 0)
  alerts.push({ rule: 'ctr_drop_25pct', severity: 'medium', detail: `CTR ${(ctr*100).toFixed(2)}% dropped ≥25% from 7-day peak ${(ctr_7day_peak*100).toFixed(2)}%` });
if (spend > 20 && leads === 0 && purchases === 0)
  alerts.push({ rule: 'zero_conversions', severity: 'high', detail: `AUD ${spend.toFixed(2)} spent, zero conversions` });

return [{ json: { has_alerts: alerts.length > 0, alert_count: alerts.length, alerts } }];
```

### Node 4 — IF: has_alerts

- Condition: `{{ $json.has_alerts === true }}`

### Node 5 — Email: Send Alert

- Type: Email Send node (configure SMTP credentials in n8n)
- To: `{{ $env.ALERT_EMAIL }}`
- Subject: `[AdPilot OS ALERT] {{ $env.BUSINESS_NAME }} — {{ $json.alert_count }} alert(s) — {{ $now.toFormat('yyyy-MM-dd') }}`
- HTML Body: iterate `{{ $json.alerts }}`, render as formatted list with severity badges

### Node 6 — Slack (optional)

- Type: Slack node
- Channel: `#adpilot-alerts`
- Message: formatted Slack blocks from alerts array
- Credentials: Slack Bot Token stored in n8n Credentials

### Node 7 — Google Sheets: Append to Alerts Tab

- Append each alert as a separate row

---

## WF-3 — Weekly Report

### Nodes

```
[Cron: Mon 09:00] → [Google Sheets: Read Raw Data (last 7 days)]
                 → [Function: Aggregate Weekly KPIs]
                 → [HTTP: POST to riley skill]
                 → [Google Sheets: Write to Weekly Report tab]
                 → [HTTP: Export Sheet as PDF via Drive API]
                 → [Email: Send Report + PDF]
                 → [Audit Log]
```

### Node 3 — Function: Aggregate Weekly KPIs

```javascript
const rows = $input.all().map(i => i.json);
const agg = {
  spend: 0, leads: 0, purchases: 0, revenue: 0,
  impressions: 0, clicks: 0, video_views: 0,
  by_platform: { meta: { spend: 0, leads: 0 }, tiktok: { spend: 0, leads: 0 } }
};

for (const r of rows) {
  agg.spend += parseFloat(r.spend) || 0;
  agg.leads += parseInt(r.leads) || 0;
  agg.purchases += parseInt(r.purchases) || 0;
  agg.revenue += parseFloat(r.revenue) || 0;
  agg.impressions += parseInt(r.impressions) || 0;
  agg.clicks += parseInt(r.clicks) || 0;
  agg.video_views += parseInt(r.video_views) || 0;
  if (r.platform in agg.by_platform) {
    agg.by_platform[r.platform].spend += parseFloat(r.spend) || 0;
    agg.by_platform[r.platform].leads += parseInt(r.leads) || 0;
  }
}

agg.ctr = agg.impressions > 0 ? agg.clicks / agg.impressions : 0;
agg.cpl = agg.leads > 0 ? agg.spend / agg.leads : null;
agg.cpa = agg.purchases > 0 ? agg.spend / agg.purchases : null;
agg.roas = agg.spend > 0 ? agg.revenue / agg.spend : null;

return [{ json: agg }];
```

### Node 4 — HTTP Request: POST to riley Skill

- Method: POST
- URL: `{{ $env.RILEY_SKILL_ENDPOINT }}`
- Headers: `Authorization: Bearer {{ $env.RILEY_API_KEY }}`
- Body (JSON): serialised aggregated data + client config
- Note: riley returns narrative text + proposals only. No ad platform writes.

### Node 5 — HTTP Request: Export Sheet as PDF

- Method: GET
- URL: `https://docs.google.com/spreadsheets/d/{{ $env.GOOGLE_SHEET_ID }}/export?format=pdf&gid=WEEKLY_REPORT_TAB_GID`
- Headers: `Authorization: Bearer {{ google_access_token }}`
- Response: Binary data → attach to email

---

## WF-4 — Lead Capture (Inbound Webhook)

### Nodes

```
[Webhook: POST /leads/inbound] → [Function: Validate + Parse Payload]
                               → [IF: platform == meta or tiktok]
                               → [Function: Hash PII (email, phone)]
                               → [HTTP: CRM — Create Contact]  (not an ad write)
                               → [Google Sheets: Append to Lead Quality tab]
                               → [Respond to Webhook: 200 OK]
```

### Node 1 — Webhook Trigger

- Path: `/leads/inbound`
- Method: POST
- Authentication: Header Auth — validate `X-AdPilot-Signature` (HMAC-SHA256 of body using `{{ $env.WEBHOOK_SECRET }}`)

### Node 2 — Function: Validate + Parse

```javascript
const body = $input.first().json;
const crypto = require('crypto');

// Validate HMAC signature
const sig = $input.first().headers['x-adpilot-signature'];
const expected = crypto.createHmac('sha256', $env.WEBHOOK_SECRET)
  .update(JSON.stringify(body)).digest('hex');
if (sig !== `sha256=${expected}`) {
  throw new Error('Invalid webhook signature — request rejected');
}

// Parse payload
const platform = body.platform || (body.advertiser_id ? 'tiktok' : 'meta');
const lead = {
  lead_id: body.lead_id || body.id,
  platform,
  campaign_id: body.campaign_id,
  adset_id: body.adset_id || body.adgroup_id,
  ad_id: body.ad_id,
  form_id: body.form_id,
  first_name: body.first_name || (body.field_data || []).find(f => f.name === 'first_name')?.values?.[0] || '',
  email: body.email || (body.field_data || []).find(f => f.name === 'email')?.values?.[0] || '',
  phone: body.phone || (body.field_data || []).find(f => f.name === 'phone_number')?.values?.[0] || '',
  timestamp: body.created_time || body.create_time || new Date().toISOString()
};

return [{ json: lead }];
```

### Node 3 — Function: Hash PII

```javascript
const crypto = require('crypto');
const d = $input.first().json;
const hash = (val) => val ? crypto.createHash('sha256').update(val.toLowerCase().trim()).digest('hex') : '';
return [{ json: { ...d, email_hash: hash(d.email), phone_hash: hash(d.phone), email: undefined, phone: undefined } }];
```

### Node 4 — IF: Route to CRM

Condition: `{{ $env.CRM_TYPE }}`

- `hubspot` → HTTP POST to HubSpot Contacts API
- `pipedrive` → HTTP POST to Pipedrive Persons API
- `ghl` → HTTP POST to GoHighLevel Contacts API
- `sheets` → skip CRM, continue to Sheets only

### Node 5 — Google Sheets: Lead Quality Append

- Worksheet: `Lead Quality`
- Columns: timestamp, lead_id, business_id, platform, campaign_id, adset_id, ad_id, form_id, first_name, email_hash, phone_hash, lead_quality_score (blank), status (new)

### Node 6 — Respond to Webhook

- HTTP Response: `200 OK`, body: `{"status":"received","lead_id":"{{ $json.lead_id }}"}`

---

## Error Handling (All Workflows)

n8n error handling pattern applied to every workflow:

1. **Error Workflow** (separate n8n workflow):
   - Trigger: Error Trigger node (catches errors from all workflows)
   - Node: Email → `{{ $env.ALERT_EMAIL }}` — subject: `[n8n ERROR] {{ $workflow.name }}`, body: error message + timestamp
   - Node: Google Sheets → Audit Log → append error row

2. **HTTP request retries:**
   - Set `Retry on Fail: true`, max 3 attempts, wait 60 seconds between retries
   - Applies to all HTTP Request nodes calling Meta, TikTok, and CRM APIs

3. **Rate limit handling:**
   - After each HTTP Request node, add a `Wait` node: 1 second delay
   - For Meta: if HTTP 80000 (rate limit) returned, wait 5 minutes before retry
   - For TikTok: honour `Retry-After` header if returned

4. **Data validation before Sheets writes:**
   - IF node: `spend IS NULL` OR `campaign_id IS NULL` → route to error log, skip Sheets write

---

## n8n Credentials Required

| Credential Name | Type | Scopes |
|---|---|---|
| Meta API | HTTP Header Auth | Token from env — ads_read, read_insights |
| TikTok API | HTTP Header Auth | Token from env — report:read |
| Google Sheets | OAuth2 | spreadsheets (editor on client sheet only) |
| Google Drive | OAuth2 | drive.readonly (for PDF export) |
| SMTP / Email | SMTP | Send mail |
| Slack Bot | API Token | channels:write |
| CRM (varies) | HTTP Header Auth | contacts write |

Store all credentials in n8n's encrypted Credentials store — never in workflow node parameters.

---

## Self-Hosted Security Notes

- Run n8n behind a reverse proxy (Nginx/Caddy) with HTTPS only
- Webhook endpoint must be TLS-secured (no plain HTTP)
- Restrict n8n admin UI access to operator IP range only
- Regular backups of `~/.n8n` (contains encrypted credentials and workflow definitions)
- Rotate `N8N_ENCRYPTION_KEY` and API tokens quarterly
- Enable n8n basic auth or SSO for the UI
