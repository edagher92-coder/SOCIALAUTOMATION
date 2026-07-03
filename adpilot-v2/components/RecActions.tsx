"use client";
import { useState } from "react";

// Approve / dismiss a proposal. Read-only product: "approve" records intent only —
// it never edits a live ad. The PATCH is idempotent server-side, so an "undo" back
// to "open" is always safe to retry.
//
// V7: approval is a TWO-STEP confirm-in-place. The product's promise is that actions carry
// ceremony proportional to their weight — a kill proposal should not be one accidental tap.
// Step 1 arms the button; step 2 (now labelled with the verdict + "proposal only") commits.

const VERB: Record<string, string> = {
  kill: "kill", reduce: "reduce", refresh: "refresh", scale: "scale", "fix-tracking": "fix",
};

export default function RecActions({ id, verdict }: { id: string; verdict?: string }) {
  const [status, setStatus] = useState("open");
  const [busy, setBusy] = useState("");
  const [armed, setArmed] = useState(false);
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
      if (r.ok) { setStatus(s); setArmed(false); }
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
        <span className={status === "approved" ? "text-good" : status === "done" ? "text-good" : "text-muted"}>
          {status === "approved" ? "✓ Approved" : status === "done" ? "✓ Done" : "✕ Dismissed"}
        </span>
        <button onClick={() => set("open")} disabled={!!busy} className="ml-2 font-normal text-muted underline disabled:opacity-50">
          {busy === "open" ? "…" : "undo"}
        </button>
      </span>
    );
  }

  const verb = VERB[verdict ?? ""] ?? "approve";

  return (
    <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-1 sm:w-auto sm:items-end">
      <div className="flex items-center gap-2">
        {armed ? (
          <>
            <button onClick={() => set("approved")} disabled={!!busy}
              className="flex-1 rounded-lg bg-bad px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50 sm:flex-none">
              {busy === "approved" ? "…" : `Confirm ${verb}`}
            </button>
            <button onClick={() => setArmed(false)} disabled={!!busy}
              className="rounded-lg px-2 py-2 text-xs font-semibold text-muted underline disabled:opacity-50">
              cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setArmed(true)} disabled={!!busy}
              className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-50 sm:flex-none">
              Approve
            </button>
            <button onClick={() => set("dismissed")} disabled={!!busy}
              className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted transition hover:bg-white/10 disabled:opacity-50 sm:flex-none">
              {busy === "dismissed" ? "…" : "Dismiss"}
            </button>
          </>
        )}
      </div>
      {armed && <span className="text-2xs text-muted">Proposal only — you execute the change in Ads Manager.</span>}
      {err && <span className="text-2xs font-semibold text-bad">Couldn’t save — try again.</span>}
    </div>
  );
}
