// Refreshes the Supabase session and gates the authenticated app area.
// Next 16 renamed the `middleware` file convention to `proxy` (same request hook).
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// The authenticated app area. Anything outside this (and /login) is public.
const APP_ROUTES = [
  "/command", "/proposals", "/content", "/messenger", "/actions", "/dashboard", "/ai-specialists", "/build-dashboard", "/canva-creator",
  "/claude-api", "/bobby-business-assistant", "/aria-course-creator", "/crm-maintenance",
  "/reports", "/billing", "/connect", "/notifications", "/agency",
  "/creative", "/settings", "/manual",
];

export async function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  const isApp = APP_ROUTES.some((r) => p === r || p.startsWith(r + "/"));
  const isLogin = p === "/login" || p.startsWith("/login/");

  // Public pages (landing, marketing, etc.) don't gate on auth, so skip the Supabase
  // session round-trip entirely — they render without the network hop. The app area still
  // refreshes the session below the moment a user enters it.
  if (!isApp && !isLogin) return NextResponse.next();

  let response = NextResponse.next({ request });
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
    return NextResponse.redirect(url);
  }
  // Already signed in? Skip the login screen and land in the Command Centre.
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/command";
    return NextResponse.redirect(url);
  }
  return response;
}

// Skip Next internals, static assets, and /api (routes handle their own auth).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
