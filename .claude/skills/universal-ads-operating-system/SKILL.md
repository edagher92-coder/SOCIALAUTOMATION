---
name: universal-ads-operating-system
description: The master overview and orchestration skill for AdPilot OS — a universal Meta + TikTok paid-ads operating system built to be resold. Describes how the entire system fits together, how to navigate it end-to-end, which agent or skill to call for any task, and how to drive a client from onboarding to optimised campaigns to packaged product. Use this skill when someone asks "how does the whole system work?", "where do I start?", "what does AdPilot OS do?", "give me an overview", "how do I run a client end-to-end?", or "I'm new — walk me through everything".
---

## Purpose
Provide a clear, end-to-end map of AdPilot OS so any operator, agency owner, or new user can understand what the system does, how the parts connect, and how to drive a client from zero to optimised ads. This skill is the entry point for new users and the reference point for experienced users who need to orchestrate across multiple skills and agents. It does not do analysis or run campaigns — it navigates and coordinates.

## When to use
Use this skill at the start of a new user's first session, when a client journey needs to be planned end-to-end, or when an operator needs to understand how to fit a new skill or agent into the existing system.

Example user phrases:
- "How does AdPilot OS work? Give me the overview"
- "I'm new — where do I start?"
- "Walk me through running a client from onboarding to their first campaign"
- "How do all the skills and agents connect?"
- "I want to build this into a product — what does the full system look like?"

## Inputs needed
- User role: new user / experienced operator / agency owner / developer (affects depth of overview)
- Session goal: understand the system / run a client end-to-end / build a product / troubleshoot (required)
- Current status: no clients yet / clients in progress / ready to productise (helps direct the overview)
- Platform focus: Meta / TikTok / both (optional — shapes the agent recommendations)

## Workflow

### System overview
AdPilot OS is a universal paid-ads operating system for Meta and TikTok, structured in three product versions and four pricing tiers, and operated through a set of specialist agents and skills.

**Three product versions:**
- V1 No-code: prompts + skills + Google Sheets + CSV import. No platform API access needed.
- V2 Low-code: V1 + Make/Zapier/n8n automation + automated alerts + auto-reports + CRM feedback loop.
- V3 API: V2 + direct Meta and TikTok API integration + white-label SaaS + multi-client dashboard.

**Four pricing tiers (AUD):**
- Starter DIY: $97–$297 — self-serve, V1 tools, solo business owner
- Pro Automation: $497–$1,497 — V2 automation, DWY setup, growing business
- Agency White-label: $1,997–$4,997+ — full rebrand, multi-client, reseller
- Done-With-You Setup: $1,500–$5,000+ — custom implementation, managed project

**Twelve specialist agents:**
1. start-ads-command-centre — orchestrates all other agents; the command hub
2. mira-meta-ads-strategist — Meta campaign strategy, structure, and optimisation
3. travis-tiktok-ads-strategist — TikTok campaign strategy, structure, and optimisation
4. dana-ads-data-analyst — data analysis, metric calculation, performance interpretation
5. stella-social-creative-strategist — ad creative strategy, briefs, copy, and hooks
6. titan-offer-funnel-strategist — offer validation, funnel design, conversion strategy
7. milo-ai-automation-builder — automation implementation (Make/Zapier/n8n)
8. atlas-tracking-attribution-agent — tracking setup, UTM structure, attribution review
9. riley-client-reporting-agent — automated report generation and delivery
10. paige-ads-policy-safety-agent — policy risk scanning and compliance
11. piper-productisation-saas-agent — product packaging, pricing, and SaaS roadmap
12. quinn-qa-testing-agent — system QA and quality control

### Standard client journey (end-to-end)
1. **Onboard** → universal-business-onboarding: collect config, calculate break-even, produce client-config.yaml
2. **Track** → atlas-tracking-attribution-agent: verify pixels, UTMs, and conversion events before spending
3. **Strategy** → mira-meta-ads-strategist + travis-tiktok-ads-strategist: campaign structure and plan
4. **Offer** → titan-offer-funnel-strategist: validate the offer and funnel before creative
5. **Creative** → stella-social-creative-strategist: ad copy, hooks, creative briefs
6. **Policy check** → paige-ads-policy-safety-agent + ads-policy-risk-checker skill: compliance gate
7. **Launch** → start-ads-command-centre: coordinate launch as paused duplicates; human approves live push
8. **Monitor** → dana-ads-data-analyst + campaign-health-monitor skill: ongoing performance review
9. **Report** → riley-client-reporting-agent + client-report-generator skill: regular client reports
10. **Automate** → milo-ai-automation-builder + no-code-automation-builder skill: remove manual effort
11. **Dashboard** → dashboard-spec-builder skill: client and agency views
12. **Scale or Productise** → piper-productisation-saas-agent + productisation-roadmap-builder skill

### Golden safety rules (always active)
1. Never push changes to a live spending ad.
2. Ship changes as paused duplicates, drafts, or proposals only.
3. Never delete — archive instead.
4. Money moves need a human typed "YES".
5. Do not scale on unclear tracking.
6. No keys, tokens, ad-account IDs, or private data in outputs — use {{client.*}} variables.

### Config variables (standard set)
{{client.business_name}}, {{client.industry}}, {{client.location}}, {{client.currency}}, {{client.main_offer}}, {{client.average_sale_value}}, {{client.gross_margin}}, {{client.target_audience}}, {{client.platform_focus}}, {{client.monthly_budget}}, {{client.crm}}, {{client.meta_account_id}}, {{client.tiktok_account_id}}, {{client.conversion_events}}, {{client.brand_voice}}, {{client.reporting_frequency}}

### Standard metric formulas
- CTR = clicks / impressions
- CPC = spend / clicks
- CPM = spend / impressions × 1000
- CPL = spend / leads
- CPA = spend / purchases
- ROAS = revenue / spend
- Break-even CPA = {{client.average_sale_value}} × {{client.gross_margin}}
- Break-even ROAS = 1 / {{client.gross_margin}}

## Outputs
- End-to-end system overview (this document)
- Recommended starting point based on user role and session goal
- Agent and skill directory with one-line purpose per item
- Client journey checklist (step-by-step with skill/agent mapping)
- Next action recommendation

## Safety rules
- This skill is read-only orientation — it does not run campaigns, generate reports, or modify any client account.
- Always direct new users to universal-business-onboarding before any other skill.
- Always direct users to atlas-tracking-attribution-agent before recommending spend.
- Always direct users to ads-policy-risk-checker before any creative goes live.
- live_edit_block: true.

## Example commands
- "Give me the full AdPilot OS overview — I'm new to the system"
- "I have a new client — walk me through the steps from onboarding to first campaign"
- "Which agent should I use to analyse my Meta campaign performance?"
- "How do I set this up as a product I can resell to agencies?"
- "What's the difference between V1, V2, and V3?"
- "Map out the full workflow for a done-with-you client engagement"

## Related agents
- start-ads-command-centre (the operational hub; use after this overview to begin real work)
- All 12 agents listed above — this skill maps to all of them

## Handoff rules
- After delivering the overview, ask the user what they want to do next and route to the correct starting skill.
- New users: always route to universal-business-onboarding first.
- Experienced users resuming a client: route to start-ads-command-centre with the client config.
- Users wanting to productise: route to productisation-roadmap-builder.
- Users wanting to add an agency client: route to agency-white-label-pack.
