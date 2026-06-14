---
name: budget-pacing-monitor
description: Monitors and analyses monthly budget pacing against {{client.monthly_budget}} for Meta (Facebook, Instagram) and TikTok paid ads. Calculates daily run-rate, pro-rata target spend for the current date, projected month-end spend, and over- or under-pacing alerts with recommended daily budget adjustments. Use when a user says things like "check my budget pacing", "am I on track to spend my budget this month", "I'm overspending — what do I adjust", "project my spend for the end of the month", or "am I underpacing and wasting my allocation".
---

## Purpose
Ensure every dollar of {{client.monthly_budget}} is deployed as intended — no overspend that blows budgets, no underspend that wastes media opportunity. Produce clear pacing alerts and specific daily-budget adjustment recommendations so the media buyer can correct course the same day.

## When to use
- "Am I on track with my monthly budget?"
- "Check my budget pacing for Meta"
- "I think I'm overspending — what should I do?"
- "Project how much I'll spend by end of month"
- "Set up my budget pacing monitor for {{client.business_name}}"

## Inputs needed
- {{client.monthly_budget}} — total approved monthly spend ({{client.currency}})
- {{client.platform_focus}} — Meta, TikTok, or both (if both, provide budget split)
- Today's date and the current day number within the billing month (e.g. day 14 of 30)
- Total spend to date this month (from Ads Manager export or manual input)
- Daily spend breakdown for the past 7 days (for run-rate calculation)
- Number of days remaining in the month
- Active campaign list with current daily budgets (for adjustment recommendations)

## Workflow
1. **Establish the billing period**: Confirm the month start date, today's date, days elapsed, and days remaining.
2. **Compute pro-rata target spend**:
   - daily_target = {{client.monthly_budget}} / days_in_month
   - pro_rata_target_to_date = daily_target × days_elapsed
3. **Compute actual spend to date**: Sum all platform spend for the month to date.
4. **Compute pacing variance**:
   - pacing_variance = actual_spend_to_date − pro_rata_target_to_date
   - pacing_variance_pct = pacing_variance / pro_rata_target_to_date × 100
5. **Classify pacing status**:
   - ±10%: On track (Green) — no action needed
   - +10% to +25%: Over-pacing (Amber) — monitor, minor reduction recommended
   - >+25%: Over-pacing (Red) — immediate daily budget reduction required
   - −10% to −25%: Under-pacing (Amber) — review underperforming campaigns, minor increase recommended
   - <−25%: Under-pacing (Red) — significant budget left undeployed, review campaign eligibility
6. **Compute 7-day daily run-rate**: average_daily_spend = sum of last 7 days spend / 7
7. **Project month-end spend**: projected_month_end = actual_spend_to_date + (average_daily_spend × days_remaining)
8. **Compute budget remaining**: budget_remaining = {{client.monthly_budget}} − actual_spend_to_date
9. **Compute required daily spend to hit target**: required_daily = budget_remaining / days_remaining
10. **Generate adjustment recommendations**:
    - If over-pacing Red: reduce total active daily budgets by X% to bring run-rate to required_daily. List specific campaigns and new daily budget amounts (paused duplicate approach — propose changes, do not execute).
    - If under-pacing Red: identify which campaigns are underspending (delivery issues, narrow audiences, low bids). Flag for campaign-health-monitor review. Propose daily budget increases on top performers only.
    - If on track: confirm and state next check-in date.
11. **Safety check for scaling**: if budget increase is proposed, confirm health ≥70 (from campaign-health-monitor) before recommending the increase. Block if health <70.

## Outputs
Pacing status block:
```
BUDGET PACING MONITOR — {{client.business_name}} — {{date}}
Platform: {{client.platform_focus}}
Billing period: [start date] to [end date]  |  Day [X] of [Y]

Monthly budget:         {{client.currency}} {{client.monthly_budget}}
Spend to date:          {{client.currency}} [X]
Pro-rata target:        {{client.currency}} [X]
Pacing variance:        [+/-X%]  |  Status: [GREEN / AMBER / RED]

7-day daily run-rate:   {{client.currency}} [X] / day
Projected month-end:    {{client.currency}} [X]
Budget remaining:       {{client.currency}} [X]
Required daily spend:   {{client.currency}} [X] / day

Recommended action: [specific adjustment or "on track — no action"]
```
- Campaign-level budget adjustment table (if action required):
  ```
  | Campaign | Current daily budget | Proposed daily budget | Change |
  ```
- Next monitoring check-in date

## Safety rules
- live_edit_block: true — all budget adjustment recommendations are proposals; no live budgets changed directly
- use_paused_duplicates_only: true — budget adjustments go into paused duplicates for review before applying
- Any budget increase requires human "YES" before execution
- Do not recommend scaling if campaign-health-monitor score <70
- Do not recommend scaling on unclear tracking — check tracking gate first
- No ad account IDs, billing account details, or access tokens in output — use {{client.*}} variables

## Example commands
- "Check my budget pacing for this month"
- "I've spent $8,000 of my $15,000 monthly budget — am I on track?"
- "Project my month-end spend at current run-rate"
- "I'm way underpacing — what's the issue and what do I adjust?"
- "Set up the pacing monitor for {{client.business_name}} Meta account"
- "I need to adjust budgets to avoid overspending this month"

## Related agents
dana-ads-data-analyst (spend data aggregation), campaign-health-monitor (health gate for scale recommendations), mira-meta-ads-strategist (Meta budget strategy), travis-tiktok-ads-strategist (TikTok budget strategy), riley-client-reporting-agent (pacing section in client reports)

## Handoff rules
- Pass pacing status block to riley-client-reporting-agent for inclusion in the weekly/monthly report
- If under-pacing is caused by poor campaign delivery, hand off to campaign-health-monitor to diagnose root cause
- If over-pacing and budget increase was never approved, escalate to the account owner before any adjustment
- If pacing is on track and scale is requested, pass health score gate confirmation to start-ads-command-centre before proceeding
