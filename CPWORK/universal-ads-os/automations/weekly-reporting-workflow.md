# Weekly Reporting Workflow — AdPilot OS

**Purpose:** Automate the end-to-end weekly report: schedule, data aggregation, skill execution (dana → riley), output to Sheets / PDF / email, and white-label delivery.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — the weekly report workflow reads and presents data only. No ad platform writes occur.
- `use_paused_duplicates_only: true` — any action items in the report are proposals only. No automated execution.
- No API keys, tokens, or account IDs appear in the report output. Use display-safe client config labels.
- Report output may be shared with the client (white-labelled). Ensure no internal system details, raw API responses, or operator cost data appear in the client-facing version.
- Money-moving recommendations require human typed YES — they do not self-execute.

---

## Schedule

| Run | Day | Time (AEST) | Coverage |
|---|---|---|---|
| Standard weekly report | Monday | 09:00 | Mon–Sun prior week (7 days) |
| Month-end report | 1st of month | 10:00 | Full prior month |
| Ad-hoc report | On demand | Operator triggers | Custom date range |

The weekly report covers the 7-day period Monday to Sunday (the prior week). Data window: `date_from = last Monday`, `date_to = last Sunday`.

---

## Data Window and Aggregation

### Source

All data is read from the **Raw Data** tab of the client's Google Sheet. This tab contains one row per ad per day (universal schema).

### Aggregation Levels

The report produces aggregates at four levels:

1. **Account level** — all platforms, all campaigns, all ads combined
2. **Platform level** — Meta vs TikTok comparison
3. **Campaign level** — performance per campaign
4. **Ad level** — top 5 and bottom 5 ads by key metric (ROAS for eComm, CPL for lead gen)

### Key Metrics to Include

| Metric | Formula | Format |
|---|---|---|
| Total Spend | SUM(spend) | AUD |
| Spend vs Monthly Budget % | spend / (monthly_budget / 4) | % |
| Leads | SUM(leads) | count |
| CPL | spend / leads | AUD |
| CPL vs Break-Even | cpl / break_even_cpa | ratio |
| Purchases | SUM(purchases) | count |
| CPA | spend / purchases | AUD |
| CPA vs Break-Even | cpa / break_even_cpa | ratio |
| Revenue | SUM(revenue) | AUD |
| ROAS | revenue / spend | x |
| Break-Even ROAS | 1 / gross_margin | x |
| MER | total_revenue / total_spend | x |
| Impressions | SUM(impressions) | count |
| CPM | spend / impressions * 1000 | AUD |
| Clicks | SUM(clicks) | count |
| CTR | clicks / impressions | % |
| CPC | spend / clicks | AUD |
| Average Frequency | AVG(frequency, weighted by impressions) | number |
| Hook Rate | SUM(three_second_views) / SUM(video_views) | % |
| Hold Rate | SUM(thruplays) / SUM(three_second_views) | % |
| Lead Quality Score (avg) | AVG(lead_quality_score) where not null | 0–10 |

### Week-on-Week Comparison

For every metric, compute:
- `prior_week_value` — same metric for the preceding 7-day window
- `wow_change` — `(this_week - prior_week) / prior_week * 100`
- `wow_direction` — UP / DOWN / FLAT (< 2% change)

Highlight: ROAS UP, CPL DOWN = positive. ROAS DOWN, CPL UP = negative.

---

## Workflow Steps

### Step 1 — Trigger

- **Automated:** Schedule trigger (Monday 09:00 AEST) in Make.com / n8n / Zapier
- **Manual:** Operator triggers from Skills Menu in Google Sheets or via CLI

### Step 2 — Read Raw Data (This Week + Prior Week)

- Source: `Raw Data` tab, filtered by `date >= date_from AND date <= date_to`
- Also read prior week: `date >= date_from - 7 AND date <= date_to - 7`
- Method: Google Sheets API read (read-only service account)

