"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (mode === "signup") { setMsg("Check your email to confirm, then sign in."); return; }
    router.push("/command");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mesh px-5 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-block h-9 w-9 rounded-xl bg-brand-gradient shadow-glow" aria-hidden />
        <span className="text-gradient">AdPilot OS</span>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">V3</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border-subtle bg-white/90 p-8 shadow-card backdrop-blur-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {mode === "signin" ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            {mode === "signin" ? "Sign in to your AdPilot OS workspace." : "Your ads & content, on autopilot — start free."}
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
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
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
            <button
              disabled={busy}
              className="mt-1 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {msg && (
            <div role="alert" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${msg.includes("Check") ? "border-teal-100 bg-teal-50 text-teal" : "border-red-100 bg-red-50 text-band-red"}`}>
              {msg}
            </div>
          )}

          <div className="mt-6 border-t border-border-subtle pt-5 text-center">
            <button
              className="text-sm font-semibold text-brand transition hover:text-brand-700 focus-visible:underline"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}>
              {mode === "signin" ? "Need an account? Sign up →" : "Already have an account? Sign in →"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Read-only · proposals only · your data stays private
        </p>
      </div>
    </main>
  );
}
