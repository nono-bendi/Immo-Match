// ══════════════════════════════════════════════════════════════
// LandingPage.jsx — ImmoFlash · SaaS Commercial
// Hero · Preuves · Features · Pricing Stripe-ready · FAQ · CTA
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, RefreshCw, Shuffle, Bell, SlidersHorizontal,
  Building2, Star, Zap, CheckCircle2, X,
  ChevronDown, ChevronRight, Shield, Clock, TrendingUp,
} from 'lucide-react'

function useInter() {
  useEffect(() => {
    if (document.getElementById('lp-inter')) return
    const l = document.createElement('link'); l.id = 'lp-inter'
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
    document.head.appendChild(l)
  }, [])
}

function useReveal(delay = 0) {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setV(true), delay); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return [ref, v]
}

function ParticlesCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animId
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.2 + 0.4, o: Math.random() * 0.3 + 0.06,
    }))
    const D = 110
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx*dx+dy*dy)
        if (d < D) { ctx.beginPath(); ctx.strokeStyle = `rgba(255,255,255,${0.06*(1-d/D)})`; ctx.lineWidth = 0.5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke() }
      }
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

// ── Mini mockup app ───────────────────────────────────────────
function AppPreview() {
  const rows = [
    { i:'MJ', n:'Martin Jean-Luc', b:'Villa · Grimaud · 480k€', s:94, c:'#10b981' },
    { i:'FI', n:'Faure Isabelle',  b:'Appt · Ste-Maxime · 320k€', s:81, c:'#10b981' },
    { i:'RP', n:'Rossetti Pierre', b:'Maison · Puget · 250k€', s:67, c:'#f59e0b' },
  ]
  return (
    <div style={{ borderRadius:16, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)', background:'#0d1826', fontFamily:'Inter,system-ui', width:'100%', maxWidth:560 }}>
      <div style={{ background:'#080f1a', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', gap:5 }}>{['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}</div>
        <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:5, padding:'3px 10px', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#10b981'}}/><span style={{fontSize:10,color:'rgba(255,255,255,0.25)'}}>app.immoflash.fr</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(13,24,38,0.9)' }}>
        <div><div style={{fontSize:14,fontWeight:700,color:'#f1f5f9',letterSpacing:'-0.03em'}}>Matchings du jour</div><div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:1}}>234 correspondances · 92 biens actifs</div></div>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:8, padding:'4px 10px' }}>
          <RefreshCw size={10} color="#38bdf8" style={{animation:'spin-lp 4s linear infinite'}}/><span style={{fontSize:10,color:'#38bdf8',fontWeight:600}}>Sync · 1 min</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', background:'rgba(0,0,0,0.15)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {[{v:'92',l:'Biens',c:'#60a5fa'},{v:'47',l:'Prospects',c:'#a78bfa'},{v:'234',l:'Matchings',c:'#fcd34d'}].map((k,i)=>(
          <div key={k.l} style={{padding:'10px 14px',borderRight:i<2?'1px solid rgba(255,255,255,0.04)':'none'}}>
            <div style={{fontSize:18,fontWeight:800,color:k.c,letterSpacing:'-0.04em'}}>{k.v}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2}}>{k.l}</div>
          </div>
        ))}
      </div>
      {rows.map((r,i)=>(
        <div key={r.n} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',borderBottom:i<rows.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1E3A5F,#2D5A8A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#60a5fa',border:'1px solid rgba(96,165,250,0.2)',flexShrink:0}}>{r.i}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:'#f1f5f9',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.n}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:1}}>{r.b}</div>
          </div>
          <div style={{padding:'2px 9px',borderRadius:99,background:`${r.c}18`,border:`1px solid ${r.c}30`,fontSize:11,fontWeight:700,color:r.c,flexShrink:0}}>{r.s}%</div>
          <ChevronRight size={12} color="rgba(255,255,255,0.15)" style={{flexShrink:0}}/>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ══════════════════════════════════════════════════════════════
