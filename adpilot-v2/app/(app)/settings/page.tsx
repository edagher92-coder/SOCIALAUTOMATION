"use client";
import { useEffect, useState } from "react";

const CADENCE_PRESETS = [
  { label: "Off (manual only)", v: 0 },
  { label: "Every 30 minutes", v: 0.5 },
  { label: "Hourly", v: 1 },
  { label: "Every 6 hours", v: 6 },
  { label: "Every 12 hours", v: 12 },
  { label: "Daily", v: 24 },
  { label: "Weekly", v: 168 },
];

export default function Settings() {
  const [avg, setAvg] = useState(200);
  const [margin, setMargin] = useState(0.6);
  const [budget, setBudget] = useState<number | "">("");
  const [closeRate, setCloseRate] = useState<number | "">("");
  const [name, setName] = useState("");
  const [syncHours, setSyncHours] = useState(24);
  const [customMode, setCustomMode] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/org-settings").then((r) => r.json()).then((j) => {
      const s = j.settings || {};
      setAvg(s.average_sale_value ?? 200); setMargin(s.gross_margin ?? 0.6); setName(s.name || "");
      setBudget(s.monthly_budget ?? "");
      setCloseRate(s.lead_close_rate ?? "");
      const h = s.sync_interval_hours ?? 24;
      setSyncHours(h);
      setCustomMode(!CADENCE_PRESETS.some((p) => p.v === h));
    }).catch(() => {});
  }, []);

  // Clamp the cadence to the nearest half-hour in the supported 0–8760h range (matches the API schema).
  const cleanHours = Math.min(8760, Math.max(0, Math.round((Number(syncHours) || 0) * 2) / 2));

  async function save() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/org-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ average_sale_value: +avg, gross_margin: +margin, sync_interval_hours: cleanHours, monthly_budget: budget === "" ? null : +budget, lead_close_rate: closeRate === "" ? null : +closeRate }) });
      setMsg(r.ok ? "Saved ✅ — scoring + auto-sync now use these." : "Couldn't save — check the values and try again.");
    } catch {
      setMsg("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const h = cleanHours;
  const cadenceLabel = h <= 0 ? "off (manual only)" : h === 0.5 ? "every 30 minutes" : h === 1 ? "every hour" : h < 24 ? `every ${h} hours` : h === 24 ? "daily" : h === 168 ? "weekly" : h % 24 === 0 ? `every ${h / 24} days` : `every ${h} hours`;

  const beCpa = (+avg * +margin) || 0;
  const beRoas = +margin ? 1 / +margin : 0;
  const beCpl = closeRate !== "" && +closeRate > 0 ? beCpa * +closeRate : null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      <p className="mb-5 mt-1 text-muted">Economics for the current client{name ? ` — ${name}` : ""}. These drive break-even and the scheduled score.</p>
      <div className="space-y-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div><label className="mb-1 block text-sm font-bold">Average sale value (AUD)</label>
          <input type="number" value={avg} onChange={(e) => setAvg(+e.target.value)} className="w-full rounded-lg border border-border-subtle p-2.5" /></div>
        <div><label className="mb-1 block text-sm font-bold">Gross margin (0–1)</label>
          <input type="number" step="0.01" value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full rounded-lg border border-border-subtle p-2.5" /></div>
        <div className="rounded-lg bg-surface p-3 text-sm text-muted">
          Break-even CPA: <b>${beCpa.toFixed(2)}</b> · Break-even ROAS: <b>{beRoas.toFixed(2)}</b>
          {beCpl != null && <> · Break-even CPL: <b>${beCpl.toFixed(2)}</b></>}
        </div>
        <div><label className="mb-1 block text-sm font-bold">Lead→sale close rate (0–1) — optional</label>
          <input type="number" step="0.01" min={0} max={1} value={closeRate} onChange={(e) => setCloseRate(e.target.value === "" ? "" : +e.target.value)} placeholder="e.g. 0.1 if 10% of leads become sales"
            className="w-full rounded-lg border border-border-subtle p-2.5" />
          <p className="mt-1 text-xs text-muted">For <b>lead-gen</b> accounts: what fraction of leads turn into sales. Set it to judge cost-per-lead against a modelled <b>break-even CPL</b>. Left blank, lead-only accounts get the conservative lead-quality read instead.</p></div>
        <div><label className="mb-1 block text-sm font-bold">Monthly ad budget (AUD) — optional</label>
          <input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value === "" ? "" : +e.target.value)} placeholder="Leave blank to skip pacing"
            className="w-full rounded-lg border border-border-subtle p-2.5" />
          <p className="mt-1 text-xs text-muted">Set this to activate the <b>budget-pacing</b> health factor (pro-rata target vs spend, month-end projection). Left blank, pacing stays neutral.</p></div>

        <div className="border-t border-border-subtle pt-4">
          <label className="mb-1 block text-sm font-bold">Auto-sync cadence</label>
          <p className="mb-2 text-xs text-muted">How often connected Meta/TikTok accounts pull fresh data on their own. No prompts once connected. <span className="font-semibold">Pro &amp; Expert plans.</span></p>
          <select
            value={customMode ? "custom" : String(syncHours)}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setCustomMode(true);
                // Seed a sensible custom value if the current one isn't usable as "every N hours".
                if (!(+syncHours >= 1)) setSyncHours(48);
              } else { setCustomMode(false); setSyncHours(+e.target.value); }
            }}
            className="w-full rounded-lg border border-border-subtle p-2.5">
            {CADENCE_PRESETS.map((p) => <option key={p.v} value={String(p.v)}>{p.label}</option>)}
            <option value="custom">Custom…</option>
          </select>
          {customMode && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted">Every</span>
              <input type="number" min={1} max={8760} value={syncHours} onChange={(e) => setSyncHours(+e.target.value)}
                className="w-24 rounded-lg border border-border-subtle p-2.5" />
              <span className="text-sm text-muted">hours (1–8760)</span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Currently: syncs <b>{cadenceLabel}</b> — applies to connected Meta/TikTok accounts only; CSV imports are unaffected. The scheduler sweeps every 30 minutes and only pulls once your chosen cadence is due; sub-daily cadences need Vercel Pro (Hobby runs crons once a day).</p>
        </div>

        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "…" : "Save"}</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
