import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { decrypt } from "@/lib/crypto";
import { subscribePage } from "@/lib/messenger/bot";

export const runtime = "nodejs";

// Subscribe a registered Messenger Page to the app's webhook fields (automates subscribe_page.py).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "messenger_automation")) {
    return NextResponse.json({ error: "Messenger automation is a Premium (Expert) feature.", upgrade: true }, { status: 402 });
  }

  const parsed = z.object({ external_page_id: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "external_page_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: page } = await admin.from("messenger_pages")
    .select("ciphertext,iv,auth_tag,channel").eq("organisation_id", orgId).eq("external_page_id", parsed.data.external_page_id).maybeSingle();
  if (!page?.ciphertext) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  if (page.channel !== "messenger") return NextResponse.json({ error: "Subscribe applies to Messenger/Instagram Pages (WhatsApp subscribes in the App Dashboard)." }, { status: 400 });

  try {
    const token = decrypt({ ciphertext: page.ciphertext, iv: page.iv, authTag: page.auth_tag });
    const result = await subscribePage(token);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Subscribe failed" }, { status: 502 });
  }
}
