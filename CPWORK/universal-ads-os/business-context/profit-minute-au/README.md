# Profit Minute AU — Business Context Pack

**Pack slug:** `profit-minute-au`
**Brand type:** Content brand — finance / business education
**Currency:** AUD | **Market:** Australia
**Language:** Australian English

---

## What This Pack Is

Editorial and advertising knowledge for the Profit Minute AU brand. Kept here, separate
from the universal AdPilot OS core, so the sellable product ships clean. All account IDs,
pixel IDs, and tokens are placeholders — real values are injected at runtime from the
secrets manager.

---

## Brand Identity

Profit Minute AU is a numbers-first, anti-hype Australian finance and business content
brand. It exists to show people the actual maths behind business and money decisions —
in plain language, without the guru nonsense.

The brand earns trust by being specific, showing its working, and never promising what
it cannot prove.

---

## Voice Rules — Non-Negotiable

These rules apply to every piece of content, ad creative, caption, headline, and CTA
produced under this brand.

### Lead with the number

Every piece of content opens with a specific number, dollar figure, percentage, or
real data point. Never open with a vague claim or a question designed to tease.

| Do | Don't |
|---|---|
| "A 1% cut in COGS on $500k revenue = $5,000 straight to net profit." | "Want to make more money in your business?" |
| "GST on a $110 sale: you keep $100, the ATO keeps $10." | "Here's a little-known trick to save on tax." |
| "The average Australian SME spends 14% of revenue on labour. Is yours above or below?" | "Most business owners are leaving money on the table." |

### Banned words and phrases

Never use these in any content or ad creative:

- secret / secrets
- guru / gurus
- get rich / get rich quick
- guaranteed returns / guaranteed results
- passive income (unless immediately qualified with real numbers and caveats)
- financial freedom (as a standalone promise)
- wealth / wealthy (as a hook without a specific number attached)
- "most people don't know..." (vague authority claim)

### Show the maths

Every claim must be supported by a worked example or a cited assumption. If the number
cannot be shown in the post/ad itself, the landing page or link must show it.

Format: state the assumption, run the calculation, show the result.
Example: "Assume: $800k revenue, 30% gross margin → $240k gross profit.
Fixed costs $180k → $60k operating profit. That's 7.5% operating margin. Industry
median for Aus retail is ~5%. Are you above or below?"

### Australian context — always

- Use AUD, never USD unless explicitly comparing.
- Reference Australian frameworks: GST (not VAT), ATO (not IRS), ACCC and Australian
  Consumer Law (not FTC), superannuation (not 401k), PAYG (not withholding).
- Regulatory references must be accurate. When in doubt, describe the concept and direct
  people to a registered professional.

### Plain talk

No corporate jargon. No finance-speak acronyms without immediate plain-English
definitions alongside them. Write for a business owner who is smart but not a CPA.

---

## Compliance Rules — Mandatory

Profit Minute AU produces financial and business education content. It is NOT a
financial advice service and must never present itself as one.

**Every ad, post, and piece of content must comply with the following:**

1. **No personal financial advice.** Content explains concepts and shows calculations.
   It does not tell an individual what to do with their money. Use "this is how it
   works" framing, not "you should do this".

2. **No returns promises.** Never guarantee, imply, or strongly suggest that a viewer
   will achieve a specific financial outcome.

3. **Cite assumptions explicitly.** Any calculation that uses assumed figures must
   state those assumptions. "Assuming X, the maths looks like this…"

4. **Disclaimer placement.** Any content that could reasonably be read as financial
   advice must carry a plain-language disclaimer. Minimum standard:
   "This is general information only, not personal financial advice. Speak to a
   registered financial adviser or accountant for advice specific to your situation."

5. **ACCC / Australian Consumer Law.** Do not make misleading representations about
   financial products, services, or savings. If a claim cannot be substantiated,
   do not make it.

6. **Meta ad policy.** Finance and investment content on Meta is a restricted category.
   Ad creative must not make specific earnings claims or imply guaranteed results.
   Follow Meta's current financial products and services ad policy at all times.

---

## How the Voice Applies to Meta + TikTok Ad Creative

### Hook — lead with a number, not a tease

The first frame / first line must contain a specific number that is relevant to the
audience's business or money situation.

- TikTok: spoken number on screen within 2 seconds. Caption reinforces it.
- Meta (feed / reels): number in the first line of copy or overlaid on the first frame.

**Tested hook patterns:**

| Pattern | Example |
|---|---|
| "The number most [audience] don't track" | "The number most cafe owners don't track: labour as a % of revenue." |
| Specific dollar / percentage reveal | "$327. That's what the average SME pays per month in avoidable bank fees." |
| Before/after with real numbers | "Revenue: $620k. Net profit: $18k. Here's where the margin went." |
| Benchmark challenge | "GST-inclusive pricing adding 10% to your quotes? Here's the maths on what it's costing you." |

### Proof via worked example

After the hook, the body of the creative shows the calculation or the comparison.
This is the brand's unique value — competitors tease; Profit Minute shows the working.

