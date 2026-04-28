import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Send, XCircle, ArrowLeft, Zap, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'
import EmailModal from '../components/EmailModal'
import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'

// ─── utils ────────────────────────────────────────────────────────────────────

const initials = (n) => {
  if (!n) return '??'
  const p = n.trim().split(' ').filter(Boolean)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
const bullets = (t) => (t || '').split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
const money = (v) => v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—'
const shortDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
const firstPhoto = (s) => {
  if (!s || typeof s !== 'string') return null
  return s.split('|').map(u => u.trim()).find(u => /^https?:\/\//i.test(u)) || null
}

// Avatar palette — stable per name
const AV = [['#6366f1','#8b5cf6'],['#0ea5e9','#06b6d4'],['#10b981','#059669'],['#f97316','#ef4444'],['#ec4899','#a855f7'],['#14b8a6','#0ea5e9']]
const avGrad = (n) => AV[(n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV.length]

// Score palette
const scoreP = (s) =>
  s >= 75 ? { c1:'#6366f1', c2:'#8b5cf6', label:'Excellent', pill:'rgba(99,102,241,0.1)', text:'#6366f1' }
  : s >= 50 ? { c1:'#f59e0b', c2:'#f97316', label:'Bon match', pill:'rgba(245,158,11,0.1)', text:'#d97706' }
  : { c1:'#ef4444', c2:'#f43f5e', label:'Faible', pill:'rgba(239,68,68,0.1)', text:'#dc2626' }

// ─── Design atoms ─────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 60 }) {
  const p = scoreP(score)
  const inner = Math.round(size * 0.72)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0,
        background: `conic-gradient(from -90deg, ${p.c1} 0% ${score}%, #e2e8f0 ${score}% 100%)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: inner, height: inner, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: Math.round(size * 0.28), fontWeight: 900, color: p.c1, letterSpacing: -0.5, lineHeight: 1 }}>
              {score}
            </span>
          </div>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color: p.text, background: p.pill, borderRadius: 9999, padding: '3px 9px',
        whiteSpace: 'nowrap',
      }}>{p.label}</span>
    </div>
  )
}

function Avatar({ name, size = 48 }) {
  const [a, b] = avGrad(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${a}, ${b})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: Math.round(size * 0.33), fontWeight: 800, letterSpacing: -0.5,
      boxShadow: `0 4px 14px ${a}50`,
    }}>
      {initials(name)}
    </div>
  )
}

function MatchChip({ match, selected, onClick }) {
  const p = scoreP(match.score)
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 9999,
      border: `1.5px solid ${selected ? p.c1 : '#e2e8f0'}`,
      background: selected ? p.pill : '#fff',
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'border-color 0.15s, background 0.15s',
      fontSize: 12,
    }}>
      <span style={{ fontWeight: 800, color: p.c1 }}>{match.score}</span>
      <span style={{ width: 1, height: 10, background: '#e2e8f0' }} />
      <span style={{ color: '#64748b', fontWeight: 500 }}>{match.bien_ville}</span>
      <span style={{ color: '#94a3b8' }}>·</span>
      <span style={{ color: '#475569', fontWeight: 600 }}>{money(match.bien_prix)}</span>
      {match.date_email_envoye && <Send size={9} style={{ color: '#10b981', flexShrink: 0 }} />}
      {match.statut_prospect === 'refused' && <XCircle size={9} style={{ color: '#ef4444', flexShrink: 0 }} />}
    </button>
  )
}

// ─── Bien detail card ─────────────────────────────────────────────────────────

function BienCard({ match, mail, nom, onPropose, onRefuse, sending }) {
  const p = scoreP(match.score)
  const photo = firstPhoto(match.bien_photos)
  const forts = bullets(match.points_forts).slice(0, 4)
  const atts = bullets(match.points_attention).slice(0, 3)
  const refused = match.statut_prospect === 'refused'

  return (
    <div style={{
      marginTop: 14, borderRadius: 16, overflow: 'hidden',
      border: '1px solid #e2e8f0',
      background: '#fff',
      boxShadow: '0 2px 16px rgba(15,23,42,0.06)',
    }}>

      {/* Bien header */}
      <div style={{
        position: 'relative',
        background: photo
          ? `linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.6) 100%), url(${photo}) center/cover no-repeat`
          : `linear-gradient(135deg, ${p.c1}14 0%, ${p.c2}08 100%)`,
        padding: '16px 18px',
        minHeight: photo ? 96 : 'auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: photo ? '#fff' : '#0f172a', letterSpacing: -0.3 }}>
              {match.bien_type}
            </div>
            <div style={{ fontSize: 12, color: photo ? 'rgba(255,255,255,0.7)' : '#64748b', marginTop: 2, fontWeight: 500 }}>
              📍 {match.bien_ville}
              {match.bien_surface ? ` · ${match.bien_surface} m²` : ''}
              {match.bien_pieces ? ` · ${match.bien_pieces} p.` : ''}
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: photo ? '#fff' : '#0f172a', letterSpacing: -0.8, flexShrink: 0 }}>
            {money(match.bien_prix)}
          </div>
        </div>

        {/* Status tags */}
        {(refused || match.date_email_envoye) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {refused && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9999, padding: '2px 9px' }}>Non intéressé</span>}
            {match.date_email_envoye && <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 9999, padding: '2px 9px' }}>✓ Proposé le {shortDate(match.date_email_envoye)}</span>}
          </div>
        )}
      </div>

      {/* Analysis sections */}
      {(forts.length > 0 || atts.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: forts.length && atts.length ? '1fr 1fr' : '1fr', borderTop: '1px solid #f1f5f9' }}>
          {forts.length > 0 && (
            <div style={{ padding: '14px 16px', borderRight: atts.length ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Zap size={11} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Points forts</span>
              </div>
              {forts.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3, fontSize: 11, color: '#475569', lineHeight: 1.55 }}>
                  <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}>•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
          {atts.length > 0 && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Attention</span>
              </div>
              {atts.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3, fontSize: 11, color: '#475569', lineHeight: 1.55 }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>•</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {match.recommandation && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <Lightbulb size={11} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 1 }}>Recommandation</span>
          </div>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
            {match.recommandation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
        <button onClick={onRefuse} style={{
          padding: '8px 14px', borderRadius: 10,
          background: refused ? 'rgba(239,68,68,0.08)' : 'transparent',
          color: refused ? '#dc2626' : '#94a3b8',
          border: `1px solid ${refused ? 'rgba(239,68,68,0.25)' : '#e2e8f0'}`,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          transition: 'all 0.15s',
        }}>
          <XCircle size={12} />
          {refused ? 'Annuler' : 'Refuser'}
        </button>

        <button onClick={onPropose} disabled={!mail || sending} style={{
          flex: 1, padding: '8px 0', borderRadius: 10,
          background: !mail ? '#f1f5f9'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: !mail ? '#94a3b8' : '#fff',
          border: 'none',
          fontSize: 13, fontWeight: 700, cursor: mail ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: mail ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
          transition: 'opacity 0.2s, box-shadow 0.2s',
          letterSpacing: -0.2,
        }}>
          <Send size={13} />
          {sending ? 'Envoi…' : match.date_email_envoye ? 'Renvoyer' : 'Envoyer la sélection'}
        </button>
      </div>
    </div>
  )
}

// ─── Prospect card ────────────────────────────────────────────────────────────

function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing }) {
  const [open, setOpen] = useState(false)
  const [selId, setSelId] = useState(null)
  const [hovered, setHovered] = useState(false)
  const panelRef = useRef(null)

  const sorted = [...group.matchings].sort((a, b) => {
    const rA = a.statut_prospect === 'refused' ? 1 : 0
    const rB = b.statut_prospect === 'refused' ? 1 : 0
    return rA - rB || b.score - a.score
  })

  const best = sorted[0]
  const sel = selId ? sorted.find(m => m.id === selId) || best : best

  const toggle = () => {
    if (!open) setSelId(best?.id ?? null)
    setOpen(o => !o)
  }

  const clickChip = (m) => {
    setSelId(m.id)
    if (!open) setOpen(true)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: hovered || open
          ? '0 12px 40px rgba(15,23,42,0.10), 0 1px 3px rgba(15,23,42,0.04)'
          : '0 2px 12px rgba(15,23,42,0.05)',
        transform: hovered && !open ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div onClick={toggle} style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={group.prospect_nom} size={48} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', letterSpacing: -0.5, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {group.prospect_nom}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#64748b',
              background: '#f1f5f9', borderRadius: 9999, padding: '2px 9px',
            }}>
              {money(group.prospect_budget)}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'rgba(99,102,241,0.08)', color: '#6366f1',
              borderRadius: 9999, padding: '2px 9px',
            }}>
              {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Score ring */}
        {best && <ScoreRing score={best.score} size={58} />}

        {/* Refresh */}
        <button
          onClick={e => { e.stopPropagation(); onRunSingle(e, group.prospect_id, group.prospect_nom) }}
          disabled={analyzing}
          title="Relancer l'analyse"
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#94a3b8', flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8' }}
        >
          <RefreshCw size={13} />
        </button>

        {/* Chevron */}
        <ChevronRight size={16} style={{
          color: '#cbd5e1', flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
        }} />
      </div>

      {/* ── Chip strip ── */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 14, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {sorted.map(m => (
          <MatchChip key={m.id} match={m} selected={open && sel?.id === m.id} onClick={() => clickChip(m)} />
        ))}
      </div>

      {/* ── Expanded panel (animated) ── */}
      <div style={{
        maxHeight: open ? '1000px' : '0px',
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
      }}>
        {sel && (
          <div style={{ padding: '0 20px 20px' }} ref={panelRef}>
            <BienCard
              match={sel}
              mail={group.prospect_mail}
              nom={group.prospect_nom}
              sending={sendingEmail === sel.id}
              onPropose={() => onPropose(sel, group.prospect_mail, group.prospect_nom)}
              onRefuse={() => onRefuse(sel)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const getFirstPhotoUrl = (p) => firstPhoto(p)

  const buildDefault = (m) => ({
    subject: `Proposition immobilière - ${m.bien_type} à ${m.bien_ville} | ${agencyNom}`,
    intro: 'Suite à notre échange, j\'ai identifié un bien qui pourrait vous intéresser.',
    points_forts: m.points_forts || '', points_attention: m.points_attention || '',
    recommandation: m.recommandation || '',
    conclusion: 'Ce bien vous intéresse ? N\'hésitez pas à me contacter pour organiser une visite.',
    lien_annonce: m.lien_annonce || '',
  })

  const fetchData = () => {
    setLoading(true)
    return apiFetch('/matchings').then(r => r.json()).then(data => {
      setMatchings(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  // ── Analysis ──────────────────────────────────────────────────────────────

  const runGlobal = async () => {
    cancelRef.current = false
    setAnalyzing(true); setShowOverlay(true); setCurrentProspectIndex(0)
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
      if (!cancelRef.current) {
        const d = await apiFetch('/matchings').then(r => r.json())
        if (d.some(m => m.score >= 80)) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }
      }
    } catch { setShowOverlay(false) }
    setAnalyzing(false)
  }

  const runSingle = async (e, id, nom) => {
    e.stopPropagation()
    setAnalyzing(true); setShowOverlay(true); setOverlayCompleted(false)
    setTotalProspects(1); setCurrentProspectIndex(1); setCurrentProspectName(nom || '')
    try {
      const d = await apiFetch(`/matching/run/${id}`, { method: 'POST' }).then(r => r.json())
      if (d.error) alert('Erreur: ' + d.error); else await fetchData()
    } catch { alert('Erreur lors de l\'analyse') }
    setOverlayCompleted(true)
    setTimeout(() => { setShowOverlay(false); setOverlayCompleted(false); setAnalyzing(false) }, 700)
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  const openEmail = (match, mail, nom) => {
    if (!mail) { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Pas d\'email enregistré.' }, isLoading: false }); return }
    const draft = sessionStorage.getItem(`emailDraft_${match.id}`)
    const init = draft ? JSON.parse(draft) : buildDefault(match)
    setEmailContent(init); setPendingEmail({ match, prospectMail: mail, prospectNom: nom })
    loadPreview(match, mail, nom, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom: nom, prospectMail: mail, bienType: match.bien_type, bienVille: match.bien_ville, bienPrix: money(match.bien_prix) }, isLoading: false })
  }

  const loadPreview = async (match, mail, nom, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const r = await apiFetch('/preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: money(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }) })
      const res = await r.json()
      setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSend = async () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true })); setSendingEmail(match.id)
    try {
      const res = await apiFetch('/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: money(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }) }).then(r => r.json())
      if (res.success) {
        sessionStorage.removeItem(`emailDraft_${match.id}`)
        await apiFetch(`/matchings/${match.id}/email-sent`, { method: 'PATCH' })
        setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, date_email_envoye: new Date().toISOString() } : m))
        setEmailModal({ isOpen: true, type: 'success', data: { prospectNom, bienType: match.bien_type, bienVille: match.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false })
      } else { setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false }) }
    } catch { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Erreur de connexion' }, isLoading: false }) }
    setSendingEmail(null); setPendingEmail(null)
  }

  useEffect(() => {
    if (emailModal.isOpen && emailModal.type === 'confirm' && pendingEmail)
      sessionStorage.setItem(`emailDraft_${pendingEmail.match.id}`, JSON.stringify(emailContent))
  }, [emailContent])

  const closeEmail = () => { setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false }); setPendingEmail(null); setPreviewHtml(null) }

  const handleRefuse = async (match) => {
    const refused = match.statut_prospect === 'refused'
    try {
      await apiFetch(`/matchings/${match.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: refused ? null : 'refused' }) })
      setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, statut_prospect: refused ? null : 'refused' } : m))
    } catch {}
  }

  // ── Filter + group ────────────────────────────────────────────────────────

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
    if (!acc[m.prospect_id]) acc[m.prospect_id] = { prospect_id: m.prospect_id, prospect_nom: m.prospect_nom, prospect_budget: m.prospect_budget, prospect_mail: m.prospect_mail, prospect_tel: m.prospect_tel, matchings: [] }
    acc[m.prospect_id].matchings.push(m)
    return acc
  }, {})

  const groups = Object.values(grouped).sort((a, b) => {
    if (sortBy === 'recent') return Math.max(...b.matchings.map(m => new Date(m.date_analyse).getTime())) - Math.max(...a.matchings.map(m => new Date(m.date_analyse).getTime()))
    if (sortBy === 'alpha') return (a.prospect_nom || '').localeCompare(b.prospect_nom || '', 'fr')
    return Math.max(...b.matchings.map(m => m.score_pondere ?? m.score)) - Math.max(...a.matchings.map(m => m.score_pondere ?? m.score))
  })

  // ─────────────────────────────────────────────────────────────────────────

  const SCORE_FILTERS = [
    { v: 'all', label: 'Tous', color: '#475569', active: '#0f172a' },
    { v: 'high', label: '75+', color: '#6366f1', active: '#6366f1' },
    { v: 'medium', label: '50–74', color: '#f59e0b', active: '#d97706' },
    { v: 'low', label: '< 50', color: '#ef4444', active: '#dc2626' },
  ]

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Confetti show={showConfetti} />
      <EmailModal isOpen={emailModal.isOpen} onClose={closeEmail} type={emailModal.type} data={emailModal.data} onConfirm={confirmSend} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
      <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/matchings')}
            title="Retour ancienne vue"
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.8, margin: 0 }}>Matchings</h1>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 6, padding: '3px 8px' }}>
                Nouveau
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
              {loading ? 'Chargement…' : `${groups.length} prospect${groups.length > 1 ? 's' : ''} · ${filtered.length} matching${filtered.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={runGlobal}
            disabled={analyzing}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 12,
              background: analyzing ? '#f1f5f9' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: analyzing ? '#94a3b8' : '#fff',
              border: 'none', fontSize: 13, fontWeight: 700,
              cursor: analyzing ? 'default' : 'pointer',
              boxShadow: analyzing ? 'none' : '0 4px 16px rgba(99,102,241,0.38)',
              transition: 'all 0.2s', letterSpacing: -0.2,
            }}
          >
            {analyzing
              ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Sparkles size={14} />}
            {analyzing ? 'Analyse en cours…' : 'Analyser'}
          </button>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 140 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Prospect ou ville…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, height: 38,
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 13, color: '#334155', background: '#fff',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Score pills */}
          <div style={{ display: 'flex', gap: 5 }}>
            {SCORE_FILTERS.map(f => (
              <button key={f.v} onClick={() => setFilterScore(f.v)} style={{
                height: 34, padding: '0 14px', borderRadius: 9999,
                background: filterScore === f.v ? f.color : '#fff',
                color: filterScore === f.v ? '#fff' : '#64748b',
                border: `1.5px solid ${filterScore === f.v ? f.color : '#e2e8f0'}`,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              height: 36, padding: '0 12px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              fontSize: 12, color: '#64748b', fontWeight: 500,
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="score">Meilleur score</option>
            <option value="recent">Plus récent</option>
            <option value="alpha">A → Z</option>
          </select>
        </div>

        {filterBienId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '10px 16px', marginTop: 12, fontSize: 13 }}>
            <span style={{ color: '#4f46e5', fontWeight: 600 }}>Filtré sur le bien #{filterBienId} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
            <button onClick={() => navigate('/matchings-v2')} style={{ color: '#6366f1', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Voir tout →</button>
          </div>
        )}
      </div>

      {/* ── Cards ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 16, width: '35%', borderRadius: 8, background: '#f1f5f9' }} />
                <div style={{ height: 12, width: '20%', borderRadius: 8, background: '#f8fafc' }} />
              </div>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#f1f5f9' }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5, marginBottom: 8 }}>Aucun matching trouvé</div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
            {search || filterScore !== 'all'
              ? 'Essaie d\'élargir les filtres.'
              : 'Lance une analyse pour trouver des correspondances.'}
          </p>
          <button onClick={runGlobal} disabled={analyzing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Sparkles size={15} /> Lancer l'analyse
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => (
            <ProspectCard
              key={g.prospect_id}
              group={g}
              onRunSingle={runSingle}
              onPropose={(match, mail, nom) => openEmail(match, mail, nom)}
              onRefuse={handleRefuse}
              sendingEmail={sendingEmail}
              analyzing={analyzing}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { display: none }
      `}</style>
    </div>
  )
}
