"use client";
import { useEffect, useState } from "react";

type Post = {
  id: string; platform: string; caption?: string; media_url?: string; media_type?: string;
  status: string; scheduled_at?: string | null; published_at?: string | null; error?: string | null; source?: string;
};

const PLATFORMS = [
  { v: "instagram", label: "Instagram" },
  { v: "facebook", label: "Facebook" },
  { v: "tiktok", label: "TikTok" },
];
const STATUS_CLS: Record<string, string> = {
  draft: "bg-surface text-muted", approved: "bg-brand-50 text-brand", scheduled: "bg-teal-50 text-teal",
  published: "bg-band-green/10 text-band-green", failed: "bg-band-red/10 text-band-red",
};

export default function ContentStudio({ canStudio }: { canStudio: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("reel");
  const [brief, setBrief] = useState({ topic: "", offer: "", audience: "" });
  const [ai, setAi] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/content"); const j = await r.json();
    if (r.ok) setPosts(j.posts || []);
  }
  useEffect(() => { load(); }, []);

  async function draftAI() {
    setBusy("ai"); setMsg(""); setAi("");
    try {
      const r = await fetch("/api/content/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, ...brief }) });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "AI error"); return; }
      setAi(j.text); if (!caption) setCaption(j.text);
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }

  async function save() {
    setBusy("save"); setMsg("");
    try {
      const body: any = { platform, caption: caption.trim() || undefined, source: ai ? "studio" : "upload" };
      if (mediaUrl.trim()) { body.media_url = mediaUrl.trim(); body.media_type = mediaType; }
      const r = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "Couldn't save"); return; }
      setCaption(""); setMediaUrl(""); setAi(""); setMsg("Saved as draft ✅");
      load();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }

  async function patch(id: string, body: any, key: string) {
    setBusy(key); setMsg("");
    try {
      const r = await fetch(`/api/content/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "Action failed"); }
      else if (body.publishNow) setMsg(j.status === "published" ? "Published ✅" : "Done");
      load();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function del(id: string) {
    setBusy(id); await fetch(`/api/content/${id}`, { method: "DELETE" }); load(); setBusy("");
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h2 className="mb-3 font-bold">Create a post / reel</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="mb-1 block font-semibold">Platform</span>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg border border-border-subtle p-2.5">
              {PLATFORMS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </label>
          <label className="text-sm"><span className="mb-1 block font-semibold">Media type</span>
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="w-full rounded-lg border border-border-subtle p-2.5">
              <option value="reel">Reel / short video</option><option value="video">Video</option><option value="image">Image</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-semibold">Media URL <span className="font-normal text-muted">(your uploaded reel/photo link)</span></span>
          <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-border-subtle p-2.5" />
        </label>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-semibold">Caption</span>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="h-28 w-full rounded-lg border border-border-subtle p-2.5" placeholder="Write your caption, or draft it with AI →" />
        </label>

        {/* AI Creative Studio (higher tiers) */}
        <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">✨ AI Creative Studio</span>
            {!canStudio && <a href="/billing" className="text-xs font-semibold text-brand">Pro & Expert — upgrade</a>}
          </div>
          {canStudio && (
            <>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input value={brief.topic} onChange={(e) => setBrief({ ...brief, topic: e.target.value })} placeholder="Topic / product" className="rounded-lg border border-border-subtle p-2 text-sm" />
                <input value={brief.offer} onChange={(e) => setBrief({ ...brief, offer: e.target.value })} placeholder="Offer" className="rounded-lg border border-border-subtle p-2 text-sm" />
                <input value={brief.audience} onChange={(e) => setBrief({ ...brief, audience: e.target.value })} placeholder="Audience" className="rounded-lg border border-border-subtle p-2 text-sm" />
              </div>
              <button onClick={draftAI} disabled={busy === "ai"} className="mt-2 rounded-lg border border-brand px-3 py-1.5 text-sm font-bold text-brand disabled:opacity-50">
                {busy === "ai" ? "Drafting…" : "Draft caption, hooks & shotlist"}
              </button>
              {ai && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border-subtle bg-surface p-3 text-xs">{ai}</pre>}
              <p className="mt-1.5 text-2xs text-muted">Grounded in your analysis · then design in <a className="underline" href="https://www.canva.com/create/" target="_blank" rel="noreferrer">Canva</a> / Adobe Express and paste the media URL above.</p>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={save} disabled={busy === "save"} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "save" ? "Saving…" : "Save as draft"}</button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>

      {/* Queue */}
      <div>
        <h2 className="mb-2 font-bold">Your content</h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-muted">Nothing yet. Create a post above.</div>
        ) : (
          <div className="space-y-2.5">
            {posts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-2xs font-bold uppercase text-muted">{p.platform}</span>
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-bold capitalize ${STATUS_CLS[p.status] || "bg-surface text-muted"}`}>{p.status}</span>
                      {p.source === "studio" && <span className="text-2xs text-brand">✨ AI</span>}
                    </div>
                    {p.caption && <p className="mt-1 line-clamp-2 text-sm text-ink">{p.caption}</p>}
                    {p.scheduled_at && p.status === "scheduled" && <p className="mt-1 text-2xs text-muted">Scheduled {new Date(p.scheduled_at).toLocaleString()}</p>}
                    {p.error && <p className="mt-1 text-2xs text-band-red">{p.error}</p>}
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
                    {p.status === "draft" && <button onClick={() => patch(p.id, { status: "approved" }, p.id)} disabled={busy === p.id} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">Approve</button>}
                    {(p.status === "approved" || p.status === "failed") && <button onClick={() => patch(p.id, { publishNow: true }, p.id)} disabled={busy === p.id} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">Publish now</button>}
                    {p.status !== "published" && <button onClick={() => del(p.id)} disabled={busy === p.id} className="rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-semibold text-muted disabled:opacity-50">Delete</button>}
                  </div>
                </div>
                {(p.status === "approved") && (
                  <div className="mt-2 flex items-center gap-2 border-t border-[#eef2f7] pt-2">
                    <input type="datetime-local" className="rounded-lg border border-border-subtle p-1.5 text-xs"
                      onChange={(e) => { if (e.target.value) patch(p.id, { status: "scheduled", scheduled_at: new Date(e.target.value).toISOString() }, p.id); }} />
                    <span className="text-2xs text-muted">schedule (auto-publishes when due)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
