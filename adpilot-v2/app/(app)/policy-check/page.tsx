"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";

// Policy Check — paste your ad copy, Paige reviews it for Meta/TikTok policy and
// Australian Consumer Law risk and returns per-item verdicts + compliant rewrites.
// Gated server-side (ai_team / Pro & Expert); shows an upgrade prompt on 402.

type Platform = "meta" | "tiktok" | "both";

export default function PolicyCheck() {
  const [headline, setHeadline] = useState("");
  const [primary, setPrimary] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<Platform>("both");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [errCode, setErrCode] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasCopy = [headline, primary, description].some((v) => v.trim());

  async function run() {
    if (busy || !hasCopy) return;
    setBusy(true); setErr(""); setErrCode(""); setNeedsUpgrade(false); setText("");
    try {
      const r = await fetch("/api/policy/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim() || undefined,
          primary: primary.trim() || undefined,
          description: description.trim() || undefined,
          platform,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 402) { setNeedsUpgrade(true); return; }
      if (!r.ok) {
        setErrCode(typeof j?.code === "string" ? j.code : "");
        setErr(j?.error || `The policy check couldn't respond (error ${r.status}). Please try again.`);
        return;
      }
      const answer = typeof j?.text === "string" ? j.text.trim() : "";
      if (!answer) { setErr("The policy check returned an empty answer. Please try again."); return; }
      setText(answer);
    } catch {
      setErr("Couldn't reach the policy check. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        eyebrow="AI team"
        title="Policy Check"
        subtitle="Paste your ad copy — Paige checks it against Meta &amp; TikTok policy and Australian Consumer Law, then returns a pass / flag / fix verdict and compliant rewrites."
      />

      {needsUpgrade && (
        <div className="mb-5 rounded-2xl border border-border-subtle bg-gradient-to-br from-[#eef4ff] to-white p-6 shadow-card" role="alert">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold text-ink">Policy Check is a Pro &amp; Expert feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">It's part of the AI specialist team. Upgrade to have Paige review your copy for policy and Australian Consumer Law risk before you publish.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <div className="mb-3 flex gap-2">
          {(["meta", "tiktok", "both"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              aria-pressed={platform === p}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${platform === p ? "bg-brand text-white" : "border border-border-subtle bg-surface text-muted hover:text-ink"}`}>
              {p === "meta" ? "Meta" : p === "tiktok" ? "TikTok" : "Both"}
            </button>
          ))}
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-2xs font-bold uppercase tracking-widest text-muted">Headline</span>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} disabled={busy}
            placeholder="e.g. Lose 10kg — guaranteed"
            className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-sm disabled:opacity-60 focus-visible:shadow-ring-brand" />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-2xs font-bold uppercase tracking-widest text-muted">Primary text</span>
          <textarea value={primary} onChange={(e) => setPrimary(e.target.value)} disabled={busy}
            placeholder="The main body of your ad…"
            className="h-28 w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-sm disabled:opacity-60 focus-visible:shadow-ring-brand" />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-2xs font-bold uppercase tracking-widest text-muted">Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy}
            placeholder="Optional link description"
            className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-sm disabled:opacity-60 focus-visible:shadow-ring-brand" />
        </label>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={busy || !hasCopy}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Checking…" : "Check copy"}
          </button>
          <span className="text-2xs text-muted">Paige has final say · guidance, not legal advice · read-only.</span>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-band-red/30 bg-band-red/5 p-3 text-sm text-band-red" role="alert">
            <p>{err}</p>
            {errCode === "NO_KEY" && (
              <p className="mt-1 text-2xs text-muted">An administrator needs to add <code>ANTHROPIC_API_KEY</code> on the server.</p>
            )}
          </div>
        )}
        {busy && !text && !err && (
          <p className="mt-4 text-sm text-muted" aria-live="polite">Paige is reviewing your copy for policy &amp; Australian Consumer Law risk…</p>
        )}
        {text && <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border-subtle bg-surface p-4 text-sm leading-relaxed text-ink">{text}</pre>}
      </div>
    </div>
  );
}
