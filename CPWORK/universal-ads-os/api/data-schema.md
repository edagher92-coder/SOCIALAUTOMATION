# Universal Data Schema — AdPilot OS

**Authoritative reference for all data ingestion, transformation, and reporting.**

One row = one ad per day. Every source (Meta, TikTok, manual CSV, API pull) maps to this schema before analysis. All analytics skills (dana, riley) read from rows conforming to this schema.

---

## Schema Principles

- **Grain:** One row per `ad_id` per `date`. Not campaign-level. Not account-level. Ad level.
- **Platform-agnostic:** Meta and TikTok map to the same columns. Platform-specific quirks are noted per field.
- **Computed vs raw:** Fields marked `computed` are derived from raw fields and must never be imported directly from platform CSVs — calculate in the Sheet or data pipeline. Fields marked `raw` come directly from platform exports or API responses.
- **AUD only:** All monetary values in Australian Dollars. Convert at ingest if the ad account runs in another currency — use the FX rate from the Config tab and note the conversion date in `notes`.
- **Nulls vs zero:** Use `null`/blank for "no data" (e.g., no video — leave video fields blank). Use `0` only when the metric is genuinely zero. Do not substitute `0` for "not applicable".
- **Decimal rates:** Rates (CTR, frequency, hook_rate) stored as decimals (e.g., 0.021 = 2.1%). Never as percentages. Convert at ingest.
- **ID strings:** All IDs (campaign_id, ad_id, etc.) are strings — preserve `act_` prefixes and leading zeros.
- **Composite primary key:** `(business_id, platform, ad_id, date)` — deduplicate on this key at ingest.

---

## Group 1 — Identity

Fields that uniquely identify a row. All required.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `business_id` | string | raw | config | Internal AdPilot OS identifier for this client. Set in Config tab. Not a platform account ID. Stable key for multi-client environments. |
| `business_name` | string | raw | config | Display name of the client business. Value: `{{client.business_name}}`. |
| `platform` | string | raw | derived at ingest | Ad platform. Must be exactly `meta` or `tiktok` (lowercase). No other values accepted. |
| `ad_account_id` | string | raw | meta + tiktok | Platform ad account ID. Meta format: `act_XXXXXXXXX`. TikTok format: numeric advertiser ID string. Reference only — not a secret; do not store raw tokens here. |
| `campaign_id` | string | raw | meta + tiktok | Platform campaign ID. Unique within platform. |
| `campaign_name` | string | raw | meta + tiktok | Campaign name as set in Ads Manager. |
| `adset_id` | string | raw | meta + tiktok | Ad set ID (Meta) or ad group ID (TikTok). TikTok "ad group" = Meta "ad set". |
| `adset_name` | string | raw | meta + tiktok | Ad set/ad group name. |
| `ad_id` | string | raw | meta + tiktok | Ad ID. Most granular platform identifier. Part of the composite primary key. |
| `ad_name` | string | raw | meta + tiktok | Ad name as set in Ads Manager. |
| `date` | date (YYYY-MM-DD) | raw | meta + tiktok | The calendar date this row covers. One row per ad per date. |

---

## Group 2 — Config

Campaign and budget configuration. Change infrequently. Sourced from platform API or entered manually in CSV.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `objective` | string | raw | meta + tiktok | Campaign objective. Normalised values: `lead_gen`, `conversions`, `traffic`, `engagement`, `reach`, `brand_awareness`, `app_installs`, `video_views`, `catalogue_sales`. Map platform-specific values at ingest: Meta `LEAD_GENERATION` → `lead_gen`; TikTok `LEAD_GENERATION` → `lead_gen`. |
| `budget_type` | string | raw | meta + tiktok | Budget cadence. Must be `DAILY` or `LIFETIME`. TikTok also uses `CAMPAIGN_BUDGET` (CBO) — map to `DAILY` or `LIFETIME` based on the actual budget schedule. |
| `daily_budget` | decimal (AUD) | raw | meta + tiktok | Daily budget for this ad set/campaign in AUD. Null if `budget_type = LIFETIME`. Meta API returns budget in cents — divide by 100. TikTok returns in the account currency directly. |
| `lifetime_budget` | decimal (AUD) | raw | meta + tiktok | Lifetime budget in AUD. Null if `budget_type = DAILY`. |

