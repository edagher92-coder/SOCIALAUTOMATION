# White-Label Agency Offer — AdPilot OS Agency Tier

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Price range:** $1,997–$4,997+ AUD (one-time)

---

## What the Agency Tier Is

AdPilot OS Agency is a commercial licence plus a complete white-label system that lets agencies and consultants:

1. Put their brand on the entire AdPilot OS operating system
2. Deliver structured, repeatable ad audits and reports to every client
3. Run a consistent process across a team without rebuilding the system from scratch
4. Charge their clients premium rates for a demonstrably structured approach

The Agency tier is not an extra feature on top of Starter or Pro. It is a fundamentally different commercial relationship — the buyer gets the right to white-label, rebrand, and operate the system under their own brand for their clients.

---

## What Agencies Get

### Everything in Pro, plus:

| Deliverable | Description |
|-------------|-------------|
| Commercial white-label licence | Rights to rebrand and operate AdPilot OS under your agency brand for your clients (not for resale of source — see licence) |
| Rebrand guide | Step-by-step instructions to replace AdPilot OS branding with your agency logo, colours, and name across all templates |
| Branded report templates | Google Doc and Google Sheets report templates with your logo slot, colour palette placeholders, and agency footer |
| Multi-client dashboard | Google Sheets master index listing all clients, their health scores, last audit date, monthly spend, and status |
| Client onboarding pack | A structured questionnaire + config setup guide you send to new clients — they fill it in, you build their config |
| Agency SOPs | Team delegation guide: who does what, at which step, with which tool |
| Client explainer deck | Editable Canva or PowerPoint deck explaining the audit process to clients in plain language — use it in sales meetings |
| Sales support pack | Pricing guidance for your clients, objection handling scripts, how to position the monthly audit as a retainer service |
| Agency onboarding call | 1 × 90-minute Zoom session (included with $2,997+ variant) for setup, first client audit together, report customisation |
| 12-month update access | When AdPilot OS releases new skills, templates, or SOPs, Agency licence holders receive the update at no extra cost for 12 months |
| `agency-white-label-pack` skill | Claude skill that runs the full agency audit workflow with multi-client context awareness |

---

## How to Rebrand

The rebrand process is designed to be completed in under 30 minutes by anyone who can use Google Docs and Google Sheets.

### Step 1 — Update the report templates
1. Open the Google Doc report template (Weekly Report and Monthly Report)
2. Replace the "AdPilot OS" text in the header and footer with your agency name
3. Upload your agency logo to Google Drive → insert in the header image placeholder
4. Change the accent colour in the "Header Style" to match your brand hex code

### Step 2 — Update the dashboard
1. Open the Google Sheets master dashboard
2. Go to the "Cover" tab → replace "AdPilot OS" with your agency name
3. Change the tab colour and header fill colour to match your brand

### Step 3 — Update the client explainer deck
1. Open the Canva or PowerPoint file
2. Find and replace all "AdPilot OS" text with your agency name
3. Swap the logo placeholder on slide 1 with your own logo
4. Export as PDF for client-facing use

### Step 4 — Update the email templates
1. Open the client onboarding email templates
2. Replace sender name, email footer, and all "AdPilot OS" references

### What NOT to change
- Do not alter the audit skill system prompts (logic is version-controlled)
- Do not remove the {{client.*}} config variable structure — this is what makes the system multi-client compatible
- Do not change the health score formula weights without testing the outputs against the QA test cases in qa/metric-calculation-tests.md

---

## Multi-Client Setup

### Architecture overview
Each client gets their own:
- `client-config.yaml` file (stored in your agency Google Drive, never shared with the client)
- Google Sheets dashboard (make a copy of the master template for each new client)
- Report folder (Google Drive folder per client: /Agency/[ClientName]/Reports/)

### Master client index
The Agency multi-client index sheet tracks:

| Column | Content |
|--------|---------|
| Client code | Short internal ID (e.g. ACME, PETSHOP, SOLARSYD) |
| Client name | Full business name |
| Primary platform | Meta / TikTok / Both |
| Monthly budget (AUD) | Approximate current spend |
| Dashboard link | Link to their personal Sheets copy |
| Config file | Path to their config file in Drive |
| Last audit date | Date of most recent audit |
| Last health score | Most recent score (0–100) |
| Score trend | Up / Down / Stable |
| Next audit date | Scheduled next run |
| Status | Active / On hold / Paused |

