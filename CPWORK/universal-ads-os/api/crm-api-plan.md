# CRM API Plan — AdPilot OS

**Purpose:** Generic CRM API integration plan covering HubSpot, Pipedrive, GoHighLevel, and Google Sheets (no-CRM fallback). Covers: contacts/deals, source and UTM capture, status webhooks, and the offline conversion export concept.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — CRM integration reads contacts/deals and writes lead data. No ad platform writes occur.
- `use_paused_duplicates_only: true` — any ad optimisation recommendation derived from CRM data is a paused proposal only.
- No deletion of CRM contacts or deals. Archive/mark inactive only.
- Offline conversion upload to Meta/TikTok is a [PROPOSAL] — requires operator review and human YES before any customer data is sent.
- CRM API keys stored in environment variables only. Never committed to source files.
- Least-privilege CRM scopes: `contacts:read`, `deals:read`. Add write scopes (`contacts:write`) only for lead creation flow, not for the feedback loop.

---

## CRM Selection Config

Set `{{client.crm}}` to one of:

| Value | CRM | Notes |
|---|---|---|
| `hubspot` | HubSpot | Most widely used; full API; recommended default |
| `pipedrive` | Pipedrive | API-key simple; popular in AU/NZ SMB |
| `gohighlevel` | GoHighLevel (GHL) | Common in AU digital agencies; strong automation built-in |
| `sheets` | Google Sheets | Zero-cost fallback; operator manages leads manually |

---

## HubSpot API

### Authentication

HubSpot uses either API Key (legacy) or Private Apps (OAuth Bearer — recommended).

**Private App setup (recommended):**
1. HubSpot → Settings → Integrations → Private Apps → Create Private App
2. Name: `AdPilot OS`
3. Scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write` (for creating deals from leads)
4. Generate token → store: `export HUBSPOT_TOKEN="..."`

**Request auth:**
```
Authorization: Bearer {{env.HUBSPOT_TOKEN}}
```

### Contacts

**Create Contact:**
```
POST https://api.hubapi.com/crm/v3/objects/contacts
Content-Type: application/json
Authorization: Bearer {{env.HUBSPOT_TOKEN}}

{
  "properties": {
    "firstname": "{{lead.first_name}}",
    "lastname": "{{lead.last_name}}",
    "email": "{{lead.email}}",
    "phone": "{{lead.phone}}",
    "lead_source": "Meta Lead Ad",
    "utm_source": "meta",
    "utm_campaign": "{{lead.campaign_name}}",
    "utm_content": "{{lead.ad_name}}",
    "ad_id": "{{lead.ad_id}}",
    "platform_lead_id": "{{lead.lead_id}}"
  }
}
```

**Read Contact:**
```
GET https://api.hubapi.com/crm/v3/objects/contacts/{{contact_id}}
  ?properties=firstname,lastname,email,phone,utm_source,utm_campaign,ad_id,platform_lead_id,dealstage
Authorization: Bearer {{env.HUBSPOT_TOKEN}}
```

**Search Contacts (by email):**
```
POST https://api.hubapi.com/crm/v3/objects/contacts/search
Authorization: Bearer {{env.HUBSPOT_TOKEN}}

{
  "filterGroups": [{
    "filters": [{"propertyName": "email", "operator": "EQ", "value": "{{email}}"}]
  }],
  "properties": ["firstname", "lastname", "email", "utm_source", "ad_id"]
}
```

### Deals

**Create Deal (from new lead):**
```
POST https://api.hubapi.com/crm/v3/objects/deals
Content-Type: application/json
Authorization: Bearer {{env.HUBSPOT_TOKEN}}

{
  "properties": {
    "dealname": "{{lead.first_name}} — Meta Lead — {{date}}",
    "pipeline": "default",
    "dealstage": "appointmentscheduled",
    "amount": null,
    "closedate": null,
    "utm_source": "meta",
    "utm_campaign": "{{lead.campaign_name}}"
  },
  "associations": [
    {
      "to": {"id": "{{contact_id}}"},
      "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 3}]
    }
  ]
}
```

**Read Deals (updated in last 24h for feedback loop):**
```
POST https://api.hubapi.com/crm/v3/objects/deals/search
Authorization: Bearer {{env.HUBSPOT_TOKEN}}

