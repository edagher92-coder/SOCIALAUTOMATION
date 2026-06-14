# AdPilot OS — Support Documentation

**Product:** AdPilot OS — Universal Meta + TikTok Paid-Ads Operating System
**Version:** 1.0 (V1 No-Code)
**Last updated:** June 2026
**Contact:** support@adpilot.com.au

---

## Table of Contents

1. [Getting Started (First 15 Minutes)](#article-1-getting-started-first-15-minutes)
2. [Configuring a Client (client-config.yaml explained)](#article-2-configuring-a-client-client-configyaml-explained)
3. [Importing Data (CSV format, required columns, common errors)](#article-3-importing-data-csv-format-required-columns-common-errors)
4. [Running an Audit](#article-4-running-an-audit)
5. [Reading the Health Score](#article-5-reading-the-health-score)
6. [Troubleshooting (Top 10 Issues)](#article-6-troubleshooting-top-10-issues)
7. [FAQ](#article-7-faq)
8. [Glossary of Metrics](#article-8-glossary-of-metrics)

---

## Article 1: Getting Started (First 15 Minutes)

### What AdPilot OS Is (and Is Not)

AdPilot OS is a structured operating system for paid advertising on Meta (Facebook and Instagram) and TikTok. It is not a SaaS platform you log into — in V1, it runs as a prompt pack plus a suite of Claude skills, a Google Sheets dashboard, templates, and standardised SOPs. You interact with it by invoking named skills inside Claude, feeding it exported CSV data from your ad platforms, and reviewing the proposals it generates.

The system's core design principle is safety: it never edits live ads, never deletes anything, and never moves budget without your explicit typed confirmation. Every change it proposes ships as a paused duplicate, a draft, or a written proposal you choose to act on yourself. This means setup speed is measured in minutes, not hours — but the value you get is proportional to the quality of data you feed it and the consistency with which you follow the workflow.

This article covers exactly what to do in the first 15 minutes to get the system operational for a new client.

---

### Step 1 — Copy client-config.yaml (Minutes 0–3)

Locate the file `client-config.yaml` in the root of your AdPilot OS folder. This is the master configuration file for a single client or account. Do not edit the original — copy it and rename the copy using the client's business name, for example `bark-and-brew-config.yaml`.

Open the copy in any plain-text editor (VS Code, TextEdit, Notepad — any will do). You will fill this file in during Step 2.

**What to expect:** A blank YAML file with labelled fields and inline comments. Nothing will run without it.

**Common stumbling block:** Do not use Word or Google Docs to edit YAML. Curly quotes and auto-formatting will corrupt the file. Use a plain-text editor only.

---

### Step 2 — Fill in client-config.yaml (Minutes 3–8)

Work through every field in the file. Article 2 of this document covers every field in detail. For a quick start, the minimum required fields are:

- `business_name`
- `brand_type`
- `industry`
- `location`
- `currency`
- `main_offer`
- `average_sale_value`
- `gross_margin`
- `target_audience`
- `primary_goal`
- `platform_focus`
- `monthly_budget`
- `approval_required`
- `risk_tolerance`

Leave `meta_account_id` and `tiktok_account_id` blank if this is a shared or template copy. These fields use the `{{client.*}}` variable pattern at runtime, which means the system injects them from your config without you ever typing a raw account ID into a prompt.

**What to expect:** A completed YAML file that takes 3–5 minutes to fill for a straightforward client. For agency accounts managing multiple clients, you will have one config file per client.

**Common stumbling block:** Gross margin must be expressed as a decimal between 0.00 and 1.00. A 40% gross margin is `0.40`, not `40` or `40%`. Getting this wrong will produce incorrect break-even calculations throughout the system.

---

### Step 3 — Run the Onboarding Skill (Minutes 8–10)

Open Claude and invoke the onboarding skill by typing:

```
/onboarding client-config: [paste your completed config here]
```

Or, if your skill pack uses file references:

```
/onboarding config-file: bark-and-brew-config.yaml
```

The `start-ads-command-centre` agent (the router) reads your config and routes the session to the appropriate specialist agents — `mira` for Meta, `travis` for TikTok, or both.

**What to expect as output:**
- Confirmation that the config has been parsed
- A summary of the client's break-even ROAS and break-even CPA (calculated from your `average_sale_value` and `gross_margin`)
- A checklist of what is ready and what is missing
- Specific prompts telling you what data to export next

**Common stumbling block:** If you get an error referencing a missing required field, re-open your YAML file and check for typos in field names. YAML is case-sensitive. `Brand_Type` is not the same as `brand_type`.

---

### Step 4 — Export CSV from Meta Ads Manager and/or TikTok Ads Manager (Minutes 10–13)

See Article 3 for the full step-by-step export guide for both platforms. For a first run, you need at minimum the last 30 days of data at the ad level (not campaign or ad set level — the system needs the lowest granularity available).

**What to expect:** A raw CSV from the platform that will need minor formatting before import. Article 3 covers exactly what to adjust.

**Common stumbling block:** Meta defaults to showing data at the campaign level. Make sure you switch the breakdown to "Ad" level before exporting, or you will be missing ad-level metrics (CTR, Hook Rate, individual ad names) that the audit and health score depend on.

---

### Step 5 — Run the First Audit (Minutes 13–15)

With your config loaded and your CSV formatted, invoke the audit skill:

```
/meta-ads-audit
```
or
```
/tiktok-ads-audit
```

Paste or attach your formatted CSV when prompted.

**What to expect as output:**
- A Campaign Health Score out of 100 with a colour status (Green / Yellow / Orange / Red)
- A list of findings categorised as Critical, High, Medium, or Low
- Specific action recommendations, all written as proposals you approve — nothing is changed automatically

**Common stumbling block:** If the health score comes back as 0 or "N/A", the most common cause is a CSV formatting error — usually a date format issue (must be YYYY-MM-DD) or a missing required column. See Article 3, "Top 5 Common Import Errors."

---

### What a Good First Session Looks Like

By the 15-minute mark you should have:

1. A completed `client-config.yaml`
2. Confirmation from the onboarding skill that the config is valid
3. A formatted CSV ready for import
4. A first Campaign Health Score

You do not need to action everything in the audit immediately. The first audit is diagnostic — it tells you where the account currently stands and what the highest-priority issues are. Work through findings starting with Critical, then High, leaving Medium and Low for a later session.

---

## Article 2: Configuring a Client (client-config.yaml explained)

### Overview

`client-config.yaml` is the single source of truth for every client account you manage in AdPilot OS. Every skill, every audit, and every report pulls from this file. A correctly filled config means the system knows your client's economics, platform preferences, safety rules, and approval requirements before it does anything else.

The file is divided into six sections: Identity, Offer and Economics, Platforms, Sources/CRM/Reporting, Voice and Compliance, and Risk and Approval. There is also a locked Safety block at the bottom that you should not change.

---

### Section 1: Identity

**`business_name`**
The trading name of the business. Used in all reports and proposals.
- Required: Yes
- Example: `Bark & Brew Pet Supplies`

**`brand_type`**
The category of business. Must be one of the following exact values:
- `local_service` — a service business operating in a defined geographic area (e.g., plumbers, physiotherapists, dentists)
- `ecommerce` — sells physical or digital products online with a shopping cart
- `b2b_lead_gen` — sells to businesses, primary goal is generating qualified leads
- `franchise_multi_location` — a franchise or multi-location business where each location may have separate budgets
- `agency` — an advertising or marketing agency managing client accounts
- `content_brand` — a creator, media brand, or content-led business (monetised through sponsorships, courses, memberships)

Required: Yes. If left blank, the system defaults to `local_service` and may produce audit thresholds and benchmarks inappropriate for your client.

**`industry`**
A plain-English description of the industry. No controlled vocabulary — be specific.
- Example: `premium pet food and accessories retail`

**`location`**
The primary location of the business. Use city and state for Australian businesses.
- Example: `Sydney, NSW`

**`currency`**
ISO 4217 currency code. For Australian clients, this is `AUD`. For New Zealand, `NZD`. Required for all financial calculations.
- Required: Yes
- Example: `AUD`

**`service_area`**
The geographic area the business serves. Can be a suburb, a city, a state, a national area, or "Global."
- Required: No, but recommended
- Example: `Greater Sydney, NSW` or `Australia-wide`

---

### Section 2: Offer and Economics

**`main_offer`**
A one-sentence description of the primary thing being advertised. This feeds into creative and policy checks.
- Required: Yes
- Example: `Premium grain-free dog food delivered to your door — first box 30% off`

**`average_sale_value`**
The average revenue per sale or per lead conversion, in AUD. Used to calculate break-even CPA and ROAS targets.
- Required: Yes
- Example: `185` (meaning $185 AUD average order value)
- What breaks if empty: All CPA and ROAS threshold calculations will fail. The health score cannot be computed.

**`gross_margin`**
The gross profit margin as a decimal between 0.00 and 1.00. This is revenue minus cost of goods sold, divided by revenue. Do not include operating expenses.
- Required: Yes
- Example: `0.52` (meaning 52% gross margin)
- What breaks if empty: Break-even ROAS and break-even CPA cannot be calculated. The system cannot distinguish between a profitable and unprofitable campaign.

**`target_audience`**
A plain-English description of the ideal customer. Used in creative prompts and audience review.
- Required: Yes
- Example: `Dog owners aged 28–55 in metropolitan Australia who prioritise natural, premium pet nutrition`

**`primary_goal`**
What you are optimising for. Must be one of:
- `leads` — form fills, phone calls, message enquiries
- `purchases` — e-commerce transactions
- `calls` — phone calls tracked as conversions
- `bookings` — appointment bookings
- `messages` — WhatsApp, Messenger, or DM conversations

Required: Yes. This determines which conversion column the system focuses on in all calculations.

---

### Section 3: Platforms

**`platform_focus`**
An array of the platforms being advertised on. Valid values: `meta`, `tiktok`. Can include one or both.
- Required: Yes
- Example: `[meta, tiktok]` or `[meta]`

**`monthly_budget`**
The total monthly advertising budget in AUD across all platforms.
- Required: Yes
- Example: `4500`

**`meta_account_id`**
The Meta Ads Manager account ID. Leave blank in any file that will be shared or version-controlled. The system uses the `{{client.meta_account_id}}` variable pattern, which resolves this at runtime from your private config.
- Required: Only if using V2 or V3 API features
- Example: Leave blank

**`tiktok_account_id`**
Same as above, for TikTok Ads Manager.
- Required: Only if using V2 or V3 API features
- Example: Leave blank

**`conversion_events`**
An array of the conversion event names you are tracking, as they appear in your pixel or SDK. Be exact — these must match what appears in your CSV exports.
- Required: Yes
- Example: `[Lead, Purchase, AddToCart, InitiateCheckout]`

**`landing_pages`**
An array of objects, each with a `url` and a `purpose`. Used in landing page alignment checks.
- Required: Recommended
- Example:
  ```yaml
  landing_pages:
    - url: https://barkandbrew.com.au/first-box
      purpose: Main offer — first box discount
    - url: https://barkandbrew.com.au/about
      purpose: Brand awareness traffic
  ```

---

### Section 4: Sources, CRM, and Reporting

**`crm`**
The CRM system in use. Must be one of: `HubSpot`, `Pipedrive`, `GoHighLevel`, `Sheets`, `none`.
- Required: No, but recommended
- Example: `GoHighLevel`

**`lead_sources`**
An array of the lead sources being tracked.
- Example: `[Meta Ads, TikTok Ads, Organic Instagram, Referral]`

**`reporting_frequency`**
How often you want the system to generate reports. Must be `daily`, `weekly`, or `monthly`.
- Required: Yes
- Example: `weekly`

---

### Section 5: Voice and Compliance

**`brand_voice`**
A brief description of the brand's tone and language style. Used when generating ad copy proposals.
- Example: `Warm, knowledgeable, and slightly playful. Never clinical. Speak to pet owners like a trusted friend who happens to know a lot about dog nutrition.`

**`compliance_notes`**
Any compliance constraints relevant to the industry. Used by `paige` (the policy/safety agent) to flag potential issues.
- Example: `No claims about treating or curing medical conditions. No before-and-after imagery. ACCC fair trading rules apply.`

**`qualification_rules`**
An array of rules that define what counts as a qualified lead. Used in lead quality scoring.
- Example:
  ```yaml
  qualification_rules:
    - Has at least one dog
    - Located in metro or regional Australia (not rural)
    - Willing to pay premium price for quality food
  ```

---

### Section 6: Risk and Approval

**`approval_required`**
Whether every proposed change requires explicit approval before implementation. Set to `true` for client-managed accounts.
- Required: Yes
- Example: `true`

**`risk_tolerance`**
How aggressively the system should recommend scaling and testing. Must be `low`, `medium`, or `high`.
- `low` — conservative; recommends smaller test budgets and more verification steps before scale
- `medium` — balanced; standard operating thresholds
- `high` — growth-mode; faster scaling steps, more concurrent tests
- Example: `medium`

---

### Safety Block (Do Not Edit)

The following fields are preset and should not be changed. They are the core safety constraints of AdPilot OS:

```yaml
safety:
  live_edit_block: true
  use_paused_duplicates_only: true
  never_delete_archive_instead: true
  confirm_before_money_moves: true
  scale_requires_clean_tracking: true
```

If you modify these values, the safety model breaks. The system relies on these being true at all times.

---

### Complete Example: Bark & Brew Pet Supplies

Below is a complete, correctly filled `client-config.yaml` for a fictional Sydney e-commerce client:

```yaml
# AdPilot OS — Client Configuration
# Client: Bark & Brew Pet Supplies

identity:
  business_name: Bark & Brew Pet Supplies
  brand_type: ecommerce
  industry: premium pet food and accessories retail
  location: Sydney, NSW
  currency: AUD
  service_area: Australia-wide

offer_economics:
  main_offer: Premium grain-free dog food delivered to your door — first box 30% off
  average_sale_value: 185
  gross_margin: 0.52
  target_audience: Dog owners aged 28–55 in metropolitan Australia who prioritise natural, premium pet nutrition
  primary_goal: purchases

platforms:
  platform_focus: [meta, tiktok]
  monthly_budget: 6000
  meta_account_id:
  tiktok_account_id:
  conversion_events: [Purchase, AddToCart, InitiateCheckout, ViewContent]
  landing_pages:
    - url: https://barkandbrew.com.au/first-box
      purpose: Main offer — first box 30% discount
    - url: https://barkandbrew.com.au/about
      purpose: Brand story — awareness traffic

sources_crm_reporting:
  crm: Sheets
  lead_sources: [Meta Ads, TikTok Ads, Organic Instagram, Email]
  reporting_frequency: weekly

voice_compliance:
  brand_voice: Warm, knowledgeable, and slightly playful. Never clinical. Speak to dog owners like a trusted friend who happens to know a lot about dog nutrition.
  compliance_notes: No veterinary health claims. No comparative claims without substantiation. ACCC fair trading rules apply. Images of dogs must be real (no AI animals).
  qualification_rules:
    - Has at least one dog
    - Located in Australia
    - Previous pet food spend above $60/month

risk_approval:
  approval_required: true
  risk_tolerance: medium

safety:
  live_edit_block: true
  use_paused_duplicates_only: true
  never_delete_archive_instead: true
  confirm_before_money_moves: true
  scale_requires_clean_tracking: true
```

---

## Article 3: Importing Data (CSV Format, Required Columns, Common Errors)

### Why CSV Import Exists in V1

In V1, AdPilot OS does not connect directly to Meta or TikTok APIs (that is a V3 feature). Instead, you export data from each platform's Ads Manager interface and bring it into the system as a CSV. This keeps V1 simple and platform-agnostic, but it means the accuracy of the system depends on you exporting and formatting the data correctly.

The system uses a universal data schema — a single CSV format that works for both Meta and TikTok data. You can combine data from both platforms in one file, or keep them separate and run separate audits.

---

### The Universal Data Schema

Every row in the CSV represents one ad on one day. The required columns are:

| Column | Type | Example Value | Notes |
|---|---|---|---|
| `date` | String | `2026-05-15` | YYYY-MM-DD format only |
| `platform` | String | `meta` | Must be `meta` or `tiktok` (lowercase) |
| `account_name` | String | `Bark & Brew — Main` | The account name as shown in Ads Manager |
| `campaign_name` | String | `BAB_PROS_Purchase_AU_Jun26` | Must match naming convention exactly |
| `adset_name` | String | `BAB_PROS_Purchase_AU_Broad_18-55` | Ad set or ad group name |
| `ad_name` | String | `BAB_PROS_Purchase_AU_Vid01_Hook-A` | Individual ad name |
| `ad_id` | String | `120208000000000` | Platform-assigned ad ID |
| `status` | String | `active` | Must be `active`, `paused`, or `archived` |
| `objective` | String | `OUTCOME_SALES` | Campaign objective as shown in platform |
| `impressions` | Integer | `42500` | Total impressions for the day |
| `reach` | Integer | `18200` | Unique people reached |
| `clicks` | Integer | `638` | Link clicks (not all clicks) |
| `spend` | Float | `127.45` | Total spend in AUD for the day |
| `leads` | Integer | `0` | Lead conversion count. Use 0 if not applicable |
| `purchases` | Integer | `14` | Purchase conversion count. Use 0 if not applicable |
| `revenue` | Float | `2590.00` | Conversion value in AUD. Use 0 if not tracked |
| `ctr` | Float | `0.015` | Computed: clicks / impressions |
| `cpc` | Float | `0.20` | Computed: spend / clicks |
| `cpm` | Float | `2.999` | Computed: (spend / impressions) x 1,000 |
| `cpl` | Float | `0` | Computed: spend / leads. Use 0 if not applicable |
| `cpa` | Float | `9.10` | Computed: spend / purchases |
| `roas` | Float | `20.32` | Computed: revenue / spend |
| `frequency` | Float | `2.34` | Computed: impressions / reach |
| `three_second_views` | Integer | `9100` | Video only. Use 0 for static ads |
| `thruplays` | Integer | `1820` | Video only. Use 0 for static ads |
| `hook_rate` | Float | `0.214` | Computed: three_second_views / impressions |
| `hold_rate` | Float | `0.200` | Computed: thruplays / three_second_views |
| `video_views` | Integer | `6500` | Total video views (any duration) |
| `landing_page_views` | Integer | `480` | Tracked landing page loads |
| `add_to_cart` | Integer | `62` | Add-to-cart events. Use 0 if not tracked |
| `initiate_checkout` | Integer | `28` | Checkout initiations. Use 0 if not tracked |
| `utm_source` | String | `meta` | UTM source tag (meta or tiktok) |
| `utm_medium` | String | `paid_social` | UTM medium tag |
| `utm_campaign` | String | `bab-pros-purchase-au-jun26` | UTM campaign tag |
| `utm_content` | String | `vid01-hook-a` | UTM content (ad identifier) |
| `utm_term` | String | `` | UTM term (usually blank for paid social) |
| `notes` | String | `` | Free text. Leave blank if none |

**On computed fields:** Compute these yourself using the formulas above before importing. The system will verify the computed values against the raw numbers and flag discrepancies greater than 1%. If you cannot compute a field (e.g., `hook_rate` for a static image ad), fill it with `0` — not blank, not NULL, not "N/A". Blank cells cause import errors.

---

### How to Export from Meta Ads Manager

1. Log into Meta Ads Manager at adsmanager.facebook.com.
2. Select the correct ad account from the account switcher at the top.
3. In the left-hand navigation, click **Campaigns**, then use the top tabs to navigate to **Ads** (the third tab, after Campaigns and Ad Sets).
4. Set the date range to the period you want to analyse using the date picker in the top-right corner. For a standard weekly audit, select the last 7 days. For an onboarding audit, select the last 30 days.
5. Click **Columns** (top-right of the table) and select **Customise Columns**. Add the following columns if they are not already showing:
   - Reach, Impressions, Frequency, Amount Spent, Clicks (All), CTR (All), CPC (All), CPM (Cost per 1,000 Impressions)
   - Video: 3-Second Video Plays, ThruPlays, Video Average Play Time, Video Views
   - Website: Landing Page Views, Adds to Cart, Checkout Initiates, Purchases, Purchase Value
   - Leads: Leads (if running a lead gen objective)
6. Click **Breakdown** (top-right of the table) and select **None** — you want summary totals per ad per date range, not demographic breakdowns.
7. Click **Export** (top-right), then select **Export Table Data** and then **CSV**.
8. The file will download with Meta's default column names. Rename columns to match the universal schema using the mapping table below.

**Meta to Universal Schema Column Name Mapping:**

| Meta Column Name | Universal Schema Column |
|---|---|
| Ad Name | `ad_name` |
| Ad ID | `ad_id` |
| Ad Set Name | `adset_name` |
| Campaign Name | `campaign_name` |
| Reporting Starts | `date` |
| Impressions | `impressions` |
| Reach | `reach` |
| Frequency | `frequency` |
| Amount Spent (AUD) | `spend` |
| Clicks (All) | `clicks` |
| CTR (All) | `ctr` |
| CPC (All) | `cpc` |
| CPM (Cost per 1,000 Impressions) | `cpm` |
| 3-Second Video Plays | `three_second_views` |
| ThruPlays | `thruplays` |
| Video Views | `video_views` |
| Landing Page Views | `landing_page_views` |
| Adds to Cart | `add_to_cart` |
| Checkout Initiates | `initiate_checkout` |
| Purchases | `purchases` |
| Purchase Value | `revenue` |
| Leads | `leads` |

Add `platform` = `meta`, `account_name` (from the account switcher), `status` (from the Delivery column), and `objective` (from campaign settings) manually. Add `utm_*` columns from your UTM builder sheet. Compute the `hook_rate`, `hold_rate`, `cpl`, `cpa`, and `roas` fields using the formulas in the schema table.

---

### How to Export from TikTok Ads Manager

1. Log into TikTok Ads Manager at ads.tiktok.com.
2. Select the correct advertiser account.
3. In the top navigation, click **Dashboard** and then **Campaign**, then navigate to the **Ad** tab.
4. Set the date range using the calendar picker. Select the last 7 or 30 days as appropriate.
5. Click **Customise Columns** (the columns icon, top-right of the table). Add:
   - Basic: Impressions, Reach, Clicks, CTR, CPC, CPM, Spend
   - Video: Video Views, 6-Second Views (use as proxy for ThruPlays), 2-Second Views (use as proxy for 3-Second Views if available)
   - Conversions: Conversions, Conversion Value, Add to Cart, Initiate Checkout, Complete Payment (purchases)
6. Click **Export** and then **Download Report** and then **CSV**.
7. Rename columns to match the universal schema using the mapping table below.

**TikTok to Universal Schema Column Name Mapping:**

| TikTok Column Name | Universal Schema Column | Notes |
|---|---|---|
| Ad Name | `ad_name` | |
| Ad ID | `ad_id` | |
| Ad Group Name | `adset_name` | TikTok calls these "Ad Groups" |
| Campaign Name | `campaign_name` | |
| Date | `date` | Confirm format is YYYY-MM-DD |
| Impressions | `impressions` | |
| Reach | `reach` | |
| Clicks | `clicks` | |
| Click-Through Rate | `ctr` | Convert from % to decimal (divide by 100) |
| Cost Per Click | `cpc` | |
| CPM | `cpm` | |
| Cost | `spend` | Rename and confirm currency is AUD |
| 2-Second Video Views | `three_second_views` | TikTok's closest equivalent |
| 6-Second Focused Views | `thruplays` | TikTok's closest equivalent |
| Video Views | `video_views` | |
| Add-to-Cart | `add_to_cart` | |
| Initiate Checkout | `initiate_checkout` | |
| Complete Payment | `purchases` | |
| Total Complete Payment Value | `revenue` | |
| Form Submissions | `leads` | If running lead gen |

Set `platform` = `tiktok`. Add UTMs from your UTM builder. Compute `hook_rate`, `hold_rate`, `frequency`, `cpl`, `cpa`, `roas` as per the formula table.

**Note on Landing Page Views:** TikTok does not natively export landing page views in standard reports. If you have this tracked via pixel, add a custom column. Otherwise leave `landing_page_views` as `0`.

---

### Formatting the CSV Before Importing

Before importing, work through this checklist:

1. **Date format:** Every date must be YYYY-MM-DD (e.g., `2026-05-15`). Meta sometimes exports as `15/05/2026` — this must be fixed before import.
2. **Platform column:** Add a `platform` column with value `meta` or `tiktok` in lowercase for every row.
3. **Numbers, not text:** Ensure spend, impressions, clicks, and all numeric columns contain numbers only. Remove currency symbols ($), percentage signs (%), comma-separated thousands (use `1250` not `1,250`), and any text like "< 100" that Meta sometimes inserts for privacy thresholds. Replace these with `0`.
4. **Empty cells:** For metrics that do not apply (e.g., `leads` for a purchase campaign, `three_second_views` for a static ad), fill with `0` — not blank.
5. **CTR as decimal:** If your platform exports CTR as a percentage (e.g., `1.50%`), convert to decimal (`0.015`) before importing.
6. **No merged cells, no extra header rows:** The first row must be the column headers, and every subsequent row is data. Remove any summary rows Meta adds at the bottom of its exports.
7. **UTF-8 encoding:** Save the file as UTF-8 CSV. This prevents issues with special characters in business names or ad copy.

---

### Top 5 Common Import Errors and How to Fix Them

**Error 1: "Date format not recognised"**
Cause: Date is in DD/MM/YYYY or MM/DD/YYYY format instead of YYYY-MM-DD.
Fix: In Excel or Sheets, select the date column, Format > Number > Custom > enter `YYYY-MM-DD`. Then re-export as CSV.

**Error 2: "Required column missing: [column name]"**
Cause: A required column is absent from the CSV. Common culprits: `platform`, `ad_id`, `status`, `revenue`.
Fix: Add the missing column. If the data genuinely does not exist (e.g., you do not track revenue), add the column with value `0` in every row.

**Error 3: "Non-numeric value in spend column"**
Cause: The spend column contains a currency symbol (`$127.45`), a comma in a large number (`1,250.00`), or a text value like `< 1.00`.
Fix: Use find-and-replace to remove `$` symbols and commas. Replace `< 1.00` and similar privacy-threshold text with `0`.

**Error 4: "CTR value out of range (expected 0–1, got 1.5)"**
Cause: CTR is in percentage format (1.5%) instead of decimal format (0.015).
Fix: Divide the entire CTR column by 100. In Sheets: select column, Data > Transform > Divide by 100.

**Error 5: "Duplicate row detected for [ad_id] on [date]"**
Cause: The same ad and date appear more than once. This happens when you export with a demographic breakdown selected and then merge without collapsing.
Fix: Re-export from Ads Manager with no breakdown selected, or remove the duplicate rows manually.

---

## Article 4: Running an Audit

### Which Skill to Invoke

There are two audit skills:

- `/meta-ads-audit` — for Meta Ads Manager data (Facebook and Instagram)
- `/tiktok-ads-audit` — for TikTok Ads Manager data

If you have combined Meta and TikTok data in one CSV with the `platform` column correctly set, you can run both audits sequentially against the same file. The skills are platform-aware and will filter by the `platform` column.

---

### Exact Inputs Required

When you invoke an audit skill, you will be prompted for:

1. **Your client config** — paste the contents of your `client-config.yaml` or reference the filename if your setup supports file references.
2. **Your formatted CSV** — paste the CSV directly into the prompt, or attach the file. For CSVs longer than approximately 500 rows, attach as a file rather than pasting inline.
3. **Date range** — specify the period you want analysed (e.g., "last 7 days," "1 May–31 May 2026"). The system will filter to this range.
4. **Audit mode** — specify `full` (all 14 checks) or `quick` (top 5 checks only). For onboarding, always run `full`.

---

### What the Audit Checks (All 14 Workflow Steps)

The full audit runs through the following checks in sequence. Each check is performed by one or more specialist agents working under the direction of `start-ads-command-centre`:

1. **Config validation** (`start-ads-command-centre`) — Confirms the client config is complete, all required fields are present, and the safety block is intact.

2. **Data completeness check** (`atlas`) — Verifies that the imported CSV covers the requested date range with no gaps, and that all required columns are present and correctly typed.

3. **Naming convention audit** (`quinn`) — Checks campaign, ad set, and ad names against AdPilot OS naming standards (or your custom naming convention if specified in config). Flags non-compliant names.

4. **Tracking and pixel health** (`atlas`) — Reviews conversion event data to identify tracking gaps: missing purchase events, low landing page view ratios, mismatches between platform-reported conversions and revenue data, and attribution window anomalies.

5. **Spend and pacing review** (`dana`) — Compares actual spend to expected pacing for the month, identifies underspend and overspend patterns, and flags budget allocation issues across campaigns and ad sets.

6. **Campaign health scoring** (`dana`) — Calculates the 13-component Campaign Health Score for each active campaign. See Article 5 for full details on scoring.

7. **Creative performance analysis** (`stella`) — Reviews CTR, Hook Rate, Hold Rate, and creative freshness across all ads. Flags creative fatigue (CTR drop of 25% or more from 7-day average), high-frequency ads, and ads with below-threshold Hook Rates.

8. **Audience and targeting review** (`mira` for Meta, `travis` for TikTok) — Checks audience overlap, exclusion logic, and targeting settings for potential inefficiencies.

9. **Funnel analysis** (`titan`) — Reviews the conversion funnel from impression to purchase (or lead), identifying the biggest drop-off points. Flags add-to-cart-to-checkout ratios below 30% and checkout-to-purchase ratios below 50%.

10. **Lead quality assessment** (`dana`) — If CRM data is available (via Sheets or CRM integration), compares ad-platform-reported leads against CRM-qualified leads to calculate a lead quality rate. If no CRM data is available, this step uses proxy signals (form completion rate, bounce rate from UTM data if available).

11. **Policy and compliance scan** (`paige`) — Reviews ad names, offer descriptions (from config), and any ad copy data in the CSV against known policy risk areas: health claims, financial services rules, restricted categories, and ACCC fair trading requirements.

12. **Automation review** (`milo`) — Checks whether automated rules (where applicable) are configured appropriately and not conflicting with manual optimisation actions.

13. **Reporting and attribution review** (`riley`) — Confirms that UTM parameters are consistent, that platform-reported revenue aligns with UTM-tracked revenue (within acceptable variance), and that the reporting structure supports the configured reporting frequency.

14. **Prioritised recommendations** (`start-ads-command-centre`) — Synthesises all findings into a prioritised action list. Critical and High findings are listed first with specific, numbered action steps. Medium and Low findings are summarised.

---

### What the Output Looks Like

The audit output follows this structure:

```
ADPILOT OS — AUDIT REPORT
Client: [business_name]
Platform: [meta | tiktok | both]
Date range: [start] to [end]
Generated: [date]
Audited by: [agent names]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN HEALTH SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Campaign: [campaign_name]
Campaign Health Score: __ / 100
Status: [Green | Yellow | Orange | Red]
Main issue: [one-line description of biggest problem]
Recommended action: [specific next step]
Next test: [what to test next]
Risk: [Low | Medium | High]

[Repeated for each active campaign]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL (immediate action required)
[Finding #] [Title]
Issue: [what is wrong]
Evidence: [specific data points from the CSV]
Action: [exact steps to resolve, written as a proposal]
Risk of inaction: [what happens if this is not addressed]

HIGH (address within 48 hours)
[Finding #] [Title]
Issue: [description]
Evidence: [data]
Action: [proposal]

MEDIUM (address this week)
[Finding #] [Title]
Issue: [description]
Action: [proposal]

LOW (consider in next planning cycle)
[Finding #] [Title]
Issue: [description]
Action: [proposal]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total spend: $[x] AUD
Total impressions: [x]
Total clicks: [x]
Total leads / purchases: [x]
Blended CPA: $[x]
Blended ROAS: [x]
Average frequency: [x]
Break-even CPA: $[x] (from config)
Break-even ROAS: [x] (from config)
Performance vs break-even: [above | below | at] by [x]%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS (in priority order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Action]
2. [Action]
3. [Action]
...
```

---

### How to Interpret Severity Levels

**Critical** — The account has a problem that is actively wasting budget or producing results that are meaningless due to tracking failure. Stop adding budget or making creative changes until this is resolved. Examples: conversion tracking is broken; pixel is not firing; spend is going to a paused campaign due to an automation error; a campaign is running with no budget cap.

**High** — A significant performance or efficiency issue that will compound over time if left unaddressed. Act within 48 hours. Examples: frequency above 4.0 on a primary prospecting campaign; CPA more than 2x the break-even threshold; creative fatigue across all active ads with no new creative in testing.

**Medium** — A meaningful inefficiency or risk that should be addressed in the next optimisation session but is not actively damaging results. Examples: naming convention non-compliance; UTM parameters missing on some ads; one ad set with significantly lower CTR than peers.

**Low** — A housekeeping item or minor inefficiency. Address in the next planning cycle. Examples: archived campaigns consuming dashboard space; minor budget pacing discrepancy within acceptable range; optional metric column missing from CSV.

---

## Article 5: Reading the Health Score

### What the Health Score Is

The Campaign Health Score is a single number from 0 to 100 that summarises how well a campaign is performing across 13 different dimensions. It is designed to give you a quick read on where a campaign stands without requiring you to manually review dozens of metrics.

The score is calculated for each active campaign individually. You will see a separate score for each campaign in your audit report.

The score uses colour bands:
- **Green (80–100):** Campaign is performing well. Optimise and consider scaling.
- **Yellow (60–79):** Campaign is functional but has identifiable inefficiencies. Address the main issue before scaling.
- **Orange (40–59):** Campaign has meaningful problems that are limiting performance. Prioritise fixing these over testing new things.
- **Red (0–39):** Campaign is underperforming significantly. Do not increase budget. Diagnose root cause before any other action.

---

### What Each Component Measures

The 13 components and their weights are:

| Component | Weight | What It Measures |
|---|---|---|
| Tracking quality | 15% | Are conversions being tracked accurately? Is pixel/SDK firing? Does revenue data exist? |
| CPA | 15% | How does cost per acquisition compare to the break-even CPA from your config? |
| Spend efficiency | 12% | Is budget being used effectively? Are there wasted impressions or zero-conversion ad sets consuming spend? |
| Conversion rate | 10% | What percentage of clicks convert? How does this compare to the campaign objective's expected rate? |
| CTR | 8% | Are people clicking? How does CTR compare to platform and industry benchmarks? |
| Lead quality | 8% | Of the leads generated, what proportion qualify? (Requires CRM data or proxy signals) |
| Creative freshness | 8% | How long have the current ads been running? Has CTR dropped significantly from the ad's peak? |
| CPC | 7% | How much is each click costing? Is it within acceptable range given the target CPA? |
| Naming | 5% | Do campaigns, ad sets, and ads follow the naming convention? Naming quality affects reporting accuracy. |
| Offer strength | 5% | Based on config data (average sale value, margin, offer description), is the offer economically viable for paid ads? |
| Landing page alignment | 4% | Does the ad creative and offer match the landing page destination? (Based on UTM data and config) |
| Budget pacing | 2% | Is the campaign spending on track for the month, or significantly over/under? |
| Data confidence | 1% | Is there enough data to make reliable decisions? (Flags if below minimum thresholds) |

Total: 100%

---

### Specific Thresholds That Trigger Action

The system uses these specific thresholds when calculating the score and generating recommendations:

- **Frequency warning:** 3.0 — the system flags frequency as elevated and recommends monitoring closely
- **Frequency action required:** 4.0 — the system marks creative fatigue as High priority and recommends immediate new creative or audience expansion
- **Low CTR warning:** 1.0% (0.010 as decimal) — below this, CTR contributes a low score to the health calculation
- **Creative fatigue indicator:** CTR has dropped 25% or more from the ad's 7-day peak average
- **Minimum data before decision:** 50 clicks OR 15 conversions — below this, the score carries a low data confidence weight and recommendations are flagged as provisional
- **Minimum spend before decision:** 1x the target CPA — if spend is below this, optimisation decisions are premature
- **Winner scaling threshold:** A campaign must have a health score of 70 or above before the system will recommend scaling
- **Scale step size:** 20% — when scaling is recommended, the system proposes budget increases in 20% increments, not larger

---

### Example Scores and What They Mean

**Score: 41 / 100 — Status: Orange**

A score of 41 is in the Orange band. The campaign is running but has multiple issues dragging it below acceptable performance. A typical Orange scenario:

- Tracking quality is mediocre (pixel fires sometimes but conversion data is incomplete) — loses most of its 15-point allocation
- CPA is 1.5x above break-even — loses most of its 15-point allocation
- CTR is below 1% — loses most of the 8-point CTR allocation
- Creative has been running for 6 or more weeks without refresh — creative freshness score is poor

What to do with a score of 41: Do not increase budget. Identify which two or three components are pulling the score down most heavily (the audit report lists these). Fix tracking first — it is always the most important. Once tracking is clean, assess whether the CPA issue is a creative problem, an audience problem, or an offer problem, and test one variable at a time.

---

**Score: 78 / 100 — Status: Yellow**

A score of 78 is near the top of the Yellow band. The campaign is performing reasonably well but has an identifiable gap. A typical Yellow scenario:

- Tracking is clean — full 15 points
- CPA is at or slightly above break-even — partial score
- CTR is above 1% but below a strong benchmark — mid score
- Creative freshness is moderate — ads have been running 3–4 weeks, CTR has dropped 15% but not yet hit the 25% fatigue threshold
- Naming convention has 2 non-compliant ad names — loses most of the 5-point naming allocation

What to do with a score of 78: The campaign is close to scalable. Address the naming issues (these are easy fixes). Prepare two or three new creative variants to test before CTR drops further. If you can get CPA consistently at or below break-even over the next 7–10 days, the score should move into the Green band and the system will recommend a 20% scale test.

---

**Score: 91 / 100 — Status: Green**

A score of 91 is in the strong Green band. The campaign is performing well on nearly all dimensions. A typical Green scenario:

- Tracking is clean and all conversion events are firing correctly
- CPA is 20% or more below break-even
- CTR is above 1.5%
- Creative has been refreshed in the last 2–3 weeks and CTR is holding
- Naming is compliant
- Spend pacing is on track

What to do with a score of 91: The system will recommend a 20% budget scale test. Before approving, confirm that the score has been above 70 for at least 7 consecutive days (not just one good day), tracking is verified (not estimated), and you have typed `YES` to confirm the budget change in the system's confirmation prompt. After scaling, run a follow-up audit in 5–7 days to confirm CPA has held.

---

### What to Do When You Get a Red Score (0–39)

A Red score means the campaign has a fundamental problem. Do not spend more money on it until you have diagnosed the root cause.

The first question to answer is: "Is the tracking broken, or is the campaign genuinely underperforming?"

If the tracking is broken (pixel not firing, conversion events not reporting, revenue showing as $0 when sales are happening), fix that first. A tracking failure can make a well-performing campaign look like a disaster.

If the tracking is working correctly and the score is still Red, work through these diagnostic questions in order:

1. Is the offer economically viable for paid ads? (Check: is average sale value x gross margin greater than the achievable CPA for this category?)
2. Is the audience correctly defined and large enough? (Audience too small causes rapid frequency increases and CPM spikes)
3. Is the creative connecting with the audience? (Hook Rate below 15% suggests the first three seconds of creative are not stopping the scroll)
4. Is the landing page converting traffic? (High CTR but very low purchases or leads suggests a landing page problem, not an ad problem)

Do not attempt to fix all of these at once. Identify the most likely root cause from the audit findings and test one change at a time.

---

### How to Improve the Score Over Time

The health score is designed to improve as you work through audit findings systematically. The highest-impact improvements are:

1. **Fix tracking first** — 15 points available. Clean tracking is the single biggest lever.
2. **Get CPA to break-even or better** — 15 points available. This often requires creative testing or landing page improvements.
3. **Improve spend efficiency** — 12 points available. Pause non-converting ad sets. Concentrate budget on what is working.
4. **Maintain creative freshness** — 8 points available. Rotate new creative every 3–4 weeks proactively, before fatigue hits.
5. **Fix naming compliance** — 5 points available. These are easy wins that improve reporting quality.

A well-managed account running AdPilot OS for 8–12 weeks should consistently score in the Yellow-to-Green range on most campaigns, with Green being the target state before any scale decision.

---

## Article 6: Troubleshooting (Top 10 Issues)

---

### Issue 1: "The audit output is blank or incomplete"

**Symptom:** You run `/meta-ads-audit` or `/tiktok-ads-audit` and get no output, very short output, or output that is missing major sections (e.g., no health scores, no findings list).

**Causes and fixes:**

**Cause A: The CSV was too large to process inline.** If your CSV has more than approximately 500 rows and you pasted it directly into the prompt, it may have been truncated. Fix: save the CSV as a file and attach it rather than pasting. If your setup does not support file attachments, split the CSV into weekly chunks and run separate audits.

**Cause B: The client config was not included.** The audit skill requires the config to compute break-even values and apply the correct thresholds. If you forgot to include it, re-run with the config explicitly pasted or referenced at the start of the prompt.

**Cause C: A required column is missing from the CSV, causing the parser to fail silently.** Fix: check the "Required column missing" error in the import validation output. If there is no validation output at all, add the most commonly missing columns (`platform`, `ad_id`, `revenue`, `status`) and re-run.

**Cause D: The date range specified does not match any data in the CSV.** If you specified "last 7 days" but your CSV only contains data from 30 or more days ago, the system will return empty results. Fix: confirm the date range in your CSV matches what you are requesting.

---

### Issue 2: "My health score is lower than expected"

**Symptom:** You expect a campaign to score in the Green or Yellow band based on its surface metrics, but the audit returns an Orange or Red score.

**Explanation:** The health score weights tracking quality and CPA at 30% combined. If your tracking is incomplete (even partially), or your CPA is above break-even, these two components alone can drag the score significantly below what your CTR or creative metrics suggest.

**What to check:**
- Tracking quality: Is revenue data present in your CSV? Are conversion events firing in the platform? If `revenue` is `0` for all rows, the system will score tracking quality low even if clicks and leads look fine.
- CPA vs break-even: Is your average sale value and gross margin filled in correctly in the config? An incorrect gross margin will produce an incorrect break-even CPA, which skews the CPA component.
- Data confidence: Is there enough data? If your campaign has fewer than 50 clicks or 15 conversions, the data confidence component will score low and the system will flag results as provisional.

---

### Issue 3: "CTR looks fine but CPL is terrible"

**Symptom:** Your CTR is above 1%, your Hook Rate is reasonable, but your Cost per Lead is far above target.

**Explanation:** CTR measures how many people click the ad. CPL measures how many of those people actually submit a lead form or complete the desired action. A good CTR with a high CPL means the problem is between the click and the conversion — not the ad itself.

**Diagnostic steps:**
1. Check the landing page. Is the page loading quickly? Page speed above 3 seconds kills conversion rates on mobile. Is the form visible above the fold? Is the form short enough?
2. Check audience-offer alignment. CTR tells you people are interested in the creative or the promise. If they click but do not convert, the offer on the landing page may not match what the ad implied.
3. Check for a tracking issue. If lead form submissions are not being tracked correctly, leads may actually be occurring but not showing in your data.
4. Check the `initiate_checkout` or equivalent step data (for lead gen: did people reach the form but not submit?). A high "reached form" rate with a low submission rate points to form friction, not ad quality.

The system will highlight this as a funnel drop-off in the audit findings. The recommended action will be a proposal to run a landing page test — creating a duplicate page with a shorter form or clearer headline — all as a draft proposal, not a live edit.

---

### Issue 4: "The system is suggesting changes I'm not comfortable making"

**Symptom:** The audit recommendations include actions — for example, pausing an ad set or restructuring a campaign — that you disagree with or are not ready to implement.

**This is by design.** AdPilot OS produces proposals, not instructions. Nothing is ever executed without your explicit approval. The `approval_required: true` setting in your config means every recommendation is a proposal you can accept, modify, or reject.

If you disagree with a recommendation:
- You can override it and note your reasoning in the `notes` column of your tracking sheet.
- You can ask the system to explain the reasoning behind the recommendation by prompting: "Explain the reasoning behind recommendation [#]."
- You can adjust the `risk_tolerance` in your config if you consistently find the recommendations too conservative or too aggressive.

If you find that you are regularly disagreeing with the system's recommendations, it is worth reviewing whether your `gross_margin`, `average_sale_value`, or `primary_goal` fields are correctly set. These drive many of the thresholds that determine what the system considers "underperforming."

---

### Issue 5: "My CSV import has errors"

**Symptom:** When you import your CSV, the system reports one or more validation errors and the audit cannot proceed.

**The most common errors and fixes are covered in Article 3.** For any error not covered there:

- "Value out of range": A metric is outside the expected bounds. Check for percentage-vs-decimal confusion on CTR, Hook Rate, and Hold Rate.
- "Unrecognised platform value": The `platform` column contains a value other than `meta` or `tiktok`. Check for capitalisation (`Meta` should be `meta`) or extra spaces.
- "Account name mismatch": The `account_name` in the CSV does not match any entry in your config. This is informational, not a blocking error — but it is worth correcting for accurate reporting.
- "Negative value in spend column": Refunds or credit adjustments from the platform can create negative rows. Remove or zero these rows before importing.

---

### Issue 6: "Frequency is high but CTR hasn't dropped — do I still need to refresh creative?"

**Symptom:** Frequency is above 3.0 or even 4.0, but CTR is holding steady or has even increased slightly. The system has flagged this as a concern. You are not sure whether to act.

**Answer: Yes, you should still plan a creative refresh — but you do not need to panic.**

High frequency with stable CTR can happen when:
- You are retargeting a warm audience (frequency matters less here — these people know the brand and repeated exposure can drive conversion)
- Your creative is genuinely strong and the audience has not fatigued yet
- Your audience is smaller and more defined (niche audiences can sustain higher frequency longer)

However, CTR is a lagging indicator of fatigue. By the time CTR drops, frequency has usually been high for several weeks and CPM has often started climbing. The 25% CTR drop threshold the system uses is the point at which fatigue is confirmed — not the point at which to start preparing.

The recommended action: use the current window of stable performance to prepare and test new creative variants. You do not need to pause the existing ads — the system will propose creating a new ad set with fresh creative as a paused duplicate. If the new creative performs better, you scale it. If it does not, you have lost nothing.

---

### Issue 7: "I have no CRM data — can I still use the lead quality component?"

**Symptom:** Your config has `crm: none` or you have not connected a CRM. You are concerned this will permanently handicap the lead quality component of the health score (8 points).

**Answer: Yes, you can still use the system — and the lead quality component will use proxy signals when CRM data is absent.**

Proxy signals for lead quality without a CRM include:
- **Landing page view to lead ratio:** What proportion of people who load the page actually submit the form? A ratio above 10% suggests reasonable lead quality alignment; below 3% suggests form friction or audience mismatch.
- **UTM data consistency:** Are leads coming from the expected UTM sources and campaigns? Unexpected sources sometimes indicate bot traffic or low-quality placements.
- **Platform delivery signals:** Are ads delivering in placements and to audiences that match your `qualification_rules` settings?

The lead quality score in the absence of CRM data will carry a low data confidence weight, which means it contributes less to the overall score rather than penalising you with a zero. You will see a note in the audit output: "Lead quality scored on proxy signals only — CRM data would improve accuracy."

To improve this component without a full CRM integration, set up a simple Google Sheets lead tracker (included in the V1 template pack) and update it weekly with call outcomes or email response rates.

---

### Issue 8: "The naming convention check is flagging my campaigns but they're working fine"

**Symptom:** `quinn` (the QA agent) has flagged your campaign names as non-compliant. Your campaigns are performing well. You think this is a false alarm.

**Explanation:** The naming convention check exists because consistent, structured names are what allow the system to correctly aggregate, filter, and report on data at scale. When names do not follow the convention, the system may misclassify a campaign's funnel stage, objective, or audience segment, which can produce incorrect aggregations in the health score and reporting.

However, non-compliant naming is a Low to Medium finding, never a Critical or High one. It does not block the audit or stop you from using any other feature.

What to do:
- If you are starting fresh or about to restructure campaigns anyway, adopt the naming convention going forward. The system will propose paused-duplicate renamed versions.
- If you have long-running campaigns with historical data and do not want to disrupt them, you can suppress the naming finding in future audits by setting a `custom_naming_convention` override in your config. Contact support for guidance on this.
- Do not rename live campaigns mid-flight purely to satisfy the check. Renaming live campaigns can break historical reporting and UTM attribution in some platform configurations.

---

### Issue 9: "I'm on TikTok only — do I still need to fill in the Meta fields?"

**Symptom:** You are running TikTok ads only. Your config has `platform_focus: [tiktok]`. You want to know if you can leave Meta-specific fields blank.

**Answer: Yes — if `platform_focus` is set to `[tiktok]` only, all Meta-specific fields are optional and will not cause errors if left blank.**

Specifically, the following fields can be left blank for a TikTok-only client:
- `meta_account_id` — leave blank
- Any Meta-specific conversion events that do not apply on TikTok

The audit will route exclusively through `travis` (the TikTok specialist agent) and will not run Meta-specific checks. The health score will be calculated using TikTok-appropriate benchmarks.

One thing to note: some fields like `conversion_events` and `landing_pages` apply to both platforms. Fill these in regardless of which platform you are using — they inform the tracking and funnel checks that are platform-agnostic.

---

### Issue 10: "How do I update the client config mid-campaign without breaking historical data?"

**Symptom:** A campaign has been running for several weeks and something has changed — the offer, the pricing, the gross margin, or the target audience. You want to update the config without affecting historical audit data or invalidating past health scores.

**The config does not store historical data — your CSV does.** The `client-config.yaml` is a live document that reflects the current state of the client's offer and economics. When you run an audit, the system uses the current config values to evaluate current-period data.

**Safe update procedure:**

1. Before editing the config, save a timestamped copy of the current config: `bark-and-brew-config-2026-05-31.yaml`. This preserves the historical snapshot.
2. Update the live config with the new values.
3. In your audit notes or the `notes` column of your tracking sheet, record what changed and when (e.g., "Gross margin updated from 0.52 to 0.47 effective 1 June 2026 due to COGS increase").
4. When running audits that span the change date, note that the health score for the pre-change period used different economic parameters. You may want to run two separate audits — one for each side of the change date.

Fields that are safe to update at any time without impact on active campaign logic: `reporting_frequency`, `brand_voice`, `compliance_notes`, `crm`, `notes`.

Fields that affect scoring thresholds and should be updated carefully: `average_sale_value`, `gross_margin`, `primary_goal`, `risk_tolerance`.

---

## Article 7: FAQ

**Q1: Is it safe to use AdPilot OS on a live account with real budget?**

Yes, by design. The core safety model has five rules that cannot be overridden: the system never edits live ads (only creates paused duplicates), never deletes anything (archives only), requires a typed `YES` confirmation before any money movement, only scales when tracking is confirmed clean, and never stores or exposes raw API keys or account IDs. Every change is a proposal that you implement yourself. The system is an analyst and strategist — you are the decision-maker.

---

**Q2: Where do I export my CSV from? I can't find the right report in Meta.**

In Meta Ads Manager, navigate to Ads Manager and then the Ads tab (the third tab). Set your date range, click Columns and then Customise Columns to add all the required metrics, then click Export and then Export Table Data and then CSV. The critical step most users miss: make sure you are on the Ads tab, not the Campaigns or Ad Sets tab. Ad-level data is required. See Article 3 for the full step-by-step guide.

---

**Q3: My health score seems to fluctuate a lot day to day. Is that normal?**

Yes, day-to-day variance in ad performance is normal, especially at lower spend levels. A single day's data can produce a very different score from a 7-day average. The health score is most reliable when calculated over at least 7 days of data, and most meaningful when calculated over 14–30 days. For ongoing monitoring, run weekly audits on the last 7 or 14 days of data rather than daily single-day snapshots.

---

**Q4: Which pricing tier should I buy?**

The right tier depends on the volume and complexity of what you are managing:

- **Starter ($97–$297 AUD):** Suitable for a single client or business owner managing one Meta or TikTok account, monthly budget under approximately $3,000 AUD, and no need for automation or integrations. Good for learning the system.
- **Pro ($497–$1,497 AUD):** Suitable for managing two to five client accounts, or a single business with higher spend. Includes the full skill pack, dashboard, and templates. Covers most solo operator or small agency use cases.
- **Agency ($1,997–$4,997+ AUD):** Suitable for agencies managing five or more client accounts with regular reporting needs. Includes all V1 and V2 features.
- **Done-With-You ($1,500–$5,000+ AUD):** Not a tier — a service. A qualified AdPilot OS practitioner works through the setup, first audit, and initial optimisation cycle with you or your team. Priced per engagement. Contact support for a scope call.

If you are genuinely unsure, start with Starter and upgrade. The upgrade path is straightforward because the underlying config and CSV format remain the same across tiers.

---

**Q5: What is the Done-With-You service exactly?**

Done-With-You is a hands-on onboarding and implementation service for businesses or agencies that want expert guidance through their first AdPilot OS setup and audit cycle. It is not a "done-for-you" managed service — you will be doing the work alongside an AdPilot OS practitioner who guides the process. By the end of a Done-With-You engagement, you will have: a completed config file, a formatted historical CSV, a first full audit report with prioritised findings, and a clear 30-day action plan. Pricing ranges from $1,500 to $5,000+ AUD depending on the number of accounts and complexity. Contact support for a scope call.

---

**Q6: Do I need to give AdPilot OS my API keys or account access?**

No — not in V1. In V1, the system operates entirely on exported CSV data and your locally-stored config file. You do not connect any live accounts, grant any OAuth permissions, or share any API credentials. API connectivity is a V3 feature and will require OAuth when it is available. Even in V3, API keys and account IDs are stored locally and referenced via the `{{client.*}}` variable pattern — they are never passed directly into prompt text or shared systems.

---

**Q7: How is TikTok advertising different from Meta in terms of how the system handles it?**

The core workflow — config, import, audit, health score, recommendations — is the same on both platforms. The differences are in the metrics, benchmarks, and optimisation logic:

- TikTok uses different video metrics. TikTok does not have a direct equivalent to Meta's ThruPlays. The system maps 6-second focused views as the closest proxy.
- TikTok creative cycles faster. The average creative lifespan before fatigue is shorter on TikTok than Meta, so the creative freshness scoring is calibrated accordingly.
- TikTok does not natively export landing page views in standard reports — this metric may be absent and will be treated as `0` unless you have pixel data.
- Platform benchmarks differ. CTR, CPM, and CPA benchmarks for TikTok are different from Meta. The system uses platform-appropriate benchmarks when `platform_focus` is set.

In practice, `travis` (the TikTok specialist agent) applies TikTok-specific logic while `mira` (the Meta specialist) applies Meta-specific logic. If you are running both platforms, each agent handles its own platform and `dana` (the data analyst) synthesises the cross-platform view.

---

**Q8: How do the agents actually work? Do they each do separate things?**

Yes. AdPilot OS has 12 named agents, each with a specific responsibility:

- `start-ads-command-centre` is the router. Every session starts here. It reads your config and coordinates which agents run and in what order.
- `mira` handles Meta-specific analysis and recommendations.
- `travis` handles TikTok-specific analysis and recommendations.
- `dana` is the data analyst — she handles health scoring, CPA analysis, and cross-platform comparison.
- `stella` handles creative performance — CTR, Hook Rate, fatigue analysis, and creative testing recommendations.
- `titan` analyses the conversion funnel from impression to purchase.
- `milo` reviews automation rules and workflow efficiency.
- `atlas` manages tracking quality, pixel health, and attribution.
- `riley` handles reporting — generates structured reports and summary outputs.
- `paige` is the policy and safety agent — she flags compliance risks and ensures ads meet platform policy requirements.
- `piper` handles productisation — packaging and structuring offers for better ad performance.
- `quinn` is QA — checks naming conventions, data consistency, and output quality before reports are finalised.

In practice, you invoke a skill (e.g., `/meta-ads-audit`) and the system automatically coordinates the right agents. You do not need to invoke agents individually unless you want a targeted analysis (e.g., "stella, review creative performance only").

---

**Q9: How do I know when my creative has fatigued?**

The system uses three signals to identify creative fatigue:

1. CTR drop of 25% or more from the ad's 7-day peak average. If an ad was averaging 1.8% CTR in its first two weeks and has dropped to 1.35% or below, that is a fatigue signal.
2. Frequency above 3.0 in a prospecting (cold audience) campaign. In a retargeting campaign, higher frequency is more acceptable.
3. Hook Rate decline. If the percentage of people who watch the first three seconds of a video has dropped significantly, the creative is losing its stopping power in the feed.

When any of these signals are present, the system will flag it in the audit and propose creating a new creative variant as a paused duplicate. It will not pause the fatigued ad automatically — that requires your explicit action.

---

**Q10: When should I scale a campaign, and by how much?**

The system will recommend scaling when a campaign's health score reaches 70 or above, sustained over at least 7 days. The proposed scale step is always 20% — not 50%, not doubling. Rapid scaling (more than 20% in a 48-hour period) on Meta in particular triggers the algorithm's learning phase reset, which can temporarily worsen performance.

Before approving a scale recommendation, confirm: tracking is clean and verified (not estimated), the health score has been above 70 for at least a week (not just one good day), and CPA is at or below break-even.

To approve a scale action, you type `YES` when the system prompts you. This is not a safety feature you can turn off — it exists to prevent accidental budget increases.

---

**Q11: I run an agency with multiple clients. Can I use AdPilot OS for all of them?**

Yes. The config-file-per-client model is designed for agency use. Each client gets their own `client-config.yaml`, their own CSV exports, and their own audit reports. The Agency tier includes all the tooling needed to manage multiple client accounts efficiently.

White-label agency mode (branded reports, custom templates, client-facing dashboards) is a V3 feature. In V1 and V2, the outputs are AdPilot OS branded. If you want white-labelled outputs in V1, the report templates are plain Markdown and can be reformatted with your agency branding manually.

---

**Q12: Is white-labelling available?**

White-label agency mode is a V3 API feature. It includes branded report templates, custom domain support, and client-facing dashboards. V1 and V2 do not include native white-labelling. However, because all V1 outputs are plain text or Markdown, you can copy report content into your own branded templates without restriction.

---

**Q13: How do I upgrade from V1 to V2 or V3?**

V2 (low-code automation with Make, Zapier, n8n) and V3 (Meta API + TikTok API + OAuth) are separate tiers that build on V1. Your `client-config.yaml` files and CSV data are fully compatible — you do not need to redo any configuration work when upgrading. V2 and V3 access is available as an upgrade purchase. Contact support for upgrade pricing and migration instructions.

---

**Q14: What support is available?**

Support channels vary by tier:
- **Starter:** Documentation (this file and the skill reference guide), email support with a 3–5 business day response time.
- **Pro:** Documentation, email support with a 1–2 business day response time, access to community forum.
- **Agency:** Priority email support (same business day), access to agency onboarding call, community forum.
- **Done-With-You:** Direct access to your assigned practitioner during the engagement.

For urgent issues affecting live campaigns, email support@adpilot.com.au with "URGENT" in the subject line.

---

**Q15: What is the refund policy?**

Digital product purchases (Starter, Pro, Agency tiers) are eligible for a full refund within 14 days of purchase, provided you have not exported or used the skill pack files. Given the nature of the product, "used" means you have run at least one audit using the system. If you have run an audit and found the product is not right for your situation, contact support — we assess these on a case-by-case basis. Done-With-You service engagements are non-refundable once the first session has been delivered, as the primary value is the practitioner's time and preparation. See the full terms at adpilot.com.au/terms.

---

## Article 8: Glossary of Metrics

This glossary covers every key metric used in AdPilot OS audits, health scores, and reports. For each metric you will find: a plain-English definition, the formula, a worked example, benchmark guidance for Australian lead-gen and e-commerce businesses, and what to do when the metric is poor.

---

### CTR — Click-Through Rate

**Definition:** The percentage of people who saw your ad and clicked on it. It is the primary measure of how compelling your ad creative and offer are at stopping the scroll and generating interest.

**Formula:** CTR = Clicks / Impressions

**Example:** Your ad was shown 42,500 times and received 638 clicks.
CTR = 638 / 42,500 = 0.015 = 1.5%

**What a good value looks like:**
- For Australian e-commerce on Meta: 1.0–2.5% is typical. Above 2.5% is strong. Below 0.8% warrants attention.
- For Australian lead-gen on Meta: 0.8–1.8% is typical. Above 2.0% is strong. Below 0.6% is poor.
- For TikTok: benchmarks differ. TikTok CTR tends to be lower in absolute terms (0.5–1.5%) because the audience is less intent-driven and more discovery-driven. Judge TikTok CTR relative to your own historical performance rather than Meta benchmarks.

**What to do if CTR is poor:**
- Test a new creative hook — the first three seconds of video or the primary image and headline are almost always the cause of low CTR.
- Review audience targeting — is the audience seeing the ad likely to want the offer?
- Check whether you are comparing like with like — CTR benchmarks differ by placement (Reels CTR is different from Feed CTR).

---

### CPC — Cost Per Click

**Definition:** How much you are paying, on average, for each click on your ad. Lower is generally better, but CPC must be evaluated alongside conversion rate — a higher CPC is acceptable if the conversion rate is proportionally better.

**Formula:** CPC = Spend / Clicks

**Example:** You spent $127.45 and received 638 clicks.
CPC = $127.45 / 638 = $0.20

**What a good value looks like:**
- For Australian e-commerce on Meta: $0.30–$1.50 is typical. Under $0.50 is strong. Above $2.00 warrants review.
- For Australian lead-gen on Meta: $0.50–$3.00 is typical. Above $4.00 is high.
- CPC varies enormously by industry. Mortgage broking and legal services have CPC well above $3–$5 and this can still be profitable. Always evaluate CPC relative to CPA, not in isolation.

**What to do if CPC is poor:**
- CPM drives CPC — if CPM is high, CPC will be high regardless of CTR. Check CPM first.
- Improving CTR reduces CPC (because more people click for the same number of impressions at the same cost).
- Review audience size — very small or very narrow audiences tend to have higher CPMs and therefore higher CPCs.

---

### CPM — Cost Per Thousand Impressions

**Definition:** How much it costs to show your ad to 1,000 people. CPM is the base cost of entering the auction. It reflects audience competition, time of year, and targeting specificity.

**Formula:** CPM = (Spend / Impressions) x 1,000

**Example:** You spent $127.45 for 42,500 impressions.
CPM = ($127.45 / 42,500) x 1,000 = $2.99

**What a good value looks like:**
- For Australian Meta in 2026: $8–$18 CPM is typical for broad cold audiences. Below $8 is strong. Above $25 is high and worth reviewing.
- CPM spikes during peak retail periods (pre-Christmas, Black Friday, end of financial year). This is normal and expected.
- High frequency drives up CPM — audiences that have seen your ads many times cost more to reach again.

**What to do if CPM is poor:**
- Broaden the audience — smaller, more defined audiences have higher CPM.
- Test different placements — Audience Network and Messenger placements often have lower CPM than Feed.
- Consider timing — if CPM is spiking during a peak retail period and your product is not seasonal, consider pausing and resuming after the period ends.

---

### CPL — Cost Per Lead

**Definition:** How much you are paying, on average, to generate one lead. A lead is defined by the `primary_goal` in your config — this could be a form submission, a call, a booking, or a message.

**Formula:** CPL = Spend / Leads

**Example:** You spent $850 and generated 34 leads.
CPL = $850 / 34 = $25.00 per lead

**What a good value looks like:**
- Highly variable by industry. For a home services business in Sydney (plumbers, electricians), $30–$80 CPL is typical. For a high-value B2B service (accounting, mortgage broking), $80–$250 CPL can still be profitable.
- Always evaluate CPL against your break-even CPA. Your break-even CPA = average sale value x gross margin. If your average sale is $1,500 and margin is 40%, break-even CPA is $600. A CPL of $150 with a 25% close rate gives an effective CPA of $600 — exactly at break-even.

**What to do if CPL is poor:**
- Diagnose whether it is an ad problem (low CTR) or a landing page problem (high CTR but low form submissions).
- Test a shorter form — every additional field reduces submission rate.
- Test a stronger offer — what can you add that reduces the perceived risk of enquiring?

---

### CPA — Cost Per Acquisition

**Definition:** How much you are paying to acquire one customer (or one primary conversion, whatever your `primary_goal` is). For e-commerce, this is typically cost per purchase. For lead-gen, CPA is often used interchangeably with CPL, or it can refer to cost per qualified lead if CRM data is available.

**Formula:** CPA = Spend / Purchases (or primary conversions)

**Example:** You spent $1,270 and generated 14 purchases.
CPA = $1,270 / 14 = $90.71 per purchase

**What a good value looks like:**
- Must be evaluated against your break-even CPA. Break-even CPA = average sale value x gross margin.
- For Bark & Brew: average sale $185, gross margin 52%. Break-even CPA = $185 x 0.52 = $96.20.
- A CPA of $90.71 is below break-even — meaning the campaign is profitable at the gross margin level.
- A CPA of $120 would be above break-even and unprofitable at the gross margin level unless there is strong repeat purchase behaviour that changes the lifetime value calculation.

**What to do if CPA is poor:**
- First confirm tracking is working — phantom CPA spikes are often tracking failures, not real performance declines.
- Review the funnel — where are people dropping off between impression, click, landing page, and purchase?
- Test a stronger close mechanism on the landing page — guarantee, urgency, social proof.
- Consider whether the audience needs warming before it can convert (consider a two-step funnel with an awareness campaign first).

---

### ROAS — Return on Ad Spend

**Definition:** For every dollar you spend on advertising, how many dollars of revenue do you get back? ROAS of 3.00 means you get $3 of revenue for every $1 spent. ROAS does not account for cost of goods or operating expenses — it is a revenue-to-spend ratio, not a profit measure.

**Formula:** ROAS = Revenue / Spend

**Example:** You spent $1,270 and generated $2,590 in revenue.
ROAS = $2,590 / $1,270 = 2.04

**What a good value looks like:**
- Whether 2.04 is good depends entirely on your gross margin. Use break-even ROAS as your reference point.
- For Bark & Brew with 52% gross margin: break-even ROAS = 1 / 0.52 = 1.92. A ROAS of 2.04 is profitable (above break-even) but only by a small margin.
- For a business with 25% gross margin, break-even ROAS = 4.0. A ROAS of 2.04 would be significantly unprofitable.
- Never compare ROAS across businesses without knowing the gross margin of each.

**What to do if ROAS is poor:**
- Check whether the gross margin in the config is correct — this is the most common source of confusion.
- Improve CPA (see CPA entry above).
- If ROAS is consistently below break-even, the business model may not be suited to cold-audience paid ads at current price points. Consider raising the offer value or testing a front-end lower-priced product to acquire customers and then upsell.

---

### MER — Media Efficiency Ratio

**Definition:** MER is the account-wide version of ROAS. It measures total revenue divided by total ad spend across all platforms and campaigns. Unlike ROAS, which is measured per campaign, MER gives you a blended view of how efficiently your entire ad budget is generating revenue. MER is more useful than ROAS for strategic budget decisions because it is harder to game with attribution manipulation.

**Formula:** MER = Total Revenue / Total Ad Spend (account-wide, all platforms)

**Example:** You spent $6,000 across Meta and TikTok in May and generated $22,800 in total revenue (from your Shopify or CRM, not just platform-reported).
MER = $22,800 / $6,000 = 3.80

**What a good value looks like:**
- Same principle as ROAS: compare to break-even ROAS. An MER above break-even ROAS means the total ad program is profitable at gross margin level.
- MER tends to be lower than individual campaign ROAS because it captures all spend (including brand awareness and upper-funnel campaigns that do not directly attribute to conversions).

**What to do if MER is poor:**
- MER decline often indicates over-investment in bottom-of-funnel retargeting while top-of-funnel prospecting is underfunded, causing the pipeline to thin.
- Review the ratio of prospecting spend to retargeting spend. A healthy ratio for most Australian businesses is approximately 70–80% prospecting, 20–30% retargeting.
- MER can also decline when ad spend is increased without corresponding improvement in website conversion rate or offer strength — the ads bring more traffic but the business is not converting it.

---

### Hook Rate

**Definition:** The percentage of people who saw your video ad and watched at least the first three seconds. Hook Rate measures how well your video creative stops the scroll — whether the opening moment of the video is compelling enough for someone to pause rather than keep scrolling.

**Formula:** Hook Rate = Three-Second Views / Impressions

**Example:** Your video ad received 42,500 impressions and 9,100 people watched at least 3 seconds.
Hook Rate = 9,100 / 42,500 = 0.214 = 21.4%

**What a good value looks like:**
- For Meta video: 20–35% is strong. Below 15% suggests the hook is not working. Above 40% is exceptional.
- For TikTok: benchmarks are similar, though TikTok audiences tend to scroll more aggressively, so 15–25% is considered reasonable.
- Static image ads do not have a Hook Rate. Fill this with `0` in your CSV.

**What to do if Hook Rate is poor:**
- The first 0–2 seconds of the video need to be more attention-grabbing. Text on screen, a strong visual contrast, a surprising statement, or a direct question to the viewer all improve hook rate.
- Review whether your video opens with a logo or branded intro. This almost always kills hook rate — cut it.
- Test multiple different hooks (same offer, different openings) as separate ads and let the one with the strongest Hook Rate inform the creative direction.

---

### Hold Rate

**Definition:** Of the people who watched the first three seconds of your video, what percentage watched it all the way through (ThruPlay)? Hold Rate measures how well your video holds attention after it has successfully hooked the viewer. A strong hook with poor hold rate means the video starts well but does not deliver on its promise.

**Formula:** Hold Rate = ThruPlays / Three-Second Views

**Example:** 9,100 people watched at least 3 seconds. 1,820 people watched to the end (ThruPlay).
Hold Rate = 1,820 / 9,100 = 0.200 = 20.0%

**What a good value looks like:**
- Hold Rate above 20% is considered strong for typical feed placements. Above 30% for a longer video is excellent.
- Hold Rate is length-dependent — a 60-second video will naturally have a lower Hold Rate than a 15-second video. Interpret accordingly.

**What to do if Hold Rate is poor:**
- The video is losing viewers after the hook. Review the pacing — is the video slow to reach the offer or payoff?
- Cut the video down. The data often shows that a 45-second video's first 15 seconds hold 80% of the audience, but the audience drops sharply at the 15-second mark. Editing down to the strongest 15 seconds typically improves both Hold Rate and CPC.
- Ensure the video delivers on what the hook promised. If the hook implies a quick tip, give the tip immediately — do not build to it.

---

### Frequency

**Definition:** The average number of times each unique person in your audience has seen your ad. A frequency of 1.0 means every impression reached a different person. A frequency of 4.0 means the average person has seen your ad 4 times.

**Formula:** Frequency = Impressions / Reach

**Example:** Your ad had 42,500 impressions and reached 18,200 unique people.
Frequency = 42,500 / 18,200 = 2.34

**What a good value looks like:**
- For cold-audience prospecting: 1.5–2.5 is a healthy range. Above 3.0 is a warning sign. Above 4.0 requires action.
- For warm retargeting audiences: higher frequency is acceptable (3.0–6.0) because the audience already knows the brand and may need multiple touch-points before converting.
- Frequency climbing alongside stable or rising CPM is a strong fatigue signal, even if CTR has not yet dropped.

**What to do if Frequency is poor:**
- Expand the audience — the current audience is too small relative to the budget, causing the same people to see the ad repeatedly.
- Refresh creative — new creative resets engagement and can revive interest even with the same audience.
- Add exclusions — exclude recent purchasers, existing customers, and anyone who has converted in the last 30 days.

---

### Break-even ROAS

**Definition:** The minimum ROAS you need to achieve before your ad spend is profitable. Below this number, every sale made through paid advertising costs you money at the gross margin level. This is the most important benchmark for evaluating ROAS in your account.

**Formula:** Break-even ROAS = 1 / Gross Margin

**Example:** Bark & Brew has a gross margin of 52% (0.52).
Break-even ROAS = 1 / 0.52 = 1.92

This means Bark & Brew needs at least $1.92 of revenue for every $1 of ad spend to cover cost of goods. At exactly 1.92x ROAS, gross profit from the sale exactly covers the ad spend cost.

**What a good value looks like:**
- This is not a metric you improve — it is a fixed threshold set by your business economics. You compare your actual ROAS against this number.
- A business with 20% gross margin has a break-even ROAS of 5.0 — very difficult to achieve with cold-audience paid ads. A business with 70% gross margin has a break-even ROAS of 1.43 — much easier to achieve.

**What to do if your actual ROAS is below break-even ROAS:**
- Short term: review whether ROAS is being reported correctly (attribution windows, platform over-reporting).
- Medium term: improve conversion rate on the landing page or post-click experience.
- Long term: consider whether the business model and margin structure support this customer acquisition channel. Some business models cannot make cold-audience paid social profitable at current price points and margins.

---

### Break-even CPA

**Definition:** The maximum you can pay to acquire one customer before you are spending more on ads than you make in gross profit on that sale. Below this number, you are profitable at the gross margin level. Above it, you are losing money on each sale from ad spend alone (before any other costs).

**Formula:** Break-even CPA = Average Sale Value x Gross Margin

**Example:** Bark & Brew has an average sale value of $185 and gross margin of 52%.
Break-even CPA = $185 x 0.52 = $96.20

This means Bark & Brew can pay up to $96.20 to acquire a customer before the gross profit from that sale is fully consumed by ad spend.

**What a good value looks like:**
- Your target CPA should be meaningfully below your break-even CPA — ideally 50–70% of it — to leave room for operating expenses and profit.
- For Bark & Brew with a break-even CPA of $96.20, a good target CPA would be $48–$65.

**What to do if your actual CPA is above break-even CPA:**
- If CPA is slightly above (within 20%): optimise. The campaign has potential but needs improvement in conversion rate, creative, or audience.
- If CPA is significantly above (more than 50% above break-even): pause and diagnose. The issue is likely structural — wrong audience, wrong offer, broken landing page, or a margin structure that is too thin for this channel.
- Consider lifetime value. If customers from paid ads make repeat purchases, a CPA above the single-sale break-even may still be profitable over 6–12 months. This requires CRM data to verify.

---

*End of AdPilot OS Support Documentation v1.0*

*For additional support, contact support@adpilot.com.au*
*Product information: adpilot.com.au*
