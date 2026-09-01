import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Building2, Search, Tag, ChevronRight, Calendar, PartyPopper, Wind, Flame } from 'lucide-react'
import { apiFetch } from '../api'
import BienModal from '../components/BienModal'
import Confetti from '../components/Confetti'

const PRESETS = [
  { key: '7j',  label: '7 derniers jours',  jours: 7 },
  { key: '30j', label: '30 derniers jours', jours: 30 },
  { key: 'mois', label: 'Depuis le 1er du mois', jours: null },
]

function debutDeJournee(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function StatCard({ icon: Icon, iconColor, iconBg, value, label, className }) {
  return (
    <div className={'rounded-2xl p-5 flex items-center gap-4 card-hover ' + (className || '')} style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(15,30,48,0.06)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 icon-bounce" style={{ background: iconBg, color: iconColor }}>
        <Icon size={20} />
      </div>
      <div>
        <div key={value} className="text-2xl font-extrabold counter-pop" style={{ color: iconColor, letterSpacing: '-0.02em' }}>{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function ScoreBadge({ score }) {
  const style = score >= 75
    ? { bg: '#f0fdf4', text: '#059669' }
    : score >= 50
      ? { bg: '#fffbeb', text: '#d97706' }
      : { bg: '#fef2f2', text: '#dc2626' }
  return (
    <span className="px-2.5 py-1 rounded-lg text-sm font-bold flex-shrink-0" style={{ background: style.bg, color: style.text }}>
      {score}
    </span>
  )
}

function Section({ title, count, emptyLabel, className, children }) {
  return (
    <div className={'rounded-2xl overflow-hidden ' + (className || '')} style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(15,30,48,0.06)' }}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="text-xs text-gray-400">{count}</span>
      </div>
      {count === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{emptyLabel}</div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">{children}</div>
      )}
    </div>
  )
}

function BilanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const depuisUrl = searchParams.get('depuis')

  const [preset, setPreset] = useState('7j')
  const [customFrom, setCustomFrom] = useState(depuisUrl ? depuisUrl.slice(0, 10) : '')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(!!depuisUrl)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openBienId, setOpenBienId] = useState(null)
  const [openBien, setOpenBien] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // ── Période : recalculée uniquement quand l'utilisateur change de choix,
  // jamais à chaque rendu (sinon la date change en continu -> boucle infinie) ──
  const { depuis, jusqua, label } = useMemo(() => {
    if (showCustom && customFrom) {
      return {
        depuis: debutDeJournee(customFrom).toISOString(),
        jusqua: customTo ? new Date(customTo + 'T23:59:59').toISOString() : new Date().toISOString(),
        label: customTo ? `du ${customFrom} au ${customTo}` : `depuis le ${customFrom}`,
      }
    }
    const found = PRESETS.find(p => p.key === preset) || PRESETS[0]
    let from
    if (found.jours) {
      from = new Date()
      from.setDate(from.getDate() - found.jours)
    } else {
      from = new Date()
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
    }
    return { depuis: from.toISOString(), jusqua: new Date().toISOString(), label: found.label.toLowerCase() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, showCustom, customFrom, customTo])

  const fetchBilan = useCallback(() => {
    setLoading(true)
    apiFetch(`/bilan?depuis=${encodeURIComponent(depuis)}&jusqua=${encodeURIComponent(jusqua)}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
        if ((d?.biens_vendus?.length || 0) > 0) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 2000)
        }
      })
      .catch(() => setLoading(false))
  }, [depuis, jusqua])

  useEffect(() => { fetchBilan() }, [fetchBilan])

  const handleOpenBien = async (bienId) => {
    const bien = await apiFetch(`/biens/${bienId}`).then(r => r.json()).catch(() => null)
    if (bien) { setOpenBien(bien); setOpenBienId(bienId) }
  }

  const fmtPrix = v => v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—'
  const fmtDate = v => v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  const total = (data?.nouveaux_biens?.length || 0) + (data?.matchings?.length || 0) + (data?.biens_vendus?.length || 0)
  const moodIcon = !data ? Sparkles : total === 0 ? Wind : total < 10 ? Sparkles : total < 60 ? PartyPopper : Flame
  const MoodIcon = moodIcon

  // Détecte une "Analyse global" (beaucoup de prospects analysés d'un coup, en
  // peu de temps) pour ne pas faire croire à 500 actions distinctes de l'agent.
  const detecterAnalyseGlobale = (matchings) => {
    if (!matchings || matchings.length < 15) return null
    const buckets = {}
    for (const m of matchings) {
      const t = new Date(m.date_analyse).getTime()
      if (Number.isNaN(t)) continue
      const key = Math.floor(t / (30 * 60 * 1000)) // fenêtres de 30 min
      ;(buckets[key] ||= []).push(m)
    }
    let biggest = null
    for (const rows of Object.values(buckets)) {
      const distinctProspects = new Set(rows.map(r => r.prospect_id)).size
      if (distinctProspects >= 10 && (!biggest || rows.length > biggest.rows.length)) {
        biggest = { rows, distinctProspects }
      }
    }
    return biggest
  }

  // Phrase de synthèse efficace : les chiffres directement, pas juste une ambiance
  const resume = (() => {
    if (!data) return 'On regarde ça…'
    const nb = data.nouveaux_biens?.length || 0
    const nm = data.matchings?.length || 0
    const nv = data.biens_vendus?.length || 0
    if (nb + nm + nv === 0) return `Aucune activité ${label}.`

    const excellents = data.matchings?.filter(m => m.score >= 80).length || 0
    const bestScore = nm ? Math.max(...data.matchings.map(m => m.score)) : null
    const globale = detecterAnalyseGlobale(data.matchings)

    const parts = []
    if (nb > 0) parts.push(`${nb} nouveau${nb > 1 ? 'x' : ''} bien${nb > 1 ? 's' : ''} ajouté${nb > 1 ? 's' : ''}`)
    if (nm > 0) {
      if (globale && globale.rows.length >= nm * 0.5) {
        parts.push(`${nm} matching${nm > 1 ? 's' : ''} analysé${nm > 1 ? 's' : ''}, dont une analyse globale sur ${globale.distinctProspects} prospects (${globale.rows.length} matchings d'un coup)`)
      } else {
        parts.push(`${nm} matching${nm > 1 ? 's' : ''} analysé${nm > 1 ? 's' : ''}${excellents > 0 ? ` (dont ${excellents} à 80%+)` : ''}`)
      }
    }
    if (nv > 0) parts.push(`${nv} bien${nv > 1 ? 's' : ''} vendu${nv > 1 ? 's' : ''}`)

    let sentence = parts.length > 1
      ? parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1]
      : parts[0]
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + ` ${label}.`
    if (bestScore >= 90) sentence += ` Meilleur score : ${bestScore}/100.`
    return sentence
  })()

  const rowDelay = i => Math.min(i * 0.04, 0.4)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <Confetti show={showConfetti} />

      <div className="flex items-center gap-3 dash-banner">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white icon-wiggle" style={{ background: 'var(--gradient-primary)' }}>
          <Sparkles size={19} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Bilan d'activité</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MoodIcon size={14} className="text-gray-400 flex-shrink-0" />
            {resume}
          </p>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-2 dash-banner">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => { setPreset(p.key); setShowCustom(false) }}
            className={'px-3.5 py-2 rounded-xl text-sm font-medium transition-all btn-press ' +
              (!showCustom && preset === p.key ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300')}
            style={!showCustom && preset === p.key ? { background: 'var(--gradient-primary)' } : {}}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          className={'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all btn-press ' +
            (showCustom ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300')}
          style={showCustom ? { background: 'var(--gradient-primary)' } : {}}
        >
          <Calendar size={14} /> Période personnalisée
        </button>
        {showCustom && (
          <div className="flex items-center gap-2 ml-1 animate-fade-in-up">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            <span className="text-gray-400 text-sm">à</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard className="dash-card-1" icon={Building2} iconColor="#10b981" iconBg="#f0fdf4" value={data?.nouveaux_biens?.length || 0} label="Nouveaux biens ajoutés" />
            <StatCard className="dash-card-2" icon={Search} iconColor="#3b82f6" iconBg="#eff6ff" value={data?.matchings?.length || 0} label="Matchings analysés" />
            <StatCard className="dash-card-3" icon={Tag} iconColor="#7c3aed" iconBg="#f5f3ff" value={data?.biens_vendus?.length || 0} label="Biens vendus" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section className="dash-section-1" title="Nouveaux biens" count={data?.nouveaux_biens?.length || 0} emptyLabel="Aucun nouveau bien sur cette période">
              {data?.nouveaux_biens?.map((b, i) => (
                <button key={b.id} onClick={() => handleOpenBien(b.id)} style={{ animation: `row-enter 0.4s ease ${rowDelay(i)}s both` }} className="w-full flex items-center justify-between gap-3 px-5 py-3 row-hover text-left">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{b.type} à {b.ville}</div>
                    <div className="text-xs text-gray-400 truncate">{b.nom_agence || 'Agence non précisée'} · {fmtDate(b.date_creation)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">{fmtPrix(b.prix)}</span>
                    {b.matchings_count > 0 && (
                      <span
                        onClick={e => { e.stopPropagation(); navigate(`/matchings?bien=${b.id}`) }}
                        className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                        style={{ background: '#eff6ff', color: '#3b82f6' }}
                        title="Voir les rapprochements de ce bien"
                      >
                        {b.matchings_count} rapprochement{b.matchings_count > 1 ? 's' : ''}
                      </span>
                    )}
                    <ChevronRight size={15} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </Section>

            <Section className="dash-section-2" title="Matchings analysés" count={data?.matchings?.length || 0} emptyLabel="Aucun matching sur cette période">
              {data?.matchings?.map((m, i) => (
                <button key={m.id} onClick={() => navigate(`/matchings?prospect=${m.prospect_id}&bien=${m.bien_id}`)} style={{ animation: `row-enter 0.4s ease ${rowDelay(i)}s both` }} className="w-full flex items-center justify-between gap-3 px-5 py-3 row-hover text-left">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {m.prospect_societe || `${m.prospect_prenom || ''} ${m.prospect_nom || ''}`.trim()}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{m.bien_type} à {m.bien_ville} · {fmtDate(m.date_analyse)}</div>
                  </div>
                  <ScoreBadge score={m.score} />
                </button>
              ))}
            </Section>
          </div>

          <Section className="dash-section-3" title="Biens vendus" count={data?.biens_vendus?.length || 0} emptyLabel="Aucun bien vendu sur cette période">
            {data?.biens_vendus?.map((b, i) => (
              <button key={b.id} onClick={() => handleOpenBien(b.id)} style={{ animation: `row-enter 0.4s ease ${rowDelay(i)}s both` }} className="w-full flex items-center justify-between gap-3 px-5 py-3 row-hover text-left">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{b.type} à {b.ville}</div>
                  <div className="text-xs text-gray-400 truncate">Vendu le {fmtDate(b.date_vendu)}</div>
                </div>
                <span className="text-sm font-semibold text-gray-600 flex-shrink-0">{fmtPrix(b.prix)}</span>
              </button>
            ))}
          </Section>
        </>
      )}

      {openBienId && openBien && <BienModal bien={openBien} onClose={() => { setOpenBienId(null); setOpenBien(null) }} />}
    </div>
  )
}

export default BilanPage
