import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAgency } from '../contexts/AgencyContext'
import { useTheme } from '../contexts/ThemeContext'
import { apiFetch } from '../api'

// ── Animations CSS injectées une seule fois ───────────────────────────────────
const STYLES = `
@keyframes wave-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes wave-spin-rev {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}
@keyframes pulse-ring {
  0%, 100% { opacity: .55; transform: scale(1); }
  50%       { opacity: .9;  transform: scale(1.08); }
}
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
.agent-chat-in   { animation: chat-in .22s cubic-bezier(.22,1,.36,1) both; }
.agent-msg-in    { animation: msg-in .18s ease both; }
.bot-eye         { animation: blink 4s ease-in-out infinite; transform-origin: center; }
.bot-float       { animation: float 3s ease-in-out infinite; }
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

// ── Bouton flottant avec effet wave ───────────────────────────────────────────
function WaveButton({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Assistant IA"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 50,
        width: 56, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        outline: 'none',
      }}
    >
      {/* Anneau wave tournant — couche 1 */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #10b981, #6366f1)',
          animation: 'wave-spin 3s linear infinite, pulse-ring 2.4s ease-in-out infinite',
          filter: 'blur(1px)',
        }}
      />
      {/* Anneau wave tournant — couche 2 contrerotation */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: -2,
          borderRadius: '50%',
          background: 'conic-gradient(from 180deg, #818cf8 0%, transparent 40%, #22d3ee 60%, transparent 80%, #818cf8 100%)',
          animation: 'wave-spin-rev 4s linear infinite',
          opacity: .6,
        }}
      />
      {/* Fond principal */}
      <span
        style={{
          position: 'relative', zIndex: 1,
          width: 52, height: 52,
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg,#1e1b4b,#312e81)'
            : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .3s',
          boxShadow: '0 4px 20px rgba(99,102,241,.45)',
        }}
      >
        {open ? <X size={20} color="white" /> : <BotFace size={34} />}
      </span>
      {/* Point vert online */}
      {!open && (
        <span style={{
          position: 'absolute', top: 2, right: 2, zIndex: 2,
          width: 11, height: 11, borderRadius: '50%',
          background: '#34d399',
          border: '2px solid white',
          boxShadow: '0 0 6px rgba(52,211,153,.7)',
        }} />
      )}
    </button>
  )
}

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
      <WaveButton open={open} onClick={() => setOpen(o => !o)} />

      {open && (
        <div
          className="agent-chat-in"
          style={{
            position: 'fixed', bottom: 96, right: 24, zIndex: 50,
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
