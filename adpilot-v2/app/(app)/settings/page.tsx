"use client";
import { useEffect, useState } from "react";

const CADENCE_PRESETS = [
  { label: "Off (manual only)", v: 0 },
  { label: "Hourly", v: 1 },
  { label: "Every 6 hours", v: 6 },
  { label: "Every 12 hours", v: 12 },
  { label: "Daily", v: 24 },
  { label: "Weekly", v: 168 },
];

export default function Settings() {
  const [avg, setAvg] = useState(200);
  const [margin, setMargin] = useState(0.6);
  const [name, setName] = useState("");
  const [syncHours, setSyncHours] = useState(24);
  const [customMode, setCustomMode] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/org-settings").then((r) => r.json()).then((j) => {
      const s = j.settings || {};
      setAvg(s.average_sale_value ?? 200); setMargin(s.gross_margin ?? 0.6); setName(s.name || "");
      const h = s.sync_interval_hours ?? 24;
      setSyncHours(h);
      setCustomMode(!CADENCE_PRESETS.some((p) => p.v === h));
    }).catch(() => {});
  }, []);

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/org-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ average_sale_value: +avg, gross_margin: +margin, sync_interval_hours: Math.max(0, Math.round(+syncHours)) }) });
    setBusy(false); setMsg(r.ok ? "Saved ✅ — scoring + auto-sync use these." : "Failed");
  }

  const cadenceLabel = +syncHours <= 0 ? "off" : +syncHours === 1 ? "every hour" : +syncHours < 24 ? `every ${syncHours} hours` : +syncHours === 24 ? "daily" : +syncHours === 168 ? "weekly" : `every ${syncHours} hours`;

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

        <div className="border-t border-[#eef2f7] pt-4">
          <label className="mb-1 block text-sm font-bold">Auto-sync cadence</label>
          <p className="mb-2 text-xs text-muted">How often connected Meta/TikTok accounts pull fresh data on their own. No prompts once connected. <span className="font-semibold">Pro &amp; Expert plans.</span></p>
          <select
            value={customMode ? "custom" : String(syncHours)}
            onChange={(e) => {
              if (e.target.value === "custom") { setCustomMode(true); }
              else { setCustomMode(false); setSyncHours(+e.target.value); }
            }}
            className="w-full rounded-lg border border-[#e3e8ef] p-2.5">
            {CADENCE_PRESETS.map((p) => <option key={p.v} value={String(p.v)}>{p.label}</option>)}
            <option value="custom">Custom…</option>
          </select>
          {customMode && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted">Every</span>
              <input type="number" min={1} max={8760} value={syncHours} onChange={(e) => setSyncHours(+e.target.value)}
                className="w-24 rounded-lg border border-[#e3e8ef] p-2.5" />
              <span className="text-sm text-muted">hours</span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Currently: syncs <b>{cadenceLabel}</b>. Sub-daily cadences need Vercel Pro (Hobby runs crons once a day).</p>
        </div>

        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "…" : "Save"}</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
