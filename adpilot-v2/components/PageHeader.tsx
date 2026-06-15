// Consistent page header used across the app — eyebrow + title + subtitle + optional action.
export default function PageHeader({
  title, subtitle, eyebrow, action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="text-xs font-bold uppercase tracking-widest text-brand">{eyebrow}</div>}
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
