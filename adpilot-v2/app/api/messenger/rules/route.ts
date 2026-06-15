import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

// Keyword/payload auto-reply rules for the webhook bot. Premium (Expert).
async function gate(): Promise<{ res?: NextResponse; orgId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "messenger_automation")) {
    return { res: NextResponse.json({ error: "Messenger automation is a Premium (Expert) feature.", upgrade: true }, { status: 402 }) };
  }
  return { orgId };
}

export async function GET(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const supabase = createClient();
  let q = supabase.from("messenger_rules").select("id,external_page_id,trigger_type,trigger,reply,priority").eq("organisation_id", g.orgId!);
  const page = new URL(req.url).searchParams.get("page");
  if (page) q = q.eq("external_page_id", page);
  const { data } = await q.order("priority", { ascending: true });
  return NextResponse.json({ rules: data || [] });
}

export async function POST(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = z.object({
    external_page_id: z.string().min(1),
    trigger_type: z.enum(["keyword", "payload", "welcome", "away", "default"]),
    trigger: z.string().max(200).optional(),
    reply: z.string().min(1).max(2000),
    priority: z.number().int().min(0).max(999).optional(),
  }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rule" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("messenger_rules").insert({ organisation_id: g.orgId!, ...parsed.data }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("messenger_rules").delete().eq("organisation_id", g.orgId!).eq("id", id);
  return NextResponse.json({ ok: true });
}
