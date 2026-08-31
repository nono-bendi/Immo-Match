import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Building2, Search, Tag, ChevronRight, Calendar } from 'lucide-react'
import { apiFetch } from '../api'
import BienModal from '../components/BienModal'

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

function StatCard({ icon: Icon, iconColor, iconBg, value, label }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(15,30,48,0.06)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-extrabold" style={{ color: iconColor, letterSpacing: '-0.02em' }}>{value}</div>
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

function Section({ title, count, emptyLabel, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(15,30,48,0.06)' }}>
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

  const { depuis, jusqua, label } = (() => {
    if (showCustom && customFrom) {
      return {
        depuis: debutDeJournee(customFrom).toISOString(),
        jusqua: customTo ? new Date(customTo + 'T23:59:59').toISOString() : new Date().toISOString(),
        label: customTo ? `Du ${customFrom} au ${customTo}` : `Depuis le ${customFrom}`,
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
    return { depuis: from.toISOString(), jusqua: new Date().toISOString(), label: found.label }
  })()

  const fetchBilan = useCallback(() => {
    setLoading(true)
    apiFetch(`/bilan?depuis=${encodeURIComponent(depuis)}&jusqua=${encodeURIComponent(jusqua)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [depuis, jusqua])

  useEffect(() => { fetchBilan() }, [fetchBilan])

  const handleOpenBien = async (bienId) => {
    const bien = await apiFetch(`/biens/${bienId}`).then(r => r.json()).catch(() => null)
    if (bien) { setOpenBien(bien); setOpenBienId(bienId) }
  }

  const fmtPrix = v => v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—'
  const fmtDate = v => v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
          <Sparkles size={19} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Bilan d'activité</h1>
          <p className="text-sm text-gray-500">Qu'est-ce qui s'est passé — {label}</p>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => { setPreset(p.key); setShowCustom(false) }}
            className={'px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ' +
              (!showCustom && preset === p.key ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
            style={!showCustom && preset === p.key ? { background: 'var(--gradient-primary)' } : {}}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          className={'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ' +
            (showCustom ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
          style={showCustom ? { background: 'var(--gradient-primary)' } : {}}
        >
          <Calendar size={14} /> Période personnalisée
        </button>
        {showCustom && (
          <div className="flex items-center gap-2 ml-1">
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
            <StatCard icon={Building2} iconColor="#10b981" iconBg="#f0fdf4" value={data?.nouveaux_biens?.length || 0} label="Nouveaux biens ajoutés" />
            <StatCard icon={Search} iconColor="#3b82f6" iconBg="#eff6ff" value={data?.matchings?.length || 0} label="Matchings analysés" />
            <StatCard icon={Tag} iconColor="#7c3aed" iconBg="#f5f3ff" value={data?.biens_vendus?.length || 0} label="Biens vendus" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Nouveaux biens" count={data?.nouveaux_biens?.length || 0} emptyLabel="Aucun nouveau bien sur cette période">
              {data?.nouveaux_biens?.map(b => (
                <button key={b.id} onClick={() => handleOpenBien(b.id)} className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{b.type} à {b.ville}</div>
                    <div className="text-xs text-gray-400 truncate">{b.nom_agence || 'Agence non précisée'} · {fmtDate(b.date_creation)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">{fmtPrix(b.prix)}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </Section>

            <Section title="Matchings analysés" count={data?.matchings?.length || 0} emptyLabel="Aucun matching sur cette période">
              {data?.matchings?.map(m => (
                <button key={m.id} onClick={() => navigate(`/matchings?prospect=${m.prospect_id}`)} className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors">
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

          <Section title="Biens vendus" count={data?.biens_vendus?.length || 0} emptyLabel="Aucun bien vendu sur cette période">
            {data?.biens_vendus?.map(b => (
              <button key={b.id} onClick={() => handleOpenBien(b.id)} className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors">
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
