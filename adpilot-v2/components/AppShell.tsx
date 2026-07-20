"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeProvider, useMode, useHelpTips } from "./mode";
import OrgSwitcher from "./OrgSwitcher";
import ChatPanel from "./ChatPanel";
import { can, requiredPlan, PLAN_LABEL, FEATURE_LABEL, type Feature, type Plan } from "@/lib/entitlements";
import { Icon, type IconName } from "./icons";

// V6 P2 dual-mode nav. `advanced` items show only in Advanced mode; `feature` items show only
// when the plan unlocks them — so Simple stays a calm ~6-item view and locked clutter disappears.
// V7: emoji retired from nav — icons are the SVG set in components/icons.tsx.
type NavItem = { href: string; label: string; icon: IconName; desc: string; advanced?: boolean; feature?: Feature };
const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [
    { href: "/command", label: "Mission Control", icon: "radar", desc: "Your live cockpit" },
  ] },
  { title: "Ads", items: [
    { href: "/proposals", label: "Proposals", icon: "check-circle", desc: "Approve safe, prioritised fixes" },
    { href: "/dashboard", label: "Ads Health", icon: "gauge", desc: "Score a CSV export" },
    { href: "/connect", label: "Connect & Sync", icon: "link", desc: "Meta & TikTok + auto-sync" },
    { href: "/utm-builder", label: "UTM Builder", icon: "tag", desc: "Consistent names & tagged URLs", advanced: true },
    { href: "/actions", label: "Approved Actions", icon: "wrench", desc: "Owner-approved, bounded Meta changes", advanced: true, feature: "ad_write" },
  ] },
  { title: "Social", items: [
    { href: "/audience", label: "Audience", icon: "target", desc: "Who follows you + AI suggestions", advanced: true, feature: "ai_team" },
    { href: "/content", label: "Content Studio", icon: "clapper", desc: "Plan, schedule & publish posts", advanced: true, feature: "content_publish" },
    { href: "/boost", label: "Boost & Reach", icon: "rocket", desc: "Project a post's reach if you boost it", feature: "content_publish" },
    { href: "/content/calendar", label: "Content Calendar", icon: "calendar", desc: "Scheduled posts at a glance", advanced: true, feature: "content_publish" },
    { href: "/creative", label: "Creative Library", icon: "image", desc: "Link or upload audio/video/photo", advanced: true, feature: "creative_studio" },
    { href: "/creative-scorecard", label: "Creative Scorecard", icon: "scorecard", desc: "Hook rate, CTR decay & fatigue per ad", advanced: true, feature: "creative_studio" },
    { href: "/messenger", label: "Messenger", icon: "chat", desc: "Auto-replies, greeting & menu", advanced: true, feature: "messenger_automation" },
    { href: "/portfolio", label: "Clients", icon: "users", desc: "All your clients at a glance", advanced: true, feature: "multi_client" },
    { href: "/reports", label: "Reports", icon: "file-text", desc: "Client-ready reports & PDFs", feature: "reports" },
    { href: "/agency", label: "White-label", icon: "briefcase", desc: "Brand reports as your agency", advanced: true, feature: "white_label" },
  ] },
  { title: "AI Team", items: [
    { href: "/ai-specialists", label: "AI Specialists", icon: "compass", desc: "Agents grounded in your numbers", feature: "ai_team" },
    { href: "/policy-check", label: "Policy Check", icon: "shield", desc: "Paige checks copy for policy risk", advanced: true, feature: "ai_team" },
  ] },
  { title: "Account", items: [
    { href: "/billing", label: "Billing", icon: "credit-card", desc: "Plan & subscription" },
    { href: "/settings", label: "Settings", icon: "gear", desc: "Economics & auto-sync" },
    { href: "/notifications", label: "Notifications", icon: "bell", desc: "Weekly digest & alerts", advanced: true },
    { href: "/manual", label: "User Manual", icon: "book", desc: "How-to + download PDF", advanced: true },
  ] },
];

// All nav destinations — used so a parent (e.g. /content) doesn't also light up when the active
// path is itself a deeper nav item (e.g. /content/calendar).
const NAV_HREFS = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)));

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
            className={`rounded-lg px-2 py-1.5 transition-all duration-150 focus-visible:shadow-ring-brand ${
              mode === m
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:bg-white hover:text-ink hover:shadow-sm"
            }`}>
            {m === "beginner" ? "Simple" : "Advanced"}
          </button>
        ))}
      </div>
      <p className="px-1 pt-1.5 text-2xs text-muted">
        {mode === "beginner" ? "Simple view — guided, plain English." : "Advanced — full metrics & controls."}
      </p>
    </div>
  );
}

