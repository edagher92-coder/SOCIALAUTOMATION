# Support Documentation — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Audience:** All tier users (Starter, Pro, Agency, Done-With-You)

---

## Documentation Structure

```
1. Getting Started
2. Configuring a Client
3. Importing Data
4. Running an Audit
5. Reading the Health Score
6. Troubleshooting
7. Frequently Asked Questions
8. Glossary of Metrics
```

---

## Article 1: Getting Started

### What is AdPilot OS?
AdPilot OS is a paid-ads operating system for Meta (Facebook + Instagram) and TikTok advertising. It consists of a set of Claude AI skills, Google Sheets templates, SOPs, and (for Pro/Agency) automation blueprints. It audits your ad account, generates a health score from 0–100, and produces a structured report with prioritised actions.

### What you need before you start
- A Meta Ads Manager account or TikTok Ads Manager account (or both) with at least 30 days of data
- A Google account (for the Google Sheets dashboard)
- Access to Claude (claude.ai — free or paid plan; Claude Pro recommended for larger accounts)
- The AdPilot OS ZIP file (downloaded from your purchase confirmation)

### First time setup: 4 steps
1. Unzip the downloaded file and open README-FIRST.md
2. Make a personal copy of the Google Sheets Dashboard (link inside README-FIRST.md)
3. Fill in client-config.yaml with your business details
4. Follow the onboarding checklist (onboarding-flow.md in the ZIP)

### What to do if you get stuck
- Check Article 6 (Troubleshooting) first
- Check Article 7 (FAQ)
- Pro and Agency users: email support (address in your purchase confirmation)
- Done-With-You users: use your async support window (14 days post-kickoff call)

---

## Article 2: Configuring a Client

### What is client-config.yaml?
The config file is the central settings file for AdPilot OS. Every skill, template, and automation reads from this file. It uses YAML format — a simple text structure where you replace the placeholder values with your real information.

### Where to find it
Inside the AdPilot OS ZIP: /config/client-config.yaml

### Key fields to configure

**Required fields (the audit will not run correctly without these):**

| Field | What It Is | Example |
|-------|-----------|---------|
| client.name | Business or client name | "Acme Retail Co" |
| client.currency | Your reporting currency | "AUD" |
| client.monthly_budget_aud | Monthly ad spend (approximate) | 3500 |
| client.primary_platform | Which platform you are auditing | "meta" or "tiktok" or "both" |
| client.business_type | Business model type | "ecom" or "lead_gen" or "local" |
| client.target_cpa_aud | Target cost per acquisition | 45 |
| client.target_roas | Target return on ad spend | 3.5 |
| kpis.primary | Your primary success metric | "roas" or "cpa" or "cpl" |

**Important:** Remove every {{client.*}} placeholder before running the audit. The skill will flag unresolved placeholders as a configuration error.

### Managing multiple clients (Pro and Agency)
Create a separate config file for each client: /config/[client-code]-config.yaml (e.g. /config/acme-retail-config.yaml). When running an audit, specify which config to use: "Load config: acme-retail-config."

### Updating the config
If a client's KPIs or budget change, update the config file and re-run the next audit with the new file. The health score will recalibrate against the new targets automatically.

---

## Article 3: Importing Data

### Supported import method (Starter and Pro)
Manual CSV export from your ad platform, pasted into the AdPilot OS Google Sheets Dashboard.

### Meta Ads Manager: how to export
1. Open Ads Manager → navigate to the Campaigns, Ad Sets, or Ads tab
2. Set the date range (recommended: last 30 days; minimum for a valid audit: 14 days)
3. Click Columns → Customise columns → add: Campaign name, Ad set name, Ad name, Status, Budget, Spend, Impressions, Clicks (all), CTR, CPC, CPM, Reach, Frequency, Results, Cost per result, ROAS (if ecommerce), Link clicks, Landing page views, Leads (if lead gen)
4. Click Export → CSV → Download
5. Save file as: meta-export-YYYY-MM-DD.csv

