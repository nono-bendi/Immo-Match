import { useNavigate } from 'react-router-dom'
import { X, Sparkles, Building2, Search, Tag, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function BilanBanner() {
  const { bilan, clearBilan } = useAuth()
  const navigate = useNavigate()

  if (!bilan) return null

  const { nouveaux_biens, matchings, biens_vendus, top_matchings, depuis } = bilan

  const stats = [
    nouveaux_biens > 0 && { icon: Building2, label: `${nouveaux_biens} nouveau${nouveaux_biens > 1 ? 'x' : ''} bien${nouveaux_biens > 1 ? 's' : ''} ajouté${nouveaux_biens > 1 ? 's' : ''}` },
    matchings > 0 && { icon: Search, label: `${matchings} matching${matchings > 1 ? 's' : ''} analysé${matchings > 1 ? 's' : ''}` },
    biens_vendus > 0 && { icon: Tag, label: `${biens_vendus} bien${biens_vendus > 1 ? 's' : ''} vendu${biens_vendus > 1 ? 's' : ''}` },
  ].filter(Boolean)

  return (
    <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 text-white" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Sparkles size={16} />
            Depuis votre dernière visite
          </div>
          <button onClick={clearBilan} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2.5">
          {stats.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
              <Icon size={15} className="text-gray-400 flex-shrink-0" />
              {label}
            </div>
          ))}

          {top_matchings?.length > 0 && (
            <div className="pt-1.5 mt-1.5 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <TrendingUp size={12} />
                À regarder en priorité
              </div>
              {top_matchings.slice(0, 3).map((m, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-center justify-between gap-2">
                  <span className="truncate">{m.prospect_nom} — {m.bien_type} à {m.bien_ville}</span>
                  <span className="font-bold text-emerald-600 flex-shrink-0">{m.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50">
          <button onClick={clearBilan} className="flex-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
            Fermer
          </button>
          <button
            onClick={() => { clearBilan(); navigate(depuis ? `/matchings?depuis=${encodeURIComponent(depuis)}` : '/matchings') }}
            className="flex-1 px-4 py-2 text-sm text-white rounded-xl font-semibold transition-all"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
          >
            Voir le détail
          </button>
        </div>
      </div>
    </div>
  )
}

export default BilanBanner
