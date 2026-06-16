import "server-only";

// Right-to-erasure (Australian Privacy Act APP 11.2). Deletes a user's data, strictly scoped to
// their OWN ids. Org-scoped tables (connected_ad_accounts, campaign_snapshots, health_scores,
// reports, recommendations, lead_events, alert_events, account_daily_metrics, white_label_profiles,
// memberships) are removed via the ON DELETE CASCADE from organisations — but ONLY for orgs the
// user is the sole member of. Shared orgs are preserved (we just drop this user's membership) so
// erasing one user never destroys another tenant's data.

export interface ErasureResult {
  orgsDeleted: number;
  membershipsRemoved: number;
  authDeleted: boolean;
}

export async function eraseUserData(admin: any, userId: string): Promise<ErasureResult> {
  if (!userId) throw new Error("eraseUserData: missing userId");
  let orgsDeleted = 0;
  let membershipsRemoved = 0;

  const { data: mems } = await admin.from("memberships").select("organisation_id").eq("user_id", userId);
  for (const m of (mems || [])) {
    const orgId = (m as any).organisation_id;
    if (!orgId) continue;
    const { data: members } = await admin.from("memberships").select("user_id").eq("organisation_id", orgId);
    const count = (members || []).length;
    if (count <= 1) {
      // Sole member → erase the whole org; FK cascade removes every org-scoped row.
      await admin.from("organisations").delete().eq("id", orgId);
      orgsDeleted++;
    } else {
      // Shared org → remove only this user's membership; preserve the other members' data.
      await admin.from("memberships").delete().eq("organisation_id", orgId).eq("user_id", userId);
      membershipsRemoved++;
    }
  }

  // User-scoped records (not covered by the org cascade).
  await admin.from("legal_acceptances").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  // The auth identity itself (best-effort — never block erasure on it).
  let authDeleted = false;
  try {
    await admin.auth?.admin?.deleteUser?.(userId);
    authDeleted = true;
  } catch {
    /* auth deletion best-effort */
  }

  return { orgsDeleted, membershipsRemoved, authDeleted };
}
