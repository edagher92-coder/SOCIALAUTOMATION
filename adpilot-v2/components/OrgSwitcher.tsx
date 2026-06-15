"use client";
import { useEffect, useState } from "react";

export default function OrgSwitcher() {
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    fetch("/api/org").then((r) => r.json()).then((j) => { setOrgs(j.orgs || []); setActive(j.activeId || ""); }).catch(() => {});
  }, []);

  async function onChange(id: string) {
    if (id === "__new") {
      const name = window.prompt("New client / workspace name:");
      if (!name) return;
      const r = await fetch("/api/org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (r.ok) location.reload();
      return;
    }
    await fetch("/api/org/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: id }) });
    location.reload();
  }

  if (orgs.length === 0) return null;
  return (
    <div>
      <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted">Client</div>
      <select value={active} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#e3e8ef] bg-white p-2 text-sm font-semibold">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        <option value="__new">➕ Add client…</option>
      </select>
    </div>
  );
}
