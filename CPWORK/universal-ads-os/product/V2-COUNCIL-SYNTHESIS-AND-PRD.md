# AdPilot OS — V2 Council Synthesis & PRD
**Lead synthesiser:** Claude (acting as V2 lead dev / architect / security)
**Inputs:** ChatGPT technical audit + Gemini UX/commercial audit (provided by owner) + Claude direct code audit of `docs/` and `tools/`.
**Date:** 2026-06-15
**Note on sources:** the external Gemini/ChatGPT *share links* were unreachable from the build sandbox (egress blocked), so this synthesis uses the two reports the owner pasted in full plus a first-hand read of the actual code. Where the pasted reports and the live code agree, findings are treated as confirmed.

---

## PHASE 1 — SYNTHESIS

### 1. Master Issues Register (deduped across models)

| ID | Category | Issue | Source | Severity | Business impact | Technical impact | Action | V2 priority |
|---|---|---|---|---|---|---|---|---|
| S1 | Security | CSV/formula injection in export (`=,+,-,@`) | ChatGPT + Claude | HIGH | Customer Excel could execute formulas | Export pipeline | Prefix risky cells with `'` | **DONE (V1 patch)** |
| S2 | Security | `esc()` didn't escape quotes → attribute XSS | ChatGPT + Claude | MED | Trust/safety | Renderer | Escape `"` `'` | **DONE** |
| S3 | Security | No CSP / inline handlers | ChatGPT | MED | Hardening | Static host | Add CSP meta (+ later externalise JS) | **DONE (meta added)** |
| S4 | Security | No file size / row caps on upload | ChatGPT | MED | Tab freeze = bad demo | Parser | 5 MB + 5,000-row caps | **DONE** |
| S5 | Security/Trust | Operator-internal doc + real IDs + known secret leak in repo | ChatGPT + Claude | CRITICAL | Kills buyer trust | Repo hygiene | Remove from public repo; rotate secrets | **Doc removed (DONE); secret rotation = owner** |
| S6 | Security | `innerHTML` report construction (fragile) | ChatGPT | HIGH→MED | One missed field = XSS | Renderer | Quotes now escaped; full DOM rebuild = V2 | Mitigated; V2 hardening |
| C1 | Code quality | `engine.js` monolithic (parse+score+decide) | ChatGPT | P1 | Maintainability | Engine | Split modules in V2 backend | V2 |
| C2 | Code quality | Dual JS/Python engine parity drift risk | ChatGPT + Claude | P1 | Wrong numbers | Two engines | Parity test exists (30/30); keep as gate | Controlled |
| C3 | Code quality | Hardcoded weights/neutral defaults | ChatGPT + Gemini | P1 | Explainability | Scoring | Versioned scoring-config | V2 |
| C4 | Code quality | Placeholder contact email | ChatGPT | P2 | Looks unfinished | Copy | Replace with real support/Calendly | Should |
| U1 | UX/UI | Looks like a tool, not premium SaaS | Gemini | High | Bounce/trust | Frontend | Dashboard shell + design system (V2 app) | V2 |
| U2 | Model intelligence | Score not explainable (no factor weights shown) | Gemini + ChatGPT | High | Trust/value | UI | Factor breakdown + data confidence | **DONE (V1 patch)** |
| U3 | UX/Trust | No read-only / privacy / "not connected to live ads" messaging | Gemini + ChatGPT | Critical | Won't paste data | Copy | Trust bar + FAQ + status label | **DONE** |
| U4 | UX | Recommendations not prioritised / "kill-scale list" framing | Gemini | High | Actionability | UI | Verdicts already keep/kill/scale/refresh/fix-tracking; add Impact×Effort in V2 | Partial / V2 |
| U5 | Model intelligence | No benchmarks (industry/platform) | Gemini | High | Context | Scoring | Platform-aware thresholds (Meta vs TikTok) | Should/V2 |
| U6 | UX | Mobile tables overflow | Gemini | High | Mobile bounce | CSS | Responsive cards (current build is responsive; verify) | Should |
| R1 | SaaS readiness | No auth / accounts / tenancy | All | Critical | Can't charge | Backend | Supabase auth + orgs + RLS | V2 must |
| R2 | SaaS readiness | No persistence / saved reports | All | High | Retention | DB | Postgres tables | V2 must |
| R3 | SaaS readiness | No billing | Gemini + ChatGPT | High | No revenue | Stripe | Stripe subs | V2 must |
| R4 | SaaS readiness | No Meta/TikTok OAuth (CSV only) | All | High | Friction/"aha" | Integrations | OAuth read-only first | V2 should |
| R5 | Compliance | No Terms/Privacy; AU consumer law | All | Critical | Legal | Docs | Add legal pages before charging | V2 must |
| R6 | Deployment | Pages not enabled (404) | Claude | High | No live link | Hosting | Owner toggle / Netlify | Owner action |
| D1 | Documentation | Thin root README | ChatGPT | P2 | First impression | Docs | Product README (universal-ads-os README is strong) | Should |

### 2. Conflict resolution
The three reviews are **highly aligned** — no material conflicts. Minor differences of *emphasis*, resolved:

| Topic | ChatGPT | Gemini | Claude | Final decision |
|---|---|---|---|---|
| Biggest blocker | Security + SaaS infra | UX/trust packaging | Both + hosting | **Both are gating**: security/trust fixes ship in V1 patch now; SaaS infra is the V2 build. |
| `innerHTML` | Rebuild with DOM APIs | (n/a) | Escape-first, DOM later | **Escape quotes now** (done); full DOM rebuild scheduled in V2 frontend. |
| Auto-apply changes | (caution) | "Avoid for now (liability)" | Proposal-only by design | **Keep proposal-only**; automation opt-in + approval gates only. |

### 3. Ship / Do-Not-Ship verdict (brutally honest)
1. **Safe to show as a demo?** ✅ **Yes** — *after this V1 patch* (security + trust + explainability done) and **with the operator-internal doc removed** (done) and **secrets rotated** (owner).
2. **Safe to sell (take payment)?** ❌ **No** — needs auth, accounts, billing, persistence, Terms/Privacy.
3. **Safe to connect real ad accounts?** ❌ **No** — needs OAuth, encrypted token vault, audit logs, approval gates, platform-policy review.
4. **Before a paid beta:** auth + orgs + persistence + Stripe + Terms/Privacy + saved reports + error logging.
5. **Before public launch:** + Meta/TikTok OAuth (read-only), monitoring, support flow, admin, backups, full test suite.

### 4. Final V2 scope
**Must ship:** auth + organisations (RLS), CSV ingestion + validation, scoring engine (server, versioned config), recommendations with Impact×Effort + confidence, dashboard + saved reports, Stripe billing, Terms/Privacy, transactional email reports, security hardening.
**Should ship:** Meta/TikTok OAuth (read-only sync), platform-aware benchmarks, AI ad-copy generator, weekly email digest, white-label PDF, landing-page drop-off detector.
**V3 later:** competitor/ad-library research, AI vision on creatives, post scheduler, budget simulation/forecasting, auto-apply (gated), agency multi-client portal.

---

## PHASE 2 — V1 EMERGENCY FIX PLAN (executed this round)

| Fix | File | Why | Change | Status |
|---|---|---|---|---|
| CSV formula injection | docs/index.html `q()` | Excel exec risk | prefix `=,+,-,@,tab,CR` with `'` | ✅ |
| Attribute XSS | docs/index.html `esc()` | quotes unescaped | escape `"` `'` too | ✅ |
| CSP + referrer | docs/index.html `<head>` | hardening | CSP + `referrer=no-referrer` meta | ✅ |
| Upload caps | docs/index.html file handler + run() | tab freeze | 5 MB + `.csv/.txt` + 5,000-row cap | ✅ |
| Explainability | docs/index.html run() | trust/value | "Why this score?" 13-factor breakdown | ✅ |
| Data confidence | docs/index.html run() | honesty | data-confidence /100 shown; "directional" if <50 | ✅ |
| Trust/privacy/read-only | docs/index.html | won't paste data | trust bar + "not connected to live ads" + FAQ + disclaimer | ✅ |
| Operator-internal doc | repo root | trust/secret risk | removed `CPWORK_AD_SYSTEM_CURRENT_STATE.md` from public repo | ✅ |
| Secret rotation | external | compromised | rotate Anthropic key + Stripe code | ⛔ owner action |
| Placeholder contact | docs/index.html CTA | unfinished look | replace `hello@adpilot.example` with real support/Calendly | ⚠ owner to set |
| Pages live | GitHub settings | 404 | enable Pages (branch/docs) or Netlify Drop | ⛔ owner action |

