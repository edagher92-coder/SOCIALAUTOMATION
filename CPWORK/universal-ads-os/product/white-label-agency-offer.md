# AdPilot OS — Agency White-Label Offer
### Complete Guide for Agencies Reselling AdPilot OS Under Their Own Brand

---

**Executive Summary**

AdPilot OS is a universal paid-ads operating system built for Meta and TikTok campaigns. It ships with 12 AI agents, 25 skills, a full template library, Google Sheets dashboards, and V2 automation blueprints. The Agency White-Label tier gives you the complete system, the rights to put your brand on everything, and the infrastructure to run multiple clients from a single shared toolset. At $1,997–$4,997 AUD (one-time or annual), a single client paying $800/month covers the cost in less than three months — and most agencies are running six or more clients within 60 days of setup. This document tells you exactly what you receive, how to rebrand it, how to structure your client folders, what to charge, and what your margins look like at scale.

---

## Table of Contents

1. [What Agencies Get — Complete List](#1-what-agencies-get--complete-list)
2. [How to Rebrand](#2-how-to-rebrand)
3. [Multi-Client Setup](#3-multi-client-setup)
4. [Branded Reports](#4-branded-reports)
5. [Pricing to Their Clients — Suggested Retail Margins](#5-pricing-to-their-clients--suggested-retail-margins)
6. [Margin Analysis](#6-margin-analysis)
7. [Sales Support — What We Provide](#7-sales-support--what-we-provide)
8. [Agency Partner Onboarding Plan](#8-agency-partner-onboarding-plan)
9. [Agency Agreement Summary](#9-agency-agreement-summary)

---

## 1. What Agencies Get — Complete List

### 1.1 The 12 AI Agents

Every agent ships as a Markdown prompt file in `agents/`. You receive all 12, fully documented, ready to run in Claude with a client config loaded.

| Agent file | Role | What it does |
|---|---|---|
| `agents/start-ads-command-centre.md` | Router / Orchestrator | Reads the active client config and routes tasks to the correct specialist agent. The entry point for every session. |
| `agents/mira.md` | Meta Specialist | Campaign strategy, audience research, creative guidance, and optimisation recommendations for Meta (Facebook + Instagram). |
| `agents/travis.md` | TikTok Specialist | TikTok-native strategy, creative hooks, bidding logic, and audience recommendations for TikTok Ads Manager. |
| `agents/dana.md` | Data Analyst | Interprets raw performance data, calculates derived metrics (ROAS, CPA, CPL, CTR, hook rate, etc.), and surfaces anomalies. |
| `agents/stella.md` | Creative Strategist | Generates creative briefs, headlines, primary text variations, hooks, CTAs, and the creative matrix. |
| `agents/titan.md` | Funnel Architect | Maps full-funnel structure (TOFU/MOFU/BOFU), recommends landing page adjustments, and connects ad intent to conversion logic. |
| `agents/milo.md` | Automation Architect | Designs and documents Make, Zapier, and n8n workflows. Translates manual processes into automation blueprints. |
| `agents/atlas.md` | Tracking Specialist | UTM structure, pixel health, conversion event mapping, data layer guidance, and attribution analysis. |
| `agents/riley.md` | Reporting Agent | Produces structured performance reports from CSV or pasted data. Outputs Markdown that maps to report templates. |
| `agents/paige.md` | Policy & Safety Agent | Reviews ads and audiences against Meta and TikTok policies. Flags compliance risks before campaigns go live. |
| `agents/piper.md` | Productisation Agent | Packages the system for delivery — onboarding docs, SOP generation, capability statements, proposal copy. |
| `agents/quinn.md` | QA Agent | Cross-checks agent outputs for consistency, catches data errors, validates UTM strings, and verifies config completeness. |

### 1.2 The 25 Skills

Skills live in `skills/`, one folder per skill, each containing a `SKILL.md` file with the full prompt, required inputs, expected outputs, and example usage. They are organised into six functional groups.

**Group 1 — Campaign Analysis (5 skills)**

- `skills/campaign-health-monitor/SKILL.md` — Scores a campaign set across seven health dimensions and returns a composite health score (0–100).
- `skills/performance-breakdown/SKILL.md` — Breaks down results by ad, adset, audience, placement, and device. Identifies the top and bottom 20%.
- `skills/spend-pacing-checker/SKILL.md` — Compares actual daily spend against target pacing. Flags over- and under-delivery with recommended adjustments.
- `skills/audience-overlap-detector/SKILL.md` — Identifies audience cannibalisation across adsets and recommends consolidation or exclusion fixes.
- `skills/funnel-drop-off-analyser/SKILL.md` — Maps conversion rates at each funnel stage and calculates where the highest-value drop-off occurs.

**Group 2 — Creative Intelligence (5 skills)**

- `skills/creative-matrix-builder/SKILL.md` — Generates a structured creative matrix: angles × formats × hooks as a fillable table.
- `skills/hook-rate-analyser/SKILL.md` — Calculates 3-second video view rate and ThruPlay rate, benchmarks against norms, and recommends hook rewrites.
- `skills/creative-brief-generator/SKILL.md` — Produces a single-page creative brief from campaign context and performance data.
- `skills/ad-copy-tester/SKILL.md` — Generates 3–5 copy variations for a given ad with different angle frameworks (problem/agitate/solve, social proof, direct offer).
- `skills/ugc-script-generator/SKILL.md` — Writes UGC-style scripts with opening hook, body, and CTA. Outputs for 15s, 30s, and 60s formats.

**Group 3 — Tracking & Attribution (4 skills)**

- `skills/utm-builder/SKILL.md` — Constructs correctly formatted UTM strings using the client's naming convention from `client-config.yaml`.
- `skills/pixel-health-checker/SKILL.md` — Reviews pixel event firing data (from pasted output) and flags missing or misfiring events.
- `skills/attribution-window-analyser/SKILL.md` — Compares 1-day click, 7-day click, and view-through attribution windows and recommends the appropriate window per campaign objective.
- `skills/conversion-event-mapper/SKILL.md` — Maps business conversion goals to the correct Meta or TikTok standard events and custom events.

**Group 4 — Optimisation & Decisions (5 skills)**

- `skills/budget-reallocation-planner/SKILL.md` — Recommends shifting budget from underperforming adsets to top performers. Always outputs as a proposed change — never executes directly.
- `skills/bid-strategy-selector/SKILL.md` — Recommends the correct bid strategy (Lowest Cost, Cost Cap, Bid Cap, Value Optimisation) based on campaign phase and objective.
- `skills/audience-expansion-recommender/SKILL.md` — Suggests lookalike audiences, interest expansions, and Advantage+ audience configurations based on existing data.
- `skills/frequency-fatigue-detector/SKILL.md` — Calculates frequency thresholds, identifies fatigued audiences, and recommends creative rotation schedules.
- `skills/scaling-decision-framework/SKILL.md` — Applies a structured decision tree to determine whether a campaign is ready to scale, needs optimisation, or should be paused.

**Group 5 — Reporting & Communication (3 skills)**

- `skills/weekly-report-builder/SKILL.md` — Assembles a structured weekly performance report from CSV input. Populates all `{{variables}}` from client config and agency branding config.
- `skills/monthly-exec-summary/SKILL.md` — Produces a concise executive summary formatted for a non-technical client or business owner. Language adapts to `{{client.brand_voice}}`.
- `skills/client-summary-emailer/SKILL.md` — Drafts a short weekly email summary (6–10 sentences) suitable for pasting into Gmail or a CRM. Tone follows `{{client.brand_voice}}`.

**Group 6 — Safety & Compliance (3 skills)**

- `skills/policy-risk-screener/SKILL.md` — Screens ad copy and creative concepts against Meta Advertising Policies and TikTok Advertising Guidelines. Returns a risk rating (Low / Medium / High) and specific flags.
- `skills/safety-checklist/SKILL.md` — Runs a pre-launch safety checklist: pixel confirmed, budget confirmed, audience confirmed, UTMs confirmed, policy screened, client approval recorded.
- `skills/compliance-log-generator/SKILL.md` — Produces a structured compliance log entry for a campaign launch or significant change. For internal audit trail use.

### 1.3 All Templates

Templates live in `templates/`. You receive all of the following, formatted in Markdown and pre-wired with `{{variable}}` placeholders that pull from config files.

**Audit Templates**
- `templates/audit-templates/meta-campaign-audit.md` — Full Meta campaign audit covering account structure, campaign settings, audience strategy, creative performance, pixel health, and budget efficiency.
- `templates/audit-templates/tiktok-campaign-audit.md` — TikTok equivalent covering campaign structure, creative hook analysis, audience segmentation, bid strategy review, and pixel events.

**Performance Trackers**
- `templates/trackers/daily-performance-tracker.csv` — CSV with pre-built columns: Date, Campaign, Adset, Ad, Spend, Impressions, Clicks, CTR, Conversions, CPA, ROAS, Notes. Designed for manual import of exported ad platform data.
- `templates/trackers/lead-tracker.csv` — Lead quality tracking CSV: Source, Campaign, Adset, Lead Name, Date, Lead Score, CRM Stage, Outcome, Revenue. Links UTM data to CRM outcomes.
- `templates/trackers/utm-builder.csv` — Pre-formatted UTM builder with columns for Platform, Campaign Name, Medium, Source, Content, Term, and the assembled UTM string formula.

**Report Templates**
- `templates/reports/weekly-performance-report.md` — Weekly report: headline metrics, performance vs. prior week, top/bottom performers, recommendations, next week priorities.
- `templates/reports/monthly-executive-summary.md` — One-page executive summary: period overview, key wins, key concerns, budget summary, strategic recommendations.
- `templates/reports/client-report.md` — Full client-facing report combining weekly and monthly elements with visual callout boxes and branded header/footer placeholders.
- `templates/reports/exec-summary.md` — Board-level summary. Three sections: what happened, what it means, what we recommend next. Maximum one page.
- `templates/reports/campaign-audit-report.md` — Structured output template for a full campaign audit. Populated by the meta-campaign-audit or tiktok-campaign-audit skill.
- `templates/reports/creative-performance-report.md` — Creative-specific report: hook rate analysis, top creative by ROAS, creative fatigue flags, recommended next creative tests.
- `templates/reports/lead-quality-report.md` — Lead quality analysis: volume by source, lead score distribution, CRM conversion rates, CPL by stage, recommended optimisations.
- `templates/reports/daily-performance-snapshot.md` — Short-form daily snapshot: spend vs. target, key conversions, flags, no-action-needed / action-required status.

**Creative Tools**
- `templates/creative/creative-matrix.md` — Blank creative matrix: Angles (rows) × Formats (columns) with a hook suggestion field per cell. Produced by the creative-matrix-builder skill.
- `templates/creative/ugc-script-template.md` — UGC script template with hook, problem statement, demonstration, social proof, and CTA sections in 15s / 30s / 60s formats.

**Onboarding & Business Forms**
- `templates/onboarding/client-onboarding-form.md` — Structured intake form: business overview, target audience, current ad spend, objectives, platforms, competitors, creative assets available, reporting preferences.
- `templates/onboarding/business-onboarding-checklist.md` — Step-by-step onboarding checklist for the agency: access confirmed, pixel verified, UTM naming agreed, ad account audited, client config created, first report scheduled.
- `templates/scorecards/campaign-scorecard.md` — One-page scorecard showing health scores across seven dimensions for a quick client-facing summary.

### 1.4 Dashboard Specs

- `dashboards/google-sheets-spec.md` — Full specification for the Google Sheets dashboard: tab structure, formula list, chart specifications, conditional formatting rules, and import instructions for CSV data. No coding required.
- `dashboards/looker-studio-spec.md` — Optional Looker Studio (Google Data Studio) spec: data source connections, calculated fields, page layouts. For V2+ agencies connecting live data.
- `dashboards/airtable-spec.md` — Optional Airtable base spec: table structure, field types, linked records, and view configurations for client management and campaign tracking.
- `dashboards/notion-spec.md` — Optional Notion workspace spec: database schemas, page templates, and relation properties for agencies who prefer Notion as their operating environment.

### 1.5 Automation Blueprints (V2)

- `automations/make/weekly-report-automation.json` — Make (Integromat) scenario blueprint: triggers on a schedule, pulls from Google Sheets, runs report skill, outputs to Google Docs or email.
- `automations/make/alert-flow.json` — Make scenario: monitors daily spend pacing, triggers alert via email or Slack when spend deviates more than 20% from target.
- `automations/zapier/weekly-report-zap.json` — Zapier equivalent of the weekly report automation.
- `automations/zapier/crm-feedback-loop.json` — Zapier workflow: when a CRM lead stage changes, writes outcome back to the lead tracker Google Sheet.
- `automations/n8n/n8n-report-workflow.json` — n8n workflow blueprint for agencies on self-hosted infrastructure.
- `automations/n8n/n8n-alert-workflow.json` — n8n alerting workflow.
- `automations/webhook-structure.md` — Documentation of the webhook payload structure used across all three automation platforms, so agencies can adapt blueprints to other tools.
- `automations/alerting-rules.md` — Defines the default alert thresholds and how to customise them per client.

### 1.6 SOPs

- `templates/sops/weekly-client-workflow.md` — Step-by-step SOP for the weekly client workflow: data export, tracker update, report generation, review, delivery.
- `templates/sops/campaign-launch-sop.md` — Pre-launch checklist and workflow: config confirmed, audit run, safety check passed, UTMs built, client approval recorded.
- `templates/sops/monthly-audit-sop.md` — Monthly audit process: data pull, audit template populated, findings ranked, recommendations written, client presentation delivered.
- `templates/sops/new-client-setup-sop.md` — How to onboard a new client from signed contract to first report in seven days.
- `templates/sops/escalation-sop.md` — What to do when a campaign has a significant performance drop, a policy flag, or a billing anomaly.

### 1.7 White-Label Rights

The Agency tier licence grants the following rights:

- Rebrand AdPilot OS under your own product name (e.g. "PaidPilot by Apex Digital") and deliver it as part of a managed service.
- Use across unlimited client accounts you directly manage.
- Train your internal team members to use the system.
- Customise agent prompts, templates, and SOPs to match your agency's workflows.
- Include reports, dashboards, and audits as deliverables in client retainers.

See Section 9 for the full licence summary.

### 1.8 Done-With-You Setup Option

Available as an add-on at $1,500–$5,000 AUD. Includes:

- Live setup call (2–3 hours): configure `agency-branding.yaml`, set up first client folder, run first audit together.
- First branded report produced during the call.
- Slack or email support for 30 days post-setup.
- UTM naming convention agreed and documented.
- V2 automation blueprint installed in Make or Zapier (if on Pro+).

### 1.9 V2 and V3 Upgrade Path

- **V2 (Low-Code):** Adds live automation via Make, Zapier, or n8n. Weekly reports run automatically. Alerts fire without manual triggers. CRM feedback loop closes the data gap between ad spend and revenue. Available as an upgrade or included in higher tiers.
- **V3 (API):** Adds direct Meta Marketing API and TikTok Marketing API connections via OAuth. Automated data imports replace manual CSV exports. Client reporting runs on live data. White-label agency mode in the V3 API layer delivers branded report endpoints. V3 roadmap is included in the agency tier so buyers can plan ahead.

---

## 2. How to Rebrand

### 2.1 The Branding Config File

Create a new file at the root of your agency workspace:

**File:** `agency-branding.yaml`

```yaml
# AdPilot OS — Agency Branding Configuration
# Place this file at the root of your agency workspace.
# All agents, skills, and templates read from this file when generating
# client-facing outputs. Update these values once; they propagate everywhere.

agency:
  agency_name: "Apex Digital"
  agency_logo_url: "https://assets.apexdigital.com.au/logo/apex-logo-dark.png"
  agency_primary_color: "#1A2E4A"        # Used in report cover blocks, chart primary series
  agency_secondary_color: "#F4A623"      # Used in callout boxes, chart accent series
  agency_website: "https://apexdigital.com.au"
  agency_support_email: "support@apexdigital.com.au"
  agency_support_phone: "+61 3 9000 0000"
  white_label_product_name: "PaidPilot by Apex Digital"
  report_footer: "Prepared by Apex Digital | support@apexdigital.com.au | apexdigital.com.au"
  dashboard_title: "PaidPilot Performance Dashboard"
  hide_adpilot_attribution: true
```

This file is referenced in the system prompt of every agent and in the header of every template. You set it once.

### 2.2 Files to Update

**Agent prompt headers (`agents/*.md`)**

Every agent file begins with a metadata block. Update the `system_product_name` field:

```yaml
# agents/mira.md (example header)
agent: mira
version: 1.0
product: "{{agency.white_label_product_name}}"   # reads from agency-branding.yaml
role: Meta Specialist
```

The `start-ads-command-centre.md` router also references the product name in its opening system prompt. Find this line and update it — or let it pull from the variable:

```
You are the command centre for {{agency.white_label_product_name}}, a paid-ads operating system...
```

**Template headers (`templates/**/*.md`)**

Every template contains a header block like this:

```
# {{agency.white_label_product_name}}
## {{report.title}}
**Client:** {{client.business_name}}
**Period:** {{report.date_range}}
**Prepared by:** {{agency.agency_name}}
```

No manual editing required — the variables pull from config when the report skill is run.

**YAML client config (`config/universal-defaults.yaml`)**

Add a reference to `agency-branding.yaml` so the defaults file knows where to find branding:

```yaml
# config/universal-defaults.yaml
branding_config: "agency-branding.yaml"
```

### 2.3 Find-and-Replace for Static Text

Some files may contain hardcoded references from the base installation. Run a find-and-replace across the entire workspace:

| Find | Replace with |
|---|---|
| `AdPilot OS` | `{{agency.white_label_product_name}}` |
| `AdPilot` | `{{agency.agency_name}}` |
| `adpilot.com.au` | `{{agency.agency_website}}` |
| `support@adpilot.com.au` | `{{agency.agency_support_email}}` |
| `Powered by AdPilot OS` | `Powered by {{agency.white_label_product_name}}` |

When `hide_adpilot_attribution: true` is set, the report footer replaces any attribution line entirely with `{{agency.report_footer}}`.

### 2.4 Fields That Pull Automatically From `agency-branding.yaml`

Once the branding file is in place, the following locations resolve automatically:

| Location | Field used |
|---|---|
| Report cover page heading | `agency.white_label_product_name` |
| Report header (all pages) | `agency.agency_name` |
| Report footer (all pages) | `agency.report_footer` |
| Dashboard tab title | `agency.dashboard_title` |
| Email signature in client-summary-emailer skill | `agency.agency_support_email`, `agency.agency_website` |
| Cover page colour block | `agency.agency_primary_color` |
| Callout boxes and chart accents | `agency.agency_secondary_color` |
| Logo placement in report header | `agency.agency_logo_url` |
| Support contact in onboarding form | `agency.agency_support_email`, `agency.agency_support_phone` |
| Policy risk screener sign-off | `agency.agency_name` |

---

## 3. Multi-Client Setup

### 3.1 Folder Structure

Each client gets their own folder under `clients/`. Agents and skills are shared — they read whichever config is active. Only the config files and output folders are client-specific.

**Example: Apex Digital managing three clients**

```
agency-workspace/
├── agency-branding.yaml                  # Agency branding — set once
├── config/
│   ├── universal-defaults.yaml           # Platform defaults shared across all clients
│   └── active-client.yaml                # Symlink or pointer to the current client config
├── agents/                               # Shared — all 12 agents live here
│   ├── start-ads-command-centre.md
│   ├── mira.md
│   ├── travis.md
│   ├── dana.md
│   ├── stella.md
│   ├── titan.md
│   ├── milo.md
│   ├── atlas.md
│   ├── riley.md
│   ├── paige.md
│   ├── piper.md
│   └── quinn.md
├── skills/                               # Shared — all 25 skills live here
│   ├── campaign-health-monitor/
│   ├── performance-breakdown/
│   ├── spend-pacing-checker/
│   └── ... (22 more)
├── templates/                            # Shared — all templates live here
│   ├── reports/
│   ├── trackers/
│   ├── audit-templates/
│   ├── creative/
│   ├── onboarding/
│   ├── scorecards/
│   └── sops/
├── clients/
│   ├── bark-and-brew/
│   │   ├── client-config.yaml            # Bark & Brew specific config
│   │   ├── data/
│   │   │   ├── daily-performance-tracker.csv
│   │   │   ├── lead-tracker.csv
│   │   │   └── raw-exports/              # Raw CSV exports from Meta/TikTok
│   │   ├── reports/
│   │   │   ├── 2026-05-weekly-report.md
│   │   │   ├── 2026-05-monthly-exec-summary.md
│   │   │   └── 2026-Q1-campaign-audit.md
│   │   └── assets/
│   │       └── creative-matrix-2026-05.md
│   ├── metro-physio/
│   │   ├── client-config.yaml
│   │   ├── data/
│   │   │   ├── daily-performance-tracker.csv
│   │   │   ├── lead-tracker.csv
│   │   │   └── raw-exports/
│   │   ├── reports/
│   │   │   ├── 2026-05-weekly-report.md
│   │   │   └── 2026-05-monthly-exec-summary.md
│   │   └── assets/
│   │       └── creative-matrix-2026-05.md
│   └── sunstate-solar/
│       ├── client-config.yaml
│       ├── data/
│       │   ├── daily-performance-tracker.csv
│       │   ├── lead-tracker.csv
│       │   └── raw-exports/
│       ├── reports/
│       │   ├── 2026-05-weekly-report.md
│       │   └── 2026-05-monthly-exec-summary.md
│       └── assets/
│           └── creative-matrix-2026-05.md
├── dashboards/
│   ├── google-sheets-spec.md             # Shared spec
│   └── apex-digital-master-dashboard.md  # Agency-level multi-client rollup view
└── automations/
    ├── make/
    ├── zapier/
    └── n8n/
```

### 3.2 Per-Client Config File

Each client's `client-config.yaml` contains everything that varies per client. Here is an example for Bark & Brew:

```yaml
# clients/bark-and-brew/client-config.yaml

client:
  business_name: "Bark & Brew Pet Supplies"
  industry: "Pet retail / e-commerce"
  website: "https://barkandbrew.com.au"
  primary_contact: "Sarah Chen"
  primary_contact_email: "sarah@barkandbrew.com.au"
  brand_voice: "Warm, playful, dog-parent community feel. Avoid corporate language."
  compliance_notes: "No health claims on pet food products. Follow ACCC guidelines."
  reporting_cadence: "weekly"
  report_recipient_emails:
    - "sarah@barkandbrew.com.au"

platforms:
  meta:
    ad_account_id: "act_123456789"
    pixel_id: "987654321"
    currency: "AUD"
    timezone: "Australia/Sydney"
  tiktok:
    ad_account_id: "7000000000000000000"
    pixel_id: "TTABCDEF"
    currency: "AUD"
    timezone: "Australia/Sydney"

campaign_objectives:
  primary: "Purchase"
  secondary: "Add to Cart"

budget:
  monthly_total_aud: 5000
  meta_allocation_pct: 70
  tiktok_allocation_pct: 30

utm:
  naming_convention: "platform_campaign-name_adset-name_ad-name"
  source_meta: "meta"
  source_tiktok: "tiktok"
  medium: "paid_social"

targets:
  target_roas: 3.5
  target_cpa_aud: 28.00
  target_cpl_aud: null

agency_branding:
  branding_config: "../../agency-branding.yaml"
```

### 3.3 How Agents and Skills Know Which Client Is Active

Agents and skills are stateless — they read the config you point them at. The workflow is:

1. Open a new Claude session.
2. In your opening prompt, paste or reference the client config: `Load client config from clients/bark-and-brew/client-config.yaml`.
3. Run `start-ads-command-centre.md` as the system prompt.
4. All subsequent agents in that session read `{{client.*}}` variables from Bark & Brew's config.

There is no global state. Switching clients means starting a new session with a different config reference. This is intentional — it prevents cross-client data contamination.

**Practical shortcut:** Keep a text snippet for each client that reads:

```
Active client: Bark & Brew Pet Supplies
Config: clients/bark-and-brew/client-config.yaml
Agency branding: agency-branding.yaml
```

Paste this at the start of every session.

### 3.4 Running a Cross-Client Health Check

The `skills/campaign-health-monitor/SKILL.md` skill accepts a batch input mode. To run a health check across all three clients:

1. Export the last 7 days of campaign data from each client's ad account as a CSV.
2. Place each export in the client's `data/raw-exports/` folder.
3. Open a session with the `dana.md` agent and the `campaign-health-monitor` skill.
4. Paste the prompt:

```
Run a campaign health check across three clients.
Client 1: Bark & Brew — [paste CSV data or summarised metrics]
Client 2: Metro Physio — [paste CSV data or summarised metrics]
Client 3: SunState Solar — [paste CSV data or summarised metrics]
Output: Health score (0–100) per client, top risk per client, recommended priority actions.
```

5. Dana will return a ranked table of health scores and a prioritised action list for each client.
6. Copy results into `dashboards/apex-digital-master-dashboard.md` or the master Google Sheets tab.

This takes approximately 10–15 minutes per weekly cycle once the CSV export routine is established.

---

## 4. Branded Reports

### 4.1 Report Header

Every report template includes a standard header block that resolves from config:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[AGENCY LOGO — {{agency.agency_logo_url}}]
{{agency.white_label_product_name}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client:        {{client.business_name}}
Period:        {{report.date_range}}
Report:        {{report.title}}
Prepared by:   {{agency.agency_name}}
Date issued:   {{report.issued_date}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.2 Report Footer

Every page of a report ends with:

```
─────────────────────────────────────────────────────
{{agency.report_footer}}
Powered by {{agency.white_label_product_name}}    ← omitted if hide_adpilot_attribution: true
─────────────────────────────────────────────────────
```

When `hide_adpilot_attribution: true`, the footer shows only `{{agency.report_footer}}`.

### 4.3 Colour Scheme Application

| Element | Colour used |
|---|---|
| Cover page background block | `agency.agency_primary_color` |
| Section divider lines | `agency.agency_primary_color` |
| Callout boxes (recommendations) | `agency.agency_secondary_color` background |
| Chart primary data series | `agency.agency_primary_color` |
| Chart accent / comparison series | `agency.agency_secondary_color` |
| Table header row background | `agency.agency_primary_color` |
| Table header text | White (#FFFFFF) |

Colour values are applied when exporting to Google Slides or PDF. In the Markdown source, they are noted as comments. In Google Sheets, the conditional formatting rules reference the hex values from the spec.

### 4.4 Client-Facing Language

The `{{client.brand_voice}}` field in `client-config.yaml` tells the reporting agents how to frame language. The template structure is fixed — the headings, sections, and data points do not change. What adapts is the tone of the written commentary.

Examples:

| `client.brand_voice` setting | Commentary style |
|---|---|
| "Warm, playful, dog-parent community feel" | "Your ads are connecting well with the dog-loving community — here's what's working..." |
| "Clinical, evidence-based, professional" | "Campaign performance for the period reflects a 12% improvement in CPL against the prior 4-week baseline." |
| "Direct, no-fluff, focus on ROI" | "Spend: $4,200. Revenue attributed: $14,700. ROAS: 3.5. Three campaigns underperforming — details below." |

The `riley.md` and `monthly-exec-summary` skill both read `{{client.brand_voice}}` and adjust accordingly.

### 4.5 Report Templates Available

| Template file | Frequency | Primary audience |
|---|---|---|
| `templates/reports/daily-performance-snapshot.md` | Daily | Internal (agency team) |
| `templates/reports/weekly-performance-report.md` | Weekly | Client (account manager or marketing lead) |
| `templates/reports/monthly-executive-summary.md` | Monthly | Client executive / business owner |
| `templates/reports/campaign-audit-report.md` | Quarterly or on request | Client and internal |
| `templates/reports/creative-performance-report.md` | Monthly or per creative cycle | Client creative team |
| `templates/reports/lead-quality-report.md` | Monthly | Client sales team or CRM owner |

### 4.6 Export Formats

| Format | How |
|---|---|
| `.md` (Markdown) | Source format. Produced directly by agents and skills. Stored in `clients/[client]/reports/`. |
| PDF | Open the `.md` file in a Markdown editor (Typora, Obsidian, VS Code + extension) and print to PDF. Or paste into Google Docs and export. |
| Google Slides | Copy from the provided Google Slides template (linked in the onboarding pack). Paste report sections into the pre-formatted slide deck. The cover slide uses the agency's primary colour and logo. |

---

## 5. Pricing to Their Clients — Suggested Retail Margins

### 5.1 Your Cost

| Tier | Price (AUD) | Clients included |
|---|---|---|
| Starter | $97–$297 | 1–3 clients, V1 only |
| Pro | $497–$1,497 | Up to 10 clients, V1 + V2 blueprints |
| Agency White Label | $1,997–$4,997 | Unlimited clients, full white-label rights, V1 + V2 + V3 roadmap |
| Done-With-You setup | +$1,500–$5,000 | One-time add-on, hands-on setup support |

### 5.2 What to Charge Your Clients — Suggested Retail Tiers

The following are suggested retail prices for the services you deliver using AdPilot OS. These are starting points — adjust based on your market, client size, and ad spend managed.

| Service tier | Suggested retail (AUD/month) | What's included |
|---|---|---|
| **Reporting Only** | $500/month | Weekly performance report, campaign health score, monthly executive summary |
| **Reporting + Audit** | $800/month | All of Reporting Only, plus quarterly campaign audit and written recommendations |
| **Full Management Support** | $1,500/month | All of Reporting + Audit, plus weekly optimisation proposals, creative briefs, UTM management, and ongoing strategic recommendations |
| **Full White-Label AI System** | $2,000/month | All of Full Management Support, plus V2 automation (Zapier/Make flows), CRM feedback loop, daily spend pacing alerts, and priority support |

### 5.3 Scope Notes Per Tier

**Reporting Only ($500/month)**
- Suitable for clients with an in-house media buyer or existing agency managing the campaigns.
- Your role: data interpretation, structured reporting, health scoring.
- Time commitment: approximately 2–3 hours/month per client.

**Reporting + Audit ($800/month)**
- Suitable for clients who want independent oversight of their campaigns.
- Your role: above, plus a structured quarterly audit with scored findings.
- Time commitment: approximately 3–5 hours/month per client.

**Full Management Support ($1,500/month)**
- Suitable for clients who want strategic guidance and creative direction but manage campaign changes themselves.
- Your role: above, plus weekly recommendations, creative matrix updates, UTM governance.
- Time commitment: approximately 5–8 hours/month per client.

**Full White-Label AI System ($2,000/month)**
- Suitable for clients who want the full system — automated alerts, live data flows, CRM integration, and proactive management.
- Your role: system oversight, exception handling, strategic direction.
- Time commitment: approximately 1–3 hours/month per client once V2 automations are live.

---

## 6. Margin Analysis

### 6.1 Time Commitment Per Client by Version

| Version | Tasks handled manually | Agency hours/client/month |
|---|---|---|
| V1 (No-Code) | Data export, CSV import, manual report run, manual delivery | 4–6 hours |
| V2 (Low-Code) | Exception handling, strategic review, client call | 1–2 hours |
| V3 (API) | Exception handling only | ~0.5 hours |

**What the agency spends its time on once AdPilot OS handles the data work:**
- Client relationship management and strategy conversations.
- Creative direction and briefing.
- New client acquisition using the sales support pack.
- Escalation handling for anomalies flagged by the health monitor.
- Growing the client roster — because delivery capacity has increased significantly.

### 6.2 Worked Examples

**Example A — Small start (V1, Reporting + Audit tier)**

| Item | Amount (AUD) |
|---|---|
| Clients | 3 |
| Retail rate | $800/month each |
| Monthly Revenue (MRR) | $2,400 |
| AdPilot OS Agency cost (one-time) | $1,997 |
| Monthly tool costs (Claude Pro) | ~$40 |
| Net Month 1 (after tool cost and licence) | $363 |
| Net Month 2+ (after tool cost) | $2,360/month |
| **Break-even** | **Month 1** |

At 4–6 hours per client per month, total delivery time is approximately 12–18 hours/month. At an effective rate of $133–200/hour — without billing a single hour of ad management.

---

**Example B — Growing agency (V1/V2, Full Management Support tier)**

| Item | Amount (AUD) |
|---|---|
| Clients | 8 |
| Retail rate | $1,000/month each |
| Monthly Revenue (MRR) | $8,000 |
| AdPilot OS Agency cost (one-time) | $2,997 |
| Monthly tool costs | ~$100 |
| Net Month 1 | $4,903 |
| Net Month 2+ | $7,900/month |
| **Break-even** | **Month 1** |

With V2 automations live, 8 clients at 1–2 hours each means approximately 8–16 hours of delivery per month. The rest of your working time goes to growth and strategy.

---

**Example C — Scaled agency (V2/V3, mixed tier)**

| Item | Amount (AUD/month) |
|---|---|
| Clients | 15 |
| Average retail rate | $1,500/month |
| **MRR** | **$22,500** |
| Staff (2 x account managers) | $6,000 combined |
| Tool costs (Make + Zapier + Claude Pro) | $497 |
| AdPilot OS Agency licence (amortised) | ~$415 (if $4,997 annual) |
| **Total monthly costs** | **$6,912** |
| **Net margin** | **$15,588/month** |
| **Net margin %** | **69%** |

At V2 automation with V3 API connections, 15 clients at 0.5–1 hour each means approximately 8–15 hours of delivery per month across both account managers — the bulk of their time is spent on client communication and new business.

### 6.3 Margin Summary Table

| Scenario | Clients | MRR | Monthly costs | Net margin | Margin % |
|---|---|---|---|---|---|
| Example A | 3 | $2,400 | $40 | $2,360 | 98% |
| Example B | 8 | $8,000 | $100 | $7,900 | 99% |
| Example C | 15 | $22,500 | $6,912 | $15,588 | 69% |

Note: Example C margins are lower due to staff costs, not tool costs. Tool costs are a minor variable at scale.

---

## 7. Sales Support — What We Provide

The Agency White-Label tier includes a complete sales support pack in `product/sales-support/`. You receive the following.

### 7.1 Pitch Deck Template

File: `product/sales-support/pitch-deck-template.md`

Slide structure (12 slides):

1. **Cover** — Agency name, client name, date, "A smarter way to manage paid social"
2. **The Problem** — Paid social is data-heavy, time-consuming, and prone to human error at scale
3. **The Cost of Getting It Wrong** — Wasted spend, missed opportunities, no reporting visibility
4. **Our Solution** — Introduce your branded AI-powered ads system (your white-label product name)
5. **What It Does** — The 12 agents and 25 skills in plain language (3–4 bullet points)
6. **What You Get Each Month** — Report cadence, health scores, audit cycle, alerts
7. **The Safety Model** — Never edits live campaigns; proposes, reviews, then acts
8. **Proof** — Case study summary (use the case study template)
9. **Our Service Tiers** — Pricing table (your retail tiers from Section 5)
10. **What the Onboarding Looks Like** — Week 1 to Week 4 timeline
11. **The Offer** — Specific tier recommendation for this prospect, investment, start date
12. **Next Steps** — Three action items with dates

### 7.2 Objection Handling Guide

File: `product/sales-support/objection-handling-guide.md`

| # | Objection | Suggested response |
|---|---|---|
| 1 | "We already have someone checking our ads." | "This doesn't replace your team — it gives them a structured system to work faster and catch things that manual checking misses. Your team spends time on strategy; the system handles the data." |
| 2 | "We can't afford another monthly fee." | "The question is what your current setup costs when campaigns underperform for weeks before anyone notices. One month of optimised spend typically pays for the full year of this service." |
| 3 | "We tried an AI tool before and it didn't work." | "Those tools make changes automatically. Ours doesn't. Every recommendation goes through your approval. It's an intelligence layer, not an autopilot." |
| 4 | "We don't have time to set this up." | "Setup is seven days with a clear onboarding checklist. If you want hands-on help, we offer a Done-With-You option and handle everything. You review and sign off." |
| 5 | "Our ad spend is too small to justify this." | "The health scoring and reporting structure is what adds value at any spend level. We've seen clients on $2,000/month find $400/month in wasted spend in the first audit." |
| 6 | "We don't trust AI with our ad accounts." | "The system never touches your ad accounts. It reads data you export or paste, makes recommendations, and you decide what to action. Your Business Manager credentials never leave your hands." |
| 7 | "What if our results don't improve?" | "The system identifies what to fix — improvement depends on actioning the recommendations. In the first 30 days, you'll have more visibility into your campaigns than you've ever had before." |
| 8 | "Can't we just do this ourselves with ChatGPT?" | "You can build this yourself over several months. What you're paying for is the system that's already built, tested, and documented — 12 specialist agents, 25 skills, audit templates, SOPs, dashboards, and the weekly workflow already mapped out." |

### 7.3 Case Study Template

File: `product/sales-support/case-study-template.md`

Structure:
- **Client background** — Industry, ad spend level, platforms used, team size
- **Starting metrics** — Baseline ROAS, CPA/CPL, spend, campaign count, last audit date
- **What was changed** — Specific actions taken based on audit and weekly recommendations (be precise — do not overstate)
- **Results after 90 days** — Updated metrics in the same format as starting metrics, with percentage change
- **Client quote** — Direct quote from the client contact (with permission)
- **Key insight** — One sentence on the single most important thing the system found that drove the result

### 7.4 One-Page Capability Statement

File: `product/sales-support/capability-statement-template.md`

A single A4 page covering:
- Agency name and branding
- Service description (3 sentences)
- Core capabilities (bullet list of 6–8)
- Platforms supported (Meta, TikTok)
- Reporting cadence (daily snapshot, weekly report, monthly exec summary, quarterly audit)
- Client logos or industries served (placeholder)
- Contact details

### 7.5 Sample Proposal Template

File: `product/sales-support/proposal-template.md`

Sections:
1. Situation summary (2–3 sentences on what you heard from the prospect)
2. Recommended service tier with justification
3. Scope of work (bulleted list of monthly deliverables)
4. Investment (monthly fee, setup fee if applicable)
5. What happens next (sign, invoice, onboarding call date)
6. Terms summary (payment, notice period, IP)
7. Sign-off block

### 7.6 Email Sequence Templates (Post-Demo Follow-Up)

File: `product/sales-support/email-sequences.md`

**Email 1 — Send within 2 hours of demo:**
Subject: `[First Name] — your [white_label_product_name] proposal`
Content: Thank them for their time, attach the proposal, reiterate the single most relevant point from the demo, offer a 15-minute call to answer questions. Keep it under 100 words.

**Email 2 — Send on Day 3 if no response:**
Subject: `Quick question about [Client Business Name]'s ad campaigns`
Content: Reference one specific thing you noticed about their campaigns or industry (from pre-demo research). Share one data point from a relevant case study. Ask if they have questions about the proposal.

**Email 3 — Send on Day 7 if no response:**
Subject: `Last follow-up — [white_label_product_name]`
Content: Keep it brief. Acknowledge they're busy. Offer two specific options: start now, or revisit in 60 days. Make it easy to say yes or park it. No pressure. Close the loop.

---

## 8. Agency Partner Onboarding Plan

### Week 1 (Days 1–7) — Setup

**Goal:** System configured, first client loaded, first audit completed.

| Day | Task | Owner | Notes |
|---|---|---|---|
| 1 | Download and extract AdPilot OS files | Agency | Place in agency workspace root |
| 1 | Create `agency-branding.yaml` with your brand values | Agency | Use the template in Section 2 |
| 1–2 | Set up Google Sheets dashboard from spec | Agency | Use `dashboards/google-sheets-spec.md` |
| 2 | Choose first client to onboard | Agency | Pick a live account with at least 30 days of data |
| 2–3 | Create `clients/[client-slug]/client-config.yaml` | Agency | Use the template in Section 3 |
| 3 | Export 30 days of campaign data from Meta and/or TikTok as CSV | Agency | Standard export from Ads Manager |
| 3 | Import CSV into the daily performance tracker | Agency | See `templates/trackers/daily-performance-tracker.csv` |
| 4 | Run first campaign audit using `mira.md` + `templates/audit-templates/meta-campaign-audit.md` | Agency | Paste CSV data into Claude session with client config loaded |
| 4–5 | Review audit output, note top 3 findings | Agency | Store in `clients/[client-slug]/reports/` |
| 5 | Confirm UTM naming convention with client | Agency | Document in `client-config.yaml` under `utm:` |
| 6–7 | Setup call (if Done-With-You option purchased) | Agency + AdPilot OS team | Review setup, resolve any config questions, run first report together |

### Week 2 (Days 8–14) — First Delivery

**Goal:** First branded report delivered to the client. Safety and UTM processes locked in.

| Day | Task | Owner | Notes |
|---|---|---|---|
| 8 | Run first weekly report using `riley.md` + `templates/reports/weekly-performance-report.md` | Agency | Session with client config + agency branding loaded |
| 9 | Review report output, check all `{{variables}}` resolved correctly | Agency + Quinn agent | Run the QA skill (`skills/safety-checklist/SKILL.md`) before sending |
| 9–10 | Export report to PDF and deliver to client | Agency | First branded delivery |
| 10 | Configure UTM builder for the client's account | Agency | Use `templates/trackers/utm-builder.csv` and document the naming convention |
| 11 | Set up daily performance tracker CSV workflow | Agency | Establish the weekly export routine: export Monday morning, update tracker, run report |
| 12 | Review safety settings with your team | Agency | Read `agents/paige.md` and confirm the team understands the no-live-edit rule |
| 13–14 | Run policy risk screen on any live creatives using `paige.md` | Agency | Flag any Medium or High risk items to the client |

### Week 4 (Days 22–30) — Scale

**Goal:** Three clients active, automation in place (if on Pro+), first monthly executive summary sent.

| Day | Task | Owner | Notes |
|---|---|---|---|
| 22 | Onboard second client — create config, run first audit | Agency | Follow the same Week 1 process |
| 23 | Onboard third client | Agency | By now the process should take 2–3 hours per client |
| 24 | Install V2 automations if on Pro+ | Agency + Milo agent | Use `automations/make/weekly-report-automation.json` or the Zapier equivalent |
| 25 | Run cross-client health check across all three clients | Agency | Use `skills/campaign-health-monitor/SKILL.md` in batch mode |
| 26–27 | Produce first monthly executive summary for Client 1 | Agency | Use `templates/reports/monthly-executive-summary.md` |
| 28 | Review health scores for all clients; identify priority actions for next month | Agency | Store in the master dashboard |
| 29–30 | Launch sales support materials — send proposals to 2–3 new prospects | Agency | Use the pitch deck, capability statement, and proposal templates from Section 7 |

---

## 9. Agency Agreement Summary

> **Disclaimer:** This section is a plain-English summary of the licence terms for the AdPilot OS Agency White-Label tier. It is not legal advice. You should seek independent legal advice before entering into any commercial agreements with your clients. This summary does not constitute a binding contract — refer to the full licence agreement provided at purchase for the legally operative terms.

### 9.1 What the Licence Allows

As an Agency White-Label licence holder, you are permitted to:

- **Resell as a managed service:** Use AdPilot OS as the engine behind a service you sell to your clients. You are selling your service, not the software.
- **Rebrand:** Apply your agency's branding to all reports, dashboards, templates, and client-facing materials using the `agency-branding.yaml` configuration.
- **Multi-client use:** Use the system across an unlimited number of client accounts you directly manage under your agency.
- **Train your internal team:** Share access to the system with your employed or contracted team members who work on your client accounts.
- **Customise for your workflow:** Modify agent prompts, templates, SOPs, and dashboard specs to fit your agency's processes.

### 9.2 What the Licence Prohibits

The following are not permitted under this licence:

- **Reselling source files as-is:** You may not sell, distribute, or share the raw AdPilot OS files (agent prompts, skill files, templates, blueprints) as standalone products.
- **Sublicensing the raw skill pack:** You may not provide your clients with direct access to the AdPilot OS skill files, agents, or templates as a DIY tool for them to operate independently.
- **Transferring the licence:** The licence is non-transferable. You may not sell, assign, or transfer your licence to another business.
- **Competing use:** You may not use AdPilot OS to build a competing product or system that is substantially derived from its architecture, agents, or skill framework.
- **White-labelling as your own IP:** You may brand the output and the service, but you may not claim ownership of the underlying system, agents, or methodologies.

### 9.3 Intellectual Property

All intellectual property in AdPilot OS — including but not limited to the agent prompt architecture, skill framework, template structures, dashboard specifications, and automation blueprints — remains the property of AdPilot OS and its creator. The licence grants you a right to use, not a transfer of ownership.

Your client-specific configurations, data, and customisations remain your property.

### 9.4 Compliance Responsibilities

The agency is solely responsible for ensuring that:

- All campaigns and ad content delivered using AdPilot OS comply with **Meta Advertising Policies** and **TikTok Advertising Guidelines** at the time of delivery.
- Services delivered to Australian clients comply with the **Australian Consumer Law (Competition and Consumer Act 2010, Schedule 2)**.
- Data handling practices comply with the **Privacy Act 1988 (Cth)** and the Australian Privacy Principles, including client data stored in config files, dashboards, and trackers.
- Where services are delivered to clients with EU-based customers or data subjects, the agency maintains compliance with the **General Data Protection Regulation (GDPR)**.

AdPilot OS provides the `policy-risk-screener` skill and `paige.md` agent as tools to assist with compliance review. These are assistance tools, not legal guarantees. The agency bears full responsibility for compliance outcomes.

### 9.5 Safety Model — Agency Obligations

The agency agrees to operate AdPilot OS in accordance with its built-in safety model:

- Agents never directly edit live campaigns. All changes are proposed as paused duplicates or documented recommendations.
- Any action involving money movement or significant structural change requires a typed `YES` confirmation.
- Client data is handled exclusively through `{{client.*}}` variables in config files — raw client credentials are not pasted into agent sessions.
- All campaign changes are archived, not deleted, to maintain an audit trail.

Bypassing these safety constraints is at the agency's sole risk and may constitute a breach of the licence.

### 9.6 Termination

If the agency is found to be in breach of the licence terms — including prohibited uses in Section 9.2 or non-compliance with the safety model — AdPilot OS reserves the right to revoke the licence with **14 days written notice**. Upon revocation:

- The agency must cease all use of AdPilot OS files, agents, and skills.
- The agency must remove all AdPilot OS materials from its systems.
- No refund is provided for the unexpired term of an annual licence in the event of termination for cause.

### 9.7 Governing Law

This licence and any disputes arising from it are governed by the laws of the **State of Victoria, Australia**. The parties submit to the exclusive jurisdiction of the courts of Victoria.
