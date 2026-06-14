---
name: client-report-generator
description: Writes finished, plain-English client and owner reports (daily, weekly, monthly, or campaign-end) from analysed ad performance data. Use this skill whenever someone asks to "write a report", "generate a weekly summary", "produce a campaign-end report", "send the client their numbers", or any variant of turning raw ad data into a polished deliverable. Pulls from templates/ and reports/ samples; outputs are ready to copy-paste or attach.
---

## Purpose
Turn analysed Meta and TikTok ad data into a clean, professional report that a client or business owner can read in under five minutes. The report speaks plain English (no jargon), leads with the numbers that matter, flags what changed and why, and closes with clear next-step recommendations. All figures are in {{client.currency}} (default AUD). Reports are non-destructive — they summarise; they never trigger spend changes.

## When to use
Use this skill any time a finished written report is the end goal.

Trigger phrases:
- "Write the weekly report for {{client.business_name}}"
- "Generate a monthly performance summary for the client"
- "Produce a campaign-end wrap-up report"
- "Give me a daily snapshot I can forward to the owner"
- "Create a paid-ads report for this week's numbers"

## Inputs needed
- Report period: daily / weekly / monthly / campaign-end (required)
- Platform(s): Meta, TikTok, or both (required)
- Raw or pre-analysed metrics for the period: impressions, clicks, spend, leads/purchases, revenue where available (required)
- Prior period metrics for comparison (strongly recommended — enables trend lines)
- {{client.business_name}}, {{client.currency}}, {{client.reporting_frequency}}, {{client.conversion_events}}
- {{client.brand_voice}} — governs tone in commentary sections
- {{client.monthly_budget}} — used to calculate pacing status
- Optional: campaign-specific notes, creative test results, anomalies to flag

## Workflow
1. Confirm report type and period with the user; resolve any missing inputs before proceeding.
2. Load the matching template from templates/ (weekly-report-template, monthly-report-template, campaign-end-template, or daily-snapshot). If none exists, use the default structure below.
3. Calculate derived metrics using shared formulas:
   - CTR = clicks / impressions
   - CPC = spend / clicks
   - CPM = spend / impressions × 1000
   - CPL = spend / leads
   - CPA = spend / purchases
   - ROAS = revenue / spend
   - Break-even CPA = {{client.average_sale_value}} × {{client.gross_margin}}
   - Break-even ROAS = 1 / {{client.gross_margin}}
4. Compare period-over-period: calculate % change for each key metric; label as improvement, decline, or flat (±5% threshold).
5. Draft the report in sections:
   a. **Headline summary** — 2-3 sentences, biggest win and biggest watch-out.
   b. **Key numbers table** — this period vs. last period vs. target.
   c. **Platform breakdown** — Meta section, then TikTok section (if applicable).
   d. **Creative performance** — top and bottom ad by CTR and CPA.
   e. **Budget pacing** — spend to date vs. projected month-end.
   f. **What we changed** — any paused, launched, or adjusted campaigns (proposals only).
   g. **Recommendations** — 3 prioritised actions, each with expected outcome.
   h. **Next steps / sign-off line**.
6. Apply {{client.brand_voice}} tone to commentary (keep numbers clinical; vary the narrative voice).
7. Run a self-check: are all numbers consistent? Do recommendations contradict safety rules?
8. Output the finished report for human review.

## Outputs
- Finished written report (Markdown, ready to paste into email or Google Doc)
- Key numbers table (can be exported as CSV row for tracking)
- 3 prioritised recommendations with rationale
- Optional: report summary (2-sentence version for SMS/Slack ping)

## Safety rules
- Reports describe historical performance only — they never trigger live spend changes.
- Recommendations are proposals; label all as "proposed" and require human approval before action.
- Never include raw account IDs, API tokens, or private data — use {{client.*}} variables throughout.
- Do not guarantee future results in report copy (AU consumer law, ACCC).
- If tracking data looks suspicious (e.g. ROAS > 20× without explanation), flag as "verify tracking before relying on this number".
- live_edit_block: true — this skill outputs documents, not ad changes.

## Example commands
- "Write a weekly Meta report for {{client.business_name}} using this week's data: [paste data]"
- "Generate a monthly summary for both platforms — here are the CSV exports"
- "Produce a campaign-end report for the lead-gen campaign that ran 1–14 June"
- "Give me a daily snapshot for today — spend $420, 18 leads, CPL $23.30"
- "Write the client report in a professional but friendly tone — ROAS was 4.2 this week"
- "Create a monthly report comparing May vs April performance"

## Related agents
- riley-client-reporting-agent (primary driver of this skill)
- dana-ads-data-analyst (pre-analyses raw data before this skill writes it up)
- mira-meta-ads-strategist (provides Meta-specific commentary)
- travis-tiktok-ads-strategist (provides TikTok-specific commentary)
- paige-ads-policy-safety-agent (reviews any claim language in report copy)

## Handoff rules
- Receive analysed data from dana-ads-data-analyst or raw exports from the user.
- If data is raw/unanalysed, pause and request analysis first (or run inline calculation in step 3).
- Hand finished report to the user for review and approval before it goes to any client.
- If recommendations involve budget changes > 20% or new spend, escalate to titan-offer-funnel-strategist for a second opinion before including them.
- Campaign-end reports should be filed in reports/ folder after approval.
