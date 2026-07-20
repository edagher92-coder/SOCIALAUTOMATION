import "server-only";
import { META_GRAPH_VERSION } from "@/lib/meta/graph-version";

// Read-only OAuth provider config. Live values come from env; absent => not configured.
export type Platform = "meta" | "tiktok";

export function oauthConfig(platform: Platform, origin: string) {
  const redirectBase = process.env.OAUTH_REDIRECT_BASE || origin;
  if (platform === "meta") {
    return {
      configured: !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
      clientId: process.env.META_APP_ID || "",
      clientSecret: process.env.META_APP_SECRET || "",
      redirectUri: `${redirectBase}/api/oauth/meta/callback`,
      authorizeUrl: `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`,
      tokenUrl: `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      scope: "ads_read,read_insights",
    };
  }
  return {
    configured: !!(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET),
    clientId: process.env.TIKTOK_APP_ID || "",
    clientSecret: process.env.TIKTOK_APP_SECRET || "",
    redirectUri: `${redirectBase}/api/oauth/tiktok/callback`,
    // TikTok Business auth endpoints (read-only reporting scope).
    authorizeUrl: "https://business-api.tiktok.com/portal/auth",
    tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    scope: "ads.read",
  };
}
