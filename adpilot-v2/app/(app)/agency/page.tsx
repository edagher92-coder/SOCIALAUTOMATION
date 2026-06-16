"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function Agency() {
  const [brand, setBrand] = useState("");
  const [logo, setLogo] = useState("");
  const [color, setColor] = useState("#0b5fff");
  const [support, setSupport] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/white-label").then((r) => r.json()).then((j) => {
      const p = j.profile || {};
      setBrand(p.brand_name || ""); setLogo(p.logo_url || ""); setColor(p.primary_color || "#0b5fff"); setSupport(p.support_email || "");
    }).catch(() => {});
  }, []);

  async function save() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/white-label", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_name: brand, logo_url: logo, primary_color: color, support_email: support }),
      });
      const j = await r.json();
      setMsg(r.ok ? "Saved ✅ — client reports now show your brand." : (j.error || "Failed"));
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-xl animate-fade-in">
      <PageHeader
        eyebrow="Agency"
        title="White-label / Agency"
        subtitle="Brand the client-facing reports as your own agency."
      />

      <div className="space-y-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <Field label="Brand name" v={brand} set={setBrand} ph="Apex Digital" />
        <Field label="Logo URL" v={logo} set={setLogo} ph="https://…/logo.png" />
        <div>
          <label className="mb-1 block text-sm font-bold">Primary colour</label>
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Primary brand colour" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 rounded border border-border-subtle" />
            <input aria-label="Primary brand colour (hex)" value={color} onChange={(e) => setColor(e.target.value)} className="w-full rounded-lg border border-border-subtle p-2.5" />
          </div>
        </div>
        <Field label="Support email" v={support} set={setSupport} ph="hello@apexdigital.com.au" />
        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "…" : "Save branding"}</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>

      <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div className="text-xs font-bold text-muted">PREVIEW — client report header</div>
        <div className="mt-2 flex items-center gap-3 rounded-xl p-3 text-white" style={{ background: color || "#0b5fff" }}>
          {logo ? <img src={logo} alt={`${brand || "Your Agency"} logo`} className="h-7 w-7 rounded bg-white object-contain" /> : <span className="inline-block h-7 w-7 rounded bg-white/30" />}
          <b>{brand || "Your Agency"}</b><span className="ml-auto text-sm opacity-80">Ads Health Report</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, set, ph }: { label: string; v: string; set: (s: string) => void; ph?: string }) {
  return (<div><label className="mb-1 block text-sm font-bold">{label}</label>
    <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} className="w-full rounded-lg border border-border-subtle p-2.5" /></div>);
}
