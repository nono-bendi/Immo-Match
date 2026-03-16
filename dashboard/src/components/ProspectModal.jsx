import { X, Phone, Mail, MapPin, Home, Euro, FileText, Calendar, Briefcase, Sun, Car, Building, TreePine, ArrowUp, FileBarChart } from 'lucide-react'
import { API_URL } from '../config'

function ProspectModal({ prospect, onClose }) {
  if (!prospect) return null

  const formatBudget = (budget) => {
    if (!budget) return 'Non défini'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        
        {/* Header avec dégradé subtil */}
        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8A] p-8 text-white relative overflow-hidden">
          {/* Cercle décoratif */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold shadow-lg">
                {prospect.nom ? prospect.nom.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{prospect.nom || 'Sans nom'}</h2>
                <div className="flex items-center gap-2 mt-1 text-white/70">
                  <Calendar size={14} />
                  <span className="text-sm">Inscrit le {formatDate(prospect.date)}</span>
                </div>
                {prospect.domicile && (
                  <div className="flex items-center gap-2 mt-1 text-white/70">
                    <MapPin size={14} />
                    <span className="text-sm">Habite à {prospect.domicile}</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Contact rapide */}
          <div className="relative flex gap-3 mt-6">
            {prospect.telephone && (
              <a href={"tel:" + prospect.telephone.replace(/,/g, '')} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-all">
                <Phone size={16} />
                <span className="text-sm font-medium">{prospect.telephone}</span>
              </a>
            )}
            {prospect.mail && (
              <a href={"mailto:" + prospect.mail} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-all">
                <Mail size={16} />
                <span className="text-sm font-medium">{prospect.mail}</span>
              </a>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-gray-50/50 to-white">
          <div className="grid grid-cols-2 gap-10">
            
            {/* Colonne gauche - Recherche */}
            <div>
              <h3 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#1E3A5F] rounded-full"></span>
                Recherche
              </h3>
              <div className="space-y-2">
                {prospect.bien && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Home size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Type de bien</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.bien}</p>
                    </div>
                  </div>
                )}

                {prospect.villes && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Villes</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.villes}</p>
                    </div>
                  </div>
                )}

                {prospect.quartiers && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Quartiers</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.quartiers}</p>
                    </div>
                  </div>
                )}

                {prospect.budget_max && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Euro size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Budget max</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{formatBudget(prospect.budget_max)}</p>
                    </div>
                  </div>
                )}

                {prospect.destination && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Briefcase size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Destination</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.destination}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite - Critères */}
            <div>
              <h3 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#1E3A5F] rounded-full"></span>
                Critères
              </h3>
              <div className="space-y-2">
                {prospect.criteres && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                      <FileText size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Critères</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.criteres}</p>
                    </div>
                  </div>
                )}

                {prospect.etat && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Building size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">État</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.etat}</p>
                    </div>
                  </div>
                )}

                {prospect.expo && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Sun size={18} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Exposition</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.expo}</p>
                    </div>
                  </div>
                )}

                {prospect.stationnement && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Car size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Stationnement</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.stationnement}</p>
                    </div>
                  </div>
                )}

                {prospect.copro && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Building size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Copropriété</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.copro}</p>
                    </div>
                  </div>
                )}

                {prospect.exterieur && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TreePine size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Extérieur</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.exterieur}</p>
                    </div>
                  </div>
                )}

                {prospect.etage && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <ArrowUp size={18} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Étage</p>
                      <p className="text-sm font-semibold text-[#1E3A5F]">{prospect.etage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observations */}
          {prospect.observation && (
            <div className="mt-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-2">📝 Observations</p>
              <p className="text-sm text-amber-900">{prospect.observation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => window.open(`${API_URL}/rapport/prospect/${prospect.id}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1E3A5F] bg-white border border-gray-200 rounded-xl hover:bg-[#1E3A5F] hover:text-white hover:border-[#1E3A5F] transition-all"
          >
            <FileBarChart size={15} />
            Rapport prospect
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProspectModal