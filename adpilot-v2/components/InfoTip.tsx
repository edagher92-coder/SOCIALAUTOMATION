"use client";
import { useState, useId, useRef, useEffect } from "react";

// Reusable, accessible "?" info tip. Hover or focus to preview, click to pin; Esc / outside-click
// closes. Used to explain metrics, factors and any jargon across the app (numbers-first, plain English).
export default function InfoTip({ label, term, children, align = "center" }: {
  label?: string; term?: string; children: React.ReactNode; align?: "center" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const pos = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button type="button" aria-label={label ? `What is ${label}?` : "More info"} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        className="grid h-[15px] w-[15px] cursor-help place-items-center rounded-full border border-border-subtle text-[9px] font-bold leading-none text-muted transition hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:shadow-ring-brand">?</button>
      {open && (
        <span role="tooltip" id={id} className={`absolute bottom-full z-30 mb-2 w-[90vw] max-w-[15rem] ${pos} cursor-default rounded-xl border border-border-subtle bg-surface-raised p-3 text-left shadow-card`}>
          {term && <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-brand">{term}</span>}
          <span className="block text-2xs font-medium leading-relaxed text-ink">{children}</span>
        </span>
      )}
    </span>
  );
}
