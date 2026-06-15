---
name: start-ads-command-centre
description: The entry-point skill for AdPilot OS. Routes any paid-ads request to the correct skill or specialist agent, blocks unsafe live-edit requests, and returns a structured task plan before any work begins. Use this skill first whenever a user says things like "let's work on my ads", "I want to launch a campaign", "help me with my Facebook ads", "audit my TikTok", "I need a report", or any other open-ended paid-ads request across Meta, Facebook, Instagram, or TikTok. Acts as the traffic controller for the entire system — identifies intent, confirms inputs, enforces safety rules, then hands off to the right skill or agent.
---

## Purpose
Serve as the single entry point for AdPilot OS. Understand the user's intent, classify it against the 13 available skills and 12 specialist agents, enforce the golden safety rules before any action is taken, and return a clear task plan that the user approves before execution begins.

## When to use
Use this skill at the start of every session or when a new, unclassified request arrives.

Example triggers:
- "Let's get started on my ads"
- "I want to launch a new Meta campaign"
- "Help me figure out why my cost per lead is so high"
- "Set up my TikTok ads"
- "I'm not sure what to do next with my ad account"

## Inputs needed
- {{client.business_name}} — who we're working on
- {{client.platform_focus}} — Meta, TikTok, or both
- A plain-English description of what the user wants to achieve or fix
- Optional: urgency, budget context, or existing account status

## Workflow
1. Greet and confirm client context: verify {{client.business_name}}, {{client.platform_focus}}, and {{client.monthly_budget}} are set. If missing, prompt before proceeding.
2. Classify intent against these categories: audit, data analysis, creative testing, offer/funnel review, tracking review, UTM/naming, reporting, health check, budget pacing, creative fatigue, lead quality, or campaign launch.
3. Map intent to the correct skill or agent using the routing table below.
4. Check the safety gate: if the request involves editing a live, active, spending ad — invoke live_edit_block. Explain the paused-duplicate approach and ask for explicit confirmation.
5. Identify all inputs required by the target skill and list any that are missing.
6. Return a written task plan: skill/agent to invoke, inputs confirmed, inputs missing, estimated steps, any safety flags raised.
7. Wait for user approval ("YES" or "go ahead") before invoking any downstream skill or agent that involves spend, launches, or creative changes.

**Routing table**
| Intent | Skill / Agent |
|---|---|
| Full account audit (Meta) | meta-ads-audit + mira-meta-ads-strategist |
| Full account audit (TikTok) | tiktok-ads-audit + travis-tiktok-ads-strategist |
| Analyse CSV / performance data | paid-ads-data-analysis + dana-ads-data-analyst |
| Design creative tests | creative-testing-lab + stella-social-creative-strategist |
| Review offer or landing page | offer-funnel-review + titan-offer-funnel-strategist |
| Check pixels / UTMs / attribution | tracking-attribution-review + atlas-tracking-attribution-agent |
| Build or validate UTMs and names | utm-naming-builder |
| Build report structure | ads-reporting-builder + riley-client-reporting-agent |
| Health score check | campaign-health-monitor |
| Budget pacing check | budget-pacing-monitor |
| Creative fatigue check | creative-fatigue-detector |
| Lead quality review | lead-quality-analyser |

## Outputs
- Confirmed client context block (business, platform, budget, currency)
- Classified intent label
- Routing decision: which skill + agent will handle it
- Missing inputs list
- Safety flags (if any)
- Written task plan in plain English, numbered steps
- Explicit request for user approval before execution

## Safety rules
- live_edit_block: true — never modify a live spending ad without paused-duplicate workflow
- use_paused_duplicates_only: true
- Money moves (budget increases, bid changes, campaign launches) require the user to type "YES"
- Never request or store ad account IDs, access tokens, or API keys — use {{client.*}} variables only
- Never delete — archive instead
- Do not scale on unclear tracking — route to tracking-attribution-review first

## Example commands
- "Start a new session for {{client.business_name}}"
- "I want to improve my Meta ROAS — where do I start?"
- "My TikTok CPL went up 40% this week, help"
- "Set me up to run a full audit on both platforms"
- "I have a new offer to test — what do I do first?"
- "Walk me through the AdPilot OS process from scratch"

## Related agents
mira-meta-ads-strategist, travis-tiktok-ads-strategist, dana-ads-data-analyst, stella-social-creative-strategist, titan-offer-funnel-strategist, atlas-tracking-attribution-agent, riley-client-reporting-agent, paige-ads-policy-safety-agent, quinn-qa-testing-agent

## Handoff rules
- Always hand off with a confirmed client context block and a list of inputs already gathered
- Pass the classified intent label to the receiving skill so it does not re-ask questions already answered
- If safety flags were raised, include them in the handoff so the receiving skill enforces the same rules
- Return to this skill if the user's next request falls outside the current skill's scope


## Gotchas (lessons from the v3 build — see ../GOTCHAS.md)
- Parallel agents: ~3–4 concurrency cap (more → rate-limit); **partition file ownership disjointly**; use read-only reviewers (Explore) for audits; no concurrent `npm build`/`dev`; the orchestrator commits + runs the consolidated build/smoke-check.
- Never accept secrets in chat; never assume access you haven't verified.
- The read-only-ad invariant is the trust moat — guard it; surface any ad-write as a decision.
