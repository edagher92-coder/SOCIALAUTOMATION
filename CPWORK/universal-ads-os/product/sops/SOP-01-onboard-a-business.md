# SOP-01 — Onboard a New Business
**Goal:** a complete, correct `client-config.yaml` so every skill/agent behaves for
this business. **Time:** ~10 min. **Owner:** you (or `universal-business-onboarding`).

## Steps
1. Copy `config/client-config.yaml` to your working copy.
2. Open `config/config-guide.md` and fill each field. Don't skip
   `average_sale_value` and `gross_margin` — they set break-even CPA/ROAS.
3. Leave `meta_account_id` / `tiktok_account_id` **blank** unless this is a private copy.
4. Confirm safety switches are ON (`live_edit_block`, `use_paused_duplicates_only`, …).
5. (Optional) run the `universal-business-onboarding` skill to interview + auto-fill.
6. Sanity check: `break_even_cpa = average_sale_value × gross_margin`. Does it look right?

## Done when
- Config saved, no blanks in required fields, break-even values look sensible.
## Next
SOP-02 (import data). 
## Safety
No account access yet — this is configuration only.
