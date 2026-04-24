import { useState } from 'react'

/* ════════════════════════════════════════════════════════════════
   SHOWCASE — Tous les composants / assets de la landing ImmoFlash
   Accès : /showcase
   ════════════════════════════════════════════════════════════════ */

/* ── Bloc de section ── */
function Block({ title, children }) {
  return (
    <div style={{ marginBottom: '3.5rem' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Variante labellisée ── */
function Variant({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      {children}
      <span style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace' }}>{label}</span>
    </div>
  )
}

/* ── Score badge /100 ── */
function ScoreBadge({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444'
  const bg    = score >= 80 ? 'rgba(34,197,94,0.1)' : score >= 55 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: bg, border: `1.5px solid ${color}`, borderRadius: 12, padding: '10px 18px', minWidth: 72 }}>
      <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-1px' }}>{score}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, marginTop: 2 }}>/100</span>
    </div>
  )
}

/* ── Email preview ── */
function EmailPreview() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, width: 340, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fee2e2' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fef3c7' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dcfce7' }} />
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8, fontFamily: 'monospace' }}>Brouillon généré par ImmoFlash</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>À : <span style={{ color: '#0f172a' }}>sophie.martin@gmail.com</span></p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px' }}>Objet : <span style={{ color: '#0f172a', fontWeight: 600 }}>Le bien qui correspond à vos critères — réf. #2847</span></p>
        <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 10px' }} />
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>Bonjour Sophie,</p>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>J'ai pensé à vous en voyant ce T3 lumineux à Antibes — 68 m², calme absolu, garage inclus, à 345 000 €.</p>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>Il correspond à <strong style={{ color: '#0f172a' }}>92/100</strong> de vos critères. Je peux vous organiser une visite cette semaine.</p>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f172a', borderRadius: 8, padding: '6px 14px' }}>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Envoyer</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  )
}

