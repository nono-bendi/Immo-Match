import { useState, useEffect } from 'react'
import {
  X, Building2, Euro, Maximize, Home,
  AlertCircle, Sparkles, Loader2, CheckCircle2, ChevronRight, Save
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const DEFAUT_TAGS = [
  'Vis-à-vis', 'Pas de parking', 'Sans ascenseur', 'Bruit de rue',
  'Rez-de-chaussée', 'Petite surface', 'Travaux à prévoir',
  'Charges élevées', "Pas d'extérieur",
]

const getScoreStyle = (score) => {
  if (score >= 75) return { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' }
  if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' }
  return { bg: 'bg-red-400', text: 'text-red-700', light: 'bg-red-50' }
}

function NewBienModal({ bienId, onClose }) {
  const [bien, setBien] = useState(null)
  const [defauts, setDefauts] = useState('')
  const [matchings, setMatchings] = useState([])
  const [loadingBien, setLoadingBien] = useState(true)
  const [loadingMatchings, setLoadingMatchings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyseState, setAnalyseState] = useState('idle')
  const navigate = useNavigate()

  const formatPrix = v =>
    v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : null

  useEffect(() => {
    apiFetch(`/biens/${bienId}`)
      .then(r => r.json())
      .then(data => { setBien(data); setDefauts(data.defauts || ''); setLoadingBien(false) })
      .catch(() => setLoadingBien(false))

    apiFetch(`/matchings/by-bien/${bienId}`)
      .then(r => r.json())
      .then(data => { setMatchings(Array.isArray(data) ? data.filter(m => m.score >= 70) : []); setLoadingMatchings(false) })
      .catch(() => setLoadingMatchings(false))
  }, [bienId])

  const toggleTag = (tag) => {
    const current = defauts || ''
    const parts = current.split(', ').filter(Boolean)
    const next = parts.includes(tag)
      ? parts.filter(t => t !== tag).join(', ')
      : parts.length ? current + ', ' + tag : tag
    setDefauts(next)
  }

  const handleAnalyser = async () => {
    setAnalyseState('loading')

    await apiFetch(`/biens/${bienId}/defauts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defauts })
    })

    try {
      const res = await apiFetch(`/matching/run-by-bien/${bienId}`, { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setAnalyseState('error')
      } else {
        // Recharger les matchings
        const updated = await apiFetch(`/matchings/by-bien/${bienId}`).then(r => r.json())
        setMatchings(Array.isArray(updated) ? updated.filter(m => m.score >= 70) : [])
        setAnalyseState('done')
      }
    } catch {
      setAnalyseState('error')
    }
  }

  const photos = bien?.photos ? bien.photos.split('|').filter(p => p.trim()) : []
  const photo = photos[0]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 flex-shrink-0">
          {photo ? (
            <div className="h-40 relative">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold shadow">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Nouveau bien
              </span>
              <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition-all">
                <X size={16} className="text-white" />
              </button>
              {!loadingBien && bien && (
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <h2 className="text-lg font-bold text-white">{bien.type} à {bien.ville}</h2>
                  <div className="flex items-center gap-3 mt-1 text-white/80 text-xs">
                    {bien.prix && <span className="flex items-center gap-1"><Euro size={12} />{formatPrix(bien.prix)}</span>}
                    {bien.surface && <span className="flex items-center gap-1"><Maximize size={12} />{bien.surface} m²</span>}
                    {bien.pieces && <span className="flex items-center gap-1"><Home size={12} />{bien.pieces} pièces</span>}
                  </div>
                  {bien.nom_agence && (
                    <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
                      <Building2 size={11} />{bien.nom_agence}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> Nouveau bien
                </span>
                <h2 className="text-lg font-bold text-white">{loadingBien ? '...' : `${bien?.type} à ${bien?.ville}`}</h2>
                {bien?.nom_agence && (
                  <p className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                    <Building2 size={11} />{bien.nom_agence}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-all">
                <X size={16} className="text-white" />
              </button>
            </div>
          )}

        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Résultats analyse existante */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Résultats de l'analyse automatique</h3>
            {loadingMatchings ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : matchings.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                {loadingMatchings
                  ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin text-gray-400" />Analyse en cours...</span>
                  : 'Aucun prospect avec un score ≥ 70 pour ce bien'}
              </div>
            ) : (
              <div className="space-y-2">
                {matchings.map((m, i) => {
                  const style = getScoreStyle(m.score)
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 ${style.light} rounded-xl`}>
                      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {m.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${style.text} truncate`}>{m.prospect_nom}</p>
                        {m.recommandation && <p className="text-xs text-gray-500 truncate">{m.recommandation}</p>}
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => { onClose(); navigate(`/matchings?bien=${bienId}`) }}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-semibold mt-1"
                >
                  Voir le détail complet <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Défauts — même design que "Modifier le bien" */}
          <div className="p-5 space-y-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                <AlertCircle size={14} className="text-amber-500" />
                Défauts / Points négatifs
              </label>
              <textarea
                value={defauts}
                onChange={e => setDefauts(e.target.value)}
                rows={3}
                placeholder="Ex: vis-à-vis, pas de parking, bruit de rue..."
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300/40 resize-none text-sm bg-amber-50/30"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ces informations restent internes — elles améliorent la précision de l'analyse et ne sont jamais transmises aux clients.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {DEFAUT_TAGS.map(tag => {
                  const active = (defauts || '').includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ' +
                        (active ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600')}
                    >
                      {active ? '✓ ' : '+ '}{tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {analyseState === 'done' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
                <CheckCircle2 size={15} className="shrink-0" />
                Analyse mise à jour avec les nouveaux défauts
              </div>
            )}
            {analyseState === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                <AlertCircle size={15} className="shrink-0" />
                Erreur lors de l'analyse — réessayez
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
            Fermer
          </button>
          <button
            onClick={handleAnalyser}
            disabled={analyseState === 'loading'}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#2a4f7c] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {analyseState === 'loading'
              ? <><Loader2 size={15} className="animate-spin" />Analyse en cours...</>
              : <><Sparkles size={15} />Re-lancer l'analyse</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewBienModal
