import "server-only";
import { META_GRAPH_VERSION } from "@/lib/meta/graph-version";
import type { OrganicPostInput } from "./types";
import { replaceSyncedPosts } from "./store";

// LIVE Meta organic-insights pull (scaffold). Pulls READ-ONLY organic post performance from a
// Facebook Page + Instagram account and stores it as `source='meta_sync'` rows in organic_posts,
// which the boost engine then analyses exactly like manually-entered posts. INERT until the
// Page/IG token + ids are configured (see app/api/cron/organic-sync) — nothing runs without them.
//
// Read-only: this only reads insights; it never edits, boosts, or charges anything. TikTok has no
// public organic-insights API, so TikTok organic stays manual/CSV (handled elsewhere).
//
// The pure mappers (mapMetaPagePosts / mapInstagramMedia) are exported for unit testing; the fetch
// wrappers add the network call. Scopes needed when going live: pages_read_engagement (Page) and
// instagram_manage_insights (IG) — hence "scaffold" until App Review grants them.

const V = META_GRAPH_VERSION;

export interface MetaOrganicConfig {
  pageToken?: string;
  pageId?: string;
  igUserId?: string;
  sinceDays?: number;
}

const truncName = (s?: string): string | undefined => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 120) : undefined;
};
const dateOnly = (iso?: string): string | undefined => (iso ? String(iso).slice(0, 10) : undefined);
const cutoffIso = (sinceDays: number) => new Date(Date.now() - sinceDays * 864e5).toISOString().slice(0, 10);

// Meta returns insights as `{ data: [{ name, values: [{ value }] }] }`. Pull one metric by name,
// coerced to a non-negative integer (0 when absent).
function insightValue(insights: any, name: string): number {
  const m = (insights?.data || []).find((x: any) => x?.name === name);
  const n = Number(m?.values?.[0]?.value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

const hasSignal = (p: OrganicPostInput) => p.reach > 0 || p.impressions > 0 || p.engagements > 0;

// --- PURE mappers (no I/O) — exported for tests. The post id is carried as OrganicPostInput.id,
// which the store persists as external_id so re-runs dedupe rather than duplicate. ---

export function mapMetaPagePosts(data: any[]): OrganicPostInput[] {
  return (data || [])
    .map((p: any): OrganicPostInput => ({
      ...(p.id ? { id: String(p.id) } : {}),
      platform: "meta",
      name: truncName(p.message),
      date: dateOnly(p.created_time),
      reach: insightValue(p.insights, "post_impressions_unique"),
      impressions: insightValue(p.insights, "post_impressions"),
      engagements: insightValue(p.insights, "post_engaged_users"),
    }))
    .filter(hasSignal);
}

export function mapInstagramMedia(data: any[]): OrganicPostInput[] {
  return (data || [])
    .map((p: any): OrganicPostInput => ({
      ...(p.id ? { id: String(p.id) } : {}),
      platform: "meta", // IG lives under the Meta umbrella in our schema
      name: truncName(p.caption),
      date: dateOnly(p.timestamp),
      reach: insightValue(p.insights, "reach"),
      impressions: insightValue(p.insights, "impressions"),
      engagements: insightValue(p.insights, "engagement"),
    }))
    .filter(hasSignal);
}

// --- Fetch wrappers (network) ---

export async function fetchMetaPageOrganic(token: string, pageId: string, sinceDays = 30): Promise<OrganicPostInput[]> {
  const since = Math.floor((Date.now() - sinceDays * 864e5) / 1000);
  const fields = "id,created_time,message,insights.metric(post_impressions_unique,post_impressions,post_engaged_users)";
  const url = `https://graph.facebook.com/${V}/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&since=${since}&limit=50&access_token=${encodeURIComponent(token)}`;
  const r = await fetch(url);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Meta Page insights error (HTTP ${r.status})`);
  return mapMetaPagePosts(j.data || []);
}

export async function fetchInstagramOrganic(token: string, igUserId: string, sinceDays = 30): Promise<OrganicPostInput[]> {
  const fields = "id,caption,timestamp,media_type,insights.metric(reach,impressions,engagement)";
  const url = `https://graph.facebook.com/${V}/${encodeURIComponent(igUserId)}/media?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(token)}`;
  const r = await fetch(url);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Instagram insights error (HTTP ${r.status})`);
  const cutoff = cutoffIso(sinceDays);
  // IG media has no `since` filter on this edge — keep only posts within the window.
  return mapInstagramMedia(j.data || []).filter((p) => !p.date || p.date >= cutoff);
}

/**
 * Pull Meta (Page + IG) organic posts for one org and store them as `meta_sync` rows. Returns the
 * count stored. INERT (no network) unless a Page token + at least one of pageId/igUserId is given.
 * Throws on a hard API error so the caller can surface it.
 */
export async function syncMetaOrganic(admin: any, orgId: string, cfg: MetaOrganicConfig): Promise<number> {
  const token = cfg.pageToken;
  if (!token || (!cfg.pageId && !cfg.igUserId)) return 0; // not configured -> no-op
  const sinceDays = cfg.sinceDays && cfg.sinceDays > 0 ? cfg.sinceDays : 30;

  const posts: OrganicPostInput[] = [];
  if (cfg.pageId) posts.push(...(await fetchMetaPageOrganic(token, cfg.pageId, sinceDays)));
  if (cfg.igUserId) posts.push(...(await fetchInstagramOrganic(token, cfg.igUserId, sinceDays)));

  return replaceSyncedPosts(admin, orgId, "meta_sync", posts);
}
