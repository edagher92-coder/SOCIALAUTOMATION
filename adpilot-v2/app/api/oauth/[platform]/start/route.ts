import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { oauthConfig, type Platform } from "@/lib/oauth/config";
import { getActiveOrgMembership, isOrgManagerRole } from "@/lib/org";

export const runtime = "nodejs";

export async function GET(req: Request, props: { params: Promise<{ platform: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) {
    return NextResponse.redirect(new URL("/connect?error=manager_role_required", req.url));
  }

  const platform = params.platform as Platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });

  const cfg = oauthConfig(platform, new URL(req.url).origin);
  if (!cfg.configured) return NextResponse.redirect(new URL(`/connect?error=${platform}_not_configured`, req.url));

  // Keep the target organisation in an httpOnly cookie, not in the URL. A random,
  // single-use state token protects against OAuth callback CSRF and avoids exposing
  // user/workspace identifiers to the provider or browser history.
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  const cookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  cookieStore.set("oauth_state", state, cookieOptions);
  cookieStore.set("oauth_org", membership.orgId, cookieOptions);

  const qp = platform === "meta"
    ? new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, scope: cfg.scope, response_type: "code", state })
    : new URLSearchParams({ app_id: cfg.clientId, redirect_uri: cfg.redirectUri, scope: cfg.scope, state });

  return NextResponse.redirect(`${cfg.authorizeUrl}?${qp.toString()}`);
}
