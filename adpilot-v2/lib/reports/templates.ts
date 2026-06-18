import "server-only";

// Canonical report structure — the build-safe TS port of CPWORK/universal-ads-os/templates/*.
// Single source of truth for section order + safety strings so Riley's chat output, the report
// detail page, and any PDF all use the identical AU-English structure. (We hard-code the
// skeletons rather than reading the markdown at runtime: CPWORK/ is not in the deployed app.)

export type ReportKind = "daily" | "weekly" | "monthly" | "audit-meta" | "audit-tiktok";

// Ordered section headings per report kind.
export const REPORT_SECTIONS: Record<ReportKind, string[]> = {
  daily: ["TL;DR", "Spend & Results", "What Changed", "Recommendations"],
  weekly: ["TL;DR", "Spend & Results", "By Campaign", "Wins", "Problems", "Recommendations", "What to Watch"],
  monthly: ["TL;DR", "Spend & Results", "By Campaign", "Health Breakdown", "Wins", "Problems", "Recommendations", "Next Month Plan"],
  "audit-meta": ["Summary & Health Score", "Performance Metrics", "Findings", "Top Win", "Top Problem", "One Thing to Fix First"],
  "audit-tiktok": ["Summary & Health Score", "Performance Metrics (hook/hold)", "Findings", "Top Win", "Top Problem", "One Thing to Fix First"],
};

// Lifted verbatim from the templates' guardrail blocks — every emitted report carries these.
export const SAFETY_FOOTER =
  "Guardrails: this is a read-only analysis — no live ad was changed. All recommendations are proposals only; any budget or monetary change is flagged for your approval (typed YES) and never executed automatically. No ad deletions; every proposed change is reversible (the original is untouched).";

export const SAFETY_HEADER =
  "Read-only report — AdPilot proposes, you approve. Nothing here has been applied to a live ad.";

export const BREAK_EVEN_NOTE =
  "Break-even CPA = average sale value × gross margin · Break-even ROAS = 1 ÷ gross margin.";

export const REPORT_KINDS: ReportKind[] = ["daily", "weekly", "monthly", "audit-meta", "audit-tiktok"];

export function isReportKind(v: unknown): v is ReportKind {
  return typeof v === "string" && (REPORT_KINDS as string[]).includes(v);
}