### Adding a new client: workflow
1. Send the Client Onboarding Questionnaire (template provided)
2. Receive completed questionnaire → build client-config.yaml
3. Make a copy of the Sheets dashboard → rename → add to master index
4. Run the first audit (use sample data if the client's first CSV is not yet available)
5. Deliver the first report within 5 business days of onboarding

---

## Branded Reports

### What a branded report contains
Agency clients receive a report on your letterhead, not AdPilot OS letterhead. The structure is:

**Weekly Client Report (1–2 pages)**
- Your agency logo and name in the header
- Client name and reporting period
- Health score with band (Green/Yellow/Orange/Red)
- 3 key metrics this week (vs. last week)
- Top finding + recommended action
- Next week's creative test briefed
- Your agency footer (contact, website)

**Monthly Client Report (4–6 pages)**
- Full executive summary
- Platform performance breakdown
- Creative performance table
- Tracking and UTM audit status
- Budget pacing review
- Month-over-month trend table
- Priority actions list for the coming month
- Your branding throughout

### How reports are generated
1. Export client's CSV from Meta/TikTok
2. Paste into their dedicated Sheets dashboard
3. Open Claude → load `client-report-generator` skill → specify client config
4. Claude generates the full report copy
5. Copy output into the branded Google Doc template
6. Export as PDF → send to client

**Pro/Agency automation variant:** Weekly report automation (Make/Zapier) can pull the Sheets summary and trigger Claude to draft the report, which arrives in your inbox each Monday morning ready for a final review before sending.

---

## Pricing to Your Clients

This section provides guidance on how to price the AdPilot OS workflow as a service to your clients. These are suggestions, not constraints — you set your own prices.

### Option 1: Monthly audit retainer
Provide a monthly audit, health score, and report as a recurring service.

**Suggested price range:** $300–$800 AUD/month per client (depending on account complexity and spend size)

**Example margin:**
- Agency tier one-time cost: $2,997
- If retaining 4 clients at $400/month: $1,600/month
- Payback period: under 2 months
- Year 1 revenue from 4 clients at $400/month: $19,200
- Year 1 margin after cost of AdPilot OS: $16,203

### Option 2: Monthly management fee inclusion
Bundle the audit into an existing monthly management retainer — position it as "structured performance reporting" included in the service. Typical management fees: $1,500–$5,000+/month.

### Option 3: Standalone audit deliverable
Offer a one-time account audit + report as a lead-generation offer or a standalone product.

**Suggested price range:** $497–$1,497 AUD per audit
**Positioning:** "We'll audit your entire Meta and TikTok account, score it, and give you an action plan in 5 business days."

### Option 4: Onboarding audit (new client intake)
Use the AdPilot OS audit as the standard onboarding step when a new client signs on. Charge a setup fee that includes the first audit.

**Suggested price range:** $500–$1,500 AUD onboarding fee (in addition to the first month's management fee)

---

## Margins and Business Case

| Scenario | Detail |
|----------|--------|
| Agency tier cost | $2,997 AUD one-time |
| Client 1 first audit (standalone) | $997 AUD — already recovered 1/3 of cost |
| Client 1 on monthly audit retainer at $497/month | Breakeven in 5 months on this one client alone |
| 5 clients on monthly retainer at $400/month | $2,000/month recurring; payback in 1.5 months |
| 10 clients (common agency scale) at $400/month | $4,000/month; $48,000/year from the audit service line alone |

The AdPilot OS Agency tier is designed to pay for itself within 30–90 days for any agency already managing more than 3 ad accounts.

---

## Sales Support for Agency Partners

### Included in Agency tier

**Positioning script:** How to explain the audit service to a prospective client in 3 sentences.

> "We use a structured, AI-assisted audit process to analyse your ad account across 14 dimensions — campaign structure, tracking, creative performance, budget allocation, and targeting efficiency. You receive a health score from 0 to 100 and a prioritised action plan within 5 business days. Most clients find 15–25% of their spend is going to campaigns that aren't contributing to revenue."

**Objection handling:**
- "We already have Ads Manager reports." → The health score goes beyond Ads Manager — it catches broken tracking, creative fatigue, and audience overlap that the platform dashboard won't show you.
- "Our agency already does this." → Ask them for their last audit. Most agencies provide a metrics report, not a structured audit. There is a difference.
- "Is this just AI?" → The AI analyses your data using a structured framework. The output is reviewed and delivered by your account manager. The AI does the heavy lifting; the expert does the thinking.

**Case study template (placeholder):** A before/after case study template in Google Doc format, ready for you to fill in with a real client story. [PLACEHOLDER — complete with first real agency success story]

---

## Agency Partner Onboarding Plan

### Day 1: Purchase + delivery
- Receive ZIP file and licence
- Open README-FIRST.md
- Schedule the onboarding call (for $2,997+ variant)

### Days 2–7: Rebrand
- Complete rebrand guide (30 minutes)
- Customise report templates
- Build first client config

### Week 2: First client audit
- Run first audit on a real client account (or use sample data from qa/sample-data-tests.md)
- Generate first branded report
- Internal review: does the output meet your quality standard?

### Week 3: Process integration
- Brief your team on the SOPs
- Set up Multi-client index sheet
- Configure automation (if running Pro workflows)
- Document any agency-specific modifications to the process

### Week 4: First client delivery
- Deliver first client audit and report
- Get client feedback
- Refine template if needed

### Month 2+: Scale
- Onboard additional clients
- Run weekly/monthly cadence
- Review QA quarterly (see qa/commercial-readiness-checklist.md)
