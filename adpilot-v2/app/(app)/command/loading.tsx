// Route-shaped skeleton for the Command Centre (7 parallel queries) — closer to the final
// layout than the generic group skeleton, so less layout shift and faster perceived load.
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-44 rounded-3xl bg-border-subtle" />
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          <div className="h-6 w-48 rounded-lg bg-border-subtle" />
          <div className="h-20 rounded-2xl bg-border-subtle" />
          <div className="h-20 rounded-2xl bg-border-subtle" />
          <div className="h-20 rounded-2xl bg-border-subtle" />
        </div>
        <div className="space-y-5">
          <div className="h-32 rounded-2xl bg-border-subtle" />
          <div className="h-28 rounded-2xl bg-border-subtle" />
        </div>
      </div>
    </div>
  );
}
