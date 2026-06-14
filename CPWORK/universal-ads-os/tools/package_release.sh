#!/usr/bin/env bash
# =============================================================================
# AdPilot OS — resale packager.
# Produces a clean, resale-safe ZIP of the universal core:
#   1. copies the package to a build dir
#   2. STRIPS private context packs + private context skills
#   3. SCANS for secrets / real account IDs (FAILS the build if any found)
#   4. runs the engine SELF-TEST (FAILS the build if not all pass)
#   5. zips it
#
# Usage:   bash tools/package_release.sh [VERSION] [OUTDIR]
# Example: bash tools/package_release.sh 1.1.0 /tmp/adpilot-dist
#
# This is the automated half of qa/release-checklist.md (phases 1, 2, 3, 6).
# It never ships your raw working copy. Run it before every resale/white-label build.
# =============================================================================
set -euo pipefail

VERSION="${1:-dev}"
OUTDIR="${2:-./dist}"
PKG_ROOT="$(cd "$(dirname "$0")/.." && pwd)"     # universal-ads-os/
BUILD="$(mktemp -d)/adpilot-os-${VERSION}"
FAIL=0

echo "AdPilot OS packager — version ${VERSION}"
echo "Source: ${PKG_ROOT}"
echo "============================================================"

# 1. Copy package (exclude VCS noise + any local secrets/dist).
mkdir -p "${BUILD}"
( cd "${PKG_ROOT}" && tar --exclude='.git' --exclude='dist' --exclude='__pycache__' \
    --exclude='*.pyc' --exclude='secrets' --exclude='*.token' --exclude='*token*.txt' \
    -cf - . ) | ( cd "${BUILD}" && tar -xf - )

# 2. Strip private context packs + private context skills (resale ships universal only).
echo "Stripping private context (snowflow, profit-minute-au)..."
rm -rf "${BUILD}/business-context/snowflow" \
       "${BUILD}/business-context/profit-minute-au" \
       "${BUILD}/skills/snowflow-business-context" \
       "${BUILD}/skills/profit-minute-au-context"

# 3. Secret / real-ID scan — block release on any real hit.
echo "Scanning for secrets and real identifiers..."
# Real values that must NEVER ship. (sk-ant references in SECURITY/qa are scan
# patterns/descriptions, so we look for an ACTUAL key body, not the prefix alone.)
PATTERNS='sk-ant-api03-[A-Za-z0-9_-]{20}|act_179081790|614890192017160|61590489518373|edagher92@gmail\.com|zcre-zfxp|AKIA[0-9A-Z]{16}|sk_live_[0-9A-Za-z]{20}'
if grep -rIEn --exclude=package_release.sh "${PATTERNS}" "${BUILD}" >/tmp/adpilot_secret_hits 2>/dev/null; then
  echo "  ❌ SECRET/REAL-ID FOUND — build blocked:"; cat /tmp/adpilot_secret_hits; FAIL=1
else
  echo "  ✅ no secrets or real identifiers found"
fi
# Generic long token assignments (exclude env/placeholder/anti-example lines).
if grep -rIEn --exclude=package_release.sh '(token|secret|api[_-]?key|password)[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9_-]{24,}' \
     "${BUILD}" 2>/dev/null | grep -viE 'os\.environ|getenv|\{\{|<|example|YOUR_|XXXX|placeholder|env\.|never|WRONG|do not' >/tmp/adpilot_tok_hits; then
  echo "  ❌ possible hardcoded token assignment — review:"; cat /tmp/adpilot_tok_hits; FAIL=1
else
  echo "  ✅ no hardcoded token assignments"
fi

# 4. Engine self-test must pass.
echo "Running engine self-test..."
if ( cd "${BUILD}/tools" && python3 -m adpilot selftest >/tmp/adpilot_selftest 2>&1 ); then
  echo "  ✅ $(grep -E 'checks passed' /tmp/adpilot_selftest || echo 'self-test passed')"
else
  echo "  ❌ self-test FAILED — build blocked:"; tail -5 /tmp/adpilot_selftest; FAIL=1
fi

# 5. Verify private packs are gone.
if [ -d "${BUILD}/business-context/snowflow" ] || [ -d "${BUILD}/skills/snowflow-business-context" ]; then
  echo "  ❌ private context still present — build blocked"; FAIL=1
else
  echo "  ✅ private context stripped (resale ships business-context/universal/ only)"
fi

echo "============================================================"
if [ "${FAIL}" -ne 0 ]; then
  echo "RESULT: BUILD BLOCKED ❌  — fix the issues above and re-run."
  rm -rf "${BUILD}"
  exit 1
fi

# Zip it.
mkdir -p "${OUTDIR}"
ZIP="${OUTDIR}/adpilot-os-${VERSION}.zip"
( cd "$(dirname "${BUILD}")" && zip -rq "${ZIP}" "$(basename "${BUILD}")" )
echo "RESULT: RESALE-SAFE BUILD ✅"
echo "Output: ${ZIP}"
echo "Skills in resale build: $(find "${BUILD}/skills" -name SKILL.md | wc -l) (universal core; 2 private packs removed)"
rm -rf "$(dirname "${BUILD}")"
