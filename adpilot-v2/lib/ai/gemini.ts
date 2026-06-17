import "server-only";

// Server-side Google Gemini / Imagen image client (direct API key; never exposed to the browser).
// Powers Creative Studio image generation. Generating a creative asset never touches a live ad,
// so it stays inside AdPilot's read-only model. Env-gated: no GEMINI_API_KEY → NOT_CONFIGURED.

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiNotConfigured extends Error {
  constructor() { super("GEMINI_NOT_CONFIGURED"); this.name = "GeminiNotConfigured"; }
}

// Imagen-supported aspect ratios (kept in sync with the Creative Studio UI).
export const GEMINI_ASPECTS = ["1:1", "4:3", "3:4", "16:9", "9:16"] as const;
export type GeminiAspect = (typeof GEMINI_ASPECTS)[number];

export type GeneratedImage = { url: string; mimeType?: string };

// Generate one or more creative images from a text prompt via the Imagen `:predict` endpoint.
// Returns self-contained data: URLs (no expiring links), ready for an <img> preview.
export async function generateImage(opts: {
  prompt: string;
  aspect?: GeminiAspect;
  numVariations?: number;
}): Promise<GeneratedImage[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiNotConfigured();
  const model = process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-fast-generate-001";
  const body = {
    instances: [{ prompt: opts.prompt }],
    parameters: { sampleCount: Math.min(4, Math.max(1, opts.numVariations ?? 1)), aspectRatio: opts.aspect ?? "1:1" },
  };
  const res = await fetch(`${BASE}/models/${model}:predict`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini image failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const j: any = await res.json();
  const preds: any[] = j.predictions || [];
  const images: GeneratedImage[] = [];
  for (const p of preds) {
    if (p?.bytesBase64Encoded) images.push({ url: `data:${p.mimeType || "image/png"};base64,${p.bytesBase64Encoded}`, mimeType: p.mimeType });
    else if (p?.image?.url) images.push({ url: String(p.image.url), mimeType: p.mimeType });
  }
  if (!images.length) throw new Error("Gemini: response contained no image");
  return images;
}

export function geminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
