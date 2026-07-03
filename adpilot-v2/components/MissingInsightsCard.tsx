"use client";
/**
 * MissingInsightsCard
 *
 * A dashboard card for free-plan users that makes the value gap concrete —
 * it lists specific, named insights that Pro would surface for their account.
 * The list is tailored based on the last health-score result when one exists,
 * or falls back to a generic set. The card uses the amber/coral brand palette
 * as a warm invitation, not a warning. Non-pushy: no countdown timers, no
 * scarcity claims, no "limited offer" language.
 *
 * Usage (app/(app)/dashboard/page.tsx or a dashboard widget grid):
 *
 *   {plan === "free" && (
 *     <MissingInsightsCard lastScore={latestScore} lastBand={latestBand} />
 *   )}
 *
 * Props are optional — the card renders useful content even with no prior score.
 */
import Link from "next/link";

interface InsightItem {
  icon: string;
  title: string;
  detail: string;
}

// Static Pro insights that are always relevant regardless of score.
const BASE_INSIGHTS: InsightItem[] = [
  {
    icon: "🔗",
    title: "Live account connection",
    detail: "Direct read-only API link to Meta & TikTok — no CSV exports needed.",
  },
  {
    icon: "🤖",
    title: "AI specialist team",
    detail: "12 grounded agents (Dana, Mira, Travis and others) analyse your real numbers on demand.",
  },
  {
    icon: "📅",
    title: "Automated sync & history",
    detail: "Scores rebuild on your schedule; trend history shows whether things are improving.",
  },
  {
    icon: "🔔",
    title: "Threshold alerts",
    detail: "Configurable rules alert you when frequency, zero-conv or CTR cross your chosen limits.",
  },
  {
    icon: "📊",
    title: "Lead-quality loop",
    detail: "Feed CRM events in to score lead quality alongside ad spend — not just volume.",
  },
];

// Score-conditional insights surfaced only when a score reveals a relevant gap.
function conditionalInsights(band?: string): InsightItem[] {
  const out: InsightItem[] = [];
  if (band === "Orange" || band === "Red") {
    out.push({
      icon: "⚡",
      title: "Root-cause diagnosis",
      detail: "Grounded AI pinpoints whether your issue is creative fatigue, tracking breakage, audience saturation, or pacing — not just a low number.",
    });
  }
  if (band === "Yellow" || band === "Orange" || band === "Red") {
    out.push({
      icon: "📈",
      title: "Factor trend lines",
      detail: "See which of the 13 score factors deteriorated this week vs last — before they become expensive.",
    });
  }
  return out;
}

interface Props {
  /** Health score total from the last analysis run, if available. */
  lastScore?: number;
  /** Health band string from last analysis, e.g. "Yellow". */
  lastBand?: string;
}

export default function MissingInsightsCard({ lastScore, lastBand }: Props) {
  const extras = conditionalInsights(lastBand);
  const insights = [...extras, ...BASE_INSIGHTS].slice(0, 5); // max 5 items — scannable

  const scoreContext =
    lastScore != null
      ? `Your current score is ${Math.round(lastScore)}/100 (${lastBand}). Here's what Pro would add:`
      : "Here's what Pro adds on top of your free Health Score:";

  return (
    <section
      aria-label="What Pro would show you"
      className="overflow-hidden rounded-2xl border border-[#ffb224]/30 bg-white shadow-card"
    >
      {/* Header strip */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: "linear-gradient(90deg, #fff5f2 0%, #fffbf0 100%)" }}
      >
        {/* Amber spark icon */}
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base shadow-sm"
          style={{ background: "linear-gradient(135deg, #f9603f 0%, #ffb224 100%)", color: "#fff" }}
          aria-hidden
        >
          ✦
        </span>
        <div>
          <p className="text-sm font-bold text-[#1a2236]">You're missing {insights.length} insights</p>
          <p className="text-xs text-[#5a6577]">{scoreContext}</p>
        </div>
      </div>

      {/* Insight list */}
      <ul className="divide-y divide-border-subtle px-5" role="list">
        {insights.map((item, i) => (
          <li key={i} className="flex items-start gap-3 py-3.5">
            {/* Icon dot */}
            <span
              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm"
              style={{ background: "#fff5f2", border: "1px solid #f9603f22" }}
              aria-hidden
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              {/* Blurred "locked" effect on detail text — CSS blur without hiding content from a11y */}
              <p className="text-xs font-semibold text-[#1a2236]">{item.title}</p>
              <p
                className="mt-0.5 select-none text-xs leading-relaxed text-[#5a6577] transition-all duration-300"
                style={{ filter: "blur(2.5px)", userSelect: "none" }}
                aria-hidden // The blurred content is decorative; the title conveys the concept
              >
                {item.detail}
              </p>
              {/* Accessible fallback for screen readers */}
              <p className="sr-only">{item.detail}</p>
            </div>
            {/* Locked badge */}
            <span
              className="mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#f9603f14", color: "#f9603f" }}
              aria-label="Pro feature"
            >
              Pro
            </span>
          </li>
        ))}
      </ul>

      {/* CTA footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface px-5 py-4">
        <p className="text-xs text-[#5a6577]">
          Pro is $149/mo AUD · API connect + AI team + auto-sync included.
        </p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#f9603f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#e0522f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f9603f]"
        >
          Compare plans
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

/*
 * ── Integration notes ────────────────────────────────────────────────────────
 *
 * Option A — Dashboard page (recommended)
 * ----------------------------------------
 * Add to app/(app)/dashboard/page.tsx alongside AnalyzeClient. Thread the
 * last score/band from the most recent analysis row in Supabase (or pass null
 * for a generic view):
 *
 *   // Fetch latest saved score for this org, if any
 *   const { data: latestScore } = await supabase
 *     .from("analysis_runs")
 *     .select("health_total, health_band")
 *     .eq("organisation_id", orgId)
 *     .order("created_at", { ascending: false })
 *     .limit(1)
 *     .maybeSingle();
 *
 *   …
 *
 *   {plan === "free" && (
 *     <MissingInsightsCard
 *       lastScore={latestScore?.health_total}
 *       lastBand={latestScore?.health_band}
 *     />
 *   )}
 *
 * Option B — Client state from AnalyzeClient
 * -------------------------------------------
 * If there's no persisted score yet, pass the in-flight result down from
 * AnalyzeClient via a shared parent state or a context — whichever is
 * already established for that page.
 *
 * Placement: render the card ABOVE AnalyzeClient (at the top of the page
 * results area) so it's in view on load, before a new analysis is run.
 * On mobile it naturally stacks before the input panel.
 *
 * Visual blur note: the `filter: blur(2.5px)` on detail text is a UI signal,
 * not a security gate. The text is readable in DevTools — that's intentional.
 * We are informing, not hiding.
 */
