---
name: balanced
description: |
  [EFFICIENCY] Reset to balanced mode — medium effort, Sonnet subagents for
  implementation, Haiku for search. Use when the user says "balanced mode",
  "reset mode", "default mode", "normal mode", or types /balanced.
---

# Balanced Mode — Default Profile (Reset)

You are now in **balanced mode** (the project default). This resets any
previous `/quick` or `/deep` override.

## Response rules
- Match response length to task complexity — short for simple, detailed for complex
- Use thinking when the task genuinely needs it, skip for straightforward work
- Structure with headers only when content has 3+ distinct sections

## Three-tier subagent routing
When you need to spawn subagents (Agent tool), use these defaults:
- **Tier 3 — search, grep, lookups**: `model: "haiku"`, `effort: "low"`
- **Tier 2 — single-file edit, bug fix, repetitive/low-priority work**: `model: "sonnet"`, `effort: "high"`
- **Tier 1 — multi-file refactor, architecture, security, deep debug**: `model: "opus"`, `effort: "xhigh"`
- Main session always stays on Opus/high

## General approach
- Read before editing, but don't over-read
- Parallelize independent tool calls
- Run tests when you change code
- One-line summaries at end of turn

Confirm the switch by saying: **Balanced mode on. Medium effort, smart subagent routing.**
