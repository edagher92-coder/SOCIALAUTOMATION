import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeAuthNext } from "@/lib/auth/email-link";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]);

function failureRedirect(origin: string, type: string | null) {
  const notice = type === "recovery" ? "recovery-expired" : "email-link-invalid";
  return NextResponse.redirect(new URL(`/login?notice=${notice}`, origin));
}

/**
 * Token-hash endpoint for hardened Supabase email templates. Unlike PKCE, this
 * server verification is not tied to the browser that requested the email.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash")?.trim();
  const rawType = url.searchParams.get("type");
  const type = rawType && EMAIL_OTP_TYPES.has(rawType as EmailOtpType)
    ? rawType as EmailOtpType
    : null;
  const fallback = type === "recovery" ? "/update-password" : "/command";
  const next = safeAuthNext(url.searchParams.get("next"), fallback);

  if (!tokenHash || !type) return failureRedirect(url.origin, rawType);

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return failureRedirect(url.origin, type);

  return NextResponse.redirect(new URL(next, url.origin));
}
