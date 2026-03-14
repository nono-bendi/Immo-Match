import { useState } from 'react'
import {
  Building2, MapPin, Maximize, Home, X, Euro,
  Compass, Car, TreePine, Layers, ChevronLeft, ChevronRight
} from 'lucide-react'

function BienModal({ bien, onClose }) {
  const [currentPhoto, setCurrentPhoto] = useState(0)

  if (!bien) return null

  const photos = bien.photos ? bien.photos.split('|').filter(p => p.trim()) : []
  const next = () => setCurrentPhoto(p => (p + 1) % photos.length)
  const prev = () => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)

  const formatPrix = v =>
    v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '-'

  const dpeColor = l =>
    ({ A: 'bg-green-500', B: 'bg-green-400', C: 'bg-lime-400', D: 'bg-yellow-400', E: 'bg-orange-400', F: 'bg-orange-600' }[l] || 'bg-red-600')

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-bounce-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header avec photo */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700">
          {photos.length > 0 ? (
            <div className="relative h-64">
              <img src={photos[currentPhoto]} alt={`Photo ${currentPhoto + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {photos.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all hover:scale-110">
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all hover:scale-110">
                    <ChevronRight size={20} className="text-white" />
                  </button>
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, idx) => (
                      <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentPhoto ? 'bg-white scale-125' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-xl font-bold">{bien.type} à {bien.ville}</h2>
                {bien.reference && <p className="text-white/70 text-sm">Réf. {bien.reference}</p>}
              </div>
            </div>
          ) : (
            <div className="p-6 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Building2 size={28} />
              </div>
              <h2 className="text-xl font-bold">{bien.type} à {bien.ville}</h2>
              {bien.reference && <p className="text-white/70 text-sm">Réf. {bien.reference}</p>}
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all hover:scale-110">
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Stats principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Euro size={20} className="mx-auto text-emerald-600 mb-1" />
              <p className="text-lg font-bold text-[#1E3A5F]">{formatPrix(bien.prix)}</p>
              <p className="text-xs text-gray-400">Prix</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Maximize size={20} className="mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold text-[#1E3A5F]">{bien.surface || '-'} m²</p>
              <p className="text-xs text-gray-400">Surface</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Home size={20} className="mx-auto text-violet-600 mb-1" />
              <p className="text-lg font-bold text-[#1E3A5F]">{bien.pieces || '-'} pièces</p>
              <p className="text-xs text-gray-400">{bien.chambres ? `${bien.chambres} ch.` : ''}</p>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-3">
            {bien.quartier && <div className="flex items-center gap-2 text-sm"><MapPin size={14} className="text-gray-400" /><span className="text-gray-600">{bien.quartier}</span></div>}
            {bien.etat && <div className="flex items-center gap-2 text-sm"><Building2 size={14} className="text-gray-400" /><span className="text-gray-600">{bien.etat}</span></div>}
            {bien.exposition && <div className="flex items-center gap-2 text-sm"><Compass size={14} className="text-gray-400" /><span className="text-gray-600">{bien.exposition}</span></div>}
            {bien.stationnement && <div className="flex items-center gap-2 text-sm"><Car size={14} className="text-gray-400" /><span className="text-gray-600">{bien.stationnement}</span></div>}
            {bien.exterieur && <div className="flex items-center gap-2 text-sm"><TreePine size={14} className="text-gray-400" /><span className="text-gray-600">{bien.exterieur}</span></div>}
            {bien.etage && <div className="flex items-center gap-2 text-sm"><Layers size={14} className="text-gray-400" /><span className="text-gray-600">{bien.etage}</span></div>}
          </div>

          {/* Caractéristiques Hektor */}
          {(bien.etage_bien != null || bien.ascenseur === 1 || bien.cave === 1 ||
            bien.nb_parkings > 0 || bien.nb_boxes > 0 ||
            bien.terrasse === 1 || bien.nb_balcons > 0 ||
            bien.orientation_sud === 1 || bien.orientation_est === 1 ||
            bien.orientation_ouest === 1 || bien.orientation_nord === 1) && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Caractéristiques</p>
              <div className="flex flex-wrap gap-2">
                {bien.etage_bien != null && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"><Layers size={12} />Étage {bien.etage_bien}{bien.nb_etages_immeuble ? `/${bien.nb_etages_immeuble}` : ''}</span>}
                {bien.ascenseur === 1 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">↑ Ascenseur</span>}
                {bien.cave === 1 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Cave</span>}
                {bien.nb_parkings > 0 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"><Car size={12} />{bien.nb_parkings} parking{bien.nb_parkings > 1 ? 's' : ''}</span>}
                {bien.nb_boxes > 0 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"><Car size={12} />{bien.nb_boxes} box{bien.nb_boxes > 1 ? 'es' : ''}</span>}
                {bien.terrasse === 1 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium"><TreePine size={12} />Terrasse</span>}
                {bien.nb_balcons > 0 && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{bien.nb_balcons} balcon{bien.nb_balcons > 1 ? 's' : ''}</span>}
                {['orientation_sud','orientation_est','orientation_ouest','orientation_nord'].some(k => bien[k] === 1) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                    <Compass size={12} />
                    {['orientation_sud','orientation_est','orientation_ouest','orientation_nord']
                      .filter(k => bien[k] === 1)
                      .map(k => k.replace('orientation_','').charAt(0).toUpperCase() + k.replace('orientation_','').slice(1))
                      .join(' / ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* DPE / GES */}
          {(bien.dpe_lettre || bien.ges_lettre) && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Performance énergétique</p>
              <div className="flex gap-3">
                {bien.dpe_lettre && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${dpeColor(bien.dpe_lettre)}`}>{bien.dpe_lettre}</span>
                    <div><p className="text-xs text-gray-400">DPE</p>{bien.dpe_kwh && <p className="text-xs font-medium text-gray-700">{bien.dpe_kwh} kWh/m²/an</p>}</div>
                  </div>
                )}
                {bien.ges_lettre && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${dpeColor(bien.ges_lettre)}`}>{bien.ges_lettre}</span>
                    <div><p className="text-xs text-gray-400">GES</p>{bien.ges_co2 && <p className="text-xs font-medium text-gray-700">{bien.ges_co2} kg CO₂/m²/an</p>}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendeur / Lien */}
          <div className="flex items-center gap-4">
            {bien.vendeur && (
              <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-400 mb-1">Vendeur</p>
                <p className="text-sm font-medium text-blue-700">{bien.vendeur}</p>
              </div>
            )}
            {bien.lien_annonce && (
              <a href={bien.lien_annonce} target="_blank" rel="noopener noreferrer" className="flex-1 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                <p className="text-xs text-emerald-400 mb-1">Annonce</p>
                <p className="text-sm font-medium text-emerald-700">Voir sur le site →</p>
              </a>
            )}
          </div>

          {/* Description */}
          {bien.description && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-2 font-medium">Description</p>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{bien.description}</p>
            </div>
          )}

          {/* Défauts */}
          {bien.defauts && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-600 mb-2 font-semibold">⚠️ Points négatifs (usage interne)</p>
              <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">{bien.defauts}</p>
            </div>
          )}

          {/* Miniatures */}
          {photos.length > 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Photos ({photos.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`Photo ${idx + 1}`}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all hover:scale-105 ${idx === currentPhoto ? 'border-[#1E3A5F]' : 'border-transparent hover:border-gray-300'}`}
                    onClick={() => setCurrentPhoto(idx)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default BienModal
