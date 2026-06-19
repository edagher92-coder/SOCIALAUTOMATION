import { createClient } from "@/lib/supabase/server";
import { buildReportPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";

// Download a saved report as a real, server-generated PDF file. RLS-scoped: the user's session
// client can only read reports for orgs they belong to (is_org_member), so this never leaks
// another org's report. Read-only — it renders the saved analysis, never edits anything.
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorised", { status: 401 });

  const { data: report } = await supabase
    .from("reports")
    .select("title,period,payload,created_at,organisation_id")
    .eq("id", id)
    .maybeSingle();
  if (!report) return new Response("Not found", { status: 404 });

  // Scope branding to THIS report's org (also RLS-scoped).
  const { data: wl } = await supabase
    .from("white_label_profiles")
    .select("brand_name,primary_color")
    .eq("organisation_id", (report as any).organisation_id)
    .maybeSingle();

  const pdf = await buildReportPdf((report as any).payload, {
    title: (report as any).title,
    periodLabel: (report as any).period,
    brandName: (wl as any)?.brand_name || undefined,
    primaryColor: (wl as any)?.primary_color || undefined,
    generatedAt: (report as any).created_at ? new Date((report as any).created_at) : undefined,
  });

  const safeName =
    String((report as any).title || "report").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "report";

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safeName}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
