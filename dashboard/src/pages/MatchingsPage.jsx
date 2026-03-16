import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Clock, ChevronDown, ChevronUp, Home, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, XCircle } from 'lucide-react'
import ProspectLink from '../components/ProspectLink'
import BienLink from '../components/BienLink'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'
import SparkleButton from '../components/SparkleButton'
import EmailModal from '../components/EmailModal'
import Pagination from '../components/Pagination'

import { API_URL } from '../config'

const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(' ').filter(p => p.length > 0)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Skeleton pour le chargement
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-100">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg animate-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded animate-shimmer" />
          <div className="h-3 w-20 rounded animate-shimmer" />
        </div>
      </div>
      <div className="col-span-3">
        <div className="h-4 w-28 rounded animate-shimmer" />
        <div className="h-3 w-20 rounded animate-shimmer mt-1" />
      </div>
      <div className="col-span-1 flex justify-center">
        <div className="w-12 h-12 rounded-lg animate-shimmer" />
      </div>
      <div className="col-span-2 flex justify-center">
        <div className="h-4 w-16 rounded animate-shimmer" />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <div className="w-8 h-8 rounded-lg animate-shimmer" />
        <div className="w-8 h-8 rounded-lg animate-shimmer" />
      </div>
    </div>
  )
}

function MatchingsPage() {
  const [matchings, setMatchings] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterScore, setFilterScore] = useState('all')
  const [expandedProspect, setExpandedProspect] = useState(null)
  const location = useLocation()

  // Auto-expand prospect si on arrive depuis le dashboard
  useEffect(() => {
    if (location.state?.prospectId) {
      setExpandedProspect(location.state.prospectId)
      // Scroll vers le prospect après rendu
      setTimeout(() => {
        const el = document.getElementById(`prospect-${location.state.prospectId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [location.state])
  const [expandedMatchings, setExpandedMatchings] = useState({})
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [sendingEmail, setSendingEmail] = useState(null)

  // États pour la modal d'email
  const [emailModal, setEmailModal] = useState({ 
    isOpen: false, 
    type: 'confirm',
    data: null,
    isLoading: false
  })
  const [pendingEmail, setPendingEmail] = useState(null)
  
  // États pour l'aperçu email
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({
    subject: '',
    intro: '',
    points_forts: '',
    points_attention: '',
    recommandation: '',
    conclusion: ''
  })

  // États pour l'overlay
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayCompleted, setOverlayCompleted] = useState(false)
  const [totalProspects, setTotalProspects] = useState(0)
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentProspectName, setCurrentProspectName] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [pendingScrollTo, setPendingScrollTo] = useState(null)

  const fetchData = () => {
    setLoading(true)
    return fetch(`${API_URL}/matchings`)
      .then(res => res.json())
      .then(matchingsData => {
        const data = Array.isArray(matchingsData) ? matchingsData : []
        setMatchings(data)
        if (data.length > 0) setLastAnalysis(data[0].date_analyse)
        setLoading(false)
        return data
      })
      .catch(error => {
        console.error('Erreur:', error)
        setLoading(false)
        return []
      })
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Après analyse individuelle : naviguer vers la bonne page et scroller vers le prospect
  useEffect(() => {
    if (!pendingScrollTo || prospectGroups.length === 0) return
    const id = pendingScrollTo
    const idx = prospectGroups.findIndex(g => g.prospect_id === id)
    if (idx === -1) return
    setCurrentPage(Math.floor(idx / itemsPerPage) + 1)
    setExpandedProspect(id)
    setPendingScrollTo(null)
    setTimeout(() => {
      const el = document.getElementById(`prospect-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScrollTo, matchings])

  const runGlobalAnalysis = async () => {
    setAnalyzing(true)
    setShowOverlay(true)
    setCurrentProspectIndex(0)
    setCurrentProspectName('')

    try {
      const prospectsRes = await fetch(`${API_URL}/prospects`)
      const prospects = await prospectsRes.json()
      
      if (!Array.isArray(prospects) || prospects.length === 0) {
        alert('Aucun prospect à analyser')
        setShowOverlay(false)
        setAnalyzing(false)
        return
      }

      setTotalProspects(prospects.length)

      let totalMatchings = 0
      for (let i = 0; i < prospects.length; i++) {
        const prospect = prospects[i]
        setCurrentProspectIndex(i + 1)
        setCurrentProspectName(prospect.nom || `Prospect ${prospect.id}`)

        try {
          const response = await fetch(`${API_URL}/matching/run/${prospect.id}`, { method: 'POST' })
          const data = await response.json()
          if (data.matchings_count) {
            totalMatchings += data.matchings_count
          }
        } catch (err) {
          console.error(`Erreur pour ${prospect.nom}:`, err)
        }
      }

      setShowOverlay(false)
      fetchData()

      const hasExcellent = await fetch(`${API_URL}/matchings`).then(r => r.json()).then(data => 
        data.some(m => m.score >= 80)
      )
      if (hasExcellent) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }

      alert(`Analyse terminée ! ${totalMatchings} matchings trouvés pour ${prospects.length} prospects.`)

    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'analyse')
      setShowOverlay(false)
    }

    setAnalyzing(false)
  }

  const runSingleAnalysis = async (e, prospectId, prospectName) => {
    e.stopPropagation()
    setAnalyzing(true)
    setShowOverlay(true)
    setOverlayCompleted(false)
    setTotalProspects(1)
    setCurrentProspectIndex(1)
    setCurrentProspectName(prospectName || 'Prospect')

    try {
      const response = await fetch(`${API_URL}/matching/run/${prospectId}`, { method: 'POST' })
      const data = await response.json()
      if (data.error) {
        alert('Erreur: ' + data.error)
      } else {
        const updatedMatchings = await fetchData()
        setPendingScrollTo(prospectId)

        if (data.matchings_count > 0) {
          const hasExcellent = updatedMatchings
            .filter(m => m.prospect_id === prospectId)
            .some(m => m.score >= 80)
          if (hasExcellent) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
          }
        }
      }
    } catch {
      alert('Erreur lors de l\'analyse')
    }

    setOverlayCompleted(true)
    setTimeout(() => {
      setShowOverlay(false)
      setOverlayCompleted(false)
      setAnalyzing(false)
    }, 700)
  }

  const formatBudget = (budget) => {
    if (!budget) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getScoreStyle = (score) => {
    if (score >= 75) return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', label: 'Excellent' }
    if (score >= 50) return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', label: 'Correct' }
    return { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', label: 'Faible' }
  }

  const getFirstPhotoUrl = (photosValue) => {
    if (!photosValue || typeof photosValue !== 'string') return null
    const candidates = photosValue
      .split('|')
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item))
    return candidates[0] || null
  }

  const buildDefaultEmailContent = (match) => ({
    subject: `Proposition immobilière - ${match.bien_type} à ${match.bien_ville} | Saint François Immobilier`,
    intro: 'Suite à notre échange, j\'ai identifié un bien qui pourrait vous intéresser. Voici pourquoi je pense qu\'il mérite votre attention.',
    points_forts: match.points_forts || '',
    points_attention: match.points_attention || '',
    recommandation: match.recommandation || '',
    conclusion: 'Ce bien vous intéresse ? N\'hésitez pas à me contacter pour organiser une visite ou obtenir plus d\'informations.'
  })

  // Charge l'aperçu de l'email
  const loadEmailPreview = async (match, prospectMail, prospectNom, contentOverride = null) => {
    setPreviewLoading(true)
    setPreviewHtml(null)

    const content = contentOverride || buildDefaultEmailContent(match)

    try {
      const response = await fetch(`${API_URL}/preview-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: prospectMail.trim(),
          to_name: prospectNom || 'Madame, Monsieur',
          subject: content.subject || `Proposition immobilière - ${match.bien_type} à ${match.bien_ville} | Saint François Immobilier`,
          bien_type: match.bien_type || 'Bien immobilier',
          bien_ville: match.bien_ville || 'Non précisé',
          bien_prix: formatBudget(match.bien_prix),
          bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null,
          bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null,
          points_forts: content.points_forts || null,
          points_attention: content.points_attention || null,
          recommandation: content.recommandation || null,
          lien_annonce: match.lien_annonce || null,
          bien_image_url: getFirstPhotoUrl(match.bien_photos),
          custom_intro: content.intro || null,
          custom_conclusion: content.conclusion || null
        })
      })

      const result = await response.json()

      if (result.success) {
        setPreviewHtml(result.html)
      }
    } catch (err) {
      console.error('Erreur preview:', err)
    }

    setPreviewLoading(false)
  }

  // Ouvre la modal de confirmation d'envoi
  const openEmailConfirmation = (e, match, prospectMail, prospectNom) => {
    e.stopPropagation()
    
    if (!prospectMail) {
      setEmailModal({
        isOpen: true,
        type: 'error',
        data: { error: 'Ce prospect n\'a pas d\'adresse email enregistrée.' },
        isLoading: false
      })
      return
    }

    const initialEmailContent = buildDefaultEmailContent(match)
    setEmailContent(initialEmailContent)
    setPendingEmail({ match, prospectMail, prospectNom })

    loadEmailPreview(match, prospectMail, prospectNom, initialEmailContent)

    setEmailModal({
      isOpen: true,
      type: 'confirm',
      data: {
        prospectNom,
        prospectMail,
        bienType: match.bien_type || 'Bien immobilier',
        bienVille: match.bien_ville || 'Non précisé',
        bienPrix: formatBudget(match.bien_prix)
      },
      isLoading: false
    })
  }

  const regeneratePreview = () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    loadEmailPreview(match, prospectMail, prospectNom, emailContent)
  }

  // Envoie réellement l'email après confirmation
  const confirmSendEmail = async () => {
    if (!pendingEmail) return
    
    const { match, prospectMail, prospectNom } = pendingEmail
    
    setEmailModal(prev => ({ ...prev, isLoading: true }))
    setSendingEmail(match.id)
    
    try {
      const response = await fetch(`${API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: prospectMail.trim(),
          to_name: prospectNom || 'Madame, Monsieur',
          subject: emailContent.subject || `Proposition immobilière - ${match.bien_type} à ${match.bien_ville} | Saint François Immobilier`,
          bien_type: match.bien_type || 'Bien immobilier',
          bien_ville: match.bien_ville || 'Non précisé',
          bien_prix: formatBudget(match.bien_prix),
          bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null,
          bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null,
          points_forts: emailContent.points_forts || null,
          points_attention: emailContent.points_attention || null,
          recommandation: emailContent.recommandation || null,
          lien_annonce: match.lien_annonce || null,
          bien_image_url: getFirstPhotoUrl(match.bien_photos),
          custom_intro: emailContent.intro || null,
          custom_conclusion: emailContent.conclusion || null
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Marquer comme envoyé dans la BDD
        await fetch(`${API_URL}/matchings/${match.id}/email-sent`, { method: 'PATCH' })
        
        // Mettre à jour l'état local
        setMatchings(prev => prev.map(m => 
          m.id === match.id 
            ? { ...m, date_email_envoye: new Date().toISOString() }
            : m
        ))
        
        setEmailModal({
          isOpen: true,
          type: 'success',
          data: {
            prospectNom,
            bienType: match.bien_type,
            bienVille: match.bien_ville
          },
          isLoading: false
        })
      } else {
        setEmailModal({
          isOpen: true,
          type: 'error',
          data: { error: result.error || 'Erreur lors de l\'envoi' },
          isLoading: false
        })
      }
    } catch (err) {
      console.error('Erreur envoi email:', err)
      setEmailModal({
        isOpen: true,
        type: 'error',
        data: { error: 'Erreur de connexion au serveur' },
        isLoading: false
      })
    }
    
    setSendingEmail(null)
    setPendingEmail(null)
  }

  // Ferme la modal
  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false })
    setPendingEmail(null)
    setPreviewHtml(null)
    setEmailContent({
      subject: '',
      intro: '',
      points_forts: '',
      points_attention: '',
      recommandation: '',
      conclusion: ''
    })
  }

  // Filtrer les matchings
  const filteredMatchings = matchings.filter(m => {
    const matchesSearch = m.prospect_nom?.toLowerCase().includes(search.toLowerCase()) ||
                         m.bien_ville?.toLowerCase().includes(search.toLowerCase())
    const matchesScore = filterScore === 'all' ||
                        (filterScore === 'high' && m.score >= 75) ||
                        (filterScore === 'medium' && m.score >= 50 && m.score < 75) ||
                        (filterScore === 'low' && m.score < 50)
    return matchesSearch && matchesScore
  })

  const handleRefuse = async (e, match) => {
    e.stopPropagation()
    const isRefused = match.statut_prospect === 'refused'
    try {
      await fetch(`${API_URL}/matchings/${match.id}/statut-prospect`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: isRefused ? null : 'refused' })
      })
      setMatchings(prev => prev.map(m =>
        m.id === match.id ? { ...m, statut_prospect: isRefused ? null : 'refused' } : m
      ))
    } catch (err) {
      console.error('Erreur statut:', err)
    }
  }

  // Regrouper par prospect
  const groupedByProspect = filteredMatchings.reduce((acc, match) => {
    const prospectId = match.prospect_id
    if (!acc[prospectId]) {
      acc[prospectId] = {
        prospect_id: prospectId,
        prospect_nom: match.prospect_nom,
        prospect_budget: match.prospect_budget,
        prospect_mail: match.prospect_mail,
        prospect_tel: match.prospect_tel,
        matchings: []
      }
    }
    acc[prospectId].matchings.push(match)
    return acc
  }, {})

  const prospectGroups = Object.values(groupedByProspect).sort((a, b) => {
    const maxScoreA = Math.max(...a.matchings.map(m => m.score))
    const maxScoreB = Math.max(...b.matchings.map(m => m.score))
    return maxScoreB - maxScoreA
  })

  const totalPages = Math.ceil(prospectGroups.length / itemsPerPage)
  const paginatedGroups = prospectGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <Confetti show={showConfetti} />
      
      {/* Modal d'envoi d'email */}
      <EmailModal 
        isOpen={emailModal.isOpen}
        onClose={closeEmailModal}
        type={emailModal.type}
        data={emailModal.data}
        onConfirm={confirmSendEmail}
        isLoading={emailModal.isLoading}
        previewHtml={previewHtml}
        previewLoading={previewLoading}
        emailContent={emailContent}
        setEmailContent={setEmailContent}
        onRegeneratePreview={regeneratePreview}
      />
      
      <AnalysisOverlay
        isVisible={showOverlay}
        totalProspects={totalProspects}
        currentProspect={currentProspectIndex}
        currentProspectName={currentProspectName}
        isCompleted={overlayCompleted}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Matchings IA</h1>
          <p className="text-sm text-gray-400 mt-1">
            {matchings.length} matchings • {prospectGroups.length} prospects
          </p>
        </div>

        <div className="flex items-center gap-4">
          {lastAnalysis && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-200">
              <Clock size={16} />
              <span>{formatDate(lastAnalysis)}</span>
            </div>
          )}
           
          <SparkleButton
            onClick={runGlobalAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={18} />
                Lancer l'analyse
              </span>
            )}
          </SparkleButton>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un prospect ou une ville..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {[
              { value: 'all',    label: 'Tous',   activeClass: 'bg-[#1E3A5F] text-white',        inactiveClass: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
              { value: 'high',   label: '75+',    activeClass: 'bg-emerald-500 text-white',       inactiveClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { value: 'medium', label: '50-74',  activeClass: 'bg-amber-500 text-white',         inactiveClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              { value: 'low',    label: '< 50',   activeClass: 'bg-red-500 text-white',           inactiveClass: 'bg-red-50 text-red-600 hover:bg-red-100' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => { setFilterScore(filter.value); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterScore === filter.value ? filter.activeClass : filter.inactiveClass
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-4">Prospect</div>
            <div className="col-span-3">Meilleur match</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-2 text-center">Nb biens</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : prospectGroups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} className="text-gray-300 animate-float" />
          </div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">Aucun matching trouvé</h2>
          <p className="text-gray-400 mb-4">Lancez une analyse pour trouver des correspondances</p>
          <button
            onClick={runGlobalAnalysis}
            disabled={analyzing}
            className="px-5 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-xl btn-press inline-flex items-center gap-2"
          >
            <Sparkles size={18} />
            Lancer l'analyse
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header tableau */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-4">Prospect</div>
            <div className="col-span-3">Meilleur match</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-2 text-center">Nb biens</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Lignes */}
          {paginatedGroups.map((group) => {
            const bestMatch = group.matchings.reduce((best, m) => m.score > best.score ? m : best, group.matchings[0])
            const bestStyle = getScoreStyle(bestMatch.score)
            const isExpanded = expandedProspect === group.prospect_id

            return (
              <div key={group.prospect_id} id={`prospect-${group.prospect_id}`} className="border-b border-gray-100 last:border-b-0">
                {/* Ligne principale */}
                <div 
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  onClick={() => setExpandedProspect(isExpanded ? null : group.prospect_id)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8A] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(group.prospect_nom)}
                    </div>
                    <div>
                      <ProspectLink prospect={{ 
                        id: group.prospect_id, 
                        nom: group.prospect_nom, 
                        mail: group.prospect_mail,
                        telephone: group.prospect_tel,
                        budget_max: group.prospect_budget
                      }}>
                        {group.prospect_nom}
                      </ProspectLink>
                      <p className="text-sm text-gray-400">{formatBudget(group.prospect_budget)}</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <BienLink bien={{ 
                      id: bestMatch.bien_id,
                      type: bestMatch.bien_type, 
                      ville: bestMatch.bien_ville, 
                      prix: bestMatch.bien_prix, 
                      surface: bestMatch.bien_surface 
                    }} className="text-sm" />
                    <p className="text-xs text-gray-400">{formatBudget(bestMatch.bien_prix)} • {bestMatch.bien_surface || '-'}m²</p>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`${bestStyle.bg} text-white font-bold w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform hover:scale-105`}>
                      {bestMatch.score}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                      {group.matchings.length} bien{group.matchings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => runSingleAnalysis(e, group.prospect_id, group.prospect_nom)}
                      disabled={analyzing}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all opacity-0 group-hover:opacity-100"
                      title="Relancer l'analyse"
                    >
                      <RefreshCw size={16} className="text-gray-600 icon-spin" />
                    </button>
                    <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Contenu étendu */}
                {isExpanded && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <div className="space-y-2">
                      {group.matchings.slice().sort((a, b) => { const aR = a.statut_prospect === "refused" ? 1 : 0; const bR = b.statut_prospect === "refused" ? 1 : 0; if (aR !== bR) return aR - bR; return b.score - a.score; }).map((match, matchIndex) => {
                        const style = getScoreStyle(match.score)
                        const isFirstMatch = matchIndex === 0
                        const isMatchExpanded = expandedMatchings[match.id] ?? isFirstMatch
                        
                        return (
                          <div 
                            key={match.id} 
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                          >
                            {/* Header du bien */}
                            <div 
                              className={"flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors " + (match.statut_prospect === "refused" ? "opacity-50 bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50")}
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedMatchings(prev => ({
                                  ...prev,
                                  [match.id]: !isMatchExpanded
                                }))
                              }}
                            >
                              {/* Score */}
                              <div className={`${style.bg} w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
                                {match.score}
                              </div>
                              
                              {/* Infos du bien */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Home size={14} className="text-gray-400 shrink-0" />
                                  <BienLink bien={{
                                    id: match.bien_id,
                                    type: match.bien_type, 
                                    ville: match.bien_ville, 
                                    prix: match.bien_prix, 
                                    surface: match.bien_surface 
                                  }} className="text-sm" />
                                  <span className={`text-xs px-2 py-0.5 rounded ${style.light} ${style.text}`}>{style.label}</span>
                                </div>
                                <p className="text-xs text-gray-400">{formatBudget(match.bien_prix)} • {match.bien_surface || '-'}m²</p>
                              </div>
                              
                              {/* Badge "Envoyé" + Bouton Proposer */}
                              <div className="flex items-center gap-2 shrink-0">
                                {match.statut_prospect === 'refused' && (
                                  <span className="text-xs text-red-400 bg-red-50 border border-red-100 px-2 py-1 rounded-lg whitespace-nowrap font-medium">
                                    Non intéressé
                                  </span>
                                )}
                                <button
                                  onClick={(e) => handleRefuse(e, match)}
                                  title={match.statut_prospect === 'refused' ? 'Annuler le refus' : 'Marquer non intéressé'}
                                  className={"p-1.5 rounded-lg transition-all " + (match.statut_prospect === 'refused' ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400')}
                                >
                                  <XCircle size={15} />
                                </button>
                                {match.date_email_envoye && (
                                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap">
                                    ? {new Date(match.date_email_envoye).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                                
                                <button
                                  onClick={(e) => openEmailConfirmation(e, match, group.prospect_mail, group.prospect_nom)}
                                  disabled={!group.prospect_mail || sendingEmail === match.id}
                                  className={`btn-send ${!group.prospect_mail ? 'disabled' : ''}`}
                                >
                                  {sendingEmail === match.id ? (
                                    <>
                                      <div className="svg-wrapper">
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      </div>
                                      <span>Envoi...</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="svg-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                                        </svg>
                                      </div>
                                      <span>{match.date_email_envoye ? 'Renvoyer' : 'Proposer'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              {/* Chevron expand */}
                              <ChevronDown 
                                size={16} 
                                className={`text-gray-400 shrink-0 transition-transform duration-200 ${isMatchExpanded ? 'rotate-180' : ''}`} 
                              />
                            </div>
                            
                            {/* Détails du bien */}
                            {isMatchExpanded && (
                              <div className="px-3 pb-3 pt-0">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="bg-emerald-50 rounded-lg p-2 hover:bg-emerald-100 transition-colors">
                                    <div className="flex items-center gap-1 text-emerald-700 font-medium text-xs mb-1">
                                      <CheckCircle size={10} />
                                      Points forts
                                    </div>
                                    <p className="text-xs text-emerald-600">
                                      {match.points_forts || 'Aucun'}
                                    </p>
                                  </div>
                                  <div className="bg-amber-50 rounded-lg p-2 hover:bg-amber-100 transition-colors">
                                    <div className="flex items-center gap-1 text-amber-700 font-medium text-xs mb-1">
                                      <AlertTriangle size={10} />
                                      Attention
                                    </div>
                                    <p className="text-xs text-amber-600">
                                      {match.points_attention || 'Aucun'}
                                    </p>
                                  </div>
                                  <div className="bg-[#DCE7F3] rounded-lg p-2 hover:bg-[#c5d9ed] transition-colors">
                                    <div className="flex items-center gap-1 text-[#1E3A5F] font-medium text-xs mb-1">
                                      <Lightbulb size={10} />
                                      Recommandation
                                    </div>
                                    <p className="text-xs text-[#2D5A8A]">
                                      {match.recommandation || 'Aucune'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={prospectGroups.length}
              itemsPerPage={itemsPerPage}
              onChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default MatchingsPage