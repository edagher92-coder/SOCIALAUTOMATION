"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "./PageHeader";
import { Icon } from "./icons";

type Rule = {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  window_days?: number;
  min_volume_gate?: number;
  min_spend_gate?: number;
  severity: "info" | "warning" | "critical";
  scope: string;
  platform?: string | null;
  enabled: boolean;
  message?: string;
  persisted: boolean;
  preview_fires: number;
};

type RulesPayload = {
  rules: Rule[];
  persisted: boolean;
  tableAvailable: boolean;
  canManage: boolean;
  plan: string;
  lastDataDate?: string | null;
};

const OPERATOR_LABEL: Record<string, string> = {
  gt: "is above", gte: "is at or above", lt: "is below", lte: "is at or below", eq: "equals",
  zscore_gt: "spikes above its baseline", zscore_lt: "drops below its baseline",
  pct_change_gt: "rises week over week", pct_change_lt: "drops week over week",
};

const METRIC_LABEL: Record<string, string> = {
  spend: "Spend", cpl: "Cost per lead", cpa: "Cost per acquisition", cpc: "Cost per click",
  cpm: "Cost per 1,000", ctr: "Click-through rate", roas: "ROAS", frequency: "Frequency",
  leads: "Leads", purchases: "Purchases", conversions: "Conversions",
};

function formatThreshold(rule: Rule): string {
  if (rule.operator.startsWith("pct_change")) return `${Math.abs(rule.threshold * 100)}%`;
  if (rule.metric === "ctr") return `${(rule.threshold * 100).toFixed(1)}%`;
  if (["spend", "cpl", "cpa", "cpc", "cpm"].includes(rule.metric)) return `$${rule.threshold.toLocaleString()}`;
  if (rule.metric === "roas") return `${rule.threshold}x`;
  return rule.threshold.toLocaleString();
}

function severityClasses(severity: Rule["severity"]): string {
  if (severity === "critical") return "bg-bad/10 text-bad border-bad/20";
  if (severity === "warning") return "bg-warn/10 text-amber-800 border-warn/30";
  return "bg-ice/10 text-blue-700 border-ice/20";
}

