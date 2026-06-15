import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const Body = z.object({ orgId: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid org" }, { status: 400 });

  // Verify membership before switching.
  const admin = createAdminClient();
  const { data: mem } = await admin.from("memberships")
    .select("organisation_id").eq("user_id", user.id).eq("organisation_id", parsed.data.orgId).maybeSingle();
  if (!mem) return NextResponse.json({ error: "Not a member of that workspace" }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("active_org", parsed.data.orgId, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
  return res;
}
