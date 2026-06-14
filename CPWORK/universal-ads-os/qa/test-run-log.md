# Test Run Log — AdPilot OS

Honest record of what has been **executed and verified** vs. what still needs a
human. Automated checks are reproducible by anyone with `python3` (no installs).
Update this file on every release (`release-checklist.md` Phase 4).

---

## Run: 2026-06-14 — v1.1.0 (automated)
Command: `cd tools && python3 -m adpilot selftest`

| Suite | Cases | Result |
|---|---|---|
| Metric calculations (MC-01…MC-14, MP-01) | 16 | ✅ PASS (match `metric-calculation-tests.md` to 2dp) |
| Edge cases (EC-01 zero-div, EC-02 ROAS anomaly, EC-04 floor) | 3 | ✅ PASS |
| Health score (weights=100, all-80=80.0 Green, N/A redistribution, bands) | 7 | ✅ PASS |
| Ingest + mapping (Meta export → schema + computed metrics) | 7 | ✅ PASS |
| Decision verdicts on fixtures (scale/keep/kill/fix-tracking/insufficient/quality) | 7 | ✅ PASS |
| Safety invariant (every verdict `safe: True`, no live-edit path) | 4 | ✅ PASS |
| **TOTAL** | **44** | **✅ 44/44 PASS, exit 0** |

Also verified this run:
- `python3 -m py_compile` on all engine + API toolkit files → clean.
- `api/webhook-schema.json` and `automations/blueprints/*.json` → valid JSON.
- All 5 `templates/*.csv` → column-consistent.
- Secret/real-ID scan over `CPWORK/` → clean (only documented references in `SECURITY.md`/checklists).
- `tools/package_release.sh 1.1.0` → RESALE-SAFE build, private packs stripped (25→23 skills), self-test passed inside the build.

## Independent verification (2026-06-14)
Three independent agent reviewers audited the build:
- **Functional QA:** VERDICT PASS, 0 defects.
- **Consistency:** 16 issues found → **all fixed** (hook_rate formula in 6 files + 2
  API docs; UTM source/medium in templates/product/reports/dashboards; naming-convention
  drift in 2 dashboards + 1 report; platform validation list). Re-scan clean.
- **Security/Resale:** no secrets, no real IDs in the product, safety model correct.

---

## Still OPEN — requires a human (do not fake)
These are honest gaps. They are owner/operator actions, not code:
- [ ] **Prompt/adversarial test sign-off** — `prompt-tests.md §B` cases run against a
      live Claude session and signed (the safety *invariants* are enforced in code and
      pass; the conversational behaviours need a human pass).
- [ ] **Non-technical usability test** — `client-usability-tests.md` with a real owner.
- [ ] **Solicitor review** of `product/licence-draft.md` before any sale.
- [ ] **Real testimonials** replacing `[PLACEHOLDER]` on the sales page.
- [ ] **Live support inbox** (`support@adpilot.com.au` is a placeholder).
- [ ] **Delivery platform + test purchase** (Gumroad/Lemon Squeezy/Stripe).
- [ ] **Live dashboard templates** built from the Sheets/Looker specs.

> Rule: never sign a checklist item that wasn't actually done. This log only marks
> ✅ what was genuinely executed.
