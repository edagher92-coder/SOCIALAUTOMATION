import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrg } from "@/lib/org";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const wh = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!key || !wh || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const body = await req.text(); // raw body required for signature verification
  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, wh);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.user_id;
      if (userId) {
        const orgId = await ensureOrg(userId, s.customer_details?.email ?? undefined);
        const admin = createAdminClient();
        await admin.from("billing_subscriptions").insert({
          organisation_id: orgId,
          stripe_customer_id: String(s.customer ?? ""),
          stripe_subscription_id: String(s.subscription ?? ""),
          plan: "pro",
          status: "active",
        });
      }
    }
  } catch {
    // Return 200 so Stripe doesn't infinitely retry on our internal errors; logged elsewhere.
  }
  return NextResponse.json({ received: true });
}
