export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-56 rounded bg-[#e3e8ef]" />
      <div className="h-4 w-80 rounded bg-[#eef2f7]" />
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <div className="h-72 rounded-2xl bg-[#eef2f7]" />
        <div className="h-72 rounded-2xl bg-[#eef2f7]" />
      </div>
    </div>
  );
}
