# SOP-04 — Produce a Client Report
**Goal:** a plain-English report an owner understands in 2 minutes. **Time:** ~15 min.
**Agent:** riley (pulls dana's analysis).

## Steps
1. Pick the cadence from `{{client.reporting_frequency}}` (daily/weekly/monthly).
2. Use the matching template: `templates/weekly-client-report-template.md` or
   `monthly-client-report-template.md`.
3. Run `client-report-generator`; it fills spend/leads/CPL/CPA/ROAS/MER, break-even
   check, wins, problems, and **recommendations as proposals**.
4. Sense-check against the samples in `reports/` (same structure, numbers-first).
5. Apply white-label header if agency (`product/white-label-agency-offer.md`).
6. Export (Sheets→PDF or paste into email) and send.

## Done when
Report leads with the result (profitable? what changed?), every claim cites a metric,
and recommendations are proposals — not "done" actions.
## Next
Schedule it (`automations/weekly-reporting-workflow.md`) for V2.
## Safety
Reporting only. Never implies a live change was made.
