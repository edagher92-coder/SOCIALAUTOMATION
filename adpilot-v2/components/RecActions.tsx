"use client";
import { useState } from "react";

// Approve / dismiss a proposal. Read-only product: "approve" records intent only —
// it never edits a live ad. The PATCH is idempotent server-side, so an "undo" back
// to "open" is always safe to retry.
export default function RecActions({ id }: { id: string }) {
  const [status, setStatus] = useState("open");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState(false);

  async function set(s: string) {
    if (busy) return; // guard against double-clicks
    setBusy(s);
    setErr(false);
    try {
      const r = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (r.ok) setStatus(s);
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setBusy("");
    }
  }

  if (status !== "open") {
    return (
      <span className="flex-shrink-0 text-xs font-bold">
        <span className={status === "approved" ? "text-teal" : status === "done" ? "text-band-green" : "text-muted"}>
          {status === "approved" ? "✓ Approved" : status === "done" ? "✓ Done" : "✕ Dismissed"}
        </span>
        <button onClick={() => set("open")} disabled={!!busy} className="ml-2 font-normal text-muted underline disabled:opacity-50">
          {busy === "open" ? "…" : "undo"}
        </button>
      </span>
    );
  }
  return (
    <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-1 sm:w-auto sm:items-end">
      <div className="flex gap-2">
        <button onClick={() => set("approved")} disabled={!!busy}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50 sm:flex-none">
          {busy === "approved" ? "…" : "Approve"}
        </button>
        <button onClick={() => set("dismissed")} disabled={!!busy}
          className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted transition hover:bg-white disabled:opacity-50 sm:flex-none">
          {busy === "dismissed" ? "…" : "Dismiss"}
        </button>
      </div>
      {err && <span className="text-2xs font-semibold text-band-red">Couldn’t save — try again.</span>}
    </div>
  );
}
