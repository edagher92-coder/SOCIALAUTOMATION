import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST — records that the authenticated user accepted a versioned legal document.
// Used at signup. RLS guarantees a user can only insert rows for their own user_id.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const document = body?.document;
  const version = body?.version;
  const contentHash = body?.content_hash;

  if (document !== "terms" && document !== "privacy") {
    return NextResponse.json({ error: "Invalid document" }, { status: 400 });
  }
  if (typeof version !== "string" || typeof contentHash !== "string" || !version || !contentHash) {
    return NextResponse.json({ error: "Missing version or content_hash" }, { status: 400 });
  }

  const { error } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    document,
    version,
    content_hash: contentHash,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