export default function AutomationStudio() {
  const [data, setData] = useState<RulesPayload | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", metric: "frequency", operator: "gte", threshold: "4", severity: "warning", scope: "campaign" });

  async function load() {
    const response = await fetch("/api/automation/rules", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setData(payload);
    else setMessage(payload.error || "Automation rules could not be loaded.");
  }

  useEffect(() => { void load(); }, []);

  const activeCount = useMemo(() => data?.rules.filter((rule) => rule.enabled).length || 0, [data]);
  const previewCount = useMemo(() => data?.rules.reduce((sum, rule) => sum + rule.preview_fires, 0) || 0, [data]);

  async function installPresets() {
    setBusy("install"); setMessage("");
    const response = await fetch("/api/automation/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "install-presets" }) });
    const payload = await response.json();
    setBusy("");
    if (!response.ok) { setMessage(payload.error || "Could not install the rules."); return; }
    setMessage(`${payload.installed || 0} starter rules installed.`);
    await load();
  }

  async function toggle(rule: Rule) {
    if (!rule.persisted) return installPresets();
    setBusy(rule.id); setMessage("");
    const response = await fetch("/api/automation/rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }) });
    const payload = await response.json();
    setBusy("");
    if (!response.ok) { setMessage(payload.error || "Could not update the rule."); return; }
    setData((current) => current ? { ...current, rules: current.rules.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) } : current);
  }

  async function createRule(event: React.FormEvent) {
    event.preventDefault();
    setBusy("create"); setMessage("");
    const response = await fetch("/api/automation/rules", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "create", ...form, threshold: Number(form.threshold) }),
    });
    const payload = await response.json();
    setBusy("");
    if (!response.ok) { setMessage(payload.error || "Could not create the rule."); return; }
    setForm({ name: "", metric: "frequency", operator: "gte", threshold: "4", severity: "warning", scope: "campaign" });
    setCreateOpen(false);
    setMessage("Custom rule created.");
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <PageHeader
        eyebrow="Workflow control"
        title="Automation"
        subtitle="Automate the repetitive work: sync, analysis, alerts, proposals and reporting. Paid-ad spend changes always stay with a person."
        action={<Link href="/notifications" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm hover:border-brand-200"><Icon name="bell" size={16} /> Delivery settings</Link>}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { icon: "eye" as const, title: "Observe", state: "Automatic", tone: "good", body: "Pull approved data, score the account and watch for meaningful changes." },
          { icon: "blocks" as const, title: "Prepare", state: "Automatic", tone: "good", body: "Create evidence-backed proposals, alerts, reports and paused creative drafts." },
          { icon: "shield" as const, title: "Change ad spend", state: "Human only", tone: "warn", body: "Budgets, bids, launches and live pauses are never applied silently." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-brand"><Icon name={item.icon} /></span><span className={`rounded-full px-2 py-1 text-2xs font-extrabold uppercase ${item.tone === "good" ? "bg-good/10 text-green-700" : "bg-warn/15 text-amber-800"}`}>{item.state}</span></div>
            <h2 className="mt-3 font-extrabold text-ink">{item.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-3xl border border-border-subtle bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div>
            <div className="flex items-center gap-2"><h2 className="text-lg font-extrabold text-ink">Watch rules</h2><span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">{activeCount} active</span></div>
            <p className="mt-1 max-w-2xl text-sm text-muted">Rules compare your own history and minimum-data gates. A match creates an alert or proposal; it never edits an ad.</p>
          </div>
          <div className="flex gap-2">
            {data?.canManage && data.persisted && <button type="button" onClick={() => setCreateOpen((value) => !value)} className="rounded-xl border border-border-subtle px-3.5 py-2 text-sm font-bold text-ink hover:border-brand-200">{createOpen ? "Close" : "+ Custom rule"}</button>}
            {data?.canManage && !data.persisted && <button type="button" onClick={installPresets} disabled={busy === "install" || !data.tableAvailable} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50">{busy === "install" ? "Installing..." : "Install starter rules"}</button>}
            {data && !data.canManage && <Link href="/billing" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Unlock controls</Link>}
          </div>
        </div>

        {createOpen && (
          <form onSubmit={createRule} className="grid gap-3 border-b border-border-subtle bg-surface p-5 md:grid-cols-6">
            <label className="md:col-span-2"><span className="mb-1 block text-xs font-bold text-ink">Rule name</span><input required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Frequency needs review" className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm" /></label>
            <label><span className="mb-1 block text-xs font-bold text-ink">Metric</span><select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm">{Object.entries(METRIC_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="mb-1 block text-xs font-bold text-ink">Condition</span><select value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm">{Object.entries(OPERATOR_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="mb-1 block text-xs font-bold text-ink">Threshold</span><input required type="number" step="any" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm" /></label>
            <div className="flex items-end"><button disabled={busy === "create"} className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "create" ? "Saving..." : "Create rule"}</button></div>
          </form>
        )}

        {!data ? (
          <div className="space-y-3 p-5"><div className="h-20 animate-pulse rounded-2xl bg-surface" /><div className="h-20 animate-pulse rounded-2xl bg-surface" /><div className="h-20 animate-pulse rounded-2xl bg-surface" /></div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.rules.map((rule) => (
              <article key={rule.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${rule.enabled ? "bg-good" : "bg-muted/40"}`} />
                    <h3 className="font-bold text-ink">{rule.name}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${severityClasses(rule.severity)}`}>{rule.severity}</span>
                    {rule.platform && <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-extrabold uppercase text-muted">{rule.platform}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted"><span className="font-semibold text-ink">{METRIC_LABEL[rule.metric] || rule.metric}</span> {OPERATOR_LABEL[rule.operator] || rule.operator} <span className="font-semibold text-ink">{formatThreshold(rule)}</span>{rule.min_volume_gate ? `, after ${rule.min_volume_gate.toLocaleString()} impressions` : ""}.</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-2xs font-semibold text-muted">
                    <span>{rule.scope} level</span>
                    <span>{rule.preview_fires ? `Would have fired on ${rule.preview_fires} of the last 14 data days` : "No matches in the 14-day preview"}</span>
                  </div>
                </div>
                <button type="button" disabled={Boolean(busy) || !data.canManage || !data.tableAvailable} onClick={() => toggle(rule)} aria-pressed={rule.enabled} className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold sm:w-24 ${rule.enabled ? "border-good/30 bg-good/10 text-green-700" : "border-border-subtle bg-surface text-muted"} disabled:opacity-50`}>
                  <span className={`relative h-4 w-7 rounded-full ${rule.enabled ? "bg-good" : "bg-muted/30"}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm ${rule.enabled ? "left-3.5" : "left-0.5"}`} /></span>{rule.enabled ? "On" : "Off"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-extrabold text-ink">Workflow templates</h2><p className="mt-1 text-sm text-muted">Repeatable operations built from the same safety gates.</p></div><span className="text-brand"><Icon name="blocks" /></span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Daily watchdog", "Sync → score → detect → queue fixes", "Active"],
              ["Creative fatigue loop", "Detect decay → prepare a refresh brief", "Ready"],
              ["Weekly client brief", "Summarise → render → deliver → archive", "Configure"],
            ].map(([title, body, state]) => <div key={title} className="rounded-2xl border border-border-subtle bg-surface p-4"><div className="text-2xs font-extrabold uppercase text-brand">{state}</div><h3 className="mt-1 font-bold text-ink">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{body}</p></div>)}
          </div>
        </div>
        <aside className="rounded-3xl border border-cockpit-edge bg-cockpit p-5 text-cockpit-ink shadow-card">
          <div className="flex items-center gap-2 font-extrabold"><span className="text-good"><Icon name="shield" /></span> Guardrail summary</div>
          <ul className="mt-4 space-y-3 text-sm text-cockpit-muted">
            <li className="flex gap-2"><span className="text-good"><Icon name="check-circle" size={15} /></span> Tracking uncertainty blocks scale proposals.</li>
            <li className="flex gap-2"><span className="text-good"><Icon name="check-circle" size={15} /></span> Thin data returns “need more data”, not a verdict.</li>
            <li className="flex gap-2"><span className="text-good"><Icon name="check-circle" size={15} /></span> Rules create signals and drafts, never live changes.</li>
            <li className="flex gap-2"><span className="text-good"><Icon name="check-circle" size={15} /></span> Every result keeps an evidence trail.</li>
          </ul>
          <p className="mt-4 text-2xs text-cockpit-muted">Preview: {previewCount} historical rule match{previewCount === 1 ? "" : "es"}{data?.lastDataDate ? ` through ${data.lastDataDate}` : ""}.</p>
        </aside>
      </section>

      {message && <div role="status" className="fixed bottom-20 right-4 z-50 max-w-sm rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-5">{message}<button type="button" className="ml-3 text-white/70 underline" onClick={() => setMessage("")}>Close</button></div>}
    </div>
  );
}
