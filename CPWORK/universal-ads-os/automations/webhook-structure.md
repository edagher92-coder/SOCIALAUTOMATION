# Webhook Structure — AdPilot OS

**Purpose:** Define the inbound and outbound webhook design for AdPilot OS: naming conventions, payload structures, retry logic, and security (signing, no secrets in URLs).

---

## Safety Rules (mandatory)

- No API keys, tokens, account IDs, or secrets appear in webhook URLs.
- All webhook endpoints must be HTTPS only. No plain HTTP.
- All inbound webhooks are validated using HMAC-SHA256 signature verification before processing.
- Outbound webhooks do not include raw PII — use hashed identifiers where needed.
- Webhook payloads do not include ad platform write instructions. They carry data and notifications only.
- `live_edit_block: true` — receiving a webhook never triggers an automatic ad platform write.

---

## Webhook Categories

### Inbound Webhooks (AdPilot OS receives)

| Webhook Name | Source | Event | Path |
|---|---|---|---|
| `lead.created` | Meta Lead Ads / TikTok Lead Gen | New lead form submission | `/webhooks/leads/inbound` |
| `lead.status_changed` | CRM | Deal/contact stage changed | `/webhooks/crm/status` |
| `sale.recorded` | CRM / Payment gateway | Deal closed won + value | `/webhooks/crm/sale` |
| `payment.received` | Payment gateway (Stripe, etc.) | Payment confirmed | `/webhooks/payments/received` |

### Outbound Webhooks (AdPilot OS sends)

| Webhook Name | Destination | Event | When Fired |
|---|---|---|---|
| `alert.fired` | Operator Slack / email / WhatsApp | Alert rule triggered | Daily alert engine fires an ALT-xxx rule |
| `report.ready` | Operator email / client portal | Weekly report generated | Monday report generation completes |
| `lead.captured` | CRM (if CRM does not initiate) | Lead logged in Sheets | Fallback if CRM webhook not set up |

---

## Inbound Webhook: `/webhooks/leads/inbound`

**Purpose:** Receive new lead from Meta Lead Ads or TikTok Lead Gen.

**HTTP Method:** POST  
**Content-Type:** application/json  
**Authentication:** HMAC-SHA256 signature (see Security section)

### Meta Lead Ads Payload

Meta sends a GET request first (challenge verification), then POST on new lead.

**Challenge verification (GET):**
```
GET /webhooks/leads/inbound?hub.mode=subscribe&hub.challenge={{CHALLENGE_CODE}}&hub.verify_token={{env.META_VERIFY_TOKEN}}
```
Respond with: `200 OK`, body = `hub.challenge` value

**Lead notification (POST):**
```json
{
  "object": "page",
  "entry": [
    {
      "id": "{{page_id}}",
      "time": 1700000000,
      "changes": [
        {
          "value": {
            "form_id": "{{form_id}}",
            "leadgen_id": "{{lead_id}}",
            "created_time": 1700000000,
            "page_id": "{{page_id}}",
            "adgroup_id": "{{adset_id}}",
            "ad_id": "{{ad_id}}"
          },
          "field": "leadgen"
        }
      ]
    }
  ]
}
```

Note: Meta's lead notification does NOT include field answers. After receiving the `leadgen_id`, call the Meta Leads Retrieval API to get field answers:
```
GET https://graph.facebook.com/v21.0/{{lead_id}}?fields=field_data,ad_id,adgroup_id,campaign_id,form_id,created_time
Headers: Authorization: Bearer {{env.META_ACCESS_TOKEN}}
```

**Security:** Meta includes an `X-Hub-Signature-256` header. Validate:
```python
import hmac, hashlib
expected = 'sha256=' + hmac.new(
    key=META_APP_SECRET.encode(),
    msg=raw_body,
    digestmod=hashlib.sha256
).hexdigest()
assert request.headers['X-Hub-Signature-256'] == expected
```

### TikTok Lead Gen Payload

