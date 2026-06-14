#!/usr/bin/env python3
"""
Build a single, self-contained AdPilot OS demo HTML (engine inlined) from the
GitHub Pages app in docs/. The output opens on any device with zero dependencies
and no server — ideal for emailing to prospects or dropping in Google Drive.

Usage:  python3 tools/build_singlefile.py [OUTPUT]
        (default OUTPUT: dist/AdPilot-OS-Demo.html)
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist", "AdPilot-OS-Demo.html")
    engine = open(os.path.join(DOCS, "engine.js"), encoding="utf-8").read()
    page = open(os.path.join(DOCS, "index.html"), encoding="utf-8").read()
    if '<script src="engine.js"></script>' not in page:
        sys.exit("Could not find the engine.js <script> tag to inline.")
    inlined = page.replace('<script src="engine.js"></script>',
                           "<script>\n/* AdPilot OS engine (inlined) */\n" + engine + "\n</script>")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(inlined)
    print(f"Wrote {out}  ({len(inlined):,} bytes, self-contained, 0 dependencies)")


if __name__ == "__main__":
    main()
