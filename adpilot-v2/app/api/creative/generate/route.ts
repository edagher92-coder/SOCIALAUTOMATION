// Auth + tier gated Firefly creative-image generation for the Creative Studio. Server-side keys
// only. Generating a creative asset never touches a live ad — it stays inside the read-only model.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { generateImage, FireflyNotConfigured, FIREFLY_SIZES } from "@/lib/ai/firefly";

export const runtime = "nodejs";
export const maxDuration = 60; // image generation + polling can take 20–40s

const Body = z.object({
  prompt: z.string().min(3).max(1000),
  aspect: z.enum(Object.keys(FIREFLY_SIZES) as [string, ...string[]]).optional(),
  numVariations: z.number().int().min(1).max(4).optional(),
  contentClass: z.enum(["photo", "art"]).optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "creative_studio"))
    return NextResponse.json({ error: "The AI Creative Studio is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const images = await generateImage({
      prompt: parsed.data.prompt,
      aspect: parsed.data.aspect as any,
      numVariations: parsed.data.numVariations,
      contentClass: parsed.data.contentClass,
    });
    return NextResponse.json({ images });
  } catch (e: any) {
    if (e instanceof FireflyNotConfigured)
      return NextResponse.json({ error: "Firefly isn't configured yet. Add FIREFLY_CLIENT_ID + FIREFLY_CLIENT_SECRET on the server to enable creative generation.", code: "NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "Creative generation failed", code: "FIREFLY_ERROR" }, { status: 502 });
  }
}
