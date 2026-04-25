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
        ('destination', 'Destination'), ('observation', 'Observation'),
    ]
    for key, label in crit_map:
        val = p.get(key)
        if val and str(val).strip() and str(val) != 'None':
            display = fmt_prix(val) if key == 'budget_max' else str(val)
            criteres_items += f'<div class="crit-item"><span class="crit-label">{label}</span><span class="crit-val">{display}</span></div>'

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
        forts_html = f'<div class="analysis-block forts"><div class="ab-title">✓ Points forts</div><div class="ab-text">{pts_forts}</div></div>' if pts_forts else ''
        att_label = "Points d'attention"
        att_html = f'<div class="analysis-block att"><div class="ab-title">⚠ {att_label}</div><div class="ab-text">{pts_att}</div></div>' if pts_att else ''
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
      {f'<span>📧 {p["mail"]}</span>' if p.get("mail") else ''}
      {f'<span>📞 {p["telephone"]}</span>' if p.get("telephone") else ''}
      {f'<span>📍 {p["domicile"]}</span>' if p.get("domicile") else ''}
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
