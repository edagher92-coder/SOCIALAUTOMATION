# Snowflow NSW / Slushieco — Business Context Pack

**Owner:** Elie Dagher (always spell "Elie", never "Eli")
**Pack slug:** `snowflow`
**Currency:** AUD | **Market:** NSW, Australia
**Language:** Australian English

---

## What This Pack Is

Business-specific knowledge for the Snowflow / Slushieco accounts. This is kept here,
separate from the universal AdPilot OS core, so the sellable product ships clean.
All account IDs, pixel IDs, tokens, and personal contact details are **placeholders only**
— real values live in the secrets manager and are injected at runtime.

---

## Business Model

Snowflow NSW / Slushieco operates three revenue lines:

| Revenue line | Description |
|---|---|
| Machine repairs & servicing | Slush and snow machine diagnostics, repairs, and preventive maintenance — on-site and workshop |
| Machine sales | New and refurbished/demo slush and snow machines |
| Hire / leasing (Slushieco) | Short-term event hire and longer-term leasing of slush machines |

These lines have different seasonality, margins, and audience profiles. Ad creative and
targeting must be configured per-lane, not blended.

---

## Service-Area Logic

The system must apply these rules to all enquiry routing, ad geo-targeting, and chatbot
responses:

| Service | Coverage |
|---|---|
| Machine hire + on-site repairs/servicing | Sydney + Greater Sydney — 35 LGAs (see LGA list below) |
| Machine **sales** (new + refurbished) | All NSW |
| Phone / remote troubleshooting | Anywhere in Australia |
| On-site repairs **outside** Greater Sydney | Case-by-case; travel surcharge applies — escalate to owner |

### Greater Sydney LGA reference (35 LGAs)

Bayside, Blacktown, Blue Mountains, Burwood, Camden, Campbelltown, Canada Bay,
Canterbury-Bankstown, Cumberland, Fairfield, Georges River, Hawkesbury, Hills Shire,
Hornsby, Hunters Hill, Inner West, Ku-ring-gai, Lane Cove, Liverpool, Mosman,
North Sydney, Northern Beaches, Parramatta, Penrith, Randwick, Ryde, Strathfield,
Sutherland, Sydney (City of Sydney), Waverley, Willoughby, Wollondilly,
Woollahra, Central Coast, Wollongong.

> Ad geo-targeting for hire and on-site service should be set to Greater Sydney only.
> Sales campaigns may target all NSW.

---

## Pricing Rules

These are system rules — quote them accurately in chatbot, ad copy, and lead forms.

| Item | Rule |
|---|---|
| Standard service call-out | **$325 AUD** — includes call-out fee, full diagnostics, 20-minute health check, and service labour |
| Parts | Cost price + **20 %** margin |
| Hire pricing | Always quoted **excluding delivery**. Delivery is calculated by postcode at checkout. Never quote a flat delivery price in ads or copy. |
| Travel surcharge (outside Greater Sydney) | Case-by-case. Do not quote a price — escalate to owner. |

### Escalation rule

Ping the owner (Elie) on any enquiry where the estimated job or order value exceeds **$500 AUD**.
This applies to hire orders, multi-machine sales, and complex repair quotes.

---

## Seasonality

Revenue concentrates in the **pre-summer and summer period** (October – February in NSW).
Off-peak (autumn/winter) is servicing, refurb machine stock build, and hire contract renewals.
Ad spend should be weighted accordingly — ramp from late September, peak October–December,
taper February–March.

---

## Channel Voice Mapping

Each channel has a distinct voice. The system must apply the correct voice per channel.

| Channel | Voice / Style | Key rules |
|---|---|---|
| Google Business Profile | "Tim Reid" — practical-warm | Informative, helpful, local authority. Answer the question directly. No fluff. |
| Email (outbound + sequences) | "Tim Reid" — practical-warm | Conversational, specific, helpful. One idea per email. Plain text preferred. |
| Instagram | Founder-led, real workshop content | Elie on camera or real workshop footage. Authentic over polished. Behind-the-scenes, repairs in progress, machines being tested. |
| TikTok | Founder-led, real workshop content | Same as Instagram. Short, punchy, real. Show the problem and the fix. Hook in first 2 seconds. |
| Facebook organic | Community-first | Local relevance, questions, shares, event hire ideas. Conversation over broadcast. |
| Paid ads — Meta | "King Kong" direct-response | See structure below |

