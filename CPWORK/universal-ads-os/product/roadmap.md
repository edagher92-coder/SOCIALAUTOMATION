# Product Roadmap — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Framework:** Now / Next / Soon / Later / Horizon
**Sequencing principle:** Sell audit+report first → automate the repeat → add API/agency layer → build toward SaaS

---

## Sequencing Rationale

The product is built in the order that creates the fastest feedback loop and the lowest build risk:

1. **NOW (V1):** Prove the core loop works manually. Audit → Health Score → Report. Sell this. Get real users on real data. Learn what the output gets wrong before adding automation.

2. **NEXT (V1→V2):** Automate the repeat. Once users have run 2–3 manual audits, the friction is obvious. Automation removes it without requiring a new value proposition.

3. **SOON (V2):** Add the CRM feedback layer and multi-client structure. This is what unlocks the Agency tier as a resaleable product — the system can manage multiple clients without collapsing into chaos.

4. **LATER (V2→V3):** API connections. The manual CSV process is the MVP constraint, not a long-term design choice. The API layer removes the biggest friction point. Build this after the output quality is validated by real users.

5. **HORIZON (V3+):** SaaS and white-label resale platform. Only invest here once the audit+report process is proven at scale and the Agency tier has 10+ paying partners.

---

## NOW — Active (V1 No-Code, Starter + Pro Tier)

Target: Live and sellable. All deliverables in this column must be complete before first sale.

### Core Product
- [x] 12 agent playbooks (agents/)
- [x] 25 skills (skills/)
- [x] client-config.yaml + universal-defaults.yaml
- [x] meta-ads-audit skill (14-layer audit)
- [x] tiktok-ads-audit skill (14-layer audit, TikTok-specific metrics)
- [x] campaign-health-monitor skill (0–100 health score)
- [x] ads-reporting-builder skill (structured report generator)
- [x] Google Sheets dashboard (pre-built formulas, CSV import tab)
- [x] Client report templates (weekly + monthly, Google Doc format)
- [x] UTM naming builder skill
- [x] Creative matrix tracker (Sheets tab)
- [x] Lead/conversion tracker (Sheets tab)
- [x] SOP library (SOP-01 to SOP-05: export, import, audit, report, UTM)

### Product Pack
- [x] product-name-options.md
- [x] mvp-plan.md
- [x] pricing-tiers.md
- [x] sales-page.md
- [x] onboarding-flow.md
- [x] demo-script.md
- [x] support-docs.md
- [x] white-label-agency-offer.md
- [x] roadmap.md
- [x] licence-draft.md

### QA Pack
- [x] test-plan.md
- [x] sample-data-tests.md
- [x] metric-calculation-tests.md
- [x] prompt-tests.md
- [x] client-usability-tests.md
- [x] commercial-readiness-checklist.md
- [x] release-checklist.md

### Safety Infrastructure
- [x] No live ad edit enforced in all skills and agent prompts
- [x] No API keys or account IDs stored anywhere in the package
- [x] All client references use {{client.*}} config variables
- [x] Paused-duplicate-only change model documented

---

## NEXT — 90 days (V1 → V2 Low-Code, Pro Tier Completion)

These features are defined and designed. Build begins after first revenue from NOW deliverables.

### Automation Layer
- [ ] Make (Integromat) blueprint — weekly audit trigger from Sheets update
- [ ] Zapier blueprint — same weekly trigger, simpler setup
- [ ] n8n blueprint — self-hosted option for privacy-conscious operators
- [ ] Google Sheets auto-refresh trigger (Apps Script, no external tool needed)
- [ ] Weekly report automation — drafts report in Google Doc each Monday based on prior week's import

### Alerting System
- [ ] CPA spike alert — triggers when CPA exceeds threshold × target in config
- [ ] Creative fatigue alert — triggers when frequency > config threshold AND CTR decline > 20%
- [ ] Budget pacing alert — triggers when spend rate is 20%+ above or below target pacing
- [ ] Tracking failure alert — triggers when UTM coverage drops below 80% of active ads
- [ ] Delivery via email (Zapier Gmail), Slack (Make), or SMS (Twilio via Make)

### Pro-Tier Skills (complete the 25-skill pack)
- [ ] budget-pacing-monitor — live pacing check against monthly cap
- [ ] creative-testing-lab — A/B test structure builder and result analysis
- [ ] no-code-automation-builder — configures automation blueprints from config file
- [ ] dashboard-spec-builder — generates Sheets/Airtable/Notion spec from client config

### Data Infrastructure
- [ ] Unified data schema documentation (CSV columns → normalised field names)
- [ ] Data validation layer in Sheets (flags missing columns, format errors before audit runs)

---

## SOON — 6 months (V2 Complete, Agency Tier Launch)

Agency tier infrastructure and multi-client management.

### Agency Features
- [ ] Multi-client master dashboard (Sheets or Airtable) — see all clients' health scores in one view
- [ ] Client onboarding questionnaire template (auto-populates client-config.yaml)
- [ ] Agency-branded report pack (white-label template with agency logo/colour slots)
- [ ] agency-white-label-pack skill — runs full workflow with multi-client context switching
- [ ] Client onboarding SOP set (agency version — for onboarding a client to the system)
- [ ] Client-facing explainer deck (Canva + PowerPoint template)
- [ ] Agency partner sales support pack (pricing guidance, objection handling, case study template)

### CRM Feedback Loop
- [ ] Lead quality analyser connected to CRM data (CSV-based first, then Zapier/Make)
- [ ] Lead-to-sale rate tracker — feeds back into CPL/CPA health score component
- [ ] Attribution comparison report — Ads Manager vs. CRM vs. GA4 delta

