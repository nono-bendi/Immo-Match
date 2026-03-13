import { useState, useEffect } from 'react'
import { X, Phone, Mail, MapPin, Home, Euro, Target, Loader2 } from 'lucide-react'
import { API_URL } from '../config'

function ProspectLink({ prospect, children, className = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [fullProspect, setFullProspect] = useState(null)
  const [loading, setLoading] = useState(false)

  // Charger les données complètes quand on ouvre la modal
  useEffect(() => {
    if (showModal && prospect?.id && !fullProspect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      fetch(`${API_URL}/prospects/${prospect.id}`)
        .then(res => res.json())
        .then(data => {
          setFullProspect(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [showModal, prospect?.id, fullProspect])

  if (!prospect) return children || '-'

  const formatBudget = (budget) => {
    if (!budget) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
  }

  const data = fullProspect || prospect

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
        className={`text-[#1E3A5F] hover:text-[#2D5A8A] hover:underline font-medium cursor-pointer ${className}`}
      >
        {children || prospect.nom || 'Sans nom'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8A] text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {data.nom?.charAt(0).toUpperCase() || '?'}
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-xl font-bold">{data.nom}</h2>
              {data.domicile && <p className="text-white/70 text-sm">{data.domicile}</p>}
            </div>

            {/* Contenu */}
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#1E3A5F]" />
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DCE7F3] rounded-xl flex items-center justify-center">
                      <Home size={18} className="text-[#1E3A5F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Recherche</p>
                      <p className="text-sm font-medium text-[#1E3A5F]">{data.bien || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DCE7F3] rounded-xl flex items-center justify-center">
                      <MapPin size={18} className="text-[#1E3A5F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Secteur</p>
                      <p className="text-sm font-medium text-[#1E3A5F]">{data.villes || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DCE7F3] rounded-xl flex items-center justify-center">
                      <Euro size={18} className="text-[#1E3A5F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Budget</p>
                      <p className="text-sm font-medium text-[#1E3A5F]">{formatBudget(data.budget_max)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DCE7F3] rounded-xl flex items-center justify-center">
                      <Target size={18} className="text-[#1E3A5F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Projet</p>
                      <p className="text-sm font-medium text-[#1E3A5F]">{data.destination || '-'}</p>
                    </div>
                  </div>
                </div>

                {data.observation && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{data.observation}</p>
                  </div>
                )}

                {/* Contact */}
                <div className="flex gap-2 pt-2">
                  {data.telephone && (
                    <a href={`tel:${data.telephone.replace(/,/g, '')}`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Phone size={18} />
                      <span className="font-medium">Appeler</span>
                    </a>
                  )}
                  {data.mail && (
                    <a href={`mailto:${data.mail}`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                      <Mail size={18} />
                      <span className="font-medium">Email</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ProspectLink