import type { Feature } from "@/lib/entitlements";
import type { IconName } from "./icons";

export type AppNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description: string;
  icon: IconName;
  feature?: Feature;
  keywords?: string[];
};

export const PRIMARY_NAV: AppNavItem[] = [
  { href: "/command", label: "Today", description: "What changed, what needs you, and what happens next", icon: "radar", keywords: ["home", "dashboard", "mission control"] },
  { href: "/proposals", label: "Fixes", description: "Prioritised, evidence-backed changes for you to review", icon: "check-circle", keywords: ["recommendations", "approvals", "actions"] },
  { href: "/content", label: "Create", description: "Plan, draft and schedule organic content", icon: "clapper", feature: "content_publish", keywords: ["posts", "calendar", "social"] },
  { href: "/automate", label: "Automate", description: "Rules, alerts, reports and safe workflow controls", icon: "blocks", feature: "threshold_alerts", keywords: ["workflows", "rules", "alerts"] },
  { href: "/reports", label: "Reports", description: "Saved analysis, comparisons and client-ready exports", icon: "file-text", feature: "reports", keywords: ["pdf", "export", "history"] },
  { href: "/connect", label: "Connect", description: "Data sources, permissions, sync health and CSV import", icon: "link", keywords: ["meta", "tiktok", "credentials", "integrations"] },
];

export const ADVANCED_GROUPS: { title: string; items: AppNavItem[] }[] = [
  {
    title: "Analyse",
    items: [
      { href: "/dashboard", label: "Health & import", description: "Audit a CSV and inspect the complete score", icon: "gauge", keywords: ["csv", "score", "audit"] },
      { href: "/creative-scorecard", label: "Creative scorecard", description: "Compare hooks, fatigue and creative performance", icon: "scorecard", feature: "creative_studio", keywords: ["fatigue", "hooks", "ads"] },
      { href: "/audience", label: "Audience insights", description: "Understand the people engaging with your brand", icon: "target", feature: "ai_team" },
      { href: "/ai-specialists", label: "AI specialists", description: "Ask a grounded specialist to investigate your numbers", icon: "compass", feature: "ai_team", keywords: ["assistant", "chat", "agents"] },
    ],
  },
  {
    title: "Create & test",
    items: [
      { href: "/creative", label: "Creative library", description: "Store and organise creative source material", icon: "image", feature: "creative_studio" },
      { href: "/content/calendar", label: "Content calendar", description: "See scheduled organic posts", icon: "calendar", feature: "content_publish" },
      { href: "/policy-check", label: "Policy pre-flight", description: "Check copy for ad-policy risks before launch", icon: "shield", feature: "ai_team", keywords: ["compliance", "meta", "tiktok"] },
      { href: "/utm-builder", label: "UTM builder", description: "Build consistent campaign names and tracking URLs", icon: "tag", keywords: ["tracking", "links", "naming"] },
      { href: "/boost", label: "Boost planner", description: "Model organic reach before spending", icon: "rocket", feature: "content_publish" },
    ],
  },
  {
    title: "Clients & channels",
    items: [
      { href: "/portfolio", label: "Client portfolio", description: "See every workspace and its current health", icon: "users", feature: "multi_client" },
      { href: "/agency", label: "White-label", description: "Brand client-facing reports as your agency", icon: "briefcase", feature: "white_label" },
      { href: "/messenger", label: "Messenger", description: "Configure greetings and safe reply workflows", icon: "chat", feature: "messenger_automation" },
    ],
  },
];

export const ACCOUNT_NAV: AppNavItem[] = [
  { href: "/settings", label: "Settings", description: "Business economics, budget and sync cadence", icon: "gear" },
  { href: "/notifications", label: "Notifications", description: "Digests and critical-alert delivery", icon: "bell" },
  { href: "/billing", label: "Plan & billing", description: "Subscription and feature access", icon: "credit-card" },
  { href: "/manual", label: "Help centre", description: "Plain-English guides and troubleshooting", icon: "book", keywords: ["support", "manual"] },
];

export const PALETTE_ONLY: AppNavItem[] = [
  { href: "/canva-creator", label: "Canva creator", description: "Prepare creative for Canva", icon: "palette", feature: "creative_studio" },
  { href: "/build-dashboard", label: "Dashboard builder", description: "Design an advanced reporting layout", icon: "blocks" },
  { href: "/demo-guide", label: "Demo guide", description: "Walk through a safe product demonstration", icon: "book" },
];

export const ALL_NAV = [
  ...PRIMARY_NAV,
  ...ADVANCED_GROUPS.flatMap((group) => group.items),
  ...ACCOUNT_NAV,
  ...PALETTE_ONLY,
];

export function navItemIsActive(path: string | null, href: string): boolean {
  if (!path) return false;
  return path === href || path.startsWith(`${href}/`);
}
