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
 * Insert validated organic posts for an org. Coerces numeric fields, clamps negatives to 0,
 * and skips rows whose platform isn't meta/tiktok. Returns the count inserted (0 if none valid).
 * Surfaces DB errors by throwing.
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
  const { error } = await admin.from("organic_posts").insert(rows);
  if (error) throw new Error(error.message || "Failed to save organic posts");
  return rows.length;
}

// ---------------------------------------------------------------------------
// CSV parsing — PURE, no I/O, unit-testable. Accepts pasted CSV with a header
// row; tolerant of header order and casing. Recognised headers (aliases):
//   name | title | caption        -> name
//   platform                       -> platform (meta|tiktok; "facebook"/"instagram"/"fb"/"ig" -> meta)
//   date | posted_at | posted      -> date
//   reach                          -> reach
//   impressions | impr             -> impressions
//   engagements | engagement | eng -> engagements
// Rows with no valid platform, or with no numeric metrics at all, are skipped.
// ---------------------------------------------------------------------------

const HEADER_ALIASES: Record<string, keyof OrganicPostInput> = {
  name: "name", title: "name", caption: "name",
  platform: "platform",
  date: "date", posted_at: "date", posted: "date",
  reach: "reach",
  impressions: "impressions", impr: "impressions",
  engagements: "engagements", engagement: "engagements", eng: "engagements",
};

function normalisePlatform(v: string): OrganicPlatform | null {
  const s = v.trim().toLowerCase();
  if (s === "meta" || s === "facebook" || s === "instagram" || s === "fb" || s === "ig") return "meta";
  if (s === "tiktok" || s === "tt") return "tiktok";
  return null;
}

// Split a single CSV line, honouring double-quoted fields (with "" escapes).
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const toNum = (v: any): number => {
  const n = Number(String(v ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

export function parseOrganicCsv(csv: string): OrganicPostInput[] {
  const lines = String(csv ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  // Map each header column to a known field (or null to ignore it).
  const headers = splitCsvLine(lines[0]).map((h) => HEADER_ALIASES[h.toLowerCase()] ?? null);
  if (!headers.includes("platform")) return [];

  const out: OrganicPostInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const rec: Partial<Record<keyof OrganicPostInput, string>> = {};
    headers.forEach((field, idx) => {
      if (field) rec[field] = cells[idx];
    });

    const platform = normalisePlatform(rec.platform ?? "");
    if (!platform) continue; // junk / missing platform -> skip

    const reach = toNum(rec.reach);
    const impressions = toNum(rec.impressions);
    const engagements = toNum(rec.engagements);
    // A row with no numeric signal at all is junk; skip it.
    if (reach === 0 && impressions === 0 && engagements === 0) continue;

    const name = (rec.name ?? "").trim();
    const date = (rec.date ?? "").trim();
    out.push({
      platform,
      ...(name ? { name } : {}),
      ...(date ? { date } : {}),
      reach,
      impressions,
      engagements,
    });
  }
  return out;
}
