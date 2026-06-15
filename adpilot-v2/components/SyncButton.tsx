"use client";
import { useState } from "react";

// Manual "Sync now" for one connected platform. Mirrors the idempotent server puller:
// success reports the row count; failures (token expired, plan gate, API error) show the
// server's message so the user knows exactly what to fix.
export default function SyncButton({ platform }: { platform: "meta" | "tiktok" }) {
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setMsg(""); setOk(false);
    try {
      const r = await fetch(`/api/sync/${platform}`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setOk(true);
        const n = j.inserted ?? 0;
        setMsg(`Synced ${n} row${n === 1 ? "" : "s"} ✅`);
      } else {
        setOk(false);
        setMsg(j.error || `Sync failed (HTTP ${r.status})`);
      }
    } catch (e: any) {
      setOk(false);
      setMsg(e?.message || "Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={go} disabled={busy} aria-busy={busy}
        className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand disabled:opacity-50">
        {busy ? "Syncing…" : "Sync now"}
      </button>
      {msg && <span className={`text-xs ${ok ? "text-green-600" : "text-red-600"}`} role="status">{msg}</span>}
    </span>
  );
}
