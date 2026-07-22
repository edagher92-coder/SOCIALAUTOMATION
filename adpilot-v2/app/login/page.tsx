"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createEmailLinkClient } from "@/lib/supabase/email-link-client";
import { Icon } from "@/components/icons";

const LEGAL_VERSION = "v4-draft";
const LEGAL_HASH = "placeholder-v4-draft";
type Mode = "signin" | "signup" | "forgot";

function emailLinkReturn(next: string): string {
  return `${window.location.origin}/auth/complete?next=${encodeURIComponent(next)}`;
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [agreed, setAgreed] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notice = params.get("notice");
    if (params.get("mode") === "signup") setMode("signup");
    if (notice === "confirmed") {
      setSuccess(true);
      setMsg("Email confirmed. Sign in to open your workspace.");
    } else if (notice === "password-updated") {
      setSuccess(true);
      setMsg("Password updated. Sign in with your new password.");
    } else if (notice === "recovery-expired") {
      setSuccess(false);
      setMsg("That reset link is invalid or has expired. Send a new one below.");
      setMode("forgot");
    }
  }, []);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMsg("");
    setSuccess(false);
    setPassword("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();
    if (mode === "signup" && !agreed) {
      setSuccess(false);
      setMsg("Agree to the Terms and Privacy Policy to create an account.");
      return;
    }

    setBusy(true);
    setMsg("");
    setSuccess(false);

    if (mode === "forgot") {
      // Email recovery must survive a laptop-to-phone handoff. The normal SSR
      // client uses PKCE, whose verifier only exists in the requesting browser.
      const emailClient = createEmailLinkClient();
      const { error } = await emailClient.auth.resetPasswordForEmail(cleanEmail, { redirectTo: emailLinkReturn("/update-password") });
      setBusy(false);
      if (error) { setMsg(error.message); return; }
      setSuccess(true);
      setMsg("Reset link sent. Open the newest email on this phone or any other device.");
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      setBusy(false);
      if (error) {
        setMsg(error.message === "Invalid login credentials" ? "That email and password do not match. Try again or reset your password." : error.message);
        return;
      }
      router.push("/command");
      router.refresh();
      return;
    }

    // Confirmation emails use the same cross-device-safe link handoff as recovery.
    const emailClient = createEmailLinkClient();
    const { data, error } = await emailClient.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: emailLinkReturn("/command"), data: { legal_version: LEGAL_VERSION, legal_hash: LEGAL_HASH } },
    });
    if (error) { setBusy(false); setMsg(error.message); return; }
    if (data.user?.identities && data.user.identities.length === 0) {
      setBusy(false); setSuccess(true); setMsg("This email may already have an account. Sign in or reset the password."); return;
    }
    if (data.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) { setBusy(false); setMsg("Your account was created, but the secure session could not be opened. Please sign in."); return; }
      await recordLegalAcceptance();
      setBusy(false);
      router.push("/command");
      router.refresh();
      return;
    }
    setBusy(false);
    setSuccess(true);
    setMsg("Account created. Open the confirmation email to finish. Check spam if it is not in your inbox.");
  }

  async function recordLegalAcceptance() {
    await Promise.allSettled(([
      "terms", "privacy",
    ] as const).map((document) => fetch("/api/legal/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document, version: LEGAL_VERSION, content_hash: LEGAL_HASH }) })));
  }

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your workspace" : "Reset your password";
  const subtitle = mode === "signin" ? "Use the email and password for your AdPilot account." : mode === "signup" ? "Start with a private workspace. Connect advertising data after sign-up." : "We will send a secure link to the account email.";

  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-mesh p-3 sm:p-6 lg:grid lg:grid-cols-[minmax(360px,.85fr)_minmax(520px,1.15fr)] lg:gap-6">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-cockpit p-10 text-cockpit-ink lg:flex lg:flex-col">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow"><Icon name="radar" size={18} /></span>AdPilot <span className="rounded-full bg-white/10 px-2 py-0.5 text-2xs text-brand-200">V7</span></Link>
        <div className="relative my-auto py-12">
          <div className="text-2xs font-extrabold uppercase tracking-[0.2em] text-brand">A calmer way to run ads</div>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.08]">Know what changed, why it matters, and what to do next.</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-cockpit-muted">AdPilot combines paid-ad health, creative workflows, reporting and safe automation in one explainable workspace.</p>
          <ul className="mt-8 space-y-4">
            {[
              ["Explain every recommendation", "Every fix includes its source window, reason and confidence."],
              ["Automate the repetitive work", "Sync, scoring, alerts, reports and drafts can run on schedule."],
              ["Keep spend under human control", "Live budget, bid and campaign changes stay blocked."],
            ].map(([heading, body]) => <li key={heading} className="flex gap-3"><span className="mt-0.5 text-good"><Icon name="check-circle" size={18} /></span><span><b className="block text-sm text-cockpit-ink">{heading}</b><span className="text-sm text-cockpit-muted">{body}</span></span></li>)}
          </ul>
        </div>
        <p className="relative text-xs text-cockpit-muted">Read-only paid-ad access · encrypted credentials · no results guarantees</p>
      </section>

      <section className="flex min-h-[calc(100vh-1.5rem)] min-w-0 items-center justify-center rounded-[2rem] border border-border-subtle bg-white/90 px-4 py-10 shadow-card backdrop-blur sm:min-h-[calc(100vh-3rem)] sm:px-5">
        <div className="w-full min-w-0 max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 text-lg font-extrabold text-ink lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white"><Icon name="radar" size={18} /></span>AdPilot <span className="text-2xs text-brand">V7</span></Link>

          {mode !== "forgot" && (
            <div className="mb-7 grid min-w-0 grid-cols-2 rounded-xl bg-surface p-1" aria-label="Account access">
              <button type="button" onClick={() => changeMode("signin")} aria-pressed={mode === "signin"} className={`min-w-0 rounded-lg px-2 py-2.5 text-sm font-bold sm:px-4 ${mode === "signin" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Sign in</button>
              <button type="button" onClick={() => changeMode("signup")} aria-pressed={mode === "signup"} className={`min-w-0 rounded-lg px-2 py-2.5 text-sm font-bold sm:px-4 ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Create account</button>
            </div>
          )}

          <div className="text-2xs font-extrabold uppercase tracking-[0.18em] text-brand">{mode === "forgot" ? "Account recovery" : "Secure workspace access"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block" htmlFor="email"><span className="mb-1.5 block text-sm font-bold text-ink">Email address</span><input id="email" className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 text-sm text-ink shadow-inner-sm placeholder:text-muted hover:border-brand-200 focus:border-brand focus:bg-white focus:outline-none focus:shadow-ring-brand" type="email" placeholder="you@business.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" inputMode="email" /></label>

            {mode !== "forgot" && (
              <label className="block" htmlFor="password">
                <span className="mb-1.5 flex items-center justify-between"><span className="text-sm font-bold text-ink">Password</span>{mode === "signin" && <button type="button" onClick={() => changeMode("forgot")} className="text-xs font-bold text-brand hover:text-brand-700">Forgot password?</button>}</span>
                <span className="relative block"><input id="password" className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 pr-16 text-sm text-ink shadow-inner-sm placeholder:text-muted hover:border-brand-200 focus:border-brand focus:bg-white focus:outline-none focus:shadow-ring-brand" type={showPassword ? "text" : "password"} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-muted hover:text-ink" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></span>
                {mode === "signup" && <span className={`mt-1.5 flex items-center gap-1.5 text-xs ${password.length >= 8 ? "text-green-700" : "text-muted"}`}><Icon name={password.length >= 8 ? "check-circle" : "info"} size={13} /> Use 8 or more characters</span>}
              </label>
            )}

            {mode === "signup" && <label htmlFor="legal-consent" className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface p-3 text-sm leading-relaxed text-muted"><input id="legal-consent" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required /><span>I agree to the <Link href="/terms" target="_blank" className="font-bold text-brand">Terms</Link> and <Link href="/privacy" target="_blank" className="font-bold text-brand">Privacy Policy</Link>.</span></label>}

            <button type="submit" disabled={busy || (mode === "signup" && !agreed)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-white shadow-glow hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Please wait</> : mode === "signin" ? "Sign in to AdPilot" : mode === "signup" ? "Create secure workspace" : "Send a new reset link"}</button>
          </form>

          {msg && <div role="alert" className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${success ? "border-good/30 bg-good/10 text-green-800" : "border-bad/30 bg-bad/10 text-bad"}`}><span className="mt-0.5"><Icon name={success ? "check-circle" : "alert-triangle"} size={16} /></span><span>{msg}</span></div>}

          {mode === "forgot" && <div className="mt-5 space-y-3 border-t border-border-subtle pt-5"><button type="button" onClick={() => changeMode("signin")} className="w-full text-sm font-bold text-brand">Back to sign in</button><p className="text-center text-xs leading-relaxed text-muted">If you request more than one email, use the newest link. You can safely open it on your phone, tablet, or computer.</p></div>}

          <p className="mt-7 text-center text-xs text-muted">Need help getting started? <Link href="/how-it-works" className="font-bold text-ink underline">See how AdPilot works</Link></p>
        </div>
      </section>
    </main>
  );
}
