import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOrgs } from "@/lib/org";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json(await listOrgs(user.id));
}

const Create = z.object({ name: z.string().min(1).max(120) });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "A client name is required" }, { status: 400 });

  const admin = createAdminClient();
  // Keep a profiles row for FK consistency (mirrors ensureOrg's first-use bootstrap).
  await admin.from("profiles").upsert({ id: user.id, email: user.email ?? undefined });

  const { data: org, error } = await admin.from("organisations").insert({ name: parsed.data.name.trim() }).select("id").single();
  if (error || !org) return NextResponse.json({ error: error?.message || "Create failed" }, { status: 502 });

  const { error: memErr } = await admin.from("memberships").insert({ organisation_id: org.id, user_id: user.id, role: "owner" });
  if (memErr) return NextResponse.json({ error: memErr.message || "Could not add you to the new workspace" }, { status: 502 });

  const res = NextResponse.json({ id: org.id });
  res.cookies.set("active_org", org.id as string, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
  return res;
}
