---
name: dashboard-spec-builder
description: Produces detailed dashboard specifications for Google Sheets, Looker Studio, Airtable, Notion, or agency client views — including metric layout, formulas, data source wiring, refresh schedule, and colour-coded thresholds. Use this skill when someone asks to "build a dashboard", "spec out a reporting view", "design a Looker Studio report", "create a Google Sheets tracker", "set up a client-facing dashboard", or "what should my performance dashboard show?"
---

## Purpose
Translate the AdPilot OS metric framework into a fully specced dashboard that a non-developer can build in their tool of choice. This skill defines every panel, metric, formula, data source, and refresh rule — so the output is a clear build instruction document, not a vague wireframe. Dashboards are read-only views; they never trigger ad changes.

## When to use
Use this skill any time a visual or structured data view of ad performance is needed.

Example user phrases:
- "Design a Google Sheets dashboard for my Meta + TikTok campaigns"
- "Build a Looker Studio spec for my agency's client view"
- "Create an Airtable tracker for weekly ad performance"
- "What should go in a client-facing reporting dashboard?"
- "Spec out a master dashboard showing all clients' ROAS in one view"

## Inputs needed
- Dashboard tool: Google Sheets / Looker Studio / Airtable / Notion / other (required)
- Audience: internal (agency/operator), client-facing, or owner self-service (required)
- Platforms to include: Meta, TikTok, or both (required)
- {{client.business_name}}, {{client.currency}}, {{client.reporting_frequency}}
- {{client.conversion_events}} — determines which conversion rows appear
- {{client.monthly_budget}} — used for pacing panels
- {{client.gross_margin}} and {{client.average_sale_value}} — for break-even threshold lines
- Data source: manual CSV / Google Sheets feed / Make/Zapier automation / API (V3)
- Optional: agency brand colours, logo URL (for branded client views)

## Workflow
1. Confirm tool, audience, platforms, and data source with the user.
2. Define the dashboard architecture — number of tabs/pages and their purpose:
   - Tab 1: Executive Summary (key numbers at a glance)
   - Tab 2: Campaign Performance (by campaign, ad set, ad)
   - Tab 3: Creative Performance (CTR, CPA, frequency by ad)
   - Tab 4: Budget Pacing (daily spend vs. target, projected month-end)
   - Tab 5: Trend View (weekly/monthly time-series for key metrics)
   - Tab 6 (agency only): Multi-client rollup
3. For each panel, specify:
   - Panel name
   - Metric(s) displayed
   - Formula or calculation (using shared metric definitions)
   - Data source column(s)
   - Visualisation type (number, bar, line, table, conditional formatting)
   - Threshold / colour rule (e.g. ROAS < break-even = red, ≥ target = green)
4. Write all Sheets formulas explicitly (SUMIF, DIVIDE, IFERROR, conditional formatting rules).
5. Define the data input structure: column headers, data types, required vs. optional fields.
6. Specify refresh schedule: manual update / automated via tool (Make/Zapier) / API push.
7. Define access and sharing rules: who sees what (agency vs. client view separation).
8. Produce a build checklist: steps to implement the spec in the chosen tool.
9. Output the full dashboard spec document.

## Outputs
- Dashboard architecture overview (tabs, purpose, audience)
- Panel-by-panel spec: name, metrics, formulas, viz type, threshold rules
- Data input schema (column headers and types)
- Google Sheets formula reference sheet (if applicable)
- Looker Studio data source and field mapping (if applicable)
- Refresh and update schedule
- Access and sharing rules
- Build checklist (step-by-step implementation guide)

## Safety rules
- Dashboards are read-only views — they display data; they never modify campaigns.
- Do not include raw account IDs or tokens in dashboard formulas — reference via named ranges using {{client.*}} pattern.
- Client-facing tabs must never show agency cost data, margin calculations, or other client's data.
- If break-even thresholds are shown, include a note that they are estimates based on provided inputs, not guaranteed.
- live_edit_block: true — this skill produces specs and documents; it does not build or publish dashboards directly.
- All "red flag" thresholds in dashboards should alert, not auto-act.

## Example commands
- "Design a Google Sheets performance dashboard for Meta + TikTok with weekly data entry"
- "Spec a Looker Studio client-facing report showing ROAS, CPL, and spend pacing"
- "Build an Airtable tracker for my agency — one row per campaign per week"
- "Create a multi-client rollup dashboard spec for my 8 agency clients"
- "Design a Notion dashboard for a business owner to check daily — mobile-friendly"
- "Write out all the Google Sheets formulas I need for my performance tracker"

## Related agents
- dana-ads-data-analyst (produces the data that populates the dashboard)
- riley-client-reporting-agent (automates data delivery into the dashboard)
- milo-ai-automation-builder (wires the automation that feeds the dashboard)
- agency-white-label-pack skill (provides brand config for styled client views)
- start-ads-command-centre (links dashboard outputs to command decisions)

## Handoff rules
- Receive metric framework from dana-ads-data-analyst or the universal config before speccing formulas.
- After spec is approved, hand build checklist to the user or milo-ai-automation-builder for implementation.
- If the dashboard requires live API data feeds, flag and hand off to api-integration-planner for the data ingestion layer.
- Agency multi-client views must be scoped with agency-white-label-pack brand config applied.
- File completed specs in /clients/{{client.business_name}}/config/dashboard-spec/ after approval.