/* ── Chat preview Agent IA ── */
function ChatPreview() {
  return (
    <div style={{ background: '#0f172a', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, width: 360, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Agent IA — ImmoFlash</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* User */}
        <div style={{ alignSelf: 'flex-end', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px', maxWidth: '85%' }}>
          <p style={{ fontSize: 12, color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>Quel bien correspond le mieux à Sophie, budget 350k, cherche du calme et un garage ?</p>
        </div>
        {/* Agent */}
        <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px', padding: '8px 12px', maxWidth: '90%' }}>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px', lineHeight: 1.5 }}>Meilleur match pour Sophie :</p>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '6px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 12, color: '#e2e8f0', margin: 0, fontWeight: 600 }}>T3 Antibes — 68 m² · 345 000 €</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Score <strong style={{ color: '#22c55e' }}>92/100</strong> · Calme, garage, budget OK</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Matching split preview ── */
function MatchingPreview() {
  const biens = [
    { ref: '#2847', label: 'T3 Antibes 68m²', score: 92, color: '#22c55e' },
    { ref: '#1923', label: 'T4 Nice Centre 85m²', score: 71, color: '#f59e0b' },
    { ref: '#3301', label: 'Studio Cannes 32m²', score: 38, color: '#ef4444' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: 460 }}>
      {/* Prospect */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>Prospect</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Sophie Martin</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[['Budget', '< 350 000 €'], ['Surface', '≥ 60 m²'], ['Secteur', 'Antibes / Nice'], ['Critères', 'Calme · Garage']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{k}</span>
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Biens scorés */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Matchings</p>
        {biens.map(b => (
          <div key={b.ref} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>{b.label}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{b.ref}</p>
            </div>
            <div style={{ background: `${b.color}18`, border: `1.5px solid ${b.color}`, borderRadius: 8, padding: '3px 7px', textAlign: 'center', minWidth: 44 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: b.color, lineHeight: 1 }}>{b.score}</span>
              <span style={{ fontSize: 9, color: b.color, display: 'block', opacity: 0.7 }}>/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Pricing card ── */
function PricingCardPreview({ name, price, subtitle, badge, features, cta, featured }) {
  return (
    <div style={{
      background: '#0f1e30', border: featured ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '1.5rem', width: 200,
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: featured ? '0 0 40px rgba(56,189,248,0.12)' : 'none',
    }}>
      {badge && <span style={{ background: '#38bdf8', color: '#0f1e30', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, alignSelf: 'flex-start' }}>{badge}</span>}
      <div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>{name}</p>
        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{price}€</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>HT / mois</span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, color: '#cbd5e1', fontSize: 12 }}>
            <span style={{ flexShrink: 0, width: 15, height: 15, borderRadius: '50%', background: featured ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)', color: featured ? '#38bdf8' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, marginTop: 1 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto', background: featured ? '#38bdf8' : 'transparent', border: featured ? 'none' : '1px solid rgba(255,255,255,0.2)', color: featured ? '#0f1e30' : '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>
        {cta}
      </div>
    </div>
  )
}

/* ── FAQ item ── */
function FaqPreview() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ width: 420, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '1rem 1.25rem', cursor: 'pointer', background: '#fff' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Comment ImmoFlash importe mes biens ?</span>
        <span style={{ fontSize: 20, color: '#64748b', flexShrink: 0, lineHeight: 1, transition: 'transform 200ms', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && (
        <div style={{ padding: '0 1.25rem 1rem', background: '#fff' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>Depuis Hektor, un fichier Excel ou CSV, ou en saisie manuelle. L'import prend moins de 5 minutes.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════ */
export default function Showcase() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', padding: '3rem 2rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Immo<span style={{ color: '#38bdf8' }}>Match</span>
            </span>
            <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>Design System</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Tous les composants et assets de la landing — fond blanc pour capture.</p>
        </div>

        {/* ── 1. COULEURS ── */}
        <Block title="Palette de couleurs">
          {[
            { name: '#0f172a', label: 'Slate 900 — Dark base' },
            { name: '#1E3A5F', label: 'Navy — Accent sombre' },
            { name: '#38bdf8', label: 'Sky 400 — Accent principal' },
            { name: '#7dd3fc', label: 'Sky 300 — Accent léger' },
            { name: '#22c55e', label: 'Green — Score fort' },
            { name: '#f59e0b', label: 'Amber — Score moyen' },
            { name: '#ef4444', label: 'Red — Score faible' },
            { name: '#64748b', label: 'Slate 500 — Texte secondaire' },
            { name: '#94a3b8', label: 'Slate 400 — Texte tertiaire' },
            { name: '#e2e8f0', label: 'Slate 200 — Bordures' },
            { name: '#f8fafc', label: 'Slate 50 — Fond clair' },
          ].map(c => (
            <Variant key={c.name} label={c.name}>
              <div style={{ width: 60, height: 60, borderRadius: 10, background: c.name, border: '1px solid rgba(0,0,0,0.06)' }} />
              <span style={{ fontSize: 11, color: '#64748b', maxWidth: 80, lineHeight: 1.4 }}>{c.label}</span>
            </Variant>
          ))}
        </Block>

        {/* ── 2. TYPOGRAPHIE ── */}
        <Block title="Typographie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <Variant label="H1 — Hero (clamp 36–64px, 800)">
              <p style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.08 }}>Votre prochaine vente<br /><span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>est dans votre fichier.</span></p>
            </Variant>
            <Variant label="H2 — Section (clamp 26–40px, 800)">
              <p style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', margin: 0 }}>Ce qui nous rend incontournables.</p>
            </Variant>
            <Variant label="H3 — Card (clamp 18–22px, 700)">
              <p style={{ fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', margin: 0, lineHeight: 1.3 }}>Le bon acheteur pour le bon bien.</p>
            </Variant>
            <Variant label="Label — Feature (11px, 700, uppercase, #38bdf8)">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Matching IA</p>
            </Variant>
            <Variant label="Body — 14–16px, #64748b, lh 1.75">
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0, maxWidth: 520 }}>ImmoFlash croise budget, localisation, style de vie et te sort un score /100. Les meilleures paires remontent tout seules. Toi tu valides.</p>
            </Variant>
            <Variant label="Mention — 13px, #334155">
              <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>Aucune carte bancaire · Opérationnel en 24h · Vos vraies données</p>
            </Variant>
          </div>
        </Block>

        {/* ── 3. BADGES / PILLS ── */}
        <Block title="Badges & Pills">
          <Variant label="Badge section (sky)">
            <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fonctionnalités</span>
          </Variant>
          <Variant label="Badge hero (sky dim)">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.08)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>IA pour agents immobiliers</span>
          </Variant>
          <Variant label="Badge filled (pricing)">
            <span style={{ background: '#38bdf8', color: '#0f1e30', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>Recommandé</span>
          </Variant>
          <Variant label="Badge solution (dark)">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', background: '#38bdf8', borderRadius: 999, padding: '3px 10px' }}>Solution</span>
          </Variant>
          <Variant label="Badge lancement (locked)">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.08)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 500 }}>
              Tarif garanti à vie pour les premières agences
            </span>
          </Variant>
          <Variant label="Badge instant (after)">
            <span style={{ fontSize: 11, color: '#0f172a', background: 'rgba(56,189,248,0.9)', borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>Instant</span>
          </Variant>
        </Block>

        {/* ── 4. BOUTONS ── */}
        <Block title="Boutons">
          <Variant label="btn-primary">
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#38bdf8', color: '#0f172a', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Demander une démo
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </Variant>
          <Variant label="btn-ghost-light">
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600, textDecoration: 'none', backdropFilter: 'blur(4px)' }}>
              Voir comment ça marche
            </a>
          </Variant>
          <Variant label="btn-filled-dark (pricing)">
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'block', background: '#38bdf8', color: '#0f1e30', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Demander une démo
            </a>
          </Variant>
          <Variant label="btn-outline-white (pricing)">
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'block', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Commencer
            </a>
          </Variant>
          <Variant label="btn-cta-large (final section)">
            <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#38bdf8', color: '#0f172a', borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Demander une démo gratuite
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </Variant>
        </Block>

        {/* ── 5. SCORE /100 ── */}
        <Block title="Score badge /100">
          <Variant label="Fort ≥ 80 (vert)"><ScoreBadge score={92} /></Variant>
          <Variant label="Moyen 55–79 (orange)"><ScoreBadge score={71} /></Variant>
          <Variant label="Faible < 55 (rouge)"><ScoreBadge score={38} /></Variant>
          <Variant label="Score inline (text)">
            <span style={{ fontSize: 24, fontWeight: 800, color: '#22c55e', letterSpacing: '-0.5px' }}>92<span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>/100</span></span>
          </Variant>
        </Block>

        {/* ── 6. TIMELINE DOT ── */}
        <Block title="Timeline dot">
          <Variant label="Dot + radar pulse">
            <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <style>{`
                @keyframes radarPulse {
                  0% { transform: scale(1); opacity: 0.6; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
                .showcase-dot::after {
                  content: '';
                  position: absolute;
                  width: 10px; height: 10px;
                  border-radius: 50%;
                  background: rgba(100,116,139,0.4);
                  animation: radarPulse 2s ease-out infinite;
                }
              `}</style>
              <div className="showcase-dot" style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: '#64748b', boxShadow: '0 0 0 3px rgba(100,116,139,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </div>
          </Variant>
          <Variant label="Ligne timeline (1px, #cbd5e1)">
            <div style={{ width: 2, height: 120, background: 'linear-gradient(to bottom, transparent, #cbd5e1 15%, #cbd5e1 85%, transparent)', borderRadius: 2 }} />
          </Variant>
        </Block>

        {/* ── 7. MATCHING SPLIT ── */}
        <Block title="Asset — Feature 1 · Matching split (prospect + scores)">
          <MatchingPreview />
        </Block>

        {/* ── 8. EMAIL PREVIEW ── */}
        <Block title="Asset — Feature 3 · Email généré">
          <EmailPreview />
        </Block>

        {/* ── 9. CHAT AGENT IA ── */}
        <Block title="Asset — Feature 2 · Chat Agent IA">
          <ChatPreview />
        </Block>

        {/* ── 10. AVANT / APRÈS rows ── */}
        <Block title="Avant / Après — rows">
          {/* Avant item */}
          <Variant label="Before item (animé)">
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.25rem', width: 280 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Sans ImmoFlash</p>
              {[
                { text: 'Exporter les biens manuellement', note: '5 min' },
                { text: 'Parcourir les fiches prospect', note: '20 min' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#64748b', flex: 1 }}>{item.text}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.note}</span>
                  </div>
                  <div style={{ marginTop: 6, height: 2, background: '#f1f5f9', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: '80%', background: '#cbd5e1', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Total</span>
                <span style={{ color: '#475569', fontWeight: 700, fontSize: 20 }}>~55 min</span>
              </div>
            </div>
          </Variant>
          {/* Après item */}
          <Variant label="After item (dark)">
            <div style={{ background: 'linear-gradient(150deg, #071220 0%, #0b1e38 60%, #0c2647 100%)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 16, padding: '1rem 1.25rem', width: 280, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.85), transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Avec ImmoFlash</p>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', background: '#38bdf8', borderRadius: 999, padding: '2px 8px' }}>Solution</span>
              </div>
              {['Synchronisation auto du portefeuille', 'Score /100 calculé en temps réel'].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#cbd5e1', flex: 1 }}>{text}</span>
                  <span style={{ fontSize: 10, color: '#0f172a', background: 'rgba(56,189,248,0.9)', borderRadius: 999, padding: '2px 7px', fontWeight: 700 }}>Instant</span>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Total</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 24, letterSpacing: '-1px' }}>30s</span>
              </div>
            </div>
          </Variant>
          {/* Arrow badge */}
          <Variant label="Arrow badge (centre)">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f172a', border: '1.5px solid rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(56,189,248,0.25)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Variant>
        </Block>

        {/* ── 11. PRICING CARDS ── */}
        <Block title="Pricing cards">
          <PricingCardPreview
            name="Starter" price="49" subtitle="Idéal pour démarrer"
            features={["Jusqu'à 50 biens", "20 matchings / mois", "Import Hektor", "Support email"]}
            cta="Commencer" featured={false}
          />
          <PricingCardPreview
            name="Pro" price="99" subtitle="Pour les agences actives" badge="Recommandé"
            features={["Biens illimités", "Matchings illimités", "Emails IA générés", "Dashboard + historique", "Agent IA intégré"]}
            cta="Demander une démo" featured={true}
          />
          <PricingCardPreview
            name="Agence+" price="199" subtitle="Multi-agents, marque blanche"
            features={["Tout le plan Pro", "Multi-utilisateurs (5 agents)", "Rapports mensuels auto", "Marque blanche"]}
            cta="Nous contacter" featured={false}
          />
        </Block>

        {/* ── 12. FAQ ITEM ── */}
        <Block title="FAQ accordion item">
          <FaqPreview />
        </Block>

        {/* ── 13. STAT / CHIFFRE CLÉ ── */}
        <Block title="Stats & chiffres clés">
          <Variant label="30s (highlight bleu)">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 48, letterSpacing: '-2px', lineHeight: 1 }}>30s</span>
            </div>
          </Variant>
          <Variant label="~55 min (grey)">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#475569', fontWeight: 700, fontSize: 36, letterSpacing: '-1px', lineHeight: 1 }}>~55 min</span>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>par session</span>
            </div>
          </Variant>
          <Variant label="5–8h / semaine">
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              En moyenne, nos clients récupèrent{' '}
              <strong style={{ color: '#0f172a' }}>5 à 8 heures par semaine et par agent.</strong>
            </p>
          </Variant>
        </Block>

        {/* ── 14. LOGOS ── */}
        <Block title="Logos partenaires">
          {(() => {
            const b = import.meta.env.BASE_URL
            return [
            { src: `${b}logo/b&b.png`, alt: 'B&B', h: 60 },
            { src: `${b}logo/rastel.png`, alt: 'Rastel', h: 56 },
            { src: `${b}logo/saintfrancois.png`, alt: 'Saint-François', h: 64 },
            { src: `${b}logo/sierra.png`, alt: 'Sierra', h: 52 },
            { src: `${b}logo/revedesud.svg`, alt: 'Rêve du Sud', h: 56 },
            { src: `${b}logo/intramuros.jpg`, alt: 'Intramuros', h: 48 },
            ]
          })().map((logo, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 90 }}>
                <img src={logo.src} alt={logo.alt} style={{ height: logo.h, width: 'auto', opacity: 0.8, filter: 'grayscale(20%)' }} />
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{logo.alt}</span>
            </div>
          ))}
        </Block>

        {/* Footer de la page showcase */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: 12, margin: 0 }}>ImmoFlash Design System — usage interne · <a href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Retour landing</a></p>
        </div>

      </div>
    </div>
  )
}
