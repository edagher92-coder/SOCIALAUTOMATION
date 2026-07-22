"use client";

import { useState } from "react";
import { Icon } from "./icons";

// Approval records the user's plan inside AdPilot. It never writes to a paid-ad account.
export default function RecActions({ id, verdict }: { id: string; verdict?: string }) {
  const [status, setStatus] = useState("open");
  const [busy, setBusy] = useState("");
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState(false);

  async function update(next: string) {
    if (busy) return;
    setBusy(next); setError(false);
    try {
      const response = await fetch(`/api/recommendations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      if (response.ok) { setStatus(next); setArmed(false); }
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy("");
    }
  }

  if (status !== "open") {
    return (
      <div className="flex flex-shrink-0 items-center gap-2 text-xs font-bold">
        <span className={`inline-flex items-center gap-1.5 ${status === "approved" || status === "done" ? "text-green-700" : "text-muted"}`}>
          <Icon name={status === "dismissed" ? "x" : "check-circle"} size={14} />
          {status === "approved" ? "Saved to worklist" : status === "done" ? "Completed" : "Not now"}
        </span>
        <button onClick={() => update("open")} disabled={Boolean(busy)} className="font-semibold text-muted underline disabled:opacity-50">Undo</button>
      </div>
    );
  }

  const highImpact = verdict === "kill" || verdict === "reduce" || verdict === "scale";
  return (
    <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
      {armed ? (
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-2.5">
          <p className="mb-2 max-w-[250px] text-2xs font-semibold leading-relaxed text-amber-900">Save this as planned? This only updates your AdPilot worklist. It does not change the live ad.</p>
          <div className="flex gap-2">
            <button onClick={() => update("approved")} disabled={Boolean(busy)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${highImpact ? "bg-ink" : "bg-brand"}`}>{busy === "approved" ? "Saving..." : "Confirm plan"}</button>
            <button onClick={() => setArmed(false)} disabled={Boolean(busy)} className="rounded-lg px-2 py-2 text-xs font-bold text-muted underline">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setArmed(true)} disabled={Boolean(busy)} className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-50 sm:flex-none">Save as planned</button>
          <button onClick={() => update("dismissed")} disabled={Boolean(busy)} className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted hover:bg-surface disabled:opacity-50 sm:flex-none">{busy === "dismissed" ? "Saving..." : "Not now"}</button>
        </div>
      )}
      {error && <span className="text-2xs font-semibold text-bad">Could not save. Try again.</span>}
    </div>
  );
}
