# Messaging Lead Source Attribution Plan — AdPilot OS

**Purpose:** Attribute leads from WhatsApp (CTWA), Messenger (m.me), and phone calls to specific ad campaigns and ads. These channels lack standard UTM parameters but are increasingly important in AU/NZ markets. This plan maps them into the universal schema's attribution fields.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — attribution tracking is READ and INGEST only. No ad platform writes.
- No phone numbers, WhatsApp chat content, or message content are stored in the universal schema. Only attribution metadata (ad_id, ref parameter, call tracking number) is logged.
- No API keys or tokens in this document. Use `{{env.*}}` references.
- PII (phone, name) is handled by the CRM only, not by Sheets.

---

## Problem Statement

Standard Meta and TikTok ads with URL destinations pass UTM parameters in the landing page URL. Analytics tools (GA4, etc.) capture these automatically.

Messaging ads work differently:
- **Click-to-WhatsApp (CTWA):** Ad opens a WhatsApp conversation. No URL. No UTM.
- **Click-to-Messenger:** Ad opens a Messenger conversation. No landing page URL.
- **Call ads:** Ad displays a phone number. User calls. No digital trail without call tracking.

Without attribution, these leads appear in the CRM with no source data — they look "organic" even though a paid ad generated them.

---

## Channel 1: Click-to-WhatsApp (CTWA)

### How CTWA Ads Work

1. Ad appears in Meta feed / Stories
2. User taps "Send Message" CTA
3. WhatsApp opens with a pre-populated message (configured in Ads Manager)
4. Lead is now in WhatsApp Business inbox

### Attribution Method: `ref` Parameter

Meta's CTWA ads support a `ref` parameter in the WhatsApp message template. This parameter carries attribution data and is visible in the WhatsApp Business API webhook payload.

**Setting the ref in Ads Manager:**

In the ad's CTA configuration (WhatsApp Business number):
- Pre-filled message can include: `I'm interested! ref:meta_{{campaign_id}}_{{adset_id}}_{{ad_id}}`
- Or use a structured ref: `ref:adpilot_meta_{{ad_id}}`

Simpler approach: use a unique `ref` per ad set and maintain a lookup table mapping `ref` → `campaign_id`, `adset_id`, `ad_id`.

**What Meta sends in CTWA API events:**

```json
{
  "entry": [{
    "id": "{{page_id}}",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "{{user_phone_number_hash}}",
          "type": "text",
          "referral": {
            "source_url": "https://fb.com/{{ad_id}}",
            "source_type": "AD",
            "source_id": "{{ad_id}}",
            "headline": "{{ad_headline}}",
            "body": "{{ad_body}}",
            "ctwa_clid": "{{ctwa_click_id}}"
          }
        }]
      }
    }]
  }]
}
```

The `referral.source_id` contains the `ad_id`. The `ctwa_clid` is a unique click ID usable for deduplication.

**Attribution fields from CTWA:**
| Universal Schema Field | Value |
|---|---|
| utm_source | `meta` |
| utm_medium | `ctwa` |
| utm_campaign | Look up from `source_id` (ad_id → campaign lookup) |
| utm_content | `source_id` (ad_id) |
| utm_term | `ctwa_clid` (click ID) |
| ad_id | `referral.source_id` |
| tracking_status | `OK` if referral data present; `UTM_PARTIAL` if only source_id available |

### WhatsApp Business API Setup

1. Business Manager → WhatsApp → WhatsApp Business Account
2. Link a WhatsApp Business number
3. Subscribe to `messages` webhook: `https://{{your-domain}}/webhooks/whatsapp/inbound`
4. Extract `referral.source_id` from each inbound message to attribute to an ad
5. Map `source_id` (ad_id) → campaign_id, adset_id via a lookup call to Meta Graph API:
   ```
   GET https://graph.facebook.com/v21.0/{{ad_id}}?fields=campaign_id,adset_id,name
   Authorization: Bearer {{env.META_ACCESS_TOKEN}}
   ```

### CTWA Lead Capture Flow

```
[User taps CTWA ad]
    → [WhatsApp message arrives at WA Business number]
    → [WhatsApp Business API webhook fires]
    → [Extract: from (user phone), referral.source_id (ad_id), ctwa_clid]
    → [Meta Graph API: look up campaign_id and adset_id from ad_id]
    → [CRM: Create Contact — phone, source=ctwa, ad_id, campaign_id]
    → [Lead Quality tab: Append row — platform=meta, utm_medium=ctwa, ad_id]
    → [Respond in WhatsApp: send initial reply (human or bot)]
```

