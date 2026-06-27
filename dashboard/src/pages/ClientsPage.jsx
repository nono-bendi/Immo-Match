import { useState, useEffect, useRef } from 'react'
import { Eye, Phone, Mail, Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Save, Sparkles, Users, Archive, ArchiveRestore, ChevronDown, Shuffle, Upload, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProspectModal from '../components/ProspectModal'
import AnalysisOverlay from '../components/AnalysisOverlay'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

import { apiFetch } from '../api'
import { API_URL } from '../config'

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
      <td className="p-4 hidden sm:table-cell"><div className="h-4 w-20 rounded animate-shimmer" /></td>
      <td className="p-4 hidden sm:table-cell"><div className="h-4 w-24 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
      <td className="p-4 hidden sm:table-cell"><div className="h-4 w-16 rounded animate-shimmer" /></td>
      <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer ml-auto" /></td>
    </tr>
  )
}

const AV_PAL = [
  ['#1E3A5F', '#2D5A8A'], ['#0e7490', '#06b6d4'], ['#047857', '#10b981'],
  ['#b45309', '#f59e0b'], ['#5b21b6', '#a78bfa'], ['#1d4ed8', '#60a5fa'],
  ['#be185d', '#ec4899'], ['#7c3aed', '#c084fc'],
]
const avP = (n) => AV_PAL[(n || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_PAL.length]

const INP = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"

// Bouton toggle réutilisable
function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      style={active ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}>
      {label}
    </button>
  )
}

