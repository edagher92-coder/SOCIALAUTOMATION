// Auth + tier gated Creative Studio image generation. Server-side keys only. Generating a
// creative asset never touches a live ad — it stays inside AdPilot's read-only model.
// Providers (direct APIs, no third-party automation layer): Gemini/Imagen (default when keyed)
// and Adobe Firefly. Pick the best engine per request; default to whichever is configured.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { generateImage as fireflyGenerate, FireflyNotConfigured } from "@/lib/ai/firefly";
import { generateImage as geminiGenerate, editImage as geminiEdit, parseDataUrl, GeminiNotConfigured, geminiConfigured, GEMINI_ASPECTS } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // generation + polling can take 20–40s

const Body = z.object({
  prompt: z.string().min(3).max(1000),
  aspect: z.enum(GEMINI_ASPECTS).optional(),
  numVariations: z.number().int().min(1).max(4).optional(),
  contentClass: z.enum(["photo", "art"]).optional(),
  provider: z.enum(["gemini", "firefly"]).optional(),
  // Optional reference image to edit / vary (image-to-image). data:image/...;base64 only —
  // we never fetch an arbitrary URL server-side (SSRF guard). Generated images are data URLs.
  referenceImage: z.string().max(8_000_000).optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(await planForOrg(orgId), "creative_studio"))
    return NextResponse.json({ error: "The AI Creative Studio is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { prompt, aspect, numVariations, contentClass, referenceImage } = parsed.data;

  try {
    // Image-to-image (edit / vary a reference) — Gemini-only, data-URL reference only.
    if (referenceImage) {
      const ref = parseDataUrl(referenceImage);
      if (!ref) return NextResponse.json({ error: "referenceImage must be a data:image/…;base64 URL" }, { status: 400 });
      const images = await geminiEdit({ prompt, image: ref });
      return NextResponse.json({ provider: "gemini", mode: "edit", images });
    }
    // Text-to-image — default to Gemini when keyed (self-contained data URLs), else Firefly.
    const provider = parsed.data.provider || (geminiConfigured() ? "gemini" : "firefly");
    const images = provider === "gemini"
      ? await geminiGenerate({ prompt, aspect, numVariations })
      : await fireflyGenerate({ prompt, aspect: aspect as any, numVariations, contentClass });
    return NextResponse.json({ provider, images });
  } catch (e: any) {
    if (e instanceof GeminiNotConfigured || e instanceof FireflyNotConfigured)
      return NextResponse.json({ error: "Creative generation isn't configured yet. Add GEMINI_API_KEY (or Firefly keys) on the server to enable it.", code: "NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "Creative generation failed", code: "GENERATION_ERROR" }, { status: 502 });
  }
}
