# AdPilot OS — User Manual (V2)

Meta & TikTok ads analytics & automation. **Read-only and safe by design**: it analyses and *proposes* — it never edits, pauses, or creates ads. The in-app version (with one-click **Download PDF**) lives at **/manual**.

## 1. Overview
AdPilot turns Meta & TikTok ad data into a **Campaign Health Score (0–100)**, plain-English findings, and prioritised, safe recommendations. Use Beginner mode (guided) or Advanced (full 13-factor breakdown). Multi-client: each workspace is fully isolated.

## 2. Quick start (5 min)
1. Sign in → **Ads Health**.
2. **Connect** Meta/TikTok *or* paste/upload a CSV.
3. **Settings:** set average sale value + gross margin (defines break-even).
4. **Analyse** → read score, findings, proposals.
5. **Saved Reports → Download branded PDF**.

## 3. Connecting platforms — MCP vs API token vs CSV
See **`docs/SETUP-CONNECT-PLATFORMS.md`** for the full guide and a benefits/drawbacks table. Summary:
- **CSV** — instant, private, manual.
- **API token (OAuth)** — recommended; one-click connect + auto-sync + scheduled scoring/alerts; read-only scopes; encrypted tokens.
- **MCP** — best if you orchestrate via Claude; export to CSV/universal schema into AdPilot.

## 4. Creative library (link or upload)
Bring AI audio/video/photo from **any** tool (Midjourney, Sora, Runway, ElevenLabs, Canva, HeyGen…): paste the asset URL in **Creative Library**, or upload your own. AdPilot organises it, links it to campaigns, and feeds briefs. URL-linking is the universal method; upload uses private storage.

## 5. Running an analysis
Pick a sample or paste/upload a CSV (Meta/TikTok/universal — columns auto-map), confirm economics, **Analyse**. Connected accounts: **Sync now** then analyse.

## 6. Reading the Health Score
0–100; bands **Green 80+ / Yellow 60–79 / Orange 40–59 / Red <40**. Weighted average of 13 factors (tracking, CPA vs break-even, CTR, creative fatigue, conversion rate, lead quality, CPC, naming, offer, landing page, budget pacing, data confidence). Advanced mode → **“Why this score?”** shows each factor's score, weight, contribution. **Data confidence** flags thin data.

## 7. Recommendations & safety
Verdicts per ad: **keep / kill / scale / reduce / refresh / fix-tracking / insufficient-data** — always proposals. Scaling only when health ≥70 + clean tracking. The system never changes your account; you act in the platform.

## 8. Reports & one-click PDF
Every analysis auto-saves under **Saved Reports**. Open one → **Download branded PDF** (browser print → Save as PDF) with your agency branding.

## 9. Multi-client (agency)
Use the **Client** selector (top-left) to switch, or **➕ Add client…** to create one. Full isolation per client (data, connections, reports, branding).

## 10. Notifications & alerts
**Notifications:** set email; enable weekly digest + critical alerts (CPA blowouts, broken tracking, fatigue, Red health). Daily cron scores connected accounts and emails breaches. **Send test email** to verify.

## 11. Settings
Per-client average sale value + gross margin → break-even CPA (sale × margin) and ROAS (1 ÷ margin).

## 12. Prompting guide (Canva / Bobby / Aria)
Connect a Claude key (**Claude API**) for live AI. Be specific: product + exact audience + offer + platform (Canva); one-line business + concrete question (Bobby); topic + audience + outcome (Aria). Always review AI output — it assists, you decide.

## 13. Diagnostics
- Liveness: `/api/health`. Host status: Vercel.
- Engine integrity: self-test runs on every build (parity with the Python engine).
- Bad score? Open “Why this score?”, check data confidence, verify CSV columns.
- Connection issues? Re-check **Connect Accounts**; reconnect expired tokens.

## 14. Error reference
| You see | Means | Do this |
|---|---|---|
| “No rows parsed” | CSV headers unrecognised | Export at ad level; keep header row; use universal template |
| “AI generation isn't configured” | No Claude key | Set `ANTHROPIC_API_KEY` |
| “Billing isn't configured” | No Stripe keys | Set `STRIPE_SECRET_KEY` + price IDs |
| “No connected {platform} account” | Not connected | Connect Accounts → Connect → Sync now |
| “{platform}_not_configured” | App ID/secret missing | Set `META_/TIKTOK_ APP_ID & SECRET` |
| “Upload needs Supabase Storage” | Bucket not set up | Run migration 0003 or paste a link |
| 401 / login redirect | Session expired | Sign in again |
| Sync “502 … API error” | Platform rejected call | Token expired/rate-limited — reconnect/retry |

## 15. Troubleshooting
- Analyse does nothing → check CSV not empty / headers; try a sample.
- Score off → confirm Settings economics; check data confidence.
- Wrong client's data → check the **Client** selector.
- PDF layout → print dialog, A4/Letter, Save as PDF, background graphics on.

## 16. FAQ
- **Changes my ads?** No — read-only, proposals only.
- **Private?** CSV in-browser; connected data org-isolated (RLS); tokens encrypted.
- **Meta + TikTok together?** Yes — one schema, one score + per-platform splits.
- **Need to code?** No.

## 17. Security & privacy
Read-only scopes · AES-256-GCM token vault · RLS per client · server-side secrets only · no earnings/results guarantees.

## 18. Support & error reporting
Report: what you did, expected vs actual, exact error text, client/workspace, CSV column sample. Email your support contact (`SUPPORT_EMAIL`). Devs: check Vercel + Supabase logs; the build self-test confirms engine integrity.
