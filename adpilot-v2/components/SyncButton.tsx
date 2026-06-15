"use client";
import { useState } from "react";

export default function SyncButton({ platform }: { platform: "meta" | "tiktok" }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/sync/${platform}`, { method: "POST" });
      const j = await r.json();
      setMsg(r.ok ? `Synced ${j.inserted ?? 0} rows ✅` : (j.error || "Sync failed"));
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={go} disabled={busy} className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand disabled:opacity-50">
        {busy ? "Syncing…" : "Sync now"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}
