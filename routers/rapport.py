import os
import re
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import HTMLResponse
from jose import jwt

from agencies_db import get_db_path
from routers.auth import get_current_user
from routers.matchings import _ensure_presentations_table
from config import AUTH_CONFIG, APP_BASE_URL


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
        WHERE m.bien_id = ? AND m.score >= 65
          AND (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
          AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
        LIMIT 10
    ''', (bien_id,)).fetchall()

    # Suivi commercial : preuve d'activite pour le vendeur — a qui le bien a
    # deja ete propose (email) ou presente (visite), tous scores confondus.
    _ensure_presentations_table(conn)
    envois = conn.execute('''
        SELECT p.nom as prospect_nom, m.date_email_envoye,
               pr.date_presentation as date_presentation, pr.commentaire as commentaire_presentation
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        LEFT JOIN presentations pr ON pr.prospect_id = m.prospect_id AND pr.bien_id = m.bien_id
        WHERE m.bien_id = ? AND (m.date_email_envoye IS NOT NULL OR pr.date_presentation IS NOT NULL)
        ORDER BY COALESCE(pr.date_presentation, m.date_email_envoye) DESC
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

    def fmt_date(d):
        if not d: return None
        try: return datetime.fromisoformat(d).strftime("%d/%m/%Y")
        except Exception: return d[:10]

    # Un événement par démarche (un prospect avec email + visite donne 2 lignes),
    # triés du plus récent au plus ancien.
    envoi_events = []
    for e in envois:
        ed = dict(e)
        if ed.get('date_presentation'):
            envoi_events.append({'type': 'visite', 'nom': ed['prospect_nom'], 'date': ed['date_presentation'], 'note': ed.get('commentaire_presentation')})
        if ed.get('date_email_envoye'):
            envoi_events.append({'type': 'mail', 'nom': ed['prospect_nom'], 'date': ed['date_email_envoye'], 'note': None})
    envoi_events.sort(key=lambda x: x['date'] or '', reverse=True)
    nb_envois = len(envois)

    ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>'
    ICON_VISITE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'

    envoi_rows = ''
    for ev in envoi_events:
        note_html = f'<div class="envoi-note">« {ev["note"]} »</div>' if ev.get('note') else ''
        label = 'Visite réalisée' if ev['type'] == 'visite' else 'Bien proposé par e-mail'
        icon = ICON_VISITE if ev['type'] == 'visite' else ICON_MAIL
        envoi_rows += f'''
        <div class="envoi-row {ev['type']}">
          <span class="envoi-ic">{icon}</span>
          <div class="envoi-body">
            <div class="envoi-nom-wrap"><div class="envoi-nom">{ev['nom']}</div><div class="envoi-detail">{label}</div>{note_html}</div>
            <span class="envoi-date">{fmt_date(ev['date']) or ''}</span>
          </div>
        </div>'''

    summary_envoi_html = ''
    envoi_section_html = ''
    if nb_envois:
        summary_envoi_html = (
            '<div class="stat">'
            '<svg class="stat-ic" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>'
            f'<div class="stat-val" style="color:#1d4ed8">{nb_envois}</div>'
            '<div class="stat-lbl">Bien proposé à</div>'
            '</div>'
        )
        envoi_section_html = (
            '<div class="envoi-section">'
            f'<div class="section-title">Ce que nous avons déjà fait — {nb_envois} prospect{"s" if nb_envois > 1 else ""} contacté{"s" if nb_envois > 1 else ""}</div>'
            f'{envoi_rows}'
            '</div>'
        )

    prospect_rows = ''
    for i, m in enumerate(matchings):
        md = dict(m)
        sc = md['score']
        prospect_rows += f'''
        <div class="prospect-card">
          <div class="prospect-rank">{i+1}</div>
          <div class="prospect-info">
            <div class="prospect-name">{md["prospect_nom"]}</div>
            <div class="prospect-sub">Budget : {fmt_prix(md["budget_max"])} · {md["prospect_type_recherche"] or "—"}{f' · {md["prospect_villes"]}' if md.get("prospect_villes") else ''}</div>
          </div>
          <div class="score-block" style="background:{score_color(sc)}">
            <div class="score-num">{sc}</div>
            <div class="score-lbl">{score_label(sc)}</div>
          </div>
        </div>'''

    hero_bg = f'<img src="{photo_principale}" alt="" />' if photo_principale else ''

    html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport bien — {b.get("type","Bien")} à {b.get("ville","")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{
      font-family:'Inter',sans-serif; color:#1e293b; padding:44px 20px 60px;
      background:
        radial-gradient(900px 500px at 15% -10%, rgba(96,165,250,0.10), transparent 60%),
        radial-gradient(700px 500px at 100% 10%, rgba(30,58,95,0.06), transparent 55%),
        #eef2f7;
    }}
    .page {{ max-width:900px; margin:0 auto; }}
    .toolbar {{ max-width:900px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }}
    .toolbar-btn {{ display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:.15s; }}
    .btn-back {{ background:white; color:#1E3A5F; box-shadow:0 1px 4px rgba(0,0,0,.1); }}
    .btn-back:hover {{ background:#f1f5f9; }}
    .btn-pdf {{ background:#1E3A5F; color:white; box-shadow:0 2px 8px rgba(30,58,95,.3); }}
    .btn-pdf:hover {{ background:#2D5A8A; }}
    .toolbar-btn svg {{ display:block; }}

    .doc {{ border-radius:22px; overflow:hidden; box-shadow:0 30px 70px -18px rgba(20,35,55,.28); background:#fff; }}

    .topbar {{ background:#1E3A5F; color:#fff; padding:16px 40px; display:flex; justify-content:space-between; align-items:center; }}
    .logo {{ font-size:16px; font-weight:800; letter-spacing:-.03em; }}
    .logo span {{ color:#7dd3fc; }}
    .badge {{ background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.22); padding:5px 13px; border-radius:20px; font-size:11.5px; font-weight:600; letter-spacing:.01em; }}

    .hero {{ position:relative; height:300px; background:linear-gradient(135deg,#1E3A5F,#2D5A8A); }}
    .hero img {{ width:100%; height:100%; object-fit:cover; display:block; }}
    .hero::after {{ content:""; position:absolute; inset:0; z-index:1; background:linear-gradient(to top, rgba(8,16,28,.92) 0%, rgba(8,16,28,.45) 45%, transparent 78%); }}
    .hero-text {{ position:absolute; z-index:2; left:40px; right:40px; bottom:22px; color:#fff; text-shadow:0 2px 10px rgba(0,0,0,.35); }}
    .hero-title {{ font-size:30px; font-weight:800; letter-spacing:-.02em; }}
    .hero-sub {{ display:flex; gap:18px; flex-wrap:wrap; margin-top:7px; font-size:13.5px; opacity:.9; font-variant-numeric:tabular-nums; }}
    .hero-sub b {{ font-weight:700; }}

    .stats {{ display:grid; grid-template-columns:repeat({4 if nb_envois else 3},1fr); background:#f8fafc; border-bottom:1px solid #e6ebf1; }}
    .stat {{ padding:20px 14px; text-align:center; border-right:1px solid #e6ebf1; }}
    .stat:last-child {{ border-right:none; }}
    .stat-ic {{ width:26px; height:26px; margin:0 auto 8px; color:#1E3A5F; }}
    .stat-val {{ font-size:26px; font-weight:800; color:#1E3A5F; font-variant-numeric:tabular-nums; line-height:1; }}
    .stat-lbl {{ font-size:10.5px; color:#64748b; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }}

    .bien-detail {{ padding:26px 40px 4px; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }}
    .detail-item {{ background:#f8fafc; border-radius:10px; padding:12px 16px; }}
    .detail-label {{ font-size:11px; color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }}
    .detail-val {{ font-size:15px; font-weight:700; color:#1e293b; }}

    .desc-section {{ padding:26px 40px 4px; }}
    .desc-text {{ font-size:13px; color:#475569; line-height:1.7; white-space:pre-wrap; }}

    .section-title {{ font-size:15.5px; font-weight:700; color:#1E3A5F; margin-bottom:16px; display:flex; align-items:center; gap:9px; }}
    .section-title::before {{ content:""; display:block; width:4px; height:17px; background:linear-gradient(#1E3A5F,#60a5fa); border-radius:2px; }}

    .pitch {{ padding:26px 40px 4px; }}
    .pitch-box {{ position:relative; padding:16px 22px; background:linear-gradient(135deg,#f0f7ff,#f7fbff); border-radius:12px; }}
    .pitch-box::before {{ content:""; position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:9999px; background:linear-gradient(#1E3A5F,#60a5fa); }}
    .pitch-text {{ font-size:14.5px; color:#2c3e50; line-height:1.7; max-width:66ch; }}
    .pitch-text b {{ color:#1E3A5F; }}

    .method {{ padding:30px 40px 6px; }}
    .method-grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
    .method-card {{ border:1px solid #e6ebf1; border-radius:14px; padding:18px 16px; background:#fbfdff; }}
    .method-ic {{ width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#1E3A5F,#60a5fa); color:#fff; display:flex; align-items:center; justify-content:center; margin-bottom:11px; }}
    .method-ic svg {{ width:17px; height:17px; }}
    .method-h {{ font-size:13.5px; font-weight:700; color:#1E3A5F; margin-bottom:4px; }}
    .method-p {{ font-size:12px; color:#64748b; line-height:1.55; }}

    .envoi-section {{ padding:32px 40px 6px; }}
    .envoi-row {{ display:flex; align-items:flex-start; gap:13px; padding:13px 16px; border-radius:12px; margin-bottom:9px; border-left:3px solid; }}
    .envoi-row.mail {{ background:#f0f9ff; border-color:#38bdf8; }}
    .envoi-row.visite {{ background:#fffbeb; border-color:#f59e0b; }}
    .envoi-ic {{ flex-shrink:0; width:30px; height:30px; border-radius:9999px; display:flex; align-items:center; justify-content:center; margin-top:1px; }}
    .envoi-row.mail .envoi-ic {{ background:#dbeafe; color:#1d4ed8; }}
    .envoi-row.visite .envoi-ic {{ background:#fef3c7; color:#b45309; }}
    .envoi-ic svg {{ width:14px; height:14px; }}
    .envoi-body {{ flex:1; min-width:0; display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; }}
    .envoi-nom {{ font-size:14px; font-weight:700; color:#1e293b; }}
    .envoi-detail {{ font-size:12px; color:#64748b; margin-top:1px; }}
    .envoi-note {{ font-size:11.5px; color:#92702a; margin-top:4px; font-style:italic; }}
    .envoi-date {{ flex-shrink:0; font-size:11.5px; color:#64748b; font-variant-numeric:tabular-nums; font-weight:600; white-space:nowrap; }}

    .prospects-section {{ padding:32px 40px 38px; }}
    .prospect-card {{ display:flex; align-items:center; gap:15px; border:1px solid #e6ebf1; border-radius:14px; padding:14px 18px; margin-bottom:10px; }}
    .prospect-rank {{ flex-shrink:0; width:30px; height:30px; border-radius:9999px; background:linear-gradient(135deg,#1E3A5F,#2D5A8A); color:#fff; font-size:12.5px; font-weight:800; display:flex; align-items:center; justify-content:center; }}
    .prospect-info {{ flex:1; min-width:0; }}
    .prospect-name {{ font-size:14.5px; font-weight:700; color:#1E3A5F; }}
    .prospect-sub {{ font-size:12px; color:#64748b; margin-top:2px; }}
    .score-block {{ flex-shrink:0; padding:9px 15px; border-radius:10px; text-align:center; color:#fff; }}
    .score-num {{ font-size:21px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; }}
    .score-lbl {{ font-size:9px; font-weight:700; opacity:.9; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }}
    .no-match {{ padding:48px; text-align:center; color:#94a3b8; }}

    .footer {{ text-align:center; color:#64748b; font-size:11.5px; padding:22px; letter-spacing:.02em; }}
    .footer b {{ color:#1E3A5F; }}

    @media print {{ * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }} body {{ background:white; padding:0; }} .page {{ max-width:100%; }} .doc {{ box-shadow:none; border-radius:0; }} .no-print {{ display:none !important; }} }}
    @media(max-width:700px) {{
      .topbar,.pitch,.method,.envoi-section,.prospects-section,.bien-detail,.desc-section {{ padding-left:22px; padding-right:22px; }}
      .hero-text {{ left:22px; right:22px; }}
      .stats {{ grid-template-columns:repeat(2,1fr); }}
      .method-grid {{ grid-template-columns:1fr; }}
      .hero {{ height:220px; }}
      .hero-title {{ font-size:23px; }}
    }}
  </style>
</head>
<body>
<div class="toolbar no-print">
  <button onclick="window.opener ? window.close() : history.back()" class="toolbar-btn btn-back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>Retour</button>
  <button onclick="window.print()" class="toolbar-btn btn-pdf"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>Télécharger le PDF</button>
</div>
<div class="page">
  <div class="doc">

    <div class="topbar">
      <div class="logo">Immo<span>Flash</span></div>
      <span class="badge">Synthèse pour le propriétaire</span>
    </div>

    <div class="hero">
      {hero_bg}
      <div class="hero-text">
        <div class="hero-title">{b.get("type","Bien")} à {b.get("ville","")}</div>
        <div class="hero-sub">
          <span><b>{fmt_prix(b.get("prix"))}</b></span>
          {f'<span>{int(b["surface"])} m²</span>' if b.get("surface") else ''}
          {f'<span>{b["pieces"]} pièces</span>' if b.get("pieces") else ''}
          {f'<span>Réf. {b["reference"]}</span>' if b.get("reference") else ''}
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <svg class="stat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/><path d="M17 3.5a4 4 0 010 7"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>
        <div class="stat-val">{len(matchings)}</div><div class="stat-lbl">Profils étudiés</div>
      </div>
      <div class="stat">
        <svg class="stat-ic" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.6 6.6L22 9l-5.6 4.6L18 22l-6-4-6 4 1.6-8.4L2 9l7.4-.4z"/></svg>
        <div class="stat-val" style="color:#10b981">{nb_exc}</div><div class="stat-lbl">Scores excellents</div>
      </div>
      <div class="stat">
        <svg class="stat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z"/><path d="M7 6H4a2 2 0 002 4M17 6h3a2 2 0 01-2 4"/></svg>
        <div class="stat-val">{best}</div><div class="stat-lbl">Meilleur score</div>
      </div>
      {summary_envoi_html}
    </div>

    <div class="bien-detail">
      {f'<div class="detail-item"><div class="detail-label">Surface</div><div class="detail-val">{int(b["surface"])} m²</div></div>' if b.get("surface") else ''}
      {f'<div class="detail-item"><div class="detail-label">Pièces</div><div class="detail-val">{b["pieces"]}</div></div>' if b.get("pieces") else ''}
      {f'<div class="detail-item"><div class="detail-label">Chambres</div><div class="detail-val">{b["chambres"]}</div></div>' if b.get("chambres") else ''}
      {f'<div class="detail-item"><div class="detail-label">État</div><div class="detail-val">{b["etat"]}</div></div>' if b.get("etat") else ''}
      {f'<div class="detail-item"><div class="detail-label">Exposition</div><div class="detail-val">{b["exposition"]}</div></div>' if b.get("exposition") else ''}
    </div>

    {f'<div class="desc-section"><div class="section-title">Description</div><p class="desc-text">{b["description"]}</p></div>' if b.get("description") else ''}

    <div class="pitch">
      <div class="pitch-box">
        <p class="pitch-text">Bonjour, voici où en est la commercialisation de votre bien. Depuis sa mise en vente, nous l'avons activement présenté aux acheteurs de notre portefeuille qui correspondent à votre profil — <b>le détail de ce travail est ci-dessous.</b></p>
      </div>
    </div>

    <div class="method">
      <div class="section-title">Comment nous travaillons pour vous</div>
      <div class="method-grid">
        <div class="method-card">
          <div class="method-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.5L18 9l-4.1 1.5L12 15l-1.9-4.5L6 9l4.1-1.5z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></div>
          <div class="method-h">Analyse continue</div>
          <div class="method-p">Votre bien est comparé à chaque nouvel acheteur qui rejoint notre portefeuille, pas seulement au moment de la mise en vente.</div>
        </div>
        <div class="method-card">
          <div class="method-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg></div>
          <div class="method-h">Au-delà des chiffres</div>
          <div class="method-p">Le projet de chaque acheteur est étudié dans le détail — pas seulement son budget, sa vraie recherche.</div>
        </div>
        <div class="method-card">
          <div class="method-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg></div>
          <div class="method-h">Suivi actif</div>
          <div class="method-p">Chaque envoi et chaque visite sont enregistrés, pour une commercialisation sans angle mort.</div>
        </div>
      </div>
    </div>

    {envoi_section_html}

    <div class="prospects-section">
      <div class="section-title">{len(matchings)} acheteur{"s" if len(matchings) > 1 else ""} potentiel{"s" if len(matchings) > 1 else ""} identifié{"s" if len(matchings) > 1 else ""}</div>
      {prospect_rows if prospect_rows else '<div class="no-match"><p>Aucun matching pour ce bien.</p></div>'}
    </div>
  </div>
  <div class="footer"><b>ImmoFlash</b> · Synthèse confidentielle · {now.strftime("%d/%m/%Y")} · {b.get("type","Bien")} à {b.get("ville","")}</div>
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
               b.etage, b.description, b.reference, b.photos, b.vendeur
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
        # Fiche interne (BienModal, avec agence d'origine) — pas la page publique cote acheteur.
        # BiensPage ne sait matcher que par reference (?ref=) : pas de lien si le bien n'en a pas.
        bien_url = f'{APP_BASE_URL}/dashboard/biens?ref={quote(md["reference"])}' if md.get("reference") else ''
        photo_html = (f'<a href="{bien_url}" target="_blank" rel="noopener"><img src="{photo}" class="bien-photo" alt="Voir la fiche du bien" /></a>' if bien_url
                      else f'<img src="{photo}" class="bien-photo" alt="" />') if photo else ''
        pts_forts = (md.get('points_forts') or '').strip()
        pts_att = (md.get('points_attention') or '').strip()
        recomm = (md.get('recommandation') or '').strip()
        ref_html = f'<div class="matching-ref">Réf. {md["reference"]}</div>' if md.get("reference") else ''
        vendeur = (md.get('vendeur') or '').strip()
        vendeur_html = f'<div class="matching-agence">{vendeur}</div>' if vendeur else ''
        date_envoi = md.get('date_email_envoye')
        if date_envoi:
            try:
                date_envoi_str = datetime.fromisoformat(date_envoi).strftime('%d/%m/%Y')
            except ValueError:
                date_envoi_str = date_envoi[:10]
            propose_html = f'<div class="matching-propose">✓ Déjà proposé le {date_envoi_str}</div>'
        else:
            propose_html = ''
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
              {f'<a href="{bien_url}" target="_blank" rel="noopener" class="matching-title-link"><div class="matching-title">{md["bien_type"]} à {md["ville"]}</div></a>' if bien_url else f'<div class="matching-title">{md["bien_type"]} à {md["ville"]}</div>'}
              <div class="matching-sub">{fmt_prix(md["prix"])} · {int(md["surface"] or 0)} m² · {md["pieces"] or "—"} pièces</div>
              {ref_html}
              {vendeur_html}
              {propose_html}
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
    .bien-photo {{ width:140px; height:105px; object-fit:cover; border-radius:8px; flex-shrink:0; transition:opacity .15s; }}
    .bien-photo:hover {{ opacity:.85; }}
    .matching-info {{ flex:1; min-width:0; }}
    .matching-title-link {{ text-decoration:none; }}
    .matching-title-link:hover .matching-title {{ text-decoration:underline; }}
    .matching-title {{ font-size:15px; font-weight:700; color:#1E3A5F; }}
    .matching-sub {{ font-size:12px; color:#64748b; margin-top:2px; }}
    .matching-ref {{ font-size:11px; color:#94a3b8; margin-top:2px; }}
    .matching-agence {{ display:inline-block; font-size:10px; font-weight:700; color:#1d4ed8; background:#eff6ff; border:1px solid #bfdbfe; border-radius:999px; padding:2px 9px; margin-top:5px; }}
    .matching-propose {{ display:inline-block; font-size:10px; font-weight:700; color:#065f46; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:999px; padding:2px 9px; margin-top:5px; margin-left:5px; }}
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
    <div class="prospect-name">{' '.join(x for x in [p.get('titre'), p.get('prenom'), p.get('nom')] if x and str(x).strip() not in ('', 'None'))}</div>
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


def _extraire_surface_pieces(criteres_txt):
    """Surface min / Pièces min sont saisies en texte libre dans 'criteres'
    (ex: 'Surface min: 45m² | Pièces min: 3') — aucune colonne dédiée n'existe."""
    txt = (criteres_txt or "").lower()
    surf = re.search(r'surface\s+min\s*:\s*(\d+)', txt)
    pieces = re.search(r'pi[eè]ces?\s+min\s*:\s*(\d+)', txt)
    return (int(surf.group(1)) if surf else None, int(pieces.group(1)) if pieces else None)


@router.get("/rapport/portefeuille", response_class=HTMLResponse)
def rapport_portefeuille(
    type_bien: str = Query(...),
    budget_min: Optional[int] = None,
    budget_max: Optional[int] = None,
    current_user: dict = Depends(get_user_from_token_param)
):
    VALID_TYPES = {
        'Maison', 'Appartement', 'T1', 'T2', 'T3', 'T4', 'T5+',
        'Local commercial', 'Immeuble', 'Immeuble de rapport',
        'Maison divisée', 'Terrain', 'Tous biens'
    }
    if type_bien not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Type de bien invalide")

    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    query = """
        SELECT * FROM prospects
        WHERE (archive = 0 OR archive IS NULL)
        AND (demo = 0 OR demo IS NULL)
    """
    params = []
    if type_bien != 'Tous biens':
        # "Tous biens" = tout le portefeuille, sans filtrer sur le champ recherche
        query += " AND (bien LIKE ? OR bien LIKE '%Tous biens%')"
        params.append(f'%{type_bien}%')
    if budget_min:
        query += " AND (budget_max IS NULL OR budget_max >= ?)"
        params.append(budget_min)
    if budget_max:
        query += " AND (budget_max IS NULL OR budget_max <= ?)"
        params.append(budget_max)
    query += " ORDER BY budget_max IS NULL, budget_max DESC"

    prospects = conn.execute(query, params).fetchall()
    conn.close()

    prospects = [dict(p) for p in prospects]
    now = datetime.now()

    budgets = [p['budget_max'] for p in prospects if p.get('budget_max')]
    budget_moyen = int(sum(budgets) / len(budgets)) if budgets else 0
    budget_max_val = int(max(budgets)) if budgets else 0
    surfaces = [s for s, _ in (_extraire_surface_pieces(p.get('criteres')) for p in prospects) if s]
    surface_moy = int(sum(surfaces) / len(surfaces)) if surfaces else 0

    agency_nom = current_user.get('agency_nom', 'ImmoFlash')
    logo_url = current_user.get('agency_logo_url', '')
    couleur = current_user.get('agency_couleur') or '#1E3A5F'

    def fmt_prix(v):
        if not v: return '—'
        try:
            return f"{int(v):,}".replace(',', ' ') + ' €'
        except Exception:
            return '—'

    def full_name(p):
        parts = [p.get('titre'), p.get('prenom'), p.get('nom')]
        return ' '.join(x for x in parts if x and str(x).strip() not in ('', 'None'))

    def budget_tier(v):
        if not v: return 'standard'
        if v >= 800000: return 'premium'
        if v >= 400000: return 'solid'
        return 'standard'

    tier_colors = {'premium': '#10b981', 'solid': '#3b82f6', 'standard': '#94a3b8'}
    tier_labels = {'premium': 'Premium', 'solid': 'Qualifié', 'standard': 'Prospect'}

    cards_html = ''
    for i, p in enumerate(prospects):
        tier = budget_tier(p.get('budget_max'))
        color = tier_colors[tier]

        # Durée de recherche
        d = p.get('date') or p.get('date_ajout')
        jours_str = ''
        date_str = ''
        if d:
            try:
                dt = datetime.fromisoformat(str(d)[:10])
                date_str = dt.strftime('%d/%m/%Y')
                jours = (now - dt).days
                if jours >= 30:
                    mois = jours // 30
                    jours_str = f'En recherche depuis {mois} mois'
                else:
                    jours_str = f'En recherche depuis {jours} jour{"s" if jours > 1 else ""}'
            except Exception:
                pass

        # Budget — budget_min existe en base mais n'est renseigné nulle part dans
        # l'app (aucun formulaire ne l'écrit) : on n'affiche que le budget max réel.
        budget_range = fmt_prix(p.get('budget_max'))

        # Critères
        villes = (p.get('villes') or '').strip()
        villes_display = ', '.join(v.strip() for v in villes.split(',') if v.strip()) or 'Tout secteur'

        surf_min, pieces_min = _extraire_surface_pieces(p.get('criteres'))
        surf_str = f'{surf_min} m² min' if surf_min else None
        pieces_str = f'{pieces_min} pièce{"s" if pieces_min > 1 else ""} min' if pieces_min else None

        dest = (p.get('destination') or '').strip()
        etat = (p.get('etat') or '').strip()

        obs = (p.get('observation') or '').strip()

        # Grille critères
        crit_items = []
        if surf_str:
            crit_items.append(('Surface', surf_str))
        if pieces_str:
            crit_items.append(('Pièces', pieces_str))
        if etat:
            crit_items.append(('État recherché', etat[:40]))
        if dest:
            crit_items.append(('Projet', dest[:40]))

        grid_html = ''
        if crit_items:
            items = ''.join(f'<div class="crit-item"><span class="crit-key">{k}</span><span class="crit-val">{v}</span></div>' for k, v in crit_items)
            grid_html = f'<div class="crit-grid">{items}</div>'

        obs_html = f'<div class="card-obs">"{obs}"</div>' if obs else ''
        name = full_name(p) or 'Prospect qualifié'

        cards_html += f'''
        <div class="prospect-card tier-{tier}">
          <div class="card-header">
            <div class="card-left">
              <div class="card-num" style="background:{color}">{'%02d' % (i + 1)}</div>
              <div class="card-identity">
                <div class="card-name">{name}</div>
                <div class="card-date">{villes_display[:50]}</div>
              </div>
            </div>
            <div class="card-right">
              <div class="card-budget">{fmt_prix(p.get("budget_max"))}</div>
              <div class="card-tier-badge" style="color:{color};border-color:{color}">{tier_labels[tier]}</div>
            </div>
          </div>
          <div class="card-meta-row">
            <span class="meta-budget-range">Budget : {budget_range}</span>
            {f'<span class="meta-since">{jours_str}</span>' if jours_str else (f'<span class="meta-since">Enregistré le {date_str}</span>' if date_str else '')}
          </div>
          {grid_html}
          {obs_html}
        </div>'''

    if not cards_html:
        cards_html = '<div class="empty-state"><p>Aucun prospect actif pour ce type de bien.</p></div>'

    logo_html = f'<img src="{logo_url}" class="agency-logo" alt="{agency_nom}" />' if logo_url else ''

    html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Portefeuille Acheteurs — {type_bien} · {agency_nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *,*::before,*::after{{margin:0;padding:0;box-sizing:border-box;}}
    body{{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;padding:40px 20px;}}
    .toolbar{{max-width:960px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;}}
    .toolbar-btn{{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:all .2s;font-family:inherit;}}
    .btn-back{{background:white;color:#1E3A5F;box-shadow:0 1px 4px rgba(0,0,0,.1);}}
    .btn-back:hover{{background:#f1f5f9;transform:translateX(-3px);box-shadow:0 3px 10px rgba(0,0,0,.15);}}
    .btn-print{{background:{couleur};color:white;box-shadow:0 2px 8px rgba(30,58,95,.3);}}
    .btn-print:hover{{opacity:.9;}}
    .page{{max-width:960px;margin:0 auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.1);}}
    .header{{background:linear-gradient(135deg,{couleur} 0%,#1d4ed8 100%);padding:52px 60px 48px;color:white;position:relative;overflow:hidden;}}
    .header::before{{content:'';position:absolute;top:-80px;right:-80px;width:340px;height:340px;background:rgba(255,255,255,.04);border-radius:50%;pointer-events:none;}}
    .header::after{{content:'';position:absolute;bottom:-60px;left:38%;width:220px;height:220px;background:rgba(255,255,255,.03);border-radius:50%;pointer-events:none;}}
    .header-top{{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;position:relative;z-index:1;}}
    .brand{{display:flex;align-items:center;gap:14px;}}
    .agency-logo{{height:56px;max-width:200px;object-fit:contain;filter:brightness(0) invert(1);}}
    .brand-name{{font-size:20px;font-weight:800;letter-spacing:-.04em;}}
    .brand-name span{{color:#93c5fd;}}
    .brand-sep{{opacity:.3;font-size:18px;margin:0 4px;}}
    .brand-agency{{font-size:14px;font-weight:600;opacity:.75;}}
    .header-meta{{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}}
    .badge-conf{{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;}}
    .badge-date{{font-size:12px;opacity:.55;font-weight:500;}}
    .header-body{{position:relative;z-index:1;}}
    .header-eyebrow{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:.55;margin-bottom:12px;}}
    .header-title{{font-size:46px;font-weight:900;letter-spacing:-.035em;line-height:1.05;margin-bottom:16px;}}
    .header-pill{{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(10px);padding:9px 22px;border-radius:30px;font-size:15px;font-weight:700;margin-bottom:18px;}}
    .header-sub{{font-size:14px;opacity:.65;font-weight:500;}}
    .stats-bar{{display:grid;grid-template-columns:repeat(4,1fr);background:#f8fafc;border-bottom:1px solid #e2e8f0;}}
    .stat{{padding:28px 20px;text-align:center;border-right:1px solid #e2e8f0;}}
    .stat:last-child{{border-right:none;}}
    .stat-val{{font-size:26px;font-weight:800;line-height:1;margin-bottom:7px;}}
    .stat-lbl{{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}}
    .intro-section{{padding:36px 60px;border-bottom:1px solid #f1f5f9;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);}}
    .intro-title{{font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;display:flex;align-items:center;gap:10px;}}
    .intro-title::before{{content:'';width:3px;height:14px;background:linear-gradient(#0ea5e9,#3b82f6);border-radius:2px;display:block;}}
    .intro-text{{font-size:14px;color:#0c4a6e;line-height:1.8;}}
    .cards-section{{padding:40px 60px 60px;}}
    .section-header{{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}}
    .section-title{{font-size:15px;font-weight:700;color:#1E3A5F;display:flex;align-items:center;gap:10px;}}
    .section-title::before{{content:'';width:4px;height:18px;background:linear-gradient(#1E3A5F,#60a5fa);border-radius:2px;display:block;}}
    .section-count{{font-size:12px;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:4px 12px;border-radius:20px;}}
    .prospect-card{{border:1px solid #e2e8f0;border-radius:16px;margin-bottom:12px;overflow:hidden;background:white;}}
    .tier-premium{{border-left:4px solid #10b981;}}
    .tier-solid{{border-left:4px solid #3b82f6;}}
    .tier-standard{{border-left:4px solid #cbd5e1;}}
    .card-header{{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;gap:16px;}}
    .card-left{{display:flex;align-items:center;gap:14px;flex:1;min-width:0;}}
    .card-num{{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;flex-shrink:0;letter-spacing:-.02em;}}
    .card-identity{{flex:1;min-width:0;}}
    .card-name{{font-size:16px;font-weight:700;color:#1e293b;}}
    .card-date{{font-size:11px;color:#94a3b8;margin-top:3px;font-weight:500;}}
    .card-right{{text-align:right;flex-shrink:0;}}
    .card-budget{{font-size:22px;font-weight:800;color:#1E3A5F;letter-spacing:-.02em;white-space:nowrap;}}
    .card-tier-badge{{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:3px 10px;border-radius:20px;border:1.5px solid;display:inline-block;margin-top:5px;}}
    .card-chips{{padding:0 24px 16px;display:flex;flex-wrap:wrap;gap:6px;}}
    .chip{{font-size:12px;font-weight:500;padding:5px 12px;border-radius:20px;background:#f1f5f9;color:#475569;white-space:nowrap;}}
    .chip-loc{{background:#eff6ff;color:#1d4ed8;}}
    .chip-surf{{background:#f0fdf4;color:#166534;}}
    .chip-dest{{background:#fdf4ff;color:#7e22ce;}}
    .card-meta-row{{display:flex;align-items:center;gap:20px;padding:0 24px 12px;flex-wrap:wrap;}}
    .meta-budget-range{{font-size:13px;font-weight:600;color:#1E3A5F;}}
    .meta-since{{font-size:12px;font-weight:600;color:#d97706;background:#fffbeb;padding:3px 10px;border-radius:20px;border:1px solid #fde68a;}}
    .crit-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;padding:0 24px 16px;}}
    .crit-item{{background:#f8fafc;border-radius:10px;padding:8px 12px;}}
    .crit-key{{display:block;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;}}
    .crit-val{{display:block;font-size:13px;font-weight:600;color:#1e293b;}}
    .card-obs{{margin:0 24px 18px;padding:12px 16px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;font-size:13px;color:#78350f;line-height:1.65;font-style:italic;}}
    .empty-state{{padding:80px;text-align:center;color:#94a3b8;font-size:15px;}}
    .footer{{background:#f8fafc;padding:22px 60px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;}}
    .footer-info{{font-size:11px;color:#94a3b8;line-height:1.6;}}
    .footer-brand{{font-size:15px;font-weight:800;letter-spacing:-.03em;color:#1E3A5F;}}
    .footer-brand span{{color:#60a5fa;}}
    @media print{{
      *{{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}}
      body{{background:white;padding:0;}}
      .no-print,.toolbar{{display:none !important;}}
      .page{{box-shadow:none;border-radius:0;max-width:100%;}}
      .header{{border-radius:0;background:linear-gradient(135deg,{couleur} 0%,#1d4ed8 100%) !important;}}
      .prospect-card{{break-inside:avoid;page-break-inside:avoid;box-shadow:none;}}
      .intro-section{{background:#f0f9ff !important;}}
    }}
    @media(max-width:700px){{
      .header{{padding:36px 24px 32px;}}
      .header-title{{font-size:32px;}}
      .stats-bar{{grid-template-columns:repeat(2,1fr);}}
      .intro-section,.cards-section{{padding:24px 20px;}}
      .card-budget{{font-size:18px;}}
      .footer{{padding:18px 20px;flex-direction:column;gap:8px;text-align:center;}}
    }}
  </style>
</head>
<body>

<div class="toolbar no-print">
  <button onclick="window.opener ? window.close() : history.back()" class="toolbar-btn btn-back">&#8592; Retour</button>
  <button onclick="window.print()" class="toolbar-btn btn-print">&#8615;&nbsp; Imprimer / PDF</button>
</div>

<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="brand">
        {logo_html if logo_html else f'<div class="brand-name">Immo<span>Flash</span></div>'}
        <span class="brand-sep">|</span>
        <span class="brand-agency">{agency_nom}</span>
      </div>
      <div class="header-meta">
        <span class="badge-conf">Confidentiel</span>
        <span class="badge-date">{now.strftime("%d")} {["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][now.month-1]} {now.strftime("%Y")}</span>
      </div>
    </div>
    <div class="header-body">
      <div class="header-eyebrow">Document de prospection commerciale</div>
      <div class="header-title">Portefeuille<br>Acheteurs</div>
      <div class="header-pill">{type_bien}</div>
      <div class="header-sub">{len(prospects)} acheteur{"s" if len(prospects) > 1 else ""} qualifié{"s" if len(prospects) > 1 else ""} &nbsp;·&nbsp; Préparé par {agency_nom}</div>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat"><div class="stat-val" style="color:{couleur}">{len(prospects)}</div><div class="stat-lbl">Acheteurs qualifiés</div></div>
    <div class="stat"><div class="stat-val" style="color:#3b82f6">{fmt_prix(budget_moyen) if budget_moyen else "—"}</div><div class="stat-lbl">Budget moyen</div></div>
    <div class="stat"><div class="stat-val" style="color:#10b981">{fmt_prix(budget_max_val) if budget_max_val else "—"}</div><div class="stat-lbl">Budget maximum</div></div>
    <div class="stat"><div class="stat-val" style="color:#8b5cf6">{f"{surface_moy}&nbsp;m²" if surface_moy else "—"}</div><div class="stat-lbl">Surface moy. recherchée</div></div>
  </div>

  <div class="intro-section">
    <div class="intro-title">Notre engagement pour votre bien</div>
    <p class="intro-text">Ces acheteurs sont des clients qualifiés, enregistrés et suivis personnellement par notre équipe. Chacun a exprimé une recherche active pour un bien de type <strong>{type_bien}</strong>, avec un budget défini et des critères précis. Grâce à notre système de matching intelligent <strong>ImmoFlash</strong>, chaque nouveau bien entré dans notre portefeuille est instantanément mis en relation avec l'ensemble de nos acheteurs — garantissant une diffusion immédiate et ciblée. Ces profils sont prêts à se positionner rapidement sur un bien correspondant à leurs attentes.</p>
  </div>

  <div class="cards-section">
    <div class="section-header">
      <div class="section-title">Profils acheteurs</div>
      <span class="section-count">{len(prospects)} profil{"s" if len(prospects) > 1 else ""} &nbsp;·&nbsp; triés par budget</span>
    </div>
    {cards_html}
  </div>

  <div class="footer">
    <div class="footer-info">ImmoFlash &nbsp;·&nbsp; Document confidentiel &nbsp;·&nbsp; {now.strftime("%d/%m/%Y")}<br>Généré pour {agency_nom} &nbsp;·&nbsp; Usage interne et commercial exclusivement</div>
    <div class="footer-brand">Immo<span>Flash</span></div>
  </div>
</div>
</body>
</html>'''

    return HTMLResponse(content=html)
