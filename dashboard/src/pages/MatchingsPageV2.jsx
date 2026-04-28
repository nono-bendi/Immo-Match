import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Send, XCircle, ArrowLeft, Zap, AlertTriangle, Lightbulb, ThumbsUp, Share2, Bookmark } from 'lucide-react'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'
import EmailModal from '../components/EmailModal'
import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'

// ─── utils ────────────────────────────────────────────────────────────────────
const ini = (n) => { if (!n) return '??'; const p = n.trim().split(' ').filter(Boolean); return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase() }
const bul = (t) => (t || '').split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
const mon = (v) => v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—'
const dt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
const fPhoto = (s) => { if (!s || typeof s !== 'string') return null; return s.split('|').map(u => u.trim()).find(u => /^https?:\/\//i.test(u)) || null }

const AV_PAL = [['#4f46e5','#7c3aed'],['#0891b2','#06b6d4'],['#059669','#10b981'],['#dc2626','#f97316'],['#9333ea','#ec4899'],['#0d9488','#0ea5e9']]
const avP = (n) => AV_PAL[(n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_PAL.length]

const sC = (s) => s >= 75
  ? { c1:'#6366f1', c2:'#8b5cf6', label:'Excellent', glow:'rgba(99,102,241,0.4)', trackColor:'rgba(99,102,241,0.15)' }
  : s >= 50
    ? { c1:'#f59e0b', c2:'#f97316', label:'Bon match', glow:'rgba(245,158,11,0.4)', trackColor:'rgba(245,158,11,0.15)' }
    : { c1:'#ef4444', c2:'#f43f5e', label:'Faible', glow:'rgba(239,68,68,0.4)', trackColor:'rgba(239,68,68,0.15)' }

// ─── Floating background gems ──────────────────────────────────────────────────
function Gem({ style, color, size, rot = 0 }) {
  return (
    <div style={{
      position: 'absolute', pointerEvents: 'none',
      width: size, height: size,
      background: `linear-gradient(135deg, ${color}55 0%, ${color}18 100%)`,
      border: `1px solid ${color}40`,
      borderRadius: '18%',
      transform: `rotate(${rot}deg)`,
      filter: `blur(0.3px)`,
      boxShadow: `0 0 20px ${color}20, inset 0 1px 0 ${color}30`,
      ...style,
    }} />
  )
}

// ─── Score ring (center column) ────────────────────────────────────────────────
function ScoreRing({ score, size = 110 }) {
  const c = sC(score)
  const inner = Math.round(size * 0.72)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', position: 'relative',
        background: `conic-gradient(from -90deg, ${c.c1} 0% ${score}%, rgba(255,255,255,0.07) ${score}% 100%)`,
        boxShadow: `0 0 32px ${c.glow}, 0 0 60px ${c.glow}`,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: inner, height: inner, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(15,20,40,0.95), rgba(20,15,50,0.9))',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(255,255,255,0.06)`,
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 1 }}>Score</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>{score}</div>
          </div>
        </div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
        color: c.c1, background: c.trackColor,
        border: `1px solid ${c.c1}50`, borderRadius: 9999, padding: '4px 14px',
      }}>{c.label}</div>
    </div>
  )
}

