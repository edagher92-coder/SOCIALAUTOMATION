"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";

const TASKS = [
  "De-duplicate contacts (merge obvious doubles)",
  "Tag every lead with its source (meta / tiktok / referral / website)",
  "Move stale 'open' deals (>30 days, no reply) to 'lost' with a reason",
  "Add missing phone/email on high-value contacts",
  "Set a next-action + date on every active deal",
  "Record won/lost + sale value on closed deals (feeds lead-quality scoring)",
  "Check UTM/source is captured on new leads from ads",
  "Archive contacts who unsubscribed / asked to stop",
  "Confirm follow-up sequence is firing for new leads",
  "Export a weekly snapshot for reporting",
];

export default function CrmMaintenance() {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const pct = useMemo(() => Math.round((Object.values(done).filter(Boolean).length / TASKS.length) * 100), [done]);

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        eyebrow="Data hygiene"
        title="CRM Maintenance"
        subtitle="A clean CRM = trustworthy numbers. Work the weekly checklist; closed-deal data feeds the lead-quality score."
      />

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-band-green" : "bg-brand"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-bold text-ink">{pct}%</span>
        </div>
        {pct === 100 && (
          <div className="mb-3 rounded-xl border border-good/40 bg-good/10 p-3 text-sm font-semibold text-good">
            All clear — your CRM checklist is complete for this week. 🎉
          </div>
        )}
        <ul className="space-y-1.5">
          {TASKS.map((t, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2 text-sm transition hover:bg-surface">
                <input type="checkbox" checked={!!done[i]} onChange={(e) => setDone({ ...done, [i]: e.target.checked })} className="mt-0.5" />
                <span className={done[i] ? "text-muted line-through" : ""}>{t}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-muted">Why it matters: dirty CRM data makes CPA/ROAS lie. The Ads Health Check assumes your closed-deal data is accurate.</p>
    </div>
  );
}
