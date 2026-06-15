"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Asset = { id: string; kind: string; source: string; provider?: string; title?: string; url: string; linked_campaign?: string };

export default function Creative() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kind, setKind] = useState<"image" | "video" | "audio">("image");
  const [provider, setProvider] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/creative"); const j = await r.json(); setAssets(j.assets || []);
  }
  useEffect(() => { load().catch(() => {}); }, []);

  async function addLink() {
    if (!url) { setMsg("Paste an asset URL (from Midjourney, Sora, Runway, ElevenLabs, Canva, etc.)"); return; }
    setBusy(true); setMsg("");
    const r = await fetch("/api/creative", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, source: "link", provider, title, url, linked_campaign: campaign }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error || "Failed"); return; }
    setUrl(""); setTitle(""); setMsg("Added ✅"); load();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setMsg("Uploading…");
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("creative").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("creative").getPublicUrl(path);
      const k = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
      await fetch("/api/creative", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: k, source: "upload", provider: "Upload", title: file.name, url: pub.publicUrl, linked_campaign: campaign }) });
      setMsg("Uploaded ✅"); load();
    } catch (err: any) { setMsg("Upload needs Supabase Storage configured. You can paste a link instead. (" + (err.message || "error") + ")"); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Creative Library</h1>
      <p className="mb-5 mt-1 text-muted">
        Bring AI-generated audio, video &amp; photos from <b>any</b> tool — paste the asset link (Midjourney, Sora, Runway,
        ElevenLabs, Canva, HeyGen…), or upload your own. AdPilot does the rest: organise it, link it to campaigns, and
        feed it into briefs.
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
          <h3 className="mb-3 font-bold">Link from your AI tool / creator</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-bold">Type</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option></select></div>
            <div><label className="mb-1 block text-sm font-bold">Source / tool</label>
              <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Midjourney, Sora, ElevenLabs…" className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-bold">Asset URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
            <div><label className="mb-1 block text-sm font-bold">Title (optional)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
            <div><label className="mb-1 block text-sm font-bold">Link to campaign (optional)</label>
              <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
          </div>
          <button onClick={addLink} disabled={busy} className="mt-3 rounded-lg bg-brand px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "…" : "Add link"}</button>
          {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        </div>

        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-5 text-center shadow-card">
          <div className="text-3xl">⬆️</div>
          <h3 className="mt-2 font-bold">Upload your own</h3>
          <p className="mb-3 mt-1 text-xs text-muted">Image, video or audio. Stored in your private library.</p>
          <input type="file" accept="image/*,video/*,audio/*" onChange={onUpload} className="w-full text-sm" />
        </div>
      </div>

      <h2 className="mb-2 mt-7 text-lg font-bold">Your assets</h2>
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d0d7de] p-8 text-center text-muted">Nothing yet — add a link or upload above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-xl border border-[#e3e8ef] bg-white shadow-card">
              {a.kind === "image" ? <img src={a.url} alt="" className="h-32 w-full object-cover" />
                : <div className="flex h-32 items-center justify-center bg-[#f4f7fb] text-3xl">{a.kind === "video" ? "🎬" : "🎵"}</div>}
              <div className="p-3">
                <div className="truncate text-sm font-semibold">{a.title || a.kind}</div>
                <div className="text-xs text-muted">{a.provider || a.source}{a.linked_campaign ? ` · ${a.linked_campaign}` : ""}</div>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand">Open ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
