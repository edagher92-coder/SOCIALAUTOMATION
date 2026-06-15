"use client";
import { useState } from "react";

const TIERS = [
  { plan: "Starter", price: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER, blurb: "DIY: dashboard, CSV import, audits, saved reports.", features: [] as string[] },
  { plan: "Pro", price: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO, blurb: "Everything + live API connect, automated sync & alerts, AI team.", features: ["API / dev-link connect", "Automated sync (hourly–weekly)", "AI specialist team"] },
  { plan: "Expert", price: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPERT, blurb: "All of Pro + white-label and the team-built expert plugins.", features: ["Everything in Pro", "White-label reports", "Expert plugins (team-built)"] },
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
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t, i) => (
          <div key={t.plan} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-card ${i === 1 ? "border-brand ring-1 ring-brand/30" : "border-[#e3e8ef]"}`}>
            {i === 1 && <span className="absolute -top-2 right-4 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Most popular</span>}
            <h3 className="text-lg font-bold">{t.plan}</h3>
            <p className="mb-3 mt-1 text-sm text-muted">{t.blurb}</p>
            {t.features.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-ink">
                {t.features.map((f) => <li key={f} className="flex gap-2"><span className="text-teal">✓</span>{f}</li>)}
              </ul>
            )}
            <button onClick={() => go(t.price, t.plan)} disabled={busy === t.plan}
              className="mt-auto rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">
              {busy === t.plan ? "Redirecting…" : `Choose ${t.plan}`}
            </button>
          </div>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-band-red">{err}</p>}
    </div>
  );
}
