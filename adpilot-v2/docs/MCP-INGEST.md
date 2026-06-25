# Push data via MCP / automation — `/api/ingest`

Send universal-schema rows straight into AdPilot from a Claude/MCP workflow, a
script, or any backend. Read-only ingestion — it stores snapshots and (optionally)
scores them.

## Auth (two ways)
- **Session:** a logged-in browser/session → data goes to the user's **active** client.
- **Server key:** header `x-api-key: $INGEST_API_KEY` **+** `organisation_id` in the body
  (for headless MCP/automation). Set `INGEST_API_KEY` on the server.

## Request
`POST /api/ingest`
```json
{
  "organisation_id": "uuid (required with x-api-key)",
  "analyze": true,
  "average_sale_value": 200,
  "gross_margin": 0.6,
  "rows": [
    { "platform": "meta", "campaign_name": "spring_leads", "date": "2026-06-13",
      "spend": 600, "impressions": 30000, "reach": 16000, "clicks": 600,
      "leads": 40, "purchases": 12, "revenue": 3600, "tracking_status": "ok" }
  ]
}
```
Rows accept the universal schema (extra fields ignored). Up to 20,000 rows/request.

## Response
```json
{ "inserted": 1, "report": { "id": "uuid", "health": 89.4, "band": "Green" } }
```

## Example (curl)
```bash
curl -X POST https://your-app.vercel.app/api/ingest \
  -H "content-type: application/json" \
  -H "x-api-key: $INGEST_API_KEY" \
  -d '{"organisation_id":"...","analyze":true,"rows":[ ... ]}'
```

## MCP pattern
Have your Meta/TikTok MCP server export insights (or any tool's data) to the
universal schema, then call `/api/ingest` with `x-api-key`. AdPilot stores, scores,
saves a report, and (if alerts are on) the scheduled job will email breaches.

Safety: ingestion only writes to AdPilot's own database (snapshots/reports) — it never
touches your ad accounts. Org isolation is enforced by `organisation_id`.

Every ingestion — whether via MCP or direct pull — writes an honest `ingestion_runs`
audit row recording status (`ok` | `partial` | `rate_limited` | `auth_failed` | `empty` |
`error`), rows written, window days, and graph version. No token is ever stored in that table.

## Recommended Meta MCP connectors

Choose a server that presents **only read tools** to minimise blast radius. The connector
path is read-only: no write scope is requested by AdPilot and `ADS_WRITE_ENABLED` stays OFF.

### Recommended — `hashcott/meta-ads-mcp-server` (MIT)

The preferred bring-your-own connector for the `/api/ingest` lane. Read tools are always
on; write tools are gated behind the server's own `META_ADS_ENABLE_WRITE_TOOLS=true` flag
(leave it unset). MIT licence — compatible with hosted and resale SaaS use.

### Acceptable fallback — `gomarble-ai/facebook-ads-mcp-server` (MIT)

MIT licensed; suitable when the primary recommendation is unavailable. Verify the exposed
tool list before wiring into production — confirm no write actions are enabled.

### Avoid for the hosted/resale SaaS path

- **`pipeboard-co/meta-ads-mcp`** — licensed under **BSL-1.1** (Business Source Licence),
  converting to Apache 2.0 in 2029. BSL explicitly restricts commercial hosting/production
  use by third parties prior to conversion. **Do not use for a hosted or resale SaaS
  deployment** — the licence does not permit it until 2029.
- Any server released under **AGPL** — the copyleft licence requires open-sourcing the
  combined application when distributed/hosted, which is incompatible with a proprietary
  SaaS product.

Keep licence claims current: always check the upstream repository's `LICENSE` file before
adopting a new connector, as licences can change between releases.