```json
{
  "advertiser_id": "{{tiktok_account_id}}",
  "form_id": "{{form_id}}",
  "lead_id": "{{lead_id}}",
  "ad_id": "{{ad_id}}",
  "adgroup_id": "{{adgroup_id}}",
  "campaign_id": "{{campaign_id}}",
  "create_time": 1700000000,
  "question_list": [
    { "question_id": "FIRST_NAME", "answer": "Jane" },
    { "question_id": "EMAIL", "answer": "jane@example.com" },
    { "question_id": "PHONE_NUMBER", "answer": "+61400000000" }
  ]
}
```

**Security:** TikTok sends an `X-TikTok-Signature` header. Validate:
```python
import hmac, hashlib
expected = hmac.new(
    key=TIKTOK_APP_SECRET.encode(),
    msg=raw_body,
    digestmod=hashlib.sha256
).hexdigest()
assert request.headers['X-TikTok-Signature'] == expected
```

---

## Inbound Webhook: `/webhooks/crm/status`

**Purpose:** Receive CRM deal stage change notifications.

**HTTP Method:** POST  
**Content-Type:** application/json

### Generic Payload Schema

```json
{
  "event": "lead.status_changed",
  "crm": "hubspot",
  "timestamp": "2025-06-13T10:00:00Z",
  "contact_id": "{{crm_contact_id}}",
  "deal_id": "{{crm_deal_id}}",
  "previous_stage": "proposal_sent",
  "new_stage": "closed_won",
  "deal_value": 2800.00,
  "currency": "AUD",
  "owner_email": "operator@agency.com.au",
  "metadata": {
    "platform_lead_id": "{{meta_lead_id}}",
    "utm_source": "meta",
    "utm_campaign": "Roofing_Retargeting_June"
  }
}
```

**Security:** Shared secret HMAC. Header: `X-AdPilot-Signature: sha256={{signature}}`

---

## Inbound Webhook: `/webhooks/crm/sale`

**Purpose:** Receive confirmed sale/deal closure with revenue value.

**HTTP Method:** POST  
**Content-Type:** application/json

```json
{
  "event": "sale.recorded",
  "crm": "gohighlevel",
  "timestamp": "2025-06-13T14:30:00Z",
  "contact_id": "{{crm_contact_id}}",
  "deal_id": "{{crm_deal_id}}",
  "sale_value_aud": 3500.00,
  "sale_type": "new_customer",
  "payment_method": "invoice",
  "invoice_id": "INV-20250613-001",
  "platform_lead_id": "{{meta_lead_id}}",
  "utm_source": "meta",
  "utm_campaign": "Roofing_Leads_June"
}
```

---

## Inbound Webhook: `/webhooks/payments/received`

**Purpose:** Receive payment confirmation from a payment gateway (Stripe, Square, etc.).

**HTTP Method:** POST

```json
{
  "event": "payment.received",
  "source": "stripe",
  "timestamp": "2025-06-13T14:35:00Z",
  "payment_id": "{{stripe_payment_intent_id}}",
  "amount_aud": 3500.00,
  "currency": "AUD",
  "customer_email_hash": "{{sha256(customer_email)}}",
  "metadata": {
    "crm_deal_id": "{{crm_deal_id}}",
    "utm_campaign": "Roofing_Leads_June"
  }
}
```

Note: Raw email is not included. Only the hashed version. Match to Lead Quality tab by `email_hash`.

---

## Outbound Webhook: `alert.fired`

**Purpose:** AdPilot OS notifies external systems when an alert rule fires.

**Target:** Slack Incoming Webhook URL, email webhook relay, or custom endpoint

**HTTP Method:** POST

