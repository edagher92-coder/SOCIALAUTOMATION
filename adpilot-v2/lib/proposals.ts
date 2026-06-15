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
  if (h === 1) return "hourly";
  if (h < 24) return `every ${h}h`;
  if (h === 24) return "daily";
  if (h === 168) return "weekly";
  return `every ${h}h`;
}
