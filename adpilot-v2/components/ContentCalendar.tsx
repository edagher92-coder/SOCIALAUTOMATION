"use client";
import { useEffect, useMemo, useState } from "react";

type Post = {
  id: string; platform: string; caption: string | null; media_url: string | null;
  media_type: string | null; status: string; scheduled_at: string | null;
  published_at: string | null; external_id: string | null; source: string;
};

const PLATFORM: Record<string, { emoji: string; label: string }> = {
  facebook: { emoji: "📘", label: "Facebook" },
  instagram: { emoji: "📸", label: "Instagram" },
  tiktok: { emoji: "🎵", label: "TikTok" },
};
const STATUS: Record<string, { dot: string; label: string; chip: string }> = {
  draft: { dot: "bg-muted", label: "Draft", chip: "bg-surface text-muted" },
  approved: { dot: "bg-sky-500", label: "Approved", chip: "bg-sky-50 text-sky-700" },
  scheduled: { dot: "bg-amber-500", label: "Scheduled", chip: "bg-amber-50 text-amber-700" },
  published: { dot: "bg-teal", label: "Published", chip: "bg-teal/10 text-teal" },
  failed: { dot: "bg-band-red", label: "Failed", chip: "bg-band-red/10 text-band-red" },
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function ContentCalendar() {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(ymd(today));

  // Stable 6-week grid starting on the Monday on/before the 1st (AU week starts Monday).
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(cursor.y, cursor.m, 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [cursor]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const from = grid[0], to = grid[grid.length - 1];
    const fromISO = new Date(from.getFullYear(), from.getMonth(), from.getDate()).toISOString();
    const toISO = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();
    fetch(`/api/content?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`)
      .then((r) => r.json())
      .then((j) => { if (active) setPosts(j.posts || []); })
      .catch(() => { if (active) setPosts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [grid]);

  const byDay = useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const p of posts) {
      const t = p.scheduled_at || p.published_at;
      if (!t) continue;
      (map[ymd(new Date(t))] ||= []).push(p);
    }
    return map;
  }, [posts]);

  const selPosts = (byDay[selected] || []).slice().sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""));
  const move = (delta: number) => setCursor((c) => {
    const d = new Date(c.y, c.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  return (
    <div>
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{MONTHS[cursor.m]} {cursor.y}</h2>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })} className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-bold text-ink transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">Today</button>
          <button onClick={() => move(-1)} aria-label="Previous month" className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">‹</button>
          <button onClick={() => move(1)} aria-label="Next month" className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">›</button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 text-center text-2xs font-bold uppercase tracking-wide text-muted">
        {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* Day grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === cursor.m;
          const isToday = key === ymd(today);
          const isSel = key === selected;
          const dayPosts = byDay[key] || [];
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              aria-label={`${d.getDate()} — ${dayPosts.length} post${dayPosts.length === 1 ? "" : "s"}`}
              className={`flex min-h-[56px] flex-col rounded-lg border p-1 text-left transition hover:border-brand focus-visible:shadow-ring-brand sm:min-h-[84px] ${isSel ? "border-brand ring-1 ring-brand/30" : "border-border-subtle"} ${inMonth ? "bg-white" : "bg-surface"}`}>
              <span className={`text-2xs font-bold ${isToday ? "grid h-5 w-5 place-items-center rounded-full bg-brand text-white" : inMonth ? "text-ink" : "text-muted/50"}`}>{d.getDate()}</span>
              <span className="mt-auto flex flex-wrap gap-0.5">
                {dayPosts.slice(0, 4).map((p) => (
                  <span key={p.id} title={`${PLATFORM[p.platform]?.label || p.platform} · ${STATUS[p.status]?.label || p.status}`} className={`h-1.5 w-1.5 rounded-full ${STATUS[p.status]?.dot || "bg-muted"}`} />
                ))}
                {dayPosts.length > 4 && <span className="text-[8px] font-bold leading-none text-muted">+{dayPosts.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-muted">
        {Object.entries(STATUS).map(([k, s]) => (
          <span key={k} className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}</span>
        ))}
      </div>

      {/* Selected-day detail */}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-bold text-ink">{new Date(selected + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</h3>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : selPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle p-4 text-sm text-muted">Nothing scheduled. <a href="/content" className="font-semibold text-brand">Compose a post →</a></p>
        ) : (
          <div className="space-y-2">
            {selPosts.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-xl border border-border-subtle bg-white p-3 shadow-card">
                <span className="text-lg" aria-hidden>{PLATFORM[p.platform]?.emoji || "📱"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${STATUS[p.status]?.chip || "bg-surface text-muted"}`}>{STATUS[p.status]?.label || p.status}</span>
                    {p.scheduled_at && <span className="text-2xs text-muted">{new Date(p.scheduled_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}</span>}
                    <span className="text-2xs uppercase text-muted">{PLATFORM[p.platform]?.label || p.platform}</span>
                  </div>
                  {p.caption && <p className="mt-1 line-clamp-2 text-sm text-ink">{p.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <a href="/content" className="mt-3 inline-block text-sm font-semibold text-brand">Open Content Studio →</a>
      </div>
    </div>
  );
}
