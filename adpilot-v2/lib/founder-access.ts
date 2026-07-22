import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Founder accounts are stored as one-way hashes so personal email addresses are
// never committed to the public repository or emitted to the browser bundle.
const FOUNDER_EMAIL_HASHES = new Set([
  "33d0afba909a62ade6fac81bf4032f2d9dbc22cc149a5194a9c8be73cb05bedc",
  "f10942cbeceea2899209c430a0284e176d6a1c8cfde155e4c7da4e02615a2853",
]);

export function isFounderAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return FOUNDER_EMAIL_HASHES.has(hash);
}

export async function ensureFounderExpertPlan(input: { userId: string; email?: string | null; orgId: string }) {
  if (!isFounderAccount(input.email)) return false;

  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("role")
    .eq("organisation_id", input.orgId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (membershipError) throw new Error(`Founder access check failed: ${membershipError.message}`);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) return false;

  const { data: existing, error: existingError } = await admin
    .from("billing_subscriptions")
    .select("id")
    .eq("organisation_id", input.orgId)
    .eq("plan", "expert")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(`Founder plan lookup failed: ${existingError.message}`);
  if (existing) return true;

  const periodEnd = new Date();
  periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 10);
  const { error: insertError } = await admin.from("billing_subscriptions").insert({
    organisation_id: input.orgId,
    plan: "expert",
    status: "active",
    current_period_end: periodEnd.toISOString(),
  });
  if (insertError) throw new Error(`Founder plan activation failed: ${insertError.message}`);

  await admin.from("audit_logs").insert({
    organisation_id: input.orgId,
    user_id: input.userId,
    action: "billing.founder_expert_activated",
    detail: { plan: "expert", billing_mode: "complimentary", stripe_changed: false },
  });
  return true;
}