---

## PHASE 3 — V2 TECHNICAL BLUEPRINT

### 1. Recommended stack
| Layer | Tool | Why | Setup notes |
|---|---|---|---|
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui + Tremor (charts) | Fast, premium, Claude-buildable | Vercel deploy |
| Backend | Next.js route handlers / server actions | One codebase | Edge+node runtimes |
| DB + Auth | Supabase (Postgres + Auth + RLS) | Auth, tenancy, RLS in one | Email + Google OAuth |
| Billing | Stripe (Checkout + Customer Portal + webhooks) | Standard | Plans: Starter/Pro/Agency |
| Ads APIs | Meta Marketing API + TikTok Business API (read-only first) | Core integration | OAuth, encrypted token vault (Supabase Vault/KMS) |
| Email | Resend (transactional + weekly digest) | Simple, reliable | DKIM/SPF |
| WhatsApp | WhatsApp Cloud API (alerts) | Owner already uses it | Opt-in |
| PDF | Server-side (React-PDF / Playwright print) | Branded reports | Queue for large |
| Hosting | Vercel (app) + Supabase (Sydney region if available) | AU data residency | Region pin |
| Monitoring | Sentry + Supabase logs + Upptime | Errors/uptime | Alerts |

### 2. Folder structure (V2 app)
```
adpilot-v2/
  app/(marketing)/            landing, pricing, legal
  app/(app)/dashboard|reports|recommendations|copy|settings|billing
  app/api/                    auth, orgs, ad-accounts, sync, score, reports, stripe-webhook
  lib/engine/                 parser, validator, metrics, scoring, recommender, exporter (shared spec)
  lib/integrations/meta, tiktok
  lib/agents/                 orchestrator + specialist agents
  components/ui               shadcn
  supabase/migrations         schema + RLS
  tests/                      unit, parity, e2e
```

