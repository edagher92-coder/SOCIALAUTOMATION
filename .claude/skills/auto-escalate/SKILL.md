---
name: auto-escalate
description: |
  [EFFICIENCY] Seamless two-dial escalation — model (haiku→sonnet→opus→fable)
  AND reasoning effort (low→medium→high→xhigh→max) — matched per sub-problem,
  quality-first: when torn between rungs on quality-relevant work, round UP.
  Main session stays on Sonnet; drop-back is automatic. Apply silently on
  every task; also use when the user says "escalate this", "use opus for
  this", "think harder", "ultimate effort", or "double escalate".
---

# Auto-escalation — two dials, quality-first

The main session stays on **Sonnet** (the orchestrator). Escalation happens
per *sub-problem* by spawning a subagent via the **Agent tool**, which takes
BOTH dials: `model: "haiku"|"opus"|"fable"` and
`effort: "low"|"medium"|"high"|"xhigh"|"max"`. The subagent returns, the
session continues on Sonnet — drop-back needs no action. (Only the user can
change the main model, via `/model`.)

## The bias (read first)

**Quality-first, tightly-scoped.** When torn between two rungs on work whose
quality matters, take the HIGHER rung. Efficiency comes from scoping the
escalation to the exact sub-problem with a self-contained prompt — never from
underpowering the brain. One wrong answer costs more than one Opus call.

## Dial 1 — reasoning effort (low → medium → high → xhigh → max)

| Effort | Use for |
|---|---|
| low | mechanical: bulk transforms, file inventories, copies, reformatting |
| medium | routine judgement: template-driven content, simple edits, summaries |
| high | the working default (matches `effortLevel: high` in settings) |
| xhigh | hard sub-problems: tricky debugging, careful analysis, edge-case sweeps |
| max ("ultimate") | the hardest verification/judgement passes; adversarial review |

**Escalate effort before model when the problem is deep-but-narrow** (one
gnarly bug, one contract to reason through): `sonnet + xhigh` is often
cheaper than `opus + high` and just as good on a well-scoped prompt.

## Dial 2 — model (haiku → sonnet → opus → fable)

**Escalate model when the problem needs breadth of capability**, not just
depth. Go to an `opus` subagent when ANY of:
- Root-cause debugging where the cause isn't apparent after the first look.
- Architecture / design spanning several systems or ~5+ files, or a public
  interface change.
- Safety- or compliance-critical output: pricing-engine logic, EOFY/tax
  phrasing, legal copy, anything the no-fabrication tests guard.
- High-stakes numbers: board/financial analysis, pricing/budget decisions.
- **One failed attempt or visible uncertainty** on the current rung.
- Security-sensitive review.

Go straight to **`fable` (with `max` effort)** when the task is clearly
frontier — novel algorithm, deep multi-constraint planning, or quality so
critical that a second-best answer is a real cost. Otherwise reach fable by
laddering: Opus attempt fails verification / self-contradicts / reports low
confidence. Budget: one fable attempt per sub-problem, then surface to the
user.

De-escalate to `haiku` (+ `low`/`medium` effort) for search, fan-out, and
mechanical volume.

## When NOT to escalate anything

Template-driven content, routine edits, quotes via the deterministic reply
engine, ops/scheduling, doc updates — and **never escalate what a test can
settle**: run the test.

## Mechanics

1. Scope to the *sub-problem*; write a self-contained prompt (subagents start
   with zero context).
2. `Agent(prompt, model: "...", effort: "...")` → integrate → continue.
3. Verify cheaply before accepting (tests, invariants); failed verification
   is the trigger for the next rung.
4. Transparency: one line in the final reply, e.g.
   `escalated: opus/xhigh (root-cause debugging)`.

## Cheat-sheet

| Rung | Typical pairing | For |
|---|---|---|
| low | haiku + low/medium | mechanical fan-out |
| medium | sonnet + medium | routine judgement |
| high | sonnet + high | default working tier |
| extra high | sonnet + xhigh, or opus + high/xhigh | hard sub-problems |
| ultimate | fable + max (or opus + max) | frontier work, critical verification |
