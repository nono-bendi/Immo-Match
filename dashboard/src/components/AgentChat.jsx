import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAgency } from '../contexts/AgencyContext'
import { useTheme } from '../contexts/ThemeContext'
import { apiFetch } from '../api'

// ── Animations CSS injectées une seule fois ───────────────────────────────────
const STYLES = `
@keyframes chat-in {
  0%   { opacity: 0; transform: translateY(18px) scale(.96); }
  100% { opacity: 1; transform: translateY(0)   scale(1); }
}
@keyframes msg-in {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95%           { transform: scaleY(0.1); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-3px); }
}
@keyframes ai-rotate { from{transform:translateX(-50%) translateY(-50%) rotate(360deg)} to{transform:translateX(-50%) translateY(-50%) rotate(0)} }
@keyframes ai-blink  { 46%{height:26px} 48%{height:10px} 50%{height:26px} 96%{height:26px} 98%{height:10px} 100%{height:26px} }
.agent-chat-in { animation: chat-in .22s cubic-bezier(.22,1,.36,1) both; }
.agent-msg-in  { animation: msg-in .18s ease both; }
.bot-eye       { animation: blink 4s ease-in-out infinite; transform-origin: center; }
.bot-float     { animation: float 3s ease-in-out infinite; }

/* ── Uiverse card button ── */
.ai-tilt{--perspective:1000px;--ty:25px;position:absolute;inset:-2rem;display:grid;grid-template-columns:repeat(5,1fr);transform-style:preserve-3d;}
.ai-wrap{display:flex;align-items:center;justify-content:center;position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-50%);z-index:9;transform-style:preserve-3d;cursor:pointer;padding:3px;transition:all .3s ease;}
.ai-wrap:hover{padding:0;}
.ai-wrap:active{transform:translateX(-50%) translateY(-50%) scale(.95);}
.ai-wrap::after{content:"";position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-55%);width:6rem;height:5.5rem;background:#dedfe0;border-radius:1.6rem;transition:all .3s ease;}
.ai-wrap:hover::after{transform:translateX(-50%) translateY(-50%);height:6rem;}
.ai-card{width:6rem;height:6rem;transform-style:preserve-3d;will-change:transform;transition:all .6s ease;border-radius:1.6rem;display:flex;align-items:center;justify-content:center;transform:translateZ(25px);}
.ai-card:hover{box-shadow:0 8px 30px rgba(0,0,60,.25),inset 0 0 8px rgba(255,255,255,.5);}
.ai-balls-bg{position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-50%);width:100%;height:100%;z-index:-10;border-radius:1.6rem;transition:all .3s ease;background:rgba(255,255,255,.8);overflow:hidden;}
.ai-balls-ring{position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-50%);animation:ai-rotate 10s linear infinite;}
.ai-wrap:hover .ai-balls-ring{animation-play-state:paused;}
.ai-ball{width:3rem;height:3rem;position:absolute;border-radius:50%;filter:blur(18px);}
.ai-ball.rosa  {top:50%;left:0;transform:translateY(-50%);background:#ec4899;}
.ai-ball.violet{top:0;left:50%;transform:translateX(-50%);background:#9147ff;}
.ai-ball.green {bottom:0;left:50%;transform:translateX(-50%);background:#34d399;}
.ai-ball.cyan  {top:50%;right:0;transform:translateY(-50%);background:#05e0f5;}
.ai-face{width:6rem;height:6rem;display:flex;border-radius:1.6rem;overflow:hidden;}
.ai-face-inner{width:100%;height:100%;backdrop-filter:blur(50px);position:relative;}
.ai-eyes{position:absolute;left:50%;bottom:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;height:26px;gap:1rem;transition:all .3s ease;}
.ai-eye{width:13px;height:26px;background:#fff;border-radius:8px;animation:ai-blink 10s infinite linear;}
.ai-happy{position:absolute;left:50%;bottom:50%;transform:translateX(-50%);display:none;align-items:center;justify-content:center;height:26px;color:#fff;}
.ai-happy svg{width:30px;}
.ai-wrap:hover .ai-eye{display:none;}
.ai-wrap:hover .ai-happy{display:flex;}
.ai-area:nth-child(15):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(-15deg) rotateY(15deg) translateZ(var(--ty));}
.ai-area:nth-child(14):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(-15deg) rotateY(7deg) translateZ(var(--ty));}
.ai-area:nth-child(13):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(-15deg) rotateY(0) translateZ(var(--ty));}
.ai-area:nth-child(12):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(-15deg) rotateY(-7deg) translateZ(var(--ty));}
.ai-area:nth-child(11):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(-15deg) rotateY(-15deg) translateZ(var(--ty));}
.ai-area:nth-child(10):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(0) rotateY(15deg) translateZ(var(--ty));}
.ai-area:nth-child(9):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(0) rotateY(7deg) translateZ(var(--ty));}
.ai-area:nth-child(8):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(0) rotateY(0) translateZ(var(--ty));}
.ai-area:nth-child(7):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(0) rotateY(-7deg) translateZ(var(--ty));}
.ai-area:nth-child(6):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(0) rotateY(-15deg) translateZ(var(--ty));}
.ai-area:nth-child(5):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(15deg) rotateY(15deg) translateZ(var(--ty));}
.ai-area:nth-child(4):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(15deg) rotateY(7deg) translateZ(var(--ty));}
.ai-area:nth-child(3):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(15deg) rotateY(0) translateZ(var(--ty));}
.ai-area:nth-child(2):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(15deg) rotateY(-7deg) translateZ(var(--ty));}
.ai-area:nth-child(1):hover~.ai-wrap .ai-card{transform:perspective(var(--perspective)) rotateX(15deg) rotateY(-15deg) translateZ(var(--ty));}
`

