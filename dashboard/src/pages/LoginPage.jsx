// =====================================================
// src/pages/LoginPage.jsx — Immersive fullscreen
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Sparkles } from 'lucide-react'
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
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isLogin,      setIsLogin]      = useState(true)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [nom,          setNom]          = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [mounted,      setMounted]      = useState(false)
  const [focused,      setFocused]      = useState(null)

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
    let result
    if (isLogin) {
      result = await login(email, password)
    } else {
      if (!nom.trim()) { setError('Le nom est requis'); setLoading(false); return }
      result = await register(email, password, nom)
    }
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  const inp = (f) => ({
    width: '100%',
    padding: `11px 14px 11px ${f === 'nom' ? '14px' : '40px'}`,
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

        ::placeholder { color: rgba(255,255,255,0.25) !important; }

        .pill {
          flex:1; padding:9px; border:none; background:transparent;
          font-family:inherit; font-size:13px; font-weight:500;
          cursor:pointer; border-radius:7px;
          display:flex; align-items:center; justify-content:center; gap:5px;
          transition:all 0.18s ease; color:rgba(255,255,255,0.4);
        }
        .pill.on {
          background: rgba(255,255,255,0.12);
          color: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .pill:not(.on):hover { color:rgba(255,255,255,0.65); }

        .sbtn {
          width:100%; padding:12px; border:none; border-radius:10px;
          font-family:inherit; font-size:14px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
          transition: all 0.18s ease;
          background: white; color: #2563eb;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .sbtn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
        .sbtn:active:not(:disabled) { transform:translateY(0); }
        .sbtn:disabled { opacity:0.6; cursor:not-allowed; }
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

        {/* Logo en haut */}
        <div style={{
          position: 'absolute', top: '36px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px',
          opacity: mounted ? 1 : 0,
          animation: mounted ? 'logoIn 0.5s ease both' : 'none',
        }}>
          <div style={{
            width: '34px', height: '34px', background: 'white',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <Sparkles size={17} color="#2563eb" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>
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
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>

            {/* Titre */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {isLogin ? 'Bon retour 👋' : 'Créer un compte'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
                {isLogin ? 'Accédez à votre espace' : 'Rejoignez ImmoFlash'}
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,0.2)',
              borderRadius: '9px', padding: '3px', marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button className={`pill ${isLogin ? 'on' : ''}`} onClick={() => { setIsLogin(true); setError('') }}>
                <LogIn size={13} /> Connexion
              </button>
              <button className={`pill ${!isLogin ? 'on' : ''}`} onClick={() => { setIsLogin(false); setError('') }}>
                <UserPlus size={13} /> Inscription
              </button>
            </div>

            {/* Erreur */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {!isLogin && (
                <div style={{ animation: 'errorIn 0.3s ease' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom</label>
                  <input type="text" value={nom} onChange={e => setNom(e.target.value)} onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)} placeholder="Votre nom" style={inp('nom')} />
                </div>
              )}

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
                  <input type={showPassword ? 'text' : 'password'} value={password} required minLength={isLogin ? 1 : 6} onChange={e => setPassword(e.target.value)} onFocus={() => setFocused('pwd')} onBlur={() => setFocused(null)} placeholder="••••••••" style={{ ...inp('pwd'), paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: '2px', transition: 'color 0.18s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {!isLogin && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Minimum 6 caractères</p>}
              </div>

              <button type="submit" className="sbtn" disabled={loading} style={{ marginTop: '6px' }}>
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(37,99,235,0.3)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {isLogin ? 'Connexion...' : 'Création...'}
                  </>
                ) : (
                  <>
                    {isLogin ? <LogIn size={14} /> : <UserPlus size={14} />}
                    {isLogin ? 'Se connecter' : 'Créer mon compte'}
                  </>
                )}
              </button>
            </form>
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