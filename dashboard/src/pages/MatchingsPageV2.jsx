import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Send, XCircle, ArrowLeft, CheckCircle, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'
import EmailModal from '../components/EmailModal'
import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'

// ── utils ──────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(' ').filter(p => p.length > 0)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const parseBullets = (text) => {
  if (!text) return []
  return text.split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
}

const fmt = (v) => {
  if (!v) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const getFirstPhoto = (photos) => {
  if (!photos || typeof photos !== 'string') return null
  return photos.split('|').map(s => s.trim()).find(s => /^https?:\/\//i.test(s)) || null
}

// Vibrant avatar palette — each prospect gets a consistent color
const PALETTES = [
  ['#7c3aed', '#4f46e5'],
  ['#0891b2', '#06b6d4'],
  ['#059669', '#10b981'],
  ['#dc2626', '#f97316'],
  ['#9333ea', '#c026d3'],
  ['#0d9488', '#0284c7'],
]
const avatarPalette = (name) => {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTES[n % PALETTES.length]
}

const scoreMeta = (s) =>
  s >= 75 ? { color: '#10b981', bg: '#ecfdf5', label: 'Excellent', ring: 'rgba(16,185,129,0.2)' }
  : s >= 50 ? { color: '#f59e0b', bg: '#fffbeb', label: 'Bon match', ring: 'rgba(245,158,11,0.2)' }
  : { color: '#ef4444', bg: '#fef2f2', label: 'Faible', ring: 'rgba(239,68,68,0.2)' }

// ── Sub-components ─────────────────────────────────────────────────────────

function BigScore({ score }) {
  const m = scoreMeta(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        fontSize: 46, fontWeight: 900, lineHeight: 1,
        color: m.color,
        letterSpacing: -2,
        textShadow: `0 0 24px ${m.ring}`,
      }}>{score}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
        color: m.color, opacity: 0.85,
      }}>{m.label}</div>
    </div>
  )
}

function Avatar({ name, size = 56 }) {
  const [a, b] = avatarPalette(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 800, color: '#fff', letterSpacing: -0.5,
      boxShadow: `0 6px 20px ${a}44`,
    }}>
      {getInitials(name)}
    </div>
  )
}

function ScoreChip({ score, label, selected, onClick }) {
  const m = scoreMeta(score)
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 100,
      border: `1.5px solid ${selected ? m.color : '#e5e7eb'}`,
      background: selected ? m.bg : '#fff',
      cursor: 'pointer',
      transition: 'all 0.18s',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{score}</span>
      <span style={{ width: 1, height: 12, background: '#e5e7eb' }} />
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
    </button>
  )
}