function StyleInjector() {
  useEffect(() => {
    const id = 'agent-chat-styles'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = STYLES
      document.head.appendChild(s)
    }
  }, [])
  return null
}

// ── Personnage mascotte SVG ───────────────────────────────────────────────────
function BotFace({ size = 28, animated = false }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'bot-float' : ''}
    >
      {/* Antenne */}
      <line x1="20" y1="3" x2="20" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="2.5" r="2" fill="#a5f3fc" />

      {/* Corps / tête arrondie */}
      <rect x="7" y="9" width="26" height="22" rx="8" fill="white" fillOpacity=".95" />

      {/* Oreilles / prises */}
      <rect x="4" y="15" width="3.5" height="7" rx="1.5" fill="white" fillOpacity=".6" />
      <rect x="32.5" y="15" width="3.5" height="7" rx="1.5" fill="white" fillOpacity=".6" />

      {/* Yeux */}
      <rect
        className="bot-eye"
        x="12.5" y="16" width="5" height="6" rx="2.5"
        fill="#4f46e5"
      />
      <rect
        className="bot-eye"
        x="22.5" y="16" width="5" height="6" rx="2.5"
        fill="#4f46e5"
        style={{ animationDelay: '.15s' }}
      />
      {/* Reflets yeux */}
      <circle cx="14" cy="17.5" r="1" fill="white" fillOpacity=".7" />
      <circle cx="24" cy="17.5" r="1" fill="white" fillOpacity=".7" />

      {/* Bouche souriante */}
      <path
        d="M14.5 26 Q20 30.5 25.5 26"
        stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"
        fill="none"
      />

      {/* Petits points déco joues */}
      <circle cx="11" cy="25" r="1.5" fill="#f9a8d4" fillOpacity=".7" />
      <circle cx="29" cy="25" r="1.5" fill="#f9a8d4" fillOpacity=".7" />
    </svg>
  )
}

const HAPPY_PATH = "M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z"

