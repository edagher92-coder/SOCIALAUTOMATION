---
name: profit-minute-au-context
description: Loads the Profit Minute AU brand context — a numbers-first, AUD-first, anti-hype Australian finance and business content brand — so that all AdPilot OS content, ad copy, and reporting outputs match this specific voice and editorial standard. Use this skill at the start of any Profit Minute AU session, or whenever someone says "for Profit Minute", "switch to the finance content brand", "load the anti-hype context", or "we're doing Profit Minute content today". This is a context pack, not a universal skill.
---

## Purpose
Prime the AdPilot OS with the Profit Minute AU editorial voice and brand rules so that ad copy, content briefs, reporting commentary, and platform strategy reflect how this brand communicates. Prevents generic or hype-heavy outputs that would contradict this brand's positioning. Loads context only — does not modify campaigns or content directly.

## When to use
Load this skill at the start of every session involving Profit Minute AU content, ads, or strategy.

Example user phrases:
- "We're working on Profit Minute content today — load the context"
- "Switch to the finance content brand"
- "Load the anti-hype, numbers-first context"
- "Set up for Profit Minute AU"
- "I'm writing ads for the finance content brand — get the context"

## Inputs needed
- Confirmation that this session is for Profit Minute AU (required)
- Session goal: ad copy / content brief / paid-ads strategy / reporting / creative review (helps frame which context elements to foreground)
- Platform focus for this session: Meta / TikTok / both / organic content
- Topic or campaign focus if known (e.g. GST explainer, cash flow content, ACCC rights campaign)

## Workflow
1. Confirm the session is for Profit Minute AU before loading context.
2. Load brand identity:
   - Brand name: Profit Minute AU
   - Category: Australian finance and business content brand
   - Positioning: numbers-first, plain-talk, anti-hype, Australian context
   - Audience: Australian small business owners, self-employed, founders, and financially engaged consumers
3. Load editorial voice rules (apply to all outputs in this session):
   - Rule 1 — Lead with the number: every post, ad, or piece of copy opens with a specific figure, stat, or dollar amount. No scene-setting preamble.
   - Rule 2 — No hype words: banned words include "amazing", "incredible", "game-changer", "revolutionary", "mind-blowing", "skyrocket", "crush it", "killing it". Replace with specific numbers and outcomes.
   - Rule 3 — No guarantees: never promise financial returns, income levels, or business outcomes. Always qualify with "based on [source]" or "results vary".
   - Rule 4 — Plain talk: write at a Year 10 reading level. No jargon unless defined immediately after. No passive voice.
   - Rule 5 — Show the maths: when making a claim, show the calculation. Do not assert; demonstrate.
   - Rule 6 — Australian context: reference AUD, GST, ACCC consumer law, Australian Tax Office (ATO) terminology, Australian business structures (sole trader, Pty Ltd, trust). Do not use US examples unless explicitly contrasting.
   - Rule 7 — No "I got rich" content: do not produce case studies or testimonials that imply the audience will achieve the same financial result.
4. Load paid-ads creative rules:
   - Hook formula: [number or stat] + [what it means for the audience's money] — e.g. "The average Aussie SMB pays $4,700 more tax than they need to. Here's why."
   - CTA style: direct, specific, low-pressure — e.g. "Read the breakdown" not "Sign up now and change your life"
   - Social proof: reference data sources, not individual testimonials (e.g. "ABS data shows...", "ATO figures for 2024–25...")
   - Creative length: short-form (15–30 sec video or single image) for awareness; long-form (carousel or article) for consideration
5. Load compliance reminders:
   - ACCC: no misleading financial representations
   - ASIC: do not provide financial advice (describe and inform; do not recommend specific financial products or strategies as suitable for an individual)
   - Disclaimer language: "This is general information only, not financial advice. Speak to a qualified adviser for your situation."
   - ATO content: always reference the current financial year; flag when tax rates or thresholds may have changed
6. Confirm context is loaded; summarise active rules for this session; proceed with session goal.

## Outputs
- Context confirmation message with active voice rules listed
- Session framing note: editorial constraints for this session
- Compliance reminder active for this session (ACCC / ASIC / ATO context)
- Recommended skill or agent to hand off to based on session goal

## Safety rules
- Do not produce any content that could be construed as personal financial advice — general information only.
- No income or returns guarantees in any ad or content output; AU Consumer Law and ASIC apply.
- Always include disclaimer language when content touches on tax, investment, or financial decisions.
- Do not hardcode private data (account IDs, revenue figures, personal details) — use {{client.*}} variables.
- live_edit_block: true — context loading makes no changes to live assets.
- All standard Golden Safety Rules apply.

## Example commands
- "Load Profit Minute AU context — I need to write three Meta ad variants for a GST explainer"
- "Switch to the anti-hype finance brand — then brief a TikTok creative for cash flow content"
- "Profit Minute context on — audit the ad copy I wrote and flag any hype language"
- "Load the numbers-first context then draft a weekly performance report in brand voice"
- "Set up for Profit Minute then help me plan a paid campaign for the ATO deadline period"
- "Load the context and then review these three headlines for ACCC compliance"

## Related agents
- stella-social-creative-strategist (writes content and ad creative in the Profit Minute AU voice)
- mira-meta-ads-strategist (Meta paid-ads strategy aligned to this brand's positioning)
- travis-tiktok-ads-strategist (TikTok strategy for finance content in this voice)
- paige-ads-policy-safety-agent (ACCC / ASIC compliance checks on financial content)
- riley-client-reporting-agent (reporting for this brand — numbers-first format)

## Handoff rules
- Always load this context first in any Profit Minute AU session before calling other agents or skills.
- After context is confirmed, hand off to the relevant agent/skill with the session goal stated.
- Any content produced must pass through paige-ads-policy-safety-agent for ACCC/ASIC check before use in paid ads.
- Context is specific to this brand — do not carry Profit Minute AU context into sessions for other clients.
- This skill does not replace universal-business-onboarding for a new client — it is the pre-loaded version for an established brand context.
