# AdPilot OS V2 — SaaS app (Phase 1 scaffold)

Production foundation per `CPWORK/universal-ads-os/product/V2-COUNCIL-SYNTHESIS-AND-PRD.md`.
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Stripe (wired in env, billing next phase).

This is **Phase 1**: project setup + the **engine ported to TypeScript** (same logic as the parity-tested demo) + **multi-tenant DB schema with RLS** + **auth** + an **auth-gated `/api/score`** + a **dashboard** that analyses a CSV via React (no `innerHTML` → XSS-safe by design).

## What's here
```
adpilot-v2/
  app/                 layout, landing (/), login, dashboard, api/score
  components/          AnalyzeClient.tsx (React results UI)
  lib/engine/          metrics, health, schema, ingest, decisions, audit, index, types, *.test.ts
  lib/supabase/        server + browser clients
  middleware.ts        session refresh + /dashboard auth gate
  supabase/migrations/ 0001_init.sql (schema + RLS, tenant isolation)
  next.config.mjs      security headers (CSP, X-Frame-Options, etc.)
```

## Run locally
```bash
cd adpilot-v2
cp .env.example .env.local      # fill in Supabase keys (+ Stripe later)
npm install
# create the DB:  supabase db push   (or paste supabase/migrations/0001_init.sql in the SQL editor)
npm run test                    # engine parity (vitest)
npm run typecheck
npm run dev                     # http://localhost:3000
```

## Deploy
- **Vercel** (app) + **Supabase** (DB/Auth, AU region if available). Set the same env vars in Vercel.
- Security headers ship via `next.config.mjs`. Stripe webhook + billing land in the billing phase.

## Engine = single source of truth
`lib/engine` is a faithful TypeScript port of the demo engine (`docs/engine.js`) and the Python engine (`CPWORK/universal-ads-os/tools/adpilot`). All three share the canonical 13-factor health model; `engine.test.ts` keeps the TS port honest.

## Safety (unchanged from V1)
Read-only. The app analyses and **proposes**; it never edits, pauses, or creates ads. Live changes (future Meta/TikTok write scopes) will require explicit human approval. RLS isolates every org's data; OAuth tokens are stored encrypted and never sent to the browser.

## Roadmap (next phases — see the PRD)
Auth+orgs (RLS wired) → CSV persistence → recommendations status board → dashboards/saved reports + PDF → Meta/TikTok OAuth (read-only) → alerts/email → Stripe billing + white-label → QA/security/launch.
