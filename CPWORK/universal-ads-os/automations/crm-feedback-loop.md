# CRM Feedback Loop — AdPilot OS

**Purpose:** Generic CRM integration loop for `{{client.crm}}` (HubSpot / Pipedrive / GoHighLevel / Google Sheets). Covers: lead in → status updates → revenue attribution → schema write-back, UTM/source preservation, and the offline conversion upload concept.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — this loop reads from CRM and writes to Sheets. No ad platform writes occur automatically.
- `use_paused_duplicates_only: true` — any ad-level action driven by CRM data is a paused proposal only.
- Offline conversion upload to Meta/TikTok is a PROPOSAL step only. It requires operator review and human YES before execution. See offline conversion section below.
- No API keys or tokens are written to this document or to Sheets. Use environment secrets.
- Least-privilege CRM scopes: read contacts + read deals. No delete scopes.

---

## Overview

The CRM feedback loop has three phases:

```
Phase 1 — INGEST:   Lead arrives from ad platform → into CRM → lead written to Lead Quality tab
Phase 2 — TRACK:    CRM deal progresses → status updates sync back to Lead Quality tab  
Phase 3 — CLOSE:    Deal closed (won/lost) → revenue written to schema → true CPA/ROAS computed
Phase 4 — UPLOAD:   [PROPOSAL] Hashed customer data uploaded as offline conversions to Meta/TikTok
```

---

## Supported CRM Platforms

This loop supports four CRM types. Set `{{client.crm}}` to one of:

| CRM | Integration Method | Notes |
|---|---|---|
| `hubspot` | HubSpot API v3 (OAuth, Bearer token) | Most complete; use native Make/n8n modules |
| `pipedrive` | Pipedrive REST API (API key) | Good for smaller agencies; simple deal model |
| `gohighlevel` | GHL REST API v1 (API key) + Webhooks | Common in AU/NZ digital agencies; strong automation |
| `sheets` | Google Sheets (no CRM) | Zero-cost fallback; operator manages lead data manually |

---

## Phase 1 — Lead Ingest

### Data Sources

Leads arrive from:

1. **Meta Lead Ads** — via Meta Webhooks or Meta Leads API (polling)
2. **TikTok Lead Generation** — via TikTok Lead Notification webhook
3. **CTWA (Click-to-WhatsApp)** — via Meta Conversations API or WhatsApp Business Platform (see messaging-lead-source-plan.md)
4. **Messenger** — via Meta Messaging webhook
5. **Outbound call to tracking number** — via call tracking provider (Invoca, CallRail, etc.)
6. **Landing page form** — via webhook from the form platform (Typeform, Gravity Forms, etc.)

### Fields Captured at Ingest

All of the following must be captured and stored in CRM at the point of lead creation:

| Field | CRM Property | Notes |
|---|---|---|
| first_name | First Name | |
| last_name | Last Name | |
| email | Email | Used for hashed match later |
| phone | Phone | Used for hashed match later |
| lead_source | Lead Source | `meta_lead_ad` / `tiktok_lead_gen` / `ctwa` / `messenger` / `call` / `form` |
| utm_source | UTM Source (custom field) | e.g. `meta`, `tiktok` |
| utm_medium | UTM Medium (custom field) | `paid_social` |
| utm_campaign | UTM Campaign (custom field) | Campaign name or ID |
| utm_content | UTM Content (custom field) | Ad name or ID |
| utm_term | UTM Term (custom field) | Keyword or targeting detail |
| ad_id | Ad ID (custom field) | Platform ad ID |
| adset_id | Ad Set ID (custom field) | |
| campaign_id | Campaign ID (custom field) | |
| form_id | Form ID (custom field) | Lead Ads form ID |
| platform_lead_id | Platform Lead ID (custom field) | Meta lead_id or TikTok lead_id |
| attribution_source | Attribution Source (custom field) | Full source detail |
| lead_received_at | Created Date | Timestamp from webhook |

### CRM Custom Fields Required

Before running the loop, create these custom fields/properties in the CRM:

**HubSpot:** Custom contact properties
- `utm_source` (text), `utm_medium` (text), `utm_campaign` (text), `utm_content` (text), `utm_term` (text)
- `ad_id` (text), `adset_id` (text), `campaign_id` (text), `form_id` (text), `platform_lead_id` (text)
- `attribution_source` (text), `lead_quality_score` (number)

**Pipedrive:** Custom Person fields
- Same list as above — add in Settings → Data Fields

