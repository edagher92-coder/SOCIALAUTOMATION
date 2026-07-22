"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => { setHasSession(Boolean(data.session)); setChecking(false); });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    setMsg(""); setSuccess(false);
    if (password !== confirmPassword) { setMsg("The passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setSuccess(true);
    setMsg("Password updated. You can continue straight to your workspace.");
  }

  const requirements = [
    { label: "8 or more characters", met: password.length >= 8 },
    { label: "Both entries match", met: password.length > 0 && password === confirmPassword },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center gap-2.5 text-lg font-extrabold text-ink"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white"><Icon name="radar" size={18} /></span>AdPilot <span className="text-2xs text-brand">V7</span></Link>
        <section className="rounded-3xl border border-border-subtle bg-white p-6 shadow-card sm:p-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><Icon name="key" size={21} /></div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Choose a new password</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">This page only works after opening a fresh AdPilot reset email.</p>

          {checking ? <div className="mt-6 h-28 animate-pulse rounded-2xl bg-surface" /> : !hasSession ? (
            <div className="mt-6 rounded-2xl border border-warn/30 bg-warn/10 p-4"><div className="flex items-center gap-2 font-bold text-amber-900"><Icon name="alert-triangle" size={17} /> This reset link is no longer active</div><p className="mt-2 text-sm leading-relaxed text-amber-900/75">Request another email and use the newest link. Reset links can expire or be replaced by a newer request.</p><Link href="/login?notice=recovery-expired" className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">Send a new reset link</Link></div>
          ) : success ? (
            <div className="mt-6 rounded-2xl border border-good/30 bg-good/10 p-5 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-good/15 text-green-700"><Icon name="check-circle" size={23} /></span><p className="mt-3 font-extrabold text-green-900">Password updated</p><p className="mt-1 text-sm text-green-900/70">Your recovery session is valid and your new password is saved.</p><Link href="/command" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">Continue to AdPilot <Icon name="chevron-right" size={15} /></Link></div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block" htmlFor="password"><span className="mb-1.5 block text-sm font-bold text-ink">New password</span><span className="relative block"><input id="password" type={showPassword ? "text" : "password"} minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 pr-16 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none focus:shadow-ring-brand" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-muted">{showPassword ? "Hide" : "Show"}</button></span></label>
              <label className="block" htmlFor="confirm-password"><span className="mb-1.5 block text-sm font-bold text-ink">Confirm new password</span><input id="confirm-password" type={showPassword ? "text" : "password"} minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none focus:shadow-ring-brand" /></label>
              <ul className="space-y-1.5 rounded-xl bg-surface p-3">{requirements.map((item) => <li key={item.label} className={`flex items-center gap-2 text-xs font-semibold ${item.met ? "text-green-700" : "text-muted"}`}><Icon name={item.met ? "check-circle" : "hourglass"} size={13} /> {item.label}</li>)}</ul>
              <button type="submit" disabled={busy || !requirements.every((item) => item.met)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-glow disabled:opacity-50">{busy ? "Updating..." : "Update password"}</button>
            </form>
          )}

          {msg && !success && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3 text-sm font-semibold text-bad"><Icon name="alert-triangle" size={16} /> {msg}</div>}
          {!success && <div className="mt-6 border-t border-border-subtle pt-5 text-center"><Link href="/login" className="text-sm font-bold text-brand">Back to sign in</Link></div>}
        </section>
      </div>
    </main>
  );
}
