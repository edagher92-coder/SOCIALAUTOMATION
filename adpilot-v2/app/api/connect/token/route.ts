import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { encrypt } from "@/lib/crypto";
import { syncOrgPlatform } from "@/lib/sync/pull";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

// Dev-link connect: paste a read-only access token (Meta Graph API Explorer / a Business
// System-User token, or a TikTok long-lived token) instead of running full OAuth. Connects
// the account WITHOUT waiting on platform App Review, then pulls data immediately.
const Body = z.object({
  platform: z.enum(["meta", "tiktok"]),
  token: z.string().min(10),
  accountId: z.string().trim().optional(),
});

// Map a Meta Graph API error body into a precise, action-oriented message. Meta uses
// code 190 (with sub-codes) for token problems; we distinguish expired vs revoked vs
// generic-invalid so the user knows exactly what to fix instead of seeing raw API text.
export function metaTokenError(body: any, httpStatus: number): string {
  const err = body?.error || {};
  const code = Number(err.code);
  const sub = Number(err.error_subcode);
  if (code === 190 || code === 102 || code === 463 || httpStatus === 401) {
    // 463 = token expired; 460 = password changed / session invalidated; 467 = invalid/revoked.
    if (sub === 463 || /expired/i.test(err.message || "")) {
      return "This Meta token has expired. Graph API Explorer tokens last only ~1–2 hours — for a connection that keeps running, generate a non-expiring Business System User token (see the token guide below), then reconnect.";
    }
    if (sub === 460 || sub === 467 || /revoked|invalidated/i.test(err.message || "")) {
      return "This Meta token has been revoked or invalidated. Generate a fresh non-expiring System User token (see the token guide below) and reconnect.";
    }
    return "This Meta token is invalid. Paste a current token with the ads_read scope — a non-expiring Business System User token is best (see the token guide below).";
  }
  if (code === 200 || code === 10 || httpStatus === 403) {
    return "Meta refused this token's permissions. Make sure it has the read-only ads_read and read_insights scopes and that your ad accounts are assigned to it (see the token guide below).";
  }
  return err.message || `Meta rejected this token (HTTP ${httpStatus}). Try a fresh non-expiring System User token — see the token guide below.`;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    // Surface the first validation issue so the UI can tell the user what's actually wrong.
    const issue = parsed.error.issues[0];
    const field = issue?.path?.[0];
    const message =
      field === "platform" ? "Choose a platform (meta or tiktok)."
      : field === "token" ? "Paste a valid access token (at least 10 characters)."
      : "platform and token are required.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { platform } = parsed.data;
  const token = parsed.data.token.trim();
  const accountId = parsed.data.accountId?.trim().replace(/^act_/, "") || "";

  // Guard the common mistake of pasting a login email / name into the Account ID box.
  // Meta ad-account ids are numeric; blank means "discover all".
  if (platform === "meta" && accountId && !/^\d+$/.test(accountId)) {
    return NextResponse.json(
      { error: "Account ID must be a numeric Meta ad-account id (e.g. act_1234567890) or left blank to connect all accounts — not your login email." },
      { status: 400 },
    );
  }

  try {
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
    if (!can(await planForOrg(orgId), "api_connect")) {
      return NextResponse.json({ error: "API / dev-link connect is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
    }

    // Validate the token and discover ad accounts before storing anything.
    let accounts: { id: string; name: string }[] = [];
    if (platform === "meta") {
      // Verify the token has the READ-ONLY scopes we need before doing anything else, so a
      // missing-scope token gets a precise "tick ads_read/read_insights" message rather than a
      // confusing empty-accounts result. /me/permissions also doubles as a cheap validity probe.
      const pr = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`);
      const pj: any = await pr.json().catch(() => ({}));
      if (!pr.ok) throw new Error(metaTokenError(pj, pr.status));
      const granted = new Set(
        (pj.data || [])
          .filter((p: any) => p?.status === "granted")
          .map((p: any) => String(p?.permission || "")),
      );
      // ads_read is the required read scope; read_insights is needed for the actual metrics pull.
      // (ads_management would also grant reads but we never request or rely on a write scope.)
      const hasRead = granted.has("ads_read") || granted.has("ads_management");
      const missing = [
        hasRead ? null : "ads_read",
        granted.has("read_insights") ? null : "read_insights",
      ].filter(Boolean);
      if (missing.length) {
        throw new Error(
          `This token is missing the read-only ${missing.join(" and ")} scope${missing.length > 1 ? "s" : ""}. ` +
          `Regenerate it with ads_read and read_insights ticked (no write access needed) — see the token guide below.`,
        );
      }

      const r = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id&access_token=${encodeURIComponent(token)}`);
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(metaTokenError(j, r.status));
      // Meta returns account_id (numeric, no prefix). Normalise away any act_ prefix.
      accounts = (j.data || []).map((a: any) => {
        const id = String(a.account_id || a.id || "").replace(/^act_/, "");
        return { id, name: a.name || `act_${id}` };
      }).filter((a: any) => a.id);
      if (accountId) {
        const match = accounts.filter((a) => a.id === accountId);
        accounts = match.length ? match : [{ id: accountId, name: `act_${accountId}` }];
      }
      if (accounts.length === 0) throw new Error("Token is valid and read-only, but no ad accounts are assigned to it. In Business Settings, assign your ad accounts to this System User, then reconnect.");
    } else {
      // TikTok tokens aren't introspectable without app context, so require the advertiser id.
      if (!accountId) throw new Error("TikTok needs an advertiser_id — paste it in the Account ID field.");
      accounts = [{ id: accountId, name: `Advertiser ${accountId}` }];
    }

    const admin = createAdminClient();
    const enc = encrypt(token);
    const scopes = platform === "meta" ? ["ads_read", "read_insights"] : ["ads.read"];
    await admin.from("platform_tokens").insert({
      organisation_id: orgId, platform, ciphertext: enc.ciphertext, iv: enc.iv, auth_tag: enc.authTag, scopes,
    });
    await admin.from("connected_ad_accounts").insert(
      accounts.map((a) => ({ organisation_id: orgId, platform, external_account_id: a.id, display_name: a.name, status: "connected" })),
    );

    // Automation-first: pull immediately so numbers appear with no extra prompt.
    let inserted = 0;
    let syncError: string | undefined;
    try { inserted = await syncOrgPlatform(admin, orgId, platform); }
    catch (e: any) { syncError = e?.message || "initial sync failed"; }

    return NextResponse.json({
      connected: platform, accounts: accounts.length, inserted, syncError,
      // Tells the UI a connection now exists, so it can offer the one-click "Run my first audit".
      canAudit: true,
    });
  } catch (e: any) {
    const error = e?.message || "Connect failed";
    // Flag token-shaped failures so the UI can deep-link the in-page token guide (#token-help).
    const tokenHelp = /token|scope|expired|revoked|invalid|reconnect/i.test(error);
    return NextResponse.json({ error, tokenHelp }, { status: 502 });
  }
}
