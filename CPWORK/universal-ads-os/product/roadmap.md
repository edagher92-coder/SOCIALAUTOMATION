# AdPilot OS — Product Roadmap
**Universal Meta + TikTok Paid-Ads Operating System**
Last updated: 14 June 2026 | Owner: Product

---

## ASCII Timeline

```
2026                                    2027                          2028
Q3        Q4        Q1        Q2        Q3        Q4
|---------|---------|---------|---------|---------|---------|
[Phase 1 ]
          [Phase 2  ]
                    [Phase 3  ]
                              [   Phase 4              ]
                                                       [Phase 5 ...]
```

---

## Summary Table

| Phase | Name | Timeline | Revenue Model | Key Unlock | Risk Level |
|-------|------|----------|---------------|------------|------------|
| 1 | V1 MVP | Q3 2026 (ship 1 Aug) | One-time product sales: $197 / $997 / $2,500 DWY | 25 skills QA'd, 12 agents live, Starter + Pro on sale | Medium |
| 2 | V1 Complete | Q4 2026 (Oct–Dec) | + Agency tier $2,997 / DWY retainers begin | Agency white-label, 6-tab dashboard, remaining 11 skills | Medium |
| 3 | V2 Automation | Q1 2027 (Jan–Mar) | + $97–147/month subscription for automation pack | Eliminates manual CSV; Make/Zapier/n8n live | Medium-High |
| 4 | V3 API | Q2–Q3 2027 (Apr–Sep) | SaaS per-client pricing begins: $97/month/account | Direct API pulls, OAuth, white-label portal | High |
| 5 | SaaS Platform | Q4 2027+ | Full SaaS MRR: platform + seat fees + reseller licences | Multi-tenant web app, Stripe billing, marketplace | Very High |

---

## Phase 1: NOW — V1 MVP
**Q3 2026 | Target ship date: 1 August 2026**

This is the version that proves the concept, charges real money, and funds everything that follows. No automation, no API access, no subscription. A product someone can buy today and use tomorrow inside Claude.

### Features

#### 25 Skills — Finalised and QA'd

All 25 skills must pass QA before ship. The five most consequential for Phase 1 value delivery:

1. **`meta-ads-audit`** — structured account audit covering campaign architecture, audience targeting, creative health, budget allocation, and ROAS by campaign objective. Output: scored audit report with prioritised action list.
2. **`tiktok-ads-audit`** — equivalent audit for TikTok Ads Manager: creative format compliance, spark ad eligibility, bid strategy review, audience overlap detection.
3. **`campaign-health-monitor`** — calculates a 0–100 Health Score per account using weighted inputs (CTR, ROAS, frequency, spend pacing, creative fatigue indicators). The number the client sees on the dashboard.
4. **`client-report-generator`** — transforms raw performance data (pasted from CSV or typed manually) into a formatted client report. Handles tone calibration (internal vs client-facing), highlights, and recommended next actions.
5. **`paid-ads-data-analysis`** — general-purpose data interpreter for any CSV export; identifies anomalies, trends, and outliers; surfaces the three most important things the data is saying.

Remaining 20 skills ship in Phase 1 as functional but are not the primary marketing focus:
`universal-ads-operating-system`, `start-ads-command-centre`, `universal-business-onboarding`, `utm-naming-builder`, `ads-reporting-builder`, `tracking-attribution-review`, `creative-fatigue-detector`, `snowflow-business-context`, `profit-minute-au-context`, `no-code-automation-builder`, plus the 10 skills moving into Phase 2 primary positioning (`creative-testing-lab`, `agency-white-label-pack`, `lead-quality-analyser`, `offer-funnel-review`, `ads-policy-risk-checker`, `budget-pacing-monitor`, `api-integration-planner`, `dashboard-spec-builder`, `productisation-roadmap-builder`, `qa-system-tester`).

#### 12 Agent Prompts — Finalised in `agents/`

All 12 agent `.md` files complete, documented, and cross-referenced with their skill dependencies:

- `start-ads-command-centre.md` — router agent; triages every user input to the correct specialist
- `mira-meta-ads-strategist.md`
- `travis-tiktok-ads-strategist.md`
- `dana-ads-data-analyst.md`
- `stella-social-creative-strategist.md`
- `titan-offer-funnel-strategist.md`
- `milo-ai-automation-builder.md`
- `atlas-tracking-attribution-agent.md`
- `riley-client-reporting-agent.md`
- `paige-ads-policy-safety-agent.md`
- `piper-productisation-saas-agent.md`
- `quinn-qa-testing-agent.md`

Each agent file must specify: role, primary skills invoked, escalation path, output format, and safety constraints (paused duplicates only; archive not delete; typed YES confirmation for budget moves).

#### Config Files

- `config/client-config.yaml` — per-client overrides: business name, industry, platforms, monthly budget, primary KPI, CRM fields, reporting schedule, tone preference. Fully documented with inline comments.
- `config/universal-defaults.yaml` — system-wide defaults for health score weights, alert thresholds, UTM taxonomy, report templates, and currency (AUD default).

#### Templates

- `meta-ads-audit-template.md` — pre-populated output structure with section headers, scoring rubric, and example commentary so a new user knows exactly what a finished audit looks like.
- `tiktok-ads-audit-template.md` — equivalent for TikTok; accounts for differences in ad format taxonomy (TopView, In-Feed, Spark Ads, Collection Ads).
- `daily-performance-tracker.csv` — universal schema: Date, Platform, Campaign Name, Campaign Objective, Ad Set Name, Ad Name, Impressions, Reach, Clicks, CTR, Spend (AUD), CPC, CPM, Conversions, CPA, ROAS, Frequency, Video Views (3s), Video Completion Rate. Platform-agnostic column order; Notes column for manual flags.
- `business-onboarding-form.md` — structured intake capturing: business type, ad platforms, monthly ad spend, primary conversion event, current CRM, biggest performance problem, and what success looks like in 90 days.
- Weekly performance report template — 1-page format: KPI scorecard, top 3 wins, top 3 concerns, recommended actions, creative status.
- Monthly executive summary template — 2-page format: month-over-month KPI table, budget utilisation, health score trend, strategic recommendation for next month.
- Creative matrix template — organises creative tests by Hook × Format × Offer across Meta and TikTok; includes status column (Testing / Winner / Fatigue / Retired).
- Lead tracker template — columns: Date, Source, Campaign, Ad Set, Lead Name, Phone/Email, Lead Quality (1–5 manual score), CRM Status, Outcome, Revenue.
- UTM naming builder tool (via `utm-naming-builder` skill) — generates consistent UTM parameters from: platform, campaign objective, audience type, creative type, date. Outputs a complete URL with UTM string.

