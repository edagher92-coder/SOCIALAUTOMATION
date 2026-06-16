import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

// Regression guard: no stray "V2"/"V3" version labels on user-facing surfaces.
// (The acceptance grep under-covered components/; this catches it across both trees.)
function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

describe("version label hygiene", () => {
  it("has no stray V2/V3 (or 'Version 2/3') labels in app/ or components/", () => {
    const files = [...walk("app"), ...walk("components")];
    const offenders: string[] = [];
    for (const f of files) {
      const txt = readFileSync(f, "utf8");
      if (/\bV[23]\b|Version\s+[23]\b/.test(txt)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