### Limitations

- Phone number from WhatsApp is available but should be hashed before storing in Sheets (SHA-256)
- If the user has WhatsApp privacy settings that hide their number, only the ctwa_clid is available
- Not all CTWA leads come through the API — some operators use WhatsApp Business App (manual) rather than API; attribution is then manual

---

## Channel 2: Click-to-Messenger (CTM)

### How Messenger Ads Work

1. Ad appears in Meta feed
2. User taps "Send Message" CTA → Messenger opens
3. A JSON-structured welcome message is sent by the Page to the user
4. Conversation proceeds in Messenger

### Attribution Method: m.me Links and `ref` Parameter

Meta Messenger supports `ref` parameters in m.me links and in the Messenger webhook payload:

**m.me link format:**
```
https://m.me/{{page_name}}?ref={{attribution_ref}}
```

Where `{{attribution_ref}}` encodes campaign data:
```
ref=meta_cid{{campaign_id}}_aid{{ad_id}}_asid{{adset_id}}
```

**Messenger webhook payload (messaging_optins or messages):**
```json
{
  "sender": {"id": "{{messenger_psid}}"},
  "recipient": {"id": "{{page_id}}"},
  "timestamp": 1700000000,
  "optin": {
    "ref": "meta_cid{{campaign_id}}_aid{{ad_id}}_asid{{adset_id}}"
  }
}
```

OR for message events with referral:
```json
{
  "sender": {"id": "{{messenger_psid}}"},
  "message": {"text": "Hi"},
  "referral": {
    "ref": "{{ref_string}}",
    "source": "ADS",
    "type": "OPEN_THREAD",
    "ad_id": "{{ad_id}}"
  }
}
```

**Parse attribution from Messenger:**
```python
def parse_messenger_referral(payload):
    referral = payload.get('referral', {})
    ad_id = referral.get('ad_id')
    ref = referral.get('ref', '')
    # Parse structured ref if used
    parts = dict(p.split('_', 1) for p in ref.split('_') if '_' in p)
    return {
        'utm_source': 'meta',
        'utm_medium': 'messenger',
        'ad_id': ad_id or parts.get('aid', ''),
        'campaign_id': parts.get('cid', ''),
        'adset_id': parts.get('asid', ''),
        'utm_content': ad_id,
    }
```

**Attribution fields from Messenger:**
| Universal Schema Field | Value |
|---|---|
| utm_source | `meta` |
| utm_medium | `messenger` |
| utm_campaign | from `cid` in ref string OR API lookup |
| utm_content | `ad_id` |
| ad_id | `referral.ad_id` |

### Facebook Pixel + Messenger

For Messenger ads with a "Continue" flow to a website, the pixel can fire on the landing page. In this hybrid case, UTMs are available and the pixel fires normally — no special handling needed. This plan covers the pure-Messenger (no website) case only.

---

## Channel 3: Phone Call Tracking

### How Call Ads Work

- Meta and TikTok both support "Call Now" CTA ads that display a phone number
- Users call the number directly from the ad
- No digital trail without a call tracking solution

### Attribution Method: Dynamic Number Insertion (DNI)

Use a call tracking provider to assign unique numbers per campaign or ad:

**Recommended providers (AU-compatible):**
- CallRail (US-based, AU numbers available)
- Invoca (enterprise)
- Dialpad
- Local AU options: Delacon (AU-specific), CallTrackingMetrics

**Setup:**
1. Provision a tracking number per ad set (or per campaign if budget is a constraint)
2. Track number → campaign mapping in the Config tab or a separate Lookup tab
3. When call received: call tracker fires webhook with `tracking_number`, `caller_number`, `call_duration`, `call_recording_url` (if enabled)
4. Map tracking number back to campaign/adset/ad via lookup table

**Tracking Number Lookup Table (Sheets or CRM):**
| tracking_number | platform | campaign_id | adset_id | ad_id |
|---|---|---|---|---|
| +61 3 XXXX XXXX | meta | {{campaign_id_A}} | {{adset_id_A}} | — |
| +61 2 XXXX XXXX | tiktok | {{campaign_id_B}} | {{adset_id_B}} | — |

