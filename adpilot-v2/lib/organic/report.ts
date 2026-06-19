// Pure, browser-safe report builder for the organic-post suite. Turns an AccountOrganicAnalysis
// (from lib/organic/account) into a deterministic, AU-English, numbers-first report: ordered
// sections-as-data PLUS a full GitHub-flavoured markdown rendering. No I/O, no `server-only`, no
// AI — every number comes straight from the analysis (never invented). Mirrors the house style in
// lib/reports/* (tables as data, anti-hype, "proposals you approve", estimates not guarantees).
import type { AccountOrganicAnalysis, BoostRecommendation, OrganicPostInput, HoldReason } from "./types";
import type { OrganicPlatform } from "./boost";

// --- Section/report shape (sections-as-data, so any surface can render or download it). ---
export interface OrganicReportSection {
  heading: string;
  intro?: string;
  table?: { columns: string[]; rows: string[][] };
  bullets?: string[];
}

export interface OrganicReport {
  title: string;
  subtitle: string;
  sections: OrganicReportSection[]; // ordered: Summary, Boost-ready recommendations, Hold, Expectations, How we worked it out
  markdown: string; // full plain-markdown rendering of every section
  safety: string;
}

// --- Local, pure formatting helpers (en-AU). Kept local so this file stays browser-safe. ---
const enAU = new Intl.NumberFormat("en-AU");
const enAUMoney = new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (n: number): string => enAU.format(Math.max(0, Math.round(safe(n)))); // integer w/ thousands sep
const money = (n: number): string => `$${enAUMoney.format(Math.max(0, safe(n)))}`; // $1,234.56
const pct = (x: number): string => `${(safe(x) * 100).toFixed(1)}%`; // 2.0%

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

const platformLabel = (p: OrganicPlatform): string => (p === "tiktok" ? "TikTok" : "Meta");
const postLabel = (post: OrganicPostInput): string => post.name?.trim() || `${platformLabel(post.platform)} post`;

// Short, plain-English note for a held post, driven by the engine's own reason (carried on each
// HeldPost) so the report never re-infers the verdict from the raw numbers.
function holdReasonText(reason: HoldReason): string {
  return reason === "below-benchmark"
    ? "below benchmark — strengthen the post before paying to widen reach"
    : "needs more reach before we can call it";
}

export function buildOrganicReport(
  analysis: AccountOrganicAnalysis,
  meta?: { businessName?: string; currency?: string; generatedAt?: string },
): OrganicReport {
  const biz = meta?.businessName?.trim() || "Your account";
  const safety = analysis?.safety || DEFAULT_SAFETY;
  const summary = analysis?.summary;
  const sections: OrganicReportSection[] = [];

  // Graceful empty-state: no posts analysed yet.
  if (!summary || summary.posts <= 0) {
    const empty: OrganicReportSection = {
      heading: "Summary",
      intro: "No posts analysed yet — connect or paste your organic posts and we'll show what's boost-ready.",
    };
    const subtitle = "Organic boost report · no posts analysed yet";
    const markdown = renderMarkdown(`${biz} — Organic Boost Report`, subtitle, [empty], safety, meta?.generatedAt);
    return { title: `${biz} — Organic Boost Report`, subtitle, sections: [empty], markdown, safety };
  }

  // 1) Summary — account totals + per-platform split.
  sections.push({
    heading: "Summary",
    intro: `${num(summary.posts)} ${summary.posts === 1 ? "post" : "posts"} analysed.`,
    table: {
      columns: ["Metric", "Value"],
      rows: [
        ["Posts analysed", num(summary.posts)],
        ["Total organic reach", num(summary.totalReach)],
        ["Total impressions", num(summary.totalImpressions)],
        ["Avg engagement rate", pct(summary.avgEngagementRate)],
      ],
    },
  });
  sections.push({
    heading: "By platform",
    table: {
      columns: ["Platform", "Posts", "Reach", "Impressions", "Engagements", "Engagement rate"],
      rows: summary.byPlatform.map((p) => [
        platformLabel(p.platform),
        num(p.posts),
        num(p.reach),
        num(p.impressions),
        num(p.engagements),
        pct(p.engagementRate),
      ]),
    },
  });

  // 2) Boost-ready recommendations.
  const recs = analysis.recommendations || [];
  sections.push({
    heading: "Boost-ready recommendations",
    intro:
      recs.length > 0
        ? `${num(recs.length)} ${recs.length === 1 ? "post is" : "posts are"} resonating above benchmark with enough signal — boosting amplifies what's already working. Total proposed spend ${money(analysis.totalRecommendedBudget)} (your call in Ads Manager).`
        : "Nothing is boost-ready yet — hold your spend and keep testing organically.",
    table:
      recs.length > 0
        ? {
            columns: [
              "Rank",
              "Post",
              "Platform",
              "Organic reach",
              "Eng. rate",
              "Recommended budget",
              "Projected +reach",
              "$/1k reached",
              "Projected +engagements",
            ],
            rows: recs.map((r) => recommendationRow(r)),
          }
        : undefined,
  });

  // 3) Hold — bullets with a short, honest reason.
  const hold = analysis.hold || [];
  sections.push({
    heading: "Hold (improve organically first)",
    intro:
      hold.length > 0
        ? "Not boost-ready yet — these are proposals to keep working organically, nothing to spend on."
        : "Nothing on hold — every analysed post is accounted for above.",
    bullets:
      hold.length > 0
        ? hold.map((h) => `${postLabel(h.post)} (${platformLabel(h.post.platform)}) — ${holdReasonText(h.reason)}.`)
        : undefined,
  });

  // 4) Expectations — straight from the analysis (numbers-first), as bullets.
  const expectations = (analysis.expectations || []).filter((e) => e && e.trim());
  sections.push({
    heading: "What to expect",
    bullets: expectations.length > 0 ? expectations : ["No projected outcomes yet — nothing is boost-ready."],
  });

  // 5) How we worked it out — plain-English methodology.
  sections.push({
    heading: "How we worked it out",
    bullets: METHODOLOGY,
  });

  const title = `${biz} — Organic Boost Report`;
  const subtitle = `${num(summary.posts)} ${summary.posts === 1 ? "post" : "posts"} · ${num(
    summary.totalReach,
  )} organic reach · ${pct(summary.avgEngagementRate)} avg engagement`;
  const markdown = renderMarkdown(title, subtitle, sections, safety, meta?.generatedAt);
  return { title, subtitle, sections, markdown, safety };
}

