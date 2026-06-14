# Daily Alerts Workflow — AdPilot OS Rules Engine

**Purpose:** Define the alerting rules engine that monitors ad account health daily. Alerts only — no automated edits to any live ad. All alerts are READ + NOTIFY only.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — this workflow produces alerts only. No ad account writes occur.
- `use_paused_duplicates_only: true` — if an alert leads to a recommended action, that action is a paused duplicate / proposal only.
- Alerts fire on READ of data. They do not touch live ads, budgets, bids, or creatives.
- No API keys, tokens, or account IDs are present in alert messages — use display-safe labels only.
- Money-moving recommendations in alert text require human typed YES to execute.

---

## Alert Trigger Overview

| Rule ID | Condition | Severity | Channel |
|---|---|---|---|
| ALT-001 | Spend overpace > 20% above daily target | Medium | Email + Slack |
| ALT-002 | Spend underpace > 20% below daily target | Medium | Email + Slack |
| ALT-003 | CPA above break-even CPA | High | Email + Slack + WhatsApp |
| ALT-004 | CPL above break-even CPL | High | Email + Slack + WhatsApp |
| ALT-005 | Frequency ≥ 4 at ad set level | Medium | Email + Slack |
| ALT-006 | CTR drop ≥ 25% from 7-day rolling peak | Medium | Email + Slack |
| ALT-007 | tracking_status ≠ OK | High | Email + Slack + WhatsApp |
| ALT-008 | Zero conversions with spend > AUD 20 | High | Email + Slack + WhatsApp |
| ALT-009 | Frequency ≥ 6 (escalation of ALT-005) | Critical | Email + Slack + WhatsApp |
| ALT-010 | ROAS below break-even ROAS (eComm accounts) | High | Email + Slack |
| ALT-011 | Daily budget 90% exhausted before 18:00 AEST | Medium | Email + Slack |
| ALT-012 | New campaign launched — no UTM parameters detected | Low | Email |
| ALT-013 | MER (total revenue / total ad spend) declining week-on-week | Medium | Email |

---

## Rule Definitions

### ALT-001 — Spend Overpace

- **Condition:** `daily_spend > ({{client.monthly_budget}} / 30) * 1.20`
- **Lookback:** current day to 18:00 AEST (extrapolated if mid-day run)
- **Severity:** Medium
- **Description:** Today's spend is tracking more than 20% above the daily budget target. If not corrected, monthly budget will be exhausted before month-end.
- **Proposal (human must confirm):** Review ad set daily caps. Consider pausing lowest-performing ad sets. Do NOT auto-adjust budgets.

### ALT-002 — Spend Underpace

- **Condition:** `daily_spend < ({{client.monthly_budget}} / 30) * 0.80` AND `daily_spend > 0`
- **Lookback:** current day to 14:00 AEST (mid-day check) or end of day
- **Severity:** Medium
- **Description:** Spend is more than 20% below daily target. Possible causes: payment issue, ad disapproval, audience too small, bid too low.
- **Proposal (human must confirm):** Check Meta/TikTok Ads Manager for disapprovals or billing issues.

### ALT-003 — CPA Above Break-Even

- **Condition:** `cost_per_purchase > break_even_cpa` AND `purchases >= 1`
- `break_even_cpa = average_sale_value_aud * gross_margin`
- **Lookback:** last 3 days rolling (to smooth daily variance)
- **Severity:** High
- **Description:** You are paying more per purchase than the gross profit on a sale. Every purchase is losing money at current cost.
- **Proposal (human must confirm):** Review creative performance, audience targeting, landing page conversion rate. Do NOT auto-pause ads.

### ALT-004 — CPL Above Break-Even

- **Condition:** `cost_per_lead > break_even_cpa` AND `leads >= 3`
- **Lookback:** last 3 days rolling
- **Severity:** High
- **Description:** Cost per lead exceeds the gross profit threshold. Note: only meaningful once lead_quality_score data is available (see lead-quality-feedback-loop.md).

### ALT-005 — High Frequency (Warning)

- **Condition:** `frequency >= 4` at ad set level for any ad set with `spend > 0`
- **Lookback:** 7-day frequency from platform data
- **Severity:** Medium
- **Description:** Average person in this audience has seen the ad 4+ times in 7 days. Creative fatigue and CPM increases are likely.
- **Proposal (human must confirm):** Refresh creative. Do NOT auto-pause or auto-rotate.

### ALT-009 — High Frequency (Critical Escalation)

- **Condition:** `frequency >= 6` at ad set level
- **Severity:** Critical
- **Description:** Frequency ≥ 6 indicates severe audience saturation. CTR and conversion rates typically collapse at this point. Immediate creative refresh or audience expansion required.
- **Escalation:** Fires even if ALT-005 already fired this week.

