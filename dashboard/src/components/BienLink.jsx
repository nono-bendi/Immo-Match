import { useState, useEffect } from 'react'
import { X, MapPin, Euro, Maximize, Home, Building2, Compass, Car, TreePine, Layers, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiFetch } from '../api'

function BienLink({ bien, children, className = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [fullBien, setFullBien] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)

  // Charger les données complètes quand on ouvre la modal
  useEffect(() => {
    if (showModal && bien?.id && !fullBien) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      apiFetch(`/biens/${bien.id}`)
        .then(res => res.json())
        .then(data => {
          setFullBien(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [showModal, bien?.id, fullBien])

  // Reset quand on ferme la modal
  const closeModal = () => {
    setShowModal(false)
    setCurrentPhoto(0)
  }

  if (!bien) return children || '-'

  const formatBudget = (prix) => {
    if (!prix) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prix)
  }

  const displayName = children || `${bien.type || 'Bien'} à ${bien.ville || '?'}`
  const data = fullBien || bien
  
  // Parser les photos (séparées par |)
  const photos = data.photos ? data.photos.split('|').filter(p => p.trim()) : []

  const nextPhoto = (e) => {
    e.stopPropagation()
    setCurrentPhoto((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = (e) => {
    e.stopPropagation()
    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
        className={`text-[#1E3A5F] hover:text-[#2D5A8A] hover:underline font-medium cursor-pointer text-left ${className}`}
      >
        {displayName}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header avec photo */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700">
              {photos.length > 0 ? (
                <div className="relative h-64">
                  <img 
                    src={photos[currentPhoto]} 
                    alt={`Photo ${currentPhoto + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Navigation photos */}
                  {photos.length > 1 && (
                    <>
                      <button 
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                      >
                        <ChevronLeft size={20} className="text-white" />
                      </button>
                      <button 
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                      >
                        <ChevronRight size={20} className="text-white" />
                      </button>
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-2 h-2 rounded-full ${idx === currentPhoto ? 'bg-white' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Infos sur l'image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl font-bold">{data.type} à {data.ville}</h2>
                    {data.reference && <p className="text-white/70 text-sm">Réf. {data.reference}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                      <Building2 size={28} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">{data.type} à {data.ville}</h2>
                  {data.reference && <p className="text-white/70 text-sm">Réf. {data.reference}</p>}
                </div>
              )}
              
              {/* Bouton fermer */}
              <button 
                onClick={closeModal} 
                className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#1E3A5F]" />
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Stats principales */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Euro size={20} className="mx-auto text-emerald-600 mb-1" />
                      <p className="text-lg font-bold text-[#1E3A5F]">{formatBudget(data.prix)}</p>
                      <p className="text-xs text-gray-400">Prix</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Maximize size={20} className="mx-auto text-blue-600 mb-1" />
                      <p className="text-lg font-bold text-[#1E3A5F]">{data.surface || '-'} m²</p>
                      <p className="text-xs text-gray-400">Surface</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Home size={20} className="mx-auto text-violet-600 mb-1" />
                      <p className="text-lg font-bold text-[#1E3A5F]">{data.pieces || '-'} pièces</p>
                      <p className="text-xs text-gray-400">{data.chambres ? `${data.chambres} ch.` : ''}</p>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-2 gap-3">
                    {data.quartier && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.quartier}</span>
                      </div>
                    )}
                    {data.etat && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.etat}</span>
                      </div>
                    )}
                    {data.exposition && (
                      <div className="flex items-center gap-2 text-sm">
                        <Compass size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.exposition}</span>
                      </div>
                    )}
                    {data.stationnement && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.stationnement}</span>
                      </div>
                    )}
                    {data.exterieur && (
                      <div className="flex items-center gap-2 text-sm">
                        <TreePine size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.exterieur}</span>
                      </div>
                    )}
                    {data.etage && (
                      <div className="flex items-center gap-2 text-sm">
                        <Layers size={14} className="text-gray-400" />
                        <span className="text-gray-600">{data.etage}</span>
                      </div>
                    )}
                  </div>

                  {/* Caractéristiques Hektor */}
                  {(data.etage_bien || data.ascenseur || data.cave || 
                    data.nb_parkings > 0 || data.nb_boxes > 0 || 
                    data.terrasse || data.nb_balcons > 0) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Caractéristiques</p>
                      <div className="flex flex-wrap gap-2">
                        {data.etage_bien != null && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            <Layers size={12} />
                            Étage {data.etage_bien}
                            {data.nb_etages_immeuble ? `/${data.nb_etages_immeuble}` : ''}
                          </span>
                        )}
                        {data.ascenseur === 1 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            ↑ Ascenseur
                          </span>
                        )}
                        {data.cave === 1 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            Cave
                          </span>
                        )}
                        {data.nb_parkings > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            <Car size={12} />
                            {data.nb_parkings} parking{data.nb_parkings > 1 ? 's' : ''}
                          </span>
                        )}
                        {data.nb_boxes > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            <Car size={12} />
                            {data.nb_boxes} box{data.nb_boxes > 1 ? 'es' : ''}
                          </span>
                        )}
                        {data.terrasse === 1 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                            <TreePine size={12} />
                            Terrasse
                          </span>
                        )}
                        {data.nb_balcons > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                            {data.nb_balcons} balcon{data.nb_balcons > 1 ? 's' : ''}
                          </span>
                        )}
                        {/* Orientations */}
                        {[
                          { key: 'orientation_sud', label: 'Sud' },
                          { key: 'orientation_est', label: 'Est' },
                          { key: 'orientation_ouest', label: 'Ouest' },
                          { key: 'orientation_nord', label: 'Nord' },
                        ].filter(o => data[o.key] === 1).length > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                            <Compass size={12} />
                            {['orientation_sud','orientation_est','orientation_ouest','orientation_nord']
                              .filter(k => data[k] === 1)
                              .map(k => k.replace('orientation_', '').charAt(0).toUpperCase() + k.replace('orientation_', '').slice(1))
                              .join(' / ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DPE / GES */}
                  {(data.dpe_lettre || data.ges_lettre) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Performance énergétique</p>
                      <div className="flex gap-3">
                        {data.dpe_lettre && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                              data.dpe_lettre === 'A' ? 'bg-green-500' :
                              data.dpe_lettre === 'B' ? 'bg-green-400' :
                              data.dpe_lettre === 'C' ? 'bg-lime-400' :
                              data.dpe_lettre === 'D' ? 'bg-yellow-400' :
                              data.dpe_lettre === 'E' ? 'bg-orange-400' :
                              data.dpe_lettre === 'F' ? 'bg-orange-600' :
                              'bg-red-600'
                            }`}>
                              {data.dpe_lettre}
                            </span>
                            <div>
                              <p className="text-xs text-gray-400">DPE</p>
                              {data.dpe_kwh && <p className="text-xs font-medium text-gray-700">{data.dpe_kwh} kWh/m²/an</p>}
                            </div>
                          </div>
                        )}
                        {data.ges_lettre && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                              data.ges_lettre === 'A' ? 'bg-green-500' :
                              data.ges_lettre === 'B' ? 'bg-green-400' :
                              data.ges_lettre === 'C' ? 'bg-lime-400' :
                              data.ges_lettre === 'D' ? 'bg-yellow-400' :
                              data.ges_lettre === 'E' ? 'bg-orange-400' :
                              data.ges_lettre === 'F' ? 'bg-orange-600' :
                              'bg-red-600'
                            }`}>
                              {data.ges_lettre}
                            </span>
                            <div>
                              <p className="text-xs text-gray-400">GES</p>
                              {data.ges_co2 && <p className="text-xs font-medium text-gray-700">{data.ges_co2} kg CO₂/m²/an</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vendeur et lien */}
                  {(data.vendeur || data.lien_annonce) && (
                    <div className="flex items-center gap-4">
                      {data.vendeur && (
                        <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs text-blue-400 mb-1">Vendeur</p>
                          <p className="text-sm font-medium text-blue-700">{data.vendeur}</p>
                        </div>
                      )}
                      {data.lien_annonce && (
                        <a 
                          href={data.lien_annonce} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          <p className="text-xs text-emerald-400 mb-1">Annonce</p>
                          <p className="text-sm font-medium text-emerald-700">Voir sur le site →</p>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {data.description && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2 font-medium">Description</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{data.description}</p>
                    </div>
                  )}

                  {/* Miniatures photos */}
                  {photos.length > 1 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">Photos ({photos.length})</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {photos.map((photo, idx) => (
                          <img 
                            key={idx}
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                              idx === currentPhoto ? 'border-[#1E3A5F]' : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => setCurrentPhoto(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BienLink