{
  "filterGroups": [{
    "filters": [{
      "propertyName": "hs_lastmodifieddate",
      "operator": "GTE",
      "value": "{{since_timestamp_ms}}"
    }]
  }],
  "properties": ["dealname", "dealstage", "amount", "closedate", "hs_deal_stage_probability",
                 "utm_source", "ad_id", "platform_lead_id"],
  "limit": 100
}
```

### HubSpot Custom Properties Required

Create these in HubSpot → Settings → Properties → Contact Properties:
- `utm_source` (text)
- `utm_medium` (text)
- `utm_campaign` (text)
- `utm_content` (text)
- `utm_term` (text)
- `ad_id` (text)
- `adset_id` (text)
- `campaign_id` (text)
- `form_id` (text)
- `platform_lead_id` (text) — unique identifier from Meta/TikTok

And for Deal Properties:
- `utm_source` (text)
- `utm_campaign` (text)
- `platform_lead_id` (text)
- `lead_quality_score` (number)

### HubSpot Webhooks (for status feedback loop)

HubSpot → Settings → Integrations → Private Apps → Webhooks:
- Subscribe to: `deal.propertyChange` → property: `dealstage`
- Target URL: `https://{{your-domain}}/webhooks/crm/status`
- Payload includes: `objectId` (deal_id), `propertyName`, `propertyValue`, `occurredAt`

On receiving: look up deal by `objectId`, read `platform_lead_id` from deal properties, match to Lead Quality tab.

---

## Pipedrive API

### Authentication

Pipedrive uses an API token (no OAuth required for server-to-server).

```
export PIPEDRIVE_TOKEN="..."
```

Append to all requests: `?api_token={{env.PIPEDRIVE_TOKEN}}`

### Persons (Contacts)

**Create Person:**
```
POST https://{{company}}.pipedrive.com/api/v1/persons?api_token={{env.PIPEDRIVE_TOKEN}}
Content-Type: application/json

{
  "name": "{{lead.first_name}} {{lead.last_name}}",
  "email": [{"value": "{{lead.email}}", "primary": true}],
  "phone": [{"value": "{{lead.phone}}", "primary": true}],
  "{{custom_field_utm_source}}": "meta",
  "{{custom_field_ad_id}}": "{{lead.ad_id}}",
  "{{custom_field_platform_lead_id}}": "{{lead.lead_id}}"
}
```

Note: Pipedrive custom field keys are machine-readable hashes (e.g., `abc123hash`). Create fields first in Settings → Data Fields, then retrieve the key via:
```
GET https://{{company}}.pipedrive.com/api/v1/personFields?api_token={{env.PIPEDRIVE_TOKEN}}
```

**Create Deal:**
```
POST https://{{company}}.pipedrive.com/api/v1/deals?api_token={{env.PIPEDRIVE_TOKEN}}

{
  "title": "{{lead.first_name}} — Meta Lead",
  "person_id": {{person_id}},
  "stage_id": {{lead_in_stage_id}},
  "status": "open",
  "{{custom_field_utm_source}}": "meta",
  "{{custom_field_campaign_id}}": "{{lead.campaign_id}}"
}
```

**Get Updated Deals (feedback loop):**
```
GET https://{{company}}.pipedrive.com/api/v1/deals?start=0&limit=100
  &since_timestamp={{since_iso_timestamp}}&status=all_not_deleted
  &api_token={{env.PIPEDRIVE_TOKEN}}
```

**Pipedrive Webhooks:**
Settings → Webhooks → Add:
- Event object: `deal`
- Event action: `updated`
- Endpoint: `https://{{your-domain}}/webhooks/crm/status`
- Payload: standard Pipedrive deal object — extract `id`, `stage_id`, `value`, `person_id`

---

