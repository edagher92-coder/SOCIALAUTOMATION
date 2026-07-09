---
name: offer-funnel-review
description: Reviews the complete offer and conversion funnel for a paid ads campaign — from the ad click through to the landing page, lead form, qualification step, CTA, trust signals, urgency, social proof, pricing clarity, and post-conversion follow-up. Use when a user says things like "my landing page isn't converting", "review my offer", "CPL is fine but leads don't close", "check my funnel", "why aren't people buying", or "I want to improve my conversion rate". Covers Meta lead ads, TikTok lead gen forms, external landing pages, and direct-to-checkout flows.
---

## Purpose
Identify every friction point and conversion leak between ad click and qualified lead or sale. A low CPA means nothing if the offer is weak or the funnel loses buyers at every step. This skill audits the full post-click experience and outputs specific, prioritised fixes.

## When to use
- "My landing page isn't converting"
- "CPL is low but the leads don't convert to sales"
- "Review my offer and funnel before I scale"
- "Why aren't people filling out my form?"
- "Check if my landing page matches my ad"

## Inputs needed
- {{client.main_offer}}, {{client.average_sale_value}}, {{client.gross_margin}}, {{client.target_audience}}
- {{client.industry}}, {{client.business_name}}, {{client.brand_voice}}
- Landing page URL (or screenshot/description if URL not shareable)
- Lead form questions (if Meta/TikTok native lead gen form is in use)
- Ad creative and copy being used to drive traffic (so ad-to-page message match can be assessed)
- {{client.conversion_events}} — what counts as a conversion
- {{client.crm}} — post-lead follow-up sequence (optional but valuable)
- Current CPL, lead-to-sale close rate, and time-to-close (if known)

## Workflow
1. **Ad-to-page message match**: Compare the ad headline, hook, and primary offer statement to the landing page headline and hero section. Flag any disconnect — if the ad promises X and the page opens with Y, buyers bounce.
2. **Offer clarity audit**: Is the core offer immediately obvious? Can a new visitor understand what they get, who it's for, and what it costs (or what the next step is) within 5 seconds? Flag vague or buried offers.
3. **Value proposition strength**: Does the offer include a clear, specific benefit (outcome + timeframe + for whom)? Flag generic claims with no differentiation.
4. **CTA audit**: Is there a single, clear primary CTA above the fold? Is the CTA copy action-oriented (e.g. "Book a free strategy call" not "Submit")? Are there too many competing CTAs diluting focus?
5. **Trust and social proof audit**: Check for testimonials, case studies, logos, reviews, accreditations, guarantees, or media mentions. Flag pages with zero social proof. Assess specificity — "I made $10k in 3 weeks" beats "great service".
6. **Urgency and scarcity audit**: Is there a genuine reason to act now? Flag fake scarcity. Assess whether urgency is tied to a believable, offer-specific reason.
7. **Qualification and friction audit** (for lead gen): Review lead form questions. Flag forms with >5 questions if CPL is the primary goal. Flag forms with <2 qualifying questions if lead quality is the primary concern. Recommend balance.
8. **Pricing clarity audit**: Is price visible (for e-commerce or direct purchase flows)? If price is hidden, is there a clear reason to withhold it? Flag if pricing confusion is likely causing drop-off.
9. **Mobile experience check**: Confirm the page is mobile-optimised. Flag slow load times (>3 seconds), tiny text, or CTA buttons below the fold on mobile — critical for Meta and TikTok traffic.
10. **Post-conversion follow-up audit**: Review the thank-you page and first follow-up (email/SMS/call). Flag if there is no immediate confirmation, no next-step instruction, or no lead-to-appointment automation.
11. **Prioritise fixes**: Label each finding Critical / High / Medium / Low by estimated impact on close rate or CPL. Group into: fix now / test / monitor.

## Outputs
- Offer clarity score (1–10) with rationale
- Ad-to-page message match: Pass / Partial / Fail with specific gaps listed
- Funnel audit table:
  ```
  | Stage | Finding | Severity | Recommended fix |
  | Offer clarity | ... | Critical | ... |
  | CTA | ... | High | ... |
  | Trust signals | ... | Medium | ... |
  ```
- Prioritised fix list (Critical → Low)
- Recommended A/B test ideas for the highest-impact funnel changes (pass to creative-testing-lab)
- Post-conversion sequence assessment

## Safety rules
- live_edit_block: true — all recommendations are proposals; no live page or form is edited directly
- use_paused_duplicates_only: true — funnel changes should be tested as duplicates before replacing live versions
- Never recommend removing the entire funnel — recommend targeted fixes or split tests
- Budget increases blocked until funnel score meets minimum threshold — fix funnel first, then scale
- No client URLs, form data, or personal information stored — describe findings in plain English only

## Example commands
- "Review my landing page and tell me why it's not converting"
- "My offer feels weak — help me sharpen it"
- "Check if my Meta ad and my landing page are saying the same thing"
- "My leads are cheap but they don't buy — what's wrong with my funnel?"
- "Should I use a native lead form or a landing page for my TikTok ads?"
- "Audit my qualification questions — I think I'm getting too many unqualified leads"

## Related agents
titan-offer-funnel-strategist (offer positioning and reframing), stella-social-creative-strategist (ad-to-page message alignment), mira-meta-ads-strategist (Meta lead form vs landing page decision), travis-tiktok-ads-strategist (TikTok funnel native feel), dana-ads-data-analyst (funnel conversion rate data)

## Handoff rules
- Pass prioritised fix list to titan-offer-funnel-strategist for offer reframing and copy recommendations
- Pass A/B test ideas to creative-testing-lab for structured testing setup
- If close rate is low despite good CPL, hand off to lead-quality-analyser to assess lead quality vs funnel quality
- If ad-to-page match fails, flag to mira-meta-ads-strategist or travis-tiktok-ads-strategist for creative brief alignment