function BienPanel({ match, prospectMail, prospectNom, onPropose, onRefuse, sending }) {
  const photo = getFirstPhoto(match.bien_photos)
  const forts = parseBullets(match.points_forts).slice(0, 4)
  const attention = parseBullets(match.points_attention).slice(0, 3)
  const m = scoreMeta(match.score)
  const refused = match.statut_prospect === 'refused'

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${m.color}22`,
      background: '#fff',
      boxShadow: `0 4px 24px ${m.ring}`,
      marginTop: 12,
    }}>
      {/* Bien header */}
      <div style={{
        background: photo
          ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%), url(${photo}) center/cover no-repeat`
          : `linear-gradient(135deg, ${m.color}18, ${m.color}08)`,
        padding: '18px 18px 16px',
        minHeight: photo ? 90 : 'auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 700,
              color: photo ? '#fff' : '#0d1f3c',
              letterSpacing: -0.4,
            }}>{match.bien_type}</div>
            <div style={{
              fontSize: 12, color: photo ? 'rgba(255,255,255,0.75)' : '#6b7280',
              marginTop: 2, fontWeight: 500,
            }}>📍 {match.bien_ville}{match.bien_surface ? ` · ${match.bien_surface} m²` : ''}{match.bien_pieces ? ` · ${match.bien_pieces} p.` : ''}</div>
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: photo ? '#fff' : '#0d1f3c',
            letterSpacing: -0.8,
          }}>{fmt(match.bien_prix)}</div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {refused && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 20, padding: '3px 9px' }}>
              Non intéressé
            </span>
          )}
          {match.date_email_envoye && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 9px' }}>
              ✓ Proposé {fmtDate(match.date_email_envoye)}
            </span>
          )}
        </div>
      </div>

      {/* Analysis grid */}
      <div style={{ display: 'grid', gridTemplateColumns: forts.length && attention.length ? '1fr 1fr' : '1fr', gap: 0 }}>
        {forts.length > 0 && (
          <div style={{ padding: '14px 16px', borderRight: attention.length ? '1px solid #f3f4f6' : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={11} /> Points forts
            </div>
            {forts.map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, display: 'flex', gap: 6, marginBottom: 3 }}>
                <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
        {attention.length > 0 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={11} /> Attention
            </div>
            {attention.map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, display: 'flex', gap: 6, marginBottom: 3 }}>
                <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {match.recommandation && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lightbulb size={11} /> Recommandation
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.65, fontStyle: 'italic' }}>
            {match.recommandation}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onRefuse}
          style={{
            padding: '8px 14px', borderRadius: 10,
            background: refused ? '#fef2f2' : '#f9fafb',
            color: refused ? '#dc2626' : '#9ca3af',
            border: `1px solid ${refused ? '#fecaca' : '#e5e7eb'}`,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <XCircle size={13} />
          {refused ? 'Annuler refus' : 'Refuser'}
        </button>

        <button
          onClick={onPropose}
          disabled={!prospectMail || sending}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 10,
            background: !prospectMail ? '#f3f4f6' : `linear-gradient(135deg, #10b981, #059669)`,
            color: !prospectMail ? '#9ca3af' : '#fff',
            border: 'none',
            fontSize: 13, fontWeight: 700, cursor: prospectMail ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: prospectMail ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Send size={13} />
          {sending ? 'Envoi…' : match.date_email_envoye ? 'Renvoyer' : 'Proposer'}
        </button>
      </div>
    </div>
  )
}

function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing }) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const sorted = [...group.matchings].sort((a, b) => {
    const rA = a.statut_prospect === 'refused' ? 1 : 0
    const rB = b.statut_prospect === 'refused' ? 1 : 0
    if (rA !== rB) return rA - rB
    return b.score - a.score
  })

  const best = sorted[0]
  const selected = selectedId ? sorted.find(m => m.id === selectedId) || best : best

  const handleToggle = () => {
    setOpen(o => {
      if (!o) setSelectedId(best?.id ?? null)
      return !o
    })
  }

  const handleChip = (m) => {
    setSelectedId(m.id)
    if (!open) setOpen(true)
  }

  const [pa, pb] = avatarPalette(group.prospect_nom)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #eef0f6',
        boxShadow: open
          ? `0 8px 32px rgba(99,102,241,0.10), 0 1px 3px rgba(0,0,0,0.04)`
          : `0 2px 12px rgba(0,0,0,0.04)`,
        transition: 'box-shadow 0.25s, transform 0.2s',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)' }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = open ? '0 8px 32px rgba(99,102,241,0.10)' : '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div
        onClick={handleToggle}
        style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <Avatar name={group.prospect_nom} size={52} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0d1f3c', letterSpacing: -0.4, marginBottom: 3 }}>
            {group.prospect_nom}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
            {fmt(group.prospect_budget)}
          </div>
        </div>

        {/* Best score — big */}
        {best && <BigScore score={best.score} />}

        {/* Count badge */}
        <div style={{
          background: '#f0f4ff', color: '#6366f1',
          borderRadius: 10, padding: '4px 10px',
          fontSize: 12, fontWeight: 700,
        }}>
          {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
        </div>

        {/* Refresh */}
        <button
          onClick={e => { e.stopPropagation(); onRunSingle(e, group.prospect_id, group.prospect_nom) }}
          disabled={analyzing}
          style={{
            width: 32, height: 32, borderRadius: 10,
            border: '1px solid #e5e7eb', background: '#fafafa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af',
          }}
          title="Relancer l'analyse"
        >
          <RefreshCw size={13} />
        </button>

        {/* Chevron */}
        <div style={{ color: '#c4c9d9', marginLeft: 2 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* ── Chip strip ── */}
      <div style={{
        paddingLeft: 20, paddingRight: 20, paddingBottom: open ? 4 : 16,
        display: 'flex', gap: 7, overflowX: 'auto',
      }}>
        {sorted.map(m => (
          <ScoreChip
            key={m.id}
            score={m.score}
            label={`${m.bien_ville} · ${fmt(m.bien_prix)}`}
            selected={open && selected?.id === m.id}
            onClick={() => handleChip(m)}
          />
        ))}
      </div>

      {/* ── Expanded panel ── */}
      {open && selected && (
        <div style={{ padding: '0 20px 20px' }}>
          <BienPanel
            match={selected}
            prospectMail={group.prospect_mail}
            prospectNom={group.prospect_nom}
            sending={sendingEmail === selected.id}
            onPropose={() => onPropose(selected, group.prospect_mail, group.prospect_nom)}
            onRefuse={() => onRefuse(selected)}
          />
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

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
  const [lastAnalysis, setLastAnalysis] = useState(null)

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

  const getFirstPhotoUrl = (p) => {
    if (!p || typeof p !== 'string') return null
    return p.split('|').map(s => s.trim()).find(s => /^https?:\/\//i.test(s)) || null
  }

  const buildDefault = (m) => ({
    subject: `Proposition immobilière - ${m.bien_type} à ${m.bien_ville} | ${agencyNom}`,
    intro: 'Suite à notre échange, j\'ai identifié un bien qui pourrait vous intéresser.',
    points_forts: m.points_forts || '',
    points_attention: m.points_attention || '',
    recommandation: m.recommandation || '',
    conclusion: 'Ce bien vous intéresse ? N\'hésitez pas à me contacter pour organiser une visite.',
    lien_annonce: m.lien_annonce || '',
  })

  const fetchData = () => {
    setLoading(true)
    return apiFetch('/matchings').then(r => r.json()).then(data => {
      const d = Array.isArray(data) ? data : []
      setMatchings(d)
      if (d.length > 0) setLastAnalysis(d[0].date_analyse)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  // ── Analysis ───────────────────────────────────────────────────────────────

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
      const data = await apiFetch(`/matching/run/${id}`, { method: 'POST' }).then(r => r.json())
      if (data.error) alert('Erreur: ' + data.error)
      else await fetchData()
    } catch { alert('Erreur lors de l\'analyse') }
    setOverlayCompleted(true)
    setTimeout(() => { setShowOverlay(false); setOverlayCompleted(false); setAnalyzing(false) }, 700)
  }

  // ── Email ──────────────────────────────────────────────────────────────────

  const openEmail = (match, mail, nom) => {
    if (!mail) { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Pas d\'email enregistré.' }, isLoading: false }); return }
    const draft = sessionStorage.getItem(`emailDraft_${match.id}`)
    const init = draft ? JSON.parse(draft) : buildDefault(match)
    setEmailContent(init)
    setPendingEmail({ match, prospectMail: mail, prospectNom: nom })
    loadPreview(match, mail, nom, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom: nom, prospectMail: mail, bienType: match.bien_type, bienVille: match.bien_ville, bienPrix: fmt(match.bien_prix) }, isLoading: false })
  }

  const loadPreview = async (match, mail, nom, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const r = await apiFetch('/preview-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: fmt(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }),
      })
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
      const res = await apiFetch('/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: fmt(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }),
      }).then(r => r.json())
      if (res.success) {
        sessionStorage.removeItem(`emailDraft_${match.id}`)
        await apiFetch(`/matchings/${match.id}/email-sent`, { method: 'PATCH' })
        setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, date_email_envoye: new Date().toISOString() } : m))
        setEmailModal({ isOpen: true, type: 'success', data: { prospectNom, bienType: match.bien_type, bienVille: match.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false })
      } else {
        setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false })
      }
    } catch { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Erreur de connexion' }, isLoading: false }) }
    setSendingEmail(null); setPendingEmail(null)
  }

  useEffect(() => {
    if (emailModal.isOpen && emailModal.type === 'confirm' && pendingEmail)
      sessionStorage.setItem(`emailDraft_${pendingEmail.match.id}`, JSON.stringify(emailContent))
  }, [emailContent])

  const closeEmail = () => { setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false }); setPendingEmail(null); setPreviewHtml(null) }

  // ── Refuse ─────────────────────────────────────────────────────────────────

  const handleRefuse = async (match) => {
    const refused = match.statut_prospect === 'refused'
    try {
      await apiFetch(`/matchings/${match.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: refused ? null : 'refused' }) })
      setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, statut_prospect: refused ? null : 'refused' } : m))
    } catch {}
  }

  // ── Filter + group ─────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Confetti show={showConfetti} />
      <EmailModal isOpen={emailModal.isOpen} onClose={closeEmail} type={emailModal.type} data={emailModal.data} onConfirm={confirmSend} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
      <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/matchings')}
          style={{ width: 36, height: 36, borderRadius: 11, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}
        >
          <ArrowLeft size={16} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c', letterSpacing: -0.7, margin: 0 }}>Matchings</h1>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 6, padding: '3px 8px' }}>
              NOUVEAU
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0', fontWeight: 500 }}>
            {loading ? 'Chargement…' : `${groups.length} prospect${groups.length > 1 ? 's' : ''} · ${filtered.length} matchings`}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 140 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Prospect ou ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, outline: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Score filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: 'all', label: 'Tous', color: '#6366f1' },
            { v: 'high', label: '75+', color: '#10b981' },
            { v: 'medium', label: '50–74', color: '#f59e0b' },
            { v: 'low', label: '< 50', color: '#ef4444' },
          ].map(f => (
            <button key={f.v} onClick={() => setFilterScore(f.v)} style={{
              padding: '6px 13px', borderRadius: 100,
              background: filterScore === f.v ? f.color : '#f3f4f6',
              color: filterScore === f.v ? '#fff' : '#6b7280',
              border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ fontSize: 12, color: '#6b7280', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="score">Meilleur score</option>
          <option value="recent">Plus récent</option>
          <option value="alpha">A → Z</option>
        </select>

        <button
          onClick={runGlobal}
          disabled={analyzing}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 12,
            background: analyzing ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: analyzing ? '#9ca3af' : '#fff',
            border: 'none', fontSize: 13, fontWeight: 700, cursor: analyzing ? 'default' : 'pointer',
            boxShadow: analyzing ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {analyzing
            ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Sparkles size={14} />}
          {analyzing ? 'Analyse…' : 'Analyser'}
        </button>
      </div>

      {/* ── Bien filter banner ─────────────────────────────────────────────── */}
      {filterBienId && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: '#4f46e5', fontWeight: 600 }}>Filtré sur le bien #{filterBienId} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <button onClick={() => navigate('/matchings-v2')} style={{ color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Voir tout →</button>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef0f6', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 16, width: '40%', borderRadius: 8, background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 12, width: '25%', borderRadius: 8, background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef0f6', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0d1f3c', marginBottom: 8 }}>Aucun matching trouvé</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Lance une analyse pour trouver des correspondances</div>
          <button
            onClick={runGlobal}
            disabled={analyzing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
          >
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
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  )
}
