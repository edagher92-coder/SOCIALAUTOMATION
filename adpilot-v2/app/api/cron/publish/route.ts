import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPost } from "@/lib/publish/providers";
import { checkPublishCap } from "@/lib/publish/rate-limits";
import { can, normalisePlan } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

// Publishes scheduled organic posts whose time has come. Only 'scheduled' posts (which
// required a human approval to reach that state) are sent. Secured by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = cronAuthorized(req, secret);
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

  let published = 0, failed = 0, skipped = 0, deferred = 0;
  for (const p of due as any[]) {
    if (!can(normalisePlan(planFor.get(p.organisation_id)), "content_publish")) { skipped++; continue; }
    // Rate-limit guard: if this account is at its trailing-24h cap for the platform, defer the
    // post to the next window rather than publishing (which would risk a platform restriction).
    const cap = await checkPublishCap(admin, p.organisation_id, p.platform, p.media_type);
    if (!cap.allowed) {
      await admin.from("content_posts").update({ scheduled_at: new Date(Date.now() + 3600_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", p.id);
      deferred++;
      continue;
    }
    try {
      const res = await publishPost(p);
      await admin.from("content_posts").update({ status: "published", published_at: new Date().toISOString(), external_id: res.externalId ?? null, error: null, updated_at: new Date().toISOString() }).eq("id", p.id);
      published++;
    } catch (e: any) {
      await admin.from("content_posts").update({ status: "failed", error: e?.message || "publish failed", updated_at: new Date().toISOString() }).eq("id", p.id);
      failed++;
    }
  }
  return NextResponse.json({ published, failed, skipped, deferred });
}
