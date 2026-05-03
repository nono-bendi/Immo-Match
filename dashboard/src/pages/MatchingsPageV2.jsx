import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, RefreshCw, Send, XCircle, ArrowLeft, Zap, AlertTriangle, ExternalLink } from 'lucide-react'
import AnalysisOverlay from '../components/AnalysisOverlay'
import SparkleButton from '../components/SparkleButton'
import Confetti from '../components/Confetti'
import EmailModal from '../components/EmailModal'
import ProspectModal from '../components/ProspectModal'
import BienModal from '../components/BienModal'
import { apiFetch } from '../api'
import { useAgency } from '../contexts/AgencyContext'
import { useTheme } from '../contexts/ThemeContext'

// ─── CSS keyframes ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('immo-kf')) {
  const s = document.createElement('style')
  s.id = 'immo-kf'
  s.textContent = `
    @keyframes slideUp      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes btnShimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes bgShift      { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes blob1        { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.12)} 66%{transform:translate(-30px,50px) scale(0.95)} }
    @keyframes blob2        { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-70px,30px) scale(1.08)} 66%{transform:translate(50px,-60px) scale(1.05)} }
    @keyframes blob3        { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,60px) scale(0.92)} 66%{transform:translate(-60px,-30px) scale(1.1)} }
    @keyframes shimmerWave  { 0%{opacity:0.12;transform:skewX(-12deg) translateX(-120%)} 100%{opacity:0.28;transform:skewX(-12deg) translateX(220%)} }
    @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(90px,-70px) scale(1.12)} 70%{transform:translate(-50px,90px) scale(0.93)} }
    @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-110px,55px) scale(1.09)} 65%{transform:translate(70px,-95px) scale(1.06)} }
    @keyframes aurora3 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(65px,80px) scale(0.90)} 75%{transform:translate(-90px,-45px) scale(1.14)} }
    @keyframes aurora4 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(-60px,-100px) scale(1.16)} 70%{transform:translate(100px,60px) scale(0.87)} }
    @keyframes star-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(10deg)} }
    @keyframes star-drift { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 40%{transform:translateY(-5px) rotate(-14deg) scale(1.12)} 80%{transform:translateY(3px) rotate(7deg) scale(.93)} }
    @keyframes star-pulse { 0%,100%{opacity:.35;transform:scale(1) rotate(0deg)} 50%{opacity:.6;transform:scale(1.15) rotate(-20deg)} }
    .glass-sort-group{display:flex;position:relative;background:rgba(255,255,255,.65);border-radius:.85rem;backdrop-filter:blur(12px);box-shadow:inset 1px 1px 4px rgba(255,255,255,.9),inset -1px -1px 4px rgba(0,0,0,.05),0 2px 8px rgba(0,0,0,.08);overflow:hidden;border:1px solid rgba(0,0,0,.07);flex-shrink:0;}
    .glass-sort-btn{flex:1;min-width:68px;white-space:nowrap;font-size:12px;padding:.45rem 1rem;cursor:pointer;font-weight:600;letter-spacing:.3px;color:#94a3b8;position:relative;z-index:2;transition:color .3s ease-in-out;background:none;border:none;font-family:inherit;}
    .glass-sort-btn:hover{color:#1e293b;}
    .glass-sort-btn.active{color:#fff;}
    .glass-sort-glider{position:absolute;top:0;bottom:0;width:calc(100% / 3);border-radius:.85rem;z-index:1;background:linear-gradient(135deg,#1E3A5F,#2d5a8a);box-shadow:0 0 14px rgba(30,58,95,.3),inset 0 0 6px rgba(255,255,255,.12);transition:transform .5s cubic-bezier(.37,1.95,.66,.56);}
  `
  document.head.appendChild(s)
}

const _24H_AGO = Date.now() - 24 * 60 * 60 * 1000

