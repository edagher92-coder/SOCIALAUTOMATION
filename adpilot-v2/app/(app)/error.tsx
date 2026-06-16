"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-card">
      <div className="text-3xl">⚠️</div>
      <h2 className="mt-2 text-lg font-bold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-bold text-white">Try again</button>
      <p className="mt-3 text-xs text-muted">If it persists, see the User Manual → Error reporting.</p>
    </div>
  );
}
