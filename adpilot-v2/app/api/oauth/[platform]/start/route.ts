import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { oauthConfig, type Platform } from "@/lib/oauth/config";

export const runtime = "nodejs";

export async function GET(req: Request, props: { params: Promise<{ platform: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const platform = params.platform as Platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });

  const cfg = oauthConfig(platform, new URL(req.url).origin);
  if (!cfg.configured) return NextResponse.redirect(new URL(`/connect?error=${platform}_not_configured`, req.url));

  const state = Buffer.from(JSON.stringify({ u: user.id, t: Date.now() })).toString("base64url");
  (await cookies()).set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  const qp = platform === "meta"
    ? new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, scope: cfg.scope, response_type: "code", state })
    : new URLSearchParams({ app_id: cfg.clientId, redirect_uri: cfg.redirectUri, scope: cfg.scope, state });

  return NextResponse.redirect(`${cfg.authorizeUrl}?${qp.toString()}`);
}
