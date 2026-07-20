import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/entitlements";
import { getActiveOrgMembership, isOrgManagerRole } from "@/lib/org";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners and admins can change billing." }, { status: 403 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Billing isn't configured yet (set STRIPE_SECRET_KEY)." }, { status: 503 });

  const { priceId } = await req.json().catch(() => ({}));
  if (!priceId || typeof priceId !== "string") return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  // Only allow the prices we actually sell — prevents arbitrary price injection.
  // Map each price → plan so the webhook records the right entitlement tier.
  const priceToPlan: Record<string, Plan> = {};
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER) priceToPlan[process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER] = "starter";
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) priceToPlan[process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO] = "pro";
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPERT) priceToPlan[process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPERT] = "expert";
  const allowed = Object.keys(priceToPlan);
  // Fail closed: if no price→plan mapping is configured we can't know which tier to grant,
  // and an unmapped priceId must never silently default to a paid plan.
  if (allowed.length === 0) {
    return NextResponse.json({ error: "Billing plans aren't configured yet (set NEXT_PUBLIC_STRIPE_PRICE_STARTER/PRO/EXPERT)." }, { status: 503 });
  }
  if (!allowed.includes(priceId)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  const plan = priceToPlan[priceId];

  const stripe = new Stripe(key);
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?status=success`,
      cancel_url: `${base}/billing?status=cancelled`,
      customer_email: user.email ?? undefined,
      consent_collection: { terms_of_service: "required" },
      // Persist the selected workspace in Stripe so the webhook never applies a
      // paid plan to an arbitrary first workspace for multi-client users.
      metadata: { user_id: user.id, organisation_id: membership.orgId, plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Checkout failed" }, { status: 502 });
  }
}