const GlobalStyles = () => (
  <style>{`
    @keyframes spin-lp { to { transform: rotate(360deg); } }
    @keyframes blobDrift {
      0%,100% { transform: translate(0,0); }
      40%     { transform: translate(70px,-50px); }
      70%     { transform: translate(-25px,55px); }
    }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUpLate { 0%,18%{opacity:0;transform:translateY(28px)} 100%{opacity:1;transform:translateY(0)} }
    @keyframes revealUp { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulseDot { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

    .lp-wrap * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
    .lp-reveal { opacity:0; transform:translateY(36px); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); }
    .lp-reveal.show { opacity:1; transform:translateY(0); }

    .btn-primary {
      display:inline-flex; align-items:center; gap:9px;
      background:#fff; color:#0a1520; border:none; border-radius:12px;
      padding:14px 28px; font-size:15px; font-weight:700; cursor:pointer;
      box-shadow:0 0 0 1px rgba(255,255,255,0.12), 0 8px 28px rgba(0,0,0,0.35);
      transition:all 0.2s; letter-spacing:-0.01em;
    }
    .btn-primary:hover { transform:translateY(-2px); background:#f0f9ff; box-shadow:0 0 0 1px rgba(255,255,255,0.2),0 16px 48px rgba(0,0,0,0.4); }

    .btn-outline {
      display:inline-flex; align-items:center; gap:8px;
      background:transparent; color:rgba(255,255,255,0.65);
      border:1px solid rgba(255,255,255,0.12); border-radius:12px;
      padding:13px 22px; font-size:14px; font-weight:500; cursor:pointer;
      transition:all 0.2s; letter-spacing:-0.01em;
    }
    .btn-outline:hover { background:rgba(255,255,255,0.07); color:#fff; border-color:rgba(255,255,255,0.22); }

    .price-card {
      border-radius:20px; padding:32px 28px;
      background:rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.08);
      transition:all 0.25s;
    }
    .price-card:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.14); transform:translateY(-4px); }
    .price-card.popular {
      background:rgba(96,165,250,0.08);
      border:1.5px solid rgba(96,165,250,0.35);
      position:relative;
    }
    .price-card.popular:hover { background:rgba(96,165,250,0.12); }

    .faq-item { border-bottom:1px solid rgba(255,255,255,0.06); }
    .faq-btn { width:100%; background:none; border:none; padding:20px 0; display:flex; align-items:center; justify-content:space-between; cursor:pointer; text-align:left; transition:opacity 0.2s; }
    .faq-btn:hover { opacity:0.8; }

    .stat-badge {
      display:flex; flex-direction:column; align-items:center;
      background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
      border-radius:16px; padding:24px 20px;
    }
    .feat-row:hover { background:rgba(255,255,255,0.02); }
  `}</style>
)

