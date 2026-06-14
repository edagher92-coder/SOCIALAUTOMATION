---
name: paid-ads-data-analysis
description: Ingests raw paid-ads data (CSV exports, copy-pasted tables, or structured reports) from Meta, Facebook, Instagram, or TikTok and computes all performance metrics — CTR, CPC, CPM, CPL, CPA, ROAS, MER, hook rate, hold rate, frequency, and break-even comparisons. Outputs a per-entity action table with a keep / kill / duplicate / scale / reduce / refresh / fix-tracking verdict for every campaign, ad set, and ad. Use when a user says things like "analyse my ads data", "here's my CSV", "tell me what's working", "which campaigns should I kill", "calculate my ROAS", or "what's my break-even CPA".
---

## Purpose
Turn raw numbers into clear decisions. Ingest data at any level (account, campaign, ad set, ad), compute every standard metric, compare against break-even and spend thresholds, and produce a verdict for each entity so the user knows exactly what to keep, kill, scale, or fix — without guesswork.

## When to use
- "Here's my Meta ads CSV — analyse it"
- "Which of my TikTok campaigns are profitable?"
- "Calculate my break-even CPA and tell me which ad sets are above it"
- "Tell me what's working and what to cut"
- "I have 30 days of data — give me a full performance breakdown"

## Inputs needed
- Raw data file (CSV, XLSX, or copy-pasted table) with at minimum: entity name, impressions, clicks, spend, and at least one of (leads, purchases, revenue)
- For TikTok data: 3-second video views and thruplays for hook_rate and hold_rate
- {{client.average_sale_value}}, {{client.gross_margin}} — to compute break-even thresholds
- {{client.currency}} — all monetary outputs in this currency
- {{client.platform_focus}} — determines which platform-specific metrics to compute
- Date range of the data (required for accurate pacing and trend context)

## Workflow
1. **Ingest and validate data**: Load all rows. Confirm required columns are present. Flag any entity with zero impressions or zero spend as inactive — exclude from analysis.
2. **Compute core metrics for every entity**:
   - ctr = clicks / impressions
   - cpc = spend / clicks
   - cpm = spend / impressions × 1000
   - cpl = spend / leads (if leads column present)
   - cpa = spend / purchases (if purchases column present)
   - roas = revenue / spend (if revenue column present)
   - mer = total_revenue / total_ad_spend (account level only)
   - frequency = impressions / reach (if reach column present)
3. **Compute break-even thresholds**:
   - break_even_cpa = {{client.average_sale_value}} × {{client.gross_margin}}
   - break_even_roas = 1 / {{client.gross_margin}}
4. **TikTok-specific metrics** (if platform = TikTok):
   - hook_rate = three_second_views / impressions
   - hold_rate = thruplays / three_second_views
5. **Apply data confidence gate**: Only judge entities with ≥50 clicks OR ≥15 conversions. Flag entities below threshold as "insufficient data — do not act yet".
6. **Assign verdict per entity**:
   - **Scale**: roas > break_even_roas × 1.5 AND cpa < break_even_cpa × 0.7 AND health ≥70 AND tracking clear → scale ≤20% budget steps
   - **Keep**: performing at or within 10% of break-even — monitor, do not change
   - **Reduce**: cpa 10–30% above break_even_cpa — reduce budget or pause weakest creatives
   - **Duplicate**: strong performer worth testing in new audience or placement — duplicate paused
   - **Refresh**: cpa acceptable but CTR dropped ≥25% from 7-day peak OR frequency ≥3.0 — new creative needed
   - **Kill**: cpa >30% above break_even_cpa AND ≥50 clicks — pause (not delete)
   - **Fix-tracking**: roas = 0 or revenue = 0 despite known sales, pixel events misfiring — route to tracking-attribution-review before any other action
7. **Summarise at account level**: total spend, total leads/purchases, blended CPL/CPA, blended ROAS, MER, and overall verdict.
8. **Flag any CTR <1%** as low-CTR warning across all entities.
9. **Flag any frequency ≥3.0** as fatigue warning; ≥4.0 as fatigue action.

## Outputs
- **Entity action table** (one row per campaign / ad set / ad):
  ```
  | Entity | Spend | Impressions | CTR | CPC | CPM | CPL/CPA | ROAS | Frequency | Data confidence | Verdict |
  ```
- Break-even reference block: break_even_cpa = $X, break_even_roas = X.Xx
- Account-level summary (total spend, blended CPA, blended ROAS, MER)
- Insufficient-data list (entities excluded from verdicts)
- Priority action list: scale first → duplicate → keep → reduce → refresh → kill → fix-tracking
- Flags: low CTR, high frequency, tracking gaps

## Safety rules
- live_edit_block: true — verdicts are proposals; no live ad is touched
- use_paused_duplicates_only: true — "duplicate" verdict means paused copy only
- "Kill" verdict means pause, never delete
- Scale verdict requires human "YES" and health ≥70 before execution
- Fix-tracking verdict blocks all scale and kill actions until resolved
- No ad account IDs or access tokens in output — use {{client.*}} variables

## Example commands
- "Here's my 30-day Meta export — give me a full analysis"
- "Calculate my break-even CPA and ROAS for {{client.business_name}}"
- "Which of my ad sets should I kill and which should I scale?"
- "Analyse this TikTok CSV including hook rate and hold rate"
- "Tell me my blended ROAS and MER across the whole account"
- "I think my tracking is broken — check my revenue data"

## Related agents
dana-ads-data-analyst (data computation and interpretation), atlas-tracking-attribution-agent (fix-tracking escalations), mira-meta-ads-strategist (Meta strategic decisions), travis-tiktok-ads-strategist (TikTok strategic decisions)

## Handoff rules
- Pass entity action table and break-even block to dana-ads-data-analyst for deeper interpretation
- If fix-tracking verdict appears, immediately hand off to tracking-attribution-review with specific entity names and metric gaps flagged
- If scale verdict appears, route through campaign-health-monitor to confirm health ≥70 before execution
- If refresh verdict appears, hand off to creative-fatigue-detector or creative-testing-lab
- Pass account summary to ads-reporting-builder if a client report is being built
