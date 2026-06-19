import "server-only";
import type { OrganicPostInput, OrganicPlatform } from "./types";

// Persistence for stored organic posts — the rows that feed the boost engine
// (lib/organic/account.ts). Read-only data about posts the user already published;
// nothing here edits, boosts, or charges an ad. All access is org-scoped (RLS + the
// organisation_id filter); writes go through the service-role admin client.

const COLS = "id,platform,name,posted_at,reach,impressions,engagements";

// Coerce any value to a finite, non-negative integer count (clamp negatives to 0).
const count = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const isPlatform = (v: any): v is OrganicPlatform => v === "meta" || v === "tiktok";

// Map a DB row -> the shared OrganicPostInput contract the engine/UI consume.
function rowToInput(r: any): OrganicPostInput {
  return {
    id: r.id ?? undefined,
    platform: r.platform,
    name: r.name ?? undefined,
    date: r.posted_at ?? undefined,
    reach: count(r.reach),
    impressions: count(r.impressions),
    engagements: count(r.engagements),
  };
}

/**
 * List an org's stored organic posts, newest first, mapped to OrganicPostInput.
 * Throws on DB errors so a silent failure can't masquerade as an empty account.
 */
export async function listOrganicPosts(admin: any, orgId: string): Promise<OrganicPostInput[]> {
  const { data, error } = await admin
    .from("organic_posts")
    .select(COLS)
    .eq("organisation_id", orgId)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message || "Failed to load organic posts");
  return (data || []).map(rowToInput);
}

/**
 * Save validated organic posts for an org. Coerces numeric fields, clamps negatives to 0, and
 * skips rows whose platform isn't meta/tiktok. Returns the count saved (0 if none valid).
 *
 * REPLACE semantics for the manual set: the editable list in the UI is seeded from the org's
 * stored posts, so a save means "this is my current set." We therefore clear the org's existing
 * `manual` rows first, then insert — so re-saving can never double-count reach/budget. Synced
 * rows (other `source` values) are untouched. Surfaces DB errors by throwing.
 */
export async function addOrganicPosts(admin: any, orgId: string, posts: OrganicPostInput[]): Promise<number> {
  const rows = (posts || [])
    .filter((p) => p && isPlatform(p.platform))
    .map((p) => ({
      organisation_id: orgId,
      platform: p.platform,
      name: p.name ?? null,
      posted_at: p.date ?? null,
      reach: count(p.reach),
      impressions: count(p.impressions),
      engagements: count(p.engagements),
      external_id: p.id ?? null,
      source: "manual",
    }));
  if (rows.length === 0) return 0;
  // Clear the prior manual set, then insert the current one (idempotent re-save).
  const { error: delErr } = await admin
    .from("organic_posts").delete().eq("organisation_id", orgId).eq("source", "manual");
  if (delErr) throw new Error(delErr.message || "Failed to refresh organic posts");
  const { error } = await admin.from("organic_posts").insert(rows);
  if (error) throw new Error(error.message || "Failed to save organic posts");
  return rows.length;
}

// CSV parsing lives in the shared, browser-safe lib/organic/csv so the client UI and this server
// route use ONE parser (no rule drift). Re-exported here for existing import sites.
export { parseOrganicCsv } from "./csv";
