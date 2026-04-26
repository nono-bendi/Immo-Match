import { useState } from 'react'

const SUJETS = [
  { value: 'Question générale',     icon: '💬' },
  { value: 'Problème technique',    icon: '🔧' },
  { value: 'Question sur les tarifs', icon: '💳' },
  { value: 'Demande de démo',       icon: '🎯' },
  { value: 'Autre',                 icon: '📩' },
]

export default function ContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', sujet: 'Question générale', message: '' })
  const [status, setStatus] = useState('idle')
  const [focused, setFocused] = useState(null)

  if (!isOpen) return null

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setStatus(data.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  function handleClose() {
    setForm({ name: '', email: '', sujet: 'Question générale', message: '' })
    setStatus('idle')
    setFocused(null)
    onClose()
  }

  const field = (key) => ({
    style: {
      width: '100%',
      padding: '11px 14px',
      borderRadius: 10,
      border: `1.5px solid ${focused === key ? '#1e3a5f' : '#e2e8f0'}`,
      fontSize: 14,
      outline: 'none',
      background: focused === key ? '#fff' : '#f8fafc',
      color: '#0f172a',
      boxSizing: 'border-box',
      transition: 'border-color 150ms, background 150ms',
    },
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(null),
  })

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10, 20, 38, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes checkPop { 0% { transform: scale(0) } 70% { transform: scale(1.15) } 100% { transform: scale(1) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%', maxWidth: 500,
          position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
          animation: 'slideUp 220ms cubic-bezier(0.22,1,0.36,1)',
          overflow: 'hidden',
        }}
      >
        {/* Bande top */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #1e3a5f, #2d6ca2, #38bdf8)' }} />

        <div style={{ padding: '1.75rem 2rem 2rem' }}>

          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              width: 30, height: 30,
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              cursor: 'pointer', color: '#64748b', fontSize: 16, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >×</button>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem 1rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a5f, #2d6ca2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
                animation: 'checkPop 400ms cubic-bezier(0.22,1,0.36,1)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>Message envoyé !</h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 1.75rem', lineHeight: 1.6 }}>
                Nous avons bien reçu votre message.<br/>Vous recevrez une réponse rapidement.
              </p>
              <button
                onClick={handleClose}
                style={{
                  background: '#0f172a', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '11px 28px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Fermer</button>
            </div>

          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>
                  Une question ?
                </h3>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                  Réponse garantie sous 24h.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Nom + Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Nom</label>
                    <input {...field('name')} placeholder="Jean Dupont" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                    <input {...field('email')} type="email" placeholder="vous@agence.fr" value={form.email} onChange={set('email')} required />
                  </div>
                </div>

                {/* Sujet — chips cliquables */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Sujet</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SUJETS.map(s => {
                      const active = form.sujet === s.value
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, sujet: s.value }))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: `1.5px solid ${active ? '#1e3a5f' : '#e2e8f0'}`,
                            background: active ? '#1e3a5f' : '#fff',
                            color: active ? '#fff' : '#475569',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            transition: 'all 150ms',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{s.icon}</span>
                          {s.value}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Message</label>
                  <textarea
                    {...field('message')}
                    placeholder="Décrivez votre demande en quelques mots..."
                    value={form.message}
                    onChange={set('message')}
                    required
                    style={{ ...field('message').style, resize: 'none', minHeight: 100 }}
                  />
                </div>

                {status === 'error' && (
                  <p style={{ color: '#ef4444', fontSize: 13, margin: 0, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    Une erreur est survenue. Réessayez ou écrivez directement à contact@immoflash.app
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    background: status === 'sending' ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2d6ca2)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '13px', fontSize: 14, fontWeight: 600,
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 150ms',
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      Envoyer le message
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>

              </form>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
