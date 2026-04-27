import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react'
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

const scoreCfg = (s) => s >= 75
  ? { color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Excellent' }
  : s >= 50
    ? { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Bon match' }
    : { color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'Faible' }

// ── MatchCard ──────────────────────────────────────────────────────────────

function MatchCard({ m, flipped, onFlip, onRefuse, onPropose, prospectMail }) {
  const cfg = scoreCfg(m.score)
  const refused = m.statut_prospect === 'refused'

  return (
    <div
      style={{ width: '100%', height: '100%', perspective: '1200px', userSelect: 'none' }}
      onClick={onFlip}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* ════ FRONT ════ */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: 24, overflow: 'hidden',
          background: '#fff',
          boxShadow: `0 28px 60px -10px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)`,
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Prospect — dark top */}
          <div style={{
            background: 'linear-gradient(140deg, #0f2744 0%, #1e4a82 100%)',
            padding: '22px 22px 18px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 15,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.5, flexShrink: 0,
              }}>
                {getInitials(m.prospect_nom)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: -0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.prospect_nom}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                  Budget {fmt(m.prospect_budget)}
                </div>
              </div>
            </div>
          </div>

          {/* Score band */}
          <div style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '11px 22px',
            display: 'flex', alignItems: 'center', gap: 0,
          }}>
            <div style={{ flex: 1, height: 1, background: '#efefef' }} />
            <div style={{
              fontSize: 40, fontWeight: 900,
              color: cfg.color,
              letterSpacing: -3, lineHeight: 1,
              textShadow: `0 0 20px ${cfg.glow}`,
              margin: '0 14px',
            }}>{m.score}</div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: cfg.color,
              textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 14,
            }}>{cfg.label}</div>
            <div style={{ flex: 1, height: 1, background: '#efefef' }} />
          </div>

          {/* Bien — white body */}
          <div style={{
            flex: 1, padding: '18px 22px 16px',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            background: '#fff',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0d1f3c', letterSpacing: -0.6, lineHeight: 1.2 }}>
              {m.bien_type}
            </div>
            <div style={{ fontSize: 13, color: '#7c8db5', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ fontWeight: 500 }}>{m.bien_ville}</span>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 14 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0d1f3c', letterSpacing: -1.2 }}>
                {fmt(m.bien_prix)}
              </div>
              {(m.bien_surface || m.bien_pieces) && (
                <div style={{ fontSize: 12, color: '#aab4cc', marginTop: 3 }}>
                  {[m.bien_surface && `${m.bien_surface} m²`, m.bien_pieces && `${m.bien_pieces} pièces`].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            {/* Status tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {refused && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '3px 9px' }}>
                  Non intéressé
                </span>
              )}
              {m.date_email_envoye && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '3px 9px' }}>
                  ✓ Proposé {fmtDate(m.date_email_envoye)}
                </span>
              )}
            </div>

            {/* Flip hint */}
            <div style={{
              position: 'absolute', bottom: 12, right: 16,
              fontSize: 10, color: '#cdd3e0', fontStyle: 'italic', letterSpacing: 0.3,
            }}>
              tap → analyse IA
            </div>
          </div>
        </div>

        {/* ════ BACK ════ */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 24, overflow: 'hidden',
          background: '#fff',
          boxShadow: `0 28px 60px -10px rgba(0,0,0,0.55)`,
          padding: '22px 22px 16px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#b0bace', marginBottom: 16 }}>
            Analyse IA · {m.bien_type} à {m.bien_ville}
          </div>

          {/* Points forts */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>
              ✓ Points forts
            </div>
            {parseBullets(m.points_forts).slice(0, 3).map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, display: 'flex', gap: 7, marginBottom: 3 }}>
                <span style={{ color: '#10b981', flexShrink: 0 }}>•</span>
                <span>{f}</span>
              </div>
            ))}
            {!parseBullets(m.points_forts).length && (
              <div style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>Aucun</div>
            )}
          </div>

          {/* Points attention */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>
              ⚠ Attention
            </div>
            {parseBullets(m.points_attention).slice(0, 2).map((a, i) => (
              <div key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, display: 'flex', gap: 7, marginBottom: 3 }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span>
                <span>{a}</span>
              </div>
            ))}
            {!parseBullets(m.points_attention).length && (
              <div style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>Aucun</div>
            )}
          </div>

          {/* Recommandation */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>
              💡 Recommandation
            </div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>
              {m.recommandation || 'Aucune recommandation.'}
            </div>
          </div>

          {/* Actions in back */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={onRefuse}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 12,
                background: refused ? '#fef2f2' : '#f9fafb',
                color: refused ? '#dc2626' : '#6b7280',
                border: `1px solid ${refused ? '#fecaca' : '#e5e7eb'}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {refused ? '↩ Annuler refus' : '✗ Refuser'}
            </button>
            <button
              onClick={onPropose}
              disabled={!prospectMail}
              style={{
                flex: 2, padding: '9px 0', borderRadius: 12,
                background: prospectMail ? 'linear-gradient(135deg, #10b981, #059669)' : '#e5e7eb',
                color: prospectMail ? '#fff' : '#9ca3af',
                border: 'none',
                fontSize: 12, fontWeight: 700, cursor: prospectMail ? 'pointer' : 'default',
                boxShadow: prospectMail ? '0 4px 12px rgba(16,185,129,0.35)' : 'none',
              }}
            >
              {m.date_email_envoye ? '✓ Renvoyer' : '→ Proposer'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', marginTop: 10 }}>
            tap pour revenir
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function MatchingsPageV2() {
  const { agency } = useAgency()
  const agencyNom = agency?.nom || 'ImmoFlash'
  const navigate = useNavigate()

  // Data
  const [matchings, setMatchings] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Swipe animation
  const [swipeDir, setSwipeDir] = useState(null)   // 'left' | 'right' | null
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterScore, setFilterScore] = useState('all')

  // Analysis
  const [analyzing, setAnalyzing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayCompleted, setOverlayCompleted] = useState(false)
  const [totalProspects, setTotalProspects] = useState(0)
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentProspectName, setCurrentProspectName] = useState('')
  const cancelRef = useRef(false)

  // Email
  const [emailModal, setEmailModal] = useState({ isOpen: false, type: 'confirm', data: null, isLoading: false })
  const [pendingEmail, setPendingEmail] = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({ subject: '', intro: '', points_forts: '', points_attention: '', recommandation: '', conclusion: '', lien_annonce: '' })

  const getFirstPhotoUrl = (photosValue) => {
    if (!photosValue || typeof photosValue !== 'string') return null
    return photosValue.split('|').map(i => i.trim()).find(i => /^https?:\/\//i.test(i)) || null
  }

  const buildDefaultEmailContent = (m) => ({
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
      setMatchings(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  // ── Flat pairs (filtered + sorted) ────────────────────────────────────────

  const pairs = [...matchings]
    .filter(m => {
      const s = search.toLowerCase()
      if (s && !m.prospect_nom?.toLowerCase().includes(s) && !m.bien_ville?.toLowerCase().includes(s)) return false
      if (filterScore === 'high' && m.score < 75) return false
      if (filterScore === 'medium' && (m.score < 50 || m.score >= 75)) return false
      if (filterScore === 'low' && m.score >= 50) return false
      return true
    })
    .sort((a, b) => b.score - a.score)

  useEffect(() => { setCurrentIdx(0); setFlipped(false) }, [search, filterScore])

  const total = pairs.length
  const current = pairs[currentIdx]
  const isDone = currentIdx >= total

  // ── Swipe mechanics ────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setFlipped(false)
    setCurrentIdx(i => i + 1)
  }, [])

  const triggerSwipe = useCallback((dir, then) => {
    setFlipped(false)
    setSwipeDir(dir)
    setDragX(0)
    setTimeout(() => {
      setSwipeDir(null)
      setCurrentIdx(i => i + 1)
      then?.()
    }, 320)
  }, [])

  const handleSkip = useCallback(() => {
    if (isDone) return
    triggerSwipe('left')
  }, [isDone, triggerSwipe])

  const handleProposeClick = useCallback(() => {
    if (!current) return
    openEmailModal(current)
  }, [current])

  // ── Drag ──────────────────────────────────────────────────────────────────

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return
    dragStartRef.current = e.clientX
    setIsDragging(false)
  }

  useEffect(() => {
    const onMove = (e) => {
      if (dragStartRef.current === null) return
      const dx = e.clientX - dragStartRef.current
      if (Math.abs(dx) > 5) setIsDragging(true)
      setDragX(dx)
    }
    const onUp = () => {
      if (dragStartRef.current === null) return
      const dx = dragX
      dragStartRef.current = null
      setIsDragging(false)
      if (dx > 80) {
        openEmailModal(current)
        setDragX(0)
      } else if (dx < -80) {
        triggerSwipe('left')
      } else {
        setDragX(0)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragX, current, triggerSwipe])

  // Touch
  const touchStartRef = useRef(null)
  const handleTouchStart = (e) => {
    if (e.target.closest('button')) return
    touchStartRef.current = e.touches[0].clientX
  }
  const handleTouchMove = (e) => {
    if (touchStartRef.current === null) return
    setDragX(e.touches[0].clientX - touchStartRef.current)
    setIsDragging(true)
  }
  const handleTouchEnd = () => {
    if (touchStartRef.current === null) return
    const dx = dragX
    touchStartRef.current = null
    setIsDragging(false)
    if (dx > 80) { openEmailModal(current); setDragX(0) }
    else if (dx < -80) triggerSwipe('left')
    else setDragX(0)
  }

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (emailModal.isOpen) return
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === 'l') handleProposeClick()
      if (e.key === 'ArrowLeft' || e.key === 'h') handleSkip()
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleProposeClick, handleSkip, emailModal.isOpen])

  // ── Email ──────────────────────────────────────────────────────────────────

  const openEmailModal = (m) => {
    if (!m) return
    if (!m.prospect_mail) {
      setEmailModal({ isOpen: true, type: 'error', data: { error: 'Pas d\'email enregistré.' }, isLoading: false })
      return
    }
    const draft = sessionStorage.getItem(`emailDraft_${m.id}`)
    const init = draft ? JSON.parse(draft) : buildDefaultEmailContent(m)
    setEmailContent(init)
    setPendingEmail(m)
    loadEmailPreview(m, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom: m.prospect_nom, prospectMail: m.prospect_mail, bienType: m.bien_type, bienVille: m.bien_ville, bienPrix: fmt(m.bien_prix) }, isLoading: false })
  }

  const loadEmailPreview = async (m, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const r = await apiFetch('/preview-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: m.prospect_mail.trim(), to_name: m.prospect_nom, subject: content.subject, bien_type: m.bien_type, bien_ville: m.bien_ville, bien_prix: fmt(m.bien_prix), bien_surface: m.bien_surface ? `${m.bien_surface} m²` : null, bien_pieces: m.bien_pieces ? `${m.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: m.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(m.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }),
      })
      const res = await r.json()
      setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSendEmail = async () => {
    if (!pendingEmail) return
    const m = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true }))
    try {
      const res = await apiFetch('/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: m.prospect_mail.trim(), to_name: m.prospect_nom, subject: emailContent.subject, bien_type: m.bien_type, bien_ville: m.bien_ville, bien_prix: fmt(m.bien_prix), bien_surface: m.bien_surface ? `${m.bien_surface} m²` : null, bien_pieces: m.bien_pieces ? `${m.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: m.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(m.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }),
      }).then(r => r.json())
      if (res.success) {
        sessionStorage.removeItem(`emailDraft_${m.id}`)
        await apiFetch(`/matchings/${m.id}/email-sent`, { method: 'PATCH' })
        setMatchings(prev => prev.map(x => x.id === m.id ? { ...x, date_email_envoye: new Date().toISOString() } : x))
        setEmailModal({ isOpen: true, type: 'success', data: { prospectNom: m.prospect_nom, bienType: m.bien_type, bienVille: m.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false })
      } else {
        setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false })
      }
    } catch { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Erreur de connexion' }, isLoading: false }) }
    setPendingEmail(null)
  }

  useEffect(() => {
    if (emailModal.isOpen && emailModal.type === 'confirm' && pendingEmail)
      sessionStorage.setItem(`emailDraft_${pendingEmail.id}`, JSON.stringify(emailContent))
  }, [emailContent])

  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false })
    setPendingEmail(null); setPreviewHtml(null)
  }

  // ── Refuse ─────────────────────────────────────────────────────────────────

  const handleRefuse = async (m) => {
    const isRefused = m.statut_prospect === 'refused'
    try {
      await apiFetch(`/matchings/${m.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: isRefused ? null : 'refused' }) })
      setMatchings(prev => prev.map(x => x.id === m.id ? { ...x, statut_prospect: isRefused ? null : 'refused' } : x))
    } catch {}
  }

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
      setShowOverlay(false)
      await fetchData()
      if (!cancelRef.current) {
        const d = await apiFetch('/matchings').then(r => r.json())
        if (d.some(m => m.score >= 80)) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }
      }
    } catch { setShowOverlay(false) }
    setAnalyzing(false)
  }

  // ── Card transform ─────────────────────────────────────────────────────────

  const cardTransform = swipeDir
    ? `translateX(${swipeDir === 'right' ? 700 : -700}px) rotate(${swipeDir === 'right' ? 30 : -30}deg)`
    : `translateX(${dragX}px) rotate(${dragX * 0.035}deg)`

  const cardTransition = swipeDir
    ? 'transform 0.32s cubic-bezier(0.4, 0, 1, 1), opacity 0.32s'
    : isDragging
      ? 'none'
      : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'

  const swipeTintOpacity = Math.min(Math.abs(dragX) / 100, 0.55)
  const swipeTintColor = dragX > 0 ? `rgba(16,185,129,${swipeTintOpacity})` : `rgba(239,68,68,${swipeTintOpacity})`

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ margin: '-24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Confetti show={showConfetti} />
      <EmailModal
        isOpen={emailModal.isOpen} onClose={closeEmailModal}
        type={emailModal.type} data={emailModal.data}
        onConfirm={confirmSendEmail} isLoading={emailModal.isLoading}
        previewHtml={previewHtml} previewLoading={previewLoading}
        emailContent={emailContent} setEmailContent={setEmailContent}
        onRegeneratePreview={() => pendingEmail && loadEmailPreview(pendingEmail, emailContent)}
        smtpConfigured={agency?.smtp_configured ?? true}
      />
      <AnalysisOverlay
        isVisible={showOverlay} totalProspects={totalProspects}
        currentProspect={currentProspectIndex} currentProspectName={currentProspectName}
        isCompleted={overlayCompleted}
        onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }}
      />

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8edf5',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate('/matchings')}
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}
        >
          <ArrowLeft size={15} />
        </button>

        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0d1f3c' }}>Matchings</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 6, padding: '2px 7px', letterSpacing: 0.5 }}>v2 BETA</span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
            {loading ? 'Chargement…' : `${total} matchings`}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 1 200px', minWidth: 120 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Prospect ou ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
          />
        </div>

        {/* Score filters */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { v: 'all', label: 'Tous', active: '#1e3a5f' },
            { v: 'high', label: '75+', active: '#10b981' },
            { v: 'medium', label: '50–74', active: '#f59e0b' },
            { v: 'low', label: '< 50', active: '#ef4444' },
          ].map(f => (
            <button key={f.v} onClick={() => setFilterScore(f.v)} style={{
              padding: '5px 11px', borderRadius: 8,
              background: filterScore === f.v ? f.active : '#f3f4f6',
              color: filterScore === f.v ? '#fff' : '#6b7280',
              border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={runGlobal}
            disabled={analyzing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: analyzing ? '#f3f4f6' : 'linear-gradient(135deg, #1e3a5f, #2d5a8a)',
              color: analyzing ? '#9ca3af' : '#fff',
              border: 'none', fontSize: 12, fontWeight: 600, cursor: analyzing ? 'default' : 'pointer',
            }}
          >
            {analyzing
              ? <div style={{ width: 14, height: 14, border: '2px solid #d1d5db', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              : <Sparkles size={14} />}
            {analyzing ? 'Analyse…' : 'Analyser'}
          </button>
        </div>
      </div>

      {/* ── ARENA ───────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #080f1a 0%, #0d1f3c 45%, #080f1a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '32px 16px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }} />

        {!loading && !isDone && current && (
          <>
            {/* Progress */}
            <div style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 2,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
            }}>
              {currentIdx + 1} <span style={{ opacity: 0.4 }}>/ {total}</span>
            </div>

            {/* Card stack */}
            <div style={{ position: 'relative', width: 340, height: 500 }}>
              {/* Behind cards — static stack */}
              {[2, 1].map(offset => {
                if (!pairs[currentIdx + offset]) return null
                return (
                  <div key={currentIdx + offset} style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 24,
                    background: '#fff',
                    transform: `translateY(${offset * 11}px) scale(${1 - offset * 0.045}) rotate(${offset % 2 === 0 ? offset * 2 : -offset * 2}deg)`,
                    boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)',
                    opacity: 1 - offset * 0.15,
                    zIndex: 10 - offset,
                  }} />
                )
              })}

              {/* Active card */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  position: 'absolute', inset: 0, zIndex: 20,
                  transform: cardTransform,
                  opacity: swipeDir ? 0 : 1,
                  transition: cardTransition,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
              >
                {/* Swipe tint */}
                {dragX !== 0 && !flipped && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 30,
                    borderRadius: 24, pointerEvents: 'none',
                    background: swipeTintColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                  }}>
                    {Math.abs(dragX) > 40 && (
                      <div style={{
                        fontSize: 60, opacity: Math.min(Math.abs(dragX) / 80, 1),
                        transform: `scale(${Math.min(Math.abs(dragX) / 60, 1.1)})`,
                        filter: 'drop-shadow(0 0 12px currentColor)',
                      }}>
                        {dragX > 0 ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                )}

                <MatchCard
                  m={current}
                  flipped={flipped}
                  onFlip={() => { if (!isDragging && Math.abs(dragX) < 5) setFlipped(f => !f) }}
                  onRefuse={() => handleRefuse(current)}
                  onPropose={() => openEmailModal(current)}
                  prospectMail={current.prospect_mail}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Skip */}
              <button
                onClick={handleSkip}
                style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.12)',
                  border: '2px solid rgba(239,68,68,0.35)',
                  color: '#ef4444',
                  fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                title="Passer (←)"
              >✗</button>

              {/* Nav */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
                  disabled={currentIdx === 0}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)', border: 'none',
                    color: currentIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentIdx === 0 ? 'default' : 'pointer',
                  }}
                ><ChevronLeft size={14} /></button>

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, minWidth: 50, textAlign: 'center' }}>
                  {currentIdx + 1} / {total}
                </div>

                <button
                  onClick={() => { setCurrentIdx(i => Math.min(total - 1, i + 1)); setFlipped(false) }}
                  disabled={currentIdx >= total - 1}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)', border: 'none',
                    color: currentIdx >= total - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentIdx >= total - 1 ? 'default' : 'pointer',
                  }}
                ><ChevronRight size={14} /></button>
              </div>

              {/* Propose */}
              <button
                onClick={handleProposeClick}
                style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
                  border: '2px solid rgba(16,185,129,0.45)',
                  color: '#10b981',
                  fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.32), rgba(5,150,105,0.32))'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))'; e.currentTarget.style.transform = 'scale(1)' }}
                title="Proposer (→)"
              >✓</button>
            </div>

            {/* Keyboard hint */}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: 0.8, textAlign: 'center' }}>
              ← passer · espace analyse IA · → proposer
            </div>
          </>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Chargement des matchings…</div>
          </div>
        )}

        {/* ── Done / empty ── */}
        {!loading && (isDone || total === 0) && (
          <div style={{ textAlign: 'center', maxWidth: 300 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{total === 0 ? '🔍' : '🎉'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.5, marginBottom: 8 }}>
              {total === 0 ? 'Aucun matching' : 'Tous revus !'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginBottom: 24 }}>
              {total === 0
                ? 'Lance une analyse pour trouver des correspondances.'
                : `Tu as passé en revue les ${total} matchings.`}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isDone && total > 0 && (
                <button onClick={() => { setCurrentIdx(0); setFlipped(false) }} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ↩ Recommencer
                </button>
              )}
              <button onClick={runGlobal} disabled={analyzing} style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={14} /> Lancer une analyse
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
