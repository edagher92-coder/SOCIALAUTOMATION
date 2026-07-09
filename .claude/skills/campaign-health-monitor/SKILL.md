---
name: campaign-health-monitor
description: Computes the AdPilot OS campaign health score (0–100) using the defined 13-component weighted scoring system across tracking, CPA, spend efficiency, conversion rate, CTR, lead quality, creative freshness, CPC, naming, offer strength, landing-page alignment, budget pacing, and data confidence. Outputs the standardised health score block with a band (Green 80–100, Yellow 60–79, Orange 40–59, Red 0–39). Use when a user says things like "what's my health score", "give me an overall account check", "is my account healthy enough to scale", "run the health monitor", or "score my campaigns".
---

## Purpose
Give a single, objective 0–100 number that summarises the health of a paid-ads account. The score tells the user whether they can scale (≥70), should fix before scaling (40–69), or need urgent intervention (<40). Every component is scored separately so the user knows exactly what's dragging the score down.

## When to use
- "What's the health score for my Meta account?"
- "Is my account healthy enough to increase budget?"
- "Run the campaign health monitor for {{client.business_name}}"
- "Score my TikTok campaigns"
- "Give me an overall account health check before my client call"

## Inputs needed
- {{client.average_sale_value}}, {{client.gross_margin}} — for break-even CPA and ROAS
- {{client.monthly_budget}}, {{client.currency}}
- {{client.conversion_events}}, {{client.crm}}
- {{client.platform_focus}}
- Performance data for the scoring period: spend, impressions, clicks, leads, purchases, revenue, reach, frequency
- Tracking review status (from tracking-attribution-review if available)
- Creative age (days since newest creative launched) and number of active creatives
- Naming convention compliance (from UTM/naming audit if available)
- Lead quality score (from lead-quality-analyser if available)
- Budget pacing status (from budget-pacing-monitor if available)

## Workflow
1. **Collect all component inputs**. If a component's data is unavailable, score it 0 and flag as "data unavailable — assumed worst case".
2. **Score each component** (max points shown; raw score = weighted contribution):

   | # | Component | Max pts | How to score |
   |---|---|---|---|
   | 1 | Tracking quality | 15 | 15 = CAPI active + event quality ≥6/10 + UTMs 100% complete; 10 = browser pixel only + quality ≥6; 5 = partial UTMs or quality <6; 0 = no reliable tracking |
   | 2 | CPA vs break-even | 15 | 15 = CPA ≤70% of break_even_cpa; 10 = CPA 70–100% of break_even_cpa; 5 = CPA 100–130%; 0 = CPA >130% or no conversion data |
   | 3 | Spend efficiency | 12 | 12 = ROAS ≥ break_even_roas × 1.5; 8 = ROAS ≥ break_even_roas; 4 = ROAS 70–100% of break_even_roas; 0 = below break-even |
   | 4 | Conversion rate | 10 | 10 = landing page CVR ≥ industry benchmark; 6 = within 20% of benchmark; 3 = 20–50% below; 0 = no CVR data or CVR >50% below benchmark |
   | 5 | CTR | 8 | 8 = CTR ≥2%; 5 = CTR 1–2%; 2 = CTR 0.5–1%; 0 = CTR <0.5% |
   | 6 | Lead quality | 8 | 8 = lead-to-sale rate ≥client target; 5 = within 20% of target; 2 = 20–50% below; 0 = no lead quality data or rate >50% below target |
   | 7 | Creative freshness | 8 | 8 = newest creative <14 days old AND ≥3 active creatives; 5 = newest creative 14–30 days; 2 = newest creative 30–60 days; 0 = all creatives >60 days old |
   | 8 | CPC | 7 | 7 = CPC ≤ break_even_cpa × 0.1; 4 = CPC ≤ break_even_cpa × 0.2; 1 = CPC ≤ break_even_cpa × 0.3; 0 = CPC > break_even_cpa × 0.3 |
   | 9 | Naming convention | 5 | 5 = 100% compliant; 3 = ≥80% compliant; 1 = 50–79% compliant; 0 = <50% compliant |
   | 10 | Offer strength | 5 | 5 = clear specific outcome, proof, and CTA; 3 = offer present but generic; 1 = offer unclear; 0 = no discernible offer |
   | 11 | Landing-page alignment | 4 | 4 = ad message matches page headline and CTA exactly; 2 = partial match; 0 = mismatch or no landing page |
   | 12 | Budget pacing | 2 | 2 = spend within ±10% of pro-rata target; 1 = 10–25% off; 0 = >25% off target |
   | 13 | Data confidence | 1 | 1 = all campaigns have ≥50 clicks AND ≥15 conversions; 0 = insufficient data |

