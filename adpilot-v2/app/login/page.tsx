"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Version + stable placeholder hash recorded against each legal acceptance at signup.
const LEGAL_VERSION = "v4-draft";
const LEGAL_HASH = "placeholder-v4-draft";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [agreed, setAgreed] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agreed) {
      setMsg("Please agree to the Terms of Service & Privacy Policy to continue.");
      return;
    }
    setBusy(true); setMsg("");
    if (mode === "reset") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      setBusy(false);
      if (resetError) { setMsg(resetError.message); return; }
      setMsg("Check your email for a password reset link.");
      return;
    }
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    if (error) { setBusy(false); setMsg(error.message); return; }
    if (mode === "signup") {
      // Record acceptance of both documents for the freshly-created user.
      // Best-effort: a failure here must not block account creation.
      await Promise.allSettled(
        (["terms", "privacy"] as const).map((document) =>
          fetch("/api/legal/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ document, version: LEGAL_VERSION, content_hash: LEGAL_HASH }),
          }),
        ),
      );
      setBusy(false);
      setMsg("Check your email to confirm, then sign in.");
      return;
    }
    setBusy(false);
    router.push("/command");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-block h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
        AdPilot OS
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">V7</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-card">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset your password"}
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Sign in to your AdPilot OS workspace."
              : mode === "signup"
                ? "Start your AdPilot OS free trial."
                : "Enter your email and we'll send you a link to reset your password."}
          </p>

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
            {mode !== "reset" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-ink">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand hover:text-brand-700"
                      onClick={() => { setMode("reset"); setMsg(""); }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
                  type="password"
                  placeholder="Min. 8 characters"
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
                  {" "}&amp;{" "}
                  <Link href="/privacy" target="_blank" className="font-semibold text-brand hover:text-brand-700">Privacy Policy</Link>.
                </span>
              </label>
            )}
            <button
              disabled={busy || (mode === "signup" && !agreed)}
              className="mt-1 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          {msg && (
            <div role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${msg.includes("Check") ? "border-good/40 bg-good/10 text-good" : "border-bad/40 bg-bad/10 text-bad"}`}>
              {msg}
            </div>
          )}

          <div className="mt-6 border-t border-border-subtle pt-5 text-center">
            {mode === "reset" ? (
              <button
                className="text-sm font-semibold text-brand transition hover:text-brand-700 focus-visible:underline"
                onClick={() => { setMode("signin"); setMsg(""); }}>
                ← Back to sign in
              </button>
            ) : (
              <button
                className="text-sm font-semibold text-brand transition hover:text-brand-700 focus-visible:underline"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}>
                {mode === "signin" ? "Need an account? Sign up →" : "Already have an account? Sign in →"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Read-only · proposals only · your data stays private
        </p>
      </div>
    </main>
  );
}
