# Config Guide — `client-config.yaml`

Fill this once per business and the whole system adapts. Plain-English, field by
field, with examples by business type. Target: a non-technical owner completes it in
under 5 minutes. (The `universal-business-onboarding` skill can interview you and
fill it for you.)

> **Never put API keys, tokens, or real ad-account IDs in a shared copy.** Leave
> `meta_account_id` / `tiktok_account_id` blank unless this is your own private copy.
> Secrets go in env vars / a git-ignored file (see `SECURITY.md`).

---

## Field-by-field

| Field | What it means | Example | If unsure |
|---|---|---|---|
| `business_name` | Your trading name | "Apex Plumbing Co" | use your brand name |
| `brand_type` | The model that fits best | `local_service`, `ecommerce`, `b2b_lead_gen`, `franchise_multi_location`, `agency`, `content_brand` | pick the closest |
| `industry` | Plain industry label | "Home services" | broad is fine |
| `location` | Primary market | "Brisbane, QLD, AU" | your main city/region |
| `currency` | Reporting currency (ISO) | `AUD` | default AUD |
| `service_area` | Where you actually serve | "Greater Brisbane" | leave blank for ecommerce |
| `main_offer` | The thing the ads sell | "$0 hot-water quote" | your hero offer |
| `average_sale_value` | Avg revenue per sale | `1800` | a sensible average |
| `gross_margin` | Profit fraction (0–1) | `0.55` | gross profit ÷ revenue |
| `target_audience` | Who you want | "Homeowners 35–60" | one clear segment |
| `primary_goal` | Main objective | `leads`, `purchases`, `calls`, `bookings`, `messages` | what a "win" is |
| `platform_focus` | Platforms in use | `[meta, tiktok]` | one or both |
| `monthly_budget` | Ad spend per month | `3000` | total across platforms |
| `meta_account_id` | Meta ad account | leave **blank** in shared copies | private copy only |
| `tiktok_account_id` | TikTok advertiser id | leave **blank** in shared copies | private copy only |
| `conversion_events` | Events that count | `[Lead, Purchase]` | your tracked events |
| `landing_pages` | URL + purpose | offer page | your main page |
| `crm` | Where leads land | HubSpot / Pipedrive / GoHighLevel / Sheets / none | "none" is OK |
| `lead_sources` | How leads arrive | `[meta_lead_form, website_form, phone_call]` | list the real ones |
| `reporting_frequency` | Report cadence | `weekly` | weekly is a good default |
| `brand_voice` | How copy should sound | "Plain, numbers-first, no hype" | keep it honest |
| `compliance_notes` | Claims to avoid | "No results guarantees" | your industry's rules |
| `qualification_rules` | What makes a good lead | "in service area; budget-qualified" | helps lead scoring |
| `approval_required` | You sign off changes | `true` | keep `true` |
| `risk_tolerance` | Appetite | `low` / `medium` / `high` | `low` to start |

## The numbers that drive every decision
- **break-even CPA** = `average_sale_value × gross_margin` (most you can pay per sale).
- **break-even ROAS** = `1 ÷ gross_margin` (minimum ROAS to profit).
Get `average_sale_value` and `gross_margin` right — they decide keep/kill/scale.

## Examples by business type
- **Local service (plumber):** brand_type `local_service`, avg_sale 1800, margin 0.55,
  primary_goal `leads`, lead_sources include `phone_call`, service_area set.
- **Ecommerce:** brand_type `ecommerce`, avg_sale = AOV (e.g. 85), margin 0.45,
  primary_goal `purchases`, no service_area, lead_quality may be N/A.
- **B2B lead-gen:** brand_type `b2b_lead_gen`, avg_sale = deal value, longer
  lead-to-sale, qualification_rules important.
- **Agency:** one `client-config.yaml` per client (see white-label offer).

## Safety switches (leave ON)
`live_edit_block: true`, `use_paused_duplicates_only: true`,
`never_delete_archive_instead: true`, `confirm_before_money_moves: true`,
`scale_requires_clean_tracking: true`. Client configs may tighten, never loosen these.
