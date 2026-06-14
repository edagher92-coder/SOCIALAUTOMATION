# Onboarding Flow — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Covers:** All four tiers — Starter, Pro, Agency, Done-With-You

---

## Overview

Onboarding is the product experience that turns a buyer into an active user. AdPilot OS onboarding is designed so a non-technical business owner can reach their first meaningful outcome (a health score + action list) within 45 minutes of purchase — without human support.

---

## Tier 1: Starter Onboarding

### Trigger: Purchase confirmed (Gumroad / Lemon Squeezy / Stripe delivery)

### Email 1 — Welcome (sent immediately on purchase)
**Subject:** Your AdPilot OS files are ready — start here

Contents: download link to ZIP, link to onboarding guide, what to expect in the next 45 minutes, single CTA: "Complete Step 1 of the onboarding checklist."

---

### Step 1 — Unpack and Open (10 minutes)
1. Download and unzip the AdPilot OS Starter ZIP
2. Open README-FIRST.md inside the ZIP — read it fully before opening anything else
3. Make a personal copy of the Google Sheets Dashboard (link inside README-FIRST.md)
4. Rename the dashboard: "AdPilot OS — [Your Business Name] — [Month YYYY]"
5. Open client-config.yaml in any text editor (Notepad, TextEdit, VS Code)

**Success indicator:** Dashboard open in Google Sheets. Config file open. No errors.

---

### Step 2 — Configure Your Client (5 minutes)

Open client-config.yaml and fill in these fields (remove all {{client.*}} placeholders):

```yaml
client:
  name: "Your Business Name"
  currency: "AUD"
  monthly_budget_aud: 2000
  primary_platform: "meta"        # meta / tiktok / both
  business_type: "ecom"           # ecom / lead_gen / local / saas / other
  target_cpa_aud: 45
  target_roas: 3.5
  report_currency: "AUD"
  timezone: "Australia/Sydney"

kpis:
  primary: "roas"                 # roas / cpa / cpl / revenue
  secondary: "cpl"
```

Full field guide is in config-guide.md inside the ZIP.

**Success indicator:** Config saved. No {{client.*}} variables remain. All numbers reflect your actual KPIs.

---

### Step 3 — Export Your Data (10 minutes)

Follow SOP-01 (Meta) or SOP-02 (TikTok) from the SOP folder.

**Meta Ads Manager — required columns:**
Campaign name, Ad set name, Ad name, Status, Budget, Spend, Impressions, Clicks (all), CTR, CPC, CPM, Reach, Frequency, Results, Cost per result, ROAS (if ecom), Link clicks, Landing page views, Leads (if lead gen).

Date range: Last 30 days. Format: CSV.

**TikTok Ads Manager — required columns:**
Campaign name, Ad group name, Ad name, Spend, Impressions, Clicks, CTR, CPC, CPM, Conversions, CPA, ROAS, Video views (2s, 6s, complete), Thumb stop rate.

Date range: Last 30 days. Format: CSV.

**Success indicator:** CSV saved on your computer with the correct column headers.

---

### Step 4 — Import Into Dashboard (5 minutes)
1. Open your AdPilot OS Google Sheets Dashboard
2. Go to the "CSV Import" tab
3. Paste CSV data starting at cell A1
4. Go to the "Dashboard" tab
5. Confirm that total spend, impressions, clicks, CTR, CPC, CPM show real numbers

Troubleshooting: if numbers show zero, check that CSV column headers match the expected headers shown in yellow in row 1 of the CSV Import tab.

**Success indicator:** Dashboard shows your real metrics. Spend column is not zero.

---

### Step 5 — Run the Audit (15–20 minutes)
1. Open claude.ai (free or Pro)
2. Start a new conversation
3. Copy the audit skill prompt from skills/meta-ads-audit/SKILL.md (first code block)
4. Paste it as your first message (or set it as a Claude Projects system prompt)
5. Go to your Dashboard → "Audit Summary" tab → copy all content
6. Paste the summary into Claude with: "Please run a full AdPilot OS audit on this account."

**Expected output:**
- Health score 0–100 with a label (e.g. "42/100 — Account Needs Work")
- 3–7 specific findings, each with severity (critical / medium / low)
- Recommended actions in priority order

**Success indicator:** Health score received. At least 3 findings returned. Write the score down.

---

### Step 6 — Generate Your Report (10–15 minutes)
1. Load the reporting skill from skills/ads-reporting-builder/SKILL.md
2. Tell Claude: "Using the audit findings above, generate a professional AdPilot OS report."
3. Copy the report output
4. Open the Client Report Template (Google Doc — link in README-FIRST.md)
5. Make a personal copy → rename → paste in Claude's output

Report sections (pre-formatted in the template):
- Account Overview (date range, platform, spend)
- Health Score and label
- Top 3 Findings (critical issues)
- Top 3 Wins (what is working)
- Priority Actions This Week
- Metrics Table

**Success indicator:** Completed report document you could share with a business partner.

---

### Success Milestone: Starter

You have succeeded when:
- [ ] Config completed with real information
- [ ] Dashboard shows real metrics
- [ ] Health score obtained
- [ ] Report generated and template populated
- [ ] Total time: under 45 minutes