#### Google Sheets Dashboard (Basic Version — 3 Tabs)

Tab 1: **Performance** — weekly KPI table (manually updated from CSV), sparklines for CTR, CPA, ROAS, spend by campaign.
Tab 2: **Health Score** — input fields for key metrics → formula calculates 0–100 score with colour-coded status (green ≥ 75, amber 50–74, red < 50). Breakdown by category: Creative, Audience, Budget, Tracking.
Tab 3: **Creatives** — creative matrix linked from template; columns for format, hook, offer, current CTR, status.

#### SOPs (5 Documents)

1. **Audit SOP** — step-by-step for running a Meta or TikTok audit using mira/travis + meta-ads-audit/tiktok-ads-audit skills. Estimated time: 45 minutes per account.
2. **Reporting SOP** — how to export CSV, paste into Claude, run dana + riley, generate the weekly report. Estimated time: 20 minutes per client.
3. **Creative Refresh SOP** — when to retire a creative (frequency ≥ 3.5 or CTR drop ≥ 25% from 7-day peak), how to brief stella, how to update the creative matrix.
4. **Scaling SOP** — decision tree: when to scale (ROAS ≥ target for 7 consecutive days, CPA stable), how much to scale (20% budget increase per step), what to monitor post-scale.
5. **Budget Pacing SOP** — daily pacing calculation (days elapsed ÷ days in month × monthly budget = expected spend), how to flag overspend or underspend, escalation steps.

#### Products Packaged for Sale

- **Starter — $197 AUD** (one-time): Prompt pack (core 8 skills), 3 agent prompts (start-ads-command-centre, mira, travis), daily tracker CSV, business onboarding form, audit templates (Meta + TikTok), weekly report template, Google Sheets dashboard (3-tab basic), 3 SOPs (audit, reporting, creative refresh), licence for 1 business.
- **Pro — $997 AUD** (one-time): All 25 skills, all 12 agents, all templates, both dashboards (basic + advanced spec document), all 5 SOPs, creative matrix, lead tracker, UTM builder, monthly executive summary template, licence for up to 3 client accounts, 30-day email support.
- **Done-With-You Setup — $2,500 AUD** (one-time): Pro product + 2×90-minute sessions to configure AdPilot OS for the client's specific accounts, naming conventions, and reporting cadence. Delivered within 14 days of purchase.

#### Supporting Materials

- Demo script (`product/demo-script.md`) — 15-minute walkthrough covering audit → health score → report generation. Scripted with sample inputs and expected outputs.
- Support docs — usage guide, FAQ, troubleshooting for common Claude prompt errors, CSV format guide for Meta and TikTok exports.
- Licence agreement — single-business licence (Starter), multi-client licence (Pro), resale prohibited at Starter/Pro tier.

### Revenue Model

One-time product sales only. No subscription. No ongoing commitment from buyer.

- Starter $197 × N sales
- Pro $997 × N sales
- Done-With-You setup $2,500 × N clients

Break-even at this phase is low: 3 Pro sales covers a month of Claude API costs and basic tooling. 1 DWY setup covers two months.

### Customer Segment

Business owners running their own Meta or TikTok ads who are currently guessing. Freelance media buyers who want a structured process but can't afford agency tooling. Operators who know their numbers are off but don't know where to start.

### Effort Required

