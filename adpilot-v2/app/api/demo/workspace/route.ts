import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedInteractiveDemoWorkspace } from "@/lib/demo/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ confirmation: z.literal("CREATE INTERACTIVE DEMO") });

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before creating a demo workspace." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Demo confirmation was not supplied." }, { status: 400 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "The demo loader is not configured on this deployment." }, { status: 503 });

  try {
    const result = await seedInteractiveDemoWorkspace(createAdminClient(), { id: user.id, email: user.email });
    const response = NextResponse.json(result);
    response.cookies.set("active_org", result.orgId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Interactive demo seed failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The demo workspace could not be created." }, { status: 500 });
  }
}
