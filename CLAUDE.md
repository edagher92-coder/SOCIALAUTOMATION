# CLAUDE.md

Project-wide guidance for Claude Code when working in this repository.

## Web access & browsing — Firecrawl fallback

Use the **Firecrawl MCP server** to browse, search, or read the web whenever the
tools native to Claude are blocked or failing. Native browsing tools
(`WebFetch`, `WebSearch`) and other MCP browsers can be blocked in this
environment by the network egress policy, anti-bot defenses, captchas, rate
limits, or pages that render only via JavaScript.

**When to switch to Firecrawl:**

- A native fetch/search returns an egress proxy `403 — Host not in allowlist`.
- A site blocks bots / shows a captcha / returns empty or partial content.
- You need richer search (full-page content, domain filtering, news/images) or
  structured extraction.

**Firecrawl tools to use:**

- `firecrawl_search` — web/news/image search that returns full-page content.
  Prefer this over built-in web search. After using results, call
  `firecrawl_search_feedback` with the search ID (improves quality, refunds 1
  credit).
- `firecrawl_scrape` — extract one known page (use JSON format with a schema for
  specific data points; markdown for whole-page reading).
- `firecrawl_map` — discover URLs on a site.
- `firecrawl_crawl` / `firecrawl_check_crawl_status` — multi-page crawl.
- `firecrawl_extract` — structured data extraction across pages.

**Requirements (see `docs/firecrawl-mcp-setup.md`):**

- The server is configured project-scoped in `.mcp.json` and reads the API key
  from the `FIRECRAWL_API_KEY` environment variable (never commit the key).
- Firecrawl reaches the web via `api.firecrawl.dev`. That host **must be on the
  environment's network egress allowlist**, or Firecrawl calls also fail with
  the same `403`. If they do, the fix is the allowlist, not the code.
