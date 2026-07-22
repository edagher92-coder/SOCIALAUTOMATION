"use client";

import Link from "next/link";
import { Icon } from "./icons";

export type WorkspaceSummary = {
  name?: string;
  lastSyncedAt?: string | null;
  openFixes: number;
  connectionIssues: number;
  connectedAccounts: number;
};

function timeAgo(value?: string | null): string {
  if (!value) return "Not synced yet";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function OperationsDrawer({ open, onClose, summary }: { open: boolean; onClose: () => void; summary: WorkspaceSummary }) {
  if (!open) return null;
  const needsAttention = summary.connectionIssues > 0;

  return (
    <div className="fixed inset-0 z-[70] bg-cockpit/55 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Workspace control panel"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-cockpit text-cockpit-ink shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-cockpit-edge p-5">
          <div>
            <div className="text-2xs font-bold uppercase tracking-[0.18em] text-cockpit-muted">Control panel</div>
            <h2 className="mt-1 text-xl font-extrabold">{summary.name || "Workspace operations"}</h2>
            <p className="mt-1 text-sm text-cockpit-muted">Connections, automation and safety in one place.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close control panel" className="rounded-xl border border-cockpit-edge p-2 text-cockpit-muted hover:bg-white/5 hover:text-white">
            <Icon name="x" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <section className={`rounded-2xl border p-4 ${needsAttention ? "border-bad/40 bg-bad/10" : "border-good/30 bg-good/10"}`}>
            <div className="flex items-center gap-2 font-bold">
              <span className={needsAttention ? "text-bad" : "text-good"}><Icon name={needsAttention ? "alert-triangle" : "check-circle"} /></span>
              {needsAttention ? "A connection needs attention" : "Workspace is ready"}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-black/15 p-3"><dt className="text-2xs text-cockpit-muted">Accounts</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{summary.connectedAccounts}</dd></div>
              <div className="rounded-xl bg-black/15 p-3"><dt className="text-2xs text-cockpit-muted">Open fixes</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{summary.openFixes}</dd></div>
              <div className="rounded-xl bg-black/15 p-3"><dt className="text-2xs text-cockpit-muted">Issues</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{summary.connectionIssues}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-cockpit-muted">Last data pull: <span className="font-semibold text-cockpit-ink">{timeAgo(summary.lastSyncedAt)}</span></p>
          </section>

          <section className="rounded-2xl border border-cockpit-edge bg-cockpit-raised p-4">
            <div className="flex items-center gap-2 font-bold"><span className="text-good"><Icon name="shield" /></span> Safety state</div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-good/25 bg-good/10 px-3 py-2.5 text-sm">
              <span>Live paid-ad changes</span><span className="rounded-full bg-good/15 px-2 py-1 text-2xs font-extrabold uppercase text-good">Blocked</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-cockpit-muted">AdPilot can sync, diagnose, alert, report and prepare drafts. Spending changes remain human-run in Ads Manager.</p>
          </section>

          <section>
            <h3 className="mb-2 text-2xs font-bold uppercase tracking-[0.18em] text-cockpit-muted">Operate</h3>
            <div className="space-y-2">
              {[
                ["Connections & sync", "/connect", "link"],
                ["Automation rules", "/automate", "blocks"],
                ["Alert delivery", "/notifications", "bell"],
                ["Business settings", "/settings", "sliders"],
                ["Help & recovery", "/manual", "book"],
              ].map(([label, href, icon]) => (
                <Link key={href} href={href} onClick={onClose} className="flex items-center gap-3 rounded-xl border border-cockpit-edge bg-cockpit-raised px-3 py-3 text-sm font-semibold hover:border-cockpit-muted/60 hover:bg-white/5">
                  <span className="text-ice"><Icon name={icon as Parameters<typeof Icon>[0]["name"]} /></span>
                  <span className="flex-1">{label}</span>
                  <span className="text-cockpit-muted"><Icon name="chevron-right" size={15} /></span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