### 3. Database schema (core tables)
`organisations`, `users`, `memberships(role)`, `connected_ad_accounts`, `platform_tokens(encrypted)`, `campaign_snapshots`, `adset_snapshots`, `ad_snapshots`, `health_scores`, `recommendations`, `reports`, `scheduled_posts`, `notification_rules`, `audit_logs`, `white_label_profiles`, `billing_subscriptions`. **RLS:** every row carries `organisation_id`; policy = `organisation_id = active org of auth.uid()`. Tokens encrypted at rest; `audit_logs` append-only.

### 4. API endpoints (representative)
`POST /api/auth/*`, `GET/POST /api/orgs`, `POST /api/ad-accounts/connect` (OAuth), `POST /api/sync/:platform`, `POST /api/score`, `POST /api/recommendations`, `POST /api/reports`, `GET /api/reports/:id`, `POST /api/stripe/webhook`, `GET /api/admin/health`. All (except webhook) auth-required + org-scoped + rate-limited.

### 5. Agent architecture (final)
Orchestrator → Account-Connection, Meta-Data, TikTok-Data, CSV-Import, Data-Quality, Health-Scorer, Creative-Fatigue, Budget-Optimisation, Audience-Insights, Tracking-Diagnostics, Recommendation-Prioritisation, Ad-Copy-Generator, Creative-Brief, Report-Generator, Alert, White-Label, Compliance-Safety. **Rules:** no agent edits a live account without explicit approval; every recommendation carries *why + impact + confidence*; never assert certainty on weak data; automation is opt-in.

