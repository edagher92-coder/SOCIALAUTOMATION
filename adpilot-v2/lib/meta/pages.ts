import "server-only";
import { META_GRAPH_BASE } from "@/lib/meta/graph-version";
import { metaTokenError } from "@/lib/meta/token-error";

// Resolve the Facebook Pages a Meta token manages, with the numeric ids the rest of the app
// needs but Meta hides behind Business Manager: each Page's id (→ META_PAGE_ID, used by the
// publish, organic-sync and Messenger paths) and its connected Instagram Business account id
// (→ IG_USER_ID). READ-ONLY: this only reads /me/accounts; it never posts, edits or stores
// anything. Deliberately a discovery helper — it does NOT return the per-Page access tokens to
// the browser, so a leaked response can't be replayed against the Graph API.

export interface ManagedPage {
  id: string;
  name: string;
  igUserId?: string;
  igUsername?: string;
  // The viewer's granted tasks on the Page (e.g. MANAGE, CREATE_CONTENT) when present —
  // lets the UI flag a Page the token can read but not publish to. Never includes a token.
  tasks?: string[];
}

// --- PURE mapper (no I/O) — exported for tests. Tolerates the partial shapes Meta returns
// (missing instagram_business_account, missing tasks) and drops entries with no id. ---
export function mapManagedPages(data: any[]): ManagedPage[] {
  return (data || [])
    .map((p: any): ManagedPage | null => {
      const id = String(p?.id || "").trim();
      if (!id) return null;
      const ig = p?.instagram_business_account || {};
      const igUserId = String(ig?.id || "").trim() || undefined;
      const igUsername = String(ig?.username || "").trim() || undefined;
      const tasks = Array.isArray(p?.tasks) ? p.tasks.map((t: any) => String(t)).filter(Boolean) : undefined;
      return {
        id,
        name: String(p?.name || "").trim() || `Page ${id}`,
        ...(igUserId ? { igUserId } : {}),
        ...(igUsername ? { igUsername } : {}),
        ...(tasks && tasks.length ? { tasks } : {}),
      };
    })
    .filter((p): p is ManagedPage => p !== null);
}

// --- Fetch wrapper (network). Throws a precise, action-oriented message on a Meta error so
// callers can surface exactly what to fix (expired / revoked / wrong scopes). ---
export async function listManagedPages(token: string): Promise<ManagedPage[]> {
  // instagram_business_account is sub-selected with {id,username} so we get the IG user id in
  // the same round-trip. `tasks` reveals what the token may do on each Page (read vs publish).
  const fields = "id,name,tasks,instagram_business_account{id,username}";
  const r = await fetch(
    `${META_GRAPH_BASE}/me/accounts?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(token)}`,
  );
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(metaTokenError(j, r.status));
  return mapManagedPages(j.data || []);
}
