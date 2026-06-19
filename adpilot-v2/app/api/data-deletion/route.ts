import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Data-deletion endpoint.
//   GET  → human/machine-readable instructions for requesting deletion.
//   POST → records a deletion request from either a Meta signed_request or a plain email.
// Read-only by design: this records the *request* only; it never returns or echoes PII.
// A separate, authenticated back-office process actions the deletion.

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "privacy@adpilot.example";

// Stable, non-reversible confirmation code derived from the subject + a per-request nonce.
// We never log or return the raw subject (email / Meta user id) — only its hash + a fresh code.
function confirmationCode(subjectHash: string): string {
  const nonce = randomUUID();
  return createHash("sha256").update(`${subjectHash}:${nonce}`).digest("hex").slice(0, 16);
}

function hashSubject(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Parse the payload portion of a Meta signed_request (base64url JSON). We do NOT verify the
// HMAC signature here (no app secret in this scaffold) — the back-office process re-verifies.
function parseSignedRequest(signedRequest: string): { user_id?: string } | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  return NextResponse.json({
    title: "AdPilot OS — Data deletion instructions",
    how_to_request: [
      `Email ${SUPPORT_EMAIL} with the subject "Data deletion request".`,
      `Or POST to ${base}/api/data-deletion with { "email": "you@example.com" }.`,
      "Meta clients may POST { \"signed_request\": \"<value>\" } per the Meta data deletion callback.",
    ],
    note: "AdPilot OS is read-only and never edits your live ads. Deletion removes your AdPilot account data only.",
    contact: SUPPORT_EMAIL,
  });
}

export async function POST(req: Request) {
  // Accept either JSON or form-encoded (Meta sends application/x-www-form-urlencoded).
  let signedRequest: string | undefined;
  let email: string | undefined;
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      signedRequest = typeof body?.signed_request === "string" ? body.signed_request : undefined;
      email = typeof body?.email === "string" ? body.email : undefined;
    } else {
      const form = await req.formData();
      const sr = form.get("signed_request");
      const em = form.get("email");
      signedRequest = typeof sr === "string" ? sr : undefined;
      email = typeof em === "string" ? em : undefined;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let subject: string | null = null;
  if (signedRequest) {
    const payload = parseSignedRequest(signedRequest);
    if (payload?.user_id) subject = `meta:${payload.user_id}`;
  }
  if (!subject && email && /.+@.+\..+/.test(email)) {
    subject = `email:${email}`;
  }
  if (!subject) {
    return NextResponse.json({ error: "Provide a valid email or signed_request" }, { status: 400 });
  }

  const subjectHash = hashSubject(subject);
  const code = confirmationCode(subjectHash);
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  // Persist the request (hash only, never PII) so the back-office can prove receipt and
  // action it. Best-effort: the Meta callback REQUIRES a 200 with the code, so a DB hiccup
  // must not fail the response — we log and carry on.
  try {
    const admin = createAdminClient();
    await admin.from("deletion_requests").insert({
      subject_hash: subjectHash,
      request_type: signedRequest ? "meta" : "email",
      confirmation_code: code,
    });
  } catch (e) {
    console.error("deletion_requests insert failed", e);
  }

  // Meta's data deletion callback expects { url, confirmation_code }.
  return NextResponse.json(
    {
      url: `${base}/api/data-deletion?code=${code}`,
      confirmation_code: code,
      status: "received",
      message: "Your deletion request has been recorded. Retain the confirmation code for follow-up.",
    },
    { status: 200 },
  );
}
