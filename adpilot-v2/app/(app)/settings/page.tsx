"use client";
import { useEffect, useState } from "react";

export default function Settings() {
  const [avg, setAvg] = useState(200);
  const [margin, setMargin] = useState(0.6);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/org-settings").then((r) => r.json()).then((j) => {
      const s = j.settings || {}; setAvg(s.average_sale_value ?? 200); setMargin(s.gross_margin ?? 0.6); setName(s.name || "");
    }).catch(() => {});
  }, []);

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/org-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ average_sale_value: +avg, gross_margin: +margin }) });
    setBusy(false); setMsg(r.ok ? "Saved ✅ — scheduled scoring uses these." : "Failed");
  }

  const beCpa = (+avg * +margin) || 0;
  const beRoas = +margin ? 1 / +margin : 0;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      <p className="mb-5 mt-1 text-muted">Economics for the current client{name ? ` — ${name}` : ""}. These drive break-even and the scheduled score.</p>
      <div className="space-y-4 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div><label className="mb-1 block text-sm font-bold">Average sale value (AUD)</label>
          <input type="number" value={avg} onChange={(e) => setAvg(+e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
        <div><label className="mb-1 block text-sm font-bold">Gross margin (0–1)</label>
          <input type="number" step="0.01" value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
        <div className="rounded-lg bg-[#f4f7fb] p-3 text-sm text-muted">
          Break-even CPA: <b>${beCpa.toFixed(2)}</b> · Break-even ROAS: <b>{beRoas.toFixed(2)}</b>
        </div>
        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "…" : "Save"}</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
