import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Send, XCircle, ArrowLeft, Zap, AlertTriangle, Lightbulb } from 'lucide-react'
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

// Avatar — couleurs vives stables par nom
const AV_PAL = [['#1E3A5F','#2D5A8A'],['#0891b2','#06b6d4'],['#059669','#10b981'],['#dc2626','#f97316'],['#7c3aed','#a855f7'],['#0d9488','#0ea5e9']]
const avP = (n) => AV_PAL[(n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_PAL.length]

// Score config — couleurs classiques app
const sC = (s) => s >= 75
  ? { c1:'#10b981', c2:'#059669', label:'Excellent', bg:'#ecfdf5', text:'#065f46' }
  : s >= 50
    ? { c1:'#f59e0b', c2:'#d97706', label:'Bon match', bg:'#fffbeb', text:'#92400e' }
    : { c1:'#ef4444', c2:'#dc2626', label:'Faible',    bg:'#fef2f2', text:'#991b1b' }

// ─── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 100 }) {
  const c = sC(score)
  const inner = Math.round(size * 0.72)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', position: 'relative',
        background: `conic-gradient(from -90deg, ${c.c1} 0% ${score}%, #e5e7eb ${score}% 100%)`,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: inner, height: inner, borderRadius: '50%', background: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>Score</span>
            <span style={{ fontSize: Math.round(size * 0.28), fontWeight: 900, color: c.c1, lineHeight: 1, letterSpacing: -1 }}>{score}</span>
          </div>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color: c.text, background: c.bg, borderRadius: 9999, padding: '3px 10px',
        border: `1px solid ${c.c1}30`,
      }}>{c.label}</span>
    </div>
  )
}

// ─── Hex badge ─────────────────────────────────────────────────────────────────
function GemBadge({ score, ville, prix, selected, onClick }) {
  const c = sC(score)
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px 7px 6px', borderRadius: 12,
      background: selected ? '#f0f4ff' : 'transparent',
      border: `1px solid ${selected ? '#1E3A5F' : 'transparent'}`,
      cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: `linear-gradient(135deg, ${c.c1}, ${c.c2})`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{score}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1E3A5F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ville}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{mon(prix)}</div>
      </div>
    </button>
  )
}

