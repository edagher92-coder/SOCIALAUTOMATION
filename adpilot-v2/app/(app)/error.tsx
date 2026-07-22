"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const reference = error.digest || "local-screen-error";
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-bad/25 bg-white p-7 text-center shadow-card sm:p-9">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bad/10 text-bad"><Icon name="alert-triangle" size={23} /></span>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">This screen did not load</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Your data has not been changed. Try the request again, or return to Today and check connection health.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"><Icon name="refresh" size={15} /> Try again</button><Link href="/command" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink"><Icon name="radar" size={15} /> Go to Today</Link><Link href="/connect" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink"><Icon name="link" size={15} /> Check connections</Link></div>
      <p className="mt-5 text-2xs text-muted">Support reference: <code className="rounded bg-surface px-1.5 py-1 text-ink">{reference}</code></p>
    </div>
  );
}
