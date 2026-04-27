import { useState } from 'react'

const SUJETS = [
  'Question générale',
  'Problème technique',
  'Question sur les tarifs',
  'Demande de démo',
  'Autre',
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

  const inputStyle = (key) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1px solid ${focused === key ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
    fontSize: 14,
    outline: 'none',
    background: focused === key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
    color: '#f1f5f9',
    boxSizing: 'border-box',
    transition: 'border-color 200ms, background 200ms',
    backdropFilter: 'blur(4px)',
  })

  return (
    <>
      <style>{`
        @keyframes overlayIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cardIn     { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes checkIn    { 0% { transform: scale(0) rotate(-20deg); opacity: 0 } 70% { transform: scale(1.12) rotate(2deg) } 100% { transform: scale(1) rotate(0deg); opacity: 1 } }
        @keyframes spin       { to { transform: rotate(360deg) } }
        .contact-input::placeholder { color: rgba(148,163,184,0.5); }
      `}</style>

      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(6, 13, 26, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          animation: 'overlayIn 200ms ease',
        }}
      >
        {/* Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: 'rgba(15, 28, 50, 0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            animation: 'cardIn 280ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Lueur top */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)',
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '2rem' }}>

            {/* Fermer */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8' }}
            >×</button>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'rgba(56,189,248,0.12)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    animation: 'checkIn 500ms cubic-bezier(0.22,1,0.36,1)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>Message envoyé</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 1.75rem', lineHeight: 1.6 }}>
                  Nous avons bien reçu votre message.<br />Vous recevrez une réponse sous 24h.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.07)', color: '#f1f5f9',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                    padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >Fermer</button>
              </div>

            ) : (
              <>
                <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>
                  Une question ?
                </h3>
                <p style={{ color: '#475569', fontSize: 13, margin: '0 0 1.75rem' }}>
                  Réponse garantie sous 24h.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[['name', 'Nom', 'Jean Dupont', 'text'], ['email', 'Email', 'vous@agence.fr', 'email']].map(([k, lbl, ph, t]) => (
                      <div key={k}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{lbl}</label>
                        <input
                          className="contact-input"
                          type={t}
                          placeholder={ph}
                          value={form[k]}
                          onChange={set(k)}
                          required
                          style={inputStyle(k)}
                          onFocus={() => setFocused(k)}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Sujet</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {SUJETS.map(s => {
                        const active = form.sujet === s
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, sujet: s }))}
                            style={{
                              padding: '6px 13px', borderRadius: 999, fontSize: 13,
                              border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
                              background: active ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                              color: active ? '#38bdf8' : '#64748b',
                              cursor: 'pointer', fontWeight: active ? 500 : 400,
                              transition: 'all 160ms',
                            }}
                          >{s}</button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Message</label>
                    <textarea
                      className="contact-input"
                      placeholder="Décrivez votre demande..."
                      value={form.message}
                      onChange={set('message')}
                      required
                      style={{ ...inputStyle('message'), resize: 'none', minHeight: 100 }}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>

                  {status === 'error' && (
                    <p style={{
                      color: '#f87171', fontSize: 13, margin: 0,
                      padding: '10px 14px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                    }}>
                      Une erreur est survenue. Réessayez ou écrivez à contact@immoflash.app
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    style={{
                      marginTop: 4,
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6ca2 100%)',
                      color: '#fff', border: 'none', borderRadius: 12,
                      padding: '13px', fontSize: 14, fontWeight: 600,
                      cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 24px rgba(30,58,95,0.4)',
                      opacity: status === 'sending' ? 0.7 : 1,
                      transition: 'opacity 150ms',
                    }}
                  >
                    {status === 'sending' ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"/>
                          <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        Envoyer le message
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
      </div>
    </>
  )
}
