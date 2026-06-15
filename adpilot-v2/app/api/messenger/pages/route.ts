import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { encrypt } from "@/lib/crypto";
import { whoami } from "@/lib/messenger/profile";

export const runtime = "nodejs";

// Register/list/remove the Pages this org's webhook bot answers for. Premium (Expert).
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

export async function GET() {
  const g = await gate(); if (g.res) return g.res;
  const supabase = createClient();
  const { data } = await supabase.from("messenger_pages").select("external_page_id,display_name,created_at").eq("organisation_id", g.orgId!).order("created_at", { ascending: false });
  return NextResponse.json({ pages: data || [] });
}

export async function POST(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = z.object({ pageToken: z.string().min(20) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "pageToken required" }, { status: 400 });
  try {
    const me = await whoami(parsed.data.pageToken);
    if (!me?.id) throw new Error("Token rejected by Meta");
    const admin = createAdminClient();
    const enc = encrypt(parsed.data.pageToken);
    await admin.from("messenger_pages").upsert({
      organisation_id: g.orgId!, external_page_id: me.id, display_name: me.name || me.id,
      ciphertext: enc.ciphertext, iv: enc.iv, auth_tag: enc.authTag,
    }, { onConflict: "external_page_id" });
    return NextResponse.json({ ok: true, page: { id: me.id, name: me.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not register page" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const id = new URL(req.url).searchParams.get("page");
  if (!id) return NextResponse.json({ error: "page required" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("messenger_pages").delete().eq("organisation_id", g.orgId!).eq("external_page_id", id);
  await admin.from("messenger_rules").delete().eq("organisation_id", g.orgId!).eq("external_page_id", id);
  return NextResponse.json({ ok: true });
}
