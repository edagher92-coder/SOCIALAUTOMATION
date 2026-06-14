---
name: agency-white-label-pack
description: Rebrands the entire AdPilot OS for a specific agency — swapping logos, business names, colour codes, and report headers — and sets up a multi-client folder structure, branded onboarding materials, and agency sales support assets. Use this skill when an agency wants to resell the system under their own brand, when setting up a new white-label client account, or when someone says "white-label this", "rebrand for my agency", "set up client accounts", or "I want to resell this system".
---

## Purpose
Package AdPilot OS as a fully branded, resellable product for an agency partner. This skill swaps all "AdPilot OS" references with the agency's brand, generates a multi-client folder and config structure, produces branded report headers and onboarding docs, and provides a sales support kit the agency can hand to prospects. It operates at the Agency White-label pricing tier (AUD 1,997–4,997+).

## When to use
Use this skill when an agency is setting up or expanding their white-label arrangement.

Trigger phrases:
- "White-label this system for my agency"
- "Rebrand AdPilot OS as [Agency Name] Ads System"
- "Set up a multi-client structure for my 12 clients"
- "I need branded report headers and an onboarding doc for my clients"
- "Help me package this to resell to my ad clients"

## Inputs needed
- Agency brand name (required)
- Agency logo URL or description (required for header templates)
- Agency primary colour hex code (optional but recommended)
- Agency contact details: website, email, phone (for footer/onboarding docs)
- Number of active clients to set up initially
- Per-client: {{client.business_name}}, {{client.industry}}, {{client.platform_focus}}
- Pricing tier the agency is selling at (Starter/Pro/Agency — affects feature gates in docs)
- Whether the agency wants client-facing logins or all reports go through agency (access model)
- {{client.reporting_frequency}} preference per client (or agency default)

## Workflow
1. Collect all agency brand inputs; flag any missing required fields before proceeding.
2. Generate agency brand config block:
   - agency.name, agency.logo_url, agency.primary_colour, agency.contact, agency.pricing_tier
3. Produce branded report header template (Markdown + Google Doc placeholder):
   - Replace AdPilot OS logo/name with agency brand
   - Footer: "Powered by [Agency Name] — Confidential"
   - Colour variables wired to agency.primary_colour
4. Build multi-client folder spec:
   - /clients/{{client.business_name}}/ for each client
   - Sub-folders: /config, /reports, /creatives, /data
   - Starter client-config.yaml per client (shell — to be filled via universal-business-onboarding)
5. Generate agency client onboarding pack:
   - Welcome email template (agency-branded)
   - "What we need from you" checklist (maps to universal-business-onboarding inputs)
   - Access and permissions guide (what the client sees vs. what stays agency-side)
6. Produce agency sales support kit:
   - One-page service description (editable Markdown)
   - Pricing table matching the selected tier structure
   - FAQ: "How does it work?", "What platforms?", "What do I need to provide?"
   - Sample report excerpt (anonymised, agency-branded)
7. Generate agency master dashboard spec stub (hand off to dashboard-spec-builder for full build).
8. Output a setup checklist: what the agency must complete before going live with each client.

## Outputs
- Agency brand config block (YAML)
- Branded report header template
- Multi-client folder structure spec
- Per-client config shells (one per client named)
- Client onboarding pack (welcome email, checklist, access guide)
- Agency sales support kit (service description, pricing table, FAQ, sample report)
- Agency master dashboard spec stub
- Go-live checklist

## Safety rules
- Never hardcode real account IDs, tokens, or spend data in any template — use {{client.*}} variables.
- Branded materials must clearly state they are marketing/reporting tools, not financial advice.
- All spend proposals remain proposals; the agency must confirm in writing before any live changes.
- Do not include client A's data in client B's files — strict per-client folder isolation.
- live_edit_block: true — this skill produces documents and templates, not live ad changes.
- If the agency asks to push changes across all clients simultaneously, require individual human confirmation per account ("YES" per client).

## Example commands
- "Set up a white-label pack for Momentum Media Agency — 8 clients, Meta + TikTok"
- "Rebrand the report templates with my agency logo and navy blue (#003366)"
- "Create a client onboarding pack I can send to new clients when they sign up"
- "Build a multi-client folder structure for my 5 active accounts"
- "Give me a one-page sales sheet I can use to pitch the system to new clients"
- "Generate branded report headers for [Agency Name] — weekly reporting cadence"

## Related agents
- piper-productisation-saas-agent (defines what goes in each product tier)
- riley-client-reporting-agent (uses the branded report headers this skill produces)
- start-ads-command-centre (orchestrates across the multi-client structure)
- milo-ai-automation-builder (wires up automated delivery of agency reports)
- atlas-tracking-attribution-agent (sets up per-client tracking config)

## Handoff rules
- Run universal-business-onboarding for each client after folder structure is created — that fills the config shells.
- Brand config block is consumed by client-report-generator for all future reports.
- Hand sales support kit to the user for review; do not publish externally without sign-off.
- Dashboard spec stub goes to dashboard-spec-builder to produce the full agency master view.
- If agency has > 20 clients, flag that a V3 API integration may be required and hand off to api-integration-planner.
