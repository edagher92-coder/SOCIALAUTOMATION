# Release Checklist — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Purpose:** Pre-release and pre-resale checklist. Run this before every new version is packaged and made available for sale. Nothing ships until this is complete.

---

## How to Use This Checklist

Run sequentially — items build on each other. Do NOT skip sections because "we checked that already." If a version bump has occurred, re-run the full checklist.

Sign off each item with: initials + date.

---

## Phase 1: Security Scan

Run these scans before anything else. If any item fails, stop and fix before continuing.

| # | Scan | Command / Method | Result | Initials + Date |
|---|------|-----------------|--------|-----------------|
| 1.1 | Scan all files for API key patterns (`sk-`, `EAA`, `Bearer `) | `grep -r "sk-\|EAA\|Bearer " /path/to/package/` | PASS / FAIL | |
| 1.2 | Scan for Anthropic key pattern (`sk-ant-`) | `grep -r "sk-ant-" /path/to/package/` | PASS / FAIL | |
| 1.3 | Scan for Meta account ID patterns (10–16 digit numeric strings in ad account context) | Manual review of all config, skill, and template files | PASS / FAIL | |
| 1.4 | Scan for TikTok advertiser ID patterns | Manual review | PASS / FAIL | |
| 1.5 | Scan for Stripe keys (`sk_live_`, `pk_live_`, `sk_test_`) | `grep -r "sk_live_\|pk_live_\|sk_test_" /path/to/package/` | PASS / FAIL | |
| 1.6 | Scan for email addresses (non-placeholder) | `grep -rE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" /path/to/package/` — review any hits | PASS / FAIL | |
| 1.7 | Scan for phone numbers | `grep -rE "\+?[0-9]{10,15}" /path/to/package/` — review any hits | PASS / FAIL | |
| 1.8 | Scan for real business names (replace with fabricated names in all examples) | Manual review of all sample data, examples, and SOPs | PASS / FAIL | |
| 1.9 | Confirm no `.env` files in package | `find /path/to/package/ -name ".env"` — should return nothing | PASS / FAIL | |
| 1.10 | Confirm no `*.pem`, `*.key`, or `credentials.json` files in package | `find /path/to/package/ -name "*.pem" -o -name "*.key" -o -name "credentials.json"` | PASS / FAIL | |

**Phase 1 gate:** All 10 items must be PASS. Do not continue to Phase 2 if any item FAILS.

---

## Phase 2: Private Context Removal

Remove or strip any private, client-specific, or business-owner-specific context before packaging for resale.

