// Reusable trust chip reinforcing AdPilot's core invariant: read-only, never edits.
// Presentational only — safe to drop anywhere (server or client tree).
export default function ReadOnlyBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="AdPilot connects with read-only scopes and never edits, pauses, or creates ads."
      className={`inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-bold text-teal ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
      Read-only · never edits your ads
    </span>
  );
}