function EditProspectModal({ prospect, saving, onChange, onSave, onClose }) {
  const [tab, setTab] = useState('recherche')
  const tabs = [
    { id: 'contact', label: 'Contact' },
    { id: 'recherche', label: 'Recherche' },
    { id: 'criteres', label: 'Critères' },
  ]

  // Helpers pour les champs CSV (bien, etat, expo, etage, exterieur, copro, destination)
  const csvToggle = (field, value) => {
    const current = (prospect[field] || '').split(',').map(v => v.trim()).filter(Boolean)
    const idx = current.indexOf(value)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(value)
    onChange(field, current.join(', '))
  }
  const csvSel = (field, value) => (prospect[field] || '').split(',').map(v => v.trim()).includes(value)
  const singleToggle = (field, value) => onChange(field, prospect[field] === value ? '' : value)

  const BIENS = ['Maison', 'Appartement', 'T1', 'T2', 'T3', 'T4', 'T5+', 'Local commercial',
    'Immeuble', 'Immeuble de rapport', 'Maison divisée', 'Terrain', 'Tous biens']

  const ETATS = ['Neuf', 'Bon état', 'Menus travaux', 'À rénover', 'À démolir (marchand)']
  const EXPOS = ['Sud', 'Est', 'Ouest', 'Nord', 'Lumineux (peu importe)']
  const ETAGES = ['RDC', 'Étage bas (1-2)', 'Étage élevé (3+)', 'Dernier étage', 'Avec ascenseur']
  const STATIONN = ['Garage', 'Parking', 'Box', 'Cave', 'Cave ou Garage', 'Obligatoire (type indifférent)', 'Pas nécessaire']
  const COPRO = ['Copropriété OK', 'Faibles charges uniquement', 'Pas de copropriété', 'Peu importe']
  const COPRO_VALS = ['Oui', 'Faibles charges', 'Non', 'Peu importe']
  const DEST = ["Résidence principale", "Inv. Locatif à l'année", "Inv. Locatif saisonnier", "Résidence secondaire", "Marchand de biens"]
  const EXT_GROUPS = [
    { label: 'Extérieur', opts: ['Balcon', 'Terrasse', 'Rez-de-jardin', 'Pas obligatoire'] },
    { label: 'Environnement', opts: ['Au calme', 'Vue mer souhaitée', 'Vue mer indispensable', 'Plages à pieds', 'Commerces à pieds', 'Piscine'] },
    { label: 'Prestations', opts: ['Grande pièce à vivre', 'Plain-pied', 'Accès PMR', 'Cuisine fermée', 'Contemporain', 'Atypique', 'Ancien'] },
  ]

  return (
    <div className="fixed inset-0 lg:left-64 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl overflow-hidden flex flex-col" style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.18)', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-0 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F]">Modifier le prospect</h2>
            <p className="text-sm text-gray-400 mt-0.5">{[prospect.titre, prospect.nom, prospect.prenom].filter(Boolean).join(' ')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors -mt-1">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        {/* Tabs */}
        <div className="px-6 mt-4 flex gap-1 border-b border-gray-100 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.id ? 'text-[#1E3A5F] border-b-2 border-[#1E3A5F] -mb-px' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── CONTACT ── */}
          {tab === 'contact' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
                  <select value={prospect.titre || ''} onChange={e => onChange('titre', e.target.value)} className={INP}>
                    <option value="">—</option>
                    <option>M.</option><option>Mme</option><option>M. et Mme</option><option>Mme et Mme</option><option>M. et M.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                  <input type="text" value={prospect.nom || ''} onChange={e => onChange('nom', e.target.value)} className={INP} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
                  <input type="text" value={prospect.prenom || ''} onChange={e => onChange('prenom', e.target.value)} className={INP} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                  <input type="tel" value={prospect.telephone || ''} onChange={e => onChange('telephone', e.target.value)} className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={prospect.mail || ''} onChange={e => onChange('mail', e.target.value)} className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Prénom conjoint·e</label>
                  <input type="text" value={prospect.prenom2 || ''} onChange={e => onChange('prenom2', e.target.value)} placeholder="Optionnel" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Nom conjoint·e</label>
                  <input type="text" value={prospect.nom2 || ''} onChange={e => onChange('nom2', e.target.value)} placeholder="Optionnel" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Téléphone 2</label>
                  <input type="tel" value={prospect.telephone2 || ''} onChange={e => onChange('telephone2', e.target.value)} placeholder="Optionnel" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Email 2</label>
                  <input type="email" value={prospect.email2 || ''} onChange={e => onChange('email2', e.target.value)} placeholder="Optionnel" className={INP} /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Domicile actuel</label>
                <input type="text" value={prospect.domicile || ''} onChange={e => onChange('domicile', e.target.value)} className={INP} /></div>
            </div>
          )}

          {/* ── RECHERCHE ── */}
          {tab === 'recherche' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Type de bien <span className="text-gray-300 font-normal">(plusieurs choix)</span></label>
                <div className="flex flex-wrap gap-2">
                  {BIENS.map(b => <Chip key={b} label={b} active={csvSel('bien', b)} onClick={() => csvToggle('bien', b)} />)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Budget max (€)</label>
                  <input type="number" value={prospect.budget_max || ''} onChange={e => onChange('budget_max', e.target.value ? parseFloat(e.target.value) : null)} className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Pièces min</label>
                  <select value={prospect.pieces_min || ''} onChange={e => onChange('pieces_min', e.target.value)} className={INP}>
                    <option value="">Indifférent</option>
                    <option value="1">1 pièce</option><option value="2">2 pièces</option><option value="3">3 pièces</option>
                    <option value="4">4 pièces</option><option value="5">5 pièces +</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Villes <span className="text-gray-300 font-normal">(virgule-séparées)</span></label>
                  <input type="text" value={prospect.villes || ''} onChange={e => onChange('villes', e.target.value)} placeholder="Fréjus, Saint-Raphaël…" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Quartiers souhaités</label>
                  <input type="text" value={prospect.quartiers || ''} onChange={e => onChange('quartiers', e.target.value)} placeholder="Villeneuve, Saint-Aygulf…" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Quartiers à éviter</label>
                  <input type="text" value={prospect.quartiersExclus || ''} onChange={e => onChange('quartiersExclus', e.target.value)} placeholder="Centre-ville…" className={INP} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Surface min (m²)</label>
                  <input type="number" value={prospect.surface_min || ''} onChange={e => onChange('surface_min', e.target.value)} placeholder="50" className={INP} /></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Destination <span className="text-gray-300 font-normal">(plusieurs choix)</span></label>
                <div className="flex flex-wrap gap-2">
                  {DEST.map(d => <Chip key={d} label={d} active={csvSel('destination', d)} onClick={() => csvToggle('destination', d)} />)}
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Observations</label>
                <textarea value={prospect.observation || ''} onChange={e => onChange('observation', e.target.value)} rows={3} className={`${INP} resize-none`} /></div>
            </div>
          )}

          {/* ── CRITÈRES ── */}
          {tab === 'criteres' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">État du bien</label>
                <div className="flex flex-wrap gap-2">
                  {ETATS.map(e => <Chip key={e} label={e} active={csvSel('etat', e)} onClick={() => csvToggle('etat', e)} />)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Exposition</label>
                <div className="flex flex-wrap gap-2">
                  {EXPOS.map(e => <Chip key={e} label={e} active={csvSel('expo', e)} onClick={() => csvToggle('expo', e)} />)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Stationnement</label>
                <div className="flex flex-wrap gap-2">
                  {STATIONN.map((s, i) => <Chip key={s} label={s} active={prospect.stationnement === STATIONN[i]} onClick={() => singleToggle('stationnement', STATIONN[i])} />)}
                </div>
              </div>
              {EXT_GROUPS.map(g => (
                <div key={g.label}>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{g.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {g.opts.map(o => <Chip key={o} label={o} active={csvSel('exterieur', o)} onClick={() => csvToggle('exterieur', o)} />)}
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Étage</label>
                <div className="flex flex-wrap gap-2">
                  {ETAGES.map(e => <Chip key={e} label={e} active={csvSel('etage', e)} onClick={() => csvToggle('etage', e)} />)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Copropriété</label>
                <div className="flex flex-wrap gap-2">
                  {COPRO.map((label, i) => <Chip key={label} label={label} active={csvSel('copro', COPRO_VALS[i])} onClick={() => csvToggle('copro', COPRO_VALS[i])} />)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Salles de bain min</label>
                  <select value={prospect.sdb_min || ''} onChange={e => onChange('sdb_min', e.target.value)} className={INP}>
                    <option value="">Indifférent</option><option value="1">1 min</option><option value="2">2 min</option><option value="3">3 min</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">WC séparés min</label>
                  <select value={prospect.wc_min || ''} onChange={e => onChange('wc_min', e.target.value)} className={INP}>
                    <option value="">Indifférent</option><option value="1">1 min</option><option value="2">2 min</option><option value="3">3 min</option>
                  </select></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Accessibilité</label>
                <div className="flex flex-wrap gap-2">
                  <Chip label="Chambre de plain-pied" active={!!prospect.chambre_plain_pied} onClick={() => onChange('chambre_plain_pied', prospect.chambre_plain_pied ? 0 : 1)} />
                  <Chip label="Plain-pied / PMR" active={!!prospect.plain_pied_total} onClick={() => onChange('plain_pied_total', prospect.plain_pied_total ? 0 : 1)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
          <button onClick={onSave} disabled={saving} className="px-5 py-2 text-sm text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}>
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

const BIENS_FILTER = ['Maison', 'Appartement', 'Immeuble', 'Local commercial',
  'Terrain', 'Maison divisée', 'T1', 'T2', 'T3', 'T4', 'T5+']

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
  const [filterBien, setFilterBien] = useState('')
  const [filterBudget, setFilterBudget] = useState('')

  const openPortefeuille = () => {
    const t = localStorage.getItem('token')
    const params = new URLSearchParams({ type_bien: filterBien, token: t })
    if (filterBudget) params.append('budget_min', filterBudget)
    window.open(`${API_URL}/rapport/portefeuille?${params.toString()}`, '_blank')
  }

  // États pour l'analyse
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingProspect, setAnalyzingProspect] = useState(null)

  // État pour le modal de résultat
  const [resultModal, setResultModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })

  const navigate = useNavigate()
  const itemsPerPage = 20
  const [importing, setImporting] = useState(false)
  const importInputRef = useRef(null)

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await apiFetch('/prospects/import-add', { method: 'POST', body: formData })
      const data = await response.json()
      alert(data.message)
      fetchProspects()
    } catch {
      alert("Erreur lors de l'import")
    }
    setImporting(false)
    event.target.value = ''
  }

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

  const sorted = [...prospects].sort((a, b) => b.id - a.id)
  const matchesBienFilter = (p) => !filterBien ||
    (p.bien || '').toLowerCase().includes(filterBien.toLowerCase()) ||
    (p.bien || '').toLowerCase().includes('tous biens')
  const matchesBudgetFilter = (p) => !filterBudget ||
    (p.budget_max && p.budget_max >= parseInt(filterBudget))
  const matchesSearch = (p) =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.villes?.toLowerCase().includes(search.toLowerCase()) ||
    p.bien?.toLowerCase().includes(search.toLowerCase())
  const actifs = sorted.filter(p => !p.archive).filter(p => matchesBienFilter(p) && matchesBudgetFilter(p) && matchesSearch(p))
  const archives = sorted.filter(p => p.archive).filter(p => matchesBienFilter(p) && matchesBudgetFilter(p) && matchesSearch(p))

  const totalPages = Math.ceil(actifs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProspects = actifs.slice(startIndex, startIndex + itemsPerPage)

  const ProspectRow = ({ prospect, index, archived = false }) => {
    const [c1, c2] = archived ? ['#9ca3af', '#d1d5db'] : AV_PAL[(prospect.id || 0) % AV_PAL.length]
    return (
    <tr
      key={prospect.id}
      onClick={() => setSelectedProspect(prospect)}
      className={`row-hover group animate-fade-in-up cursor-pointer ${archived ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            {prospect.nom ? (() => { const p = prospect.nom.trim().split(' ').filter(x=>x); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : p[0].substring(0,2).toUpperCase() })() : '?'}
          </div>
          <div>
            <p className="font-semibold text-[#1E3A5F] flex items-center gap-2">
              {[prospect.titre, prospect.prenom, prospect.nom].filter(Boolean).join(' ') || 'Sans nom'}
              {(prospect.prenom2 || prospect.nom2) && (
                <span className="text-xs font-normal text-gray-400">&amp; {[prospect.prenom2, prospect.nom2].filter(Boolean).join(' ')}</span>
              )}
              {!!prospect.demo && (
                <span className="text-[10px] font-medium text-gray-400 border border-dashed border-gray-300 rounded px-1.5 py-0.5 leading-tight">
                  exemple
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {prospect.mail || '-'}
              {prospect.date_ajout && <span className="ml-2 text-gray-300">· {new Date(prospect.date_ajout).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4 hidden sm:table-cell" style={{ maxWidth: 130 }}>
        <span className="text-sm text-gray-600" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prospect.bien || <span className='text-gray-300'>—</span>}</span>
      </td>
      <td className="p-4 hidden sm:table-cell">
        {prospect.villes ? (() => {
          const villes = prospect.villes.split(/[,;]/).map(v => v.trim()).filter(Boolean)
          const shown = villes.slice(0, 2)
          const rest = villes.length - 2
          return <span className="text-sm text-gray-600" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shown.join(', ')}{rest > 0 && <span className="text-xs text-gray-400 ml-1">+{rest}</span>}
          </span>
        })() : <span className='text-gray-300'>—</span>}
      </td>
      <td className="p-4">
        <span className="text-sm font-medium text-[#1E3A5F]">{formatBudget(prospect.budget_max)}</span>
      </td>
      <td className="p-4 hidden sm:table-cell">
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
          return <span className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${style}`}>{prospect.destination}</span>
        })() : <span className="text-gray-300 text-sm">—</span>}
      </td>
      <td className="p-4">
        <div className="prospect-actions flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150">
          {!archived && (
            <button
              onClick={e => { e.stopPropagation(); handleAnalyze(prospect) }}
              className="p-2 rounded-lg hover:bg-amber-50 transition-all"
              title="Analyser ce prospect"
            >
              <Sparkles size={18} className="text-amber-500 icon-wiggle" />
            </button>
          )}
          {!archived && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/matchings?prospect=${prospect.id}`) }}
              className="p-2 rounded-lg hover:bg-indigo-50 transition-all"
              title="Voir les matchings"
            >
              <Shuffle size={18} className="text-indigo-400" />
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
  )}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Clients</h1>
            <p className="text-sm text-gray-400">
              {actifs.length} prospect{actifs.length !== 1 ? 's' : ''} actif{actifs.length !== 1 ? 's' : ''}
              {archives.length > 0 && <span className="ml-1 text-gray-300">· {archives.length} archivé{archives.length !== 1 ? 's' : ''}</span>}
            </p>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D5A8A]" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border-2 border-[#1E3A5F]/25 rounded-xl w-full sm:w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition-all placeholder:text-gray-400 text-[#1E3A5F] font-medium"
            />
          </div>

          <select
            value={filterBien}
            onChange={e => { setFilterBien(e.target.value); setFilterBudget(''); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-white border-2 border-[#1E3A5F]/25 rounded-xl text-sm font-medium text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition-all shadow-sm"
          >
            <option value="">Tous types</option>
            {BIENS_FILTER.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {filterBien && (
            <select
              value={filterBudget}
              onChange={e => { setFilterBudget(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2.5 bg-white border-2 border-[#1E3A5F]/25 rounded-xl text-sm font-medium text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition-all shadow-sm"
            >
              <option value="">Tous budgets</option>
              <option value="100000">100 000 € min</option>
              <option value="200000">200 000 € min</option>
              <option value="300000">300 000 € min</option>
              <option value="500000">500 000 € min</option>
              <option value="700000">700 000 € min</option>
              <option value="1000000">1 000 000 € min</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filterBien && (
            <button
              onClick={openPortefeuille}
              className="px-4 py-2.5 font-semibold rounded-xl btn-press flex items-center gap-2 text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              title={`Générer le rapport portefeuille "${filterBien}"`}
            >
              <Printer size={15} />
              <span className="hidden lg:inline">Portefeuille acheteurs</span>
              <span className="lg:hidden">Portefeuille</span>
            </button>
          )}
          <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2.5 font-medium rounded-xl btn-press flex items-center gap-2 border border-[#1E3A5F]/20 bg-white text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-all"
          >
            <Upload size={15} />
            {importing ? 'Import...' : 'Importer Excel'}
          </button>
          <button
            onClick={() => navigate('/clients/nouveau')}
            className="px-4 py-2.5 text-white font-medium rounded-xl btn-press flex items-center justify-center gap-2"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
          >
            <span className="text-lg leading-none">+</span>
            Nouveau prospect
          </button>
        </div>
      </div>

      {/* Table prospects actifs */}
      <div className="rounded-2xl overflow-hidden section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        {loading ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Recherche</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Villes</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Destination</th>
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
            <button
              onClick={() => navigate('/clients/nouveau')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl btn-press"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
            >
              <span className="text-lg">+</span>
              Nouveau prospect
            </button>
          </div>
        ) : (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '14%' }} className="hidden sm:table-column" />
              <col style={{ width: '13%' }} className="hidden sm:table-column" />
              <col style={{ width: '11%' }} />
              <col style={{ width: '16%' }} className="hidden sm:table-column" />
              <col style={{ width: '24%' }} />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Recherche</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Villes</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Destination</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProspects.map((prospect, index) => ProspectRow({ prospect, index }))}
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
            <div className="rounded-2xl overflow-hidden mt-2 section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Recherche</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Villes</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Destination</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {archives.map((prospect, index) => ProspectRow({ prospect, index, archived: true }))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Détails */}
      <ProspectModal prospect={selectedProspect} onClose={() => setSelectedProspect(null)} gradientFrom={selectedProspect ? AV_PAL[(selectedProspect.id || 0) % AV_PAL.length][0] : undefined} gradientTo={selectedProspect ? AV_PAL[(selectedProspect.id || 0) % AV_PAL.length][1] : undefined} />

      {/* Modal Édition */}
      {editingProspect && (
        <EditProspectModal
          prospect={editingProspect}
          saving={saving}
          onChange={handleEditChange}
          onSave={handleSaveEdit}
          onClose={() => setEditingProspect(null)}
        />
      )}

      {/* Modal Confirmation Suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 lg:left-64 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl w-full max-w-md p-6 animate-bounce-in" style={{ background: 'white', border: '1px solid #e5e7eb' }}>
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