```json
{
  "event": "alert.fired",
  "timestamp": "2025-06-13T08:05:00Z",
  "business_id": "{{business_id}}",
  "business_name": "{{client.business_name}}",
  "alert_id": "{{uuid}}",
  "rule_id": "ALT-003",
  "rule_name": "CPA Above Break-Even CPA",
  "severity": "high",
  "platform": "meta",
  "campaign_id": "{{campaign_id}}",
  "campaign_name": "{{campaign_name}}",
  "adset_id": "{{adset_id}}",
  "adset_name": "{{adset_name}}",
  "ad_id": "{{ad_id}}",
  "ad_name": "{{ad_name}}",
  "metric_name": "cost_per_purchase",
  "metric_value": 312.50,
  "threshold_value": 245.00,
  "alert_message": "CPA AUD 312.50 exceeds break-even AUD 245.00 (3-day avg)",
  "proposal": "Review creative and audience. No live changes made.",
  "sheet_link": "https://docs.google.com/spreadsheets/d/..."
}
```

**Security:** Include `X-AdPilot-Signature` header (HMAC-SHA256 of body using shared secret) so the recipient can verify the alert came from AdPilot OS and was not tampered with.

---

## Outbound Webhook: `report.ready`

**Purpose:** Notify operator (and optionally client) when the weekly report has been generated.

```json
{
  "event": "report.ready",
  "timestamp": "2025-06-16T09:15:00Z",
  "business_id": "{{business_id}}",
  "business_name": "{{client.business_name}}",
  "report_id": "{{uuid}}",
  "period": {
    "date_from": "2025-06-09",
    "date_to": "2025-06-15"
  },
  "summary": {
    "spend_aud": 4823.10,
    "leads": 62,
    "cpl_aud": 77.79,
    "purchases": 8,
    "cpa_aud": 602.89,
    "revenue_aud": 22400.00,
    "roas": 4.64,
    "alert_count": 2
  },
  "pdf_url": "https://drive.google.com/...",
  "sheet_url": "https://docs.google.com/spreadsheets/d/..."
}
```

---

## Webhook Naming Conventions

### URL Paths

```
/webhooks/{direction}/{category}/{event}

Examples:
  /webhooks/leads/inbound          -- inbound lead from any platform
  /webhooks/crm/status             -- CRM status change inbound
  /webhooks/crm/sale               -- CRM sale recorded inbound
  /webhooks/payments/received      -- payment gateway inbound
```

Note: Do NOT include client IDs, account IDs, or tokens in the URL path. Use:
- A shared secret in the `X-AdPilot-Signature` header to authenticate
- A `business_id` field in the payload body to identify the client

### Event Names (payload `event` field)

Format: `{entity}.{action}` — lowercase, dot-separated

| Event | Description |
|---|---|
| `lead.created` | New lead received from ad platform |
| `lead.status_changed` | CRM lead/deal stage changed |
| `sale.recorded` | Deal closed with confirmed revenue |
| `payment.received` | Payment gateway confirmed payment |
| `alert.fired` | Alert rule triggered |
| `report.ready` | Weekly report generation complete |

---

## Security

### HMAC-SHA256 Signing (All Webhooks)

Every webhook (inbound and outbound) uses HMAC-SHA256 signing:

**Signing process:**
```python
import hmac, hashlib, json

def sign_payload(body_bytes: bytes, secret: str) -> str:
    sig = hmac.new(
        key=secret.encode('utf-8'),
        msg=body_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    return f'sha256={sig}'

# Outbound: include in header
headers = { 'X-AdPilot-Signature': sign_payload(json.dumps(payload).encode(), WEBHOOK_SECRET) }

# Inbound: validate
def verify_signature(raw_body: bytes, header_sig: str, secret: str) -> bool:
    expected = sign_payload(raw_body, secret)
    return hmac.compare_digest(expected, header_sig)
```

**Important:**
- Use `hmac.compare_digest` (constant-time comparison) — never `==` for security-sensitive comparisons
- The signing secret is stored as an environment variable (`WEBHOOK_SECRET`) — never in code, never in URLs
- Each client gets a unique `WEBHOOK_SECRET` — secrets are not shared across clients
- Rotate secrets quarterly or immediately if a breach is suspected

