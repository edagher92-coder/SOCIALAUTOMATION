import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { applyMessengerProfile, getMessengerProfile, type MessengerConfig } from "@/lib/messenger/profile";

export const runtime = "nodejs";

// Premium (Expert) feature: configure a Page's Messenger entry experience via the Graph
// API — no browser, no "Allow" prompts. WRITE-scoped; separate from the read-only ad layer.
const Body = z.object({
  pageToken: z.string().min(20).optional(),
  greeting: z.string().max(600).optional(),
  ice_breakers: z.array(z.object({ question: z.string().min(1).max(80), payload: z.string().min(1).max(60) })).max(4).optional(),
  persistent_menu: z.array(z.union([
    z.object({ type: z.literal("web_url"), title: z.string().min(1).max(30), url: z.string().url() }),
    z.object({ type: z.literal("postback"), title: z.string().min(1).max(30), payload: z.string().min(1).max(60) }),
  ])).max(3).optional(),
});

async function gate(): Promise<NextResponse | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners and admins can configure customer messaging." }, { status: 403 });
  }
  const orgId = membership.orgId;
  if (!can(await planForOrg(orgId), "messenger_automation")) {
    return NextResponse.json({ error: "Messenger automation is a Premium (Expert) feature. Upgrade on Billing.", upgrade: true }, { status: 402 });
  }
  return null;
}

const envToken = () => (process.env.META_PAGE_ACCESS_TOKEN || "").trim();

export async function GET(req: Request) {
  const blocked = await gate(); if (blocked) return blocked;
  const token = (new URL(req.url).searchParams.get("pageToken") || envToken()).trim();
  if (!token) return NextResponse.json({ error: "No Page token. Paste one or set META_PAGE_ACCESS_TOKEN.", notConfigured: true }, { status: 503 });
  try { return NextResponse.json(await getMessengerProfile(token)); }
  catch (e: any) { return NextResponse.json({ error: e?.message || "Read failed" }, { status: 502 }); }
}

export async function POST(req: Request) {
  const blocked = await gate(); if (blocked) return blocked;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid config", details: parsed.error.flatten() }, { status: 400 });

  const token = (parsed.data.pageToken || envToken()).trim();
  if (!token) return NextResponse.json({ error: "No Page token. Paste a Page token (pages_messaging + pages_manage_metadata) or set META_PAGE_ACCESS_TOKEN.", notConfigured: true }, { status: 503 });

  const cfg: MessengerConfig = {
    greeting: parsed.data.greeting,
    ice_breakers: parsed.data.ice_breakers,
    persistent_menu: parsed.data.persistent_menu,
  };
  try {
    const result = await applyMessengerProfile(token, cfg);
    return NextResponse.json({ ok: true, page: result.page });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Apply failed" }, { status: 502 });
  }
}
