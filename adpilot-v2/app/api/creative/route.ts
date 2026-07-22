import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const { data } = await supabase.from("creative_assets")
    .select("id,kind,source,provider,title,url,linked_campaign,created_at")
    .eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ assets: data || [] });
}

const Body = z.object({
  kind: z.enum(["image", "video", "audio"]),
  source: z.enum(["link", "upload", "ai"]).default("link"),
  provider: z.string().max(80).optional().or(z.literal("")),
  title: z.string().max(160).optional().or(z.literal("")),
  url: z.string().url(),
  linked_campaign: z.string().max(160).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "A valid URL and kind are required" }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("creative_assets")
    .insert({ organisation_id: orgId, created_by: user.id, ...parsed.data }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ id: data?.id, ok: true });
}
