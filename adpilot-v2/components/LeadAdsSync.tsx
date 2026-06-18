"use client";
import { useState } from "react";

// Manual "Sync lead-ads leads" for a Meta-connected org. Calls the read-only ingest route
// (/api/leads/sync-meta) which pulls lead-gen leads, hashes PII, and feeds the lead-quality
// loop. Mirrors SyncButton's UX: success shows the count; failures show the server's message.
export default function LeadAdsSync() {
  const [forms, setForms] = useState("");
  const [days, setDays] = useState(30);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go() {
    const formIds = forms.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!formIds.length) { setOk(false); setMsg("Enter at least one lead-form ID."); return; }
    setBusy(true); setMsg(""); setOk(false);
    try {
      const r = await fetch("/api/leads/sync-meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formIds, sinceDays: days }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setOk(true); const n = j.synced ?? 0; setMsg(`Synced ${n} lead${n === 1 ? "" : "s"} into your lead-quality loop ✅`); }
      else { setOk(false); setMsg(j.error || `Sync failed (HTTP ${r.status})`); }
    } catch (e: any) { setOk(false); setMsg(e?.message || "Network error — try again."); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
      <h3 className="font-bold">📥 Sync Facebook Lead Ads leads</h3>
      <p className="mb-3 mt-1 text-sm text-muted">
        Pull lead-form leads into your lead-quality loop (read-only — only hashed contact details
        are stored, never plaintext). Paste your lead-form IDs (comma or space separated).
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input value={forms} onChange={(e) => setForms(e.target.value)} placeholder="e.g. 123456789012345, 987654321098765"
          className="rounded-lg border border-border-subtle p-2 text-sm" aria-label="Meta lead-form IDs" />
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-border-subtle p-2 text-sm" aria-label="Lookback window">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button onClick={go} disabled={busy} aria-busy={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Syncing…" : "Sync leads"}
        </button>
      </div>
      {msg && <p className={`mt-2 text-xs ${ok ? "text-green-600" : "text-red-600"}`} role="status">{msg}</p>}
      <p className="mt-2 text-2xs text-muted">Needs a Meta Page token with <code className="rounded bg-surface px-1">leads_retrieval</code>. Find form IDs under your Page → Lead Center / Forms Library.</p>
    </div>
  );
}