**TikTok Ads Manager: how to export**
1. Open TikTok Ads Manager → Campaign Management
2. Set date range: last 30 days
3. Click Customise columns and add: Campaign name, Ad group name, Ad name, Spend, Impressions, Clicks, CTR, CPC, CPM, Conversions, CPA, ROAS, Video views (2s, 6s, complete), Video play 25% / 50% / 75% / 100%, Thumb stop rate
4. Click Export → CSV → Download
5. Save file as: tiktok-export-YYYY-MM-DD.csv

### How to paste into the dashboard
1. Open your AdPilot OS Google Sheets Dashboard
2. Go to the "CSV Import" tab
3. Click cell A1
4. Open your CSV in a text editor or spreadsheet app → Select All → Copy
5. Click paste in the Sheets cell A1
6. Navigate to the "Dashboard" tab — metrics should populate automatically

### Common import problems
- **Numbers showing as zero:** Check that your CSV column headers exactly match the column names expected in the CSV Import tab (shown in yellow in row 1)
- **Numbers formatted incorrectly (commas as thousands separators):** Open the CSV in Google Sheets first (File → Import) to let Sheets auto-detect the number format, then copy from Sheets rather than the raw CSV
- **Date range errors:** The dashboard uses the date range from the export itself — there is no date entry field. The date range shown in the Dashboard header is drawn from the data

---

## Article 4: Running an Audit

### What the audit checks
The AdPilot OS audit runs through 14 layers:

1. Account structure (campaign hierarchy, ad set organisation)
2. Naming conventions (whether campaigns/ad sets/ads follow a trackable format)
3. Tracking and pixel quality (pixel installation, conversion event accuracy)
4. UTM and URL audit (are all ads tagged? do the URLs work?)
5. Budget allocation (is spend concentrated on what works, or fragmented?)
6. Audience analysis (overlap, saturation, size relative to budget)
7. Creative performance (CTR, frequency, fatigue indicators)
8. Copy and offer review (hook clarity, CTA, offer alignment)
9. Landing page alignment (is the ad promise matched by the landing page?)
10. Conversion rate analysis (are the right events firing and at expected rates?)
11. CPL/CPA vs. target (is cost per result within viable range?)
12. ROAS / MER analysis (ecom accounts: is revenue on-track?)
13. Creative testing cadence (is new creative being tested regularly?)
14. Decision rule review (does the evidence support scaling, holding, or cutting?)

### How to run the audit: step by step
1. Open claude.ai → new conversation
2. Copy the system prompt from skills/meta-ads-audit/SKILL.md → paste as first message (or set as Claude Projects system prompt)
3. Open your Google Sheets Dashboard → go to "Audit Summary" tab → Select All → Copy
4. In Claude, type: "Please run a full AdPilot OS audit on this account." → paste the audit summary
5. Wait for the output (typically 30–90 seconds depending on account complexity)

### What you receive
- An overall health score (0–100)
- A per-layer breakdown with individual scores
- A ranked findings list (Critical / High / Medium / Low)
- Decision rules triggered by the data
- Recommended actions in priority order

### Safety note
The audit is read-only. It analyses your data — it does not connect to or modify your ad account. Every recommended action is a proposal for you to implement manually.

---

## Article 5: Reading the Health Score

### What the health score is
The health score is a weighted composite of 10 performance and structural metrics. It runs from 0 to 100. It tells you where your account stands and what the highest-leverage issues are.

### Score bands

| Band | Score | Meaning |
|------|-------|---------|
| Green | 80–100 | Account is performing well; monitor and optimise at the margins |
| Yellow | 60–79 | Good foundation; 2–3 specific issues to address; not urgent |
| Orange | 40–59 | Significant structural problems; action needed this week |
| Red | 0–39 | Critical issues; performance is likely deteriorating; stop scaling until fixed |

### How the score is calculated

