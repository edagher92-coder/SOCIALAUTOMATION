#!/bin/bash
#
# SessionStart hook — Claude Code on the web.
#
# Makes the toolchain ready the moment a session starts, so `tsc` / `vitest` / `lint`
# can run immediately (no "deps not installed" stalls mid-task), and seeds the
# quality-first model-router into ~/.claude (Path C).
#
# Web-only, idempotent, non-interactive. Synchronous: dependencies are guaranteed
# installed before the session begins (no race). Container state is cached after the
# hook completes, so later sessions start fast.
set -uo pipefail

# Only run in the remote (Claude Code on the web) environment.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG="/tmp/adpilot-session-start.log"
: > "$LOG"

# 1) App dependencies. `npm install` (not `npm ci`) — package-lock.json is gitignored,
#    and install caches well into the container snapshot.
if [ -f "$ROOT/adpilot-v2/package.json" ]; then
  if ( cd "$ROOT/adpilot-v2" && npm install --no-audit --no-fund ) >> "$LOG" 2>&1; then
    echo "adpilot-v2 deps installed — tsc / vitest / lint ready"
  else
    echo "adpilot-v2 deps install FAILED — see $LOG" >&2
  fi
fi

# 2) Seed the model-router into ~/.claude (Path C; idempotent, best-effort).
if [ -x "$ROOT/.claude/setup/install-model-router.sh" ]; then
  if bash "$ROOT/.claude/setup/install-model-router.sh" >> "$LOG" 2>&1; then
    echo "model-router seeded into ~/.claude"
  fi
fi

exit 0
