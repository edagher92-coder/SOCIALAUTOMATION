"use client";

const RANGE_OPTIONS = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
] as const;

// `variant="cockpit"` matches the dark Mission Control panels (AppShell's ModeToggle/HelpToggle
// convention); the default matches the light card surfaces used elsewhere in the app.
export default function RangeToggle({
  days,
  onChange,
  variant = "light",
}: {
  days: number;
  onChange: (days: number) => void;
  variant?: "light" | "cockpit";
}) {
  const container =
    variant === "cockpit"
      ? "border-cockpit-edge bg-cockpit-raised"
      : "border-border-subtle bg-surface-raised shadow-card";
  const inactive = variant === "cockpit" ? "text-cockpit-muted hover:text-cockpit-ink" : "text-muted hover:text-ink";

  return (
    <div className={`inline-flex rounded-xl border p-1 ${container}`} role="group" aria-label="Date range">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.days}
          type="button"
          onClick={() => onChange(opt.days)}
          aria-pressed={days === opt.days}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            days === opt.days ? "bg-brand text-white shadow-sm" : inactive
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
