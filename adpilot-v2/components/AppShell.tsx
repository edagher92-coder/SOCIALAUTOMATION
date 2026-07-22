"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { can, PLAN_LABEL, requiredPlan, type Plan } from "@/lib/entitlements";
import { ModeProvider, useMode, type Mode } from "./mode";
import OrgSwitcher from "./OrgSwitcher";
import ChatPanel from "./ChatPanel";
import CommandPalette from "./CommandPalette";
import OperationsDrawer, { type WorkspaceSummary } from "./OperationsDrawer";
import { ACCOUNT_NAV, ADVANCED_GROUPS, PRIMARY_NAV, navItemIsActive, type AppNavItem } from "./app-navigation";
import { Icon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

function ModeToggle() {
  const { mode, setMode } = useMode();
  return (
    <div className="rounded-xl border border-border-subtle bg-white p-1 shadow-sm" aria-label="Interface detail level">
      <div className="grid grid-cols-2 gap-1">
        {(["beginner", "advanced"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`rounded-lg px-2 py-1.5 text-xs font-bold ${mode === value ? "bg-ink text-white" : "text-muted hover:bg-surface hover:text-ink"}`}
          >
            {value === "beginner" ? "Simple" : "Advanced"}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavLink({ item, plan, onSelect, compact = false }: { item: AppNavItem; plan: Plan; onSelect?: () => void; compact?: boolean }) {
  const path = usePathname();
  const locked = Boolean(item.feature && !can(plan, item.feature));
  const active = !locked && navItemIsActive(path, item.href);
  const href = locked ? "/billing" : item.href;
  return (
    <Link
      href={href}
      onClick={onSelect}
      title={locked ? `${item.label} requires ${PLAN_LABEL[requiredPlan(item.feature!)]}` : item.description}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 ${compact ? "py-2" : "py-2.5"} text-sm font-semibold ${active ? "bg-ink text-white shadow-sm" : "text-ink hover:bg-white"}`}
    >
      <span className={`flex-shrink-0 ${active ? "text-brand-200" : "text-muted group-hover:text-brand"}`}><Icon name={item.icon} size={18} /></span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {locked && <span className="flex-shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-extrabold text-brand"><Icon name="lock" size={9} /></span>}
      {active && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />}
    </Link>
  );
}

function Sidebar({ email, plan, onSelect, onSearch }: { email?: string; plan: Plan; onSelect?: () => void; onSearch: () => void }) {
  const router = useRouter();
  const { mode } = useMode();
  const [accountOpen, setAccountOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initial = (email?.trim()?.[0] || "A").toUpperCase();
  return (
    <div className="flex h-full flex-col p-3">
      <Link href="/command" onClick={onSelect} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-base font-extrabold tracking-tight text-ink hover:bg-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow"><Icon name="radar" size={18} /></span>
        <span>AdPilot</span>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand">V7</span>
      </Link>

      <div className="mt-2"><OrgSwitcher /></div>

      <button type="button" onClick={onSearch} className="mt-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-left text-xs font-semibold text-muted shadow-sm hover:border-brand-200 hover:text-ink">
        <Icon name="search" size={16} />
        <span className="flex-1">Find anything</span>
        <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px]">Ctrl K</kbd>
      </button>

      <div className="mt-3"><ModeToggle /></div>
      <div className="mt-2"><ThemeToggle /></div>

      <nav className="mt-3 flex-1 overflow-y-auto" aria-label="Main navigation">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => <NavLink key={item.href} item={item} plan={plan} onSelect={onSelect} />)}
        </div>

        {mode === "advanced" && (
          <div className="mt-4 space-y-4 border-t border-border-subtle pt-3">
            {ADVANCED_GROUPS.map((group) => (
              <section key={group.title}>
                <h2 className="mb-1 px-3 text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted">{group.title}</h2>
                <div className="space-y-0.5">{group.items.map((item) => <NavLink key={item.href} item={item} plan={plan} onSelect={onSelect} compact />)}</div>
              </section>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-2 border-t border-border-subtle pt-2">
        <div className="grid grid-cols-4 gap-1">
          {ACCOUNT_NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={onSelect} title={`${item.label}: ${item.description}`} aria-label={item.label} className="grid place-items-center rounded-lg py-2 text-muted hover:bg-white hover:text-brand">
              <Icon name={item.icon} size={17} />
            </Link>
          ))}
        </div>

        <div className="relative mt-2">
          <button type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-white">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-white">{initial}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">{email || "AdPilot user"}</span><span className="text-[10px] font-semibold text-muted">{PLAN_LABEL[plan]} plan</span></span>
            <Icon name="more-horizontal" size={17} className="text-muted" />
          </button>
          {accountOpen && (
            <div className="absolute bottom-12 left-0 right-0 z-20 rounded-xl border border-border-subtle bg-white p-1.5 shadow-xl">
              <Link href="/settings" onClick={onSelect} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"><Icon name="gear" size={15} /> Workspace settings</Link>
              <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-band-red hover:bg-red-50"><Icon name="log-out" size={15} /> Sign out</button>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-xl bg-good/10 px-3 py-2 text-[10px] font-semibold text-ink">
          <span className="text-good"><Icon name="shield" size={14} /></span>
          Paid-ad changes blocked
        </div>
      </div>
    </div>
  );
}

const MOBILE_NAV = [PRIMARY_NAV[0], PRIMARY_NAV[1], PRIMARY_NAV[2], PRIMARY_NAV[4]];

function Shell({ children, email, plan, initialMode, summary }: { children: React.ReactNode; email?: string; plan: Plan; initialMode: Mode; summary: WorkspaceSummary }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); }
      if (event.key === "Escape") { setPaletteOpen(false); setOperationsOpen(false); setMenuOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ModeProvider initialMode={initialMode}>
      <div className="min-h-screen bg-surface md:grid md:grid-cols-[244px_minmax(0,1fr)]">
        <ChatPanel plan={plan} />

        <aside className="hidden border-r border-border-subtle bg-surface md:block print:hidden">
          <div className="sticky top-0 h-screen overflow-y-auto"><Sidebar email={email} plan={plan} onSearch={() => setPaletteOpen(true)} /></div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-border-subtle bg-white/90 px-5 backdrop-blur-xl md:flex print:hidden">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-ink">{summary.name || "AdPilot workspace"}</div>
              <div className="text-[10px] text-muted">{summary.openFixes ? `${summary.openFixes} fix${summary.openFixes === 1 ? "" : "es"} waiting for review` : "No open fixes"}</div>
            </div>
            <button type="button" onClick={() => setPaletteOpen(true)} className="flex w-72 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-left text-xs font-semibold text-muted hover:border-brand-200 hover:bg-white">
              <Icon name="search" size={15} /><span className="flex-1">Search or jump to...</span><kbd className="rounded border border-border-subtle bg-white px-1.5 py-0.5 text-[9px]">Ctrl K</kbd>
            </button>
            <button type="button" onClick={() => setOperationsOpen(true)} className="relative flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-bold text-ink hover:border-brand-200">
              <Icon name="activity" size={16} /> Control panel
              {summary.connectionIssues > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-bad" />}
            </button>
          </header>

          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border-subtle bg-white/95 px-3 backdrop-blur-xl md:hidden print:hidden">
            <Link href="/command" className="flex min-w-0 flex-1 items-center gap-2 font-extrabold text-ink"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-white"><Icon name="radar" size={15} /></span>AdPilot <span className="text-[9px] text-brand">V7</span></Link>
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Search" className="rounded-xl border border-border-subtle p-2 text-muted"><Icon name="search" /></button>
            <button type="button" onClick={() => setOperationsOpen(true)} aria-label="Open control panel" className="relative rounded-xl border border-border-subtle p-2 text-muted"><Icon name="activity" />{summary.connectionIssues > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-bad" />}</button>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" className="rounded-xl border border-border-subtle p-2 text-muted"><Icon name="menu" /></button>
          </header>

          <main className="min-w-0 px-4 pb-24 pt-4 md:p-6">{children}</main>
        </section>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-cockpit/60 md:hidden" role="presentation" onMouseDown={() => setMenuOpen(false)}>
            <aside className="h-full w-[88vw] max-w-[330px] bg-surface shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <Sidebar email={email} plan={plan} onSearch={() => { setMenuOpen(false); setPaletteOpen(true); }} onSelect={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border-subtle bg-white/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden print:hidden" aria-label="Quick navigation">
          {MOBILE_NAV.map((item) => {
            const active = navItemIsActive(path, item.href);
            return <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-bold ${active ? "text-brand" : "text-muted"}`}><Icon name={item.icon} size={19} /><span className="truncate">{item.shortLabel || item.label}</span></Link>;
          })}
          <button type="button" onClick={() => setMenuOpen(true)} className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-bold text-muted"><Icon name="more-horizontal" size={19} /><span>More</span></button>
        </nav>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} plan={plan} />
        <OperationsDrawer open={operationsOpen} onClose={() => setOperationsOpen(false)} summary={summary} />
      </div>
    </ModeProvider>
  );
}

export default function AppShell({ children, email, plan = "free", initialMode = "advanced", summary }: { children: React.ReactNode; email?: string; plan?: Plan; initialMode?: Mode; summary?: Partial<WorkspaceSummary> }) {
  const safeSummary: WorkspaceSummary = {
    name: summary?.name,
    lastSyncedAt: summary?.lastSyncedAt ?? null,
    openFixes: summary?.openFixes ?? 0,
    connectionIssues: summary?.connectionIssues ?? 0,
    connectedAccounts: summary?.connectedAccounts ?? 0,
  };
  return <Shell email={email} plan={plan} initialMode={initialMode} summary={safeSummary}>{children}</Shell>;
}
