"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function Notifications() {
  const [email, setEmail] = useState("");
  const [weekly, setWeekly] = useState(true);
  const [critical, setCritical] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((j) => {
      if (j.rule) { setEmail(j.rule.email || ""); setWeekly(!!j.rule.weekly_digest); setCritical(!!j.rule.critical_alerts); }
    }).catch(() => {});
  }, []);

  async function save(test = false) {
    setBusy(test ? "test" : "save"); setMsg("");
    try {
      const r = await fetch("/api/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, weekly_digest: weekly, critical_alerts: critical, test }),
      });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "Failed"); return; }
      setMsg(test ? (j.emailConfigured ? "Test email sent ✅" : "Saved. (Email isn't configured on the server yet — set RESEND_API_KEY.)") : "Saved ✅");
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }

  return (
    <div className="max-w-xl animate-fade-in">
      <PageHeader
        eyebrow="Alerts"
        title="Notifications"
        subtitle="Get a weekly health digest and critical alerts by email."
      />
      <div className="space-y-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div>
          <label className="mb-1 block text-sm font-bold">Send to</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@business.com.au"
            className="w-full rounded-lg border border-border-subtle p-2.5" />
        </div>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> Weekly health digest (Fridays)</label>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} /> Critical alerts (CPA blowouts, broken tracking, fatigue)</label>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={!!busy} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy === "save" ? "…" : "Save"}</button>
          <button onClick={() => save(true)} disabled={!!busy} className="rounded-lg border border-brand px-5 py-2.5 font-bold text-brand disabled:opacity-50">{busy === "test" ? "…" : "Send test email"}</button>
        </div>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
