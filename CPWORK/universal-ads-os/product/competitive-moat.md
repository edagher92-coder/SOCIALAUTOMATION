# Competitive Moat — AdPilot OS
What makes this hard to copy and worth paying for. Use this to position against
"another ad dashboard," another agency, or a generic GPT prompt pack. Numbers-first,
no hype — every claim below maps to a file in this repo you can demonstrate live.

---

## The one-line wedge
> "An ads optimiser that **physically cannot wreck your live account** — and can
> **prove its own numbers are right** in one command."

Most tools are dashboards (they show data) or autopilots (they change your account
and you hope). AdPilot OS is the third thing: a **safe-by-construction advisor +
executable engine** that proposes, never executes, and verifies itself.

## The five differentiators (each is demonstrable)
1. **Safe by construction, not by policy.**
   `tools/adpilot/decisions.py` has **no code path** that edits a live ad and **no
   delete function** anywhere. Every verdict returns `safe: True` as a *proposal*.
   Competing autopilots can silently raise budgets or pause winners; this one
   cannot. Demo: show the source + the refusal cases in `qa/prompt-tests.md §B`.

2. **Self-verifying maths.**
   `python3 -m adpilot selftest` runs the documented QA cases
   (`qa/metric-calculation-tests.md`) against the live engine and fails the build
   if any formula drifts. A buyer or agency can **prove correctness in one command**
   — almost no prompt-pack or spreadsheet product can do that.

3. **Cross-platform, break-even-led decisioning.**
   One universal schema for Meta **and** TikTok (`api/data-schema.md`), with verdicts
   driven by **break-even CPA / ROAS and MER** — not vanity metrics. Tells you the
   difference between *cheap leads* and *good leads* (the lead-quality loop).

4. **Zero-dependency, zero-secret, resale-safe.**
   The engine and API toolkits use only the Python standard library — nothing to
   install, nothing to leak. No keys/IDs in the product; everything is `{{client.*}}`
   + env. Ships clean for white-label resale (`qa/release-checklist.md`).

5. **A real operating system, not a prompt.**
   12 router-led agents + 25 discoverable skills + templates + dashboards +
   automations + API plans + QA, all config-driven so **one package runs many
   businesses** and white-labels per agency.

## Why a competitor can't just copy it in a weekend
- The **safety model is woven through every layer** (agents, skills, engine, configs,
  automations) and backed by **adversarial tests** — copying the prompts doesn't copy
  the guarantees.
- The **executable + self-verifying** core means quality is enforced, not claimed.
  Reproducing that requires building and testing a real engine, not writing copy.
- The **business-context pack system** lets it speak correctly per niche while the
  core stays universal — that separation is design work, not a template.

## Honest limits (say these out loud — it builds trust)
- It **advises**; humans approve and execute. That's the point, not a gap.
- V1 is no-code (CSV in); live API ingestion is V3.
- Benchmarks are starting points — tune thresholds per niche in `config/`.
- The licence draft and any earnings language must be lawyer-reviewed before resale.