### Step 3 — Run dana Skill

**dana** performs quantitative analysis:
- Spend pacing vs monthly budget
- CPL / CPA vs break-even thresholds
- Frequency flags (≥4 warning, ≥6 critical)
- CTR trends (rolling 7-day, drop detection)
- Hook rate and hold rate benchmarks (hook_rate < 0.15 = low, hook_rate > 0.30 = strong)
- Tracking status review
- Week-on-week deltas for every metric

dana output format: structured JSON with `findings` array, each finding having `severity`, `metric`, `value`, `threshold`, `recommendation`.

### Step 4 — Run riley Skill

**riley** receives dana's findings and the raw aggregates and produces the narrative report:

- Synthesises dana's findings into plain-English commentary
- Numbers-first: every claim is backed by a specific metric value
- Anti-hype: does not use phrases like "amazing results" or "crushing it"
- Australian English, AUD, 2 decimal places
- Structures output as: Executive Summary → Platform Comparison → Campaign Highlights → Creative Performance → Alert Summary → Proposed Actions
- All proposed actions are marked `[PROPOSAL — requires human YES]`
- Tone: analytical, direct, no fluff

riley output: markdown document + JSON structured proposals

### Step 5 — Write to Weekly Report Tab

- Clear previous weekly report content (keep header)
- Write riley's narrative output to the `Weekly Report` tab
- Write dana's structured findings to rows below the narrative (for audit)
- Append to `Audit Log`: `[timestamp, "weekly_report", week_ending, operator_email]`

### Step 6 — Generate PDF

#### Method A: Google Sheets Export (preferred)

```
GET https://docs.google.com/spreadsheets/d/{{SHEET_ID}}/export
  ?format=pdf
  &gid={{WEEKLY_REPORT_TAB_GID}}
  &size=A4
  &portrait=true
  &fitw=true
  &sheetnames=false
  &printtitle=false
  &pagenumbers=false
  &gridlines=false
  &fzr=false
```
- Requires Google OAuth with `drive.readonly` scope
- Returns PDF binary

#### Method B: HTML → PDF (if Sheets export insufficient)

- Build HTML report template from riley's markdown output
- Use a PDF generation service (e.g., Puppeteer via n8n Code node, or a lightweight HTML-to-PDF API)
- Apply white-label header/footer (see White-Label section below)

### Step 7 — Email Report

**To:** `{{env.ALERT_EMAIL}}` (operator)
**CC (optional):** `{{env.CLIENT_EMAIL}}` (if report sharing is enabled for this client)
**Subject:** `{{client.business_name}} — Weekly Ads Report — w/e {{date_to_display}}`
**Body:**

```
Hi {{operator_name}},

AdPilot OS has generated the weekly ads performance report for {{client.business_name}}.

QUICK SUMMARY — Week ending {{date_to_display}}

  Total Spend:    AUD {{spend}}
  Total Leads:    {{leads}} (CPL: AUD {{cpl}})
  Total Revenue:  AUD {{revenue}} (ROAS: {{roas}}x)
  vs Break-Even:  {{cpa_vs_breakeven}}

{{alert_count}} alert(s) require attention this week. See attached report.

The full report is attached as PDF and available in Google Sheets:
{{sheet_link}}

All action items in the report are proposals only. No changes have been
made to any live ad account. Review and confirm before acting.

This report was generated by AdPilot OS.
```

**Attachment:** PDF from Step 6

---

## White-Label Configuration

The client-facing report uses the operator's brand, not AdPilot OS branding.

### White-Label Header (PDF / Email)

```
BUSINESS NAME:   {{operator.agency_name}}
REPORT FOR:      {{client.business_name}}
PERIOD:          {{date_from_display}} to {{date_to_display}}
PREPARED BY:     {{operator.agency_name}} — Paid Media Team
CONFIDENTIAL:    This report is prepared exclusively for {{client.business_name}}
```