---

## Group 3 — Delivery

How the ad was delivered. All raw from platform.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `spend` | decimal (AUD) | raw | meta + tiktok | Total ad spend for this ad on this date in AUD. Required — never null. |
| `impressions` | integer | raw | meta + tiktok | Total times the ad was displayed. |
| `reach` | integer | raw | meta + tiktok | Unique accounts that saw the ad at least once. Always ≤ impressions. |
| `frequency` | decimal | raw or computed | meta + tiktok | Average number of times each unique person saw the ad. Platforms provide this directly. If not in export, compute as `impressions / reach`. |
| `clicks` | integer | raw | meta + tiktok | Link clicks (Meta: `link_clicks`). TikTok: all click types — note difference in `notes` column when comparing. |
| `ctr` | decimal (0–1) | raw | meta + tiktok | Click-through rate as a decimal fraction (0.021 = 2.1%). **Not a percentage.** Meta API returns as percentage — divide by 100 at ingest. Confirm TikTok format. |
| `cpc` | decimal (AUD) | raw | meta + tiktok | Cost per click in AUD. |
| `cpm` | decimal (AUD) | raw | meta + tiktok | Cost per 1,000 impressions in AUD. |
| `landing_page_views` | integer | raw | meta (partial tiktok) | Number of times the landing page loaded post-click. Always ≤ clicks. Meta: standard field. TikTok: availability varies by account setup. Leave blank if not available. |

---

## Group 4 — Outcomes

Conversion and revenue metrics.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `leads` | integer | raw | meta + tiktok | Number of lead events. Meta Lead Ads: form submissions. TikTok Lead Gen: form submissions. Pixel-tracked leads: `lead` event count from `actions` array. If objective is `LEAD_GENERATION`, maps from `conversion` metric (TikTok). |
| `purchases` | integer | raw | meta + tiktok | Number of purchase/primary conversion events. Meta: from `actions` array, `action_type = purchase`. TikTok: `conversion` metric when objective is purchase-focused. |
| `revenue` | decimal (AUD) | raw | meta + tiktok | Attributed purchase/conversion value in AUD. Meta: from `action_values` array, `action_type = purchase`. TikTok: conversion value field. Zero if no revenue events. |
| `cost_per_lead` | decimal (AUD) | computed | — | `spend / leads`. Null if leads = 0. Also called CPL. Do not import from platform — compute from `spend` and `leads`. |
| `cost_per_purchase` | decimal (AUD) | computed | — | `spend / purchases`. Null if purchases = 0. Also called CPA. Compute from `spend` and `purchases`. |
| `roas` | decimal | computed | — | Return on ad spend: `revenue / spend`. Null if spend = 0 or revenue = 0. Compute from `revenue` and `spend` — do not use platform-reported ROAS (attribution windows may differ). |

**Break-even references (from Config tab — not stored per row):**
- `break_even_cpa = average_sale_value_aud * gross_margin`
- `break_even_roas = 1 / gross_margin`

---

## Group 5 — Video

Video performance metrics. Apply to video ad formats only. Leave blank (null) for static image or carousel ads — do not substitute zero.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `video_views` | integer | raw | meta + tiktok | Total video plays (any duration). Meta: `video_play_actions`. TikTok: `video_play_actions`. |
| `three_second_views` | integer | raw | meta + tiktok | Views lasting at or past the 3-second mark. Meta: 3-second video plays (direct). TikTok: `video_watched_2s` — 2-second proxy; note in `notes` column: `"three_second_views proxied from TikTok video_watched_2s"`. |
| `six_second_views` | integer | raw | tiktok (meta partial) | Views lasting 6 seconds or more. TikTok: `video_watched_6s` (direct). Meta: not a standard field — leave blank unless a custom metric is configured. |
| `thruplays` | integer | raw | meta + tiktok | Complete or near-complete views. Meta: ThruPlays (full video if <15s, or 15s+ view). TikTok: `video_views_p100` (100% completion) — proxy; note in `notes` column: `"thruplays proxied from TikTok video_views_p100"`. |
| `hook_rate` | decimal (0–1) | computed | — | `three_second_views / video_views`. Proportion of viewers who watched past the opening. Benchmark: <0.15 = weak hook; 0.15–0.30 = average; >0.30 = strong. Null if video_views = 0. Do not compare Meta hook_rate with TikTok hook_rate directly (2s vs 3s difference). |
| `hold_rate` | decimal (0–1) | computed | — | `thruplays / three_second_views`. Audience retention after the hook. Null if three_second_views = 0. |

