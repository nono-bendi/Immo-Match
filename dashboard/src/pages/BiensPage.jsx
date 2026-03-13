import { useState, useEffect } from 'react'
import { Building2, Search, Upload, MapPin, Maximize, Home, Eye, Pencil, Trash2, X, Euro, Compass, Car, TreePine, Layers, ChevronLeft, ChevronRight, AlertCircle, Save, Loader2 } from 'lucide-react'

import { API_URL } from '../config'
import Pagination from '../components/Pagination'

// Skeleton pour le chargement
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl animate-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded animate-shimmer" />
            <div className="h-3 w-20 rounded animate-shimmer" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 w-24 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-16 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-16 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer ml-auto" /></td>
    </tr>
  )
}

function BiensPage() {
  const [biens, setBiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAgence, setFilterAgence] = useState('tous')
  const [currentPage, setCurrentPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const [selectedBien, setSelectedBien] = useState(null)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [editBien, setEditBien] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const itemsPerPage = 10

  const handleSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const fetchBiens = () => {
    fetch(`${API_URL}/biens`)
      .then(response => response.json())
      .then(data => {
        setBiens(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Erreur:', error)
        setBiens([])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBiens()
  }, [])

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/biens/import`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      alert(data.message)
      fetchBiens()
    } catch (error) {
      alert("Erreur lors de l'import")
      console.error(error)
    }

    setImporting(false)
    event.target.value = ''
  }

  const [confirmDelete, setConfirmDelete] = useState(null) // { id, type, ville }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await fetch(`${API_URL}/biens/${confirmDelete.id}`, { method: 'DELETE' })
      fetchBiens()
    } catch (error) {
      console.error('Erreur lors de la suppression')
    } finally {
      setConfirmDelete(null)
    }
  }

  const formatPrix = (prix) => {
    if (!prix) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prix)
  }

  // Agences uniques présentes dans les biens
  const agencesUniques = [...new Set(biens.map(b => b.nom_agence || 'SAINT FRANCOIS IMMOBILIER').filter(Boolean))]
  const hasPrimmo = agencesUniques.length > 1

  const filteredBiens = biens.filter(b => {
    const matchSearch = b.reference?.toLowerCase().includes(search.toLowerCase()) ||
      b.ville?.toLowerCase().includes(search.toLowerCase()) ||
      b.type?.toLowerCase().includes(search.toLowerCase())
    const agence = b.nom_agence || 'SAINT FRANCOIS IMMOBILIER'
    const matchAgence = filterAgence === 'tous' ||
      (filterAgence === 'moi' && agence.toUpperCase().includes('SAINT FRANCOIS')) ||
      (filterAgence === 'partenaires' && !agence.toUpperCase().includes('SAINT FRANCOIS'))
    return matchSearch && matchAgence
  })

  const totalPages = Math.ceil(filteredBiens.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBiens = filteredBiens.slice(startIndex, startIndex + itemsPerPage)

  // Photos du bien sélectionné
  const photos = selectedBien?.photos ? selectedBien.photos.split('|').filter(p => p.trim()) : []

  const nextPhoto = () => setCurrentPhoto((prev) => (prev + 1) % photos.length)
  const prevPhoto = () => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)

  const openModal = (bien) => {
    setSelectedBien(bien)
    setCurrentPhoto(0)
  }


  const openEdit = (bien, e) => {
    e.stopPropagation()
    setEditBien(bien)
    setEditForm({
      description: bien.description || "",
      defauts: bien.defauts || "",
      etat: bien.etat || "",
      quartier: bien.quartier || "",
      stationnement: bien.stationnement || "",
      exterieur: bien.exterieur || "",
    })
    setEditError("")
  }

  const saveEdit = async () => {
    setEditSaving(true)
    setEditError("")
    try {
      const res = await fetch(`${API_URL}/biens/${editBien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editBien, ...editForm })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBiens(prev => prev.map(b => b.id === editBien.id ? { ...b, ...editForm } : b))
      setEditBien(null)
    } catch (err) {
      setEditError(err.message || "Erreur lors de la sauvegarde")
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div>

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 20, padding: '28px 28px 24px',
              width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            {/* Icône */}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>
            {/* Texte */}
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                Supprimer ce bien ?
              </p>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                <strong style={{ color: '#1E3A5F' }}>{confirmDelete.type} · {confirmDelete.ville}</strong> sera définitivement supprimé. Cette action est irréversible.
              </p>
            </div>
            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid #e2e8f0',
                  background: 'white', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.3)'}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Biens</h1>
          <p className="text-sm text-gray-400">{biens.length} biens en catalogue</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un bien..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
            />
          </div>

          {hasPrimmo && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {[
                { key: 'tous', label: 'Tous' },
                { key: 'moi', label: 'Saint François' },
                { key: 'partenaires', label: 'Partenaires' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilterAgence(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterAgence === opt.key
                      ? 'bg-[#1E3A5F] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <label className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl btn-press flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            {importing ? 'Import...' : 'Importer Biens'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Bien</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Localisation</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Surface</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prix</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">État</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : biens.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} className="text-gray-300 animate-float" />
          </div>
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Aucun bien disponible</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            En attente des données Hektor. Importez le fichier des biens pour commencer le matching avec vos prospects.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-xl btn-press cursor-pointer">
            <Upload size={20} />
            Importer le fichier des biens
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Bien</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Localisation</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Surface</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prix</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">État</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedBiens.map((bien, index) => {
                const firstPhoto = bien.photos ? bien.photos.split('|')[0] : null
                
                return (
                  <tr 
                    key={bien.id} 
                    className="row-hover group animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Miniature ou icône */}
                        {firstPhoto ? (
                          <div 
                            className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#1E3A5F]/30 transition-all hover:scale-105"
                            onClick={() => openModal(bien)}
                          >
                            <img 
                              src={firstPhoto} 
                              alt={bien.type}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-emerald-100"><svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></div>'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Home size={20} className="text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <button 
                            onClick={() => openModal(bien)}
                            className="font-semibold text-[#1E3A5F] hover:text-[#2D5A8A] hover:underline text-left transition-colors"
                          >
                            {bien.type || 'Bien'}
                          </button>
                          <p className="text-[10px] text-gray-300 font-mono tracking-wide">{bien.reference || ''}</p>
                          {bien.nom_agence && !bien.nom_agence.toUpperCase().includes('SAINT FRANCOIS') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100 mt-0.5">
                              {bien.nom_agence}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{bien.ville || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Maximize size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{bien.surface ? `${bien.surface} m²` : '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-[#1E3A5F]">{formatPrix(bien.prix)}</span>
                    </td>
                    <td className="p-4">
                      {bien.etat ? (() => {
                        const e = (bien.etat || '').toLowerCase()
                        const style = e.includes('vente') || e.includes('disponible')
                          ? 'bg-emerald-100 text-emerald-700'
                          : e.includes('vendu') || e.includes('signé')
                          ? 'bg-red-100 text-red-600'
                          : e.includes('réservé') || e.includes('compromis')
                          ? 'bg-amber-100 text-amber-700'
                          : e.includes('location')
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-gray-100 text-gray-600'
                        return <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${style}`}>{bien.etat}</span>
                      })() : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(bien)}
                          className="p-2 rounded-lg hover:bg-[#DCE7F3] text-gray-400 hover:text-[#1E3A5F] transition-all"
                          title="Voir"
                        >
                          <Eye size={16} className="icon-bounce" />
                        </button>
                        <button
                          onClick={(e) => openEdit(bien, e)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-all"
                          title="Modifier"
                        >
                          <Pencil size={16} className="icon-pop" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDelete({ id: bien.id, type: bien.type, ville: bien.ville }) }}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all group/del"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="group-hover/del:animate-shake" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredBiens.length}
              itemsPerPage={itemsPerPage}
              onChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Modal Détail Bien */}
      {selectedBien && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedBien(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-bounce-in" onClick={e => e.stopPropagation()}>
            
            {/* Header avec photo */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700">
              {photos.length > 0 ? (
                <div className="relative h-64">
                  <img 
                    src={photos[currentPhoto]} 
                    alt={`Photo ${currentPhoto + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {photos.length > 1 && (
                    <>
                      <button 
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all hover:scale-110"
                      >
                        <ChevronLeft size={20} className="text-white" />
                      </button>
                      <button 
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all hover:scale-110"
                      >
                        <ChevronRight size={20} className="text-white" />
                      </button>
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentPhoto ? 'bg-white scale-125' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl font-bold">{selectedBien.type} à {selectedBien.ville}</h2>
                    {selectedBien.reference && <p className="text-white/70 text-sm">Réf. {selectedBien.reference}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-white">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <Building2 size={28} />
                  </div>
                  <h2 className="text-xl font-bold">{selectedBien.type} à {selectedBien.ville}</h2>
                  {selectedBien.reference && <p className="text-white/70 text-sm">Réf. {selectedBien.reference}</p>}
                </div>
              )}
              
              <button 
                onClick={() => setSelectedBien(null)} 
                className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all hover:scale-110"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Stats principales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Euro size={20} className="mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-bold text-[#1E3A5F]">{formatPrix(selectedBien.prix)}</p>
                  <p className="text-xs text-gray-400">Prix</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Maximize size={20} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold text-[#1E3A5F]">{selectedBien.surface || '-'} m²</p>
                  <p className="text-xs text-gray-400">Surface</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Home size={20} className="mx-auto text-violet-600 mb-1" />
                  <p className="text-lg font-bold text-[#1E3A5F]">{selectedBien.pieces || '-'} pièces</p>
                  <p className="text-xs text-gray-400">{selectedBien.chambres ? `${selectedBien.chambres} ch.` : ''}</p>
                </div>
              </div>

              {/* Détails */}
              <div className="grid grid-cols-2 gap-3">
                {selectedBien.quartier && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.quartier}</span>
                  </div>
                )}
                {selectedBien.etat && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.etat}</span>
                  </div>
                )}
                {selectedBien.exposition && (
                  <div className="flex items-center gap-2 text-sm">
                    <Compass size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.exposition}</span>
                  </div>
                )}
                {selectedBien.stationnement && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.stationnement}</span>
                  </div>
                )}
                {selectedBien.exterieur && (
                  <div className="flex items-center gap-2 text-sm">
                    <TreePine size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.exterieur}</span>
                  </div>
                )}
                {selectedBien.etage && (
                  <div className="flex items-center gap-2 text-sm">
                    <Layers size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBien.etage}</span>
                  </div>
                )}
              </div>

              {/* Caractéristiques Hektor */}
              {(selectedBien.etage_bien != null || selectedBien.ascenseur === 1 || selectedBien.cave === 1 || 
                selectedBien.nb_parkings > 0 || selectedBien.nb_boxes > 0 || 
                selectedBien.terrasse === 1 || selectedBien.nb_balcons > 0 ||
                selectedBien.orientation_sud === 1 || selectedBien.orientation_est === 1 ||
                selectedBien.orientation_ouest === 1 || selectedBien.orientation_nord === 1) && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Caractéristiques</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBien.etage_bien != null && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        <Layers size={12} />
                        Étage {selectedBien.etage_bien}
                        {selectedBien.nb_etages_immeuble ? `/${selectedBien.nb_etages_immeuble}` : ''}
                      </span>
                    )}
                    {selectedBien.ascenseur === 1 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        ↑ Ascenseur
                      </span>
                    )}
                    {selectedBien.cave === 1 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        Cave
                      </span>
                    )}
                    {selectedBien.nb_parkings > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        <Car size={12} />
                        {selectedBien.nb_parkings} parking{selectedBien.nb_parkings > 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedBien.nb_boxes > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        <Car size={12} />
                        {selectedBien.nb_boxes} box{selectedBien.nb_boxes > 1 ? 'es' : ''}
                      </span>
                    )}
                    {selectedBien.terrasse === 1 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                        <TreePine size={12} />
                        Terrasse
                      </span>
                    )}
                    {selectedBien.nb_balcons > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                        {selectedBien.nb_balcons} balcon{selectedBien.nb_balcons > 1 ? 's' : ''}
                      </span>
                    )}
                    {/* Orientations */}
                    {[
                      { key: 'orientation_sud', label: 'Sud' },
                      { key: 'orientation_est', label: 'Est' },
                      { key: 'orientation_ouest', label: 'Ouest' },
                      { key: 'orientation_nord', label: 'Nord' },
                    ].filter(o => selectedBien[o.key] === 1).length > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                        <Compass size={12} />
                        {['orientation_sud','orientation_est','orientation_ouest','orientation_nord']
                          .filter(k => selectedBien[k] === 1)
                          .map(k => k.replace('orientation_', '').charAt(0).toUpperCase() + k.replace('orientation_', '').slice(1))
                          .join(' / ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* DPE / GES */}
              {(selectedBien.dpe_lettre != null || selectedBien.ges_lettre != null) && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Performance énergétique</p>
                  <div className="flex gap-3">
                    {selectedBien.dpe_lettre && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          selectedBien.dpe_lettre === 'A' ? 'bg-green-500' :
                          selectedBien.dpe_lettre === 'B' ? 'bg-green-400' :
                          selectedBien.dpe_lettre === 'C' ? 'bg-lime-400' :
                          selectedBien.dpe_lettre === 'D' ? 'bg-yellow-400' :
                          selectedBien.dpe_lettre === 'E' ? 'bg-orange-400' :
                          selectedBien.dpe_lettre === 'F' ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          {selectedBien.dpe_lettre}
                        </span>
                        <div>
                          <p className="text-xs text-gray-400">DPE</p>
                          {selectedBien.dpe_kwh && <p className="text-xs font-medium text-gray-700">{selectedBien.dpe_kwh} kWh/m²/an</p>}
                        </div>
                      </div>
                    )}
                    {selectedBien.ges_lettre && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          selectedBien.ges_lettre === 'A' ? 'bg-green-500' :
                          selectedBien.ges_lettre === 'B' ? 'bg-green-400' :
                          selectedBien.ges_lettre === 'C' ? 'bg-lime-400' :
                          selectedBien.ges_lettre === 'D' ? 'bg-yellow-400' :
                          selectedBien.ges_lettre === 'E' ? 'bg-orange-400' :
                          selectedBien.ges_lettre === 'F' ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          {selectedBien.ges_lettre}
                        </span>
                        <div>
                          <p className="text-xs text-gray-400">GES</p>
                          {selectedBien.ges_co2 && <p className="text-xs font-medium text-gray-700">{selectedBien.ges_co2} kg CO₂/m²/an</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendeur et lien */}
              <div className="flex items-center gap-4">
                {selectedBien.vendeur && (
                  <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-400 mb-1">Vendeur</p>
                    <p className="text-sm font-medium text-blue-700">{selectedBien.vendeur}</p>
                  </div>
                )}
                {selectedBien.lien_annonce && (
                  <a 
                    href={selectedBien.lien_annonce} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <p className="text-xs text-emerald-400 mb-1">Annonce</p>
                    <p className="text-sm font-medium text-emerald-700">Voir sur le site →</p>
                  </a>
                )}
              </div>

              {/* Description */}
              {selectedBien.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{selectedBien.description}</p>
                </div>
              )}

              {/* Défauts */}
              {selectedBien.defauts && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 mb-2 font-semibold flex items-center gap-1">⚠️ Points négatifs (usage interne)</p>
                  <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">{selectedBien.defauts}</p>
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
                        className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all hover:scale-105 ${
                          idx === currentPhoto ? 'border-[#1E3A5F]' : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentPhoto(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Edition Bien */}
      {editBien && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditBien(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Pencil size={18} className="text-white" /></div>
                <div><h3 className="text-white font-semibold">Modifier le bien</h3><p className="text-white/70 text-sm">{editBien.type} a {editBien.ville}</p></div>
              </div>
              <button onClick={() => setEditBien(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1"><AlertCircle size={14} className="text-amber-500" />Defauts / Points negatifs</label>
                <textarea value={editForm.defauts} onChange={e => setEditForm(prev => ({ ...prev, defauts: e.target.value }))} rows={4} placeholder="Ex: vis-a-vis, pas de parking, bruit de rue..." className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none resize-none text-sm bg-amber-50/30" />
                <p className="text-xs text-gray-400 mt-1">Utilise par l IA pour le scoring. Non visible par les clients.</p>
                {/* Cases rapides */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Vis-à-vis",
                    "Pas de parking",
                    "Sans ascenseur",
                    "Bruit de rue",
                    "Rez-de-chaussée",
                    "Petite surface",
                    "Travaux à prévoir",
                    "Charges élevées",
                    "Pas d extérieur",
                  ].map(tag => {
                    const active = (editForm.defauts || "").includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = editForm.defauts || ""
                          const next = active
                            ? current.split(", ").filter(t => t !== tag).join(", ")
                            : current ? current + ", " + tag : tag
                          setEditForm(prev => ({ ...prev, defauts: next }))
                        }}
                        className={"px-2.5 py-1 rounded-lg text-xs font-medium border transition-all " + (active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600")}
                      >
                        {active ? "✓ " : "+ "}{tag}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Etat</label><input type="text" value={editForm.etat} onChange={e => setEditForm(prev => ({ ...prev, etat: e.target.value }))} placeholder="Bon etat..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label><input type="text" value={editForm.quartier} onChange={e => setEditForm(prev => ({ ...prev, quartier: e.target.value }))} placeholder="Centre-ville..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stationnement</label><input type="text" value={editForm.stationnement} onChange={e => setEditForm(prev => ({ ...prev, stationnement: e.target.value }))} placeholder="Garage, Parking..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Exterieur</label><input type="text" value={editForm.exterieur} onChange={e => setEditForm(prev => ({ ...prev, exterieur: e.target.value }))} placeholder="Jardin, Terrasse..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
              </div>
              {editError && (<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"><AlertCircle size={16} className="text-red-500 shrink-0" /><p className="text-sm text-red-600">{editError}</p></div>)}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditBien(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Annuler</button>
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">{editSaving ? <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</> : <><Save size={16} /> Enregistrer</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BiensPage