### White-Label Settings (Config Tab)

| Parameter | Value |
|---|---|
| agency_name | Operator's agency name |
| agency_logo_url | URL to agency logo (not a secret) |
| report_footer_text | Operator's disclaimer text |
| include_adpilot_branding | false (reseller mode) |
| client_facing_report | true/false |

When `client_facing_report = true`:
- Remove all internal metric thresholds from visible output
- Remove operator cost / margin references
- Include only client-relevant KPIs and recommendations
- Replace "dana" and "riley" internal skill names with "Analysis Engine" and "Report"

---

## Report Structure (riley Output)

### Section 1 — Executive Summary (1 page)

- Week's spend vs budget
- Top 3 wins (highest ROAS campaigns, best CPL ads)
- Top 3 concerns (alerts from ALT rules)
- Net assessment: on track / needs attention / urgent action required

### Section 2 — Platform Comparison

| Metric | Meta | TikTok | Combined |
|---|---|---|---|
| Spend AUD | | | |
| Leads | | | |
| CPL AUD | | | |
| Purchases | | | |
| CPA AUD | | | |
| Revenue AUD | | | |
| ROAS | | | |

### Section 3 — Campaign Performance

Table: all campaigns with spend, leads/purchases, CPL/CPA, ROAS, frequency, wow_change.

Highlight: best campaign (green), worst campaign (red), break-even status for each.

### Section 4 — Creative Performance

Top 5 ads by ROAS (eComm) or CPL (lead gen):
- Ad name, campaign, spend, metric value, hook_rate, hold_rate, frequency, wow_change

Bottom 5 ads (same structure):
- Flag: recommend pausing (as proposal) if below break-even AND frequency ≥ 4

### Section 5 — Alert Summary

List all alerts fired this week (from Alerts tab):
- Rule ID, severity, campaign/ad, detail, status

### Section 6 — Proposed Actions

Each action follows this format:
```
ACTION {{n}} [PROPOSAL — requires human YES]
Type: Creative Refresh / Audience Test / Budget Reallocation / Tracking Fix / etc.
Campaign: {{campaign_name}}
Ad Set: {{adset_name}}
Rationale: {{data-backed reason}}
Proposed Change: {{specific change description}}
Expected Outcome: {{expected metric improvement}}
Priority: High / Medium / Low
```

No action self-executes. Operator reviews, selects YES actions, and implements manually or via the approver workflow (paused duplicate only).

---

## Data Quality Checks Before Report Generation

The workflow checks these before generating the report:

1. Raw Data has rows for all 7 days in the window — alert if any date is missing
2. `tracking_status = OK` for at least 80% of rows — warn if below (report may understate conversions)
3. Total spend > AUD 0 — if no spend for the week, generate an "inactive" report note
4. Platform coverage: at least one Meta AND one TikTok row (if client runs both) — warn if missing
5. Lead quality data completeness: what % of leads have lead_quality_score filled in

Quality check summary is included in the report's Appendix.

---

## Month-End Addendum

On the 1st of each month, a month-end supplement is added to the standard report:

- Full month totals for all KPIs
- Month vs previous month comparison
- Budget consumed vs monthly budget ({{client.monthly_budget}})
- MER for the month
- Lead quality summary: avg score, % leads won, avg sale value from CRM data
- Top 3 campaigns by monthly ROAS / CPL
- Creative fatigue summary: any ad with frequency > 4 for 14+ consecutive days

---

## Archiving

- Weekly reports are stored in the `Weekly Report` tab (current week) and archived to Google Drive in a folder: `AdPilot OS / Reports / {{client.business_name}} / {{YYYY}}`
- PDF naming convention: `AdPilotOS_WeeklyReport_{{client.business_name}}_{{date_to_YYYYMMDD}}.pdf`
- Retention: keep all reports, never delete
- Drive folder access: operator only, unless explicitly shared with client
