# `.claude/skills/` — SOCIALAUTOMATION

Skills auto-discovered by Claude Code and surfaced as `/` slash commands **when
this repo is the open project**. Two groups live here:

## 1. Mode skills (canonical here)
`balanced` · `deep` · `model-router` · `quick` — efficiency/routing modes.

## 2. AdPilot "AI specialist" toolkit (vendored — source of truth is CPWORK)

The 25 specialist skills (`meta-ads-audit`, `campaign-health-monitor`,
`creative-fatigue-detector`, `lead-quality-analyser`, `tiktok-ads-audit`,
`start-ads-command-centre`, …) plus `GOTCHAS.md` are **copied verbatim** from:

> `CPWORK/universal-ads-os/skills/` ← **source of truth**

They were duplicated here because Claude Code only auto-registers `/` commands
from `.claude/skills/` at the repo root — a plain nested `skills/` folder (where
the AdPilot framework keeps them) is never discovered. This copy makes them
show up when you type `/`.

**Edit the originals in `CPWORK/universal-ads-os/skills/`, then re-copy** — same
"one source, vendored copies" rule the account uses for `skill_router`:

```bash
# from repo root, after editing the source skills:
cp -r CPWORK/universal-ads-os/skills/*/ .claude/skills/
cp CPWORK/universal-ads-os/skills/GOTCHAS.md .claude/skills/GOTCHAS.md
```

Notes:
- **Templates** the audit/report skills fill in (`meta-ads-audit-template.md`,
  etc.) stay in `CPWORK/universal-ads-os/templates/` — they're output scaffolds
  the skill locates at run time, not load-time dependencies.
- `GOTCHAS.md` sits at this folder's root so the skills' `../GOTCHAS.md`
  references resolve.
- The 12 **persona agents** (Mira, Dana, Milo, …) are *not* here — agents never
  appear under `/`. They live in `CPWORK/universal-ads-os/agents/` as playbooks.
  Ask if you want them wired up as real `.claude/agents/` subagents (they'd show
  in the delegation picker, still not `/`).
- Nothing here is part of the shippable `adpilot-v2/` tree, so the resale-clean
  guard (which scans only `adpilot-v2/`) is unaffected.
