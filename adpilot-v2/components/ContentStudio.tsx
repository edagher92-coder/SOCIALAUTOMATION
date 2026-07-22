"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

type Post = {
  id: string; platform: string; caption?: string; media_url?: string; media_type?: string;
  status: string; scheduled_at?: string | null; published_at?: string | null; error?: string | null; source?: string;
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram", note: "Image or video required" },
  { value: "facebook", label: "Facebook", note: "Text, image or video" },
  { value: "tiktok", label: "TikTok", note: "Video required" },
];

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-surface text-muted", approved: "bg-brand-50 text-brand", scheduled: "bg-ice/10 text-blue-700",
  published: "bg-good/10 text-green-700", failed: "bg-bad/10 text-bad",
};

function requiresMedia(platform: string) { return platform === "instagram" || platform === "tiktok"; }
function canPublishPost(post: Post) { return !(requiresMedia(post.platform) && !post.media_url); }
function minScheduleLocal() {
  const value = new Date(Date.now() + 60_000);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default function ContentStudio({ canStudio }: { canStudio: boolean }) {
  const [view, setView] = useState<"compose" | "assist" | "queue">("compose");
  const [posts, setPosts] = useState<Post[]>([]);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("reel");
  const [brief, setBrief] = useState({ topic: "", offer: "", audience: "" });
  const [ai, setAi] = useState("");
  const [policyReview, setPolicyReview] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspect, setImageAspect] = useState("1:1");
  const [imageCount, setImageCount] = useState(1);
  const [images, setImages] = useState<{ url: string; seed?: number }[]>([]);
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Content could not be loaded.");
      setPosts(payload.posts || []); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Content could not be loaded.");
    } finally { setLoaded(true); }
  }

  useEffect(() => { void load(); }, []);

  const trimmedMedia = mediaUrl.trim();
  const mediaInvalid = trimmedMedia.length > 0 && !trimmedMedia.startsWith("https://");
  const nothingToSave = !caption.trim() && !trimmedMedia;
  const platformInfo = PLATFORMS.find((item) => item.value === platform)!;
  const filteredPosts = statusFilter === "all" ? posts : posts.filter((post) => post.status === statusFilter);
  const counts = useMemo(() => ({ draft: posts.filter((post) => post.status === "draft").length, review: posts.filter((post) => post.status === "approved").length, scheduled: posts.filter((post) => post.status === "scheduled").length, published: posts.filter((post) => post.status === "published").length }), [posts]);

  function clearFeedback() { setMessage(""); setError(""); }

  async function draftWithAI() {
    setBusy("ai"); clearFeedback(); setAi(""); setPolicyReview("");
    try {
      const response = await fetch("/api/content/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, ...brief }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The assistant could not create a draft.");
      setAi(payload.text || ""); setPolicyReview(payload.policy?.review || "");
      if (!caption) setCaption(payload.text || "");
      setMessage("Draft added to the composer. Review every claim before saving.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The assistant could not create a draft."); }
    finally { setBusy(""); }
  }

  async function generateImage(referenceImage?: string) {
    setBusy("image"); clearFeedback(); if (!referenceImage) setImages([]);
    try {
      const response = await fetch("/api/creative/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: imagePrompt.trim() || "Create a clean on-brand advertising variation. Keep it truthful and do not add text or people.", aspect: imageAspect, numVariations: referenceImage ? 1 : imageCount, ...(referenceImage ? { referenceImage } : {}) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The image could not be generated.");
      setImages(payload.images || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The image could not be generated."); }
    finally { setBusy(""); }
  }

  async function saveDraft() {
    clearFeedback();
    if (nothingToSave) { setError("Add a caption or a secure media URL first."); return; }
    if (mediaInvalid) { setError("The media URL must start with https://"); return; }
    setBusy("save");
    try {
      const body: Record<string, unknown> = { platform, caption: caption.trim() || undefined, source: ai ? "studio" : "upload" };
      if (trimmedMedia) { body.media_url = trimmedMedia; body.media_type = mediaType; }
      const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The draft could not be saved.");
      setCaption(""); setMediaUrl(""); setAi(""); setPolicyReview(""); setMessage("Draft saved to the review queue."); setView("queue");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The draft could not be saved."); }
    finally { setBusy(""); }
  }

  async function updatePost(id: string, body: Record<string, unknown>, key: string) {
    setBusy(key); clearFeedback();
    try {
      const response = await fetch(`/api/content/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The update failed.");
      setMessage(body.publishNow ? "Post published." : body.status === "scheduled" ? "Post scheduled." : body.status === "approved" ? "Post approved and ready." : "Post updated.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The update failed."); }
    finally { setBusy(""); }
  }

  async function publish(post: Post) {
    if (!window.confirm(`Publish this approved ${post.platform} post now?\n\nThis sends organic content to the connected channel. It does not create an ad.`)) return;
    await updatePost(post.id, { publishNow: true }, `publish:${post.id}`);
  }

  async function archiveDraft(post: Post) {
    if (!window.confirm("Archive this unpublished item? It leaves the active queue but its history is preserved. Published content and paid ads are not affected.")) return;
    setBusy(`remove:${post.id}`); clearFeedback();
    try {
      const response = await fetch(`/api/content/${post.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The item could not be archived.");
      setMessage("Item archived. Its history has been preserved."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The item could not be archived."); }
    finally { setBusy(""); }
  }

  async function schedule(post: Post) {
    const raw = scheduleValues[post.id];
    if (!raw) { setError("Choose a future date and time first."); return; }
    const when = new Date(raw);
    if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) { setError("Choose a date and time in the future."); return; }
    await updatePost(post.id, { status: "scheduled", scheduled_at: when.toISOString() }, `schedule:${post.id}`);
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 rounded-2xl border border-border-subtle bg-white p-1.5 shadow-card">
        {[
          ["compose", "Compose", "clapper"], ["assist", "AI assist", "sparkle"], ["queue", `Queue (${posts.length})`, "calendar"],
        ].map(([value, label, icon]) => <button key={value} type="button" onClick={() => setView(value as typeof view)} aria-pressed={view === value} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-bold ${view === value ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-surface hover:text-ink"}`}><Icon name={icon as "clapper" | "sparkle" | "calendar"} size={16} />{label}</button>)}
      </div>

      {view === "compose" && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-ink">Compose a draft</h2><p className="mt-1 text-sm text-muted">Nothing publishes from this screen.</p></div><span className="rounded-full bg-surface px-2.5 py-1 text-2xs font-extrabold uppercase text-muted">Step 1 of 3</span></div>
            <fieldset className="mt-5"><legend className="mb-2 text-sm font-bold text-ink">Channel</legend><div className="grid gap-2 sm:grid-cols-3">{PLATFORMS.map((item) => <button key={item.value} type="button" onClick={() => setPlatform(item.value)} aria-pressed={platform === item.value} className={`rounded-xl border p-3 text-left ${platform === item.value ? "border-brand bg-brand-50" : "border-border-subtle hover:border-brand-200"}`}><span className={`block text-sm font-bold ${platform === item.value ? "text-brand" : "text-ink"}`}>{item.label}</span><span className="mt-0.5 block text-2xs text-muted">{item.note}</span></button>)}</div></fieldset>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]"><label><span className="mb-1.5 block text-sm font-bold text-ink">Secure media URL <span className="font-normal text-muted">(optional on Facebook)</span></span><input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://your-file-host/..." className={`w-full rounded-xl border bg-surface px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:shadow-ring-brand ${mediaInvalid ? "border-bad" : "border-border-subtle"}`} />{mediaInvalid && <span className="mt-1 block text-2xs font-semibold text-bad">Use a public https:// link.</span>}</label><label><span className="mb-1.5 block text-sm font-bold text-ink">Format</span><select value={mediaType} onChange={(event) => setMediaType(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm"><option value="reel">Reel / short video</option><option value="video">Video</option><option value="image">Image</option></select></label></div>
            <label className="mt-4 block"><span className="mb-1.5 flex items-center justify-between text-sm font-bold text-ink"><span>Caption</span><span className={`text-xs font-semibold ${caption.length > 2000 ? "text-bad" : "text-muted"}`}>{caption.length}/2,200</span></span><textarea value={caption} maxLength={2200} onChange={(event) => setCaption(event.target.value)} className="h-44 w-full resize-y rounded-xl border border-border-subtle bg-surface p-3 text-sm leading-relaxed focus:bg-white focus:outline-none focus:shadow-ring-brand" placeholder="Write the approved message, or use AI assist to prepare a draft..." /></label>
            {requiresMedia(platform) && !trimmedMedia && <div className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 p-3 text-xs text-amber-900"><Icon name="info" size={15} /> {platformInfo.label} requires media before this draft can publish. You can still save it and add media later.</div>}
            <div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" onClick={saveDraft} disabled={busy === "save" || nothingToSave || mediaInvalid} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"><Icon name="check-circle" size={15} />{busy === "save" ? "Saving..." : "Save to review queue"}</button><button type="button" onClick={() => setView("assist")} className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink hover:border-brand-200"><Icon name="sparkle" size={15} /> Get AI assistance</button></div>
          </div>

          <aside className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card"><div className="flex items-center justify-between"><h2 className="font-extrabold text-ink">Post preview</h2><span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-extrabold uppercase text-muted">{platformInfo.label}</span></div><div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface"><div className="aspect-square bg-gradient-to-br from-brand-50 to-teal-50">{trimmedMedia ? <div className="grid h-full place-items-center p-5 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-card"><Icon name={mediaType === "image" ? "image" : "clapper"} size={22} /></span><span className="mt-2 block max-w-full truncate text-xs font-semibold text-muted">Media attached</span></div> : <div className="grid h-full place-items-center p-5 text-center text-muted"><div><Icon name="image" className="mx-auto" size={27} /><p className="mt-2 text-xs">Media preview appears after you add a URL</p></div></div>}</div><div className="bg-white p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{caption || "Your caption preview will appear here."}</p></div></div><div className="mt-4 rounded-xl border border-good/25 bg-good/10 p-3 text-xs leading-relaxed text-green-900"><b>Approval gate:</b> saving creates a draft. You must then review and approve it in Queue before any publish control appears.</div></aside>
        </section>
      )}

      {view === "assist" && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-ink">Caption & brief assistant</h2><p className="mt-1 text-sm text-muted">Grounded drafting with a policy pre-flight.</p></div><span className="text-brand"><Icon name="sparkle" size={22} /></span></div>{canStudio ? <><div className="mt-5 space-y-3"><label><span className="mb-1 block text-xs font-bold text-ink">Topic or product</span><input value={brief.topic} onChange={(event) => setBrief({ ...brief, topic: event.target.value })} placeholder="What are we talking about?" className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-ink">Offer or call to action</span><input value={brief.offer} onChange={(event) => setBrief({ ...brief, offer: event.target.value })} placeholder="What should the reader do?" className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-ink">Audience</span><input value={brief.audience} onChange={(event) => setBrief({ ...brief, audience: event.target.value })} placeholder="Who is this for?" className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm" /></label></div><button type="button" onClick={draftWithAI} disabled={busy === "ai" || !brief.topic.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Icon name="sparkle" size={15} />{busy === "ai" ? "Preparing draft..." : "Prepare caption, hooks & shot list"}</button>{ai && <div className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4"><div className="text-2xs font-extrabold uppercase tracking-wider text-brand">Draft output</div><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{ai}</pre><button type="button" onClick={() => { setCaption(ai); setView("compose"); }} className="mt-3 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">Use in composer</button></div>}{policyReview && <div className="mt-3 rounded-2xl border border-good/25 bg-good/10 p-4"><div className="flex items-center gap-2 text-xs font-extrabold uppercase text-green-800"><Icon name="shield" size={15} /> Policy pre-flight</div><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-green-900/80">{policyReview}</pre><p className="mt-2 text-2xs text-green-900/70">Automated screening helps; a person must still verify claims and platform policy.</p></div>}</> : <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-5"><Icon name="lock" className="text-brand" /><h3 className="mt-3 font-bold text-ink">AI assistance is available on Pro and Expert</h3><p className="mt-1 text-sm text-muted">Manual composing, approval and publishing remain available on your current plan.</p><Link href="/billing" className="mt-3 inline-flex text-sm font-bold text-brand">Compare plans</Link></div>}</div>

          <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-ink">Image concepts</h2><p className="mt-1 text-sm text-muted">Generate source concepts, then review and re-host before publishing.</p></div><span className="text-brand"><Icon name="image" size={22} /></span></div>{canStudio ? <><label className="mt-5 block"><span className="mb-1 block text-xs font-bold text-ink">Describe the image</span><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Example: warm flat-lay of a coffee subscription box on a kitchen bench, no text, natural light" className="h-24 w-full rounded-xl border border-border-subtle bg-surface p-3 text-sm" /></label><div className="mt-3 grid grid-cols-2 gap-2"><label><span className="mb-1 block text-xs font-bold text-ink">Aspect</span><select value={imageAspect} onChange={(event) => setImageAspect(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm"><option value="1:1">1:1 feed</option><option value="9:16">9:16 story/reel</option><option value="16:9">16:9 landscape</option><option value="4:3">4:3</option><option value="3:4">3:4</option></select></label><label><span className="mb-1 block text-xs font-bold text-ink">Variations</span><select value={imageCount} onChange={(event) => setImageCount(Number(event.target.value))} className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm"><option value={1}>1 image</option><option value={2}>2 images</option><option value={4}>4 images</option></select></label></div><button type="button" onClick={() => generateImage()} disabled={busy === "image" || imagePrompt.trim().length < 3} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand px-4 py-2.5 text-sm font-bold text-brand disabled:opacity-50"><Icon name="image" size={15} />{busy === "image" ? "Generating..." : "Generate concepts"}</button>{images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3">{images.map((image, index) => <div key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl border border-border-subtle"><img src={image.url} alt={`Generated concept ${index + 1}`} className="aspect-square w-full object-cover" /><div className="grid grid-cols-2 gap-1.5 p-2"><button type="button" onClick={() => { setMediaUrl(image.url); setMediaType("image"); setView("compose"); setMessage("Image attached to the composer."); }} className="rounded-lg bg-brand px-2 py-1.5 text-xs font-bold text-white">Use</button><button type="button" onClick={() => generateImage(image.url)} disabled={busy === "image"} className="rounded-lg border border-border-subtle px-2 py-1.5 text-xs font-bold text-ink">Vary</button></div></div>)}</div>}</> : <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-muted">Upgrade to Pro or Expert to generate image concepts. You can still attach your own hosted media in Compose.</div>}</div>
        </section>
      )}

      {view === "queue" && (
        <section>
          <div className="grid gap-3 sm:grid-cols-4">{[["draft", counts.draft, "Drafts"], ["approved", counts.review, "Ready"], ["scheduled", counts.scheduled, "Scheduled"], ["published", counts.published, "Published"]].map(([status, count, label]) => <button key={String(status)} type="button" onClick={() => setStatusFilter(String(status))} className={`rounded-2xl border p-4 text-left shadow-sm ${statusFilter === status ? "border-brand bg-brand-50" : "border-border-subtle bg-white"}`}><div className="text-2xs font-extrabold uppercase tracking-wider text-muted">{label}</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{count}</div></button>)}</div>
          <div className="mt-4 flex items-center justify-between gap-3"><div><h2 className="font-extrabold text-ink">Content queue</h2><p className="mt-1 text-sm text-muted">Draft → approve → schedule or publish. Every transition is visible.</p></div><button type="button" onClick={() => setStatusFilter("all")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${statusFilter === "all" ? "bg-ink text-white" : "border border-border-subtle text-muted"}`}>All {posts.length}</button></div>

          {!loaded ? <div className="mt-4 h-40 animate-pulse rounded-3xl bg-border-subtle" /> : filteredPosts.length === 0 ? <div className="mt-4 rounded-3xl border border-dashed border-border-subtle bg-white p-9 text-center"><Icon name="calendar" className="mx-auto text-muted" size={25} /><p className="mt-3 font-bold text-ink">No content in this view</p><p className="mt-1 text-sm text-muted">Compose a draft or choose another status.</p><button type="button" onClick={() => setView("compose")} className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">Create a draft</button></div> : <div className="mt-4 space-y-3">{filteredPosts.map((post) => <article key={post.id} className="rounded-3xl border border-border-subtle bg-white p-4 shadow-card sm:p-5"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-extrabold uppercase text-muted">{post.platform}</span><span className={`rounded-full px-2 py-0.5 text-2xs font-extrabold capitalize ${STATUS_CLASSES[post.status] || "bg-surface text-muted"}`}>{post.status}</span>{post.source === "studio" && <span className="inline-flex items-center gap-1 text-2xs font-bold text-brand"><Icon name="sparkle" size={11} /> AI-assisted</span>}</div>{post.caption && <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.caption}</p>}{post.media_url && <p className="mt-2 flex items-center gap-1.5 truncate text-2xs text-muted"><Icon name="link" size={12} /> Media attached · {post.media_type || "file"}</p>}{post.scheduled_at && post.status === "scheduled" && <p className="mt-2 text-xs font-semibold text-blue-700">Scheduled for {new Date(post.scheduled_at).toLocaleString("en-AU")}</p>}{post.published_at && post.status === "published" && <p className="mt-2 text-xs font-semibold text-green-700">Published {new Date(post.published_at).toLocaleString("en-AU")}</p>}{post.error && <p className="mt-2 rounded-lg bg-bad/10 p-2 text-xs font-semibold text-bad">{post.error}</p>}{(post.status === "approved" || post.status === "failed") && !canPublishPost(post) && <p className="mt-2 rounded-lg bg-warn/10 p-2 text-xs text-amber-900">Add media before publishing to {post.platform}.</p>}</div><div className="flex flex-wrap content-start gap-2 sm:max-w-[220px] sm:justify-end">{post.status === "draft" && <button type="button" onClick={() => updatePost(post.id, { status: "approved" }, `approve:${post.id}`)} disabled={Boolean(busy)} className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve draft</button>}{(post.status === "approved" || post.status === "failed") && <button type="button" onClick={() => publish(post)} disabled={Boolean(busy) || !canPublishPost(post)} className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{post.status === "failed" ? "Retry publish" : "Publish now"}</button>}{post.status !== "published" && <button type="button" onClick={() => archiveDraft(post)} disabled={Boolean(busy)} className="rounded-xl border border-border-subtle px-3 py-2 text-xs font-bold text-muted disabled:opacity-50">Archive</button>}</div></div>{post.status === "approved" && canPublishPost(post) && <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border-subtle pt-4"><label><span className="mb-1 block text-2xs font-bold text-muted">Publish later</span><input type="datetime-local" min={minScheduleLocal()} value={scheduleValues[post.id] || ""} onChange={(event) => setScheduleValues({ ...scheduleValues, [post.id]: event.target.value })} className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs" /></label><button type="button" onClick={() => schedule(post)} disabled={Boolean(busy) || !scheduleValues[post.id]} className="rounded-xl border border-brand px-3 py-2 text-xs font-bold text-brand disabled:opacity-40">Schedule</button></div>}</article>)}</div>}
        </section>
      )}

      {(message || error) && <div role="status" className={`fixed bottom-20 right-4 z-50 flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-5 ${error ? "bg-bad" : "bg-ink"}`}><Icon name={error ? "alert-triangle" : "check-circle"} size={16} /><span className="flex-1">{error || message}</span><button type="button" onClick={clearFeedback} className="text-white/70 underline">Close</button></div>}
    </div>
  );
}