### 6. Scoring model (V2)
Keep the **canonical 13-factor weighted model** (already in `tools/adpilot/health.py` + `docs/engine.js`, parity-tested) and extend with: platform-aware CTR/CPA/CPM benchmarks (Meta vs TikTok), CTR & conversion-rate **trend** (needs time-series snapshots), learning-phase & frequency risk, and a surfaced **confidence + data-quality** score (already surfaced in V1 patch). Move weights/thresholds into a versioned `scoring-config` with per-factor explanations.

### 7. Security model
Supabase Auth + RLS (tenant isolation) · encrypted OAuth token vault · least-privilege scopes (read first) · rate limiting · append-only audit logs · input validation + output encoding (done in demo) · CSV-injection guard (done) · CSP (tighten by externalising JS) · Stripe webhook signature verification · secret scanning + CodeQL in CI · Terms/Privacy + AU Consumer Law compliance · human-approval gate before any live change · kill switch.

---

## PHASE 4 — V2 BUILD PLAN

| Phase | Name | Goal | Depends | Output | Done when |
|---|---|---|---|---|---|
| 0 | V1 demo patch | Safe, explainable, honest demo | — | hardened `docs/` | This PR (✅ most items) |
| 1 | Project setup | Next.js+Supabase+CI | 0 | repo skeleton | builds + deploys |
| 2 | Auth + orgs | Multi-tenant + RLS | 1 | login, orgs, roles | user sees only own org |
| 3 | Ingestion | CSV import + validation + storage | 2 | snapshots tables | bad rows reported |
| 4 | Scoring engine | Server engine + versioned config + parity | 3 | scores persisted | parity tests green |
| 5 | Recommendations | Impact×Effort + confidence | 4 | reco engine | reasons+confidence shown |
| 6 | Dashboard + reports | Premium UI + saved reports + PDF | 5 | app UI | report saved + exported |
| 7 | Meta/TikTok OAuth | Read-only sync | 6 | connectors | account syncs |
| 8 | Alerts + email | Weekly digest + threshold alerts | 6 | notifications | email delivered |
| 9 | Billing + white-label | Stripe + branding | 6 | paywall | test purchase works |
| 10 | QA + security + launch | Tests, monitoring, legal, docs | all | launch-ready | readiness checklist passes |

---

## PHASE 5 — CLAUDE 4.8 IMPLEMENTATION CHECKLIST

**Immediate fixes (V1 — mostly done this PR):** CSV-injection guard ✅ · escape quotes ✅ · CSP ✅ · upload caps ✅ · explainability ✅ · data confidence ✅ · trust/FAQ/read-only ✅ · remove internal doc ✅ · *(owner)* rotate secrets, set real contact, enable Pages.
**Foundation:** Next.js+TS+Tailwind+shadcn · Supabase project (AU region) · CI (tests, CodeQL, secret scan) · Sentry.
**Backend:** Supabase Auth (email+Google) · orgs/memberships + RLS · ingestion + validation · scoring engine (port `adpilot` + versioned config) · recommendations · reports + PDF · Stripe (Checkout, Portal, webhook) · audit logs.
**Frontend:** dashboard shell (sidebar) · animated health gauge · factor breakdown · Impact×Effort recommendation board · saved reports · onboarding (OAuth + CSV fallback) · billing/settings · legal pages.
**Agents & intelligence:** orchestrator + 17 specialist agents (proposal-only) · platform-aware benchmarks · trend detection (time-series) · ad-copy generator · confidence everywhere.
**Security & compliance:** RLS tested · encrypted token vault · least-privilege scopes · rate limits · CSP tightened (externalise JS) · Stripe sig verify · Terms/Privacy/AU-ACL · approval gate + kill switch.
**Docs & launch:** product README · SECURITY.md (present) · PRIVACY + LIMITATIONS pages · onboarding guide · production-readiness checklist · monitoring + backups + support inbox.

---

### Scores (synthesised)
- **Technical debt:** 6.5/10 (structural, not chaotic). After V1 patch: ~5.5.
- **Commercial risk to sell *today*:** 8.5/10 → demo is fine; selling needs the V2 must-ships.
- **Honest current positioning:** *"A working, explainable, browser-based Meta/TikTok campaign-audit demo and product framework — not yet a production SaaS."*