// ── Mini-carte bien ───────────────────────────────────────────────────────────
function BienCard({ line, dark, onNavigate, biens }) {
  const [hovered, setHovered] = useState(false)

  // Split uniquement sur — et – (pas sur - pour préserver les noms de villes)
  const clean = line.replace(/^[-•]\s*/, '')
  const parts = clean.split(/\s*[—–]\s*/)
  const ville = parts[0]?.trim() || ''
  const surface = parts.find(p => /m²/.test(p)) || ''
  const prixPart = parts.find(p => /€/.test(p)) || ''
  const prixNum = parseFloat(prixPart.replace(/[^\d]/g, '')) || 0

  // Référence : dans le texte du bot ou fallback match par ville+prix
  let ref = parts.find(p => /^[A-Z]{2,4}\d{5,}/.test(p.trim()))?.trim() || ''
  if (!ref && biens?.length && prixNum > 0) {
    const match = biens.find(b => {
      const bVille = (b.ville || '').toLowerCase()
      const cVille = ville.toLowerCase()
      const sameVille = bVille.includes(cVille) || cVille.includes(bVille) || cVille.split('-').some(w => w.length > 3 && bVille.includes(w))
      const samePrix = Math.abs((b.prix || 0) - prixNum) < 5000
      return sameVille && samePrix
    })
    if (match) ref = match.reference || ''
  }

  const clickable = !!ref

  return (
    <div
      onClick={() => clickable && onNavigate && onNavigate(ref)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={clickable ? 'Voir la fiche complète' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', margin: '3px 0',
        borderRadius: 10,
        background: hovered && clickable
          ? (dark ? 'rgba(99,102,241,.18)' : '#ede9fe')
          : (dark ? 'rgba(255,255,255,.06)' : '#f8fafc'),
        border: `1px solid ${hovered && clickable ? '#a5b4fc' : (dark ? 'rgba(255,255,255,.1)' : '#e2e8f0')}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all .15s',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: clickable ? '#4f46e5' : '#94a3b8' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: dark ? '#e2e8f0' : '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ville}
        </span>
        {surface && <span style={{ fontSize: 10, color: dark ? '#94a3b8' : '#64748b' }}>{surface}</span>}
      </div>
      {prixPart && (
        <span style={{
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
          padding: '2px 6px', borderRadius: 6,
          background: dark ? 'rgba(99,102,241,.25)' : '#ede9fe', color: '#4f46e5',
        }}>
          {prixPart}
        </span>
      )}
      {clickable && (
        <span style={{
          fontSize: 12, flexShrink: 0,
          color: hovered ? '#4f46e5' : (dark ? '#475569' : '#94a3b8'),
          transition: 'color .15s',
        }}>→</span>
      )}
    </div>
  )
}

// ── Rendu d'une ligne de texte ────────────────────────────────────────────────
function RenderLine({ line, i, dark, onNavigate, biens }) {
  const isBienLine = /^[-•]\s/.test(line) && /€/.test(line)
  if (isBienLine) return <BienCard key={i} line={line} dark={dark} onNavigate={onNavigate} biens={biens} />

  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  const content = parts.map((part, j) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={j}>{part.slice(2, -2)}</strong>
      : part
  )

  if (/^[-•]\s/.test(line)) {
    return (
      <p key={i} style={{ margin: i > 0 ? '3px 0 0' : 0, paddingLeft: 10, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, color: '#4f46e5' }}>·</span>
        {content}
      </p>
    )
  }
  return <p key={i} style={{ margin: i > 0 ? '4px 0 0' : 0 }}>{content}</p>
}

// ── Bulle de message ──────────────────────────────────────────────────────────
function Message({ msg, dark, onNavigate, biens }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`agent-msg-in flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0,
        width: 28, height: 28, borderRadius: '50%',
        background: isBot
          ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
          : dark ? 'linear-gradient(135deg,#1e3a5f,#2d5a8a)' : 'linear-gradient(135deg,#0f172a,#1e293b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isBot ? '0 2px 8px rgba(99,102,241,.4)' : 'none',
      }}>
        {isBot
          ? <BotFace size={22} />
          : <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Vous</span>
        }
      </div>

      {/* Bulle */}
      <div style={{
        maxWidth: '82%',
        borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        padding: '8px 12px',
        fontSize: 13,
        lineHeight: 1.55,
        background: isBot
          ? (dark ? '#1a2a3a' : 'white')
          : 'linear-gradient(135deg,#4f46e5,#6d28d9)',
        color: isBot ? (dark ? '#e2e8f0' : '#1e293b') : 'white',
        border: isBot ? `1px solid ${dark ? 'rgba(255,255,255,.08)' : '#e2e8f0'}` : 'none',
        boxShadow: isBot
          ? '0 1px 4px rgba(0,0,0,.06)'
          : '0 2px 10px rgba(99,102,241,.35)',
        opacity: msg.loading ? .6 : 1,
      }}>
        {msg.text.split('\n').map((line, i) =>
          <RenderLine key={i} line={line} i={i} dark={dark} onNavigate={onNavigate} biens={biens} />
        )}
      </div>
    </div>
  )
}

