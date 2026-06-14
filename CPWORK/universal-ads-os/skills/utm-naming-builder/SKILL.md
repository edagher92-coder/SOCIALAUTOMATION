---
name: utm-naming-builder
description: Generates fully compliant UTM parameters and campaign/ad set/ad names for Meta (Facebook, Instagram) and TikTok paid ads using the AdPilot OS naming standard. Validates existing UTMs and names against the standard, flags deviations, and populates utm-naming-template.csv. Use when a user says things like "build my UTMs", "create my campaign name", "check my UTM parameters", "what should I name this ad set", "generate UTM links for my ads", or "make sure my naming is consistent".
---

## Purpose
Produce correctly formatted UTM URLs and campaign / ad set / ad names every time, so tracking is clean, reporting is readable, and the attribution chain from ad click to CRM is unbroken. Eliminates inconsistent naming that breaks dashboards and pollutes GA4/CRM source data.

## When to use
- "Build UTM parameters for my new Meta campaign"
- "What should I name this TikTok campaign?"
- "Check if my existing UTMs are correct"
- "Generate a naming convention for all my new ad sets"
- "My GA4 data is a mess — fix my UTM structure"

## Inputs needed
- {{client.business_name}} (abbreviated slug, e.g. "acme" — lowercase, no spaces, hyphens OK)
- {{client.main_offer}} (abbreviated, e.g. "weightloss-program")
- {{client.platform_focus}} — meta or tiktok (determines utm_source)
- Campaign objective (e.g. leads, conversions, traffic, awareness)
- {{client.location}} (e.g. au-sydney, au-national, us-national)
- Launch date in YYYYMMDD format
- Ad set details: audience type, placement, optimisation event
- Ad details: creative angle, format (video/image/carousel/reel), version number
- Destination URL (base URL without UTMs) — required to build the full tagged URL
- For validation: existing UTMs or campaign names to check against the standard

## Workflow
1. **Confirm naming inputs**: Gather all required fields. Prompt for any missing. Convert all values to lowercase slugs (no spaces — use hyphens; no special characters except hyphens and underscores).
2. **Build campaign name**: `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` — e.g. `acme_weightloss-program_leads_au-sydney_20260614`
3. **Build ad set name**: `{audience}_{placement}_{optimisation}` — e.g. `cold-interest_feed-reels_lead` or `retargeting-60d_stories_purchase`
4. **Build ad name**: `{angle}_{format}_{version}` — e.g. `painpoint_video_v1` or `testimonial_carousel_v3`
5. **Build UTM parameters**:
   - utm_source: `meta` or `tiktok`
   - utm_medium: `paid_social`
   - utm_campaign: `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` (same as campaign name)
   - utm_content: `{angle}_{format}_{version}` (same as ad name)
   - utm_term: `{audience}_{test}` (e.g. `cold-interest_hooktest`)
6. **Assemble the full tagged URL**: `{base_url}?utm_source=X&utm_medium=paid_social&utm_campaign=X&utm_content=X&utm_term=X`
7. **Validate existing names/UTMs** (if provided): Compare each field against the standard. Flag: wrong case, spaces instead of hyphens/underscores, missing fields, wrong utm_source value, wrong utm_medium value, duplicate content/term values across different ads.
8. **Batch generation** (if multiple ads): Generate one row per ad in utm-naming-template.csv format.
9. **Output the CSV rows** and the full tagged URLs ready to paste.

## Outputs
- Campaign name (plain text, ready to copy)
- Ad set name (plain text, ready to copy)
- Ad name (plain text, ready to copy)
- Full tagged destination URL(s) (ready to paste into Ads Manager)
- utm-naming-template.csv rows:
  ```
  | Campaign name | Ad set name | Ad name | utm_source | utm_medium | utm_campaign | utm_content | utm_term | Full URL |
  ```
- Validation report (if existing names/UTMs were checked): pass / fail per field with specific fix instruction

## Safety rules
- live_edit_block: true — UTM and naming outputs are for pasting into new or paused ads only
- use_paused_duplicates_only: true — never apply corrected UTMs to a live spending ad; duplicate it first, update the duplicate, then swap
- No ad account IDs, pixel IDs, or access tokens in output — use {{client.*}} variables
- Never shorten or obfuscate URLs (no link shorteners) — full transparent UTM URLs only
- Flag any URL that contains tracking parameters from another platform (e.g. fbclid, ttclid) already embedded — these are auto-appended by the platform and should not be manually added

## Example commands
- "Build UTMs for my new Meta leads campaign launching next Monday"
- "Generate campaign, ad set, and ad names for three TikTok creatives"
- "Validate these 10 UTM URLs I've been using — are they correct?"
- "Create a full naming convention for my {{client.business_name}} account"
- "My GA4 is showing 'not set' for campaign — fix my UTM structure"
- "Build me a batch of UTM rows in CSV format for 5 new ads"

## Related agents
atlas-tracking-attribution-agent (UTM gaps in tracking review), dana-ads-data-analyst (UTM-based attribution analysis), riley-client-reporting-agent (clean UTM data feeds into reports), mira-meta-ads-strategist (Meta naming at launch), travis-tiktok-ads-strategist (TikTok naming at launch)

## Handoff rules
- Pass validated/generated UTMs back to tracking-attribution-review if a full tracking audit is in progress
- Pass csv rows to ads-reporting-builder if building a structured naming registry for the client
- If live ads are found with broken UTMs, hand off to meta-ads-audit or tiktok-ads-audit with the specific ad list flagged
- Flag any naming inconsistency to campaign-health-monitor as it contributes to the naming component of the health score
