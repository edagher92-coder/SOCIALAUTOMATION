"use client";
import { useState } from "react";

// Approve / dismiss a proposal. Read-only product: "approve" records intent only —
// it never edits a live ad.
export default function RecActions({ id }: { id: string }) {
  const [status, setStatus] = useState("open");
  const [busy, setBusy] = useState("");

  async function set(s: string) {
    setBusy(s);
    try {
      const r = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }),
      });
      if (r.ok) setStatus(s);
    } finally { setBusy(""); }
  }

  if (status !== "open") {
    return (
      <span className="text-xs font-bold">
        <span className={status === "approved" ? "text-teal" : status === "done" ? "text-band-green" : "text-muted"}>
          {status === "approved" ? "✓ Approved" : status === "done" ? "✓ Done" : "✕ Dismissed"}
        </span>
        <button onClick={() => set("open")} className="ml-2 font-normal text-muted underline">undo</button>
      </span>
    );
  }
  return (
    <div className="flex flex-shrink-0 gap-2">
      <button onClick={() => set("approved")} disabled={!!busy}
        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {busy === "approved" ? "…" : "Approve"}
      </button>
      <button onClick={() => set("dismissed")} disabled={!!busy}
        className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-muted hover:bg-white disabled:opacity-50">
        Dismiss
      </button>
    </div>
  );
}