// ─── Utils ─────────────────────────────────────────────────────────────────────
const ini    = (n) => { if (!n) return '??'; const p = n.trim().split(' ').filter(Boolean); return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase() }
const bul    = (t) => (t || '').split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
const mon    = (v) => v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—'
const dt     = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
const fPhoto = (s) => { if (!s || typeof s !== 'string') return null; return s.split('|').map(u => u.trim()).find(u => /^https?:\/\//i.test(u)) || null }

const AV_PAL = [
  ['#1E3A5F', '#2D5A8A'], ['#0e7490', '#06b6d4'], ['#047857', '#10b981'],
  ['#b45309', '#f59e0b'], ['#5b21b6', '#a78bfa'], ['#1d4ed8', '#60a5fa'],
]
const avP = (n) => AV_PAL[(n || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_PAL.length]

const sC = (s) => s >= 85
  ? { c1: '#10b981', c2: '#059669', soft: '#34d399', label: 'Proposer sans hésiter',  bg: '#ecfdf5', text: '#065f46' }
  : s >= 80
    ? { c1: '#34d399', c2: '#10b981', soft: '#6ee7b7', label: 'Mérite une visite',     bg: '#f0fdf4', text: '#166534' }
    : s >= 65
      ? { c1: '#ca8a04', c2: '#a16207', soft: '#fde047', label: 'À étudier',           bg: '#fefce8', text: '#78350f' }
      : s >= 50
        ? { c1: '#f97316', c2: '#ea580c', soft: '#fb923c', label: 'Manque des critères clés', bg: '#fff7ed', text: '#9a3412' }
        : s >= 35
          ? { c1: '#f59e0b', c2: '#d97706', soft: '#fbbf24', label: 'Peu adapté au profil',   bg: '#fffbeb', text: '#92400e' }
          : { c1: '#ef4444', c2: '#dc2626', soft: '#f87171', label: 'Hors critères',           bg: '#fef2f2', text: '#991b1b' }

// Palettes post-it par index (5 variantes)
const POSTIT_PAL = [
  { bg: 'linear-gradient(160deg,#fef9c3,#fde68a)', text: '#78350f', tape: 'rgba(255,255,255,0.55)', header: '#92400e' },
  { bg: 'linear-gradient(160deg,#dbeafe,#bfdbfe)', text: '#1e3a8a', tape: 'rgba(255,255,255,0.6)',  header: '#1e40af' },
  { bg: 'linear-gradient(160deg,#dcfce7,#bbf7d0)', text: '#14532d', tape: 'rgba(255,255,255,0.55)', header: '#166534' },
  { bg: 'linear-gradient(160deg,#fce7f3,#fbcfe8)', text: '#831843', tape: 'rgba(255,255,255,0.55)', header: '#9d174d' },
  { bg: 'linear-gradient(160deg,#ffedd5,#fed7aa)', text: '#7c2d12', tape: 'rgba(255,255,255,0.5)',  header: '#9a3412' },
]
const postitPal = (id) => POSTIT_PAL[(id || 0) % POSTIT_PAL.length]

// ─── AuroraBackground — ShaderGradient-like, position:fixed → visible au scroll
function AuroraBackground() {
  const blob = (style) => (
    <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
  )
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#f0f9ff', pointerEvents: 'none' }}>
      {blob({ width: 700, height: 700, top: '-15%', left: '-10%',  background: '#7dd3fc', filter: 'blur(80px)', opacity: 0.55, animation: 'aurora1 20s ease-in-out infinite', willChange: 'transform' })}
      {blob({ width: 600, height: 600, top: '20%',  right: '-12%', background: '#93c5fd', filter: 'blur(70px)', opacity: 0.50, animation: 'aurora2 25s ease-in-out infinite', willChange: 'transform' })}
      {blob({ width: 550, height: 550, bottom: '0%',left: '28%',   background: '#67e8f9', filter: 'blur(75px)', opacity: 0.52, animation: 'aurora3 18s ease-in-out infinite', willChange: 'transform' })}
    </div>
  )
}

// ─── Count-up ──────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now(); let raf
    const step = (t) => { const p = Math.min(1, (t - start) / duration); setV(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

// ─── ScoreRing SVG + Blob ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }) {
  const c = sC(score); const v = useCountUp(score)
  const r = (size - 14) / 2; const cx = size / 2
  const circ = 2 * Math.PI * r; const offset = circ * (1 - v / 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{ position: 'absolute', inset: -4, background: `radial-gradient(circle at 30% 30%,${c.c1}55 0%,transparent 60%),radial-gradient(circle at 70% 70%,${c.soft}45 0%,transparent 60%)`, filter: 'blur(18px)', animation: 'blobPulse 3s ease-in-out infinite', pointerEvents: 'none' }} />
        <svg width={size} height={size} style={{ position: 'relative', display: 'block', transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={`sg-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c.c1} /><stop offset="100%" stopColor={c.soft} />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(241,245,249,0.7)" strokeWidth={10} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={`url(#sg-${score})`} strokeWidth={10} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 2px 8px ${c.c1}60)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Score IA</span>
          <span style={{ fontSize: Math.round(size * 0.34), fontWeight: 900, color: c.c1, lineHeight: 1, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.08em', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: c.c1, whiteSpace: 'nowrap' }}>{c.label}</span>
    </div>
  )
}

// ─── GemBadge — Card avec photo + btn bien ─────────────────────────────────────
function GemBadge({ score, ville, prix, surface, pieces, photos, selected, onClick, onOpenBien }) {
  const c = sC(score); const photo = fPhoto(photos)
  const { dark } = useTheme()
  const _bg  = dark ? '#0f1e30' : '#fff'
  const _bd  = dark ? 'rgba(255,255,255,0.07)' : '#edf1f7'
  const _ico = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'
  const _tx  = dark ? '#7dd3fc' : '#1E3A5F'
  const _sub = dark ? 'rgba(255,255,255,0.45)' : '#64748b'
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, background: _bg, border: `1.5px solid ${selected ? c.c1 : _bd}`, boxShadow: selected ? `0 4px 18px ${c.c1}30` : `0 1px 0 ${_bd}`, cursor: 'pointer', transition: 'all 0.18s ease', width: '100%', textAlign: 'left', transform: selected ? 'translateY(-1px)' : 'translateY(0)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, position: 'relative', overflow: 'hidden', background: photo ? 'transparent' : `linear-gradient(135deg,${c.c1}25,${c.c2}10),repeating-linear-gradient(45deg,${dark?'#1a2d42':'#e2e8f0'} 0 4px,${dark?'#0f1e30':'#edf1f7'} 4px 8px)` }}>
          {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          <div style={{ position: 'absolute', top: 3, right: 3, background: `linear-gradient(135deg,${c.c1},${c.c2})`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 9999, boxShadow: `0 2px 4px ${c.c1}50` }}>{score}</div>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: _tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ville}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: _tx, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{mon(prix)}</span>
            {surface && <><span style={{ fontSize: 10, color: dark?'rgba(255,255,255,0.2)':'#cbd5e1' }}>·</span><span style={{ fontSize: 12, color: _sub }}>{surface}m²</span></>}
            {pieces  && <><span style={{ fontSize: 10, color: dark?'rgba(255,255,255,0.2)':'#cbd5e1' }}>·</span><span style={{ fontSize: 12, color: _sub }}>{pieces}p</span></>}
          </div>
        </div>
      </button>
      <button onClick={e => { e.stopPropagation(); onOpenBien() }} title="Voir la fiche du bien" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8, background: _ico, border: `1px solid ${_bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background=dark?'rgba(125,211,252,0.12)':'#eff6ff'; e.currentTarget.style.color=dark?'#7dd3fc':'#1E3A5F'; e.currentTarget.style.borderColor=dark?'rgba(125,211,252,0.3)':'#bfdbfe' }}
        onMouseLeave={e => { e.currentTarget.style.background=_ico; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.borderColor=_bd }}
      ><ExternalLink size={12} /></button>
    </div>
  )
}

// ─── RecoPostit — variantes de couleur ─────────────────────────────────────────
function RecoPostit({ text, paletteIdx = 0 }) {
  const p = postitPal(paletteIdx)
  return (
    <div style={{ background: p.bg, borderRadius: 4, padding: '18px 20px 22px', transform: 'rotate(-1deg)', boxShadow: '0 10px 28px rgba(0,0,0,0.30),0 1px 0 rgba(255,255,255,0.4) inset', position: 'relative', alignSelf: 'flex-start', width: '100%' }}>
      <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%) rotate(2deg)', width: 58, height: 15, background: p.tape, border: '1px solid rgba(0,0,0,0.04)', borderRadius: 2 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>📝</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: p.header, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recommandation</span>
      </div>
      <p style={{ fontSize: 18, color: p.text, lineHeight: 1.55, margin: 0, fontFamily: '"Caveat","Comic Sans MS",cursive', fontWeight: 500 }}>{text}</p>
    </div>
  )
}

// ─── BienDetail hero ───────────────────────────────────────────────────────────
function BienDetail({ match, mail, onPropose, onRefuse, sending }) {
  const photo   = fPhoto(match.bien_photos)
  const forts   = bul(match.points_forts).slice(0, 4)
  const atts    = bul(match.points_attention).slice(0, 2)
  const refused = match.statut_prospect === 'refused'
  const [refHover, setRefHover] = useState(false)
  const [sendHover, setSendHover] = useState(false)
  const { dark } = useTheme()
  const _bar    = dark ? '#080f1a' : '#fbfcfe'
  const _barBd  = dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
  const _sepBd  = dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'
  const refBg   = refHover || refused ? (dark ? 'rgba(220,38,38,0.15)' : '#fef2f2') : (dark ? 'rgba(255,255,255,0.05)' : '#fff')
  const refCl   = refHover || refused ? '#dc2626' : (dark ? 'rgba(255,255,255,0.4)' : '#94a3b8')
  const refBd   = refHover || refused ? (dark ? 'rgba(220,38,38,0.3)' : '#fecaca') : (dark ? 'rgba(255,255,255,0.08)' : '#e8eef5')

  return (
    <div style={{ borderTop: `1px solid ${_sepBd}` }}>
      <div style={{ position: 'relative', minHeight: 260, background: photo ? `linear-gradient(135deg,rgba(15,23,42,0.84) 0%,rgba(15,23,42,0.58) 100%),url(${photo}) center/cover no-repeat` : 'linear-gradient(135deg,#0f1e30 0%,#1E3A5F 50%,#2D5A8A 100%)', padding: '28px 30px' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(96,165,250,0.22) 0%,transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(167,139,250,0.18) 0%,transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{match.bien_type}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>📍 {match.bien_ville}</span>
              {match.bien_surface && <><span style={{ opacity: 0.4 }}>·</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{match.bien_surface} m²</span></>}
              {match.bien_pieces  && <><span style={{ opacity: 0.4 }}>·</span><span>{match.bien_pieces} pièces</span></>}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 16 }}>{mon(match.bien_prix)}</div>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {forts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                  <Zap size={13} color="#86efac" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Points forts</span>
                </div>
                {forts.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
                    <span style={{ color: '#34d399', flexShrink: 0 }}>•</span><span>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {atts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                  <AlertTriangle size={13} color="#fcd34d" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Attention</span>
                </div>
                {atts.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
                    <span style={{ color: '#fbbf24', flexShrink: 0 }}>•</span><span>{a}</span>
                  </div>
                ))}
              </div>
            )}
            {!forts.length && !atts.length && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>Analyse non disponible</p>}
          </div>

          {match.recommandation && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <RecoPostit text={match.recommandation} paletteIdx={match.id} />
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', background: _bar, borderTop: `1px solid ${_barBd}` }}>
        {match.date_email_envoye && (
          <span style={{ fontSize: 12, fontWeight: 600, background: dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', color: '#16a34a', border: `1px solid ${dark ? 'rgba(22,163,74,0.25)' : '#bbf7d0'}`, borderRadius: 9999, padding: '4px 12px' }}>
            ✓ Proposé le {dt(match.date_email_envoye)}
          </span>
        )}
        {refused && (
          <span style={{ fontSize: 12, fontWeight: 600, background: dark ? 'rgba(220,38,38,0.12)' : '#fef2f2', color: '#dc2626', border: `1px solid ${dark ? 'rgba(220,38,38,0.25)' : '#fecaca'}`, borderRadius: 9999, padding: '4px 12px' }}>Non intéressé</span>
        )}

        <button
          onClick={onRefuse}
          onMouseEnter={() => setRefHover(true)}
          onMouseLeave={() => setRefHover(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: refBg, color: refCl, border: `1px solid ${refBd}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}>
          <XCircle size={14} />{refused ? 'Annuler refus' : 'Refuser'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>1 bien sélectionné</span>
          <button
            onClick={onPropose}
            disabled={!mail || sending}
            onMouseEnter={() => setSendHover(true)}
            onMouseLeave={() => setSendHover(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 26px', borderRadius: 11, background: mail ? (sendHover ? '#2D5A8A' : '#1E3A5F') : '#f3f4f6', color: mail ? '#fff' : '#9ca3af', border: 'none', fontSize: 14, fontWeight: 700, cursor: mail ? 'pointer' : 'default', boxShadow: mail ? (sendHover ? '0 6px 20px rgba(30,58,95,0.45)' : '0 4px 14px rgba(30,58,95,0.35)') : 'none', transform: mail && sendHover ? 'translateY(-1px)' : 'translateY(0)', transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)' }}>
            <Send size={15} />{sending ? 'Envoi…' : match.date_email_envoye ? 'Renvoyer' : 'Envoyer la sélection →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ProspectCard ──────────────────────────────────────────────────────────────
const ProspectCard = memo(function ProspectCard({ group, onRunSingle, onPropose, onRefuse, sendingEmail, analyzing, defaultOpen }) {
  const sorted = [...group.matchings].sort((a, b) => {
    const rA = a.statut_prospect === 'refused' ? 1 : 0
    const rB = b.statut_prospect === 'refused' ? 1 : 0
    return rA - rB || b.score - a.score
  })
  const best = sorted[0]
  const [selId, setSelId]         = useState(defaultOpen && best ? best.id : null)
  const [prospectData, setProspectData] = useState(null)   // données fetchées pour la modal
  const [bienModal, setBienModal] = useState(null)          // bien object pour la BienModal
  const sel = selId ? sorted.find(m => m.id === selId) || best : null
  const [a, b] = avP(group.prospect_nom)
  const { dark } = useTheme()
  const _bg   = dark ? '#0f1e30' : '#fff'
  const _bd   = dark ? 'rgba(255,255,255,0.07)' : '#edf1f7'
  const _sep  = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'
  const _tx   = dark ? '#7dd3fc' : '#1E3A5F'
  const _sub  = dark ? 'rgba(255,255,255,0.45)' : '#64748b'
  const _mid  = dark ? '#0f1e30' : 'linear-gradient(180deg,#fbfcfe 0%,#f8fafc 100%)'
  const _dot  = dark ? 'rgba(30,58,95,0.15)' : 'rgba(30,58,95,0.05)'
  const _brief = dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'
  const _btn  = dark ? 'rgba(255,255,255,0.06)' : '#fbfcfe'
  const _btnBd = dark ? 'rgba(255,255,255,0.08)' : '#e8eef5'

  const zones    = [...new Set(sorted.map(m => m.bien_ville).filter(Boolean))].slice(0, 2).join(', ') || '—'
  const lastNew  = sorted.find(m => m.date_creation && new Date(m.date_creation).getTime() > _24H_AGO)
  const heureNew = lastNew?.date_creation ? lastNew.date_creation.slice(11, 16) : null
  const mainType = sorted[0]?.bien_type || '—'

  const openProspectModal = async () => {
    if (prospectData) return setProspectData({ ...prospectData, _open: true }) // re-open
    const data = await apiFetch(`/prospects/${group.prospect_id}`).then(r => r.json()).catch(() => null)
    if (data) setProspectData({ ...data, _open: true })
  }

  const openBienModal = async (bienId) => {
    const data = await apiFetch(`/biens/${bienId}`).then(r => r.json()).catch(() => null)
    if (data) setBienModal(data)
  }

  return (
    <>
      {prospectData?._open && (
        <ProspectModal
          prospect={prospectData}
          gradientFrom={a}
          gradientTo={b}
          onClose={() => setProspectData(d => ({ ...d, _open: false }))}
        />
      )}
      {bienModal && <BienModal bien={bienModal} onClose={() => setBienModal(null)} />}

      <div style={{ background: _bg, borderRadius: 20, border: `1px solid ${_bd}`, boxShadow: dark ? '0 1px 0 rgba(255,255,255,0.05),0 8px 32px rgba(0,0,0,0.3)' : '0 1px 0 #e8eef5,0 8px 32px rgba(30,58,95,0.06)', overflow: 'hidden', transition: 'box-shadow 0.2s ease,transform 0.2s ease' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow=dark?'0 1px 0 rgba(255,255,255,0.07),0 16px 44px rgba(0,0,0,0.4)':'0 1px 0 #e8eef5,0 16px 44px rgba(30,58,95,0.10)'; e.currentTarget.style.transform='translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow=dark?'0 1px 0 rgba(255,255,255,0.05),0 8px 32px rgba(0,0,0,0.3)':'0 1px 0 #e8eef5,0 8px 32px rgba(30,58,95,0.06)'; e.currentTarget.style.transform='translateY(0)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 210px 1.2fr', minHeight: 250 }}>

          {/* ── GAUCHE — PCBriefGlow ── */}
          <div style={{ padding: '28px', borderRight: `1px solid ${_sep}`, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, left: -50, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle at 30% 30%,${a}24 0%,transparent 70%)`, filter: 'blur(14px)', pointerEvents: 'none' }} />

            {/* Avatar + nom */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -4, background: `linear-gradient(135deg,${a},${b})`, borderRadius: 18, filter: 'blur(10px)', opacity: 0.45 }} />
                <div style={{ position: 'relative', width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${a},${b})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
                  {ini(group.prospect_nom)}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: _tx, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.prospect_nom}</div>
                <div style={{ fontSize: 13, color: _sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.15)', flexShrink: 0 }} />
                  <span>Actif · {group.matchings.length} match{group.matchings.length > 1 ? 's' : ''}</span>
                  {heureNew && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9999, padding: '1px 8px' }}>Nouveau · {heureNew}</span>}
                </div>
              </div>
            </div>

            {/* Brief box — cliquable → modal prospect */}
            <button
              onClick={openProspectModal}
              style={{ position: 'relative', padding: '14px 16px', background: _brief, backdropFilter: 'blur(4px)', borderRadius: 13, border: `1px solid ${_bd}`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background=dark?'rgba(255,255,255,0.1)':'#f0f4ff'; e.currentTarget.style.borderColor=dark?'rgba(125,211,252,0.3)':'#bfdbfe' }}
              onMouseLeave={e => { e.currentTarget.style.background=_brief; e.currentTarget.style.borderColor=_bd }}
            >
              <div style={{ position: 'absolute', top: 11, left: -1, width: 3, height: 'calc(100% - 22px)', background: `linear-gradient(to bottom,${a},${b})`, borderRadius: 9999 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Cherche</div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>›</span>
              </div>
              <div style={{ fontSize: 15, color: _tx, lineHeight: 1.4, fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>{mainType}</span>
                {zones !== '—' && <> à <span style={{ fontWeight: 700 }}>{zones}</span></>}
              </div>
            </button>

            {/* Budget + refresh */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Budget</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: _tx, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{mon(group.prospect_budget)}</div>
              </div>
              <button onClick={e => onRunSingle(e, group.prospect_id, group.prospect_nom)} disabled={analyzing} title="Relancer l'analyse"
                style={{ width: 34, height: 34, borderRadius: 11, border: `1px solid ${_btnBd}`, background: _btn, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color=dark?'#7dd3fc':'#1E3A5F'; e.currentTarget.style.background=dark?'rgba(255,255,255,0.1)':'#eff6ff'; e.currentTarget.style.borderColor=dark?'rgba(125,211,252,0.3)':'#bfdbfe' }}
                onMouseLeave={e => { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background=_btn; e.currentTarget.style.borderColor=_btnBd }}
              ><RefreshCw size={14} /></button>
            </div>
          </div>

          {/* ── CENTRE — ScoreRing ── */}
          <div style={{ display: 'grid', placeItems: 'center', padding: '22px 16px', borderRight: `1px solid ${_sep}`, background: _mid, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle,${_dot} 1px,transparent 1px)`, backgroundSize: '14px 14px', pointerEvents: 'none', opacity: 0.6 }} />
            <div style={{ position: 'relative' }}>{best && <ScoreRing score={(sel ?? best).score} size={140} />}</div>
          </div>

          {/* ── DROITE — GemBadges ── */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center' }}>
            {sorted.slice(0, 4).map(m => (
              <GemBadge key={m.id} score={m.score} ville={m.bien_ville} prix={m.bien_prix} surface={m.bien_surface} pieces={m.bien_pieces} photos={m.bien_photos}
                selected={sel?.id === m.id}
                onClick={() => setSelId(sel?.id === m.id ? null : m.id)}
                onOpenBien={() => openBienModal(m.bien_id)}
              />
            ))}
            {sorted.length > 4 && <div style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 10, marginTop: 2 }}>+{sorted.length - 4} autre{sorted.length - 4 > 1 ? 's' : ''}</div>}
          </div>
        </div>

        {/* ── Panneau détail ── */}
        <div style={{ maxHeight: sel ? '1000px' : '0px', opacity: sel ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1),opacity 0.3s ease' }}>
          {sel && (
            <BienDetail match={sel} mail={group.prospect_mail} nom={group.prospect_nom} sending={sendingEmail === sel.id}
              onPropose={() => onPropose(sel, group.prospect_mail, group.prospect_nom)}
              onRefuse={() => onRefuse(sel)}
            />
          )}
        </div>
      </div>
    </>
  )
})

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MatchingsPageV2() {
  const { agency } = useAgency()
  const agencyNom = agency?.nom || 'ImmoFlash'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filterBienId = searchParams.get('bien') ? parseInt(searchParams.get('bien')) : null


  const [matchings, setMatchings]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterScore, setFilterScore]   = useState('all')
  const [filterNew, setFilterNew]       = useState(false)
  const [sortBy, setSortBy]             = useState('recent')   // par défaut : plus récents
  const [sendingEmail, setSendingEmail] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const [analyzing, setAnalyzing]               = useState(false)
  const [showOverlay, setShowOverlay]           = useState(false)
  const [overlayCompleted, setOverlayCompleted] = useState(false)
  const [totalProspects, setTotalProspects]     = useState(0)
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentProspectName, setCurrentProspectName]   = useState('')
  const cancelRef  = useRef(false)

  const [emailModal, setEmailModal]     = useState({ isOpen: false, type: 'confirm', data: null, isLoading: false })
  const [pendingEmail, setPendingEmail] = useState(null)
  const [previewHtml, setPreviewHtml]   = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({ subject: '', intro: '', points_forts: '', points_attention: '', recommandation: '', conclusion: '', lien_annonce: '' })

  const buildDefault = (m) => ({ subject: `Proposition immobilière - ${m.bien_type} à ${m.bien_ville} | ${agencyNom}`, intro: "Suite à notre dernier échange, nous avons le plaisir de vous proposer un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention.", points_forts: m.points_forts || '', points_attention: m.points_attention || '', recommandation: m.recommandation || '', conclusion: "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite.", lien_annonce: m.lien_annonce || '' })

  const fetchData = useCallback(() => { setLoading(true); return apiFetch('/matchings').then(r => r.json()).then(data => { setMatchings(Array.isArray(data) ? data : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  useEffect(() => { fetchData() }, [fetchData])


  const runGlobal = async () => {
    cancelRef.current = false; setAnalyzing(true); setShowOverlay(true); setCurrentProspectIndex(0)
    try {
      const prospects = await apiFetch('/prospects').then(r => r.json())
      if (!Array.isArray(prospects) || !prospects.length) { setShowOverlay(false); setAnalyzing(false); return }
      setTotalProspects(prospects.length)
      for (let i = 0; i < prospects.length; i++) {
        if (cancelRef.current) break
        setCurrentProspectIndex(i + 1); setCurrentProspectName(prospects[i].nom || '')
        try { await apiFetch(`/matching/run/${prospects[i].id}`, { method: 'POST' }).then(r => r.json()) } catch {}
      }
      setShowOverlay(false); await fetchData()
      if (!cancelRef.current) { const d = await apiFetch('/matchings').then(r => r.json()); if (d.some(m => m.score >= 80)) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) } }
    } catch { setShowOverlay(false) }
    setAnalyzing(false)
  }

  const runSingle = useCallback(async (e, id, nom) => {
    e.stopPropagation(); setAnalyzing(true); setShowOverlay(true); setOverlayCompleted(false)
    setTotalProspects(1); setCurrentProspectIndex(1); setCurrentProspectName(nom || '')
    try { const d = await apiFetch(`/matching/run/${id}`, { method: 'POST' }).then(r => r.json()); if (d.error) alert('Erreur: ' + d.error); else await fetchData() } catch { alert("Erreur lors de l'analyse") }
    setOverlayCompleted(true); setTimeout(() => { setShowOverlay(false); setOverlayCompleted(false); setAnalyzing(false) }, 700)
  }, [fetchData])

  const openEmail = useCallback((match, mail, nom) => {
    if (!mail) { setEmailModal({ isOpen: true, type: 'error', data: { error: "Pas d'email enregistré." }, isLoading: false }); return }
    const draft = sessionStorage.getItem(`emailDraft_${match.id}`)
    const init = draft ? JSON.parse(draft) : buildDefault(match)
    setEmailContent(init); setPendingEmail({ match, prospectMail: mail, prospectNom: nom })
    loadPreview(match, mail, nom, init)
    setEmailModal({ isOpen: true, type: 'confirm', data: { prospectNom: nom, prospectMail: mail, bienType: match.bien_type, bienVille: match.bien_ville, bienPrix: mon(match.bien_prix) }, isLoading: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency])

  const loadPreview = async (match, mail, nom, content) => {
    setPreviewLoading(true); setPreviewHtml(null)
    try {
      const r = await apiFetch('/preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: mail.trim(), to_name: nom, subject: content.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: content.points_forts, points_attention: content.points_attention, recommandation: content.recommandation, lien_annonce: content.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: fPhoto(match.bien_photos), custom_intro: content.intro, custom_conclusion: content.conclusion }) })
      const res = await r.json(); setPreviewHtml(res.success ? res.html : `<div style="padding:20px;color:red">${res.error}</div>`)
    } catch (err) { setPreviewHtml(`<div style="padding:20px;color:red">Erreur: ${err.message}</div>`) }
    setPreviewLoading(false)
  }

  const confirmSend = async () => {
    if (!pendingEmail) return
    const { match, prospectMail, prospectNom } = pendingEmail
    setEmailModal(p => ({ ...p, isLoading: true })); setSendingEmail(match.id)
    try {
      const res = await apiFetch('/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: prospectMail.trim(), to_name: prospectNom, subject: emailContent.subject, bien_type: match.bien_type, bien_ville: match.bien_ville, bien_prix: mon(match.bien_prix), bien_surface: match.bien_surface ? `${match.bien_surface} m²` : null, bien_pieces: match.bien_pieces ? `${match.bien_pieces} pièces` : null, points_forts: emailContent.points_forts, points_attention: emailContent.points_attention, recommandation: emailContent.recommandation, lien_annonce: emailContent.lien_annonce, bien_id: match.bien_id, agency_slug: agency?.slug, bien_image_url: fPhoto(match.bien_photos), custom_intro: emailContent.intro, custom_conclusion: emailContent.conclusion }) }).then(r => r.json())
      if (res.success) {
        sessionStorage.removeItem(`emailDraft_${match.id}`)
        await apiFetch(`/matchings/${match.id}/email-sent`, { method: 'PATCH' })
        setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, date_email_envoye: new Date().toISOString() } : m))
        setEmailModal({ isOpen: true, type: 'success', data: { prospectNom, bienType: match.bien_type, bienVille: match.bien_ville, via_fallback: res.via_fallback, fallback_address: res.fallback_address }, isLoading: false })
      } else { setEmailModal({ isOpen: true, type: 'error', data: { error: res.error || 'Erreur envoi' }, isLoading: false }) }
    } catch { setEmailModal({ isOpen: true, type: 'error', data: { error: 'Erreur de connexion' }, isLoading: false }) }
    setSendingEmail(null); setPendingEmail(null)
  }

  useEffect(() => { if (emailModal.isOpen && emailModal.type === 'confirm' && pendingEmail) sessionStorage.setItem(`emailDraft_${pendingEmail.match.id}`, JSON.stringify(emailContent)) }, [emailContent])
  const closeEmail = () => { setEmailModal({ isOpen: false, type: 'confirm', data: null, isLoading: false }); setPendingEmail(null); setPreviewHtml(null) }

  const handleRefuse = useCallback(async (match) => {
    const refused = match.statut_prospect === 'refused'
    try { await apiFetch(`/matchings/${match.id}/statut-prospect`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: refused ? null : 'refused' }) }); setMatchings(prev => prev.map(m => m.id === match.id ? { ...m, statut_prospect: refused ? null : 'refused' } : m)) } catch {}
  }, [])

  const nbNew = useMemo(() => matchings.filter(m => m.date_creation && new Date(m.date_creation).getTime() > _24H_AGO).length, [matchings])

  const { filtered, groups } = useMemo(() => {
    const s = search.toLowerCase()
    const filtered = matchings.filter(m => {
      if (s && !m.prospect_nom?.toLowerCase().includes(s) && !m.bien_ville?.toLowerCase().includes(s)) return false
      if (filterScore === 'bon65'     && m.score < 65) return false
      if (filterScore === 'excellent' && m.score < 80) return false
      if (filterNew && !(m.date_creation && new Date(m.date_creation).getTime() > _24H_AGO)) return false
      if (filterBienId && m.bien_id !== filterBienId) return false
      return true
    })
    const grouped = filtered.reduce((acc, m) => {
      if (!acc[m.prospect_id]) acc[m.prospect_id] = { prospect_id: m.prospect_id, prospect_nom: m.prospect_nom, prospect_budget: m.prospect_budget, prospect_mail: m.prospect_mail, matchings: [] }
      acc[m.prospect_id].matchings.push(m); return acc
    }, {})
    const groups = Object.values(grouped).sort((a, b) => {
      if (sortBy === 'score') return Math.max(...b.matchings.map(m => m.score_pondere ?? m.score)) - Math.max(...a.matchings.map(m => m.score_pondere ?? m.score))
      if (sortBy === 'alpha') return (a.prospect_nom || '').localeCompare(b.prospect_nom || '', 'fr')
      const tA = Math.max(...a.matchings.map(m => new Date(m.date_creation || 0).getTime()))
      const tB = Math.max(...b.matchings.map(m => new Date(m.date_creation || 0).getTime()))
      const sameMinute = Math.abs(tB - tA) < 60000
      if (!sameMinute) return tB - tA
      return Math.max(...b.matchings.map(m => m.score)) - Math.max(...a.matchings.map(m => m.score))
    })
    return { filtered, groups }
  }, [matchings, search, filterScore, filterNew, filterBienId, sortBy])

  return (
    <div style={{ margin: '-24px', padding: '32px 24px', minHeight: 'calc(100vh - 60px)', position: 'relative' }}>

    <div style={{ maxWidth: 1020, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <Confetti show={showConfetti} />
      <EmailModal isOpen={emailModal.isOpen} onClose={closeEmail} type={emailModal.type} data={emailModal.data} onConfirm={confirmSend} isLoading={emailModal.isLoading} previewHtml={previewHtml} previewLoading={previewLoading} emailContent={emailContent} setEmailContent={setEmailContent} onRegeneratePreview={() => pendingEmail && loadPreview(pendingEmail.match, pendingEmail.prospectMail, pendingEmail.prospectNom, emailContent)} smtpConfigured={agency?.smtp_configured ?? true} />
      <AnalysisOverlay isVisible={showOverlay} totalProspects={totalProspects} currentProspect={currentProspectIndex} currentProspectName={currentProspectName} isCompleted={overlayCompleted} onCancel={() => { cancelRef.current = true; setShowOverlay(false); setAnalyzing(false) }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/matchings-v1')} className="p-2 rounded-xl text-gray-400 hover:text-[#1E3A5F] hover:bg-white/60 transition-all" title="Ancienne vue">
          <ArrowLeft size={19} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Matchings</h1>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 6, padding: '3px 8px' }}>NOUVEAU</span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Chargement…' : `${groups.length} prospect${groups.length > 1 ? 's' : ''} · ${filtered.length} matchings`}
          </p>
        </div>

        <SparkleButton onClick={runGlobal} disabled={analyzing} className="ml-auto">
          {analyzing
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />Analyse en cours…</span>
            : <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={16} />Analyse global</span>
          }
        </SparkleButton>
      </div>

      {/* Recherche */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Prospect ou ville…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
      </div>

      {/* Filtres + tri */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Filtres score */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pill Nouveaux — toggle indépendant */}
          <button onClick={() => setFilterNew(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, transition: 'all .25s ease',
            background: filterNew ? '#059669' : 'rgba(255,255,255,.65)',
            backdropFilter: 'blur(12px)',
            border: filterNew ? '1px solid rgba(5,150,105,.3)' : '1px solid rgba(0,0,0,.07)',
            boxShadow: filterNew ? '0 2px 8px rgba(5,150,105,.25)' : 'inset 1px 1px 3px rgba(255,255,255,.8),0 2px 6px rgba(0,0,0,.06)',
            color: filterNew ? 'white' : '#64748b',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: filterNew ? 'rgba(255,255,255,.8)' : '#10b981', flexShrink: 0 }} />
            Nouveaux{nbNew > 0 && <span style={{ opacity: .8 }}> ({nbNew})</span>}
          </button>
          {/* Glass group score */}
          <div className="glass-sort-group">
            {[{ v: 'all', label: 'Tous' }, { v: 'bon65', label: '≥ 65' }, { v: 'excellent', label: '≥ 80' }].map(f => (
              <button key={f.v} onClick={() => setFilterScore(f.v)}
                className={`glass-sort-btn${filterScore === f.v ? ' active' : ''}`}>
                {f.label}
              </button>
            ))}
            <div className="glass-sort-glider" style={{ transform: `translateX(${['all', 'bon65', 'excellent'].indexOf(filterScore) * 100}%)` }} />
          </div>
        </div>

        {/* Tri */}
        <div className="glass-sort-group">
          {[{ v: 'recent', label: 'Récents' }, { v: 'score', label: 'Score' }, { v: 'alpha', label: 'A→Z' }].map(s => (
            <button key={s.v} onClick={() => setSortBy(s.v)}
              className={`glass-sort-btn${sortBy === s.v ? ' active' : ''}`}>
              {s.label}
            </button>
          ))}
          <div className="glass-sort-glider" style={{ transform: `translateX(${['recent', 'score', 'alpha'].indexOf(sortBy) * 100}%)` }} />
        </div>
      </div>

      {filterBienId && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-blue-700">Filtré sur le bien #{filterBienId} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <button onClick={() => navigate('/matchings-v2')} className="text-blue-500 hover:underline">Voir tout</button>
        </div>
      )}

      {/* Cartes */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div style={{ position: 'relative', width: 96, height: 86, margin: '0 auto 20px' }}>
            {/* Étoile principale — même rendu 3D que l'AnalysisOverlay */}
            <svg viewBox="0 0 100 100" width={62} height={62} style={{ position: 'absolute', left: 17, top: 8, animation: 'star-float 3.2s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(124,58,237,.35))' }}>
              <defs>
                <radialGradient id="es1-da" cx="50" cy="66" fx="50" fy="66" r="30" gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="black" stopOpacity="0.3"/><stop offset="50%" stopColor="black" stopOpacity="0.1"/><stop offset="100%" stopColor="black" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="es1-lb" cx="55" cy="20" fx="55" fy="20" r="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0.35"/><stop offset="50%" stopColor="white" stopOpacity="0.1"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="#7C3AED"/>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#es1-da)"/>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#es1-lb)"/>
            </svg>
            {/* Étoile secondaire haut-droite */}
            <svg viewBox="0 0 100 100" width={29} height={29} style={{ position: 'absolute', right: 0, top: 0, animation: 'star-drift 4.1s ease-in-out infinite', filter: 'drop-shadow(0 0 6px rgba(167,139,250,.4))' }}>
              <defs>
                <radialGradient id="es2-da" cx="50" cy="66" fx="50" fy="66" r="30" gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="black" stopOpacity="0.25"/><stop offset="100%" stopColor="black" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="es2-lb" cx="55" cy="20" fx="55" fy="20" r="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0.35"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="#A78BFA"/>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#es2-da)"/>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#es2-lb)"/>
            </svg>
            {/* Petite étoile bas-gauche */}
            <svg viewBox="0 0 100 100" width={17} height={17} style={{ position: 'absolute', left: 0, bottom: 0, animation: 'star-pulse 2.6s ease-in-out infinite', animationDelay: '.9s', filter: 'drop-shadow(0 0 4px rgba(196,181,253,.5))' }}>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="#C4B5FD"/>
            </svg>
          </div>
          <p className="font-semibold text-[#1E3A5F] mb-1">Aucun matching</p>
          <p className="text-sm text-gray-400 mb-5">Lance une analyse pour trouver des correspondances</p>
          <button onClick={runGlobal} className="px-5 py-2.5 bg-[#1E3A5F] text-white font-semibold rounded-xl inline-flex items-center gap-2">
            <Sparkles size={16} /> Lancer l'analyse
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g, idx) => (
            <ProspectCard key={g.prospect_id} group={g} defaultOpen={idx === 0}
              onRunSingle={runSingle}
              onPropose={openEmail}
              onRefuse={handleRefuse}
              sendingEmail={sendingEmail}
              analyzing={analyzing}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
