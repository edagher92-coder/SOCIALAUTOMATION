# Universal Context Pack — Example Co

## Purpose

This folder ships with every resale build of AdPilot OS. It exists so the universal
core contains zero private client data. All demos, templates, default prompts, and
onboarding walkthroughs reference **Example Co** — a generic local service business
with no connection to any real entity.

When you deliver AdPilot OS to a client you:
1. Ship the universal core + this folder unchanged.
2. Add a new client-specific folder alongside this one (e.g. `business-context/acme-hvac/`).
3. Point the system at the client pack via `client_context_pack` in the root config.

The folders `snowflow/` and `profit-minute-au/` are **stripped from every resale build**.
They live only in the operator's private repository.

---

## Example Co — Reference Business

| Field | Value |
|---|---|
| Business name | Example Co |
| Business type | Local service — home services / trade |
| Currency | AUD |
| Market | Australia (metro + suburban) |
| Typical offer | Annual maintenance plan, $299 AUD |
| Average sale value | $350 AUD (blended: one-off call-outs + plan sign-ups) |
| Gross margin | 0.55 (55 %) |
| Lifetime customer value (estimated) | $1,050 AUD over 3 years |
| Target CPA ceiling | $70 AUD (20 % of first-year gross margin) |
| Break-even ROAS | 1.82× |

### Audience

- **Primary:** Home owners, 28–55, metro + suburban Australia, household income $80k+.
- **Secondary:** Property managers, small strata, light commercial.
- **Pain:** Seasonal breakdowns, reactive spend when equipment fails.
- **Desire:** Predictable costs, peace of mind, a trusted local trade.

### Platform Focus

Meta (Facebook + Instagram) primary; Google Search retargeting secondary.
TikTok testing phase — short-form how-to + before/after content.

### Brand Voice

Practical, direct, local. Speaks like a trusted tradesperson, not a corporate brand.
No jargon. Plain Australian English. Lead with the problem the customer already feels,
then the specific solution, then proof (a number or a testimonial snippet), then a
clear single CTA.

---

## Example client-config.yaml (placeholders — no real IDs)

```yaml
client:
  name: "Example Co"
  slug: "example-co"
  currency: "AUD"
  country: "AU"
  timezone: "Australia/Sydney"
  language: "en-AU"

  # All account and pixel IDs are injected at deploy time from secrets manager.
  # Never hardcode real IDs in this file.
  meta_account_id: "{{client.meta_account_id}}"
  meta_pixel_id: "{{client.meta_pixel_id}}"
  meta_app_id: "{{client.meta_app_id}}"
  tiktok_account_id: "{{client.tiktok_account_id}}"
  tiktok_pixel_id: "{{client.tiktok_pixel_id}}"

  contact:
    business_email: "{{client.business_email}}"   # e.g. hello@exampleco.com.au
    phone_display: "{{client.phone_display}}"      # e.g. 02 9XXX XXXX

business_model:
  type: "local_service"
  average_sale_value: 350
  gross_margin: 0.55
  ltv_3yr: 1050
  target_cpa_ceiling: 70
  break_even_roas: 1.82

platform_focus:
  - meta
  - google

brand_voice:
  tone: "practical-warm"
  language_rules:
    - "Plain Australian English"
    - "Lead with the customer's problem"
    - "One clear CTA per ad"
    - "No hype words: secret, guaranteed, guru"

ad_lanes:
  active:
    - slug: "maintenance-plan"
      offer: "Annual maintenance plan — $299"
      objective: "lead_generation"
  secondary:
    - slug: "emergency-callout"
      offer: "Same-day call-out from ${{pricing.callout_base}}"
      objective: "conversions"
```

---

## Notes for Operators

- Swap all `{{client.*}}` placeholders with real values via your secrets manager or
  deployment pipeline — never in this file.
- The `example-co` slug is reserved; do not reuse it for a real client.
- If you add a new demo scenario, keep it generic and non-identifiable.
