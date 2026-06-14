/*
 * Parity test for the client-side engine. Confirms docs/engine.js matches the
 * Python engine on the documented cases + sample-account health bands.
 * Run:  node docs/engine.test.js     (exit 0 = all pass)
 */
const fs = require("fs");
const path = require("path");
const A = require("./engine.js");

let pass = 0, fail = 0;
const approx = (a, b, dp = 2) => a != null && b != null && Math.round(a * 10 ** dp) === Math.round(b * 10 ** dp);
function check(name, got, want, dp = 2) {
  const ok = (got == null && want == null) || approx(got, want, dp);
  if (ok) pass++; else { fail++; console.log(`FAIL ${name}: got ${got}, want ${want}`); }
}
function checkTrue(name, cond, got) { if (cond) pass++; else { fail++; console.log(`FAIL ${name}: got ${got}`); } }

const M = A.metrics;
// Metric parity (matches qa/metric-calculation-tests.md)
check("CTR%", M.ctr(4200, 280000) * 100, 1.50);
check("CPC", M.cpc(2100, 4200), 0.50);
check("CPM", M.cpm(2100, 280000), 7.50);
check("CPL", M.cpl(1500, 12), 125.00);
check("CPA", M.cpa(8000, 118), 67.80);
check("ROAS", M.roas(16800, 5000), 3.36);
check("MER", M.mer(45000, 9800), 4.59);
check("hook%", M.hookRate(85000, 380000) * 100, 22.37);
check("hold%", M.holdRate(24000, 85000) * 100, 28.24);
check("be CPA", M.breakEvenCpa(185, 0.42), 77.70);
check("be ROAS", M.breakEvenRoas(0.42), 2.38);
check("variance CPA", M.variancePct(67.80, 40), 69.5, 1);
check("variance ROAS", M.variancePct(2.1, 3.0), -30.0, 1);
check("blended CPA", M.blendedCpa([5000, 4500], [148, 130]), 34.17);
checkTrue("zero-conv CPA N/A", M.cpa(800, 0) === null);
checkTrue("ROAS anomaly", M.isRoasAnomaly(M.roas(50000, 500)));

// Health parity
check("weights sum", Object.values(A.WEIGHTS).reduce((a, b) => a + b, 0), 100);
const allGood = {}; Object.keys(A.WEIGHTS).forEach(f => allGood[f] = 80);
check("all-80 total", A.computeHealth(allGood).total, 80.0);
checkTrue("all-80 Green", A.computeHealth(allGood).band === "Green");
checkTrue("band 60 Yellow", A.band(60)[0] === "Yellow");
checkTrue("band 39 Red", A.band(39)[0] === "Red");

// Sample-account bands (must match Python: 89.4 Green / 51.5 Orange / 33.2 Red)
const FIX = path.join(__dirname, "..", "CPWORK", "universal-ads-os", "tools", "adpilot", "tests", "fixtures");
const cfg = { average_sale_value: 200, gross_margin: 0.6 };
const load = f => A.parseCsvText(fs.readFileSync(path.join(FIX, f), "utf8"));
const clean = A.scoreAccount(load("clean_account.csv"), cfg);
const fat = A.scoreAccount(load("fatigued_account.csv"), cfg);
const broken = A.scoreAccount(load("broken_tracking.csv"), cfg);
checkTrue(`clean Green (${clean.total})`, clean.band === "Green" && clean.total >= 80, clean.total);
checkTrue(`fatigued Orange (${fat.total})`, fat.total >= 40 && fat.total < 60, fat.total);
checkTrue(`broken Red (${broken.total})`, broken.total < 40, broken.total);
checkTrue("fatigued flags fatigue", fat.findings.some(f => f.factor === "creative_freshness"));
checkTrue("broken flags tracking CRITICAL", broken.findings.some(f => f.factor === "tracking_quality" && f.severity === "CRITICAL"));

// Decisions parity
const rows = {}; load("universal_sample.csv").forEach(r => rows[r.ad_name] = r);
checkTrue("winner->scale", A.decide(rows["pain-point_UGC_v3"], cfg, null, 85).verdict === "scale");
checkTrue("loser->kill", A.decide(rows["discount_static_v1"], cfg).verdict === "kill");
checkTrue("broken->fix-tracking", A.decide(rows["broken_promo_v2"], cfg).verdict === "fix-tracking");
checkTrue("floor->insufficient", A.decide(rows["new_test_v1"], cfg).verdict === "insufficient-data");

console.log(`\n${pass}/${pass + fail} JS-engine parity checks passed`);
console.log(pass > 0 && fail === 0 ? "RESULT: ALL PASS ✅" : "RESULT: FAILURES ❌");
process.exit(fail === 0 ? 0 : 1);
