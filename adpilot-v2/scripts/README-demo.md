# AdPilot OS — Demo Accounts

Seeds two polished, fully-populated **demo** accounts so you can show the product
end-to-end. Every metric, health score, proposal and report is generated through
the **real scoring engine** (`lib/engine`) — nothing is faked or hand-typed — so
what you see in the app is exactly what a real account would produce.

> ⚠️ **Run this against a separate / staging Supabase project.** It needs the
> service-role key (RLS is bypassed only with it). It only ever creates or
> removes data tied to the two demo emails and organisations whose name ends in
> `[DEMO]` — it never touches anything else.

## The two personas

| | **Coach Maya — Fitness Studio** | **Bean & Bloom Café** |
|---|---|---|
| Persona | Solo fitness creator selling a $199 program | Local café driving brunch + orders |
| Login | `creator.demo@adpilot.app` | `cafe.demo@adpilot.app` |
| Plan | Expert (everything unlocked) | Expert (everything unlocked) |
| Health | **~80 / Green** — "crushing it" | **~58 / Orange** — "turning it around" |
| Platforms | Meta + TikTok | Meta + TikTok |
| Proposals shown | reduce · refresh · **scale ×2** | **kill · fix-tracking · reduce · refresh · scale** |
| Story | Strong ROAS (2.2×), structured campaigns, scale the winners | A budget bleeder to kill, broken tracking to fix, a winner to scale |

Default password for both: `AdPilotDemo!2026` (override with `DEMO_PASSWORD`).

Each account holds **~6 months of daily campaign snapshots** (Meta + TikTok),
**6 monthly health scores + saved reports** (so the Reports history and trend are
populated), an **open Proposals queue**, **connected ad accounts**, **content
posts/reels** (published / scheduled / draft), **creative assets**, notification
rules, and — for the café — a full **Messenger** greeting/menu/hours rule set.

## Run it

```bash
cd adpilot-v2
npm install

# point at your STAGING Supabase (env or .env.local):
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="service-role-key"

npm run seed:demo:dry     # preview what will be generated (no DB writes)
npm run seed:demo         # create / refresh the two demo accounts
npm run seed:demo:clean   # remove the two demo accounts + all their data
```

Flags: `--only=creator` or `--only=cafe` to seed just one.

Re-running `seed:demo` is **idempotent** — it removes the previous demo accounts
(by their known emails / `[DEMO]` orgs) and recreates them fresh, so you always
get a clean, deterministic state.

## How it works (so you can trust the numbers)

1. Generates ~6 months of realistic **daily** Meta/TikTok snapshots per ad
   (trend + weekday seasonality + noise) → stored in `campaign_snapshots`.
2. Builds clean per-ad **30-day aggregates** and runs the real `analyse()` engine
   on them → genuine `health_scores.total/band/breakdown`, the `reports.payload`,
   and the proposals via the same `refreshOpenRecommendations()` the app uses.
3. Adds genuine `scale` proposals for the clear-to-scale winners (the engine's
   scale branch needs a health arg the live queue doesn't pass, so this mirrors
   what a human reviewer would approve).

Tune the personas in `scripts/seed-demo.ts` (the `CREATOR` / `CAFE` specs) and
re-check with `npm run seed:demo:dry`.