## GoHighLevel (GHL) API

### Authentication

```
Authorization: Bearer {{env.GHL_API_KEY}}
```
Base URL: `https://rest.gohighlevel.com/v1/`

### Contacts

**Create Contact:**
```
POST https://rest.gohighlevel.com/v1/contacts/
Authorization: Bearer {{env.GHL_API_KEY}}
Content-Type: application/json

{
  "firstName": "{{lead.first_name}}",
  "lastName": "{{lead.last_name}}",
  "email": "{{lead.email}}",
  "phone": "{{lead.phone}}",
  "source": "Meta Lead Ad",
  "tags": ["meta_lead", "adpilot_os"],
  "customField": {
    "utm_source": "meta",
    "utm_campaign": "{{lead.campaign_name}}",
    "ad_id": "{{lead.ad_id}}",
    "platform_lead_id": "{{lead.lead_id}}"
  }
}
```

**Get Contact:**
```
GET https://rest.gohighlevel.com/v1/contacts/{{contact_id}}
Authorization: Bearer {{env.GHL_API_KEY}}
```

**GHL Opportunities (Deals):**
```
POST https://rest.gohighlevel.com/v1/opportunities/
Authorization: Bearer {{env.GHL_API_KEY}}

{
  "pipelineId": "{{env.GHL_PIPELINE_ID}}",
  "locationId": "{{env.GHL_LOCATION_ID}}",
  "name": "{{lead.first_name}} — Meta Lead",
  "pipelineStageId": "{{lead_in_stage_id}}",
  "status": "open",
  "monetaryValue": null,
  "contactId": "{{contact_id}}"
}
```

**GHL Webhooks:**
GHL → Automation → Workflows → Add Trigger:
- Trigger: Pipeline Stage Change
- Action: Webhook → POST to `https://{{your-domain}}/webhooks/crm/status`
- Payload: opportunity data including `monetaryValue`, `status`, `contactId`

---

## Google Sheets (No-CRM Fallback)

When `{{client.crm}} = sheets`, the Lead Quality tab acts as the CRM. Full lead details are stored here (no hashing — operator accepts responsibility for data management).

**Lead entry:** Append row via Google Sheets API (write-only service account):
```
POST https://sheets.googleapis.com/v4/spreadsheets/{{SHEET_ID}}/values/Lead Quality!A:Z:append
  ?valueInputOption=USER_ENTERED
Authorization: Bearer {{google_access_token}}

{
  "values": [[
    "{{timestamp}}", "{{lead_id}}", "{{business_id}}", "meta",
    "{{campaign_id}}", "{{adset_id}}", "{{ad_id}}", "{{form_id}}",
    "{{first_name}}", "{{last_name}}", "{{email}}", "{{phone}}",
    null, "new", null, null, null, ""
  ]]
}
```

**Status update:** Read row by lead_id (MATCH formula), then update status and sale_value columns manually or via Sheets API UPDATE.

**No webhook for Sheets-only mode:** The operator manually updates status and sale values in the Lead Quality tab. The feedback loop reads these updates daily via scheduled Sheets API read.

---

## UTM and Source Capture — Rules

### Rule 1: Capture All Five UTM Parameters

On every lead creation, capture and store:
- `utm_source` (e.g., `meta`, `tiktok`)
- `utm_medium` (e.g., `paid_social`, `messaging`, `call`)
- `utm_campaign` (e.g., campaign name or ID)
- `utm_content` (e.g., ad name or ID)
- `utm_term` (keyword or targeting description if applicable)

### Rule 2: First-Touch Attribution — Never Overwrite

If a contact already exists in the CRM (returning lead), do NOT overwrite the existing UTM fields. Preserve first-touch attribution. Add the new touchpoint to the `notes` or a separate `most_recent_utm` set of fields.

### Rule 3: Platform Lead ID is the Golden Key

`platform_lead_id` (Meta `leadgen_id` or TikTok `lead_id`) is the most reliable way to match a CRM contact back to a specific ad. Always store it. Never rely on email matching alone (emails can change; lead IDs are immutable).

