---
name: universal-business-onboarding
description: Interviews a new business owner or marketing manager and produces a fully completed client-config.yaml and onboarding summary that primes every other AdPilot OS skill and agent for that client. Use this skill for every new client before any ads work begins — triggered by phrases like "onboard a new client", "set up a new business", "I need to add a client to the system", "fill in the client config", "start fresh for a new account", or "what do you need to know about my business?". This is the mandatory first step for any new client.
---

## Purpose
Collect all the information the AdPilot OS needs to operate correctly for a specific business — and produce a clean, filled client-config.yaml that every skill and agent reads. Without this, every downstream skill has to guess or ask repeatedly for the same information. Running this skill once means every subsequent session is immediately context-aware. It does not touch any live ad account; it only collects and structures information.

## When to use
Run this skill before any other skill for a new client. It is the mandatory first step.

Example user phrases:
- "I want to add a new client to the system — where do we start?"
- "Onboard [Business Name] — they're a new client"
- "Fill in the client config for this business"
- "I'm starting a new account for a roofing company in Brisbane — set it up"
- "What do you need to know to get started?"

## Inputs needed
The skill collects these through a structured interview. Required fields are marked (R); strongly recommended (SR); optional (O):

- Business name (R): {{client.business_name}}
- Industry / business type (R): {{client.industry}}
- Location — city/state/region (R): {{client.location}}
- Currency (R, default AUD): {{client.currency}}
- Main offer — what they sell (R): {{client.main_offer}}
- Average sale value in {{client.currency}} (R): {{client.average_sale_value}}
- Gross margin as a decimal (R, e.g. 0.40 = 40%): {{client.gross_margin}}
- Target audience description (R): {{client.target_audience}}
- Platform focus: Meta / TikTok / both (R): {{client.platform_focus}}
- Monthly ad budget in {{client.currency}} (R): {{client.monthly_budget}}
- CRM platform name (SR): {{client.crm}}
- Meta ad account ID placeholder (SR — reference label only, never a real ID in this file): {{client.meta_account_id}}
- TikTok ad account ID placeholder (SR): {{client.tiktok_account_id}}
- Primary conversion events (SR, e.g. Lead, Purchase, BookNow): {{client.conversion_events}}
- Brand voice description (SR, e.g. "friendly and professional", "direct and no-nonsense"): {{client.brand_voice}}
- Reporting frequency: daily / weekly / monthly (SR, default weekly): {{client.reporting_frequency}}

## Workflow
1. Welcome the user and explain what the onboarding collects and why.
2. Run the structured interview — ask for one section at a time; do not dump all questions at once:
   - Section 1: Business basics (name, industry, location, currency)
   - Section 2: Offer and financials (main offer, average sale value, gross margin)
   - Section 3: Audience and platforms (target audience, platform focus, monthly budget)
   - Section 4: Tech stack (CRM, conversion events, ad account references)
   - Section 5: Brand and reporting (brand voice, reporting frequency, any special rules)
3. After each section, confirm answers back to the user before moving on.
4. For any missing required field, prompt a second time with a plain-English explanation of why it matters.
5. Calculate and confirm derived metrics using the provided financials:
   - Break-even CPA = {{client.average_sale_value}} × {{client.gross_margin}}
   - Break-even ROAS = 1 / {{client.gross_margin}}
   - Show these to the user and confirm they make sense.
6. Produce the filled client-config.yaml:
   - Use only {{client.*}} variable references — never hardcode sensitive data.
   - Account ID references are labelled as placeholders (e.g. "meta_account_id: [operator to fill]").
7. Produce the onboarding summary:
   - Plain-English one-pager: who the business is, what they sell, who they target, what success looks like in numbers, what platforms, and the first-priority recommended action.
8. Flag any unusual inputs that may affect how the OS works (e.g. very low margin, very small budget, unusual industry with policy restrictions).
9. Recommend the first skill or agent to run after onboarding is complete.

## Outputs
- Completed client-config.yaml (all {{client.*}} variables filled or explicitly marked as placeholder)
- Break-even CPA and ROAS calculations shown and confirmed
- Onboarding summary (plain-English one-pager)
- First-action recommendation
- Flag list: any concerns or unusual inputs that downstream skills should be aware of

## Safety rules
- Never store real ad account IDs, API tokens, or passwords in the config file — use placeholder labels.
- Never share one client's config data with another client's session.
- If the business operates in a restricted advertising category (finance, health, supplements, legal), flag this immediately and route to ads-policy-risk-checker before any ads work begins.
- Do not begin ads strategy, creative, or reporting work until the config is complete and confirmed.
- live_edit_block: true — onboarding collects information only; it does not touch live accounts.
- Money-move safety: no budget decisions are made during onboarding — this is setup only.

## Example commands
- "Onboard a new client — they're a physio practice in Melbourne, Meta only"
- "Set up the system for a roofing company in Brisbane — $150k/year, Meta + TikTok"
- "Fill in the client config for my e-commerce client — Shopify, sells homewares"
- "I'm setting up a new account for a personal trainer — AUD, small budget, Instagram/Meta"
- "Walk me through the onboarding — I want to add my own business to the system"
- "Start fresh for a new agency client — complete the onboarding interview"

## Related agents
- start-ads-command-centre (receives the completed config and orchestrates from there)
- mira-meta-ads-strategist (first agent to call after onboarding for Meta campaign setup)
- travis-tiktok-ads-strategist (first agent to call after onboarding for TikTok setup)
- atlas-tracking-attribution-agent (second priority after onboarding — verify tracking before spending)
- paige-ads-policy-safety-agent (mandatory if a restricted category is flagged during onboarding)

## Handoff rules
- Do not hand off to any campaign-running agent until the config is complete and confirmed by the user.
- Hand completed client-config.yaml to start-ads-command-centre to load for the session.
- If a restricted category is flagged, hand off to paige-ads-policy-safety-agent before any creative or strategy work.
- If this is an agency client, hand the config to agency-white-label-pack to file in the correct client folder.
- File client-config.yaml in /clients/{{client.business_name}}/config/ after completion.
