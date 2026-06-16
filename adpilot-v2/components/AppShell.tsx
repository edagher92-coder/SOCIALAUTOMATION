"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeProvider, useMode } from "./mode";
import OrgSwitcher from "./OrgSwitcher";

const NAV_GROUPS: { title: string | null; items: { href: string; label: string; icon: string; desc: string }[] }[] = [
  { title: null, items: [
    { href: "/command", label: "Command Center", icon: "🛰️", desc: "Your live ads control room" },
  ] },
  { title: "Workspace", items: [
    { href: "/proposals", label: "Proposals", icon: "✅", desc: "Approve safe, prioritised fixes" },
    { href: "/dashboard", label: "Ads Health", icon: "📊", desc: "Score a CSV export" },
    { href: "/connect", label: "Connect & Sync", icon: "🔗", desc: "Meta & TikTok + auto-sync" },
    { href: "/utm-builder", label: "UTM Builder", icon: "🏷️", desc: "Consistent names & tagged URLs" },
    { href: "/content", label: "Content Studio", icon: "🎬", desc: "Create, schedule & publish posts" },
    { href: "/messenger", label: "Messenger Setup", icon: "💬", desc: "Greeting, ice breakers & menu" },
    { href: "/actions", label: "Ad Actions", icon: "🛠️", desc: "Guarded live changes (Expert)" },
    { href: "/reports", label: "Reports", icon: "🗃️", desc: "Your analysis history" },
  ] },
  { title: "AI Team", items: [
    { href: "/ai-specialists", label: "AI Specialists", icon: "🧭", desc: "Agents grounded in your numbers" },
    { href: "/policy-check", label: "Policy Check", icon: "🛡️", desc: "Paige checks copy for policy risk" },
    { href: "/canva-creator", label: "Canva Creator", icon: "🎨", desc: "Ad creative briefs & prompts" },
    { href: "/creative", label: "Creative Library", icon: "🖼️", desc: "Link or upload audio/video/photo" },
    { href: "/bobby-business-assistant", label: "Bobby — Business", icon: "🤝", desc: "Plain-English business help" },
    { href: "/aria-course-creator", label: "Aria — Courses", icon: "🎓", desc: "Turn expertise into a course" },
    { href: "/crm-maintenance", label: "CRM Maintenance", icon: "🧹", desc: "Keep your pipeline clean" },
    { href: "/build-dashboard", label: "Build a Dashboard", icon: "🧱", desc: "Sheets / Looker / Notion specs" },
  ] },
  { title: "Account", items: [
    { href: "/billing", label: "Billing", icon: "💳", desc: "Plan & subscription" },
    { href: "/notifications", label: "Notifications", icon: "🔔", desc: "Weekly digest & alerts" },
    { href: "/agency", label: "White-label", icon: "🏷️", desc: "Brand reports as your agency" },
    { href: "/settings", label: "Settings", icon: "⚙️", desc: "Economics & auto-sync" },
    { href: "/claude-api", label: "Claude API", icon: "🔌", desc: "Connect AI generation" },
    { href: "/manual", label: "User Manual", icon: "📖", desc: "How-to + download PDF" },
  ] },
];

function ModeToggle() {
  const { mode, setMode } = useMode();
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-1.5">
      <div className="grid grid-cols-2 gap-1 text-xs font-bold">
        {(["beginner", "advanced"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-lg px-2 py-1.5 capitalize transition-all duration-150 focus-visible:shadow-ring-brand ${
              mode === m
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:bg-white hover:text-ink hover:shadow-sm"
            }`}>
            {m}
          </button>
        ))}
      </div>
      <p className="px-1 pt-1.5 text-2xs text-muted">
        {mode === "beginner" ? "Simple view — guided, plain English." : "Advanced — full metrics & controls."}
      </p>
    </div>
  );
}

function Sidebar({ email, onNav }: { email?: string; onNav?: () => void }) {
  const path = usePathname();
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Logo */}
      <Link href="/command" className="flex items-center gap-2.5 px-1 py-1 text-base font-extrabold tracking-tight text-ink transition hover:text-brand">
        <span className="inline-block h-7 w-7 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" />
        <span>AdPilot OS</span>
        <span className="ml-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-bold text-brand">V4</span>
      </Link>

      {/* Org switcher */}
      <OrgSwitcher />

      {/* Mode toggle */}
      <ModeToggle />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-1" aria-label="Main navigation">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.title && (
              <div className="px-3 pb-0.5 pt-2 text-2xs font-bold uppercase tracking-widest text-muted/70">{group.title}</div>
            )}
            {group.items.map((n) => {
              const active = path === n.href || path?.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNav}
                  aria-current={active ? "page" : undefined}
                  className={`group rounded-xl px-3 py-2 transition-all duration-150 focus-visible:shadow-ring-brand ${
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-ink hover:bg-white hover:shadow-sm"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none" aria-hidden>{n.icon}</span>
                    <span className="text-sm font-semibold">{n.label}</span>
                  </div>
                  <div className={`pl-[1.625rem] text-2xs leading-snug ${active ? "text-white/75" : "text-muted"}`}>
                    {n.desc}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Safety notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-2xs leading-relaxed text-amber-800">
        <span aria-hidden>🔒</span>{" "}
        <strong>Read-only.</strong> Proposals only — never edits a live ad.
      </div>

      {/* Email */}
      {email && (
        <div className="flex items-center gap-2 truncate rounded-lg px-1 py-0.5 text-2xs text-muted">
          <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" aria-hidden />
          <span className="truncate">{email}</span>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <ModeProvider>
      <div className="min-h-screen bg-surface md:grid md:grid-cols-[260px_1fr]">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-3 md:hidden print:hidden">
          <span className="flex items-center gap-2 font-extrabold text-ink">
            <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
            AdPilot OS
          </span>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`${open ? "block" : "hidden"} border-r border-border-subtle bg-[#eef2f8] md:block print:hidden`}
          aria-label="Sidebar">
          <div className="md:sticky md:top-0 md:h-screen">
            <Sidebar email={email} onNav={() => setOpen(false)} />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 p-5 md:p-8">
          {children}
        </main>
      </div>
    </ModeProvider>
  );
}
