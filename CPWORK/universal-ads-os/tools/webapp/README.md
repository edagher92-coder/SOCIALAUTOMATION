# AdPilot OS — Web App

A thin, **safe**, dependency-free UI over the engine. Paste or upload a
Meta/TikTok/universal CSV, set average sale value + gross margin, and get the
**Campaign Health Score**, findings, headline metrics, and **safe per-ad decisions**.
It is **read-only** — it never edits a live ad.

> Standard library only (`http.server`). No `pip install`, no framework, no secrets.

## Run locally
```bash
cd CPWORK/universal-ads-os/tools
python3 -m webapp.server          # -> http://localhost:8000
# PORT=9000 python3 -m webapp.server   to change the port
```
Open `http://localhost:8000`, click **Sample: fatigued**, then **Analyse**.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | the app (HTML UI) |
| GET | `/health` | liveness → `{"status":"ok"}` (used by hosts' health checks) |
| GET | `/api/selftest` | runs the engine self-test → `{ok,passed,total}` |
| GET | `/api/sample/{clean\|fatigued\|broken}` | sample CSV text |
| POST | `/api/analyze` | JSON `{csv, average_sale_value, gross_margin, business, currency, platform?}` → `{summary, health, decisions}` |

Example:
```bash
curl -s localhost:8000/api/analyze -H 'Content-Type: application/json' \
  -d "{\"csv\":\"$(tr '\n' '§' < adpilot/tests/fixtures/fatigued_account.csv)\"}" # (replace § with real newlines)
```

## Deploy (make it publicly testable)
Pick one — all are one step because there's nothing to build:

**Docker (anywhere)**
```bash
cd CPWORK/universal-ads-os/tools
docker build -f webapp/Dockerfile -t adpilot-web .
docker run -p 8000:8000 adpilot-web
```

**Render.com** — New → Blueprint → select this repo (uses `webapp/render.yaml`).
Health check `/health`; it even runs the self-test as the build gate.

**Railway / Fly / Heroku-style** — uses `tools/Procfile` (`web: python -m webapp.server`).
Set the service root/working dir to `CPWORK/universal-ads-os/tools`. The app binds
`0.0.0.0:$PORT` automatically.

**Any VPS**
```bash
git clone <repo> && cd <repo>/CPWORK/universal-ads-os/tools
HOST=0.0.0.0 PORT=80 python3 -m webapp.server
```

## Safety
- Read-only analysis. No endpoint changes an ad account. No write tokens are used.
- The app holds no secrets; it only does maths on the CSV you give it.
- For production, put it behind HTTPS (your host's TLS) and add auth if exposing client data.
