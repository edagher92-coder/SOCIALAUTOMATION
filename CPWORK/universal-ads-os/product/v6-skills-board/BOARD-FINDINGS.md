# AdPilot OS — Skills, Tools & Loop/Memory Board Review (2026-06-17)

A three-track parallel evaluation of every skill, the AI-specialist layer, the newly-connected
tools/integrations, and the loop/memory workflow — with the safe wins executed and the bigger bets
queued. Read-only audits; nothing private surfaced (resale-clean).

---

## Track 1 — Skills & AI-team (efficiency, coverage, freshness)
**Verdict: lean live roster, well-built; the redundancy lives in the 25-doc markdown corpus, not the app.**
- **Coverage:** ~19 of 23 functional playbooks have a live persona home. Real gaps: **budget-pacing**
  (no owner; scheduled), dashboard-spec-builder, reporting-system-design (thin in Riley), onboarding
  (superseded by the connect/context-pack flow).
- **Agent↔knowledge mismatches:** Titan (offer/funnel) ran on `meta`+`seo` with **no CRO/funnel
  domain** — the biggest mismatch. `finance_content` was **orphaned** (read by no agent, omitted from
  the refresh cron → silent rot). Dana's unit-economics domain lives only in her prompt.
- **Token efficiency:** prefix already prompt-cached + light routes already on Haiku. Cheap wins:
  de-ground the router; gate single-platform accounts to one knowledge domain; (bigger) two cache
  breakpoints so the shared GUARDRAILS block caches globally.
- **Decision:** keep specialist calls on **Sonnet** (grounded quality is the product); only genuinely
  light/templated routes use Haiku. Do **not** merge personas.

## Track 2 — Integrations & tools (what each unlocks)
**Verdict: the connected tools map cleanly onto real product gaps; sequence Firefly → Zapier → Canva.**
- **Adobe Firefly (big bet):** turn Stella's "brief + search terms" into actual generated, **IP-indemnified**
  creative in the Studio (text-to-image + 1:1→9:16/16:9 expand). Needs owner Firefly keys; safest
  creative engine for an AU resale product. Produces draft assets only — human still approves.
- **Zapier (big bet):** make Milo *deliver* automations (digest→Slack, health-drop→email) and become the
  no-code bridge into the CRM/lead webhook. **Hard line: denylist all ad-management actions** — read-only/
  reporting only.
- **PDF reports (quick win, buildable now):** replace browser "print to PDF" with a branded, white-label-aware
  PDF — pure render of owned data, no OAuth.
- **Google Drive/Gmail (owner-gated):** deliver Riley's report as a shared Doc + branded email. Publishes
  client data externally → opt-in, link-restricted, white-label-aware, never a personal sender.
- **Canva (owner/Enterprise-gated):** brand-template autofill needs **Canva Enterprise** — slowest to land;
  Firefly is the buildable-now creative engine instead.
- **Stripe (revenue ops):** read subscription/invoice state for an in-app billing panel + dunning; confirm
  the missing AUD price IDs. Writes/refunds stay human-initiated only.
- **GitHub (internal, quick win):** the resale-clean grep + secret scanning as CI checks. **Done** (below).

## Track 3 — Loop & memory / dev-ops
**Verdict: the engineering loop is genuinely good; the gap was memory drift + un-automated hygiene.**
- **Memory drift (now fixed):** CLAUDE.md said v4 / "PR #22 open" while V6 had merged; test count ~130 vs
  **484**; migrations 0001…0016 vs **…0023**; Next 14 vs **16**.
- **Loop wins already banked:** prompt caching (~25–30% blended), Haiku routing on light routes (~60–75%
  cheaper there), right-sized `maxTokens`, bounded web-search loop.
- **Left:** token-count guard + cache-usage logging on the AI path; (done) CI typecheck step + guard.
  (npm ci + dependency caching is contingent on the owner choosing to commit a lockfile — it's
  currently gitignored, so CI keeps using `npm install`.)
- **Harness adoptions recommended:** a **SessionStart verify hook** (npm ci + typecheck + test), pre-PR
  `code-review`/`security-review` gate, `fewer-permission-prompts` allowlist, `deep-research` for the
  remaining owner-gated research.

---

## Executed this round (safe, verified: tsc + vitest + build, in CI)
1. **CLAUDE.md → V6 reality** (version/date, Next 16, engine upgrades, migrations …0023, merged status, current-state).
2. **Decision-log skim header** (orient in one screen) + **log-archive rule** at ~500 lines.
3. **CHANGELOG v6.0.0** entry; **package.json** 4.0.0 → 6.0.0 + description.
4. **CI hardening:** explicit **typecheck** step + a **resale-clean guard** (fails the build if private
   tokens reach the shippable tree). (npm ci + caching deferred — the lockfile is gitignored.)
5. **AI layer:** router persona de-grounded (`command: []`, token saving); orphaned **`finance_content`**
   wired to Paige + added to the refresh-knowledge cron (no longer rots); tests updated.

## Queued (recommended next; ⚑ = needs owner keys/decision)
- **Buildable now:** real **PDF reports**; **token-count guard + cache-usage logging**; a **CRO/funnel**
  knowledge domain for Titan + a **lead-gen close-rate** domain for Dana (content needs sourced research);
  set the refresh cron to **weekly**; SessionStart verify hook + pre-PR review gate.
- **Big bets ⚑:** Adobe **Firefly** creative in the Studio (Firefly keys); **Zapier** as Milo's engine +
  no-code CRM bridge (per-org connection); **Drive/Gmail** report delivery (OAuth, opt-in).
- **Owner-gated launch blockers:** Stripe price IDs · solicitor legal sign-off · non-expiring Meta token ·
  keep `ADS_WRITE_ENABLED` OFF · prod Vercel env + Supabase migrations 0001–0023.

> Invariant held across every recommendation: **read-only — AdPilot proposes, the human approves.**
> No tool here touches the live-write path; every creative/automation output is a draft a human approves,
> and anything that would publish client data externally is opt-in, scoped and white-label-aware.
