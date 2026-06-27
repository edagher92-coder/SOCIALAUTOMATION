"use client";
import Link from "next/link";
import { fmt } from "@/lib/engine/metrics";

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
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-band-red/25 bg-band-red/5 px-4 py-3.5 transition hover:border-band-red/50 hover:bg-band-red/10 focus-visible:shadow-ring-brand"
      aria-label={`${sym}${fmt(total)} flagged as potential waste — view creative scorecard`}
    >
      {/* Left accent pulse */}
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-band-red/10 text-xl" aria-hidden>
        🔥
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold tabular-nums text-band-red">
            {sym}{fmt(total)}
          </span>
          <span className="text-xs font-semibold text-muted">potential waste</span>
        </div>
        <p className="truncate text-xs text-muted">
          {flaggedCount} ad{flaggedCount !== 1 ? "s" : ""} flagged for kill or reduce
        </p>
      </div>

      <span className="flex-shrink-0 text-sm text-muted transition group-hover:text-ink" aria-hidden>
        {canViewScorecard ? "View scorecard →" : "Upgrade →"}
      </span>
    </Link>
  );
}