Keep it tight: one concept, one calculation, one takeaway per ad unit.

### Compliant CTA

CTAs must direct to content, tools, or opt-ins — not to a financial product or
investment offer.

**Acceptable CTA patterns:**
- "Get the free margin calculator — link in bio."
- "Watch the full breakdown — 4 minutes."
- "Download the P&L explainer — free."
- "Join [X] business owners getting the weekly number."

**Never use:**
- "Start making more money today."
- "Guaranteed to increase your profit."
- "Sign up and earn more."

---

## Content Formats

| Format | Description | Typical length | Platform fit |
|---|---|---|---|
| "The maths on X" | Takes a real business scenario, runs the numbers, shows the result | 30–60 s video or 3–5 slide carousel | TikTok, Meta Reels, Instagram carousel |
| Myth vs. number | Takes a common belief, tests it with actual data | 30–45 s video | TikTok, Meta Reels |
| "One number this week" | Single metric, what it means, how to improve it | 15–30 s video or single-image post | All platforms |
| Deep-dive explainer | A concept explained fully with examples (GST, margin vs. markup, COGS) | 60–90 s video or long-form carousel | YouTube Shorts, Meta, Instagram |
| Benchmark post | Industry average stat + "how do you compare?" framing | Short-form video or image | All platforms |

---

## What This Brand Is NOT

- Not a trading, investing, or stock-picking brand.
- Not a coaching or mentoring offer (do not position content as a pathway to a course
  or programme without explicit approval per campaign).
- Not a get-rich story. Real numbers, real caveats, real context.

---

## Example client-config.yaml (Profit Minute AU — placeholders only)

```yaml
client:
  name: "Profit Minute AU"
  slug: "profit-minute-au"
  currency: "AUD"
  country: "AU"
  timezone: "Australia/Sydney"
  language: "en-AU"

  # IDs injected at runtime from secrets manager. Never hardcode.
  meta_account_id: "{{client.meta_account_id}}"
  meta_pixel_id: "{{client.meta_pixel_id}}"
  meta_app_id: "{{client.meta_app_id}}"
  tiktok_account_id: "{{client.tiktok_account_id}}"
  tiktok_pixel_id: "{{client.tiktok_pixel_id}}"

  contact:
    business_email: "{{client.business_email}}"   # e.g. hello@profitminute.com.au

business_model:
  brand_type: "content_brand"
  monetisation:
    - organic_audience_growth
    - lead_generation
    - newsletter_or_community_opt_in
  average_sale_value: null        # Content brand — no direct product sale; set per campaign
  gross_margin: null              # Set per monetisation lane when applicable

brand_voice:
  style: "numbers-first-anti-hype"
  language_rules:
    - "Open with a specific number, dollar figure, or percentage"
    - "Show the maths — state assumptions, run the calculation, show the result"
    - "Australian context: AUD, GST, ATO, ACCC, superannuation"
    - "Plain Australian English — no jargon without immediate plain-English definition"
    - "No hype words: secret, guru, get rich, guaranteed, passive income (unqualified)"
    - "No personal financial advice — general information only"
    - "Cite assumptions explicitly in every calculation"
  compliance:
    disclaimer_required: true
    disclaimer_text: "General information only, not personal financial advice. Speak to a registered adviser for advice specific to your situation."
    restricted_category_meta: "financial_products_and_services"

platform_focus:
  - meta
  - tiktok

content_formats:
  - slug: "maths-on-x"
    description: "Worked example — real scenario, real numbers, real result"
    length_seconds: "30–60"
  - slug: "myth-vs-number"
    description: "Common belief tested against actual data"
    length_seconds: "30–45"
  - slug: "one-number-this-week"
    description: "Single metric, what it means, how to improve it"
    length_seconds: "15–30"
  - slug: "deep-dive-explainer"
    description: "Concept explained fully with examples"
    length_seconds: "60–90"
  - slug: "benchmark-post"
    description: "Industry average stat with how-do-you-compare framing"
    length_seconds: "15–30"

ad_creative_rules:
  hook_must_contain: "specific number within first 2 seconds (video) or first line (copy)"
  body_must_contain: "worked example or cited calculation"
  cta_approved_patterns:
    - "Get the free [tool] — link in bio"
    - "Watch the full breakdown"
    - "Download the [resource] — free"
    - "Join [X] business owners getting the weekly number"
  cta_banned_patterns:
    - "Start making more money today"
    - "Guaranteed to increase your profit"
    - "Sign up and earn more"
```

---

## What to Anonymise Before Resale

Before delivering AdPilot OS to any client other than Profit Minute AU, ensure this
entire `profit-minute-au/` folder is **removed** from the build. Do not ship:

- Brand name, editorial voice, or any identifying content patterns.
- Compliance rules written specifically for this brand's content category.
- Any content hooks, formats, or CTA patterns created for this brand.
- Any values that could be reverse-engineered to identify the client or their
  content strategy.

The `universal/` folder and its Example Co reference data is the only business context
that ships with a clean resale build.