**Email 2 — Day 3:** How did your first audit go? Link to troubleshooting FAQ. Soft intro to creative matrix and UTM builder.

**Email 3 — Day 14:** Have you run your second audit? Monthly auditing is where the value compounds. Intro to Pro automation tier.

---

## Tier 2: Pro Onboarding

Everything in Starter onboarding, plus:

### Additional Step — Automation Setup (45–90 minutes)
1. Choose your automation platform: Make, Zapier, or n8n
2. Open the relevant blueprint from the automations/ directory
3. Follow the platform-specific SOP (SOP-06: Make, SOP-07: Zapier, SOP-08: n8n)
4. Test with a manual trigger — confirm data flows to report doc or email alert
5. Set alert thresholds in config: CPA spike %, creative fatigue day count, budget pacing deviation %
6. Enable weekly report automation — configure day and time

**Success milestone for Pro:**
- [ ] At least one automation workflow live and tested
- [ ] At least one alert successfully triggered
- [ ] Weekly report automation scheduled

Priority email support — 1 business day response target.

---

## Tier 3: Agency Onboarding

Everything in Pro, plus:

### Step A — Rebrand (30 minutes)
1. Open the agency-white-label-pack skill and rebrand guide
2. Replace all AdPilot OS references with your agency brand in:
   - Report templates (logo, colours, footer)
   - Email templates
   - Dashboard header tab
3. Store all rebranded files in your own Google Drive
4. Do NOT distribute files still containing "AdPilot OS" branding to clients (see licence)

### Step B — Multi-Client Setup (15 minutes per client)
1. Duplicate the Google Sheets Dashboard for each new client
2. Create a separate client-config.yaml per client named [client-code]-config.yaml
3. Complete the agency multi-client index sheet (template provided): lists all clients, dashboard links, last audit date, health score, next audit date

### Step C — Onboarding Call ($2,997+ variant only, 90 minutes)
Agenda:
- 20 min: System architecture walkthrough
- 20 min: Configure first client live together
- 20 min: Run first audit on real or sample data together
- 20 min: Customise report template live
- 10 min: Q&A and next steps

**Success milestone for Agency:**
- [ ] All AdPilot OS branding replaced with agency brand in all client-facing files
- [ ] First client configured end-to-end
- [ ] First client audit and report completed
- [ ] Multi-client index populated
- [ ] Team trained or Loom walkthrough recorded

---

## Tier 4: Done-With-You Onboarding

### Day 1 — Kickoff Call (60 minutes)
- Complete client-config.yaml together on the call
- Export first CSV together (screenshare)
- Import into dashboard together

### Days 2–3 — Setup completion (async, operator side)
- Dashboard configured
- Automation workflows installed (if Pro/Agency)
- Loom walkthrough of configured setup delivered

### Days 3–5 — First audit and report
- First audit run (operator + client review)
- First report delivered as a Google Doc

### Days 6–17 — Post-setup support
- 2 weeks async email support
- Troubleshooting, formula fixes, Claude output review

**Success milestone for DWY:**
- [ ] System fully configured by operator
- [ ] First audit complete
- [ ] First report in buyer's hands
- [ ] Buyer watched Loom walkthrough and confirmed ability to run next audit independently

---

## Master Onboarding Checklist

### Pre-launch (Operator side)
- [ ] ZIP packaged and tested on a fresh machine (not the build machine)
- [ ] All Google Sheets templates set to "Anyone with link can make a copy"
- [ ] All {{client.*}} variables documented in config-guide.md
- [ ] No real account IDs, API keys, or private data in any template or skill
- [ ] README-FIRST.md is the first file a buyer sees when opening the ZIP
- [ ] Delivery platform tested end-to-end (purchase → download → unzip → open)

### Buyer side — Starter
- [ ] ZIP downloaded and unzipped
- [ ] README-FIRST.md read
- [ ] Google Sheets Dashboard copied to personal Drive
- [ ] client-config.yaml completed (all placeholders replaced)
- [ ] CSV exported from ad platform
- [ ] CSV imported into Dashboard CSV Import tab
- [ ] Dashboard shows real metrics
- [ ] Audit skill loaded in Claude
- [ ] Audit run successfully
- [ ] Health score obtained
- [ ] Report generated
- [ ] Report template populated

### Buyer side — Pro (add to Starter)
- [ ] Automation platform chosen
- [ ] Blueprint imported
- [ ] Alert thresholds configured
- [ ] Test alert triggered
- [ ] Weekly report automation scheduled

### Buyer side — Agency (add to Pro)
- [ ] All branding replaced with agency brand
- [ ] First client configured in multi-client index
- [ ] Onboarding call completed (if $2,997+ variant)
- [ ] Client-facing materials reviewed and branded

### Buyer side — Done-With-You (operator-managed)
- [ ] Kickoff call completed
- [ ] Config completed by operator
- [ ] Dashboard set up by operator
- [ ] Loom walkthrough delivered
- [ ] First audit run
- [ ] First report delivered
- [ ] Buyer confirmed independence
