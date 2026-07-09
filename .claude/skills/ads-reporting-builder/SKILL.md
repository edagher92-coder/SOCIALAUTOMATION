---
name: ads-reporting-builder
description: Builds the structure, skeleton, and data architecture for a paid-ads reporting system — covering Meta (Facebook, Instagram) and TikTok campaigns. Defines which metrics to include, how to organise them by reporting level (account, campaign, ad set, ad), and what cadence and format to use. Distinct from client-report-generator, which writes finished client-facing narrative reports. Use when a user says things like "help me set up a reporting system", "build me a report template", "what metrics should I track weekly", "create a dashboard structure", or "I need a repeatable reporting process for my clients".
---

## Purpose
Design a repeatable, structured reporting framework before data is populated. This skill defines what to measure, at what level of granularity, on what cadence, and in what format — so every report produced downstream is consistent, comparable over time, and decision-ready. The output is a skeleton / spec, not a filled report.

## When to use
- "Help me set up a reporting structure for my Meta and TikTok ads"
- "What metrics should I report to my clients weekly?"
- "Build me a report template I can reuse every month"
- "I need a dashboard spec for my ads agency"
- "Set up a reporting system before my client onboarding"

## Inputs needed
- {{client.business_name}}, {{client.platform_focus}}, {{client.reporting_frequency}}
- {{client.currency}}, {{client.monthly_budget}}
- {{client.conversion_events}} — what counts as a reportable result
- {{client.average_sale_value}}, {{client.gross_margin}} — for break-even reference lines in reports
- {{client.crm}} — determines whether offline/CRM data can be included
- Reporting audience: internal (media buyer) or external (client-facing)
- Preferred format: spreadsheet, slide deck, PDF, dashboard tool (e.g. Looker Studio, Google Sheets)
- Reporting cadence: daily (internal monitoring), weekly (client check-in), monthly (strategic review)

## Workflow
1. **Define reporting levels**: Specify which levels of the account will be reported:
   - Account level: total spend, total leads/purchases, blended CPL/CPA, blended ROAS, MER
   - Campaign level: spend, leads, CPL, CPA, ROAS per campaign
   - Ad set level: spend, CTR, CPC, CPM, CPL, frequency, audience performance
   - Ad level: CTR, hook_rate (TikTok), hold_rate (TikTok), CPC, CPM, CPL, creative performance ranking
2. **Select metric set per cadence**:
   - Daily (internal): spend vs budget pacing, CPL today vs 7-day average, frequency alerts, CTR alerts
   - Weekly (client check-in): spend, leads, CPL vs target, top 3 creatives, fatigue flags, next actions
   - Monthly (strategic review): all metrics, break-even comparison, MER, health score, trend charts, recommendations
3. **Define comparison baselines**: Prior period (WoW, MoM), break-even CPA, break-even ROAS, client target CPA/ROAS. All reports show actuals vs at least one baseline.
4. **Define the health score position**: Include the 0–100 health score block (from campaign-health-monitor) as the lead section of every monthly report.
5. **Specify sections in order**:
   - Executive summary (1 paragraph, numbers first)
   - Health score block
   - Spend and pacing summary
   - Campaign performance table
   - Creative performance table
   - Audience performance table (if relevant)
   - Tracking status (pass/fail gate)
   - Key wins this period
   - Key issues this period
   - Recommended actions (numbered, with priority)
   - Next period plan
6. **Specify format and tool**: Generate a skeleton in the preferred format. For Google Sheets: column headers and row labels. For Looker Studio: widget list and data source fields. For slide deck: slide titles and one-line descriptions per slide.
7. **Define colour coding and threshold callouts**: Green = at or below target; Amber = 10–30% above target; Red = >30% above target or below break-even.
8. **Document the data pull process**: List exact export steps from Meta Ads Manager and TikTok Ads Manager to populate the report. Include column names, date range settings, and breakdown dimensions.

## Outputs
- Report structure document specifying:
  - Sections in order
  - Metrics per section
  - Comparison baseline for each metric
  - Colour-coding thresholds
  - Reporting cadence recommendations
- Reporting skeleton (column headers and row labels, or slide titles) ready to hand to riley-client-reporting-agent for population
- Data pull instructions (Meta and TikTok export steps)
- Recommended reporting tool and format for the client's needs

## Safety rules
- live_edit_block: true — this skill builds structure only; no data is published or shared with clients directly
- No client-specific data, account IDs, or revenue figures in the structural output — use {{client.*}} variables as placeholders
- Clearly label the output as a skeleton/template, not a finished report
- Do not share report skeletons externally until reviewed by the client account owner

## Example commands
- "Build a weekly reporting template for my Meta and TikTok ads"
- "What should be in my monthly client report?"
- "Set up a Google Sheets report structure I can reuse for every client"
- "Create a Looker Studio dashboard spec for my ads account"
- "I need a daily monitoring report for my media buying team"
- "Design a report structure that shows health score, CPA trends, and creative performance"

## Related agents
riley-client-reporting-agent (fills the skeleton with live data and writes the finished client-facing narrative), dana-ads-data-analyst (provides computed metrics to populate the report), campaign-health-monitor (provides the health score block), budget-pacing-monitor (provides the pacing section data)

## Handoff rules
- Pass the completed skeleton to riley-client-reporting-agent with the confirmed data period and metric inputs
- Pass the data pull instructions to dana-ads-data-analyst or the media buyer to execute the export
- If the report will include health score, trigger campaign-health-monitor first and pass the output to riley-client-reporting-agent
- If the report includes pacing data, trigger budget-pacing-monitor and pass the output to riley-client-reporting-agent