// ─── Hexagonal gem badge (right column) ────────────────────────────────────────
function GemBadge({ score, ville, prix, selected, onClick }) {
  const c = sC(score)
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 10px 6px 6px', borderRadius: 12,
      background: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
      border: `1px solid ${selected ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
      cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
    }}>
      {/* Hexagon gem */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: `linear-gradient(135deg, ${c.c1}, ${c.c2})`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: `drop-shadow(0 2px 8px ${c.c1}70)`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{score}</span>
      </div>
      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ville}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{mon(prix)}</div>
      </div>
    </button>
  )
}

// ─── Expanded bien detail ──────────────────────────────────────────────────────
function BienDetail({ match, mail, nom, onPropose, onRefuse, sending }) {
  const photo = fPhoto(match.bien_photos)
  const forts = bul(match.points_forts).slice(0, 4)
  const atts = bul(match.points_attention).slice(0, 3)
  const refused = match.statut_prospect === 'refused'
  const c = sC(match.score)

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Photo AS BACKGROUND — text overlaid on top */}
      <div style={{
        position: 'relative',
        minHeight: 200,
        background: photo
          ? `linear-gradient(135deg, rgba(8,10,28,0.88) 0%, rgba(8,10,28,0.60) 100%), url(${photo}) center/cover no-repeat`
          : 'rgba(8,10,28,0.5)',
        padding: '20px 24px',
      }}>
        {/* Row 1: bien title + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>{match.bien_type}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: 500 }}>
              {match.bien_ville}{match.bien_surface ? ` · ${match.bien_surface} m²` : ''}{match.bien_pieces ? ` · ${match.bien_pieces} p.` : ''}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.8, flexShrink: 0 }}>
            {mon(match.bien_prix)}
          </div>
        </div>

        {/* Row 2: analysis in 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: points forts + attention */}
          <div>
            {forts.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Zap size={12} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.2 }}>Points forts</span>
                </div>
                {forts.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                    <span style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }}>•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {atts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={12} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1.2 }}>Attention</span>
                </div>
                {atts.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                    <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }}>•</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
            {!forts.length && !atts.length && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Analyse non disponible</div>
            )}
          </div>

          {/* Right: recommandation — floating card on the photo */}
          {match.recommandation && (
            <div style={{
              background: 'rgba(15,20,50,0.75)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                Recommandation
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>
                {match.recommandation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,0,0,0.1)',
      }}>
        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: <ThumbsUp size={14} />, title: refused ? 'Annuler refus' : 'Refuser', action: onRefuse, active: refused },
            { icon: <XCircle size={14} />, title: 'Marquer non intéressé', action: onRefuse, hidden: true },
          ].filter(a => !a.hidden).map((a, i) => (
            <button key={i} onClick={a.action} title={a.title} style={{
              width: 36, height: 36, borderRadius: 10,
              background: a.active ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${a.active ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: a.active ? '#f87171' : 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {a.icon}
            </button>
          ))}
        </div>

        {/* Status tags */}
        {match.date_email_envoye && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9999, padding: '3px 10px' }}>
            ✓ Proposé le {dt(match.date_email_envoye)}
          </span>
        )}
        {refused && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9999, padding: '3px 10px' }}>
            Non intéressé
          </span>
        )}

        {/* Primary CTA */}
        <button onClick={onPropose} disabled={!mail || sending} style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 12,
          background: !mail ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${c.c1}, ${c.c2})`,
          color: !mail ? 'rgba(255,255,255,0.3)' : '#fff',
          border: 'none', fontSize: 13, fontWeight: 700,
          cursor: mail ? 'pointer' : 'default',
          boxShadow: mail ? `0 4px 20px ${c.glow}` : 'none',
          letterSpacing: -0.2,
          transition: 'opacity 0.2s',
        }}>
          <Send size={13} />
          {sending ? 'Envoi…' : match.date_email_envoye ? 'Renvoyer' : 'Envoyer la sélection'}
        </button>
      </div>
    </div>
  )
}

