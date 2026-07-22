"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ModeAware from "@/components/ModeAware";
import { Icon } from "@/components/icons";

const CADENCE_PRESETS = [
  { label: "Manual", detail: "Only when you ask", value: 0 },
  { label: "Hourly", detail: "Fast monitoring", value: 1 },
  { label: "Every 6 hours", detail: "Four checks a day", value: 6 },
  { label: "Daily", detail: "Recommended for most teams", value: 24 },
  { label: "Weekly", detail: "Low activity accounts", value: 168 },
];

export default function Settings() {
  const [averageSale, setAverageSale] = useState(200);
  const [marginPercent, setMarginPercent] = useState(60);
  const [monthlyBudget, setMonthlyBudget] = useState<number | "">("");
  const [closeRatePercent, setCloseRatePercent] = useState<number | "">("");
  const [name, setName] = useState("");
  const [syncHours, setSyncHours] = useState(24);
  const [customMode, setCustomMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/org-settings").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Settings could not be loaded.");
      const settings = payload.settings || {};
      setAverageSale(settings.average_sale_value ?? 200);
      setMarginPercent(Math.round((settings.gross_margin ?? 0.6) * 100));
      setName(settings.name || "");
      setMonthlyBudget(settings.monthly_budget ?? "");
      setCloseRatePercent(settings.lead_close_rate == null ? "" : Math.round(settings.lead_close_rate * 100));
      const hours = settings.sync_interval_hours ?? 24;
      setSyncHours(hours);
      setCustomMode(!CADENCE_PRESETS.some((preset) => preset.value === hours));
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Settings could not be loaded.")).finally(() => setLoaded(true));
  }, []);

  const cleanHours = Math.min(8760, Math.max(0, Math.round(Number(syncHours) || 0)));
  const margin = Math.min(1, Math.max(0.01, marginPercent / 100));
  const closeRate = closeRatePercent === "" ? null : Math.min(1, Math.max(0, Number(closeRatePercent) / 100));
  const breakEvenCpa = averageSale * margin;
  const breakEvenRoas = 1 / margin;
  const breakEvenCpl = closeRate && closeRate > 0 ? breakEvenCpa * closeRate : null;
  const valid = averageSale > 0 && marginPercent >= 1 && marginPercent <= 100 && (monthlyBudget === "" || monthlyBudget >= 0) && (closeRatePercent === "" || (closeRatePercent >= 0 && closeRatePercent <= 100));

  async function save() {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/org-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ average_sale_value: Number(averageSale), gross_margin: margin, sync_interval_hours: cleanHours, monthly_budget: monthlyBudget === "" ? null : Number(monthlyBudget), lead_close_rate: closeRate }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Check the values and try again.");
      setMessage("Settings saved. New audits will use these economics and sync controls.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Settings could not be saved."); }
    finally { setBusy(false); }
  }

  const cadenceLabel = cleanHours <= 0 ? "Manual only" : cleanHours === 1 ? "Every hour" : cleanHours < 24 ? `Every ${cleanHours} hours` : cleanHours === 24 ? "Daily" : cleanHours === 168 ? "Weekly" : cleanHours % 24 === 0 ? `Every ${cleanHours / 24} days` : `Every ${cleanHours} hours`;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <PageHeader eyebrow="Workspace configuration" title="Settings" subtitle={`Teach AdPilot how your business makes money${name ? ` for ${name}` : ""}. These values anchor break-even and pacing; they are not generic industry benchmarks.`} action={<Link href="/connect" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm"><Icon name="link" size={16} /> Connections</Link>} />

      {!loaded ? <div className="h-96 animate-pulse rounded-3xl bg-border-subtle" /> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-ink">Business economics</h2><p className="mt-1 text-sm text-muted">Used to calculate your own break-even lines.</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><Icon name="trend-up" size={18} /></span></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-sm font-bold text-ink">Average sale value</span><span className="relative block"><span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-muted">A$</span><input type="number" min={0.01} step="0.01" value={averageSale} onChange={(event) => setAverageSale(Number(event.target.value))} className="w-full rounded-xl border border-border-subtle bg-surface py-3 pl-10 pr-3 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand" /></span><span className="mt-1 block text-2xs text-muted">Typical revenue from one completed sale</span></label>
                <label><span className="mb-1.5 block text-sm font-bold text-ink">Gross margin</span><span className="relative block"><input type="number" min={1} max={100} step={1} value={marginPercent} onChange={(event) => setMarginPercent(Number(event.target.value))} className="w-full rounded-xl border border-border-subtle bg-surface py-3 pl-3 pr-10 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand" /><span className="absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted">%</span></span><span className="mt-1 block text-2xs text-muted">Revenue left before advertising cost</span></label>
                <label><span className="mb-1.5 block text-sm font-bold text-ink">Monthly advertising budget <span className="font-normal text-muted">(optional)</span></span><span className="relative block"><span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-muted">A$</span><input type="number" min={0} step="1" value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value === "" ? "" : Number(event.target.value))} placeholder="Not set" className="w-full rounded-xl border border-border-subtle bg-surface py-3 pl-10 pr-3 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand" /></span><span className="mt-1 block text-2xs text-muted">Enables pacing and month-end projection</span></label>
                <label><span className="mb-1.5 block text-sm font-bold text-ink">Lead-to-sale close rate <span className="font-normal text-muted">(optional)</span></span><span className="relative block"><input type="number" min={0} max={100} step="0.1" value={closeRatePercent} onChange={(event) => setCloseRatePercent(event.target.value === "" ? "" : Number(event.target.value))} placeholder="Not set" className="w-full rounded-xl border border-border-subtle bg-surface py-3 pl-3 pr-10 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand" /><span className="absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted">%</span></span><span className="mt-1 block text-2xs text-muted">For lead-generation accounts and break-even CPL</span></label>
              </div>
            </section>

            <ModeAware only="advanced">
              <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-ink">Data cadence</h2><p className="mt-1 text-sm text-muted">Choose how often connected providers check for fresh reporting data.</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><Icon name="refresh" size={18} /></span></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{CADENCE_PRESETS.map((preset) => <button key={preset.value} type="button" onClick={() => { setSyncHours(preset.value); setCustomMode(false); }} aria-pressed={!customMode && syncHours === preset.value} className={`rounded-xl border p-3 text-left ${!customMode && syncHours === preset.value ? "border-brand bg-brand-50" : "border-border-subtle hover:border-brand-200"}`}><span className={`block text-sm font-bold ${!customMode && syncHours === preset.value ? "text-brand" : "text-ink"}`}>{preset.label}</span><span className="mt-0.5 block text-2xs text-muted">{preset.detail}</span></button>)}<button type="button" onClick={() => { setCustomMode(true); if (syncHours < 1) setSyncHours(48); }} className={`rounded-xl border p-3 text-left ${customMode ? "border-brand bg-brand-50" : "border-border-subtle hover:border-brand-200"}`}><span className={`block text-sm font-bold ${customMode ? "text-brand" : "text-ink"}`}>Custom</span><span className="mt-0.5 block text-2xs text-muted">Set a specific number of hours</span></button></div>{customMode && <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-ink">Hours between checks</span><input type="number" min={1} max={8760} value={syncHours} onChange={(event) => setSyncHours(Number(event.target.value))} className="w-40 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm" /></label>}<div className="mt-4 flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-muted"><Icon name="info" size={15} className="mt-0.5 flex-shrink-0" /><span>Current selection: <b className="text-ink">{cadenceLabel}</b>. Available schedules also depend on the deployment plan. CSV imports remain manual.</span></div></section>
            </ModeAware>

            <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={save} disabled={busy || !valid} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-glow disabled:opacity-50"><Icon name="check-circle" size={16} />{busy ? "Saving..." : "Save workspace settings"}</button>{!valid && <span className="text-xs font-semibold text-bad">Check that percentages are between 0 and 100.</span>}</div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <section className="rounded-3xl border border-cockpit-edge bg-cockpit p-5 text-cockpit-ink shadow-card"><div className="text-2xs font-extrabold uppercase tracking-[0.18em] text-brand-200">Live break-even model</div><div className="mt-4 grid gap-3"><div className="rounded-2xl bg-cockpit-raised p-4"><div className="text-2xs font-bold uppercase text-cockpit-muted">Break-even CPA</div><div className="mt-1 text-3xl font-extrabold tabular-nums">A${breakEvenCpa.toFixed(2)}</div><p className="mt-1 text-2xs text-cockpit-muted">Sale value × gross margin</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-cockpit-raised p-3"><div className="text-[9px] font-bold uppercase text-cockpit-muted">Break-even ROAS</div><div className="mt-1 text-xl font-extrabold tabular-nums">{breakEvenRoas.toFixed(2)}x</div></div><div className="rounded-2xl bg-cockpit-raised p-3"><div className="text-[9px] font-bold uppercase text-cockpit-muted">Break-even CPL</div><div className="mt-1 text-xl font-extrabold tabular-nums">{breakEvenCpl == null ? "—" : `A$${breakEvenCpl.toFixed(2)}`}</div></div></div></div><p className="mt-4 text-xs leading-relaxed text-cockpit-muted">These are modelled decision lines, not forecasts. AdPilot will show the inputs beside any recommendation that uses them.</p></section>
            <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card"><div className="flex items-center gap-2 font-extrabold text-ink"><span className="text-good"><Icon name="shield" size={17} /></span> What changes after save</div><ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted"><li>Future health scores use the updated break-even economics.</li><li>Budget pacing uses the monthly amount when supplied.</li><li>Existing historical reports are kept unchanged.</li><li>No advertising budget is edited.</li></ul></section>
          </aside>
        </div>
      )}

      {(message || error) && <div role="status" className={`fixed bottom-20 right-4 z-50 flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-5 ${error ? "bg-bad" : "bg-ink"}`}><Icon name={error ? "alert-triangle" : "check-circle"} size={16} /><span>{error || message}</span><button type="button" onClick={() => { setMessage(""); setError(""); }} className="ml-2 text-white/70 underline">Close</button></div>}
    </div>
  );
}
