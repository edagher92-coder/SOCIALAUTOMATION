"""
AdPilot OS CLI.  Run from the tools/ directory:

    python3 -m adpilot analyze <csv> [--platform meta|tiktok]
    python3 -m adpilot health        # prints the canonical worked example
    python3 -m adpilot selftest      # runs the bundled QA test suite

Config for analyze comes from flags (kept simple + secret-free):
    --avg-sale 200 --margin 0.6 --business "Example Co" --currency AUD
"""

from __future__ import annotations
import sys
from . import ingest, report, health


def _flag(args, name, default=None, cast=str):
    if name in args:
        i = args.index(name)
        if i + 1 < len(args):
            return cast(args[i + 1])
    return default


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]

    if cmd == "analyze":
        if not args:
            print("Usage: python3 -m adpilot analyze <csv> [--platform ...]")
            return 2
        path = args[0]
        cfg = {
            "business_name": _flag(args, "--business", "Example Co"),
            "currency": _flag(args, "--currency", "AUD"),
            "average_sale_value": _flag(args, "--avg-sale", 200.0, float),
            "gross_margin": _flag(args, "--margin", 0.6, float),
        }
        rows = ingest.load_csv(path, platform=_flag(args, "--platform"))
        print(report.summarise(rows, cfg))
        return 0

    if cmd == "health":
        # Canonical worked example: all-80 scores -> 80.0 (Green).
        res = health.compute_health({f: 80 for f in health.HEALTH_WEIGHTS})
        print(health.render_block(res, main_issue="illustrative all-80 example"))
        print(f"\n(weights sum = {health.weights_sum():.0f})")
        return 0

    if cmd == "selftest":
        from .tests import run_tests
        return run_tests.main()

    print(f"Unknown command: {cmd}")
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
