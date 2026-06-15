"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeProvider, useMode } from "./mode";

const NAV = [
  { href: "/dashboard", label: "Ads Health", icon: "📊", desc: "Score & fix your Meta/TikTok ads" },
  { href: "/ai-specialists", label: "AI Specialists", icon: "🧭", desc: "Your team of ad & business agents" },
  { href: "/build-dashboard", label: "Build a Dashboard", icon: "🧱", desc: "Sheets / Looker / Notion specs" },
  { href: "/canva-creator", label: "Canva Creator", icon: "🎨", desc: "Ad creative briefs & prompts" },
  { href: "/bobby-business-assistant", label: "Bobby — Business", icon: "🤝", desc: "Plain-English business help" },
  { href: "/aria-course-creator", label: "Aria — Courses", icon: "🎓", desc: "Turn expertise into a course" },
  { href: "/crm-maintenance", label: "CRM Maintenance", icon: "🧹", desc: "Keep your pipeline clean" },
  { href: "/claude-api", label: "Claude API", icon: "🔌", desc: "Connect AI generation" },
];

function ModeToggle() {
  const { mode, setMode } = useMode();
  return (
    <div className="rounded-xl border border-[#e3e8ef] bg-white p-1">
      <div className="grid grid-cols-2 gap-1 text-xs font-bold">
        {(["beginner", "advanced"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg px-2 py-1.5 capitalize transition ${mode === m ? "bg-brand text-white" : "text-muted hover:bg-[#f4f7fb]"}`}>
            {m}
          </button>
        ))}
      </div>
      <p className="px-1 pt-1 text-[11px] text-muted">
        {mode === "beginner" ? "Simple view — guided, plain English." : "Advanced — full metrics & controls."}
      </p>
    </div>
  );
}

function Sidebar({ email, onNav }: { email?: string; onNav?: () => void }) {
  const path = usePathname();
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-1 text-lg font-extrabold tracking-tight">
        <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-brand to-teal" /> AdPilot OS
        <span className="ml-1 rounded-full bg-[#eaf1ff] px-2 py-0.5 text-[11px] font-bold text-[#0b3aa6]">V2</span>
      </Link>
      <ModeToggle />
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV.map((n) => {
          const active = path === n.href || path?.startsWith(n.href + "/");
          return (
            <Link key={n.href} href={n.href} onClick={onNav}
              className={`group rounded-xl px-3 py-2.5 transition ${active ? "bg-brand text-white" : "hover:bg-white"}`}>
              <div className="flex items-center gap-2.5 font-semibold">
                <span>{n.icon}</span><span className="text-sm">{n.label}</span>
              </div>
              <div className={`pl-7 text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{n.desc}</div>
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl border border-[#f0c36d] bg-[#fff7e6] p-2.5 text-[11px] leading-snug text-[#7a5b00]">
        🔒 Read-only. Proposals only — never edits a live ad.
      </div>
      {email && <div className="truncate px-1 text-[11px] text-muted">{email}</div>}
    </div>
  );
}

export default function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <ModeProvider>
      <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
        {/* mobile top bar */}
        <div className="flex items-center justify-between border-b border-[#e3e8ef] bg-white px-4 py-3 md:hidden">
          <span className="flex items-center gap-2 font-extrabold"><span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-teal" /> AdPilot OS</span>
          <button onClick={() => setOpen(!open)} className="rounded-lg border border-[#e3e8ef] px-3 py-1.5 text-sm font-bold">Menu</button>
        </div>
        <aside className={`${open ? "block" : "hidden"} border-r border-[#e3e8ef] bg-[#eef2f8] md:block`}>
          <div className="md:sticky md:top-0 md:h-screen"><Sidebar email={email} onNav={() => setOpen(false)} /></div>
        </aside>
        <main className="min-w-0 p-5 md:p-8">{children}</main>
      </div>
    </ModeProvider>
  );
}
