import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { publishPost, isNotConfigured } from "@/lib/publish/providers";

export const runtime = "nodejs";

const Body = z.object({
  status: z.enum(["draft", "approved", "scheduled", "published", "failed"]).optional(),
  caption: z.string().max(2200).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  publishNow: z.boolean().optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "content_publish")) {
    return NextResponse.json({ error: "Content publishing is a paid feature. Upgrade on Billing.", upgrade: true }, { status: 402 });
  }
  const admin = createAdminClient();

  // Publish now: only an explicitly approved (human-checked) post can go out.
  if (parsed.data.publishNow) {
    const { data: post } = await admin.from("content_posts")
      .select("platform,caption,media_url,media_type,status").eq("id", params.id).eq("organisation_id", orgId).maybeSingle();
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Only an explicitly approved (or scheduled/failed-retry) post may be sent — never a raw draft.
    if (!["approved", "scheduled", "failed"].includes((post as any).status)) {
      return NextResponse.json({ error: "Approve the post before publishing." }, { status: 400 });
    }
    try {
      const res = await publishPost(post as any);
      await admin.from("content_posts").update({ status: "published", published_at: new Date().toISOString(), external_id: res.externalId ?? null, error: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("organisation_id", orgId);
      return NextResponse.json({ ok: true, status: "published", externalId: res.externalId });
    } catch (e: any) {
      const msg = e?.message || "Publish failed";
      await admin.from("content_posts").update({ status: "failed", error: msg, updated_at: new Date().toISOString() }).eq("id", params.id).eq("organisation_id", orgId);
      return NextResponse.json({ error: msg, notConfigured: isNotConfigured(e) }, { status: isNotConfigured(e) ? 503 : 502 });
    }
  }

  // Plain field update (approve / schedule / edit caption).
  const patch: any = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.caption !== undefined) patch.caption = parsed.data.caption;
  if (parsed.data.scheduled_at !== undefined) patch.scheduled_at = parsed.data.scheduled_at;
  // Scheduling requires a future time: a past/now scheduled_at would be picked up by the
  // very next cron run, which defeats "schedule for later" and risks a surprise publish.
  if (patch.status === "scheduled") {
    if (patch.scheduled_at == null) {
      return NextResponse.json({ error: "Scheduling needs a scheduled_at time." }, { status: 400 });
    }
    const when = new Date(patch.scheduled_at).getTime();
    if (!Number.isFinite(when)) {
      return NextResponse.json({ error: "scheduled_at is not a valid date." }, { status: 400 });
    }
    if (when <= Date.now()) {
      return NextResponse.json({ error: "scheduled_at must be in the future." }, { status: 400 });
    }
  }

  const { data, error } = await admin.from("content_posts").update(patch)
    .eq("id", params.id).eq("organisation_id", orgId).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id: data.id, status: data.status });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const admin = createAdminClient();
  const { error } = await admin.from("content_posts").delete().eq("id", params.id).eq("organisation_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
