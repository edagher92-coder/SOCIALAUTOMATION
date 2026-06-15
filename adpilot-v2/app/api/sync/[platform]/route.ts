import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrg } from "@/lib/org";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { platform: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const platform = params.platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  if (platform === "tiktok") return NextResponse.json({ error: "TikTok read-sync is coming next — use CSV import for now." }, { status: 501 });

  try {
    const orgId = await ensureOrg(user.id, user.email ?? undefined);
    const admin = createAdminClient();
    const { data: tok } = await admin.from("platform_tokens")
      .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", "meta")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!tok?.ciphertext) return NextResponse.json({ error: "No connected Meta account. Connect it first." }, { status: 400 });
    const { data: acct } = await admin.from("connected_ad_accounts")
      .select("external_account_id").eq("organisation_id", orgId).eq("platform", "meta")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!acct?.external_account_id) return NextResponse.json({ error: "No Meta ad account on file." }, { status: 400 });

    const token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag });
    const idStr = String(acct.external_account_id);
    const act = idStr.startsWith("act_") ? idStr : `act_${idStr}`;
    const fields = "campaign_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm";
    const r = await fetch(`https://graph.facebook.com/v21.0/${act}/insights?level=campaign&date_preset=last_30d&time_increment=1&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
    const j: any = await r.json();
    if (!r.ok) return NextResponse.json({ error: j.error?.message || "Meta API error" }, { status: 502 });

    const rows = (j.data || []).map((d: any) => ({
      organisation_id: orgId, platform: "meta", campaign_name: d.campaign_name, date: d.date_start,
      spend: Number(d.spend || 0), impressions: Number(d.impressions || 0), reach: Number(d.reach || 0),
      frequency: Number(d.frequency || 0), clicks: Number(d.clicks || 0), ctr: Number(d.ctr || 0) / 100,
      cpc: Number(d.cpc || 0), cpm: Number(d.cpm || 0), tracking_status: "ok", source: "meta_api",
    }));
    if (rows.length) await admin.from("campaign_snapshots").insert(rows);
    return NextResponse.json({ inserted: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 502 });
  }
}
