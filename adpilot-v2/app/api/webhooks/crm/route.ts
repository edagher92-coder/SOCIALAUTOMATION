import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashEmail, hashPhone } from "@/lib/pii";

export const runtime = "nodejs";

// Inbound CRM/lead webhook. READ-ONLY product: this only INGESTS data to populate
// the lead_quality_score loop — it never calls an ad platform. PM-C hard rules:
//   1. Verify an HMAC-SHA256 signature over the RAW request body (read req.text()
//      BEFORE parsing) using crypto.timingSafeEqual — constant-time compare.
//   2. Fail closed: if CRM_WEBHOOK_SECRET is unset OR the signature is
//      missing/invalid → 403. No secret means no trusted caller.
//   3. Any PII (email/phone) is stored ONLY as a one-way salted SHA-256 hash.
//
// Signature verification mirrors lib/messenger/bot.ts#verifySignature verbatim:
// HMAC-SHA256(rawBody, secret) compared against the header in constant time.
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type CrmEvent = {
  type?: string;
  event_id?: string;
  organisation_id?: string;
  org_id?: string;
  account_id?: string;
  lead_id?: string;
  email?: string;
  phone?: string;
  platform?: string;
  campaign_name?: string;
  status?: string;
  sale_value_aud?: number;
  value_aud?: number;
  lead_quality_score?: number;
  source?: string;
  closed_date?: string;
};

export async function POST(req: Request) {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  // Read the RAW body BEFORE parsing — the signature is computed over these exact bytes.
  const raw = await req.text();
  const sig = req.headers.get("x-adpilot-signature");

  // Fail closed: no configured secret, or a missing/invalid signature → 403.
  if (!secret || !verifySignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: CrmEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We only handle these event kinds; anything else is acknowledged as a no-op.
  if (event.type !== "sale.recorded" && event.type !== "lead.status_changed") {
    return NextResponse.json({ received: true, ignored: event.type ?? null }, { status: 202 });
  }

  // Resolve the org from the payload's org/account id. If we can't, 202 no-op
  // (don't error — the provider would just retry a delivery we can never accept).
  const orgId = event.organisation_id || event.org_id || event.account_id;
  if (!orgId) {
    return NextResponse.json({ received: true, resolved: false }, { status: 202 });
  }

  try {
    const admin = createAdminClient();
    // Store ONLY hashed PII + non-PII attribution. Upsert keyed on
    // (organisation_id, event_id) so duplicate deliveries are idempotent.
    await admin.from("lead_events").upsert(
      {
        organisation_id: orgId,
        event_id: event.event_id ?? null,
        lead_id: event.lead_id ?? null,
        platform: event.platform ?? null,
        campaign_name: event.campaign_name ?? null,
        status: event.status ?? null,
        sale_value_aud: event.sale_value_aud ?? event.value_aud ?? null,
        lead_quality_score: event.lead_quality_score ?? null,
        email_hash: hashEmail(event.email),
        phone_hash: hashPhone(event.phone),
        source: event.source ?? "crm_webhook",
        closed_date: event.closed_date ?? null,
      },
      { onConflict: "organisation_id,event_id" }
    );
  } catch {
    // Acknowledge so the provider doesn't hammer us; internal failures logged elsewhere.
  }

  // Respond 202 quickly — accepted for processing.
  return NextResponse.json({ received: true }, { status: 202 });
}