// ══════════════════════════════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════════════════════════════
function Navbar({ onLogin }) {
  return (
    <nav className="lp-wrap" style={{ position:'sticky', top:0, zIndex:50, background:'rgba(10,21,32,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1E3A5F,#2D5A8A)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(30,58,95,0.5)' }}>
          <Shuffle size={16} color="#60a5fa" strokeWidth={2.5}/>
        </div>
        <span style={{ fontSize:18, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.05em' }}>
          Immo<span style={{ color:'#60a5fa' }}>Match</span>
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <a href="#pricing" style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'color 0.2s' }}
          onMouseEnter={e=>e.target.style.color='#f1f5f9'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>
          Tarifs
        </a>
        <button onClick={onLogin} className="btn-primary" style={{ padding:'8px 20px', fontSize:13 }}>
          Se connecter
        </button>
      </div>
    </nav>
  )
}

// ══════════════════════════════════════════════════════════════
// HERO
// ══════════════════════════════════════════════════════════════
function Hero({ onLogin }) {
  return (
    <section style={{ position:'relative', background:'#0a1520', overflow:'hidden', minHeight:'90vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'80px 40px' }}>
      <ParticlesCanvas />
      <div style={{ position:'absolute', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle,rgba(30,90,160,0.2) 0%,transparent 65%)', top:-350, left:-250, pointerEvents:'none', zIndex:0, animation:'blobDrift 26s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(96,165,250,0.07) 0%,transparent 65%)', bottom:-100, right:0, pointerEvents:'none', zIndex:0, animation:'blobDrift 32s ease-in-out reverse infinite' }}/>
      <div style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'28px 28px' }}/>

      <div className="lp-wrap" style={{ position:'relative', zIndex:10, maxWidth:1200, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', gap:80 }}>
        {/* LEFT */}
        <div style={{ flex:'0 0 auto', maxWidth:540 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.18)', borderRadius:99, padding:'6px 14px', marginBottom:28, animation:'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', boxShadow:'0 0 6px #38bdf8', animation:'pulseDot 2.5s infinite' }}/>
            <span style={{ fontSize:12, color:'#7dd3fc', fontWeight:600, letterSpacing:'0.04em' }}>Intégration native Hektor FTP</span>
          </div>

          <h1 style={{ fontSize:'clamp(2.8rem,4.5vw,4rem)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.05em', marginBottom:22, color:'#f1f5f9', animation:'fadeUp 0.7s 0.05s cubic-bezier(0.22,1,0.36,1) both' }}>
            Ne ratez plus jamais<br/>un matching.<br/>
            <span style={{ background:'linear-gradient(135deg,#60a5fa 0%,#38bdf8 60%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Jamais.
            </span>
          </h1>

          <p style={{ fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.78, maxWidth:460, marginBottom:36, fontWeight:400, animation:'fadeUp 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
            ImmoFlash synchronise vos annonces Hektor et les met en correspondance avec vos acheteurs — automatiquement. Chaque bien, chaque prospect, zéro oubli.
          </p>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48, animation:'fadeUp 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
            <button onClick={onLogin} className="btn-primary">
              Essayer gratuitement <ArrowRight size={16}/>
            </button>
            <a href="#pricing" className="btn-outline" style={{ textDecoration:'none' }}>
              Voir les tarifs
            </a>
          </div>

          {/* Social proof mini */}
          <div style={{ display:'flex', alignItems:'center', gap:16, animation:'fadeUp 0.7s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ display:'flex' }}>
              {['MJ','FI','RP','BD'].map((i,idx)=>(
                <div key={i} style={{ width:30, height:30, borderRadius:'50%', background:`hsl(${210+idx*15},60%,35%)`, border:'2px solid #0a1520', marginLeft:idx?-8:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{i}</div>
              ))}
            </div>
            <div>
              <div style={{ display:'flex', gap:2, marginBottom:3 }}>
                {[1,2,3,4,5].map(i=><Star key={i} size={12} color="#fcd34d" fill="#fcd34d"/>)}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Utilisé par <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:600 }}>Saint François Immo</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex:1, display:'flex', justifyContent:'center', animation:'fadeUpLate 1s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ animation:'float 6s ease-in-out infinite', width:'100%' }}>
            <AppPreview/>
          </div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════
function Stats() {
  const [ref, v] = useReveal()
  return (
    <section ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#080f1a', padding:'60px 40px', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
        {[
          { v:'< 5 min', l:'Pour être opérationnel', icon:<Zap size={20} color="#fcd34d"/>, c:'#fcd34d' },
          { v:'100 %', l:'Des biens Hektor analysés', icon:<Building2 size={20} color="#60a5fa"/>, c:'#60a5fa' },
          { v:'0–100', l:'Score de compatibilité', icon:<TrendingUp size={20} color="#10b981"/>, c:'#10b981' },
          { v:'2 jours', l:'Délai rétention biens vendus', icon:<Clock size={20} color="#a78bfa"/>, c:'#a78bfa' },
        ].map(s=>(
          <div key={s.l} className="stat-badge">
            <div style={{ marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:28, fontWeight:900, color:s.c, letterSpacing:'-0.05em', lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:6, textAlign:'center', lineHeight:1.4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// FEATURES / BÉNÉFICES
// ══════════════════════════════════════════════════════════════
function Features() {
  const [ref, v] = useReveal()
  const feats = [
    { icon:<RefreshCw size={22} color="#38bdf8"/>, bg:'rgba(56,189,248,0.08)', bd:'rgba(56,189,248,0.15)',
      title:'Sync Hektor automatique', emoji:'🔄',
      desc:'Vos annonces FTP importées en temps réel. Nouveaux biens, prix mis à jour, biens vendus — tout est capturé sans aucune action de votre part.',
      points:['Détection nouveaux biens instantanée','Mise à jour automatique des prix','Suppression biens vendus après 2 jours','Appartements, maisons, villas'] },
    { icon:<Shuffle size={22} color="#60a5fa"/>, bg:'rgba(96,165,250,0.08)', bd:'rgba(96,165,250,0.15)',
      title:'Matching multicritères', emoji:'🎯',
      desc:'Chaque bien est comparé à chacun de vos prospects. Un score précis de 0 à 100 % est calculé selon leur profil d\'acheteur.',
      points:['Score budget / surface / type / ville','Résultats triés par pertinence','Biens actifs uniquement','Zéro saisie manuelle'] },
    { icon:<SlidersHorizontal size={22} color="#a78bfa"/>, bg:'rgba(167,139,250,0.08)', bd:'rgba(167,139,250,0.15)',
      title:'Calibration du scoring', emoji:'⚙️',
      desc:'Adaptez le poids de chaque critère à votre marché local. La prévisualisation en temps réel vous montre l\'impact de chaque réglage.',
      points:['Pondération par critère','Prévisualisation instantanée','Sauvegardé par agence','Aucune connaissance technique'] },
    { icon:<Bell size={22} color="#fcd34d"/>, bg:'rgba(252,211,77,0.08)', bd:'rgba(252,211,77,0.15)',
      title:'Alertes & historique', emoji:'🔔',
      desc:'Vos agents reçoivent une notification à chaque nouveau matching pertinent. L\'historique complet reste accessible pour tous.',
      points:['Notification nouveaux biens','Historique des syncs Hektor','Notes sur les biens avant IA','Multi-agents admin / agent'] },
  ]
  return (
    <section ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#0f1e30', padding:'100px 40px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.12)', borderRadius:99, padding:'5px 14px', marginBottom:14 }}>
            <Star size={12} color="#60a5fa"/>
            <span style={{ fontSize:11, color:'#60a5fa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em' }}>Fonctionnalités</span>
          </div>
          <h2 style={{ fontSize:'clamp(2rem,3.5vw,2.8rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.05em', lineHeight:1.15 }}>
            Tout ce dont votre agence<br/>a besoin pour vendre plus.
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', maxWidth:520, margin:'16px auto 0', lineHeight:1.75 }}>
            ImmoFlash s'occupe du travail de mise en relation. Vous, vous vous occupez de vendre.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
          {feats.map(f=>(
            <div key={f.title} style={{ background:f.bg, border:`1px solid ${f.bd}`, borderRadius:20, padding:'32px 28px', transition:'all 0.25s', cursor:'default' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(0,0,0,0.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#f1f5f9', marginBottom:10, letterSpacing:'-0.03em' }}>{f.title}</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.72, marginBottom:18 }}>{f.desc}</p>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:8 }}>
                {f.points.map(p=>(
                  <li key={p} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <CheckCircle2 size={13} color="#10b981" style={{flexShrink:0}}/>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.4 }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// COMMENT ÇA MARCHE
// ══════════════════════════════════════════════════════════════
function HowItWorks() {
  const [ref, v] = useReveal()
  return (
    <section ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#080f1a', padding:'100px 40px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.12)', borderRadius:99, padding:'5px 14px', marginBottom:14 }}>
            <Zap size={12} color="#38bdf8"/>
            <span style={{ fontSize:11, color:'#38bdf8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em' }}>Prise en main</span>
          </div>
          <h2 style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.05em' }}>
            Opérationnel en moins de 5 minutes
          </h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {[
            { n:'01', color:'#38bdf8', title:'Connexion au FTP Hektor', desc:'Renseignez les identifiants FTP de votre compte Hektor dans les paramètres. ImmoFlash commence à importer vos annonces immédiatement.' },
            { n:'02', color:'#60a5fa', title:'Ajoutez vos premiers prospects', desc:'Créez les fiches acheteurs avec leurs critères — budget, surface, type de bien, villes souhaitées. 2 minutes par prospect.' },
            { n:'03', color:'#a78bfa', title:'Laissez ImmoFlash travailler', desc:'À chaque nouvelle annonce Hektor, ImmoFlash calcule les compatibilités et notifie vos agents. Vous ne manquez plus rien.' },
          ].map((s,i)=>(
            <div key={s.n} style={{ display:'flex', gap:28, padding:'32px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.05)':'none' }}>
              <div style={{ flexShrink:0, width:52, height:52, borderRadius:14, background:`${s.color}12`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', marginTop:4 }}>
                <span style={{ fontSize:15, fontWeight:900, color:s.color, letterSpacing:'-0.05em' }}>{s.n}</span>
              </div>
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#f1f5f9', marginBottom:8, letterSpacing:'-0.03em' }}>{s.title}</h3>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.42)', lineHeight:1.75 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// PRICING
// ══════════════════════════════════════════════════════════════
function Pricing({ onLogin }) {
  const [annual, setAnnual] = useState(false)
  const [ref, v] = useReveal()

  const plans = [
    {
      name:'Solo', price:39, desc:'Pour un agent indépendant ou une petite structure.',
      color:'#38bdf8',
      features:[
        { ok:true,  t:'1 agent' },
        { ok:true,  t:'100 biens synchronisés' },
        { ok:true,  t:'50 prospects actifs' },
        { ok:true,  t:'Matching automatique' },
        { ok:true,  t:'Notifications' },
        { ok:false, t:'Calibration du scoring' },
        { ok:false, t:'Historique avancé' },
        { ok:false, t:'Multi-agents' },
      ],
      cta:'Commencer',
    },
    {
      name:'Agence', price:89, desc:'La solution complète pour votre agence.', popular:true,
      color:'#60a5fa',
      features:[
        { ok:true, t:'5 agents' },
        { ok:true, t:'Biens illimités (Hektor)' },
        { ok:true, t:'Prospects illimités' },
        { ok:true, t:'Matching automatique' },
        { ok:true, t:'Notifications temps réel' },
        { ok:true, t:'Calibration du scoring' },
        { ok:true, t:'Historique complet' },
        { ok:false,t:'Multi-agences' },
      ],
      cta:'Choisir Agence',
    },
    {
      name:'Premium', price:179, desc:'Pour les réseaux et multi-agences exigeants.',
      color:'#a78bfa',
      features:[
        { ok:true, t:'Agents illimités' },
        { ok:true, t:'Biens illimités (Hektor)' },
        { ok:true, t:'Prospects illimités' },
        { ok:true, t:'Matching automatique' },
        { ok:true, t:'Notifications temps réel' },
        { ok:true, t:'Calibration avancée' },
        { ok:true, t:'Historique complet' },
        { ok:true, t:'Multi-agences' },
      ],
      cta:'Choisir Premium',
    },
  ]

  return (
    <section id="pricing" ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#0a1520', padding:'100px 40px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(30,90,160,0.15) 0%,transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize:'28px 28px' }}/>

      <div style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.12)', borderRadius:99, padding:'5px 14px', marginBottom:14 }}>
            <Shield size={12} color="#60a5fa"/>
            <span style={{ fontSize:11, color:'#60a5fa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em' }}>Tarifs</span>
          </div>
          <h2 style={{ fontSize:'clamp(2rem,3.5vw,2.8rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.05em', marginBottom:16 }}>
            Simple. Transparent. Sans surprise.
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', marginBottom:32 }}>
            Paiement sécurisé par Stripe. Annulable à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:99, padding:'6px 8px' }}>
            <button onClick={()=>setAnnual(false)} style={{ padding:'6px 16px', borderRadius:99, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:!annual?'rgba(255,255,255,0.12)':'transparent', color:!annual?'#f1f5f9':'rgba(255,255,255,0.4)' }}>Mensuel</button>
            <button onClick={()=>setAnnual(true)} style={{ padding:'6px 16px', borderRadius:99, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:annual?'rgba(255,255,255,0.12)':'transparent', color:annual?'#f1f5f9':'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:7 }}>
              Annuel
              <span style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)', color:'#10b981', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99 }}>-20%</span>
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, alignItems:'start' }}>
          {plans.map(p=>{
            const price = annual ? Math.round(p.price * 0.8) : p.price
            return (
              <div key={p.name} className={`price-card ${p.popular?'popular':''}`}>
                {p.popular && (
                  <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#60a5fa,#38bdf8)', borderRadius:99, padding:'4px 16px', fontSize:11, fontWeight:700, color:'#0a1520', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(96,165,250,0.4)' }}>
                    ⭐ Le plus populaire
                  </div>
                )}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:p.color, marginBottom:6 }}>{p.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:42, fontWeight:900, color:'#f1f5f9', letterSpacing:'-0.06em', lineHeight:1 }}>{price}€</span>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>/mois</span>
                  </div>
                  {annual && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Facturé {price*12}€/an · économisez {(p.price-price)*12}€</div>}
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', marginTop:10, lineHeight:1.6 }}>{p.desc}</p>
                </div>

                <button onClick={onLogin} style={{
                  width:'100%', padding:'13px', borderRadius:12, border:'none',
                  fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s', marginBottom:24,
                  background: p.popular ? `linear-gradient(135deg,#60a5fa,#38bdf8)` : 'rgba(255,255,255,0.07)',
                  color: p.popular ? '#0a1520' : '#f1f5f9',
                  boxShadow: p.popular ? '0 4px 20px rgba(96,165,250,0.35)' : 'none',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.opacity='0.9'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='1'}}
                >
                  {p.cta}
                </button>

                <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:20, display:'flex', flexDirection:'column', gap:10 }}>
                  {p.features.map(f=>(
                    <div key={f.t} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {f.ok
                        ? <CheckCircle2 size={14} color="#10b981" style={{flexShrink:0}}/>
                        : <X size={14} color="rgba(255,255,255,0.18)" style={{flexShrink:0}}/>
                      }
                      <span style={{ fontSize:13, color: f.ok ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)' }}>{f.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stripe badge */}
        <div style={{ textAlign:'center', marginTop:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 20px' }}>
            <Shield size={14} color="rgba(255,255,255,0.3)"/>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>Paiement 100 % sécurisé par</span>
            <span style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.45)', letterSpacing:'-0.02em' }}>stripe</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>· Annulable à tout moment</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// FAQ
// ══════════════════════════════════════════════════════════════
function FAQ() {
  const [ref, v] = useReveal()
  const [open, setOpen] = useState(null)
  const items = [
    { q:'Est-ce compatible avec toutes les versions de Hektor ?', a:"Oui, ImmoFlash se connecte via FTP à votre compte Hektor et importe le fichier CSV standard d'annonces. Toutes les versions de Hektor qui exportent ce format sont compatibles." },
    { q:'Combien de temps pour être opérationnel ?', a:"Moins de 5 minutes. Renseignez vos identifiants FTP Hektor, créez vos premiers prospects, et ImmoFlash commence à faire des matchings dès la première synchronisation." },
    { q:'Que se passe-t-il quand un bien est vendu ?', a:"ImmoFlash détecte automatiquement les biens absents du CSV Hektor et les marque comme vendus. Ils restent visibles 2 jours dans votre interface avant d'être supprimés." },
    { q:'Puis-je personnaliser les critères de matching ?', a:"Oui, la page Calibration vous permet d'ajuster le poids de chaque critère (budget, surface, type de bien, localisation) selon votre marché local, avec une prévisualisation en temps réel." },
    { q:'Est-ce que je peux annuler mon abonnement ?', a:"Absolument. Vous pouvez annuler à tout moment depuis votre espace paramètres. Aucun engagement, aucune pénalité." },
  ]
  return (
    <section ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#080f1a', padding:'100px 40px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <h2 style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.05em' }}>
            Questions fréquentes
          </h2>
        </div>
        {items.map((item,i)=>(
          <div key={i} className="faq-item">
            <button className="faq-btn" onClick={()=>setOpen(open===i?null:i)}>
              <span style={{ fontSize:15, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.02em', paddingRight:24 }}>{item.q}</span>
              <ChevronDown size={18} color="rgba(255,255,255,0.4)" style={{ flexShrink:0, transition:'transform 0.25s', transform:open===i?'rotate(180deg)':'rotate(0)' }}/>
            </button>
            <div style={{ overflow:'hidden', maxHeight:open===i?300:0, transition:'max-height 0.35s cubic-bezier(0.22,1,0.36,1)', opacity:open===i?1:0 }}>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.42)', lineHeight:1.78, paddingBottom:20 }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// CTA FINALE
// ══════════════════════════════════════════════════════════════
function FinalCTA({ onLogin }) {
  const [ref, v] = useReveal()
  return (
    <section ref={ref} className={`lp-wrap lp-reveal ${v?'show':''}`}
      style={{ background:'#0a1520', padding:'120px 40px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(30,90,160,0.2) 0%,transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'28px 28px' }}/>
      <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
        <h2 style={{ fontSize:'clamp(2.2rem,4vw,3.4rem)', fontWeight:900, color:'#f1f5f9', letterSpacing:'-0.05em', lineHeight:1.1, marginBottom:18 }}>
          Votre prochain matching<br/>
          <span style={{ background:'linear-gradient(135deg,#60a5fa,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            vous attend déjà.
          </span>
        </h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', lineHeight:1.8, marginBottom:40 }}>
          Rejoignez les agences qui ne ratent plus aucune opportunité de vente.<br/>
          Essai gratuit · Sans carte bancaire · Annulable à tout moment.
        </p>
        <button onClick={onLogin} className="btn-primary" style={{ fontSize:16, padding:'16px 40px' }}>
          Commencer gratuitement <ArrowRight size={18}/>
        </button>
        <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
          {['Sans engagement','Paiement Stripe sécurisé','Support réactif'].map(t=>(
            <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle2 size={13} color="#10b981"/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="lp-wrap" style={{ background:'#060d17', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'24px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#1E3A5F,#2D5A8A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Shuffle size={12} color="#60a5fa" strokeWidth={2.5}/>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.25)', letterSpacing:'-0.04em' }}>
          Immo<span style={{ color:'rgba(96,165,250,0.3)' }}>Match</span>
        </span>
      </div>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.15)' }}>© 2026 · Saint François Immobilier · Tous droits réservés</span>
    </footer>
  )
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default function LandingPage() {
  useInter()
  const navigate = useNavigate()
  const onLogin = () => navigate('/login')
  return (
    <div className="lp-wrap" style={{ background:'#0a1520' }}>
      <GlobalStyles />
      <Navbar onLogin={onLogin} />
      <Hero onLogin={onLogin} />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing onLogin={onLogin} />
      <FAQ />
      <FinalCTA onLogin={onLogin} />
      <Footer />
    </div>
  )
}