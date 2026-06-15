---
name: tiktok-ads-audit
description: Runs a full structured audit of a TikTok Ads account with emphasis on metrics and creative principles unique to TikTok: hook rate, hold rate, native feel, sound-on design, Spark Ads eligibility, creator brief quality, and creative fatigue patterns. Use when a user says things like "audit my TikTok ads", "my TikTok CPL is high", "check my TikTok campaigns", "review my TikTok creative", "why is my hook rate low", or "my TikTok ROAS dropped". Outputs a completed tiktok-ads-audit-template.md with findings and prioritised recommendations across campaign structure, creative, targeting, pixel events, and spend efficiency.
---

## Purpose
Deliver a TikTok-specific account audit that goes beyond standard metrics to assess what actually drives performance on TikTok: opening-hook strength, viewer retention, native content quality, creator collaboration, and sound design — alongside standard campaign structure, attribution, and spend efficiency. Output populates templates/tiktok-ads-audit-template.md.

## When to use
- "Audit my TikTok ads"
- "Why is my TikTok CPL so high?"
- "My hook rate is terrible — what's wrong?"
- "Review my TikTok campaign setup and creative"
- "Check my TikTok pixel and events before I scale"

## Inputs needed
- TikTok Ads Manager export (CSV or copy-pasted): campaigns, ad groups, ads with impressions, reach, clicks, spend, leads, purchases, revenue, 3-second video views, thruplays
- {{client.business_name}}, {{client.industry}}, {{client.main_offer}}, {{client.average_sale_value}}, {{client.gross_margin}}
- {{client.currency}}, {{client.monthly_budget}}, {{client.target_audience}}
- {{client.conversion_events}} — TikTok pixel events being tracked
- Video creative links or descriptions (hooks, formats, length, sound-on/off design)
- Landing page URL and UTM examples

## Workflow
1. **Campaign structure check**: Confirm campaign objectives (Traffic, Lead Generation, Conversions, App Install). Flag mismatches with business goal.
2. **Naming convention audit**: Check every campaign, ad group, and ad name against the standard. Flag deviations from `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` / `{audience}_{placement}_{optimisation}` / `{angle}_{format}_{version}`.
3. **Budget structure audit**: Identify campaign-level vs ad-group-level budgets, daily vs lifetime. Flag fragmentation (>5 ad groups per campaign with <50 clicks each).
4. **Audience audit**: Review interest targeting, custom audiences, lookalike audiences, exclusions. Flag if no retargeting layer exists.
5. **Placement and optimisation audit**: Confirm TikTok-only vs all placements. Flag Pangle placements if CPA exceeds break_even_cpa. Confirm optimisation event matches business goal.
6. **Hook rate analysis**: Compute hook_rate = three_second_views / impressions for every ad. Benchmarks: <25% weak (flag red), 25–40% acceptable (amber), >40% strong (green). Flag every ad below 25%.
7. **Hold rate analysis**: Compute hold_rate = thruplays / three_second_views for every ad. Benchmarks: <20% weak (flag red), 20–40% acceptable (amber), >40% strong (green). Flag every ad below 20%.
8. **Native feel audit**: Review creative descriptions or links. Flag any creative that looks like a repurposed Meta ad (logo-heavy, static, no sound design, talking-head-only without text overlays, branded intro cards). TikTok-native ads open mid-scene, use trending audio or original sound, and feel organic.
9. **Sound design audit**: Confirm creatives are designed for sound-on viewing. Flag muted or caption-only concepts with no audio strategy.
10. **Spark Ads eligibility check**: Confirm whether organic posts are being used as Spark Ads. If high-performing organic content exists and is not being boosted, flag as missed opportunity.
11. **Creator brief quality check**: If UGC or creator content is in use, assess whether briefs specify hook format, key message, CTA, and target length. Flag vague or missing briefs.
12. **UTM and pixel audit**: Check UTM completeness on all destination URLs using the standard. Confirm TikTok pixel is firing on correct events. Check event match quality score.
13. **Performance metrics computation**: For every entity compute: ctr=clicks/impressions; cpc=spend/clicks; cpm=spend/impressions×1000; cpl=spend/leads; cpa=spend/purchases; roas=revenue/spend; frequency=impressions/reach. Compare to break_even_cpa and break_even_roas. Only judge entities with ≥50 clicks or ≥15 conversions.
14. **Fatigue check**: Flag ad groups with frequency ≥3.0 (warning) or ≥4.0 (action). Cross-reference hook rate and CTR trend — CTR drop ≥25% from 7-day peak = fatigued.
15. **Prioritise recommendations**: Sort by impact on hook rate, hold rate, CPA, ROAS. Label Critical / High / Medium / Low.
16. **Populate template**: Fill in templates/tiktok-ads-audit-template.md.

## Outputs
Completed `templates/tiktok-ads-audit-template.md` containing:
- Account summary table (spend, leads, CPL, CPA, ROAS vs break-even)
- Campaign structure findings
- Hook rate table per ad (colour-coded red/amber/green)
- Hold rate table per ad (colour-coded red/amber/green)
- Native feel and sound design flags
- Spark Ads opportunity list
- Creator brief quality assessment
- UTM and pixel findings
- Performance metric table per campaign and ad group
- Frequency and fatigue flags
- Prioritised recommendation list (Critical → Low): fix / duplicate-paused / refresh / new-creative-brief / archive / escalate
- Health score (0–100) aligned with campaign-health-monitor weights

## Safety rules
- live_edit_block: true — all recommendations are proposals only; no live ad is touched
- use_paused_duplicates_only: true — any suggested change goes into a paused duplicate
- Never delete — recommend archiving only
- Do not recommend scaling until tracking gate is clear (tracking score ≥15/15)
- Budget increases require human "YES" before execution
- No ad account IDs, pixel IDs, or access tokens in output — use {{client.*}} variables

## Example commands
- "Audit my TikTok account for {{client.business_name}}"
- "Here's my TikTok Ads export — what's underperforming?"
- "My hook rate is below 20% across all ads — do a full audit"
- "Check if my TikTok creative is actually native or just repurposed Meta ads"
- "Review my TikTok pixel events before I increase budget"
- "My TikTok CPL is double my Meta CPL — find out why"

## Related agents
travis-tiktok-ads-strategist (strategy and creative recommendations), stella-social-creative-strategist (native TikTok creative briefs), atlas-tracking-attribution-agent (pixel and event audit), dana-ads-data-analyst (data computation), paige-ads-policy-safety-agent (TikTok policy review)

## Handoff rules
- Pass completed audit template to travis-tiktok-ads-strategist for creative and bidding strategy
- If hook/hold rates are critically low, hand off to creative-testing-lab to design a structured hook test
- If pixel or UTM issues found, hand off to tracking-attribution-review with specific flags included
- If frequency is high and CTR is dropping, hand off to creative-fatigue-detector
- Return health score to campaign-health-monitor for ongoing monitoring baseline


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- TikTok returns errors as a **non-zero `code` inside a 200 body** — check `code`, not just HTTP status.
- Reporting metric/dimension names differ from Meta's field names — map carefully.
- Content Posting defaults to `SELF_ONLY` (private) until the app is audited/approved.