| Component | Weight | What It Measures |
|-----------|--------|-----------------|
| Tracking quality | 15% | Pixel accuracy, conversion event correctness, UTM coverage |
| CPA / CPL vs. target | 15% | Cost per result relative to your target_cpa_aud in config |
| Spend efficiency | 12% | Budget concentrated on performing ad sets vs. fragmented |
| Conversion rate | 10% | Landing page conversion rate relative to benchmarks |
| CTR | 8% | Click-through rate relative to platform/format benchmarks |
| Creative freshness | 8% | Frequency, creative rotation cadence, fatigue indicators |
| Lead quality (if lead gen) | 8% | Downstream lead quality signals (if CRM data is available) |
| ROAS / MER (if ecom) | 8% | Return on ad spend relative to target_roas in config |
| Account structure | 8% | Naming conventions, hierarchy, campaign organisation |
| Budget pacing | 8% | Spend rate vs. monthly budget (on-track, over-pacing, under-pacing) |

**Worked example:** An account with tracking quality 10/100 (pixel broken) × 0.15 = 1.5 contribution. CPA 28/100 (40% over target) × 0.15 = 4.2 contribution. All 10 components sum to the final score.

### What to do with the score
- The score is a diagnostic, not a verdict. A score of 41 does not mean your campaigns are failing — it means there are specific, fixable issues.
- Always read the ranked findings list alongside the score. The findings tell you what is pulling the score down and in what order to fix it.
- Re-run the audit after implementing the top 3 recommendations. The score should move. If it does not, re-check the data.

### What the score does NOT tell you
- It does not predict future performance
- It does not benchmark against competitors
- It does not account for seasonal variation or external events (a low ROAS in December for non-seasonal products reads differently than in August)
- It does not make decisions — you do

---

## Article 6: Troubleshooting

### The audit skill is returning blank or incomplete output
- Cause: The context window is too large for the Claude free plan
- Fix: Summarise your CSV to the top 20 campaigns/ad sets by spend before pasting; or upgrade to Claude Pro for a larger context window

### The health score seems wrong (too high or too low)
- Cause 1: The config targets are not filled in correctly — if target_cpa_aud is 0, the CPA component will calculate incorrectly
- Fix: Check client-config.yaml and confirm all target fields have real numbers
- Cause 2: The CSV data includes a non-standard date range (e.g. only 3 days instead of 30)
- Fix: Re-export with a 30-day date range

### The dashboard shows zeros after importing
- Cause: Column headers in the CSV do not match expected headers
- Fix: Open the CSV Import tab and compare row 1 (expected headers in yellow) with the actual column headers in your file; rename your CSV columns to match

### Claude is not following the audit skill correctly
- Cause: The system prompt was not set before pasting the data
- Fix: Start a new conversation; paste the entire skill system prompt first; then provide the data in the next message; or use Claude Projects to persist the system prompt

### The report template is not populating
- The report template is not auto-populated — it requires you to manually copy the Claude output into the correct sections. There is no auto-populate function at Starter tier (V1). This is by design to avoid formatting errors.

### Automation is not triggering (Pro users)
- Check that the trigger is set correctly in your Make/Zapier/n8n blueprint
- Verify the Sheets connection is authenticated — Google auth tokens expire; re-authorise the connection
- Review the automation run history in your platform for error logs

---

## Article 7: Frequently Asked Questions

**Q: Do I need to be technical to use AdPilot OS?**
A: No. The Starter tier requires only the ability to download a file, use Google Sheets, and type prompts into Claude. Step-by-step SOPs are provided for every action.

**Q: Does AdPilot OS connect to my ad account?**
A: No, not at Starter or Pro tier. You export a CSV manually and paste it into the dashboard. V3 API tier (future) will support direct API connections.

**Q: Will Claude make changes to my ads?**
A: Never. The safety model prevents any live ad modifications. All proposed changes are delivered as paused duplicates, drafts, or written proposals for you to implement manually.

**Q: How often should I run the audit?**
A: Minimum: monthly. Recommended for active accounts: fortnightly. Pro users with the weekly automation: weekly summary, monthly full audit.

