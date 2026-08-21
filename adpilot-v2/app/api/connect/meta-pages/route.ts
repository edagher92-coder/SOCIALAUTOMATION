import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { listManagedPages } from "@/lib/meta/pages";

export const runtime = "nodejs";

// Discovery helper for the publish / organic-sync / Messenger paths: paste a Meta token and get
// back the Pages it manages, each with the numeric Page id (→ META_PAGE_ID) and connected
// Instagram Business account id (→ IG_USER_ID) those paths need. READ-ONLY — nothing is stored
// and the per-Page access tokens are never returned to the browser. Gated behind api_connect
// (Pro & Expert), the same entitlement as the dev-link ads connect.
//
// The token is taken from the POST body (not the query string) so it never lands in request
// logs or browser history.
const Body = z.object({
  token: z.string().min(10),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Paste a valid Meta access token (at least 10 characters)." }, { status: 400 });
  }
  const token = parsed.data.token.trim();

  try {
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
    if (!can(await planForOrg(orgId), "api_connect")) {
      return NextResponse.json({ error: "Page discovery is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
    }

    const pages = await listManagedPages(token);
    if (pages.length === 0) {
      return NextResponse.json({
        error: "This token is valid, but it doesn't manage any Facebook Pages. Use a token whose user is an admin of the Page (with pages_show_list), then try again.",
        tokenHelp: true,
      }, { status: 502 });
    }
    // Only the discovery fields — never the Page access tokens.
    return NextResponse.json({ pages });
  } catch (e: any) {
    const error = e?.message || "Could not list Pages";
    const tokenHelp = /token|scope|expired|revoked|invalid|reconnect|permission/i.test(error);
    return NextResponse.json({ error, tokenHelp }, { status: 502 });
  }
}
