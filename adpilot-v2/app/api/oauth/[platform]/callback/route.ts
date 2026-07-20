import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOrgManagerRole, getActiveOrgMembership } from "@/lib/org";
import { oauthConfig, type Platform } from "@/lib/oauth/config";
import { encrypt } from "@/lib/crypto";
import { syncOrgPlatform } from "@/lib/sync/pull";
import { META_GRAPH_BASE } from "@/lib/meta/graph-version";

export const runtime = "nodejs";

export async function GET(req: Request, props: { params: Promise<{ platform: string }> }) {
  const params = await props.params;
  const url = new URL(req.url);
  const redirect = (q: string) => NextResponse.redirect(new URL(`/connect?${q}`, req.url));

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const platform = params.platform as Platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("oauth_state")?.value;
  const oauthOrgId = cookieStore.get("oauth_org")?.value;
  // The state token is single-use after a callback attempt. This prevents a valid
  // provider redirect from being replayed later in the same browser session.
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_org");
  if (!code) return redirect(`error=${platform}_no_code`);
  if (!state || state !== cookieState || !oauthOrgId) return redirect(`error=${platform}_bad_state`);
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (membership.orgId !== oauthOrgId || !isOrgManagerRole(membership.role)) return redirect(`error=${platform}_manager_role_required`);

  const cfg = oauthConfig(platform, url.origin);
  if (!cfg.configured) return redirect(`error=${platform}_not_configured`);

  try {
    let accessToken = "";
    let accounts: { id: string; name: string }[] = [];

    if (platform === "meta") {
      const tp = new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri, code });
      const tr = await fetch(`${cfg.tokenUrl}?${tp.toString()}`);
      const tj: any = await tr.json();
      if (!tr.ok || !tj.access_token) throw new Error(tj.error?.message || "token exchange failed");
      accessToken = tj.access_token;
      const ar = await fetch(`${META_GRAPH_BASE}/me/adaccounts?fields=name,account_id&access_token=${encodeURIComponent(accessToken)}`);
      const aj: any = await ar.json();
      accounts = (aj.data || []).map((a: any) => ({ id: a.account_id || a.id, name: a.name || a.id }));
    } else {
      const tr = await fetch(cfg.tokenUrl, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ app_id: cfg.clientId, secret: cfg.clientSecret, auth_code: code }),
      });
      const tj: any = await tr.json();
      const data = tj.data || {};
      if (!data.access_token) throw new Error(tj.message || "token exchange failed");
      accessToken = data.access_token;
      accounts = (data.advertiser_ids || []).map((id: string) => ({ id, name: `Advertiser ${id}` }));
    }

    const orgId = oauthOrgId;
    const admin = createAdminClient();
    const enc = encrypt(accessToken);
    await admin.from("platform_tokens").insert({
      organisation_id: orgId, platform, ciphertext: enc.ciphertext, iv: enc.iv, auth_tag: enc.authTag, scopes: cfg.scope.split(/[ ,]+/),
    });
    if (accounts.length) {
      await admin.from("connected_ad_accounts").insert(
        accounts.map((a) => ({ organisation_id: orgId, platform, external_account_id: a.id, display_name: a.name, status: "connected" }))
      );
      // Automation-first: pull immediately so data appears with no extra step.
      try { await syncOrgPlatform(admin, orgId, platform); } catch { /* the scheduled cron will retry */ }
    }
    return redirect(`connected=${platform}`);
  } catch (e: any) {
    // Don't leak raw upstream/platform error text into the redirect URL; log server-side.
    console.error(`OAuth ${platform} callback failed:`, e?.message || e);
    return redirect(`error=${platform}_failed`);
  }
}
