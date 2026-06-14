# SOP-05 — Propose & Ship a Creative Test Safely
**Goal:** test a change **without touching the live ad**. This is the safety model in
practice. **Time:** ~15 min. **Agents:** stella → paige → (human executes).

## The rule
We **never** edit a live, spending ad. We create a **paused duplicate**, get sign-off,
and the human activates it. Budget/spend changes need a typed **YES**.

## Steps
1. From SOP-03, pick the hypothesis (e.g. "problem-aware hook beats solution hook").
2. `creative-testing-lab` designs the test: one variable, control vs variant,
   logged in `templates/creative-testing-matrix.csv`.
3. `stella` writes the new creative/copy; `paige` policy-checks it (no guarantees,
   no misleading/absolute claims, AU consumer law).
4. Name it per the standard: `{angle}_{format}_{version}`; set UTMs via `utm-naming-builder`.
5. Produce the **proposal**: "Create a PAUSED duplicate of <ad> with <change>. Original
   stays running, untouched. Activate after your YES."
6. The human creates the paused duplicate in Ads Manager (or via the API toolkit's
   pause/duplicate flow) and activates it. AdPilot OS never does this automatically.
7. Let it gather data to the decision floor (≥50 clicks or ≥15 conversions) before judging.

## Done when
A paused duplicate exists, the original is untouched, and the test is logged.
## Safety
`live_edit_block: true`, `use_paused_duplicates_only: true`, archive-not-delete,
typed-YES for money. No exceptions.
