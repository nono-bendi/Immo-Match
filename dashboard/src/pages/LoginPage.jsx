// =====================================================
// src/pages/LoginPage.jsx — Immersive fullscreen
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { API_URL } from '../config'

// Canvas particules
function ParticlesCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animId

    const N = 55
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.4 + 0.1,
    }))

    const MAX_DIST = 130

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Lignes entre points proches
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX_DIST) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - d / MAX_DIST)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      // Points
      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.o})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [mounted,      setMounted]      = useState(false)
  const [focused,      setFocused]      = useState(null)

  // Mot de passe oublié
  const [showForgot,      setShowForgot]      = useState(false)
  const [forgotEmail,     setForgotEmail]     = useState('')
  const [forgotLoading,   setForgotLoading]   = useState(false)
  const [forgotSent,      setForgotSent]      = useState(false)
  const [forgotError,     setForgotError]     = useState('')

  const handleForgot = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setForgotError(d.detail || 'Erreur lors de l\'envoi.')
      } else {
        setForgotSent(true)
      }
    } catch {
      setForgotError('Impossible de contacter le serveur.')
    }
    setForgotLoading(false)
  }

  // Reconnexion compte démo
  const [showDemo,     setShowDemo]     = useState(false)
  const [demoEmail,    setDemoEmail]    = useState('')
  const [demoLoading,  setDemoLoading]  = useState(false)
  const [demoError,    setDemoError]    = useState('')

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  const handleDemoReconnect = async (e) => {
    e.preventDefault()
    setDemoError('')
    setDemoLoading(true)
    try {
      const res = await fetch(`${API_URL}/trial-reconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setDemoError(data.detail || 'Erreur.'); setDemoLoading(false); return }
      localStorage.setItem('token', data.access_token)
      window.location.href = '/?token=' + data.access_token
    } catch {
      setDemoError('Impossible de contacter le serveur.')
      setDemoLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  const inp = (f) => ({
    width: '100%',
    padding: '11px 14px 11px 40px',
    border: `1px solid ${focused === f ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'white',
    background: focused === f ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
    outline: 'none',
    transition: 'all 0.18s ease',
    boxShadow: focused === f ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
  })

  return (
    <>
      <style>{`
        @keyframes breathBg {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.75; }
        }
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.08); }
          66%      { transform: translate(-30px,50px) scale(0.94); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-50px,30px) scale(1.05); }
          66%      { transform: translate(40px,-60px) scale(0.96); }
        }
        @keyframes blob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,40px) scale(1.1); }
        }
        @keyframes formIn {
          from { opacity:0; transform: translateY(24px) scale(0.98); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logoIn {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0);     }
        }
        @keyframes errorIn {
          from { opacity:0; transform: translateY(-6px); }
          to   { opacity:1; transform: translateY(0);    }
        }
        @keyframes borderGlow {
          0%,100% { opacity: 0.6; }
          50%     { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(250%)  skewX(-12deg); }
        }

        ::placeholder { color: rgba(255,255,255,0.25) !important; }

        .sbtn {
          width:100%; padding:12px; border:none; border-radius:10px;
          font-family:inherit; font-size:14px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
          transition: all 0.18s ease;
          background: white; color: #1E3A5F;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .sbtn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
        .sbtn:active:not(:disabled) { transform:translateY(0); }
        .sbtn:disabled { opacity:0.6; cursor:not-allowed; }
        @media (max-height: 700px), (max-width: 480px) { .login-hero-logo { display: none !important; } }
      `}</style>

      {/* Fond plein écran */}
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#0f1e30',
      }}>

        {/* Blobs animés */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            width: '650px', height: '650px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,90,160,0.55) 0%, transparent 70%)',
            top: '-150px', left: '-150px',
            animation: 'blob1 14s ease-in-out infinite',
            filter: 'blur(1px)',
          }} />
          <div style={{
            position: 'absolute',
            width: '550px', height: '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(15,60,110,0.5) 0%, transparent 70%)',
            bottom: '-120px', right: '-100px',
            animation: 'blob2 18s ease-in-out infinite',
            filter: 'blur(1px)',
          }} />
          <div style={{
            position: 'absolute',
            width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,100,170,0.3) 0%, transparent 70%)',
            top: '40%', left: '55%',
            animation: 'blob3 11s ease-in-out infinite',
          }} />
        </div>

        {/* Particules */}
        <ParticlesCanvas />

        {/* Logo en haut — masqué sur petits écrans (overlap formulaire) */}
        <div className="login-hero-logo" style={{
          position: 'absolute', top: '140px',
          width: '100%', display: 'flex', justifyContent: 'center',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          animation: mounted ? 'logoIn 0.5s ease both' : 'none',
        }}>
          <span style={{
            fontWeight: 900, fontSize: '48px', letterSpacing: '-0.04em', lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 18px rgba(56,189,248,0.55))',
          }}>
            ImmoFlash
          </span>
        </div>

        {/* Formulaire centré */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '380px',
          padding: '0 20px',
          opacity: mounted ? 1 : 0,
          animation: mounted ? 'formIn 0.6s cubic-bezier(.22,.68,0,1.05) 0.1s both' : 'none',
        }}>
          <div style={{ position: 'relative', borderRadius: '22px', padding: '1.5px', background: 'linear-gradient(135deg, rgba(56,189,248,0.5) 0%, rgba(255,255,255,0.08) 40%, rgba(99,102,241,0.4) 100%)', animation: 'borderGlow 3s ease-in-out infinite' }}>
          {/* Shimmer */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '22px', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', animation: 'shimmer 4s ease-in-out infinite 1s' }} />
          </div>
          <div style={{
            background: 'rgba(15,30,50,0.75)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderRadius: '21px',
            padding: '32px 28px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 60px rgba(56,189,248,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
          {/* Lueur interne haut */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)' }} />

            {/* ── Vue mot de passe oublié ── */}
            {showForgot ? (
              <div style={{ animation: 'formIn 0.25s ease' }}>
                {forgotSent ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: '36px', marginBottom: '14px' }}>✉️</div>
                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Email envoyé !</h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
                      Si un compte existe pour <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{forgotEmail}</strong>, vous allez recevoir un lien de réinitialisation valable 1 heure.
                    </p>
                    <button className="sbtn" onClick={() => setShowForgot(false)}>Retour à la connexion</button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <button onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '12px', padding: 0, display: 'flex', alignItems: 'center', gap: 4, marginBottom: '16px' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                      >← Retour</button>
                      <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Mot de passe oublié</h2>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Entrez votre email, on vous envoie un lien de réinitialisation.</p>
                    </div>
                    {forgotError && (
                      <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: '9px 12px', borderRadius: '9px', fontSize: '13px', marginBottom: '14px' }}>{forgotError}</div>
                    )}
                    <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                          <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="vous@exemple.com" style={inp('forgotEmail')} onFocus={() => setFocused('forgotEmail')} onBlur={() => setFocused(null)} />
                        </div>
                      </div>
                      <button type="submit" className="sbtn" disabled={forgotLoading} style={{ marginTop: '4px' }}>
                        {forgotLoading ? (
                          <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(30,58,95,0.3)', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Envoi...</>
                        ) : 'Envoyer le lien'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (<>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Connexion</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Accédez à votre espace</p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                color: '#fca5a5', padding: '9px 12px',
                borderRadius: '9px', fontSize: '13px',
                marginBottom: '14px',
                animation: 'errorIn 0.25s ease',
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', transition: 'color 0.18s', pointerEvents: 'none' }} />
                  <input type="email" value={email} required onChange={e => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} placeholder="vous@exemple.com" style={inp('email')} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focused === 'pwd' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', transition: 'color 0.18s', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} value={password} required minLength={1} onChange={e => setPassword(e.target.value)} onFocus={() => setFocused('pwd')} onBlur={() => setFocused(null)} placeholder="••••••••" style={{ ...inp('pwd'), paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: '2px', transition: 'color 0.18s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                  <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '11px', padding: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  >Mot de passe oublié ?</button>
                </div>
              </div>

              <button type="submit" className="sbtn" disabled={loading} style={{ marginTop: '6px' }}>
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(30,58,95,0.3)', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Connexion...
                  </>
                ) : (
                  <><LogIn size={14} /> Se connecter</>
                )}
              </button>
            </form>
            </>)}

          </div>
          </div>

          {/* Reconnexion compte démo */}
          <div style={{ marginTop: '14px' }}>
            {!showDemo ? (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
                Compte démo ?{' '}
                <button onClick={() => setShowDemo(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8', fontSize: '12px', fontWeight: 600, padding: 0 }}>
                  Reconnectez-vous par email →
                </button>
              </p>
            ) : (
              <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '14px', padding: '18px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#7dd3fc' }}>
                  Accès démo sans mot de passe
                </p>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Entrez l'email utilisé lors de votre inscription, nous vous reconnectons directement.
                </p>
                {demoError && (
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '7px 10px' }}>{demoError}</p>
                )}
                <form onSubmit={handleDemoReconnect} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email" required value={demoEmail}
                    onChange={e => setDemoEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button type="submit" disabled={demoLoading} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: demoLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: demoLoading ? 0.6 : 1 }}>
                    {demoLoading ? '…' : 'Accéder'}
                  </button>
                </form>
                <button onClick={() => setShowDemo(false)} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Annuler</button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px', marginTop: '16px' }}>
            © 2026 ImmoFlash
          </p>
        </div>
      </div>
    </>
  )
}

export default LoginPage