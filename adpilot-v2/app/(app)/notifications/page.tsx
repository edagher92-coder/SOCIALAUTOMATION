"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/icons";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 flex-shrink-0 rounded-full ${checked ? "bg-good" : "bg-muted/30"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${checked ? "left-6" : "left-1"}`} /></button>;
}

export default function Notifications() {
  const [email, setEmail] = useState("");
  const [weekly, setWeekly] = useState(true);
  const [critical, setCritical] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/notifications").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Notification settings could not be loaded.");
      if (payload.rule) { setEmail(payload.rule.email || ""); setWeekly(Boolean(payload.rule.weekly_digest)); setCritical(Boolean(payload.rule.critical_alerts)); }
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Notification settings could not be loaded.")).finally(() => setLoaded(true));
  }, []);

  async function save(test = false) {
    setBusy(test ? "test" : "save"); setMessage(""); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, weekly_digest: weekly, critical_alerts: critical, test }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Settings could not be saved.");
      setMessage(test ? payload.emailConfigured ? "Test email sent. Check the destination inbox." : "Preferences saved, but outbound email is not configured on this deployment." : "Notification settings saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Settings could not be saved."); }
    finally { setBusy(""); }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <PageHeader eyebrow="Delivery" title="Notifications" subtitle="Choose which conclusions leave AdPilot. The system can detect continuously without flooding your inbox." action={<Link href="/automate" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm"><Icon name="blocks" size={16} /> Watch rules</Link>} />
      {!loaded ? <div className="h-80 animate-pulse rounded-3xl bg-border-subtle" /> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-3xl border border-border-subtle bg-white shadow-card"><div className="border-b border-border-subtle p-5"><h2 className="font-extrabold text-ink">Email delivery</h2><p className="mt-1 text-sm text-muted">One verified destination for this workspace.</p></div><div className="space-y-5 p-5"><label><span className="mb-1.5 block text-sm font-bold text-ink">Send to</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@business.com.au" className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-3 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand" /></label><div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle"><div className="flex items-start gap-4 p-4"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Icon name="file-text" size={17} /></span><div className="flex-1"><h3 className="font-bold text-ink">Weekly health brief</h3><p className="mt-1 text-xs leading-relaxed text-muted">A Friday summary of spend, health, important changes and next work.</p></div><Toggle checked={weekly} onChange={setWeekly} label="Weekly health brief" /></div><div className="flex items-start gap-4 p-4"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-bad/10 text-bad"><Icon name="alert-triangle" size={17} /></span><div className="flex-1"><h3 className="font-bold text-ink">Important alerts</h3><p className="mt-1 text-xs leading-relaxed text-muted">Tracking failures, meaningful cost blowouts and confirmed fatigue signals.</p></div><Toggle checked={critical} onChange={setCritical} label="Important alerts" /></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => save(false)} disabled={Boolean(busy) || !email} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "save" ? "Saving..." : "Save delivery"}</button><button type="button" onClick={() => save(true)} disabled={Boolean(busy) || !email} className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-50">{busy === "test" ? "Sending..." : "Send test email"}</button></div></div></section>
        <aside className="space-y-4"><div className="rounded-3xl border border-cockpit-edge bg-cockpit p-5 text-cockpit-ink shadow-card"><div className="flex items-center gap-2 font-extrabold"><span className="text-good"><Icon name="shield" size={17} /></span> Alert discipline</div><ul className="mt-4 space-y-3 text-xs leading-relaxed text-cockpit-muted"><li>Minimum-data gates suppress thin-sample noise.</li><li>Repeated findings are deduplicated in the decision queue.</li><li>Every alert names the affected entity and evidence window.</li><li>No alert triggers a live paid-ad change.</li></ul></div><div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card"><div className="text-2xs font-extrabold uppercase tracking-wider text-muted">Delivery status</div><div className="mt-2 flex items-center gap-2 font-bold text-ink"><span className={`h-2 w-2 rounded-full ${email && (weekly || critical) ? "bg-good" : "bg-muted/40"}`} />{email && (weekly || critical) ? "Email configured" : "Delivery paused"}</div><p className="mt-2 text-xs text-muted">Detection and in-app Fixes keep running even when emails are off.</p></div></aside>
      </div>}
      {(message || error) && <div role="status" className={`fixed bottom-20 right-4 z-50 flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-5 ${error ? "bg-bad" : "bg-ink"}`}><Icon name={error ? "alert-triangle" : "check-circle"} size={16} /><span>{error || message}</span><button type="button" onClick={() => { setMessage(""); setError(""); }} className="ml-2 text-white/70 underline">Close</button></div>}
    </div>
  );
}
