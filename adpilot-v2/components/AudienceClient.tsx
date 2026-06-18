"use client";
import { useState } from "react";
import type { AudienceInsights } from "@/lib/audience/types";
import type { AudienceProposals } from "@/lib/audience/proposals";

const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };

export default function AudienceClient({ insights, proposals, canPublish }: {
  insights: AudienceInsights;
  proposals: AudienceProposals;
  canPublish: boolean;
}) {
  const [ai, setAi] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string>("");

  async function runStrategist() {
    setAiBusy(true); setAiErr(""); setAi("");
    try {
      const r = await fetch("/api/audience/strategy", { method: "POST" });
      const j = await r.json();
      if (r.ok) setAi(j.text || "");
      else setAiErr(j.error || "Couldn’t run the strategist.");
    } catch {
      setAiErr("Network error — try again.");
    } finally {
      setAiBusy(false);
    }
  }

  const maxBracket = Math.max(...insights.ageGender.map((r) => r.female + r.male), 1);
  const maxHour = Math.max(...insights.activeByHour, 1);

  return (
    <div className="space-y-6">
      {insights.source === "sample" && (
        <p className="rounded-xl border border-dashed border-border-subtle bg-surface px-3 py-2 text-xs text-muted">
          Showing a <b>sample audience</b> so you can explore the feature. Connect a Facebook Page / Instagram account to see your real followers.
        </p>
      )}

      {/* Snapshot */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-ink">{insights.handle} · {PLATFORM_LABEL[insights.platform]}</h2>
          <span className="text-sm text-muted">{insights.followerCount.toLocaleString("en-AU")} followers</span>
        </div>

        {/* Gender split */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-2xs font-bold uppercase tracking-wide text-muted">
            <span>Women {proposals.femalePct}%</span><span>Men {proposals.malePct}%</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface">
            <div className="bg-brand" style={{ width: `${proposals.femalePct}%` }} aria-hidden />
            <div className="bg-teal" style={{ width: `${proposals.malePct}%` }} aria-hidden />
          </div>
        </div>

        {/* Age × gender */}
        <div className="mt-5">
          <h3 className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted">Age &amp; gender</h3>
          <div className="space-y-1.5">
            {insights.ageGender.map((r) => (
              <div key={r.bracket} className="flex items-center gap-2 text-2xs">
                <span className="w-12 flex-shrink-0 font-semibold text-ink">{r.bracket}</span>
                <span className="flex h-3 flex-1 overflow-hidden rounded-full bg-surface">
                  <span className="bg-brand" style={{ width: `${(r.female / maxBracket) * 100}%` }} aria-hidden />
                  <span className="bg-teal" style={{ width: `${(r.male / maxBracket) * 100}%` }} aria-hidden />
                </span>
                <span className="w-10 flex-shrink-0 text-right text-muted">{Math.round(r.female + r.male)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-2xs text-muted">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" />Women</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal" />Men</span>
          </div>
        </div>

        {/* Locations + active hours */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted">Top locations</h3>
            <div className="space-y-1.5">
              {insights.topLocations.slice(0, 5).map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-2xs">
                  <span className="w-20 flex-shrink-0 truncate text-ink">{l.name}</span>
                  <span className="h-2 flex-1 rounded-full bg-surface">
                    <span className="block h-2 rounded-full bg-amber" style={{ width: `${(l.share / (insights.topLocations[0]?.share || 1)) * 100}%` }} aria-hidden />
                  </span>
                  <span className="w-8 flex-shrink-0 text-right text-muted">{l.share}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted">When they’re active (local)</h3>
            <div className="flex h-20 items-end gap-px" aria-hidden>
              {insights.activeByHour.map((v, h) => (
                <span key={h} title={`${h}:00 — ${v}`} className={`flex-1 rounded-t ${proposals.bestTimes.some((t) => t.hour === h) ? "bg-brand" : "bg-brand-200"}`} style={{ height: `${Math.max((v / maxHour) * 100, 4)}%` }} />
              ))}
            </div>
            <p className="mt-1 text-2xs text-muted">Peak: {proposals.bestTimes.map((t) => t.label).join(", ")}</p>
          </div>
        </div>
      </section>

      {/* AI strategist */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-ink">🔵 Ask Mira — audience strategist</h2>
          <button onClick={runStrategist} disabled={aiBusy}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50">
            {aiBusy ? "Thinking…" : ai ? "Re-run" : "Interpret my audience"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">Reads the aggregates above and proposes moves — content, a draft ad audience, and creative angles. Suggestions only.</p>
        {aiErr && <p className="mt-3 rounded-lg bg-band-red/10 px-3 py-2 text-sm text-band-red">{aiErr}</p>}
        {ai && <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-3 text-sm leading-relaxed text-ink">{ai}</pre>}
      </section>

      {/* 1) Content planner */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h2 className="font-bold text-ink">🎬 Content plan</h2>
        <p className="mt-1 text-xs text-muted">Themes that fit your {proposals.dominant.bracket} core, plus draft posts timed to when they’re online.</p>
        <ul className="mt-3 space-y-2">
          {proposals.contentThemes.map((t) => (
            <li key={t.title} className="rounded-xl bg-surface p-3 text-sm">
              <span className="font-semibold text-ink">{t.title}</span>
              <p className="mt-0.5 text-xs text-muted">{t.why}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2">
          {proposals.draftPosts.map((d, i) => <DraftPostRow key={i} platform={d.platform} caption={d.caption} whenLabel={d.whenLabel} canPublish={canPublish} />)}
        </div>
        <a href="/content/calendar" className="mt-3 inline-block text-sm font-semibold text-brand">Open the content calendar →</a>
      </section>

      {/* 2) Ad targeting */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h2 className="font-bold text-ink">🎯 Draft ad audiences</h2>
        <p className="mt-1 text-xs text-muted">Starting points that mirror your followers. Drafts only — review in Ads Manager before any spend.</p>
        <div className="mt-3 space-y-2">
          {proposals.adAudiences.map((a) => (
            <div key={a.name} className="rounded-xl border border-border-subtle p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{a.name}</span>
                <CopyButton text={`${a.name}: ${a.spec}`} />
              </div>
              <p className="mt-1 text-sm text-ink">{a.spec}</p>
              <p className="mt-1 text-2xs text-muted">{a.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3) Creative briefs */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h2 className="font-bold text-ink">🎨 Creative briefs</h2>
        <p className="mt-1 text-xs text-muted">Per-segment angles that match who follows you.</p>
        <div className="mt-3 space-y-2">
          {proposals.creativeBriefs.map((b) => (
            <div key={b.segment} className="rounded-xl bg-surface p-3 text-sm">
              <span className="font-semibold text-ink">{b.segment}</span>
              <p className="mt-0.5 text-ink">{b.angle}</p>
              <p className="mt-1 text-xs text-muted">{b.brief}</p>
            </div>
          ))}
        </div>
        <a href="/canva-creator" className="mt-3 inline-block text-sm font-semibold text-brand">Brief it in Canva Creator →</a>
      </section>

      {/* 4) Report section */}
      <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h2 className="font-bold text-ink">🗃️ For your client report</h2>
        <p className="mt-1 text-xs text-muted">Plain-English audience summary you can drop into a white-label report.</p>
        <ul className="mt-3 space-y-1 text-sm text-ink">
          {proposals.reportSummary.map((line, i) => <li key={i} className="flex gap-2"><span className="text-brand" aria-hidden>•</span>{line}</li>)}
        </ul>
        <CopyButton className="mt-3" label="Copy summary" text={proposals.reportSummary.join("\n")} />
      </section>

      <p className="text-center text-2xs text-muted">Aggregate, anonymised data · numbers-first · proposals you approve · no earnings or results guarantees.</p>
    </div>
  );
}

function DraftPostRow({ platform, caption, whenLabel, canPublish }: { platform: string; caption: string; whenLabel: string; canPublish: boolean }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function add() {
    if (!canPublish) return;
    setState("saving");
    try {
      const r = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, caption, source: "studio" }),
      });
      setState(r.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }
  return (
    <div className="rounded-xl border border-border-subtle p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-2xs font-bold uppercase tracking-wide text-muted">{PLATFORM_LABEL[platform] || platform} · best around {whenLabel}</span>
        {canPublish ? (
          <button onClick={add} disabled={state === "saving" || state === "saved"}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50">
            {state === "saving" ? "Adding…" : state === "saved" ? "✓ Added to drafts" : state === "error" ? "Try again" : "Add to drafts"}
          </button>
        ) : (
          <a href="/billing" className="text-2xs font-semibold text-brand">Upgrade to save drafts</a>
        )}
      </div>
      <p className="mt-1 text-sm text-ink">{caption}</p>
    </div>
  );
}

function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } }}
      className={`rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand ${className}`}>
      {done ? "✓ Copied" : label}
    </button>
  );
}
