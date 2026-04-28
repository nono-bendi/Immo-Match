import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Building2, Search, Upload, MapPin, Maximize, Home, Eye, Pencil, Trash2, X, AlertCircle, Save, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw } from 'lucide-react'

import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'
import Pagination from '../components/Pagination'
import BienModal from '../components/BienModal'

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
  const location = useLocation()
  const { agency } = useAgency()
  const nomFiltre = agency?.nom_filtre || 'SAINT FRANCOIS'
  const [biens, setBiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAgence, setFilterAgence] = useState('tous')
  const [currentPage, setCurrentPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const [selectedBien, setSelectedBien] = useState(null)
  const [editBien, setEditBien] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' })
  const [showVendus, setShowVendus] = useState(false)
  const itemsPerPage = 10

  const handleSort = (field) => {
    setSortConfig(prev =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    )
    setCurrentPage(1)
  }

  const handleSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const fetchBiens = () => {
    apiFetch('/biens')
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

  // Ouvre la fiche du bien ciblé si ?ref= est dans l'URL (navigation depuis le chat)
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref')
    if (!ref || biens.length === 0) return
    const bien = biens.find(b => b.reference?.toUpperCase() === ref.toUpperCase())
    if (bien) openModal(bien)
  }, [location.search, biens])

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiFetch('/biens/import', {
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
      await apiFetch(`/biens/${confirmDelete.id}`, { method: 'DELETE' })
      fetchBiens()
    } catch {
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
  const agencesUniques = [...new Set(biens.map(b => b.nom_agence || nomFiltre).filter(Boolean))]
  const hasPrimmo = agencesUniques.length > 1

  const filteredBiens = biens
    .filter(b => {
      if (!showVendus && b.statut === 'vendu') return false
      const matchSearch = b.reference?.toLowerCase().includes(search.toLowerCase()) ||
        b.ville?.toLowerCase().includes(search.toLowerCase()) ||
        b.type?.toLowerCase().includes(search.toLowerCase())
      const agence = b.nom_agence || nomFiltre
      const matchAgence = filterAgence === 'tous' ||
        (filterAgence === 'moi' && agence.toUpperCase().includes(nomFiltre.toUpperCase())) ||
        (filterAgence === 'partenaires' && !agence.toUpperCase().includes(nomFiltre.toUpperCase()))
      return matchSearch && matchAgence
    })
    .sort((a, b) => {
      if (showVendus) {
        if (a.statut === 'vendu' && b.statut !== 'vendu') return -1
        if (b.statut === 'vendu' && a.statut !== 'vendu') return 1
      }
      if (!sortConfig.field) return 0
      const valA = a[sortConfig.field] ?? ''
      const valB = b[sortConfig.field] ?? ''
      const cmp = typeof valA === 'number'
        ? valA - valB
        : String(valA).localeCompare(String(valB), 'fr')
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })

  const totalPages = Math.ceil(filteredBiens.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBiens = filteredBiens.slice(startIndex, startIndex + itemsPerPage)


  const openModal = (bien) => {
    setSelectedBien(bien)
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
      lien_annonce: bien.lien_annonce || "",
    })
    setEditError("")
  }

  const saveEdit = async () => {
    setEditSaving(true)
    setEditError("")
    try {
      const res = await apiFetch(`/biens/${editBien.id}`, {
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
          <p className="text-sm text-gray-400">
            {biens.filter(b => b.statut !== 'vendu').length} actifs
            {biens.some(b => b.statut === 'vendu') && (
              <button
                onClick={() => { setShowVendus(v => !v); setCurrentPage(1) }}
                className={`ml-1 transition-colors ${showVendus ? 'text-red-500 font-medium' : 'text-red-300 hover:text-red-400'}`}
              >
                · {biens.filter(b => b.statut === 'vendu').length} vendu{biens.filter(b => b.statut === 'vendu').length > 1 ? 's' : ''}
              </button>
            )}
          </p>
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
                { key: 'moi', label: agency?.nom_court || nomFiltre },
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
                {[
                  { label: 'Surface', field: 'surface' },
                  { label: 'Prix', field: 'prix' },
                ].map(({ label, field }) => {
                  const active = sortConfig.field === field
                  const Icon = active ? (sortConfig.direction === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
                  return (
                    <th
                      key={field}
                      className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none group"
                      onClick={() => handleSort(field)}
                    >
                      <span className={`inline-flex items-center gap-1 hover:text-[#1E3A5F] transition-colors ${active ? 'text-[#1E3A5F]' : ''}`}>
                        {label}
                        <Icon size={13} className={active ? 'text-[#1E3A5F]' : 'text-gray-300 group-hover:text-gray-400'} />
                      </span>
                    </th>
                  )
                })}
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
                    className={`row-hover group animate-fade-in-up ${bien.statut === 'vendu' ? 'opacity-50' : ''}`}
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
                          {bien.statut === 'vendu' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 mt-0.5">
                              Vendu / Retiré
                            </span>
                          )}
                          {bien.nom_agence && !bien.nom_agence.toUpperCase().includes(nomFiltre.toUpperCase()) && (
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
                        {bien.statut === 'vendu' && (
                          <button
                            onClick={async e => {
                              e.stopPropagation()
                              await apiFetch(`/biens/${bien.id}/restaurer`, { method: 'PATCH' })
                              fetchBiens()
                            }}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all"
                            title="Restaurer — ce bien n'est pas vendu"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
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
      <BienModal bien={selectedBien} onClose={() => setSelectedBien(null)} />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien de l'annonce</label>
                <input type="url" value={editForm.lien_annonce} onChange={e => setEditForm(prev => ({ ...prev, lien_annonce: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
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