**Call Tracking Webhook Payload (CallRail example):**
```json
{
  "id": "{{call_id}}",
  "answered": true,
  "tracking_phone_number": "+61 3 XXXX XXXX",
  "source": "Paid Search",
  "keywords": null,
  "caller_number": "+61 4XX XXX XXX",
  "call_duration": 187,
  "recording_url": "https://..."
}
```

**Attribution fields from call tracking:**
| Universal Schema Field | Value |
|---|---|
| utm_source | `meta` or `tiktok` (from tracking number lookup) |
| utm_medium | `call` |
| utm_campaign | from tracking number lookup |
| ad_id | from tracking number lookup (if ad-level numbers used) |
| utm_content | tracking_number (display-safe) |

**Lead Capture from Call:**
```
[Call arrives at tracking number]
    → [Call tracking provider fires webhook]
    → [Parse: tracking_number, caller_number, duration]
    → [Lookup: tracking_number → campaign_id, adset_id, platform]
    → [Hash caller_number → phone_hash]
    → [CRM: Create Contact — phone_hash as identifier, source=call, utm fields]
    → [Lead Quality tab: Append row — utm_medium=call, ad_id from lookup]
```

---

## Channel 4: TikTok Messaging Leads

TikTok's equivalent of CTWA is its **Direct Message** lead objective and **TikTok for Business Messages** feature.

### Attribution

TikTok provides a `click_id` parameter (`ttclid`) when users click through to any destination. For DM-based ads:

- TikTok Lead Generation (in-app forms): attribution is automatic via the reporting API (`ad_id` is available in the lead notification webhook)
- TikTok DM ads: Use the TikTok pixel `ttclid` parameter if the user visits a website after messaging; otherwise attribution relies on the TikTok reporting API's conversion events

**Ref parameter equivalent:** TikTok supports ad group-level lead forms with a `form_id` — each ad group can have a unique form, enabling attribution to ad group level even without a ref system.

---

## Universal Schema Mapping Summary

| Lead Source | utm_source | utm_medium | utm_campaign | utm_content | ad_id | tracking_status |
|---|---|---|---|---|---|---|
| Meta Lead Ad (in-app form) | meta | paid_social | campaign name | ad name | ad_id | OK |
| TikTok Lead Gen (in-app form) | tiktok | paid_social | campaign name | ad name | ad_id | OK |
| CTWA (Click-to-WhatsApp) | meta | ctwa | via API lookup | ad_id | source_id | OK |
| Click-to-Messenger | meta | messenger | via ref parse | ad_id | referral.ad_id | OK |
| Call (with tracking number) | meta/tiktok | call | via DNI lookup | tracking_number | via lookup | OK |
| Call (no tracking number) | unknown | call | — | — | — | UTM_MISSING |
| Organic WhatsApp (no ad) | direct | messaging | — | — | — | UTM_MISSING |

If `tracking_status = UTM_MISSING`, flag in daily alerts (ALT-012).

---

## Lead Deduplication Across Channels

A user may interact via multiple channels before being captured as a lead:
1. Sees ad on Facebook → clicks to website → fills out form
2. Sees retargeting ad → clicks CTWA → messages on WhatsApp

These could create two CRM contacts for the same person.

**Deduplication rule:**
- Match by email first, then phone (normalised E.164 format)
- If match found: do NOT create duplicate — update existing contact's UTM fields (add new source to `most_recent_utm_*` fields, preserve first-touch `utm_*` fields)
- If no match: create new contact

**Phone normalisation:**
```python
import re
def normalise_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('0') and len(digits) == 10:
        return '+61' + digits[1:]  # AU mobile/landline
    if digits.startswith('61') and len(digits) == 11:
        return '+' + digits
    return digits
```

---

## Reporting Implications

Once CTWA/Messenger/call leads are attributed, they appear in the universal schema with:
- `platform = meta` (or tiktok)
- `utm_medium = ctwa / messenger / call`

In reports, dana and riley can then:
- Compare CPL across utm_medium (e.g., form leads vs CTWA leads)
- Compute lead quality score separately for each medium (CTWA leads may convert better than form leads for some clients)
- Alert if messaging lead volume drops (may indicate CTWA ad budget paused)
