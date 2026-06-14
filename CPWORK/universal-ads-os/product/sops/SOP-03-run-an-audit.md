# SOP-03 — Run an Account Audit + Health Score
**Goal:** a structured audit, a 0–100 health score, and prioritised, SAFE
recommendations. **Time:** ~20 min. **Agents:** mira/travis → dana → paige.

## Steps
1. Run `meta-ads-audit` and/or `tiktok-ads-audit` using the templates in `templates/`.
2. Run `paid-ads-data-analysis` → keep/kill/duplicate/scale/reduce/refresh/fix-tracking
   per ad. (Engine equivalent: `python3 -m adpilot analyze …`.)
3. Run `campaign-health-monitor` → the 0–100 score block:
   ```
   Campaign Health Score: __/100 · Status: Green/Yellow/Orange/Red
   Main issue · Recommended action · Next test · Risk
   ```
4. Apply the decision rules: high spend + no conversions → **fix tracking first**;
   low CTR → hook/creative; fatigue (freq ≥4 + CTR drop ≥25%) → refresh; winner →
   duplicate 3–5 variants; **don't scale on unclear tracking or health <70**.
5. Run `ads-policy-risk-checker` (paige) on any new copy before proposing it.

## Done when
You have a health score + a ranked list of proposals (paused duplicates / drafts only).
## Next
SOP-04 (report) and/or SOP-05 (ship a test). 
## Safety
Everything is a **proposal**. No live-ad edits. Budget changes need a typed YES.
