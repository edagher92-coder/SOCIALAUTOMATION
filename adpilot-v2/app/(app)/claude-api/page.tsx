"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function ClaudeApi() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { setSaved(localStorage.getItem("adpilot_claude_key")); }, []);
  const valid = /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(key.trim());

  function save() {
    if (!valid) return;
    localStorage.setItem("adpilot_claude_key", key.trim());
    setSaved(key.trim()); setKey("");
  }
  function clear() { localStorage.removeItem("adpilot_claude_key"); setSaved(null); }
  const mask = (k: string) => k.slice(0, 10) + "…" + k.slice(-4);

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader
        eyebrow="Integrations"
        title="Claude API"
        subtitle="Connect a Claude API key to power live AI generation in Canva Creator, Bobby and Aria."
      />

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div className="mb-3 rounded-xl border border-band-yellow/40 bg-[#fff7e6] p-3 text-sm text-[#7a5b00]">
          🔒 For this browser demo, the key is stored only in <b>your browser</b> (localStorage) and never sent to our servers.
          For production, keys belong on the <b>server</b> (env vars) — never in the browser. Use a key you can rotate.
        </div>
        {saved ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-teal/30 bg-teal-50 p-3">
            <div className="text-sm text-ink">Connected: <code className="rounded bg-surface-raised px-1.5 py-0.5">{mask(saved)}</code></div>
            <button onClick={clear} className="rounded-lg border border-band-red px-3 py-1.5 text-sm font-semibold text-band-red transition hover:bg-band-red hover:text-white">Disconnect</button>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-bold">Claude API key</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" type="password"
              className="w-full rounded-lg border border-border-subtle p-2.5" />
            <button onClick={save} disabled={!valid}
              className="mt-3 rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">Save key</button>
            {key && !valid && <p className="mt-2 text-sm text-band-red">That doesn't look like a Claude key (expected sk-ant-…).</p>}
          </div>
        )}
        <p className="mt-4 text-xs text-muted">
          Get a key at console.anthropic.com → API Keys. Recommended model for these tools: <code>claude-sonnet-4-6</code> (fast)
          or <code>claude-opus-4-8</code> (deepest). Live in-app generation ships with the V2 backend (server-side key, rate-limited).
        </p>
      </div>
    </div>
  );
}