### Meta Paid Ad Structure (King Kong direct-response)

Every ad must follow this sequence:

1. **Hook** — Stop the scroll. Call out the audience or the pain directly.
   Example pattern: "Slush machine won't freeze? Here's why."
2. **Agitate** — Make the problem feel real and costly.
   Example pattern: "A blocked condenser means no product, unhappy customers, lost hire revenue."
3. **Offer** — State the specific offer with price or saving. Be concrete.
   Example pattern: "Our pre-summer service: $325 — call-out, full diagnostics, health check, and service."
4. **Proof** — One number or one real result. Not a vague claim.
   Example pattern: "We've serviced 200+ machines across Sydney this year."
5. **CTA** — Single, clear, low-friction action.
   Example pattern: "Book your machine in — link below."

Always write **3 headline variants** per ad set (test short punchy vs. problem-led vs. offer-led).

---

## Current Ad Lanes

| Lane | Status | Offer | Objective |
|---|---|---|---|
| Pre-summer maintenance plan | Active (primary) | Book a service before the season — $325 all-in | Lead generation / booking |
| Refurb / demo machines — Marketplace | Active (secondary) | Quality second-hand machines, tested and serviced | Conversions / direct message |

---

## Example client-config.yaml (Snowflow — placeholders only)

```yaml
client:
  name: "Snowflow NSW / Slushieco"
  slug: "snowflow"
  currency: "AUD"
  country: "AU"
  timezone: "Australia/Sydney"
  language: "en-AU"

  # IDs injected at runtime from secrets manager. Never hardcode.
  meta_account_id: "{{client.meta_account_id}}"
  meta_pixel_id: "{{client.meta_pixel_id}}"
  meta_app_id: "{{client.meta_app_id}}"
  tiktok_account_id: "{{client.tiktok_account_id}}"
  tiktok_pixel_id: "{{client.tiktok_pixel_id}}"

  contact:
    business_email: "{{client.business_email}}"   # e.g. info@snowflownsw.com.au
    owner_first_name: "Elie"                       # Always "Elie", never "Eli"

business_model:
  types:
    - repairs_and_servicing
    - machine_sales
    - hire_and_leasing
  average_sale_value: 325       # Blended — primary anchor is the service call-out
  gross_margin: 0.60
  escalation_threshold_aud: 500

pricing:
  service_callout_aud: 325      # Call-out + diagnostics + health check + service
  parts_markup_pct: 20
  hire_delivery: "excluded — calculated by postcode at checkout"

service_area:
  hire_and_onsite: "Greater Sydney (35 LGAs)"
  sales: "All NSW"
  remote_support: "Australia-wide"
  outside_greater_sydney_onsite: "Case-by-case with travel surcharge — escalate to owner"

platform_focus:
  - meta
  - tiktok

seasonality:
  peak: "October–February"
  ramp_start: "Late September"
  taper_end: "March"
  off_peak_focus: "Servicing, refurb stock, hire contract renewals"

channel_voice:
  google_business_profile: "tim-reid-practical-warm"
  email: "tim-reid-practical-warm"
  instagram: "founder-led-real-workshop"
  tiktok: "founder-led-real-workshop"
  facebook_organic: "community-first"
  meta_paid: "king-kong-direct-response"

ad_lanes:
  active:
    - slug: "pre-summer-maintenance"
      offer: "Pre-summer service — $325 all-in"
      objective: "lead_generation"
      geo: "Greater Sydney"
      ad_structure: "hook-agitate-offer-proof-cta"
      headline_variants: 3
    - slug: "refurb-demo-machines"
      offer: "Quality refurbished machines — tested and serviced"
      objective: "conversions"
      channel: "Meta Marketplace"
      geo: "All NSW"
```

---

## What to Anonymise Before Resale

Before delivering AdPilot OS to any client other than Snowflow, ensure this entire
`snowflow/` folder is **removed** from the build. Specifically, never ship:

- Business name, owner name, or any identifying details.
- Pricing figures specific to this business ($325 call-out, 20% parts margin).
- The 35-LGA service area list as a Snowflow-specific definition.
- Any ad copy, hooks, or headlines written for this business.
- Any values that could be reverse-engineered to identify the client.

The `universal/` folder and its Example Co reference data is the only business context
that ships with a clean resale build.
