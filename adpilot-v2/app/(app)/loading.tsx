export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse" aria-label="Loading workspace" aria-busy="true">
      <div className="h-3 w-28 rounded-full bg-border-subtle" />
      <div className="mt-3 h-8 w-72 max-w-full rounded-xl bg-border-subtle" />
      <div className="mt-3 h-4 w-[32rem] max-w-full rounded-lg bg-border-subtle" />
      <div className="mt-7 grid gap-4 md:grid-cols-3"><div className="h-36 rounded-3xl bg-border-subtle" /><div className="h-36 rounded-3xl bg-border-subtle" /><div className="h-36 rounded-3xl bg-border-subtle" /></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><div className="h-80 rounded-3xl bg-border-subtle" /><div className="h-80 rounded-3xl bg-border-subtle" /></div>
      <span className="sr-only">Loading the latest workspace data</span>
    </div>
  );
}
