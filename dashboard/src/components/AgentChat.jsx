import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { useAgency } from '../contexts/AgencyContext'
import { apiFetch } from '../api'

// ── Message individuel ────────────────────────────────────────────────────────
function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`
        shrink-0 w-7 h-7 rounded-full flex items-center justify-center
        ${isBot ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}
      `}>
        {isBot ? <Bot size={14} /> : <User size={14} />}
      </div>

      {/* Bulle */}
      <div className={`
        max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed
        ${isBot
          ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
          : 'bg-blue-600 text-white rounded-tr-sm'}
        ${msg.loading ? 'animate-pulse' : ''}
      `}>
        {/* Formatage markdown basique */}
        {msg.text.split('\n').map((line, i) => {
          // Gras **texte**
          const parts = line.split(/(\*\*[^*]+\*\*)/g)
          return (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j}>{part.slice(2, -2)}</strong>
                  : part
              )}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── Widget principal ──────────────────────────────────────────────────────────
export default function AgentChat() {
  const { agency } = useAgency()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Bonjour ! Je suis votre assistant ${agency?.nom_court || 'immobilier'}. Comment puis-je vous aider ?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send() {
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    // Placeholder "en train d'écrire..."
    setMessages(prev => [...prev, { role: 'bot', text: '...', loading: true }])

    try {
      const res = await apiFetch('/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          agency_slug: agency?.slug || 'saint_francois',
        }),
      })

      if (!res.ok) throw new Error('Erreur serveur')

      // Lecture du stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })

        // Met à jour le dernier message en temps réel
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'bot', text: fullText, loading: false },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'bot', text: "Désolé, une erreur s'est produite. Réessayez dans un instant." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-xl
          bg-blue-600 hover:bg-blue-700 text-white
          flex items-center justify-center
          transition-all duration-200
          ${open ? 'scale-90' : 'scale-100 hover:scale-105'}
        `}
        title="Assistant IA"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {/* Badge notification si fermé */}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Fenêtre de chat ── */}
      {open && (
        <div className={`
          fixed bottom-24 right-6 z-50
          w-80 sm:w-96 h-[500px]
          bg-white rounded-2xl shadow-2xl border border-slate-200
          flex flex-col overflow-hidden
          animate-in slide-in-from-bottom-4 duration-200
        `}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Assistant IA</p>
              <p className="text-blue-200 text-xs">{agency?.nom_court || 'ImmoMatch'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-blue-200 text-xs">En ligne</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {/* Indicateur de frappe */}
            {loading && messages[messages.length - 1]?.loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs">
                <Loader2 size={12} className="animate-spin" />
                <span>L'assistant rédige...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Posez votre question..."
                rows={1}
                disabled={loading}
                className="
                  flex-1 resize-none rounded-xl border border-slate-200
                  px-3 py-2 text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-slate-400
                  disabled:opacity-50
                  max-h-24 overflow-auto
                "
                style={{ scrollbarWidth: 'thin' }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="
                  shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700
                  text-white flex items-center justify-center
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {loading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </div>
            <p className="text-center text-slate-400 text-[10px] mt-2">
              Propulsé par Claude AI · Données en temps réel
            </p>
          </div>
        </div>
      )}
    </>
  )
}
