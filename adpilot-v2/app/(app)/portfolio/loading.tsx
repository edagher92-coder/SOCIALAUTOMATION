// Route-shaped skeleton for Portfolio (per-org snapshot fan-out) — matches the client-card grid
// so the heaviest agency view shows a closer skeleton while data loads.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-56 rounded-xl bg-border-subtle" />
      <div className="h-4 w-80 rounded-lg bg-border-subtle" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-border-subtle" />
        ))}
      </div>
    </div>
  );
}
