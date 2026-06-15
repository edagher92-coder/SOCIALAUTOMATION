import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Billing isn't configured yet (set STRIPE_SECRET_KEY)." }, { status: 503 });

  const { priceId } = await req.json().catch(() => ({}));
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  const stripe = new Stripe(key);
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?status=success`,
      cancel_url: `${base}/billing?status=cancelled`,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Checkout failed" }, { status: 502 });
  }
}