**GoHighLevel:** Custom fields in Contact
- Same list — add in Settings → Custom Fields

---

## Phase 2 — Status Tracking

### Lead Status Lifecycle

```
new → contacted → engaged → proposal_sent → negotiating → closed_won / closed_lost / not_qualified / no_response
```

Each status change fires a webhook (if configured) or is detected via polling.

### CRM-to-Schema Status Mapping

| CRM Stage (HubSpot example) | Normalised Status | lead_quality_score |
|---|---|---|
| New | new | null |
| Attempted to Contact | contacted | null |
| Connected | engaged | null |
| Appointment Scheduled | engaged | null |
| Qualified to Buy | proposal_sent | 4 (preliminary) |
| Presentation Scheduled | negotiating | 4 |
| Decision Maker Bought-In | negotiating | 5 |
| Contract Sent | negotiating | 6 |
| Closed Won | closed_won | compute from scoring model |
| Closed Lost | closed_lost | 2 |

### Pipedrive Mapping

| Pipedrive Stage | Normalised Status |
|---|---|
| Lead In | new |
| Contact Made | contacted |
| Proposal Made | proposal_sent |
| Negotiations Started | negotiating |
| Won | closed_won |
| Lost | closed_lost |

### GoHighLevel Mapping

Map GHL pipeline stages to normalised statuses in the config. GHL pipelines are customisable — operator must map their specific stage names.

---

## Phase 3 — Revenue Write-Back

When a deal closes:

1. CRM webhook fires (or daily poll detects) `closed_won` status
2. Extract: `sale_value`, `closed_date`, `contact_id` / `deal_id`
3. Look up the lead in Lead Quality tab by `crm_deal_id` or `platform_lead_id`
4. Update Lead Quality tab:
   - `status` = `closed_won`
   - `sale_value_aud` = deal amount in AUD
   - `gross_profit_aud` = `sale_value_aud * gross_margin` (from Config tab)
   - `closed_date` = deal close date
   - `days_to_close` = `closed_date - lead_received_at`
   - `lead_quality_score` = computed per scoring model (see lead-quality-feedback-loop.md)

5. Universal schema `Raw Data` rows for the matching `ad_id` + `date` are NOT updated directly. Instead, the Lead Quality tab acts as the bridge. Summary metrics (true_cpa, true_roas by campaign) are computed in a separate "Quality Summary" aggregation, which dana/riley read.

---

## Phase 4 — Offline Conversion Upload [PROPOSAL]

Offline conversion upload sends won-customer data (hashed email/phone) back to Meta and TikTok so the algorithm can optimise toward customers who close, not just any lead.

**This is a proposal step only. It requires:**
1. Operator to review the implementation
2. Operator to confirm compliance with Australian Privacy Act and platform terms
3. Human YES before any customer data is sent to Meta/TikTok

### Concept: Meta Offline Conversions

**Meta Offline Conversions API (now: Conversions API with offline events):**

```
POST https://graph.facebook.com/v21.0/{{dataset_id}}/events

Headers:
  Authorization: Bearer {{env.META_ACCESS_TOKEN}}
  Content-Type: application/json

Body:
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1700000000,
      "action_source": "crm",
      "user_data": {
        "em": ["{{sha256(email)}}"],
        "ph": ["{{sha256(phone)}}"]
      },
      "custom_data": {
        "currency": "AUD",
        "value": {{sale_value_aud}},
        "order_id": "{{crm_deal_id}}"
      }
    }
  ],
  "test_event_code": "TEST12345"
}
```

Note: `em` and `ph` must be SHA-256 hashed before sending. Never send raw email or phone to Meta API.

Setup required:
1. Create an Offline Event Set (Dataset) in Meta Events Manager
2. Link the Dataset to the relevant Ad Account
3. Request `ads_management` scope on the Meta App (operator only — not in read-only connection)
4. Test with `test_event_code` before going live

### Concept: TikTok Offline Conversions

**TikTok Events API (offline events):**

```
POST https://business-api.tiktok.com/open_api/v1.3/offline/track/

Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
  Content-Type: application/json

Body:
{
  "advertiser_id": "{{env.TIKTOK_ACCOUNT_ID}}",
  "event_set_id": "{{tiktok_event_set_id}}",
  "data": [
    {
      "event": "CompletePayment",
      "event_time": 1700000000,
      "properties": {
        "currency": "AUD",
        "value": {{sale_value_aud}},
        "order_id": "{{crm_deal_id}}"
      },
      "context": {
        "user": {
          "sha256_email": "{{sha256(email)}}",
          "sha256_phone_number": "{{sha256(phone)}}"
        }
      }
    }
  ]
}
```

