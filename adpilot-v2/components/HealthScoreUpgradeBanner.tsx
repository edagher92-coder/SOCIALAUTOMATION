"use client";
/**
 * HealthScoreUpgradeBanner
 *
 * Shows once per browser session the first time a free-plan user receives
 * a health score result. Renders as a non-modal inline banner immediately
 * below the Gauge hero so the score stays visible — no interruption before
 * the user has absorbed the number. Dismissed per-session via sessionStorage.
 *
 * Usage (inside AnalyzeClient.tsx, just after the hero section renders):
 *   {res && plan === "free" && (
 *     <HealthScoreUpgradeBanner score={res.health.total} band={res.health.band} />
 *   )}
 *
 * The `plan` prop must be threaded from the server layout (AppShell already
 * receives it) down to AnalyzeClient. See integration notes below.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const SESSION_KEY = "adpilot_score_banner_dismissed";

type Band = "Green" | "Yellow" | "Orange" | "Red";

const BAND_INSIGHT: Record<Band, { headline: string; sub: string }> = {
  Green: {
    headline: "Your account is healthy — now let's keep it that way.",
    sub: "Pro connects directly to your live Meta & TikTok data so this score updates automatically, without a CSV export each time.",
  },
  Yellow: {
    headline: "You're close to green — here's what the free tier can't show you.",
    sub: "Pro unlocks account-grounded AI diagnosis: 12 specialists analyse your live numbers and tell you exactly which levers to pull.",
  },
  Orange: {
    headline: "There are issues here worth investigating properly.",
    sub: "Pro gives you automated sync, trend history and the AI specialist team — so you catch problems before they cost more.",
  },
  Red: {
    headline: "Your account needs attention. Pro can help you act faster.",
    sub: "Direct API access means no manual exports, automated alerts when metrics cross your thresholds, and grounded AI guidance on every finding.",
  },
};

interface Props {
  score: number;
  band: string;
}

export default function HealthScoreUpgradeBanner({ score, band }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session; never show again after dismissal in this tab.
    const already = sessionStorage.getItem(SESSION_KEY);
    if (!already) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const insight = BAND_INSIGHT[(band as Band)] ?? BAND_INSIGHT.Yellow;

  return (
    <div
      role="region"
      aria-label="Upgrade information"
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[#f9603f]/25 bg-gradient-to-r from-[#fff5f2] to-[#fffbf0] p-5 shadow-card sm:flex-row sm:items-start"
    >
      {/* Left accent bar */}
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#f9603f] to-[#ffb224]" aria-hidden />

      {/* Score echo — reinforces value while presenting the ask */}
      <div className="ml-3 flex-shrink-0 sm:ml-4">
        <div
          className="flex h-14 w-14 flex-col items-center justify-center rounded-xl font-extrabold tabular-nums text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #f9603f 0%, #ffb224 100%)" }}
          aria-hidden
        >
          <span className="text-xl leading-none">{Math.round(score)}</span>
          <span className="text-[9px] font-bold opacity-80">/ 100</span>
        </div>
      </div>

      {/* Copy */}
      <div className="ml-3 flex-1 sm:ml-0">
        <p className="text-sm font-bold text-[#1a2236]">{insight.headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#5a6577]">{insight.sub}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f9603f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#e0522f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f9603f]"
          >
            See Pro — $149/mo AUD
            <span aria-hidden className="text-[10px] opacity-80">→</span>
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs font-semibold text-[#5a6577] underline-offset-2 hover:text-[#1a2236] hover:underline"
          >
            Not now
          </button>
        </div>
      </div>

      {/* Dismiss X */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upgrade banner"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[#5a6577] transition hover:bg-black/5 hover:text-[#1a2236]"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/*
 * ── Integration notes ────────────────────────────────────────────────────────
 *
 * 1. Thread `plan` into AnalyzeClient
 *    AnalyzeClient currently takes no props. Add one:
 *
 *      // components/AnalyzeClient.tsx
 *      import type { Plan } from "@/lib/entitlements";
 *      export default function AnalyzeClient({ plan = "free" }: { plan?: Plan }) { … }
 *
 *    Pass it from the server page:
 *
 *      // app/(app)/dashboard/page.tsx
 *      import { createClient } from "@/lib/supabase/server";
 *      import { normalisePlan } from "@/lib/entitlements";
 *      …
 *      const plan = normalisePlan(sub?.plan);
 *      return <AnalyzeClient plan={plan} />;
 *
 * 2. Add the banner inside AnalyzeClient's results section
 *    After the Gauge hero `</div>` that closes the hero card, and before
 *    the "Key metrics" block, insert:
 *
 *      import HealthScoreUpgradeBanner from "./HealthScoreUpgradeBanner";
 *      …
 *      {res && plan === "free" && (
 *        <HealthScoreUpgradeBanner score={res.health.total} band={res.health.band} />
 *      )}
 *
 * 3. Trigger once per session — not on every analysis run
 *    The sessionStorage guard handles this: the banner will not re-appear
 *    if the user dismisses it and then runs another analysis in the same tab.
 *    It will appear again on a fresh browser session (new tab / next visit),
 *    which is intentional — it is the highest-value moment in the whole UX.
 */
