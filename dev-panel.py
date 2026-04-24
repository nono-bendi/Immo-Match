#!/usr/bin/env python3
"""ImmoMatch Dev Panel — local + VPS, port 8002"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess, json, os, socket, sys, threading, time
from pathlib import Path

PORT = 8002
BASE = Path(__file__).parent
VPS  = "root@178.104.57.75"

LOCAL_SERVICES = [
    {
        "id":    "backend",
        "label": "Backend API",
        "emoji": "⚡",
        "port":  8000,
        "cmd":   [sys.executable, "-m", "uvicorn", "backend:app", "--reload", "--port", "8000"],
        "cwd":   str(BASE),
        "shell": False,
    },
    {
        "id":    "landing",
        "label": "Landing",
        "emoji": "🌍",
        "port":  5173,
        "cmd":   "npm run dev",
        "cwd":   str(BASE / "landing"),
        "shell": True,
    },
    {
        "id":    "dashboard",
        "label": "Dashboard",
        "emoji": "📊",
        "port":  5174,
        "cmd":   "npm run dev",
        "cwd":   str(BASE / "dashboard"),
        "shell": True,
    },
]

VPS_SERVICES = [
    {"id": "immo-panel", "label": "Backend API",   "emoji": "⚡"},
    {"id": "nginx",      "label": "Nginx / Front", "emoji": "🌐"},
]

_procs: dict = {}   # id → Popen (seulement les process lancés par ce panel)


# ── utils ─────────────────────────────────────────────────────────────────────

def port_open(port: int) -> bool:
    """Vite bind sur ::1 sur Windows — tester 'localhost' en premier."""
    for host in ("localhost", "127.0.0.1"):
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except Exception:
            pass
    return False


def svc_by_id(sid: str):
    return next((s for s in LOCAL_SERVICES if s["id"] == sid), None)


# ── local ─────────────────────────────────────────────────────────────────────

def local_start(svc: dict):
    sid = svc["id"]
    p = _procs.get(sid)
    if p and p.poll() is None:
        return   # déjà lancé par nous
    if port_open(svc["port"]):
        return   # port occupé par un process externe — ne pas relancer
    flags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    _procs[sid] = subprocess.Popen(
        svc["cmd"], cwd=svc["cwd"], shell=svc["shell"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=flags,
    )


def local_stop(svc: dict):
    """Arrête uniquement les process lancés par ce panel (via Popen.terminate)."""
    sid  = svc["id"]
    p    = _procs.pop(sid, None)
    if not p or p.poll() is not None:
        return   # pas géré par nous → on ne touche pas
    p.terminate()
    # laisser 2s pour se fermer proprement, sinon kill
    for _ in range(20):
        if p.poll() is not None:
            break
        time.sleep(0.1)
    if p.poll() is None:
        p.kill()


def local_status() -> dict:
    """Retourne pour chaque service : port ouvert + géré par ce panel."""
    result = {}
    for s in LOCAL_SERVICES:
        open_ = port_open(s["port"])
        p     = _procs.get(s["id"])
        mine  = p is not None and p.poll() is None
        result[s["id"]] = {"open": open_, "managed": mine}
    return result


# ── VPS (via SSH) ─────────────────────────────────────────────────────────────

def ssh(cmd: str, timeout=8) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=5", "-o", "BatchMode=yes", VPS, cmd],
        capture_output=True, text=True, timeout=timeout,
    )
    return r.stdout.strip()


def vps_status() -> dict:
    out  = ssh("systemctl is-active immo-panel nginx")
    lines = out.splitlines()
    ids   = [s["id"] for s in VPS_SERVICES]
    return {ids[i]: (lines[i].strip() == "active" if i < len(lines) else False)
            for i in range(len(ids))}


def vps_action(verb: str, sid: str):
    if verb in ("start", "stop", "restart") and sid in [s["id"] for s in VPS_SERVICES]:
        ssh(f"systemctl {verb} {sid}", timeout=15)


def sync_db() -> bool:
    r = subprocess.run(
        ["scp", f"{VPS}:/app/agencies.db", str(BASE / "agencies.db")],
        capture_output=True, timeout=30,
    )
    return r.returncode == 0


# ── HTML ──────────────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ImmoMatch Panel</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0f1e;font-family:'Inter',system-ui,sans-serif;color:#f1f5f9;
       min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2.5rem 1rem}
  h1{font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px}
  h1 span{color:#38bdf8}
  .sub{font-size:13px;color:#475569;margin-bottom:2rem}

  .section{width:100%;max-width:760px;margin-bottom:2rem}
  .section-title{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
                 color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:#1e293b}

  .cards{display:grid;gap:12px}
  .cards.cols3{grid-template-columns:repeat(3,1fr)}
  .cards.cols2{grid-template-columns:repeat(2,1fr)}
  .card{background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px 18px;
        display:flex;flex-direction:column;gap:8px}
  .card-header{display:flex;align-items:center;gap:8px}
  .dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;transition:background .3s}
  .dot.on   {background:#22c55e;box-shadow:0 0 7px #22c55e99}
  .dot.ext  {background:#f59e0b;box-shadow:0 0 7px #f59e0b99}
  .dot.off  {background:#ef4444}
  .dot.load {background:#64748b}
  .card-label{font-size:13px;font-weight:700}
  .card-port{font-size:11px;color:#334155}
  .card-status{font-size:12px}
  .card-status.on  {color:#22c55e}
  .card-status.ext {color:#f59e0b}
  .card-status.off {color:#ef4444}
  .card-status.load{color:#64748b}
  .card-btns{display:flex;gap:6px;margin-top:2px}
  .btn{border:none;border-radius:7px;padding:6px 11px;font-size:12px;font-weight:700;
       cursor:pointer;transition:opacity .15s,transform .1s}
  .btn:active{transform:scale(.96)}
  .btn:disabled{opacity:.35;cursor:not-allowed}
  .btn-start  {background:#22c55e;color:#fff}
  .btn-stop   {background:#ef4444;color:#fff}
  .btn-restart{background:#f59e0b;color:#0f172a}

  .row{display:flex;gap:10px;margin-top:10px}
  .btn-big{border:none;border-radius:11px;padding:13px 20px;font-size:14px;font-weight:800;
           cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
           flex:1;transition:opacity .15s,transform .1s;text-decoration:none}
  .btn-big:active{transform:scale(.98)}
  .g-green {background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
  .g-red   {background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff}
  .g-indigo{background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff}
  .g-slate {background:#1e293b;color:#f1f5f9;border:1px solid #334155}

  .links{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}

  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
         background:#1e293b;border:1px solid #334155;border-radius:10px;
         padding:10px 20px;font-size:13px;font-weight:600;
         opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
  .toast.show{opacity:1}

  @media(max-width:560px){
    .cards.cols3,.cards.cols2,.links{grid-template-columns:1fr}
    .row{flex-direction:column}
  }
</style>
</head>
<body>
<h1>Immo<span>Match</span> Panel</h1>
<p class="sub">Dernière maj : <span id="last-refresh">–</span></p>

<!-- LOCAL -->
<div class="section">
  <div class="section-title">🖥️ Dev Local</div>
  <div class="cards cols3" id="local-cards"></div>
  <div class="row">
    <button class="btn-big g-green"  onclick="localAction('start-all')">▶ Tout démarrer</button>
    <button class="btn-big g-red"    onclick="localAction('stop-all')">■ Tout arrêter</button>
    <button class="btn-big g-indigo" onclick="syncDb()">🔄 Sync DB</button>
  </div>
  <div class="links" style="margin-top:10px">
    <a class="btn-big g-slate" href="http://localhost:5173" target="_blank">🌍 Landing</a>
    <a class="btn-big g-slate" href="http://localhost:5174" target="_blank">📊 Dashboard</a>
    <a class="btn-big g-slate" href="http://localhost:8000/docs" target="_blank">📖 API docs</a>
  </div>
</div>

<!-- VPS -->
<div class="section">
  <div class="section-title">☁️ VPS Production</div>
  <div class="cards cols2" id="vps-cards"></div>
  <div class="row">
    <button class="btn-big g-green" onclick="vpsAction('restart-all')">↺ Redémarrer tout</button>
    <a class="btn-big g-slate" href="https://178-104-57-75.sslip.io" target="_blank">🌐 Ouvrir VPS</a>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const LOCAL_SVCS = [
  {id:'backend',  label:'Backend API', emoji:'⚡', port:8000},
  {id:'landing',  label:'Landing',     emoji:'🌍', port:5173},
  {id:'dashboard',label:'Dashboard',   emoji:'📊', port:5174},
]
const VPS_SVCS = [
  {id:'immo-panel', label:'Backend API',   emoji:'⚡'},
  {id:'nginx',      label:'Nginx / Front', emoji:'🌐'},
]

function toast(msg, ms=2500) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(t._tid)
  t._tid = setTimeout(() => t.classList.remove('show'), ms)
}

function renderLocal(statuses) {
  document.getElementById('local-cards').innerHTML = LOCAL_SVCS.map(s => {
    const st      = statuses[s.id]       // {open, managed}
    const open    = st.open
    const managed = st.managed
    // états : on (géré+actif), ext (actif mais externe), off (arrêté)
    const cls  = open ? (managed ? 'on' : 'ext') : 'off'
    const lbl  = open ? (managed ? '● En ligne' : '◆ Externe') : '○ Arrêté'
    const hint = open && !managed ? 'lancé hors panel — Ctrl+C dans le terminal pour arrêter' : ''
    return `<div class="card">
      <div class="card-header">
        <div class="dot ${cls}"></div>
        <span class="card-label">${s.emoji} ${s.label}</span>
      </div>
      <div class="card-port">:${s.port}</div>
      <div class="card-status ${cls}" title="${hint}">${lbl}</div>
      <div class="card-btns">
        <button class="btn btn-start"   onclick="localAction('start-${s.id}')"   ${open?'disabled':''}>▶</button>
        <button class="btn btn-restart" onclick="localAction('restart-${s.id}')" ${!managed?'disabled':''}>↺</button>
        <button class="btn btn-stop"    onclick="localAction('stop-${s.id}')"    ${!managed?'disabled':''}>■</button>
      </div>
    </div>`
  }).join('')
}

function renderVps(statuses) {
  document.getElementById('vps-cards').innerHTML = VPS_SVCS.map(s => {
    const on  = statuses ? statuses[s.id] : null
    const cls = on === null ? 'load' : on ? 'on' : 'off'
    const lbl = on === null ? '… chargement' : on ? '● Actif' : '○ Arrêté'
    return `<div class="card">
      <div class="card-header">
        <div class="dot ${cls}"></div>
        <span class="card-label">${s.emoji} ${s.label}</span>
      </div>
      <div class="card-status ${cls}">${lbl}</div>
      <div class="card-btns">
        <button class="btn btn-start"   onclick="vpsAction('start-${s.id}')"   ${on?'disabled':''}>▶</button>
        <button class="btn btn-restart" onclick="vpsAction('restart-${s.id}')">↺</button>
        <button class="btn btn-stop"    onclick="vpsAction('stop-${s.id}')"    ${on===false?'disabled':''}>■</button>
      </div>
    </div>`
  }).join('')
}

async function refreshLocal() {
  try {
    const r = await fetch('/local/status')
    renderLocal(await r.json())
  } catch(e) {}
}

async function refreshVps() {
  try {
    const r = await fetch('/vps/status')
    renderVps(await r.json())
  } catch(e) { renderVps(null) }
  document.getElementById('last-refresh').textContent = new Date().toLocaleTimeString('fr-FR')
}

async function localAction(cmd) {
  toast('⏳ En cours…')
  await fetch('/local/action/' + cmd, {method:'POST'})
  setTimeout(refreshLocal, 800)
  setTimeout(refreshLocal, 2500)
  toast('✓ Fait')
}

async function vpsAction(cmd) {
  toast('⏳ Commande VPS…', 8000)
  await fetch('/vps/action/' + cmd, {method:'POST'})
  setTimeout(refreshVps, 3000)
  toast('✓ Fait')
}

async function syncDb() {
  toast('🔄 Sync DB depuis VPS…', 10000)
  const r = await fetch('/local/sync-db', {method:'POST'})
  const d = await r.json()
  toast(d.ok ? '✓ DB synchronisée' : '✗ Erreur sync', 3000)
}

renderVps(null)
refreshLocal()
refreshVps()
setInterval(refreshLocal, 4000)
setInterval(refreshVps, 10000)
</script>
</body>
</html>
"""