### Rule 4: Messaging Leads (CTWA / Messenger / Call)

These leads do not have a `platform_lead_id`. Use:
- `utm_medium` = `ctwa` / `messenger` / `call`
- `utm_source` = `meta` / `tiktok`
- `attribution_source` = the ref parameter or call tracking number
- See `messaging-lead-source-plan.md` for full CTWA attribution detail

---

## Offline Conversion Export [PROPOSAL]

Uploading won-deal data as offline conversion events to Meta and TikTok enables the algorithms to optimise toward customers who actually pay — not just any lead. This is a powerful capability but requires careful implementation.

**This section is a proposal only. Steps to activate:**
1. Operator reviews and confirms data privacy compliance (Australian Privacy Act, Meta Data Sharing Policy, TikTok Terms)
2. Operator confirms with legal counsel if required
3. Operator types YES in the offline conversion activation step
4. Implement and test in sandbox before going live

### Meta: Conversions API Offline Events

See `meta-api-plan.md` for full endpoint detail. Summary:

1. Create Offline Event Set (Dataset) in Meta Events Manager → link to Ad Account
2. For each won deal: hash email + phone (SHA-256), collect sale value, event timestamp
3. POST to `https://graph.facebook.com/v21.0/{{dataset_id}}/events`
4. Match window: Meta can attribute offline events back to ads up to 28 days prior
5. Scope required: `ads_management` (operator account, not the read-only service account)

**CRM → Meta offline event mapping:**
| CRM Field | Meta Offline Event Field |
|---|---|
| closed_date | event_time (Unix timestamp) |
| email SHA-256 | user_data.em |
| phone SHA-256 | user_data.ph |
| sale_value_aud | custom_data.value |
| "AUD" | custom_data.currency |
| crm_deal_id | custom_data.order_id |
| "Purchase" | event_name |

### TikTok: Events API Offline Events

See `tiktok-api-plan.md`. Summary:

1. Create Offline Event Set in TikTok Events Manager → link to Ad Account
2. POST to `https://business-api.tiktok.com/open_api/v1.3/offline/track/`
3. Scope required: `offline_data:write`
4. Hashing: SHA-256 of lowercased, trimmed email and phone

---

## Error Handling

| Scenario | Handling |
|---|---|
| CRM create fails (duplicate email) | Check for existing contact first; update if found |
| CRM token expired | Alert operator; stop CRM writes until token refreshed |
| Webhook not received | Fallback to daily polling for deal status changes |
| Sale value in non-AUD currency | Convert to AUD using Config tab FX rate before storing |
| Platform lead ID not stored in CRM | Fall back to email match; log warning |
| CRM rate limit | Exponential backoff (30s → 2min → 10min); queue requests |

---

## CRM Rate Limits

| CRM | Limit | Notes |
|---|---|---|
| HubSpot | 100 requests/10 seconds (Private App) | Higher limits available on higher tiers |
| Pipedrive | 80 requests/2 seconds | |
| GoHighLevel | 10 requests/second | GHL documentation is variable; test empirically |
| Google Sheets API | 300 requests/minute per project | Use batch writes where possible |

---

## Implementation Checklist

- [ ] `{{client.crm}}` set in Config tab
- [ ] CRM credentials stored in env vars (never committed)
- [ ] Custom UTM fields created in CRM
- [ ] Lead ingest flow tested (Meta Lead Ads → CRM → Lead Quality tab)
- [ ] TikTok lead ingest flow tested
- [ ] CRM webhook configured (deal stage change → `/webhooks/crm/status`)
- [ ] Status mapping table confirmed for this client's CRM pipeline stages
- [ ] `platform_lead_id` stored correctly on first lead creation
- [ ] Lead Quality tab match by `platform_lead_id` verified
- [ ] First-touch UTM preservation confirmed (no overwrite on return visits)
- [ ] Offline conversion upload [PROPOSAL]: reviewed with client before enabling
- [ ] Error handling and retry logic tested
