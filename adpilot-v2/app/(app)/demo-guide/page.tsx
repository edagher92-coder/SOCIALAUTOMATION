"use client";
import { useState } from "react";
import Link from "next/link";

// Interactive demo walkthrough. Explains what AdPilot is and gives a guided,
// per-persona tour of the two seeded demo accounts (see scripts/seed-demo.ts).

type PersonaKey = "creator" | "cafe";

const PERSONAS: Record<PersonaKey, {
  name: string; tag: string; login: string; score: string; band: "Green" | "Orange";
  blurb: string; tour: { step: string; href: string; cta: string; look: string }[];
}> = {
  creator: {
    name: "Coach Maya — Fitness Studio", tag: "Solo creator · $199 program",
    login: "creator.demo@adpilot.app", score: "80 / 100", band: "Green",
    blurb: "A creator who's crushing it: strong 2.2× ROAS across Meta + TikTok. AdPilot says she's healthy and clear-to-scale — the proposals are about pouring fuel on the winners.",
    tour: [
      { step: "See the score land", href: "/command", cta: "Open Command Centre", look: "Health 80 / Green and a live verdict strip — two 🚀 Scale proposals are waiting." },
      { step: "Approve a safe win", href: "/proposals", cta: "Open Proposals", look: "Approve the Scale on the TikTok ‘Day-1 Hook Reel’ (2.5× ROAS) and the Free-Guide funnel." },
      { step: "Read the 13-factor breakdown", href: "/dashboard", cta: "Open Ads Health", look: "Why the score is 80 — strong CPA, tracking & efficiency; 6 months of campaigns underneath." },
      { step: "Schedule content", href: "/content", cta: "Open Content Studio", look: "Published reels, a scheduled leg-day post, and a meal-prep draft ready to go." },
      { step: "Ask the AI team", href: "/ai-specialists", cta: "Open AI Specialists", look: "Ask Travis (TikTok) or Dana (Data) what to scale next — grounded in her real numbers." },
      { step: "Send a branded report", href: "/reports", cta: "Open Reports", look: "Six monthly reports show the growth trend — open one and download the PDF." },
    ],
  },
  cafe: {
    name: "Bean & Bloom Café", tag: "Local café · brunch + orders",
    login: "cafe.demo@adpilot.app", score: "58 / 100", band: "Orange",
    blurb: "A small business turning it around. AdPilot finds the leaks: a budget bleeder to kill, broken tracking to fix, a tired creative to refresh — and the one winner to scale.",
    tour: [
      { step: "See what needs action", href: "/command", cta: "Open Command Centre", look: "Health 58 / Orange with five proposals ranked most-urgent-first." },
      { step: "Work the proposal queue", href: "/proposals", cta: "Open Proposals", look: "🛑 Kill the ‘Menu Launch’ bleeder, 🛠️ fix Loyalty tracking, 🔻 reduce Catering, 🚀 scale Brunch." },
      { step: "Find the leak in the score", href: "/dashboard", cta: "Open Ads Health", look: "The breakdown pinpoints weak tracking & CPA — exactly where the money's going." },
      { step: "Auto-reply to customers", href: "/messenger", cta: "Open Messenger Setup", look: "A greeting + menu / hours / booking auto-replies already configured." },
      { step: "Plan the next posts", href: "/content", cta: "Open Content Studio", look: "Brunch specials, a hiring post, and a cold-brew reel scheduled." },
      { step: "Show the owner the proof", href: "/reports", cta: "Open Reports", look: "Monthly reports tell the turnaround story — branded PDF in a click." },
    ],
  },
};

function Pill({ band }: { band: "Green" | "Orange" }) {
  const cls = band === "Green" ? "bg-band-green/10 text-band-green" : "bg-band-orange/10 text-band-orange";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{band === "Green" ? "Healthy" : "At risk"}</span>;
}

export default function DemoGuide() {
  const [who, setWho] = useState<PersonaKey>("creator");
  const p = PERSONAS[who];

  return (
    <div className="mx-auto max-w-4xl animate-fade-in pb-16">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-card md:p-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-widest text-white/70">Getting started · demo accounts</div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">See AdPilot work in 5 minutes</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Two ready-made accounts, loaded with ~6 months of real Meta &amp; TikTok data. AdPilot scores each one
            <b className="text-white"> 0–100</b>, finds what's leaking budget, and proposes safe fixes —
            <b className="text-white"> read-only, it never edits a live ad.</b>
          </p>
        </div>
      </div>

      {/* what it is */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { e: "📊", t: "It scores", d: "An explainable 0–100 Campaign Health Score across all your ad accounts." },
          { e: "🧭", t: "It proposes", d: "Prioritised, safe fixes: Fix · Kill · Reduce · Refresh · Scale." },
          { e: "🔒", t: "It's safe", d: "Read-only. It proposes — you approve. It never touches your live ads." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="text-2xl" aria-hidden>{c.e}</div>
            <div className="mt-1 font-bold">{c.t}</div>
            <p className="mt-0.5 text-sm text-muted">{c.d}</p>
          </div>
        ))}
      </div>

      {/* persona switch */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Take the guided tour</h2>
        <div className="inline-flex rounded-xl border border-border-subtle bg-surface p-1 text-sm font-bold">
          {(["creator", "cafe"] as PersonaKey[]).map((k) => (
            <button key={k} onClick={() => setWho(k)} aria-pressed={who === k}
              className={`rounded-lg px-3 py-1.5 transition ${who === k ? "bg-brand-gradient text-white shadow-glow" : "text-muted hover:text-ink"}`}>
              {k === "creator" ? "Coach Maya" : "Bean & Bloom"}
            </button>
          ))}
        </div>
      </div>

      {/* persona card */}
      <div className="mt-3 rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold">{p.name}</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">{p.tag}</span>
          <span className="ml-auto flex items-center gap-2 text-sm font-bold">Health {p.score} <Pill band={p.band} /></span>
        </div>
        <p className="mt-2 text-sm text-muted">{p.blurb}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
          <span className="font-bold">Log in:</span>
          <code className="rounded bg-white px-2 py-0.5 font-mono text-brand shadow-sm">{p.login}</code>
          <span className="text-muted">password</span>
          <code className="rounded bg-white px-2 py-0.5 font-mono text-ink shadow-sm">AdPilotDemo!2026</code>
        </div>
      </div>

      {/* tour steps */}
      <ol className="mt-4 space-y-3">
        {p.tour.map((s, i) => (
          <li key={i} className="flex gap-4 rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-extrabold text-white shadow-glow">{i + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{s.step}</div>
              <p className="mt-0.5 text-sm text-muted">{s.look}</p>
            </div>
            <Link href={s.href} className="self-center whitespace-nowrap rounded-xl border border-border-subtle px-3 py-1.5 text-sm font-bold text-brand transition hover:bg-brand-50">{s.cta} →</Link>
          </li>
        ))}
      </ol>

      {/* footer links */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <b>These are demo accounts</b> — every number is generated and clearly labelled <code>[DEMO]</code>. Nothing here spends real money or touches a live ad.
        For the full reference, see the <Link href="/manual" className="font-bold underline">User Manual</Link>.
      </div>
    </div>
  );
}
