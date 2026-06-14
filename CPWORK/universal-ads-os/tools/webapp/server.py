#!/usr/bin/env python3
"""
AdPilot OS — web app (standard library only, no pip installs).

A thin, safe UI over the engine: paste or upload a Meta/TikTok/universal CSV, set
average sale value + gross margin, and get back the Campaign Health Score, findings,
headline metrics, and SAFE per-ad decisions. It never edits a live ad — read/analyse
only.

Run:
    cd CPWORK/universal-ads-os/tools && python3 -m webapp.server
    # then open http://localhost:8000   (set PORT to change)

Endpoints:
    GET  /                 the app (HTML)
    GET  /health           liveness probe -> {"status":"ok"}
    GET  /api/selftest     runs the engine self-test -> {passed,total,ok}
    GET  /api/sample/<n>   sample CSV text (clean|fatigued|broken)
    POST /api/analyze      JSON {csv, average_sale_value, gross_margin, business,
                           currency, platform?} -> JSON {summary, health, decisions}
"""

from __future__ import annotations
import os
import sys
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # reach adpilot/
from adpilot import ingest, audit, decisions, metrics  # noqa: E402

PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")
FIXTURES = os.path.join(os.path.dirname(__file__), "..", "adpilot", "tests", "fixtures")
SAMPLES = {"clean": "clean_account.csv", "fatigued": "fatigued_account.csv",
           "broken": "broken_tracking.csv"}
BAND_COLOUR = {"Green": "#1a7f37", "Yellow": "#9a6700",
               "Orange": "#bc4c00", "Red": "#cf222e"}


def analyse(payload: dict) -> dict:
    csv_text = payload.get("csv", "")
    if not csv_text.strip():
        return {"error": "No CSV provided."}
    cfg = {
        "business_name": payload.get("business") or "Your Business",
        "currency": payload.get("currency") or "AUD",
        "average_sale_value": float(payload.get("average_sale_value") or 200),
        "gross_margin": float(payload.get("gross_margin") or 0.6),
    }
    rows = ingest.parse_csv_text(csv_text, payload.get("platform") or None)
    if not rows:
        return {"error": "No rows parsed. Check the CSV headers."}
    res = audit.score_account(rows, cfg)
    agg = res["agg"]
    be_cpa = res["break_even_cpa"]
    decs = []
    for r in rows:
        d = decisions.decide(r, cfg)
        decs.append({
            "name": r.get("ad_name") or r.get("campaign_name") or r.get("ad_id") or "(ad)",
            "platform": r.get("platform") or "?",
            "verdict": d["verdict"], "reason": d["reason"], "proposal": d["proposal"],
        })
    return {
        "config": cfg,
        "summary": {
            "spend": agg["spend"], "leads": agg["leads"], "purchases": agg["purchases"],
            "revenue": agg["revenue"],
            "ctr_pct": (agg["ctr"] or 0) * 100,
            "cpa": agg["cpa"], "roas": agg["roas"],
            "mer": metrics.mer(agg["revenue"], agg["spend"]),
            "break_even_cpa": be_cpa,
            "break_even_roas": metrics.break_even_roas(cfg["gross_margin"]),
        },
        "health": {"total": res["total"], "band": res["band"],
                   "guidance": res["guidance"], "findings": res["findings"],
                   "weakest": res["weakest"]},
        "campaigns": audit.score_by_campaign(rows, cfg),
        "decisions": decs,
        "safety": "Read-only analysis. No live ad was changed. Budget moves need a typed YES.",
    }


