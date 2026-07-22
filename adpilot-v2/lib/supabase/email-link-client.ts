import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Email links need to work when requested on a laptop and opened on a phone.
 * PKCE deliberately binds the exchange to the requesting browser, so email-only
 * sign-up and recovery requests use Supabase's implicit link flow. The receiving
 * page immediately moves the returned session out of the URL and into the normal
 * @supabase/ssr cookie client.
 */
export function createEmailLinkClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
