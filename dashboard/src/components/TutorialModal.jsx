// =====================================================
// src/components/TutorialModal.jsx — v3
// =====================================================

import { useState, useEffect, useRef } from 'react'
import {
  X, ChevronRight, ChevronLeft, Sparkles,
  User, Save, Send, Eye, Edit3, Mail,
  CheckCircle2, ArrowRight, Plus,
  Home, Target, BarChart2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── Typewriter ───────────────────────────────────────
function TypewriterText({ text, speed = 55, active }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    setDisplayed('')
    let i = 0
    const t = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(t)
    }, speed)
    return () => clearInterval(t)
  }, [text, speed, active])
  return <>{displayed}</>
}

// ─── SLIDE 0 — Bienvenue ──────────────────────────────
const PARTICLES = [
  { size: 5, color: '#6366f1', x: 12, y: 18, dur: 3.2 },
  { size: 3, color: '#10b981', x: 78, y: 25, dur: 4.1 },
  { size: 6, color: '#f59e0b', x: 55, y: 72, dur: 3.7 },
  { size: 4, color: '#7c3aed', x: 88, y: 60, dur: 4.8 },
  { size: 3, color: '#6366f1', x: 25, y: 80, dur: 3.5 },
  { size: 5, color: '#10b981', x: 68, y: 12, dur: 4.3 },
  { size: 3, color: '#f59e0b', x: 40, y: 90, dur: 3.9 },
  { size: 4, color: '#6366f1', x: 92, y: 40, dur: 4.6 },
]

