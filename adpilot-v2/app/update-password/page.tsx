"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSuccess(false);
    if (password !== confirmPassword) {
      setMsg("The passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setSuccess(true);
    setMsg("Password updated. You can now continue to AdPilot.");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-12">
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-block h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
        AdPilot OS
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">V6</span>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-white p-8 shadow-card">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Choose a new password</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Use at least eight characters.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
            <input id="password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:shadow-ring-brand" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-ink">Confirm new password</label>
            <input id="confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:shadow-ring-brand" />
          </div>
          <button disabled={busy} className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
        {msg && <div role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${success ? "border-teal-100 bg-teal-50 text-teal" : "border-red-100 bg-red-50 text-band-red"}`}>{msg}</div>}
        <div className="mt-6 border-t border-border-subtle pt-5 text-center">
          <Link href={success ? "/command" : "/login"} className="text-sm font-semibold text-brand hover:text-brand-700">
            {success ? "Continue to AdPilot" : "Back to sign in"}
          </Link>
        </div>
      </div>
    </main>
  );
}
