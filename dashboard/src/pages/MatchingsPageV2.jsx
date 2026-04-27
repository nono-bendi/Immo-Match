import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, ChevronDown, ChevronUp, MapPin, Euro, Maximize2, CheckCircle, AlertTriangle, Lightbulb, Send, XCircle, ArrowLeft } from 'lucide-react'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'
import EmailModal from '../components/EmailModal'
import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'

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

const formatBudget = (v) => {
  if (!v) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ScoreBadge({ score, size = 'md' }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Correct' : 'Faible'
  const dim = size === 'lg' ? 52 : size === 'sm' ? 32 : 40
  const font = size === 'lg' ? 16 : size === 'sm' ? 11 : 13
  return (
    <div style={{ position: 'relative', width: dim, height: dim, flexShrink: 0 }} title={label}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim/2} cy={dim/2} r={dim/2 - 3} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx={dim/2} cy={dim/2} r={dim/2 - 3}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * (dim/2 - 3)}`}
          strokeDashoffset={`${2 * Math.PI * (dim/2 - 3) * (1 - score / 100)}`}
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: font, fontWeight: 700, color
      }}>{score}</span>
    </div>
  )
}

function BienChip({ match, selected, onClick }) {
  const color = match.score >= 75 ? 'emerald' : match.score >= 50 ? 'amber' : 'red'
  const dotColors = { emerald: '#10b981', amber: '#f59e0b', red: '#ef4444' }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
        selected
          ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-md'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F]/40 hover:text-[#1E3A5F]'
      }`}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: selected ? 'white' : dotColors[color], flexShrink: 0, display: 'inline-block' }} />
      <span className="font-bold">{match.score}</span>
      <span className={selected ? 'text-white/70' : 'text-gray-400'}>·</span>
      <span>{match.bien_ville}</span>
      <span className={selected ? 'text-white/70' : 'text-gray-400'}>·</span>
      <span>{formatBudget(match.bien_prix)}</span>
      {match.statut_prospect === 'refused' && <span className="text-xs opacity-60 ml-0.5">(refusé)</span>}
      {match.date_email_envoye && <Send size={10} className={selected ? 'text-white/70' : 'text-emerald-500'} />}
    </button>
  )
}