function SlideWelcome({ active, userName }) {
  const [step, setStep] = useState(0)
  const firstName = userName ? userName.trim().split(' ')[0] : null

  useEffect(() => {
    if (!active) { setStep(0); return }
    const delays = [150, 700, 1300, 1900, 2600, 3300]
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])

  const features = [
    { Icon: Target,   label: 'Matching IA automatique', color: '#6366f1', dx: -70 },
    { Icon: Mail,     label: 'Emails personnalisés',    color: '#f59e0b', dx:  70 },
    { Icon: BarChart2,label: 'Scores calibrés',          color: '#10b981', dx: -70 },
  ]

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 28px', gap: '18px',
    }}>

      {/* Particules flottantes */}
      {active && PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: 0.25,
          left: `${p.x}%`, top: `${p.y}%`,
          animation: `floatParticle ${p.dur}s ease-in-out ${i * 0.4}s infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Icône logo */}
      <div style={{
        opacity: step >= 1 ? 1 : 0,
        transform: step >= 1 ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(24px)',
        transition: 'opacity 0.55s cubic-bezier(.34,1.6,.64,1), transform 0.55s cubic-bezier(.34,1.6,.64,1)',
        width: '68px', height: '68px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: step >= 1
          ? '0 0 0 8px rgba(99,102,241,0.12), 0 0 0 16px rgba(99,102,241,0.06), 0 8px 32px rgba(99,102,241,0.5)'
          : 'none',
        animation: step >= 1 ? 'logoPulse 2.5s ease-in-out infinite' : 'none',
      }}><Home size={28} color="white" strokeWidth={1.8} /></div>

      {/* Bonjour + nom */}
      <div style={{
        opacity: step >= 2 ? 1 : 0,
        transform: step >= 2 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.92)',
        transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(.34,1.3,.64,1)',
        textAlign: 'center',
      }}>
        <div style={{ color: 'white', fontSize: firstName ? '26px' : '22px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {firstName ? `Bonjour ${firstName} !` : 'Bienvenue !'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', marginTop: '5px', letterSpacing: '0.03em' }}>
          Votre assistant IA immobilier
        </div>
      </div>

      {/* Fonctionnalités */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '265px' }}>
        {features.map((f, i) => (
          <div key={i} style={{
            opacity: step >= 3 + i ? 1 : 0,
            transform: step >= 3 + i
              ? 'translateX(0) scale(1)'
              : `translateX(${f.dx}px) scale(0.88)`,
            transition: `opacity 0.5s ease, transform 0.55s cubic-bezier(.34,1.4,.64,1)`,
            display: 'flex', alignItems: 'center', gap: '12px',
            background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, ${f.color}14 100%)`,
            border: `1px solid ${f.color}45`,
            borderRadius: '12px',
            padding: '11px 15px',
            boxShadow: step >= 3 + i ? `0 4px 20px ${f.color}18, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <f.Icon size={16} color={f.color} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, flex: 1 }}>{f.label}</span>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: f.color, boxShadow: `0 0 8px ${f.color}`,
              opacity: step >= 3 + i ? 1 : 0,
              transition: 'opacity 0.4s ease 0.25s',
              flexShrink: 0,
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SLIDE 1 — Formulaire prospect ───────────────────
function SlideProspect({ active }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) { setStep(0); return }
    const delays = [300, 1000, 1900, 2800, 3700, 4600, 5800, 7500]
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])

  const fade = (s, extra = {}) => ({
    opacity: step >= s ? 1 : 0,
    transform: step >= s ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.45s ease, transform 0.45s ease',
    ...extra,
  })

  const types = ['Maison', 'Appartement', 'T2', 'T3', 'T4']

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{
        ...fade(1),
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ width: '32px', height: '32px', background: '#1E3A5F15', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} color="#1E3A5F" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#1E3A5F' }}>Nouveau prospect</span>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Nom */}
          <div style={fade(2)}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '5px' }}>Nom complet *</label>
            <div style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#f9fafb', minHeight: '38px' }}>
              <TypewriterText text="M. Dupont" speed={70} active={step >= 2} />
            </div>
          </div>

          {/* Email */}
          <div style={fade(3)}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '5px' }}>Email</label>
            <div style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#f9fafb', minHeight: '38px' }}>
              <TypewriterText text="m.dupont@gmail.com" speed={40} active={step >= 3} />
            </div>
          </div>

          {/* Type de bien */}
          <div style={fade(4)}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '7px' }}>Type de bien recherché *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {types.map(t => (
                <span key={t} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  background: t === 'Maison' && step >= 4 ? '#1E3A5F' : '#f3f4f6',
                  color: t === 'Maison' && step >= 4 ? 'white' : '#6b7280',
                  transition: 'all 0.3s ease',
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Villes */}
          <div style={fade(5)}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '7px' }}>Villes souhaitées *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {step >= 5 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 10px', background: '#1E3A5F', color: 'white',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                }}>
                  Fréjus <X size={10} style={{ opacity: 0.7 }} />
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', border: '1px dashed #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#9ca3af' }}>
                <Plus size={11} /> Ajouter
              </span>
            </div>
          </div>

          {/* Budget */}
          <div style={fade(6)}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '5px' }}>Budget maximum *</label>
            <div style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', minHeight: '38px' }}>
              <span><TypewriterText text="280 000" speed={60} active={step >= 6} /></span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>€</span>
            </div>
          </div>

          {/* Bouton */}
          <div style={fade(6)}>
            <div style={{
              padding: '11px',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              background: step >= 7 ? '#10b981' : '#1E3A5F',
              transition: 'background 0.5s ease',
              boxShadow: step >= 7 ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(30,58,95,0.3)',
            }}>
              {step >= 7
                ? <><CheckCircle2 size={16} /> Prospect enregistré !</>
                : <><Save size={16} /> Enregistrer le prospect</>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 2 — Matching IA ────────────────────────────
function SlideMatching({ active }) {
  const [phase, setPhase] = useState('idle')
  const [scoreVal, setScoreVal] = useState(0)
  const timersRef = useRef([])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (!active) { setPhase('idle'); setScoreVal(0); return }

    const add = (fn, ms) => { const t = setTimeout(fn, ms); timersRef.current.push(t) }

    // Un seul cycle par activation — hold étendu pour couvrir les 10s de slide
    const runCycle = () => {
      setScoreVal(0)
      add(() => setPhase('enter'),    0)
      add(() => setPhase('approach'), 900)
      add(() => setPhase('match'),    1900)
      add(() => {
        setPhase('hold')
        let v = 0
        const tick = () => {
          v = Math.min(v + 2, 94)
          setScoreVal(v)
          if (v < 94) { const t = setTimeout(tick, 22); timersRef.current.push(t) }
        }
        tick()
      }, 2500)
      // Reste en hold ~6s puis sort proprement — pas de redémarrage
      add(() => { setPhase('exit'); setScoreVal(0) }, 8500)
      add(() => setPhase('idle'),  9400)
    }

    const init = setTimeout(() => runCycle(), 300)
    timersRef.current.push(init)

    return () => timersRef.current.forEach(clearTimeout)
  }, [active])

  const isMatch = phase === 'match' || phase === 'hold'
  const isExit  = phase === 'exit'
  const isIdle  = phase === 'idle'
  const color = '#10b981'

  const getOffset = (side) => {
    const factor = side === 'left' ? -1 : 1
    if (isIdle)               return factor * 340
    if (phase === 'enter')    return factor * 145
    if (phase === 'approach') return factor * 100
    if (isExit)               return factor * 340
    return factor * 130
  }

  const CardBien = ({ side, icon, tag, name, rows }) => {
    const offset = getOffset(side)
    return (
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offset}px), -50%)`,
        transition: isIdle ? 'none' : isExit ? 'transform 0.7s ease-in, opacity 0.5s ease' : 'transform 0.85s cubic-bezier(0.34, 1.15, 0.64, 1), opacity 0.5s ease',
        opacity: (isIdle || isExit) ? 0 : 1,
        width: '170px',
        zIndex: 3,
      }}>
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: isMatch
            ? '0 0 0 2px rgba(16,185,129,0.3), 0 16px 48px rgba(0,0,0,0.18)'
            : '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid',
          borderColor: isMatch ? 'rgba(16,185,129,0.2)' : '#f3f4f6',
          transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: '#1E3A5F12', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tag}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{name}</div>
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < rows.length - 1 ? '4px' : 0 }}>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>{r.l}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#374151' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

      {/* Flash au match */}
      {phase === 'match' && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 65%)`, animation: 'bgFlash 0.7s ease', pointerEvents: 'none', borderRadius: '12px' }} />
      )}

      <div style={{ position: 'relative', width: '100%', height: '220px' }}>
        <CardBien
          side="left"
          icon={<User size={14} color="#1E3A5F" />}
          tag="Prospect" name="M. Dupont"
          rows={[{ l: 'Budget', v: '280 000 €' }, { l: 'Ville', v: 'Fréjus' }]}
        />

        {/* Ligne connecteur */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '220px', height: '1px', zIndex: 2,
          opacity: isMatch ? 1 : 0,
          transition: 'opacity 0.5s ease',
          background: `linear-gradient(90deg, transparent 0%, ${color}60 30%, ${color}60 70%, transparent 100%)`,
          overflow: 'hidden',
        }}>
          {isMatch && (
            <div style={{
              position: 'absolute', top: 0, left: '-60%',
              width: '60%', height: '100%',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              animation: 'scan 1.6s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Score central */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          opacity: isMatch ? 1 : 0,
          transition: isExit ? 'opacity 0.4s ease' : 'opacity 0.5s ease',
          pointerEvents: 'none',
        }}>
          {isMatch && (
            <div style={{
              position: 'absolute',
              width: '80px', height: '80px', borderRadius: '50%',
              border: `1.5px solid ${color}`,
              animation: 'ring 1.3s ease-out infinite',
            }} />
          )}
          <div style={{
            width: '62px', height: '62px', borderRadius: '50%',
            background: color,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 4px white, 0 6px 24px ${color}55`,
            transition: 'transform 0.4s ease',
            transform: isMatch ? 'scale(1)' : 'scale(0)',
          }}>
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{scoreVal}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>/100</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: '20px', padding: '3px 10px',
            opacity: isMatch ? 1 : 0,
            transition: 'opacity 0.3s ease 0.2s',
          }}>
            <CheckCircle2 size={10} color={color} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#065f46' }}>Match !</span>
          </div>
        </div>

        <CardBien
          side="right"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
          tag="Bien" name="Maison • Fréjus"
          rows={[{ l: 'Prix', v: '265 000 €' }, { l: 'Surface', v: '98 m²' }]}
        />
      </div>

      {/* Label statut */}
      <div style={{ textAlign: 'center', marginTop: '8px', height: '20px' }}>
        <span key={phase} style={{
          color: isMatch ? color : 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          fontWeight: isMatch ? 600 : 400,
          transition: 'color 0.4s ease, opacity 0.4s ease',
          opacity: (isIdle || isExit) ? 0 : 1,
          animation: (!isIdle && !isExit) ? 'fadeUp 0.35s ease' : 'none',
        }}>
          {isMatch ? '✓ Analyse IA complète' : '⟳  Analyse en cours...'}
        </span>
      </div>
    </div>
  )
}

