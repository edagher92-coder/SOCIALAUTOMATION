"use client";
import { useState } from "react";

const TIERS = [
  { plan: "Starter", price: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER, blurb: "DIY: dashboard, CSV import, audits, saved reports." },
  { plan: "Pro", price: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO, blurb: "Everything + AI generation, alerts, automation." },
];

export default function UpgradeButtons() {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function go(priceId: string | undefined, plan: string) {
    if (!priceId) { setErr(`No Stripe price configured for ${plan} (set NEXT_PUBLIC_STRIPE_PRICE_${plan.toUpperCase()}).`); return; }
    setBusy(plan); setErr("");
    try {
      const r = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Checkout failed"); return; }
      if (j.url) window.location.href = j.url;
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {TIERS.map((t) => (
          <div key={t.plan} className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
            <h3 className="text-lg font-bold">{t.plan}</h3>
            <p className="mb-3 mt-1 text-sm text-muted">{t.blurb}</p>
            <button onClick={() => go(t.price, t.plan)} disabled={busy === t.plan}
              className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">
              {busy === t.plan ? "Redirecting…" : `Choose ${t.plan}`}
            </button>
          </div>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-band-red">{err}</p>}
    </div>
  );
}
