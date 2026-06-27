import os
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import HTMLResponse
from jose import jwt

from agencies_db import get_db_path
from routers.auth import get_current_user
from config import AUTH_CONFIG


def get_user_from_token_param(token: str = Query(...)):
    """Authentification via query param ?token=xxx (pour les rapports HTML)."""
    try:
        payload = jwt.decode(token, AUTH_CONFIG["secret_key"], algorithms=[AUTH_CONFIG["algorithm"]])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

    import agencies_db as adb
    user = adb.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

router = APIRouter()


@router.get("/guide", response_class=HTMLResponse)
def guide_utilisateur():
    guide_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "rapport", "guide_utilisateur.html")
    with open(guide_path, encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@router.get("/rapport/mensuel", response_class=HTMLResponse)
def rapport_mensuel(mois: Optional[str] = None, current_user: dict = Depends(get_user_from_token_param)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    aujourd_hui = datetime.now()

    # Parsing du mois demandé (format YYYY-MM) ou mois courant
    if mois:
        try:
            ref = datetime.strptime(mois, "%Y-%m")
        except ValueError:
            ref = aujourd_hui
    else:
        ref = aujourd_hui

    debut_mois = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # Fin du mois = 1er du mois suivant
    if debut_mois.month == 12:
        fin_mois = debut_mois.replace(year=debut_mois.year + 1, month=1)
    else:
        fin_mois = debut_mois.replace(month=debut_mois.month + 1)

    debut_mois_prec = (debut_mois - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fin_mois_prec = debut_mois

    mois_label = debut_mois.strftime('%B %Y').capitalize()

    # Navigation : mois précédent / suivant
    mois_prec = debut_mois_prec.strftime('%Y-%m')
    mois_suiv_dt = fin_mois
    mois_suiv = mois_suiv_dt.strftime('%Y-%m')
    est_mois_courant = debut_mois.year == aujourd_hui.year and debut_mois.month == aujourd_hui.month

    now = debut_mois  # pour compatibilité avec le reste du code (strftime génération)

    debut_mois_iso = debut_mois.isoformat()
    fin_mois_iso = fin_mois.isoformat()
    debut_mois_prec_iso = debut_mois_prec.isoformat()
    fin_mois_prec_iso = fin_mois_prec.isoformat()

    # KPIs mois courant
    nb_prospects = conn.execute("SELECT COUNT(*) FROM prospects WHERE date >= ? AND date < ?", (debut_mois_iso, fin_mois_iso)).fetchone()[0]
    nb_biens = conn.execute("SELECT COUNT(*) FROM biens WHERE date_ajout >= ? AND date_ajout < ?", (debut_mois_iso, fin_mois_iso)).fetchone()[0]
    nb_matchings = conn.execute("SELECT COUNT(*) FROM matchings WHERE date_creation >= ? AND date_creation < ?", (debut_mois_iso, fin_mois_iso)).fetchone()[0]
    score_moy = conn.execute("SELECT ROUND(AVG(score),1) FROM matchings WHERE date_creation >= ? AND date_creation < ?", (debut_mois_iso, fin_mois_iso)).fetchone()[0] or 0
    excellents = conn.execute("SELECT COUNT(*) FROM matchings WHERE date_creation >= ? AND date_creation < ? AND score >= 75", (debut_mois_iso, fin_mois_iso)).fetchone()[0]

    # KPIs mois précédent (pour delta)
    nb_prospects_prec = conn.execute("SELECT COUNT(*) FROM prospects WHERE date >= ? AND date < ?", (debut_mois_prec_iso, fin_mois_prec_iso)).fetchone()[0]
    nb_biens_prec = conn.execute("SELECT COUNT(*) FROM biens WHERE date_ajout >= ? AND date_ajout < ?", (debut_mois_prec_iso, fin_mois_prec_iso)).fetchone()[0]
    nb_matchings_prec = conn.execute("SELECT COUNT(*) FROM matchings WHERE date_creation >= ? AND date_creation < ?", (debut_mois_prec_iso, fin_mois_prec_iso)).fetchone()[0]

    # Top matchings du mois
    top_matchings = conn.execute('''
        SELECT m.score, m.recommandation, p.nom as prospect_nom, p.telephone, p.mail,
               b.type as bien_type, b.ville, b.prix, b.surface, b.pieces
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE m.date_creation >= ? AND m.date_creation < ? AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC LIMIT 10
    ''', (debut_mois_iso, fin_mois_iso)).fetchall()

    # Nouveaux biens ce mois
    nouveaux_biens = conn.execute('''
        SELECT b.type, b.ville, b.prix, b.surface, b.pieces,
               COUNT(m.id) as nb_matchings
        FROM biens b
        LEFT JOIN matchings m ON b.id = m.bien_id
        WHERE b.date_ajout >= ? AND b.date_ajout < ?
        GROUP BY b.id ORDER BY nb_matchings DESC LIMIT 8
    ''', (debut_mois_iso, fin_mois_iso)).fetchall()

    # Totaux globaux
    total_prospects = conn.execute("SELECT COUNT(*) FROM prospects").fetchone()[0]
    total_biens = conn.execute("SELECT COUNT(*) FROM biens").fetchone()[0]
    total_matchings = conn.execute("SELECT COUNT(*) FROM matchings").fetchone()[0]
    score_global = conn.execute("SELECT ROUND(AVG(score),1) FROM matchings").fetchone()[0] or 0

    conn.close()

    def delta_html(current, previous):
        if previous == 0:
            return '<span class="delta neutral">—</span>'
        diff = current - previous
        if diff > 0:
            return f'<span class="delta up">+{diff}</span>'
        elif diff < 0:
            return f'<span class="delta down">{diff}</span>'
        return '<span class="delta neutral">=</span>'

    def prix_fmt(v):
        if not v: return '—'
        return f"{int(v):,}".replace(',', ' ') + ' €'

    def score_color(s):
        if s >= 75: return '#10b981'
        if s >= 50: return '#f59e0b'
        return '#ef4444'

    top_rows = ''
    for i, m in enumerate(top_matchings):
        sc = m['score']
        top_rows += f'''
        <tr>
          <td class="rank">#{i+1}</td>
          <td><span class="score-badge" style="background:{score_color(sc)}">{sc}</span></td>
          <td><strong>{m["prospect_nom"]}</strong><br><small>{m["mail"] or m["telephone"] or ""}</small></td>
          <td>{m["bien_type"]} · {m["ville"]}<br><small>{prix_fmt(m["prix"])} · {int(m["surface"] or 0)} m²</small></td>
          <td class="recomm">{m["recommandation"] or "—"}</td>
        </tr>'''

    biens_rows = ''
    for b in nouveaux_biens:
        biens_rows += f'''
        <tr>
          <td>{b["type"]} <span class="ville">{b["ville"]}</span></td>
          <td>{prix_fmt(b["prix"])}</td>
          <td>{int(b["surface"] or 0)} m² · {b["pieces"] or "—"} p.</td>
          <td><span class="match-count">{b["nb_matchings"]}</span></td>
        </tr>'''

    top_table_html = (
        '<table><thead><tr><th></th><th>Score</th><th>Prospect</th><th>Bien</th><th>Recommandation</th></tr></thead>'
        '<tbody>' + top_rows + '</tbody></table>'
    ) if top_matchings else '<p style="color:#94a3b8;font-size:13px;">Aucun matching ce mois.</p>'

    biens_table_html = (
        '<table><thead><tr><th>Bien</th><th>Prix</th><th>Surface</th><th>Matchings</th></tr></thead>'
        '<tbody>' + biens_rows + '</tbody></table>'
    ) if nouveaux_biens else '<p style="color:#94a3b8;font-size:13px;">Aucun bien ajouté ce mois.</p>'

    html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport mensuel — {mois_label}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family:'Inter',sans-serif; background:#f1f5f9; color:#1e293b; padding:40px 20px; }}
    .page {{ max-width:960px; margin:0 auto; background:white; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.08); }}
    .header {{ background:linear-gradient(135deg,#1E3A5F 0%,#2D5A8A 100%); padding:48px 56px 40px; color:white; }}
    .header-top {{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }}
    .logo {{ font-size:22px; font-weight:800; letter-spacing:-.04em; }}
    .logo span {{ color:#60a5fa; }}
    .badge {{ background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; }}
    .header h1 {{ font-size:32px; font-weight:800; margin-bottom:6px; }}
    .header p {{ opacity:.75; font-size:14px; }}
    .nav-mois {{ display:flex; align-items:center; gap:12px; margin-top:20px; }}
    .nav-btn {{ background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); color:white; padding:7px 16px; border-radius:10px; font-size:13px; font-weight:600; text-decoration:none; transition:.15s; }}
    .nav-btn:hover {{ background:rgba(255,255,255,.28); }}
    .nav-btn.disabled {{ opacity:.3; pointer-events:none; }}
    .nav-label {{ font-size:15px; font-weight:600; opacity:.85; min-width:120px; text-align:center; }}
    .kpi-grid {{ display:grid; grid-template-columns:repeat(4,1fr); gap:24px; padding:40px 56px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }}
    .kpi {{ background:white; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.06); }}
    .kpi-value {{ font-size:36px; font-weight:800; color:#1E3A5F; line-height:1; }}
    .kpi-label {{ font-size:12px; color:#64748b; margin-top:6px; font-weight:500; }}
    .delta {{ display:inline-block; font-size:11px; font-weight:700; padding:2px 7px; border-radius:20px; margin-top:8px; }}
    .delta.up {{ background:#d1fae5; color:#065f46; }}
    .delta.down {{ background:#fee2e2; color:#991b1b; }}
    .delta.neutral {{ background:#f1f5f9; color:#94a3b8; }}
    .section {{ padding:40px 56px; border-bottom:1px solid #f1f5f9; }}
    .section:last-child {{ border-bottom:none; }}
    .section-title {{ font-size:18px; font-weight:700; color:#1E3A5F; margin-bottom:20px; display:flex; align-items:center; gap:10px; }}
    .section-title::before {{ content:""; display:block; width:4px; height:20px; background:linear-gradient(#1E3A5F,#60a5fa); border-radius:2px; }}
    table {{ width:100%; border-collapse:collapse; font-size:13px; }}
    th {{ text-align:left; padding:10px 14px; background:#f8fafc; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.05em; border-bottom:2px solid #e2e8f0; }}
    td {{ padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:top; }}
    tr:last-child td {{ border-bottom:none; }}
    tr:hover td {{ background:#fafbfc; }}
    .rank {{ color:#94a3b8; font-size:12px; font-weight:600; width:32px; }}
    .score-badge {{ display:inline-block; color:white; font-weight:800; font-size:13px; padding:4px 10px; border-radius:8px; }}
    .recomm {{ color:#64748b; font-size:12px; max-width:260px; }}
    .ville {{ color:#64748b; }}
    .match-count {{ display:inline-block; background:#eff6ff; color:#1d4ed8; font-weight:700; font-size:12px; padding:2px 10px; border-radius:20px; }}
    .totals-grid {{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }}
    .total-item {{ text-align:center; padding:20px; background:#f8fafc; border-radius:12px; }}
    .total-value {{ font-size:28px; font-weight:800; color:#1E3A5F; }}
    .total-label {{ font-size:11px; color:#64748b; margin-top:4px; font-weight:500; }}
    .footer {{ background:#f8fafc; padding:24px 56px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e2e8f0; }}
    .toolbar {{ max-width:960px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }}
    .toolbar-btn {{ display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:.15s; }}
    .btn-back {{ background:white; color:#1E3A5F; box-shadow:0 1px 4px rgba(0,0,0,.1); transition:all .2s ease; }}
    .btn-back:hover {{ background:#f1f5f9; box-shadow:0 3px 10px rgba(0,0,0,.15); transform:translateX(-3px); }}
    .btn-back:active {{ transform:translateX(-1px); box-shadow:0 1px 4px rgba(0,0,0,.1); }}
    .btn-pdf {{ background:#1E3A5F; color:white; box-shadow:0 2px 8px rgba(30,58,95,.3); }}
    .btn-pdf:hover {{ background:#2D5A8A; }}
    @media print {{
      * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }}
      body {{ background:white; padding:0; }}
      .page {{ box-shadow:none; border-radius:0; }}
      .no-print {{ display:none !important; }}
    }}
    @media(max-width:700px) {{ .kpi-grid,.totals-grid {{ grid-template-columns:repeat(2,1fr); }} .section {{ padding:24px 20px; }} .header {{ padding:32px 24px 28px; }} .kpi-grid {{ padding:24px 20px; }} }}
  </style>
</head>
<body>
<div class="toolbar no-print">
  <button onclick="window.opener ? window.close() : history.back()" class="toolbar-btn btn-back">&#8592; Retour</button>
  <button onclick="window.print()" class="toolbar-btn btn-pdf">&#8615; T&eacute;l&eacute;charger PDF</button>
</div>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logo">Immo<span>Flash</span></div>
      <span class="badge">Rapport mensuel</span>
    </div>
    <h1>Activité de {mois_label}</h1>
    <p>{current_user["agency_nom"]}</p>
    <div class="nav-mois no-print" id="nav-mois">
      <a id="nav-prec" href="#" class="nav-btn">&#8592; {debut_mois_prec.strftime('%b %Y').capitalize()}</a>
      <span class="nav-label">{mois_label}</span>
      <a id="nav-suiv" href="#" class="nav-btn{'disabled' if est_mois_courant else ''}">&#8594; {mois_suiv_dt.strftime('%b %Y').capitalize()}</a>
    </div>
    <script>
      (function() {{
        var token = new URLSearchParams(window.location.search).get('token') || '';
        var prec = document.getElementById('nav-prec');
        var suiv = document.getElementById('nav-suiv');
        if (prec) prec.href = '/api/rapport/mensuel?mois={mois_prec}&token=' + token;
        if (suiv && !suiv.classList.contains('disabled')) suiv.href = '/api/rapport/mensuel?mois={mois_suiv}&token=' + token;
      }})();
    </script>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-value">{nb_prospects}</div>
      <div class="kpi-label">Nouveaux prospects</div>
      {delta_html(nb_prospects, nb_prospects_prec)}
    </div>
    <div class="kpi">
      <div class="kpi-value">{nb_biens}</div>
      <div class="kpi-label">Nouveaux biens</div>
      {delta_html(nb_biens, nb_biens_prec)}
    </div>
    <div class="kpi">
      <div class="kpi-value">{nb_matchings}</div>
      <div class="kpi-label">Matchings générés</div>
      {delta_html(nb_matchings, nb_matchings_prec)}
    </div>
    <div class="kpi">
      <div class="kpi-value">{score_moy}</div>
      <div class="kpi-label">Score moyen · {excellents} excellents</div>
      <span class="delta neutral">ce mois</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Top matchings du mois</div>
    {top_table_html}
  </div>

  <div class="section">
    <div class="section-title">Nouveaux biens analysés ce mois</div>
    {biens_table_html}
  </div>

  <div class="section">
    <div class="section-title">Cumul global</div>
    <div class="totals-grid">
      <div class="total-item"><div class="total-value">{total_prospects}</div><div class="total-label">Prospects actifs</div></div>
      <div class="total-item"><div class="total-value">{total_biens}</div><div class="total-label">Biens en stock</div></div>
      <div class="total-item"><div class="total-value">{total_matchings}</div><div class="total-label">Matchings totaux</div></div>
      <div class="total-item"><div class="total-value">{score_global}</div><div class="total-label">Score moyen global</div></div>
    </div>
  </div>

  <div class="footer">
    ImmoFlash · Rapport confidentiel · {now.strftime('%d/%m/%Y')}
  </div>
</div>
</body>
</html>'''

    return HTMLResponse(content=html)


@router.get("/rapport/bien/{bien_id}", response_class=HTMLResponse)
def rapport_bien(bien_id: int, current_user: dict = Depends(get_user_from_token_param)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    bien = conn.execute("SELECT * FROM biens WHERE id = ?", (bien_id,)).fetchone()
    if not bien:
        conn.close()
        return HTMLResponse(content="<h1>Bien introuvable</h1>", status_code=404)

    matchings = conn.execute('''
        SELECT m.score, m.points_forts, m.recommandation, m.date_analyse,
               p.nom as prospect_nom, p.telephone, p.mail, p.budget_max,
               p.bien as prospect_type_recherche, p.villes as prospect_villes
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        WHERE m.bien_id = ? AND m.score >= 75
          AND (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
          AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
    ''', (bien_id,)).fetchall()

    conn.close()

    b = dict(bien)
    now = datetime.now()

    def fmt_prix(v):
        if not v: return '—'
        return f"{int(v):,}".replace(',', ' ') + ' €'

    def score_color(s):
        if s >= 75: return '#10b981'
        if s >= 50: return '#f59e0b'
        return '#ef4444'

    def score_label(s):
        if s >= 75: return 'Excellent'
        if s >= 50: return 'Compatible'
        return 'Partiel'

    nb_exc = sum(1 for m in matchings if m['score'] >= 75)
    best = matchings[0]['score'] if matchings else 0
    photo_principale = (b.get('photos') or '').split('|')[0].strip()

    prospect_rows = ''
    for i, m in enumerate(matchings):
        md = dict(m)
        sc = md['score']
        prospect_rows += f'''
        <div class="prospect-card">
          <div class="prospect-header" style="border-left:4px solid {score_color(sc)}">
            <div class="prospect-rank">#{i+1}</div>
            <div class="prospect-info">
              <div class="prospect-name">{md["prospect_nom"]}</div>
              <div class="prospect-sub">Budget : {fmt_prix(md["budget_max"])} · {md["prospect_type_recherche"] or "—"}</div>
              {f'<div class="prospect-sub">{md["prospect_villes"]}</div>' if md.get("prospect_villes") else ''}
            </div>
            <div class="score-block" style="background:{score_color(sc)}">
              <div class="score-num">{sc}</div>
              <div class="score-lbl">{score_label(sc)}</div>
            </div>
          </div>
        </div>'''

    photo_html = f'<img src="{photo_principale}" class="bien-hero-photo" alt="" />' if photo_principale else ''

    html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport bien — {b.get("type","Bien")} à {b.get("ville","")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family:'Inter',sans-serif; background:#f1f5f9; color:#1e293b; padding:40px 20px; }}
    .page {{ max-width:900px; margin:0 auto; }}
    .header {{ background:linear-gradient(135deg,#1E3A5F 0%,#2D5A8A 100%); padding:48px 56px 40px; color:white; border-radius:20px 20px 0 0; }}
    .header-top {{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }}
    .logo {{ font-size:22px; font-weight:800; letter-spacing:-.04em; }}
    .logo span {{ color:#60a5fa; }}
    .badge {{ background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; }}
    .bien-title {{ font-size:36px; font-weight:800; margin-bottom:8px; }}
    .bien-sub {{ opacity:.8; font-size:15px; display:flex; gap:20px; flex-wrap:wrap; margin-bottom:6px; }}
    .card {{ background:white; border-radius:0 0 20px 20px; box-shadow:0 20px 60px rgba(0,0,0,.08); overflow:hidden; }}
    .summary-bar {{ display:grid; grid-template-columns:repeat(3,1fr); background:#f8fafc; border-bottom:1px solid #e2e8f0; }}
    .summary-item {{ padding:24px 32px; text-align:center; border-right:1px solid #e2e8f0; }}
    .summary-item:last-child {{ border-right:none; }}
    .summary-value {{ font-size:32px; font-weight:800; color:#1E3A5F; }}
    .summary-label {{ font-size:11px; color:#64748b; margin-top:4px; font-weight:500; text-transform:uppercase; letter-spacing:.05em; }}
    .bien-hero-photo {{ width:100%; max-height:260px; object-fit:cover; display:block; }}
    .bien-detail {{ padding:28px 40px; border-bottom:1px solid #f1f5f9; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }}
    .detail-item {{ background:#f8fafc; border-radius:10px; padding:12px 16px; }}
    .detail-label {{ font-size:11px; color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }}
    .detail-val {{ font-size:15px; font-weight:700; color:#1e293b; }}
    .desc-section {{ padding:24px 40px; border-bottom:1px solid #f1f5f9; }}
    .section-title {{ font-size:16px; font-weight:700; color:#1E3A5F; margin-bottom:16px; display:flex; align-items:center; gap:10px; }}
    .section-title::before {{ content:""; display:block; width:4px; height:18px; background:linear-gradient(#1E3A5F,#60a5fa); border-radius:2px; }}
    .desc-text {{ font-size:13px; color:#475569; line-height:1.7; white-space:pre-wrap; }}
    .prospects-section {{ padding:32px 40px 40px; }}
    .prospect-card {{ background:#fafbfc; border:1px solid #e2e8f0; border-radius:14px; margin-bottom:12px; overflow:hidden; }}
    .prospect-header {{ display:flex; align-items:center; gap:16px; padding:16px 20px; background:white; }}
    .prospect-rank {{ font-size:13px; font-weight:700; color:#94a3b8; width:28px; flex-shrink:0; }}
    .prospect-info {{ flex:1; min-width:0; }}
    .prospect-name {{ font-size:15px; font-weight:700; color:#1E3A5F; }}
    .prospect-sub {{ font-size:12px; color:#64748b; margin-top:2px; }}
    .score-block {{ padding:10px 16px; border-radius:10px; text-align:center; color:white; flex-shrink:0; }}
    .score-num {{ font-size:24px; font-weight:800; line-height:1; }}
    .score-lbl {{ font-size:10px; font-weight:600; opacity:.85; margin-top:2px; text-transform:uppercase; letter-spacing:.04em; }}
    .prospect-body {{ padding:12px 20px; border-top:1px solid #f1f5f9; }}
    .pf-text {{ font-size:13px; color:#374151; line-height:1.6; background:#f0fdf4; padding:10px 14px; border-radius:8px; }}
    .no-match {{ padding:48px; text-align:center; color:#94a3b8; }}
    .footer {{ text-align:center; color:#94a3b8; font-size:12px; padding:24px; }}
    .toolbar {{ max-width:900px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }}
    .toolbar-btn {{ display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:.15s; }}
    .btn-back {{ background:white; color:#1E3A5F; box-shadow:0 1px 4px rgba(0,0,0,.1); }}
    .btn-back:hover {{ background:#f1f5f9; }}
    .btn-pdf {{ background:#1E3A5F; color:white; box-shadow:0 2px 8px rgba(30,58,95,.3); }}
    .btn-pdf:hover {{ background:#2D5A8A; }}
    .accroche {{ background:linear-gradient(135deg,#f0f9ff,#e0f2fe); border:1px solid #bae6fd; border-radius:14px; padding:20px 24px; margin:0 40px 24px; }}
    .accroche-title {{ font-size:15px; font-weight:700; color:#0369a1; margin-bottom:6px; }}
    .accroche-text {{ font-size:13px; color:#0c4a6e; line-height:1.6; }}
    @media print {{ * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }} body {{ background:white; padding:0; }} .page {{ max-width:100%; }} .header {{ border-radius:0; }} .card {{ box-shadow:none; border-radius:0; }} .no-print {{ display:none !important; }} }}
  </style>
</head>
<body>
<div class="toolbar no-print">
  <button onclick="window.opener ? window.close() : history.back()" class="toolbar-btn btn-back">&#8592; Retour</button>
  <button onclick="window.print()" class="toolbar-btn btn-pdf">&#8615; T&eacute;l&eacute;charger PDF</button>
</div>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logo">Immo<span>Flash</span></div>
      <span class="badge">Rapport bien</span>
    </div>
    <div class="bien-title">{b.get("type","Bien")} à {b.get("ville","")}</div>
    <div class="bien-sub">
      <span>{fmt_prix(b.get("prix"))}</span>
      {f'<span>{int(b["surface"])} m²</span>' if b.get("surface") else ''}
      {f'<span>{b["pieces"]} pièces</span>' if b.get("pieces") else ''}
      {f'<span>Réf. {b["reference"]}</span>' if b.get("reference") else ''}
    </div>
  </div>
  <div class="card">
    {photo_html}
    <div class="summary-bar">
      <div class="summary-item">
        <div class="summary-value">{len(matchings)}</div>
        <div class="summary-label">Prospects analysés</div>
      </div>
      <div class="summary-item">
        <div class="summary-value" style="color:#10b981">{nb_exc}</div>
        <div class="summary-label">Scores excellents</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{best}</div>
        <div class="summary-label">Meilleur score</div>
      </div>
    </div>

    <div class="bien-detail">
      {f'<div class="detail-item"><div class="detail-label">Prix</div><div class="detail-val">{fmt_prix(b.get("prix"))}</div></div>' if b.get("prix") else ''}
      {f'<div class="detail-item"><div class="detail-label">Surface</div><div class="detail-val">{int(b["surface"])} m²</div></div>' if b.get("surface") else ''}
      {f'<div class="detail-item"><div class="detail-label">Pièces</div><div class="detail-val">{b["pieces"]}</div></div>' if b.get("pieces") else ''}
      {f'<div class="detail-item"><div class="detail-label">Chambres</div><div class="detail-val">{b["chambres"]}</div></div>' if b.get("chambres") else ''}
      {f'<div class="detail-item"><div class="detail-label">État</div><div class="detail-val">{b["etat"]}</div></div>' if b.get("etat") else ''}
      {f'<div class="detail-item"><div class="detail-label">Exposition</div><div class="detail-val">{b["exposition"]}</div></div>' if b.get("exposition") else ''}
    </div>

    {f'<div class="desc-section"><div class="section-title">Description</div><p class="desc-text">{b["description"]}</p></div>' if b.get("description") else ''}

    <div class="accroche">
      <div class="accroche-title">Argument pour le vendeur</div>
      <div class="accroche-text">Notre IA a identifié {len(matchings)} acheteur{"s" if len(matchings) > 1 else ""} en portefeuille avec un score de compatibilité excellent (≥ 75/100) pour votre bien. Ces profils ont été sélectionnés parmi l'ensemble de notre base prospects et présentent une forte probabilité de correspondance.</div>
    </div>

    <div class="prospects-section">
      <div class="section-title">{len(matchings)} prospect{"s" if len(matchings) > 1 else ""} — triés par score IA</div>
      {prospect_rows if prospect_rows else '<div class="no-match"><p>Aucun matching pour ce bien.</p></div>'}
    </div>
  </div>
  <div class="footer">ImmoFlash · Rapport confidentiel · {now.strftime("%d/%m/%Y")} · {b.get("type","Bien")} à {b.get("ville","")}</div>
</div>
</body>
</html>'''

    return HTMLResponse(content=html)


@router.get("/rapport/prospect/{prospect_id}", response_class=HTMLResponse)
def rapport_prospect(prospect_id: int, current_user: dict = Depends(get_user_from_token_param)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not prospect:
        conn.close()
        return HTMLResponse(content="<h1>Prospect introuvable</h1>", status_code=404)

    matchings = conn.execute('''
        SELECT m.*, b.type as bien_type, b.ville, b.prix, b.surface, b.pieces,
               b.chambres, b.etat, b.exposition, b.stationnement, b.exterieur,
               b.etage, b.description, b.reference, b.photos
        FROM matchings m
        JOIN biens b ON m.bien_id = b.id
        WHERE m.prospect_id = ?
        ORDER BY m.score DESC
    ''', (prospect_id,)).fetchall()

    conn.close()

    now = datetime.now()
    p = dict(prospect)

    def fmt_prix(v):
        if not v: return '—'
        return f"{int(v):,}".replace(',', ' ') + ' €'

    def score_color(s):
        if s >= 75: return '#10b981'
        if s >= 50: return '#f59e0b'
        return '#ef4444'

    def score_label(s):
        if s >= 75: return 'Excellent'
        if s >= 50: return 'Compatible'
        return 'Partiel'

    criteres_items = ''
    crit_map = [
        ('bien', 'Type recherché'), ('villes', 'Villes cibles'), ('quartiers', 'Quartiers'),
        ('budget_max', 'Budget max'), ('exposition', 'Exposition'), ('stationnement', 'Stationnement'),
        ('copro', 'Copropriété'), ('exterieur', 'Extérieur'), ('etage', 'Étage'),
        ('destination', 'Destination'),
    ]
    for key, label in crit_map:
        val = p.get(key)
        if val and str(val).strip() and str(val) != 'None':
            display = fmt_prix(val) if key == 'budget_max' else str(val)
            criteres_items += f'<div class="crit-item"><span class="crit-label">{label}</span><span class="crit-val">{display}</span></div>'

    observation_html = ''
    obs_val = p.get('observation')
    if obs_val and str(obs_val).strip() and str(obs_val) != 'None':
        observation_html = f'<div class="obs-block"><span class="crit-label">Observation</span><p class="obs-text">{obs_val}</p></div>'

    matching_cards = ''
    for m in matchings:
        md = dict(m)
        sc = md['score']
        photo = (md.get('photos') or '').split('|')[0].strip()
        photo_html = f'<img src="{photo}" class="bien-photo" alt="" />' if photo else ''
        pts_forts = (md.get('points_forts') or '').strip()
        pts_att = (md.get('points_attention') or '').strip()
        recomm = (md.get('recommandation') or '').strip()
        ref_html = f'<div class="matching-ref">Réf. {md["reference"]}</div>' if md.get("reference") else ''
        forts_html = f'<div class="analysis-block forts"><div class="ab-title"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M20 6L9 17l-5-5" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Points forts</div><div class="ab-text">{pts_forts}</div></div>' if pts_forts else ''
        att_label = "Points d'attention"
        att_html = f'<div class="analysis-block att"><div class="ab-title"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{att_label}</div><div class="ab-text">{pts_att}</div></div>' if pts_att else ''
        recomm_html = f'<div class="recomm-block"><strong>Recommandation :</strong> {recomm}</div>' if recomm else ''
        date_str = md["date_analyse"][:10] if md.get("date_analyse") else "—"
        matching_cards += f'''
        <div class="matching-card">
          <div class="matching-header" style="border-left:4px solid {score_color(sc)}">
            {photo_html}
            <div class="matching-info">
              <div class="matching-title">{md["bien_type"]} à {md["ville"]}</div>
              <div class="matching-sub">{fmt_prix(md["prix"])} · {int(md["surface"] or 0)} m² · {md["pieces"] or "—"} pièces</div>
              {ref_html}
            </div>
            <div class="score-block" style="background:{score_color(sc)}">
              <div class="score-num">{sc}</div>
              <div class="score-lbl">{score_label(sc)}</div>
            </div>
          </div>
          <div class="matching-body">
            {forts_html}
            {att_html}
            {recomm_html}
            <div class="matching-date">Analysé le {date_str}</div>
          </div>
        </div>'''

    nb_exc = sum(1 for m in matchings if m['score'] >= 75)
    nb_bon = sum(1 for m in matchings if 50 <= m['score'] < 75)
    best = matchings[0]['score'] if matchings else 0

    html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport prospect — {p["nom"]}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family:'Inter',sans-serif; background:#f1f5f9; color:#1e293b; padding:40px 20px; }}
    .page {{ max-width:900px; margin:0 auto; }}
    .header {{ background:linear-gradient(135deg,#1E3A5F 0%,#2D5A8A 100%); padding:48px 56px 40px; color:white; border-radius:20px 20px 0 0; }}
    .header-top {{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }}
    .logo {{ font-size:22px; font-weight:800; letter-spacing:-.04em; }}
    .logo span {{ color:#60a5fa; }}
    .badge {{ background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; }}
    .prospect-name {{ font-size:36px; font-weight:800; margin-bottom:8px; }}
    .prospect-contact {{ opacity:.8; font-size:14px; display:flex; gap:24px; flex-wrap:wrap; }}
    .prospect-contact span::before {{ margin-right:6px; opacity:.6; }}
    .card {{ background:white; border-radius:0 0 20px 20px; box-shadow:0 20px 60px rgba(0,0,0,.08); overflow:hidden; }}
    .summary-bar {{ display:grid; grid-template-columns:repeat(3,1fr); background:#f8fafc; border-bottom:1px solid #e2e8f0; }}
    .summary-item {{ padding:24px 32px; text-align:center; border-right:1px solid #e2e8f0; }}
    .summary-item:last-child {{ border-right:none; }}
    .summary-value {{ font-size:32px; font-weight:800; color:#1E3A5F; }}
    .summary-label {{ font-size:11px; color:#64748b; margin-top:4px; font-weight:500; text-transform:uppercase; letter-spacing:.05em; }}
    .criteres-section {{ padding:32px 40px; border-bottom:1px solid #f1f5f9; }}
    .section-title {{ font-size:16px; font-weight:700; color:#1E3A5F; margin-bottom:16px; display:flex; align-items:center; gap:10px; }}
    .section-title::before {{ content:""; display:block; width:4px; height:18px; background:linear-gradient(#1E3A5F,#60a5fa); border-radius:2px; }}
    .criteres-grid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }}
    .crit-item {{ display:flex; justify-content:space-between; padding:8px 12px; background:#f8fafc; border-radius:8px; font-size:13px; }}
    .crit-label {{ color:#64748b; font-weight:500; }}
    .crit-val {{ color:#1e293b; font-weight:600; text-align:right; max-width:55%; }}
    .obs-block {{ padding:10px 12px; background:#f8fafc; border-radius:8px; font-size:13px; margin-top:8px; }}
    .obs-text {{ color:#1e293b; font-weight:400; margin-top:6px; line-height:1.6; white-space:pre-wrap; }}
    .matchings-section {{ padding:32px 40px 40px; }}
    .matching-card {{ background:#fafbfc; border:1px solid #e2e8f0; border-radius:14px; margin-bottom:16px; overflow:hidden; }}
    .matching-header {{ display:flex; align-items:center; gap:16px; padding:18px 20px; background:white; }}
    .bien-photo {{ width:72px; height:54px; object-fit:cover; border-radius:8px; flex-shrink:0; }}
    .matching-info {{ flex:1; min-width:0; }}
    .matching-title {{ font-size:15px; font-weight:700; color:#1E3A5F; }}
    .matching-sub {{ font-size:12px; color:#64748b; margin-top:2px; }}
    .matching-ref {{ font-size:11px; color:#94a3b8; margin-top:2px; }}
    .score-block {{ padding:10px 16px; border-radius:10px; text-align:center; color:white; flex-shrink:0; }}
    .score-num {{ font-size:24px; font-weight:800; line-height:1; }}
    .score-lbl {{ font-size:10px; font-weight:600; opacity:.85; margin-top:2px; text-transform:uppercase; letter-spacing:.04em; }}
    .matching-body {{ padding:16px 20px; border-top:1px solid #f1f5f9; display:flex; flex-direction:column; gap:10px; }}
    .analysis-block {{ padding:10px 14px; border-radius:10px; font-size:13px; }}
    .analysis-block.forts {{ background:#f0fdf4; }}
    .analysis-block.att {{ background:#fffbeb; }}
    .ab-title {{ font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; color:#374151; }}
    .recomm-block {{ font-size:13px; color:#374151; padding:10px 14px; background:#eff6ff; border-radius:10px; }}
    .matching-date {{ font-size:11px; color:#94a3b8; text-align:right; }}
    .no-match {{ padding:48px; text-align:center; color:#94a3b8; }}
    .no-match svg {{ margin:0 auto 12px; display:block; opacity:.3; }}
    .footer {{ text-align:center; color:#94a3b8; font-size:12px; padding:24px; }}
    .toolbar {{ max-width:900px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }}
    .toolbar-btn {{ display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:.15s; }}
    .btn-back {{ background:white; color:#1E3A5F; box-shadow:0 1px 4px rgba(0,0,0,.1); }}
    .btn-back:hover {{ background:#f1f5f9; box-shadow:0 3px 10px rgba(0,0,0,.15); transform:translateX(-3px); }}
    .btn-pdf {{ background:#1E3A5F; color:white; box-shadow:0 2px 8px rgba(30,58,95,.3); }}
    .btn-pdf:hover {{ background:#2D5A8A; }}
    @media print {{ * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }} body {{ background:white; padding:0; }} .page {{ max-width:100%; }} .header {{ border-radius:0; }} .card {{ box-shadow:none; border-radius:0; }} .no-print {{ display:none !important; }} }}
    @media(max-width:600px) {{ .header {{ padding:32px 24px 28px; }} .prospect-name {{ font-size:26px; }} .criteres-section,.matchings-section,.criteres-grid {{ padding:24px 16px; }} .criteres-grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
<div class="toolbar no-print">
  <button onclick="window.opener ? window.close() : history.back()" class="toolbar-btn btn-back">&#8592; Retour</button>
  <button onclick="window.print()" class="toolbar-btn btn-pdf">&#8615; T&eacute;l&eacute;charger PDF</button>
</div>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logo">Immo<span>Flash</span></div>
      <span class="badge">Rapport prospect</span>
    </div>
    <div class="prospect-name">{p["nom"]}</div>
    <div class="prospect-contact">
      {f'<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:5px;opacity:.7"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" stroke-width="1.8"/><polyline points="22,6 12,13 2,6" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>{p["mail"]}</span>' if p.get("mail") else ''}
      {f'<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:5px;opacity:.7"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.09-1.26a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>{p["telephone"]}</span>' if p.get("telephone") else ''}
      {f'<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:5px;opacity:.7"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" stroke-width="1.8"/><circle cx="12" cy="10" r="3" stroke="white" stroke-width="1.8"/></svg>{p["domicile"]}</span>' if p.get("domicile") else ''}
      {f'<span>Entré le {p["date"][:10]}</span>' if p.get("date") else ''}
    </div>
  </div>
  <div class="card">
    <div class="summary-bar">
      <div class="summary-item">
        <div class="summary-value">{len(matchings)}</div>
        <div class="summary-label">Matchings analysés</div>
      </div>
      <div class="summary-item">
        <div class="summary-value" style="color:#10b981">{nb_exc}</div>
        <div class="summary-label">Scores ≥ 75</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{best}</div>
        <div class="summary-label">Meilleur score</div>
      </div>
    </div>

    <div class="criteres-section">
      <div class="section-title">Critères de recherche</div>
      <div class="criteres-grid">{criteres_items or '<p style="color:#94a3b8;font-size:13px;">Aucun critère renseigné.</p>'}</div>
      {observation_html}
    </div>

    <div class="matchings-section">
      <div class="section-title">{len(matchings)} matching{"s" if len(matchings) > 1 else ""} — triés par score</div>
      {matching_cards if matching_cards else '<div class="no-match"><p>Aucun matching pour ce prospect.</p></div>'}
    </div>
  </div>
  <div class="footer">ImmoFlash · Rapport confidentiel · {now.strftime('%d/%m/%Y')} · {p["nom"]}</div>
</div>
</body>
</html>'''

    return HTMLResponse(content=html)


@router.get("/rapport/portefeuille", response_class=HTMLResponse)
def rapport_portefeuille(
    type_bien: Optional[str] = None,
    budget_min: Optional[int] = None,
    current_user: dict = Depends(get_user_from_token_param)
):
    import unicodedata

    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    where_clauses = ["(p.archive = 0 OR p.archive IS NULL)"]
    params: list = []
    if type_bien:
        where_clauses.append("(p.bien LIKE ? OR p.bien LIKE ? OR p.bien LIKE ? OR p.bien = ?)")
        params += [f'{type_bien},%', f'%, {type_bien}%', f'%,{type_bien}', type_bien]
    if budget_min:
        where_clauses.append("(p.budget_max IS NULL OR p.budget_max >= ?)")
        params.append(budget_min)

    prospects_raw = conn.execute(
        f"SELECT * FROM prospects p WHERE {' AND '.join(where_clauses)} ORDER BY p.budget_max DESC, p.date DESC",
        params
    ).fetchall()

    conn.close()

    # ── Dédoublonnage ──────────────────────────────────────────────────────────
    def _norm(s):
        if not s: return ''
        s = unicodedata.normalize('NFD', s)
        s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
        return s.strip().upper()

    seen_phone: set = set()
    seen_name: set = set()
    prospects = []
    for row in prospects_raw:
        pd = dict(row)
        digits = ''.join(c for c in (pd.get('telephone') or '') if c.isdigit())
        tel_key = digits[-9:] if len(digits) >= 8 else ''
        name_key = f"{_norm(pd.get('nom') or '')}|{_norm(pd.get('prenom') or '')[:3]}"
        if tel_key and tel_key in seen_phone:
            continue
        if name_key.strip('|') and name_key in seen_name:
            continue
        if tel_key:
            seen_phone.add(tel_key)
        if name_key.strip('|'):
            seen_name.add(name_key)
        prospects.append(pd)

    now = datetime.now()
    agency_nom = current_user.get('agency_nom') or 'ImmoFlash'
    type_label = type_bien or 'tous types'

    budgets = [p['budget_max'] for p in prospects if (p.get('budget_max') or 0) > 0]
    budget_moyen = int(sum(budgets) / len(budgets)) if budgets else 0
    budget_max_val = max(budgets) if budgets else 0

    def fmt_prix(v):
        if not v: return '—'
        return f"{int(v):,}".replace(',', ' ') + ' €'

    def fmt_grand(v):
        if not v: return '—'
        if v >= 1_000_000: return f"{v/1_000_000:.1f}M €"
        return f"{int(v):,}".replace(',', ' ') + ' €'

    def badge_level(budget):
        if not budget: return ('PROSPECT', '#6B7280', '#F3F4F6')
        if budget >= 800_000: return ('PREMIUM', '#059669', '#ECFDF5')
        if budget >= 400_000: return ('QUALIFIÉ', '#2563EB', '#EFF6FF')
        return ('PROSPECT', '#6B7280', '#F3F4F6')

    def fmt_depuis(date_str):
        if not date_str: return None
        try:
            d = datetime.fromisoformat(date_str[:19])
            j = (now - d).days
            if j < 2: return '1 jour'
            if j < 60: return f'{j} jours'
            return f'{j // 30} mois'
        except: return None

    _CLOCK = ('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;">'
              '<circle cx="12" cy="12" r="10" stroke="#6B7280" stroke-width="2"/>'
              '<polyline points="12 6 12 12 16 14" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/></svg>')
    _PIN = ('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="display:inline;vertical-align:middle;margin-right:3px;">'
            '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="#9CA3AF" stroke-width="2"/>'
            '<circle cx="12" cy="10" r="3" stroke="#9CA3AF" stroke-width="2"/></svg>')

    cards_html = ''
    for i, pd in enumerate(prospects):
        nom_display = ' '.join(filter(None, [pd.get('titre'), pd.get('prenom'), pd.get('nom')])).strip() or '—'
        villes_display = (pd.get('villes') or '').replace(',', ', ') or 'Tout secteur'
        budget = pd.get('budget_max')
        budget_str = fmt_prix(budget)
        destination = (pd.get('destination') or '').strip()
        obs = (pd.get('observation') or '').strip()
        # FIX: masquer les observations < 30 chars (notes internes non destinées aux clients)
        show_obs = obs if len(obs) >= 30 else ''
        depuis = fmt_depuis(pd.get('date'))
        badge_text, badge_color, badge_bg = badge_level(budget)

        depuis_chip = (
            f'<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#374151;'
            f'background:#F9FAFB;border:1px solid #E5E7EB;border-radius:20px;padding:3px 10px;margin-left:6px;">'
            f'{_CLOCK} En recherche depuis {depuis}</span>'
        ) if depuis else ''

        dest_html = (
            f'<div style="margin-top:8px;">'
            f'<span style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">Projet&nbsp;</span>'
            f'<span style="font-size:13px;font-weight:600;color:#111827;">{destination}</span>'
            f'</div>'
        ) if destination else ''

        obs_html = (
            f'<div style="margin-top:12px;padding:12px 16px;background:#FAFAF7;border-left:3px solid #E5E7EB;border-radius:0 8px 8px 0;">'
            f'<p style="font-style:italic;font-size:13px;color:#374151;line-height:1.65;margin:0;">"{show_obs}"</p>'
            f'</div>'
        ) if show_obs else ''

        cards_html += f'''
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:12px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
              <div style="width:36px;height:36px;border-radius:50%;background:#1E3A5F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">{i+1:02d}</div>
              <div style="min-width:0;">
                <div style="font-size:16px;font-weight:700;color:#111827;">{nom_display}</div>
                <div style="font-size:13px;color:#6B7280;margin-top:3px;">{_PIN}{villes_display}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:22px;font-weight:800;color:#111827;">{budget_str}</div>
              <span style="display:inline-block;font-size:11px;font-weight:700;color:{badge_color};background:{badge_bg};border:1px solid {badge_color}33;border-radius:20px;padding:2px 10px;margin-top:4px;">{badge_text}</span>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
            <span style="font-size:12px;color:#374151;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:20px;padding:3px 10px;">Budget&nbsp;: {budget_str}</span>
            {depuis_chip}
          </div>
          {dest_html}
          {obs_html}
        </div>'''

    engagement_html = (
        f'<div style="margin-bottom:32px;padding:24px 32px;background:#fff;border-radius:12px;border:1px solid #E5E7EB;">'
        f'<p style="font-size:13px;font-weight:700;color:#1E3A5F;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Notre engagement pour votre bien</p>'
        f'<p style="font-size:14px;color:#374151;line-height:1.75;">Ces acheteurs sont des clients qualifiés, enregistrés et suivis personnellement par notre équipe. '
        f'Chacun a exprimé une recherche active pour un bien de type <strong>{type_label}</strong>, avec un budget défini et des critères précis. '
        f'Grâce à notre système de matching intelligent <strong>ImmoFlash</strong>, chaque nouveau bien entré dans notre portefeuille est instantanément mis en relation '
        f'avec l\'ensemble de nos acheteurs — garantissant une diffusion immédiate et ciblée. '
        f'Ces profils sont prêts à se positionner rapidement sur un bien correspondant à leurs attentes.</p>'
        f'</div>'
    )

    html = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portefeuille Acheteurs — {type_label} · {agency_nom}</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; background:#F3F4F6; color:#111827; }}
  .wrap {{ max-width:860px; margin:0 auto; padding:32px 20px; }}
  .cover {{ background:linear-gradient(160deg,#0F2545 0%,#1E3A5F 55%,#2D5A8A 100%); color:#fff; border-radius:16px; padding:48px 48px 36px; margin-bottom:28px; }}
  .cover-top {{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }}
  .agency-name {{ font-size:15px; font-weight:600; opacity:.85; }}
  .cover-badge {{ font-size:11px; font-weight:700; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); padding:4px 14px; border-radius:20px; letter-spacing:.05em; }}
  .cover-date {{ font-size:12px; opacity:.6; margin-top:6px; text-align:right; }}
  .cover-sub {{ font-size:12px; font-weight:600; opacity:.5; text-transform:uppercase; letter-spacing:.12em; margin-bottom:12px; }}
  .cover-title {{ font-size:56px; font-weight:900; letter-spacing:-0.03em; line-height:1; }}
  .cover-stats {{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:36px; }}
  .cs {{ text-align:center; }}
  .cs-val {{ font-size:34px; font-weight:800; color:#60A5FA; }}
  .cs-lbl {{ font-size:9px; font-weight:600; opacity:.6; text-transform:uppercase; letter-spacing:.08em; margin-top:4px; }}
  .profiles-header {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }}
  .profiles-title {{ font-size:18px; font-weight:700; color:#1E3A5F; }}
  .profiles-count {{ font-size:13px; color:#6B7280; }}
  .toolbar {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }}
  .tb-btn {{ display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; text-decoration:none; }}
  .tb-back {{ background:#fff; color:#1E3A5F; box-shadow:0 1px 4px rgba(0,0,0,.1); }}
  .tb-pdf {{ background:#1E3A5F; color:#fff; box-shadow:0 2px 8px rgba(30,58,95,.25); }}
  .foot {{ text-align:center; font-size:12px; color:#9CA3AF; padding:24px 0 8px; display:flex; justify-content:space-between; align-items:center; }}
  .foot-brand {{ font-weight:700; color:#1E3A5F; letter-spacing:-.01em; }}
  .foot-brand span {{ color:#60A5FA; }}
  @media print {{
    * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }}
    body {{ background:#fff; }}
    .no-print {{ display:none !important; }}
    .cover {{ border-radius:0; margin:0 0 24px; }}
    .wrap {{ padding:0; max-width:100%; }}
  }}
</style>
</head>
<body>
<div class="wrap">
  <div class="toolbar no-print">
    <button onclick="window.opener ? window.close() : history.back()" class="tb-btn tb-back">&#8592; Retour</button>
    <button onclick="window.print()" class="tb-btn tb-pdf">&#8615; T&eacute;l&eacute;charger PDF</button>
  </div>

  <div class="cover">
    <div class="cover-top">
      <div>
        <div class="agency-name">{agency_nom}</div>
      </div>
      <div style="text-align:right;">
        <div class="cover-badge">CONFIDENTIEL</div>
        <div class="cover-date">{now.strftime('%d %B %Y').capitalize()}</div>
      </div>
    </div>
    <div class="cover-sub">Document de prospection commerciale</div>
    <div class="cover-title">Portefeuille<br>Acheteurs</div>
    <div class="cover-stats">
      <div class="cs"><div class="cs-val">{len(prospects)}</div><div class="cs-lbl">Acheteurs qualifi&eacute;s</div></div>
      <div class="cs"><div class="cs-val" style="color:#93C5FD;">{fmt_grand(budget_moyen)}</div><div class="cs-lbl">Budget moyen</div></div>
      <div class="cs"><div class="cs-val" style="color:#93C5FD;">{fmt_grand(budget_max_val)}</div><div class="cs-lbl">Budget maximum</div></div>
      <div class="cs"><div class="cs-val" style="color:#93C5FD;">—</div><div class="cs-lbl">Surface moy. recherch&eacute;e</div></div>
    </div>
  </div>

  {engagement_html}

  <div class="profiles-header">
    <div class="profiles-title">Profils acheteurs</div>
    <div class="profiles-count">{len(prospects)} profil{"s" if len(prospects) != 1 else ""} &middot; tri&eacute;s par budget</div>
  </div>

  {cards_html if cards_html else '<p style="text-align:center;color:#9CA3AF;padding:48px;">Aucun acheteur correspondant.</p>'}

  <div class="foot">
    <div style="color:#9CA3AF;">ImmoFlash &middot; Document confidentiel &middot; {now.strftime('%d/%m/%Y')}<br>G&eacute;n&eacute;r&eacute; pour {agency_nom} &middot; Usage interne et commercial exclusivement</div>
    <div class="foot-brand">Immo<span>Flash</span></div>
  </div>
</div>
</body>
</html>'''

    return HTMLResponse(content=html)
