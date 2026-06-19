import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { listOrganicPosts, addOrganicPosts, parseOrganicCsv } from "@/lib/organic/store";
import type { OrganicPostInput } from "@/lib/organic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Entitlement copy mirrors the content route so the upgrade nudge reads the same everywhere.
const LOCKED = {
  error: "Saving organic posts is a paid feature. Upgrade on Billing to enable it.",
  upgrade: true,
} as const;

// Lenient per-row shape: the store (addOrganicPosts) is the single source of truth for
// what's valid — it drops non meta/tiktok rows and clamps metrics — so a mixed batch
// (a few junk rows) is accepted and filtered rather than 400-ing the whole request.
const PostInput = z.object({
  id: z.string().optional(),
  platform: z.string(),
  name: z.string().max(2200).optional(),
  date: z.string().max(40).optional(),
  reach: z.coerce.number().optional(),
  impressions: z.coerce.number().optional(),
  engagements: z.coerce.number().optional(),
});

const CreateBody = z.object({
  posts: z.array(PostInput).optional(),
  csv: z.string().max(2_000_000).optional(),
});

// GET → the org's stored organic posts (entitlement-gated, newest first).
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "content_publish")) {
    return NextResponse.json(LOCKED, { status: 402 });
  }

  const admin = createAdminClient();
  const posts = await listOrganicPosts(admin, orgId);
  return NextResponse.json({ posts });
}

// POST → ingest organic posts from either an explicit `posts[]` array or a pasted `csv` string.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "content_publish")) {
    return NextResponse.json(LOCKED, { status: 402 });
  }

  // Prefer an explicit posts[] payload; otherwise parse the pasted CSV. Posts are passed
  // through to addOrganicPosts, which is the validator (drops non meta/tiktok, clamps metrics).
  const posts: OrganicPostInput[] = parsed.data.posts?.length
    ? (parsed.data.posts as unknown as OrganicPostInput[])
    : parsed.data.csv
      ? parseOrganicCsv(parsed.data.csv)
      : [];

  const admin = createAdminClient();
  const added = await addOrganicPosts(admin, orgId, posts);
  return NextResponse.json({ added });
}