function BienDetail({ match, onPropose, onRefuse, onRerun, sendingEmail, prospectMail }) {
  const forts = parseBullets(match.points_forts)
  const attention = parseBullets(match.points_attention)
  const refused = match.statut_prospect === 'refused'

  return (
    <div className={`mt-3 rounded-xl border overflow-hidden transition-all ${refused ? 'opacity-60 border-red-100' : 'border-gray-200'}`}>
      {/* Bien header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#1E3A5F] text-sm">{match.bien_type}</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={12} />{match.bien_ville}
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Euro size={12} />{formatBudget(match.bien_prix)}
            </span>
            {match.bien_surface && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Maximize2 size={12} />{match.bien_surface} m²
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {refused && (
            <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">Non intéressé</span>
          )}
          <button
            onClick={onRefuse}
            title={refused ? 'Annuler le refus' : 'Marquer non intéressé'}
            className={`p-1.5 rounded-lg transition-all ${refused ? 'bg-red-100 text-red-400 hover:bg-red-200' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
          >
            <XCircle size={16} />
          </button>
          <button
            onClick={onPropose}
            disabled={!prospectMail || sendingEmail === match.id}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              !prospectMail
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-[#1E3A5F] text-white hover:bg-[#2D5A8A] shadow-sm hover:shadow-md'
            }`}
          >
            <Send size={13} />
            {match.date_email_envoye ? 'Renvoyer' : 'Proposer'}
          </button>
        </div>
      </div>

      {/* Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Points forts */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs uppercase tracking-wide mb-2">
            <CheckCircle size={12} /> Points forts
          </div>
          <ul className="space-y-1">
            {forts.length > 0 ? forts.map((f, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>{f}</span>
              </li>
            )) : <li className="text-xs text-gray-400 italic">Aucun</li>}
          </ul>
        </div>

        {/* Points attention */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-xs uppercase tracking-wide mb-2">
            <AlertTriangle size={12} /> Attention
          </div>
          <ul className="space-y-1">
            {attention.length > 0 ? attention.map((a, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            )) : <li className="text-xs text-gray-400 italic">Aucun</li>}
          </ul>
        </div>

        {/* Recommandation */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-[#1E3A5F] font-semibold text-xs uppercase tracking-wide mb-2">
            <Lightbulb size={12} /> Recommandation
          </div>
          <p className="text-xs text-gray-600 italic leading-relaxed">
            {match.recommandation || 'Aucune recommandation.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedBienId, setSelectedBienId] = useState(null)

  const sortedMatchings = [...group.matchings].sort((a, b) => {
    const aR = a.statut_prospect === 'refused' ? 1 : 0
    const bR = b.statut_prospect === 'refused' ? 1 : 0
    if (aR !== bR) return aR - bR
    return b.score - a.score
  })

  const bestMatch = sortedMatchings[0]
  const selectedMatch = selectedBienId
    ? sortedMatchings.find(m => m.id === selectedBienId) || bestMatch
    : bestMatch

  const handleExpand = () => {
    setExpanded(e => {
      if (!e) setSelectedBienId(bestMatch?.id ?? null)
      return !e
    })
  }

  const handleChipClick = (match) => {
    setSelectedBienId(match.id)
    if (!expanded) setExpanded(true)
  }

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 ${expanded ? 'border-[#1E3A5F]/30 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}>
      {/* Ligne principale */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={handleExpand}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#4A7FB5] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
          {getInitials(group.prospect_nom)}
        </div>

        {/* Nom + budget */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1E3A5F] text-sm truncate">{group.prospect_nom}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatBudget(group.prospect_budget)}</p>
        </div>

        {/* Meilleur bien résumé */}
        {bestMatch && (
          <div className="hidden sm:block flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{bestMatch.bien_type} · {bestMatch.bien_ville}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatBudget(bestMatch.bien_prix)}{bestMatch.bien_surface ? ` · ${bestMatch.bien_surface} m²` : ''}</p>
          </div>
        )}

        {/* Score + count + expand */}
        <div className="flex items-center gap-3 shrink-0">
          {bestMatch && <ScoreBadge score={bestMatch.score} size="md" />}
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onRunSingle(e, group.prospect_id, group.prospect_nom) }}
            disabled={analyzing}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
            title="Relancer l'analyse"
          >
            <RefreshCw size={14} />
          </button>
          <div className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${expanded ? 'bg-[#1E3A5F] text-white' : 'text-gray-400'}`}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Panel étendu */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {/* Chips biens */}
          <div className="flex gap-2 flex-wrap">
            {sortedMatchings.map(match => (
              <BienChip
                key={match.id}
                match={match}
                selected={selectedMatch?.id === match.id}
                onClick={() => handleChipClick(match)}
              />
            ))}
          </div>

          {/* Détail du bien sélectionné */}
          {selectedMatch && (
            <BienDetail
              match={selectedMatch}
              prospectMail={group.prospect_mail}
              sendingEmail={sendingEmail}
              onPropose={(e) => onPropose(e || {stopPropagation:()=>{}}, selectedMatch, group.prospect_mail, group.prospect_nom)}
              onRefuse={(e) => onRefuse(e || {stopPropagation:()=>{}}, selectedMatch)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function MatchingsPageV2() {
  const { agency } = useAgency()
  const agencyNom = agency?.nom || 'ImmoFlash'
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const filterBienId = searchParams.get('bien') ? parseInt(searchParams.get('bien')) : null

  const [matchings, setMatchings] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterScore, setFilterScore] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sendingEmail, setSendingEmail] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState(null)

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

  const getFirstPhotoUrl = (photosValue) => {
    if (!photosValue || typeof photosValue !== 'string') return null
    return photosValue.split('|').map(i => i.trim()).find(i => /^https?:\/\//i.test(i)) || null
  }

  const buildDefaultEmailContent = (match) => ({
    subject: `Proposition immobilière - ${match.bien_type} à ${match.bien_ville} | ${agencyNom}`,
    intro: 'Suite à notre échange, j\'ai identifié un bien qui pourrait vous intéresser.',
    points_forts: match.points_forts || '',
    points_attention: match.points_attention || '',
    recommandation: match.recommandation || '',
    conclusion: 'Ce bien vous intéresse ? N\'hésitez pas à me contacter pour organiser une visite.',
    lien_annonce: match.lien_annonce || ''
  })

  const fetchData = () => {
    setLoading(true)
    return apiFetch('/matchings').then(r => r.json()).then(data => {
      const d = Array.isArray(data) ? data : []
      setMatchings(d)
      if (d.length > 0) setLastAnalysis(d[0].date_analyse)
      setLoading(false)
      return d
    }).catch(() => { setLoading(false); return [] })
  }

  useEffect(() => { fetchData() }, [])

  const runGlobalAnalysis = async () => {
    cancelRef.current = false
    setAnalyzing(true); setShowOverlay(true); setCurrentProspectIndex(0)
    try {
      const prospects = await apiFetch('/prospects').then(r => r.json())
      if (!Array.isArray(prospects) || !prospects.length) { setShowOverlay(false); setAnalyzing(false); return }
      setTotalProspects(prospects.length)
      let total = 0
      for (let i = 0; i < prospects.length; i++) {
        if (cancelRef.current) break
        setCurrentProspectIndex(i + 1); setCurrentProspectName(prospects[i].nom || '')
        try { const d = await apiFetch(`/matching/run/${prospects[i].id}`, { method: 'POST' }).then(r => r.json()); if (d.matchings_count) total += d.matchings_count } catch {}
      }
      setShowOverlay(false); fetchData()
      if (!cancelRef.current) { const d = await apiFetch('/matchings').then(r => r.json()); if (d.some(m => m.score >= 80)) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) } }
    } catch { setShowOverlay(false) }
    setAnalyzing(false)
  }

  const runSingleAnalysis = async (e, prospectId, prospectName) => {
    e.stopPropagation()
    setAnalyzing(true); setShowOverlay(true); setOverlayCompleted(false)
    setTotalProspects(1); setCurrentProspectIndex(1); setCurrentProspectName(prospectName || '')
    try {
      const data = await apiFetch(`/matching/run/${prospectId}`, { method: 'POST' }).then(r => r.json())
      if (data.error) { alert('Erreur: ' + data.error) } else { await fetchData() }
    } catch { alert('Erreur lors de l\'analyse') }
    setOverlayCompleted(true)
    setTimeout(() => { setShowOverlay(false); setOverlayCompleted(false); setAnalyzing(false) }, 700)
  }

  const openEmailConfirmation = (e, match, prospectMail, prospectNom) => {
    e.stopPropagation()
    if (!prospectMail) { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Pas d\'email enregistré.' }, isLoading: false }); return }
    const draft = sessionStorage.getItem(`emailDraft_${match.id}`)
    const init = draft ? JSON.parse(draft) : buildDefaultEmailContent(match)
    setEmailContent(init)
    setPendingEmail({ match, prospectMail, prospectNom })
    loadEmailPreview(match, prospectMail, prospectNom, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom, prospectMail, bienType: match.bien_type, bienVille: match.bien_ville, bienPrix: formatBudget(match.bien_prix) }, isLoading: false })
  }

  const loadEmailPreview = async (match, mail, nom, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const r = await apiFetch('/preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: formatBudget(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }) })
      const res = await r.json()
      setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSendEmail = async () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true })); setSendingEmail(match.id)
    try {
      const res = await apiFetch('/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: formatBudget(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: getFirstPhotoUrl(match.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }) }).then(r => r.json())
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

  const closeEmailModal = () => { setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false }); setPendingEmail(null); setPreviewHtml(null) }

  const handleRefuse = async (e, match) => {
    e.stopPropagation && e.stopPropagation()
    const isRefused = match.statut_prospect === 'refused'
    try {
      await apiFetch(`/matchings/${match.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: isRefused ? null : 'refused' }) })
      setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, statut_prospect: isRefused ? null : 'refused' } : m))
    } catch {}
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
    if (!acc[m.prospect_id]) acc[m.prospect_id] = { prospect_id: m.prospect_id, prospect_nom: m.prospect_nom, prospect_budget: m.prospect_budget, prospect_mail: m.prospect_mail, prospect_tel: m.prospect_tel, matchings: [] }
    acc[m.prospect_id].matchings.push(m)
    return acc
  }, {})

  const groups = Object.values(grouped).sort((a, b) => {
    if (sortBy === 'recent') return Math.max(...b.matchings.map(m => new Date(m.date_analyse).getTime())) - Math.max(...a.matchings.map(m => new Date(m.date_analyse).getTime()))
    if (sortBy === 'alpha') return (a.prospect_nom || '').localeCompare(b.prospect_nom || '', 'fr')
    return Math.max(...b.matchings.map(m => m.score_pondere ?? m.score)) - Math.max(...a.matchings.map(m => m.score_pondere ?? m.score))
  })

  return (
    <div className="max-w-4xl mx-auto">
      <Confetti show={showConfetti} />
      <EmailModal isOpen={emailModal.isOpen} onClose={closeEmailModal} type={emailModal.type} data={emailModal.data} onConfirm={confirmSendEmail} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadEmailPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
      <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/matchings')} className="p-2 rounded-xl text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 transition-all" title="Retour ancienne vue">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Matchings</h1>
              <span className="text-xs font-bold bg-[#1E3A5F] text-white px-2 py-0.5 rounded-full">v2 test</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{groups.length} prospect{groups.length > 1 ? 's' : ''} · {filtered.length} matchings{lastAnalysis ? ` · ${formatDate(lastAnalysis)}` : ''}</p>
          </div>
        </div>

        <button
          onClick={runGlobalAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl hover:bg-[#2D5A8A] transition-all shadow-sm disabled:opacity-50"
        >
          {analyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />}
          {analyzing ? 'Analyse…' : 'Lancer l\'analyse'}
        </button>
      </div>

      {/* Filtres simplifiés */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Prospect ou ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { value: 'all', label: 'Tous', cls: 'bg-[#1E3A5F] text-white' },
            { value: 'high', label: '75+', cls: 'bg-emerald-500 text-white' },
            { value: 'medium', label: '50–74', cls: 'bg-amber-500 text-white' },
            { value: 'low', label: '< 50', cls: 'bg-red-500 text-white' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterScore(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterScore === f.value ? f.cls : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >{f.label}</button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="ml-auto text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 cursor-pointer"
        >
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

      {/* Contenu */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-40 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-lg w-24 animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-[#1E3A5F] mb-1">Aucun matching</p>
          <p className="text-sm text-gray-400 mb-5">Lancez une analyse pour trouver des correspondances</p>
          <button onClick={runGlobalAnalysis} disabled={analyzing} className="px-5 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl inline-flex items-center gap-2">
            <Sparkles size={16} /> Lancer l'analyse
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <ProspectCard
              key={group.prospect_id}
              group={group}
              onRunSingle={runSingleAnalysis}
              onPropose={openEmailConfirmation}
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