Setup required:
1. Create an Offline Event Set in TikTok Events Manager
2. Link to Ad Account
3. Request `offline_data:write` scope

---

## UTM and Source Preservation

UTM data preservation is critical for attribution. Follow these rules:

### Rule 1: Capture UTMs at First Touch

The first time a lead is created in the CRM, capture all UTM parameters from the lead source webhook payload. Never overwrite first-touch UTMs with subsequent visits.

### Rule 2: Store All UTMs as Custom Fields

Do not rely on the CRM's default "Lead Source" field alone. Custom UTM fields (`utm_source`, `utm_campaign`, `utm_content`, `utm_term`) must be stored separately so they can be mapped back to the universal schema.

### Rule 3: Preserve Platform Lead IDs

`platform_lead_id` (Meta lead_id or TikTok lead_id) must be stored in the CRM. This is the only reliable way to match a CRM deal back to a specific ad ID.

### Rule 4: Handle UTM-Less Leads

Leads from CTWA, Messenger, and phone calls often lack UTM parameters. Use the `ref` parameter pattern for these (see messaging-lead-source-plan.md). In the CRM, set:
- `utm_source` = `meta` or `tiktok` (inferred from the channel)
- `utm_medium` = `messaging` or `call`
- `attribution_source` = `ctwa` / `messenger` / `call_tracking`

### UTM to Universal Schema Mapping

| CRM Custom Field | Universal Schema Field |
|---|---|
| utm_source | utm_source |
| utm_medium | utm_medium |
| utm_campaign | utm_campaign |
| utm_content | utm_content |
| utm_term | utm_term |
| attribution_source | utm_source (override if blank) |

---

## CRM API Reference (Read Scopes Only)

### HubSpot

```
GET https://api.hubapi.com/crm/v3/objects/contacts?properties=email,phone,utm_source,...
GET https://api.hubapi.com/crm/v3/objects/deals?properties=dealname,dealstage,amount,closedate,...
GET https://api.hubapi.com/crm/v3/objects/deals/{{deal_id}}/associations/contacts
```
- Auth: Bearer token from OAuth (scope: `crm.objects.contacts.read`, `crm.objects.deals.read`)
- Webhook: HubSpot Workflows → send webhook on deal stage change

### Pipedrive

```
GET https://api.pipedrive.com/v1/deals?status=won&since_update_time={{since}}
GET https://api.pipedrive.com/v1/persons/{{person_id}}?api_token={{env.PIPEDRIVE_TOKEN}}
```
- Auth: `api_token` query param (store in env var)
- Webhook: Pipedrive Settings → Webhooks → deal.updated

### GoHighLevel

```
GET https://rest.gohighlevel.com/v1/contacts/{{contact_id}}
GET https://rest.gohighlevel.com/v1/opportunities/?pipelineId={{pipeline_id}}
```
- Auth: `Authorization: Bearer {{env.GHL_API_KEY}}`
- Webhook: GHL Workflows → Webhook action on pipeline stage change

---

## Error and Edge Cases

| Scenario | Handling |
|---|---|
| CRM deal not matched to Lead Quality row | Log to Audit tab; flag for manual review |
| Multiple deals for one lead | Use the deal with highest `sale_value_aud`; log note |
| Deal value in non-AUD currency | Convert to AUD before writing — use Config tab FX rate |
| CRM webhook not received | Daily poll fallback catches changes within 24h |
| Lead received but CRM write failed | Lead Quality tab write still succeeds; retry CRM write 3x |
| Deal re-opened after closure | Update Lead Quality row; re-compute LQS |

---

## Schema Integration Summary

| Loop Phase | Writes to | Reads from |
|---|---|---|
| Ingest | Lead Quality tab + CRM | Ad platform webhook |
| Status tracking | Lead Quality tab (status column) | CRM webhook / poll |
| Revenue write-back | Lead Quality tab (sale_value, LQS) | CRM webhook / poll |
| Quality aggregation | Quality Summary tab (computed) | Lead Quality tab |
| Reporting | dana/riley read Quality Summary | Quality Summary tab |
| Offline conversion [PROPOSAL] | Meta/TikTok Offline Events API | Lead Quality tab (hashed) |