### Reporting Automation
- [ ] Monthly report automation — extended version of weekly, with period-over-period comparison
- [ ] Client report delivery automation — sends PDF to client email on schedule

### V2 Release Milestone
- [ ] QA of all automation blueprints against qa/test-plan.md
- [ ] All 5 sample datasets from qa/sample-data-tests.md producing correct outputs through automated workflow
- [ ] Commercial readiness checklist completed for Agency tier
- [ ] Agency offer page live
- [ ] At least 2 agency partners beta-testing the system

---

## LATER — 12 months (V3 API, Direct Platform Connections)

Platform API connections are the biggest friction-removal upgrade. They eliminate the manual CSV export step.

### Meta Marketing API Integration
- [ ] OAuth 2.0 authentication flow for Meta — securely store token in environment (never in config file)
- [ ] Automated campaign data pull (replace CSV manual export)
- [ ] Automated ad creative asset retrieval
- [ ] Automated conversion event verification (pixel check via API)
- [ ] Scheduled daily data pull — always-fresh dashboard without manual action

### TikTok Ads API Integration
- [ ] OAuth 2.0 for TikTok Ads API
- [ ] Automated campaign + creative data pull
- [ ] Video performance metrics via API (hook rate, hold rate at source)

### API Infrastructure
- [ ] Webhook structure for inbound alerts (ad account health events → API → alerting system)
- [ ] Data schema validation layer (API → normalised schema → existing audit skills)
- [ ] API rate limit management (Meta: 200 calls/hour; TikTok: varies by endpoint)
- [ ] Fallback to CSV import if API connection fails (resilience layer)

### V3 Agency + SaaS Prep
- [ ] Multi-tenant config architecture (multiple agency clients, multiple their-clients)
- [ ] Role-based access (agency owner sees all clients; account manager sees assigned clients)
- [ ] Client login portal spec (read-only report access for end clients — SaaS direction)
- [ ] Automated billing integration for agency clients (Stripe → usage-based billing)

### V3 Release Milestone
- [ ] Live API connections tested on 5 real accounts (separate from QA test datasets)
- [ ] Automated daily pull running without intervention for 30 days on at least 3 accounts
- [ ] Zero manual CSV exports required for Pro/Agency tier users
- [ ] API credentials management security review completed

---

## HORIZON — 18+ months (SaaS Direction, Platform Expansion)

Long-term strategic bets. Build only after V3 is stable and the Agency tier has 20+ partners.

### SaaS Platform
- [ ] AdPilot OS as a hosted web application (not just a Claude skill + Sheets combo)
- [ ] Self-serve signup, billing, and client onboarding
- [ ] In-app audit trigger and report delivery
- [ ] Agency subdomain white-label (agency.clientname.com)
- [ ] Per-seat and per-client pricing models
- [ ] Usage dashboard for agencies (how many audits run, reports delivered, clients active)

### Platform Expansion
- [ ] Google Ads audit skill (separate audit module; significant scope)
- [ ] LinkedIn Ads audit skill (B2B-specific metrics; CPL-focus)
- [ ] Pinterest Ads audit skill
- [ ] Snapchat Ads audit skill
- [ ] Cross-platform consolidated report (single report covering all active platforms)

### Intelligence Layer
- [ ] Predictive creative fatigue (model predicts fatigue before CTR drops, based on frequency trajectory)
- [ ] Budget scenario modelling (if we increase spend by $X on this campaign, projected CPA impact based on historical elasticity)
- [ ] Benchmark database (aggregate anonymised health scores to provide industry benchmarks — e.g. "your ecom account scores 71; the median for AU ecom is 58")
- [ ] Competitor creative monitoring (TikTok Creative Centre API integration for swipe-file building)

### Distribution Expansion
- [ ] AdPilot OS marketplace listing (Zapier, Make, n8n community templates)
- [ ] Certified agency partner program (accreditation, co-marketing, referral structure)
- [ ] Reseller programme (other SaaS tools bundling AdPilot OS as a feature)

---

## Sequencing Decision Tree

```
Q: Have you validated that real users can complete the core loop (audit → score → report) in under 45 minutes?
  NO → Stay in NOW. Do not build NEXT features.
  YES → Begin NEXT automation layer.

Q: Do you have at least 10 paying Starter/Pro users and know what's confusing them?
  NO → Stay in NEXT. Fix the friction points before adding Agency features.
  YES → Begin SOON agency infrastructure.

Q: Do you have at least 3 paying Agency partners running the system for real clients?
  NO → Stay in SOON. Prove the agency model before investing in API.
  YES → Begin LATER API connections.

Q: Is the V3 API connection running stably for 30+ days on 3+ real accounts without manual intervention?
  NO → Stay in LATER. Do not start the SaaS build.
  YES → Begin HORIZON SaaS scoping.
```

---

## What We Are NOT Building (and Why)

| Feature | Reason Not Building |
|---------|-------------------|
| AI-generated ad creative | Creative generation is a separate product category. AdPilot OS audits performance — it does not create content. Dilutes focus. |
| Ad scheduling / media planning | Out of scope. Existing tools (Ads Manager native scheduling, Sprinklr, etc.) handle this. |
| Competitor monitoring beyond TikTok Creative Centre | Scraping risks; not the core value prop. |
| Automatic ad pausing | Permanently excluded by safety model. The system proposes; humans decide. |
| Budget auto-adjustment | Same safety model reason. Would undermine the trust model and liability position. |
| Chatbot for client communication | Not an ads management product — out of scope. |
| SEO / organic social | Different data, different logic, different tools. Scope creep risk. |
