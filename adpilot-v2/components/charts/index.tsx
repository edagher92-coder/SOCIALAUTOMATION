// AdPilot OS V7 — zero-dependency SVG chart kit (Cockpit P1).
// Server-component-safe: pure SVG, no hooks, no client JS. Chart discipline (inherited from
// Sparkline): domains may never mislead — health is always 0–100, money bars start at zero.

import type { ReactNode } from "react";

// Semantic tones — single source of truth for chart colours (mirrors tailwind tokens).
export const TONE = {
  good: "#37d399",
  warn: "#ffb84d",
  bad: "#ff6b6b",
  ice: "#56c5ff",
  muted: "#8b93ab",
  brand: "#f9603f",
} as const;
export type Tone = keyof typeof TONE;

export const toneForBand = (band?: string | null): Tone =>
  band === "Green" ? "good" : band === "Yellow" || band === "Orange" ? "warn" : band === "Red" ? "bad" : "muted";

const fmtShort = (v: number): string =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v * 10) / 10}`;

/** Health-score ring, 0–100, reusable (extracted pattern from AnalyzeClient's private Gauge). */
export function RingGauge({ value, size = 132, tone = "muted", track = "rgba(139,147,171,.18)", label, sub }: {
  value: number | null; size?: number; tone?: Tone; track?: string; label?: string; sub?: string;
}) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={label ? `${label}: ${value == null ? "no score" : Math.round(v)} out of 100` : undefined}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={10} />
      {value != null && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE[tone]} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      <text x="50%" y={sub ? "47%" : "50%"} dominantBaseline="central" textAnchor="middle"
        fontSize={size * 0.26} fontWeight={800} fill="currentColor" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value == null ? "—" : Math.round(v)}
      </text>
      {sub && (
        <text x="50%" y="66%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.085}
          fontWeight={700} fill={TONE.muted} letterSpacing="0.08em">{sub.toUpperCase()}</text>
      )}
    </svg>
  );
}

/** Compact trend line with optional area fill. Domain defaults to 0–100 (health); pass "auto" for zero-based auto. */
export function Spark({ values, width = 120, height = 32, domain = [0, 100], tone = "ice", area = true }: {
  values: number[]; width?: number; height?: number; domain?: [number, number] | "auto"; tone?: Tone; area?: boolean;
}) {
  if (values.length < 2) return null;
  const [lo, hi] = domain === "auto" ? [0, Math.max(...values) || 1] : domain;
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 3 - ((Math.max(lo, Math.min(hi, v)) - lo) / span) * (height - 6),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {area && <path d={`${line} L${last[0].toFixed(1)},${height - 1} L2,${height - 1} Z`} fill={TONE[tone]} opacity={0.12} />}
      <path d={line} fill="none" stroke={TONE[tone]} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={TONE[tone]} />
    </svg>
  );
}

/** Time-series with gridlines + axis labels. Native <title> per point keeps it dependency-free. */
export function TrendChart({ points, height = 140, domain = [0, 100], tone = "ice", yTicks = [0, 25, 50, 75, 100], title }: {
  points: { label: string; value: number }[];
  height?: number; domain?: [number, number]; tone?: Tone; yTicks?: number[]; title?: string;
}) {
  const W = 560, H = height, padL = 30, padB = 18, padT = 8, padR = 8;
  if (points.length < 2) return null;
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const iw = W - padL - padR, ih = H - padT - padB;
  const xy = (v: number, i: number): [number, number] => [
    padL + (i / (points.length - 1)) * iw,
    padT + ih - ((Math.max(lo, Math.min(hi, v)) - lo) / span) * ih,
  ];
  const pts = points.map((p, i) => xy(p.value, i));
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const lastX = pts[pts.length - 1][0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
      {yTicks.map((t) => {
        const y = padT + ih - ((t - lo) / span) * ih;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" opacity={0.09} />
            <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize={9} fill={TONE.muted}>{fmtShort(t)}</text>
          </g>
        );
      })}
      <path d={`${line} L${lastX.toFixed(1)},${padT + ih} L${padL},${padT + ih} Z`} fill={TONE[tone]} opacity={0.1} />
      <path d={line} fill="none" stroke={TONE[tone]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5} fill="transparent">
          <title>{`${points[i].label}: ${Math.round(points[i].value * 10) / 10}`}</title>
        </circle>
      ))}
      <circle cx={lastX} cy={pts[pts.length - 1][1]} r={3} fill={TONE[tone]} />
      <text x={padL} y={H - 4} fontSize={9} fill={TONE.muted}>{points[0].label}</text>
      <text x={W - padR} y={H - 4} fontSize={9} fill={TONE.muted} textAnchor="end">{points[points.length - 1].label}</text>
    </svg>
  );
}

/** Spend-vs-cap bar with warn threshold + optional projection marker. Money bars are zero-based. */
export function PacingBar({ value, cap, projected, warnAt = 0.85, height = 12, format = (v: number) => v.toFixed(0) }: {
  value: number; cap: number | null; projected?: number | null; warnAt?: number; height?: number; format?: (v: number) => string;
}) {
  // No cap on record → honest muted fill with no thresholds implied.
  const max = cap != null ? Math.max(cap, value, projected ?? 0) * 1.06 : Math.max(value, projected ?? 0, 1);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const tone: Tone = cap == null ? "muted" : value >= cap ? "bad" : value >= cap * warnAt ? "warn" : "good";
  return (
    <div aria-label={cap != null ? `Spent ${format(value)} of ${format(cap)} cap` : `Spent ${format(value)}; no cap set`}>
      <div className="relative w-full overflow-hidden rounded-full" style={{ height, background: "rgba(139,147,171,.15)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: pct(value), background: TONE[tone] }} />
        {projected != null && projected > value && (
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: pct(projected), background: TONE[tone], opacity: 0.22 }} />
        )}
        {cap != null && <div className="absolute inset-y-0 w-0.5" style={{ left: pct(cap), background: TONE.muted }} />}
      </div>
    </div>
  );
}

/** Stacked strip showing the FULL verdict distribution — the whole account, not just the exceptions. */
export function DistributionStrip({ segments, height = 10 }: {
  segments: { label: string; count: number; tone: Tone }[]; height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (!total) return null;
  return (
    <div className="flex w-full overflow-hidden rounded-full" style={{ height }} role="img"
      aria-label={segments.filter((s) => s.count > 0).map((s) => `${s.count} ${s.label}`).join(", ")}>
      {segments.filter((s) => s.count > 0).map((s, i) => (
        <div key={i} title={`${s.label}: ${s.count}`} style={{ width: `${(s.count / total) * 100}%`, background: TONE[s.tone], minWidth: 3 }} />
      ))}
    </div>
  );
}

/** Horizontal weighted-contribution bars — replaces "score/weight/contribution" tables. */
export function FactorBars({ items }: {
  items: { label: string; score: number | null; weightPct: number; hint?: ReactNode }[];
}) {
  return (
    <div className="space-y-2">
      {items.map((f) => {
        const tone: Tone = f.score == null ? "muted" : f.score >= 80 ? "good" : f.score >= 50 ? "warn" : "bad";
        return (
          <div key={f.label} className="flex items-center gap-3">
            <span className="w-40 flex-shrink-0 truncate text-xs font-semibold" title={f.label}>{f.label}</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(139,147,171,.15)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${f.score ?? 0}%`, background: TONE[tone] }} />
            </div>
            <span className="w-9 text-right text-xs tabular-nums" style={{ color: TONE[tone] }}>{f.score == null ? "n/a" : Math.round(f.score)}</span>
            <span className="w-12 text-right text-2xs tabular-nums opacity-60">{f.weightPct.toFixed(0)}% wt</span>
          </div>
        );
      })}
    </div>
  );
}
