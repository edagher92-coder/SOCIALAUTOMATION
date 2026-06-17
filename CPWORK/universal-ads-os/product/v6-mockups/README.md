# AdPilot OS — V6 Design Mockups (sales + product vision)

Render-quality page mockups for the sale. Hand-authored as SVG in the **real brand system**
(not AI-garbled UI) and rasterised to PNG via `build.cjs` (Node + `sharp`). Regenerate with:
`NODE_PATH=adpilot-v2/node_modules node build.cjs`.

## The set
| File | Page | What it sells |
|---|---|---|
| `01-landing.png` | Landing + pricing | The pitch + the 3-tier offer. |
| `02-command-simple.png` | Command Center — Simple | The 10-second answer. |
| `03-command-advanced.png` | Command Center — Advanced | Depth for power users (dual-mode). |
| `04-proposals.png` | Proposals | Safe, explainable recommendations. |
| `05-connect.png` | Connect | Easy, read-only onboarding. |

## Design system (from `tailwind.config.ts`)
- **Coral `#f9603f` → amber `#ffb224`** signature gradient (logo, hero highlight, gauge accents).
- Warm command near-black `#161221`/`#211a2e` for the control-room hero.
- Warm neutrals: ink `#1c1726`, muted `#6b6478`, surface `#faf7f4`, border `#ece7e1`.
- Verdict/band colours: green `#16a34a`, amber `#ca8a04`, orange `#ea580c`, red `#dc2626`.

## Sales narrative baked in (the team consult)
- **Hero promise:** "Know exactly what your ads are doing to your money." Value-based, anti-hype —
  *protect the spend you already commit*, no earnings guarantees.
- **Three proof pillars:** 13-factor explainable Health Score · 12 grounded AI specialists ·
  read-only & reversible (the trust moat — "we never touch your ads").
- **Pricing (owner-confirmed):** Free · Starter $49 · Pro $149 (hero/"Most popular") · Expert $399,
  annual ≈ 2 months free. Locked-but-visible features entice upgrades.
- **Dual-mode** shown explicitly (Simple = 10-second answer; Advanced = checkpoints/rail/exports).
- **Safety everywhere:** read-only chips, "budget moves need a typed YES", AES-256 token encryption,
  Wilson-gated verdicts — the differentiators for a cautious SMB buyer.

> Mockups are a vision/marketing artefact, not shipped UI. Copy is illustrative; the live app is the
> source of truth. No personal/business data is used (resale-clean).