PAGE = """<!doctype html><html lang=en><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>AdPilot OS — Ads Health Check</title>
<style>
 :root{--ink:#1b1f24;--muted:#57606a;--line:#d0d7de;--bg:#f6f8fa;--brand:#0b5fff}
 *{box-sizing:border-box} body{margin:0;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg)}
 header{background:#0b1f3a;color:#fff;padding:18px 22px} header h1{margin:0;font-size:19px}
 header p{margin:4px 0 0;color:#aebfda;font-size:13px}
 .safe{background:#fff7e6;border:1px solid #f0c36d;color:#7a5b00;padding:8px 12px;border-radius:8px;font-size:13px;margin:14px 22px}
 main{max-width:980px;margin:0 auto;padding:0 22px 60px}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px} @media(max-width:760px){.grid{grid-template-columns:1fr}}
 label{display:block;font-weight:600;font-size:13px;margin:10px 0 4px}
 input,textarea,select{width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
 textarea{min-height:150px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
 .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}
 button{background:var(--brand);color:#fff;border:0;border-radius:8px;padding:11px 18px;font-weight:600;cursor:pointer}
 button.ghost{background:#fff;color:var(--brand);border:1px solid var(--brand)}
 .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;margin-top:16px}
 .score{font-size:46px;font-weight:800;line-height:1} .band{font-weight:700}
 table{width:100%;border-collapse:collapse;font-size:13px} th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
 .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff}
 .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} @media(max-width:760px){.metrics{grid-template-columns:repeat(2,1fr)}}
 .metric{background:var(--bg);border-radius:10px;padding:10px} .metric b{display:block;font-size:18px} .metric span{color:var(--muted);font-size:12px}
 .muted{color:var(--muted);font-size:12px} h2{font-size:16px;margin:0 0 8px} .hide{display:none}
 code{background:var(--bg);padding:1px 5px;border-radius:5px}
 .toolbar{display:flex;gap:10px;margin-top:16px}
 @media print{.noprint{display:none!important}body{background:#fff}.card{border-color:#ccc}header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<header class=noprint><h1>AdPilot OS — Ads Health Check</h1>
<p>Meta + TikTok · paste an export, get a health score &amp; safe proposals · never edits a live ad</p></header>
<div class="safe noprint">🔒 Read-only. This tool analyses your export and proposes changes. It never edits a live ad; budget moves need your typed “YES”.</div>
<main>
 <div class="card noprint">
  <div class=grid>
   <div>
    <label>Average sale value (AUD)</label><input id=avg type=number value=200>
    <label>Gross margin (0–1)</label><input id=margin type=number step=0.01 value=0.6>
    <label>Business name</label><input id=biz value="Example Co">
    <label>Platform (optional — auto-detects)</label>
    <select id=plat><option value="">auto</option><option>meta</option><option>tiktok</option></select>
    <div class=row>
      <button onclick=run()>Analyse</button>
      <button class=ghost onclick=loadSample('clean')>Sample: clean</button>
      <button class=ghost onclick=loadSample('fatigued')>Sample: fatigued</button>
      <button class=ghost onclick=loadSample('broken')>Sample: broken</button>
    </div>
    <p class=muted>Break-even CPA = avg sale × margin. Break-even ROAS = 1 ÷ margin.</p>
   </div>
   <div>
    <label>CSV (paste a Meta/TikTok/universal export, or upload)</label>
    <textarea id=csv placeholder="campaign_name,spend,impressions,clicks,purchases,revenue..."></textarea>
    <input type=file id=file accept=".csv,text/csv" style=margin-top:8px>
   </div>
  </div>
 </div>
 <div id=out></div>
 <p class="muted noprint" style=margin-top:24px>Engine self-test:
   <button class=ghost onclick=selftest()>run</button> <span id=st></span></p>
</main>
<script>
const $=id=>document.getElementById(id);
$('file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>$('csv').value=r.result;r.readAsText(f)});
async function loadSample(n){const r=await fetch('/api/sample/'+n);$('csv').value=await r.text();run()}
async function selftest(){$('st').textContent='running…';const r=await fetch('/api/selftest');const j=await r.json();$('st').textContent=j.passed+'/'+j.total+(j.ok?' ✅':' ❌')}
const C={Green:'#1a7f37',Yellow:'#9a6700',Orange:'#bc4c00',Red:'#cf222e'};
const SEV={CRITICAL:'#cf222e',HIGH:'#bc4c00',MEDIUM:'#9a6700',LOW:'#1a7f37',INFO:'#57606a'};
const f2=v=>v==null?'N/A':(Math.round(v*100)/100).toLocaleString();
async function run(){
 const body={csv:$('csv').value,average_sale_value:$('avg').value,gross_margin:$('margin').value,business:$('biz').value,platform:$('plat').value};
 $('out').innerHTML='<div class=card>Analysing…</div>';
 const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const j=await r.json();
 if(j.error){$('out').innerHTML='<div class=card style=color:#cf222e>'+j.error+'</div>';return}
 const s=j.summary,h=j.health,col=C[h.band]||'#57606a';window.__last=j;
 let html='<div class=card><div style=display:flex;gap:20px;align-items:center;flex-wrap:wrap>'+
  '<div><div class=score style=color:'+col+'>'+Math.round(h.total)+'<span style=font-size:18px;color:#57606a>/100</span></div>'+
  '<div class=band style=color:'+col+'>'+h.band+'</div></div>'+
  '<div style=flex:1;min-width:220px><b>'+h.guidance+'</b><div class=muted>Weakest: '+(h.weakest.join(', ')||'—')+'</div></div></div>';
 html+='<div class=metrics style=margin-top:14px>'+
  m('Spend',s.spend)+m('CPA',s.cpa)+m('Break-even CPA',s.break_even_cpa)+m('ROAS',s.roas)+
  m('Break-even ROAS',s.break_even_roas)+m('MER',s.mer)+m('Leads',s.leads)+m('Purchases',s.purchases)+'</div></div>';
 html+='<div class="toolbar noprint"><button onclick=downloadCSV()>Download CSV</button><button class=ghost onclick=window.print()>Print / Save PDF</button></div>';
 if(j.campaigns&&j.campaigns.length>1){html+='<div class=card><h2>By campaign <span class=muted>(worst-first)</span></h2><table><tr><th>Health</th><th>Campaign</th><th>Platforms</th><th>Spend</th><th>CPA</th><th>ROAS</th><th>Top issue</th></tr>';
  for(const c of j.campaigns){const cc=C[c.band]||'#57606a';html+='<tr><td><span class=pill style=background:'+cc+'>'+Math.round(c.health)+' '+c.band+'</span></td><td>'+c.campaign+'</td><td>'+c.platforms.join(', ')+'</td><td>'+f2(c.spend)+'</td><td>'+f2(c.cpa)+'</td><td>'+f2(c.roas)+'</td><td class=muted>'+(c.top_finding||'—')+'</td></tr>';}
  html+='</table></div>';}
 html+='<div class=card><h2>Findings</h2><table><tr><th>Severity</th><th>Factor</th><th>Detail</th></tr>';
 for(const f of h.findings)html+='<tr><td><span class=pill style=background:'+(SEV[f.severity]||'#57606a')+'>'+f.severity+'</span></td><td>'+f.factor+'</td><td>'+f.message+'</td></tr>';
 html+='</table></div>';
 html+='<div class=card><h2>Proposals <span class=muted>(paused duplicates / proposals only — nothing live changed)</span></h2><table><tr><th>Verdict</th><th>Ad</th><th>Why</th><th>Proposal</th></tr>';
 for(const d of j.decisions)html+='<tr><td><b>'+d.verdict+'</b></td><td>'+d.name+'<div class=muted>'+d.platform+'</div></td><td>'+d.reason+'</td><td>'+d.proposal+'</td></tr>';
 html+='</table></div>';
 $('out').innerHTML=html;
}
const m=(k,v)=>'<div class=metric><b>'+f2(v)+'</b><span>'+k+'</span></div>';
function q(v){v=(v==null?'':String(v));return '"'+v.replace(/"/g,'""')+'"';}
function downloadCSV(){const j=window.__last;if(!j)return;const L=[];
 L.push(['section','name','platform','verdict_or_band','detail1','detail2','detail3'].join(','));
 const s=j.summary;L.push(['summary','health',j.health.band,Math.round(j.health.total),'CPA='+f2(s.cpa),'ROAS='+f2(s.roas),'MER='+f2(s.mer)].map(q).join(','));
 for(const c of (j.campaigns||[]))L.push(['campaign',c.campaign,c.platforms.join('|'),c.band+' '+Math.round(c.health),'spend='+f2(c.spend),'cpa='+f2(c.cpa),'roas='+f2(c.roas)].map(q).join(','));
 for(const f of j.health.findings)L.push(['finding',f.factor,'',f.severity,f.message,'',''].map(q).join(','));
 for(const d of j.decisions)L.push(['decision',d.name,d.platform,d.verdict,d.reason,d.proposal,''].map(q).join(','));
 const blob=new Blob([L.join('\\n')],{type:'text/csv'});const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='adpilot-analysis.csv';a.click();URL.revokeObjectURL(a.href);}
</script></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):  # quieter logs
        pass

    def do_GET(self):
        if self.path == "/" or self.path.startswith("/index"):
            return self._send(200, PAGE, "text/html; charset=utf-8")
        if self.path == "/health":
            return self._send(200, json.dumps({"status": "ok", "version": "1.2"}))
        if self.path == "/api/selftest":
            from adpilot.tests import run_tests
            import io as _io
            import contextlib
            buf = _io.StringIO()
            with contextlib.redirect_stdout(buf):
                rc = run_tests.main()
            txt = buf.getvalue()
            line = [l for l in txt.splitlines() if "checks passed" in l]
            passed, total = (line[0].split("/")[0], line[0].split("/")[1].split()[0]) if line else ("?", "?")
            return self._send(200, json.dumps({"ok": rc == 0, "passed": passed, "total": total}))
        if self.path.startswith("/api/sample/"):
            name = self.path.rsplit("/", 1)[-1]
            fn = SAMPLES.get(name)
            if not fn:
                return self._send(404, json.dumps({"error": "unknown sample"}))
            with open(os.path.join(FIXTURES, fn), encoding="utf-8") as fh:
                return self._send(200, fh.read(), "text/csv; charset=utf-8")
        return self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        if self.path != "/api/analyze":
            return self._send(404, json.dumps({"error": "not found"}))
        try:
            n = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(n) or b"{}")
            return self._send(200, json.dumps(analyse(payload)))
        except Exception as e:  # never leak stack traces to the client
            return self._send(400, json.dumps({"error": f"Could not analyse: {e}"}))


def main():
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AdPilot OS web app on http://{HOST}:{PORT}  (Ctrl-C to stop)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main()
