// Single source of COMMERCIAL truth for plan display (prices, blurbs, headline features).
// Pairs with lib/entitlements.ts (the single source of GATE truth) — headlineFeatures here
// must be gated at-or-below the tier there (enforced by plans.test.ts), so marketing copy
// and runtime gating can never silently diverge across the landing / UpgradeButtons / billing.
import type { Plan, Feature } from "./entitlements";

export type PlanCard = {
  id: Plan;
  label: string;
  // Recurring monthly price in AUD. NULL => display "see pricing at checkout" rather than a
  // figure that might not match the configured Stripe price object. Owner-confirmed numbers
  // go here. Owner-confirmed (2026-06-17, market-researched + converged):
  // Free $0 · Starter $49/mo · Pro $149/mo · Expert $399/mo.
  priceAudMonthly: number | null;
  // Recurring annual price in AUD (≈ 2 months free / ~17% off). NULL => no annual shown yet.
  // Display only — the matching Stripe annual price objects remain owner-gated.
  priceAudAnnual?: number | null;
  cadence: "month";
  stripeEnvKey?: string; // which NEXT_PUBLIC_STRIPE_PRICE_* drives checkout
  blurb: string;
  headlineFeatures: Feature[];
  mostPopular?: boolean;
};

export const PLANS: PlanCard[] = [
  {
    id: "free", label: "Free", priceAudMonthly: 0, priceAudAnnual: null, cadence: "month",
    blurb: "Paste a CSV, get an explainable Health Score. No card required.",
    headlineFeatures: ["csv_import", "health_score"],
  },
  {
    id: "starter", label: "Starter", priceAudMonthly: 49, priceAudAnnual: 490, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
    blurb: "Saved reports, content publishing, and threshold alerts for the DIY operator.",
    headlineFeatures: ["reports", "content_publish"],
  },
  {
    id: "pro", label: "Pro", priceAudMonthly: 149, priceAudAnnual: 1490, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PRO", mostPopular: true,
    blurb: "Live Meta/TikTok connect, automated sync, the AI specialist team and multi-client.",
    headlineFeatures: ["api_connect", "auto_sync", "ai_team", "creative_studio", "multi_client"],
  },
  {
    id: "expert", label: "Expert", priceAudMonthly: 399, priceAudAnnual: 3990, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_EXPERT",
    blurb: "White-label, Messenger automation, the expert plugins and guarded ad actions.",
    headlineFeatures: ["white_label", "messenger_automation", "ad_write", "expert_plugins"],
  },
];

// Human price label. Free => "Free"; a confirmed AUD number => "$X/mo AUD"; otherwise
// "See pricing" (avoids advertising a figure that mismatches the Stripe-configured price).
export function planPriceLabel(p: PlanCard): string {
  if (p.priceAudMonthly === 0) return "Free";
  if (p.priceAudMonthly == null) return "See pricing";
  return `$${p.priceAudMonthly}/mo AUD`;
}

// Optional annual note (e.g. "or $1,490/yr — save ~17%"). Empty string when no annual price is set.
export function planAnnualLabel(p: PlanCard): string {
  if (p.priceAudAnnual == null || p.priceAudMonthly == null || p.priceAudMonthly <= 0) return "";
  const full = p.priceAudMonthly * 12;
  const savedPct = full > 0 ? Math.round(((full - p.priceAudAnnual) / full) * 100) : 0;
  return `or $${p.priceAudAnnual.toLocaleString()}/yr${savedPct > 0 ? ` — save ~${savedPct}%` : ""}`;
}

export function planById(id: Plan): PlanCard | undefined {
  return PLANS.find((p) => p.id === id);
}