### ALT-006 — CTR Drop ≥ 25%

- **Condition:** `today_ctr < (7_day_peak_ctr * 0.75)` AND `impressions >= 500`
- **7-day peak CTR:** highest daily CTR recorded in the prior 7 rolling days for this ad
- **Lookback:** today vs 7-day rolling window
- **Severity:** Medium
- **Description:** Click-through rate has dropped 25% or more from this ad's recent peak. Likely cause: audience fatigue, creative wearing out, or a competing ad pulling more attention.
- Note: Require impressions ≥ 500 to avoid false positives on low-volume days.

### ALT-007 — Tracking Status Not OK

- **Condition:** `tracking_status != "OK"` for any row in Raw Data for today
- **Possible values:** `OK`, `PIXEL_FIRING_ERRORS`, `PIXEL_NOT_FOUND`, `EVENT_MISMATCH`, `UTM_MISSING`, `CONVERSION_EVENT_NOT_TRACKING`
- **Severity:** High
- **Description:** Ad tracking is broken or degraded. Any spend without tracking is essentially invisible — CPA and ROAS data cannot be trusted.
- **Note:** tracking_status is populated by the platform API response (`effective_status`, event match quality scores) or inferred from zero events + spend.

### ALT-008 — Zero Conversions on Meaningful Spend

- **Condition:** `spend > 20` AND `leads = 0` AND `purchases = 0`
- **Lookback:** today only
- **Severity:** High
- **Description:** More than AUD 20 has been spent today with zero tracked conversions. May indicate tracking failure, landing page issue, or genuinely poor performance.
- **Action:** Cross-check with ALT-007 (tracking OK?) before attributing to performance.

### ALT-010 — ROAS Below Break-Even (eComm)

- **Condition:** `roas < break_even_roas` AND `revenue > 0`
- `break_even_roas = 1 / gross_margin`
- **Lookback:** last 3 days rolling
- **Severity:** High
- **Description:** Return on ad spend is below the gross margin threshold — ads are generating revenue but not enough to cover costs.
- **Only fires for:** accounts with `objective = CONVERSIONS` or `CATALOGUE_SALES` and confirmed revenue data.

### ALT-011 — Budget Exhausted Before 18:00

- **Condition:** `budget_consumed_pct >= 90` AND `current_hour_aest < 18`
- **Data source:** Read from Meta/TikTok API `daily_budget` vs `spend` fields (API pull only — not available from manual CSV)
- **Severity:** Medium
- **Description:** Ad account will run out of daily budget mid-afternoon, losing evening impression share.

### ALT-012 — Missing UTM Parameters

- **Condition:** `utm_source IS NULL OR utm_campaign IS NULL` AND `landing_page_views > 0`
- **Severity:** Low
- **Description:** A campaign has landing page views but no UTM parameters detected. Attribution in Google Analytics / CRM will be broken.
- **Proposal:** Check campaign URL parameters in Ads Manager.

### ALT-013 — MER Declining Week-on-Week

- **Condition:** `this_week_MER < last_week_MER * 0.90`
- `MER = total_revenue / total_ad_spend` (all platforms combined)
- **Lookback:** 7-day window vs prior 7-day window
- **Severity:** Medium
- **Description:** Media Efficiency Ratio has dropped more than 10% week-on-week. This is the business-level health signal — more relevant than ROAS on individual campaigns.

---

## Threshold Configuration

All thresholds are stored in the **Config tab** of the client's Google Sheet and referenced by automation tools. They are not hardcoded here.

| Config Parameter | Default | Description |
|---|---|---|
| `break_even_cpa` | computed | `average_sale_value_aud * gross_margin` |
| `break_even_roas` | computed | `1 / gross_margin` |
| `monthly_budget` | {{client.monthly_budget}} | AUD |
| `frequency_warning_threshold` | 4 | ALT-005 trigger |
| `frequency_critical_threshold` | 6 | ALT-009 trigger |
| `ctr_drop_pct` | 0.25 | 25% drop triggers ALT-006 |
| `min_impressions_for_ctr_alert` | 500 | Prevent false positives |
| `spend_overpace_pct` | 0.20 | 20% above daily target |
| `zero_conversion_spend_threshold_aud` | 20 | AUD threshold for ALT-008 |
| `mer_decline_pct` | 0.10 | 10% week-on-week decline |

---

## Alert Channels

### Email (Primary — always on)

