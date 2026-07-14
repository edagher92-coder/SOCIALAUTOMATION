#!/usr/bin/env python3
"""ollama_route — send heavy, non-stakes work to a local or cloud Ollama model.

The bridge for Model Routing Policy v4.0 tier-0/1 (local Ollama + Ollama Cloud Pro).
Claude Code can't delegate to Ollama natively, so a Claude Code session or subagent
shells out to this CLI to offload bulk coding / long reasoning / summarising to
gpt-oss:120b, kimi-k2.7-code, etc. — keeping Claude quota for stakes work.

Server URL comes from CLAUDE_ROUTER_OLLAMA_URL (default http://localhost:11434).
On a secondary PC, point it at the MAIN server (elzydlab) over Tailscale:

    CLAUDE_ROUTER_OLLAMA_URL=http://elzydlab.tail76b098.ts.net:11434

(The main server must run Ollama with OLLAMA_HOST=0.0.0.0 so it listens on the
Tailscale interface, not just localhost.)

Usage:
    python ollama_route.py --model gpt-oss:120b-cloud "Summarise this changelog: ..."
    echo "refactor prompt" | python ollama_route.py --route heavy-code
    python ollama_route.py --list                       # models the server can see
    python ollama_route.py --route heavy-reason --json "..."   # full JSON response

Routes (task class -> default model; tune to your weekly benchmark):
    heavy-code    -> kimi-k2.7-code:cloud     bulk coding / refactors
    heavy-reason  -> gpt-oss:120b-cloud       long non-stakes reasoning / drafting
    trivial       -> gemma4:e4b               local free floor
    classify      -> llama3.2:3b              the router's own classifier

NUMBERS RULE: never send customer-facing price / quote / invoice / legal here.
Those stay on Claude (Sonnet/Opus). This tool is for heavy NON-stakes grunt work.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY = os.environ.get("OLLAMA_API_KEY", "").strip()
# Default to the local hub; if only an API key is set (no explicit URL), target
# Ollama Cloud — so this works from any machine with a key, incl. cloud sessions.
_DEFAULT_BASE = "https://ollama.com" if API_KEY else "http://localhost:11434"
BASE = os.environ.get("CLAUDE_ROUTER_OLLAMA_URL", _DEFAULT_BASE).rstrip("/")


def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if API_KEY:
        h["Authorization"] = "Bearer " + API_KEY
    return h


ROUTES = {
    "heavy-code": "kimi-k2.7-code:cloud",
    "heavy-reason": "gpt-oss:120b-cloud",
    "trivial": "gemma4:e4b",
    "classify": "llama3.2:3b",
}


def _get(path: str, timeout: int):
    req = urllib.request.Request(BASE + path, headers=_headers())
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _post(path: str, payload: dict, timeout: int):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers=_headers(),
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _explain(e: Exception) -> str:
    # HTTPError is a URLError subclass: the server WAS reached but returned an error.
    if isinstance(e, urllib.error.HTTPError):
        try:
            body = e.read().decode()[:300]
        except Exception:
            body = ""
        return (f"Ollama HTTP {e.code} from {BASE}{': ' + body if body else ''} "
                "(server reached — check the model tag, or OLLAMA_API_KEY for the Cloud API)")
    if isinstance(e, ValueError):  # json.JSONDecodeError / UnicodeDecodeError
        return f"Ollama at {BASE} returned a non-JSON body (a proxy or error page?)"
    return (f"cannot reach Ollama at {BASE}: {e}. Is it running? On a secondary PC set "
            "CLAUDE_ROUTER_OLLAMA_URL to the main server's Tailscale address, or set "
            "OLLAMA_API_KEY to use the Cloud API.")


def generate(model: str, prompt: str, system: str | None, timeout: int) -> dict:
    payload = {"model": model, "prompt": prompt, "stream": False}
    if system:
        payload["system"] = system
    return _post("/api/generate", payload, timeout)


def _write_status(model: str, role: str) -> None:
    # Records the engine actually used, for claude_status_line.py to render a
    # live "offline"/"cloud" badge. Best-effort: never breaks a dispatch.
    try:
        engine = "cloud" if (API_KEY or "ollama.com" in BASE) else "local"
        status_file = Path.home() / ".claude" / ".routing-status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text(json.dumps({
            "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "engine": engine,
            "model": model,
            "role": role,
            "source": "bridge",
        }), encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    p = argparse.ArgumentParser(prog="ollama_route", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("prompt", nargs="*", help="prompt text (or pipe via stdin)")
    p.add_argument("--model", help="explicit Ollama model tag (e.g. gpt-oss:120b-cloud)")
    p.add_argument("--route", choices=sorted(ROUTES), help="pick a model by task class")
    p.add_argument("--system", help="optional system prompt")
    p.add_argument("--timeout", type=int, default=180)
    p.add_argument("--json", action="store_true", help="print the full JSON response")
    p.add_argument("--list", action="store_true", help="list models the server can see")
    a = p.parse_args()

    if a.list:
        try:
            tags = _get("/api/tags", a.timeout)
        except Exception as e:
            print("error: " + _explain(e), file=sys.stderr)
            return 2
        for m in tags.get("models", []):
            print(m.get("name", "?"))
        return 0

    model = a.model or (ROUTES[a.route] if a.route else None)
    if not model:
        p.error("give --model TAG or --route {heavy-code,heavy-reason,trivial,classify}")

    prompt = " ".join(a.prompt).strip() or sys.stdin.read().strip()
    if not prompt:
        p.error("no prompt (pass as args or pipe via stdin)")

    try:
        resp = generate(model, prompt, a.system, a.timeout)
    except Exception as e:
        print("error: " + _explain(e), file=sys.stderr)
        return 2

    _write_status(model, a.route or "custom")

    if a.json:
        print(json.dumps(resp, indent=2))
    else:
        text = resp.get("response")
        if not text:
            print("error: no 'response' from the model; server said: "
                  + str(resp.get("error", resp))[:300], file=sys.stderr)
            return 3
        print(text.strip())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
