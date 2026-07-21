import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, X, CheckCircle, Clock, AlertCircle, Calendar, Building2, UserCircle, FileText, TrendingUp } from 'lucide-react'
import { apiFetch } from '../api'

const STATUTS = [
  { value: 'à visiter',       label: 'À visiter',        color: '#94a3b8', bg: '#f1f5f9' },
  { value: 'visité',          label: 'Visité',            color: '#3b82f6', bg: '#eff6ff' },
  { value: 'à rappeler',      label: 'À rappeler',        color: '#f59e0b', bg: '#fffbeb' },
  { value: 'démo planifiée',  label: 'Démo planifiée',   color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'signé',           label: 'Signé',             color: '#10b981', bg: '#ecfdf5' },
  { value: 'pas intéressé',   label: 'Pas intéressé',    color: '#ef4444', bg: '#fef2f2' },
]

function getStatut(value) {
  return STATUTS.find(s => s.value === value) || STATUTS[0]
}

function StatutBadge({ value }) {
  const s = getStatut(value)
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM = {
  nom_agence: '',
  adresse: '',
  nom_contact: '',
  telephone: '',
  email: '',
  statut: 'à visiter',
  date_visite: '',
  date_relance: '',
  notes: '',
}

function LeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState(lead ? { ...lead } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.nom_agence.trim()) return
    setSaving(true)
    try {
      const res = lead
        ? await apiFetch(`/prospection/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await apiFetch('/prospection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      onSaved(saved, !!lead)
    } catch {
      alert('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 lg:left-64 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base">{lead ? 'Modifier la visite' : 'Nouvelle visite'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom de l'agence *</label>
            <input
              autoFocus
              type="text"
              value={form.nom_agence}
              onChange={e => set('nom_agence', e.target.value)}
              placeholder="Ex: Agence Martin Immobilier"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Adresse</label>
            <input
              type="text"
              value={form.adresse}
              onChange={e => set('adresse', e.target.value)}
              placeholder="12 rue de la Paix, 75001 Paris"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact</label>
              <input
                type="text"
                value={form.nom_contact}
                onChange={e => set('nom_contact', e.target.value)}
                placeholder="Jean Dupont"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => set('telephone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@agence.fr"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Statut</label>
            <select
              value={form.statut}
              onChange={e => set('statut', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition bg-white"
            >
              {STATUTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date de visite</label>
              <input
                type="date"
                value={form.date_visite}
                onChange={e => set('date_visite', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date de relance</label>
              <input
                type="date"
                value={form.date_relance}
                onChange={e => set('date_relance', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Impressions, objections, suite à donner..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.nom_agence.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)' }}>
            {saving ? 'Sauvegarde...' : lead ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: 'var(--surface-card-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--surface-card-border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '1a' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function ProspectionPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | lead object
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterStatut, setFilterStatut] = useState('tous')

  useEffect(() => {
    apiFetch('/prospection')
      .then(r => r.json())
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSaved = (saved, isUpdate) => {
    if (isUpdate) {
      setLeads(ls => ls.map(l => l.id === saved.id ? saved : l))
    } else {
      setLeads(ls => [saved, ...ls])
    }
    setModal(null)
  }

  const handleDelete = async (id) => {
    await apiFetch(`/prospection/${id}`, { method: 'DELETE' })
    setLeads(ls => ls.filter(l => l.id !== id))
    setDeleteConfirm(null)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = filterStatut === 'tous' ? leads : leads.filter(l => l.statut === filterStatut)
  const relancesUrgentes = leads.filter(l => l.date_relance && l.date_relance <= today && l.statut !== 'signé' && l.statut !== 'pas intéressé')

  const stats = {
    total: leads.length,
    aRappeler: leads.filter(l => l.statut === 'à rappeler').length,
    demo: leads.filter(l => l.statut === 'démo planifiée').length,
    signes: leads.filter(l => l.statut === 'signé').length,
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800" style={{ letterSpacing: '-0.03em' }}>Prospection</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suivi des agences visitées</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)' }}>
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle visite</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Alerte relances urgentes */}
      {relancesUrgentes.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-center gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <p className="text-sm font-medium" style={{ color: '#92400e' }}>
            {relancesUrgentes.length} relance{relancesUrgentes.length > 1 ? 's' : ''} en retard —{' '}
            {relancesUrgentes.map(l => l.nom_agence).join(', ')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total visités" value={stats.total} color="#3b82f6" icon={Building2} />
        <StatCard label="À rappeler" value={stats.aRappeler} color="#f59e0b" icon={Phone} />
        <StatCard label="Démos prévues" value={stats.demo} color="#8b5cf6" icon={Calendar} />
        <StatCard label="Signés" value={stats.signes} color="#10b981" icon={CheckCircle} />
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterStatut('tous')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatut === 'tous' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Tous ({leads.length})
        </button>
        {STATUTS.map(s => {
          const count = leads.filter(l => l.statut === s.value).length
          if (count === 0) return null
          return (
            <button key={s.value}
              onClick={() => setFilterStatut(s.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filterStatut === s.value
                ? { background: s.color, color: 'white' }
                : { background: s.bg, color: s.color }}>
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune visite enregistrée</p>
          <p className="text-sm mt-1">Clique sur "Nouvelle visite" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const overdue = lead.date_relance && lead.date_relance <= today && lead.statut !== 'signé' && lead.statut !== 'pas intéressé'
            return (
              <div key={lead.id}
                className="rounded-2xl p-4 transition-all hover:shadow-md"
                style={{ background: 'var(--surface-card-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: overdue ? '1px solid #fde68a' : '1px solid var(--surface-card-border)', boxShadow: 'var(--shadow-card)' }}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 truncate">{lead.nom_agence}</h3>
                      <StatutBadge value={lead.statut} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {lead.adresse && (
                        <span className="flex items-center gap-1"><MapPin size={11} />{lead.adresse}</span>
                      )}
                      {lead.nom_contact && (
                        <span className="flex items-center gap-1"><UserCircle size={11} />{lead.nom_contact}</span>
                      )}
                      {lead.telephone && (
                        <a href={`tel:${lead.telephone}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <Phone size={11} />{lead.telephone}
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <Mail size={11} />{lead.email}
                        </a>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {lead.date_visite && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock size={11} />Visite : {formatDate(lead.date_visite)}
                        </span>
                      )}
                      {lead.date_relance && (
                        <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-amber-500' : 'text-gray-400'}`}>
                          <Calendar size={11} />Relance : {formatDate(lead.date_relance)}
                          {overdue && ' ⚠'}
                        </span>
                      )}
                    </div>

                    {lead.notes && (
                      <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">{lead.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setModal(lead)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(lead)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <LeadModal
          lead={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 lg:left-64 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-2">Supprimer cette visite ?</h3>
            <p className="text-sm text-gray-500 mb-5">{deleteConfirm.nom_agence}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
