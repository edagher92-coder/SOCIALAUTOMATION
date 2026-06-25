# Overnight build session — 2026-06-25

> Autonomous session against the V6 phase roadmap, on branch `claude/kind-volta-7jk71z` (PR #39).
> Everything below is **read-only / additive** — the core invariant holds: `ADS_WRITE_ENABLED` off,
> no live-ad edits, RLS on every new table, AU-English/AUD, resale-clean. Numbers below are
> **planning estimates, not quotes or guarantees.**

## TL;DR

Shipped five additive increments overnight, each verified (`tsc` + `vitest` + `next build` + lint +
resale-clean) and pushed. Test suite grew **484 → 713** passing. Nothing here can touch a live ad.
The remaining high-value work is either **owner-gated** (needs keys/decisions) or **parity-sensitive**
(touches the scored engine) — I recommend you review/merge PR #39 before that next layer.

## What shipped tonight (newest first)

| Commit | Phase | What |
|---|---|---|
| `ee2ea6f` | **P4.2 + P6.4** | Structured grounding (`buildStructuredGrounding` + "what changed" delta; back-compat string is now a superset) and the deterministic, ICE-ranked, propose-only "what to test next" recommender |
| `d893b3e` | **P5.2** | Configurable rules engine (`lib/rules`): pure evaluator with absolute + rolling-baseline (z-score / WoW) operators, the min-volume gate as the false-CRITICAL fix, AND-group collective anomalies, dry-run preview, 13 ALT presets, migration `0030_alert_rules` |
| `e2af428` | **P1.4** | AI usage + cost telemetry (`ai_usage`, migration `0029`): per-call token counts + estimated USD cost, best-effort, never blocks a request; non-breaking `onUsage` hook on `callClaude` |
| `7493ba8` | **P4.1** | AI eval harness (`lib/agents/evals`): Tier-1 deterministic safety guards + 8 adversarial + 3 safety fixtures (safe/unsafe pairs) + a gated Tier-2 Opus judge. Runs offline → a CI safety gate |
| earlier | **P1a/1b + P2** | Meta ingestion hardening, ingestion trust panel, purchase_roas reconciliation, change-point fatigue onset, account anomaly scan, TikTok parity, scheduled PDF delivery |

**Verification (final state):** `tsc --noEmit` clean · `vitest run` **713 passed (80 files)** ·
`next build` green · `npm run lint` 0 errors (1 pre-existing advisory) · resale-clean grep passes ·
Vercel preview deploys clean on every push.

## Decisions & assumptions I made autonomously

- **Sequenced P4.1 (the eval net) first**, per the roadmap rule "ship the eval net before the AI
  behaviour changes it must protect." It also hardens the read-only invariant — highest safety value.
- **Migrations are contiguous from the real tip** (`0029`, `0030`) — the roadmap's planned numbering
  was stale; I followed what's actually in `supabase/migrations`.
- **Pricing for the cost model** comes from current Anthropic rates (Opus 4.8 $5/$25, Sonnet 4.6
  $3/$15, Haiku 4.5 $1/$5 per MTok; cache read 0.1×, write 1.25×) — not from memory.
- **Did NOT touch the parity-tested engine** (`analyse`/`decide`/`health` weights). All new outputs
  are additive fields; the oracle-parity suite stays green.
- **Recommender returns `[]` without signal** rather than manufacturing test ideas, and **never
  proposes a test for a tracking problem** (that's a fix) — consistent with the anti-hype rule.

## Gap analysis vs the V6 roadmap

**Now built** (this branch): P1.4 telemetry · P3 diagnostics core (timeseries/stats/fatigue/
changepoint/anomaly) · P4.1 evals · P4.2 grounding · P5.2 rules engine · P6.4 recommender ·
scheduled-PDF delivery (email path).

**Remaining — buildable without keys, but parity-sensitive (do WITH review):**
- **P6.1** — activate the two dead health factors (`offer_strength`, `landing_page_alignment`) via a
  structured review intake. Touches `lib/engine/audit.ts` factor wiring (weights 5+4 are reserved;
  the factor must only override NEUTRAL when a review exists). Safe if done carefully — but it edits
  the scored engine, so I held it for owner review rather than changing scoring unattended overnight.
- **P4.4** — orchestrator (auto-route + chain + Paige-final-gate). Now unblocked by the P4.1 eval net.

**Remaining — owner-gated (need a key or a decision; not buildable autonomously):**
- Real **Drive/Gmail** report delivery (Google service account/OAuth) — scaffold is inert, awaiting creds.
- **Firefly** creative, **Zapier** as Milo's engine, **Canva** Enterprise — all need owner keys.
- **Stripe price IDs**, admitted-solicitor **legal sign-off**, non-expiring **Meta System User token**.
- **P6.5 vertical benchmarks** — needs *sourced* percentile data; shipping invented benchmarks would
  violate the anti-hype rule, so this needs a data decision, not just code.
- **Live-write / auto-execute** — board recommendation is it stays **OFF** for launch.

## Recommended next steps (owner)

1. **Review & merge PR #39** — it's now ~10 commits and large; merging banks the safe, verified work
   before the parity-sensitive P6.1 layer.
2. **Apply migrations 0027 → 0030** at deploy (in order), and set `META_GRAPH_API_VERSION=v23.0`
   (optional `TIKTOK_API_VERSION`, default v1.3).
3. Set `RESEND_API_KEY` for scheduled PDF email; keep Drive/Gmail owner-gated until creds exist.
4. Decide the owner-gated items (Stripe IDs, legal, Meta token) — these are the launch blockers, not code.

---

# Turnkey cost analysis — a system like AdPilot OS

> **Planning estimates only**, AUD, GST-exclusive. Not a quote. Actual costs depend on scope, team,
> region, traffic, and pricing changes. Stripe processing fees are pass-through (~1.7% + $0.30 per
> domestic AU card txn) and excluded below.

## 1) Build cost (to reach roughly this state)

This is a substantial product: Next.js 16 / React 19 / Supabase (RLS) / Stripe app, a deterministic
13-factor scoring engine with oracle-parity tests, live Meta/TikTok ingestion, a 12-persona AI layer
with an eval harness, reports/PDF, a rules engine, billing/entitlements, and ~80 test files / 700+
tests across ~0001–0030 migrations. Rough effort: **~5–7 months of one senior full-stack engineer**
(or ~3–4 months for two), plus design/QA.

| Path | Indicative AUD | Notes |
|---|---|---|
| AU dev **studio**, commissioned turnkey | **$180k – $400k** | Senior team, several months, design + QA + PM overhead |
| AU **senior contractor** solo (~$130–170/hr, ~900–1,200 hrs) | **$120k – $200k** | One experienced full-stack dev |
| **Offshore / blended** team | **$50k – $120k** | Lower rate, more coordination/QA risk |
| **AI-assisted solo founder** (the path actually taken) | **~tooling + founder time** | Cash cost ≈ AI/dev-tool subscriptions (~$20–200/mo) + the founder's hours; the founder carries product/QA ownership |

**Headline finding:** the same scope an AU studio would quote at **low-six-figures** was assembled
**AI-assisted** for a small fraction of that in cash — the dominant input becomes the founder's time
and judgement, not contractor invoices. The trade-off is that QA/architecture ownership sits with the
founder, which is exactly why the verify discipline (tsc + tests + build + the new eval net) matters.

## 2) Running cost (monthly, AUD)

**Fixed platform baseline (small scale):** Vercel ~$30 · Supabase Pro ~$40 · Resend ~$0–20 ·
Sentry/monitoring ~$0–26 · domain ~$2 → **~$70–120/mo**.

**Variable AI cost** — worked from the live token prices + the app's two efficiencies (prompt-cached
system prefix at 0.1×, light routes on Haiku):

- One Sonnet specialist answer ≈ **$0.02–0.03** (≈3k cached-prefix + ~2k volatile input + ~1k output).
- A full audit (a few specialists + a Riley report) ≈ **$0.10**.
- Per **active client/month** (~weekly audits + ad-hoc chat, ~30 AI calls) ≈ **$1–3**.
- Weekly knowledge-refresh cron (Opus + web search) ≈ **~$4/mo platform-wide**, not per client.

**Scale points (platform AI + infra, AUD/mo):**

| Active clients | Infra | AI tokens | Total platform |
|---|---|---|---|
| 10 | ~$70 | ~$10–30 | **~$80–100** |
| 100 | ~$150–300 | ~$100–300 | **~$300–600** |
| 500 | ~$400–900 | ~$500–1,500 | **~$1,000–2,400** |

## 3) Unit economics

Against the placeholder pricing (Starter $49 / Pro $149 / Expert $399), at ~100 clients on a blended
~$120/mo ARPU ≈ **$12,000/mo revenue** vs ~$300–600/mo platform cost — **AI + infra ≈ 3–5% of
revenue**. Gross margin is healthy before support, marketing, and the owner's time. The cost curve is
**sub-linear** because prompt caching and Haiku routing blunt the per-client AI cost as volume grows.

## 4) Other findings established along the way

- The product's **read-only invariant is now defended in code, not just convention**: a CI guard
  asserts GET-only platform fetches, and the new Tier-1 eval net catches an AI output that *claims* a
  live edit, uses USD, exposes a personal email, guarantees a result, or scales without a basis.
- The **statistical moat is real and pure-TS** (change-point fatigue onset + robust anomaly scan) —
  no Python service, so it stays resale-clean and deployable on Vercel's Node runtime.
- The **biggest cash lever is the build path, not the run cost**: AI-assisted delivery changed the
  build from a low-six-figure line item to a near-zero-marginal-cash one; the run cost was never the
  constraint (single-digit % of revenue).
- **Launch is gated on decisions, not engineering**: Stripe price IDs, legal sign-off, and a Meta
  System User token are the real blockers — all owner-side.
