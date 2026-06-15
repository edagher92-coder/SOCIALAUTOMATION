export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-64 rounded-xl bg-border-subtle" />
      <div className="h-4 w-96 rounded-lg bg-[#eef2f7]" />
      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <div className="h-80 rounded-2xl bg-[#eef2f7]" />
        <div className="h-80 rounded-2xl bg-[#eef2f7]" />
      </div>
    </div>
  );
}
