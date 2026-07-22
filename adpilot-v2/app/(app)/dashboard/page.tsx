import AnalyzeClient from "@/components/AnalyzeClient";
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <PageHeader eyebrow="Diagnose" title="Health & import" subtitle="Import a Meta or TikTok export for an explainable 0–100 health score, or use Connections to keep the same analysis updated automatically." />
      <AnalyzeClient />
    </div>
  );
}
