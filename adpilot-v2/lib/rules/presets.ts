import "server-only";
import type { AlertRule } from "./schema";

// P5.2 — the 13 documented preset alert rules (ALT-001..013), shipped as the seed library and the
// free-tier fallback. Every rule is read-only: a fire emits an alert/proposal, never an ad change.
// Rolling-baseline rules (z-score / WoW) all carry a min_volume_gate — the principled false-CRITICAL
// fix so a thin or learning-phase day can't trip a baseline alarm.

export const PRESET_RULES: AlertRule[] = [
  // — Creative fatigue (frequency), mirrors the built-in alerts.ts rules —
  { id: "ALT-001", name: "Frequency climbing", metric: "frequency", operator: "gte", threshold: 4, severity: "warning", scope: "campaign", enabled: true,
    message: 'Frequency ≥ 4 — watch for creative fatigue. Propose refreshing the creative as a paused duplicate.' },
  { id: "ALT-002", name: "High frequency (fatigue)", metric: "frequency", operator: "gte", threshold: 6, severity: "critical", scope: "campaign", enabled: true,
    message: 'Frequency ≥ 6 — likely creative fatigue. Propose a paused-duplicate creative refresh; the original keeps running.' },

  // — Engagement / efficiency floors (absolute, volume-gated) —
  { id: "ALT-003", name: "Weak CTR", metric: "ctr", operator: "lt", threshold: 0.008, min_volume_gate: 500, severity: "warning", scope: "campaign", enabled: true,
    message: 'CTR below 0.8% on a meaningful sample — likely a hook/creative/audience-fit problem.' },
  { id: "ALT-004", name: "Spend with zero conversions", metric: "conversions", operator: "lte", threshold: 0, min_spend_gate: 20, severity: "critical", scope: "campaign", enabled: true,
    message: 'Spent with zero recorded conversions — check tracking first, then offer/creative. Do not scale.' },
  { id: "ALT-013", name: "ROAS below break-even (1.0×)", metric: "roas", operator: "lt", threshold: 1, min_spend_gate: 50, severity: "critical", scope: "campaign", enabled: true,
    message: 'ROAS below 1.0× — spend is exceeding tracked revenue. Verify tracking, then review offer/targeting before any scale.' },

  // — Rolling-baseline cost spikes (robust z-score vs trailing window; always volume-gated) —
  { id: "ALT-005", name: "CPL spike", metric: "cpl", operator: "zscore_gt", threshold: 3, window_days: 7, min_volume_gate: 500, severity: "warning", scope: "campaign", enabled: true },
  { id: "ALT-006", name: "CPA spike", metric: "cpa", operator: "zscore_gt", threshold: 3, window_days: 7, min_volume_gate: 500, severity: "warning", scope: "campaign", enabled: true },
  { id: "ALT-007", name: "ROAS collapse", metric: "roas", operator: "zscore_lt", threshold: 3, window_days: 7, min_volume_gate: 500, severity: "critical", scope: "campaign", enabled: true },
  { id: "ALT-008", name: "Account spend spike", metric: "spend", operator: "zscore_gt", threshold: 4, window_days: 7, min_volume_gate: 1000, severity: "warning", scope: "account", enabled: true },
  { id: "ALT-009", name: "CPM spike", metric: "cpm", operator: "zscore_gt", threshold: 3, window_days: 7, min_volume_gate: 1000, severity: "warning", scope: "campaign", enabled: true },

  // — Week-over-week trend alarms (fraction; volume-gated) —
  { id: "ALT-010", name: "CTR dropping WoW", metric: "ctr", operator: "pct_change_lt", threshold: -0.25, min_volume_gate: 1000, severity: "warning", scope: "campaign", enabled: true,
    message: 'CTR down ≥ 25% week-over-week — early fatigue or audience saturation; queue a creative refresh.' },
  { id: "ALT-011", name: "CPL rising WoW", metric: "cpl", operator: "pct_change_gt", threshold: 0.30, min_volume_gate: 1000, severity: "warning", scope: "campaign", enabled: true,
    message: 'CPL up ≥ 30% week-over-week — efficiency eroding; review creative/audience before adding budget.' },
  { id: "ALT-012", name: "Leads dropping WoW", metric: "leads", operator: "pct_change_lt", threshold: -0.40, min_volume_gate: 1000, severity: "warning", scope: "account", enabled: true,
    message: 'Account leads down ≥ 40% week-over-week — check tracking and delivery before assuming a performance drop.' },
];

// A starter AND-group (collective anomaly): CPL spike AND CTR dropping on the same campaign — a
// stronger signal than either alone. Opt-in; not part of the default PRESET_RULES set above.
export const COLLECTIVE_EXAMPLE: AlertRule[] = [
  { ...PRESET_RULES.find((r) => r.id === "ALT-005")!, group: "fatigue_combo", group_logic: "and" },
  { id: "ALT-010C", name: "CTR dropping WoW", metric: "ctr", operator: "pct_change_lt", threshold: -0.25, min_volume_gate: 500, severity: "warning", scope: "campaign", enabled: true, group: "fatigue_combo", group_logic: "and" },
];
