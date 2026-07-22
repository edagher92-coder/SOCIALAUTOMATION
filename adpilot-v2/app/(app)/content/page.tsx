import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import ContentStudio from "@/components/ContentStudio";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const canPublish = can(plan, "content_publish");
  const canStudio = can(plan, "creative_studio");

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <PageHeader eyebrow="Organic workflow" title="Create" subtitle="Brief, draft, review, schedule and publish organic content without mixing it up with paid-ad controls." action={<Link href="/content/calendar" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm hover:border-brand-200"><Icon name="calendar" size={16} /> Calendar</Link>} />
      <div className="mb-5 flex items-start gap-2 rounded-2xl border border-good/25 bg-good/10 p-4 text-sm leading-relaxed text-green-900"><span className="mt-0.5"><Icon name="shield" size={17} /></span><div><b>Organic publishing is a separate, approval-gated workflow.</b> Drafts never become ads. A person must approve a post before it can publish or be scheduled.</div></div>
      {!canPublish ? (
        <section className="rounded-3xl border border-border-subtle bg-white p-7 shadow-card"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><Icon name="lock" size={20} /></span><h2 className="mt-4 text-xl font-extrabold text-ink">Content workflow is available on Starter and above</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Your {PLAN_LABEL[plan]} plan includes analysis. Upgrade to save drafts, run human approval, schedule organic posts and publish to connected channels. Pro and Expert also unlock AI-assisted creative.</p><Link href="/billing" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">Compare plans <Icon name="chevron-right" size={15} /></Link></section>
      ) : <ContentStudio canStudio={canStudio} />}
    </div>
  );
}
