# AdPilot OS — Live Browser Demo (GitHub Pages)

A **fully client-side**, premium demo of AdPilot OS for showing prospects. The
engine (`engine.js`) is a faithful JavaScript port of the Python engine in
`CPWORK/universal-ads-os/tools/adpilot/`, verified by a parity test
(`engine.test.js`, **30/30**, also run in CI).

- **No backend, no upload, private:** the CSV is analysed entirely in the browser
  and never leaves the page. Read-only — never edits a live ad.
- **Client-ready GUI:** hero + value prop, live analyzer with an SVG health gauge,
  per-campaign bar chart, spend-by-platform donut, findings, safe proposals,
  CSV + Print/Save-PDF export, pricing tiers, and a "book a demo" CTA.
- **Self-validating:** footer "engine self-test" button runs the engine live.

## Files
- `index.html` — the app (loads `engine.js`).
- `engine.js` — the ported engine (metrics, 13-factor health, auto-audit, decisions, CSV ingest).
- `engine.test.js` — Node parity test: `node docs/engine.test.js`.

## Make it a public URL (one-time, ~30s)
**Repo → Settings → Pages → Build and deployment → Source: "Deploy from a branch" →
Branch `main`, folder `/docs` → Save.**
Then use the **"Visit site"** button that appears. Live at:
**https://edagher92-coder.github.io/SOCIALAUTOMATION/** (case-sensitive, keep the trailing slash).

No Actions workflow is needed — GitHub's built-in builder serves `docs/` directly
(`.nojekyll` is included). The JS engine parity test runs in the main CI workflow.

## Run locally / share anywhere
- Open `docs/index.html` directly in a browser, or `python3 -m http.server` from `docs/`.
- **Single-file version:** `python3 tools/build_singlefile.py` produces
  `dist/AdPilot-OS-Demo.html` — one self-contained file (engine inlined, zero
  dependencies) you can email, drop in Google Drive, or open on any device.

> This demo is the no-code analysis layer. The full product — 12 agents, 25 skills,
> automations, API plans, and the Python engine/CLI/server — lives in
> `CPWORK/universal-ads-os/`.
