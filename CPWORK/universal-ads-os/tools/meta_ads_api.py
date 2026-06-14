"""
AdPilot OS — Meta Ads API toolkit (universal)
Direct Graph API access. No browser, no permission popups, standard library only.

Generalised from the original operator toolkit: the ad-account ID and token are
NEVER hardcoded — they come from environment variables (or a git-ignored token
file you point at). Ship this file with the product; ship NO secrets.

SETUP (one time, per client):
  export META_AD_ACCOUNT="act_XXXXXXXX"        # the client's ad account id
  export META_TOKEN="..."                       # OR put the token in a file (below)
  # token file alternative (git-ignored): secrets/meta_token.txt  -> set META_TOKEN_FILE

USAGE:
  python3 meta_ads_api.py status               # campaigns + ad sets (read-only)
  python3 meta_ads_api.py insights 7           # spend/results last 7d (read-only)
  python3 meta_ads_api.py pause <id>           # pause campaign/ad set/ad (reversible)
  python3 meta_ads_api.py activate <id>        # activate (reversible)
  python3 meta_ads_api.py budget <id> <amount> # GUARDED: requires typed YES

SAFETY (enforced here, matches AGENTS.md §1):
  - Reads and status toggles are allowed (reversible, no money moves).
  - Budget/spend changes print a confirmation and require typing YES.
  - There is deliberately NO delete function. Archive via status if needed.
  - This tool never edits creatives on a live ad; use it to pause, then build a
    paused duplicate in Ads Manager / via the API for review. (live_edit_block)
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

API_VERSION = os.environ.get("META_API_VERSION", "v21.0")
API = f"https://graph.facebook.com/{API_VERSION}"


def ad_account() -> str:
    acct = os.environ.get("META_AD_ACCOUNT", "").strip()
    if not acct:
        sys.exit("Set META_AD_ACCOUNT (e.g. act_XXXXXXXX). Never hardcode it.")
    return acct if acct.startswith("act_") else f"act_{acct}"


def token() -> str:
    tok = os.environ.get("META_TOKEN", "").strip()
    if tok:
        return tok
    tok_file = os.environ.get("META_TOKEN_FILE", "").strip()
    if tok_file and Path(tok_file).exists():
        return Path(tok_file).read_text().strip()
    sys.exit(
        "No token. Set META_TOKEN, or META_TOKEN_FILE pointing at a git-ignored "
        "file containing only the token. Never commit tokens (see SECURITY.md)."
    )


def call(method: str, path: str, params: dict | None = None) -> dict:
    params = dict(params or {})
    params["access_token"] = token()
    data = urllib.parse.urlencode(params).encode()
    if method == "GET":
        req = urllib.request.Request(f"{API}/{path}?{data.decode()}")
    else:
        req = urllib.request.Request(f"{API}/{path}", data=data, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        sys.exit(f"Meta API error {e.code}: {body}")


# ---------- READ (safe) ----------

def status():
    """List campaigns -> ad sets with status + budget (read-only)."""
    camps = call("GET", f"{ad_account()}/campaigns",
                 {"fields": "name,status,daily_budget,lifetime_budget,objective", "limit": 100})
    for c in camps.get("data", []):
        print(f"\nCAMPAIGN  {c['name']}  [{c['status']}]  id={c['id']}")
        adsets = call("GET", f"{c['id']}/adsets",
                      {"fields": "name,status,daily_budget,lifetime_budget", "limit": 100})
        for a in adsets.get("data", []):
            budget = a.get("daily_budget") or a.get("lifetime_budget") or "campaign-level"
            if str(budget).isdigit():
                budget = f"${int(budget) / 100:.2f}"
            print(f"   ad set  {a['name']}  [{a['status']}]  budget={budget}  id={a['id']}")


def insights(days: int = 7):
    """Spend + results for the last N days (read-only). Maps to the universal schema."""
    preset = f"last_{days}d" if days in (7, 14, 30) else "last_7d"
    r = call("GET", f"{ad_account()}/insights",
             {"fields": "campaign_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions",
              "date_preset": preset, "level": "campaign"})
    print(json.dumps(r.get("data", []), indent=2))


# ---------- WRITE: status toggles (reversible, no money) ----------

def pause(object_id: str):
    print("Paused:", call("POST", object_id, {"status": "PAUSED"}))


def activate(object_id: str):
    print("Activated:", call("POST", object_id, {"status": "ACTIVE"}))


# ---------- WRITE: budget (GUARDED) ----------

def set_daily_budget(object_id: str, amount: float):
    cents = int(round(amount * 100))
    print(f"About to set daily budget of {object_id} to {amount:.2f} (account currency).")
    print("This is a MONEY MOVE. Per AdPilot OS safety rules it needs confirmation.")
    if input("Type YES to confirm: ").strip() != "YES":
        sys.exit("Cancelled — no change made.")
    print("Budget updated:", call("POST", object_id, {"daily_budget": cents}))


# ---------- CLI ----------

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        print("Commands: status | insights [7|14|30] | pause <id> | activate <id> | budget <id> <amount>")
    elif args[0] == "status":
        status()
    elif args[0] == "insights":
        insights(int(args[1]) if len(args) > 1 else 7)
    elif args[0] == "pause":
        pause(args[1])
    elif args[0] == "activate":
        activate(args[1])
    elif args[0] == "budget":
        set_daily_budget(args[1], float(args[2]))
    else:
        print("Unknown command.")
