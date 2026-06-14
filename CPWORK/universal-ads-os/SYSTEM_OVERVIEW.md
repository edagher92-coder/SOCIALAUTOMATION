# SYSTEM_OVERVIEW.md — AdPilot OS

How the whole system fits together: architecture, data flow, the modules, the
health score, the decision rules, and the universal schema.

---

## 1. Architecture at a glance
```
                    ┌─────────────────────────────────────────┐
USER  ──intent──▶   │  start-ads-command-centre  (ROUTER)      │
                    │  reads config + universal-defaults        │
                    │  blocks unsafe edits · plans · summarises │
                    └───────────────┬───────────────────────────┘
        ┌───────────────┬───────────┼───────────────┬───────────────┐
        ▼               ▼           ▼               ▼               ▼
   mira (Meta)   travis (TikTok)  dana (data)   stella (creative)  titan (funnel)
        │               │           │               │               │
        └──────┬────────┴─────┬─────┴───────┬───────┴───────┬───────┘
               ▼              ▼             ▼               ▼
        atlas (tracking)  milo (automation)  riley (reports)  paige (policy GATE)
                                   │
                          piper (productise) · quinn (QA)
```
Everything reads `config/client-config.yaml` + `config/universal-defaults.yaml`
first. **paige** gates any creative/edit proposal. The router owns the final
summary back to the user.

## 2. Data flow
```
SOURCES                 INGEST                ENGINE                  OUTPUT
Meta export ┐
TikTok export ├─▶ universal data schema ─▶ dana: metrics + rules ─▶ health score
CRM / Sheets │        (api/data-schema.md)     break-even, MER,       (0–100)
Call logs    │                                  keep/kill/scale         │
WhatsApp/DM ─┘                                                          ▼
                                                          riley: reports + dashboards
```
- **V1 (no-code):** sources arrive as **CSV uploads** → manual map to schema.
- **V2 (low-code):** Make/Zapier/n8n push exports into Sheets on a schedule.
- **V3 (API):** Meta + TikTok APIs pull directly (see `api/`).

## 3. The core modules
1. **Business onboarding** — capture business, economics, sources, goals, risk →
   writes `client-config.yaml`. (`templates/business-onboarding-form.md`)
2. **Campaign audit** — structured review of objective→naming→budget→audience→
   placements→creative→copy→CTA→URL→UTM→pixel→metrics→recommendation.
   (`templates/meta-ads-audit-template.md`, `tiktok-ads-audit-template.md`)
3. **Daily tracking** — one row per ad per day on the universal schema.
   (`templates/daily-performance-tracker.csv`)
4. **Campaign health score** — weighted 0–100 (see §4).
5. **Decision rules** — the if/then engine (see §5).

## 4. Campaign Health Score (0–100)
Weighted factors (weights in `config/universal-defaults.yaml → health_score_weights`):
tracking quality (15), CPA (15), spend efficiency (12), conversion rate (10),
CTR (8), lead quality (8), creative freshness (8), CPC (7), naming (5), offer
strength (5), landing-page alignment (4), budget pacing (2), data confidence (1).

**Output format (always):**
```
Campaign Health Score: __ / 100
Status: Green (80–100) / Yellow (60–79) / Orange (40–59) / Red (0–39)
Main issue:
Recommended action:
Next test:
Risk:
```

## 5. Decision rules (the engine)
- High spend + low conversions → **check tracking first** (don't touch budget).
- Low CTR → fix **hook / visual / headline / audience-message fit**.
- High CPC → inspect **CPM, audience size, competition, relevance**.
- CPL fine but sales poor → **lead quality, qualification, follow-up, offer fit**.
- High frequency + falling CTR → **refresh creative or broaden audience**.
- One creative winning → make **3–5 variations of the same angle**.
- Tracking unclear → **do not scale**.
- Change needed → **paused duplicate / draft only** (never edit the live ad).
Full thresholds in `universal-defaults.yaml → thresholds`.

## 6. Universal data schema (summary)
One canonical row per ad per day. Full field list + types: `api/data-schema.md`.
Identity (`business_id`, `platform`, `*_id`/`*_name` for campaign/adset/ad) ·
config (`objective`, `budget_type`, budgets) · delivery (`spend`, `impressions`,
`reach`, `frequency`, `clicks`, `ctr`, `cpc`, `cpm`) · outcomes
(`landing_page_views`, `leads`, `purchases`, `revenue`, `cost_per_lead`,
`cost_per_purchase`, `roas`) · video (`video_views`, `three_second_views`,
`six_second_views`, `thruplays`, `hook_rate`, `hold_rate`) · social (`comments`,
`shares`, `saves`) · quality (`lead_quality_score`, `sales_count`,
`gross_profit`) · attribution (`utm_*`, `tracking_status`) · ops
(`recommendation`, `notes`).

## 7. Naming & UTM standards
Defined once in `universal-defaults.yaml` and enforced by the `utm-naming-builder`
skill. Campaigns/ad sets/ads/creatives/tests/reports/landing pages all have a
fixed pattern so data joins cleanly across platforms.

## 8. Safety model
See `SECURITY.md` and `AGENTS.md §1`. The system **proposes**; humans **approve**;
nothing touches a live spending ad.