function recommendationRow(r: BoostRecommendation): string[] {
  const p = r.projection;
  return [
    String(r.rank),
    postLabel(r.post),
    platformLabel(r.post.platform),
    num(p.organicReach),
    pct(p.engagementRate),
    money(r.recommendedBudget),
    `+${num(p.incrementalReach)}`,
    money(p.costPer1kIncrementalReach),
    `+${num(p.projectedAddedEngagements)}`,
  ];
}

// --- Plain GitHub-flavoured markdown render of the ordered sections, ending with the safety line. ---
function renderMarkdown(
  title: string,
  subtitle: string,
  sections: OrganicReportSection[],
  safety: string,
  generatedAt?: string,
): string {
  const out: string[] = [];
  out.push(`# ${title}`);
  const stamp = generatedAt?.trim();
  out.push(`_${subtitle}${stamp ? ` · ${stamp}` : ""}_`);
  out.push("");

  for (const s of sections) {
    out.push(`## ${s.heading}`);
    if (s.intro) {
      out.push(s.intro);
      out.push("");
    }
    if (s.table && s.table.columns.length > 0) {
      out.push(`| ${s.table.columns.join(" | ")} |`);
      out.push(`| ${s.table.columns.map(() => "---").join(" | ")} |`);
      for (const row of s.table.rows) {
        out.push(`| ${row.map(mdCell).join(" | ")} |`);
      }
      out.push("");
    }
    if (s.bullets && s.bullets.length > 0) {
      for (const b of s.bullets) out.push(`- ${b}`);
      out.push("");
    }
  }

  out.push(`_${safety}_`);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Escape pipes so values never break a markdown table cell.
const mdCell = (v: string): string => String(v ?? "").replace(/\|/g, "\\|");

const DEFAULT_SAFETY =
  "Read-only analysis — estimates, not guarantees. No post was boosted or charged. You approve any spend in Ads Manager.";

// Plain-English methodology, anti-hype and numbers-first. Kept as bullets so the same lines render
// in the section data and the markdown.
const METHODOLOGY: string[] = [
  "Reach maths are CPM-based: we take your real average cost per 1,000 impressions for each platform (a clearly-labelled benchmark if we don't have your own yet), work out the impressions a budget buys, then convert to unique people using a conservative ~1.15 boost frequency.",
  "We only recommend boosting a proven post: a Wilson significance gate means a post's engagement has to be confidently above the platform benchmark before it's called boost-ready — so we amplify winners, not guesses.",
  "Projected added engagements dampen for a paid/cold audience, which engages less than your existing followers. Every figure is an estimate or range, never a guarantee.",
  "This is read-only and numbers-first: nothing was boosted or charged. Every recommendation is a proposal you approve in Ads Manager.",
];
