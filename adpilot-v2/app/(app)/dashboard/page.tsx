import AnalyzeClient from "@/components/AnalyzeClient";
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Ads Health"
        title="Campaign Health Check"
        subtitle="Paste or upload a Meta / TikTok export to get a 0–100 Health Score and safe, prioritised fixes — or connect an account on Connect & Sync for automatic, scheduled scoring."
      />
      <AnalyzeClient />
    </div>
  );
}
