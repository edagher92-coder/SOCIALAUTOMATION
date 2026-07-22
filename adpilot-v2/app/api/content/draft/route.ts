import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError, modelFor } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";

export const runtime = "nodejs";

// AI Creative Studio (higher tiers): Stella drafts a platform-native organic post/reel,
// grounded in the account's latest analysis. Output is a starting point for the user to
// edit — then upload/approve/publish through the Content Studio.
const Body = z.object({
  platform: z.enum(["facebook", "instagram", "tiktok"]),
  topic: z.string().max(400).optional(),
  offer: z.string().max(400).optional(),
  audience: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(await planForOrg(orgId), "creative_studio")) {
    return NextResponse.json({ error: "The AI Creative Studio is a Pro & Expert feature. Upgrade on Billing.", upgrade: true }, { status: 402 });
  }

  // Light grounding from the latest saved analysis.
  const admin = createAdminClient();
  const { data: rep } = await admin.from("reports").select("payload").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const h = (rep as any)?.payload?.health;
  const grounding = h
    ? `Account context: health ${Math.round(h.total)}/100 (${h.band}). Lean into proven winning angles and avoid fatigued ones.`
    : "No analysis on file yet — write a strong general-purpose draft.";

  const i = parsed.data;
  const stella = getAgent("stella");
  const paige = getAgent("paige");
  const userMsg = `${grounding}
Create an ORGANIC ${i.platform} ${i.platform === "tiktok" ? "video/reel" : "post"} (not a paid ad).
Topic/product: ${i.topic || "(use the business context)"}. Offer: ${i.offer || "n/a"}. Audience: ${i.audience || "(broad)"}.
Return, clearly labelled: 3 scroll-stopping hooks; a ready-to-post caption (platform-appropriate length); 8–12 relevant hashtags; and a 3–5 shot shotlist/scene plan. Compliant — no guarantees or absolute claims.`;

  try {
    // Organic content drafting is light, templated creative → Haiku tier.
    const text = await callClaude({ system: stella?.system, user: userMsg, maxTokens: 1100, model: modelFor("light") });
    // Creative is never represented as publish-ready merely because it was generated.
    // Run Paige's concise preflight so the editor can see any claim/policy issues before
    // saving or approving the human-owned draft.
    const policyReview = await callClaude({
      system: paige?.system,
      user: `Review this organic ${i.platform} draft before a human considers publishing it.\n\n${text}\n\nReturn a concise preflight headed either "READY FOR HUMAN REVIEW" or "CHANGES NEEDED". Name risky claims and give exact compliant replacements. This is a review only; never say that content is automatically approved or published.`,
      maxTokens: 700,
      model: modelFor("light"),
    });
    return NextResponse.json({
      text,
      policy: { agent: paige?.name || "Paige", status: "reviewed", review: policyReview },
    });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the Studio.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 502 });
  }
}