---

## Group 6 — Social

Engagement metrics beyond clicks. Raw from platform.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `comments` | integer | raw | meta + tiktok | Number of comments on the ad post. |
| `shares` | integer | raw | meta + tiktok | Number of times the ad was shared or forwarded. |
| `saves` | integer | raw | meta + tiktok | Meta: post saves (saved to a collection). TikTok: `likes` — TikTok's closest equivalent to saves; note in `notes` column: `"saves field contains TikTok likes count — not a direct equivalent to Meta saves"`. |

---

## Group 7 — Quality

Lead and sales quality fields. Populated by the CRM feedback loop and lead quality feedback loop — not by the ad platform. All null at import; filled in as CRM data arrives over time.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `lead_quality_score` | integer (0–10) | computed | CRM feedback loop | Average quality score for leads attributed to this ad on this date. Scored after CRM outcome is known: 0 = refund/chargeback; 2 = closed lost or no response; 4 = in progress; 7 = closed won; 8–10 = closed won with above-average deal value. Null until CRM outcome is known. Full scoring model: see `automations/lead-quality-feedback-loop.md`. |
| `sales_count` | integer | raw | CRM feedback loop | Number of leads from this ad/date confirmed as closed-won in the CRM. Distinct from `purchases` (which is pixel-tracked — may include returns, may miss offline sales). |
| `gross_profit` | decimal (AUD) | computed | — | `revenue * gross_margin` (gross_margin from Config tab). Represents gross profit from pixel-attributed revenue. Does not include CRM-sourced offline revenue (use the Quality Summary tab for that). |

---

## Group 8 — Attribution

UTM and source tracking fields. Populated from URL parameters, lead form metadata, CTWA ref parameters, or call tracking lookups. See `api/messaging-lead-source-plan.md` for non-URL attribution methods.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `utm_source` | string | raw | landing page / platform | Traffic source. Typically `meta` or `tiktok`. For messaging leads: `meta` with `utm_medium = ctwa` or `messenger`. |
| `utm_medium` | string | raw | landing page / platform | Traffic medium. Examples: `paid_social`, `ctwa`, `messenger`, `call`. |
| `utm_campaign` | string | raw | landing page / platform | Campaign name or ID used in URL parameters. Should match `campaign_name` for URL-driven campaigns. |
| `utm_content` | string | raw | landing page / platform | Ad identifier in URL parameters. Typically `ad_name` or `ad_id`. |
| `utm_term` | string | raw | landing page / platform | Keyword or additional targeting detail. Often blank for paid social. |

**Best practice for URL parameter setup in ads:**
```
utm_source={{publisher_platform}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```
Meta supports dynamic parameter insertion. Set on every ad URL.

---

## Group 9 — Ops

Operational metadata for automation and skills.

| Field | Type | Raw/Computed | Source Platform | Description |
|---|---|---|---|---|
| `tracking_status` | string | computed | derived | Health of conversion tracking for this row. Values: `OK` — tracking functional; `PIXEL_FIRING_ERRORS` — pixel errors detected; `PIXEL_NOT_FOUND` — no pixel data; `EVENT_MISMATCH` — event type mismatch; `UTM_MISSING` — landing page views present but no UTM; `CONVERSION_EVENT_NOT_TRACKING` — spend with zero conversions and no tracking signal; `UNKNOWN` — cannot determine. Default on ingest: `OK`. Updated by validation step. Tracking must be `OK` before scaling any ad. |
| `recommendation` | string | computed | skills (dana/riley) | Auto-generated proposal from the most recent skill run. Values: `keep`, `kill` (proposal to pause), `duplicate` (test variation), `scale` (increase budget — proposal), `reduce` (decrease budget — proposal), `refresh` (new creative — proposal), `fix-tracking`. All are proposals only — `live_edit_block: true` means no self-execution. |
| `notes` | string | raw | operator / automation | Free text. Use for: TikTok proxy disclosures, data quality flags, manual operator annotations, FX conversion notes, attribution source notes. |

