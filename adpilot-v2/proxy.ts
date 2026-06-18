// Refreshes the Supabase session, gates the authenticated app area, and sets a per-request
// nonce-based Content-Security-Policy. Next 16 renamed the `middleware` file convention to
// `proxy` (same request hook). The static security headers (HSTS, COOP, etc.) stay in
// next.config.mjs; CSP lives HERE because the script-src nonce must be generated per request.
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// The authenticated app area. Anything outside this (and /login) is public.
const APP_ROUTES = [
  "/command", "/proposals", "/content", "/messenger", "/actions", "/dashboard", "/ai-specialists", "/build-dashboard", "/canva-creator",
  "/claude-api", "/bobby-business-assistant", "/aria-course-creator", "/crm-maintenance",
  "/reports", "/billing", "/connect", "/notifications", "/agency",
  "/creative", "/settings", "/manual",
];

// script-src is nonce-based (no 'unsafe-inline' for scripts — the real XSS vector). style-src
// keeps 'unsafe-inline' because React inline style attributes (style={{…}}) can't carry a nonce
// and are a far lower risk. Next applies this nonce to its own framework scripts automatically.
function cspFor(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  const isApp = APP_ROUTES.some((r) => p === r || p.startsWith(r + "/"));
  const isLogin = p === "/login" || p.startsWith("/login/");

  // Per-request CSP nonce (Edge-safe: global crypto + btoa, no node Buffer). Forward it on the
  // REQUEST headers so Next can nonce its scripts, and set the CSP on every response we return.
  const nonce = btoa(crypto.randomUUID());
  const csp = cspFor(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const withCsp = <T extends NextResponse>(res: T): T => { res.headers.set("Content-Security-Policy", csp); return res; };

  // Public pages (landing, marketing, etc.) don't gate on auth: set CSP but skip the Supabase
  // session round-trip entirely — they render without the network hop.
  if (!isApp && !isLogin) return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  const response = withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isApp) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCsp(NextResponse.redirect(url));
  }
  // Already signed in? Skip the login screen and land in the Command Centre.
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/command";
    return withCsp(NextResponse.redirect(url));
  }
  return response;
}

// Skip Next internals, static assets, and /api (routes handle their own auth).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