### No Secrets in URLs

Rule: Webhook URLs must never contain API keys, tokens, account IDs, or secrets.

```
WRONG:  https://hooks.adpilot.io/leads/inbound?api_key=abc123
RIGHT:  https://hooks.adpilot.io/webhooks/leads/inbound
        Header: X-AdPilot-Signature: sha256=...
```

### HTTPS Only

- All webhook endpoints must be TLS (HTTPS). No plain HTTP.
- SSL certificates must be valid and up to date.
- If self-hosting n8n, use Nginx/Caddy with Let's Encrypt certificates.

### IP Allowlisting (Optional but Recommended)

For inbound webhooks from known sources, allowlist source IPs:
- Meta webhook IPs: published by Meta in their developer documentation
- TikTok webhook IPs: published in TikTok developer documentation
- CRM webhook IPs: from CRM provider documentation

---

## Retry and Reliability

### Inbound Webhook Retry Handling

AdPilot OS must respond to inbound webhooks within 5 seconds. If processing takes longer:
1. Respond `202 Accepted` immediately
2. Process the payload asynchronously (queue-based)
3. Platform (Meta/TikTok) will retry on non-200 responses: typically 3–5 retries over 24 hours

**Idempotency:** Use `lead_id` or `event_id` as a deduplication key. If the same event arrives twice (due to retries), do not create a duplicate Lead Quality row. Check for existing row before inserting.

```python
def is_duplicate(lead_id: str) -> bool:
    # Check Lead Quality tab for existing row with this lead_id
    existing = sheets.lookup(worksheet='Lead Quality', column='lead_id', value=lead_id)
    return existing is not None
```

### Outbound Webhook Retry

When AdPilot OS sends an outbound webhook (e.g., alert.fired):
- Retry on 4xx/5xx responses: up to 3 attempts
- Backoff: 30 seconds, 2 minutes, 10 minutes
- After 3 failures: log to Audit Log as `webhook_delivery_failed`, continue with email fallback
- Do NOT retry on 410 Gone (endpoint removed)

### Payload Size Limits

- Maximum inbound payload: 10 MB
- Maximum outbound payload: 1 MB (keep report.ready `summary` lean — link to full report, do not embed it)
- For large datasets, send a reference (sheet_url, pdf_url) not the data itself

---

## Webhook Registration and Management

### Registering Meta Webhook

1. Meta App Dashboard → Webhooks
2. Subscribe to `leadgen` object, `leadgen` field
3. Callback URL: `https://{{your-domain}}/webhooks/leads/inbound`
4. Verify token: `{{env.META_VERIFY_TOKEN}}` (stored in env, not hardcoded)
5. Confirm subscription by responding to GET challenge

### Registering TikTok Lead Webhook

1. TikTok Ads Manager → Tools → Lead Generation → Webhook Settings
2. Enter URL: `https://{{your-domain}}/webhooks/leads/inbound`
3. TikTok does not use a challenge-response — it starts sending immediately

### CRM Webhook Registration

- **HubSpot:** Settings → Integrations → Private Apps → Webhooks tab → Subscribe to `deal.propertyChange` (dealstage)
- **Pipedrive:** Settings → Webhooks → Add Webhook → event=`updated`, object=`deal`
- **GoHighLevel:** Automation → Workflows → Add Trigger → Opportunity Stage Change → Webhook Action

---

## Webhook Log (Audit Tab)

Every webhook received or sent is logged to the `Audit Log` tab:

| Column | Description |
|---|---|
| timestamp | ISO timestamp |
| direction | inbound / outbound |
| event | e.g. lead.created |
| source | meta / tiktok / hubspot / adpilot |
| payload_id | lead_id / alert_id / report_id |
| status | received / processed / failed / duplicate |
| http_status | 200 / 202 / 400 / 500 |
| retry_count | 0–3 |
| notes | error message if failed |