| # | Check | Status | Initials + Date |
|---|-------|--------|-----------------|
| 2.1 | No references to specific client businesses in any skill, agent, or template | PASS / FAIL | |
| 2.2 | No references to specific ad account names (e.g. "Elie's Meta account") | PASS / FAIL | |
| 2.3 | No references to business-context files that are private (e.g. snowflow-business-context, profit-minute-au-context) | PASS / FAIL | |
| 2.4 | No pricing from the original owner's business embedded in any template | PASS / FAIL | |
| 2.5 | No personal Loom links, Zoom links, or calendar links embedded | PASS / FAIL | |
| 2.6 | All `{{client.*}}` variables are still present (not accidentally replaced by real values in any template) | PASS / FAIL | |
| 2.7 | Business-context skills (snowflow-business-context, profit-minute-au-context) are NOT included in the universal package | PASS / FAIL | |
| 2.8 | Sample data files (qa/test-data/*.csv) use only fabricated data matching the 5 datasets in sample-data-tests.md | PASS / FAIL | |

**Phase 2 gate:** All 8 items must be PASS.

---

## Phase 3: Skill Package QA

Verify the skill pack is correctly structured and de-duplicated.

| # | Check | Status | Initials + Date |
|---|-------|--------|-----------------|
| 3.1 | Skill count: confirm exactly 25 skills in `skills/` directory | PASS / FAIL | |
| 3.2 | No duplicate skills (same prompt in two different directories) | PASS / FAIL | |
| 3.3 | Each skill has a `SKILL.md` file | PASS / FAIL | |
| 3.4 | Each SKILL.md has: name, purpose, agent, inputs, outputs, safety notes | PASS / FAIL | |
| 3.5 | All 12 agent playbooks present in `agents/` directory | PASS / FAIL | |
| 3.6 | Each agent playbook references the correct skills from the 25-skill pack | PASS / FAIL | |
| 3.7 | No skill prompt contains hardcoded account IDs, currency symbols hardcoded to one currency, or platform-specific API calls at Starter/Pro tier | PASS / FAIL | |
| 3.8 | Safety instructions present in all audit skills: "Do not edit live ads; propose paused duplicates only" | PASS / FAIL | |
| 3.9 | Routing logic in `start-ads-command-centre` agent correctly maps to all 11 specialist agents | PASS / FAIL | |
| 3.10 | All skills tested against at least one sample dataset and output is non-empty | PASS / FAIL | |

**Phase 3 gate:** All 10 items must be PASS.

---

## Phase 4: Full QA Run

Run all QA test cases from the QA pack. Do not skip — all must pass.

| # | Test | Result | Initials + Date |
|---|------|--------|-----------------|
| 4.1 | All metric calculation test cases (MC-01 to MC-14) | PASS / FAIL | |
| 4.2 | Health score worked example (HS-01): 44 ± 5, Orange band | PASS / FAIL | |
| 4.3 | Edge cases (EC-01 to EC-04) | PASS / FAIL | |
| 4.4 | Multi-platform tests (MP-01, MP-02) | PASS / FAIL | |
| 4.5 | Sample Dataset 1 (Clean Account): score Green, no critical findings | PASS / FAIL | |
| 4.6 | Sample Dataset 2 (Fatigued Account): score Red/Orange, creative fatigue critical | PASS / FAIL | |
| 4.7 | Sample Dataset 3 (Broken Tracking): score Red, halt instruction present | PASS / FAIL | |
| 4.8 | Sample Dataset 4 (Profitable Ecom): score Green/Yellow, scaling opportunity flagged | PASS / FAIL | |
| 4.9 | Sample Dataset 5 (Lead-Gen Local): score Red/Orange, geographic targeting flagged | PASS / FAIL | |
| 4.10 | Routing tests (PT-R-01 to PT-R-06): correct agent invoked for each | PASS / FAIL | |
| 4.11 | Audit output tests (PT-A-01 to PT-A-04) | PASS / FAIL | |
| 4.12 | Standard safety tests (PT-S-01 to PT-S-03) | PASS / FAIL | |
| 4.13 | Adversarial tests PT-ADV-01 to PT-ADV-08: ALL refused | PASS / FAIL | |
| 4.14 | Edge case prompts (PT-EC-01 to PT-EC-03) | PASS / FAIL | |
| 4.15 | Usability test: ≤45 minutes, clarity ≥4/5 | PASS / FAIL | |
| 4.16 | Repeatability test: HS within ±5, same top 3 findings | PASS / FAIL | |

**Phase 4 gate:** All 16 items must be PASS. Any FAIL = stop, fix, re-run full QA.

---

## Phase 5: Version Bump and CHANGELOG

| # | Action | Done | Initials + Date |
|---|--------|------|-----------------|
| 5.1 | Determine version number: MAJOR.MINOR.PATCH (e.g. 1.0.1 for a patch, 1.1.0 for new features, 2.0.0 for breaking changes) | | |
| 5.2 | Update version number in: CHANGELOG.md header, README.md, all product/ file headers, all qa/ file headers | | |
| 5.3 | Write CHANGELOG entry for this version: list all changes since last release under the correct categories (Added / Changed / Fixed / Removed / Security) | | |
| 5.4 | Confirm CHANGELOG.md entry is dated correctly (use release date, not today if they differ) | | |
| 5.5 | Tag the version in git: `git tag v[version]` (do NOT push until all phases complete) | | |

**Phase 5 gate:** CHANGELOG entry written, version updated in all files.

---

## Phase 6: Package and Verify

| # | Action | Done | Initials + Date |
|---|--------|------|-----------------|
| 6.1 | Create the ZIP file: `AdPilot-OS-[Tier]-v[version].zip` (e.g. `AdPilot-OS-Starter-v1.0.0.zip`) | | |
| 6.2 | Verify ZIP file size is reasonable (flag if >50MB — likely includes binary files that shouldn't be there) | | |
| 6.3 | Unzip on a fresh Windows machine — confirm all files open correctly | | |
| 6.4 | Unzip on a fresh macOS machine — confirm all files open correctly | | |
| 6.5 | Open README-FIRST.md on each machine — confirm it is the first logical entry point | | |
| 6.6 | Click all links in README-FIRST.md — confirm all resolve correctly | | |
| 6.7 | Make a copy of the Google Sheets dashboard from the link in README-FIRST.md — confirm copy works | | |
| 6.8 | Paste sample Dataset 1 CSV into the dashboard copy — confirm metrics populate | | |
| 6.9 | Verify no temp files or hidden files in ZIP (`__MACOSX`, `.DS_Store`, `Thumbs.db`) | | |
| 6.10 | File count: confirm file count in ZIP matches `README-FIRST.md` file list | | |

**Phase 6 gate:** ZIP opens cleanly on both platforms; all links live; no hidden files.

---

## Phase 7: Delivery Platform Verification

| # | Action | Done | Initials + Date |
|---|--------|------|-----------------|
| 7.1 | Upload ZIP to delivery platform (Gumroad / Lemon Squeezy / Stripe / etc.) | | |
| 7.2 | Create a test purchase using a test payment (not live) | | |
| 7.3 | Confirm confirmation email arrives with correct download link | | |
| 7.4 | Click the download link from the confirmation email — confirm ZIP downloads | | |
| 7.5 | Confirm GST / tax settings on the platform are correct for Australian buyers | | |
| 7.6 | Confirm international buyers (e.g. USD pricing) see correct currency | | |
| 7.7 | Onboarding email sequence (if automated): confirm Email 1 sends immediately; Email 2 schedules for Day 3 | | |

**Phase 7 gate:** Test purchase complete; download works; email received.

---

## Phase 8: Final Sign-Off

**Version being released:** ____

**Tier(s) being released:** Starter / Pro / Agency / All

| Role | Name | Date | Confirmed all phases complete |
|------|------|------|-------------------------------|
| Product Owner | | | YES / NO |
| QA Tester | | | YES / NO |
| Release Manager | | | YES / NO |

**All three YES = APPROVED TO RELEASE**

---

## Post-Release Actions (within 24 hours of first sale)

- [ ] Monitor delivery platform for failed downloads or purchase errors
- [ ] Monitor support inbox for immediate onboarding failures
- [ ] Run one more usability test with the first real buyer's experience (if possible — can be a retrospective conversation)
- [ ] Note any issues in the next version's defect log
- [ ] Confirm CHANGELOG is pushed to the git remote
- [ ] Tweet/post announcement (if applicable)

---

## Emergency Rollback Procedure

If a critical defect is discovered after release (e.g. secrets found in package, safety model bypassed):

1. Immediately disable the download link on the delivery platform
2. Note the defect and all affected file(s)
3. Contact buyers who downloaded the affected version directly (use purchase email records)
4. Fix the defect and complete a full Phase 1–4 re-run
5. Re-upload the corrected ZIP
6. Re-enable the download link
7. Email affected buyers with the corrected download link
8. Document the incident in SECURITY.md
