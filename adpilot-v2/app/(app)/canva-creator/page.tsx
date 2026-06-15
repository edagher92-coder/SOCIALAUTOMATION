"use client";
import { useState } from "react";
import { useMode } from "@/components/mode";

export default function CanvaCreator() {
  const { mode } = useMode();
  const [product, setProduct] = useState("Hot water system service");
  const [audience, setAudience] = useState("Brisbane homeowners 35–60");
  const [offer, setOffer] = useState("$0 quote this week");
  const [platform, setPlatform] = useState<"Meta" | "TikTok">("Meta");
  const [out, setOut] = useState<null | ReturnType<typeof build>>(null);

  function build() {
    const p = product.trim(), a = audience.trim(), o = offer.trim();
    const hooks = platform === "TikTok"
      ? [
          `POV: your ${p.toLowerCase()} finally sorted (in 30 seconds)`,
          `Stop scrolling if you're a ${a.toLowerCase()} 👇`,
          `Nobody tells you this about ${p.toLowerCase()}…`,
          `I tried ${p.toLowerCase()} so you don't have to`,
          `${o} — here's the catch (there isn't one)`,
        ]
      : [
          `${a}: still putting off ${p.toLowerCase()}?`,
          `The honest cost of ${p.toLowerCase()} in 2026`,
          `${o} — booked out fast last time`,
          `3 signs you need ${p.toLowerCase()} now`,
          `Why ${a.toLowerCase()} choose us for ${p.toLowerCase()}`,
        ];
    return {
      hooks,
      primary: `${p} without the guesswork. We make it simple for ${a.toLowerCase()}: clear pricing, fast turnaround, no pressure. ${o} — claim yours before this week's spots fill.`,
      headline: platform === "TikTok" ? `${o} 👀` : `${p}: ${o}`,
      cta: platform === "TikTok" ? "Tap to claim" : "Get my quote",
      visual:
        platform === "TikTok"
          ? `15–25s, founder-to-camera or UGC. First 2s = the hook on screen + spoken. Show the before/after of "${p}". Captions on. Native, not polished.`
          : `Single image or 6–10s video. Bold headline overlay, real photo (not stock), trust badge, and the offer "${o}" top-right.`,
      canva: [`${platform} ad ${product}`, `${platform === "TikTok" ? "9:16" : "1:1"} ad template`, `${audience} lifestyle photo`, "bold offer badge"],
    };
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Canva Creator</h1>
      <p className="mb-5 mt-1 text-muted">Turn your offer into ready-to-use ad copy, hooks, a visual concept and Canva search terms.</p>

      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Product / service" v={product} set={setProduct} />
          <Field label="Audience" v={audience} set={setAudience} />
          <Field label="Main offer" v={offer} set={setOffer} />
          <div>
            <label className="mb-1 block text-sm font-bold">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full rounded-lg border border-[#e3e8ef] p-2.5"><option>Meta</option><option>TikTok</option></select>
          </div>
        </div>
        <button onClick={() => setOut(build())} className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-bold text-white">Generate brief</button>
      </div>

      {out && (
        <div className="mt-5 space-y-4">
          <Card title="Hooks (first line)">
            <ol className="list-decimal space-y-1 pl-5 text-sm">{out.hooks.map((h, i) => <li key={i}>{h}</li>)}</ol>
          </Card>
          <Card title="Primary text"><p className="text-sm">{out.primary}</p></Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Headline"><p className="text-sm">{out.headline}</p></Card>
            <Card title="Call to action"><p className="text-sm">{out.cta}</p></Card>
          </div>
          <Card title="Visual concept"><p className="text-sm">{out.visual}</p></Card>
          {mode === "advanced" && <Card title="Canva search terms"><p className="text-sm">{out.canva.join("  ·  ")}</p></Card>}
          <p className="text-xs text-muted">Tip: paste a hook + primary text into Canva, or connect the Claude API (sidebar) for AI-written variations and on-brand tone.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (
    <div><label className="mb-1 block text-sm font-bold">{label}</label>
      <input value={v} onChange={(e) => set(e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
      <h3 className="mb-2 font-bold">{title}</h3>{children}
    </div>
  );
}
