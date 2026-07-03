"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePassword() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The reset-link redirect lands here with a recovery token in the URL;
    // supabase-js exchanges it for a session and fires this event once ready.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMsg("Passwords don't match.");
      return;
    }
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setDone(true);
    setMsg("Password updated. Redirecting to sign in…");
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-12">
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-block h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
        AdPilot OS
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-card">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Set a new password</h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            {ready ? "Choose a new password for your account." : "Verifying your reset link…"}
          </p>

          {ready && !done && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
                <input
                  id="password"
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-ink">Confirm password</label>
                <input
                  id="confirm"
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <button
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? "Please wait…" : "Update password"}
              </button>
            </form>
          )}

          {msg && (
            <div role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${done ? "border-good/40 bg-good/10 text-good" : "border-bad/40 bg-bad/10 text-bad"}`}>
              {msg}
            </div>
          )}

          {!ready && !msg && (
            <p className="mt-2 text-sm text-muted">
              If this doesn&apos;t load, request a fresh link from{" "}
              <a href="/login" className="font-semibold text-brand hover:text-brand-700">the sign-in page</a>.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