// ─── SLIDE 3 — Email modal ────────────────────────────
function SlideEmail({ active }) {
  const [step, setStep] = useState(0)
  // 0=vide | 1=modal | 2=tab aperçu animé | 3=bascule tab envoyer | 4=bouton envoyé

  useEffect(() => {
    if (!active) { setStep(0); return }
    const delays = [300, 1400, 5200, 7000]
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])

  const activeTab = step >= 3 ? 'confirm' : 'preview'

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', boxSizing: 'border-box' }}>
      <div style={{
        background: 'white',
        borderRadius: '18px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        opacity: step >= 1 ? 1 : 0,
        transform: step >= 1 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transition: 'opacity 0.6s cubic-bezier(.22,.68,0,1.1), transform 0.6s cubic-bezier(.22,.68,0,1.1)',
      }}>

        {/* Header gradient — 2 lignes pour ne pas compresser */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)',
          padding: '14px 18px 12px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {/* Ligne 1 — icône + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.18)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={15} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '14px', lineHeight: 1.2 }}>Envoyer la proposition</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>à M. Dupont</div>
            </div>
          </div>
          {/* Ligne 2 — tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {[
              { id: 'preview', icon: Eye, label: 'Aperçu' },
              { id: 'edit',    icon: Edit3, label: 'Modifier' },
              { id: 'confirm', icon: Mail, label: 'Envoyer' },
            ].map(({ id, icon: Icon, label }) => (
              <div key={id} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                padding: '6px 0', borderRadius: '6px',
                background: activeTab === id ? 'white' : 'transparent',
                color: activeTab === id ? '#1E3A5F' : 'rgba(255,255,255,0.7)',
                fontSize: '12px', fontWeight: 500,
                transition: 'background 0.4s ease, color 0.4s ease',
                cursor: 'default',
              }}>
                <Icon size={12} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Corps — hauteur fixe + scroll si besoin */}
        <div style={{ padding: '14px 16px', overflowY: 'auto', maxHeight: '360px' }}>

          {/* TAB APERÇU */}
          {activeTab === 'preview' && (
            <div style={{ opacity: step >= 2 ? 1 : 0, transition: 'opacity 0.6s ease' }}>
              {/* Fausse fenêtre navigateur */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ background: '#f9fafb', padding: '7px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['#f87171','#fbbf24','#34d399'].map(c => <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c }} />)}
                  </div>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>Aperçu de l'email</span>
                  <span style={{ fontSize: '10px', color: '#1E3A5F', fontWeight: 500 }}>Personnaliser</span>
                </div>
                <div style={{ background: 'white', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>Bonjour M. Dupont,</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.55, margin: 0 }}>
                    Suite à notre échange, j'ai identifié un bien qui correspond à votre recherche.
                  </p>
                  {/* Carte bien */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f9fafb' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Sélectionné pour vous</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Maison à Fréjus</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E3A5F', margin: '2px 0 4px' }}>265 000 €</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>98 m²</span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>4 pièces</span>
                    </div>
                  </div>
                  {/* Points forts */}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Points forts</div>
                    {['Correspond à votre budget', 'Jardin et stationnement inclus'].map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
                        <span style={{ color: '#10b981', fontSize: '11px', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '11px', color: '#374151' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  {/* Recommandation */}
                  <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Notre recommandation</div>
                    <p style={{ fontSize: '11px', color: '#5b21b6', lineHeight: 1.5, margin: 0 }}>Ce bien correspond parfaitement à vos critères essentiels.</p>
                  </div>
                </div>
              </div>
              {/* Boutons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, padding: '9px', border: '1px solid #e5e7eb', borderRadius: '10px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>Annuler</div>
                <div style={{ flex: 1, padding: '9px', background: '#1E3A5F', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <Send size={12} /> Continuer
                </div>
              </div>
            </div>
          )}

          {/* TAB ENVOYER */}
          {activeTab === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeUp 0.45s cubic-bezier(.22,.68,0,1.1)' }}>
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '11px 13px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>Destinataire</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>M. Dupont</div>
                <div style={{ fontSize: '12px', color: '#1E3A5F' }}>m.dupont@gmail.com</div>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '11px 13px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>Bien proposé</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Maison à Fréjus</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E3A5F' }}>265 000 €</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '11px 13px' }}>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                  <strong>Confirmation :</strong> L'email sera envoyé immédiatement à m.dupont@gmail.com
                </p>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                fontSize: '14px', fontWeight: 600, color: 'white',
                background: step >= 4 ? '#10b981' : '#059669',
                transition: 'background 0.6s ease, box-shadow 0.6s ease',
                boxShadow: step >= 4 ? '0 6px 24px rgba(16,185,129,0.5)' : '0 4px 16px rgba(5,150,105,0.3)',
              }}>
                {step >= 4
                  ? <><CheckCircle2 size={16} /> Email envoyé à M. Dupont !</>
                  : <><Send size={16} /> Envoyer maintenant</>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 04 : BIENS — table + modal édition ────────
function SlideBiens({ active }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) { setStep(0); return }
    // 400  → tableau apparaît
    // 900  → ligne 1
    // 1400 → ligne 2
    // 1900 → ligne 3
    // 3000 → icône éditer pulse
    // 4200 → modal s'ouvre
    // 5200 → chip "Travaux à prévoir" s'active
    // 6400 → chip "Vis-à-vis" s'active
    // 7600 → bouton Enregistrer → vert
    const delays = [400, 900, 1400, 1900, 3000, 4200, 5200, 6400, 7600]
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])

  const rowFade = (s) => ({
    opacity: step >= s ? 1 : 0,
    transform: step >= s ? 'translateX(0)' : 'translateX(-10px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  const biens = [
    { type: 'Appartement', ref: 'VAP1670021497', ville: 'Fréjus', surface: '34.48 m²', prix: '125 000 €' },
    { type: 'Maison/villa',  ref: 'VMA1670023600', ville: 'Fréjus', surface: '62.45 m²', prix: '216 000 €' },
    { type: 'Appartement', ref: 'VAP1670023962', ville: 'Fréjus', surface: '57.88 m²', prix: '281 000 €' },
  ]

  const chips = ['Vis-à-vis', 'Pas de parking', 'Sans ascenseur', 'Bruit de rue', 'Petite surface', 'Travaux à prévoir']
  const activeChips = step >= 5 ? (step >= 6 ? ['Travaux à prévoir', 'Vis-à-vis'] : ['Travaux à prévoir']) : []

  const modalOpen = step >= 5

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>

        {/* ── Tableau biens ── */}
        <div style={{
          background: 'white', borderRadius: '14px',
          boxShadow: modalOpen ? '0 4px 20px rgba(0,0,0,0.08)' : '0 20px 60px rgba(0,0,0,0.28)',
          border: '1px solid #f3f4f6', overflow: 'hidden',
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? (modalOpen ? 'scale(0.94) translateY(6px)' : 'scale(1)') : 'scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.5s ease',
        }}>
          {/* Header tableau */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Biens</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>94 biens en catalogue</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Tous', 'Saint François', 'Partenaires'].map((t, i) => (
                <span key={t} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: i === 0 ? '#1E3A5F' : '#f3f4f6', color: i === 0 ? 'white' : '#6b7280' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 75px 80px 60px', padding: '6px 14px', borderBottom: '1px solid #f9fafb' }}>
            {['BIEN', 'SURFACE', 'PRIX', 'ÉTAT', 'ACTIONS'].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {/* Lignes */}
          {biens.map((b, i) => (
            <div key={i} style={{
              ...rowFade(i + 2),
              display: 'grid', gridTemplateColumns: '1fr 70px 75px 80px 60px',
              alignItems: 'center', padding: '9px 14px',
              borderBottom: i < 2 ? '1px solid #f9fafb' : 'none',
              background: (step >= 4 && i === 0) ? '#fef9f0' : 'white',
              transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.3s ease',
            }}>
              {/* Bien */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e5e7eb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{b.type}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{b.ref}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#374151' }}>{b.surface}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{b.prix}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>–</div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ opacity: 0.4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                {/* Icône éditer — pulse step 4 */}
                <div style={{
                  width: i === 0 && step >= 4 ? '24px' : '14px',
                  height: i === 0 && step >= 4 ? '24px' : '14px',
                  borderRadius: i === 0 && step >= 4 ? '6px' : '0',
                  background: i === 0 && step >= 4 ? '#f97316' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(.34,1.4,.64,1)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={i === 0 && step >= 4 ? 'white' : '#f97316'} strokeWidth="2" style={{ transition: 'stroke 0.3s ease' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div style={{ opacity: 0.4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Modal édition ── */}
        <div style={{
          position: 'absolute', top: '-8px', left: 0, right: 0,
          background: 'white', borderRadius: '16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          opacity: modalOpen ? 1 : 0,
          transform: modalOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'opacity 0.5s cubic-bezier(.22,.68,0,1.1), transform 0.5s cubic-bezier(.22,.68,0,1.1)',
          pointerEvents: 'none',
        }}>
          {/* Header orange */}
          <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>Modifier le bien</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Appartement à Fréjus</div>
              </div>
            </div>
            <X size={16} color="rgba(255,255,255,0.7)" />
          </div>

          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Défauts section */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Défauts / Points négatifs
              </div>
              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {chips.map(chip => {
                  const on = activeChips.includes(chip)
                  return (
                    <span key={chip} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '4px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                      background: on ? '#f97316' : '#f3f4f6',
                      color: on ? 'white' : '#374151',
                      border: `1px solid ${on ? '#ea580c' : '#e5e7eb'}`,
                      transition: 'all 0.35s cubic-bezier(.34,1.3,.64,1)',
                      transform: on ? 'scale(1.05)' : 'scale(1)',
                    }}>
                      {on && <CheckCircle2 size={9} />}
                      {!on && <Plus size={9} />}
                      {chip}
                    </span>
                  )
                })}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>Utilisé par l'IA pour le scoring. Non visible par les clients.</div>
            </div>

            {/* Champs rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Etat', 'Bon état...'], ['Quartier', '42, Rue Saint François']].map(([l, p]) => (
                <div key={l}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{l}</div>
                  <div style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#9ca3af', background: '#f9fafb' }}>{p}</div>
                </div>
              ))}
            </div>

            {/* Bouton enregistrer */}
            <div style={{
              padding: '10px', borderRadius: '10px', textAlign: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: step >= 9 ? '#10b981' : '#f97316',
              boxShadow: step >= 9 ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
            }}>
              {step >= 9 ? <><CheckCircle2 size={14} /> Bien mis à jour !</> : <><Save size={14} /> Enregistrer</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 05 : CALIBRATION — page autonome ──────────
function SlideCalibration({ active }) {
  const [step, setStep] = useState(0)
  const [scoreVal, setScoreVal] = useState(0)
  const scoreRef = useRef(null)

  useEffect(() => {
    if (!active) { setStep(0); setScoreVal(0); return }
    // 300  → page apparaît (header + barre progression)
    // 1000 → carte matching navy
    // 2200 → barre de score compte
    // 3600 → points forts
    // 5000 → questions évaluation
    // 6500 → "Oui pertinent" sélectionné
    // 7800 → "Juste" sélectionné
    const delays = [300, 1000, 2200, 3600, 5000, 6500, 7800]
    const timers = delays.map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])

  useEffect(() => {
    if (step !== 3) return
    clearInterval(scoreRef.current)
    let v = 0
    scoreRef.current = setInterval(() => {
      v = Math.min(v + 1, 83)
      setScoreVal(v)
      if (v >= 83) clearInterval(scoreRef.current)
    }, 14)
    return () => clearInterval(scoreRef.current)
  }, [step])

  const pertinent = step >= 6
  const justeSelected = step >= 7

  const fade = (s) => ({
    opacity: step >= s ? 1 : 0,
    transform: step >= s ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.5s ease, transform 0.5s ease',
  })

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ── Fausse page Calibration ── */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
          border: '1px solid #f3f4f6', overflow: 'hidden',
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(.22,.68,0,1.1)',
        }}>

          {/* Header page */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Calibration</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Évaluez la pertinence des matchings</div>
              </div>
              <div style={{ background: '#1E3A5F', color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Résultats · 4
              </div>
            </div>
            {/* Barre de progression globale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '2%', background: '#1E3A5F', borderRadius: '99px', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>4 évalués / 171 · <b style={{ color: '#374151' }}>2%</b></span>
            </div>
          </div>

          {/* Card matching — fond navy comme la vraie app */}
          <div style={{
            ...fade(2),
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)',
            padding: '11px 14px',
            display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginBottom: '2px' }}>5 / 171</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Mr Paul Rouvier</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>cherche Maison · 450 000 €</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', padding: '4px 10px', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Bien</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Maison · Fréjus</div>
            </div>
          </div>

          {/* Score calculé */}
          <div style={{ ...fade(2), padding: '10px 14px', borderBottom: '1px solid #f9fafb' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Score calculé</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${scoreVal}%`,
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: '99px', transition: 'width 0.04s linear',
                  boxShadow: scoreVal > 0 ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                }} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', minWidth: '28px', textAlign: 'right', transition: 'color 0.3s ease' }}>{scoreVal || '–'}</span>
            </div>
          </div>

          {/* Points forts */}
          <div style={{ ...fade(4), padding: '10px 14px', borderBottom: '1px solid #f9fafb' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Points forts selon l'IA</div>
            {['Excellent potentiel locatif — centre historique de Fréjus', 'Construction récente, DPE performant, grand garage'].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: i === 0 ? '3px' : 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>{p}</span>
              </div>
            ))}
          </div>

          {/* Questions évaluation */}
          <div style={{ ...fade(5), padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Q1 — pertinence */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Ce bien correspond-il à ce prospect ?</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{
                  flex: 1, padding: '8px', borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  fontSize: '12px', fontWeight: 700,
                  background: pertinent ? '#ecfdf5' : 'white',
                  border: `1.5px solid ${pertinent ? '#10b981' : '#e5e7eb'}`,
                  color: pertinent ? '#059669' : '#6b7280',
                  transform: pertinent ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: pertinent ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                  transition: 'all 0.45s cubic-bezier(.34,1.3,.64,1)',
                }}>
                  👍 Oui, pertinent
                </div>
                <div style={{
                  flex: 1, padding: '8px', borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  fontSize: '12px', fontWeight: 700,
                  background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280',
                  opacity: pertinent ? 0.3 : 1, transition: 'opacity 0.4s ease',
                }}>
                  👎 Non, pas adapté
                </div>
              </div>
            </div>

            {/* Q2 — score juste */}
            <div style={{
              opacity: step >= 5 ? 1 : 0,
              transform: step >= 5 ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Le score 83/100 est-il juste ?</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: 'Trop haut' },
                  { label: 'Juste', active: justeSelected },
                  { label: 'Trop bas' },
                ].map(({ label, active: isActive }) => (
                  <div key={label} style={{
                    flex: 1, padding: '7px 4px', borderRadius: '9px', textAlign: 'center',
                    fontSize: '11px', fontWeight: 700,
                    background: isActive ? '#ecfdf5' : '#f9fafb',
                    border: `1.5px solid ${isActive ? '#10b981' : '#e5e7eb'}`,
                    color: isActive ? '#059669' : '#9ca3af',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                    boxShadow: isActive ? '0 3px 10px rgba(16,185,129,0.2)' : 'none',
                    transition: 'all 0.45s cubic-bezier(.34,1.3,.64,1)',
                  }}>{label}</div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DONNÉES SLIDES ───────────────────────────────────
const SLIDES = [
  {
    id: 'welcome', num: '00', color: '#6366f1',
    title: 'Bonjour et bienvenue !',
    desc: "ImmoMatch est votre assistant IA pour l'immobilier. Il analyse automatiquement vos prospects, trouve les meilleurs biens, et génère les emails pour vos clients — en quelques secondes.",
    cta: "Ce guide vous présente les 5 fonctionnalités clés. Prenez 2 minutes pour le parcourir.",
    Component: SlideWelcome,
  },
  {
    id: 'prospect', num: '01', color: '#6366f1',
    title: 'Ajouter un prospect',
    desc: "Renseignez le profil de votre client — budget, type de bien, localisation. Tout se fait depuis le formulaire Nouveau prospect.",
    cta: "Saisissez une fois, ImmoMatch s'occupe du reste.",
    Component: SlideProspect,
  },
  {
    id: 'match', num: '02', color: '#10b981',
    title: 'Le matching IA',
    desc: "Claude AI analyse chaque prospect face à tous vos biens et génère un score sur 100 avec une justification détaillée et personnalisée.",
    cta: "Plus de tri manuel — l'IA trouve le bon bien.",
    Component: SlideMatching,
  },
  {
    id: 'email', num: '03', color: '#f59e0b',
    title: 'Email personnalisé',
    desc: "ImmoMatch génère un email professionnel avec aperçu en temps réel. Vous pouvez le modifier avant de l'envoyer en un clic.",
    cta: 'Votre client reçoit la bonne proposition.',
    Component: SlideEmail,
  },
  {
    id: 'biens', num: '04', color: '#f97316',
    title: 'Enrichir le catalogue',
    desc: "Depuis chaque bien, ajoutez les défauts spécifiques que L'IA prendra en compte — vis-à-vis, travaux, bruit de rue. Ces infos ne sont jamais visibles par vos clients.",
    cta: 'Plus de contexte = des scores plus précis.',
    Component: SlideBiens,
  },
  {
    id: 'calibration', num: '05', color: '#7c3aed',
    title: 'Calibrer les scores',
    desc: "Pour chaque matching, indiquez si le bien est pertinent et si le score est juste. L'IA apprend de vos retours et affine ses recommandations.",
    cta: "Plus vous évaluez, mieux l'IA vous comprend.",
    Component: SlideCalibration,
  },
]

// ─── MODAL PRINCIPAL ──────────────────────────────────
export default function TutorialModal({ open, onClose }) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const progRef = useRef(null)
  const DURATION = 20000
  const { user } = useAuth()

  useEffect(() => {
    if (!open) return
    setProgress(0)
    clearInterval(progRef.current)
    const start = Date.now()
    progRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(progRef.current)
        if (current < SLIDES.length - 1) setCurrent(c => c + 1)
      }
    }, 50)
    return () => clearInterval(progRef.current)
  }, [current, open])

  useEffect(() => { if (!open) { setCurrent(0); setProgress(0) } }, [open])

  const goTo = (i) => { setProgress(0); setCurrent(i) }
  const slide = SLIDES[current]

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes modalIn {
          from{opacity:0;transform:translate(-50%,-48%) scale(0.96)}
          to{opacity:1;transform:translate(-50%,-50%) scale(1)}
        }
        @keyframes slideIn {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes popIn {
          from{opacity:0;transform:scale(0.7)}
          to{opacity:1;transform:scale(1)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes bgFlash { 0%,100%{opacity:0} 50%{opacity:1} }
        @keyframes ring { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.85);opacity:0} }
        @keyframes scan { 0%{left:-60%} 100%{left:160%} }
        @keyframes floatParticle { 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-18px) scale(1.3)} }
        @keyframes logoPulse {
          0%,100%{box-shadow:0 0 0 6px rgba(99,102,241,0.12),0 0 0 12px rgba(99,102,241,0.06),0 8px 32px rgba(99,102,241,0.4)}
          50%{box-shadow:0 0 0 10px rgba(99,102,241,0.18),0 0 0 20px rgba(99,102,241,0.08),0 8px 40px rgba(99,102,241,0.6)}
        }
      `}</style>

      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,16,26,0.82)',
        backdropFilter: 'blur(6px)',
        animation: 'overlayIn 0.25s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1001,
        width: 'min(980px, 96vw)',
        background: 'linear-gradient(150deg, #0e1c2d 0%, #1a2f4a 50%, #0f2036 100%)',
        borderRadius: '22px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        overflow: 'hidden',
        animation: 'modalIn 0.35s cubic-bezier(.22,.68,0,1.05)',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}>

        {/* Grille de fond */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        {/* Blob couleur slide */}
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${slide.color}12 0%, transparent 65%)`, top: '50%', left: '30%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', transition: 'background 0.6s ease' }} />

        {/* Barre progression */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', position: 'relative', zIndex: 5 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: slide.color, transition: 'width 0.05s linear', borderRadius: '0 2px 2px 0', boxShadow: `0 0 8px ${slide.color}80` }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={15} color="rgba(255,255,255,0.8)" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500 }}>Guide ImmoMatch</span>
          </div>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ display: 'flex', height: '480px', position: 'relative', zIndex: 5 }}>

          {/* Gauche — animation */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            <div key={slide.id} style={{ width: '100%', height: '100%', animation: 'slideIn 0.4s ease' }}>
              {slide.id === 'welcome'
                ? <SlideWelcome active={open} userName={user?.nom} />
                : <slide.Component active={open} />
              }
            </div>
          </div>

          {/* Droite — texte */}
          <div style={{ width: '300px', padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div key={slide.id} style={{ animation: 'slideIn 0.45s ease' }}>

              {/* Badge étape */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: `${slide.color}18`, border: `1px solid ${slide.color}35`,
                borderRadius: '20px', padding: '4px 12px', marginBottom: '18px',
              }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: slide.color }} />
                <span style={{ color: slide.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {slide.id === 'welcome' ? 'INTRODUCTION' : `ÉTAPE ${slide.num}`}
                </span>
              </div>

              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '12px' }}>
                {slide.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.7, marginBottom: '22px' }}>
                {slide.desc}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <ArrowRight size={14} color={slide.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.55, fontStyle: 'italic' }}>{slide.cta}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 5 }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <div style={{
                  height: '6px', width: i === current ? '20px' : '6px',
                  borderRadius: '3px',
                  background: i === current ? slide.color : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.35s ease',
                }} />
              </button>
            ))}
          </div>

          {/* Boutons nav */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{
              width: '34px', height: '34px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: current === 0 ? 'not-allowed' : 'pointer',
              opacity: current === 0 ? 0.25 : 1,
              transition: 'all 0.18s',
            }}>
              <ChevronLeft size={16} />
            </button>

            {current < SLIDES.length - 1 ? (
              <button onClick={() => goTo(current + 1)} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 18px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              >
                Suivant <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 20px', borderRadius: '10px',
                border: 'none', background: slide.color,
                color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                boxShadow: `0 4px 16px ${slide.color}55`,
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                <CheckCircle2 size={14} /> Commencer !
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}