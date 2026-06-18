// Tiny inline sparkline for the health-score trend. Fixed 0–100 domain so the shape can never
// mislead (no truncated axis). Pure + server-safe — no client JS. Colour follows `currentColor`.
export default function Sparkline({ values, width = 132, height = 26, className = "" }: {
  values: number[]; width?: number; height?: number; className?: string;
}) {
  const pts = values.filter((v) => Number.isFinite(v));
  if (pts.length < 2) return null;
  const n = pts.length;
  const dx = width / (n - 1);
  const y = (v: number) => height - (Math.max(0, Math.min(100, v)) / 100) * (height - 2) - 1;
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastX = (n - 1) * dx;
  const lastY = y(pts[n - 1]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={2.2} fill="currentColor" />
    </svg>
  );
}