// ─── Bien detail (photo en fond, texte par-dessus) ─────────────────────────────
function BienDetail({ match, mail, onPropose, onRefuse, sending }) {
  const photo = fPhoto(match.bien_photos)
  const forts = bul(match.points_forts).slice(0, 4)
  const atts  = bul(match.points_attention).slice(0, 3)
  const refused = match.statut_prospect === 'refused'
  const c = sC(match.score)

  return (
    <div style={{ borderTop: '1px solid #e5e7eb' }}>
      {/* Photo as background — text overlaid */}
      <div style={{
        position: 'relative',
        minHeight: 190,
        background: photo
          ? `linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(15,23,42,0.55) 100%), url(${photo}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)',
        padding: '20px 24px',
        borderRadius: '0 0 0 0',
      }}>
        {/* Titre + prix */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>{match.bien_type}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3, fontWeight: 500 }}>
              📍 {match.bien_ville}
              {match.bien_surface ? ` · ${match.bien_surface} m²` : ''}
              {match.bien_pieces ? ` · ${match.bien_pieces} p.` : ''}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.8, flexShrink: 0, marginLeft: 16 }}>
            {mon(match.bien_prix)}
          </div>
        </div>

        {/* 2 colonnes : analyse + recommandation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Points forts + attention */}
          <div>
            {forts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                  <Zap size={11} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.2 }}>Points forts</span>
                </div>
                {forts.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    <span style={{ color: '#34d399', flexShrink: 0 }}>•</span><span>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {atts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                  <AlertTriangle size={11} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1.2 }}>Attention</span>
                </div>
                {atts.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    <span style={{ color: '#fbbf24', flexShrink: 0 }}>•</span><span>{a}</span>
                  </div>
                ))}
              </div>
            )}
            {!forts.length && !atts.length && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>Analyse non disponible</p>
            )}
          </div>

          {/* Recommandation — carte flottante */}
          {match.recommandation && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                <Lightbulb size={11} style={{ color: '#93c5fd' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.2 }}>Recommandation</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, margin: 0 }}>{match.recommandation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px', background: '#f9fafb',
        borderTop: '1px solid #f3f4f6',
      }}>
        {match.date_email_envoye && (
          <span style={{ fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 9999, padding: '3px 10px' }}>
            ✓ Proposé le {dt(match.date_email_envoye)}
          </span>
        )}
        {refused && (
          <span style={{ fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9999, padding: '3px 10px' }}>
            Non intéressé
          </span>
        )}

        <button onClick={onRefuse} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 10,
          background: refused ? '#fef2f2' : '#fff',
          color: refused ? '#dc2626' : '#9ca3af',
          border: `1px solid ${refused ? '#fecaca' : '#e5e7eb'}`,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
        }}>
          <XCircle size={12} />
          {refused ? 'Annuler refus' : 'Refuser'}
        </button>

        <button onClick={onPropose} disabled={!mail || sending} style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 22px', borderRadius: 10,
          background: mail ? '#1E3A5F' : '#f3f4f6',
          color: mail ? '#fff' : '#9ca3af',
          border: 'none', fontSize: 13, fontWeight: 700,
          cursor: mail ? 'pointer' : 'default',
          boxShadow: mail ? '0 4px 12px rgba(30,58,95,0.3)' : 'none',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (mail) e.currentTarget.style.background = '#2D5A8A' }}
          onMouseLeave={e => { if (mail) e.currentTarget.style.background = '#1E3A5F' }}
        >
          <Send size={13} />
          {sending ? 'Envoi…' : match.date_email_envoye ? 'Renvoyer' : 'Envoyer la sélection'}
        </button>
      </div>
    </div>
  )
}

// ─── Prospect card ─────────────────────────────────────────────────────────────
function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing, defaultOpen }) {
  const sorted = [...group.matchings].sort((a, b) => {
    const rA = a.statut_prospect === 'refused' ? 1 : 0
    const rB = b.statut_prospect === 'refused' ? 1 : 0
    return rA - rB || b.score - a.score
  })
  const best = sorted[0]

  // Premier de la liste ouvert par défaut
  const [selId, setSelId] = useState(defaultOpen && best ? best.id : null)
  const [hovered, setHovered] = useState(false)
  const sel = selId ? sorted.find(m => m.id === selId) || best : null
  const [a, b] = avP(group.prospect_nom)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: hovered
          ? '0 8px 32px rgba(30,58,95,0.12), 0 1px 3px rgba(0,0,0,0.04)'
          : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── 3 colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', minHeight: 130 }}>

        {/* GAUCHE — prospect */}
        <div style={{ padding: '20px 20px', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${a}, ${b})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
              boxShadow: `0 4px 12px ${a}50`,
            }}>{ini(group.prospect_nom)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E3A5F', letterSpacing: -0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.prospect_nom}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{mon(group.prospect_budget)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#1E3A5F', border: '1px solid #bfdbfe', borderRadius: 9999, padding: '3px 10px' }}>
              {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={e => onRunSingle(e, group.prospect_id, group.prospect_nom)}
              disabled={analyzing}
              title="Relancer l'analyse"
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1E3A5F'; e.currentTarget.style.background = '#eff6ff' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = '#f9fafb' }}
            ><RefreshCw size={12} /></button>
          </div>
        </div>

        {/* CENTRE — anneau score */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 10px',
          borderRight: '1px solid #f3f4f6',
          background: '#fafafa',
        }}>
          {best && <ScoreRing score={best.score} size={100} />}
        </div>

        {/* DROITE — badges hexagonaux */}
        <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
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
            <div style={{ fontSize: 11, color: '#9ca3af', paddingLeft: 8, marginTop: 2 }}>
              +{sorted.length - 4} autre{sorted.length - 4 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau détail (animé) ── */}
      <div style={{
        maxHeight: sel ? '800px' : '0px',
        opacity: sel ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
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
      const r = await apiFetch('/preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: fPhoto(match.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }) })
      const res = await r.json(); setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSend = async () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true })); setSendingEmail(match.id)
    try {
      const res = await apiFetch('/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: fPhoto(match.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }) }).then(r => r.json())
      if (res.success) {
        sessionStorage.removeItem(`emailDraft_${match.id}`)
        await apiFetch(`/matchings/${match.id}/email-sent`, { method: 'PATCH' })
        setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, date_email_envoye: new Date().toISOString() } : m))
        setEmailModal({ isOpen: true, type: 'success', data: { prospectNom, bienType: match.bien_type, bienVille: match.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false })
      } else { setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false }) }
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

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Confetti show={showConfetti} />
      <EmailModal isOpen={emailModal.isOpen} onClose={closeEmail} type={emailModal.type} data={emailModal.data} onConfirm={confirmSend} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
      <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/matchings')} className="p-2 rounded-xl text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 transition-all" title="Retour ancienne vue">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Matchings</h1>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 6, padding: '3px 8px' }}>NOUVEAU</span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Chargement…' : `${groups.length} prospect${groups.length > 1 ? 's' : ''} · ${filtered.length} matchings`}
          </p>
        </div>

        <button onClick={runGlobal} disabled={analyzing} className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl hover:bg-[#2D5A8A] transition-all shadow-sm disabled:opacity-50">
          {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {analyzing ? 'Analyse…' : "Analyser"}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Prospect ou ville…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
        </div>
        <div className="flex gap-1.5">
          {[{ v:'all',label:'Tous' },{ v:'high',label:'75+' },{ v:'medium',label:'50–74' },{ v:'low',label:'< 50' }].map(f => (
            <button key={f.v} onClick={() => setFilterScore(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterScore === f.v ? 'bg-[#1E3A5F] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="ml-auto text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="score">Meilleur score</option>
          <option value="recent">Plus récent</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      {filterBienId && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4 text-sm">
          <span className="text-blue-700">Filtré sur le bien #{filterBienId} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <button onClick={() => navigate('/matchings-v2')} className="text-blue-500 hover:underline">Voir tout</button>
        </div>
      )}

      {/* Cartes */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-36 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <p className="font-semibold text-[#1E3A5F] mb-1">Aucun matching</p>
          <p className="text-sm text-gray-400 mb-5">Lance une analyse pour trouver des correspondances</p>
          <button onClick={runGlobal} disabled={analyzing} className="px-5 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl inline-flex items-center gap-2">
            <Sparkles size={16} /> Lancer l'analyse
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g, idx) => (
            <ProspectCard
              key={g.prospect_id}
              group={g}
              defaultOpen={idx === 0}
              onRunSingle={runSingle}
              onPropose={(m, mail, nom) => openEmail(m, mail, nom)}
              onRefuse={handleRefuse}
              sendingEmail={sendingEmail}
              analyzing={analyzing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