- Recipient: `{{env.ALERT_EMAIL}}`
- Format: HTML email, plain-text fallback
- Subject pattern: `[AdPilot OS {{SEVERITY}}] {{client.business_name}} — {{rule_id}}: {{short_description}} — {{date}}`
- Sent by: Make.com / Zapier / n8n email module (not from the Google Sheet)

### Slack (Secondary — if configured)

- Channel: `#adpilot-alerts`
- Format: Slack Block Kit message
- Severity badge: 🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low
- One Slack message per alert rule fired (not one per ad row — aggregate first)

### WhatsApp (High/Critical only — if configured)

- Via: Twilio WhatsApp Business API or Meta WhatsApp Business API
- Number: `{{env.WHATSAPP_ALERT_NUMBER}}`
- Message: plain text, under 1600 chars (WhatsApp limit)
- Only for severity = High or Critical

---

## Alert Message Template

```
ADPILOT OS — {{SEVERITY}} ALERT
Client: {{client.business_name}}
Date: {{date}}
Rule: {{rule_id}} — {{rule_name}}

DETAIL:
{{alert_detail_text}}

METRIC VALUES:
  {{metric_name_1}}: {{value_1}} (threshold: {{threshold_1}})
  {{metric_name_2}}: {{value_2}} (threshold: {{threshold_2}})

AFFECTED:
  Platform: {{platform}}
  Campaign: {{campaign_name}} (ID: {{campaign_id}})
  Ad Set: {{adset_name}}
  Ad: {{ad_name}}

RECOMMENDED ACTION (PROPOSAL ONLY — requires human YES to execute):
{{recommendation_text}}

To dismiss this alert: update the Alerts tab in AdPilot OS Sheets.
No changes have been made to any live ad.
```

### Example — ALT-003 (CPA above break-even)

```
ADPILOT OS — HIGH ALERT
Client: Acme Roofing
Date: 2025-06-13
Rule: ALT-003 — CPA Above Break-Even CPA

DETAIL:
Your cost per purchase over the last 3 days exceeds your gross margin break-even.
Every sale at this CPA is resulting in a loss before overhead.

METRIC VALUES:
  Cost Per Purchase (3-day avg): AUD 312.50 (break-even: AUD 245.00)
  Total Spend (3-day): AUD 1,250.00
  Purchases (3-day): 4
  ROAS (3-day): 2.1x (break-even: 2.9x)

AFFECTED:
  Platform: Meta
  Campaign: Roofing — Retargeting — Conversions
  Ad Set: Website Visitors 30d — Aged 35–60
  Ad: Testimonial Video V3

RECOMMENDED ACTION (PROPOSAL ONLY — requires human YES to execute):
1. Review the landing page conversion rate — a drop there increases CPA without changing ad quality.
2. Test a higher-value audience (exclude engaged users, expand to lookalike 2%).
3. Consider refreshing the creative — current ad is 14 days old with frequency 4.2.
All changes must be made as PAUSED duplicates. No live ad may be edited.

No changes have been made to any live ad.
```

---

## Alert Deduplication

- Each alert rule fires once per ad set per day per client.
- If the same rule fires on the same ad set two days in a row, the second alert is flagged as "ESCALATION — recurring".
- After 5 consecutive days of the same rule on the same ad set, severity is auto-escalated by one level.
- Resolved alerts: when the condition clears (e.g. frequency drops below 4), an "ALERT RESOLVED" notification is sent.

---

## Alerts Tab Schema (Google Sheets)

| Column | Description |
|---|---|
| alert_id | UUID |
| timestamp | ISO timestamp of when alert fired |
| business_id | client business ID |
| platform | meta / tiktok |
| rule_id | ALT-001 through ALT-013 |
| severity | Low / Medium / High / Critical |
| campaign_id | |
| adset_id | |
| ad_id | |
| metric_name | which metric triggered |
| metric_value | actual value |
| threshold_value | the rule threshold |
| alert_message | full message text |
| status | open / acknowledged / resolved |
| acknowledged_by | operator name or email |
| acknowledged_at | timestamp |
| notes | free text |

---

## Frequency of Alert Checks

| Run | Time (AEST) | Trigger |
|---|---|---|
| Primary daily check | 08:00 | After WF-1 data pull completes |
| Mid-day budget check | 13:00 | ALT-011 only (budget pace mid-day) |
| End-of-day summary | 20:00 | Aggregate day's alerts; send daily digest if any open |

---

## What Alerts Do NOT Do

- Alerts do NOT pause, edit, or delete any live ad.
- Alerts do NOT change budgets or bids.
- Alerts do NOT send creative to platforms.
- Alerts do NOT approve or reject proposed changes.
- Alerts do NOT trigger payment actions.

All of the above require a human to type YES in an approval step.
