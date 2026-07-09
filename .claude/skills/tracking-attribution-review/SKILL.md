---
name: tracking-attribution-review
description: Audits the complete tracking and attribution stack for Meta (Facebook pixel, Conversions API) and TikTok (TikTok pixel, Events API) paid ads. Checks pixel installation, event firing accuracy, UTM parameter completeness, offline conversion linkage, WhatsApp and Messenger lead source capture, revenue attribution in the ad platform vs CRM vs actual revenue, and issues a binary "safe to scale" or "do not scale" tracking gate. Use when a user says things like "check my tracking", "is my pixel working", "my ROAS looks wrong", "I think my conversions aren't firing", "set up my Conversions API", or "should I trust my numbers before scaling".
---

## Purpose
Ensure every conversion, lead, and sale is being accurately attributed before any spend increase. Bad tracking destroys decision-making. This skill audits the full attribution chain from ad click to revenue record and outputs a tracking gate verdict — safe to scale or not — plus a numbered fix list.

## When to use
- "Check if my pixel is set up correctly"
- "My ROAS looks too high / too low — is my tracking right?"
- "I'm not seeing purchases in Meta but I know sales happened"
- "Set up or audit my Conversions API"
- "Is my tracking good enough to scale?"

## Inputs needed
- {{client.platform_focus}}, {{client.business_name}}, {{client.conversion_events}}
- {{client.crm}} — to cross-reference lead/sale data against ad platform attribution
- Description of current pixel setup (Meta pixel + CAPI, TikTok pixel + Events API, or both)
- UTM examples from active ads (paste 3–5 live destination URLs)
- Ad platform reported conversions vs CRM/back-end reported conversions for the same period (critical for gap analysis)
- WhatsApp or Messenger contact methods in use (if applicable)
- E-commerce platform (Shopify, WooCommerce, custom) if purchase tracking is in scope

## Workflow
1. **Pixel installation check**: Confirm the correct pixel fires on all key pages (landing page, thank-you page, checkout, purchase confirmation). Flag if pixel fires only on the homepage or is missing from key pages.
2. **Event quality audit**: For Meta — check Event Match Quality score in Events Manager (target ≥6/10). For TikTok — check match rate in Events Manager. Flag scores below threshold. List which customer data parameters are being sent (email, phone, first/last name, external ID).
3. **Conversions API (CAPI) audit**: Confirm CAPI or TikTok Events API is implemented alongside the browser pixel. Flag browser-pixel-only setups as high risk (iOS14+ signal loss). Confirm event deduplication is configured to prevent double-counting.
4. **UTM completeness audit**: Check all destination URLs against the standard: utm_source=meta|tiktok; utm_medium=paid_social; utm_campaign={business}_{offer}_{objective}_{location}_{YYYYMMDD}; utm_content={angle}_{format}_{version}; utm_term={audience}_{test}. Flag any missing or malformed parameters.
5. **Attribution window check**: Confirm the ad platform attribution window (Meta: 7-day click, 1-day view recommended; TikTok: 7-day click recommended). Flag mismatches that inflate or deflate reported ROAS.
6. **Platform vs CRM gap analysis**: Compare ad-platform-reported conversions to CRM or back-end records for the same date range. If gap >20% in either direction, flag as tracking gap and block scaling.
7. **Offline conversion linkage**: If sales happen off-platform (phone, WhatsApp, in-person), check whether offline conversion uploads are configured. Flag if offline sales are excluded from attribution.
8. **WhatsApp / Messenger source capture**: If WhatsApp Business or Messenger is a lead channel, confirm source is being captured (e.g. UTM in the link, CRM field for lead source, or click ID in the chat flow). Flag if WhatsApp leads are pooled with no source attribution.
9. **Revenue linkage audit**: Confirm that the revenue figure in the ad platform matches a known revenue source (e.g. Shopify order value, CRM deal value, manual upload). Flag if revenue is unmapped or estimated.
10. **Tracking gate verdict**:
    - **Safe to scale**: Event quality ≥6/10; CAPI active; UTMs complete on all active ads; platform-to-CRM gap ≤20%; no duplicate event firing; revenue linked.
    - **Do not scale**: Any of the above fails. List each blocker with a numbered fix.
11. **Fix list**: Numbered, in priority order. Each fix includes: what is broken, how to fix it, who needs to implement it (developer / media buyer / CRM admin).

## Outputs
- Tracking gate verdict block:
  ```
  TRACKING GATE — {{client.business_name}}
  Verdict: SAFE TO SCALE / DO NOT SCALE
  Event quality score: X/10 (Meta) | X% match rate (TikTok)
  CAPI / Events API: Active / Not active
  UTM completeness: X of X active ads fully tagged
  Platform vs CRM gap: X%
  Offline conversions: Linked / Not linked
  Revenue linkage: Confirmed / Not confirmed
  ```
- Numbered fix list (if "do not scale")
- UTM gap report (specific ads with missing/broken UTMs)
- Recommendations for CAPI / Events API setup (if not implemented)

## Safety rules
- live_edit_block: true — no pixel or tag changes made directly; all fixes are proposals
- Do not scale spending with a "do not scale" tracking gate — this overrides all other verdicts
- Never expose pixel IDs, access tokens, dataset IDs, or API keys — use {{client.*}} variables
- Do not recommend pausing campaigns purely to fix tracking if spend is live — fix tracking in parallel and re-audit
- Offline conversion uploads require human confirmation before submission

## Example commands
- "Audit my Meta pixel and Conversions API setup"
- "Is my tracking good enough to scale my budget?"
- "My Meta ROAS says 8x but my CRM shows half the revenue — find the gap"
- "Check all my UTM parameters across my active ads"
- "Set up my tracking review before we increase spend next week"
- "Are my TikTok pixel events firing correctly?"

## Related agents
atlas-tracking-attribution-agent (deep technical tracking implementation), milo-ai-automation-builder (CAPI and Events API automation), dana-ads-data-analyst (revenue gap analysis), mira-meta-ads-strategist (Meta attribution window strategy), travis-tiktok-ads-strategist (TikTok attribution strategy)

## Handoff rules
- If tracking gate = "safe to scale", pass verdict to campaign-health-monitor and budget-pacing-monitor
- If tracking gate = "do not scale", block all scale actions and hand fix list to atlas-tracking-attribution-agent
- If UTM gaps found, hand off list of affected ads to utm-naming-builder for corrected URL generation
- If offline conversion issue found, hand off to milo-ai-automation-builder for CRM-to-platform upload automation
- Pass tracking score (15/15 possible) to meta-ads-audit or tiktok-ads-audit as part of health score input