- QA all 25 skills via quinn using `qa-system-tester` — minimum 3 test runs per skill
- Cross-check all 12 agent files for completeness and internal consistency
- Populate all template outputs with realistic sample data (not placeholder lorem ipsum)
- Build and test the 3-tab Google Sheets dashboard against the daily-performance-tracker.csv schema
- Write and review all 5 SOPs for clarity (test with one person who hasn't seen the system before)
- Package Starter and Pro as deliverable zip files with README
- Set up sales page and checkout (Gumroad, Lemon Squeezy, or equivalent)

### Target Metrics for Phase 1 Completion (QA Gate)

- QA pass rate ≥ 95% on all 25 skills (quinn signs off)
- Health score test: 3 sample accounts score within 5 points of manual baseline calculated independently
- All templates produce coherent, non-blank output on first use with realistic test inputs
- Zero live-edit safety violations in QA testing (no deletes, no unconfirmed budget changes)
- Demo script runs end-to-end in under 20 minutes with a first-time user

### Dependencies

1. Claude API access stable and within budget at projected usage levels
2. Google Sheets free tier sufficient for 3-tab dashboard at V1 data volumes (it is)
3. All 25 skills passing quinn QA gate at ≥ 95% pass rate before ship date
4. Gumroad or Lemon Squeezy account configured for AUD pricing and digital delivery
5. At least 2 real ad accounts available for health score calibration and CSV schema testing

### Risks

1. **Inconsistent skill outputs on edge-case inputs** — skills written for well-formed CSV input may produce vague or incorrect output when data is missing columns or has non-standard formatting. Mitigation: build input validation prompts into each skill; document expected input format clearly.
2. **Health score weights not calibrated to real-world accounts** — weights assigned in `universal-defaults.yaml` are based on assumptions, not live data. A score of 72 on one account may feel wrong to an experienced buyer. Mitigation: test against 3 real accounts before ship; add a calibration note in the dashboard.
3. **CSV format varies by export settings and region** — Meta's CSV export columns differ between the Ads Manager web export (Australian account, AUD) and the API export. TikTok's export differs between Ads Manager versions. Mitigation: document exact export steps for each platform; test with 2 real exports.
4. **Skills produce hallucinated recommendations on accounts with very low data** — accounts spending under $500/month with fewer than 500 clicks will have statistically noisy data. Mitigation: add a minimum data warning to audit and health skills.
5. **Ship date slips if QA gate takes longer than 2 weeks** — 25 skills × 3 tests each = 75 QA runs minimum. Mitigation: begin QA on 1 July to give 4 weeks before 1 August target.

---

## Phase 2: NEXT — V1 Complete
**Q4 2026 | October–December 2026**

Phase 1 proves the model. Phase 2 completes the V1 product set, unlocks the agency tier, and introduces the first recurring revenue through Done-With-You retainers. No new technical infrastructure — this is still no-code, still manual CSV, still Claude-native.

### Features

#### Remaining Skills — Moved from Phase 1 Backlog

- **`creative-testing-lab`** — full A/B creative hypothesis framework: define hypothesis, set success metric, minimum run duration (7 days minimum, 1,000 impressions minimum), decision rule, and next action. Works across Meta and TikTok.
- **`agency-white-label-pack`** — rebrand config (agency name, logo URL placeholder, colour palette hex codes), multi-client directory structure, client-facing report header customisation, and a private label disclaimer template.
- **`lead-quality-analyser`** — takes CRM export (lead source, campaign, lead score, outcome) and identifies which campaigns are generating leads that actually convert vs. leads that waste sales team time.
- **`offer-funnel-review`** — funnel conversion rate analysis: landing page → opt-in → sales page → purchase. Identifies the stage with the largest drop-off and recommends where to focus first.
- **`ads-policy-risk-checker`** — pre-flight creative compliance check against current Meta and TikTok policy categories (health claims, financial services, personal attributes, before/after). Outputs a risk score and specific copy flags.
- **`budget-pacing-monitor`** — daily pacing calculation across all active campaigns: compares actual spend to expected spend, flags overpace (>110%) and underpace (<85%), calculates projected month-end spend.
- **`api-integration-planner`** — planning document generator for Phase 3/4 readiness: outputs a structured spec for which API endpoints are needed, what data fields map to the universal schema, and what credentials are required.
- **`dashboard-spec-builder`** — generates a detailed spec document for building the account dashboard in Looker Studio, Airtable, or Notion based on the client's existing tools and data sources.
- **`productisation-roadmap-builder`** — helps operators turn their own service into a product: scopes the deliverable, defines the buyer, sets pricing tiers, identifies the minimum viable version.
- **`qa-system-tester`** — automated prompt regression testing: runs each skill against a stored set of test inputs and checks that outputs meet defined criteria (not blank, contains expected sections, word count in range).

#### Advanced Google Sheets Dashboard — 6 Tabs

Expands the Phase 1 3-tab dashboard:

Tab 1: **Performance** — as Phase 1, plus month-over-month comparison columns.
Tab 2: **Health Score** — as Phase 1, plus trend line (last 4 weeks), score history log.
Tab 3: **Creatives** — as Phase 1, plus creative fatigue alert column (auto-highlights when CTR drops ≥ 25% from peak).
Tab 4: **Audiences** — audience segment performance: CPM by audience type, frequency by audience, ROAS by audience. Manually updated.
Tab 5: **Tracking** — UTM compliance checker (manual audit log), conversion event status, pixel/tag status flag.
Tab 6: **Recommendations** — one-line action items pulled from the weekly report; status column (Open / In Progress / Done); owner column.

#### Agency Tier — Packaged for Sale at $2,997 AUD (one-time)

Includes everything in Pro plus:
- Agency white-label config (`agency-white-label-pack` skill)
- Multi-client directory structure (up to 10 client folders)
- 6-tab advanced dashboard
- `lead-quality-analyser`, `offer-funnel-review`, `ads-policy-risk-checker`, `budget-pacing-monitor`
- `api-integration-planner` + `dashboard-spec-builder` (for planning V3 readiness)
- `creative-testing-lab` with A/B framework
- Pitch deck template for agencies (how to sell AdPilot OS services to clients)
- 3 case study templates (results-led narrative, before/after table, testimonial structure)
- Licence for up to 20 client accounts
- 60-day email support

#### Additional Templates and Assets

- 2 additional sample reports: Lead Quality Report (output from `lead-quality-analyser`), Creative Performance Report (output from `creative-testing-lab`)
- Pitch deck template for agencies — 12-slide structure: problem, solution, results, how it works, pricing, case study slot, FAQ, next steps
- 3 case study templates: results narrative (story format), before/after performance table, testimonial + metrics card

### Revenue Model

Phase 2 revenue layers on top of Phase 1:

- Continued Starter ($197) and Pro ($997) sales
- Agency tier launches at $2,997 one-time
- Upsell from existing Starter/Pro buyers to Agency ($2,000 / $2,800 upgrade pricing)
- Done-With-You retainers begin: $1,500/month for ongoing monthly reporting, creative review, and account health monitoring. This is the first recurring revenue line. Target: 3–5 retainer clients by end of Q4 2026.

### Customer Segment Expansion

Phase 1 served business owners and freelancers. Phase 2 adds:

- **Agencies** (2–15 staff) who manage multiple client ad accounts and need a scalable reporting and audit system
- **Consultants** who want to package AdPilot OS as part of a done-for-you service offering
- **Freelancers** looking to move upmarket — use the agency tier to run a structured, professional service they can charge $2,000–5,000/month for

### Effort Required

- Complete and QA 10 remaining skills (all via quinn + `qa-system-tester`)
- Build and test 6-tab expanded dashboard
- Write and review pitch deck template and 3 case study templates
- Package Agency tier as deliverable
- Set up upgrade pricing and checkout flow for Starter → Agency and Pro → Agency paths
- Recruit 3–5 Done-With-You retainer clients (ideally from Phase 1 buyers)

### Dependencies

1. Phase 1 generates at least 10 sales (validation that someone will pay) before Agency tier is priced and marketed
2. Agency buyers identified — at least 3 early conversations with agencies before launch
3. White-label legal docs reviewed — resale and white-label licence language needs a once-over from a commercial lawyer or experienced SaaS founder
4. Upgrade checkout flow working (Gumroad/Lemon Squeezy upgrade path tested)
5. Sample data available for the 2 new report templates (lead quality, creative performance)

### Risks

1. **Agency tier priced too high or too low** — $2,997 is a significant one-time purchase for a small agency. If it converts poorly, the first lever to pull is a 30-day payment plan ($1,000 × 3), not a price cut. If it converts too easily, raise the price.
2. **White-label quality perception** — agencies will show AdPilot OS reports to their clients. If the output looks like an AI-generated template, it damages the agency's credibility. Mitigation: invest Phase 2 time in making report output look genuinely professional.
3. **Complexity creep in the template set** — adding 10 more skills and 3 new tabs risks making the product feel overwhelming. Mitigation: the onboarding form and demo script must clearly map each buyer type to the 5–8 skills they'll actually use.
4. **Retainer scope creep on DWY clients** — without a defined scope, Done-With-You retainers can expand indefinitely. Mitigation: publish a clear monthly retainer scope document before selling the first one.
5. **Skills pass QA in isolation but fail in agency multi-client workflow** — a skill that works fine for 1 account may produce garbled output when switching between client contexts. Mitigation: multi-client regression test as part of Phase 2 QA.

---

## Phase 3: SOON — V2 Low-Code Automation
**Q1 2027 | January–March 2027**

Phase 3 eliminates the biggest friction in Phase 1 and 2: manual CSV export and manual data entry. The product stops requiring 45 minutes of manual work per client per week and starts doing the data plumbing automatically. This is also when the first subscription revenue begins.

### Features

#### Make Blueprints

- **Blueprint 1: Meta Ads Export → Google Sheets (daily)** — Make HTTP module calls Meta Ads Insights API endpoint (`/act_{account_id}/insights`) with fields matching the universal schema; writes new rows to the Performance tab in the client's Sheets dashboard. Runs daily at 7am AEST. One blueprint per client account (parameterised via Make data store).
- **Blueprint 2: Weekly Report Auto-Generation** — trigger: every Monday at 8:00am AEST. Sequence: pull last 7 days of data from Sheets → format into dana agent input → run `paid-ads-data-analysis` + `client-report-generator` skills → compile report → send via Gmail to client email on file. Requires Make Pro plan ($16/month or above).
- **Blueprint 3: Health Score Auto-Update** — trigger: daily at 8am AEST, after Blueprint 1 completes. Reads current Performance tab → calculates health score using the universal formula → writes score to Health Score tab with timestamp.

#### Zapier Integrations

- **Zap 1: New Lead in CRM → Log to Lead Tracker** — when a new lead is created in HubSpot, Pipedrive, or GoHighLevel, Zap writes the lead record to the Lead Tracker sheet with source UTM data. Then triggers `lead-quality-analyser` skill input preparation.
- **Zap 2: CRM Outcome Updated → Lead Quality Score Refresh** — when a deal status changes to Closed Won or Closed Lost in CRM, Zap updates the outcome column in the Lead Tracker and recalculates lead quality by campaign. This closes the feedback loop between ad spend and actual revenue.

#### n8n Workflow

- **Multi-Client Health Score Runner** — n8n workflow loops through all client configs in `config/` directory → pulls each client's latest Sheets data via Google Sheets node → calculates health score per account → writes scores to a master Agency Dashboard sheet → sends a summary Slack message to the agency owner listing any accounts with score < 50.

#### Alerting System (3 Alerts)

- **Spend Anomaly Alert** — if daily spend deviates >25% from 7-day rolling average (in either direction), sends a Slack/email alert with account name, today's spend, 7-day average, and deviation %. Includes a one-line suggested action.
- **CTR Fatigue Alert** — if any ad's CTR drops ≥ 25% from its 7-day peak CTR, sends alert with ad name, current CTR, peak CTR, and a pre-written creative refresh prompt ready to paste into stella.
- **Frequency Alert** — if campaign frequency reaches 3.0, sends yellow warning. At 4.0, sends red alert with a pre-written action prompt: pause the ad set, duplicate with fresh creative, restart at original budget.

#### Webhook Structure

- Webhook endpoint schema documented (not a hosted server — a webhook-to-Make or webhook-to-n8n receiver) that can accept incoming event data from Meta and TikTok platform webhooks (campaign status changes, budget limit notifications, policy flags).
- Webhook payload schema defined in `api/webhook-schema.yaml` so Phase 4 API work can build directly on it.

#### CRM Feedback Loop

- Closed-won and closed-lost data from CRM automatically updates lead quality scores in the Lead Tracker sheet
- Month-end CRM pull → `lead-quality-analyser` → updated campaign-level lead quality report delivered to client

#### Pro+ Upgrade Path

- Existing Pro buyers ($997) offered V2 automation pack at $500 upgrade fee
- New buyers can purchase Pro+ directly at $1,497 (Pro product + V2 automation pack)
- Automation pack deliverable: the 3 Make blueprints (pre-built, importable JSON), 2 Zapier zap templates, 1 n8n workflow JSON, alerting setup guide, webhook schema, setup SOP (estimated 2 hours to configure for a new client)

### Revenue Model

Phase 3 introduces the first subscription:

- **Automation Maintenance Subscription — $97–147/month** (new SKU): updates to Make blueprints and Zapier zaps when Meta/TikTok change their export formats or API endpoints. Sold as an annual option ($970/year = 2 months free). Target: 20 subscribers by end of Q1 2027.
- Continued one-time sales (Starter $197, Pro $997, Agency $2,997, Pro+ $1,497)
- Done-With-You retainers continue
- Upsell from Phase 1/2 buyers to Pro+ automation pack ($500 for existing Pro, $1,497 new)

This is the phase where total monthly revenue should exceed $5,000 AUD for the first time, between one-time sales and early subscription revenue.

### Customer Segment Expansion

- **Freelancers who are time-poor** — manually exporting CSVs every day for 5+ clients is the biggest operational cost. Automation removes it.
- **Boutique media buying shops (2–5 people)** — have clients, have results, but are doing reporting manually. V2 saves 5–10 hours per week per operator.

### Effort Required

- Build and test 3 Make blueprints against live ad accounts (require Make Pro plan, Meta access token, Google Sheets API access)
- Build and test 2 Zapier zaps against live CRM (require Zapier Starter plan minimum)
- Build and test 1 n8n workflow (self-hosted n8n or n8n Cloud)
- Implement alerting logic in Make (conditional router modules) and document threshold config
- Define and document webhook schema
- Test full automation stack on 3 live client accounts before release
- Write automation setup SOP (estimated 2 hours to follow for a new client)

### Dependencies

1. Make paid account (Pro plan minimum at $16/month) — free plan has too few operations for daily runs across multiple clients
2. At least 3 live client accounts willing to participate in pre-release beta testing of Make blueprints
3. Meta Ads Insights API endpoint accessible via Make HTTP module using an existing access token (this works without formal API approval — confirmed before building)
4. Zapier Starter plan minimum for multi-step zaps with filters and delays
5. At least one live CRM integration available for testing Zap 1 and 2 (HubSpot preferred — free plan has webhooks)

### Risks

1. **Make blueprint breaks when Meta changes export endpoint or field names** — Meta updates their Ads API regularly (version deprecations every 6 months). Mitigation: subscribe to Meta for Developers changelog; build blueprint field mappings to be easily editable; include in automation maintenance subscription.
2. **Zapier task limits exceed Starter plan capacity for active agencies** — buyers running 10+ clients per day will need Zapier Professional plan ($49/month). Document this as a prerequisite; include cost in buyer TCO calculation.
3. **Webhook delivery reliability in Make and n8n** — missed webhook events during downtime mean gaps in daily data. Mitigation: build a daily reconciliation step that catches any missed webhook events by comparing Sheets data to expected values.
4. **n8n self-hosted complexity excludes non-technical buyers from the multi-client health score runner** — offer n8n Cloud as the default option in setup docs; offer a Done-With-You setup option for this specific workflow at $500.
5. **Data latency misunderstood by buyers** — Meta's 72-hour attribution window means yesterday's data will change for 3 days. Mitigation: document this clearly; run the daily pull but label the latest 3 days as "In Attribution Window."

---

## Phase 4: LATER — V3 API
**Q2–Q3 2027 | April–September 2027**

Phase 4 replaces the Make HTTP module workarounds with direct, production-grade API integrations. This is a 6-month build because it includes two API approval processes, OAuth infrastructure, and the first version of a client reporting portal. It is the technical foundation that makes SaaS possible.

### Features

#### Meta Ads Insights API — Direct Integration

- Automated daily data pull for all active campaigns across all connected accounts
- Fields: all universal schema fields plus extended attribution breakdown (1-day click, 7-day click, 1-day view, 7-day view)
- Data lands in Sheets (or database, depending on client tier) within 2 hours of day end
- Rate limit handling: exponential backoff, request queuing, error logging
- Version management: pinned to a stable API version with documented upgrade path when Meta deprecates

#### TikTok Ads API — Direct Integration

- Equivalent automated pull via TikTok Marketing API
- Campaign, ad group, and ad level data
- Video performance metrics: 2-second views, 6-second views, completion rate, average watch time
- Same universal schema mapping as Meta — one Sheets template serves both platforms

#### OAuth Flow

- Agencies connect client Meta and TikTok accounts without sharing username/password credentials
- Platform OAuth — Meta: Facebook Login for Business; TikTok: TikTok Ads OAuth 2.0
- Access tokens stored only in secure environment variables (not in Sheets, not in client-config.yaml)
- Token refresh handled automatically; expired token sends alert with re-auth link

#### Automated Import

- Replaces all manual CSV workflows and all Make HTTP module workarounds from Phase 3
- Data lands automatically; no user action required after initial OAuth setup
- Conflict detection: if a manual row exists for the same date, it is flagged (not overwritten) for review

#### Alerting v2 — Real-Time Platform Webhooks

- Meta Webhooks: campaign status changes (active → paused, budget limit reached, policy flag)
- TikTok Webhooks: equivalent campaign event notifications
- paige (`paige-ads-policy-safety-agent`) triggered automatically on any policy flag webhook event — outputs a risk assessment and recommended action within minutes of the flag

#### Client Reporting Portal

- Auto-generated branded reports delivered by email on schedule (weekly and monthly)
- Report format: PDF via Google Docs template or equivalent
- White-label: agency logo, agency name, client name, custom colour palette from `agency-white-label-pack` config
- Delivery: scheduled email with report attached, link to live Sheets dashboard, and a 3-line AI commentary generated by riley

#### White-Label Agency Mode

- Full agency dashboard: multi-client view showing all account health scores, spend totals, and alert status in one place
- Role-based access: agency admin sees all clients; media buyer sees assigned clients only (managed via Sheets sharing permissions at this stage)
- Client view-only: read-only Sheets link with filtered view for the end client

#### `api-integration-planner` Skill — Becomes Setup Wizard

- Updated: instead of outputting a planning document, it outputs a step-by-step setup checklist specific to the client's platforms, CRM, and reporting tools
- Used as the onboarding flow for every new V3 API client

#### SaaS Architecture Begins

- Multi-tenant data structure planned and partially implemented: client data isolated by account ID, not by separate Sheets files
- One set of API credentials can serve N client accounts
- This is the foundation Phase 5 builds on — no user-facing multi-tenant web app yet, but the data layer is correct

### Revenue Model

Phase 4 introduces SaaS subscription pricing:

- **$97 AUD/month per client account** (agency pays; client doesn't see the tool or the price)
- An agency with 10 clients pays $970/month
- Annual option: $970/year per client account
- One-time onboarding fee: $500 per client account (covers OAuth setup, dashboard configuration, first health score calibration)
- First meaningful MRR: target $5,000–10,000 MRR by end of Phase 4 (50–100 connected client accounts across the agency customer base)

### Customer Segment Expansion

- **Growth agencies** managing $50k–500k/month in ad spend across 10+ clients
- **Media buying teams** inside larger businesses (e-commerce, lead gen, education) with $10k+/month spend
- **Larger advertisers** who need automated reporting but aren't ready to pay for enterprise tools

### Effort Required

Significant. This phase requires engineering capability, not just prompt engineering:

- Meta API application and approval process (4–8 weeks; submit in February 2027 to have approval by April)
- TikTok API application and approval process (2–4 weeks; submit in March 2027)
- OAuth implementation (can use a library; need secure hosting for token storage)
- Database or structured storage layer (Google Cloud Storage, Supabase, or equivalent — Sheets alone won't scale)
- Error handling, logging, rate limit management
- Client reporting portal (PDF generation, email delivery, scheduling)
- Security review before any OAuth tokens are stored

### Dependencies

1. **Meta API approval** — non-negotiable; cannot be built around. Apply by February 2027. Approval can take 4–8 weeks and may require business verification.
2. **TikTok API approval** — apply by March 2027. TikTok API access is more restricted than Meta's; requires a business account and may require a use-case justification document.
3. **OAuth infrastructure** — requires a hosted environment (not a laptop); secure token storage is mandatory. Budget $50–200/month for hosting.
4. **Rate limit strategy** — Meta Ads Insights API has rate limits tied to account tier and app rating. At 50+ client accounts, rate limits become a real constraint. Must be designed for before building, not after.
5. **At least 20 paying Phase 3 subscribers** to justify Phase 4 build investment — without validated MRR, the API build is speculative.

### Risks

1. **API access denied or delayed** — if Meta rejects the API application, Phase 4 cannot proceed on schedule. Mitigation: submit Meta application as early as possible (January 2027); have a contingency plan (extend Make blueprint approach for 3 additional months while reapplying).
2. **API breaking changes** — Meta deprecates Ads API versions on a regular schedule. A breaking change mid-quarter can take down all client data pulls. Mitigation: pin to a stable version; monitor deprecation schedule; build with version abstraction.
3. **Higher cost of API calls at scale** — at 100 client accounts with daily pulls and 7-day attribution window reruns, API call volume is significant. Model cost at 200 and 500 accounts before launch.
4. **OAuth token security incident** — a leaked access token grants access to a client's live ad account and budget. No tokens in code, config files, or logs; encrypted storage mandatory; incident response plan documented before first token is stored.
5. **Auto-generated PDF report quality gap** — agencies stake reputation on client reports. First version of the reporting portal must be reviewed by at least 3 agency owners before public release.

---

## Phase 5: HORIZON — SaaS / White-Label Platform
**Q4 2027 and beyond**

Phase 5 is what you build when you have 50+ paying customers who've told you exactly what they need, when you have stable recurring revenue to fund the build, and when the API layer (Phase 4) is proven in production. Not before.

### Features

#### Full SaaS Platform

- Web dashboard replacing all Google Sheets interaction
- Multi-tenant: one platform instance serves all agencies and their clients
- Role-based access control: Agency Admin (full access), Media Buyer (assigned clients), Client (read-only, branded)
- Login via Google OAuth or email/password

#### Custom Domain White-Label

- Agencies point `app.theiragency.com` to the platform via DNS CNAME
- Client logs in and sees only the agency's branding
- Platform branding entirely invisible to end client

#### Billing — Stripe Integration

- Per-seat or per-client-account pricing via Stripe Subscriptions
- Automated invoicing: monthly invoices generated and emailed to agency billing contact
- Usage-based billing option: charge per API pull or per report generated (for high-volume agencies)
- Failed payment handling: grace period → account suspension → data export window

#### Marketplace

- Agencies can build and share their own skill extensions (additional Claude prompt modules)
- Marketplace listing: skill name, description, author, price (free or paid)
- Revenue share: 70% to skill creator, 30% to platform
- Quality gate: all marketplace skills reviewed by a quinn-equivalent process before listing

#### AI Model Flexibility

- Abstraction layer between the skill system and the underlying LLM
- Default: Claude (Anthropic API)
- Optional: swap to other models if needed (cost, capability, or procurement reasons)
- Agency buyers with enterprise LLM contracts can bring their own API key

#### Mobile-Friendly Dashboard

- Responsive web design (not a native app)
- Dashboard works on phone for quick health score checks and alert acknowledgement
- Report delivery to mobile email (already works via email; this makes the portal mobile-usable)

#### Native Integrations

- HubSpot (CRM sync, lead quality feedback loop)
- Pipedrive (equivalent)
- GoHighLevel (popular in the agency market this product serves)
- Slack (all alerts, health score summaries)
- Google Workspace (Docs, Sheets, Drive for report delivery and storage)

#### International Expansion

- Currency handling: USD, GBP, CAD alongside AUD
- Tax handling: GST (AU), VAT (UK, EU), no sales tax complexity (US digital goods)
- Localised pricing: market-rate pricing per region, not direct currency conversion
- Support timezone: expand beyond AEST

### Revenue Model

Full SaaS MRR:

- **Platform fee**: $297/month per agency (base, covers up to 5 client accounts)
- **Per-client seat**: $97/month per additional client account
- **White-label licence**: $997/month (annual subscription; custom domain, full rebrand)
- **Agency reseller programme**: agencies pay a reduced platform rate ($197/month) in exchange for a minimum client commitment and an annual agreement
- **Marketplace revenue share**: 30% of skill sales through marketplace
- **Enterprise**: custom pricing for agencies with 50+ client accounts

Target: $50,000 MRR within 12 months of Phase 5 launch. This requires approximately 170 agencies on the base plan or a mix of smaller agency counts with enterprise accounts.

### Dependencies

1. **ARR base to justify SaaS build** — building a multi-tenant web application costs $150,000–400,000 in engineering time. This is only rational when ARR is $200,000+ (approximately $17,000 MRR).
2. **Technical co-founder or senior developer hire** — no-code tools cannot build a production multi-tenant SaaS. This is a real engineering project.
3. **Hosting and security infrastructure** — SOC 2 compliance may be required for agency clients with enterprise end-clients. At minimum: encrypted data at rest, encrypted transit, access logging, regular backups.
4. **Legal infrastructure** — terms of service, privacy policy, data processing agreements for EU/UK users, MSA for enterprise clients.
5. **Support capacity** — at 50+ agencies, support volume is non-trivial. Need a support system (Intercom or equivalent) and documented escalation paths before launch.

### Risks

1. **SaaS churn** — a media buying tool loses its value quickly if results aren't materialising. Churn rates of 5–8% monthly are common for B2B SaaS tools that don't deliver clear ROI. Mitigation: make the Health Score the primary retention metric — accounts with consistently improving health scores don't churn.
2. **Support burden scales with users faster than revenue** — early SaaS growth is deceptive: revenue grows linearly, support burden grows superlinearly. Mitigation: invest in self-serve documentation, in-app guidance, and a comprehensive knowledge base before launch.
3. **Pricing compression from competitors** — if a well-funded competitor enters with a lower price, the no-code/low-code base of AdPilot OS is copiable. Mitigation: the moat is the workflow depth, the agent system, and the agency relationships — not the technology itself.
4. **Technical debt from Phase 4** — if Phase 4's API layer was built quickly, it may not support multi-tenant SaaS without significant rework. Mitigation: design the Phase 4 data model for multi-tenancy explicitly, even if the Phase 4 product is still single-tenant.
5. **Regulatory risk** — handling advertiser data (spend, conversion, audience data) across Meta and TikTok platforms carries data privacy obligations. GDPR, Australian Privacy Act, and Meta's Platform Terms must all be reviewed before Phase 5 launch.

---

## Sequencing Rationale

The sequence from audit tool to SaaS platform is not arbitrary. Each phase is timed to generate cash flow before the next phase begins, and each phase removes exactly one class of friction for the customer.

**Phase 1 starts with audit and reporting because that is where the money is.** A business owner running Meta or TikTok ads does not need automation before they understand what is broken. The first job of any ads tool is to show someone their actual numbers, score their account health, and tell them what to fix. That is the value proposition that gets paid for immediately — no API approval, no Stripe integration, no SaaS infrastructure. A well-structured Claude prompt pack with a Google Sheets dashboard produces that value today. The audit-first approach also builds trust fast: when an operator runs a health score and gets 58/100 with a breakdown that identifies three specific problems they already suspected, they believe in the tool. That belief is what converts a one-time buyer into a Done-With-You client.

**No-code before automation because the first customers are early adopters who will tolerate manual steps.** The business owners and freelancers who buy a $197 prompt pack in August 2026 are not buying convenience. They are buying structure. They have been running ads without a system and they want a system. Manual CSV export and paste-into-Claude is not a dealbreaker for this segment — it is still 10× faster than what they were doing before. Building Make blueprints before understanding what data the customers actually want to automate would mean building the wrong automation. Phase 1 teaches which manual steps hurt the most. Phase 3 automates exactly those steps.

**V2 automation before V3 API because Make and n8n remove 80% of the pain without the complexity or approval friction of direct API access.** Meta's Marketing API requires a formal application and business verification. TikTok's API access is even more restricted. Both can take weeks and are not guaranteed. Make's HTTP module can call the Meta Ads Insights API endpoint using an existing access token — no formal API approval required, no OAuth infrastructure, no rate limit management. This is not a shortcut; it is the right tool for the right stage. For agencies managing 5–15 clients with daily data volumes in the thousands of rows, Make handles it fine. The API build only becomes necessary when volume, reliability, and security requirements exceed what Make can deliver — which happens at Phase 4 scale, not Phase 2 scale.

**V3 API and agency mode before SaaS because distribution precedes infrastructure.** The mistake most SaaS products make is building the platform before having the distribution. Agencies are the distribution channel for AdPilot OS. When an agency adopts AdPilot OS for their 10 clients, that is 10 accounts generating data, generating results, generating referrals. Phase 4's white-label agency mode is designed to sign up agencies, not individual advertisers. By the time Phase 5 begins, the SaaS platform should have a clear demand signal: agencies asking for a web interface instead of Sheets, asking for client logins, asking for Stripe billing. Build SaaS to serve known demand, not speculative demand.

**SaaS last because it is the highest capital requirement and the highest complexity.** A multi-tenant web application with OAuth, Stripe billing, custom domains, role-based access control, and an AI layer is a $200,000–400,000 engineering project minimum. That investment is rational when you have $200,000+ ARR and 50+ agencies telling you the same thing they need. It is irrational before that. Every phase of AdPilot OS is designed to be cash-flow positive before the next phase begins — Phase 1 funds Phase 2, Phase 2 funds Phase 3, Phase 3 subscription revenue funds Phase 4 API infrastructure, and Phase 4 MRR funds Phase 5 SaaS build. No external capital required if the sequence is followed correctly.

**The revenue logic is simple: each phase pays for the next.** Phase 1 has near-zero infrastructure cost and can be profitable from the first sale. Phase 2 adds complexity but not infrastructure cost — it is still Claude + Sheets. Phase 3 adds $50–100/month in Make and Zapier plans, covered by 1 automation subscription sale. Phase 4 adds $200–500/month in hosting and API infrastructure, covered by 3–5 per-account subscriptions. Phase 5 requires real capital — which should be funded by Phase 4 MRR, not by external investors who will impose their own timeline. Deviate from this sequence — skip to API before proving the no-code version, or build SaaS before 50 paying customers — and you are betting capital on assumptions that the sequence would have tested for free.

---

## Dependencies and Risks Per Phase

### Phase 1 — V1 MVP

**Dependencies**
1. Claude API access stable and within budget at projected usage levels — model version (claude-sonnet-4-6 or successor) must remain available and priced below $0.10 per typical audit run
2. Google Sheets free tier sufficient for 3-tab dashboard at V1 data volumes (it is — well under free limits at daily data for 3–5 accounts)
3. All 25 skills passing quinn QA gate at ≥ 95% pass rate — no partial ship; all 25 or the date slips
4. Gumroad or Lemon Squeezy account configured for AUD digital product sales with instant delivery
5. Minimum 2 real ad accounts available for health score calibration and CSV schema testing

**Risks**
1. Skills produce inconsistent outputs on edge-case inputs (missing columns, zero-spend campaigns, non-AUD currencies in source data)
2. Health score weights in `universal-defaults.yaml` need calibration against real accounts — an uncalibrated score damages trust on first use
3. CSV format varies by region, ad account age, and export settings between Meta and TikTok — the universal schema may need 2–3 column mapping variants
4. Ship date slips if QA takes longer than planned — 25 skills × 3 test runs minimum = 75 QA runs; begin 1 July to have buffer
5. First buyer feedback reveals a fundamental gap in the audit structure that requires rework after launch

### Phase 2 — V1 Complete

**Dependencies**
1. Phase 1 generates at least 10 sales before Agency tier is priced and marketed — the validation signal is people paying, not people expressing interest
2. At least 3 agency conversations completed before launch — pricing and positioning must be informed by real agency feedback, not assumptions
3. White-label legal docs reviewed — licence language covering rebrand rights, client data, and liability must be correct before agencies start using it commercially
4. Upgrade checkout flow tested end-to-end (Starter → Pro, Pro → Agency, each with correct pricing and delivery)
5. Sample output data available for the 2 new report types (lead quality, creative performance)

**Risks**
1. Agency tier pricing at $2,997 too high for the small agency market — if conversion rate < 2% on the agency landing page, test a $1,997 entry price with a $997 upgrade to full licence
2. White-label output quality perception — agencies showing AI-generated reports to enterprise clients may face credibility pushback if formatting looks templated
3. Complexity creep — 10 additional skills and a 6-tab dashboard may overwhelm new buyers; onboarding must clearly segment which skills are for which buyer type
4. Done-With-You retainer scope undefined — without a published scope document, retainer clients will expand their expectations month-on-month
5. Phase 2 skills pass individual QA but fail in a multi-client switching workflow (context bleed between client sessions)

### Phase 3 — V2 Low-Code Automation

**Dependencies**
1. Make Pro plan active ($16/month minimum) — free plan's 1,000 operations/month is insufficient for daily multi-client data pulls
2. At least 3 live client accounts willing to participate in pre-release beta testing of Make blueprints
3. Meta Ads Insights API endpoint accessible via Make HTTP module using an existing access token (this works without formal API approval — must be confirmed against live account before building)
4. Zapier Starter plan minimum for multi-step zaps with filters and delays
5. At least one live CRM integration available for testing Zap 1 and 2 (HubSpot free plan is sufficient for testing)

**Risks**
1. Make blueprint breaks when Meta changes export endpoint or field names — Meta API versions deprecate every 6 months; a blueprint built on v19 will need updating when v21 becomes required
2. Zapier task limits exceed Starter plan capacity for active agencies — buyers running 10+ clients per day will need Zapier Professional plan ($49/month); must be documented as a prerequisite
3. Webhook delivery reliability — missed webhook events during Make or n8n downtime mean gaps in daily data; build a daily reconciliation step
4. n8n self-hosted complexity excludes non-technical buyers — offer n8n Cloud as the default; offer DWY setup for this workflow at $500
5. Data latency misunderstood by buyers — Meta's 72-hour attribution window means data labelled "yesterday" will change for 3 days; must be visible in the dashboard

### Phase 4 — V3 API

**Dependencies**
1. Meta API application submitted by February 2027 — approval can take 4–8 weeks; cannot build Phase 4 without it
2. TikTok API application submitted by March 2027 — 2–4 week approval timeline; TikTok may require a use-case justification document
3. OAuth infrastructure in place — requires a hosted server environment; Fly.io, Railway, or equivalent at $20–100/month; tokens encrypted at rest
4. Rate limit strategy designed and documented before build begins — Meta's rate limits scale with app quality rating; early-stage apps have tight limits
5. At least 20 paying Phase 3 subscribers to justify Phase 4 engineering investment

**Risks**
1. API access denied — Meta or TikTok may reject the application or impose restrictions; contingency: extend Make HTTP module approach for 3 additional months while reapplying
2. API breaking changes during Phase 4 build — both platforms issue breaking changes on version cycles; build with version abstraction from day one
3. Higher cost of API calls at scale — model cost at 200 and 500 connected accounts before launch; ensure per-account pricing covers API call cost with margin
4. OAuth token security incident — a leaked access token grants access to a client's live ad account and budget; no tokens in code, config files, or logs; encrypted storage mandatory; incident response plan documented before first token is stored
5. Reporting portal quality gap — auto-generated PDF reports may look worse than a human-formatted report; first version must be reviewed by at least 3 agency owners before public release

### Phase 5 — Horizon SaaS

**Dependencies**
1. ARR base of $200,000+ (approximately $17,000 MRR) before committing to SaaS build — below this number the build cost exceeds 18 months of revenue
2. Technical co-founder or senior developer hired — no-code tools will not build a production multi-tenant SaaS; this is a 6–12 month engineering project
3. Hosting and security infrastructure: SOC 2 Type I compliance likely required for enterprise agency clients; at minimum encrypted storage, access logs, regular backups, documented incident response
4. Legal infrastructure in place before launch: Terms of Service, Privacy Policy, Data Processing Agreements (GDPR, Australian Privacy Act), MSA template for enterprise clients
5. Support system in place before launch: Intercom or equivalent, knowledge base, escalation path, SLA documentation

**Risks**
1. SaaS churn at 5–8% monthly if results aren't materialising for end advertisers — the Health Score must be visibly improving for accounts that use the system; build churn prediction alerts at 60-day and 90-day intervals
2. Support burden scales superlinearly — at 50+ agencies each with 5–20 clients, inbound support volume can overwhelm a 2-person team; invest in self-serve documentation and in-app guidance before launch, not after
3. Pricing compression from well-funded competitors — the workflow depth and agency relationships are the moat, not the technology; community and customer success investment matters more than feature parity
4. Technical debt from Phase 4 data model — if Phase 4's storage layer was not designed for multi-tenancy, refactoring it while Phase 5 is being built adds months and risk; design Phase 4 for multi-tenancy explicitly
5. Regulatory risk around advertiser data — handling Meta and TikTok conversion data, audience data, and spend data across multiple clients and jurisdictions triggers GDPR, Australian Privacy Act, and platform data terms obligations; legal review mandatory before first token of client data is stored in Phase 5 infrastructure

---

*AdPilot OS — built in Australia for operators who run real accounts.*
