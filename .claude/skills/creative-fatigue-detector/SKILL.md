---
name: creative-fatigue-detector
description: Detects creative fatigue in Meta (Facebook, Instagram) and TikTok paid ads by analysing frequency, CTR trends, CPM trends, CPA trends, hook rate trends (TikTok), and hold rate trends (TikTok). Flags fatigued ads and ad sets using defined thresholds (frequency ≥3.0 warning / ≥4.0 action; CTR drop ≥25% from 7-day peak) and recommends refresh, rotation, audience broadening, or creative retirement actions. Use when a user says things like "my ads are getting stale", "CTR is dropping", "frequency is too high", "my CPM is rising", "I think my creatives are fatigued", or "when should I refresh my ads".
---

## Purpose
Catch creative fatigue early — before it drives up CPL and CPA to unprofitable levels. Use frequency trends, CTR decay, and CPM/CPA rises as leading indicators, then produce a clear per-ad fatigue verdict (fatigued / at-risk / healthy) and a specific refresh or rotation action for each.

## When to use
- "My CTR has been dropping for two weeks"
- "Check if my Meta creatives are fatigued"
- "My frequency is above 3 — should I refresh?"
- "My CPL has risen 40% this month — is it creative fatigue?"
- "Tell me which of my TikTok ads need to be replaced"

## Inputs needed
- {{client.platform_focus}}, {{client.business_name}}
- Per-ad performance data for the past 14–30 days: daily impressions, clicks, spend, CPM, leads, purchases (and 3-second views + thruplays for TikTok)
- Reach and impressions per ad set (to compute frequency = impressions / reach)
- 7-day daily CTR data per ad (to detect peak and measure current drop)
- {{client.average_sale_value}}, {{client.gross_margin}} — to assess CPA trend vs break-even
- Creative launch dates (to compute creative age in days)
- {{client.monthly_budget}} — to assess scale risk if fatigued ads are primary spend drivers

## Workflow
1. **Compute frequency per ad set**: frequency = impressions / reach. Flag: ≥3.0 = warning; ≥4.0 = action required.
2. **Compute 7-day CTR peak per ad**: Find the highest daily CTR in the last 7 days. Compute current CTR. Calculate CTR_drop_pct = (peak_ctr − current_ctr) / peak_ctr × 100. Flag: drop ≥25% = fatigued.
3. **CPM trend analysis**: Compare average CPM for the last 7 days vs the prior 7 days. Flag if CPM has risen ≥20% week-over-week with no change in audience size — rising CPM signals the algorithm is struggling to find new, receptive viewers.
4. **CPA trend analysis**: Compare average CPA for the last 7 days vs the prior 7 days. Flag if CPA has risen ≥20% WoW while frequency is also rising — indicates audience exhaustion is driving cost inefficiency.
5. **TikTok-specific: hook rate and hold rate trends**: If platform = TikTok, compute 7-day average hook_rate and hold_rate per ad. Flag if hook_rate has dropped below 25% or hold_rate has dropped below 20%, especially combined with rising frequency.
6. **Creative age check**: Flag any ad running ≥30 days as "at-risk" and any ad running ≥60 days as "likely fatigued regardless of metrics" — audiences have had maximum exposure.
7. **Assign fatigue verdict per ad**:
   - **Fatigued**: frequency ≥4.0 OR CTR drop ≥25% OR creative age ≥60 days — immediate action
   - **At-risk**: frequency ≥3.0 OR CTR drop 15–24% OR creative age 30–60 days — monitor and plan refresh
   - **Healthy**: frequency <3.0 AND CTR drop <15% AND creative age <30 days — no action needed
8. **Generate refresh / rotation recommendations per fatigued or at-risk ad**:
   - **Refresh**: new creative with different angle, hook, or format — send brief to creative-testing-lab
   - **Rotate out**: pause this ad, activate the next creative in the rotation queue
   - **Broaden audience**: if fatigue is isolated to a small, narrow audience — widen targeting or add a new lookalike
   - **New creative brief**: if no rotation queue exists, flag to stella-social-creative-strategist for urgent brief
9. **Prioritise actions**: List fatigued ads first (most urgent), then at-risk, then healthy. Include estimated CPL impact if no action is taken.
10. **Rotation schedule recommendation**: Based on audience size and budget, recommend a proactive creative rotation cadence (e.g. "for a $15,000/month account targeting 500k audience, introduce one new creative every 10–14 days").

## Outputs
- Fatigue verdict table per ad:
  ```
  | Ad name | Frequency | 7-day CTR peak | Current CTR | CTR drop % | Creative age (days) | Verdict | Recommended action |
  ```
- CPM and CPA trend summary (WoW comparison)
- TikTok hook/hold rate trend table (if platform = TikTok)
- Prioritised action list: fatigued first → at-risk → healthy
- Proactive rotation cadence recommendation
- Creative brief requests to hand to stella-social-creative-strategist (list of fatigued ads needing replacement)

## Safety rules
- live_edit_block: true — all rotation and refresh actions are proposals; no live ads paused directly
- use_paused_duplicates_only: true — new creatives enter as paused duplicates, not live replacements
- Never delete a fatigued ad — archive it so performance data is preserved
- Do not pause a fatigued ad if it is the only active creative in the account — replace first, then pause
- Budget reallocation from fatigued to healthy ads requires human "YES"

## Example commands
- "Check if my Meta ads are fatigued"
- "My TikTok frequency is 4.2 — what do I do?"
- "Which of my creatives need to be refreshed this week?"
- "My CTR dropped from 1.8% to 0.9% in two weeks — is it fatigue?"
- "Set up a creative rotation schedule for my $20,000/month account"
- "My CPM has gone up 35% — is that a fatigue signal?"

## Related agents
stella-social-creative-strategist (new creative briefs for fatigued ads), creative-testing-lab (structured tests to find the next winning creative), mira-meta-ads-strategist (audience broadening strategy), travis-tiktok-ads-strategist (TikTok rotation strategy), dana-ads-data-analyst (trend data computation)

## Handoff rules
- Pass list of fatigued ads (with brief description of what made them work before) to stella-social-creative-strategist for replacement briefs
- Pass fatigue signals to creative-testing-lab if a structured test should replace the rotation
- Include fatigue verdict in meta-ads-audit or tiktok-ads-audit output if a full audit is in progress
- Update campaign-health-monitor creative freshness score after new creatives are launched
- If rising CPM and CPA suggest audience exhaustion beyond creative fatigue, flag to mira-meta-ads-strategist or travis-tiktok-ads-strategist for audience strategy review
