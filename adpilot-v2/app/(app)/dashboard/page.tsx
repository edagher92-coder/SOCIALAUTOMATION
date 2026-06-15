import AnalyzeClient from "@/components/AnalyzeClient";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Ads Health Check</h1>
      <p className="mb-5 mt-1 text-muted">
        Paste or upload a Meta / TikTok export — get a Campaign Health Score and safe, prioritised fixes.
        Switch <b>Beginner / Advanced</b> in the sidebar to show more detail.
      </p>
      <AnalyzeClient />
    </div>
  );
}
