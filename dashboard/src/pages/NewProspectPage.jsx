import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, User, Home, Settings, Target, FileText, X, Plus, Mic, MicOff, Loader2, Sparkles } from 'lucide-react'
import Modal from '../components/Modal'
import AnalysisOverlay from '../components/AnalysisOverlay'
import { apiFetch } from '../api'

function NewProspectPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [villeInput, setVilleInput] = useState('')
  const [quartierInput, setQuartierInput] = useState('')
  const [searchConfig, setSearchConfig] = useState({ villes: [], quartiers: [] })

  // — Vocal —
  const [voiceOpen, setVoiceOpen]       = useState(false)
  const [listening, setListening]       = useState(false)
  const [transcript, setTranscript]     = useState('')
  const [parsing, setParsing]           = useState(false)
  const [voiceError, setVoiceError]     = useState('')
  const recognitionRef                  = useRef(null)

  const startListening = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setVoiceError("La reconnaissance vocale n'est pas supportée par ce navigateur (utilisez Chrome)."); return }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setVoiceError("Aucun microphone détecté sur cet appareil. Branchez un micro ou utilisez un autre appareil.")
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError("Accès au microphone refusé. Autorisez le microphone dans votre navigateur (icône cadenas dans la barre d'adresse).")
      } else {
        setVoiceError("Impossible d'accéder au microphone : " + err.message)
      }
      return
    }

    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(text)
    }
    rec.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') setVoiceError("Accès au microphone refusé. Autorisez le microphone dans votre navigateur (icône cadenas dans la barre d'adresse).")
      else if (e.error === 'no-speech') setVoiceError("Aucun son détecté. Parlez plus près du micro.")
      else setVoiceError("Erreur microphone : " + e.error)
    }
    rec.onend = () => { setListening(false) }
    recognitionRef.current = rec
    try {
      rec.start()
      setListening(true)
      setVoiceError('')
    } catch {
      setVoiceError("Impossible de démarrer l'enregistrement. Vérifiez les autorisations du microphone.")
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const applyVoice = async () => {
    if (!transcript.trim()) return
    setParsing(true)
    setVoiceError('')
    try {
      const res = await apiFetch('/prospects/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })
      const data = await res.json()
      if (data.detail) { setVoiceError(data.detail); setParsing(false); return }
      setFormData(prev => ({
        ...prev,
        ...(data.nom        && { nom: data.nom }),
        ...(data.prenom     && { prenom: data.prenom }),
        ...(data.telephone  && { telephone: data.telephone }),
        ...(data.mail       && { mail: data.mail }),
        ...(data.domicile   && { domicile: data.domicile }),
        ...(data.bien?.length       && { bien: data.bien }),
        ...(data.villes?.length     && { villes: data.villes }),
        ...(data.quartiers?.length  && { quartiers: data.quartiers }),
        ...(data.quartiersExclus    && { quartiersExclus: data.quartiersExclus }),
        ...(data.budget_max         && { budget_max: String(data.budget_max) }),
        ...(data.surface_min        && { surface_min: data.surface_min }),
        ...(data.pieces_min         && { pieces_min: data.pieces_min }),
        ...(data.etat?.length       && { etat: data.etat }),
        ...(data.expo?.length       && { expo: data.expo }),
        ...(data.stationnement      && { stationnement: Array.isArray(data.stationnement) ? data.stationnement : data.stationnement.split(',').map(s => s.trim()).filter(Boolean) }),
        ...(data.exterieur?.length  && { exterieur: Array.isArray(data.exterieur) ? data.exterieur.join(',') : data.exterieur }),
        ...(data.etage?.length      && { etage: data.etage }),
        ...(data.copro              && { copro: data.copro }),
        ...(data.destination        && { destination: data.destination }),
        ...(data.observation        && { observation: data.observation }),
      }))
      setVoiceOpen(false)
      setTranscript('')
    } catch {
      setVoiceError("Erreur lors de l'analyse vocale.")
    }
    setParsing(false)
  }
  
  // États pour les modales
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showCancel: false })
  const [showAnalyzePrompt, setShowAnalyzePrompt] = useState(false)
  const [newProspectId, setNewProspectId] = useState(null)
  const [newProspectName, setNewProspectName] = useState('')
  
  // États pour l'overlay d'analyse
  const [showOverlay, setShowOverlay] = useState(false)
  
  const defaultFormData = {
    titre: '', nom: '', prenom: '', mail: '', email2: '', telephone: '', telephone2: '', nom2: '', prenom2: '', domicile: '', showContact2: false,
    bien: [], villes: [], quartiers: [], quartiersExclus: '',
    budget_max: '', surface_min: '', pieces_min: '',
    etat: [], expo: [], stationnement: [], exterieur: '',
    etage: [], copro: '', destination: '', observation: '',
    chambre_plain_pied: false, plain_pied_total: false, sdb_min: '', wc_min: ''
  }

  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('immoflash_new_prospect_draft')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Migrer exterieur si c'est un tableau (ancienne version)
        if (Array.isArray(parsed.exterieur)) parsed.exterieur = parsed.exterieur.join(',')
        return { ...defaultFormData, ...parsed }
      }
    } catch {}
    return defaultFormData
  })

  useEffect(() => {
    sessionStorage.setItem('immoflash_new_prospect_draft', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    apiFetch('/biens/search-config')
      .then(r => r.json())
      .then(data => setSearchConfig(data))
      .catch(() => {})
  }, [])

  const villesSuggestions = searchConfig.villes

  const typeBienOptions = [
    { value: 'Maison', label: 'Maison' },
    { value: 'Appartement', label: 'Appartement' },
    { value: 'T1', label: 'T1 / Studio' },
    { value: 'T2', label: 'T2' },
    { value: 'T3', label: 'T3' },
    { value: 'T4', label: 'T4' },
    { value: 'T5+', label: 'T5 et +' },
    { value: 'Local commercial', label: 'Local commercial' },
    { value: 'Immeuble', label: 'Immeuble' },
    { value: 'Immeuble de rapport', label: 'Immeuble de rapport' },
    { value: 'Maison divisée', label: 'Maison divisée en appts' },
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

  const exterieurGroups = [
    {
      label: 'Extérieur',
      options: [
        { value: 'Balcon', label: 'Balcon' },
        { value: 'Terrasse', label: 'Terrasse' },
        { value: 'Rez-de-jardin', label: 'Rez-de-jardin' },
        { value: 'Pas obligatoire', label: 'Pas obligatoire' },
      ]
    },
    {
      label: 'Environnement',
      options: [
        { value: 'Au calme', label: 'Au calme' },
        { value: 'Vue mer souhaitée', label: 'Vue mer souhaitée' },
        { value: 'Vue mer indispensable', label: 'Vue mer indispensable' },
        { value: 'Plages à pieds', label: 'Plages à pieds' },
        { value: 'Commerces à pieds', label: 'Commerces à pieds' },
        { value: 'Piscine', label: 'Piscine' },
      ]
    },
    {
      label: 'Prestations',
      options: [
        { value: 'Plain-pied', label: 'Plain-pied' },
        { value: 'Accès PMR', label: 'Accès PMR' },
        { value: 'Cuisine fermée', label: 'Cuisine fermée' },
        { value: 'Grande pièce à vivre', label: 'Grande pièce à vivre' },
        { value: 'Contemporain', label: 'Contemporain' },
        { value: 'Atypique', label: 'Atypique' },
        { value: 'Ancien', label: 'Ancien' },
      ]
    },
  ]
  // Toutes les options à plat pour la compatibilité avec handleCSVToggle
  const exterieurOptions = exterieurGroups.flatMap(g => g.options)

  const quartiersOptions = searchConfig.quartiers.map(q => ({ value: q, label: q }))

  const etageOptions = [
    { value: 'RDC', label: 'RDC' },
    { value: 'Étage bas', label: 'Étage bas (1-2)' },
    { value: 'Étage élevé', label: 'Étage élevé (3+)' },
    { value: 'Dernier étage', label: 'Dernier étage' },
    { value: 'Avec ascenseur', label: 'Avec ascenseur' }
  ]

  const stationnementOptions = [
    { value: 'Parking', label: 'Parking' },
    { value: 'Box', label: 'Box fermé' },
    { value: 'Garage', label: 'Garage' },
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

  const handleCSVToggle = (field, value) => {
    setFormData(prev => {
      const current = prev[field] ? prev[field].split(',').map(v => v.trim()).filter(Boolean) : []
      const idx = current.indexOf(value)
      if (idx >= 0) current.splice(idx, 1)
      else current.push(value)
      return { ...prev, [field]: current.join(',') }
    })
  }
  const isCSVSelected = (field, value) => (formData[field] || '').split(',').map(v => v.trim()).includes(value)

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
    if (!villeClean) return
    if (!formData.villes.includes(villeClean))
      setFormData(prev => ({ ...prev, villes: [...prev.villes, villeClean] }))
    // Nouveau : mémoriser si pas dans les suggestions existantes
    if (!searchConfig.villes.includes(villeClean)) {
      setSearchConfig(prev => ({ ...prev, villes: [...prev.villes, villeClean].sort() }))
      apiFetch('/biens/search-config/custom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ villes: [villeClean] }) }).catch(() => {})
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

  const addQuartier = (q) => {
    const qClean = q.trim()
    if (!qClean) return
    if (!formData.quartiers.includes(qClean))
      setFormData(prev => ({ ...prev, quartiers: [...prev.quartiers, qClean] }))
    // Nouveau : mémoriser si pas dans les suggestions existantes
    if (!searchConfig.quartiers.includes(qClean)) {
      setSearchConfig(prev => ({ ...prev, quartiers: [...prev.quartiers, qClean].sort() }))
      apiFetch('/biens/search-config/custom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quartiers: [qClean] }) }).catch(() => {})
    }
    setQuartierInput('')
  }

  const removeQuartier = (q) => {
    setFormData(prev => ({ ...prev, quartiers: prev.quartiers.filter(v => v !== q) }))
  }

  const handleQuartierKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addQuartier(quartierInput)
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

    const joinField = (v) => Array.isArray(v) ? v.join(', ') : (v || '')

    try {
      const dataToSend = {
        ...formData,
        bien: joinField(formData.bien),
        villes: joinField(formData.villes),
        quartiers: joinField(formData.quartiers),
        etat: joinField(formData.etat),
        expo: joinField(formData.expo),
        stationnement: joinField(formData.stationnement),
        exterieur: formData.exterieur,
        etage: joinField(formData.etage),
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        criteres: [
          formData.quartiersExclus ? `Éviter: ${formData.quartiersExclus}` : '',
          formData.surface_min ? `Surface min: ${formData.surface_min}m²` : '',
          formData.pieces_min ? `Pièces min: ${formData.pieces_min}` : ''
        ].filter(Boolean).join(' | '),
        sdb_min: formData.sdb_min ? parseInt(formData.sdb_min) : 0,
        wc_min: formData.wc_min ? parseInt(formData.wc_min) : 0,
        chambre_plain_pied: formData.chambre_plain_pied ? 1 : 0,
        plain_pied_total: formData.plain_pied_total ? 1 : 0
      }

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
        sessionStorage.removeItem('immoflash_new_prospect_draft')
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
        <div className="fixed inset-0 lg:left-64 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full overflow-hidden" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
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
                  className="px-6 py-2.5 text-white font-semibold rounded-xl transition-colors flex items-center gap-2" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
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
        onCancel={() => setShowOverlay(false)}
      />

      {/* Modal vocale */}
      {voiceOpen && (
        <div className="fixed inset-0 lg:left-64 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 pt-12 sm:items-center sm:pt-4">
          <div className="w-full max-w-lg overflow-hidden flex flex-col" style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.18)', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1E3A5F]">Remplir par la voix</h3>
                <p className="text-sm text-gray-400 mt-0.5">Décrivez le prospect à voix haute</p>
              </div>
              <button onClick={() => { stopListening(); setVoiceOpen(false); setTranscript('') }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Exemple */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                <span className="font-semibold">Exemple :</span> "Monsieur Dupont, il cherche un appartement à Fréjus, budget 250 000 euros, 3 pièces minimum, avec parking, pour une résidence principale"
              </div>

              {/* Bouton micro */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 animate-pulse'
                      : 'bg-[#1E3A5F] hover:bg-[#2D5A8A] shadow-lg shadow-blue-200'
                  }`}
                >
                  {listening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                </button>
                <p className="text-sm font-medium text-gray-500">
                  {listening ? 'En écoute… cliquez pour arrêter' : 'Cliquez pour parler'}
                </p>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-16 text-sm text-gray-700 leading-relaxed">
                  {transcript}
                </div>
              )}

              {voiceError && <p className="text-sm text-red-500 text-center">{voiceError}</p>}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { stopListening(); setVoiceOpen(false); setTranscript('') }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">
                Annuler
              </button>
              <button
                onClick={applyVoice}
                disabled={!transcript.trim() || parsing}
                className="px-5 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all"
                style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
              >
                {parsing ? <><Loader2 size={15} className="animate-spin" />Analyse…</> : <><Sparkles size={15} />Remplir le formulaire</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => { sessionStorage.removeItem('immoflash_new_prospect_draft'); navigate('/clients') }}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Nouveau prospect</h1>
          <p className="text-sm text-gray-400">Remplissez les informations du client</p>
        </div>
        <button
          type="button"
          onClick={() => { setVoiceOpen(true); setTranscript(''); setVoiceError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E3A5F]/20 bg-white hover:bg-[#1E3A5F]/10 hover:border-[#1E3A5F]/40 hover:shadow-sm text-[#1E3A5F] font-medium text-sm transition-all"
        >
          <Mic size={16} />
          Remplir par la voix
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section: Informations de base */}
        <div className="rounded-xl p-6 section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Informations de contact</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Titre + Nom + Prénom */}
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <select
                  value={formData.titre}
                  onChange={(e) => handleChange('titre', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white text-sm"
                >
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="M. et Mme">M. et Mme</option>
                  <option value="Mme et Mme">Mme et Mme</option>
                  <option value="M. et M.">M. et M.</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  placeholder="DUPONT"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  placeholder="Jean"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
            </div>
            {/* Contact principal */}
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
            {/* 2ème contact optionnel */}
            {!formData.showContact2 ? (
              <div className="col-span-2">
                <button type="button" onClick={() => handleChange('showContact2', true)}
                  className="text-sm text-[#1E3A5F] hover:underline flex items-center gap-1">
                  <span className="text-lg leading-none">+</span> Ajouter un 2ème contact (conjoint·e)
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom conjoint·e</label>
                  <input type="text" value={formData.prenom2} onChange={(e) => handleChange('prenom2', e.target.value)}
                    placeholder="Prénom"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom conjoint·e</label>
                  <input type="text" value={formData.nom2} onChange={(e) => handleChange('nom2', e.target.value)}
                    placeholder="Nom de famille"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 2</label>
                  <input type="tel" value={formData.telephone2} onChange={(e) => handleChange('telephone2', e.target.value)}
                    placeholder="06 98 76 54 32"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email 2</label>
                  <input type="email" value={formData.email2} onChange={(e) => handleChange('email2', e.target.value)}
                    placeholder="conjoint@exemple.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
              </>
            )}
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
        <div className="rounded-xl p-6 section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
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
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={formData.bien.includes(option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded-lg" style={{ background: 'var(--gradient-primary)' }}
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
                  className="px-4 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {!formData.villes.includes('Tout secteur') && (
                  <button
                    type="button"
                    onClick={() => addVille('Tout secteur')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartiers souhaités
                  <span className="text-gray-400 font-normal ml-2">(tapez ou cliquez)</span>
                </label>

                {formData.quartiers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.quartiers.map(q => (
                      <span
                        key={q}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                        style={{ background: 'var(--gradient-primary)' }}
                      >
                        {q}
                        <button
                          type="button"
                          onClick={() => removeQuartier(q)}
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
                    value={quartierInput}
                    onChange={(e) => setQuartierInput(e.target.value)}
                    onKeyDown={handleQuartierKeyDown}
                    placeholder="Tapez un quartier et appuyez sur Entrée..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  />
                  <button
                    type="button"
                    onClick={() => addQuartier(quartierInput)}
                    disabled={!quartierInput.trim()}
                    className="px-4 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {quartiersOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {quartiersOptions.filter(o => !formData.quartiers.includes(o.value)).map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => addQuartier(option.value)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        + {option.label}
                      </button>
                    ))}
                  </div>
                )}
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
        <div className="rounded-xl p-6 section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
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
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={formData.etat.includes(option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
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
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={formData.expo.includes(option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
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
                    onClick={() => handleChange('stationnement', formData.stationnement.includes(option.value) ? formData.stationnement.filter(v => v !== option.value) : [...formData.stationnement, option.value])}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.stationnement.includes(option.value)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={formData.stationnement.includes(option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {exterieurGroups.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleCSVToggle('exterieur', option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isCSVSelected('exterieur', option.value)
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={isCSVSelected('exterieur', option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={formData.etage.includes(option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copropriété <span className="text-xs text-gray-400 font-normal">— sélection multiple possible</span></label>
              <div className="flex flex-wrap gap-2">
                {coproOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCSVToggle('copro', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isCSVSelected('copro', option.value)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isCSVSelected('copro', option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Chambre plain-pied + SDB min + WC min */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Accessibilité</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('chambre_plain_pied', !formData.chambre_plain_pied)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.chambre_plain_pied ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    style={formData.chambre_plain_pied ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    Chambre de plain-pied
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('plain_pied_total', !formData.plain_pied_total)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.plain_pied_total ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    style={formData.plain_pied_total ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    Plain-pied / PMR
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salles de bain min</label>
                <select value={formData.sdb_min} onChange={(e) => handleChange('sdb_min', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white text-sm">
                  <option value="">Indifférent</option>
                  <option value="1">1 minimum</option>
                  <option value="2">2 minimum</option>
                  <option value="3">3 minimum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WC séparés min</label>
                <select value={formData.wc_min} onChange={(e) => handleChange('wc_min', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white text-sm">
                  <option value="">Indifférent</option>
                  <option value="1">1 minimum</option>
                  <option value="2">2 minimum</option>
                  <option value="3">3 minimum</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Projet */}
        <div className="rounded-xl p-6 section-card" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Projet</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination du bien <span className="text-xs text-gray-400 font-normal">— sélection multiple possible</span></label>
              <div className="flex flex-wrap gap-2">
                {destinationOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCSVToggle('destination', option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isCSVSelected('destination', option.value)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isCSVSelected('destination', option.value) ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ══ OBSERVATIONS — champ le plus impactant ══ */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #38bdf8', boxShadow: '0 4px 24px rgba(56,189,248,0.15)' }}>
              {/* Header accrocheur */}
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: 'var(--gradient-primary)' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-bold text-base">Notes &amp; Observations</h3>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      Champ le plus important
                    </span>
                  </div>
                  <p className="text-white/75 text-xs mt-0.5 leading-relaxed">
                    C'est ici que l'IA fait la différence — chaque détail compte pour trouver le bon bien.
                  </p>
                </div>
              </div>

{/* Textarea */}
              <div className="p-4" style={{ background: 'white' }}>
                <textarea
                  value={formData.observation}
                  onChange={(e) => handleChange('observation', e.target.value)}
                  placeholder="Ex : budget réel plus élevé (ne veut pas le montrer), a un chien, travaille depuis chez lui, divorce en cours, veut investir pour sa fille, aime le calme absolu..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2"
                  style={{ border: '1.5px solid #bae6fd', fontSize: 14, lineHeight: 1.6 }}
                />
                {formData.observation.trim().length > 0 && (
                  <p className="mt-2 text-xs font-medium" style={{ color: '#1E6B3F' }}>
                    {formData.observation.trim().split(/\s+/).length} mots — l'IA va exploiter chaque information
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between pb-8">
          <p className="text-sm text-gray-400">* Champs obligatoires</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { sessionStorage.removeItem('immoflash_new_prospect_draft'); navigate('/clients') }}
              className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !formData.nom || formData.bien.length === 0 || formData.villes.length === 0 || !formData.budget_max}
              className="px-6 py-3 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
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