// ─── Prospect card ─────────────────────────────────────────────────────────────
function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing }) {
  const [selId, setSelId] = useState(null)
  const [hovered, setHovered] = useState(false)

  const sorted = [...group.matchings].sort((a, b) => {
    const rA = a.statut_prospect === 'refused' ? 1 : 0
    const rB = b.statut_prospect === 'refused' ? 1 : 0
    return rA - rB || b.score - a.score
  })

  const best = sorted[0]
  const sel = selId ? sorted.find(m => m.id === selId) || best : null

  const [a, b] = avP(group.prospect_nom)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.25)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── 3-column header ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', gap: 0 }}>

        {/* LEFT: Prospect info */}
        <div style={{ padding: '20px 20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            {/* Avatar */}
            <div style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${a}, ${b})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
              boxShadow: `0 4px 16px ${a}60`,
            }}>
              {ini(group.prospect_nom)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: -0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.prospect_nom}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: 500 }}>
                {mon(group.prospect_budget)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9999, padding: '3px 10px',
            }}>
              {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
            </span>

            <button
              onClick={e => onRunSingle(e, group.prospect_id, group.prospect_nom)}
              disabled={analyzing}
              title="Relancer l'analyse"
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* CENTER: Score ring */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 10px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.1)',
        }}>
          {best && <ScoreRing score={best.score} size={110} />}
        </div>

        {/* RIGHT: Gem badges */}
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {sorted.slice(0, 4).map(m => (
            <GemBadge
              key={m.id}
              score={m.score}
              ville={m.bien_ville}
              prix={m.bien_prix}
              selected={sel?.id === m.id}
              onClick={() => setSelId(sel?.id === m.id ? null : m.id)}
            />
          ))}
          {sorted.length > 4 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingLeft: 6, marginTop: 2 }}>
              +{sorted.length - 4} autre{sorted.length - 4 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded bien ── */}
      <div style={{
        maxHeight: sel ? '800px' : '0px',
        opacity: sel ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      }}>
        {sel && (
          <BienDetail
            match={sel}
            mail={group.prospect_mail}
            nom={group.prospect_nom}
            sending={sendingEmail === sel.id}
            onPropose={() => onPropose(sel, group.prospect_mail, group.prospect_nom)}
            onRefuse={() => onRefuse(sel)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MatchingsPageV2() {
  const { agency } = useAgency()
  const agencyNom = agency?.nom || 'ImmoFlash'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filterBienId = searchParams.get('bien') ? parseInt(searchParams.get('bien')) : null

  const [matchings, setMatchings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterScore, setFilterScore] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sendingEmail, setSendingEmail] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const [analyzing, setAnalyzing] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayCompleted, setOverlayCompleted] = useState(false)
  const [totalProspects, setTotalProspects] = useState(0)
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentProspectName, setCurrentProspectName] = useState('')
  const cancelRef = useRef(false)

  const [emailModal, setEmailModal] = useState({ isOpen: false, type: 'confirm', data: null, isLoading: false })
  const [pendingEmail, setPendingEmail] = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({ subject: '', intro: '', points_forts: '', points_attention: '', recommandation: '', conclusion: '', lien_annonce: '' })

  const buildDefault = (m) => ({ subject: `Proposition immobilière - ${m.bien_type} à ${m.bien_ville} | ${agencyNom}`, intro: "Suite à notre échange, j'ai identifié un bien qui pourrait vous intéresser.", points_forts: m.points_forts || '', points_attention: m.points_attention || '', recommandation: m.recommandation || '', conclusion: "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite.", lien_annonce: m.lien_annonce || '' })

  const fetchData = () => { setLoading(true); return apiFetch('/matchings').then(r => r.json()).then(data => { setMatchings(Array.isArray(data) ? data : []); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { fetchData() }, [])

  const runGlobal = async () => {
    cancelRef.current = false; setAnalyzing(true); setShowOverlay(true); setCurrentProspectIndex(0)
    try {
      const prospects = await apiFetch('/prospects').then(r => r.json())
      if (!Array.isArray(prospects) || !prospects.length) { setShowOverlay(false); setAnalyzing(false); return }
      setTotalProspects(prospects.length)
      for (let i = 0; i < prospects.length; i++) {
        if (cancelRef.current) break
        setCurrentProspectIndex(i + 1); setCurrentProspectName(prospects[i].nom || '')
        try { await apiFetch(`/matching/run/${prospects[i].id}`, { method: 'POST' }).then(r => r.json()) } catch {}
      }
      setShowOverlay(false); await fetchData()
      if (!cancelRef.current) { const d = await apiFetch('/matchings').then(r => r.json()); if (d.some(m => m.score >= 80)) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) } }
    } catch { setShowOverlay(false) }
    setAnalyzing(false)
  }

  const runSingle = async (e, id, nom) => {
    e.stopPropagation(); setAnalyzing(true); setShowOverlay(true); setOverlayCompleted(false)
    setTotalProspects(1); setCurrentProspectIndex(1); setCurrentProspectName(nom || '')
    try { const d = await apiFetch(`/matching/run/${id}`, { method: 'POST' }).then(r => r.json()); if (d.error) alert('Erreur: ' + d.error); else await fetchData() } catch { alert("Erreur lors de l'analyse") }
    setOverlayCompleted(true); setTimeout(() => { setShowOverlay(false); setOverlayCompleted(false); setAnalyzing(false) }, 700)
  }

  const openEmail = (match, mail, nom) => {
    if (!mail) { setEmailModal({ isOpen: true, type: 'error', data: { error: "Pas d'email enregistré." }, isLoading: false }); return }
    const draft = sessionStorage.getItem(`emailDraft_${match.id}`)
    const init = draft ? JSON.parse(draft) : buildDefault(match)
    setEmailContent(init); setPendingEmail({ match, prospectMail: mail, prospectNom: nom })
    loadPreview(match, mail, nom, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom: nom, prospectMail: mail, bienType: match.bien_type, bienVille: match.bien_ville, bienPrix: mon(match.bien_prix) }, isLoading: false })
  }

  const loadPreview = async (match, mail, nom, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const ph = fPhoto(match.bien_photos)
      const r = await apiFetch('/preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: ph, custom_intro: content.intro, custom_conclusion: content.conclusion }) })
      const res = await r.json(); setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSend = async () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true })); setSendingEmail(match.id)
    try {
      const ph = fPhoto(match.bien_photos)
      const res = await apiFetch('/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: ph, custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }) }).then(r => r.json())
      if (res.success) { sessionStorage.removeItem(`emailDraft_${match.id}`); await apiFetch(`/matchings/${match.id}/email-sent`, { method: 'PATCH' }); setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, date_email_envoye: new Date().toISOString() } : m)); setEmailModal({ isOpen: true, type: 'success', data: { prospectNom, bienType: match.bien_type, bienVille: match.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false }) }
      else { setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false }) }
    } catch { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Erreur de connexion' }, isLoading: false }) }
    setSendingEmail(null); setPendingEmail(null)
  }

  useEffect(() => { if (emailModal.isOpen && emailModal.type === 'confirm' && pendingEmail) sessionStorage.setItem(`emailDraft_${pendingEmail.match.id}`, JSON.stringify(emailContent)) }, [emailContent])
  const closeEmail = () => { setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false }); setPendingEmail(null); setPreviewHtml(null) }

  const handleRefuse = async (match) => {
    const refused = match.statut_prospect === 'refused'
    try { await apiFetch(`/matchings/${match.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: refused ? null : 'refused' }) }); setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, statut_prospect: refused ? null : 'refused' } : m)) } catch {}
  }

  const filtered = matchings.filter(m => {
    const s = search.toLowerCase()
    if (s && !m.prospect_nom?.toLowerCase().includes(s) && !m.bien_ville?.toLowerCase().includes(s)) return false
    if (filterScore === 'high' && m.score < 75) return false
    if (filterScore === 'medium' && (m.score < 50 || m.score >= 75)) return false
    if (filterScore === 'low' && m.score >= 50) return false
    if (filterBienId && m.bien_id !== filterBienId) return false
    return true
  })

  const grouped = filtered.reduce((acc, m) => {
    if (!acc[m.prospect_id]) acc[m.prospect_id] = { prospect_id: m.prospect_id, prospect_nom: m.prospect_nom, prospect_budget: m.prospect_budget, prospect_mail: m.prospect_mail, matchings: [] }
    acc[m.prospect_id].matchings.push(m); return acc
  }, {})

  const groups = Object.values(grouped).sort((a, b) => {
    if (sortBy === 'recent') return Math.max(...b.matchings.map(m => new Date(m.date_analyse).getTime())) - Math.max(...a.matchings.map(m => new Date(m.date_analyse).getTime()))
    if (sortBy === 'alpha') return (a.prospect_nom || '').localeCompare(b.prospect_nom || '', 'fr')
    return Math.max(...b.matchings.map(m => m.score_pondere ?? m.score)) - Math.max(...a.matchings.map(m => m.score_pondere ?? m.score))
  })

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ margin: '-24px', minHeight: '100vh', position: 'relative', background: 'linear-gradient(135deg, #0d0f1f 0%, #12102e 40%, #0d1520 100%)', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>

      {/* Floating background gems */}
      <Gem style={{ top: '8%',  left: -55 }} color="#4f46e5" size={110} rot={25} />
      <Gem style={{ top: '32%', left: -40 }} color="#7c3aed" size={75}  rot={-18} />
      <Gem style={{ top: '62%', left: -50 }} color="#0891b2" size={90}  rot={42} />
      <Gem style={{ bottom: '8%', left: 10 }} color="#f97316" size={55}  rot={30} />
      <Gem style={{ top: '5%',  right: -55 }} color="#6366f1" size={100} rot={-28} />
      <Gem style={{ top: '42%', right: -45 }} color="#ec4899" size={80}  rot={20} />
      <Gem style={{ bottom: '12%', right: -30 }} color="#8b5cf6" size={65} rot={-12} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '24px 24px 40px' }}>

        <Confetti show={showConfetti} />
        <EmailModal isOpen={emailModal.isOpen} onClose={closeEmail} type={emailModal.type} data={emailModal.data} onConfirm={confirmSend} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
        <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/matchings')} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
            <ArrowLeft size={15} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.8, margin: 0 }}>Matchings</h1>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 6, padding: '3px 9px' }}>Nouveau</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', fontWeight: 500 }}>
              {loading ? 'Chargement…' : `${groups.length} prospect${groups.length > 1 ? 's' : ''} · ${filtered.length} matchings`}
            </p>
          </div>

          <button onClick={runGlobal} disabled={analyzing} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, background: analyzing ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: analyzing ? 'rgba(255,255,255,0.35)' : '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: analyzing ? 'default' : 'pointer', boxShadow: analyzing ? 'none' : '0 4px 20px rgba(99,102,241,0.5)', transition: 'all 0.2s', letterSpacing: -0.2 }}>
            {analyzing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            {analyzing ? 'Analyse…' : 'Analyser'}
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 140 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Prospect ou ville…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 38, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.07)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {[{ v:'all',label:'Tous' },{ v:'high',label:'75+' },{ v:'medium',label:'50–74' },{ v:'low',label:'< 50' }].map(f => (
              <button key={f.v} onClick={() => setFilterScore(f.v)} style={{
                height: 34, padding: '0 14px', borderRadius: 9999,
                background: filterScore === f.v ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                color: filterScore === f.v ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${filterScore === f.v ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ height: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.6)', outline: 'none', cursor: 'pointer' }}>
            <option value="score">Meilleur score</option>
            <option value="recent">Plus récent</option>
            <option value="alpha">A → Z</option>
          </select>
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', height: 140 }} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Aucun matching trouvé</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>{search || filterScore !== 'all' ? 'Essaie d\'élargir les filtres.' : 'Lance une analyse pour trouver des correspondances.'}</p>
            <button onClick={runGlobal} disabled={analyzing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}>
              <Sparkles size={15} /> Lancer l'analyse
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(g => (
              <ProspectCard key={g.prospect_id} group={g} onRunSingle={runSingle} onPropose={(m, mail, nom) => openEmail(m, mail, nom)} onRefuse={handleRefuse} sendingEmail={sendingEmail} analyzing={analyzing} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(255,255,255,0.3) }
        select option { background: #1a1a3e; color: #fff }
        ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-track { background: transparent } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px }
      `}</style>
    </div>
  )
}
