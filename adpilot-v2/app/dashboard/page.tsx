import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyzeClient from "@/components/AnalyzeClient";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-brand to-teal" /> AdPilot OS
          <span className="ml-1 rounded-full bg-[#eaf1ff] px-2 py-0.5 text-xs font-bold text-[#0b3aa6]">V2</span>
        </span>
        <span className="text-sm text-muted">{user.email}</span>
      </header>

      <div className="mb-4 rounded-xl border border-[#f0c36d] bg-[#fff7e6] px-4 py-3 text-sm text-[#7a5b00]">
        🔒 Read-only &amp; private. Analysis runs on your data only; this never edits, pauses, or creates ads.
        Budget moves always require your explicit confirmation.
      </div>

      <AnalyzeClient />
    </main>
  );
}
