import { useState, useEffect } from 'react'
import { startAnalytics } from '../analytics'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  const respond = (choice) => {
    localStorage.setItem('cookie_consent', choice)
    setVisible(false)
    // Le traçage ne démarre qu'après acceptation explicite (CNIL)
    if (choice === 'accepted') startAnalytics()
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, width: 'calc(100% - 48px)', maxWidth: 620,
      background: '#0f172a', borderRadius: 16,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 20 }}>🍪</span>
      <p style={{ flex: 1, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0, minWidth: 200 }}>
        Nous utilisons des cookies fonctionnels et d'analyse anonymisée.{' '}
        <a href="/cookies" style={{ color: '#60a5fa', textDecoration: 'underline' }}>En savoir plus</a>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => respond('refused')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Refuser
        </button>
        <button
          onClick={() => respond('accepted')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #1E3A5F, #2D5A8A)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  )
}
