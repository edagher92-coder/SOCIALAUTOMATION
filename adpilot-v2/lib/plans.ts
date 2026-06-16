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
  // go here. PM-recommended starting anchors (pending owner confirmation):
  // Free $0 · Starter $49/mo · Pro $149/mo · Expert $399/mo (annual ≈ 2 months free).
  priceAudMonthly: number | null;
  cadence: "month";
  stripeEnvKey?: string; // which NEXT_PUBLIC_STRIPE_PRICE_* drives checkout
  blurb: string;
  headlineFeatures: Feature[];
  mostPopular?: boolean;
};

export const PLANS: PlanCard[] = [
  {
    id: "free", label: "Free", priceAudMonthly: 0, cadence: "month",
    blurb: "Paste a CSV, get an explainable Health Score. No card required.",
    headlineFeatures: ["csv_import", "health_score"],
  },
  {
    id: "starter", label: "Starter", priceAudMonthly: null, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
    blurb: "Saved reports, content publishing, and threshold alerts for the DIY operator.",
    headlineFeatures: ["reports", "content_publish"],
  },
  {
    id: "pro", label: "Pro", priceAudMonthly: null, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PRO", mostPopular: true,
    blurb: "Live Meta/TikTok connect, automated sync, the AI specialist team and multi-client.",
    headlineFeatures: ["api_connect", "auto_sync", "ai_team", "creative_studio", "multi_client"],
  },
  {
    id: "expert", label: "Expert", priceAudMonthly: null, cadence: "month",
    stripeEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_EXPERT",
    blurb: "White-label, Messenger automation, the expert plugins and guarded ad actions.",
    headlineFeatures: ["white_label", "messenger_automation", "ad_write", "expert_plugins"],
  },
];

// Human price label. "See pricing" until a confirmed AUD number is set (avoids advertising a
// figure that mismatches the Stripe-configured price — the v4 pricing-transparency fix).
export function planPriceLabel(p: PlanCard): string {
  if (p.priceAudMonthly === 0) return "Free";
  if (p.priceAudMonthly == null) return "See pricing";
  return `$${p.priceAudMonthly}/mo AUD`;
}

export function planById(id: Plan): PlanCard | undefined {
  return PLANS.find((p) => p.id === id);
}
