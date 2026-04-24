/* ════════════════════════════════════════════════════════════════
   OnboardingWizard — Wizard d'onboarding ImmoMatch
   3 étapes : Compte → Import choice → Fichier (si hektor/csv)
   POST /api/onboard → JWT → redirect dashboard connecté
   ════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react'

const API_URL       = import.meta.env.VITE_API_URL       || '/api'
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || (
  typeof window !== 'undefined' ? window.location.origin + '/' : '/'
)

/* ════ Constantes ════════════════════════════════════════════════ */

const IMPORT_MODES = [
  {
    id: 'hektor',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 4l2 4h-4M6 20l-2-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Fichier Hektor',
    desc: 'Exportez depuis Hektor → Annonces → CSV et déposez-le ici',
    badge: 'Recommandé',
    accept: '.csv',
    hint: 'Fichier .csv séparateur !#',
  },
  {
    id: 'csv',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M3 9h18M3 15h18M9 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Excel / CSV',
    desc: 'Importez votre propre fichier de biens',
    accept: '.xlsx,.xls,.csv',
    hint: 'Fichier .xlsx ou .csv',
    templateHref: null,
  },
  {
    id: 'demo',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Données de démo',
    desc: '20 vrais biens anonymisés du Var · matchings précalculés',
    badge: '0 effort',
    hint: 'Accès immédiat, aucun fichier',
  },
]

/* ════ Composants locaux ═════════════════════════════════════════ */

function Field({ label, type = 'text', value, onChange, placeholder, required, error, autoFocus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#38bdf8', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10,
          padding: '13px 16px',
          color: '#f1f5f9',
          fontSize: 15,
          outline: 'none',
          fontFamily: 'inherit',
          width: '100%',
          transition: 'border-color 150ms, background 150ms',
        }}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = 'rgba(56,189,248,0.05)' }}
        onBlur={e => { e.target.style.borderColor = error ? '#f87171' : 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
      />
      {error && <span style={{ fontSize: 12, color: '#f87171', marginTop: 2 }}>{error}</span>}
    </div>
  )
}


