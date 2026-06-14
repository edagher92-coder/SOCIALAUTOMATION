---
name: snowflow-business-context
description: Loads the Snowflow NSW / Slushieco business context so every AdPilot OS skill and agent speaks correctly for this specific business — covering service area logic, pricing patterns, creative voice, owner escalation rules, and AUD-first framing. Use this skill at the start of any Snowflow or Slushieco session, or whenever someone says "for Snowflow", "for Slushieco", "for Elie's business", or "switch to the snow machine client". This is a context pack, not a universal skill — it augments the core OS without replacing it.
---

## Purpose
Prime the AdPilot OS with accurate, consistent context for Snowflow NSW / Slushieco so that all ad strategy, creative, reporting, and automation work reflects how this business actually operates. Prevents generic outputs that do not fit this client's service model, geography, pricing logic, or brand voice. This skill loads context only — it does not run campaigns or make changes.

## When to use
Load this skill at the start of every session involving Snowflow or Slushieco.

Example user phrases:
- "We're working on Snowflow today — load the context"
- "Switch to Slushieco / Snowflow"
- "Set up for Elie's snow machine business"
- "Load the context for the slush machine repair client"
- "I'm working on the NSW hire + repair ads — get the context ready"

## Inputs needed
- Confirmation that this session is for Snowflow NSW / Slushieco (required — do not load this context for other clients)
- Session goal: strategy / creative / reporting / automation / onboarding / QA (helps frame which context elements to foreground)
- Current date and campaign period (for seasonal relevance — slush/snow machine demand is seasonal)
- Platform focus for this session: Meta / TikTok / both

## Workflow
1. Confirm the session is for Snowflow NSW / Slushieco before loading any context.
2. Load core business context:
   - Business names: Snowflow NSW (trading name) / Slushieco (brand name — use contextually)
   - Owner first name: Elie (always spell this way; never "Eli", "Elie Dagher" in public-facing copy)
   - Business type: slush machine and snow machine repairs, sales, and hire
3. Load service area logic:
   - Service and hire: Sydney metro + Greater Sydney (35 LGAs) — postcode-based delivery calculation at checkout
   - Machine sales: all NSW
   - Delivery for hire is ALWAYS quoted separately based on postcode — never include delivery in upfront hire pricing
   - Standard service call-out: $325 AUD (covers call-out fee + diagnostics + 20-minute health check)
4. Load escalation rule:
   - Any enquiry or lead over $500 in estimated value: ping Elie directly before progressing
   - This includes large hire jobs, multi-machine sales, commercial service contracts
5. Load Meta paid-ads creative voice (King Kong direct-response framework):
   - Structure: Hook → Agitate → Offer → Proof → CTA
   - Always produce 3 headline variants per ad
   - Tone: direct, confident, no fluff, Australian English, AUD pricing
   - Example hook style: lead with the problem the machine causes when it breaks ("Your slush machine went down on your busiest day. Here's how to fix it fast.")
6. Load content and copy rules:
   - Australian English throughout (not US English)
   - All prices in AUD; include GST note where relevant
   - Never guarantee turnaround times unless Elie has confirmed current capacity
   - Hire prices always say "delivery calculated at checkout" — never quote delivery upfront
7. Load seasonal context signal:
   - Peak demand: school holidays, summer (Oct–Feb), event season
   - Off-peak: May–July (use for machine maintenance/service push, not hire)
   - Adjust ad creative seasonality recommendations accordingly
8. Confirm context is loaded; summarise the key constraints for this session; proceed with the session goal.

## Outputs
- Context confirmation message listing loaded parameters
- Session framing note: key constraints and rules active for this session
- Recommended skill or agent to hand off to based on the session goal

## Safety rules
- This is a context-pack skill — do not hardcode private data (real account IDs, real phone numbers, real email addresses, real revenue figures) in this file or in session outputs.
- Never share Elie's personal details in any ad copy, public-facing template, or report without explicit instruction.
- Enquiries over $500: always flag to Elie before any commitment is made on his behalf.
- Do not quote delivery pricing for hire jobs — postcode calculation is mandatory.
- live_edit_block: true — context loading produces no ad changes.
- All standard Golden Safety Rules apply: no live edits, paused duplicates only, no money moves without "YES".

## Example commands
- "Load Snowflow context — we're planning the school holidays hire campaign on Meta"
- "Set up for Slushieco — I need to write 3 ad variants for the repair service"
- "Switch to Elie's business context and then run an audit on last month's Meta results"
- "Load the snow machine context — I want to build a TikTok creative brief"
- "Get the Snowflow context ready then help me write the call-out ad for Sydney suburbs"
- "Snowflow context on — then spec a weekly reporting dashboard for this client"

## Related agents
- mira-meta-ads-strategist (primary Meta ads agent for Snowflow campaigns — uses this context)
- stella-social-creative-strategist (writes ad creative using King Kong framework loaded here)
- dana-ads-data-analyst (analyses Snowflow campaign data in AUD with the correct break-even model)
- riley-client-reporting-agent (produces Snowflow-specific client reports with correct voice)
- travis-tiktok-ads-strategist (TikTok ads for Snowflow — uses this context for AU tone)

## Handoff rules
- Always load this context skill first in any Snowflow session before calling other agents or skills.
- Hand off to the relevant agent or skill after confirming context is loaded; state the session goal clearly.
- If the session involves a $500+ enquiry or a spending decision, flag to Elie before proceeding — even in a planning context.
- Context is specific to this business; do not carry Snowflow context into sessions for other clients.
- This skill does not replace universal-business-onboarding for a new client setup — it is the pre-loaded version for an existing client.
