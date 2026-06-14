# AdPilot OS — Notion Dashboard Specification

**Product:** AdPilot OS — Universal Meta + TikTok Paid Ads Operating System  
**Audience:** Agency operators, white-label resellers, and their clients  
**Currency default:** AUD (overridden per client via `{{client.currency}}`)  
**Last updated:** 2026-06-14  
**Safety note:** This system never edits live ads. All changes ship as paused duplicates, drafts, or proposals. Nothing is deleted — archive only. Money-movement actions require a typed YES confirmation.

---

## Table of Contents

1. [Workspace Structure](#1-workspace-structure)
2. [Database 1 — Clients](#2-database-1--clients)
3. [Database 2 — Campaigns](#3-database-2--campaigns)
4. [Database 3 — Daily Log](#4-database-3--daily-log)
5. [Database 4 — Creative Tests](#5-database-4--creative-tests)
6. [Database 5 — Reports](#6-database-5--reports)
7. [Relations and Rollups Map](#7-relations-and-rollups-map)
8. [Client-Facing Dashboard Page](#8-client-facing-dashboard-page)
9. [No-Code User Guide](#9-no-code-user-guide)
10. [Limitations vs Airtable and Looker Studio](#10-limitations-vs-airtable-and-looker-studio)

---

## 1. Workspace Structure

### 1.1 Top-Level Page

Every client deployment lives under a single top-level Notion page named:

```
AdPilot OS — {{client.business_name}}
```

Create this page in the client's workspace or in your agency workspace under a "Clients" parent page. The page title uses the exact `{{client.business_name}}` config variable — no abbreviations.

### 1.2 Sidebar Navigation Layout

The sidebar should be pinned and ordered as follows. Indentation indicates nesting level.

```
📌 AdPilot OS — {{client.business_name}}
│
├── 🏠  Home (overview / quick links)
├── 📊  Client-Facing Dashboard          ← read-only share link goes here
│
├── 🗄️  DATABASES
│   ├── Clients
│   ├── Campaigns
│   ├── Daily Log
│   ├── Creative Tests
│   └── Reports
│
├── 📋  REPORTS ARCHIVE
│   ├── Weekly Reports
│   ├── Monthly Reports
│   └── Audit Reports
│
├── 🧪  CREATIVE BANK
│   └── [linked view of Creative Tests database]
│
├── ⚙️  SETUP & CONFIG
│   ├── Client Config Sheet             ← all {{client.*}} variables listed here
│   ├── Naming Convention Guide
│   ├── Health Score Reference
│   └── Metric Definitions
│
└── 📁  ARCHIVE
    └── [archived campaigns, old reports — never deleted]
```

### 1.3 Page Hierarchy

**Level 0 (Workspace root):**
- AdPilot OS — {{client.business_name}}

**Level 1 (Main sections):**
- Home
- Client-Facing Dashboard
- DATABASES (folder/group)
- REPORTS ARCHIVE (folder/group)
- CREATIVE BANK
- SETUP & CONFIG
- ARCHIVE

**Level 2 (Database pages and sub-sections):**
- Clients DB, Campaigns DB, Daily Log DB, Creative Tests DB, Reports DB
- Individual report pages nested under REPORTS ARCHIVE sub-folders
- Config sub-pages under SETUP & CONFIG

**Level 3 (Record pages):**
- Each database row opens as a full Notion page and can contain embedded sub-pages, linked databases, or rich content (e.g., a Report Body page linked from the Reports database)

### 1.4 Home Page Layout

The Home page acts as the operator's control panel. Build it as a Notion page (not a database) with the following blocks in order:

```
[Callout block — SAFETY REMINDER]
"All changes ship as paused drafts/proposals only. Never delete — archive only.
 Money moves require typed YES. No real account IDs or API keys stored here."

[Divider]

[Heading 2] Quick Links
[3-column layout using Notion columns]
  Col 1: Link to Client-Facing Dashboard
  Col 2: Link to Campaigns DB (Active Only view)
  Col 3: Link to Reports DB (Draft status filter)

[Divider]

[Heading 2] This Week's Health Scores
  [Linked database view: Clients DB — Board by Status — filtered to Active]

[Divider]

[Heading 2] Campaigns Needing Action
  [Linked database view: Campaigns DB — filtered Decision = Kill or Hold — sorted Spend descending]

[Divider]

[Heading 2] Reports Due
  [Linked database view: Reports DB — filtered Status = Draft — sorted Date ascending]
```

---

## 2. Database 1 — Clients

### 2.1 Purpose

Single source of truth for every client account. One row per client. All other databases relate back to this one.

### 2.2 Database Name

`AdPilot — Clients`

Store this database as a full-page database (not inline) so it can be linked across the workspace.

### 2.3 Properties

| Property Name | Type | Configuration |
|---|---|---|
| Client Name | Title | Primary field. Format: `{{client.business_name}}` — no abbreviations |
| Industry | Select | Options: eCommerce, Lead Gen, SaaS, Hospitality, Health & Wellness, Professional Services, Retail, Education, Other |
| Location | Text | Free text. Maps to `{{client.location}}` |
| Currency | Select | Options: AUD, USD, GBP, EUR, NZD, CAD — default AUD |
| Main Offer | Text | Maps to `{{client.main_offer}}`. Short description of the core product/service being advertised |
| Average Sale Value | Number | Format: Currency (respects Currency field setting). Maps to `{{client.average_sale_value}}` |
| Gross Margin | Number | Format: Percent (0–100 range, e.g. enter 0.40 for 40%). Maps to `{{client.gross_margin}}` |
| Monthly Budget | Number | Format: Currency. Maps to `{{client.monthly_budget}}` |
| Platform Focus | Multi-select | Options: Meta, TikTok. Maps to `{{client.platform_focus}}` |
| Reporting Frequency | Select | Options: Daily, Weekly, Fortnightly, Monthly. Maps to `{{client.reporting_frequency}}` |
| Break Even CPA | Formula | `prop("Average Sale Value") * prop("Gross Margin")` — output: number formatted as currency |
| Break Even ROAS | Formula | `1 / prop("Gross Margin")` — output: number, 2 decimal places |
| Health Score | Rollup | Source: Campaigns relation (see below). Rollup: Average of Health Score property. Format: Number, 0 decimal places |
| Status | Select | Options: Active (green), Paused (yellow), Churned (red) |
| Notes | Text | Internal operator notes. **Not visible on client-facing dashboard.** |
| Campaigns | Relation | Relates to `AdPilot — Campaigns` database. Direction: one Client → many Campaigns. Enable "Show on Campaigns" so the Campaigns DB has a back-relation |
| Reports | Relation | Relates to `AdPilot — Reports` database. Direction: one Client → many Reports |
| Date Added | Created Time | Auto-filled. Non-editable |
| Last Modified | Last Edited Time | Auto-filled. Tracks when the client record was last touched |

#### Formula Property Detail — Break Even CPA

```
prop("Average Sale Value") * prop("Gross Margin")
```

- If Average Sale Value = $5,000 and Gross Margin = 0.40 (40%), Break Even CPA = $2,000
- This is the maximum spend per acquisition before the sale breaks even

#### Formula Property Detail — Break Even ROAS

```
1 / prop("Gross Margin")
```

- If Gross Margin = 0.40 (40%), Break Even ROAS = 2.5
- At ROAS 2.5 the client is breaking even; above 2.5 is profitable

#### Rollup Property Detail — Health Score

- Rollup field source: Campaigns relation
- Property rolled up: Health Score (from Campaigns DB)
- Aggregation: Average
- Format: Number, rounded to 0 decimal places
- Note: This is an aggregate signal only. Individual campaign health drives the number. If a client has 1 campaign the rollup equals that campaign's score directly.

### 2.4 Views

**View 1: Table (default)**
- All properties visible
- Sort: Status ascending (Active first), then Health Score descending
- Group: None
- This is the operator's master view

**View 2: Board by Status**
- Group by: Status
- Cards show: Client Name, Monthly Budget, Health Score, Platform Focus
- Sort within groups: Health Score descending
- Use this view for a quick visual triage of which clients need attention

---

## 3. Database 2 — Campaigns

### 3.1 Purpose

One row per ad campaign (not ad set — campaign level). Tracks performance, operator decisions, and connects down to Daily Log entries and Creative Tests.

### 3.2 Database Name

`AdPilot — Campaigns`

### 3.3 Properties

| Property Name | Type | Configuration |
|---|---|---|
| Campaign Name | Title | Must follow naming convention: `[Client Code]_[Platform]_[Objective]_[Date]_[Version]`. Example: `ACME_META_LEAD_2026-06_v1` |
| Platform | Select | Options: Meta (blue), TikTok (red) |
| Objective | Select | Options: Awareness, Traffic, Engagement, Leads, App Installs, Sales, Catalogue Sales |
| Client | Relation | Relates to `AdPilot — Clients`. Many Campaigns → one Client |
| Budget Type | Select | Options: Daily, Lifetime |
| Daily Budget | Number | Format: Currency. The budgeted daily spend for this campaign |
| Status | Select | Options: Active (green), Paused (yellow), Archived (grey) — never delete |
| Decision | Select | Options: Scale (green), Test (blue), Hold (yellow), Kill (red) — colour coded per option |
| Total Spend | Rollup | Source: Daily Log relation. Property: Spend. Aggregation: Sum. Format: Currency |
| Total Leads | Rollup | Source: Daily Log relation. Property: Leads. Aggregation: Sum. Format: Number |
| Total Purchases | Rollup | Source: Daily Log relation. Property: Purchases. Aggregation: Sum. Format: Number |
| Total Revenue | Rollup | Source: Daily Log relation. Property: Revenue. Aggregation: Sum. Format: Currency |
| CPL | Formula | `prop("Total Spend") / prop("Total Leads")` — format: Currency. Returns 0 if no leads (guard: `if(prop("Total Leads") = 0, 0, prop("Total Spend") / prop("Total Leads"))`) |
| CPA | Formula | `if(prop("Total Purchases") = 0, 0, prop("Total Spend") / prop("Total Purchases"))` — format: Currency |
| ROAS | Formula | `if(prop("Total Spend") = 0, 0, prop("Total Revenue") / prop("Total Spend"))` — format: Number, 2 decimal places |
| Health Score | Number | Range 0–100. Manually entered by operator after running the health score audit. See Health Score reference in SETUP & CONFIG |
| Last Updated | Date | Manually updated by operator when reviewing the campaign |
| Recommendation | Text | Operator's written action recommendation. Example: "Increase budget 20% — CPA 18% below break-even, spend still low" |
| Daily Log Entries | Relation | Relates to `AdPilot — Daily Log`. One Campaign → many Daily Log rows. Back-relation appears on Daily Log |
| Creative Tests | Relation | Relates to `AdPilot — Creative Tests`. One Campaign → many Creative Tests |
| Created Time | Created Time | Auto-filled |
| Last Edited | Last Edited Time | Auto-filled |

#### Formula Property Notes

**CPL (Cost Per Lead):**
```
if(prop("Total Leads") = 0, 0, prop("Total Spend") / prop("Total Leads"))
```

**CPA (Cost Per Acquisition/Purchase):**
```
if(prop("Total Purchases") = 0, 0, prop("Total Spend") / prop("Total Purchases"))
```

**ROAS (Return on Ad Spend):**
```
if(prop("Total Spend") = 0, 0, prop("Total Revenue") / prop("Total Spend"))
```

Note: Notion formula syntax requires `prop("Property Name")` with exact case matching. Test all formulas on a duplicate database before pushing to a live client workspace.

### 3.4 Health Score — Manual Entry Protocol

Health Score is entered manually (or copied from an audit output) because Notion cannot call external APIs. The 0–100 score uses these weights (from the shared conventions):

| Component | Weight |
|---|---|
| Tracking (Verified status) | 15 |
| CPA vs Break Even CPA | 15 |
| Spend efficiency | 12 |
| Conversion rate | 10 |
| CTR | 8 |
| Lead quality | 8 |
| Creative freshness | 8 |
| CPC | 7 |
| Naming convention compliance | 5 |
| Offer strength | 5 |
| Landing page alignment | 4 |
| Budget pacing | 2 |
| Data confidence | 1 |

Bands: Green = 80–100, Yellow = 60–79, Orange = 40–59, Red = 0–39.

Use a Notion select or number property with conditional formatting (via filters on views) to visually reflect band colours.

### 3.5 Views

**View 1: Table — All Campaigns (sorted by Spend)**
- All properties visible except back-relation fields (hide Daily Log Entries, Creative Tests columns for readability)
- Sort: Total Spend descending
- Filter: None
- Default operator view

**View 2: Board by Decision (Kanban)**
- Group by: Decision
- Columns in order: Scale | Test | Hold | Kill
- Card preview: Campaign Name, Platform, ROAS, CPA, Health Score, Last Updated
- Sort within groups: Total Spend descending
- Use for weekly decision-making sprint

**View 3: Active Only (filtered table)**
- Filter: Status = Active
- Sort: Health Score ascending (lowest scores at top — needs attention first)
- Properties shown: Campaign Name, Platform, Decision, Total Spend, CPL, CPA, ROAS, Health Score, Recommendation
- Share this view with the team for triage meetings

---

## 4. Database 3 — Daily Log

### 4.1 Purpose

Daily performance data entry. One row per campaign per day. This is the source data for all rollups in the Campaigns database. Operators enter data here after pulling it from Meta Ads Manager or TikTok Ads Manager — or via a connected automation (e.g., Zapier pulling from a Google Sheet export).

### 4.2 Database Name

`AdPilot — Daily Log`

### 4.3 Properties

| Property Name | Type | Configuration |
|---|---|---|
| Record Title | Formula | `prop("Campaign") + " — " + formatDate(prop("Date"), "YYYY-MM-DD")` — creates a unique, human-readable record title |
| Date | Date | Format: YYYY-MM-DD. No time component needed. Required field |
| Campaign | Relation | Relates to `AdPilot — Campaigns`. Many Daily Log rows → one Campaign |
| Spend | Number | Format: Currency. Total spend for this campaign on this date |
| Impressions | Number | Format: Number (no decimal). Total impressions delivered |
| Clicks | Number | Format: Number (no decimal). Link clicks (not all clicks — use consistent definition across platform) |
| CTR | Formula | `if(prop("Impressions") = 0, 0, prop("Clicks") / prop("Impressions"))` — format: Percent, 2 decimal places |
| CPC | Formula | `if(prop("Clicks") = 0, 0, prop("Spend") / prop("Clicks"))` — format: Currency |
| Leads | Number | Format: Number (no decimal). Lead form fills or equivalent conversion event |
| CPL | Formula | `if(prop("Leads") = 0, 0, prop("Spend") / prop("Leads"))` — format: Currency |
| Purchases | Number | Format: Number (no decimal). Purchase conversion events |
| CPA | Formula | `if(prop("Purchases") = 0, 0, prop("Spend") / prop("Purchases"))` — format: Currency |
| Revenue | Number | Format: Currency. Attributed revenue from purchases on this date |
| ROAS | Formula | `if(prop("Spend") = 0, 0, prop("Revenue") / prop("Spend"))` — format: Number, 2 decimal places |
| Hook Rate | Number | Format: Percent. Manual entry: 3-second video views ÷ impressions. Enter as decimal (e.g. 0.35 for 35%) |
| Hold Rate | Number | Format: Percent. Manual entry: ThruPlays ÷ 3-second views. Enter as decimal |
| Tracking Status | Select | Options: Verified (green), Issues (red), Unverified (yellow). Set daily based on pixel/API check |
| Notes | Text | Anything unusual that day — budget changes, platform outages, creative swaps |
| Created Time | Created Time | Auto-filled |

#### Formula Property Notes

**Record Title:**

Notion's formula engine handles relation properties differently — `prop("Campaign")` on a relation field returns the linked record name as a string. This formula produces titles like:
```
ACME_META_LEAD_2026-06_v1 — 2026-06-14
```

If the Campaign relation is empty, the formula will return an empty string for that segment. Add a fallback:
```
if(empty(prop("Campaign")), "No Campaign", prop("Campaign")) + " — " + formatDate(prop("Date"), "YYYY-MM-DD")
```

**CTR:**
```
if(prop("Impressions") = 0, 0, prop("Clicks") / prop("Impressions"))
```

**CPC:**
```
if(prop("Clicks") = 0, 0, prop("Spend") / prop("Clicks"))
```

**CPL:**
```
if(prop("Leads") = 0, 0, prop("Spend") / prop("Leads"))
```

**CPA:**
```
if(prop("Purchases") = 0, 0, prop("Spend") / prop("Purchases"))
```

**ROAS:**
```
if(prop("Spend") = 0, 0, prop("Revenue") / prop("Spend"))
```

### 4.4 Data Entry Protocol

1. Pull daily stats from platform at the same time each day (recommend: 9am the following day to capture overnight attribution)
2. Open the Daily Log database
3. Click New, which will open a new record
4. Set Date to yesterday's date
5. Link Campaign via the Campaign relation field
6. Enter Spend, Impressions, Clicks, Leads, Purchases, Revenue
7. All formula fields (CTR, CPC, CPL, CPA, ROAS) calculate automatically
8. Enter Hook Rate and Hold Rate manually if running video ads
9. Set Tracking Status based on whether the pixel/CAPI events fired correctly for that day
10. Rollups in the Campaigns DB (Total Spend, Total Leads, etc.) update automatically once this record is saved

### 4.5 Views

**View 1: Table — Date Descending (default)**
- All properties visible
- Sort: Date descending (most recent first)
- No filter
- Default data entry view

**View 2: Calendar by Date**
- Show records as calendar entries grouped by Date
- Display on card: Spend, ROAS, Tracking Status
- Useful for spotting gaps in data entry (missing days appear as empty)

**View 3: This Week (filtered table)**
- Filter: Date is within the current week
- Sort: Date descending, then Campaign
- Properties shown: Date, Campaign, Spend, CTR, CPL, CPA, ROAS, Tracking Status
- Use for weekly review meetings

---

## 5. Database 4 — Creative Tests

### 5.1 Purpose

Tracks individual ad creatives being tested. One row per creative asset under test. Links back to the campaign it is running in. The Creative Bank view in the sidebar pulls from this database.

### 5.2 Database Name

`AdPilot — Creative Tests`

### 5.3 Properties

| Property Name | Type | Configuration |
|---|---|---|
| Creative Name | Title | Naming convention: `[Client Code]_[Type]_[Hook Short Description]_[Date]`. Example: `ACME_VID_PainPoint-Cooking_2026-06` |
| Campaign | Relation | Relates to `AdPilot — Campaigns`. Many Creative Tests → one Campaign. Enables rollup of creative count per campaign |
| Creative Type | Select | Options: Video (blue), Image (green), Carousel (purple), UGC (orange) |
| Hook Text | Text | The exact first line or on-screen text used as the hook — what appears in the first 3 seconds. Verbatim copy only |
| Status | Select | Options: Testing (blue), Winner (green), Loser (red), Retired (grey) |
| Spend | Number | Format: Currency. Total spend allocated to this creative at the ad level |
| CTR | Number | Format: Percent (enter as decimal, e.g. 0.025 for 2.5%). Link click-through rate for this creative |
| CPL | Number | Format: Currency. Cost per lead attributed to this creative |
| Hook Rate | Number | Format: Percent (enter as decimal). 3-second views ÷ impressions |
| Hold Rate | Number | Format: Percent (enter as decimal). ThruPlays ÷ 3-second views |
| Start Date | Date | Date this creative began running |
| Days Running | Formula | `dateBetween(now(), prop("Start Date"), "days")` — format: Number, 0 decimal places. Shows how long the creative has been active. Note: Notion's `now()` updates on page refresh, not in real time |
| Decision | Select | Options: Scale (green), Test (blue), Retire (red), Archive (grey) |
| Notes | Text | Observations — what worked, what didn't, audience response notes |
| Cover Image | Files & media | Upload a screenshot or thumbnail of the creative for the Gallery view |
| Created Time | Created Time | Auto-filled |
| Client (via Campaign) | Rollup | Source: Campaign relation. Property: Client (text). Aggregation: Show unique values. Useful for filtering by client |

#### Formula Property Note — Days Running

```
dateBetween(now(), prop("Start Date"), "days")
```

If Start Date is empty, this returns an error. Add a guard:
```
if(empty(prop("Start Date")), 0, dateBetween(now(), prop("Start Date"), "days"))
```

This is an approximate figure — `now()` in Notion is evaluated when the page is loaded, not on a live clock. The number updates when the page refreshes.

### 5.4 Views

**View 1: Table — All Creatives**
- All properties visible
- Sort: Spend descending
- Filter: None
- Default operator view

**View 2: Gallery — With Cover Image**
- Layout: Gallery
- Card size: Medium
- Show cover: Files & media (Cover Image property)
- Card preview properties: Creative Name, Status, CTR, Hook Rate, Decision
- Filter: Status is not Retired
- Sort: Spend descending
- Use this for creative review calls — it's visually scannable

**View 3: Board by Status**
- Group by: Status
- Columns in order: Testing | Winner | Loser | Retired
- Card preview: Creative Name, CTR, CPL, Hook Rate, Days Running
- Use for weekly creative sprint review

---

## 6. Database 5 — Reports

### 6.1 Purpose

Archive of every report generated for each client. One row per report. The Report Body field links to a nested Notion page where the full report is written. Attached File allows a PDF export to be stored alongside the entry.

### 6.2 Database Name

`AdPilot — Reports`

### 6.3 Properties

| Property Name | Type | Configuration |
|---|---|---|
| Report Title | Title | Format: `[Client Name] — [Report Type] — [Date]`. Example: `ACME — Weekly — 2026-06-09` |
| Client | Relation | Relates to `AdPilot — Clients`. Many Reports → one Client |
| Report Type | Select | Options: Daily (grey), Weekly (blue), Monthly (green), Audit (purple), Executive (orange) |
| Date | Date | The reporting period end date (not the date the report was written) |
| Health Score | Number | Format: Number, 0 decimal places. The overall Health Score at time of report. Manually entered. Range 0–100 |
| Recommendations Count | Number | Format: Number. Count of distinct recommendations in the report. Manually entered |
| Status | Select | Options: Draft (yellow), Sent (blue), Approved (green) |
| Report Body | Text | A short descriptor. The actual full report lives as a Notion sub-page opened from this record. Use this field to link the sub-page URL or write a 1-2 sentence summary |
| Attached File | Files & media | Upload PDF export of the report for sending to clients |
| Reporting Period Start | Date | Start of the reporting period |
| Reporting Period End | Date | End of the reporting period (same as Date above for consistency) |
| Prepared By | Text | Operator name or initials. No account IDs or system usernames |
| Notes | Text | Internal notes — not visible on client-facing dashboard |
| Created Time | Created Time | Auto-filled |
| Last Edited | Last Edited Time | Auto-filled |

### 6.4 Views

**View 1: Table — All Reports (default)**
- All properties visible
- Sort: Date descending
- Filter: None
- Default archive view

**View 2: Calendar by Date**
- Calendar grouped by: Date
- Card display: Report Title, Status, Report Type
- Useful for visualising cadence and spotting missed reporting periods

**View 3: Filtered — Draft Reports**
- Filter: Status = Draft
- Sort: Date ascending (oldest draft first — most overdue at top)
- Properties shown: Report Title, Client, Report Type, Date, Health Score, Status

**View 4: Filtered — Weekly Only**
- Filter: Report Type = Weekly
- Sort: Date descending
- Use for weekly report archive review

**View 5: Filtered — Monthly Only**
- Filter: Report Type = Monthly
- Sort: Date descending

---

## 7. Relations and Rollups Map

### 7.1 Full Relation Diagram

```
AdPilot — Clients
  │
  ├── [1:many] → AdPilot — Campaigns          (Clients.Campaigns ↔ Campaigns.Client)
  │       │
  │       ├── [1:many] → AdPilot — Daily Log  (Campaigns.Daily Log Entries ↔ Daily Log.Campaign)
  │       │
  │       └── [1:many] → AdPilot — Creative Tests (Campaigns.Creative Tests ↔ Creative Tests.Campaign)
  │
  └── [1:many] → AdPilot — Reports            (Clients.Reports ↔ Reports.Client)
```

### 7.2 Relation Link Explanations

**Clients ↔ Campaigns**
- Direction: One client can have many campaigns. A campaign belongs to exactly one client.
- Why: Allows rollups of Health Score from campaign level back up to the client record. Also allows filtering campaigns by client.
- Setup: Create the relation on the Campaigns DB (Client property → Clients DB). Enable "Show on Clients" to create the back-relation (Campaigns property on Clients DB).

**Campaigns ↔ Daily Log**
- Direction: One campaign has many daily log entries. Each daily log entry belongs to exactly one campaign.
- Why: Enables the rollup of Spend, Leads, Purchases, and Revenue from daily rows up to the campaign-level totals. These rolled-up totals feed the campaign-level formula properties (CPL, CPA, ROAS).
- Setup: Create the relation on Daily Log (Campaign property → Campaigns DB). Enable "Show on Campaigns" to create the back-relation (Daily Log Entries on Campaigns DB).

**Campaigns ↔ Creative Tests**
- Direction: One campaign can have many creative tests. Each creative test links to one campaign.
- Why: Allows operators to see all creatives under a campaign from the campaign record. Also enables a rollup count of active creatives per campaign.
- Setup: Create the relation on Creative Tests (Campaign property → Campaigns DB). Enable "Show on Campaigns" to create the back-relation (Creative Tests on Campaigns DB).

**Clients ↔ Reports**
- Direction: One client has many reports. Each report belongs to one client.
- Why: Enables filtering reports by client, and allows a rollup of report count or latest Health Score per client.
- Setup: Create the relation on Reports (Client property → Clients DB). Enable "Show on Clients" to create the back-relation (Reports on Clients DB).

### 7.3 Rollup Property Reference Table

| Database | Property | Source Relation | Rolled-Up Property | Aggregation |
|---|---|---|---|---|
| Clients | Health Score | Campaigns | Health Score | Average |
| Campaigns | Total Spend | Daily Log Entries | Spend | Sum |
| Campaigns | Total Leads | Daily Log Entries | Leads | Sum |
| Campaigns | Total Purchases | Daily Log Entries | Purchases | Sum |
| Campaigns | Total Revenue | Daily Log Entries | Revenue | Sum |
| Creative Tests | Client (via Campaign) | Campaign | Client | Show Unique Values |

### 7.4 Rollup Dependency Chain

The calculation chain flows in this order:

```
Daily Log (raw data)
  → Campaigns rollups (Total Spend, Total Leads, Total Purchases, Total Revenue)
    → Campaigns formulas (CPL, CPA, ROAS)
      → Clients rollup (Health Score average from all campaigns)
```

Important: Rollups update in Notion in near-real time when source records change, but there can be a brief delay of a few seconds on large databases. If totals look stale, refresh the page.

---

## 8. Client-Facing Dashboard Page

### 8.1 Purpose

A single Notion page the client can see. Read-only. No internal operator data visible. Designed to answer the client's three most important questions: how is my money performing, what is happening with my campaigns, and what is next?

### 8.2 Page Name

```
{{client.business_name}} — Ads Dashboard
```

Place this page at Level 1 in the sidebar, directly under the top-level workspace page. It should be the first thing a client sees when they open the shared link.

### 8.3 Page Layout — Section by Section

---

#### Section 1: Header

```
[Page icon: chart emoji]
[Page title]: {{client.business_name}} — Ads Dashboard

[Callout block — grey background]
"This dashboard shows your ad performance at a glance.
 Updated {{client.reporting_frequency}}.
 Currency: {{client.currency}}.
 For questions, contact your AdPilot account manager."
```

---

#### Section 2: This Month at a Glance (KPI Callouts)

Use Notion's **Callout blocks** in a 3-column layout (using Notion column blocks) to show key numbers. These are manually updated by the operator when preparing a report — they are NOT live-synced. Label them clearly so the client knows the data period.

**Row 1 — 3 columns:**

```
[Callout]          [Callout]          [Callout]
Total Spend        Total Revenue      ROAS
$XX,XXX            $XX,XXX            X.Xx
Month-to-date      Month-to-date      Revenue per $1 spent
```

**Row 2 — 3 columns:**

```
[Callout]          [Callout]          [Callout]
Total Leads        CPL                Health Score
XXX                $XXX               XX / 100
Month-to-date      Cost per lead      [Green/Yellow/Orange/Red label]
```

**How to update these:**
1. Operator manually edits the callout numbers after each reporting period
2. Add the reporting period label in small text below each number (e.g., "1 Jun – 14 Jun 2026")
3. Use a coloured callout icon to indicate Health Score band (green = ✅, yellow = ⚠️, orange = 🟠, red = 🔴)

---

#### Section 3: Campaign Status Table

A **linked database view** of `AdPilot — Campaigns`, filtered and scoped for the client.

**Linked view settings:**
- Database: AdPilot — Campaigns
- Filter: Client = [this client's record] AND Status = Active
- Sort: Total Spend descending
- Properties visible to client: Campaign Name, Platform, Total Spend, CPL, ROAS, Decision, Last Updated
- Properties hidden from client: Health Score (operator-internal), Recommendation (operator-internal), Budget Type, Daily Budget, Objective (unless client wants this detail)

**Title for this section:**
```
[Heading 2] Active Campaigns
```

Tell the client what the Decision values mean with a small legend below the table:
```
[Callout block]
Scale = performing well, increasing budget.
Test = gathering data.
Hold = paused for review.
Kill = stopping this campaign.
```

---

#### Section 4: Top Performing Ads

A **linked database view** of `AdPilot — Creative Tests`.

**Linked view settings:**
- Database: AdPilot — Creative Tests
- Filter: Status = Winner AND Campaign.Client = [this client]
- Sort: CTR descending
- Properties visible: Creative Name, Creative Type, Status, CTR, CPL, Hook Rate, Spend
- Properties hidden: Notes (internal), Decision (operator use)
- View type: Table

**Title for this section:**
```
[Heading 2] Top Performing Ads
```

Add a note below:
```
[Callout block — grey]
"These are the ads currently delivering the best results.
 We scale spend toward these while testing new concepts."
```

---

#### Section 5: Latest Report

A **linked database view** of `AdPilot — Reports`.

**Linked view settings:**
- Database: AdPilot — Reports
- Filter: Client = [this client] AND Status = Sent OR Approved
- Sort: Date descending
- Limit: Show top 3 results only
- Properties visible: Report Title, Report Type, Date, Health Score, Attached File
- Properties hidden: Notes (internal), Prepared By (internal), Status (operator use), Recommendations Count (operator use)

**Title for this section:**
```
[Heading 2] Recent Reports
```

Clients can click the Attached File property to download the PDF version of each report.

---

#### Section 6: Next Steps

A simple text block updated by the operator each reporting period. Not a database — just a Notion bulleted list.

```
[Heading 2] Next Steps

[Bulleted list — manually updated each report cycle]
• [Action item 1 — plain English, no jargon]
• [Action item 2]
• [Action item 3]

[Small text below]
"Next check-in: [Date]. Reporting cycle: {{client.reporting_frequency}}."
```

Keep next steps to 3–5 items maximum. Write them from the client's perspective: what will they see happen, and by when.

---

### 8.4 How to Share Read-Only with the Client

1. Open the "{{client.business_name}} — Ads Dashboard" page
2. Click **Share** (top-right in Notion)
3. Under "Share to web", toggle ON "Share to web"
4. Ensure "Allow editing" is OFF (read-only)
5. Ensure "Allow comments" is set based on your preference (recommend: OFF for cleaner client experience)
6. Copy the public link and send it to the client
7. Optional: In Notion workspace settings, add the client's email as a Guest with "Can View" permission — this requires them to log in but gives a more professional experience and lets you revoke access cleanly if the client churns

**Link management:**
- Store the client's share link in the Client record (add a URL property to the Clients DB called "Client Dashboard Link")
- When a client churns, toggle "Share to web" off — the link becomes inactive immediately
- Do not share the top-level workspace page or any database page directly — only share the specific Dashboard page

### 8.5 What to Hide from Clients

The following information should never appear on the client-facing dashboard page or in any linked view shared with the client:

| Data | Reason to Hide |
|---|---|
| Health Score (raw number) | Can cause unnecessary anxiety without context; report it in your written summary instead |
| Operator Notes / Internal Notes | Contains strategy, pricing, internal commentary — not for client eyes |
| Recommendation (from Campaigns DB) | Operator-only language; translate into plain English for the Next Steps section |
| Daily Budget (exact number) | Clients may fixate on budget figures rather than performance outcomes |
| Reporting cadence internals | e.g., "Data confidence: 1" weight detail is not meaningful to clients |
| Cost data the client does not receive a bill for | e.g., agency margin calculations, tool costs |
| Creative Test Decision column | Use the Status column (Winner/Loser) instead — Decision has operator intent that the client may misinterpret |
| Tracking Status = Issues | Handle tracking issues before sending the dashboard; a client seeing "Issues" without context will panic |
| Break Even CPA / ROAS formulas | These are operator benchmarks — share the conclusion ("your target CPA is $X") not the formula |

---

## 9. No-Code User Guide

This section is for operators or team members who are not comfortable with Notion formulas, databases, or relational data. The goal is to use AdPilot OS effectively without needing to touch any formula or database configuration.

### 9.1 Daily Data Entry (No Formulas Needed)

You only ever need to enter these fields manually. Every other field calculates automatically:

**In Daily Log:**
- Date
- Campaign (select from dropdown — relation field)
- Spend
- Impressions
- Clicks
- Leads
- Purchases
- Revenue
- Hook Rate (if video campaign)
- Hold Rate (if video campaign)
- Tracking Status (select from dropdown)
- Notes (optional)

CTR, CPC, CPL, CPA, and ROAS all calculate automatically once you save the record.

**In Creative Tests:**
- Creative Name
- Campaign (relation)
- Creative Type
- Hook Text
- Status (update as results come in)
- Spend, CTR, CPL, Hook Rate, Hold Rate (manual entry)
- Start Date
- Decision (update when making a call)
- Cover Image (upload screenshot)

Days Running calculates automatically.

### 9.2 Using Templates

Notion templates speed up repetitive record creation. Set up these templates inside each database:

**Daily Log Template:**
1. Open the Daily Log database
2. Click the dropdown arrow next to "New"
3. Click "New template"
4. Pre-fill: Tracking Status = Unverified, Date = today (Notion supports `@today`)
5. Save as "Daily Entry"
6. Now every new daily log entry starts with Unverified status, reducing the chance of forgetting to update it

**Campaign Template:**
1. Open the Campaigns database
2. Create a new template named "New Campaign"
3. Pre-fill: Status = Paused (safety default), Budget Type = Daily, Decision = Test (all new campaigns start as Test)
4. Add a checklist block inside the template page:
   - [ ] Confirm naming convention
   - [ ] Link to Client record
   - [ ] Confirm tracking is Verified before activating
   - [ ] Enter Daily Budget
5. Save as "New Campaign Checklist"

**Report Template:**
1. Open the Reports database
2. Create a new template named "Weekly Report"
3. Pre-fill: Report Type = Weekly, Status = Draft
4. Add the report structure as a page body (H2 sections for: Executive Summary, Campaign Performance, Creative Performance, Next Steps, Tracking Note)
5. Save as "Weekly Report Template"

### 9.3 Duplicating the Workspace for a New Client

When you onboard a new client, follow this process to duplicate the workspace without carrying over old data:

**Step 1: Duplicate the template workspace**

Keep a clean "AdPilot OS — TEMPLATE" workspace that has:
- All 5 databases with the correct properties and views set up
- Zero data rows
- The Client-Facing Dashboard page layout ready
- The SETUP & CONFIG pages filled in with placeholder text

**Step 2: Duplicate into a new page**

1. Open the top-level "AdPilot OS — TEMPLATE" page
2. Click the three-dot menu (⋯) in the top-right
3. Select "Duplicate"
4. A copy appears in your sidebar — rename it "AdPilot OS — [New Client Name]"

**Step 3: Update config variables**

Open SETUP & CONFIG → Client Config Sheet in the new workspace. Update every `{{client.*}}` variable for the new client:

```
{{client.business_name}}       = [new client name]
{{client.industry}}            = [industry]
{{client.location}}            = [city, state]
{{client.currency}}            = AUD
{{client.main_offer}}          = [offer description]
{{client.average_sale_value}}  = [dollar amount]
{{client.gross_margin}}        = [decimal, e.g. 0.45]
{{client.monthly_budget}}      = [dollar amount]
{{client.platform_focus}}      = Meta / TikTok / Both
{{client.reporting_frequency}} = Weekly
```

Update the Clients database formula properties — the Break Even CPA and Break Even ROAS formulas reference the Gross Margin field, so they will auto-calculate once you create the first client record.

**Step 4: Create the first Client record**

1. Open the Clients database in the new workspace
2. Click New
3. Fill in all client fields using the config variables above
4. This creates the first record all other databases will relate to

**Step 5: Verify relations**

After duplicating, Notion relations point to the original database IDs. You may need to:
- Delete and recreate the relation properties if they reference the template workspace instead of the new workspace's databases
- Test by creating one Campaign record and confirming the Client dropdown shows the new client

**Step 6: Set up the client-facing dashboard share link**

1. Open the Client-Facing Dashboard page in the new workspace
2. Share → Share to web → ON → Allow editing OFF
3. Copy link → paste into the Client record (Dashboard Link property)
4. Send to client

### 9.4 Updating the Client Dashboard (No Formulas Required)

The KPI callout numbers in the client dashboard do NOT auto-update. Operators must update them manually on each reporting cycle. Here is the process:

1. Open the Daily Log database → This Week view
2. Note down: Total Spend (sum the Spend column), Total Revenue (sum the Revenue column), Total Leads (sum the Leads column)
3. Calculate: ROAS = Total Revenue ÷ Total Spend, CPL = Total Spend ÷ Total Leads (use a calculator or Google Sheets — do not rely on Notion for ad-hoc calculations)
4. Open the Client-Facing Dashboard page
5. Click each Callout block and update the number
6. Update the "Next Steps" section
7. Mark the linked Report record as Sent

### 9.5 Sorting and Filtering Without Breaking Things

Notion views are non-destructive — filtering or sorting a view does not change or delete data. It only changes what you see. You can safely:

- Add, change, or remove filters on any view
- Change sort order
- Show or hide properties on a view
- Switch between Gallery, Table, Board, and Calendar layouts

You cannot break the database by adjusting views. If a view looks wrong, click the three-dot menu on the view and select "Reset view" or simply change the filter/sort.

---

## 10. Limitations vs Airtable and Looker Studio

Notion is excellent for documentation-first teams who want a single workspace combining databases, notes, and client deliverables. However, it has meaningful limitations for a paid ads operating system. Know these before committing to Notion as the primary data layer.

### 10.1 Formula Limitations

| Limitation | Impact |
|---|---|
| Formulas cannot reference rollups from within the same formula | You cannot create a formula like `prop("Total Spend") / prop("Total Leads")` where both properties are rollups — Notion will throw an error. Workaround: Use intermediate rollup properties, then formula in a separate field |
| No IF/ELSE across multiple conditions in one formula (complex nesting) | Complex conditional logic (e.g., assigning a Health Score band label based on a number range) requires multiple nested `if()` calls which become unreadable and fragile |
| `now()` is not a live clock | The `now()` function evaluates when a page loads, not continuously. "Days Running" in Creative Tests will not update until the page is refreshed |
| No regex, no array operations | Cannot parse campaign names to extract client codes or dates automatically |
| No formula can call another formula in a different database | Cross-database computed fields require rollups as an intermediary |

**Airtable advantage:** Airtable's formula engine supports rollup references within formulas, has `IF()` with cleaner syntax, and supports `ARRAYFORMULA` equivalents. For complex calculated fields, Airtable is significantly more capable.

### 10.2 Automation Limitations

| Limitation | Impact |
|---|---|
| No native API polling | Notion cannot pull data from Meta Ads Manager or TikTok Ads Manager directly. All data entry is manual or requires Zapier/Make integration |
| Zapier/Make integrations are row-level, not bulk | Automating daily data import means creating one Daily Log record per row per campaign per day — at scale this hits Notion's API rate limits |
| No scheduled scripts | Notion does not run code on a schedule. You cannot trigger a health score calculation at 9am daily without an external tool |
| Automations are basic | Notion's built-in automations (as of 2026) support simple triggers (when property changes → do X) but not complex multi-step workflows |

**Airtable advantage:** Airtable Automations are more powerful natively, and Airtable's API is better suited to bulk data imports via scripts. For agencies at scale (10+ clients, daily automated data sync), Airtable is the better backend.

**Looker Studio advantage:** Looker Studio connects directly to Meta Ads Manager and Google Analytics via native connectors. Data is live, not manually entered. For pure reporting and visualisation, Looker Studio with a BigQuery or Google Sheets backend eliminates manual entry entirely.

### 10.3 Reporting and Visualisation Limitations

| Limitation | Impact |
|---|---|
| No native charts or graphs | Notion has no bar charts, line charts, or trend graphs. The client dashboard is text-based only |
| No sparklines or conditional colour-banding on numbers | You cannot set a cell to turn red if CPA exceeds Break Even CPA automatically — only manual select fields support colour |
| No date-range comparison | Notion cannot show "last week vs this week" in the same view without separate filtered databases |
| Limited export options | Exporting a Notion database to a formatted PDF report requires copy-pasting into a separate design tool or using a third-party integration |

**Looker Studio advantage:** Looker Studio produces polished visual reports with charts, date-range comparisons, scorecards with conditional formatting, and PDF exports — all automatically. For client-facing reporting that looks professional without manual design work, Looker Studio or a dedicated reporting tool (e.g., Whatagraph, AgencyAnalytics) is strongly preferred.

### 10.4 Scale Limitations

| Limitation | Impact |
|---|---|
| No database views can be shared without sharing the page | You cannot give a client access to a filtered database view in isolation — they always get the page context |
| Search is workspace-wide, not database-scoped | On large workspaces, Notion search returns results from everywhere, which can confuse clients with shared access |
| Row limits degrade performance | Notion databases with 5,000+ rows show noticeable slowdown. A Daily Log at 1 campaign × 365 days = 365 rows is fine. At 20 campaigns × 365 days = 7,300 rows, expect slowness |
| No granular permissions per database property | You cannot hide a specific column from one user while showing it to another within the same view — you must duplicate the page with a filtered view |

### 10.5 Recommended Hybrid Architecture

For operators who want to scale AdPilot OS beyond 5 clients or need live data:

| Layer | Tool | Purpose |
|---|---|---|
| Data storage + automation | Airtable | Database backend, automated daily imports via Zapier/Make, formula-heavy calculations |
| Client reporting | Looker Studio | Visual dashboards connected live to Airtable or Google Sheets |
| Documentation + SOPs + notes | Notion | Campaign notes, strategy docs, report archives, this workspace |
| Data pipeline | Google Sheets (via Zapier) | Intermediate layer for cleaning and formatting platform exports before pushing to Airtable |

Notion excels as the **documentation and communication layer**. It is not the right tool for live data ingestion, complex calculated metrics at scale, or polished visual reporting. Use it for what it does well — organised, searchable, shareable notes and structured records — and offload the heavy analytics to purpose-built tools.

---

## Appendix A — Naming Convention Reference

Stored in SETUP & CONFIG → Naming Convention Guide:

```
Campaign:   [ClientCode]_[PLATFORM]_[OBJECTIVE]_[YYYY-MM]_[vN]
            ACME_META_LEAD_2026-06_v1

Ad Set:     [ClientCode]_[AUDIENCE]_[PLACEMENT]_[YYYY-MM]_[vN]
            ACME_LAL1PCT_FEED_2026-06_v1

Ad/Creative: [ClientCode]_[TYPE]_[HOOK]_[YYYY-MM]
             ACME_VID_PainPoint-Cooking_2026-06

Daily Log:  Auto-generated via formula (Campaign + Date)

Report:     [ClientName] — [ReportType] — [YYYY-MM-DD]
            ACME — Weekly — 2026-06-09
```

ClientCode = max 6 characters, uppercase, no spaces.

---

## Appendix B — Health Score Bands Reference

Stored in SETUP & CONFIG → Health Score Reference:

| Band | Score Range | Colour | Typical Action |
|---|---|---|---|
| Green | 80–100 | Green | Maintain; look for scale opportunities |
| Yellow | 60–79 | Yellow | Monitor; identify weakest component and address |
| Orange | 40–59 | Orange | Prioritise review; likely tracking or CPA issues |
| Red | 0–39 | Red | Immediate action required; consider pausing spend |

Score is composed of 13 weighted components. Full weighting table is in Section 3.4 of this document. Enter the final 0–100 score manually in the Campaigns DB Health Score field after each audit.

---

## Appendix C — Metric Definitions Quick Reference

Stored in SETUP & CONFIG → Metric Definitions:

```
CTR            = Clicks / Impressions
CPC            = Spend / Clicks
CPM            = (Spend / Impressions) × 1,000
CPL            = Spend / Leads
CPA            = Spend / Purchases
ROAS           = Revenue / Spend
MER            = Total Revenue / Total Ad Spend (all channels)
Hook Rate      = 3-Second Video Views / Impressions
Hold Rate      = ThruPlays / 3-Second Video Views
Break-Even CPA = Average Sale Value × Gross Margin
Break-Even ROAS = 1 / Gross Margin
```

All monetary values in {{client.currency}} unless otherwise noted. All rate/ratio values entered as decimals (e.g. 0.035 = 3.5%) unless the field format is set to Percent in which case enter the decimal and Notion displays it as a percentage.

---

*End of AdPilot OS — Notion Dashboard Specification*
