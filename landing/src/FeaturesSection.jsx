import { useEffect, useRef, useState } from 'react'
import logoDemoUrl from '../image/logo.demo.png'

/* ════════════════════════════════════════════════════════════════
   MOCK COMPONENTS — reproductions fidèles de l'app ImmoMatch
   ════════════════════════════════════════════════════════════════ */

function MatchingMock() {
  const rows = [
    { i: 'DC', name: 'Mr Durand Charles',   budget: '450 000 €', bien: 'Appartement à Agay',            score: 88 },
    { i: 'BC', name: 'BERDIN Clémence',      budget: '160 000 €', bien: 'Appartement à Fréjus',         score: 88 },
    { i: 'CP', name: 'Mme Cellier Pascale',  budget: '250 000 €', bien: 'Appartement à Fréjus',         score: 87 },
    { i: 'DD', name: 'David Dufour',         budget: '500 000 €', bien: 'Maison/villa à Saint-Raphaël', score: 83 },
    { i: 'PR', name: 'Mr Paul Rouvier',      budget: '410 000 €', bien: 'Maison/villa à Fréjus',        score: 82 },
    { i: 'BM', name: 'Mr Brian Muller',      budget: '170 000 €', bien: 'Appartement à Fréjus',         score: 82 },
  ]
  const scoreBg = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff' }}>

      {/* Top bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Matchings IA</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>186 matchings · 93 prospects</span>
        </div>
        <div style={{ background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600 }}>
          Lancer l'analyse
        </div>
      </div>

      {/* Filtres score */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 6, borderBottom: '1px solid #f1f5f9' }}>
        {['Tous', '75+', '50-74', '< 50'].map((t, idx) => (
          <span key={t} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: idx === 0 ? '#1E3A5F' : '#f1f5f9', color: idx === 0 ? '#fff' : '#64748b' }}>{t}</span>
        ))}
      </div>

      {/* En-têtes colonnes */}
      <div style={{ padding: '7px 16px', display: 'grid', gridTemplateColumns: '2fr 2fr 52px', gap: 8, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {['Prospect', 'Meilleur match', 'Score'].map(c => (
          <span key={c} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c}</span>
        ))}
      </div>

      {/* Lignes — delay inline pour bypass le bug nth-child */}
      {rows.map((row, idx) => (
        <div
          key={row.i}
          className="matching-row"
          style={{ padding: '9px 16px', display: 'grid', gridTemplateColumns: '2fr 2fr 52px', gap: 8, alignItems: 'center', borderBottom: '1px solid #f8fafc', animationDelay: `${300 + idx * 160}ms` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#1E3A5F,#2D5A8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{row.i}</div>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{row.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.budget}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#1E3A5F', fontWeight: 500 }}>{row.bien}</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: scoreBg(row.score), color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row.score}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────── */

/* ── Avatar robot — copie exacte du SVG BotFace de l'app ── */
function BotFace({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenne */}
      <line x1="20" y1="3" x2="20" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="2.5" r="2" fill="#a5f3fc" />
      {/* Tête */}
      <rect x="7" y="9" width="26" height="22" rx="8" fill="white" fillOpacity=".95" />
      {/* Oreilles */}
      <rect x="4"    y="15" width="3.5" height="7" rx="1.5" fill="white" fillOpacity=".6" />
      <rect x="32.5" y="15" width="3.5" height="7" rx="1.5" fill="white" fillOpacity=".6" />
      {/* Yeux clignotants */}
      <rect className="bot-eye" x="12.5" y="16" width="5" height="6" rx="2.5" fill="#4f46e5" />
      <rect className="bot-eye" x="22.5" y="16" width="5" height="6" rx="2.5" fill="#4f46e5" style={{ animationDelay: '.15s' }} />
      {/* Reflets */}
      <circle cx="14" cy="17.5" r="1" fill="white" fillOpacity=".7" />
      <circle cx="24" cy="17.5" r="1" fill="white" fillOpacity=".7" />
      {/* Bouche */}
      <path d="M14.5 26 Q20 30.5 25.5 26" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Joues */}
      <circle cx="11" cy="25" r="1.5" fill="#f9a8d4" fillOpacity=".7" />
      <circle cx="29" cy="25" r="1.5" fill="#f9a8d4" fillOpacity=".7" />
    </svg>
  )
}

/* ── Avatar utilisateur ── */
function UserAvatar() {
  return (
    <img
      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=56&h=56&fit=crop&crop=face"
      alt="avatar"
      style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', display: 'block' }}
    />
  )
}

/* Indicateur typing — trois points qui rebondissent */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: 'row' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BotFace size={22} />
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="chat-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'block', animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  )
}

function ChatMock() {
  const wrapRef   = useRef(null)
  const msgsRef   = useRef(null)  /* container messages — scroll interne uniquement */
  const [phase, setPhase]         = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [input, setInput]         = useState('')
  const [extraMsgs, setExtraMsgs] = useState([])  /* easter egg messages */
  const [easterTyping, setEasterTyping] = useState(false)

  const LINK = (
    <a href="#pricing" style={{ display: 'block', marginTop: 8, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
      Voir les tarifs
    </a>
  )
  const EASTER_REPLIES = [
    <span>T'es curieux toi 😄 Mes vraies réponses sont réservées aux agents abonnés.{LINK}</span>,
    <span>Belle tentative 👀 Mais je suis réservé aux abonnés ImmoMatch.{LINK}</span>,
    <span>Chut… je parle uniquement à mes abonnés 🤫{LINK}</span>,
    <span>Bonne question ! Mais je ne réponds qu'aux abonnés 😉{LINK}</span>,
  ]

  const handleSend = () => {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    setExtraMsgs(prev => [...prev, { r: 'user', t: txt }])
    setEasterTyping(true)
    setTimeout(() => {
      setEasterTyping(false)
      const reply = EASTER_REPLIES[Math.floor(Math.random() * EASTER_REPLIES.length)]
      setExtraMsgs(prev => [...prev, { r: 'bot', t: reply }])
    }, 1200)
  }

  const MSGS = [
    { r: 'bot',  t: 'Bonjour ! Comment puis-je vous aider ?' },
    { r: 'user', t: "Combien de biens avec une piscine dans mon catalogue ?" },
    { r: 'bot',  t: "Vous avez 29 biens avec piscine 🏊\n• Fréjus — 165 000 €\n• Saint-Raphaël — 220 000 €\n• Saint-Raphaël — 231 000 €" },
  ]
  const FULL = MSGS[2].t

  /* scroll interne du container messages — jamais scrollIntoView qui scroll la page */
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [phase, charCount, extraMsgs, easterTyping])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      /* séquence :  typing → msg0 → msg1 → typing → typewriter */
      setTimeout(() => setPhase(1), 700)
      setTimeout(() => setPhase(2), 1800)
      setTimeout(() => setPhase(3), 2700)
      setTimeout(() => setPhase(4), 3500)
      setTimeout(() => {
        setPhase(5)
        let i = 0
        const iv = setInterval(() => {
          i++
          setCharCount(i)
          if (i >= FULL.length) clearInterval(iv)
        }, 22)
      }, 4600)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const showMsg0     = phase >= 2
  const showMsg1     = phase >= 3
  const showTyping   = phase === 1 || phase === 4
  const showMsg2     = phase >= 5
  const msg2text     = phase === 5 ? FULL.slice(0, charCount) : FULL

  return (
    <div ref={wrapRef} style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#4338ca,#6d28d9)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BotFace size={30} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Assistant IA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Saint François Immo</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>En ligne</span>
        </div>
      </div>

      {/* Zone messages — ref pour scroll interne uniquement */}
      <div ref={msgsRef} style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, background: 'linear-gradient(180deg,#f1f5f9,#f8fafc)', overflowY: 'auto' }}>

        {[
          showMsg0 && { ...MSGS[0], key: 0 },
          showMsg1 && { ...MSGS[1], key: 1 },
        ].filter(Boolean).map(msg => {
          const bot = msg.r === 'bot'
          return (
            <div key={msg.key} className="chat-msg-in" style={{ display: 'flex', gap: 8, flexDirection: bot ? 'row' : 'row-reverse' }}>
              {bot
                ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BotFace size={22} /></div>
                : <UserAvatar />
              }
              <div style={{ maxWidth: '80%', borderRadius: bot ? '4px 14px 14px 14px' : '14px 4px 14px 14px', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, background: bot ? '#fff' : 'linear-gradient(135deg,#4f46e5,#6d28d9)', color: bot ? '#1e293b' : '#fff', border: bot ? '1px solid #e2e8f0' : 'none', boxShadow: bot ? '0 1px 4px rgba(0,0,0,0.06)' : 'none' }}>
                {msg.t.split('\n').map((line, j) => <div key={j}>{line}</div>)}
              </div>
            </div>
          )
        })}

        {/* Indicateur typing */}
        {showTyping && <div className="chat-msg-in"><TypingDots /></div>}

        {/* Dernier message bot — typewriter */}
        {showMsg2 && (
          <div className="chat-msg-in" style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BotFace size={22} /></div>
            <div style={{ maxWidth: '80%', borderRadius: '4px 14px 14px 14px', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minHeight: 36 }}>
              {msg2text.split('\n').map((line, j) => <div key={j}>{line}</div>)}
              {/* curseur clignotant pendant le typewriter */}
              {charCount < FULL.length && <span className="chat-cursor" />}
            </div>
          </div>
        )}

        {/* Easter egg — messages si l'utilisateur écrit */}
        {extraMsgs.map((msg, i) => {
          const bot = msg.r === 'bot'
          return (
            <div key={'e'+i} className="chat-msg-in" style={{ display: 'flex', gap: 8, flexDirection: bot ? 'row' : 'row-reverse' }}>
              {bot
                ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BotFace size={22} /></div>
                : <UserAvatar />
              }
              <div style={{ maxWidth: '80%', borderRadius: bot ? '4px 14px 14px 14px' : '14px 4px 14px 14px', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, background: bot ? '#fff' : 'linear-gradient(135deg,#4f46e5,#6d28d9)', color: bot ? '#1e293b' : '#fff', border: bot ? '1px solid #e2e8f0' : 'none' }}>
                {msg.t}
              </div>
            </div>
          )
        })}
        {easterTyping && <div className="chat-msg-in"><TypingDots /></div>}

      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question..."
            style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '8px 12px', fontSize: 12, color: '#1e293b', background: '#f8fafc', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <div onClick={handleSend} style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>
          Propulsé par Claude AI · Immocompanion
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────── */

/* URL du VPS (même variable que l'app) */
const VPS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const BIEN_DEMO_URL = `${VPS_URL}/public/bien/saint_francois/20`

function EmailMock() {
  const COLOR = '#1E3A5F'
  const GRAD  = 'linear-gradient(135deg, #1E3A5F 0%, #1a4a8a 60%, #1d6fa8 100%)'
  const scrollRef = useRef(null)
  const [annotVisible, setAnnotVisible] = useState(false)
  const [bubbleHover, setBubbleHover] = useState(false)
  const lottieRef = useRef(null)

  /* dotlottie-wc : loop="false" en HTML = attribut présent = true → forcer via JS */
  useEffect(() => {
    if (lottieRef.current) lottieRef.current.loop = false
  }, [annotVisible])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    /* flag pour distinguer scroll auto vs scroll manuel */
    let isAutoScrolling = false

    /* scroll custom avec easing */
    function smoothScrollTo(target, duration, onDone) {
      const start = el.scrollTop
      const change = target - start
      const t0 = performance.now()
      isAutoScrolling = true
      function step(now) {
        const p = Math.min((now - t0) / duration, 1)
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        el.scrollTop = start + change * ease
        if (p < 1) requestAnimationFrame(step)
        else { isAutoScrolling = false; onDone && onDone() }
      }
      requestAnimationFrame(step)
    }

    /* scroll manuel → masque l'annotation */
    function onUserScroll() {
      if (isAutoScrolling) return
      setAnnotVisible(false)
    }
    el.addEventListener('scroll', onUserScroll, { passive: true })

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      setTimeout(() => {
        smoothScrollTo(480, 2000, () => {
          setTimeout(() => setAnnotVisible(true), 300)
        })
      }, 900)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); el.removeEventListener('scroll', onUserScroll) }
  }, [])

  const args = [
    "Surface convenable avec 70 m²",
    "Proximité commerces et écoles pratique",
    "Box de stationnement inclus",
  ]

  return (
    /* Wrapper relatif — l'annotation sort au-dessus sans être clippée */
    <div style={{ position: 'relative', height: '100%' }}>

      {/* ══════════════════════════════════════════════════════════
          ANNOTATION — GUIDE DE POSITIONNEMENT
          ══════════════════════════════════════════════════════════
          • bottom: 22   → monter = augmenter (ex: 40), descendre = réduire (ex: 10)
          • left: 6      → déplacer à droite = augmenter (ex: 30, 60...)
                           déplacer à gauche = réduire (ex: 0)

          BULLE (div juste après) :
          • marginLeft: 8   → décale la bulle à droite indépendamment de la flèche

          FLÈCHE LOTTIE (dotlottie-wc) :
          • width/height: '120px'       → taille de la flèche
          • speed="0.35"                → vitesse de boucle (0.2 = très lent, 1 = normal)
          • transform: 'scaleX(-1)'     → sens de la flèche
              scaleX(-1)          = pic vers droite
              scaleX(1)           = pic vers gauche (original)
              scaleY(-1)          = retourné verticalement
              scaleX(-1) scaleY(-1) = pic vers gauche en haut
          • rotate(Xdeg) dans le transform → incliner la flèche
              ex: 'scaleX(-1) rotate(-20deg)' = pic vers droite + incliné vers le haut
          • marginLeft: 10  → décale la flèche à droite indépendamment de la bulle
          ══════════════════════════════════════════════════════════ */}
      {/* ── Annotation — bulle et flèche indépendantes (position absolute chacune) ── */}
      {annotVisible && (<>

        {/* ── BULLE ── bottom / left à ajuster indépendamment */}
        <div className="email-annotation" style={{ position: 'absolute', bottom: -80, left: 10, zIndex: 21, pointerEvents: 'auto', cursor: 'default' }}
          onMouseEnter={() => setBubbleHover(true)}
          onMouseLeave={() => setBubbleHover(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '8px 16px',
            boxShadow: bubbleHover
              ? '0 8px 32px rgba(0,0,0,0.22)'
              : '0 4px 24px rgba(0,0,0,0.13)',
            fontSize: 13,
            fontWeight: 600,
            color: '#0f172a',
            whiteSpace: 'nowrap',
            transform: bubbleHover ? 'rotate(13deg) scale(1.06)' : 'rotate(10deg)',
            transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
          }}>
            Chaque bien a sa page à partager. <span style={{ textDecoration: 'underline', textDecorationColor: '#1E3A5F', textDecorationThickness: '2px', textUnderlineOffset: '3px' }}>Même celui-là.</span>
          </div>
        </div>

        {/* ── FLÈCHE ── bottom / left à ajuster indépendamment */}
        <div className="email-annotation" style={{ position: 'absolute', bottom: -60, left: 100, zIndex: 20, pointerEvents: 'none' }}>
          <dotlottie-wc
            ref={lottieRef}
            src="https://lottie.host/22a61234-8b4f-4788-915e-9137b050280b/1XOsfAVpEM.lottie"
            autoplay="true"
            speed="0.8"
            style={{ width: '120px', height: '120px', display: 'block', transform: 'scaleX(-1) rotate(2deg)' }}
          />
        </div>

      </>)}

    {/* fond gris comme le vrai email */}
    <div ref={scrollRef} style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif", background: '#F3F4F6', padding: '16px 8px', height: '100%', overflowX: 'hidden', overflowY: 'auto', borderRadius: 12 }}>

      {/* Container email — exact réplique du template backend */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: 540, margin: '0 auto' }}>

        {/* ── Logo bloc ── */}
        <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid #E5E7EB' }}>
          <img src={logoDemoUrl} alt="Azur Riviera Immobilier" style={{ height: 52, width: 'auto', display: 'block' }} />
        </div>

        {/* ── Header Band ── */}
        <div style={{ background: GRAD, padding: '16px 28px' }}>
          <p style={{ margin: 0, color: '#FFFFFF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Sélectionné pour vous
          </p>
        </div>

        {/* ── Intro ── */}
        <div style={{ padding: '24px 28px 18px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
            Bonjour M./Mme BENDAIF,
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
            Suite à notre échange, j'ai identifié un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention.
          </p>
        </div>

        {/* ── Property Card ── */}
        <div style={{ margin: '0 28px 18px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {/* header card */}
            <div style={{ background: GRAD, padding: '14px 20px' }}>
              <p style={{ margin: 0, color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
                Maison/villa à Fréjus
              </p>
            </div>
            {/* détails */}
            <div style={{ padding: '16px 20px' }}>
              {[['Prix', '288 750 €', true], ['Surface', '72 m²', false], ['Pièces', '3 pièces', false]].map(([k, v, big]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{k}</span>
                  <span style={{ fontSize: big ? 18 : 13, fontWeight: 700, color: big ? COLOR : '#111827' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Photo réelle du bien (ID 20) ── */}
        <div style={{ margin: '0 28px 18px', borderRadius: 12, overflow: 'hidden' }}>
          <img
            src="https://groupementprimmo.staticlbi.com/wa/images/biens/12/a250fab4a2c4b0dd44e7fbccc62d16de/photo_48347d1adc58ea2976500be9ddf894f5.jpg"
            alt="Maison/villa Fréjus"
            style={{ width: '100%', display: 'block', height: 160, objectFit: 'cover' }}
          />
        </div>

        {/* ── Analyse IA ── */}
        <div style={{ margin: '0 28px 18px', background: '#FAFAFA', borderRadius: 12, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: COLOR }}>Pourquoi ce bien pour vous ?</p>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#059669' }}>Ce qui correspond à votre recherche</p>
          {args.map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{a}</span>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div style={{ padding: '0 28px 20px', textAlign: 'center' }}>
          <a
            href={BIEN_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="email-cta-btn"
            style={{ display: 'inline-block', padding: '14px 40px', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 12, background: GRAD, boxShadow: '0 6px 20px rgba(30,58,95,0.35)' }}
          >
            Voir ce bien →
          </a>
          <div style={{ marginTop: 8 }}>
            <a href={BIEN_DEMO_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#9CA3AF', textDecoration: 'underline' }}>
              Ouvrir dans votre navigateur
            </a>
          </div>
        </div>

        {/* ── Fermeture ── */}
        <div style={{ padding: '0 28px 24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
            Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>À très bientôt,</p>
        </div>

        {/* ── Signature ── */}
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ borderLeft: `3px solid ${COLOR}`, paddingLeft: 14 }}>
            <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Sophie Laurent</p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6B7280' }}>Conseillère immobilier</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: '#374151' }}>
              12 avenue de la Corniche, 83600 Fréjus<br />
              <span style={{ color: COLOR, fontWeight: 500 }}>04 94 XX XX XX</span>
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '14px 28px' }}>
          <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: '#9CA3AF', textAlign: 'center' }}>
            Vous recevez cet email car vous avez effectué une recherche immobilière auprès de notre agence.<br />
            Pour ne plus recevoir nos propositions, répondez STOP à cet email.
          </p>
        </div>

      </div>
    </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────── */

function BiensMock() {
  const biens = [
    { ref: 'AP-4821', type: 'Appartement',  ville: 'Fréjus',           surface: '34.48 m²', prix: '125 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/12/451ce046a0e41bcad3512ad26ea6e012/photo_2608d3bd31121c2f8ed8d7df12d23cfb.jpg' },
    { ref: 'MV-1093', type: 'Maison/villa', ville: 'Fréjus',           surface: '72 m²',    prix: '288 750 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/12/a250fab4a2c4b0dd44e7fbccc62d16de/photo_48347d1adc58ea2976500be9ddf894f5.jpg' },
    { ref: 'AP-3307', type: 'Appartement',  ville: 'Saint-Raphaël',    surface: '49 m²',    prix: '169 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/6/1d1c9013fe12fd33e556482df1315df4/photo_eb7aaaa0d583d7a7df2d208cd04c4bd7.png' },
    { ref: 'AP-7754', type: 'Appartement',  ville: 'Agay',             surface: '27.34 m²', prix: '165 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/7/99c18db26bdddf8af44b50d7e4634c99/photo_baea1dab07b245ccd532c47b45d3afff.jpg' },
    { ref: 'MV-2248', type: 'Maison/villa', ville: 'Bagnols-en-Forêt', surface: '130 m²',   prix: '580 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/10/b65839405141bda0d653bed097312829/photo_efdd4482865e6f34cc296cef5f960855.jpg' },
    { ref: 'AP-5561', type: 'Appartement',  ville: 'Saint-Raphaël',    surface: '140 m²',   prix: '399 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/6/925be20d620fea5d48cdf3bdf92a39ce/photo_5cb4bf9fce9829fcbf57fec2bbf5c746.jpg' },
    { ref: 'AP-6690', type: 'Appartement',  ville: 'Grimaud',          surface: '49 m²',    prix: '595 000 €', photo: 'https://groupementprimmo.staticlbi.com/wa/images/biens/11/6838bbb9f22063de6c9634c3f52be2db/photo_9e6929e4cc450f90ea870c311882d934.png' },
  ]

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Biens</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>131 actifs</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['Tous', 'Saint François Immo', 'Partenaires'].map((t, idx) => (
            <span key={t} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: idx === 0 ? '#1E3A5F' : '#f1f5f9', color: idx === 0 ? '#fff' : '#64748b' }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 0.9fr 1fr', gap: 6, padding: '7px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {['Bien', 'Localisation', 'Surface', 'Prix'].map(c => (
          <span key={c} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c}</span>
        ))}
      </div>

      {biens.map((b, idx) => (
        <div key={idx} className="matching-row" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 0.9fr 1fr', gap: 6, padding: '8px 16px', borderBottom: '1px solid #f8fafc', alignItems: 'center', animationDelay: `${200 + idx * 120}ms` }}>
          {/* Photo + type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 38, height: 30, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={b.photo}
                alt={b.type}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1E3A5F', lineHeight: 1.2 }}>{b.type}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Réf. {b.ref}</div>
            </div>
          </div>
          {/* Ville */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="#94a3b8" strokeWidth="2"/>
            </svg>
            <span style={{ fontSize: 11, color: '#64748b' }}>{b.ville}</span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>{b.surface}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A5F' }}>{b.prix}</span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────── */

function DashboardMock() {
  const kpis = [
    { label: 'Prospects', value: '57',  color: '#3b82f6', bg: '#eff6ff', badge: '4 à analyser',      bC: '#d97706', bBg: '#fef3c7',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
    { label: 'Biens',      value: '130', color: '#10b981', bg: '#f0fdf4', badge: 'Groupement Primmo', bC: '#2563eb', bBg: '#eff6ff',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="2"/></svg> },
    { label: 'Excellents', value: '97',  color: '#7c3aed', bg: '#f5f3ff', badge: '37% du total',      bC: '#7c3aed', bBg: '#f5f3ff', bar: 37,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
    { label: 'Score IA',   value: '64',  color: '#f59e0b', bg: '#fffbeb', badge: '398 matchings',     bC: '#6b7280', bBg: '#f9fafb', bar: 64,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ]

  const matches = [
    { score: 94, nom: 'Mme Marchand Sophie',  bien: 'Maison/villa · Fréjus',       budget: '250 000 €', top: true  },
    { score: 88, nom: 'Mr Legrand Antoine',   bien: 'Appartement · Saint-Raphaël', budget: '450 000 €', top: false },
    { score: 85, nom: 'Mme Torres Elena',     bien: 'Maison/villa · Agay',          budget: '160 000 €', top: false },
    { score: 82, nom: 'Mr Blanchard Luc',     bien: 'Appartement · Fréjus',         budget: '410 000 €', top: false },
  ]

  const distrib = [
    { label: '90-100', color: '#059669', pct: 72 },
    { label: '80-89',  color: '#10b981', pct: 88 },
    { label: '70-79',  color: '#34d399', pct: 55 },
    { label: '60-69',  color: '#f59e0b', pct: 40 },
    { label: '50-59',  color: '#fbbf24', pct: 28 },
    { label: '< 50',   color: '#f87171', pct: 18 },
  ]

  const topBiens = [
    { rank: 1, label: 'Appartement · Fréjus',         prix: '125 000 €', matchs: 14 },
    { rank: 2, label: 'Maison/villa · Saint-Raphaël', prix: '399 000 €', matchs: 11 },
    { rank: 3, label: 'Appartement · Agay',           prix: '165 000 €', matchs:  9 },
  ]

  const sColor = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const rankColor = i => i === 0 ? '#F5C518' : i === 1 ? '#A8A9AD' : i === 2 ? '#CD7F32' : '#cbd5e1'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, padding: '12px 12px 8px' }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '10px 10px 8px', border: '1px solid #edf1f7', borderTop: `2.5px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 99, background: k.bBg, color: k.bC, lineHeight: 1.4, textAlign: 'right', maxWidth: 68 }}>{k.badge}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1, marginBottom: 2 }}>{k.value}</div>
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500, marginBottom: k.bar ? 6 : 0 }}>{k.label}</div>
            {k.bar && <div style={{ height: 2.5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 99, background: k.color, width: `${k.bar}%` }} /></div>}
          </div>
        ))}
      </div>

      {/* ── Alerte ── */}
      <div style={{ margin: '0 12px 8px', padding: '7px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="dash-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#92400e', fontWeight: 500, flex: 1 }}><strong>4 prospects</strong> en attente d'analyse IA</span>
        <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Analyser</span>
      </div>

      {/* ── Grille 3/2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 8, margin: '0 12px 8px' }}>

        {/* À contacter */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #edf1f7' }}>
          <div style={{ padding: '9px 13px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F' }}>À contacter en priorité</div>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>4 meilleurs matchs</div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>Tout voir →</span>
          </div>
          {matches.map((m, i) => (
            <div key={i} style={{ padding: '8px 13px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: i < matches.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg,${sColor(m.score)},${sColor(m.score)}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>{m.score}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</span>
                  {m.top && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: '#f0fdf4', color: '#059669', flexShrink: 0 }}>❤ COUP DE CŒUR</span>}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{m.bien} · {m.budget}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#10b981" strokeWidth="2"/></svg>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#3b82f6" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="#3b82f6" strokeWidth="2"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Qualité des matchs */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #edf1f7' }}>
            <div style={{ padding: '9px 13px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F' }}>Qualité des matchs</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1E3A5F' }}>64<span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>/100</span></span>
            </div>
            <div style={{ padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {distrib.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', width: 36, flexShrink: 0 }}>{d.label}</span>
                  <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: d.color, width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biens les plus demandés */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #edf1f7', flex: 1 }}>
            <div style={{ padding: '9px 13px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F' }}>Biens les plus demandés</div>
            </div>
            {topBiens.map((b, i) => (
              <div key={i} style={{ padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: i < topBiens.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 800, width: 16, flexShrink: 0, color: rankColor(i) }}>#{b.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1E3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{b.prix}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#f5f3ff', color: '#7c3aed', flexShrink: 0 }}>{b.matchs} matchs</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   DONNÉES — 5 features
   ════════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    id: 'matching',
    label: 'Matching IA',
    title: 'Le bon acheteur, pour le bon bien.',
    description: "ImmoMatch croise budget, localisation et style de vie, puis attribue un score /100 à chaque paire. Les meilleures remontent toutes seules — toi tu valides.",
    proof: "Score calculé en temps réel sur l'ensemble de ton portefeuille",
    Mock: MatchingMock,
    height: 420,
    scrollable: false,
    rotation: -1.5,
    reversed: false,
    glow: true,
  },
  {
    id: 'chat',
    label: 'Agent IA conversationnel',
    title: 'Tu lui parles. Il connaît ton stock par cœur.',
    description: '"Quel bien pour Sophie, budget 350k, cherche du calme et un garage ?" — une question, une réponse en quelques secondes. Comme un collègue qui aurait tout mémorisé.',
    proof: "Répond sur l'ensemble du catalogue en moins de 5 secondes",
    Mock: ChatMock,
    height: 420,
    scrollable: false,
    rotation: 1.5,
    reversed: true,
    glow: true,
  },
  {
    id: 'email',
    label: 'Emails générés automatiquement',
    title: "L'email est déjà écrit. Il t'attend.",
    description: "ImmoMatch rédige un email personnalisé avec les vrais arguments du bien — prix, surface, emplacement. Tu relis en 30 secondes, tu envoies.",
    proof: "Email prêt en moins de 10 secondes, personnalisé par bien et acheteur",
    Mock: EmailMock,
    height: 480,
    scrollable: true,
    rotation: 0,
    reversed: false,
    glow: true,
  },
  {
    id: 'biens',
    label: 'Import de biens',
    title: 'Ton portefeuille se met à jour tout seul.',
    description: "Tu uploades un Excel, ou rien du tout si la synchro est activée. Tes biens sont là, prêts à être matchés. Zéro double saisie.",
    proof: 'Compatible Excel, CSV et synchronisation automatique',
    Mock: BiensMock,
    height: 390,
    scrollable: false,
    rotation: 1.5,
    reversed: true,
    glow: true,
  },
  {
    id: 'dashboard',
    label: 'Dashboard & analytics',
    title: 'Tu sais exactement où tu en es.',
    description: "Matchings lancés, performance par agent, biens les plus demandés — pas pour faire joli, pour savoir où donner un coup de main.",
    proof: 'Données mises à jour en temps réel',
    Mock: DashboardMock,
    height: 462,
    scrollable: false,
    rotation: -1.5,
    reversed: false,
    glow: true,
  },
]

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════════ */

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="rgba(56,189,248,0.12)" />
      <path d="M5.5 9l2.5 2.5L12.5 7" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FeaturesSection() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const blocks = sectionRef.current?.querySelectorAll('.feature-block')
    if (!blocks?.length) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    blocks.forEach(b => observer.observe(b))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" ref={sectionRef} style={{ background: '#f8fafc', padding: '6rem 1.5rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* En-tête */}
        <div className="feature-block" style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
          <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18, fontFamily: 'Inter, sans-serif' }}>
            Fonctionnalités
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', margin: '0 0 0.75rem', fontFamily: 'Inter, sans-serif' }}>
            On a gardé ce qui change vraiment ta semaine.
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Tout ce dont un agent a besoin. Rien de superflu.
          </p>
        </div>

        {/* Blocs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem' }}>
          {FEATURES.map((feat, i) => {
            const Mock = feat.Mock
            return (
              <div key={feat.id} className="feature-block" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="feature-row" style={{ flexDirection: feat.reversed ? 'row-reverse' : 'row' }}>

                  {/* ── Visuel mock ── */}
                  {/*
                    Orbs OUTSIDE du div filtré : filter:drop-shadow crée un
                    contexte d'isolation qui clipe les enfants absolus.
                    On enveloppe dans un wrapper positionné neutre.
                  */}
                  <div className="feature-img-outer" style={{ position: 'relative' }}>

                    {/* Orbs multicouleur — en dehors du filtre, z-index explicite */}
                    {feat.glow && <>
                      <div style={{ position: 'absolute', zIndex: 0, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 65%)', filter: 'blur(55px)', top: '-20%', left: '-15%', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', zIndex: 0, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.50) 0%, transparent 65%)', filter: 'blur(50px)', bottom: '-18%', right: '-10%', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', zIndex: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 65%)', filter: 'blur(45px)', top: '30%', left: '42%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', zIndex: 0, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.40) 0%, transparent 65%)', filter: 'blur(40px)', bottom: '8%', left: '-10%', pointerEvents: 'none' }} />
                    </>}

                    {/* Card au-dessus des orbs via z-index */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div className="feature-mock-card" style={{
                        borderRadius: 12,
                        /* email (scrollable:true) : visible → annotation absolue peut sortir */
                        overflow: feat.scrollable ? 'visible' : 'hidden',
                        transform: feat.rotation !== 0 ? `rotate(${feat.rotation}deg) translateZ(0)` : 'none',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                        height: feat.height,
                      }}>
                        <Mock />
                      </div>
                    </div>

                  </div>

                  {/* ── Texte ── */}
                  <div className="feature-text">
                    <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                      {feat.label}
                    </span>
                    <h3 style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', lineHeight: 1.2, margin: '0 0 1rem', fontFamily: 'Inter, sans-serif' }}>
                      {feat.title}
                    </h3>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.85, margin: '0 0 1.5rem', fontFamily: 'Inter, sans-serif' }}>
                      {feat.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckIcon />
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                        {feat.proof}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
