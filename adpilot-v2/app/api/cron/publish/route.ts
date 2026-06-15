import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPost } from "@/lib/publish/providers";
import { can, normalisePlan } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

// Publishes scheduled organic posts whose time has come. Only 'scheduled' posts (which
// required a human approval to reach that state) are sent. Secured by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: due } = await admin.from("content_posts")
    .select("id,organisation_id,platform,caption,media_url,media_type")
    .eq("status", "scheduled").lte("scheduled_at", now).limit(50);
  if (!due || due.length === 0) return NextResponse.json({ published: 0, failed: 0 });

  const { data: subs } = await admin.from("billing_subscriptions").select("organisation_id,plan,status");
  const planFor = new Map<string, string>();
  for (const s of subs || []) if ((s as any).status === "active") planFor.set((s as any).organisation_id, (s as any).plan);

  let published = 0, failed = 0, skipped = 0;
  for (const p of due as any[]) {
    if (!can(normalisePlan(planFor.get(p.organisation_id)), "content_publish")) { skipped++; continue; }
    try {
      const res = await publishPost(p);
      await admin.from("content_posts").update({ status: "published", published_at: new Date().toISOString(), external_id: res.externalId ?? null, error: null, updated_at: new Date().toISOString() }).eq("id", p.id);
      published++;
    } catch (e: any) {
      await admin.from("content_posts").update({ status: "failed", error: e?.message || "publish failed", updated_at: new Date().toISOString() }).eq("id", p.id);
      failed++;
    }
  }
  return NextResponse.json({ published, failed, skipped });
}
