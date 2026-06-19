"use client";
import { useState } from "react";
import BoostClient from "./BoostClient";
import OrganicAccountClient from "./OrganicAccountClient";
import type { CpmByPlatform } from "@/lib/organic/cpm";
import type { OrganicPostInput } from "@/lib/organic/types";

type Tab = "post" | "account";

// Two ways into the same engine: project ONE post, or analyse the WHOLE account at once.
// Defaults to the account view when the org already has saved organic posts.
export default function BoostWorkspace({ accountCpm, initialPosts }: {
  accountCpm: CpmByPlatform;
  initialPosts?: OrganicPostInput[];
}) {
  const [tab, setTab] = useState<Tab>(initialPosts && initialPosts.length ? "account" : "post");
  const tabs: [Tab, string, string][] = [
    ["post", "Single post", "Project one post's boost"],
    ["account", "Whole account", "Rank every post + summary"],
  ];
  return (
    <div className="space-y-5">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-surface p-1 text-sm font-bold">
        {tabs.map(([t, label, desc]) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} title={desc}
            className={`rounded-lg px-4 py-1.5 transition ${tab === t ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "post"
        ? <BoostClient accountCpm={accountCpm} />
        : <OrganicAccountClient accountCpm={accountCpm} initialPosts={initialPosts} />}
    </div>
  );
}