// ── Widget principal ──────────────────────────────────────────────────────────
export default function AgentChat() {
  const { agency } = useAgency()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Bonjour ! Comment puis-je vous aider ?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [biens, setBiens] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Charge les biens pour le matching de références dans les cartes
  useEffect(() => {
    apiFetch('/biens').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setBiens(data)
    }).catch(() => {})
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120) }, [open])

  async function send() {
    const question = input.trim()
    if (!question || loading) return
    setInput('')
    const history = messages.filter(m => m.text && m.text !== '...')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)
    setMessages(prev => [...prev, { role: 'bot', text: '...', loading: true }])
    try {
      const res = await apiFetch('/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, agency_slug: agency?.slug || 'saint_francois', history }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => [...prev.slice(0, -1), { role: 'bot', text: fullText }])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'bot', text: "Une erreur s'est produite. Réessayez dans un instant." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <StyleInjector />

      {/* ── Bouton Uiverse card (apparence) ── */}
      <div style={{ position: 'fixed', bottom: 40, right: 40, zIndex: 50, width: '6rem', height: '6rem' }}>
        <div className="ai-tilt">
          {[...Array(15)].map((_, i) => <div key={i} className="ai-area" />)}
          <div className="ai-wrap" onClick={() => setOpen(o => !o)}>
            <div className="ai-card">
              <div className="ai-balls-bg">
                <div className="ai-balls-ring">
                  <span className="ai-ball rosa" />
                  <span className="ai-ball violet" />
                  <span className="ai-ball green" />
                  <span className="ai-ball cyan" />
                </div>
              </div>
              <div className="ai-face">
                <div className="ai-face-inner">
                  {open ? (
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: 'white', fontSize: 32, lineHeight: 1, userSelect: 'none' }}>✕</div>
                  ) : (
                    <>
                      <div className="ai-eyes">
                        <span className="ai-eye" />
                        <span className="ai-eye" style={{ animationDelay: '.3s' }} />
                      </div>
                      <div className="ai-happy">
                        <svg fill="none" viewBox="0 0 24 24"><path fill="currentColor" d={HAPPY_PATH} /></svg>
                        <svg fill="none" viewBox="0 0 24 24"><path fill="currentColor" d={HAPPY_PATH} /></svg>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="agent-chat-in"
          style={{
            position: 'fixed', bottom: 160, right: 40, zIndex: 50,
            width: 360, height: 500,
            borderRadius: 20,
            background: dark ? '#0d1826' : '#f8fafc',
            boxShadow: dark
              ? '0 24px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(99,102,241,.2)'
              : '0 24px 60px rgba(0,0,0,.18), 0 0 0 1px rgba(99,102,241,.12)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg,#4338ca,#6d28d9)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {/* Icône */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,.2)',
            }}>
              <BotFace size={28} animated />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>Assistant IA</div>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 11 }}>
                {agency?.nom_court || 'ImmoFlash'}
              </div>
            </div>
            {/* Indicateur online */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 5px rgba(52,211,153,.8)',
              }} />
              <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>En ligne</span>
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
            background: dark
              ? 'linear-gradient(180deg,#0a1520 0%,#0d1826 100%)'
              : 'linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%)',
          }}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} dark={dark} biens={biens} onNavigate={ref => {
                navigate(`/biens?ref=${ref}`)
                setOpen(false)
              }} />
            ))}
            {loading && messages[messages.length - 1]?.loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyse en cours...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div style={{
            padding: '10px 12px 12px',
            background: dark ? '#0d1826' : 'white',
            borderTop: `1px solid ${dark ? 'rgba(255,255,255,.08)' : '#e2e8f0'}`,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Posez votre question..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1, resize: 'none',
                  border: `1.5px solid ${dark ? 'rgba(255,255,255,.12)' : '#e2e8f0'}`,
                  borderRadius: 12, padding: '8px 12px', fontSize: 13,
                  color: dark ? '#e2e8f0' : '#1e293b',
                  background: dark ? '#0a1520' : 'white',
                  outline: 'none', maxHeight: 80,
                  overflowY: 'auto', lineHeight: 1.45,
                  transition: 'border-color .15s',
                  fontFamily: 'inherit',
                  opacity: loading ? .5 : 1,
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = dark ? 'rgba(255,255,255,.12)' : '#e2e8f0'}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                  background: (!input.trim() || loading)
                    ? (dark ? 'rgba(255,255,255,.08)' : '#e2e8f0')
                    : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .2s',
                  boxShadow: (!input.trim() || loading) ? 'none' : '0 2px 8px rgba(99,102,241,.4)',
                }}
              >
                {loading
                  ? <Loader2 size={14} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={14} color={(!input.trim()) ? '#94a3b8' : 'white'} />
                }
              </button>
            </div>
            <div style={{ textAlign: 'center', color: dark ? 'rgba(255,255,255,.2)' : '#cbd5e1', fontSize: 10, marginTop: 7 }}>
              Propulsé par Claude AI · Données en temps réel
            </div>
          </div>
        </div>
      )}
    </>
  )
}
