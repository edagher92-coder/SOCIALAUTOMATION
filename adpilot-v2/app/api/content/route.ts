import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

const CreateBody = z.object({
  platform: z.enum(["facebook", "instagram", "tiktok"]),
  caption: z.string().max(2200).optional(),
  media_url: z.string().url().max(2000).refine((u) => u.startsWith("https://"), "media_url must be https").optional(),
  media_type: z.enum(["image", "video", "reel"]).optional(),
  scheduled_at: z.string().datetime().optional(),
  source: z.enum(["upload", "studio"]).default("upload"),
});

const POST_COLS = "id,platform,caption,media_url,media_type,status,scheduled_at,published_at,external_id,error,source,created_at";

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);

  // Calendar mode: with a date window (?from&to, ISO), return posts by scheduled date so a
  // calendar can bucket them. Without it, keep the queue's "latest first" behaviour (≤200).
  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const from = fromRaw && !Number.isNaN(Date.parse(fromRaw)) ? fromRaw : null;
  const to = toRaw && !Number.isNaN(Date.parse(toRaw)) ? toRaw : null;
  if (from || to) {
    let q = supabase.from("content_posts").select(POST_COLS).eq("organisation_id", orgId).neq("status", "archived");
    if (from) q = q.gte("scheduled_at", from);
    if (to) q = q.lte("scheduled_at", to);
    const { data } = await q.order("scheduled_at", { ascending: true }).limit(500);
    return NextResponse.json({ posts: data || [] });
  }

  const { data } = await supabase.from("content_posts")
    .select(POST_COLS)
    .eq("organisation_id", orgId).neq("status", "archived").order("created_at", { ascending: false }).limit(200);
  return NextResponse.json({ posts: data || [] });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(await planForOrg(orgId), "content_publish")) {
    return NextResponse.json({ error: "Content upload & publishing is a paid feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("content_posts").insert({
    organisation_id: orgId, created_by: user.id, status: "draft", ...parsed.data,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, id: data.id });
}
