export type EmailLinkTokens = {
  accessToken: string;
  refreshToken: string;
  type: string | null;
};

/** Keep post-auth navigation on this origin. */
export function safeAuthNext(value: string | null, fallback = "/command"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

/**
 * Supabase's implicit email-link flow returns the short-lived session in the URL
 * fragment. Fragments never reach the server, so consume it in the browser and
 * immediately remove it from browser history before installing the session.
 */
export function parseEmailLinkFragment(fragment: string): EmailLinkTokens | null {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  const accessToken = params.get("access_token")?.trim();
  const refreshToken = params.get("refresh_token")?.trim();
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, type: params.get("type") };
}
