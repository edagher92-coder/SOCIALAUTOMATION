"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { can, PLAN_LABEL, requiredPlan, type Plan } from "@/lib/entitlements";
import { ALL_NAV } from "./app-navigation";
import { Icon } from "./icons";

export default function CommandPalette({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: Plan }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV;
    return ALL_NAV.filter((item) =>
      [item.label, item.description, item.href, ...(item.keywords || [])].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => setActive((current) => Math.min(current, Math.max(results.length - 1, 0))), [results.length]);

  if (!open) return null;

  function choose(index: number) {
    const item = results[index];
    if (!item) return;
    router.push(item.feature && !can(plan, item.feature) ? "/billing" : item.href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-cockpit/70 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Search AdPilot"
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border-subtle px-4">
          <span className="text-muted"><Icon name="search" size={20} /></span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
              if (event.key === "Enter") { event.preventDefault(); choose(active); }
            }}
            className="h-16 flex-1 border-0 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-muted"
            placeholder="Search pages, tools, settings or actions..."
            aria-label="Search pages and tools"
          />
          <kbd className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-2xs font-bold text-muted">ESC</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-bold text-ink">No matching tool</p>
              <p className="mt-1 text-sm text-muted">Try “creative”, “sync”, “report” or “settings”.</p>
            </div>
          ) : results.map((item, index) => {
            const locked = Boolean(item.feature && !can(plan, item.feature));
            return (
              <button
                key={`${item.href}-${item.label}`}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${active === index ? "bg-brand-50" : "hover:bg-surface"}`}
              >
                <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${active === index ? "bg-white text-brand shadow-sm" : "bg-surface text-muted"}`}>
                  <Icon name={item.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-bold text-ink">
                    {item.label}
                    {locked && <span className="rounded-full bg-white px-2 py-0.5 text-2xs text-brand">{PLAN_LABEL[requiredPlan(item.feature!)]}</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">{item.description}</span>
                </span>
                <span className="text-muted"><Icon name="chevron-right" size={16} /></span>
              </button>
            );
          })}
        </div>

        <footer className="flex items-center justify-between border-t border-border-subtle bg-surface px-4 py-2.5 text-2xs text-muted">
          <span>Press ↑ ↓ to move, Enter to open</span>
          <span>{results.length} destination{results.length === 1 ? "" : "s"}</span>
        </footer>
      </section>
    </div>
  );
}
