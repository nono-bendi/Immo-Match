/* ════════════════════════════════════════════════════════════════
   DemoModal — Modale d'accès à la démo ImmoFlash
   S'ouvre au clic sur n'importe quel CTA de la landing.
   Crée un compte trial isolé via POST /api/start-demo puis redirige.
   ════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? ''
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || (
  typeof window !== 'undefined'
    ? window.location.origin + '/'
    : '/'
)

/* ── Champ de formulaire ─────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, required, error, autoFocus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em' }}>
        {label}{required && <span style={{ color: '#38bdf8', marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${error ? '#f87171' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 10,
          padding: '12px 16px',
          color: '#f1f5f9',
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 150ms',
          fontFamily: 'inherit',
          width: '100%',
        }}
        onFocus={e => { e.target.style.borderColor = '#38bdf8' }}
        onBlur={e => { e.target.style.borderColor = error ? '#f87171' : 'rgba(255,255,255,0.12)' }}
      />
      {error && (
        <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
      )}
    </div>
  )
}

/* ── Modale principale ───────────────────────────────────────── */
export default function DemoModal({ open, onClose }) {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [agence, setAgence] = useState('')
  const [telephone, setTelephone] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setNom(''); setEmail(''); setAgence(''); setTelephone('')
      setErrors({}); setLoading(false); setSuccess(false); setApiError(null)
    }
  }, [open])

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Bloquer le scroll body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  function validate() {
    const e = {}
    if (!nom.trim()) e.nom = 'Obligatoire'
    if (!email.trim() || !email.includes('@')) e.email = 'Email invalide'
    if (!agence.trim()) e.agence = 'Obligatoire'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    setApiError(null)

    try {
      const res = await fetch(`${API_URL}/api/start-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          agence_nom: agence.trim(),
          telephone: telephone.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.detail || 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      setSuccess(true)

      // Redirect dashboard dans 2.5 s
      setTimeout(() => {
        const url = DASHBOARD_URL.replace(/\/$/, '') + '/?token=' + data.access_token
        window.location.href = url
      }, 2500)
    } catch {
      setApiError('Impossible de contacter le serveur. Réessayez.')
      setLoading(false)
    }
  }

  return (
    /* ── Overlay ─────────────────────────────────────────────── */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 180ms ease',
      }}
    >
      {/* ── Carte modale ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #071220 0%, #0b1e38 60%, #0c2647 100%)',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: 24,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 460,
        position: 'relative',
        boxShadow: '0 0 0 1px rgba(56,189,248,0.06), 0 32px 80px rgba(0,0,0,0.7)',
        animation: 'slideUp 220ms cubic-bezier(0.32,1,0.23,1)',
      }}>
        {/* Ligne lumière haut */}
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.7), transparent)', borderRadius: 1, pointerEvents: 'none' }} />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, fontFamily: 'inherit',
            transition: 'background 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        >×</button>

        {success ? (
          /* ── État succès ──────────────────────────────────── */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.75rem', letterSpacing: '-0.4px' }}>
              Votre démo est prête !
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: '0 0 1rem' }}>
              Vous allez être redirigé vers votre espace dans quelques secondes…
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, border: '2.5px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: '#38bdf8', fontSize: 13, fontWeight: 600 }}>Chargement du dashboard…</span>
            </div>
          </div>
        ) : (
          /* ── Formulaire ───────────────────────────────────── */
          <>
            {/* En-tête */}
            <div style={{ marginBottom: '2rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(56,189,248,0.08)', color: '#7dd3fc',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 999, padding: '4px 12px', fontSize: 11,
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                Démo gratuite · 6 jours
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.5rem', letterSpacing: '-0.4px' }}>
                Accédez à votre démo
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                20 biens réels, 6 prospects, matchings générés.
                Opérationnel en 10 secondes.
              </p>
            </div>

            {/* Erreur API */}
            {apiError && (
              <div style={{
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem',
                fontSize: 13, color: '#f87171',
              }}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field
                label="Nom complet"
                value={nom}
                onChange={setNom}
                placeholder="Sophie Martin"
                required
                error={errors.nom}
                autoFocus
              />
              <Field
                label="Email professionnel"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="sophie@agence.fr"
                required
                error={errors.email}
              />
              <Field
                label="Nom de votre agence"
                value={agence}
                onChange={setAgence}
                placeholder="Martin Immobilier"
                required
                error={errors.agence}
              />
              <Field
                label="Téléphone"
                type="tel"
                value={telephone}
                onChange={setTelephone}
                placeholder="06 12 34 56 78"
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: loading ? 'rgba(56,189,248,0.5)' : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                  color: '#0f172a', border: 'none', borderRadius: 12,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms', fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(56,189,248,0.35)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2.5px solid rgba(15,23,42,0.4)', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Création en cours…
                  </>
                ) : (
                  <>
                    Accéder à ma démo gratuite
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Mention légale */}
            <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', margin: '1.25rem 0 0', lineHeight: 1.6 }}>
              Aucune carte bancaire · Sans engagement · 6 jours d'accès complet
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
