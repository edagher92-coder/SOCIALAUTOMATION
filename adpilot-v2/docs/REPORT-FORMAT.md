# Ads report — format & gold standard

> The shape AdPilot's scheduled reports (Reports page · weekly digest · the Riley reporting
> specialist) should follow. Distilled from real, in-production Meta daily/weekly reports
> (anonymised). Numbers below are **illustrative**, not a real account. Dated 2026-06-15.

## Why this format works
It leads with the decision, not the data dump: what changed → the one number that matters →
a per-engine table → a plain-English read → recommendations (with money decisions flagged to
the human) → a guardrail footer. A business owner can act on it in 30 seconds.

## Template

```
# Meta Ads — Report · <DATE> (<time> <TZ>)
*Data pulled live from the Graph API, act_XXXXXXXX. <note any scheduled-run gaps and what
this compares against>.*

## ⚠️ Action taken this run        ← only if an action fired; omit otherwise
**<Action> — <entity>** (<pre-approved toggle | typed-confirmed>). <one-line why, grounded in
the numbers>. **No budgets touched.**   ← state exactly what was/wasn't changed

## Today — per engine (to <time>)
| Engine | Status | Spend | Impr | Convos | Reply | Deep-3 | Cost/convo |
|---|---|---|---|---|---|---|---|
| <Engine A> | active | $… | … | … | … | … | $… ⭐ |
| …          | paused | …   | … | … | … | … | —      |

## 7-day scoreboard (targets: per the account's context pack — cost/convo + qualified-lead cost)
| Engine | Spend | Convos | Reply | Deep-3 | Leads | Cost/convo |
|---|---|---|---|---|---|---|
| <Engine A> | $… | … | … | … | … | $… ⭐ |

## Read
- <2–5 plain-English bullets: which engine is carrying the funnel, what's above the cost
  ceiling, what's improving, what's not converting after a fair test, anything not delivering.>

## Recommendations (your call on anything monetary)
1. <Specific, safe next step. Budget/scale moves are PROPOSED and flagged for the owner —
   never executed without explicit approval.>
2. …

*Guardrails: pause/activate may be pre-approved toggles; any budget/monetary change is flagged
to the owner first; no deletions. State geo/segment rules and the contact channel.*
```

## Field notes (CTWA / messaging accounts)
- **Optimise on conversations started**, not link CTR. Show cost/convo, reply rate, and depth-3+
  replies — they capture intent that pixel leads miss.
- Targets (cost/convo healthy band, watch-flag, qualified-lead reference) come from the account's
  business context pack — not a hard-coded universal number, since they vary by vertical and geo.
- **Don't judge a starved ad set on volume** — fund it, then test ≥3 days; persistent ~0 convos ⇒
  creative/offer problem, not budget.
- Mark the standout engine with ⭐ and name the "engine carrying the month."

## Safety
Reports are read-only analysis + **proposals**. The only changes that may execute are
pre-approved status toggles (pause/resume) or actions the owner explicitly typed-confirmed via
**Ad Actions** — every one captured for revert and audited. Budgets are never changed silently.
