# 👋 START HERE — AdPilot OS

Welcome. This is the buyer's first stop. Five minutes here and you'll know exactly
what you have and what to do first.

---

## What you bought
A universal operating system for **Meta + TikTok ads** that audits accounts, scores
campaign health (0–100), unifies your data, writes plain-English reports, and
proposes safe optimisations — **without ever editing a live ad.**

## The one rule that protects you
**AdPilot OS never changes a live, spending ad.** It proposes paused duplicates,
drafts, or written recommendations; money moves need your typed "YES". You stay in
control. (See `SECURITY.md` and `AGENTS.md` §1.)

## Do these 5 things first
1. **Read this file, then `README.md`** (the full map).
2. **Configure your business:** copy `config/client-config.yaml`, fill it in.
   Stuck on a field? Open `config/config-guide.md`.
3. **Prove the maths (optional, 10 seconds):**
   ```bash
   cd tools && python3 -m adpilot selftest      # -> ALL PASS ✅
   ```
4. **Run your first analysis** on a CSV export (Meta or TikTok):
   ```bash
   python3 -m adpilot analyze <your-export.csv> --avg-sale 200 --margin 0.6
   ```
   or, no-code: paste exports into the Sheets dashboard
   (`dashboards/google-sheets-dashboard-spec.md`).
5. **Generate your first report** with the `client-report-generator` skill, using
   `templates/weekly-client-report-template.md`.

## Prefer a screen? Run the web app
```bash
cd tools && python3 -m webapp.server     # -> http://localhost:8000
```
Upload/paste a CSV, hit **Analyse** → health score + findings + safe proposals.
Deploy it publicly in one step (Docker/Render/Railway) — see `tools/webapp/README.md`.

## Which tier am I on?
- **Starter (DIY):** this pack + the Sheets dashboard + CSV import. Start at steps 1–5.
- **Pro (Automation):** add `automations/` (Make/Zapier/n8n) + alerts + auto-reports.
- **Agency (White-label):** add `product/white-label-agency-offer.md` + multi-client config.
- **Done-With-You:** we set it up for you (`product/onboarding-flow.md`).

## Where everything lives
`README.md` has the full map. Quick hits: skills → `skills/`, agents → `agents/`,
templates → `templates/`, dashboards → `dashboards/`, automations → `automations/`,
API plans → `api/`, the engine → `tools/`, sample reports → `reports/`.

## Safety & support
- Keep API tokens **out** of the files — env vars / git-ignored secrets only (`SECURITY.md`).
- Glossary + troubleshooting + FAQ: `product/support-docs.md`.
- SOPs (step-by-step playbooks): `product/sops/`.

> Heads-up for resellers: before you give this to a client, run
> `tools/package_release.sh` — it strips private context, scans for secrets, runs
> the self-test, and produces a clean ZIP. Never ship your raw working copy.
