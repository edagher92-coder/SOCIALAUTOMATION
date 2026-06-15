---
name: api-integration-planner
description: Plans Meta Ads API, TikTok Ads API, CRM, and messaging platform integrations for V3 of AdPilot OS — covering OAuth flows, least-privilege scope selection, data ingestion to the universal schema, and guarded write-action proposals. Use this skill when someone asks to "connect the Meta API", "set up TikTok API access", "plan a V3 integration", "wire up our CRM via API", "what scopes do I need?", or any request to move beyond no-code automation into direct API-level connectivity.
---

## Purpose
Produce a safe, structured API integration plan that takes a business from V2 automation to V3 direct API connectivity. This skill maps out OAuth concepts, the minimum viable scope set (least privilege), data ingestion pathways into the universal ad schema, and read-first patterns before any guarded write proposals. It does not write production code — it produces the plan, schema, and spec a developer or agency tech team implements.

## When to use
Use this skill when V2 (Make/Zapier/n8n) has hit a ceiling and direct API access is the right next step.

Example user phrases:
- "Plan the Meta Marketing API integration for our V3 build"
- "What TikTok API scopes do we need for read-only reporting?"
- "How should we connect HubSpot CRM to pull lead quality data back into the ads system?"
- "Design the data ingestion pipeline for campaign performance into our universal schema"
- "We want to automate campaign proposals via API — what's the safest way to architect this?"

## Inputs needed
- Target platform(s): Meta Ads API, TikTok Ads API, CRM (name), messaging (SMS/email) (required)
- Integration goal: read-only reporting / read + write proposals / full automation (required)
- V2 tool currently used (Make/Zapier/n8n/none) — informs migration path
- {{client.meta_account_id}} placeholder reference only (never hardcode)
- {{client.tiktok_account_id}} placeholder reference only (never hardcode)
- {{client.crm}} — CRM platform name and version
- {{client.conversion_events}} — which events need to flow through the API
- {{client.currency}} and {{client.platform_focus}}
- Target data store: Google Sheets, Airtable, PostgreSQL, BigQuery, or other

## Workflow
1. Confirm integration goal and platforms; classify as read-only, read+propose, or read+write.
2. Map the OAuth 2.0 flow concept for each platform:
   - Meta: Business Manager → App → System User → access token (long-lived) — scope list
   - TikTok: Developer App → OAuth → Advertiser account auth — scope list
   - Describe the token refresh cycle; flag where tokens expire.
3. Define the minimum viable scope set (least privilege principle):
   - Read scopes only unless write is explicitly required and safety-gated.
   - List each scope by name, what it grants, and why it is needed.
   - Flag any scope that grants spend-initiating permissions — require explicit human YES before including.
4. Design the data ingestion pathway:
   - API endpoint → normalisation layer → universal ad schema fields
   - Universal schema: date, platform, campaign_id (hashed ref), ad_set_id (hashed ref), ad_id (hashed ref), impressions, clicks, spend, leads, purchases, revenue, ctr, cpc, cpm, cpl, cpa, roas
   - Map each API response field to its schema column.
5. Define the read-first pattern: all integrations pull data on a read pass before any write action is proposed.
6. If write actions are in scope, define the guard layer:
   - Proposal object (JSON) describing the change
   - Human approval step (typed "YES" in a defined channel)
   - Write executes only after approval; logs the approval event with timestamp.
7. Describe error handling: rate limits, auth failures, missing data fields, partial responses.
8. Produce a phased rollout plan: Phase 1 read-only → Phase 2 guarded proposals → Phase 3 (if applicable) auto-execution with audit log.
9. Output the full integration spec document.

## Outputs
- OAuth flow diagram (text-based, platform by platform)
- Minimum viable scope list per platform (with rationale)
- Universal ad schema field mapping table
- Data ingestion pipeline spec (endpoint → transform → store)
- Guard-layer spec for any write actions
- Error handling reference
- Phased rollout plan with go/no-go criteria per phase
- Developer handoff checklist

## Safety rules
- Read-only by default; no write scope without explicit human instruction and a typed "YES".
- Never hardcode account IDs, tokens, or credentials in any spec document — use {{client.*}} variable references.
- Never plan for or propose automated spend changes without a human approval gate in the architecture.
- live_edit_block: true — this skill produces specs; it does not call any API.
- use_paused_duplicates_only: true — any write-action proposals in scope must target paused/draft objects only.
- Flag any scope that could initiate, pause, or delete a campaign as HIGH RISK; require explicit sign-off.
- Never propose skipping the read-first phase; always read before any write plan.

## Example commands
- "Plan the Meta Ads API integration for read-only reporting — V3 tier"
- "What's the minimum TikTok API scope set for pulling campaign performance daily?"
- "Design the data ingestion pipeline from Meta API to our Google Sheets universal schema"
- "How do we safely architect guarded campaign-pause proposals via the Meta API?"
- "Map the HubSpot CRM integration so lead quality data flows back to the ads attribution model"
- "Produce a phased API integration plan — start read-only, expand to proposals in Phase 2"

## Related agents
- milo-ai-automation-builder (implements V2 flows that this skill upgrades from)
- atlas-tracking-attribution-agent (owns the conversion event schema that feeds into the API ingestion plan)
- start-ads-command-centre (orchestrates across platforms; consumes the integration once live)
- dana-ads-data-analyst (primary consumer of the ingested data)
- piper-productisation-saas-agent (packages V3 API as a product tier)

## Handoff rules
- Before starting this skill, confirm the user has completed V1 and V2 successfully — V3 is not a shortcut.
- After producing the spec, hand the developer handoff checklist to the human technical lead; do not implement directly.
- The universal schema definition must be shared with dana-ads-data-analyst and dashboard-spec-builder to ensure alignment.
- Any write-action architecture must be reviewed by the human operator and signed off before the developer proceeds.
- Completed integration specs are filed in /clients/{{client.business_name}}/config/api-spec/.


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- `business.facebook.com` is a protected site — integrate via the **Graph API**, never the browser.
- Graph Explorer page tokens are short-lived (~1–2h); exchange for a **non-expiring** page token via the app secret.
- Webhooks: verify-token handshake on GET + **HMAC-SHA256 over the RAW body** on POST; always return 200.
- Keyword auto-replies need a webhook bot + **App Review** (`pages_messaging` Advanced Access) — **per-app, not per-page**.
- WhatsApp is a separate Cloud API (24h reply window); Instagram DM shares the Messenger webhook.
- Never add ad-write (pause/budget) silently — it breaks the read-only trust moat; gate behind typed-YES + audit.
