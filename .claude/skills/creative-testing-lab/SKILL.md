---
name: creative-testing-lab
description: Designs structured, statistically sound creative tests for Meta (Facebook, Instagram) and TikTok paid ads. Tests one variable at a time, builds clear hypotheses, defines control vs variant, applies ICE or PIE scoring to prioritise which tests to run first, and populates the creative-testing-matrix.csv. Use when a user says things like "I want to test new creatives", "help me set up an A/B test", "which ad angle should I test first", "my creatives are stale — what do I test", "design a hook test for TikTok", or "how do I know which creative is winning".
---

## Purpose
Remove guesswork from creative testing. Design structured experiments where one variable changes at a time, each test has a clear hypothesis and success metric, and results can be read with confidence. Prevents wasted spend on inconclusive tests and fills creative-testing-matrix.csv as the living record of all tests.

## When to use
- "I want to test new ad creatives"
- "Help me set up a proper A/B test on Meta"
- "Which hook should I test first on TikTok?"
- "My CTR is low — design a creative test to fix it"
- "Set up a structured test between two offers"

## Inputs needed
- {{client.business_name}}, {{client.main_offer}}, {{client.target_audience}}, {{client.platform_focus}}
- {{client.monthly_budget}} — to confirm test budget is sufficient (min 2× break_even_cpa per variant to get 15+ conversions)
- {{client.average_sale_value}}, {{client.gross_margin}} — to compute break_even_cpa for sample size
- Current best-performing creative (the control) — describe or link
- The variable the user wants to test (hook, format, angle, CTA, offer, length, thumbnail)
- Optional: list of test ideas to prioritise with ICE/PIE scoring

## Workflow
1. **Confirm the control**: Identify the current best performer (highest ROAS or lowest CPA with ≥50 clicks). If no clear control exists, define one before testing.
2. **Isolate one variable**: Challenge the user if they want to test more than one variable per test. One change at a time — hook, format, angle, CTA, offer framing, video length, or thumbnail. Document the variable.
3. **Write the hypothesis**: Format — "We believe changing [variable] from [control value] to [variant value] will [increase/decrease] [metric] by [X%] because [reason]."
4. **Define success metric and threshold**: Primary metric (CTR, hook_rate, CPL, CPA, ROAS). State the minimum improvement that makes the variant worth adopting (e.g. "CTR must improve ≥20% to declare winner").
5. **Calculate minimum spend per variant**: Minimum spend = break_even_cpa × 15 conversions (or 50 clicks if conversion volume is low). Flag if budget is insufficient.
6. **Set test duration**: Minimum 7 days, maximum 14 days per test. Flag if the proposed date range is too short.
7. **ICE/PIE prioritisation** (if multiple test ideas exist):
   - ICE: Impact (1–10) × Confidence (1–10) × Ease (1–10); rank highest score first
   - PIE: Potential (1–10) × Importance (1–10) × Ease (1–10); use as alternative
   - Output ranked test backlog
8. **Structure the test in Ads Manager** (as a proposal):
   - Duplicate the control ad set (paused)
   - Change only the specified variable in the variant
   - Ensure equal budgets across control and variant
   - Apply identical audiences, placements, and optimisation events
   - Name variants using standard: `{angle}_{format}_{version}` — e.g. `painpoint_video_v2`
9. **Define read-out date and decision rule**: On read-out date, if variant beats control on primary metric by ≥threshold with ≥50 clicks or ≥15 conversions → adopt variant as new control. Otherwise → archive variant.
10. **Populate creative-testing-matrix.csv**: Add one row per test with: test ID, variable tested, hypothesis, control name, variant name, primary metric, threshold, budget per variant, start date, read-out date, result, decision.

## Outputs
- Written test brief (hypothesis, variable, control, variant, success metric, threshold)
- Budget and duration check (pass/fail with explanation)
- ICE/PIE scored and ranked test backlog (if multiple ideas provided)
- Paused-duplicate setup proposal with exact naming for control and variant
- Updated creative-testing-matrix.csv row(s)
- Decision rule for read-out date

## Safety rules
- live_edit_block: true — all test setups are paused duplicates; no live ad is altered
- use_paused_duplicates_only: true
- Never run tests with insufficient budget (below min spend per variant) — flag and pause until budget is confirmed
- Never test more than one variable per test — split into separate tests if needed
- Scale only the winning variant, not both — requires human "YES"
- No ad account IDs or access tokens in output — use {{client.*}} variables

## Example commands
- "Design a hook test for my TikTok ads"
- "I want to test two different offers on Meta — set it up properly"
- "Help me prioritise my creative test backlog with ICE scoring"
- "My CTR is 0.6% — build a test to fix it"
- "Set up an A/B test between a testimonial video and a demo video"
- "What's the minimum budget I need to run a valid creative test?"

## Related agents
stella-social-creative-strategist (creative brief writing for variants), travis-tiktok-ads-strategist (TikTok-specific hook and format guidance), mira-meta-ads-strategist (Meta-specific placement and format guidance), dana-ads-data-analyst (reading test results)

## Handoff rules
- Pass test brief and matrix row to stella-social-creative-strategist to write creative briefs for variants
- On read-out date, pass results to dana-ads-data-analyst or paid-ads-data-analysis to compute metric deltas and declare winner
- If winner found, pass to campaign-health-monitor to update health score baseline
- If test reveals tracking gaps (conversion data unreliable), hand off to tracking-attribution-review before declaring results
