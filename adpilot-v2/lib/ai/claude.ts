import "server-only";

// Server-side Claude call. Key never leaves the server. Uses the Messages API
// via fetch (no SDK dependency). Default model is fast; override with ANTHROPIC_MODEL.
const API = "https://api.anthropic.com/v1/messages";

export class NoKeyError extends Error {
  constructor() { super("NO_KEY"); this.name = "NoKeyError"; }
}

export async function callClaude(opts: { system?: string; user: string; model?: string; maxTokens?: number }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new NoKeyError();
  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: opts.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: opts.maxTokens ?? 1000,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t.slice(0, 300)}`);
  }
  const j: any = await res.json();
  return (j.content || []).map((b: any) => (b.type === "text" ? b.text : "")).join("").trim();
}