---

## Full Field List (ordered as in Raw Data tab)

```
business_id, business_name, platform, ad_account_id, campaign_id, campaign_name,
adset_id, adset_name, ad_id, ad_name, date, objective, budget_type, daily_budget,
lifetime_budget, spend, impressions, reach, frequency, clicks, ctr, cpc, cpm,
landing_page_views, leads, purchases, revenue, cost_per_lead, cost_per_purchase,
roas, video_views, three_second_views, six_second_views, thruplays, hook_rate,
hold_rate, comments, shares, saves, lead_quality_score, sales_count, gross_profit,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, tracking_status,
recommendation, notes
```

Total: 50 columns.

---

## Schema Summary

| Group | Fields | Required | Computed | Key Note |
|---|---|---|---|---|
| Identity | 11 | All required | 0 | Composite PK: business_id + platform + ad_id + date |
| Config | 4 | budget_type required | 0 | daily_budget / lifetime_budget: one may be null |
| Delivery | 9 | spend required | 0 | frequency can be computed if not provided directly |
| Outcomes | 6 | none required | 3 (cpl, cpa, roas) | Null if no conversion events |
| Video | 6 | none required | 2 (hook_rate, hold_rate) | Null for non-video formats; TikTok proxies noted |
| Social | 3 | none required | 0 | TikTok saves = likes proxy |
| Quality | 3 | none required | 2 (lqs, gross_profit) | Filled by CRM feedback loop; null at import |
| Attribution | 5 | none required | 0 | utm_source + utm_medium always populate if possible |
| Ops | 3 | none required | 1 (tracking_status) | tracking_status must be OK before scaling |
| **TOTAL** | **50** | | | |

---

## Computed Field Formulas (Google Sheets)

Apply as per-row formulas in the Raw Data tab. Computed columns should not be pasted from CSVs.

```
cost_per_lead      =IF(leads>0, spend/leads, "")
cost_per_purchase  =IF(purchases>0, spend/purchases, "")
roas               =IF(spend>0, revenue/spend, "")
hook_rate          =IF(video_views>0, three_second_views/video_views, "")
hold_rate          =IF(three_second_views>0, thruplays/three_second_views, "")
gross_profit       =IF(revenue>0, revenue*Config!gross_margin, "")
frequency          =IF(reach>0, impressions/reach, "")
```

---

## Account-Level Derived Metrics (not stored per row)

These are computed in aggregation — Weekly Report tab, Dashboard tab — not in individual Raw Data rows:

| Metric | Formula | Description |
|---|---|---|
| MER | `total_revenue / total_ad_spend` | Media Efficiency Ratio — all platforms combined. Business-level health signal. Break-even MER = `1 / gross_margin`. |
| lead_to_sale_rate | `sales_count / leads` | Proportion of leads that became customers. Requires CRM data. |
| true_cpa | `spend / sales_count` | CPA based on CRM-confirmed sales, not pixel events. More accurate for lead-gen accounts. |
| true_roas | `total_won_revenue / spend` | ROAS based on CRM-confirmed revenue including offline sales. |
| break_even_cpa | `average_sale_value_aud * gross_margin` | Computed from Config tab. The maximum CPA that breaks even on a sale. |
| break_even_roas | `1 / gross_margin` | Computed from Config tab. The minimum ROAS that breaks even. |

---

## Data Quality Rules

1. A row with `spend > 0` but no `impressions` → set `tracking_status = PIXEL_NOT_FOUND`.
2. `leads` or `purchases` present but no UTM data → set `tracking_status = UTM_MISSING`.
3. `ctr > 1` → reject row; CTR was not converted from percentage to decimal at ingest.
4. `spend < 0` or `impressions < 0` → reject row; data integrity error.
5. `budget_type` not in [DAILY, LIFETIME] → flag for manual review.
6. Currency must be AUD before writing. Note FX date in `notes` if conversion applied.
7. Deduplicate on `(business_id, platform, ad_id, date)` — if duplicate detected, keep the row with higher `spend` value and log to Audit Log.
8. Do not draw conclusions on ads below the statistical decision floor: ≥ 50 clicks OR ≥ 15 conversions. Mark lower-volume rows as insufficient data in `notes`.
