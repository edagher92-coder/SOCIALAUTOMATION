"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LEGAL_VERSION = "v4-draft";
const LEGAL_HASH = "placeholder-v4-draft";
type Mode = "signin" | "signup" | "forgot";

function authCallback(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [agreed, setAgreed] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const notice = new URLSearchParams(window.location.search).get("notice");
    if (notice === "confirmed") {
      setSuccess(true);
      setMsg("Email confirmed. You can sign in now.");
    } else if (notice === "recovery-expired") {
      setSuccess(false);
      setMsg("That password link is invalid or expired. Request a new one below.");
      setMode("forgot");
    }
  }, []);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMsg("");
    setSuccess(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agreed) {
      setSuccess(false);
      setMsg("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setBusy(true);
    setMsg("");
    setSuccess(false);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authCallback("/update-password"),
      });
      setBusy(false);
      if (error) {
        setMsg(error.message);
        return;
      }
      setSuccess(true);
      setMsg("Password reset email sent. Check your inbox and spam folder.");
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setMsg(error.message === "Invalid login credentials"
          ? "Email or password is incorrect. Try again or reset your password."
          : error.message);
        return;
      }
      router.push("/command");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallback("/command"),
        data: { legal_version: LEGAL_VERSION, legal_hash: LEGAL_HASH },
      },
    });
    if (error) {
      setBusy(false);
      setMsg(error.message);
      return;
    }

    if (data.user?.identities && data.user.identities.length === 0) {
      setBusy(false);
      setSuccess(true);
      setMsg("An account may already exist for this email. Sign in or use Forgot password.");
      return;
    }

    if (data.session) {
      await recordLegalAcceptance();
      setBusy(false);
      router.push("/command");
      router.refresh();
      return;
    }

    setBusy(false);
    setSuccess(true);
    setMsg("Account created. Check your email and tap Confirm email to finish signing up.");
  }

  async function recordLegalAcceptance() {
    await Promise.allSettled(
      (["terms", "privacy"] as const).map((document) =>
        fetch("/api/legal/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document, version: LEGAL_VERSION, content_hash: LEGAL_HASH }),
        }),
      ),
    );
  }

  const heading = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password";
  const description = mode === "signin"
    ? "Sign in to your AdPilot OS workspace."
    : mode === "signup"
      ? "Create your account, then confirm your email."
      : "We will email you a secure password reset link.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-12">
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-block h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
        AdPilot OS
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">V6</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border-subtle bg-white p-8 shadow-card">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{heading}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{description}</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
              <input
                id="email"
                className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-ink">Password</label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => changeMode("forgot")} className="text-xs font-semibold text-brand hover:text-brand-700">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
            )}

            {mode === "signup" && (
              <label htmlFor="legal-consent" className="flex items-start gap-2.5 text-sm text-muted">
                <input
                  id="legal-consent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-semibold text-brand hover:text-brand-700">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" target="_blank" className="font-semibold text-brand hover:text-brand-700">Privacy Policy</Link>.
                </span>
              </label>
            )}

            <button
              disabled={busy || (mode === "signup" && !agreed)}
              className="mt-1 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          {msg && (
            <div role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${success ? "border-teal-100 bg-teal-50 text-teal" : "border-red-100 bg-red-50 text-band-red"}`}>
              {msg}
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-border-subtle pt-5 text-center">
            {mode === "signin" ? (
              <button type="button" className="text-sm font-semibold text-brand hover:text-brand-700" onClick={() => changeMode("signup")}>
                Need an account? Sign up
              </button>
            ) : (
              <button type="button" className="text-sm font-semibold text-brand hover:text-brand-700" onClick={() => changeMode("signin")}>
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">Read-only by default · proposals first · you stay in control</p>
      </div>
    </main>
  );
}
