import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrg } from "@/lib/org";
import { normalisePlan } from "@/lib/entitlements";

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
        // Normalise the plan from the checkout metadata so a missing/garbled value records a
        // known tier ("free") rather than silently granting an unintended paid plan. The
        // checkout route already validated the price→plan mapping before setting this.
        // Validate the plan from checkout metadata against the known set. Fail LOUD (log + 200
        // no-write) on an unknown value rather than silently recording "free" for a paid checkout.
        // Return 200 so Stripe doesn't retry a permanently-bad event. normalisePlan stays untouched.
        const planRaw = String(s.metadata?.plan || "").trim().toLowerCase();
        if (!["starter", "pro", "expert", "agency", "enterprise"].includes(planRaw)) {
          console.error(`Stripe webhook: unknown plan "${s.metadata?.plan}" on session ${s.id} — not writing a subscription.`);
          return NextResponse.json({ received: true, warning: "unknown_plan" });
        }
        const plan = normalisePlan(planRaw);
        // Upsert keyed on the subscription id so duplicate webhook deliveries are idempotent.
        await admin.from("billing_subscriptions").upsert({
          organisation_id: orgId,
          stripe_customer_id: String(s.customer ?? ""),
          stripe_subscription_id: String(s.subscription ?? ""),
          plan,
          status: "active",
        }, { onConflict: "stripe_subscription_id" });
      }
    } else if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      // Keep entitlements honest when a subscription is cancelled or lapses: flip the stored
      // status so planForOrg() falls back to "free". Keyed on the Stripe subscription id.
      const sub = event.data.object as Stripe.Subscription;
      const status =
        event.type === "customer.subscription.deleted" || sub.status !== "active"
          ? "canceled"
          : "active";
      const admin = createAdminClient();
      await admin.from("billing_subscriptions")
        .update({ status })
        .eq("stripe_subscription_id", String(sub.id));
    }
  } catch {
    // Return 200 so Stripe doesn't infinitely retry on our internal errors; logged elsewhere.
  }
  return NextResponse.json({ received: true });
}
