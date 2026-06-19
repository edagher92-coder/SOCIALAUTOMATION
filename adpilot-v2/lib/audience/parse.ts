import type { AgeGenderRow, NamedShare } from "./types";

// Pure parsers that turn raw platform-insight payloads into the AudienceInsights shapes.
// Kept free of "server-only"/IO so they're unit-testable (the live fetch wraps them in live.ts).

const AGE_BRACKETS = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const r1 = (n: number) => Math.round(n * 10) / 10;

// Gender×age as a flat map keyed "F.25-34" / "M.18-24" / "U.65+" (counts) → %-of-total
// AgeGenderRow[] (unknown-gender split evenly so the rows still sum to ~100).
export function metaGenderAgeToRows(map: Record<string, number>): AgeGenderRow[] {
  const total = Object.values(map).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  const rows: AgeGenderRow[] = [];
  for (const b of AGE_BRACKETS) {
    const f = Number(map[`F.${b}`]) || 0;
    const m = Number(map[`M.${b}`]) || 0;
    const u = Number(map[`U.${b}`]) || 0;
    if (!f && !m && !u) continue;
    rows.push({ bracket: b, female: r1(((f + u / 2) / total) * 100), male: r1(((m + u / 2) / total) * 100) });
  }
  return rows;
}

// A {label: count} map (countries, cities, locales) → top-N NamedShare[] as % of total, desc.
export function shareMapToNamed(map: Record<string, number>, topN = 7): NamedShare[] {
  const total = Object.values(map).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  return Object.entries(map)
    .map(([name, v]) => ({ name, share: r1(((Number(v) || 0) / total) * 100) }))
    .filter((x) => x.share > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, topN);
}

// online_followers → a 24-length 0–100 activity curve (normalised to the busiest hour).
export function onlineToHourly(byHour: Record<string, number> | number[]): number[] {
  const arr = Array.isArray(byHour)
    ? byHour.slice(0, 24)
    : Array.from({ length: 24 }, (_, h) => Number(byHour[String(h)]) || 0);
  const peak = Math.max(1, ...arr.map((v) => Number(v) || 0));
  const out = Array.from({ length: 24 }, (_, h) => Math.round(((Number(arr[h]) || 0) / peak) * 100));
  return out;
}
