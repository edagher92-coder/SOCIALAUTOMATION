// Shared, PURE, browser-safe CSV parsing for the organic-post suite. No I/O, no `server-only`,
// so BOTH the server ingest route (via lib/organic/store) and the client account UI import the
// SAME parser — one set of rules (quote-aware, header-alias tolerant), no drift between paths.
// Accepts pasted CSV with a header row; tolerant of header order and casing. Recognised headers:
//   name | title | caption        -> name
//   platform                       -> platform (meta|tiktok; facebook/instagram/fb/ig -> meta)
//   date | posted_at | posted      -> date
//   reach                          -> reach
//   impressions | impr             -> impressions
//   engagements | engagement | eng -> engagements
// Rows with no recognised platform, or no numeric metric at all, are skipped.
import type { OrganicPostInput, OrganicPlatform } from "./types";

const HEADER_ALIASES: Record<string, keyof OrganicPostInput> = {
  name: "name", title: "name", caption: "name",
  platform: "platform",
  date: "date", posted_at: "date", posted: "date",
  reach: "reach",
  impressions: "impressions", impr: "impressions",
  engagements: "engagements", engagement: "engagements", eng: "engagements",
};

export function normaliseOrganicPlatform(v: string): OrganicPlatform | null {
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

    const platform = normaliseOrganicPlatform(rec.platform ?? "");
    if (!platform) continue; // junk / missing platform -> skip

    const reach = toNum(rec.reach);
    const impressions = toNum(rec.impressions);
    const engagements = toNum(rec.engagements);
    if (reach === 0 && impressions === 0 && engagements === 0) continue; // no signal -> skip

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
