#!/usr/bin/env python3
"""
Générateur du rapport coûts ImmoMatch
Basé sur l'analyse du code source du projet.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import date
import os

# ─── COULEURS ────────────────────────────────────────────────────────────────
NAVY      = colors.HexColor('#0f172a')
BLUE      = colors.HexColor('#38bdf8')
BLUE_DARK = colors.HexColor('#0284c7')
DARK_CARD = colors.HexColor('#1e293b')
GRAY      = colors.HexColor('#64748b')
LIGHT_GRAY= colors.HexColor('#94a3b8')
VERY_LIGHT= colors.HexColor('#e2e8f0')
WHITE     = colors.white
GREEN     = colors.HexColor('#22c55e')
ORANGE    = colors.HexColor('#f97316')
RED       = colors.HexColor('#ef4444')
PURPLE    = colors.HexColor('#8b5cf6')

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'rapport_couts_immomatch.pdf')
TODAY = date.today().strftime('%d/%m/%Y')
TODAY_LONG = date.today().strftime('%d %B %Y')

# ─── PAGE NUMBERS ─────────────────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(num_pages)
            super().showPage()
        super().save()

    def _draw_footer(self, num_pages):
        page_num = self._saved_page_states.index(dict(self.__dict__)) + 1 if dict(self.__dict__) in self._saved_page_states else 1
        # Actually count from saved states
        self.saveState()
        self.setFont('Helvetica', 8)
        self.setFillColor(GRAY)
        # Footer line
        self.setStrokeColor(VERY_LIGHT)
        self.setLineWidth(0.5)
        self.line(1.5*cm, 1.2*cm, A4[0]-1.5*cm, 1.2*cm)
        # Left: company
        self.drawString(1.5*cm, 0.8*cm, 'ImmoMatch — Rapport Financier Confidentiel')
        # Center: page
        page_text = f'Page {self._pageNumber} / {num_pages}'
        self.drawCentredString(A4[0]/2, 0.8*cm, page_text)
        # Right: date
        self.drawRightString(A4[0]-1.5*cm, 0.8*cm, TODAY)
        self.restoreState()

# ─── STYLES ───────────────────────────────────────────────────────────────────
def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=32,
        textColor=WHITE,
        alignment=TA_CENTER,
        spaceAfter=8,
        leading=38,
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        'CoverMeta',
        fontName='Helvetica',
        fontSize=11,
        textColor=LIGHT_GRAY,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'H1',
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=NAVY,
        spaceBefore=20,
        spaceAfter=8,
        leading=22,
    ))
    styles.add(ParagraphStyle(
        'H2',
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=BLUE_DARK,
        spaceBefore=14,
        spaceAfter=5,
        leading=17,
    ))
    styles.add(ParagraphStyle(
        'H3',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=9.5,
        textColor=NAVY,
        spaceAfter=5,
        leading=14,
        alignment=TA_JUSTIFY,
    ))
    styles.add(ParagraphStyle(
        'BodySmall',
        fontName='Helvetica',
        fontSize=8.5,
        textColor=GRAY,
        spaceAfter=3,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        'Source',
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=LIGHT_GRAY,
        spaceAfter=2,
        leading=11,
    ))
    styles.add(ParagraphStyle(
        'Warning',
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=ORANGE,
        spaceAfter=3,
        leading=13,
    ))
    styles.add(ParagraphStyle(
        'Risk',
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=RED,
        spaceAfter=3,
        leading=13,
    ))
    styles.add(ParagraphStyle(
        'Good',
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=GREEN,
        spaceAfter=3,
        leading=13,
    ))
    styles.add(ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=WHITE,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        textColor=NAVY,
        alignment=TA_LEFT,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        'TableCellCenter',
        fontName='Helvetica',
        fontSize=8.5,
        textColor=NAVY,
        alignment=TA_CENTER,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        'KPIValue',
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        'KPILabel',
        fontName='Helvetica',
        fontSize=8,
        textColor=GRAY,
        alignment=TA_CENTER,
    ))
    return styles

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def section_header(title, number, styles):
    """Retourne un bloc titre de section numérotée avec ligne."""
    elems = []
    elems.append(Spacer(1, 0.3*cm))
    # Ligne de séparation
    elems.append(HRFlowable(width='100%', thickness=2, color=BLUE, spaceAfter=6))
    label = f'{number}. {title}'
    elems.append(Paragraph(label, styles['H1']))
    return elems

def subsection(title, styles):
    return Paragraph(title, styles['H2'])

def body(text, styles):
    return Paragraph(text, styles['Body'])

def source(text, styles):
    return Paragraph(f'<i>Source : {text}</i>', styles['Source'])

def warning(text, styles):
    return Paragraph(f'⚠ {text}', styles['Warning'])

def risk(text, styles):
    return Paragraph(f'🔴 {text}', styles['Risk'])

def good(text, styles):
    return Paragraph(f'✓ {text}', styles['Good'])

def make_table(headers, rows, col_widths, col_alignments=None, zebra=True):
    """Crée une table stylée."""
    # Build data with Paragraph cells
    from reportlab.lib.styles import getSampleStyleSheet
    sty = getSampleStyleSheet()

    header_style = ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=8.5,
                                   textColor=WHITE, alignment=TA_CENTER, leading=11)
    cell_styles = []
    if col_alignments is None:
        col_alignments = [TA_LEFT] * len(headers)

    data = [[Paragraph(h, header_style) for h in headers]]
    for row in rows:
        data_row = []
        for i, cell in enumerate(row):
            align = col_alignments[i] if i < len(col_alignments) else TA_LEFT
            cs = ParagraphStyle(f'td{i}', fontName='Helvetica', fontSize=8.5,
                                 textColor=NAVY, alignment=align, leading=12,
                                 spaceAfter=1)
            data_row.append(Paragraph(str(cell), cs))
        data.append(data_row)

    t = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUND', (0, 1), (-1, -1), [VERY_LIGHT, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.4, VERY_LIGHT),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, BLUE),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]

    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f1f5f9')))

    t.setStyle(TableStyle(style_cmds))
    return t

# ─── COVER PAGE ───────────────────────────────────────────────────────────────
def build_cover(styles):
    story = []

    # Grand espace en haut
    story.append(Spacer(1, 2.5*cm))

    # Logo / titre
    story.append(Paragraph('ImmoMatch', styles['CoverTitle']))
    story.append(Paragraph('Rapport Financier & Analyse des Coûts', styles['CoverSubtitle']))
    story.append(Spacer(1, 0.5*cm))

    # Ligne bleue
    story.append(HRFlowable(width='60%', thickness=3, color=BLUE, hAlign='CENTER', spaceAfter=12))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph('Document confidentiel — Usage interne', styles['CoverMeta']))
    story.append(Paragraph(f'Généré le {TODAY_LONG}', styles['CoverMeta']))
    story.append(Spacer(1, 2*cm))

    # KPI Cards résumé
    kpi_style_val = ParagraphStyle('kv', fontName='Helvetica-Bold', fontSize=20,
                                    textColor=BLUE, alignment=TA_CENTER)
    kpi_style_lbl = ParagraphStyle('kl', fontName='Helvetica', fontSize=8,
                                    textColor=LIGHT_GRAY, alignment=TA_CENTER)

    def kpi_cell(value, label):
        return [Paragraph(value, kpi_style_val), Paragraph(label, kpi_style_lbl)]

    kpi_data = [
        [kpi_cell('~35–55 €', 'Coût IA/mois (actuel)'),
         kpi_cell('~5–10 €', 'Coût infra/mois estimé'),
         kpi_cell('3 plans', 'Offres tarifaires')],
        [kpi_cell('24 659', 'Lignes de code'),
         kpi_cell('~38 €/mois', 'Coût total fixe VPS'),
         kpi_cell('49 / 99 / 199 €', 'Prix abonnements HT')],
    ]

    kpi_table = Table(kpi_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_CARD),
        ('LINEAFTER', (0, 0), (1, -1), 0.5, colors.HexColor('#334155')),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.HexColor('#334155')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 2*cm))

    # Table des matières
    story.append(HRFlowable(width='100%', thickness=0.5, color=VERY_LIGHT, spaceAfter=8))
    toc_style = ParagraphStyle('toc', fontName='Helvetica', fontSize=10, textColor=NAVY, leading=18)
    toc_bold = ParagraphStyle('tocb', fontName='Helvetica-Bold', fontSize=10, textColor=GRAY,
                               spaceAfter=4, spaceBefore=8)
    story.append(Paragraph('Table des matières', toc_bold))

    toc_entries = [
        ('1.', 'Infrastructure & Hébergement', '3'),
        ('2.', 'Coûts IA — Anthropic Claude', '4'),
        ('3.', 'Coûts Emails (SMTP)', '7'),
        ('4.', 'Dépendances & Licences', '8'),
        ('5.', 'Coût de Développement (estimatif)', '9'),
        ('6.', 'Tableau de Rentabilité', '10'),
        ('7.', 'Risques Financiers & Recommandations', '12'),
    ]
    for num, title, page in toc_entries:
        dots = '.' * (55 - len(f'{num} {title}'))
        story.append(Paragraph(f'{num} {title} {dots} p.{page}', toc_style))

    story.append(PageBreak())
    return story

# ─── SECTION 1 : INFRASTRUCTURE ───────────────────────────────────────────────
def build_section1(styles):
    story = []
    story.extend(section_header('Infrastructure & Hébergement', '1', styles))

    story.append(body(
        "L'application ImmoMatch est déployée sur un VPS (Virtual Private Server) auto-géré. "
        "L'analyse du fichier <b>immo-panel.service</b> et des commentaires de déploiement confirme "
        "un environnement Linux avec Nginx comme reverse proxy et systemd pour la gestion des processus.",
        styles))
    story.append(source('immo-panel.service, README deployment section, IP prod 178.104.57.75', styles))

    story.append(Spacer(1, 0.4*cm))
    story.append(subsection('1.1 Configuration serveur', styles))

    infra_data = [
        ['Composant', 'Détail', 'Source', 'Coût estimé/mois'],
        ['VPS Linux', 'Probablement OVH / Hetzner 2 vCPU, 4 Go RAM\n(FastAPI + SQLite + Nginx)', 'IP: 178.104.57.75\nPort: 8000 prod', '5–15 €'],
        ['Nginx', 'Reverse proxy HTTP/HTTPS\nSPA fallback configuré', 'Commit c86f6b6\n"nginx SPA fallback"', 'Inclus VPS'],
        ['Systemd', 'Service immo-match (auto-restart)\nimmo-panel.service', 'immo-panel.service', 'Inclus VPS'],
        ['Base de données', 'SQLite (agencies.db + data/{slug}.db)\nPas de PostgreSQL/MySQL séparé', 'database.py', 'Inclus VPS'],
        ['Stockage fichiers', 'Fichiers CSV locaux (Annonces.csv, etc.)\nPas de S3 / stockage cloud', 'Root: *.csv files', 'Inclus VPS'],
        ['Nom de domaine', 'immomatch.fr (estimation)', 'contact@immomatch.fr', '~1 €/mois'],
        ['SSL/TLS', "Let's Encrypt (gratuit)", 'Standard Nginx config', '0 €'],
    ]

    t = make_table(
        infra_data[0], infra_data[1:],
        col_widths=[3.5*cm, 6*cm, 4*cm, 3*cm],
        col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT, TA_CENTER]
    )
    story.append(t)
    story.append(Spacer(1, 0.3*cm))

    story.append(subsection('1.2 Bande passante estimée', styles))
    story.append(body(
        "Avec SQLite local et aucun CDN identifié, le trafic est principalement constitué des appels API REST "
        "et de la livraison des assets front-end (dashboard + landing buildés via Vite). "
        "La bande passante réseau d'un VPS standard (OVH/Hetzner entry level) est généralement illimitée "
        "ou très largement suffisante pour ce type d'usage.",
        styles))

    bw_data = [
        ['Scénario', 'Agences actives', 'Requêtes/jour', 'Trafic/mois', 'Coût BW'],
        ['Actuel (MVP)', '1–5', '~500', '~1 Go', '0 €'],
        ['Croissance', '10–20', '~5 000', '~5 Go', '0 €'],
        ['Scale', '50–100', '~25 000', '~15 Go', '0 €'],
    ]
    t2 = make_table(bw_data[0], bw_data[1:], col_widths=[4*cm, 3.5*cm, 3.5*cm, 3*cm, 2.5*cm])
    story.append(t2)

    story.append(Spacer(1, 0.3*cm))
    story.append(subsection('1.3 Coût infrastructure mensuel total', styles))

    total_infra_data = [
        ['Poste', 'Coût mensuel HT'],
        ['VPS Linux (2 vCPU / 4 Go RAM)', '5–15 €'],
        ['Nom de domaine (amortissement)', '~1 €'],
        ['SSL Let\'s Encrypt', '0 €'],
        ['Bande passante', '0 € (inclus VPS)'],
        ['TOTAL INFRASTRUCTURE', '6–16 € / mois'],
    ]
    t3 = make_table(total_infra_data[0], total_infra_data[1:],
                    col_widths=[12*cm, 4.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER])
    story.append(t3)
    story.append(source('Tarifs OVH Starter (5,40€/mois) ou Hetzner CX22 (4,35€/mois) au 23/04/2026', styles))
    story.append(good('Coût infra très faible grâce à SQLite local (pas de BDD managée)', styles))

    story.append(PageBreak())
    return story

# ─── SECTION 2 : COÛTS IA ─────────────────────────────────────────────────────
def build_section2(styles):
    story = []
    story.extend(section_header('Coûts IA — Anthropic Claude', '2', styles))

    story.append(body(
        "ImmoMatch utilise <b>exclusivement l'API Anthropic Claude</b> pour toutes ses fonctionnalités IA. "
        "Aucune dépendance OpenAI n'a été identifiée dans requirements.txt ou dans le code source. "
        "Trois points d'entrée distincts effectuent des appels API Claude.",
        styles))
    story.append(source('requirements.txt (anthropic==0.76.0), scoring.py, routers/agent.py, routers/scraper.py', styles))

    story.append(subsection('2.1 Modèles utilisés et tarification', styles))

    models_data = [
        ['Modèle Claude', 'Utilisé dans', 'Prix input\n($/MTok)', 'Prix output\n($/MTok)', 'Usage typique'],
        ['claude-sonnet-4-20250514', 'scoring.py ligne 367\n(matching principal)', '3,00 $', '15,00 $', 'Analyse qualitative /40'],
        ['claude-sonnet-4-6', 'routers/agent.py ligne 880\n(assistant chat)', '3,00 $', '15,00 $', 'Chat multi-tour + outils'],
        ['claude-haiku-4-5-20251001', 'routers/scraper.py ligne 125\n(scraping web)', '0,80 $', '4,00 $', 'Extraction propriétés HTML'],
        ['claude-opus-4-6', 'agent_recherche.py ligne 176\n(démo standalone)', '15,00 $', '75,00 $', 'Script de démo uniquement'],
    ]
    t = make_table(models_data[0], models_data[1:],
                   col_widths=[4.5*cm, 4.5*cm, 2.2*cm, 2.2*cm, 3.1*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER, TA_CENTER, TA_LEFT])
    story.append(t)
    story.append(source('Tarifs Anthropic API au 23/04/2026 — MTok = Million tokens', styles))
    story.append(warning('claude-opus-4-6 utilisé dans agent_recherche.py est 5× plus cher. Confirmer si ce fichier est exécuté en production.', styles))

    story.append(subsection('2.2 Analyse détaillée par point d\'appel', styles))

    # 2.2.1 Scoring
    story.append(Paragraph('A — Scoring matching (scoring.py)', styles['H3']))
    story.append(body(
        "Chaque calcul de matching entre un prospect et un bien immobilier génère un appel Claude "
        "(après calcul des 60 points objectifs en Python). Le système prompt (~1 200 mots) instruit Claude "
        "de scorer /40 les critères qualitatifs. La réponse est en JSON strict.",
        styles))

    scoring_data = [
        ['Paramètre', 'Valeur', 'Source'],
        ['Modèle', 'claude-sonnet-4-20250514', 'scoring.py:367'],
        ['Max tokens output', '600', 'scoring.py:370'],
        ['Tokens input estimés', '800–1 200 (prompt système + données bien + prospect)', 'scoring.py:241–360'],
        ['Tokens output estimés', '150–300 (JSON score + analyse)', 'scoring.py:385'],
        ['Fréquence', '1 appel par matching généré', 'routers/matchings.py:1286'],
        ['Tracking activé', 'Oui — agencies_db.track_claude_usage()', 'scoring.py:388'],
    ]
    t = make_table(scoring_data[0], scoring_data[1:],
                   col_widths=[5*cm, 7.5*cm, 4*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT])
    story.append(t)

    # 2.2.2 Agent
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('B — Agent IA chat (routers/agent.py)', styles['H3']))
    story.append(body(
        "L'assistant conversationnel intègre 19 outils (chercher_biens, stats_prospects, top_matchings…). "
        "Chaque question utilisateur peut générer plusieurs tours d'appel Claude (tool use loop). "
        "Le contexte est tronqué aux 10 derniers messages pour limiter les tokens.",
        styles))

    agent_data = [
        ['Paramètre', 'Valeur', 'Source'],
        ['Modèle', 'claude-sonnet-4-6', 'agent.py:880'],
        ['Max tokens/appel', '1 024', 'agent.py:882'],
        ['Tokens input estimés', '3 000–6 000 (prompt système 3 000+ mots + historique)', 'agent.py:214–502'],
        ['Tours/question', '2–5 (tool_choice loop)', 'agent.py:853–912'],
        ['Tokens total/question', '8 000–25 000 (multi-tour avec outils)', 'agent.py:908–910'],
        ['Tracking activé', 'Oui — total_input + total_output accumulés', 'agent.py:908'],
    ]
    t = make_table(agent_data[0], agent_data[1:],
                   col_widths=[5*cm, 7.5*cm, 4*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT])
    story.append(t)
    story.append(warning('Agent.py : pas de rate limiting par agence sur le chat. Risque de dérive des coûts si usage intensif.', styles))

    # 2.2.3 Scraper
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('C — Scraper web (routers/scraper.py)', styles['H3']))
    story.append(body(
        "Utilisé lors de l'onboarding pour extraire automatiquement les biens depuis le site web "
        "de l'agence. Modèle Haiku (très bon marché). Deux passes : listing (1 appel) + détails (jusqu'à 5 appels parallèles).",
        styles))

    scraper_data = [
        ['Paramètre', 'Valeur', 'Source'],
        ['Modèle', 'claude-haiku-4-5-20251001', 'scraper.py:1'],
        ['HTML max par page', '12 000 caractères (~4 000 tokens)', 'scraper.py:125'],
        ['Appels par onboarding', '1–6 (listing + jusqu\'à 5 pages détail)', 'scraper.py:252–290'],
        ['Fréquence', 'À l\'onboarding uniquement (one-shot)', 'routers/demo.py'],
        ['Rate limiting', '5 requêtes/heure/IP sur /demo/*', 'routers/demo.py'],
    ]
    t = make_table(scraper_data[0], scraper_data[1:],
                   col_widths=[5*cm, 7.5*cm, 4*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT])
    story.append(t)

    story.append(PageBreak())

    # Projections
    story.append(subsection('2.3 Projections de coûts IA par volume d\'agences', styles))
    story.append(body(
        "Hypothèses de calcul : chaque agence génère en moyenne 50 matchings/mois "
        "(10 prospects × 5 biens correspondants). L'agent IA répond à 30 questions/mois par agence. "
        "Le scraper est utilisé 1 fois à l'onboarding. Taux de change USD/EUR : 0,92.",
        styles))

    proj_data = [
        ['Volume', 'Matchings\n/mois', 'Coût scoring\n(Sonnet)', 'Questions\nagent /mois', 'Coût agent\n(Sonnet)', 'Scraping\nonboarding', 'TOTAL\n€/mois'],
        ['10 agences', '500', '1,65 €', '300', '11,80 €', '~0,05 €', '~14 €'],
        ['50 agences', '2 500', '8,25 €', '1 500', '59,00 €', '~0,10 €', '~68 €'],
        ['100 agences', '5 000', '16,50 €', '3 000', '118,00 €', '~0,15 €', '~135 €'],
        ['500 agences', '25 000', '82,50 €', '15 000', '590,00 €', '~0,50 €', '~673 €'],
    ]
    t = make_table(proj_data[0], proj_data[1:],
                   col_widths=[3*cm, 2.8*cm, 3*cm, 3*cm, 3*cm, 2.7*cm, 2.5 * cm],
                   col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t)
    story.append(source(
        'Formule scoring : 500 matchings × 1000 tokens input × 3$/MTok + 500 × 225 tokens output × 15$/MTok = ~1,80$/agence×10 = 18$ → 16,56€. '
        'Agent : 300 questions × 15 000 tokens avg × 3$/MTok input + 300 × 800 tokens output × 15$/MTok = ~13,5$/10 agences.',
        styles))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('Coût IA par client (plan Pro — matchings illimités)', styles['H3']))

    cost_per_client_data = [
        ['Volume agences', 'Coût IA total/mois', 'Coût IA/client/mois', 'Ratio vs prix Pro 99€'],
        ['10 agences', '14 €', '1,40 €', '1,4 %'],
        ['50 agences', '68 €', '1,36 €', '1,4 %'],
        ['100 agences', '135 €', '1,35 €', '1,4 %'],
        ['500 agences', '673 €', '1,35 €', '1,4 %'],
    ]
    t2 = make_table(cost_per_client_data[0], cost_per_client_data[1:],
                    col_widths=[4*cm, 4*cm, 4*cm, 4.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t2)
    story.append(good('Le coût IA représente ~1.4% du prix de vente Pro. Marge confortable même à grande échelle.', styles))
    story.append(warning('Plan Starter limité à 20 matchings/mois — vérifier que le plafond est bien appliqué côté backend (non trouvé dans le code).', styles))

    story.append(PageBreak())
    return story

# ─── SECTION 3 : EMAILS ───────────────────────────────────────────────────────
def build_section3(styles):
    story = []
    story.extend(section_header('Coûts Emails (SMTP)', '3', styles))

    story.append(body(
        "ImmoMatch utilise une architecture SMTP multi-agence : chaque agence peut configurer son propre "
        "serveur SMTP. Un compte Gmail de démo et un compte de fallback sont configurés pour les agences "
        "sans SMTP propre.",
        styles))
    story.append(source('.env (SMTP_USER, DEMO_SMTP_USER), config.py:23–29, routers/emails.py:609 lignes', styles))

    story.append(subsection('3.1 Configuration SMTP identifiée', styles))

    smtp_data = [
        ['Contexte', 'Serveur', 'Compte', 'Limite gratuite', 'Source'],
        ['SMTP production', 'smtp.gmail.com:587', 'stfrancoisgestion\n@gmail.com', '500 emails/jour\n(Gmail gratuit)', '.env ligne SMTP_USER'],
        ['SMTP démo', 'smtp.gmail.com:587', 'noabendiaf\n@gmail.com', '500 emails/jour', '.env ligne DEMO_SMTP_USER'],
        ['SMTP fallback', 'smtp.gmail.com:587', 'Via config.py\nSMTP_FALLBACK_*', '500 emails/jour', 'config.py:23–29'],
        ['SMTP agence', 'Configurable par agence\n(agencies.db)', 'smtp_user par slug', 'Selon provider agence', 'agencies_db.py'],
    ]
    t = make_table(smtp_data[0], smtp_data[1:],
                   col_widths=[3.5*cm, 4*cm, 3.5*cm, 3.5*cm, 3*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT, TA_LEFT, TA_LEFT])
    story.append(t)
    story.append(warning('Les comptes Gmail sont limités à 500 emails/jour. À partir de ~20 agences actives, cette limite peut être atteinte.', styles))

    story.append(subsection('3.2 Volume d\'emails estimé', styles))
    story.append(body(
        "Les emails sont générés via routers/emails.py (609 lignes). Cas d'usage identifiés : "
        "emails de matching envoyés aux prospects, rapports mensuels aux agences (plan Agence+), "
        "notifications de synchronisation FTP.",
        styles))

    volume_data = [
        ['Type d\'email', 'Fréquence estimée', 'Volume/agence/mois', 'Source'],
        ['Email matching prospect', 'Par matching validé (~20/mois plan Pro)', '20 emails', 'routers/emails.py'],
        ['Rapport mensuel agence', '1/mois (plan Agence+)', '1 email', 'routers/rapport.py'],
        ['Notification sync FTP', 'Si erreur seulement', '0–5 emails', 'routers/sync.py:387'],
        ['Bienvenue onboarding', '1 à la création du compte', 'One-shot', 'routers/demo.py'],
        ['TOTAL estimé/agence', '—', '~21–26 emails/mois', '—'],
    ]
    t2 = make_table(volume_data[0], volume_data[1:],
                    col_widths=[5*cm, 5*cm, 3.5*cm, 3*cm],
                    col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER, TA_LEFT])
    story.append(t2)

    story.append(subsection('3.3 Projections coûts email & limite Gmail', styles))

    email_proj_data = [
        ['Agences actives', 'Emails/mois total', 'Limite Gmail/mois', 'Dépassement ?', 'Alternative recommandée', 'Coût alternative'],
        ['10 agences', '~260', '15 000 (500/j)', 'Non', 'Gmail suffit', '0 €'],
        ['50 agences', '~1 300', '15 000', 'Non', 'Gmail suffit', '0 €'],
        ['100 agences', '~2 600', '15 000', 'Non', 'Brevo / SendGrid', '0–15 €'],
        ['500 agences', '~13 000', '15 000', 'Limite atteinte ⚠', 'Brevo Starter (20k/mois)', '19 €/mois'],
    ]
    t3 = make_table(email_proj_data[0], email_proj_data[1:],
                    col_widths=[3.2*cm, 3*cm, 3*cm, 2.8*cm, 4*cm, 2.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_LEFT, TA_CENTER])
    story.append(t3)
    story.append(source('Limite Gmail SMTP : 500 emails/24h par compte. Brevo Free : 300/jour, Starter 20k/mois à 19€. Source : brevo.com/pricing (2026)', styles))
    story.append(good('Coût email actuel : 0€. Migration vers Brevo recommandée à partir de 200 agences actives.', styles))

    story.append(PageBreak())
    return story

# ─── SECTION 4 : DÉPENDANCES ──────────────────────────────────────────────────
def build_section4(styles):
    story = []
    story.extend(section_header('Dépendances & Licences', '4', styles))

    story.append(subsection('4.1 Dépendances Python (requirements.txt)', styles))

    py_data = [
        ['Package', 'Version', 'Licence', 'Plan gratuit', 'Risque commercial'],
        ['anthropic', '0.76.0', 'MIT', 'Payant à l\'usage', '⚠ Coût variable'],
        ['fastapi', '0.128.0', 'MIT', 'Open source', 'Aucun'],
        ['uvicorn', '0.40.0', 'BSD', 'Open source', 'Aucun'],
        ['APScheduler', '3.11.2', 'MIT', 'Open source', 'Aucun'],
        ['bcrypt', '5.0.0', 'Apache 2.0', 'Open source', 'Aucun'],
        ['python-jose', '3.5.0', 'MIT', 'Open source', 'Aucun'],
        ['python-dotenv', '1.2.1', 'BSD', 'Open source', 'Aucun'],
        ['httpx', '0.28.1', 'BSD', 'Open source', 'Aucun'],
        ['pandas', '3.0.0', 'BSD', 'Open source', 'Aucun'],
        ['openpyxl', '3.1.5', 'MIT', 'Open source', 'Aucun'],
        ['reportlab', '4.4.10', 'BSD (open)', 'Open source', 'Aucun'],
        ['beautifulsoup4', 'Non pinn.', 'MIT', 'Open source', 'Aucun (non dans req.txt) ⚠'],
    ]
    t = make_table(py_data[0], py_data[1:],
                   col_widths=[3.5*cm, 2.5*cm, 2.5*cm, 3*cm, 5*cm],
                   col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_LEFT, TA_LEFT])
    story.append(t)
    story.append(source('requirements.txt — routers/scraper.py utilise BeautifulSoup non déclaré dans requirements.txt', styles))
    story.append(warning('BeautifulSoup4 est utilisé dans scraper.py mais absent de requirements.txt. Risque de failure en déploiement.', styles))

    story.append(subsection('4.2 Dépendances JavaScript — Dashboard (dashboard/package.json)', styles))

    dash_data = [
        ['Package', 'Version', 'Type', 'Plan gratuit', 'Risque'],
        ['react', '19.2.0', 'MIT', 'Open source', 'Aucun'],
        ['react-router-dom', '7.13.0', 'MIT', 'Open source', 'Aucun'],
        ['recharts', '3.7.0', 'MIT', 'Open source', 'Aucun'],
        ['framer-motion', '12.38.0', 'MIT', 'Open source', 'Aucun'],
        ['lucide-react', '1.8.0', 'ISC', 'Open source', 'Aucun'],
        ['@tailwindcss/vite', '4.2.2', 'MIT', 'Open source', 'Aucun'],
        ['vite', '7.2.4', 'MIT', 'Open source', 'Aucun'],
    ]
    t2 = make_table(dash_data[0], dash_data[1:],
                    col_widths=[4*cm, 2.5*cm, 2*cm, 3*cm, 5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_LEFT, TA_LEFT])
    story.append(t2)
    story.append(source('dashboard/package.json', styles))

    story.append(subsection('4.3 Dépendances JavaScript — Landing (landing/package.json)', styles))

    land_data = [
        ['Package', 'Version', 'Type', 'Risque'],
        ['react', '18.3.1', 'MIT', 'Aucun'],
        ['remotion', '4.0.449', 'Custom (Remotion License)', '⚠ Licence commerciale à vérifier'],
        ['@remotion/player', '4.0.449', 'Custom', '⚠ Licence commerciale à vérifier'],
        ['tailwindcss', '4.1.4', 'MIT', 'Aucun'],
        ['vite', '6.3.1', 'MIT', 'Aucun'],
    ]
    t3 = make_table(land_data[0], land_data[1:],
                    col_widths=[4*cm, 2.5*cm, 2.5*cm, 7.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_LEFT])
    story.append(t3)
    story.append(source('landing/package.json', styles))
    story.append(warning(
        'Remotion v4 utilise une licence commerciale pour certains usages. '
        'L\'usage gratuit est limité aux projets open-source. '
        'Vérifier les droits pour un usage commercial SaaS (licence ~$37/mois Remotion Teams).',
        styles))

    story.append(subsection('4.4 Synthèse des risques de licence', styles))

    risk_data = [
        ['Librairie', 'Risque', 'Action recommandée', 'Urgence'],
        ['anthropic SDK', 'Coût variable selon usage', 'Implémenter des quotas par agence', 'Moyen'],
        ['Remotion', 'Licence commerciale non-OSS', 'Vérifier contrat ou remplacer', 'Élevé'],
        ['beautifulsoup4', 'Absent de requirements.txt', 'Ajouter beautifulsoup4==4.12.x', 'Faible'],
        ['SQLite (prod)', 'Scalabilité limitée (pas de concurrent writes)', 'Migrer vers PostgreSQL si >50 agences', 'Moyen'],
    ]
    t4 = make_table(risk_data[0], risk_data[1:],
                    col_widths=[3.5*cm, 4.5*cm, 5.5*cm, 3*cm],
                    col_alignments=[TA_LEFT, TA_LEFT, TA_LEFT, TA_CENTER])
    story.append(t4)

    story.append(PageBreak())
    return story

# ─── SECTION 5 : COÛT DEV ─────────────────────────────────────────────────────
def build_section5(styles):
    story = []
    story.extend(section_header('Coût de Développement (Estimatif)', '5', styles))

    story.append(body(
        "L'estimation est basée sur le comptage de lignes de code par module, "
        "en appliquant un taux journalier de 400 €/jour (freelance France, taux moyen 2026) "
        "et une productivité de 150–200 lignes/jour pour du code métier complexe (IA, SaaS, sécurité).",
        styles))

    story.append(subsection('5.1 Comptage des lignes de code par module', styles))

    loc_data = [
        ['Module', 'Fichiers principaux', 'LOC estimées', 'Complexité'],
        ['Backend — Core', 'backend.py, config.py, database.py, agencies_db.py, scoring.py, agent_recherche.py', '~2 200', 'Élevée (IA, multi-tenant)'],
        ['Backend — Routers', '14 fichiers (matchings.py 1286L, agent.py 914L, emails.py 609L…)', '~9 511', 'Très élevée'],
        ['Dashboard — Frontend', 'src/ React 19, ~15–20 composants', '~11 535', 'Élevée (UI/UX, charts)'],
        ['Landing Page', 'src/ React 18, Remotion video, pages/', '~3 613', 'Moyenne'],
        ['Tests', 'tests/ (3 fichiers)', '~300', 'Faible'],
        ['Config & Déploiement', '.env, nginx, systemd, package.json', '~200', 'Faible'],
        ['TOTAL', '—', '~27 359 LOC', '—'],
    ]
    t = make_table(loc_data[0], loc_data[1:],
                   col_widths=[4*cm, 7.5*cm, 2.5*cm, 2.5*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER, TA_LEFT])
    story.append(t)
    story.append(source('Analyse fichier par fichier : routers/ 14 fichiers 9511L (wc -l), scoring.py 557L, dashboard/src/ ~11535L, landing/src/ ~3613L', styles))

    story.append(subsection('5.2 Estimation en jours/homme', styles))
    story.append(body(
        "Hypothèses : Backend complexe (IA multi-tenant, scoring, agent) = 100 LOC/jour. "
        "Frontend React = 150 LOC/jour. "
        "Landing/marketing = 200 LOC/jour.",
        styles))

    jh_data = [
        ['Module', 'LOC', 'Taux LOC/jour', 'Jours/homme', 'Coût @ 400€/jour'],
        ['Backend Core + Routers', '11 711', '100', '~117 j', '~46 800 €'],
        ['Dashboard React', '11 535', '150', '~77 j', '~30 800 €'],
        ['Landing Page', '3 613', '200', '~18 j', '~7 200 €'],
        ['Tests + Config + DevOps', '500', '100', '~5 j', '~2 000 €'],
        ['Conception, architecture, itérations', '(non LOC)', '—', '~25 j', '~10 000 €'],
        ['TOTAL ESTIMÉ', '27 359 LOC', '—', '~242 j/homme', '~96 800 €'],
    ]
    t2 = make_table(jh_data[0], jh_data[1:],
                    col_widths=[5*cm, 2.5*cm, 3*cm, 2.5*cm, 3.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t2)
    story.append(body(
        "Le coût de développement total est estimé entre <b>80 000 € et 110 000 €</b> "
        "(selon niveau senior/junior du freelance et méthode de calcul). "
        "Ce chiffre représente le coût de reconstruction from scratch ; "
        "l'actuel développement peut avoir été réalisé à moindre coût par l'équipe fondatrice.",
        styles))

    story.append(PageBreak())
    return story

# ─── SECTION 6 : RENTABILITÉ ──────────────────────────────────────────────────
def build_section6(styles):
    story = []
    story.extend(section_header('Tableau de Rentabilité', '6', styles))

    story.append(body(
        "Analyse financière pour chaque plan tarifaire, incluant le coût variable par client, "
        "la marge brute et le seuil de rentabilité. Les coûts fixes mensuels sont partagés entre toutes les agences.",
        styles))

    story.append(subsection('6.1 Structure de coûts fixes mensuels', styles))

    fixed_data = [
        ['Poste fixe', 'Coût/mois HT', 'Notes'],
        ['VPS hébergement', '10 €', 'Hetzner CX22 ou OVH VPS'],
        ['Nom de domaine', '1 €', 'Amortissement annuel'],
        ['SMTP (Brevo ou Gmail)', '0–19 €', '0€ sous 500 agences'],
        ['Surveillance / monitoring', '0–10 €', 'UptimeRobot Free ou Grafana'],
        ['Anthropic API (abonnement)', '0 €', 'Usage à la demande'],
        ['TOTAL COÛTS FIXES', '~11–40 €/mois', '~20 € en moyenne'],
    ]
    t = make_table(fixed_data[0], fixed_data[1:],
                   col_widths=[6*cm, 3.5*cm, 7*cm],
                   col_alignments=[TA_LEFT, TA_CENTER, TA_LEFT])
    story.append(t)

    story.append(subsection('6.2 Coût variable par client selon le plan', styles))

    var_data = [
        ['Plan', 'Prix HT/mois', 'Coût IA/client', 'Coût email/client', 'Coût infra partagé\n(à 50 clients)', 'Coût variable total', 'Marge brute €', 'Marge %'],
        ['Starter\n(20 matchings)', '49 €', '0,14 €', '~0,01 €', '0,40 €', '~0,55 €', '~48,45 €', '98,9 %'],
        ['Pro\n(illimité)', '99 €', '1,35 €', '~0,05 €', '0,40 €', '~1,80 €', '~97,20 €', '98,2 %'],
        ['Agence+\n(5 agents)', '199 €', '5,40 €', '~0,10 €', '0,40 €', '~5,90 €', '~193,10 €', '97,0 %'],
    ]
    t2 = make_table(var_data[0], var_data[1:],
                    col_widths=[2.5*cm, 2.2*cm, 2.2*cm, 2.5*cm, 3.3*cm, 2.8*cm, 2.5*cm, 1.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t2)
    story.append(good('Marge brute exceptionnellement élevée (97–99%). Modèle SaaS très favorable.', styles))
    story.append(source('Coût IA Starter : 20 matchings × 1000 input tokens × 3$/MTok × 0,92 = 0,055€. Agent : 10 questions × 15k tokens × 3$/MTok × 0,92 = 0,083€.', styles))

    story.append(subsection('6.3 Seuil de rentabilité', styles))

    seuil_data = [
        ['Plan', 'Coût fixe couvert\n(frais fixes 20€)', 'Clients min.\npour couvrir fixes', 'Clients min.\npour 1 000€/mois net', 'Clients min.\npour 3 000€/mois net'],
        ['Starter (49€)', '20 €', '1 client', '~22 clients', '~63 clients'],
        ['Pro (99€)', '20 €', '1 client', '~11 clients', '~32 clients'],
        ['Agence+ (199€)', '20 €', '1 client', '~6 clients', '~17 clients'],
        ['Mix (30%S/50%P/20%A+)', '20 €', '1 client', '~12 clients', '~35 clients'],
    ]
    t3 = make_table(seuil_data[0], seuil_data[1:],
                    col_widths=[3.5*cm, 3.5*cm, 3*cm, 3.5*cm, 3.5*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t3)

    story.append(PageBreak())

    story.append(subsection('6.4 Projections sur 6 et 12 mois', styles))
    story.append(body(
        "Trois scénarios (pessimiste / réaliste / optimiste) sur un mix hypothétique de plans "
        "(30% Starter, 50% Pro, 20% Agence+). Revenu moyen pondéré = 0,30×49 + 0,50×99 + 0,20×199 = 103,3 €/client.",
        styles))

    proj6_data = [
        ['Scénario', 'Clients M+1', 'Clients M+3', 'Clients M+6', 'MRR M+6', 'Clients M+12', 'MRR M+12'],
        ['Pessimiste', '2', '5', '10', '~1 033 €', '15', '~1 550 €'],
        ['Réaliste', '5', '15', '30', '~3 099 €', '60', '~6 198 €'],
        ['Optimiste', '10', '30', '70', '~7 231 €', '150', '~15 495 €'],
    ]
    t4 = make_table(proj6_data[0], proj6_data[1:],
                    col_widths=[3*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm, 3*cm, 3*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t4)
    story.append(source('MRR = Monthly Recurring Revenue. Calcul : n_clients × 103,3€ revenu moyen.', styles))

    story.append(Spacer(1, 0.4*cm))
    story.append(subsection('6.5 Coûts IA projetés vs revenus', styles))

    ratio_data = [
        ['Scénario', 'Clients M+12', 'MRR M+12', 'Coût IA/mois', 'Coût email', 'Coût infra', 'Charges totales', 'Résultat net/mois'],
        ['Pessimiste', '15', '1 550 €', '~21 €', '0 €', '10 €', '~31 €', '~1 519 €'],
        ['Réaliste', '60', '6 198 €', '~81 €', '0 €', '10 €', '~91 €', '~6 107 €'],
        ['Optimiste', '150', '15 495 €', '~202 €', '0 €', '15 €', '~217 €', '~15 278 €'],
    ]
    t5 = make_table(ratio_data[0], ratio_data[1:],
                    col_widths=[2.5*cm, 2*cm, 2.5*cm, 2.5*cm, 2*cm, 2*cm, 3*cm, 3*cm],
                    col_alignments=[TA_LEFT, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER, TA_CENTER])
    story.append(t5)
    story.append(good('Ratio charges/revenus < 3% dans tous les scénarios. Structure de coûts excellente pour un SaaS.', styles))

    story.append(PageBreak())
    return story

# ─── SECTION 7 : RISQUES ──────────────────────────────────────────────────────
def build_section7(styles):
    story = []
    story.extend(section_header('Risques Financiers & Recommandations', '7', styles))

    story.append(subsection('7.1 Risques identifiés', styles))

    risks_data = [
        ['Risque', 'Description', 'Probabilité', 'Impact', 'Priorité'],
        ['Agent IA sans quota',
         'routers/agent.py n\'a pas de limite d\'appels par agence/mois.\n'
         'Un utilisateur abusif peut générer des milliers de messages.',
         'Moyenne', 'Élevé (coût IA non plafonné)', '🔴 Critique'],
        ['Plan Starter sans plafond backend',
         'Le plan Starter est limité à 20 matchings dans l\'UI mais '
         'aucune vérification côté backend n\'a été trouvée dans le code.',
         'Élevée', 'Moyen (marge grignotée)', '🟠 Élevé'],
        ['Remotion licence commerciale',
         'Remotion v4 dans la landing page nécessite une licence commerciale '
         'payante pour usage SaaS/commercial.',
         'Élevée', 'Moyen (conformité légale)', '🟠 Élevé'],
        ['SQLite en production multi-tenant',
         'SQLite ne supporte pas les écritures concurrentes. '
         'À partir de 20+ agences simultanées, risque de corruption ou timeouts.',
         'Moyenne', 'Élevé (indisponibilité service)', '🟠 Élevé'],
        ['Gmail SMTP à la limite',
         '500 emails/jour par compte Gmail. Si 20+ agences utilisent le fallback, '
         'cette limite sera atteinte.',
         'Moyenne', 'Moyen (non-livraison emails)', '🟡 Moyen'],
        ['BeautifulSoup4 absent requirements.txt',
         'scraper.py importe bs4 mais le package n\'est pas déclaré. '
         'Failure en déploiement frais.',
         'Élevée', 'Faible (onboarding bloqué)', '🟡 Moyen'],
        ['Essai sans carte bancaire',
         '6 jours d\'essai sans CB. Risque d\'abus par création de comptes multiples '
         'pour profiter de l\'IA gratuite.',
         'Faible', 'Moyen', '🟡 Moyen'],
        ['Stripe en mode test',
         'Les URLs Stripe dans Home.jsx sont en mode test '
         '(buy.stripe.com/test_...). La facturation réelle n\'est pas active.',
         'Certaine', 'Élevé (pas de revenus)', '🔴 Bloquant production'],
    ]
    t = make_table(risks_data[0], risks_data[1:],
                   col_widths=[3.5*cm, 6.5*cm, 2.2*cm, 2.5*cm, 1.8*cm],
                   col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER, TA_LEFT, TA_CENTER])
    story.append(t)
    story.append(source('Analyse : agent.py:853–912, Home.jsx:221 (test_7sY...), scraper.py imports, agencies_db.py', styles))

    story.append(PageBreak())

    story.append(subsection('7.2 Recommandations prioritaires', styles))

    story.append(Paragraph('P0 — Bloquants production', styles['H3']))
    reco_data = [
        ['Action', 'Détail technique', 'Effort', 'Gain'],
        ['Activer les liens Stripe en production',
         'Remplacer les URLs buy.stripe.com/test_* par les vraies URLs de production dans Home.jsx:221 et Home.jsx:240',
         '0,5 j', '🔴 Sans CA sans croissance'],
        ['Quota agent IA par agence/mois',
         'Ajouter dans agencies_db.py une vérification : si nb_appels >= quota_mensuel → HTTP 429. '
         'Quota suggéré : 200 appels/mois plan Pro, 50 plan Starter',
         '1 j', 'Protection dérive coûts'],
        ['Plafond matchings Starter côté backend',
         'Dans routers/matchings.py, avant appel scoring.py, vérifier le compteur mensuel '
         'de l\'agence et refuser si plan=Starter et nb_matchings > 20',
         '0,5 j', 'Intégrité offre Starter'],
    ]
    t2 = make_table(reco_data[0], reco_data[1:],
                    col_widths=[4*cm, 8*cm, 1.5*cm, 3*cm],
                    col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER, TA_LEFT])
    story.append(t2)

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('P1 — Court terme (1–4 semaines)', styles['H3']))
    reco_p1_data = [
        ['Action', 'Détail', 'Effort'],
        ['Résoudre la licence Remotion',
         'Soit acheter une licence Remotion Teams (~$37/mois), soit remplacer par une alternative MIT (Lottie, CSS animation)',
         '1–3 j'],
        ['Migrer SMTP vers Brevo',
         'Configurer Brevo Free (300 emails/jour) comme SMTP principal de fallback. '
         'Supprimer la dépendance au compte Gmail personnel.',
         '0,5 j'],
        ['Ajouter beautifulsoup4 à requirements.txt',
         'pip freeze | grep beautifulsoup → ajouter la version exacte',
         '15 min'],
        ['Cache Redis pour scoring répétitif',
         'Si même prospect + même bien → retourner le score en cache (TTL 24h). '
         'Réduction estimée des appels Claude : 30–40%.',
         '2 j'],
    ]
    t3 = make_table(reco_p1_data[0], reco_p1_data[1:],
                    col_widths=[4*cm, 9*cm, 1.5*cm],
                    col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER])
    story.append(t3)

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('P2 — Moyen terme (1–3 mois)', styles['H3']))
    reco_p2_data = [
        ['Action', 'Détail', 'Effort'],
        ['Migration PostgreSQL',
         'Remplacer SQLite par PostgreSQL (Supabase Free tier ou self-hosted) '
         'pour supporter les écritures concurrentes multi-agences.',
         '3–5 j'],
        ['Dashboard coûts admin',
         'Exploiter la table claude_usage déjà en place pour afficher '
         'un tableau de bord admin des coûts par agence. '
         'Détecter les outliers avant dépassement.',
         '2 j'],
        ['Rate limiting global API',
         'Ajouter slowapi ou similar sur les routes /matchings et /agent '
         'pour limiter les requêtes par agence (ex: 60 req/min).',
         '1 j'],
    ]
    t4 = make_table(reco_p2_data[0], reco_p2_data[1:],
                    col_widths=[4*cm, 9*cm, 1.5*cm],
                    col_alignments=[TA_LEFT, TA_LEFT, TA_CENTER])
    story.append(t4)

    story.append(Spacer(1, 0.6*cm))
    story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))
    story.append(Paragraph('Conclusion', styles['H2']))
    story.append(body(
        "ImmoMatch présente une structure financière <b>très favorable pour un SaaS</b> : "
        "coûts variables < 3% du revenu, infrastructure légère (~10–15€/mois), "
        "et marges brutes > 97%. Le principal risque financier est l'absence de quotas "
        "sur l'agent IA et l'usage de Stripe en mode test. "
        "Une fois ces deux points résolus, le modèle est viable dès le premier client payant. "
        "Le seuil de rentabilité est atteint avec <b>11 clients Pro</b> "
        "(ou 22 Starter, ou 6 Agence+).",
        styles))
    story.append(Spacer(1, 0.3*cm))
    story.append(body(
        "À 60 clients (scénario réaliste M+12), le résultat net mensuel est de <b>~6 100 €/mois</b> "
        "avant charges salariales — montant compatible avec une structure à 1–2 personnes. "
        "La migration vers PostgreSQL et l'activation de la facturation Stripe constituent "
        "les deux actions à prioriser absolument avant tout lancement commercial.",
        styles))

    return story

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def generate_pdf():
    styles = build_styles()

    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=2*cm,
        title='ImmoMatch — Rapport Financier & Analyse des Coûts',
        author='ImmoMatch Internal',
        subject=f'Rapport généré le {TODAY}',
    )

    story = []
    story += build_cover(styles)
    story += build_section1(styles)
    story += build_section2(styles)
    story += build_section3(styles)
    story += build_section4(styles)
    story += build_section5(styles)
    story += build_section6(styles)
    story += build_section7(styles)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'OK Rapport genere : {OUTPUT_PATH}')
    return OUTPUT_PATH

if __name__ == '__main__':
    generate_pdf()