function HelpToggle() {
  const { helpTips, setHelpTips } = useHelpTips();
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-1.5">
      <button
        type="button"
        onClick={() => setHelpTips(!helpTips)}
        aria-pressed={helpTips}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-bold text-ink transition hover:bg-white hover:shadow-sm focus-visible:shadow-ring-brand">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="grid h-[15px] w-[15px] place-items-center rounded-full border border-current text-[9px] font-bold leading-none">?</span>
          Help tips
        </span>
        <span className={`relative inline-block h-4 w-7 flex-shrink-0 rounded-full transition-colors ${helpTips ? "bg-brand" : "bg-border-subtle"}`} aria-hidden>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${helpTips ? "left-[0.875rem]" : "left-0.5"}`} />
        </span>
      </button>
      <p className="px-1 pt-1.5 text-2xs text-muted">
        {helpTips ? "Plain-English “?” explainers are on." : "Explainers hidden — switch on anytime."}
      </p>
    </div>
  );
}

function Sidebar({ email, plan, onNav }: { email?: string; plan: Plan; onNav?: () => void }) {
  const path = usePathname();
  const { mode } = useMode();
  const advanced = mode === "advanced";
  const isLocked = (n: NavItem) => !!n.feature && !can(plan, n.feature);
  // Two distinct concerns: mode-gating is a HARD hide (keeps Simple calm); plan-gating is hidden
  // in Simple but shown-as-LOCKED in Advanced (visible upsell — owner's "entice upgrades" ask).
  const visible = (n: NavItem) => (advanced || !n.advanced) && (advanced || !isLocked(n));
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter(visible) }))
    .filter((g) => g.items.length > 0);
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Logo */}
      <Link href="/command" className="flex items-center gap-2.5 px-1 py-1 text-base font-extrabold tracking-tight text-ink transition hover:text-brand">
        <span className="inline-block h-7 w-7 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" />
        <span>AdPilot OS</span>
        <span className="ml-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-bold text-brand">V6</span>
      </Link>

      {/* Org switcher */}
      <OrgSwitcher />

      {/* Mode toggle */}
      <ModeToggle />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-1" aria-label="Main navigation">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.title && (
              <div className="px-3 pb-0.5 pt-2 text-2xs font-bold uppercase tracking-widest text-muted/70">{group.title}</div>
            )}
            {group.items.map((n) => {
              // Visible-but-locked (Advanced only): route to billing + show the required tier.
              if (isLocked(n)) {
                const need = requiredPlan(n.feature!);
                return (
                  <Link key={n.href} href="/billing" onClick={onNav}
                    title={`${FEATURE_LABEL[n.feature!]} — included in ${PLAN_LABEL[need]}`}
                    aria-label={`${n.label}, locked — upgrade to ${PLAN_LABEL[need]}`}
                    className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-muted/80 transition-all duration-150 hover:bg-white/60 hover:text-ink focus-visible:shadow-ring-brand">
                    <span className="flex-shrink-0 opacity-70" aria-hidden><Icon name={n.icon} /></span>
                    <span className="text-sm font-semibold">{n.label}</span>
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-bold text-brand" aria-hidden><Icon name="lock" size={10} /> {PLAN_LABEL[need]}</span>
                  </Link>
                );
              }
              const active = path === n.href || (!!path && path.startsWith(n.href + "/") && !NAV_HREFS.has(path));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNav}
                  aria-current={active ? "page" : undefined}
                  className={`group rounded-xl px-3 py-2.5 transition-all duration-150 focus-visible:shadow-ring-brand ${
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-ink hover:bg-white hover:shadow-sm"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex-shrink-0" aria-hidden><Icon name={n.icon} /></span>
                    <span className="text-sm font-semibold">{n.label}</span>
                  </div>
                  {advanced && (
                    <div className={`pl-[1.625rem] text-2xs leading-snug ${active ? "text-white/75" : "text-muted"}`}>
                      {n.desc}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Safety notice */}
      <div className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-2xs leading-relaxed text-amber-800">
        <span className="mt-px flex-shrink-0" aria-hidden><Icon name="lock" size={12} /></span>
        <span><strong>Read-only.</strong> Proposals only — never edits a live ad.</span>
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

export default function AppShell({ children, email, plan = "free" }: { children: React.ReactNode; email?: string; plan?: Plan }) {
  const [open, setOpen] = useState(false);
  return (
    <ModeProvider>
      <div className="min-h-screen bg-surface md:grid md:grid-cols-[260px_1fr]">
        <ChatPanel plan={plan} />
        {/* Mobile top bar (sticky so the menu is always reachable) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-white px-4 py-3 md:hidden print:hidden">
          <span className="flex items-center gap-2 font-extrabold text-ink">
            <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
            AdPilot OS
          </span>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile drawer backdrop — tap to close */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden print:hidden" aria-hidden onClick={() => setOpen(false)} />
        )}

        {/* Sidebar — overlay drawer on mobile (doesn't push content; scroll-capped), static column on desktop */}
        <aside
          className={`${open ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] overflow-y-auto shadow-2xl" : "hidden"} border-r border-border-subtle bg-surface md:static md:z-auto md:block md:w-auto md:max-w-none md:overflow-visible md:shadow-none print:hidden`}
          aria-label="Sidebar">
          <div className="md:sticky md:top-0 md:h-screen md:overflow-y-auto">
            <Sidebar email={email} plan={plan} onNav={() => setOpen(false)} />
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
