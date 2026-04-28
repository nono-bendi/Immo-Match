import { useState, useEffect } from 'react'
import { Eye, Phone, Mail, Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Save, Sparkles, Users, Archive, ArchiveRestore, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProspectModal from '../components/ProspectModal'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

import { apiFetch } from '../api'

// Skeleton pour le chargement
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl animate-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded animate-shimmer" />
            <div className="h-3 w-24 rounded animate-shimmer" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-24 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-16 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer ml-auto" /></td>
    </tr>
  )
}

function ClientsPage() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [editingProspect, setEditingProspect] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // États pour l'analyse
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingProspect, setAnalyzingProspect] = useState(null)

  // État pour le modal de résultat
  const [resultModal, setResultModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })

  const navigate = useNavigate()
  const itemsPerPage = 10

  const fetchProspects = () => {
    apiFetch('/prospects')
      .then(response => response.json())
      .then(data => {
        setProspects(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Erreur:', error)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const handleSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const formatBudget = (budget) => {
    if (!budget) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
  }

  const handleEditChange = (field, value) => {
    setEditingProspect(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const response = await apiFetch(`/prospects/${editingProspect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProspect)
      })
      const data = await response.json()
      if (data.error) {
        alert('Erreur: ' + data.error)
      } else {
        setEditingProspect(null)
        fetchProspects()
      }
    } catch {
      alert('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleDelete = async (prospectId) => {
    try {
      const response = await apiFetch(`/prospects/${prospectId}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.error) {
        alert('Erreur: ' + data.error)
      } else {
        setDeleteConfirm(null)
        fetchProspects()
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const handleArchive = async (prospect) => {
    await apiFetch(`/prospects/${prospect.id}/archiver`, { method: 'PATCH' })
    fetchProspects()
  }

  const handleDesarchiver = async (prospect) => {
    await apiFetch(`/prospects/${prospect.id}/desarchiver`, { method: 'PATCH' })
    fetchProspects()
  }

  const cancelAnalyzing = () => {
    setAnalyzing(false)
    setAnalyzingProspect(null)
  }

  const handleAnalyze = async (prospect) => {
    setAnalyzing(true)
    setAnalyzingProspect(prospect)

    const startTime = Date.now()
    const MIN_DISPLAY_TIME = 5000

    try {
      const response = await apiFetch(`/matching/run/${prospect.id}`, { method: 'POST' })
      const data = await response.json()

      const elapsed = Date.now() - startTime
      if (elapsed < MIN_DISPLAY_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsed))
      }

      setAnalyzing(false)
      setAnalyzingProspect(null)

      if (data.error) {
        setResultModal({
          isOpen: true, type: 'warning',
          title: 'Aucun bien trouvé',
          message: `L'analyse pour ${prospect.nom} est terminée.\n\nAucun bien en portefeuille ne correspond aux critères de recherche (localisation, budget, type de bien).\n\nVous pouvez élargir les critères du prospect ou attendre de nouveaux biens.`
        })
      } else {
        const count = data.matchings_count || 0
        if (count > 0) {
          navigate('/matchings')
        } else {
          setResultModal({
            isOpen: true, type: 'warning',
            title: 'Aucune correspondance',
            message: `L'analyse pour ${prospect.nom} est terminée.\n\nAucun bien ne correspond suffisamment aux critères pour être proposé.\n\nEssayez d'élargir la recherche (budget, villes, type de bien).`
          })
        }
      }
    } catch (err) {
      console.error('Erreur:', err)
      const elapsed = Date.now() - startTime
      if (elapsed < MIN_DISPLAY_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsed))
      }
      setAnalyzing(false)
      setAnalyzingProspect(null)
      setResultModal({
        isOpen: true, type: 'error',
        title: 'Erreur',
        message: "Une erreur est survenue lors de l'analyse. Veuillez réessayer."
      })
    }
  }

  const actifs = prospects.filter(p => !p.archive).filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.villes?.toLowerCase().includes(search.toLowerCase()) ||
    p.bien?.toLowerCase().includes(search.toLowerCase())
  )
  const archives = prospects.filter(p => p.archive).filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.villes?.toLowerCase().includes(search.toLowerCase()) ||
    p.bien?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(actifs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProspects = actifs.slice(startIndex, startIndex + itemsPerPage)

  const ProspectRow = ({ prospect, index, archived = false }) => (
    <tr
      key={prospect.id}
      className={`row-hover group animate-fade-in-up ${archived ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${archived ? 'bg-gray-400' : 'bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8A]'}`}>
            {prospect.nom ? (() => { const p = prospect.nom.trim().split(' ').filter(x=>x); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : p[0].substring(0,2).toUpperCase() })() : '?'}
          </div>
          <div>
            <p className="font-semibold text-[#1E3A5F]">{prospect.nom || 'Sans nom'}</p>
            <p className="text-xs text-gray-400">{prospect.mail || '-'}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{prospect.bien || <span className='text-gray-300'>—</span>}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{prospect.villes || <span className='text-gray-300'>—</span>}</span>
      </td>
      <td className="p-4">
        <span className="text-sm font-medium text-[#1E3A5F]">{formatBudget(prospect.budget_max)}</span>
      </td>
      <td className="p-4">
        {prospect.destination ? (() => {
          const d = prospect.destination.toLowerCase()
          const style = d.includes('locatif') || d.includes('investis')
            ? 'bg-violet-100 text-violet-700'
            : d.includes('principal') || d.includes('résidence')
            ? 'bg-blue-100 text-blue-700'
            : d.includes('revente') || d.includes('rénovation')
            ? 'bg-amber-100 text-amber-700'
            : d.includes('pied')
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-600'
          return <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${style}`}>{prospect.destination}</span>
        })() : <span className="text-gray-300 text-sm">—</span>}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
          {!archived && (
            <button
              onClick={e => { e.stopPropagation(); handleAnalyze(prospect) }}
              className="p-2 rounded-lg hover:bg-amber-50 transition-all"
              title="Analyser ce prospect"
            >
              <Sparkles size={18} className="text-amber-500 icon-wiggle" />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); setSelectedProspect(prospect) }}
            className="p-2 rounded-lg hover:bg-[#DCE7F3] transition-all"
            title="Voir"
          >
            <Eye size={18} className="text-[#2D5A8A] icon-bounce" />
          </button>
          {!archived && (
            <button
              onClick={e => { e.stopPropagation(); setEditingProspect(prospect) }}
              className="p-2 rounded-lg hover:bg-amber-50 transition-all"
              title="Modifier"
            >
              <Pencil size={18} className="text-amber-500 icon-pop" />
            </button>
          )}
          {archived ? (
            <button
              onClick={e => { e.stopPropagation(); handleDesarchiver(prospect) }}
              className="p-2 rounded-lg hover:bg-emerald-50 transition-all"
              title="Désarchiver"
            >
              <ArchiveRestore size={18} className="text-emerald-500" />
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); handleArchive(prospect) }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              title="Archiver ce prospect"
            >
              <Archive size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); setDeleteConfirm(prospect.id) }}
            className="p-2 rounded-lg hover:bg-red-50 transition-all group/del"
            title="Supprimer"
          >
            <Trash2 size={18} className="text-red-400 group-hover/del:animate-shake" />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div>
      {/* Overlay d'analyse */}
      <AnalysisOverlay
        isVisible={analyzing}
        totalProspects={1}
        currentProspect={1}
        currentProspectName={analyzingProspect?.nom || ''}
        onCancel={cancelAnalyzing}
      />

      {/* Modal de résultat */}
      <Modal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal({ ...resultModal, isOpen: false })}
        title={resultModal.title}
        message={resultModal.message}
        type={resultModal.type}
        confirmText="Compris"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Clients</h1>
          <p className="text-sm text-gray-400">
            {actifs.length} prospect{actifs.length !== 1 ? 's' : ''} actif{actifs.length !== 1 ? 's' : ''}
            {archives.length > 0 && <span className="ml-1 text-gray-300">· {archives.length} archivé{archives.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
            />
          </div>

          <a
            href="/clients/nouveau"
            className="px-4 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-xl btn-press flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Nouveau prospect
          </a>
        </div>
      </div>

      {/* Table prospects actifs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Recherche</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Villes</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Destination</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : actifs.length === 0 && !search ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gray-300 animate-float" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">Aucun prospect actif</h2>
            <p className="text-gray-400 mb-4">Ajoutez votre premier prospect pour commencer</p>
            <a
              href="/clients/nouveau"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-xl btn-press"
            >
              <span className="text-lg">+</span>
              Nouveau prospect
            </a>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Recherche</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Villes</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Destination</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProspects.map((prospect, index) => (
                <ProspectRow key={prospect.id} prospect={prospect} index={index} />
              ))}
            </tbody>
          </table>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={actifs.length}
            itemsPerPage={itemsPerPage}
            onChange={setCurrentPage}
          />
        )}
      </div>

      {/* Section archivés */}
      {!loading && archives.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived(o => !o)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-2"
          >
            <Archive size={15} />
            <span>{archives.length} prospect{archives.length !== 1 ? 's' : ''} archivé{archives.length !== 1 ? 's' : ''}</span>
            <ChevronDown size={14} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
          </button>

          {showArchived && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-2">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Recherche</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Villes</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Destination</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {archives.map((prospect, index) => (
                    <ProspectRow key={prospect.id} prospect={prospect} index={index} archived />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Détails */}
      <ProspectModal prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />

      {/* Modal Édition */}
      {editingProspect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E3A5F]">Modifier le prospect</h2>
              <button onClick={() => setEditingProspect(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input type="text" value={editingProspect.nom || ''} onChange={(e) => handleEditChange('nom', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="text" value={editingProspect.telephone || ''} onChange={(e) => handleEditChange('telephone', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editingProspect.mail || ''} onChange={(e) => handleEditChange('mail', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domicile</label>
                  <input type="text" value={editingProspect.domicile || ''} onChange={(e) => handleEditChange('domicile', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de bien</label>
                  <input type="text" value={editingProspect.bien || ''} onChange={(e) => handleEditChange('bien', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Villes</label>
                  <input type="text" value={editingProspect.villes || ''} onChange={(e) => handleEditChange('villes', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget max</label>
                  <input type="number" value={editingProspect.budget_max || ''} onChange={(e) => handleEditChange('budget_max', e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input type="text" value={editingProspect.destination || ''} onChange={(e) => handleEditChange('destination', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                <textarea value={editingProspect.observation || ''} onChange={(e) => handleEditChange('observation', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 resize-none transition-all" />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingProspect(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg btn-press disabled:opacity-50 flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-bounce-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500 animate-shake" />
              </div>
              <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Supprimer ce prospect ?</h2>
              <p className="text-gray-500 mb-6">Cette action est irréversible. Les matchings associés seront également supprimés.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg btn-press hover:bg-red-600 transition-colors">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientsPage
