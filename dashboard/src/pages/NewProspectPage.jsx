import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, User, Home, Settings, Target, FileText, X, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import AnalysisOverlay from '../components/AnalysisOverlay'
import { apiFetch } from '../api'

function NewProspectPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [villeInput, setVilleInput] = useState('')
  
  // États pour les modales
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showCancel: false })
  const [showAnalyzePrompt, setShowAnalyzePrompt] = useState(false)
  const [newProspectId, setNewProspectId] = useState(null)
  const [newProspectName, setNewProspectName] = useState('')
  
  // États pour l'overlay d'analyse
  const [showOverlay, setShowOverlay] = useState(false)
  
  const [formData, setFormData] = useState({
    nom: '',
    mail: '',
    telephone: '',
    domicile: '',
    bien: [],
    villes: [],
    quartiers: '',
    quartiersExclus: '',
    budget_max: '',
    surface_min: '',
    pieces_min: '',
    etat: [],
    expo: [],
    stationnement: '',
    exterieur: [],
    etage: [],
    copro: '',
    destination: '',
    observation: ''
  })

  const villesSuggestions = [
    'Fréjus', 'Saint-Raphaël', 'Le Muy', 'Roquebrune-sur-Argens', 
    'Puget-sur-Argens', 'Saint-Aygulf', 'Les Adrets', 'Bagnols-en-Forêt'
  ]

  const typeBienOptions = [
    { value: 'Maison', label: 'Maison' },
    { value: 'Appartement', label: 'Appartement' },
    { value: 'T1', label: 'T1 / Studio' },
    { value: 'T2', label: 'T2' },
    { value: 'T3', label: 'T3' },
    { value: 'T4', label: 'T4' },
    { value: 'T5+', label: 'T5 et +' },
    { value: 'Local commercial', label: 'Local commercial' },
    { value: 'Terrain', label: 'Terrain' },
    { value: 'Tous biens', label: 'Tous types' }
  ]

  const etatOptions = [
    { value: 'Neuf', label: 'Neuf' },
    { value: 'Bon état', label: 'Bon état' },
    { value: 'Menus travaux', label: 'Menus travaux' },
    { value: 'À rénover', label: 'À rénover' },
    { value: 'À démolir', label: 'À démolir (marchand)' }
  ]

  const expoOptions = [
    { value: 'Sud', label: 'Sud' },
    { value: 'Est', label: 'Est' },
    { value: 'Ouest', label: 'Ouest' },
    { value: 'Nord', label: 'Nord' },
    { value: 'Lumineux', label: 'Lumineux (peu importe)' }
  ]

  const exterieurOptions = [
    { value: 'Balcon', label: 'Balcon' },
    { value: 'Terrasse', label: 'Terrasse' },
    { value: 'Jardin', label: 'Jardin' },
    { value: 'Piscine', label: 'Piscine' },
    { value: 'Vue mer', label: 'Vue mer' },
    { value: 'Au calme', label: 'Au calme' }
  ]

  const etageOptions = [
    { value: 'RDC', label: 'RDC' },
    { value: 'Étage bas', label: 'Étage bas (1-2)' },
    { value: 'Étage élevé', label: 'Étage élevé (3+)' },
    { value: 'Dernier étage', label: 'Dernier étage' },
    { value: 'Avec ascenseur', label: 'Avec ascenseur' }
  ]

  const stationnementOptions = [
    { value: 'Garage', label: 'Garage' },
    { value: 'Parking', label: 'Parking' },
    { value: 'Box', label: 'Box' },
    { value: 'Obligatoire', label: 'Obligatoire (type indifférent)' },
    { value: 'Pas nécessaire', label: 'Pas nécessaire' }
  ]

  const coproOptions = [
    { value: 'Oui', label: 'Copropriété OK' },
    { value: 'Faibles charges', label: 'Faibles charges uniquement' },
    { value: 'Non', label: 'Pas de copropriété' },
    { value: 'Peu importe', label: 'Peu importe' }
  ]

  const destinationOptions = [
    { value: 'Résidence principale', label: 'Résidence principale' },
    { value: 'Inv. Locatif à l\'année', label: 'Investissement locatif année' },
    { value: 'Inv. Locatif saisonnier', label: 'Investissement saisonnier' },
    { value: 'Résidence secondaire', label: 'Résidence secondaire' },
    { value: 'Marchand de biens', label: 'Marchand de biens' }
  ]

  const showModal = (type, title, message, onConfirm = null, showCancel = false) => {
    setModal({ isOpen: true, type, title, message, onConfirm, showCancel })
  }

  const closeModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  const addVille = (ville) => {
    const villeClean = ville.trim()
    if (villeClean && !formData.villes.includes(villeClean)) {
      setFormData(prev => ({ ...prev, villes: [...prev.villes, villeClean] }))
    }
    setVilleInput('')
  }

  const removeVille = (ville) => {
    setFormData(prev => ({ ...prev, villes: prev.villes.filter(v => v !== ville) }))
  }

  const handleVilleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addVille(villeInput)
    }
  }

  const runAnalysis = async () => {
    setShowAnalyzePrompt(false)
    setShowOverlay(true)
    
    try {
      await apiFetch(`/matching/run/${newProspectId}`, { method: 'POST' })
      setShowOverlay(false)
      navigate('/matchings')
    } catch {
      setShowOverlay(false)
      showModal('error', 'Erreur', 'Une erreur est survenue lors de l\'analyse.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const dataToSend = {
      ...formData,
      bien: formData.bien.join(', '),
      villes: formData.villes.join(', '),
      etat: formData.etat.join(', '),
      expo: formData.expo.join(', '),
      exterieur: formData.exterieur.join(', '),
      etage: formData.etage.join(', '),
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      criteres: [
        formData.quartiersExclus ? `Éviter: ${formData.quartiersExclus}` : '',
        formData.surface_min ? `Surface min: ${formData.surface_min}m²` : '',
        formData.pieces_min ? `Pièces min: ${formData.pieces_min}` : ''
      ].filter(Boolean).join(' | ')
    }

    try {
      const response = await apiFetch('/prospects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      const data = await response.json()
      
      if (data.error) {
        showModal('error', 'Erreur', data.error)
      } else {
        setNewProspectId(data.id)
        setNewProspectName(formData.nom)
        setShowAnalyzePrompt(true)
      }
    } catch {
      showModal('error', 'Erreur', 'Une erreur est survenue lors de l\'enregistrement.')
    }
    
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modal générique */}
      <Modal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
      />

      {/* Modal de proposition d'analyse */}
      {showAnalyzePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">Prospect enregistré !</h3>
              <p className="text-gray-600 mb-6">
                <strong>{newProspectName}</strong> a été ajouté avec succès.
                <br /><br />
                Voulez-vous lancer l'analyse IA pour trouver des biens correspondants ?
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setShowAnalyzePrompt(false)
                    navigate('/clients')
                  }}
                  className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={runAnalysis}
                  className="px-6 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl hover:bg-[#2D5A8A] transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyser maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay d'analyse */}
      <AnalysisOverlay 
        isVisible={showOverlay}
        totalProspects={1}
        currentProspect={1}
        currentProspectName={newProspectName}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/clients')}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Nouveau prospect</h1>
          <p className="text-sm text-gray-400">Remplissez les informations du client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section: Informations de base */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Informations de contact</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex: Mr et Mme Dupont"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.mail}
                onChange={(e) => handleChange('mail', e.target.value)}
                placeholder="email@exemple.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domicile actuel</label>
              <input
                type="text"
                value={formData.domicile}
                onChange={(e) => handleChange('domicile', e.target.value)}
                placeholder="Ville actuelle"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
          </div>
        </div>

        {/* Section: Recherche immobilière */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Recherche immobilière</h2>
          </div>
          
          <div className="space-y-4">
            {/* Type de bien - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de bien recherché * 
                <span className="text-gray-400 font-normal ml-2">(plusieurs choix possibles)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {typeBienOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelect('bien', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.bien.includes(option.value)
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {formData.bien.length > 0 && (
                <p className="text-sm text-[#1E3A5F] mt-2">
                  Sélection : {formData.bien.join(', ')}
                </p>
              )}
            </div>

            {/* Villes - Input libre avec tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Villes recherchées *
                <span className="text-gray-400 font-normal ml-2">(tapez ou cliquez)</span>
              </label>
              
              {formData.villes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.villes.map(ville => (
                    <span 
                      key={ville}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] text-white text-sm rounded-lg"
                    >
                      {ville}
                      <button
                        type="button"
                        onClick={() => removeVille(ville)}
                        className="p-0.5 hover:bg-white/20 rounded"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={villeInput}
                  onChange={(e) => setVilleInput(e.target.value)}
                  onKeyDown={handleVilleKeyDown}
                  placeholder="Tapez une ville et appuyez sur Entrée..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
                <button
                  type="button"
                  onClick={() => addVille(villeInput)}
                  disabled={!villeInput.trim()}
                  className="px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#2D5A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {!formData.villes.includes('Tout secteur') && (
                  <button
                    type="button"
                    onClick={() => addVille('Tout secteur')}
                    className="px-3 py-1.5 bg-[#1E3A5F]/10 text-[#1E3A5F] text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/20 transition-colors border border-[#1E3A5F]/20"
                  >
                    + Tout secteur
                  </button>
                )}
                {villesSuggestions.filter(v => !formData.villes.includes(v)).map(ville => (
                  <button
                    key={ville}
                    type="button"
                    onClick={() => addVille(ville)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    + {ville}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quartiers souhaités</label>
                <input
                  type="text"
                  value={formData.quartiers}
                  onChange={(e) => handleChange('quartiers', e.target.value)}
                  placeholder="Ex: Centre historique, Plage..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quartiers à éviter</label>
                <input
                  type="text"
                  value={formData.quartiersExclus}
                  onChange={(e) => handleChange('quartiersExclus', e.target.value)}
                  placeholder="Ex: Centre-ville, Zone industrielle..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget maximum *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={formData.budget_max}
                    onChange={(e) => handleChange('budget_max', e.target.value)}
                    placeholder="250000"
                    className="w-full px-4 py-2.5 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Surface minimum</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.surface_min}
                    onChange={(e) => handleChange('surface_min', e.target.value)}
                    placeholder="50"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">m²</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pièces minimum</label>
                <select
                  value={formData.pieces_min}
                  onChange={(e) => handleChange('pieces_min', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white"
                >
                  <option value="">Indifférent</option>
                  <option value="1">1 pièce</option>
                  <option value="2">2 pièces</option>
                  <option value="3">3 pièces</option>
                  <option value="4">4 pièces</option>
                  <option value="5">5 pièces +</option>
                </select>
              </div>
            </div>

            {formData.budget_max && (
              <p className="text-sm text-[#1E3A5F]">
                Budget : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(formData.budget_max)}
                {formData.surface_min && ` • Surface min : ${formData.surface_min}m²`}
                {formData.pieces_min && ` • ${formData.pieces_min} pièces min`}
              </p>
            )}
          </div>
        </div>

        {/* Section: Critères spécifiques */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Critères spécifiques</h2>
            <span className="text-sm text-gray-400">(optionnel)</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État du bien accepté</label>
              <div className="flex flex-wrap gap-2">
                {etatOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelect('etat', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.etat.includes(option.value)
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exposition souhaitée</label>
              <div className="flex flex-wrap gap-2">
                {expoOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelect('expo', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.expo.includes(option.value)
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stationnement</label>
              <div className="flex flex-wrap gap-2">
                {stationnementOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('stationnement', formData.stationnement === option.value ? '' : option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.stationnement === option.value
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Extérieur souhaité</label>
              <div className="flex flex-wrap gap-2">
                {exterieurOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelect('exterieur', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.exterieur.includes(option.value)
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Étage préféré</label>
              <div className="flex flex-wrap gap-2">
                {etageOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelect('etage', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.etage.includes(option.value)
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copropriété</label>
              <div className="flex flex-wrap gap-2">
                {coproOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('copro', formData.copro === option.value ? '' : option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.copro === option.value
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Projet */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Projet</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination du bien</label>
              <div className="flex flex-wrap gap-2">
                {destinationOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('destination', formData.destination === option.value ? '' : option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.destination === option.value
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Observations / Notes
                </div>
              </label>
              <textarea
                value={formData.observation}
                onChange={(e) => handleChange('observation', e.target.value)}
                placeholder="Informations complémentaires, contraintes particulières, délais, financement..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between pb-8">
          <p className="text-sm text-gray-400">* Champs obligatoires</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !formData.nom || formData.bien.length === 0 || formData.villes.length === 0 || !formData.budget_max}
              className="px-6 py-3 bg-[#1E3A5F] text-white font-semibold rounded-xl hover:bg-[#2D5A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Enregistrer le prospect
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewProspectPage