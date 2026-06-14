---
name: ads-policy-risk-checker
description: Scans ad copy, creative briefs, and targeting plans for Meta and TikTok policy risk — including misleading or absolute claims, prohibited guarantees, personal-attribute targeting violations, restricted category triggers, and Australian Consumer Law (ACCC) compliance issues. Use this skill when someone asks to "check this ad for policy issues", "is this copy safe to run?", "will Meta reject this?", "review my ad for compliance", or "does this claim break any rules?" Outputs a pass, flag, or fix result per item.
---

## Purpose
Catch policy violations, misleading claims, and AU consumer law issues in ad creative before they go live — avoiding account suspensions, ad rejections, wasted spend on rejected ads, and ACCC liability. This skill does not approve ads; it flags risk with plain-English explanations and proposes compliant rewrites where possible. It covers Meta Advertising Policies, TikTok Advertising Policies, and the Australian Consumer Law as enforced by the ACCC.

## When to use
Run this skill before any new ad, angle, or creative concept goes live. Make it standard practice for every campaign.

Example user phrases:
- "Check this ad copy for policy violations before I submit it"
- "Will TikTok reject this — it mentions weight loss"
- "Is it safe to say 'guaranteed results' in my Facebook ad?"
- "Review this targeting plan for personal attribute issues"
- "Does this finance ad copy break any ACCC rules?"

## Inputs needed
- Ad copy (headline, primary text, description) — full text required (required)
- Platform: Meta, TikTok, or both (required)
- Business category / industry: {{client.industry}} (required — determines restricted category rules)
- Target audience description or targeting plan (required for personal attribute check)
- Landing page URL or description (if available — for destination policy check)
- Creative concept description (if copy isn't finalised — for early risk scan)
- {{client.main_offer}} — helps contextualise claim risk
- {{client.location}} — Australia-specific rules apply by default

## Workflow
1. Receive and parse all submitted copy, targeting, and creative inputs.
2. Run the Absolute Claims check:
   - Flag: "guaranteed", "#1", "best", "always", "never", "100%", "proven to" (unqualified), "fastest", "lowest price" (unsubstantiated).
   - Each flag: explain the risk + propose a compliant rewrite.
3. Run the Prohibited Content check (platform-specific):
   - Meta: before/after images, body image idealism, clickbait, misleading social proof, prohibited categories (gambling, alcohol by audience, adult, weapons, surveillance).
   - TikTok: same plus: no fake urgency countdown claims, no unsubstantiated earnings claims, no political content restrictions.
4. Run the Personal Attribute Targeting check:
   - Flag any targeting logic that implies knowledge of a person's health, financial status, religion, sexual orientation, or other sensitive attributes.
   - Reference Meta's Special Ad Categories (Housing, Employment, Credit) if applicable.
5. Run the Restricted Category check:
   - Finance/credit: must not promise returns or minimise risk.
   - Health/medical: no diagnosis, cure, or guarantee claims; TGA compliance flag if applicable.
   - Supplements/weight loss: "results may vary" + no extreme claims.
   - Legal: no guaranteed outcomes.
6. Run the Australian Consumer Law (ACCC) check:
   - False or misleading representations (s. 29 ACL).
   - Bait advertising risk.
   - Unsubstantiated "free" or "bonus" claims.
   - Testimonials: must reflect typical results or be qualified.
7. Check destination consistency: does the landing page deliver what the ad promises?
8. Compile results: for each item, assign PASS / FLAG / FIX.
   - PASS: no issue found.
   - FLAG: potential issue — human review recommended; explain the risk.
   - FIX: clear violation — do not run; provide a compliant rewrite.
9. Produce a summary risk score: Low / Medium / High / Do Not Run.
10. Output the full check report.

## Outputs
- Line-by-line analysis of submitted copy (PASS / FLAG / FIX per item)
- Plain-English explanation of each flagged risk
- Proposed compliant rewrites for all FIX items
- Targeting plan risk assessment
- AU Consumer Law (ACCC) compliance note
- Overall risk score: Low / Medium / High / Do Not Run
- Recommended next steps before submission

## Safety rules
- This skill flags risk; it does not guarantee ad approval — platform policies change without notice.
- A PASS result does not mean the ad is approved by Meta or TikTok — it means no policy risk was detected in this review.
- Never advise running a "Do Not Run" rated ad regardless of business pressure.
- Do not provide legal advice; flag serious ACCC concerns and recommend the business seek legal counsel.
- live_edit_block: true — this skill reviews documents; it does not submit ads.
- Results are proposals for human review; a human must confirm compliance before submission.

## Example commands
- "Check this Meta ad copy for policy risk: [paste copy]"
- "Scan this TikTok script — it mentions weight loss and a 30-day challenge"
- "Is this finance ad copy safe for Meta? We're promising 'better returns than your bank'"
- "Review this targeting plan — we're targeting people who visited a diabetes support page"
- "Does our 'satisfaction guaranteed' claim pass ACCC requirements?"
- "Policy-check all three headline variants before we launch tomorrow"

## Related agents
- paige-ads-policy-safety-agent (primary driver of this skill; handles ongoing policy monitoring)
- stella-social-creative-strategist (produces revised creative after FIX results)
- mira-meta-ads-strategist (escalation for Meta-specific restricted category edge cases)
- travis-tiktok-ads-strategist (escalation for TikTok-specific content policy edge cases)
- start-ads-command-centre (blocks campaign launch if risk score is High or Do Not Run)

## Handoff rules
- Run this skill before every new ad or creative variant is submitted — make it a mandatory gate in the campaign launch workflow.
- FIX items must be rewritten and re-checked before handoff to start-ads-command-centre for launch.
- High or Do Not Run scores must be escalated to the human operator; do not proceed without a human decision.
- ACCC concerns flagged as serious must be escalated to the business owner with a written record of the flag.
- Completed check reports are filed in /clients/{{client.business_name}}/reports/policy-checks/.
