#!/usr/bin/env bash
#
# install-model-router.sh — seed the quality-first model/effort router into the
# user-global Claude config (~/.claude) so EVERY session in this environment
# (all repos, now and future) picks it up automatically.
#
# PATH C — Claude Code on the web:
#   Register this as your environment's SETUP STEP
#   (Claude Code → environment settings → setup script), e.g.:
#       bash .claude/setup/install-model-router.sh
#   It runs after the repo is cloned, on every session start. Idempotent.
#
# Local Claude Code (CLI/desktop): you can also just run it once by hand.
#
# Honest scope: the web container is ephemeral, so this re-seeds ~/.claude on
# each session rather than persisting once. Registering it as the setup step is
# what makes that automatic. It does NOT switch the running model — see the skill.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_SRC="$REPO_ROOT/.claude/skills/model-router/SKILL.md"
CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# 1) Install the skill globally (overwrite — keep it in sync with the repo copy).
mkdir -p "$CLAUDE_HOME/skills/model-router"
if [ -f "$SKILL_SRC" ]; then
  cp "$SKILL_SRC" "$CLAUDE_HOME/skills/model-router/SKILL.md"
  echo "model-router: skill installed at $CLAUDE_HOME/skills/model-router/SKILL.md"
else
  echo "warn: $SKILL_SRC not found — skill not copied" >&2
fi

# 2) Append the policy to global memory ONCE (idempotent by marker line).
MARKER="## Model & effort routing (auto-applied; quality-first)"
touch "$CLAUDE_HOME/CLAUDE.md"
if ! grep -qF "$MARKER" "$CLAUDE_HOME/CLAUDE.md"; then
  cat >> "$CLAUDE_HOME/CLAUDE.md" <<'POLICY_EOF'

## Model & effort routing (auto-applied; quality-first)
> Goal: best possible output, always. Subject to that — and only when it provably doesn't change the
> result — minimise latency and weekly-limit (token) cost. Never trade quality for speed or cost.
> Full algorithm + examples: the `model-router` skill.

The main-loop model is harness-set (/model); a doc can't silently switch it. Three levers:
(1) a one-line routing tag when a /model change is worth it; (2) subagent model overrides — fully
automatic: set model: haiku|sonnet|opus|fable per delegated task; (3) effort (low→max) + opt-in /fast.

Score each task on: complexity · blast-radius/reversibility · ambiguity · breadth/fan-out · output type ·
latency need · prior-attempt failures · cost-of-error. Then:
- Stakes gate first (overrides cost): irreversible / prod-write / security / money / legal / "ship it"
  → Opus 4.8, effort >= high, and verify. Never downshift these.
- Trivial + clear + cheap-to-verify (mechanical edits, lookups, search, classification, formatting)
  → Haiku 4.5 or Sonnet-low. Fast + cheap, no quality loss.
- Everyday, well-specified work (most coding, edits, reviews, Q&A, prose) → Sonnet 4.6, medium effort.
- Hard / ambiguous-important / long-horizon / gnarly debugging / architecture / design → Opus 4.8, high–xhigh.
- Fable 5 only on explicit request or frontier reasoning Opus can't carry (premium).

Rules: default up when unsure; escalate one tier (or raise effort) on any prior-attempt failure — never
silently retry the same losing config; fan-out → parallel subagents, each at the tier its subtask needs;
verify hard outputs (tsc/tests/re-read) regardless of tier; produce high, then downshift once proven safe.
Latency: light + waiting → Sonnet/Haiku + lower effort; hard + waiting → accept Opus or suggest /fast
(same Opus 4.8, ~2.5× faster, premium cost); async → optimise cost over speed; keep stable context cached.
POLICY_EOF
  echo "model-router: policy appended to $CLAUDE_HOME/CLAUDE.md"
else
  echo "model-router: policy already present in $CLAUDE_HOME/CLAUDE.md (skipped)"
fi

echo "✅ model-router seeded into $CLAUDE_HOME (skill + policy)"
