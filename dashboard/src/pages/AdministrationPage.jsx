import { useState, useEffect, useRef } from 'react'
import {
  Save, Eye, EyeOff, Cpu, Building2, Sliders, User, Database,
  AlertTriangle, Download, Trash2, Check, RefreshCw, Loader2,
  Mail, Lock, KeyRound, Lightbulb, ChevronDown, Sparkles,
  Users, Send, Zap, Target, Clock, TrendingUp, Crown, Home,
  FileText, CheckCircle, Star, BarChart3, UserPlus, Palette,
  Image, Shield, Pencil, X, Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAgency } from '../contexts/AgencyContext'
import { API_URL } from '../config'
import { apiFetch } from '../api'

// ─── Accordion ──────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-[#1E3A5F] shrink-0" />}
          <span className="font-semibold text-[#1E3A5F]">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Crown size={11} />{badge}
            </span>
          )}
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 pt-5">{children}</div>}
    </div>
  )
}

// ─── Input helper ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] ${className}`}
    />
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, ok }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
      ${ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function AdministrationPage() {
  const { user, token } = useAuth()
  const { agency, loadAgency } = useAgency()
  const isAdmin = user?.role === 'admin'
  const isDemo = agency?.slug === 'demo'

  // ── App settings (API key, IA, FTP, préférences) ─────────────────────────
  const [settings, setSettings] = useState({
    api_key: '',
    model: 'claude-sonnet-4-20250514',
    score_minimum: 0,
    max_matchings_par_prospect: 5,
    max_biens_par_prospect: 5,
    budget_tolerance_min: 70,
    budget_tolerance_max: 120,
    ftp_host: '', ftp_user: '', ftp_pass: '', ftp_port: '21', ftp_path: '',
    sync_interval_hours: '12',
    analyse_auto_import: true,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState({ ok: false, text: '' })

  // ── Agency form (admin only) ──────────────────────────────────────────────
  const [agencyForm, setAgencyForm] = useState({
    nom: '', nom_court: '', nom_filtre: '', adresse: '', telephone: '', email: '',
    logo_url: '', couleur_primaire: '#1E3A5F', logo_fond_colore: 0,
    smtp_user: '', smtp_password: '', smtp_from_name: '', smtp_reply_to: '',
    smtp_server: 'smtp.gmail.com', smtp_port: 587
  })
  const [savingAgency, setSavingAgency] = useState(false)
  const [agencyMsg, setAgencyMsg] = useState({ ok: false, text: '' })
  const [logoUploading, setLogoUploading] = useState(false)
  const logoRef = useRef()

  // ── Agents (admin only) ──────────────────────────────────────────────────
  const [agents, setAgents] = useState([])
  const [newAgent, setNewAgent] = useState({ nom: '', email: '', password: '', role: 'agent' })
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [addingAgent, setAddingAgent] = useState(false)
  const [agentMsg, setAgentMsg] = useState({ ok: false, text: '' })
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [resetPw, setResetPw] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // ── Mot de passe ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState({ ok: false, text: '' })

  // ── Sync ─────────────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [lastSyncError, setLastSyncError] = useState(null)
  const [lastSyncErrorAt, setLastSyncErrorAt] = useState(null)

  // ── Claude usage ──────────────────────────────────────────────────────────
  const [claudeUsage, setClaudeUsage] = useState(null)
  const CLAUDE_LIMIT = 3000

  // ── Misc UI ──────────────────────────────────────────────────────────────
  const [showApiKey, setShowApiKey] = useState(false)
  const [showFtpPass, setShowFtpPass] = useState(false)
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/settings').then(r => r.json()).then(d => {
      if (d && !d.error) setSettings(p => ({ ...p, ...d }))
    }).catch(() => {})
    apiFetch('/admin/claude-usage').then(r => r.json()).then(d => {
      if (d && !d.error) setClaudeUsage(d)
    }).catch(() => {})

    apiFetch('/sync-status').then(r => r.json()).then(d => {
      if (d.last_sync) setLastSync(new Date(d.last_sync))
      if (d.last_sync_error) {
        setLastSyncError(d.last_sync_error)
        setLastSyncErrorAt(d.last_sync_error_at ? new Date(d.last_sync_error_at) : null)
      }
    }).catch(() => {})

    if (isAdmin) {
      apiFetch('/admin/agency').then(r => r.json()).then(d => {
        setAgencyForm({
          nom: d.nom || '', nom_court: d.nom_court || '', nom_filtre: d.nom_filtre || '',
          adresse: d.adresse || '', telephone: d.telephone || '', email: d.email || '',
          logo_url: d.logo_url || '', couleur_primaire: d.couleur_primaire || '#1E3A5F', logo_fond_colore: d.logo_fond_colore || 0,
          smtp_user: d.smtp_user || '', smtp_password: d.smtp_password || '',
          smtp_from_name: d.smtp_from_name || '', smtp_reply_to: d.smtp_reply_to || '',
          smtp_server: d.smtp_server || 'smtp.gmail.com', smtp_port: d.smtp_port || 587
        })
      }).catch(() => {})

      apiFetch('/admin/agents').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setAgents(d)
      }).catch(() => {})
    }
  }, [isAdmin])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const chg = (f, v) => setSettings(p => ({ ...p, [f]: v }))
  const chgA = (f, v) => setAgencyForm(p => ({ ...p, [f]: v }))

  const flash = (setter, ok, text, ms = 3500) => {
    setter({ ok, text })
    setTimeout(() => setter({ ok: false, text: '' }), ms)
  }

  const logoSrc = agencyForm.logo_url
    ? (agencyForm.logo_url.startsWith('http') ? agencyForm.logo_url : API_URL + agencyForm.logo_url)
    : null

  // ── Save settings ─────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const r = await apiFetch('/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const d = await r.json()
      flash(setSettingsMsg, !d.error, d.error || 'Paramètres sauvegardés')
    } catch { flash(setSettingsMsg, false, 'Erreur de connexion') }
    setSavingSettings(false)
  }

  // ── Save agency ───────────────────────────────────────────────────────────
  const saveAgency = async () => {
    setSavingAgency(true)
    try {
      const r = await apiFetch('/admin/agency', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agencyForm)
      })
      const d = await r.json()
      if (d.message && !d.error) {
        flash(setAgencyMsg, true, 'Agence mise à jour')
        loadAgency(token) // rafraîchit sidebar + couleur
      } else {
        flash(setAgencyMsg, false, d.error || d.detail || 'Erreur')
      }
    } catch { flash(setAgencyMsg, false, 'Erreur de connexion') }
    setSavingAgency(false)
  }

  // ── Upload logo ───────────────────────────────────────────────────────────
  const uploadLogo = async (file) => {
    setLogoUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await apiFetch('/admin/agency/logo', { method: 'POST', body: form })
      const d = await r.json()
      if (d.logo_url) {
        setAgencyForm(p => ({ ...p, logo_url: d.logo_url }))
        flash(setAgencyMsg, true, 'Logo uploadé')
        loadAgency(token)
      } else {
        flash(setAgencyMsg, false, d.detail || 'Erreur upload')
      }
    } catch { flash(setAgencyMsg, false, 'Erreur upload') }
    setLogoUploading(false)
  }

  // ── Agents ────────────────────────────────────────────────────────────────
  const addAgent = async () => {
    setAddingAgent(true)
    try {
      const r = await apiFetch('/admin/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      })
      const d = await r.json()
      if (d.message && !d.detail) {
        flash(setAgentMsg, true, d.message)
        setNewAgent({ nom: '', email: '', password: '', role: 'agent' })
        setShowAddAgent(false)
        const list = await apiFetch('/admin/agents').then(r => r.json())
        if (Array.isArray(list)) setAgents(list)
      } else {
        flash(setAgentMsg, false, d.detail || 'Erreur')
      }
    } catch { flash(setAgentMsg, false, 'Erreur de connexion') }
    setAddingAgent(false)
  }

  const saveAgent = async (id) => {
    const payload = { ...editData }
    if (resetPw[id]) payload.password = resetPw[id]
    try {
      const r = await apiFetch(`/admin/agents/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const d = await r.json()
      flash(setAgentMsg, !d.detail, d.message || d.detail || 'Erreur')
      setEditId(null)
      setResetPw({})
      const list = await apiFetch('/admin/agents').then(r => r.json())
      if (Array.isArray(list)) setAgents(list)
    } catch { flash(setAgentMsg, false, 'Erreur de connexion') }
  }

  const deleteAgent = async (id) => {
    try {
      const r = await apiFetch(`/admin/agents/${id}`, { method: 'DELETE' })
      const d = await r.json()
      flash(setAgentMsg, !d.detail, d.message || d.detail || 'Erreur')
      if (!d.detail) setAgents(prev => prev.filter(a => a.id !== id))
    } catch { flash(setAgentMsg, false, 'Erreur de connexion') }
    setConfirmDeleteId(null)
  }

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new.length < 6) return flash(setPwMsg, false, 'Minimum 6 caractères')
    if (pwForm.new !== pwForm.confirm) return flash(setPwMsg, false, 'Les mots de passe ne correspondent pas')
    setSavingPw(true)
    try {
      const r = await apiFetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: pwForm.old, new_password: pwForm.new })
      })
      const d = await r.json()
      if (r.ok) {
        flash(setPwMsg, true, 'Mot de passe modifié !')
        setPwForm({ old: '', new: '', confirm: '' })
      } else {
        flash(setPwMsg, false, d.detail || 'Erreur')
      }
    } catch { flash(setPwMsg, false, 'Erreur de connexion') }
    setSavingPw(false)
  }

  // ── Sync ──────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true); setSyncResult(null)
    try {
      const r = await apiFetch('/sync-hektor', { method: 'POST' })
      const d = await r.json()
      setSyncResult(d)
      if (d.success) { setLastSync(new Date()); setLastSyncError(null); setLastSyncErrorAt(null) }
      if (d.error) { setLastSyncError(d.error); setLastSyncErrorAt(new Date()) }
    } catch { setSyncResult({ error: 'Erreur de connexion' }) }
    setSyncing(false)
  }

  // ── Export / Reset ────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const r = await apiFetch('/export-all')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `immoflash_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click(); URL.revokeObjectURL(url)
    } catch { alert('Erreur export') }
  }

  const handleReset = async () => {
    try {
      const r = await apiFetch('/reset-database', { method: 'POST' })
      const d = await r.json()
      if (d.error) alert('Erreur: ' + d.error)
      else { alert('Base réinitialisée'); setShowResetConfirm(false) }
    } catch { alert('Erreur') }
  }

  const [resettingDemo, setResettingDemo] = useState(false)
  const handleResetDemo = async () => {
    if (!window.confirm('Réinitialiser la démo ? Toutes les modifications seront perdues.')) return
    setResettingDemo(true)
    try {
      const r = await apiFetch('/admin/reset-demo', { method: 'POST' })
      const d = await r.json()
      if (d.success) alert('Démo réinitialisée — les données fraîches sont chargées.')
      else alert('Erreur : ' + (d.detail || d.message))
    } catch { alert('Erreur lors de la réinitialisation') }
    finally { setResettingDemo(false) }
  }

  const maskKey = k => k && k.length > 20 ? k.slice(0, 10) + '••••••••••••••••' + k.slice(-5) : k

  const models = [
    { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', desc: 'Rapide & économique', price: '~0.002€/analyse', icon: Zap },
    { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', desc: 'Meilleur rapport qualité/prix', price: '~0.006€/analyse', icon: Star, best: true },
  ]

  const formatSync = d => {
    if (!d) return 'Jamais'
    const diff = Date.now() - d, m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000)
    if (m < 1) return 'À l\'instant'
    if (m < 60) return `Il y a ${m} min`
    if (h < 24) return `Il y a ${h}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const roleBadge = r => r === 'admin' ? 'Administrateur' : r === 'demo' ? 'Démo' : 'Agent'
  const roleBadgeColor = r => r === 'admin' ? 'bg-amber-100 text-amber-700' : r === 'demo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'

  const PLAN_LABELS = {
    agence:  { label: 'Plan Agence',  price: '49€/mois',  color: 'bg-sky-100 text-sky-700 border-sky-200' },
    cabinet: { label: 'Plan Cabinet', price: '89€/mois',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
    reseau:  { label: 'Plan Réseau',  price: '179€/mois', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  }
  const planInfo = PLAN_LABELS[user?.agency_plan_id] || PLAN_LABELS.agence

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Administration</h1>
          <p className="text-sm text-gray-400">Configuration de votre espace ImmoFlash</p>
        </div>
        <a
          href={`${API_URL}/guide`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#2D5A8A] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FileText size={15} />
          Guide utilisateur
        </a>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. MON COMPTE                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Mon compte" icon={User} defaultOpen>

        {/* Avatar */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-xl mb-6">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-[#1E3A5F] font-bold text-xl shadow-lg">
            {user?.nom ? user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-lg">{user?.nom || 'Utilisateur'}</p>
            <p className="text-sm text-white/70">{user?.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5 ${
              isAdmin ? 'bg-amber-400 text-amber-900' : 'bg-white/20 text-white'}`}>
              {isAdmin ? <Crown size={14} /> : <Home size={14} />}
              {isAdmin ? 'Admin' : 'Agent'}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${planInfo.color}`}>
              <Star size={11} />
              {planInfo.label} · {planInfo.price}
            </span>
          </div>
        </div>

        {/* Changement de mot de passe */}
        <h3 className="flex items-center gap-2 font-medium text-gray-700 mb-4">
          <KeyRound size={17} className="text-gray-400" /> Changer le mot de passe
        </h3>
        <Toast msg={pwMsg.text} ok={pwMsg.ok} />
        <form onSubmit={changePassword} className="space-y-4 mt-3">
          <Field label="Mot de passe actuel">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input type={showOld ? 'text' : 'password'} className="pl-9 pr-10"
                value={pwForm.old} onChange={e => setPwForm(p => ({ ...p, old: e.target.value }))} required placeholder="••••••••" />
              <button type="button" onClick={() => setShowOld(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nouveau mot de passe" hint="Minimum 6 caractères">
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} className="pr-10"
                  value={pwForm.new} onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))} required minLength={6} placeholder="••••••••" />
                <button type="button" onClick={() => setShowNew(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <Field label="Confirmer">
              <Input type={showNew ? 'text' : 'password'}
                value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required placeholder="••••••••" />
            </Field>
          </div>
          <button type="submit" disabled={savingPw}
            className="px-5 py-2.5 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#2D5A8A] transition-colors disabled:opacity-50 flex items-center gap-2">
            {savingPw ? <><Loader2 size={16} className="animate-spin" />Modification...</> : <><Check size={16} />Modifier le mot de passe</>}
          </button>
        </form>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. AGENCE (admin only)                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Identité de l'agence" icon={Building2} badge="Admin" defaultOpen={isAdmin}>
        {!isAdmin ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <Shield size={18} /> Réservé aux administrateurs
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Image size={16} /> Logo</p>
              <div className="flex items-start gap-4">
                {/* Prévisualisation */}
                <div className="w-32 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                  {logoSrc
                    ? <img src={logoSrc} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                    : <Building2 size={28} className="text-gray-300" />}
                </div>
                <div className="flex-1 space-y-2">
                  <Field label="URL du logo" hint="Lien direct vers une image en ligne (PNG, JPG, SVG)">
                    <Input type="url" value={agencyForm.logo_url}
                      onChange={e => chgA('logo_url', e.target.value)}
                      placeholder="https://monagence.fr/logo.png" />
                  </Field>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">ou</span>
                    <button type="button" onClick={() => logoRef.current?.click()}
                      disabled={logoUploading}
                      className="px-3 py-1.5 text-xs font-medium bg-[#1E3A5F] text-white rounded-lg hover:bg-[#2D5A8A] disabled:opacity-50 flex items-center gap-1.5">
                      {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      {logoUploading ? 'Upload...' : 'Uploader un fichier'}
                    </button>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-1">
                    <input type="checkbox"
                      checked={!!agencyForm.logo_fond_colore}
                      onChange={e => chgA('logo_fond_colore', e.target.checked ? 1 : 0)}
                      className="w-4 h-4 accent-[#1E3A5F]" />
                    Fond coloré derrière le logo dans les emails
                    <span className="text-xs text-gray-400">(recommandé si le logo est blanc)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Couleur */}
            <div className="mb-6">
              <Field label="Couleur principale" hint="Utilisée dans la sidebar, les en-têtes et les emails">
                <div className="flex items-center gap-3">
                  <input type="color" value={agencyForm.couleur_primaire}
                    onChange={e => chgA('couleur_primaire', e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <Input value={agencyForm.couleur_primaire}
                    onChange={e => chgA('couleur_primaire', e.target.value)}
                    placeholder="#1E3A5F" className="font-mono w-36" />
                  <div className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
                    style={{ background: agencyForm.couleur_primaire }} />
                </div>
              </Field>
            </div>

            {/* Infos */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Field label="Nom complet">
                <Input value={agencyForm.nom} onChange={e => chgA('nom', e.target.value)} placeholder="Mon Agence Immobilier" />
              </Field>
              <Field label="Nom court (sidebar)">
                <Input value={agencyForm.nom_court} onChange={e => chgA('nom_court', e.target.value)} placeholder="Mon Agence Immo" />
              </Field>
              <Field label="Téléphone">
                <Input type="tel" value={agencyForm.telephone} onChange={e => chgA('telephone', e.target.value)} placeholder="04 94 XX XX XX" />
              </Field>
              <Field label="Email de contact">
                <Input type="email" value={agencyForm.email} onChange={e => chgA('email', e.target.value)} placeholder="contact@agence.fr" />
              </Field>
              <div className="col-span-2">
                <Field label="Adresse">
                  <Input value={agencyForm.adresse} onChange={e => chgA('adresse', e.target.value)} placeholder="123 rue de l'Immobilier, 83000 Ville" />
                </Field>
              </div>
            </div>

            {/* SMTP */}
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 mt-2">
              <Mail size={16} className="text-[#1E3A5F]" /> Configuration email (SMTP)
            </h3>

            {!agencyForm.smtp_user || !agencyForm.smtp_password ? (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">Aucun SMTP configuré</span> — les emails sont envoyés depuis l'adresse ImmoFlash par défaut.
                  Renseignez vos identifiants ci-dessous pour envoyer depuis votre propre adresse.
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-800">
                  Emails envoyés depuis <span className="font-semibold">{agencyForm.smtp_user}</span>
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
              <Lightbulb size={14} className="text-blue-500 shrink-0" />
              Ces identifiants permettent d'envoyer les propositions depuis l'adresse de l'agence.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Field label="Serveur SMTP">
                <Input value={agencyForm.smtp_server} onChange={e => chgA('smtp_server', e.target.value)} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="Port">
                <Input type="number" value={agencyForm.smtp_port} onChange={e => chgA('smtp_port', parseInt(e.target.value) || 587)} placeholder="587" />
              </Field>
              <Field label="Email d'envoi">
                <Input type="email" value={agencyForm.smtp_user} onChange={e => chgA('smtp_user', e.target.value)} placeholder="contact@agence.fr" />
              </Field>
              <Field label="Mot de passe d'application">
                <div className="relative">
                  <Input type={showSmtpPass ? 'text' : 'password'} className="pr-10"
                    value={agencyForm.smtp_password} onChange={e => chgA('smtp_password', e.target.value)} placeholder="••••••••••••" />
                  <button type="button" onClick={() => setShowSmtpPass(o => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSmtpPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <Field label="Nom d'expéditeur">
                <Input value={agencyForm.smtp_from_name} onChange={e => chgA('smtp_from_name', e.target.value)} placeholder="Mon Agence Immobilier" />
              </Field>
              <Field label="Email de réponse (Reply-To)">
                <Input type="email" value={agencyForm.smtp_reply_to} onChange={e => chgA('smtp_reply_to', e.target.value)} placeholder="contact@agence.fr" />
              </Field>
            </div>

            <div className="flex justify-end items-center gap-3 mt-4">
              <Toast msg={agencyMsg.text} ok={agencyMsg.ok} />
              <button onClick={saveAgency} disabled={savingAgency}
                className={`px-6 py-2.5 font-semibold rounded-xl text-white transition-all flex items-center gap-2
                  ${savingAgency ? 'bg-gray-400' : 'bg-[#1E3A5F] hover:bg-[#2D5A8A]'}`}>
                {savingAgency ? <><Loader2 size={16} className="animate-spin" />Sauvegarde...</> : <><Save size={16} />Sauvegarder l'agence</>}
              </button>
            </div>
          </>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. ÉQUIPE (admin only)                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Équipe" icon={Users} badge="Admin">
        {!isAdmin ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <Shield size={18} /> Réservé aux administrateurs
          </div>
        ) : (
          <>
            <Toast msg={agentMsg.text} ok={agentMsg.ok} />

            {/* Liste */}
            <div className="space-y-2 mb-4">
              {agents.map(a => (
                <div key={a.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {editId === a.id ? (
                    <div className="p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Nom">
                          <Input value={editData.nom || a.nom}
                            onChange={e => setEditData(p => ({ ...p, nom: e.target.value }))} />
                        </Field>
                        <Field label="Rôle">
                          <select value={editData.role || a.role}
                            onChange={e => setEditData(p => ({ ...p, role: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                            <option value="demo">Démo</option>
                          </select>
                        </Field>
                        <div className="col-span-2">
                          <Field label="Nouveau mot de passe (laisser vide pour ne pas changer)" hint="Minimum 6 caractères">
                            <Input type="password" placeholder="••••••••"
                              value={resetPw[a.id] || ''}
                              onChange={e => setResetPw(p => ({ ...p, [a.id]: e.target.value }))} />
                          </Field>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveAgent(a.id)}
                          className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#2D5A8A] flex items-center gap-1.5">
                          <Check size={14} /> Enregistrer
                        </button>
                        <button onClick={() => { setEditId(null); setEditData({}) }}
                          className="px-4 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : confirmDeleteId === a.id ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50">
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-700 flex-1">Supprimer <strong>{a.nom}</strong> ?</p>
                      <button onClick={() => deleteAgent(a.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                        Supprimer
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center text-[#1E3A5F] font-semibold text-sm flex-shrink-0">
                        {a.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-800 truncate">{a.nom}</p>
                          {a.id === user?.id && <span className="text-xs text-gray-400">(vous)</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{a.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeColor(a.role)}`}>
                        {roleBadge(a.role)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditId(a.id); setEditData({ nom: a.nom, role: a.role }) }}
                          className="p-1.5 text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        {a.id !== user?.id && (
                          <button onClick={() => setConfirmDeleteId(a.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Ajouter */}
            {showAddAgent ? (
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                <p className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <UserPlus size={15} /> Nouveau compte
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Nom complet">
                    <Input value={newAgent.nom} onChange={e => setNewAgent(p => ({ ...p, nom: e.target.value }))} placeholder="Prénom Nom" />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={newAgent.email} onChange={e => setNewAgent(p => ({ ...p, email: e.target.value }))} placeholder="prenom@agence.fr" />
                  </Field>
                  <Field label="Mot de passe temporaire">
                    <Input type="password" value={newAgent.password} onChange={e => setNewAgent(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 caractères" />
                  </Field>
                  <Field label="Rôle">
                    <select value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                      <option value="demo">Démo</option>
                    </select>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={addAgent} disabled={addingAgent}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                    {addingAgent ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Créer le compte
                  </button>
                  <button onClick={() => setShowAddAgent(false)}
                    className="px-4 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100">Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddAgent(true)}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors flex items-center justify-center gap-2">
                <UserPlus size={16} /> Ajouter un compte
              </button>
            )}
          </>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. INTELLIGENCE ARTIFICIELLE                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Intelligence Artificielle" icon={Cpu}>
        {/* Clé API */}
        <div className="mb-6">
          <Field label="Clé API Anthropic" hint="Laissez vide pour utiliser la variable d'environnement">
            <div className="relative">
              <Input type={showApiKey ? 'text' : 'password'} className="pr-10 font-mono text-sm"
                value={showApiKey ? settings.api_key : maskKey(settings.api_key)}
                onChange={e => chg('api_key', e.target.value)} placeholder="sk-ant-..." />
              <button type="button" onClick={() => setShowApiKey(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
        </div>

        {/* Modèle */}
        <Field label="Modèle IA">
          <div className="grid grid-cols-2 gap-4 mt-2">
            {models.map(m => {
              const MI = m.icon
              const active = settings.model === m.id
              return (
                <button key={m.id} type="button" onClick={() => chg('model', m.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    active ? 'border-[#1E3A5F] bg-[#DCE7F3]/60' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <MI size={20} />
                    </div>
                    {active && <div className="w-5 h-5 bg-[#1E3A5F] rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                  </div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[#1E3A5F] text-sm">{m.name}</p>
                    {m.best && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Recommandé</span>}
                  </div>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.price}</p>
                </button>
              )
            })}
          </div>
        </Field>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* USAGE CLAUDE CE MOIS                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {claudeUsage && (
        <div className={`rounded-2xl border p-5 ${claudeUsage.nb_appels >= CLAUDE_LIMIT ? 'bg-red-50 border-red-200' : claudeUsage.nb_appels >= CLAUDE_LIMIT * 0.8 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={16} className={claudeUsage.nb_appels >= CLAUDE_LIMIT ? 'text-red-500' : claudeUsage.nb_appels >= CLAUDE_LIMIT * 0.8 ? 'text-amber-500' : 'text-gray-400'} />
              <span className="text-sm font-semibold text-gray-700">Usage Claude — {claudeUsage.year_month}</span>
            </div>
            <span className={`text-sm font-bold ${claudeUsage.nb_appels >= CLAUDE_LIMIT ? 'text-red-600' : claudeUsage.nb_appels >= CLAUDE_LIMIT * 0.8 ? 'text-amber-600' : 'text-gray-600'}`}>
              {claudeUsage.nb_appels} / {CLAUDE_LIMIT} appels
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${claudeUsage.nb_appels >= CLAUDE_LIMIT ? 'bg-red-500' : claudeUsage.nb_appels >= CLAUDE_LIMIT * 0.8 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (claudeUsage.nb_appels / CLAUDE_LIMIT) * 100)}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{(claudeUsage.input_tokens || 0).toLocaleString('fr-FR')} tokens entrants</span>
            <span>{(claudeUsage.output_tokens || 0).toLocaleString('fr-FR')} tokens sortants</span>
          </div>
          {claudeUsage.nb_appels >= CLAUDE_LIMIT && (
            <p className="mt-2 text-xs font-medium text-red-600">⚠️ Limite atteinte — vérifiez votre consommation API Anthropic</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. PRÉFÉRENCES D'ANALYSE                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Préférences d'analyse" icon={Sliders}>

        {/* Tolérance budget */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Tolérance budget</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                <TrendingUp size={13} className="rotate-180" /> Minimum : {settings.budget_tolerance_min}%
              </p>
              <input type="range" min="50" max="100" step="5" value={settings.budget_tolerance_min}
                onChange={e => chg('budget_tolerance_min', +e.target.value)}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                <TrendingUp size={13} /> Maximum : {settings.budget_tolerance_max}%
              </p>
              <input type="range" min="100" max="150" step="5" value={settings.budget_tolerance_max}
                onChange={e => chg('budget_tolerance_max', +e.target.value)}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500 shrink-0" />
            Budget 200 000€ → biens entre{' '}
            <strong className="mx-1">{(200000 * settings.budget_tolerance_min / 100).toLocaleString()}€</strong> et{' '}
            <strong className="mx-1">{(200000 * settings.budget_tolerance_max / 100).toLocaleString()}€</strong>
          </p>
        </div>

        {/* Score minimum */}
        <div className="p-4 rounded-xl border mb-4" style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.18)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-violet-700">Score minimum à afficher</p>
              <p className="text-xs text-violet-500 mt-0.5">Les matchings en dessous sont masqués</p>
            </div>
            <span className="text-lg font-extrabold text-violet-700">{settings.score_minimum === 0 ? 'Tous' : settings.score_minimum + '+'}</span>
          </div>
          <input type="range" min="0" max="80" step="5" value={settings.score_minimum}
            onChange={e => chg('score_minimum', +e.target.value)}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#7c3aed', background: 'rgba(124,58,237,0.18)' }} />
        </div>

        {/* Max matchings */}
        <div className="p-4 rounded-xl border" style={{ background: 'rgba(30,58,95,0.06)', borderColor: 'rgba(30,58,95,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[#1E3A5F]">Matchings max par prospect</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(30,58,95,0.55)' }}>Seuls les N meilleurs scores sont affichés</p>
            </div>
            <span className="text-lg font-extrabold text-[#1E3A5F]">{settings.max_matchings_par_prospect}</span>
          </div>
          <input type="range" min="1" max="9" step="1" value={settings.max_matchings_par_prospect}
            onChange={e => chg('max_matchings_par_prospect', +e.target.value)}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#1E3A5F', background: 'rgba(30,58,95,0.2)' }} />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. SYNCHRONISATION HEKTOR                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Synchronisation Hektor" icon={RefreshCw}>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="Hôte FTP">
            <Input value={settings.ftp_host} onChange={e => chg('ftp_host', e.target.value)} placeholder="ftp.hektor.fr" />
          </Field>
          <Field label="Port">
            <Input value={settings.ftp_port} onChange={e => chg('ftp_port', e.target.value)} placeholder="21" />
          </Field>
          <Field label="Utilisateur FTP">
            <Input value={settings.ftp_user} onChange={e => chg('ftp_user', e.target.value)} placeholder="user@agence.fr" />
          </Field>
          <Field label="Mot de passe FTP">
            <div className="relative">
              <Input type={showFtpPass ? 'text' : 'password'} className="pr-10"
                value={settings.ftp_pass} onChange={e => chg('ftp_pass', e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowFtpPass(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showFtpPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <div className="col-span-2">
            <Field label="Chemin FTP">
              <Input value={settings.ftp_path} onChange={e => chg('ftp_path', e.target.value)} placeholder="/exports/biens.csv" />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Fréquence de sync automatique</p>
            <p className="text-xs text-gray-400">Intervalle entre chaque synchronisation Hektor</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={settings.sync_interval_hours} onChange={e => chg('sync_interval_hours', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
              {[1,2,4,6,12,24].map(h => <option key={h} value={h}>Toutes les {h}h</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!settings.analyse_auto_import}
              onChange={e => chg('analyse_auto_import', e.target.checked)}
              className="w-4 h-4 accent-[#1E3A5F]" />
            Lancer l'analyse automatiquement après import
          </label>
        </div>

        {/* Erreur FTP persistante */}
        {lastSyncError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">Dernière sync en erreur
                {lastSyncErrorAt && <span className="font-normal text-red-500 ml-1">· {lastSyncErrorAt.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
              </p>
              <p className="text-xs text-red-600 mt-0.5 break-words">{lastSyncError}</p>
            </div>
            <button onClick={() => setLastSyncError(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sync manuelle */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <button onClick={handleSync} disabled={syncing}
            className="px-4 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#2D5A8A] disabled:opacity-50 flex items-center gap-2">
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {syncing ? 'Synchronisation...' : 'Lancer manuellement'}
          </button>
          {lastSync && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={13} /> Dernière sync : {formatSync(lastSync)}
            </span>
          )}
          {syncResult && (
            <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${syncResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {syncResult.success
                ? `✓ ${syncResult.imported ?? 0} importés · ${syncResult.updated ?? 0} mis à jour · ${syncResult.vendu ?? 0} vendus`
                : syncResult.error || 'Erreur'}
            </span>
          )}
        </div>

      </Section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. DONNÉES                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Section title="Données" icon={Database}>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <button
            onClick={() => window.open(`${API_URL}/rapport/mensuel?token=${token}`, '_blank')}
            className="flex items-center gap-2 px-5 py-3 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#2D5A8A] transition-colors">
            <FileText size={17} /> Rapport mensuel
          </button>

          <button onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            <Download size={17} /> Exporter en Excel
          </button>

          {isDemo && (
            <button onClick={handleResetDemo} disabled={resettingDemo}
              className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-60">
              {resettingDemo ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
              Réinitialiser la démo
            </button>
          )}

          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 size={17} /> Réinitialiser la base
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={17} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">Confirmer la suppression de toutes les données ?</p>
              <button onClick={handleReset}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Oui, supprimer</button>
              <button onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">Annuler</button>
            </div>
          )}
        </div>
      </Section>

      {/* ── Barre de sauvegarde sticky ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end items-center gap-4 px-8 py-3 bg-white/90 backdrop-blur border-t border-gray-200 shadow-lg settings-save-bar">
        <Toast msg={settingsMsg.text} ok={settingsMsg.ok} />
        <button onClick={saveSettings} disabled={savingSettings}
          className={`px-6 py-2.5 font-semibold rounded-xl text-white transition-all flex items-center gap-2
            ${savingSettings ? 'bg-gray-400' : 'bg-[#1E3A5F] hover:bg-[#2D5A8A]'}`}>
          {savingSettings ? <><Loader2 size={16} className="animate-spin" />Sauvegarde...</> : <><Save size={16} />Sauvegarder les paramètres</>}
        </button>
      </div>

    </div>
  )
}
