export type EmailLinkTokens = {
  accessToken: string;
  refreshToken: string;
  type: string | null;
};

const AUTH_RETURN_ORIGIN = "https://auth-return.invalid";
const AUTH_RETURN_PATHS = new Set(["/command", "/update-password"]);

/** Keep post-auth navigation on this origin and on an intentional destination. */
export function safeAuthNext(value: string | null, fallback = "/command"): string {
  if (!value) return fallback;
  try {
    // URLSearchParams decodes `%5c`, `%2f` and control characters before this
    // function sees them. The browser URL parser can turn values such as
    // `/\\evil.example` into an external origin, so string-prefix checks are not
    // sufficient. Parse exactly as navigation will and compare the origin.
    const parsed = new URL(value, AUTH_RETURN_ORIGIN);
    if (parsed.origin !== AUTH_RETURN_ORIGIN || !AUTH_RETURN_PATHS.has(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
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
