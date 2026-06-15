// Tolerant JSON extraction from a model reply (used by the knowledge-refresh cron).
// In lib/ — NOT the route file — because Next.js route modules may only export HTTP
// handlers + config; a helper export from route.ts fails the production build.
// Handles, in order: (1) a clean JSON object, (2) a ```json … ``` fenced block,
// (3) a JSON object embedded in prose, (4) a brace-balanced scan (string-aware) so a
// valid object is recovered even when trailing prose adds a stray '}'. null on garbage.
export function parseJson(text: string): any | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const v = JSON.parse(trimmed);
    if (v && typeof v === "object") return v;
  } catch { /* fall through */ }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  if (start < 0) return null;

  const wide = raw.lastIndexOf("}");
  if (wide > start) {
    try {
      const v = JSON.parse(raw.slice(start, wide + 1));
      if (v && typeof v === "object") return v;
    } catch { /* fall through to a brace-balanced scan */ }
  }

  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try {
        const v = JSON.parse(raw.slice(start, i + 1));
        return v && typeof v === "object" ? v : null;
      } catch { return null; }
    }
  }
  return null;
}
