# Firecrawl MCP Setup

This repo ships a project-scoped MCP server config (`.mcp.json` at the repo root)
that exposes [Firecrawl](https://www.firecrawl.dev/) web-scraping/crawling tools
to Claude Code.

The config **does not** contain the API key. The key is read from the
`FIRECRAWL_API_KEY` environment variable at server startup, keeping it out of
version control (see `.gitignore` / `SECURITY.md`).

## 1. Provide the API key

Set `FIRECRAWL_API_KEY` to your key from https://www.firecrawl.dev/app/api-keys.

**Claude Code on the web (this remote environment):**
Add it as an environment variable / secret in your environment's settings, then
start a new session so the MCP server picks it up. See
https://code.claude.com/docs/en/claude-code-on-the-web for where environment
variables and secrets are configured.

**Local Claude Code:**
Export it in the shell that launches Claude Code, e.g.

```bash
export FIRECRAWL_API_KEY="fc-..."
```

(or add it to your shell profile / a local, gitignored `.env`).

## 2. Approve the server

MCP servers load at session start. After the key is set, start a fresh session.
Claude Code will prompt you to approve the project-scoped `firecrawl` server the
first time it's used — approve it.

## 3. Verify

In a new session, run `/mcp` to confirm the `firecrawl` server is connected and
its tools are listed.

## Network egress (required for the web environment)

The server makes outbound calls to **`api.firecrawl.dev`**. In the remote web
environment, outbound traffic is governed by a network egress allowlist. If the
host isn't allowed, requests are rejected by the environment proxy (not by
Firecrawl) with:

```
HTTP 403 — Host not in allowlist: api.firecrawl.dev.
Add this host to your network egress settings to allow access.
```

Add `api.firecrawl.dev` to the environment's network egress settings (or select
a network policy that permits it). See
https://code.claude.com/docs/en/claude-code-on-the-web for where the network
policy is configured.

## Notes

- The server runs via `npx -y firecrawl-mcp` (requires Node, which is already
  available in the web environment).
- Alternatively, install the official Firecrawl Claude Code plugin, which
  provides the `/firecrawl:setup` command and the same MCP server.
