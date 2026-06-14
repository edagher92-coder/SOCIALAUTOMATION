# Agency Client Dashboard Spec — AdPilot OS
**Version:** 1.0
**Tier:** Agency (Multi-Client Portfolio)
**Currency:** AUD
**Last Updated:** 2026-06-14

---

## Table of Contents

1. [Overview & Use Case](#1-overview--use-case)
2. [Client Switcher](#2-client-switcher)
3. [Per-Client Branding](#3-per-client-branding)
4. [Portfolio Roll-Up View](#4-portfolio-roll-up-view)
5. [Per-Client Health Scores](#5-per-client-health-scores)
6. [Alerts System](#6-alerts-system)
7. [Client-Facing Read-Only View](#7-client-facing-read-only-view)
8. [Onboarding Checklist](#8-onboarding-checklist)
9. [Agency Pricing Tier Notes](#9-agency-pricing-tier-notes)

---

## 1. Overview & Use Case

### Who This Is For

Agency operators managing between 5 and 50+ paid-ads clients across Meta (Facebook/Instagram) and TikTok. The primary users are:

- **Agency Director / Head of Performance:** Needs a portfolio-wide view of health, spend, and client risk without opening individual accounts.
- **Account Manager:** Manages 5–15 clients, needs per-client drill-down and alert triage.
- **Media Buyer:** Needs raw performance data and creative metrics to action optimisations.
- **Client Contact (read-only):** Needs their own branded view showing results, not agency internals.

This spec covers the **Agency tier** of AdPilot OS — the top tier offering multi-client portfolio management, white-label client portals, and automated reporting at scale.

### How It Differs From Single-Client Dashboards

| Feature | Solo / Pro (Single-Client) | Agency (Multi-Client) |
|---|---|---|
| Number of clients | 1 | 5–50+ |
| Portfolio roll-up view | No | Yes |
| Client switcher | N/A | Yes |
| Per-client branding | No | Yes (white-label) |
| Client-facing portals | No | Yes (read-only URL per client) |
| Alert routing | Internal only | Internal + client-facing |
| Health score comparison | N/A | Portfolio-wide ranking |
| Agency revenue tracking | No | Yes |
| Onboarding workflow | Manual setup | Templated, step-by-step |
| Access control | Single user | Role-based (Agency / AM / Client) |

The single-client dashboard is built for one business looking at their own data. The agency dashboard is built for one agency looking across many businesses, with individual client portals that hide all cross-client and internal data.

### Technology Stack Options

Two implementation paths are supported. Choose one at agency setup; do not mix mid-deployment.

---

#### Option A: Looker Studio Portfolio + Google Sheets Backend (Recommended for data teams)

**Architecture:**

```
Universal Schema CSVs / API connectors
        ↓
Google Sheets — Agency Master Base
  ├── Sheet: clients_config        (one row per client, all {{client.*}} vars)
  ├── Sheet: portfolio_rollup      (auto-calculated from per-client tabs)
  ├── Sheet: alerts_log            (all alerts, timestamped)
  └── Sheet: [client_id]_data      (one tab per client, universal schema rows)
        ↓
Looker Studio — Agency Portfolio Report  (internal, agency-facing)
Looker Studio — Client Report Template   (duplicated per client, white-labelled)
```

**Pros:** Free, widely understood, strong charting, fine-grained sharing controls, native Sheets data source, viewer-only links for clients.

**Cons:** Manual data ingestion unless automated via Apps Script or a connector (e.g. Supermetrics, Funnel.io, or custom API pull). Looker Studio branding removed only via Community Connector workaround or paid Looker Studio Pro.

**Data refresh:** Set Google Sheets data source refresh to every 15 minutes in Looker Studio. For daily reporting clients, a nightly Apps Script push is sufficient.

---

#### Option B: Airtable Agency Base (Recommended for non-technical teams)

**Architecture:**

```
Universal Schema CSVs / API connectors
        ↓
Airtable — AdPilot Agency Base
  ├── Table: Clients               (one record per client, all {{client.*}} vars)
  ├── Table: Performance_Data      (universal schema rows, linked to Clients)
  ├── Table: Alerts                (linked to Clients, severity + status fields)
  ├── Table: Health_Scores         (daily calculated scores, linked to Clients)
  └── View: Portfolio_Rollup       (grouped by client, summarised)
        ↓
Airtable Interface — Agency Portfolio View  (internal)
Airtable Interface — Client Portal View     (per-client, read-only, shared link)
```

**Pros:** No-code setup, built-in interfaces for client portals, role-based access, automations for alerts, easy onboarding of new clients via record duplication.

**Cons:** Airtable costs scale with records and seats. Client-facing interfaces require Airtable Interface sharing links (no custom domain without workaround). Less charting flexibility than Looker Studio.

**Data refresh:** Airtable automations can trigger on new record creation. Integrate via Zapier, Make, or direct API for automatic data pushes.

---

**Decision rule:** If your team already lives in Google Workspace and you want maximal chart control, use Option A. If your team is non-technical and you want faster onboarding of new clients with less code, use Option B. Both options follow the same Universal Schema and all spec sections below apply to both.

---

## 2. Client Switcher

### Portfolio Home View

The portfolio home is the first screen an agency operator or account manager sees on login. It is a single-page table showing every active client at a glance.

**Table columns (in order):**

| Column | Source / Formula | Notes |
|---|---|---|
| Client Name | `{{client.business_name}}` | Linked to client drill-down |
| Industry | `{{client.industry}}` | Filter-able |
| Platform | `{{client.platform_focus}}` | Meta / TikTok / Both |
| Health Score | Calculated (see Section 5) | Colour-coded badge: Green/Yellow/Orange/Red |
| Status | Manual field | Active / At Risk / Paused / Churned |
| Spend MTD | `SUM(spend)` where date >= first of current month | AUD |
| Budget MTD | `{{client.monthly_budget}}` | AUD |
| Budget Used % | Spend MTD / Budget MTD | Show as progress bar |
| Leads MTD | `SUM(leads)` where date >= first of current month | |
| CPL MTD | Spend MTD / Leads MTD | AUD |
| ROAS MTD | `SUM(revenue)` / Spend MTD | |
| Break-Even ROAS | `1 / {{client.gross_margin}}` | Reference line |
| Last Data Received | MAX(date) in client data | Alert if > 24 hours ago |
| Account Manager | Internal field | For filtering by AM |
| Last Updated | Timestamp of last dashboard refresh | |

**Default sort:** Health Score ascending (worst-performing clients at top).

**Row click / drill-down:** Clicking any client row opens that client's full dashboard. In Looker Studio, implement via filter action or separate report URL. In Airtable, use a linked Interface page.

---

### Quick-Switch Navigation

- **Agency sidebar (permanent):** Always visible on the left. Lists all client names. Clicking any name switches context to that client's dashboard without returning to the portfolio home.
- **Search box:** Type any part of a client name, industry, or account manager name to filter the sidebar list instantly.
- **Breadcrumb:** While inside a client dashboard, the breadcrumb shows `Portfolio Home > {{client.business_name}}` with Portfolio Home as a clickable link back.
- **Keyboard shortcut (Airtable Interface):** Not native; document for users that they should use browser search (Ctrl+F / Cmd+F) on the sidebar if needed.

---

### Client Status Flags

Status is a manually set field, updated by the account manager. It is not auto-calculated but can be prompted by alerts (e.g. an alert recommends changing status to "At Risk").

| Status | Definition | Visual Treatment |
|---|---|---|
| Active | Client is live, ads running, contract current | Green dot |
| At Risk | Health score < 60 for 2+ consecutive weeks, or CPA > break-even, or client has raised concerns | Amber dot |
| Paused | Ads intentionally paused (seasonal, budget hold, creative refresh) | Grey dot |
| Churned | Client has ended the engagement | Red dot — row greyed out |

**Status change rule:** Changing a client from Active to Churned requires the account manager to type `YES` in a confirmation prompt before the record saves. This prevents accidental churn flags. No data is deleted — the client record and all historical data are archived.

---

### Sort and Filter Controls

The portfolio home table must support the following filters simultaneously:

- **Health Score band:** All / Green (80–100) / Yellow (60–79) / Orange (40–59) / Red (0–39)
- **Status:** All / Active / At Risk / Paused / Churned
- **Industry:** Dropdown of all unique `{{client.industry}}` values in the base
- **Platform:** All / Meta / TikTok / Both
- **Account Manager:** All / [list of AM names]
- **Spend MTD range:** Min / Max AUD sliders
- **ROAS:** Above break-even / Below break-even / All

**Sort options:** Health Score (asc/desc), Spend MTD (asc/desc), ROAS (asc/desc), Client Name (A–Z), Last Data Received (oldest first is default for data gap detection).

In Looker Studio: implement filters as filter controls linked to all charts on the portfolio page. In Airtable: implement as grouped views with filter conditions saved per view.

---

## 3. Per-Client Branding

### Applying Client Branding

Each client's dashboard view must look like it was built for them, not by AdPilot OS. The following branding elements are configurable per client.

**Branding fields in the Clients config record:**

| Field Name | Format | Example |
|---|---|---|
| `client.logo_url` | URL to hosted image (PNG, transparent background, min 400px wide) | `https://cdn.example.com/logo.png` |
| `client.primary_colour` | Hex code | `#1A2E4A` |
| `client.secondary_colour` | Hex code | `#F4A623` |
| `client.accent_colour` | Hex code | `#FFFFFF` |
| `client.font_primary` | Google Font name or system font | `Inter` |
| `client.font_secondary` | Google Font name or system font | `Merriweather` |
| `client.report_name` | Name shown on report cover | `Example Co — Ads Performance Report` |
| `client.slug` | URL-safe lowercase string | `example-co` |
| `client.contact_name` | Client's primary contact first name | `Sarah` |

---

### Client-Specific Cover Page / Header

Every client report begins with a cover page or header section containing:

1. Client logo (`client.logo_url`) — top left, max height 80px
2. Report title (`client.report_name`)
3. Reporting period (auto-populated: "Month to Date" / "Last 30 Days" / as configured)
4. Date generated (auto-populated)
5. Prepared by line (agency name — NOT "AdPilot OS"; use the agency's own trading name stored in a global config variable `{{agency.name}}`)
6. A thin colour bar using `client.primary_colour` as a design element

The cover page contains no AdPilot OS branding, no AdPilot OS logo, and no mention of the underlying tool.

In Looker Studio: use a dedicated cover page with a text box for the report title (linked to a Sheets cell containing `client.report_name`), an image element pointed at `client.logo_url`, and a shape element coloured with `client.primary_colour`. Note: Looker Studio does not dynamically pull hex colours from data — set the colour manually per duplicated template.

In Airtable: the Interface header block supports logo upload and colour theming per interface. Set these on initial client setup.

---

### URL Slug and Shared Link Per Client

Each client gets a unique, persistent link to their read-only dashboard.

**Looker Studio approach:**
- Each client has their own duplicated Looker Studio report with a unique URL.
- Store the URL in the client config: `client.report_url`.
- Optionally, use a redirect service or agency domain (e.g. Rebrandly, short.io) to create a custom slug:
  `adpilot.agency/client/{{client.slug}}` → redirects to the Looker Studio viewer URL.
- The Looker Studio URL itself is long and branded by Google. The redirect URL is what you share with clients.

**Airtable approach:**
- Each client Interface page has a unique shared link generated by Airtable.
- Store this in `client.portal_url` in the Clients table.
- Apply the same redirect approach for a clean URL.

**Link management rules:**
- Never rotate a client's shared link without notifying them and updating the `client.portal_url` field.
- Links must be password-protected or restricted to viewer access only (no edit access).
- Document the link in the client's onboarding record at setup.

---

### Removing AdPilot OS Branding (White-Label)

The Agency tier includes full white-label rights. To remove all AdPilot OS identity from client-facing deliverables:

1. **Report footers:** Remove any "Powered by AdPilot OS" text from all templates. Replace with `{{agency.name}}` or leave blank.
2. **Shared link domain:** Use a custom redirect domain registered to the agency (not adpilot.agency unless the agency has purchased that domain).
3. **Email reports:** Send automated report emails from the agency's own email domain (e.g. reports@youragency.com.au), not from any AdPilot-branded sender.
4. **PDF exports:** The PDF cover page shows only client branding and agency branding. No AdPilot OS logo, URL, or mention.
5. **Looker Studio "Made with Looker Studio" watermark:** This cannot be removed in the free tier. Looker Studio Pro ($9 USD/user/month) allows watermark removal. Document this cost in your agency pricing if relevant. Alternatively, export reports as PDF and deliver PDFs to clients — the watermark does not appear in PDF exports when using "Download as PDF" from the Looker Studio menu.
6. **Airtable branding:** Airtable Interface shared links show an "Airtable" badge in the browser tab favicon. This cannot be removed without a custom domain workaround (requires embedding via iframe on an agency-owned page).

---

### Template Duplication Workflow for Onboarding a New Client

This process takes approximately 20–40 minutes per new client when all assets are ready.

#### Looker Studio Path

**Step 1 — Duplicate the master client report template:**
- Open the AdPilot OS Master Client Report (kept as a locked template, never used directly for any client).
- Click the three-dot menu → "Make a copy."
- Name the copy: `[YYYY-MM] — {{client.business_name}} — AdPilot Report`
- Set the data source to the new client's Sheets tab (created in Step 3 of the Onboarding Checklist).

**Step 2 — Apply client branding:**
- Cover page: Upload client logo as an image element. Update the report title text. Update the colour bar fill colour to `client.primary_colour`.
- Theme: Open Report Settings → Theme and Layout → Customise. Set primary colour to `client.primary_colour`, secondary to `client.secondary_colour`. Apply.
- Font: Set body font to `client.font_primary` and header font (if different) to `client.font_secondary`. If the font is not available in Looker Studio, default to the closest match (Inter is the safe fallback).

**Step 3 — Configure break-even reference lines:**
- Locate all scorecards and charts that reference `break_even_cpa` and `break_even_roas`.
- Update the static reference line values to match the client's calculated thresholds:
  - Break-even CPA = `{{client.average_sale_value}}` × `{{client.gross_margin}}`
  - Break-even ROAS = `1 / {{client.gross_margin}}`

**Step 4 — Set sharing permissions:**
- Click Share → Manage Access.
- Add the client contact's email as a Viewer (not Editor).
- Enable "Anyone with the link can view" only if the client does not have a Google account. Prefer named viewer access.
- Copy the report URL and store it in `client.report_url` in the Clients config sheet.

**Step 5 — Create redirect URL:**
- Log in to your redirect service (e.g. Rebrandly).
- Create: `youragency.com.au/client/{{client.slug}}` → `client.report_url`
- Store the slug URL in `client.portal_url`.

**Step 6 — Test the client view:**
- Open an incognito window.
- Navigate to `client.portal_url`.
- Confirm: client logo visible, client colours applied, no AdPilot OS branding, no other clients' data visible, all metrics populated correctly, break-even lines set correctly.

---

#### Airtable Path

**Step 1 — Duplicate the Client Interface template:**
- Open the AdPilot Agency Base in Airtable.
- Go to Interfaces → select "Client Portal Template" → click the three-dot menu → "Duplicate."
- Rename: `{{client.business_name}} Portal`

**Step 2 — Link the interface to the client record:**
- In the duplicated interface, update all "Record" filter conditions from the template client to the new client's record ID.
- Confirm every data block on the interface is filtered to `Clients → Name = {{client.business_name}}` (or linked record ID).

**Step 3 — Apply branding:**
- Interface Settings → Theme: upload `client.logo_url`, set primary colour to `client.primary_colour`.
- Update the interface header text to `client.report_name`.

**Step 4 — Generate and store the shared link:**
- Interface Settings → Sharing → Enable shared link → copy URL.
- Store in `client.portal_url` in the Clients table record.
- Create a redirect URL as above.

**Step 5 — Test:**
- Open the shared link in incognito.
- Confirm only this client's data is visible, branding is correct, no edit access is available.

---

## 4. Portfolio Roll-Up View

The portfolio roll-up is a single-page summary of all active clients combined. It answers the question: "How is the portfolio performing right now?"

This view is **internal only** — never share the roll-up page with clients.

---

### Spend Summary

**Cards displayed:**

| Metric | Formula | Date Range Options |
|---|---|---|
| Total Spend — MTD | `SUM(spend)` across all clients, current month | MTD |
| Total Spend — Last 30 Days | `SUM(spend)` across all clients, rolling 30 days | Rolling |
| Total Spend — Last 90 Days | `SUM(spend)` across all clients, rolling 90 days | Rolling |
| Total Budget — MTD | `SUM({{client.monthly_budget}})` across all active clients | MTD |
| Budget Utilisation % | Total Spend MTD / Total Budget MTD | MTD |

Date range is controlled by a single date selector at the top of the roll-up page that updates all cards simultaneously.

---

### Aggregate Performance Metrics

| Metric | Formula |
|---|---|
| Total Leads | `SUM(leads)` across all clients for selected period |
| Total Purchases | `SUM(purchases)` across all clients for selected period |
| Total Revenue (reported) | `SUM(revenue)` across all clients for selected period |
| Portfolio ROAS (weighted) | `SUM(revenue)` / `SUM(spend)` — not an average of averages |
| Portfolio CPL | `SUM(spend)` / `SUM(leads)` |
| Portfolio CPA | `SUM(spend)` / `SUM(purchases)` |

**Note on weighted ROAS:** Do not average the ROAS values of individual clients. Always calculate as total revenue divided by total spend across the portfolio. A client spending $50K with ROAS 8 should outweigh a client spending $2K with ROAS 2. The formula `SUM(revenue)/SUM(spend)` achieves this correctly.

---

### Agency Revenue Tracking

If the agency charges a percentage of ad spend or a flat retainer, this can be tracked in the roll-up.

**Fields required in the Clients config per client:**

| Field | Format | Example |
|---|---|---|
| `client.fee_structure` | Dropdown: `flat_retainer` / `percent_of_spend` / `hybrid` | `percent_of_spend` |
| `client.retainer_amount` | AUD, monthly | `3500` |
| `client.percent_of_spend` | Decimal | `0.12` (= 12%) |

**Calculated agency revenue per client (MTD):**
- Flat retainer: `client.retainer_amount` (prorated if partial month)
- Percent of spend: `client.percent_of_spend` × Spend MTD
- Hybrid: `client.retainer_amount` + (`client.percent_of_spend` × Spend MTD)

**Portfolio agency revenue card:** `SUM(agency_revenue_calculated)` across all active clients for the selected period.

This data is **internal only**. It never appears on client-facing dashboards.

---

### Portfolio Health Distribution

A visual breakdown of how many clients fall into each health score band.

**Display format — Donut chart or horizontal bar:**

| Band | Colour | Count | % of Active Clients |
|---|---|---|---|
| Green (80–100) | #22C55E | Dynamic | Dynamic |
| Yellow (60–79) | #EAB308 | Dynamic | Dynamic |
| Orange (40–59) | #F97316 | Dynamic | Dynamic |
| Red (0–39) | #EF4444 | Dynamic | Dynamic |

Calculated as: count of active clients whose current health score falls within each band.

**Target benchmark for a healthy agency portfolio:** 70%+ of clients in Green, fewer than 10% in Red.

---

### Clients Needing Attention

A filtered sub-table within the roll-up showing only clients meeting at least one of these conditions:

- Health Score < 60 (Orange or Red band)
- CPA MTD > break-even CPA (`{{client.average_sale_value}}` × `{{client.gross_margin}}`)
- ROAS MTD < break-even ROAS (`1 / {{client.gross_margin}}`)
- No data received in last 24 hours (tracking gap)
- Status = "At Risk"

**Columns in this sub-table:**

| Column | Notes |
|---|---|
| Client Name | Linked to drill-down |
| Health Score | With colour badge |
| Issue Flag | Plain English reason (e.g. "CPA over break-even", "No data 48h") |
| Days in Current State | How many consecutive days the issue has existed |
| Account Manager | Who owns this client |
| Recommended Action | Short text pulled from the alerts system |

This sub-table is sorted by Health Score ascending (worst first). It is the agency director's morning priority list.

---

## 5. Per-Client Health Scores

### Health Score Display in Portfolio View

Each client row in the portfolio home shows:

- **Score number** (0–100, one decimal place, e.g. 73.4)
- **Band label** (Green / Yellow / Orange / Red)
- **Colour badge** matching the band

The score is recalculated each time the data source refreshes (daily minimum, up to every 15 minutes in Looker Studio with live connectors).

---

### Health Score Calculation — Component Weights

The health score is a weighted sum of 13 components. Each component scores 0–100, then is multiplied by its weight. Maximum total: 100 points.

| # | Component | Weight | How It Scores |
|---|---|---|---|
| 1 | Tracking integrity | 15% | 100 if `tracking_status = "verified"` for all active ads in last 7 days; 50 if partial; 0 if no tracking or gaps > 24h |
| 2 | CPA vs break-even | 15% | 100 if CPA ≤ 70% of break-even CPA; 75 if 70–90%; 50 if 90–110%; 25 if 110–150%; 0 if > 150% or no purchase data |
| 3 | Spend efficiency | 12% | 100 if spend pacing is within 5% of expected daily rate; degrades proportionally for under/over-pacing |
| 4 | Conversion rate | 10% | Benchmarked against `{{client.industry}}` median CVR. 100 if > 120% of benchmark; scales down to 0 if < 40% of benchmark |
| 5 | CTR | 8% | Meta benchmark 1.0–1.5%. TikTok benchmark 0.8–1.2%. 100 if above upper benchmark; scales to 0 if < 0.3% |
| 6 | Lead quality | 8% | `lead_quality_score` average for last 30 days. Score of 8–10 = 100 pts; 6–7 = 75; 4–5 = 50; < 4 = 0. If no lead quality scoring, default to 50 (neutral) |
| 7 | Creative freshness | 8% | 100 if at least one ad creative was added or activated in the last 14 days; 50 if last refresh was 15–30 days ago; 0 if > 30 days since any new creative |
| 8 | CPC | 7% | Benchmarked against `{{client.industry}}` and `{{client.platform_focus}}`. 100 if CPC ≤ 80% of benchmark; scales to 0 if CPC > 200% of benchmark |
| 9 | Naming convention | 5% | 100 if all active campaigns, adsets, and ads follow the AdPilot OS naming convention (verified by naming parser); 0 if not — cannot be partially scored |
| 10 | Offer strength | 5% | Manual score set by account manager (0–100). Must be reviewed monthly. Default 50 on new client setup |
| 11 | Landing page alignment | 4% | Manual score set by account manager after quarterly LP audit. Default 50 on setup |
| 12 | Budget pacing | 2% | 100 if MTD spend is within 10% of expected pacing; degrades to 0 if > 30% off pace |
| 13 | Data confidence | 1% | 100 if at least 30 days of data in universal schema for this client; 50 if 15–29 days; 0 if < 15 days |

**Total health score formula:**

```
health_score = (
  (tracking_score × 0.15) +
  (cpa_score × 0.15) +
  (spend_efficiency_score × 0.12) +
  (conversion_rate_score × 0.10) +
  (ctr_score × 0.08) +
  (lead_quality_score × 0.08) +
  (creative_freshness_score × 0.08) +
  (cpc_score × 0.07) +
  (naming_score × 0.05) +
  (offer_strength_score × 0.05) +
  (lp_alignment_score × 0.04) +
  (budget_pacing_score × 0.02) +
  (data_confidence_score × 0.01)
)
```

All component scores are calculated in the Google Sheets Health_Score tab or Airtable formula fields. The final score is rounded to one decimal place.

---

### Drill-Down to Component Scores

When an agency operator opens a client's dashboard, the health score section shows:

1. **Overall score badge** (large, prominent)
2. **Component score breakdown table** — all 13 components, their weight, their raw score, and their weighted contribution
3. **Lowest three components** — highlighted in the UI with a "Fix this" label and a plain-English explanation of what is dragging the score down

**Example component breakdown display:**

| Component | Weight | Score | Contribution | Status |
|---|---|---|---|---|
| Tracking integrity | 15% | 100 | 15.0 | Green |
| CPA vs break-even | 15% | 50 | 7.5 | Orange — CPA is 115% of break-even |
| Spend efficiency | 12% | 75 | 9.0 | Yellow |
| ... | | | | |
| **Total** | **100%** | | **73.4** | **Yellow** |

---

### Health Score Trend

The health score is stored as a daily snapshot in the Health_Scores table/sheet. The trend display shows:

- **7-day sparkline** (small inline chart): last 7 daily scores for quick visual direction
- **Week-over-week delta:** `score_today − score_7_days_ago`, displayed as +/− with colour (green for improvement, red for decline)
- **Trend label:** Improving (delta > +5), Stable (delta −5 to +5), Declining (delta < −5)

The daily snapshot must be created by an automated process (Apps Script timer trigger daily at 11:59 PM local time, or Airtable automation triggered at midnight) to preserve history. Do not rely on live calculation only — the historical snapshots are the source of truth for trend data.

---

### Automated Health Score Calculation

The health score is never entered manually (except for the two manual components: offer strength and landing page alignment, which are overridden by the AM).

**Calculation trigger:**
- Looker Studio: Health score is a calculated metric in the Google Sheets formula layer. It recalculates whenever the source data sheet refreshes.
- Airtable: Health score fields are Formula fields in the Health_Scores table. They recalculate on every record update.

**Data requirements for a valid health score:**
- At least 7 days of data in the universal schema for this client
- `tracking_status` field populated for all active ad records
- `{{client.average_sale_value}}` and `{{client.gross_margin}}` configured
- `{{client.monthly_budget}}` configured

If any required field is missing, the health score returns `null` and displays as "Insufficient data" with a prompt to complete client configuration.

---

## 6. Alerts System

### Alert Types

All alerts are generated by comparing universal schema data against client-configured thresholds. Alerts are not opinions — they are triggered by specific, objective conditions.

| Alert ID | Name | Trigger Condition | Default Severity |
|---|---|---|---|
| A01 | CPA Over Break-Even | CPA (last 7 days) > `{{client.average_sale_value}}` × `{{client.gross_margin}}` | Critical |
| A02 | ROAS Below Break-Even | ROAS (last 7 days) < `1 / {{client.gross_margin}}` | Critical |
| A03 | Tracking Issue — Pixel Gap | `tracking_status != "verified"` for any active ad for > 24 hours | Critical |
| A04 | Tracking Issue — Conversion Event Missing | Zero purchase events recorded despite active purchase-objective campaigns for > 48 hours | Critical |
| A05 | Budget Exhaustion Imminent | Projected daily spend rate will exhaust remaining monthly budget in < 5 days | Warning |
| A06 | Budget Under-Pacing | MTD spend is < 70% of expected pacing at current point in month | Warning |
| A07 | Creative Fatigue — CTR Decline | CTR for any active ad declined > 20% compared to its 7-day average, sustained for 3+ consecutive days | Warning |
| A08 | Creative Fatigue — Hook Rate Decline | `hook_rate` (3-second views / impressions) declined > 25% vs prior 7-day average for any ad with > 5,000 impressions in the period | Warning |
| A09 | No Data Received | No new rows added to client's universal schema data for > 24 hours | Critical |
| A10 | Frequency Too High | Campaign-level frequency > 3.5 (Meta only) for last 7 days | Warning |
| A11 | CPL Spike | CPL increased > 40% vs prior 7-day average | Warning |
| A12 | Health Score Drop | Health score declined by > 10 points week-over-week | Warning |
| A13 | Naming Convention Violation | New campaign, adset, or ad created that does not match the AdPilot OS naming convention | Info |
| A14 | Lead Quality Drop | `lead_quality_score` average declined > 1.5 points vs prior 30-day average | Warning |

---

### Alert Severity Levels

| Severity | Colour | Meaning | Response SLA |
|---|---|---|---|
| Critical | Red (#EF4444) | Immediate action required; money is being wasted or tracking is broken | Within 2 hours during business hours |
| Warning | Amber (#F97316) | Action required soon; performance is deteriorating | Within 1 business day |
| Info | Blue (#3B82F6) | Awareness only; no immediate action required | Within 3 business days |

---

### Alert Routing

Each alert has two routing options that can be configured independently:

**Internal Routing (agency team):**
- Slack notification to a designated agency channel (e.g. `#adpilot-alerts`) via webhook
- Email to the assigned account manager's address
- Both Slack and email by default for Critical; email only for Warning and Info

**Client-Facing Routing:**
- Most alerts are internal only and must not be sent to the client.
- The following alerts may be configured as client-facing (off by default, enable per client):
  - A05 (Budget Exhaustion Imminent) — client may want to top up budget
  - A06 (Budget Under-Pacing) — client may want to authorise reallocation
  - A12 (Health Score Drop) — for transparent client relationships
- Client-facing alerts are sent as plain-English summary emails only. They do not include internal cost data, health score component breakdowns, or competitor context.
- Client-facing alert template subject line: `Performance Update — {{client.business_name}} — [Alert Name]`

**Alert routing configuration (per client in config record):**

| Field | Options | Default |
|---|---|---|
| `client.alert_slack_channel` | Slack channel name | `#adpilot-alerts` |
| `client.alert_email_am` | Account manager email | Required |
| `client.alert_email_director` | Director email (Critical only) | Optional |
| `client.alert_client_email` | Client contact email | Optional |
| `client.alert_client_routing` | Which alert IDs to send to client | `[]` (empty = none) |

---

### Alert Log

All alerts are recorded in the Alerts_Log table/sheet regardless of routing configuration.

**Alert log columns:**

| Column | Description |
|---|---|
| `alert_id` | Auto-incremented unique ID |
| `client_id` | Linked to client record |
| `client_name` | `{{client.business_name}}` |
| `alert_type` | A01–A14 code |
| `alert_name` | Human-readable name |
| `severity` | Critical / Warning / Info |
| `triggered_at` | ISO 8601 datetime |
| `trigger_value` | The metric value that triggered the alert (e.g. "CPA: $142.30") |
| `threshold_value` | The break-even or benchmark value (e.g. "Break-even CPA: $120.00") |
| `status` | Open / Acknowledged / Resolved |
| `acknowledged_by` | Account manager name |
| `acknowledged_at` | Datetime |
| `resolution_notes` | Free text; what was done |
| `resolved_at` | Datetime |
| `notified_channels` | Comma-separated list of where the alert was sent |
| `client_notified` | Boolean |

**Alert deduplication rule:** Do not create a new alert record for the same alert type and client if an Open alert of that type already exists. Update the `triggered_at` timestamp instead. This prevents alert floods when a condition persists.

**Alert auto-resolve rule:** When the condition that triggered an alert no longer exists at the next data refresh, the alert status is automatically updated to "Resolved" with a note: "Auto-resolved — condition no longer met." The account manager still reviews resolved alerts in the weekly summary.

---

## 7. Client-Facing Read-Only View

### What the Client Sees

The client portal shows only their own data. There is zero risk of a client seeing another client's name, data, or any agency internal metrics.

**Sections visible to the client:**

1. **Summary Header** — `{{client.business_name}}` logo, reporting period, health score (simplified label only: "Your campaigns are performing well / need attention / require urgent review" — no numeric score shown to client by default)
2. **Spend Summary** — Total spend for the period, budget remaining (if applicable)
3. **Lead Performance** — Total leads, CPL, CPL trend vs prior period
4. **Purchase Performance** (if applicable) — Total purchases, CPA, ROAS
5. **MER (Marketing Efficiency Ratio)** — Labelled as "Overall Marketing Return" for client readability. Formula: `total_revenue / total_ad_spend`. Requires client to provide total revenue separately or via CRM integration.
6. **Top 3 Campaigns** — By spend, showing leads/purchases and CPL/CPA per campaign
7. **Top 3 Creatives** — By CTR or hook rate, with the ad name (or thumbnail if image hosting is set up), impressions, CTR, and leads
8. **Platform Breakdown** — If client runs both Meta and TikTok, a simple side-by-side: spend / leads / CPL per platform
9. **Period-over-period comparison table** — Current period vs prior period for all key metrics, with delta and directional arrows

---

### Metrics Hidden From Client

The following data is **never** shown on the client-facing view, regardless of configuration:

- Agency fee, retainer amount, or percentage of spend
- Gross margin figures
- Break-even calculations (shown internally; client sees "Target CPA: $X" only if the agency chooses to display it)
- Health score numeric value and component breakdown
- Competitor performance data
- Other clients' names, industries, or data
- Internal recommendation text or agency notes
- Alert log detail
- Universal schema raw data table
- `lead_quality_score` raw values (optional: show "Lead Quality: Good/Fair/Poor" as a simplified label)
- Account-level ad account IDs, pixel IDs, or any platform credentials

---

### Read-Only Access Method

**Looker Studio:**
- Set sharing to "Viewer" role for the client's email address.
- If the client does not have a Google account, enable "Anyone with the link can view" and use the redirect URL.
- Viewers cannot edit, download raw data, or see edit history.
- For additional security, enable Looker Studio's report-level password (available in Looker Studio Pro only).

**Airtable:**
- Use Airtable Interface shared links. Shared links are view-only by default — the viewer cannot access the underlying base, tables, or other interfaces.
- Shared link access does not require the client to have an Airtable account.
- Do not add the client as a base collaborator — this would give them access to the full base structure.

**Access control rules:**
- One unique link per client. Links are not shared between clients.
- If a client link is compromised (shared publicly without permission), regenerate the link and update `client.portal_url` immediately.
- Access links expire after 12 months unless renewed. Set a calendar reminder at client setup.

---

### Report Delivery Frequency

**Automated delivery options:**

| Option | Frequency | Method |
|---|---|---|
| Weekly | Every Monday morning (by 8:00 AM client time) | Automated email with PDF export attached |
| Monthly | First Monday of each month | Automated email with PDF export attached |
| On-Demand | Client accesses portal link at any time | Live dashboard (always current as of last data refresh) |

**Recommended approach for Agency tier:** The client portal link is always live. Send a formatted summary email (not just the link) on the configured `{{client.reporting_frequency}}` schedule. The email is a plain-English summary with 3–5 key numbers and a "View full report" button linking to the portal.

**Email summary structure:**
```
Subject: {{client.business_name}} — Ads Report — [Period]

Hi {{client.contact_name}},

Here's your ads performance summary for [period]:

- Spend: $X
- Leads: X (CPL: $X)
- ROAS: X
- [One-line commentary on most notable result]

View your full report: [portal link]

[Agency name & contact details]
```

No AdPilot OS branding in this email. Sent from the agency's email domain.

**Manual delivery:** Account manager can trigger an immediate PDF export from Looker Studio or Airtable and email directly. Document this as an option for client QBRs or ad hoc requests.

---

### Client Dashboard Branding Rules

The client-facing dashboard shows:
- Client's own logo (`client.logo_url`)
- Client's colour scheme (`client.primary_colour`, `client.secondary_colour`)
- Agency name (`{{agency.name}}`) in the footer — small, not prominent
- No AdPilot OS name, logo, or URL
- No other client names, logos, or references

The client experience should feel like the agency built this dashboard specifically for them. If the client asks "what tool did you build this in?" the answer is at the agency's discretion — the white-label configuration supports either disclosing the tool or describing it as "our proprietary reporting platform."

---

## 8. Onboarding Checklist

This checklist covers everything required to add a new client to the agency dashboard and make their client portal live. Estimated time: 20–40 minutes with all assets in hand.

Complete all steps in order. Do not share the client portal link until Step 9 (testing) is passed.

---

### Step 1 — Create Client Business Record

**Action:** Add a new client record to the Clients config (Sheets tab or Airtable table).

**Fields to populate:**

| Field | Source | Notes |
|---|---|---|
| `client.business_name` | Client brief | Required |
| `client.industry` | Client brief | Use standard category list |
| `client.location` | Client brief | City/region, not full address |
| `client.currency` | AUD unless specified | |
| `client.platform_focus` | Contract | Meta / TikTok / Both |
| `client.reporting_frequency` | Contract | Weekly / Monthly |
| `client.contact_name` | Client brief | |
| `client.contact_email` | Client brief | |
| `client.slug` | Derived | e.g. `example-co` — lowercase, hyphens only |
| `client.fee_structure` | Contract | flat_retainer / percent_of_spend / hybrid |
| `client.retainer_amount` | Contract | AUD, 0 if not applicable |
| `client.percent_of_spend` | Contract | 0 if not applicable |
| Account Manager | Internal | Assign from AM list |
| Status | Set to "Active" | |

**Deliverable:** Client record created with a unique `client_id`.

---

### Step 2 — Configure {{client.*}} Variables

**Action:** Complete all configuration variables required for calculations and thresholds.

| Field | Source | Why It's Required |
|---|---|---|
| `client.main_offer` | Client brief | For naming conventions and creative context |
| `client.average_sale_value` | Client | For break-even CPA calculation |
| `client.gross_margin` | Client | For break-even CPA and ROAS calculation |
| `client.monthly_budget` | Contract | For spend pacing and budget alerts |

**Calculated and store immediately:**

```
break_even_cpa = client.average_sale_value × client.gross_margin
break_even_roas = 1 / client.gross_margin
```

Store `break_even_cpa` and `break_even_roas` in the client config record. These are reference values — do not recalculate them dynamically from the config every time; store them once and update only when the client's margin or pricing changes.

**Deliverable:** All {{client.*}} variables populated. Break-even thresholds stored.

---

### Step 3 — Connect Data Source

**Action:** Connect the client's ad account data to the universal schema.

**Sub-steps:**

3a. Confirm which ad accounts are in scope. Get the account IDs from the client or platform access.

3b. Grant AdPilot OS the necessary platform access:
- Meta: Add the agency's Business Manager as a partner on the client's ad account with Advertiser access.
- TikTok: Add the agency's Business Center as a partner on the client's ad account with Analyst or Advertiser access.

3c. Set up the data pull method:
- **Manual CSV export:** Client or agency exports the universal schema CSV from each platform and uploads to the client's data tab in Sheets or Airtable. Suitable for monthly reporting clients.
- **Automated connector:** Configure Supermetrics, Funnel.io, or custom API pull to push data into the client's sheet/table on a daily schedule. Required for weekly or real-time reporting clients.

3d. Map platform fields to universal schema columns. Refer to the Universal Schema mapping guide for Meta and TikTok field names.

3e. Verify at least 7 days of historical data is populated in the universal schema for this client.

**Deliverable:** Client's universal schema data tab/table populated with at least 7 days of rows. Data refresh schedule confirmed and tested.

---

### Step 4 — Set Break-Even Thresholds in Dashboard

**Action:** Update all reference lines and threshold markers in the client's dashboard template.

**In the client's Looker Studio report:**
- Locate every chart and scorecard that uses a break-even reference line.
- Update static reference values to `break_even_cpa` and `break_even_roas` from Step 2.
- Update the "Target CPA" label text to show the actual AUD value.

**In Airtable Interface:**
- Update any filter conditions or conditional colour rules that reference break-even thresholds.

**Deliverable:** Break-even lines correctly set in the client's dashboard. Verify by checking that the ROAS scorecard shows the break-even line at the correct value.

---

### Step 5 — Configure Alerts

**Action:** Enable alert monitoring for this client and configure routing.

5a. In the Alerts configuration (Sheets alert_config tab or Airtable Alerts table):
- Enable all alert types A01–A14 for this client (all are on by default for new clients).
- Set `client.alert_email_am` to the assigned AM's email.
- Set `client.alert_slack_channel` to the appropriate Slack channel.
- Set `client.alert_email_director` if applicable.

5b. Confirm client-facing alert routing:
- By default, `client.alert_client_routing` = `[]` (no alerts sent to client).
- If the client contract specifies proactive communication on budget or health, enable A05 and/or A12.

5c. Set custom thresholds if the client's business warrants deviation from defaults:
- High-volume lead gen clients may set a CTR decline threshold of 30% instead of 20% (A07).
- E-commerce clients with thin margins may want A01 triggered at 90% of break-even rather than 100%.
- Document any custom thresholds in the client record's `notes` field.

5d. Test the alert system by temporarily setting a threshold to a value the current data will breach. Confirm the alert fires, appears in the Alerts_Log, and routes to the correct Slack channel and email. Then reset the threshold.

**Deliverable:** All alerts enabled and tested. Routing confirmed.

---

### Step 6 — Brand the Dashboard

**Action:** Apply client branding to their Looker Studio report or Airtable Interface.

6a. Obtain from the client:
- Logo file (PNG, transparent background, high resolution — minimum 800px wide)
- Hex codes for primary and secondary brand colours
- Preferred font (or confirm to use default)
- Report name preference

6b. Upload logo to a stable hosting URL (Google Drive with public share link, or a CDN). Store URL in `client.logo_url`.

6c. Follow the "Template Duplication Workflow" in Section 3 to apply all branding elements.

6d. Set the `client.slug` and create the redirect URL. Store in `client.portal_url`.

**Deliverable:** Client-branded dashboard live. Redirect URL working. All AdPilot OS branding removed from client view.

---

### Step 7 — Share Read-Only Link

**Action:** Configure access for the client contact.

7a. **Looker Studio:** Add `client.contact_email` as a Viewer. Or, if the client does not use Google, enable link-based viewing on the redirect URL.

7b. **Airtable:** Generate the Interface shared link. No email required.

7c. Store the final portal URL in `client.portal_url`.

7d. Store the access method (email-restricted / link-only) in the client record.

**Deliverable:** Client access configured. Do not send the link to the client yet — complete Step 8 first.

---

### Step 8 — Internal QA Check

**Action:** Test the complete setup before going live.

QA checklist — complete every item:

- [ ] Open the client portal in an incognito window. Confirm no AdPilot OS branding is visible.
- [ ] Confirm client logo appears correctly and is not distorted.
- [ ] Confirm client colours are applied to the header, charts, and accent elements.
- [ ] Confirm all metrics display real data (not zeros, not template placeholders).
- [ ] Confirm the date range selector works and updates all metrics.
- [ ] Confirm break-even reference lines are set to the correct AUD values.
- [ ] Confirm no other clients' data is accessible from this portal.
- [ ] Confirm the redirect URL (`adpilot.agency/client/{{client.slug}}`) resolves correctly.
- [ ] Confirm the client portal has no edit access — attempt to modify a data point and confirm it is blocked.
- [ ] Confirm at least one alert (any severity) has fired and appeared in the Alerts_Log.
- [ ] Confirm the client's health score is calculating (not returning null).
- [ ] Confirm the client record appears in the portfolio home view with correct status and health score.
- [ ] Confirm agency revenue calculation is correct for this client's fee structure.

**Deliverable:** All QA items checked. Any failures resolved before proceeding.

---

### Step 9 — Share With Client

**Action:** Send the portal link and onboarding communication to the client.

9a. Send a welcome email to `client.contact_name` at `client.contact_email` from the agency email domain. Include:
- A brief explanation of what the dashboard shows
- The portal URL (`client.portal_url`)
- How to read the health score (simplified explanation, not the full component breakdown)
- Who to contact at the agency with questions
- When they can expect their first automated report email

9b. No attachment required for the welcome — the live dashboard is the deliverable.

9c. Update the client record field `onboarding_complete = true` and `onboarding_date = today`.

**Deliverable:** Client has access to their portal. Onboarding documented in the client record.

---

## 9. Agency Pricing Tier Notes

### Features by Tier

AdPilot OS is offered at three tiers. The Agency tier is required for everything in this spec.

| Feature | Solo | Pro | Agency |
|---|---|---|---|
| Number of clients | 1 | 1–4 | 5–50+ |
| Portfolio roll-up view | No | No | Yes |
| Client switcher | No | No | Yes |
| Multi-client alerts | No | No | Yes |
| Alert routing to Slack | No | Yes | Yes |
| Per-client branding | No | No | Yes |
| White-label client portals | No | No | Yes |
| Custom redirect URL per client | No | No | Yes |
| Client-facing read-only dashboard | No | No | Yes |
| Automated PDF report delivery | No | Yes | Yes |
| Agency revenue tracking | No | No | Yes |
| Health score — portfolio comparison | No | No | Yes |
| Priority support SLA | No | 2 business days | 4 business hours |
| Onboarding assistance | Self-serve | Self-serve | Done-with-you setup call |
| Template updates included | Yes | Yes | Yes |
| White-label rights | No | No | Yes |
| Custom industry benchmarks | No | No | Yes |
| Zapier / Make integration templates | No | Yes | Yes |

---

### Suggested Resale Pricing Structure

The following pricing is a suggested framework for agencies reselling AdPilot OS as part of their service offering. Agencies may adjust based on their market positioning. All figures are AUD.

**Option A — Bundled into retainer (most common):**

The agency includes AdPilot OS infrastructure, reporting, and strategy as part of a fixed monthly retainer. The client is not billed separately for the tool. The agency's total retainer price reflects the value of the operating system.

Suggested retainer ranges by ad spend under management:

| Client Monthly Ad Spend | Suggested Retainer Range |
|---|---|
| $0–$5,000/month | $1,500–$2,500/month |
| $5,001–$15,000/month | $2,500–$4,500/month |
| $15,001–$30,000/month | $4,500–$7,500/month |
| $30,001–$60,000/month | $7,500–$12,000/month |
| $60,001+/month | $12,000+ or % of spend |

**Option B — Percentage of ad spend:**

Agency charges a management fee of 12–20% of monthly ad spend under management, with a minimum retainer floor.

| Tier | % of Spend | Minimum Monthly |
|---|---|---|
| Entry | 20% | $1,500 |
| Growth | 15% | $2,500 |
| Scale | 12% | $5,000 |

**Option C — Hybrid (retainer + performance bonus):**

Base retainer covering strategy, management, and reporting (at the "Bundled into retainer" rates above) plus a performance bonus triggered when:
- Portfolio ROAS exceeds the target ROAS agreed at contract start, OR
- Monthly revenue generated by ads exceeds a pre-agreed threshold

Performance bonus example: 10% of revenue above the target threshold, capped at 2× the base retainer. This aligns agency incentives with client results and is the highest-margin structure at scale.

---

### Agency Cost Structure Reference

When pricing AdPilot OS services, account for:

| Cost Item | Typical Cost (AUD/month) |
|---|---|
| Looker Studio Pro (if removing watermarks) | ~$14/user/month |
| Airtable (Team plan) | ~$27/user/month |
| Google Sheets / Workspace | ~$18/user/month |
| Supermetrics (per connector, per account) | Varies — $90–$400+/month |
| Slack (if not already in use) | ~$11/user/month |
| Redirect URL service (Rebrandly Team) | ~$25/month for team |
| AdPilot OS Agency tier licence | Per pricing agreed with provider |

**Minimum viable stack cost for a 10-client agency:** Approximately $200–$600/month in tools, depending on data connector choice. This should be absorbed into the agency's overhead, not billed line-by-line to clients.

---

### What to Pitch to Clients

When presenting the AdPilot OS-powered service to a client, describe it as:

> "A dedicated performance reporting and monitoring system that tracks your ad spend, leads, and revenue in real time, flags issues before they cost you money, and gives you a live dashboard to check anytime you want — all branded to your business."

Do not mention AdPilot OS by name in client-facing materials unless you have elected not to white-label the product.

The client-perceived value of the Agency tier is:
- Transparency: they can see their data anytime, not just in a monthly PDF
- Proactive alerts: issues are caught before the month's budget is wasted
- Accountability: the health score and break-even metrics make performance objective, not subjective
- Professionalism: a branded portal that looks like the agency built something custom for them

---

*End of spec — Agency Client Dashboard v1.0*
*AdPilot OS — Universal Meta + TikTok Paid Ads Operating System*
*All monetary values in AUD. All client data referenced via {{client.*}} variables only.*
*Safety: no live ad changes; no deletion; money moves require typed YES confirmation.*
