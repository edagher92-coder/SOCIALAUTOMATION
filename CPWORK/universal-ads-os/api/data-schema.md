# Universal Data Schema — AdPilot OS
**The single source of truth for ads data across Meta + TikTok + CRM + sheets.**
One canonical **row = one ad, one day**. Every importer (CSV, Make/Zapier/n8n,
or direct API) maps into these fields. Dashboards, the health score, and every
agent read from this shape.

Conventions: dates `YYYY-MM-DD`; money in `{{client.currency}}` (AUD default);
rates as decimals unless suffixed `_pct`; IDs are strings (preserve leading
zeros / `act_` prefixes). Computed fields can be derived on import or in the
dashboard — formulas are in `config/universal-defaults.yaml → metrics`.

---

## Field reference

### Identity
| field | type | raw/computed | source | description |
|---|---|---|---|---|
| business_id | string | raw | config | Stable key per business (multi-client safe). |
| business_name | string | raw | config | `{{client.business_name}}`. |
| platform | enum | raw | meta\|tiktok | Ad platform. |
| ad_account_id | string | raw | platform | e.g. `act_…` (Meta) / advertiser_id (TikTok). Never a secret. |
| campaign_id | string | raw | platform | Platform campaign id. |
| campaign_name | string | raw | platform | Should follow the naming standard. |
| adset_id | string | raw | platform | Ad set (Meta) / ad group (TikTok) id. |
| adset_name | string | raw | platform | |
| ad_id | string | raw | platform | |
| ad_name | string | raw | platform | |
| date | date | raw | platform | The day this row covers. |

### Config
| field | type | raw/computed | description |
|---|---|---|---|
| objective | enum | raw | leads\|conversions\|traffic\|awareness\|engagement\|sales\|app. |
| budget_type | enum | raw | daily\|lifetime\|campaign_budget_optimisation. |
| daily_budget | number | raw | In currency (convert from cents on import). |
| lifetime_budget | number | raw | In currency. |

### Delivery
| field | type | raw/computed | formula |
|---|---|---|---|
| spend | number | raw | Amount spent in currency. |
| impressions | int | raw | |
| reach | int | raw | |
| frequency | number | computed | impressions / reach |
| clicks | int | raw | Link clicks preferred; note if "all clicks". |
| ctr | number | computed | clicks / impressions |
| cpc | number | computed | spend / clicks |
| cpm | number | computed | spend / impressions × 1000 |

### Outcomes
| field | type | raw/computed | formula |
|---|---|---|---|
| landing_page_views | int | raw | |
| leads | int | raw | Form/CTWA/lead events. |
| purchases | int | raw | Or primary conversion count. |
| revenue | number | raw | Attributed revenue / conversion value. |
| cost_per_lead | number | computed | spend / leads |
| cost_per_purchase | number | computed | spend / purchases |
| roas | number | computed | revenue / spend |

### Video / creative engagement
| field | type | raw/computed | formula |
|---|---|---|---|
| video_views | int | raw | Platform-defined view. |
| three_second_views | int | raw | Meta 3s / TikTok 2s proxy (note mapping). |
| six_second_views | int | raw | |
| thruplays | int | raw | Meta ThruPlay / TikTok complete views. |
| hook_rate | number | computed | three_second_views / impressions |
| hold_rate | number | computed | thruplays / three_second_views |

### Social
| field | type | raw | description |
|---|---|---|---|
| comments | int | raw | |
| shares | int | raw | |
| saves | int | raw | |

### Quality & profit
| field | type | raw/computed | description |
|---|---|---|---|
| lead_quality_score | number | raw/computed | 0–100 from `lead-quality-analyser` (CRM feedback). |
| sales_count | int | raw | Closed sales tied to this ad (CRM). |
| gross_profit | number | computed | revenue × {{client.gross_margin}} (or actuals). |

### Attribution
| field | type | raw | description |
|---|---|---|---|
| utm_source | string | raw | meta\|tiktok. |
| utm_medium | string | raw | paid_social. |
| utm_campaign | string | raw | Matches naming standard. |
| utm_content | string | raw | creativeangle_format_version. |
| utm_term | string | raw | audience_test. |
| tracking_status | enum | raw/computed | ok\|partial\|broken — gate for scaling. |

### Ops
| field | type | description |
|---|---|---|
| recommendation | enum | keep\|kill\|duplicate\|scale\|reduce\|refresh\|fix-tracking. |
| notes | string | Free text (sales notes, context). |

---

## Derived / account-level metrics (not stored per row)
- **MER** = total_revenue / total_ad_spend (account-wide, all platforms).
- **lead_to_sale_rate** = sales_count / leads.
- **break_even_cpa** = {{client.average_sale_value}} × {{client.gross_margin}}.
- **break_even_roas** = 1 / {{client.gross_margin}}.

## Data quality rules
1. A row with `spend > 0` but no `impressions` → flag `tracking_status: broken`.
2. `leads`/`purchases` with no UTM/tracking → `tracking_status: partial`.
3. Don't judge an ad below the decision floor (≥50 clicks **or** ≥15 conversions).
4. Currency must be normalised to `{{client.currency}}` on import (note FX date).
5. De-duplicate on `(business_id, platform, ad_id, date)`.
