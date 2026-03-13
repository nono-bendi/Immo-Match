import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, Cpu, Building2, Sliders, User, Database, AlertTriangle, Download, Trash2, Check, RefreshCw, Server, Loader2, Mail, Lock, KeyRound, BookOpen, Lightbulb, HelpCircle, Phone, ChevronDown, Sparkles, Users, Send, Zap, Target, Clock, TrendingUp, Heart, Crown, Home, FileText, CheckCircle, ArrowRight, Star, BarChart3, UserPlus, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

import { API_URL } from '../config'

// Composant Accordéon réutilisable
function Accordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-[#1E3A5F]" />
          <span className="font-medium text-[#1E3A5F]">{title}</span>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function SettingsPage() {
  const { user, token } = useAuth()
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showFtpPass, setShowFtpPass] = useState(false)
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [nextSync, setNextSync] = useState(null)
  
  // États pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  
  const [settings, setSettings] = useState({
    // Configuration IA
    api_key: '',
    model: 'claude-sonnet-4-20250514',
    score_minimum: 0,
    
    // Informations agence
    agence_nom: 'Saint François Immo',
    agence_adresse: '',
    agence_telephone: '',
    agence_email: '',
    
    // Préférences d'analyse
    max_biens_par_prospect: 5,
    budget_tolerance_min: 70,
    budget_tolerance_max: 120,
    
    // FTP Hektor
    ftp_host: '',
    ftp_user: '',
    ftp_pass: '',
    ftp_port: '21',
    ftp_path: '',
    sync_interval_hours: '12',
    
    // SMTP Email
    smtp_server: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_name: 'Saint François Immobilier',
    smtp_reply_to: ''
  })

  const models = [
    { 
      id: 'claude-3-5-haiku-20241022', 
      name: 'Haiku 3.5', 
      description: 'Rapide & économique',
      price: '~0.001€/analyse',
      icon: Zap
    },
    { 
      id: 'claude-sonnet-4-20250514', 
      name: 'Sonnet 4', 
      description: 'Équilibré (recommandé)',
      price: '~0.015€/analyse',
      icon: Star
    },
    { 
      id: 'claude-opus-4-5-20251101', 
      name: 'Opus 4.5', 
      description: 'Plus précis mais coûteux',
      price: '~0.15€/analyse',
      icon: TrendingUp
    }
  ]

  // Guide rapide - étapes
  const guideSteps = [
    {
      step: 1,
      title: 'Ajouter vos prospects',
      description: 'Utilisez le bouton "Nouveau prospect" dans le menu pour créer une fiche client avec ses critères de recherche.',
      icon: UserPlus,
      color: 'bg-blue-500'
    },
    {
      step: 2,
      title: 'Les biens se synchronisent tout seuls',
      description: 'Hektor envoie automatiquement les biens. Vous pouvez aussi lancer une sync manuelle ici dans les paramètres.',
      icon: Home,
      color: 'bg-emerald-500'
    },
    {
      step: 3,
      title: 'Lancer l\'analyse IA',
      description: 'Sur la page Matchings, cliquez sur "Lancer l\'analyse". L\'IA trouve les meilleurs biens pour chaque client.',
      icon: Sparkles,
      color: 'bg-violet-500'
    },
    {
      step: 4,
      title: 'Envoyer les propositions',
      description: 'Un clic sur "Proposer" et un email personnalisé part directement chez votre client.',
      icon: Send,
      color: 'bg-amber-500'
    }
  ]

  // Astuces vraiment utiles
  const tips = [
    {
      icon: Target,
      title: 'Score ≥ 75 = Prioritaire',
      description: 'Concentrez-vous sur les matchings verts, ce sont vos meilleures chances de vente.',
      color: 'bg-emerald-50 border-emerald-200'
    },
    {
      icon: FileText,
      title: 'Plus de détails = Meilleurs résultats',
      description: 'Un prospect bien renseigné (budget, surface, ville, type) donne des matchings plus précis.',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      icon: Eye,
      title: 'Prévisualisez avant d\'envoyer',
      description: 'L\'aperçu email vous montre exactement ce que le client va recevoir.',
      color: 'bg-violet-50 border-violet-200'
    },
    {
      icon: RefreshCw,
      title: 'Nouveaux biens ? Relancez l\'analyse',
      description: 'Après une synchronisation Hektor, relancez l\'analyse pour découvrir de nouveaux matchings.',
      color: 'bg-amber-50 border-amber-200'
    }
  ]

  useEffect(() => {
    // Charger les paramètres au démarrage
    fetch(`${API_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(prev => ({ ...prev, ...data }))
        }
      })
      .catch(err => console.error('Erreur chargement paramètres:', err))
    
    // Charger le statut de sync
    fetch(`${API_URL}/sync-status`)
      .then(res => res.json())
      .then(data => {
        if (data.last_sync) {
          setLastSync(new Date(data.last_sync))
        }
        if (data.next_sync) {
          setNextSync(new Date(data.next_sync))
        }
      })
      .catch(err => console.error('Erreur chargement statut sync:', err))
  }, [])

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const data = await response.json()
      if (data.error) {
        alert('Erreur: ' + data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      alert('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch(`${API_URL}/sync-hektor`, {
        method: 'POST'
      })
      const data = await response.json()
      setSyncResult(data)
      if (data.success) {
        setLastSync(new Date())
      }
    } catch {
      setSyncResult({ error: 'Erreur de connexion' })
    }
    setSyncing(false)
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/export-all`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `immomatch_export_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de l\'export')
    }
  }

  const handleReset = async () => {
    try {
      const response = await fetch(`${API_URL}/reset-database`, { method: 'POST' })
      const data = await response.json()
      if (data.error) {
        alert('Erreur: ' + data.error)
      } else {
        alert('Base de données réinitialisée')
        setShowResetConfirm(false)
      }
    } catch {
      alert('Erreur lors de la réinitialisation')
    }
  }

  // Changement de mot de passe
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    
    setPasswordChanging(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' })
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordMessage({ type: 'error', text: data.detail || 'Erreur lors du changement' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Erreur de connexion au serveur' })
    }
    
    setPasswordChanging(false)
  }

  const maskApiKey = (key) => {
    if (!key) return ''
    if (key.length < 20) return key
    return key.substring(0, 10) + '••••••••••••••••' + key.substring(key.length - 5)
  }

  const formatLastSync = (date) => {
    if (!date) return 'Jamais'
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatNextSync = (date) => {
    if (!date) return null
    const now = new Date()
    const diff = date - now
    if (diff <= 0) return 'Imminent'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
    return `dans ${minutes} min`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Paramètres</h1>
          <p className="text-sm text-gray-400">Personnalisez votre ImmoMatch</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 ${
            saved 
              ? 'bg-emerald-500 text-white' 
              : 'bg-[#1E3A5F] text-white hover:bg-[#2D5A8A]'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <Check size={20} />
              Sauvegardé !
            </>
          ) : (
            <>
              <Save size={20} />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 1. COMPTE UTILISATEUR */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <User size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Mon compte</h2>
          </div>

          {/* Infos utilisateur connecté */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-xl mb-6">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-[#1E3A5F] font-bold text-xl shadow-lg">
              {user?.nom ? user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-lg">{user?.nom || 'Utilisateur'}</p>
              <p className="text-sm text-white/70">{user?.email}</p>
            </div>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5 ${
              user?.role === 'admin' 
                ? 'bg-amber-400 text-amber-900' 
                : 'bg-white/20 text-white'
            }`}>
              {user?.role === 'admin' ? <Crown size={14} /> : <Home size={14} />}
              {user?.role === 'admin' ? 'Admin' : 'Agent'}
            </span>
          </div>

          {/* Formulaire changement de mot de passe */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-gray-400" />
              <h3 className="font-medium text-gray-700">Changer le mot de passe</h3>
            </div>
            
            {passwordMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                passwordMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {passwordMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    required
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={passwordChanging}
                className="px-5 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#2D5A8A] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {passwordChanging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Modifier le mot de passe
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 2. INFORMATIONS AGENCE */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Mon agence</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agence</label>
              <input
                type="text"
                value={settings.agence_nom}
                onChange={(e) => handleChange('agence_nom', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={settings.agence_telephone}
                onChange={(e) => handleChange('agence_telephone', e.target.value)}
                placeholder="04 94 XX XX XX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={settings.agence_adresse}
                onChange={(e) => handleChange('agence_adresse', e.target.value)}
                placeholder="123 rue de l'Immobilier, 83000 Ville"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input
                type="email"
                value={settings.agence_email}
                onChange={(e) => handleChange('agence_email', e.target.value)}
                placeholder="contact@monagence.fr"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
          </div>
        </div>

        {/* 3. CONFIGURATION IA */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Cpu size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Intelligence Artificielle</h2>
          </div>

          {/* Clé API */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Clé API Anthropic</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={showApiKey ? settings.api_key : maskApiKey(settings.api_key)}
                onChange={(e) => handleChange('api_key', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser la variable d'environnement</p>
          </div>

          {/* Modèle IA */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choisissez votre modèle IA</label>
            <div className="grid grid-cols-3 gap-4">
              {models.map((model) => {
                const ModelIcon = model.icon
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleChange('model', model.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                      settings.model === model.id
                        ? 'border-[#1E3A5F] bg-gradient-to-br from-[#DCE7F3] to-[#c5d9ed]'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        settings.model === model.id ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <ModelIcon size={20} />
                      </div>
                      {settings.model === model.id && (
                        <div className="w-6 h-6 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-[#1E3A5F]">{model.name}</p>
                    <p className="text-sm text-gray-600 mb-1">{model.description}</p>
                    <p className="text-xs text-gray-400">{model.price}</p>
                  </button>
                )
              })}
            </div>
          </div>


        </div>

        {/* 4. PRÉFÉRENCES D'ANALYSE */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sliders size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Préférences d'analyse</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biens analysés par prospect : <span className="font-bold text-[#1E3A5F] text-lg">{settings.max_biens_par_prospect}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.max_biens_par_prospect}
                onChange={(e) => handleChange('max_biens_par_prospect', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A5F]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 (économique)</span>
                <span>10 (complet)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tolérance budget</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <label className="block text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                    <TrendingUp size={14} className="rotate-180" />
                    Minimum : {settings.budget_tolerance_min}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={settings.budget_tolerance_min}
                    onChange={(e) => handleChange('budget_tolerance_min', parseInt(e.target.value))}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <label className="block text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                    <TrendingUp size={14} />
                    Maximum : {settings.budget_tolerance_max}%
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="150"
                    step="5"
                    value={settings.budget_tolerance_max}
                    onChange={(e) => handleChange('budget_tolerance_max', parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500 shrink-0" />
                Un client avec un budget de <strong className="mx-1">200 000€</strong> verra des biens entre{' '}
                <strong className="mx-1">{(200000 * settings.budget_tolerance_min / 100).toLocaleString()}€</strong> et{' '}
                <strong className="mx-1">{(200000 * settings.budget_tolerance_max / 100).toLocaleString()}€</strong>
              </p>
            </div>
          </div>

            {/* Score minimum */}
            <div className="score-min-block p-4 rounded-xl border" style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#7c3aed' }}>Score minimum à afficher</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(124,58,237,0.6)' }}>Les matchings en dessous de ce seuil ne sont pas sauvegardés lors de l'analyse</p>
                </div>
                <div style={{
                  minWidth: 52, height: 36, borderRadius: 10,
                  background: 'rgba(124,58,237,0.15)',
                  border: '1.5px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
                    {settings.score_minimum === 0 ? 'Tous' : settings.score_minimum + '+'}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={settings.score_minimum}
                onChange={(e) => handleChange('score_minimum', parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#7c3aed', background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="flex justify-between text-xs mt-2" style={{ color: 'rgba(124,58,237,0.5)' }}>
                <span>Tout afficher</span>
                <span>Score 40</span>
                <span>Score 60</span>
                <span>Score 80</span>
              </div>
            </div>
        </div>

        {/* 5. CONFIGURATION EMAIL */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Envoi d'emails</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
            <Lightbulb size={16} className="text-blue-500 shrink-0" />
            Ces paramètres permettent d'envoyer les propositions directement aux clients depuis l'app.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serveur SMTP</label>
              <input
                type="text"
                value={settings.smtp_server}
                onChange={(e) => handleChange('smtp_server', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="text"
                value={settings.smtp_port}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="587"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email d'envoi</label>
              <input
                type="email"
                value={settings.smtp_user}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                placeholder="contact@agence.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe d'application</label>
              <div className="relative">
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  value={settings.smtp_pass}
                  onChange={(e) => handleChange('smtp_pass', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSmtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'expéditeur</label>
              <input
                type="text"
                value={settings.smtp_from_name}
                onChange={(e) => handleChange('smtp_from_name', e.target.value)}
                placeholder="Saint François Immobilier"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de réponse</label>
              <input
                type="email"
                value={settings.smtp_reply_to}
                onChange={(e) => handleChange('smtp_reply_to', e.target.value)}
                placeholder="contact@saintfrancoisimmobilier.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
          </div>
        </div>

        {/* 6. SYNCHRONISATION HEKTOR */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Server size={20} className="text-[#1E3A5F]" />
              <h2 className="text-lg font-semibold text-[#1E3A5F]">Synchronisation Hektor</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Clock size={14} />
                  {formatLastSync(lastSync)}
                </span>
                {formatNextSync(nextSync) && (
                  <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <RefreshCw size={12} />
                    Prochaine sync {formatNextSync(nextSync)}
                  </span>
                )}
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sync...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Synchroniser
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Résultat sync */}
          {syncResult && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${syncResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              {syncResult.success ? (
                <>
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Synchronisation réussie : {syncResult.imported} nouveaux, {syncResult.updated} mis à jour, {syncResult.skipped} ignorés
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">Erreur : {syncResult.error}</p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hôte FTP</label>
              <input
                type="text"
                value={settings.ftp_host}
                onChange={(e) => handleChange('ftp_host', e.target.value)}
                placeholder="72.60.93.6"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="text"
                value={settings.ftp_port}
                onChange={(e) => handleChange('ftp_port', e.target.value)}
                placeholder="21"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur FTP</label>
              <input
                type="text"
                value={settings.ftp_user}
                onChange={(e) => handleChange('ftp_user', e.target.value)}
                placeholder="u816945787"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe FTP</label>
              <div className="relative">
                <input
                  type={showFtpPass ? 'text' : 'password'}
                  value={settings.ftp_pass}
                  onChange={(e) => handleChange('ftp_pass', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
                <button
                  type="button"
                  onClick={() => setShowFtpPass(!showFtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showFtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chemin du fichier ZIP</label>
              <input
                type="text"
                value={settings.ftp_path}
                onChange={(e) => handleChange('ftp_path', e.target.value)}
                placeholder="/domains/.../public_html/hektor/hektor_1_groupementprimmo.zip"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] font-mono text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync automatique toutes les : <span className="font-bold text-[#1E3A5F]">{settings.sync_interval_hours}h</span>
              </label>
              <input
                type="range"
                min="1"
                max="24"
                value={settings.sync_interval_hours}
                onChange={(e) => handleChange('sync_interval_hours', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A5F]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1h (temps réel)</span>
                <span>24h (1x/jour)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. DONNÉES */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Mes données</h2>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 bg-[#DCE7F3] text-[#1E3A5F] font-medium rounded-xl hover:bg-[#c5d9ed] transition-colors"
            >
              <Download size={18} />
              Exporter en Excel
            </button>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                Tout effacer
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={18} className="text-red-500" />
                <span className="text-sm text-red-600 font-medium">Vraiment tout supprimer ?</span>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600"
                >
                  Oui
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-300"
                >
                  Non
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 8. GUIDE & AIDE */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen size={20} className="text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Guide & Aide</h2>
          </div>

          <div className="space-y-4">
            {/* Guide rapide */}
            <Accordion title="Comment ça marche ? (4 étapes)" icon={BookOpen} defaultOpen={false}>
              <div className="space-y-4">
                {guideSteps.map((step) => {
                  const StepIcon = step.icon
                  return (
                    <div key={step.step} className="flex gap-4 items-start">
                      <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                        <StepIcon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white bg-gray-400 px-2 py-0.5 rounded-full">
                            {step.step}
                          </span>
                          <h4 className="font-semibold text-[#1E3A5F]">{step.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Accordion>

            {/* Astuces */}
            <Accordion title="Astuces" icon={Lightbulb}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tips.map((tip, index) => {
                  const TipIcon = tip.icon
                  return (
                    <div key={index} className={`p-4 rounded-xl border ${tip.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TipIcon size={18} className="text-[#1E3A5F]" />
                        <h4 className="font-semibold text-gray-800">{tip.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{tip.description}</p>
                    </div>
                  )
                })}
              </div>
            </Accordion>

            {/* Support */}
            <Accordion title="Besoin d'aide ?" icon={HelpCircle}>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Un souci ? Une question ? L'équipe NOWA est là pour vous aider.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="tel:+33783441531"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Phone size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Appelez-nous</p>
                      <p className="font-bold text-white text-lg">06 98 64 48 72</p>
                    </div>
                  </a>
                  
                  <a 
                    href="mailto:contact@nowa.dev"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-xl hover:from-[#2D5A8A] hover:to-[#1E3A5F] transition-all shadow-lg"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Mail size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Écrivez-nous</p>
                      <p className="font-bold text-white">contact@nowa.dev</p>
                    </div>
                  </a>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-gray-400" />
                    <h4 className="font-medium text-gray-700">Horaires de disponibilité</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Du lundi au vendredi, 9h - 18h. En dehors de ces horaires, envoyez un email et nous vous répondons dès que possible.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-400">
                    ImmoMatch v1.0 • Développé par <span className="font-semibold text-[#1E3A5F]">NOWA</span> • © 2026
                  </p>
                </div>
              </div>
            </Accordion>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SettingsPage