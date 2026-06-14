---
name: productisation-roadmap-builder
description: Turns AdPilot OS into a clearly packaged, sellable product — defining package tiers, AUD pricing, MVP scope, feature roadmap, support documentation structure, and licence considerations. Use this skill when someone asks to "package this as a product", "define what's in each pricing tier", "build a roadmap for the SaaS version", "what should I charge for this system?", "help me productise this", or "plan the V1 to V3 rollout roadmap".
---

## Purpose
Transform the AdPilot OS skill and agent framework into a marketable, resellable product with clear tiers, scoped deliverables, honest pricing, and a sequenced build roadmap. This skill defines what goes in each product version (V1/V2/V3), maps features to the four pricing tiers in AUD, scopes the MVP for fastest time-to-revenue, and produces the supporting documentation structure needed to sell and support it. Output is a product plan — not code.

## When to use
Use this skill when the operator or agency is ready to sell or formalise the system as a product offering.

Example user phrases:
- "Help me define the three product tiers and what's included in each"
- "What should the MVP look like for a quick launch?"
- "Build a roadmap from V1 no-code to V3 SaaS API"
- "How should I price this for Australian SMBs vs. agencies?"
- "Create a product scope document I can use to sell this"
- "What support docs do I need before I launch this to clients?"

## Inputs needed
- Target market: DIY business owners / done-with-you agency clients / white-label resellers / SaaS (required)
- Current build state: which skills/agents/automations already exist (required)
- Revenue goal or launch timeline (strongly recommended)
- {{client.currency}} — AUD default
- Operator's technical capacity: no-code / low-code / developer available
- Existing pricing decisions (if any) — will be reviewed and validated against the tier structure
- Support capacity: async/email only, DWY sessions, or full managed service

## Workflow
1. Confirm target market and current build state; identify the first sellable version.
2. Define the four product tiers with scope, pricing, and ideal customer:

   **Starter DIY — AUD $97–$297**
   - Scope: V1 skills + prompt library + Google Sheets templates + CSV import workflow
   - Delivery: self-serve, digital download or Notion/Google Drive access
   - Support: async/email, community access
   - Ideal customer: solo business owner running their own ads

   **Pro Automation — AUD $497–$1,497**
   - Scope: V2 Make/Zapier/n8n flows + automated reporting + CRM loop + weekly alert system
   - Delivery: DWY setup session (1.5–2 hrs) + recorded walkthrough
   - Support: 30-day email support post-setup
   - Ideal customer: growing business or marketing manager who wants automation without a dev

   **Agency White-label — AUD $1,997–$4,997+**
   - Scope: Full system branded for agency + multi-client structure + agency dashboard + onboarding pack + sales kit
   - Delivery: DWY setup + white-label config + team training session
   - Support: ongoing monthly retainer option
   - Ideal customer: agency reselling ads management to 5–50+ clients

   **Done-With-You Setup — AUD $1,500–$5,000+ (one-time)**
   - Scope: Custom implementation for a specific business — onboarding, config, automation, dashboard, 90-day check-in
   - Delivery: managed project, 2–4 week timeline
   - Support: included in price; renewal/retainer offered after
   - Ideal customer: business that wants it done properly without hiring in-house

3. Define the MVP for fastest path to first paid customer:
   - Minimum: universal-business-onboarding + 2 core analysis skills + client-report-generator + 1 dashboard template
   - Sequence: what to build/enable in what order
4. Produce a V1 → V2 → V3 feature roadmap with estimated effort per phase.
5. List required support documentation for each tier (user guides, onboarding checklists, FAQ, video outline topics).
6. Note licence and IP considerations: what the buyer gets (usage licence), what stays with the operator (master system), white-label terms outline.
7. Produce a go-to-market summary: how to announce, first 10 customers plan, upsell path.
8. Output the full product plan document.

## Outputs
- Four-tier product definition with scope, pricing, delivery, support, and ideal customer
- MVP scope and sequenced build order
- V1 → V2 → V3 feature roadmap with effort estimates
- Support documentation structure and content list
- Licence and IP framework outline
- Go-to-market summary (launch approach + first 10 customers)
- Pricing rationale (cost-to-deliver vs. value delivered)

## Safety rules
- Pricing outputs are recommendations — the operator must validate against their own cost base before publishing.
- Do not include income or revenue guarantees in any product description — AU Consumer Law (ACCC) applies.
- All "what's included" lists must be accurate and deliverable — no feature-stuffing to justify pricing.
- Licence framework is a starting framework; recommend the operator get legal review before publishing terms.
- live_edit_block: true — this skill produces documents; it does not publish product pages or charge customers.

## Example commands
- "Define the four tiers and what's included in each for my Meta + TikTok ads system"
- "Scope the MVP — what's the minimum I need to sell the first Starter DIY package?"
- "Build a V1 to V3 product roadmap with timeframes"
- "What support docs do I need before I launch the Pro Automation tier?"
- "Write a pricing rationale I can use when a client asks why it costs $2,500"
- "Create a go-to-market plan for launching this to my existing email list"

## Related agents
- piper-productisation-saas-agent (primary driver of this skill)
- agency-white-label-pack skill (implements the Agency tier defined here)
- milo-ai-automation-builder (builds V2 automation features in the roadmap)
- api-integration-planner (scopes V3 API features in the roadmap)
- start-ads-command-centre (the core system the product tiers are built around)

## Handoff rules
- After tier definitions are approved, hand the Agency tier spec to agency-white-label-pack for implementation.
- MVP scope feeds directly into the qa-system-tester skill to validate commercial readiness.
- V3 roadmap items hand off to api-integration-planner for technical scoping.
- Support documentation structure hands off to the operator to produce content; this skill defines structure, not content.
- Product plan is filed in the project root /docs/product-plan/ after approval.
