import { useState } from 'react'

export default function ContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', sujet: 'Question générale', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  if (!isOpen) return null

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
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
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#0f172a',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,48,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={handleClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fermer */}
        <button
          onClick={handleClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1, padding: 4 }}
        >×</button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Message envoyé</h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 1.5rem' }}>Nous vous répondrons dans les plus brefs délais.</p>
            <button onClick={handleClose} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 18, margin: '0 0 6px' }}>Nous contacter</h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 1.5rem' }}>Une question, un bug, une suggestion ? Écrivez-nous.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Nom</label>
                  <input style={inputStyle} placeholder="Votre nom" value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="vous@agence.fr" value={form.email} onChange={set('email')} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Sujet</label>
                <select style={inputStyle} value={form.sujet} onChange={set('sujet')}>
                  <option>Question générale</option>
                  <option>Problème technique</option>
                  <option>Question sur les tarifs</option>
                  <option>Demande de démo</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Message</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
                  placeholder="Décrivez votre demande..."
                  value={form.message}
                  onChange={set('message')}
                  required
                />
              </div>
              {status === 'error' && (
                <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>Une erreur est survenue. Réessayez ou écrivez à contact@immoflash.app</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: status === 'sending' ? 'not-allowed' : 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}
              >
                {status === 'sending' ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
