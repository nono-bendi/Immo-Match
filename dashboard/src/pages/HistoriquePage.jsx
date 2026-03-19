import { useState, useEffect } from 'react'
import { Clock, Calendar, Users, Building2, TrendingUp, ChevronDown, ChevronUp, Sparkles, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProspectLink from '../components/ProspectLink'
import BienLink from '../components/BienLink'
import { API_URL } from '../config'
import Pagination from '../components/Pagination'
import SparkleButton from '../components/SparkleButton'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Confetti from '../components/Confetti'

function HistoriquePage() {
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState(null)
  const [analyseDetails, setAnalyseDetails] = useState({})
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null) // date_complete du batch actif
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const navigate = useNavigate()

  // États analyse (même logique que MatchingsPage)
  const [analyzing, setAnalyzing] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [totalProspects, setTotalProspects] = useState(0)
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentProspectName, setCurrentProspectName] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/historique`)
      .then(res => res.json())
      .then(data => {
        setHistorique(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Lancer une analyse globale (identique à MatchingsPage) ──
  const runGlobalAnalysis = async () => {
    setAnalyzing(true)
    setShowOverlay(true)
    setCurrentProspectIndex(0)
    setCurrentProspectName('')

    try {
      const prospects = await fetch(`${API_URL}/prospects`).then(r => r.json())
      if (!Array.isArray(prospects) || prospects.length === 0) {
        alert('Aucun prospect à analyser')
        setShowOverlay(false)
        setAnalyzing(false)
        return
      }
      setTotalProspects(prospects.length)
      let totalMatchings = 0
      for (let i = 0; i < prospects.length; i++) {
        setCurrentProspectIndex(i + 1)
        setCurrentProspectName(prospects[i].nom || `Prospect ${prospects[i].id}`)
        try {
          const data = await fetch(`${API_URL}/matching/run/${prospects[i].id}`, { method: 'POST' }).then(r => r.json())
          if (data.matchings_count) totalMatchings += data.matchings_count
        } catch (err) { console.error(err) }
      }
      setShowOverlay(false)
      // Recharger l'historique
      const data = await fetch(`${API_URL}/historique`).then(r => r.json())
      setHistorique(Array.isArray(data) ? data : [])
      const hasExcellent = await fetch(`${API_URL}/matchings`).then(r => r.json()).then(d => d.some(m => m.score >= 80))
      if (hasExcellent) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }
      alert(`Analyse terminée ! ${totalMatchings} matchings trouvés.`)
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert('Erreur lors de l\'analyse')
      setShowOverlay(false)
    }
    setAnalyzing(false)
  }

  // ── Grouper en sessions : gap < 2 min entre analyses consécutives ──
  const sessions = (() => {
    if (!historique.length) return []
    const GAP_MS = 2 * 60 * 1000
    const groups = []
    let current = [historique[0]]

    for (let i = 1; i < historique.length; i++) {
      const prev = new Date(historique[i - 1].date_complete)
      const curr = new Date(historique[i].date_complete)
      if (Math.abs(prev - curr) <= GAP_MS) {
        current.push(historique[i])
      } else {
        groups.push(current)
        current = [historique[i]]
      }
    }
    groups.push(current)

    return groups.map(batches => {
      const isMulti = batches.length > 1
      const totalProspects = isMulti
        ? batches.reduce((s, a) => s + a.nb_prospects, 0)
        : batches[0].nb_prospects
      const totalMatchings = batches.reduce((s, a) => s + a.nb_matchings, 0)
      const scoreMoyen = Math.round(batches.reduce((s, a) => s + a.score_moyen, 0) / batches.length)
      const nbExcellents = batches.reduce((s, a) => s + (a.nb_excellents || 0), 0)
      const scoreMax = Math.max(...batches.map(a => a.score_max || a.score_moyen || 0))
      return {
        isMulti,
        date: batches[0].date,
        heure: batches[batches.length - 1].heure,
        date_complete: batches[0].date_complete,
        nb_prospects: totalProspects,
        nb_biens: Math.max(...batches.map(a => a.nb_biens)),
        nb_matchings: totalMatchings,
        score_moyen: scoreMoyen,
        nb_excellents: nbExcellents,
        score_max: scoreMax,
        batches,
      }
    })
  })()

  const loadBatchDetails = async (dateComplete) => {
    if (analyseDetails[dateComplete]) return
    setLoadingDetails(true)
    try {
      const res = await fetch(`${API_URL}/matchings/by-date?date_analyse=${encodeURIComponent(dateComplete)}`)
      const data = await res.json()
      setAnalyseDetails(prev => ({ ...prev, [dateComplete]: data }))
    } catch (err) {
      console.error('Erreur:', err)
    }
    setLoadingDetails(false)
  }

  const toggleSession = async (session) => {
    if (expandedSession === session.date_complete) {
      setExpandedSession(null)
      setSelectedBatch(null)
      return
    }
    setExpandedSession(session.date_complete)
    // Charger le premier batch par défaut
    const firstBatch = session.batches[session.batches.length - 1] // le plus récent = dernier lancé
    setSelectedBatch(firstBatch.date_complete)
    await loadBatchDetails(firstBatch.date_complete)
  }

  const selectBatch = async (dateComplete) => {
    setSelectedBatch(dateComplete)
    await loadBatchDetails(dateComplete)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatHeure = (h) => h ? h.substring(0, 5) : ''

  const formatBudget = (budget) => {
    if (!budget) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
  }

  const scoreColor = (s) => s >= 75 ? 'text-emerald-600' : s >= 50 ? 'text-amber-600' : 'text-red-500'
  const scoreBg    = (s) => s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const scoreRing  = (s) => s >= 75 ? 'ring-emerald-500 text-emerald-600' : s >= 50 ? 'ring-amber-500 text-amber-600' : 'ring-red-500 text-red-600'

  const totalPages = Math.ceil(sessions.length / itemsPerPage)
  const paginated = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <Confetti show={showConfetti} />
      <AnalysisOverlay
        isVisible={showOverlay}
        totalProspects={totalProspects}
        currentProspect={currentProspectIndex}
        currentProspectName={currentProspectName}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Historique</h1>
          <p className="text-sm text-gray-400">{historique.length} analyse{historique.length > 1 ? 's' : ''} effectuée{historique.length > 1 ? 's' : ''}</p>
        </div>
          <SparkleButton onClick={runGlobalAnalysis} disabled={analyzing}>
            {analyzing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={18} /> Lancer l'analyse
              </span>
            )}
          </SparkleButton>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">Chargement...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">Aucune analyse</h2>
          <p className="text-gray-400 mb-4">Lancez votre première analyse IA</p>
          <button onClick={() => navigate('/matchings')} className="px-5 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-xl hover:bg-[#2D5A8A] transition-colors">
            Lancer une analyse
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {paginated.map((session, index) => {
              const isExpanded = expandedSession === session.date_complete
              const currentDetails = analyseDetails[selectedBatch] || []

              return (
                <div key={index}>
                  {/* ── Ligne principale ── */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Gauche */}
                      <div className="flex items-center gap-4">
                        {/* Icône + badge nb séries */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8A] rounded-xl flex items-center justify-center">
                            <Calendar size={18} className="text-white" />
                          </div>
                          {session.isMulti && (
                            <div className="absolute -top-1.5 -right-1.5 bg-violet-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                              {session.batches.length}
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#1E3A5F] capitalize">{formatDate(session.date)}</p>
                            {session.isMulti && (
                              <span className="text-[10px] font-semibold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Analyse complète · {session.batches.length} séries
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{formatHeure(session.heure)}</p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-blue-500" />
                            {session.nb_prospects} prospect{session.nb_prospects > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-emerald-500" />
                            {session.nb_biens} biens
                          </span>
                          <span className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-violet-500" />
                            {session.nb_matchings} matchings
                          </span>
                        </div>
                      </div>

                      {/* Droite : score + chevron */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full ring-2 ${scoreRing(session.isMulti ? Math.round(session.score_moyen) : session.score_max)} flex items-center justify-center bg-white`}>
                            <span className="text-lg font-bold">{session.isMulti ? Math.round(session.score_moyen) : session.score_max}</span>
                          </div>
                          <span className={`text-[10px] font-semibold tracking-wide uppercase ${session.isMulti ? 'text-gray-400' : (session.score_max >= 75 ? 'text-emerald-500' : session.score_max >= 50 ? 'text-amber-500' : 'text-red-400')}`}>
                            {session.isMulti ? 'moyenne' : 'meilleur'}
                          </span>
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Détails expandés ── */}
                  {isExpanded && (
                    <div className="bg-[#F8FAFC] border-t border-gray-100">

                      {/* Onglets séries — seulement si analyse complète */}
                      {session.isMulti && (
                        <div className="px-5 pt-4 pb-0">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Sélectionnez une série
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[...session.batches].reverse().map((batch, bi) => {
                              const isActive = selectedBatch === batch.date_complete
                              const sc = Math.round(batch.score_moyen)
                              return (
                                <button
                                  key={bi}
                                  onClick={e => { e.stopPropagation(); selectBatch(batch.date_complete) }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                    isActive
                                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
                                  }`}
                                >
                                  <span className="font-semibold">Série {session.batches.length - bi}</span>
                                  <span className={isActive ? 'text-white/60' : 'text-gray-400'}>{formatHeure(batch.heure)}</span>
                                  <span className={`font-bold ${isActive ? 'text-white' : scoreColor(sc)}`}>{sc}</span>
                                  <span className={isActive ? 'text-white/40' : 'text-gray-300'}>·</span>
                                  <span className={isActive ? 'text-white/60' : 'text-gray-400'}>
                                    {batch.nb_prospects}p · {batch.nb_matchings}m
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Matchings du batch sélectionné */}
                      <div className="p-5">
                        {loadingDetails ? (
                          <div className="text-center py-6">
                            <div className="w-6 h-6 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Chargement...</p>
                          </div>
                        ) : currentDetails.length === 0 ? (
                          <p className="text-center py-4 text-gray-400 text-sm">Aucun matching pour cette série</p>
                        ) : (
                          <div className="space-y-3">
                            {Object.values(
                              currentDetails.reduce((acc, match) => {
                                if (!acc[match.prospect_id]) {
                                  acc[match.prospect_id] = {
                                    prospect: {
                                      id: match.prospect_id,
                                      nom: match.prospect_nom,
                                      budget_max: match.prospect_budget,
                                      mail: match.prospect_mail,
                                      telephone: match.prospect_tel,
                                    },
                                    matchings: []
                                  }
                                }
                                acc[match.prospect_id].matchings.push(match)
                                return acc
                              }, {})
                            ).map((group, gIndex) => (
                              <div key={gIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                  <ProspectLink prospect={group.prospect} className="font-semibold text-[#1E3A5F] text-sm">
                                    {group.prospect.nom}
                                  </ProspectLink>
                                  <span className="text-xs text-gray-400">Budget : {formatBudget(group.prospect.budget_max)}</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                  {group.matchings.map((match, mIndex) => (
                                    <div key={mIndex} className="px-4 py-2.5 flex items-center gap-3">
                                      <div className={`${scoreBg(match.score)} text-white text-sm font-bold w-9 h-9 rounded-lg flex items-center justify-center shrink-0`}>
                                        {match.score}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <BienLink bien={{
                                          id: match.bien_id, type: match.bien_type,
                                          ville: match.bien_ville, prix: match.bien_prix,
                                          surface: match.bien_surface
                                        }} className="text-sm" />
                                        <p className="text-xs text-gray-400">
                                          {formatBudget(match.bien_prix)} · {match.bien_surface || '-'} m²
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sessions.length}
              itemsPerPage={itemsPerPage}
              onChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default HistoriquePage