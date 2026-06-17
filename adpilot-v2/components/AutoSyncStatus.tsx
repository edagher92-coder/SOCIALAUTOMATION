// Compact live auto-sync status: cadence + last-pull age. Presentational; the page
// supplies the numbers so this stays DB-free and reusable across Connect/Command.
function ago(iso?: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function AutoSyncStatus({
  cadence,
  lastSyncedAt,
  className = "",
}: {
  cadence: string;
  lastSyncedAt?: string | null;
  className?: string;
}) {
  const live = cadence !== "manual only";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 py-1 text-xs font-semibold text-muted ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-teal animate-live-pulse" : "bg-muted/40"}`} aria-hidden />
      {live ? <>Auto-sync <b className="text-ink">{cadence}</b> · last pull {ago(lastSyncedAt)}</> : <>Auto-sync off · manual only</>}
    </span>
  );
}
