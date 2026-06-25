import "server-only";

// P1.4 — AI usage telemetry. Pure cost estimation + a best-effort recorder for the `ai_usage`
// table (migration 0029). The cost model uses Anthropic's published per-million-token prices
// (USD); cache reads bill at ~0.1× input and 5-minute-TTL cache writes at 1.25× input. Counts and
// cost only — never a prompt or completion. Read-only/observability; a write failure never throws.

export interface TokenUsage {
  model: string;
  input: number;        // uncached input tokens
  output: number;       // output tokens
  cacheRead: number;    // tokens served from the prompt cache
  cacheWrite: number;   // tokens written to the prompt cache
}

// USD per 1,000,000 tokens. cacheWrite uses the 5-minute-TTL multiplier (1.25× input, the default
// `cache_control: ephemeral`); cacheRead is 0.1× input. Update here when Anthropic pricing changes.
const PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-4-8":   { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5":  { input: 1, output: 5,  cacheWrite: 1.25, cacheRead: 0.1 },
};
// Unknown/pinned model ids fall back to Sonnet pricing (the default specialist tier) so a cost is
// always recorded rather than silently zeroed.
const FALLBACK = PRICING["claude-sonnet-4-6"];

function priceFor(model: string) {
  if (PRICING[model]) return PRICING[model];
  // tolerate date-suffixed ids (e.g. claude-haiku-4-5-20251001) by prefix match.
  const hit = Object.keys(PRICING).find((k) => model.startsWith(k));
  return hit ? PRICING[hit] : FALLBACK;
}

// Estimated USD cost of one call. Pure; rounded to micro-dollars (6dp).
export function estimateCostUsd(usage: TokenUsage): number {
  const p = priceFor(usage.model);
  const raw =
    (usage.input * p.input +
      usage.output * p.output +
      usage.cacheRead * p.cacheRead +
      usage.cacheWrite * p.cacheWrite) / 1_000_000;
  return Math.round(raw * 1_000_000) / 1_000_000;
}

// Extract a TokenUsage from a Claude Messages API `usage` object. Null-safe; missing fields → 0.
export function parseUsage(model: string, apiUsage: any): TokenUsage {
  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    model,
    input: n(apiUsage?.input_tokens),
    output: n(apiUsage?.output_tokens),
    cacheRead: n(apiUsage?.cache_read_input_tokens),
    cacheWrite: n(apiUsage?.cache_creation_input_tokens),
  };
}

// Best-effort insert into `ai_usage`. Never throws and never blocks the caller — telemetry must not
// break an AI request (same posture as the email/ingestion-audit degradation). `admin` is a
// service-role Supabase client; `organisationId`/`route` describe who made the call.
export async function recordAiUsage(
  admin: any,
  organisationId: string | null | undefined,
  usage: TokenUsage,
  route?: string,
): Promise<void> {
  if (!admin || !organisationId) return;
  try {
    await admin.from("ai_usage").insert({
      organisation_id: organisationId,
      model: usage.model,
      route: route ?? null,
      input_tokens: usage.input,
      output_tokens: usage.output,
      cache_read_tokens: usage.cacheRead,
      cache_write_tokens: usage.cacheWrite,
      cost_usd: estimateCostUsd(usage),
    });
  } catch { /* telemetry is best-effort — never break the AI path */ }
}
