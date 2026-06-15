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
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-7 shadow-card">
        <h1 className="text-xl font-extrabold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mb-4 mt-1 text-sm text-muted">AdPilot OS V2</p>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full rounded-lg border border-[#e3e8ef] p-2.5" type="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded-lg border border-[#e3e8ef] p-2.5" type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-bold text-white disabled:opacity-60">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-band-red">{msg}</p>}
        <button className="mt-4 text-sm font-semibold text-brand"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
