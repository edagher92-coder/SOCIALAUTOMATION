import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { encrypt } from "@/lib/crypto";
import { whoami } from "@/lib/messenger/profile";

export const runtime = "nodejs";

// Register/list/remove the channels (Messenger/IG Pages, WhatsApp numbers) this org's bot
// answers for. Premium (Expert).
async function gate(): Promise<{ res?: NextResponse; orgId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) {
    return { res: NextResponse.json({ error: "Only workspace owners and admins can configure customer messaging." }, { status: 403 }) };
  }
  const orgId = membership.orgId;
  if (!can(await planForOrg(orgId), "messenger_automation")) {
    return { res: NextResponse.json({ error: "Messenger automation is a Premium (Expert) feature.", upgrade: true }, { status: 402 }) };
  }
  return { orgId };
}

const Hours = z.object({ tz_offset: z.number(), open_hour: z.number().min(0).max(23), close_hour: z.number().min(1).max(24), days: z.array(z.number().min(0).max(6)) }).partial().optional();

const Body = z.object({
  channel: z.enum(["messenger", "whatsapp"]).default("messenger"),
  pageToken: z.string().min(20).optional(),
  whatsappToken: z.string().min(20).optional(),
  phoneNumberId: z.string().min(3).optional(),
  displayName: z.string().max(120).optional(),
  business_hours: Hours,
  ai_enabled: z.boolean().optional(),
  ai_facts: z.string().max(8000).optional(),
  ai_voice: z.string().max(1000).optional(),
});

// AI smart-mode settings, edited per channel after it's connected (no token needed).
const AiBody = z.object({
  external_page_id: z.string().min(1),
  ai_enabled: z.boolean().optional(),
  ai_facts: z.string().max(8000).nullable().optional(),
  ai_voice: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const g = await gate(); if (g.res) return g.res;
  const supabase = createClient();
  const { data } = await supabase.from("messenger_pages").select("external_page_id,display_name,channel,business_hours,ai_enabled,ai_facts,ai_voice,created_at").eq("organisation_id", g.orgId!).order("created_at", { ascending: false });
  return NextResponse.json({ pages: data || [] });
}

export async function POST(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { channel, business_hours, ai_enabled, ai_facts, ai_voice } = parsed.data;

  try {
    let externalId: string, displayName: string, token: string;
    if (channel === "whatsapp") {
      if (!parsed.data.whatsappToken || !parsed.data.phoneNumberId) return NextResponse.json({ error: "WhatsApp needs whatsappToken + phoneNumberId" }, { status: 400 });
      externalId = parsed.data.phoneNumberId;
      displayName = parsed.data.displayName || `WhatsApp ${parsed.data.phoneNumberId}`;
      token = parsed.data.whatsappToken;
    } else {
      if (!parsed.data.pageToken) return NextResponse.json({ error: "Messenger needs a Page token" }, { status: 400 });
      const me = await whoami(parsed.data.pageToken);
      if (!me?.id) throw new Error("Token rejected by Meta");
      externalId = me.id;
      displayName = me.name || me.id;
      token = parsed.data.pageToken;
    }

    const admin = createAdminClient();
    const enc = encrypt(token);
    await admin.from("messenger_pages").upsert({
      organisation_id: g.orgId!, external_page_id: externalId, display_name: displayName, channel,
      ciphertext: enc.ciphertext, iv: enc.iv, auth_tag: enc.authTag,
      business_hours: business_hours ?? null,
      ...(ai_enabled !== undefined ? { ai_enabled } : {}),
      ...(ai_facts !== undefined ? { ai_facts } : {}),
      ...(ai_voice !== undefined ? { ai_voice } : {}),
    }, { onConflict: "external_page_id" });
    return NextResponse.json({ ok: true, page: { id: externalId, name: displayName, channel } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not register" }, { status: 502 });
  }
}

// Update AI smart-mode settings for an already-connected channel (no token re-entry).
export async function PATCH(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = AiBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { external_page_id, ai_enabled, ai_facts, ai_voice } = parsed.data;

  const patch: Record<string, any> = {};
  if (ai_enabled !== undefined) patch.ai_enabled = ai_enabled;
  if (ai_facts !== undefined) patch.ai_facts = ai_facts;
  if (ai_voice !== undefined) patch.ai_voice = ai_voice;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No settings provided" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("messenger_pages").update(patch)
    .eq("organisation_id", g.orgId!).eq("external_page_id", external_page_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
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
