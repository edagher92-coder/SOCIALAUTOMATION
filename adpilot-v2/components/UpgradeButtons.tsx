"use client";
import { useState } from "react";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { FEATURE_LABEL } from "@/lib/entitlements";

// Stripe price ids must be referenced statically (Next inlines NEXT_PUBLIC_* at build time;
// a dynamic process.env[key] would not be replaced in the client bundle).
const PRICE: Record<string, string | undefined> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  expert: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPERT,
};

// Paid tiers, copy + features + price label all from the single PLANS source of truth.
const TIERS = PLANS.filter((p) => p.id !== "free").map((p) => ({
  plan: p.label,
  id: p.id,
  price: PRICE[p.id],
  priceLabel: planPriceLabel(p),
  blurb: p.blurb,
  popular: !!p.mostPopular,
  features: p.headlineFeatures.map((f) => FEATURE_LABEL[f]),
}));

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
        {TIERS.map((t) => (
          <div key={t.plan} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-card ${t.popular ? "border-brand ring-1 ring-brand/30" : "border-[#e3e8ef]"}`}>
            {t.popular && <span className="absolute -top-2 right-4 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Most popular</span>}
            <h3 className="text-lg font-bold">{t.plan}</h3>
            <p className="text-sm font-semibold text-brand">{t.priceLabel}</p>
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