3. **Sum all component scores** → Total = 0–100.
4. **Assign band**:
   - Green 80–100: healthy, eligible to scale (≤20% budget steps)
   - Yellow 60–79: monitor closely, fix Yellow issues before scaling
   - Orange 40–59: do not scale, prioritise fixes
   - Red 0–39: pause scaling, urgent intervention required
5. **Generate the health score block** (see Outputs).
6. **List the top 3 components dragging the score** with specific fix actions.
7. **State scale eligibility**: health ≥70 = eligible; <70 = not eligible.

## Outputs
Standardised health score block:
```
CAMPAIGN HEALTH SCORE — {{client.business_name}} — {{date}}
Platform: {{client.platform_focus}}
Period: [date range]

TOTAL SCORE: XX / 100  |  Band: [GREEN / YELLOW / ORANGE / RED]
Scale eligible: YES (health ≥70) / NO (health <70)

Component breakdown:
  Tracking quality:        XX / 15
  CPA vs break-even:       XX / 15
  Spend efficiency:        XX / 12
  Conversion rate:         XX / 10
  CTR:                     XX /  8
  Lead quality:            XX /  8
  Creative freshness:      XX /  8
  CPC:                     XX /  7
  Naming convention:       XX /  5
  Offer strength:          XX /  5
  Landing-page alignment:  XX /  4
  Budget pacing:           XX /  2
  Data confidence:         XX /  1

Top 3 issues dragging score:
  1. [Component] — [current value] — [specific fix]
  2. [Component] — [current value] — [specific fix]
  3. [Component] — [current value] — [specific fix]
```

## Safety rules
- live_edit_block: true — health score is diagnostic only; no campaign changes made
- Do not recommend scaling if health <70 — flag explicitly
- If tracking score is 0 or 5 (below 10), block all scaling recommendations regardless of total score
- No ad account IDs or private data in output — use {{client.*}} variables

## Example commands
- "Run the health monitor for my Meta account"
- "What's my campaign health score for {{client.business_name}}?"
- "Score my TikTok campaigns and tell me if I can scale"
- "Give me the full health score breakdown before my client review"
- "Is my account healthy enough to double the budget?"
- "What are the top three things pulling my health score down?"

## Related agents
dana-ads-data-analyst (metric inputs for scoring), atlas-tracking-attribution-agent (tracking score input), riley-client-reporting-agent (health score block included in client reports), mira-meta-ads-strategist (acts on health score fixes)

## Handoff rules
- Pass health score block to ads-reporting-builder or riley-client-reporting-agent for inclusion in reports
- If health <70, route top-issue list to the relevant skill (e.g. low tracking → tracking-attribution-review; low creative freshness → creative-fatigue-detector)
- If health ≥70 and user wants to scale, pass "scale eligible" confirmation to budget-pacing-monitor
- Re-run after each major fix to track score improvement over time


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- **Read-only invariant:** analyse + propose; never edit/pause/scale without an explicit typed-YES.
- Benchmarks are **ranges** that vary by vertical/geo/season — never present as absolutes.
- Idempotent sync (delete-window + insert, dedupe account ids, partial-failure safe).
- Spend with zero recorded results / broken tracking → audit pixel/events **first**; never scale or cut blind.
