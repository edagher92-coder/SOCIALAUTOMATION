// Shared presentation for proposal verdicts (Command Center + Proposals queue).
export const VERDICT_META: Record<string, { label: string; emoji: string; cls: string; rank: number }> = {
  "fix-tracking": { label: "Fix tracking", emoji: "🛠️", cls: "text-band-red", rank: 0 },
  kill:           { label: "Kill",          emoji: "🛑", cls: "text-band-red", rank: 1 },
  reduce:         { label: "Reduce",        emoji: "🔻", cls: "text-band-orange", rank: 2 },
  refresh:        { label: "Refresh",       emoji: "♻️", cls: "text-band-yellow", rank: 3 },
  scale:          { label: "Scale",         emoji: "🚀", cls: "text-band-green", rank: 4 },
};

export function verdictMeta(v: string) {
  return VERDICT_META[v] || { label: v, emoji: "•", cls: "text-muted", rank: 9 };
}

// Maps an engine verdict key (hyphenated/lowercase) to its plain-English entry in
// METRIC_GLOSSARY (spaced Title Case), so the "?" help tips can explain each verdict.
export const VERDICT_GLOSSARY_KEY: Record<string, string> = {
  "fix-tracking": "Fix tracking",
  kill: "Kill",
  reduce: "Reduce",
  refresh: "Refresh",
  scale: "Scale",
};

export const BAND_META: Record<string, { label: string; chip: string; bar: string }> = {
  Green:  { label: "Healthy",        chip: "bg-band-green/10 text-band-green",  bar: "bg-band-green" },
  Yellow: { label: "Watch",          chip: "bg-band-yellow/10 text-band-yellow", bar: "bg-band-yellow" },
  Orange: { label: "At risk",        chip: "bg-band-orange/10 text-band-orange", bar: "bg-band-orange" },
  Red:    { label: "Needs action",   chip: "bg-band-red/10 text-band-red",     bar: "bg-band-red" },
};

export function bandMeta(b?: string) {
  return BAND_META[b || ""] || { label: "No score yet", chip: "bg-white/10 text-white/70", bar: "bg-white/30" };
}

export function cadenceText(hours?: number | null): string {
  const h = Number(hours ?? 24);
  if (!h || h <= 0) return "manual only";
  if (h === 0.5) return "every 30 min";
  if (h === 1) return "hourly";
  if (h < 24) return `every ${h}h`;
  if (h === 24) return "daily";
  if (h === 168) return "weekly";
  return `every ${h}h`;
}

// Only these verdicts are surfaced as actionable proposals. Engine verdicts like
// "keep", "duplicate" and "insufficient-data" are informational and must never
// pollute the open Proposals queue.
export const ACTIONABLE_VERDICTS = new Set([
  "scale",
  "kill",
  "reduce",
  "refresh",
  "fix-tracking",
]);

export interface DecisionLike {
  verdict: string;
  name?: string;
  platform?: string;
  reason?: string;
  proposal?: string;
}

export interface RecommendationRow {
  organisation_id: string;
  verdict: string;
  entity_name: string;
  platform: string;
  reason?: string;
  proposal?: string;
}

// Turn engine decisions into the de-duplicated, actionable-only recommendation
// rows that back the Proposals queue. Dedupe is platform-aware so the same
// campaign name on Meta and TikTok is kept distinct. Pure + deterministic so it
// can be unit-tested without a database.
export function buildRecommendationRows(
  orgId: string,
  decisions: DecisionLike[] | null | undefined,
): RecommendationRow[] {
  const seen = new Set<string>();
  const rows: RecommendationRow[] = [];
  for (const d of decisions || []) {
    if (!d || !ACTIONABLE_VERDICTS.has(d.verdict)) continue;
    const name = d.name || "(ad)";
    const platform = d.platform || "?";
    const k = `${platform}|${name}|${d.verdict}`;
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push({
      organisation_id: orgId,
      verdict: d.verdict,
      entity_name: name,
      platform,
      reason: d.reason,
      proposal: d.proposal,
    });
  }
  return rows;
}

// Refresh the open Proposals queue for an org from a fresh analysis. Replaces
// only the 'open' set (approved/dismissed/done history is preserved) and is
// idempotent: re-running with the same decisions yields the same open queue.
// Inserts the new rows first, then clears the *previously* open rows, so a
// failed insert never leaves the user with an empty queue.
export async function refreshOpenRecommendations(
  admin: any,
  orgId: string,
  decisions: DecisionLike[] | null | undefined,
): Promise<{ inserted: number; cleared: number }> {
  const rows = buildRecommendationRows(orgId, decisions);

  // Snapshot the ids that are currently open so we can remove exactly those
  // after the new set lands (avoids deleting rows we just inserted).
  const { data: prior } = await admin
    .from("recommendations")
    .select("id")
    .eq("organisation_id", orgId)
    .eq("status", "open");
  const priorIds = (prior || []).map((r: any) => r.id);

  let inserted = 0;
  if (rows.length) {
    const { error } = await admin.from("recommendations").insert(rows);
    // If the insert fails, leave the existing queue untouched rather than
    // wiping it and showing the user nothing.
    if (error) return { inserted: 0, cleared: 0 };
    inserted = rows.length;
  }

  let cleared = 0;
  if (priorIds.length) {
    await admin.from("recommendations").delete().in("id", priorIds);
    cleared = priorIds.length;
  }

  return { inserted, cleared };
}
