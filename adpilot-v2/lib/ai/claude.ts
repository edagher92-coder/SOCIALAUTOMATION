import "server-only";

// Server-side Claude call. Key never leaves the server. Uses the Messages API
// via fetch (no SDK dependency). Default model is fast; override with ANTHROPIC_MODEL.
const API = "https://api.anthropic.com/v1/messages";

export class NoKeyError extends Error {
  constructor() { super("NO_KEY"); this.name = "NoKeyError"; }
}

// Model tiers — route each task to the lightest model that does the job, to cut token
// cost and latency on the back end without hurting quality:
//   light    → short, templated creative / classification (Haiku: cheapest, fastest)
//   standard → grounded reasoning over the user's live numbers (Sonnet: the default)
//   deep     → web-research synthesis / knowledge refresh (Opus)
export const MODELS = {
  light: "claude-haiku-4-5",
  standard: "claude-sonnet-4-6",
  deep: "claude-opus-4-8",
} as const;

// Pick the model for a tier. A global ANTHROPIC_MODEL pin (operator override) always wins,
// otherwise the per-tier default applies. Keeps light tasks cheap unless explicitly overridden.
export function modelFor(tier: keyof typeof MODELS): string {
  return process.env.ANTHROPIC_MODEL || MODELS[tier];
}

export async function callClaude(opts: { system?: string; user: string; model?: string; maxTokens?: number; cacheSystem?: boolean }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new NoKeyError();
  // Prompt caching: when the system prefix is large + static (persona + reference knowledge), mark
  // it cacheable so repeat calls reuse it at ~10% input cost (GA; needs a ≥1024–2048-tok prefix).
  const system = opts.system
    ? (opts.cacheSystem
        ? [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }]
        : opts.system)
    : undefined;
  const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1000,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t.slice(0, 300)}`);
  }
  const j: any = await res.json();
  // Observability: log token usage incl. prompt-cache hits/writes so the caching saving is
  // measured, not estimated. Counts only — no prompt content or client data is logged.
  const u = j.usage;
  if (u) console.info("[claude.usage]", JSON.stringify({
    model, in: u.input_tokens, out: u.output_tokens,
    cache_read: u.cache_read_input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0,
  }));
  return (j.content || []).map((b: any) => (b.type === "text" ? b.text : "")).join("").trim();
}

// Web-research call: enables Anthropic's server-side web_search tool so the model pulls
// CURRENT public data and synthesises an answer. Used by the knowledge-refresh cron.
// web_search_20260209 is GA (dynamic filtering built in) — no beta header needed.
export async function researchWithWebSearch(opts: { system?: string; user: string; maxUses?: number; maxTokens?: number; model?: string }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new NoKeyError();
  const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxUses ?? 5 }];
  let messages: any[] = [{ role: "user", content: opts.user }];
  let text = "";
  // Server-side tool loop: re-send on pause_turn (server hit its iteration limit).
  for (let i = 0; i < 4; i++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: opts.maxTokens ?? 2000, ...(opts.system ? { system: opts.system } : {}), tools, messages }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Claude API error ${res.status}: ${t.slice(0, 300)}`);
    }
    const j: any = await res.json();
    text = (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (j.stop_reason === "pause_turn") {
      messages = [{ role: "user", content: opts.user }, { role: "assistant", content: j.content }];
      continue;
    }
    break;
  }
  return text;
}
