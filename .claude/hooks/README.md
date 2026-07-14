# claude-defaults/hooks

Account-wide Claude Code hooks. `bootstrap.sh` copies this folder into a repo's
`.claude/hooks/` (or `~/.claude/hooks/` with `--user`), so a hook lands in every
repo/machine from one command.

## `claude-routing-classifier.ps1` — UserPromptSubmit
The **Model Routing Policy v5.0** classifier hook. On every message it classifies
the task (STAKES / EXTRACTION / HEAVY / TRIVIAL / NORMAL) and injects a `ROUTING HINT`
naming the Agent model to delegate to (or, for HEAVY non-stakes work, offloading to
Ollama Cloud via `tools/ollama_route.py`). Hardened: a deterministic money→STAKES
regex gate (fires before the model, so money never demotes even if Ollama is
down), `temperature 0` + fixed seed, single-token output, a one-time Fable-approval
gate, and fail-open on any error. Full policy:
`edagher92-coder/Claude-code-Agents` → `docs/model-routing-policy-v4.md`.

### Wire it (Windows, once) in `~/.claude/settings.json`
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command",
        "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"%USERPROFILE%\\.claude\\hooks\\claude-routing-classifier.ps1\"" } ] }
    ]
  }
}
```
Requires local Ollama with `llama3.2:3b` pulled. It is **not** wired into the
shared `claude-defaults/settings.json` on purpose — that file is portable, and a
Windows-only PowerShell hook would error on Linux/cloud sessions. Wire it per the
snippet above on the Windows host where Ollama runs; on other environments the
hook is simply absent (and would fail open regardless).
