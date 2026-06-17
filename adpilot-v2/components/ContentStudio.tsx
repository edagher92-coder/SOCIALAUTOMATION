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

// Instagram (no text-only posts) and TikTok (video-only) require a media URL to publish.
// Facebook can publish a text/link post without media. Mirror the server-side provider rules
// so the UI never lets a user try to publish a post the platform will reject.
function requiresMedia(platform: string) {
  return platform === "instagram" || platform === "tiktok";
}
function canPublishPost(p: Post) {
  return !(requiresMedia(p.platform) && !p.media_url);
}
// `min` for the datetime-local picker: ~1 minute from now in the input's local format.
function minScheduleLocal() {
  const d = new Date(Date.now() + 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContentStudio({ canStudio }: { canStudio: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("reel");
  const [brief, setBrief] = useState({ topic: "", offer: "", audience: "" });
  const [ai, setAi] = useState("");
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgAspect, setImgAspect] = useState("1:1");
  const [images, setImages] = useState<{ url: string; seed?: number }[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/content"); const j = await r.json();
      if (r.ok) { setPosts(j.posts || []); setLoadErr(""); }
      else setLoadErr(j.error || "Couldn't load your content.");
    } catch (e: any) {
      setLoadErr(e?.message || "Couldn't load your content.");
    } finally { setLoaded(true); }
  }
  useEffect(() => { load(); }, []);

  // A draft needs at least a caption or a media URL. Instagram/TikTok need media to publish,
  // but we allow saving the draft and only block the save when it has nothing at all.
  const trimmedMedia = mediaUrl.trim();
  const mediaInvalid = trimmedMedia.length > 0 && !trimmedMedia.startsWith("https://");
  const nothingToSave = !caption.trim() && !trimmedMedia;

  async function draftAI() {
    setBusy("ai"); setMsg(""); setErr(""); setAi("");
    try {
      const r = await fetch("/api/content/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, ...brief }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "AI error"); return; }
      setAi(j.text); if (!caption) setCaption(j.text);
    } catch (e: any) { setErr(e?.message || "AI error"); } finally { setBusy(""); }
  }

  async function genImage() {
    setBusy("img"); setMsg(""); setErr(""); setImages([]);
    try {
      const r = await fetch("/api/creative/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: imgPrompt.trim(), aspect: imgAspect }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Couldn't generate the image"); return; }
      setImages(j.images || []);
    } catch (e: any) { setErr(e?.message || "Couldn't generate the image"); } finally { setBusy(""); }
  }

  async function save() {
    setMsg(""); setErr("");
    if (nothingToSave) { setErr("Add a caption or a media URL first."); return; }
    if (mediaInvalid) { setErr("Media URL must start with https://"); return; }
    setBusy("save");
    try {
      const body: any = { platform, caption: caption.trim() || undefined, source: ai ? "studio" : "upload" };
      if (trimmedMedia) { body.media_url = trimmedMedia; body.media_type = mediaType; }
      const r = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Couldn't save"); return; }
      setCaption(""); setMediaUrl(""); setAi(""); setMsg("Saved as draft ✅");
      load();
    } catch (e: any) { setErr(e?.message || "Couldn't save"); } finally { setBusy(""); }
  }

  async function patch(id: string, body: any, key: string) {
    setBusy(key); setMsg(""); setErr("");
    try {
      const r = await fetch(`/api/content/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Action failed"); }
      else if (body.publishNow) setMsg(j.status === "published" ? "Published ✅" : "Done");
      else if (body.status === "scheduled") setMsg("Scheduled ✅");
      load();
    } catch (e: any) { setErr(e?.message || "Action failed"); } finally { setBusy(""); }
  }
  async function del(id: string) {
    setBusy(id); setMsg(""); setErr("");
    try {
      const r = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "Couldn't delete"); }
    } catch (e: any) { setErr(e?.message || "Couldn't delete"); } finally { load(); setBusy(""); }
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
          <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className={`w-full rounded-lg border p-2.5 ${mediaInvalid ? "border-band-red" : "border-border-subtle"}`} />
          {mediaInvalid && <span className="mt-1 block text-2xs text-band-red">Must be a public https:// link.</span>}
          {requiresMedia(platform) && !trimmedMedia && <span className="mt-1 block text-2xs text-muted">{platform === "tiktok" ? "TikTok" : "Instagram"} needs a media URL to publish.</span>}
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

              {/* Firefly image generation */}
              <div className="mt-3 border-t border-brand-200/60 pt-3">
                <span className="text-sm font-bold">🖼️ Generate an ad image (Adobe Firefly)</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Describe the image — e.g. warm flat-lay of a coffee subscription box on a kitchen bench" className="rounded-lg border border-border-subtle p-2 text-sm" />
                  <select value={imgAspect} onChange={(e) => setImgAspect(e.target.value)} className="rounded-lg border border-border-subtle p-2 text-sm">
                    <option value="1:1">1:1 feed</option>
                    <option value="9:16">9:16 story/reel</option>
                    <option value="16:9">16:9 landscape</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>
                <button onClick={genImage} disabled={busy === "img" || imgPrompt.trim().length < 3} className="mt-2 rounded-lg border border-brand px-3 py-1.5 text-sm font-bold text-brand disabled:opacity-50">
                  {busy === "img" ? "Generating… (20–40s)" : "Generate image"}
                </button>
                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {images.map((im, i) => (
                      <div key={i} className="rounded-lg border border-border-subtle p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.url} alt="Generated ad creative" className="w-full rounded" />
                        <button onClick={() => { setMediaUrl(im.url); setMediaType("image"); setMsg("Image set as media — save your draft."); }} className="mt-1.5 w-full rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">Use this image</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-2xs text-muted">Generated with your Adobe Firefly account. Links expire ~1h — save/re-host before publishing. Needs Firefly keys on the server.</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={busy === "save" || nothingToSave || mediaInvalid} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "save" ? "Saving…" : "Save as draft"}</button>
          {msg && <span className="text-sm text-band-green">{msg}</span>}
          {err && <span className="text-sm text-band-red">{err}</span>}
        </div>
      </div>

      {/* Queue */}
      <div>
        <h2 className="mb-2 font-bold">Your content</h2>
        {loadErr ? (
          <div className="rounded-2xl border border-band-red/30 bg-band-red/5 p-6 text-center text-sm text-band-red">{loadErr}</div>
        ) : !loaded ? (
          <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-muted">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-muted">Nothing yet. Create your first post above to start your queue.</div>
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
                    {p.published_at && p.status === "published" && <p className="mt-1 text-2xs text-muted">Published {new Date(p.published_at).toLocaleString()}</p>}
                    {p.error && <p className="mt-1 text-2xs text-band-red">{p.error}</p>}
                    {(p.status === "approved" || p.status === "failed") && !canPublishPost(p) && (
                      <p className="mt-1 text-2xs text-band-red">Add a media URL — {p.platform === "tiktok" ? "TikTok" : "Instagram"} can't publish without one.</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
                    {p.status === "draft" && <button onClick={() => patch(p.id, { status: "approved" }, p.id)} disabled={busy === p.id} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">Approve</button>}
                    {(p.status === "approved" || p.status === "failed") && <button onClick={() => patch(p.id, { publishNow: true }, p.id)} disabled={busy === p.id || !canPublishPost(p)} title={!canPublishPost(p) ? "Add a media URL to publish" : undefined} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">{p.status === "failed" ? "Retry publish" : "Publish now"}</button>}
                    {p.status !== "published" && <button onClick={() => del(p.id)} disabled={busy === p.id} className="rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-semibold text-muted disabled:opacity-50">Delete</button>}
                  </div>
                </div>
                {p.status === "approved" && canPublishPost(p) && (
                  <div className="mt-2 flex items-center gap-2 border-t border-[#eef2f7] pt-2">
                    <input type="datetime-local" min={minScheduleLocal()} className="rounded-lg border border-border-subtle p-1.5 text-xs"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const when = new Date(e.target.value);
                        if (when.getTime() <= Date.now()) { setErr("Pick a time in the future."); return; }
                        patch(p.id, { status: "scheduled", scheduled_at: when.toISOString() }, p.id);
                      }} />
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
