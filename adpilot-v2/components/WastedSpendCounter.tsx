"use client";
import Link from "next/link";
import { fmt } from "@/lib/engine/metrics";
import { Icon } from "./icons";

// V7 cockpit "hot" tile — the one number on Mission Control allowed to shout.
// Renders nothing when there's no flagged waste (an empty alarm is noise).

interface Props {
  /** Total wasted spend (kill + reduce verdicts) in the account's currency. */
  total: number;
  /** Number of ads flagged kill or reduce. */
  flaggedCount: number;
  /** Currency code for display, e.g. "AUD". */
  currency?: string;
  /** Whether the user's plan can access the full creative scorecard. */
  canViewScorecard?: boolean;
}

export default function WastedSpendCounter({ total, flaggedCount, currency = "AUD", canViewScorecard }: Props) {
  if (total <= 0) return null;

  const sym = currency === "AUD" ? "$" : `${currency} `;

  return (
    <Link
      href={canViewScorecard ? "/creative-scorecard" : "/billing"}
      className="group flex flex-col justify-between rounded-2xl border border-bad/40 bg-bad/10 p-4 transition hover:border-bad/70 focus-visible:shadow-ring-brand"
      aria-label={`${sym}${fmt(total)} flagged as potential waste — view creative scorecard`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xs font-bold uppercase tracking-widest text-bad/90">Potential waste</span>
        <span className="text-bad" aria-hidden><Icon name="flame" size={16} /></span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tabular-nums text-bad">{sym}{fmt(total)}</span>
      </div>
      <p className="mt-2 text-2xs text-cockpit-muted">
        {flaggedCount} ad{flaggedCount !== 1 ? "s" : ""} flagged kill or reduce ·{" "}
        <span className="font-semibold text-bad/90 group-hover:underline">{canViewScorecard ? "view scorecard →" : "upgrade →"}</span>
      </p>
    </Link>
  );
}