# ── serveur HTTP ──────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def _html(self):
        body = HTML.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", ""):
            self._html()
        elif self.path == "/local/status":
            self._json(local_status())
        elif self.path == "/vps/status":
            try:
                self._json(vps_status())
            except Exception:
                self._json({s["id"]: False for s in VPS_SERVICES})
        else:
            self.send_response(404); self.end_headers()

    def do_POST(self):
        if self.path.startswith("/local/action/"):
            cmd = self.path[len("/local/action/"):]
            if cmd == "start-all":
                for s in LOCAL_SERVICES: local_start(s)
            elif cmd == "stop-all":
                for s in LOCAL_SERVICES: local_stop(s)
            else:
                parts = cmd.split("-", 1)
                if len(parts) == 2:
                    verb, sid = parts
                    svc = svc_by_id(sid)
                    if svc and verb in ("start", "stop", "restart"):
                        if verb in ("stop",    "restart"): local_stop(svc)
                        if verb in ("start",   "restart"): local_start(svc)
            self.send_response(200); self.end_headers()

        elif self.path == "/local/sync-db":
            ok = sync_db()
            self._json({"ok": ok})

        elif self.path.startswith("/vps/action/"):
            cmd = self.path[len("/vps/action/"):]
            def _run():
                if cmd == "restart-all":
                    for s in VPS_SERVICES: vps_action("restart", s["id"])
                else:
                    parts = cmd.split("-", 1)
                    if len(parts) == 2:
                        vps_action(parts[0], parts[1])
            threading.Thread(target=_run, daemon=True).start()
            self.send_response(200); self.end_headers()

        else:
            self.send_response(404); self.end_headers()


if __name__ == "__main__":
    print(f"Panel -> http://localhost:{PORT}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
