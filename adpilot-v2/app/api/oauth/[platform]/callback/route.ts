import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";
import { oauthConfig, type Platform } from "@/lib/oauth/config";
import { encrypt } from "@/lib/crypto";
import { syncOrgPlatform } from "@/lib/sync/pull";

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
  const cookieState = (await cookies()).get("oauth_state")?.value;
  if (!code) return redirect(`error=${platform}_no_code`);
  if (!state || state !== cookieState) return redirect(`error=${platform}_bad_state`);
  // Bind the flow to the signed-in user: the state encodes the user id; reject a mismatch so a
  // captured callback can't be replayed against a different session (the cookie is httpOnly+lax).
  let stateUser = "";
  try { stateUser = JSON.parse(Buffer.from(state, "base64url").toString())?.u || ""; } catch { /* malformed state */ }
  if (stateUser !== user.id) return redirect(`error=${platform}_bad_state`);

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
      const ar = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id&access_token=${encodeURIComponent(accessToken)}`);
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

    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
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
