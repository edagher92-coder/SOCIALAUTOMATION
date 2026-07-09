---
name: no-code-automation-builder
description: Designs V1 and V2 no-code and low-code automation flows using Make, Zapier, n8n, Google Sheets, and CSV imports — covering weekly report automation, budget alerts, lead CRM feedback loops, and webhook structures. Use this skill when someone asks to "automate my reporting", "set up a Make scenario", "build a Zapier workflow", "connect my CRM to the ads system", "create alerts for my budget", or any request to wire together tools without writing custom code.
---

## Purpose
Turn manual, repetitive ad-ops tasks into automated flows that run on schedule or on trigger. This skill designs step-by-step automation blueprints for V1 (prompts + Sheets + CSV) and V2 (Make/Zapier/n8n + alerts + auto-reports + CRM loop) product tiers. Outputs are human-readable flow specs the user can implement in their chosen tool — no coding required. Nothing touches live ad accounts without human sign-off.

## When to use
Use this skill when the goal is to remove manual effort from a repeating ad-ops task.

Trigger phrases:
- "Automate my weekly Meta + TikTok report"
- "Set up a Make scenario to alert me when CPL goes over $X"
- "Build a Zapier workflow to send leads to my CRM"
- "Create a Google Sheets dashboard that auto-updates"
- "Design a no-code flow for my client reporting"
- "Wire up an n8n webhook when a new purchase fires"

## Inputs needed
- Automation goal: what task should run automatically? (required)
- Trigger: time-based (daily/weekly) or event-based (new lead, spend threshold, etc.) (required)
- Platforms involved: Meta, TikTok, Google Sheets, CRM name, email tool, Slack/SMS (required)
- Tool preference or constraint: Make, Zapier, n8n, or "suggest best option" (required)
- {{client.crm}} — CRM platform name
- {{client.reporting_frequency}} — sets schedule for report flows
- {{client.monthly_budget}} — used to set pacing alert thresholds
- {{client.conversion_events}} — determines which webhook events to listen for
- {{client.meta_account_id}} and {{client.tiktok_account_id}} — placeholder references only (never hardcoded)
- V1 or V2 tier — determines whether the flow uses manual CSV or live API data pull

## Workflow
1. Clarify the automation goal and trigger with the user; identify the source data and destination.
2. Assess tool fit:
   - V1: Sheets + CSV import + scheduled prompts (no API access needed)
   - V2: Make / Zapier / n8n with API connectors (requires platform OAuth — guide user to set this up safely)
   - Flag if the request needs V3 (custom API) and hand off to api-integration-planner.
3. Map the flow as a numbered step sequence:
   - Trigger → data fetch / import → transform / calculate → output / alert / send
4. Identify each node:
   - App name, action type, field mappings, filters, error handling
5. For alert flows: define threshold logic (e.g. CPL > break_even_cpa × 1.2 → send Slack alert).
6. For report flows: define schedule, data source, template to populate, delivery method.
7. For CRM loops: map lead fields from ad platform to {{client.crm}} fields; note deduplication rule.
8. For webhook flows: specify event name, payload structure, receiving endpoint pattern.
9. Write the blueprint in plain steps the user can follow inside Make/Zapier/n8n.
10. Add a test protocol: what to check after setup to confirm the flow is working.
11. Output the blueprint with a one-page quick-start summary.

## Outputs
- Automation flow blueprint (numbered steps, app/action/field detail per node)
- Threshold and filter logic specifications
- CRM field mapping table (if applicable)
- Webhook event and payload spec (if applicable)
- Google Sheets formula set (for V1 Sheets-based flows)
- Test protocol checklist
- Quick-start summary (one page)

## Safety rules
- Automation flows must never trigger live ad spend changes — read-only API scopes only for data pulls.
- Any flow that would pause, launch, or adjust a campaign must output a proposal for human approval, not execute directly.
- Do not store account IDs, tokens, or credentials in flow specs — reference {{client.*}} variables; guide user to store secrets in their tool's credential vault.
- Budget alert thresholds must be conservative (alert before the problem, not after).
- live_edit_block: true — flows may alert and report; they may not act on live accounts.
- use_paused_duplicates_only: true — if a flow involves campaign changes, scope to draft/paused objects only.

## Example commands
- "Design a Make scenario that pulls Meta spend daily and sends me a Slack alert if I'm over pace"
- "Build a Zapier flow: new Facebook Lead → add to ActiveCampaign → tag as 'meta-lead'"
- "Create a weekly n8n workflow that generates the client report and emails it every Monday 8am"
- "Set up a Google Sheets V1 tracker I can update manually each week with CPL and ROAS"
- "Design an alert flow: if TikTok CPM rises above $20, ping me on SMS"
- "Wire up a webhook so every purchase event updates a Sheets row automatically"

## Related agents
- milo-ai-automation-builder (executes and refines automation designs from this skill)
- atlas-tracking-attribution-agent (provides event/webhook spec for conversion tracking flows)
- riley-client-reporting-agent (consumes automated report outputs)
- dana-ads-data-analyst (source of data transforms in the flow)
- api-integration-planner (escalation for V3 flows requiring custom API work)

## Handoff rules
- If the automation requires live API access (V3), pause and hand off to api-integration-planner.
- If the flow involves a CRM, confirm {{client.crm}} field names match before finalising the mapping.
- After blueprint is approved, hand to milo-ai-automation-builder to guide implementation in the chosen tool.
- Test protocol must be completed before the flow runs on live data.
- Document the final flow in /clients/{{client.business_name}}/config/ after approval.


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- Webhook bots: **HMAC-SHA256 over the RAW body** + verify-token handshake; **always 200** (or Meta retry-storms).
- Crons fail-closed (require a secret). Vercel Hobby = once/day, ~2 crons; sub-daily/hourly needs **Pro**.
- Idempotent pulls: delete the rolling window then insert; on **partial failure don't advance the cursor**.
- Multi-channel: Messenger + Instagram share one webhook; WhatsApp is a separate Cloud API shape.
