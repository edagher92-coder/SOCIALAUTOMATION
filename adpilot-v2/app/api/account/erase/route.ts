import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eraseUserData } from "@/lib/erasure";

export const runtime = "nodejs";

// Authenticated self-service right-to-erasure (APP 11.2). Identity is proven by the session, so we
// can safely delete the caller's OWN data. Requires a typed confirmation so it can never fire by
// accident. Errors are scrubbed (never echo PII / internals to the client).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE MY DATA") {
    return NextResponse.json({ error: "Confirmation required — send { confirm: \"DELETE MY DATA\" }." }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    const result = await eraseUserData(admin, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("account erasure failed:", e?.message);
    return NextResponse.json({ error: "Erasure failed — please contact support." }, { status: 500 });
  }
}
