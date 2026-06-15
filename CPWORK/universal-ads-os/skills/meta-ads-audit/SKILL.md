---
name: meta-ads-audit
description: Runs a full structured audit of a Meta (Facebook and Instagram) ads account. Covers campaign objective, naming conventions, budget structure, audience targeting, placements, optimisation events, creative formats, ad copy, CTA, destination URL, UTM parameters, pixel and event quality, spend efficiency, frequency, CTR, CPC, CPM, CPL or CPA, ROAS, and lead quality. Use when a user says things like "audit my Facebook ads", "review my Meta account", "why is my CPL high", "my ROAS dropped", "check my Meta campaigns", or "I want a health check on my Facebook advertising". Outputs a completed meta-ads-audit-template.md with findings and prioritised recommendations.
---

## Purpose
Deliver a thorough, evidence-based audit of a Meta ads account, covering every layer from account structure to creative to attribution. Surface exactly what is underperforming, why, and what to do about it — in priority order. Output populates templates/meta-ads-audit-template.md.

## When to use
- "Audit my Facebook ads"
- "Why is my Meta CPL so high?"
- "My ROAS dropped this month — find out why"
- "Review my Instagram campaign setup"
- "Do a full Meta account health check"

## Inputs needed
- Meta Ads Manager export (CSV or copy-pasted table): campaigns, ad sets, ads with impressions, reach, clicks, spend, leads, purchases, revenue
- {{client.business_name}}, {{client.industry}}, {{client.main_offer}}, {{client.average_sale_value}}, {{client.gross_margin}}
- {{client.currency}}, {{client.monthly_budget}}, {{client.target_audience}}
- {{client.conversion_events}} — which pixel events are being tracked
- {{client.crm}} — to assess offline conversion linkage
- Screenshots or descriptions of active creatives, landing page URL, and UTM examples (optional but strongly recommended)

## Workflow
1. **Account structure check**: Confirm campaign objectives match business goal (Leads, Conversions, Traffic). Flag mismatches (e.g. Traffic objective when CPL is the goal).
2. **Naming convention audit**: Check every campaign, ad set, and ad name against the standard — `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` / `{audience}_{placement}_{optimisation}` / `{angle}_{format}_{version}`. Flag every deviation.
3. **Budget audit**: Identify CBO vs ABO structure, daily vs lifetime budgets. Flag if budget is too fragmented (more than 5 ad sets per campaign with <50 clicks each) or over-concentrated in one ad set.
4. **Audience audit**: Review targeting — size, overlap risk, exclusion lists, custom audiences, lookalikes. Flag broad-only setups with no retargeting layers.
5. **Placement audit**: Identify which placements are running (Feed, Reels, Stories, Audience Network). Flag Audience Network if CPA exceeds break_even_cpa.
6. **Optimisation event audit**: Confirm the pixel event being optimised matches the business goal. Flag optimising for Link Clicks or Landing Page Views when conversions are the goal.
7. **Creative and copy audit**: Review headline, primary text, CTA button, and ad format per ad. Flag missing social proof, unclear value proposition, or CTA–landing page mismatches.
8. **URL and UTM audit**: Check every ad's destination URL for UTM completeness: source=meta, medium=paid_social, campaign={business}_{offer}_{objective}_{location}_{YYYYMMDD}, content={angle}_{format}_{version}, term={audience}_{test}. Flag missing or broken parameters.
9. **Pixel and event quality audit**: Check event match quality score (target ≥6/10), confirm purchase/lead events are firing, flag duplicate or misfired events.
10. **Performance metrics computation**: For every entity compute: ctr=clicks/impressions; cpc=spend/clicks; cpm=spend/impressions×1000; cpl=spend/leads; cpa=spend/purchases; roas=revenue/spend; frequency=impressions/reach. Compare each to break_even_cpa={{client.average_sale_value}}×{{client.gross_margin}} and break_even_roas=1/{{client.gross_margin}}. Only judge entities with ≥50 clicks or ≥15 conversions.
11. **Frequency and fatigue check**: Flag ad sets with frequency ≥3.0 (warning) or ≥4.0 (action required). Cross-reference CTR trend — drop ≥25% from 7-day peak = fatigued.
12. **Lead quality check**: If {{client.crm}} data is available, compare leads generated to qualified leads and sales. Flag accounts with low CPL but low close rate.
13. **Prioritise recommendations**: Sort findings by impact on CPA/ROAS. Label each: Critical / High / Medium / Low.
14. **Populate template**: Fill in templates/meta-ads-audit-template.md with all findings and recommendations.

## Outputs
Completed `templates/meta-ads-audit-template.md` containing:
- Account summary table (spend, leads, CPL, CPA, ROAS vs break-even)
- Structure findings (naming, budget, objective issues)
- Audience and placement findings
- Creative and copy findings
- Tracking and UTM findings
- Performance metric table per campaign and ad set
- Frequency and fatigue flags
- Lead quality summary (if CRM data available)
- Prioritised recommendation list (Critical → Low), each labelled: fix / duplicate-paused / refresh / archive / escalate
- Health score (0–100) using campaign-health-monitor weights

## Safety rules
- live_edit_block: true — all recommendations are proposals only; no live ad is touched
- use_paused_duplicates_only: true — any suggested change goes into a paused duplicate
- Never delete campaigns or ads — recommend archiving only
- Do not recommend scaling until tracking gate is clear (tracking score ≥15/15)
- Budget increase recommendations require human "YES" before execution
- No ad account IDs, pixel IDs, or access tokens in output — use {{client.*}} variables

## Example commands
- "Audit my Meta ads for {{client.business_name}}"
- "Here's my Facebook Ads export — tell me what's wrong"
- "My CPL is $180 and should be under $80 — do a full audit"
- "Check if my Meta campaign naming is correct"
- "Review my pixel setup and UTMs before I scale"
- "Why is my frequency so high and what do I do about it?"

## Related agents
mira-meta-ads-strategist (strategy recommendations), atlas-tracking-attribution-agent (deep pixel audit), dana-ads-data-analyst (data computation), stella-social-creative-strategist (creative recommendations), paige-ads-policy-safety-agent (policy compliance check)

## Handoff rules
- Pass completed audit template to mira-meta-ads-strategist for strategic next steps
- If tracking issues found, hand off to tracking-attribution-review with specific pixel/event flags noted
- If creative fatigue found, hand off to creative-fatigue-detector with frequency and CTR data included
- If lead quality is suspect, hand off to lead-quality-analyser with CPL and CRM data
- Return health score to campaign-health-monitor for ongoing monitoring baseline


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- `/me/adaccounts` returns `account_id` **without** the `act_` prefix; the insights endpoint needs `act_<id>` — normalise.
- Meta errors carry detail in `error.message`, not just the HTTP status — surface both.
- `business.facebook.com` is a protected site — pull via the Graph API.
