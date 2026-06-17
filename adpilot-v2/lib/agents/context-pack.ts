import "server-only";

// Runtime business context-pack loader (per AGENTS.md §7 — private business knowledge is
// NEVER baked into the sellable core; it loads at runtime, from outside the committed build).
//
// IMPORTANT: the pack is read from an ENV VAR (a JSON string), never from a file on disk.
// On Vercel serverless the filesystem is read-only/ephemeral and a .gitignore'd pack file is
// not in the deployment bundle — a runtime file read would pass locally and silently no-op in
// production. An env var is the only mechanism that works in both places.
//
// Sellable default: ADPILOT_CONTEXT_PACK_JSON unset/empty -> no pack -> every export returns
// the empty/false value, so the AI specialists' output is byte-identical to the clean build.
// A pack may only ADD grounding (tightening the guardrails); it never loosens them.

export type ContextPack = {
  id: string; // a private business pack id, e.g. "client-a" | "acme-co"
  shared?: string; // grounding appended to EVERY specialist when active
  agents?: Record<string, string>; // per-agent extra grounding (agent id -> text)
};

// Memoised by the raw env value so a cold start parses once, while tests that change
// the env between calls still observe the change (no permanent module-load cache).
let _cacheKey: string | undefined;
let _cached: ContextPack | null = null;

function pack(): ContextPack | null {
  const raw = process.env.ADPILOT_CONTEXT_PACK_JSON ?? "";
  if (raw === _cacheKey) return _cached;
  _cacheKey = raw;
  _cached = null;
  if (raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && typeof p.id === "string") _cached = p as ContextPack;
    } catch {
      // Malformed pack -> behave exactly as the sellable (no-pack) build.
      _cached = null;
    }
  }
  return _cached;
}

export function contextPackActive(): boolean {
  return !!pack();
}

export function contextPackId(): string {
  return pack()?.id ?? "";
}

// Extra grounding text for a specialist when a pack is active; "" in sellable mode.
export function contextPackGrounding(agentId: string): string {
  const p = pack();
  if (!p) return "";
  const parts: string[] = [];
  if (p.shared && p.shared.trim()) parts.push(p.shared.trim());
  const per = p.agents?.[agentId];
  if (typeof per === "string" && per.trim()) parts.push(per.trim());
  return parts.join("\n\n");
}
