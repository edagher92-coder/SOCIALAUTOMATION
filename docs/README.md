# AdPilot OS — Live Browser Demo (GitHub Pages)

A **fully client-side** version of the AdPilot OS web app. The engine
(`engine.js`) is a faithful JavaScript port of the Python engine in
`CPWORK/universal-ads-os/tools/adpilot/` — verified by a parity test
(`engine.test.js`, **30/30**) that checks it produces the same metrics, health
bands, and decisions.

- **No backend, no upload:** your CSV is analysed entirely in your browser. It
  never leaves the page (open the network tab to confirm). Read-only — never edits a live ad.
- **Interactive:** paste/upload a Meta/TikTok/universal CSV, or click a sample
  (clean / fatigued / broken) → health score, findings, per-campaign drilldown,
  safe proposals, CSV + Print/Save-PDF export.
- **Self-validating:** click "run" next to *In-browser engine self-test* to verify the engine live.

## Files
- `index.html` — the app (loads `engine.js`).
- `engine.js` — the ported engine (metrics, 13-factor health, auto-audit, decisions, CSV ingest).
- `engine.test.js` — Node parity test: `node docs/engine.test.js`.

## Enable the public URL (one-time)
This repo ships a Pages workflow (`.github/workflows/pages.yml`) that runs the
parity test then publishes `docs/` on every push to `main`.

1. GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Merge to `main` (or run the "Deploy GitHub Pages" workflow manually).
3. Your demo goes live at: **https://edagher92-coder.github.io/SOCIALAUTOMATION/**

(Alternatively, set Pages Source to "Deploy from a branch → main → /docs".)

## Run locally (no server needed)
Just open `docs/index.html` in a browser. (Or `python3 -m http.server` from `docs/`.)

> This demo is the no-code analysis layer. The full product — agents, skills,
> automations, API plans, and the Python engine/CLI/server — lives in
> `CPWORK/universal-ads-os/`.
