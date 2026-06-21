#!/usr/bin/env bash
#
# set-ci-secret.sh — propagate one secret to every repo on the authenticated
# GitHub account's Actions, in a single command.
#
# No secret value is stored in this file: it prompts for the value at runtime
# (silent read) and the account/owner is auto-detected via `gh`, so nothing
# private is ever committed.
#
# Usage:
#   ./scripts/set-ci-secret.sh                  # defaults to GEMINI_API_KEY
#   ./scripts/set-ci-secret.sh FIREFLY_CLIENT_ID
#   ./scripts/set-ci-secret.sh FIREFLY_CLIENT_SECRET
#
# Requires the GitHub CLI (https://cli.github.com), logged in via `gh auth login`.
#
# Note: this only covers GitHub Actions. For Claude Code web sessions across
# every repo, also add the same variable under
#   Settings -> Environment -> Environment variables
# and for the deployed app, add it to the Vercel project env.

set -euo pipefail

NAME="${1:-GEMINI_API_KEY}"

command -v gh >/dev/null 2>&1 || {
  echo "GitHub CLI (gh) not found — install it from https://cli.github.com then re-run." >&2
  exit 1
}
gh auth status >/dev/null 2>&1 || {
  echo "Not logged in to GitHub CLI — run 'gh auth login' first." >&2
  exit 1
}

read -rsp "Paste value for ${NAME}: " VALUE; echo
[ -n "${VALUE}" ] || { echo "No value entered — aborting." >&2; exit 1; }

OWNER="$(gh api user --jq .login)"
echo "Setting ${NAME} as an Actions secret on every repo owned by ${OWNER}…"

gh repo list "${OWNER}" --limit 200 --json name --jq '.[].name' | while read -r repo; do
  if gh secret set "${NAME}" -b"${VALUE}" -R "${OWNER}/${repo}" 2>/dev/null; then
    echo "  ✓ ${OWNER}/${repo}"
  else
    echo "  ✗ ${OWNER}/${repo} (skipped — no admin access or Actions disabled)"
  fi
done

# Avoid leaving the secret in the shell's environment.
unset VALUE
echo "Done."
