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
  media_url: z.string().url().max(2000).optional(),
  media_type: z.enum(["image", "video", "reel"]).optional(),
  scheduled_at: z.string().datetime().optional(),
  source: z.enum(["upload", "studio"]).default("upload"),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const { data } = await supabase.from("content_posts")
    .select("id,platform,caption,media_url,media_type,status,scheduled_at,published_at,error,source,created_at")
    .eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(200);
  return NextResponse.json({ posts: data || [] });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
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
