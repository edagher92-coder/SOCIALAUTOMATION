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
