import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, BarChart2, CheckCircle, AlertCircle, AlertTriangle, Target, Loader2, X, Home, Euro, Maximize2, BedDouble, MapPin } from 'lucide-react'
import { apiFetch } from '../api'
import { API_URL } from '../config'
import { useAuth } from '../contexts/AuthContext'

function formatPrix(prix) {
  if (!prix) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prix)
}

function getFirstPhoto(photos) {
  if (!photos) return null
  return photos.split('|')[0]?.trim() || null
}

function ScoreBar({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-lg font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BienDetailModal({ m, onClose }) {
  const photos = m.bien_photos ? m.bien_photos.split('|').filter(Boolean) : []
  const [photoIdx, setPhotoIdx] = useState(0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gray-100" style={{ height: '200px' }}>
          {photos.length > 0 ? (
            <>
              <img src={photos[photoIdx]} alt="Photo du bien" className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
              {photos.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.slice(0, 6).map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
              {photoIdx > 0 && (
                <button onClick={() => setPhotoIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                  <ChevronLeft size={16} />
                </button>
              )}
              {photoIdx < photos.length - 1 && (
                <button onClick={() => setPhotoIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home size={40} className="text-gray-300" />
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-[#1E3A5F] text-lg">{m.bien_type} · {m.bien_ville}</h3>
            {m.quartier && <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={12} />{m.quartier}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Euro size={14} className="mx-auto text-gray-400 mb-1" />
              <p className="text-sm font-bold text-[#1E3A5F]">{formatPrix(m.bien_prix)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Maximize2 size={14} className="mx-auto text-gray-400 mb-1" />
              <p className="text-sm font-bold text-[#1E3A5F]">{m.surface ? `${m.surface} m²` : '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <BedDouble size={14} className="mx-auto text-gray-400 mb-1" />
              <p className="text-sm font-bold text-[#1E3A5F]">{m.chambres ? `${m.chambres} ch.` : '—'}</p>
            </div>
          </div>
          {m.etat && <p className="text-sm text-gray-600"><span className="font-medium">État :</span> {m.etat}</p>}
          {m.description && <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">{m.description}</p>}
          {m.bien_defauts && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Points négatifs (usage interne)</p>
              <p className="text-sm text-amber-800">{m.bien_defauts}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CalibrationPage() {
  const { token } = useAuth()
  const [matchings, setMatchings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)
  const [view, setView] = useState('calibration')
  const [showBienModal, setShowBienModal] = useState(false)
  const [pertinent, setPertinent] = useState(null)
  const [scoreAvis, setScoreAvis] = useState(null)
  const [commentaire, setCommentaire] = useState('')

  useEffect(() => { if (token) loadMatchings(token) }, [token])

  const loadMatchings = async (authToken) => {
    setLoading(true)
    try {
      const t = authToken || localStorage.getItem('token')
      const res = await fetch(API_URL + '/calibration/matchings', { headers: { Authorization: 'Bearer ' + t } })
      const data = await res.json()
      if (!Array.isArray(data)) return
      setMatchings(data)
      const first = data.findIndex(m => m.pertinent === null)
      setCurrentIdx(first >= 0 ? first : 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadStats = async () => {
    try {
      const res = await apiFetch('/calibration/stats')
      setStats(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const m = matchings[currentIdx]
    if (!m) return
    setPertinent(m.pertinent === 1 ? true : m.pertinent === 0 ? false : null)
    setScoreAvis(m.score_avis || null)
    setCommentaire(m.commentaire || '')
    setShowBienModal(false)
  }, [currentIdx, matchings])

  const save = async () => {
    const m = matchings[currentIdx]
    if (!m || (pertinent === null && scoreAvis === null)) return
    setSaving(true)
    try {
      await apiFetch('/calibration/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matching_id: m.id,
          pertinent: pertinent === true ? 1 : pertinent === false ? 0 : null,
          score_avis: scoreAvis,
          commentaire
        })
      })
      setMatchings(prev => prev.map((item, i) =>
        i === currentIdx ? { ...item, pertinent: pertinent === true ? 1 : pertinent === false ? 0 : null, score_avis: scoreAvis, commentaire } : item
      ))
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const saveAndNext = async () => {
    await save()
    if (currentIdx < matchings.length - 1) setCurrentIdx(i => i + 1)
  }

  const evaluated = matchings.filter(m => m.pertinent !== null).length
  const total = matchings.length
  const progress = total ? Math.round((evaluated / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[#1E3A5F]" />
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Aucun matching à calibrer pour l'instant.</p>
        <p className="text-sm text-gray-400 mt-1">Lancez d'abord une analyse depuis la page Matchings.</p>
      </div>
    )
  }

  // ── RÉSULTATS ──
  if (view === 'results') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Résultats de calibration</h1>
            <p className="text-gray-400 text-sm mt-1">{evaluated} matchings évalués sur {total}</p>
          </div>
          <button onClick={() => setView('calibration')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#152a45] transition-colors">
            <ChevronLeft size={16} /> Retour
          </button>
        </div>

        {!stats || stats.total === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <BarChart2 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Pas encore de données</p>
            <p className="text-sm text-gray-400 mt-1">Évaluez quelques matchings pour voir les résultats ici.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pertinence</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Évalués" value={stats.total} color="#1E3A5F" />
                <StatCard label="Pertinents" value={`${Math.round((stats.pertinents/stats.total)*100)}%`} sub={`${stats.pertinents} / ${stats.total}`} color="#10b981" />
                <StatCard label="Non pertinents" value={`${Math.round((stats.non_pertinents/stats.total)*100)}%`} sub={`${stats.non_pertinents} / ${stats.total}`} color="#ef4444" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Justesse des scores</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Trop haut" value={stats.score_trop_haut} sub={`${Math.round((stats.score_trop_haut/stats.total)*100)}% des cas`} color="#f59e0b" />
                <StatCard label="Juste" value={stats.score_ok} sub={`${Math.round((stats.score_ok/stats.total)*100)}% des cas`} color="#10b981" />
                <StatCard label="Trop bas" value={stats.score_trop_bas} sub={`${Math.round((stats.score_trop_bas/stats.total)*100)}% des cas`} color="#3b82f6" />
              </div>
            </div>
            {(stats.avg_score_pertinent > 0 || stats.avg_score_non_pertinent > 0) && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Score moyen observé</h2>
                <div className="grid grid-cols-2 gap-4">
                  {stats.avg_score_pertinent > 0 && <StatCard label="Matchings pertinents" value={stats.avg_score_pertinent} sub="score moyen /100" color="#10b981" />}
                  {stats.avg_score_non_pertinent > 0 && <StatCard label="Matchings non pertinents" value={stats.avg_score_non_pertinent} sub="score moyen /100" color="#ef4444" />}
                </div>
              </div>
            )}
            <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#1E3A5F] mb-3 flex items-center gap-2">
                <Target size={16} /> Ce que ça nous dit
                {stats.total < 10 && <span className="ml-auto text-xs text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{stats.total} éval. · résultats préliminaires</span>}
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                {stats.total < 5 && <p>💡 Avec {stats.total} évaluation{stats.total > 1 ? 's' : ''}, c'est un début — les tendances se préciseront avec le temps. Pas besoin d'en faire des dizaines.</p>}
                {stats.total >= 5 && stats.score_trop_haut > stats.score_trop_bas && stats.score_trop_haut > stats.score_ok && <p>⚠️ Les scores tendent à être <strong>trop élevés</strong> — Claude est trop généreux. On peut ajuster le prompt pour être plus exigeant.</p>}
                {stats.total >= 5 && stats.score_trop_bas > stats.score_trop_haut && stats.score_trop_bas > stats.score_ok && <p>⚠️ Les scores tendent à être <strong>trop bas</strong> — le scoring est trop sévère. On peut recalibrer le prompt.</p>}
                {stats.total >= 5 && stats.score_ok >= stats.score_trop_haut && stats.score_ok >= stats.score_trop_bas && <p>✅ Les scores semblent <strong>bien calibrés</strong> — vos évaluations confirment la justesse des scores.</p>}
                {stats.total >= 5 && stats.non_pertinents > stats.pertinents && <p>⚠️ Plus de la moitié des matchings sont <strong>non pertinents</strong> — le préfiltrage mérite d'être revu.</p>}
                {stats.total >= 5 && stats.pertinents > stats.non_pertinents && <p>✅ La majorité des matchings sont <strong>pertinents</strong> — le système fonctionne bien.</p>}
                {stats.avg_score_pertinent > 0 && stats.avg_score_non_pertinent > 0 && (
                  <p>📊 Score moyen pertinents : <strong>{stats.avg_score_pertinent}/100</strong> vs non pertinents : <strong>{stats.avg_score_non_pertinent}/100</strong>. {Math.abs(stats.avg_score_pertinent - stats.avg_score_non_pertinent) < 10 ? 'Différence faible — le score discrimine peu.' : 'Bonne discrimination — le score est un indicateur fiable.'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── CALIBRATION ──
  const m = matchings[currentIdx]
  const firstPhoto = getFirstPhoto(m.bien_photos)
  const pointsForts = m.points_forts ? m.points_forts.split('\n').filter(p => p.trim()) : []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Calibration</h1>
          <p className="text-sm text-gray-400 mt-0.5">Évaluez la pertinence des matchings</p>
        </div>
        <button onClick={async () => { await loadStats(); setView('results') }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#152a45] transition-colors">
          <BarChart2 size={16} /> Résultats {evaluated > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{evaluated}</span>}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">{evaluated} évalués sur {total}</span>
          <span className="text-sm font-bold text-[#1E3A5F]">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto pb-1 px-1">
          {matchings.map((item, i) => (
            <button key={item.id} onClick={() => setCurrentIdx(i)}
              title={`${item.bien_type || 'Bien'} · ${item.prospect_nom}`}
              className={`w-6 h-6 rounded-full shrink-0 transition-all border-2 ${
                i === currentIdx ? 'bg-[#1E3A5F] border-[#1E3A5F] scale-125'
                : item.pertinent === 1 ? 'bg-emerald-400 border-emerald-400'
                : item.pertinent === 0 ? 'bg-red-400 border-red-400'
                : 'bg-gray-200 border-gray-200 hover:bg-gray-300'
              }`} />
          ))}
        </div>
        <button onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))} disabled={currentIdx === total - 1}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Photo + header */}
        <div className="flex" style={{ minHeight: '120px' }}>
          <button onClick={() => setShowBienModal(true)}
            className="relative w-32 shrink-0 bg-gray-100 hover:brightness-90 transition-all group overflow-hidden">
            {firstPhoto
              ? <img src={firstPhoto} alt="bien" className="w-full h-full object-cover absolute inset-0" onError={e => e.target.style.display='none'} />
              : <div className="w-full h-full flex items-center justify-center"><Home size={28} className="text-gray-300" /></div>
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-end justify-center pb-2">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-lg transition-all">Voir</span>
            </div>
          </button>

          <div className="flex-1 bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] px-5 py-4 flex flex-col justify-between">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">{currentIdx + 1} / {total}</p>
              <h2 className="text-white font-bold text-base leading-tight">{m.prospect_nom}</h2>
              <p className="text-white/60 text-xs mt-0.5">cherche {m.prospect_type || '—'} · {formatPrix(m.budget_max)}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/80 text-sm font-semibold">{m.bien_type} · {m.bien_ville}</p>
              <button onClick={() => setShowBienModal(true)}
                className="text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors">
                Voir détails
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Score calculé</p>
            <ScoreBar score={m.score} />
          </div>

          {pointsForts.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Points forts selon l'IA</p>
              <div className="space-y-1.5">
                {pointsForts.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{p.replace(/^- /, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {m.bien_defauts && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Points négatifs du bien</p>
              <p className="text-sm text-amber-800">{m.bien_defauts}</p>
            </div>
          )}

          <hr className="border-gray-100" />

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Ce bien correspond-il à ce prospect ?</p>
            <div className="flex gap-3">
              <button onClick={() => setPertinent(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${pertinent === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                <ThumbsUp size={15} /> Oui, pertinent
              </button>
              <button onClick={() => setPertinent(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${pertinent === false ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'}`}>
                <ThumbsDown size={15} /> Non, pas adapté
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Le score {m.score}/100 est-il juste ?</p>
            <div className="flex gap-2">
              {[
                { key: 'trop_haut', label: 'Trop haut', icon: TrendingUp, bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
                { key: 'ok', label: 'Juste', icon: Minus, bg: '#ecfdf5', border: '#10b981', color: '#065f46' },
                { key: 'trop_bas', label: 'Trop bas', icon: TrendingDown, bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
              ].map(({ key, label, icon: Icon, bg, border, color }) => (
                <button key={key} onClick={() => setScoreAvis(key)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all"
                  style={scoreAvis === key ? { backgroundColor: bg, borderColor: border, color } : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>
          </div>

          <input type="text" value={commentaire} onChange={e => setCommentaire(e.target.value)}
            placeholder="Commentaire optionnel (ex : trop petit, mauvais quartier…)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] text-gray-600 placeholder-gray-300" />

          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving || (pertinent === null && scoreAvis === null)}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : 'Sauvegarder'}
            </button>
            <button onClick={saveAndNext} disabled={saving || (pertinent === null && scoreAvis === null) || currentIdx === total - 1}
              className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152a45] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <>Suivant <ChevronRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>

      {showBienModal && <BienDetailModal m={m} onClose={() => setShowBienModal(false)} />}
    </div>
  )
}