function Spinner({ size = 18, color = '#38bdf8' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}33`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

/* ════ Wizard principal ══════════════════════════════════════════ */

export default function OnboardingWizard({ open, onClose }) {
  /* ── State ── */
  const [step, setStep] = useState(1)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [agence, setAgence] = useState('')
  const [errors, setErrors] = useState({})

  const [importMode, setImportMode] = useState(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(null)   // { nb_biens, token }

  /* ── Reset à chaque ouverture ── */
  useEffect(() => {
    if (open) {
      setStep(1); setNom(''); setEmail(''); setAgence('')
      setErrors({}); setImportMode(null); setFile(null)
      setLoading(false); setApiError(null); setResult(null)
    }
  }, [open])

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, loading, onClose])

  /* ── Bloquer scroll ── */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* ── Drag & drop (hooks obligatoirement avant tout return conditionnel) ── */
  const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB

  const setFileChecked = useCallback((f) => {
    if (!f) return
    if (f.size > MAX_FILE_SIZE) {
      setApiError('Fichier trop volumineux (max 10 Mo). Divisez votre fichier si nécessaire.')
      return
    }
    setFile(f)
    setApiError(null)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFileChecked(f)
  }, [setFileChecked])

  const handleDragOver = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => setDragging(false), [])

  if (!open) return null

  /* ── Validation step 1 ── */
  function validateStep1() {
    const e = {}
    if (!nom.trim()) e.nom = 'Obligatoire'
    if (!email.trim() || !email.includes('@') || !email.split('@')[1]?.includes('.')) e.email = 'Email invalide'
    if (!agence.trim()) e.agence = 'Obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Navigation ── */
  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      if (!importMode) return
      if (importMode === 'demo') {
        submit()
      } else {
        setStep(3)
      }
    } else if (step === 3) {
      if (!file) { setApiError('Veuillez sélectionner un fichier.'); return }
      submit()
    }
  }

  function goBack() {
    setApiError(null)
    if (step === 2) setStep(1)
    if (step === 3) { setStep(2); setFile(null) }
  }

  /* ── Soumission ── */
  async function submit() {
    setLoading(true)
    setApiError(null)

    const formData = new FormData()
    formData.append('nom', nom.trim())
    formData.append('email', email.trim().toLowerCase())
    formData.append('agence_nom', agence.trim())
    formData.append('mode', importMode)
    if (file) formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/api/onboard`, { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.detail || 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      setResult(data)
      // Redirect dans 2.5 s
      setTimeout(() => {
        const base = DASHBOARD_URL.replace(/\/$/, '')
        window.location.href = `${base}/?token=${data.access_token}`
      }, 2500)
    } catch {
      setApiError('Impossible de contacter le serveur. Vérifiez votre connexion.')
      setLoading(false)
    }
  }

  /* ── Infos du mode sélectionné ── */
  const modeInfo = IMPORT_MODES.find(m => m.id === importMode)

  /* ── Progression ── */
  const totalSteps = importMode === 'demo' ? 2 : 3
  const progressPct = step === 1 ? 33 : step === 2 ? (importMode === 'demo' ? 66 : 66) : 100

  /* ── Rendu ── */
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeOverlay 200ms ease',
      }}
    >
      <div style={{
        background: 'linear-gradient(165deg, #060e1c 0%, #0a1a30 50%, #0c2040 100%)',
        border: '1px solid rgba(56,189,248,0.18)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 0 0 1px rgba(56,189,248,0.06), 0 40px 100px rgba(0,0,0,0.8)',
        animation: 'slideCard 240ms cubic-bezier(0.32,1,0.23,1)',
      }}>

        {/* ── Barre de progression ── */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', width: `${progressPct}%`, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)', borderRadius: 2 }} />
        </div>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {result ? 'Accès créé' : `Étape ${step}`}
          </span>
          {!loading && !result && (
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
              }}
            >×</button>
          )}
        </div>

        {/* ════ Contenu (animé par key) ════ */}
        <div key={result ? 'success' : step} style={{ padding: '24px 28px 28px', animation: 'stepIn 280ms ease' }}>

          {/* ═══ SUCCÈS ═══ */}
          {result && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.5rem',
                background: 'rgba(56,189,248,0.1)', border: '1.5px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.75rem', letterSpacing: '-0.5px' }}>
                Votre espace est prêt !
              </h2>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                {result.nb_biens > 0
                  ? <><strong style={{ color: '#38bdf8' }}>{result.nb_biens} biens</strong> importés avec succès.</>
                  : 'Votre compte est créé.'}
                {' '}Vous allez être redirigé vers votre dashboard.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '8px 18px' }}>
                <Spinner size={14} />
                <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>Chargement du dashboard…</span>
              </div>
            </div>
          )}

          {/* ═══ ÉTAPE 1 — Votre agence ═══ */}
          {!result && step === 1 && (
            <>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.4rem', letterSpacing: '-0.4px' }}>
                  Créons votre espace
                </h2>
                <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                  30 secondes et vous êtes opérationnel.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Nom complet" value={nom} onChange={setNom} placeholder="Sophie Martin" required error={errors.nom} autoFocus />
                <Field label="Email professionnel" type="email" value={email} onChange={setEmail} placeholder="sophie@agence.fr" required error={errors.email} />
                <Field label="Nom de votre agence" value={agence} onChange={setAgence} placeholder="Martin Immobilier" required error={errors.agence} />
              </div>
            </>
          )}

          {/* ═══ ÉTAPE 2 — Choix d'import ═══ */}
          {!result && step === 2 && (
            <>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.4rem', letterSpacing: '-0.4px' }}>
                  Comment voulez-vous<br />importer vos biens ?
                </h2>
                <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                  Choisissez votre méthode, on s'occupe du reste.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {IMPORT_MODES.map(m => {
                  const selected = importMode === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setImportMode(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                        background: selected ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${selected ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 14, padding: '16px 18px', cursor: 'pointer', width: '100%',
                        transition: 'all 160ms', fontFamily: 'inherit',
                        transform: selected ? 'translateX(4px)' : 'none',
                      }}
                      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)' } }}
                      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
                    >
                      {/* Icône */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: selected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selected ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: selected ? '#38bdf8' : '#64748b',
                        transition: 'all 160ms',
                      }}>
                        {m.icon}
                      </div>

                      {/* Texte */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: selected ? '#f1f5f9' : '#94a3b8' }}>
                            {m.label}
                          </span>
                          {m.badge && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                              color: '#0f172a', background: '#38bdf8', borderRadius: 999,
                              padding: '2px 8px', textTransform: 'uppercase',
                            }}>{m.badge}</span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{m.desc}</p>
                      </div>

                      {/* Radio */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? '#38bdf8' : '#334155'}`,
                        background: selected ? '#38bdf8' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 160ms',
                      }}>
                        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0f172a' }} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ═══ ÉTAPE 3 — Upload fichier ═══ */}
          {!result && step === 3 && modeInfo && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.4rem', letterSpacing: '-0.4px' }}>
                  {modeInfo.id === 'hektor' ? 'Déposez votre export Hektor' : 'Déposez votre fichier'}
                </h2>
                <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                  {modeInfo.id === 'hektor'
                    ? 'Dans Hektor : Annonces → Exporter → Format CSV'
                    : 'Format Excel (.xlsx) ou CSV standard'}
                </p>
              </div>

              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  border: `2px dashed ${dragging ? '#38bdf8' : file ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 16,
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(56,189,248,0.06)' : file ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 200ms',
                  marginBottom: '1rem',
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept={modeInfo.accept}
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFileChecked(f) }}
                />

                {file ? (
                  <>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem',
                      background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M9 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{file.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#38bdf8' }}>Fichier prêt · Cliquer pour changer</p>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>
                      Glissez votre fichier ici
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                      ou cliquez pour parcourir · <span style={{ color: '#475569' }}>{modeInfo.hint}</span>
                    </p>
                  </>
                )}
              </div>

              {modeInfo.id === 'csv' && (
                <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', margin: '0.5rem 0 0' }}>
                  Colonnes attendues : Reference, Type, Ville, Prix, Surface, Pieces, Chambres, Description
                </p>
              )}
            </>
          )}

          {/* ── Erreur API ── */}
          {apiError && !result && (
            <div style={{
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, padding: '10px 14px', marginTop: '1rem',
              fontSize: 13, color: '#f87171',
            }}>
              {apiError}
            </div>
          )}

          {/* ═══ Footer boutons ═══ */}
          {!result && (
            <div style={{ display: 'flex', gap: 10, marginTop: '1.75rem' }}>
              {step > 1 && !loading && (
                <button
                  onClick={goBack}
                  style={{
                    flex: '0 0 auto', padding: '13px 20px',
                    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#64748b', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#64748b' }}
                >
                  ← Retour
                </button>
              )}

              <button
                onClick={goNext}
                disabled={loading || (step === 2 && !importMode) || (step === 3 && !file)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 12, border: 'none', cursor: loading || (step === 2 && !importMode) || (step === 3 && !file) ? 'not-allowed' : 'pointer',
                  background: loading || (step === 2 && !importMode) || (step === 3 && !file)
                    ? 'rgba(56,189,248,0.3)'
                    : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                  color: '#0f172a', fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', transition: 'all 150ms',
                  boxShadow: loading || (step === 2 && !importMode) || (step === 3 && !file)
                    ? 'none' : '0 4px 20px rgba(56,189,248,0.3)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                {loading ? (
                  <><Spinner size={16} color="#0f172a" />Création en cours…</>
                ) : step === 1 ? (
                  <>Continuer <span style={{ fontSize: 16 }}>→</span></>
                ) : step === 2 && importMode === 'demo' ? (
                  <>Accéder à ma démo <span style={{ fontSize: 16 }}>→</span></>
                ) : step === 2 ? (
                  <>Choisir ce mode <span style={{ fontSize: 16 }}>→</span></>
                ) : (
                  <>Importer mes biens <span style={{ fontSize: 16 }}>→</span></>
                )}
              </button>
            </div>
          )}

          {/* Mention */}
          {step === 1 && !result && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#1e3a5f', margin: '1rem 0 0' }}>
              Aucune carte bancaire · 6 jours d'accès complet · Sans engagement
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideCard   { from { opacity: 0; transform: translateY(18px) scale(0.98) } to { opacity: 1; transform: none } }
        @keyframes stepIn      { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin        { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
