# Model Routing Policy v4.0 — Quality First, Zero Waste

Updated: 2026-07-05

Principle: route every task to the lowest-cost Claude tier that should meet the required quality bar. Never let cost degrade quality. Never burn a premium tier on work a lower tier handles reliably. Manual model selection always wins.

## Current tiers

### 1. Haiku 4.5 — mechanical only

API ID: `claude-haiku-4-5-20251001`

Use for:
- Reformatting, renames, extraction, table cleanup, boilerplate, short transforms.
- High-volume low-latency sub-agent work.
- One-line answers and deterministic text operations.

Do not use for real reasoning, multi-step planning, customer-facing advice, architecture, financial/legal/compliance output, or large refactors.

### 2. Sonnet 5 — default workhorse

API ID: `claude-sonnet-5`

Use for:
- General coding, drafting, data analysis, tool use, agentic workflows, browser/terminal automation, and long-context work.
- Most Claude Code / cowork sessions.
- Production tasks where speed, price, and intelligence all matter.

Effort guidance:
- `high` is the default and best starting point for complex work.
- `medium` is the cost-saving default for routine agentic workflows after evals prove quality holds.
- `low` is for high-volume or latency-sensitive non-critical work.
- `xhigh` is for hard coding/agentic tasks; if the task stays quality-critical, escalate to Opus instead of repeatedly over-prompting.
- `max` is reserved for rare tasks that require absolute capability and have explicit budget approval.

### 3. Opus 4.8 — quality-critical / enterprise tier

API ID: `claude-opus-4-8`

Use for:
- Complex architecture, deep analysis, large refactors, enterprise or customer-facing output.
- Financially material, legally sensitive, compliance-sensitive, security-sensitive, or high-reputation work.
- Cases where Sonnet 5 at high effort is likely to underperform or has already failed.

Effort guidance:
- Start with `high` for most intelligence-sensitive work.
- Use `xhigh` for complex coding and agentic tasks that need extended exploration.
- Use `max` only when evals or business stakes justify the extra spend.

### 4. Fable 5 — frontier reserve

API ID: `claude-fable-5`

Use for:
- The hardest reasoning, novel system design, long-running agents, and failed Opus cases.
- Tasks where the value of a better answer materially exceeds the additional cost.

Never default to Fable. Route here only by explicit escalation, manual override, or an approved high-stakes policy.

### 5. Mythos 5 — manual-only approved access

API ID: `claude-mythos-5`

Use only for approved defensive cybersecurity workflows with appropriate account access and governance. Do not choose Mythos from automatic classification. The router must keep Mythos disabled unless `CLAUDE_ROUTER_ENABLE_MYTHOS=true` is explicitly set.

## Manual override

A manually selected tier through a picker, `/model`, `tier=`, or environment override wins and remains locked for the current call/session. No automatic re-routing should override a manual choice except for access/availability fallback from Fable/Mythos to a lower tier.

## Escalation rules

1. Start at Haiku only for mechanical tasks.
2. Start at Sonnet for normal production work.
3. Start at Opus for complex architecture, high-stakes analysis, customer-facing output, compliance, money-impacting work, or ambiguous quality-critical work.
4. Escalate one tier if output is too short, incomplete, tool-use fails, or confidence is low.
5. Escalate to Fable only for genuinely frontier tasks or after Opus fails.
6. Do not auto-route to Mythos.

## Effort rules

Supported effort values: `low`, `medium`, `high`, `xhigh`, `max`.

Default:
- Haiku: no effort setting.
- Sonnet 5: `high`.
- Opus 4.8: `high`.
- Fable 5: `high`.
- Mythos 5: `high`, only when manually enabled.

Use lower effort only after evals prove quality holds. Use `xhigh` or `max` only when the task needs deeper reasoning and the budget is acceptable.

## Output standard

Produce the exact depth the task requires. No filler. Be concise for mechanical work and thorough for high-stakes work. For code changes, prefer runnable patches, tests, migration notes, and clear rollback instructions.

## Operational notes

- Keep model IDs configurable with environment variables: `CLAUDE_ROUTER_HAIKU_MODEL`, `CLAUDE_ROUTER_SONNET_MODEL`, `CLAUDE_ROUTER_OPUS_MODEL`, `CLAUDE_ROUTER_FABLE_MODEL`, `CLAUDE_ROUTER_MYTHOS_MODEL`.
- Log every dispatch with timestamp, tier, model ID, effort, input tokens, output tokens, and status.
- Use the Models API periodically to confirm available models and token limits for the running account.
- Do not commit API keys, private transcripts, local paths, or session IDs into public repositories.
