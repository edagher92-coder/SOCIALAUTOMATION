// Server-side Supabase client (App Router, @supabase/ssr).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  // Next 15+: cookies() is async. Await it INSIDE the async cookie callbacks so createClient
  // stays synchronous (no ripple to its ~30 callers). @supabase/ssr supports async cookie methods.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookies()).getAll();
        },
        async setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            const store = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // called from a Server Component — safe to ignore (middleware refreshes the session)
          }
        },
      },
    }
  );
}