**Q: Can I use this for client accounts at Starter tier?**
A: Yes, to audit and report on a client account. You cannot resell the system or white-label it under your own brand at Starter tier — that requires the Agency licence.

**Q: What if my tracking is broken?**
A: The audit will identify it. Tracking quality is the highest-weighted component of the health score. The audit will give you specific instructions on how to fix the pixel and UTM issues it finds.

**Q: Does it work for Google Ads?**
A: Not currently. AdPilot OS covers Meta and TikTok. Google Ads is on the roadmap.

**Q: Will this work in the US / UK / NZ?**
A: Yes. The config supports any currency. The pricing in this documentation is in AUD; the system works globally.

---

## Article 8: Glossary of Metrics

| Metric | Full Name | Definition | Good / Concerning |
|--------|-----------|-----------|------------------|
| CTR | Click-Through Rate | Clicks ÷ Impressions × 100. What % of people who saw the ad clicked. | Meta feed: above 1.5% is healthy; below 0.5% is concerning. TikTok: above 1.0% healthy. |
| CPC | Cost Per Click | Total spend ÷ Total clicks. Average cost to get one click. | Context-dependent; compare against your own historical baseline and target CPA. |
| CPM | Cost Per Thousand Impressions | (Spend ÷ Impressions) × 1,000. The cost to show your ad 1,000 times. | High CPM may indicate narrow audience or high competition. Track trends over time. |
| CPA | Cost Per Acquisition | Total spend ÷ Total acquisitions (purchases, sign-ups, etc.). | Compare against your break-even CPA from the config. |
| CPL | Cost Per Lead | Total spend ÷ Total leads. For lead-generation campaigns. | Must be below your break-even CPL to be viable. |
| ROAS | Return on Ad Spend | Revenue attributed to ads ÷ Ad spend. E.g. $3 ROAS = $3 revenue per $1 spent. | Target depends on margin. A 2.0 ROAS is below break-even for most businesses. |
| MER | Marketing Efficiency Ratio | Total revenue ÷ Total marketing spend (all channels). More reliable than ROAS for multi-channel businesses. | Aim for MER that reflects blended profitability across all ad channels. |
| Frequency | — | Average number of times each person in the audience has seen the ad. | Above 3.0: watch CTR for decline. Above 5.0: creative fatigue is very likely. |
| Hook Rate | — | (3-second video views ÷ Impressions) × 100. What % of people watch past the 3-second mark. | Above 30%: strong hook. Below 15%: hook is failing to stop the scroll. |
| Hold Rate | — | (Video completion views ÷ 3-second views) × 100. Of people who stayed for 3 seconds, how many watched to the end. | Above 25%: content is holding attention well. Below 15%: video loses people after the hook. |
| Break-even CPA | — | (Average order value × Gross margin %) or (LTV × margin). The maximum you can pay for a conversion before losing money. | Set this in client-config.yaml as target_cpa_aud; the audit uses it as the benchmark. |
| Break-even ROAS | — | 1 ÷ Gross margin %. If your margin is 40%, break-even ROAS is 2.5. | If your ROAS is below break-even ROAS, the account is losing money on ads. |
| Health Score | — | Weighted composite of 10 performance and structural metrics. 0–100 scale. | Green 80–100, Yellow 60–79, Orange 40–59, Red 0–39. |
| Thumb Stop Rate | TikTok | (2-second video views ÷ Impressions) × 100. TikTok equivalent of hook rate. | Above 25%: strong. Below 15%: hook is not stopping the scroll. |
| ATR | Audience-to-Ad Ratio | Number of active ads ÷ Estimated audience size (approximate). Used to flag creative fatigue risk. | More ads per audience size = faster fatigue. |
| Budget Pacing | — | Daily spend rate vs. daily budget target. Are you spending at the right rate through the month? | Over-pacing: overspend risk. Under-pacing: missed reach, may indicate creative/bid issues. |
| Creative Fatigue Score | — | Composite of frequency, CTR trend, and days-in-flight. Internal AdPilot OS metric. | Above 70: refresh creative. Above 85: pause and replace. |
