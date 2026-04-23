import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FeaturesSection from './FeaturesSection'

const RemotionPlayer = lazy(() =>
  Promise.all([
    import('@remotion/player'),
    import('./remotion/ImmoMatchVideo'),
  ]).then(([{ Player }, { ImmoMatchVideo }]) => ({
    default: () => (
      <Player
        component={ImmoMatchVideo}
        durationInFrames={3600}
        fps={120}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: '100%', display: 'block' }}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        spaceKeyToPlayOrPause={false}
      />
    ),
  }))
)

/* ════════════════════════════════════════════════════════════════
   HOOK — Scroll Progress Bar
   ════════════════════════════════════════════════════════════════ */
function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('scroll-progress')
    if (!bar) return
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      bar.style.width = pct + '%'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}

/* ════════════════════════════════════════════════════════════════
   HOOK — Mobile breakpoint
   ════════════════════════════════════════════════════════════════ */
function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < bp)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [bp])
  return isMobile
}

/* ════════════════════════════════════════════════════════════════
   HOOK — Intersection Observer (scroll reveal + stagger)
   ════════════════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      document.querySelectorAll('.reveal, .reveal-group, .timeline-row').forEach(el => el.classList.add('visible'))
      return
    }

    const makeVisible = (el) => {
      const children = el.querySelectorAll('.reveal-child')
      if (children.length > 0) {
        children.forEach((child, i) => setTimeout(() => child.classList.add('visible'), i * 80))
      } else {
        el.classList.add('visible')
      }
    }

    const els = [...document.querySelectorAll('.reveal, .reveal-group, .timeline-row')]

    // Éléments déjà dans le viewport au montage → visible immédiatement
    // (évite le bug IntersectionObserver async sur navigation retour)
    els.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight + 50 && r.bottom > 0) {
        makeVisible(el)
      }
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            makeVisible(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    )

    els.forEach(el => {
      if (!el.classList.contains('visible')) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])
}


/* ════════════════════════════════════════════════════════════════
   COMPOSANT — FAQ Accordion Item
   ════════════════════════════════════════════════════════════════ */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ borderBottom: '1px solid #e2e8f0', padding: '1.25rem 0', cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{q}</span>
        <span style={{ fontSize: 22, color: '#64748b', flexShrink: 0, lineHeight: 1, transition: 'transform 200ms', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && (
        <p style={{ margin: '0.75rem 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{a}</p>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  useScrollProgress()
  useReveal()

  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const openDemo = (e) => { e?.preventDefault(); setMenuOpen(false); navigate('/demarrer') }
  const stepsRef = useRef(null)
  const [stepsVisible, setStepsVisible] = useState(false)
  useEffect(() => {
    const el = stepsRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStepsVisible(true); io.disconnect() }
    }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const targets = [
      document.querySelector('.left-before'),
      document.querySelector('.right-after'),
    ].filter(Boolean)
    if (!targets.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('playing')
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.25 })
    targets.forEach(t => obs.observe(t))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const rows = document.querySelectorAll('.timeline-row')
    if (!rows.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    rows.forEach(r => obs.observe(r))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Démo', href: '#demo' },
  ]

  /* ── PRICING DATA ── */
  const plans = [
    {
      name: 'Starter',
      price: '49',
      subtitle: 'Idéal pour démarrer',
      features: [
        "Jusqu'à 50 biens importés",
        '20 matchings / mois',
        'Import Hektor',
        'Support email',
      ],
      cta: 'Commencer',
      ctaStyle: 'outline',
      featured: false,
      stripeUrl: 'https://buy.stripe.com/test_7sY14pfEo7Pu0te1m6cAo00',
    },
    {
      name: 'Pro',
      price: '99',
      subtitle: 'Pour les agences actives',
      badge: 'Recommandé',
      features: [
        'Biens illimités',
        'Matchings illimités',
        'Import Hektor',
        'Emails IA générés',
        'Dashboard + historique',
        'Agent IA intégré',
        'Support prioritaire',
      ],
      cta: 'Commencer',
      ctaStyle: 'filled',
      featured: true,
      stripeUrl: 'https://buy.stripe.com/test_cNi5kF63O9XC3Fqc0KcAo01',
    },
    {
      name: 'Agence+',
      price: '199',
      subtitle: 'Multi-agents, marque blanche',
      features: [
        'Tout le plan Pro',
        "Multi-utilisateurs (jusqu'à 5 agents)",
        'Rapports mensuels automatiques',
        'Personnalisation marque blanche',
        'Onboarding dédié',
      ],
      cta: 'Nous contacter',
      ctaStyle: 'outline',
      featured: false,
      ctaHref: 'mailto:contact@immomatch.fr',
    },
  ]

  /* ── FOOTER DATA ── */
  const footerCols = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Comment ça marche', href: '#steps' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Documentation', href: '/documentation', internal: true },
        { label: 'Guide de démarrage', href: '/guide-de-demarrage', internal: true },
        { label: 'FAQ', href: '/faq', internal: true },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Mentions légales', href: '/mentions-legales', internal: true },
        { label: 'CGU', href: '/cgu', internal: true },
        { label: 'Confidentialité', href: '/confidentialite', internal: true },
        { label: 'Cookies', href: '/cookies', internal: true },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'contact@immowatch.fr', href: 'mailto:contact@immowatch.fr' },
        { label: 'Support', href: 'mailto:contact@immowatch.fr' },
      ],
    },
  ]

  /* ── FAQ DATA ── */
  const faqItems = [
    {
      q: 'Comment ImmoMatch importe mes biens ?',
      a: "Depuis Hektor, un fichier Excel ou CSV, ou en saisie manuelle. L'import prend moins de 5 minutes. Aucune ligne de code, aucune intégration technique.",
    },
    {
      q: "C'est quoi exactement un 'score de matching' ?",
      a: "Un score sur 100 calculé par notre IA qui croise le budget, la surface, les critères, la localisation et l'historique du prospect avec les caractéristiques du bien. Plus c'est haut, plus la probabilité de conversion est élevée.",
    },
    {
      q: 'Est-ce que ImmoMatch rédige les emails à ma place ?',
      a: "Oui. Pour chaque matching, l'IA génère un email personnalisé qui explique pourquoi CE bien correspond à CE prospect — avec les arguments concrets. Vous relisez, vous envoyez.",
    },
    {
      q: 'Mes données sont-elles sécurisées ?',
      a: "ImmoMatch ne vend, ne loue et ne partage pas vos données personnelles à des tiers à des fins commerciales. Vos données restent accessibles pendant 30 jours après la fin de votre abonnement.",
    },
    {
      q: "C'est quoi la période d'essai ?",
      a: "Vous commencez avec une démo guidée sur vos vraies données. Si ça ne vous convient pas, vous ne payez rien. Aucune carte bancaire demandée à l'inscription.",
    },
    {
      q: "Ça marche avec plusieurs agents dans une agence ?",
      a: "Oui, le plan Agence+ prend en charge jusqu'à 5 agents avec des accès séparés. Chaque agent voit son propre portefeuille.",
    },
  ]

  return (
    <>
      <div id="scroll-progress" />

      {/* ════════════════════════════════════════════
          1. NAVBAR
          ════════════════════════════════════════════ */}
      <nav className="navbar">
        <a href="#" style={{ fontWeight: 800, fontSize: 19, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px', flexShrink: 0 }}>
          Immo<span style={{ color: '#38bdf8' }}>Match</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={e => (e.target.style.color = '#fff')}
              onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.6)')}
            >
              {link.label}
            </a>
          ))}
        </div>
        <a href="#" onClick={openDemo} className="btn-primary navbar-cta" style={{ padding: '9px 20px', fontSize: 13 }}>
          Essayer gratuitement
        </a>
        <button className="navbar-burger" onClick={() => setMenuOpen(true)} aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <span style={{ display: 'block', width: 14, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>
      </nav>

      {/* ── Mobile Menu glassmorphisme ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => setMenuOpen(false)} aria-label="Fermer"
          style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
        <a href="#" style={{ fontWeight: 800, fontSize: 20, color: '#fff', textDecoration: 'none' }}>
          Immo<span style={{ color: '#38bdf8' }}>Match</span>
        </a>
        {navLinks.map(link => (
          <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
            style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 17, fontWeight: 500 }}>
            {link.label}
          </a>
        ))}
        <a href="#" onClick={openDemo} className="btn-primary"
          style={{ padding: '12px 28px', fontSize: 14, width: '100%', textAlign: 'center', justifyContent: 'center' }}>
          Demander une démo
        </a>
      </div>

      {/* ════════════════════════════════════════════
          2. HERO
          ════════════════════════════════════════════ */}
      <section style={{
        background: 'radial-gradient(ellipse at 20% 30%, #0d2137 0%, #060d1a 50%, #0a0618 100%)',
        padding: '9rem 1.5rem 6rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', width: 700, height: 700, top: -250, left: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'floatOrb 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 580, height: 580, bottom: -180, right: '-8%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'floatOrb2 17s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 420, height: 420, top: '10%', right: '15%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'floatOrb 20s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, bottom: '5%', left: '20%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'floatOrb2 11s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div className="reveal" style={{ marginBottom: '1.75rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(56,189,248,0.08)', color: '#7dd3fc',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              IA pour agents immobiliers
            </span>
          </div>

          {/* H1 */}
          <h1 className="reveal" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.08, color: '#f1f5f9', letterSpacing: '-1.5px', margin: '0 0 1.5rem' }}>
            Votre prochaine vente<br />
            <span className="text-gradient">est déjà dans votre fichier.</span>
          </h1>

          {/* Sous-titre */}
          <p className="reveal" style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 2.75rem', fontWeight: 400 }}>
            ImmoMatch analyse vos prospects, trouve les meilleurs
            matchings et rédige l'email. En 30 secondes.
          </p>

          {/* CTAs */}
          <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: '1rem' }}>
            <a href="#" onClick={openDemo} className="btn-primary">
              Demander une démo gratuite
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#features" className="btn-ghost-light">
              Voir comment ça marche
            </a>
          </div>

          {/* Mention */}
          <p className="reveal" style={{ fontSize: 13, color: '#334155', margin: '0 0 3rem' }}>
            Aucune carte bancaire · Opérationnel en 24h · Vos vraies données
          </p>

          {/* Vidéo de présentation — Remotion Player */}
          <div className="reveal" style={{ maxWidth: 780, margin: '0 auto', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Suspense fallback={<div style={{ aspectRatio: '16/9', background: '#080d17' }} />}>
              <RemotionPlayer />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          3. BANDE LOGOS
          ════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '2.5rem 1.5rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Ils font confiance à ImmoMatch
          </p>
          <div className="reveal logo-marquee-wrapper">
            <div className="logo-marquee-track">
              {(() => {
                const b = import.meta.env.BASE_URL
                return [
                { src: `${b}logo/b&b.png`,          alt: 'B&B Immobilier',       h: 72, href: 'https://www.agencebb.fr/' },
                { src: `${b}logo/rastel.png`,        alt: 'Rastel Agay',          h: 68, href: 'https://www.rastelagay.com/' },
                { src: `${b}logo/saintfrancois.png`, alt: 'Saint-François Immo',  h: 76, href: 'https://www.saintfrancoisimmobilier.fr/' },
                { src: `${b}logo/sierra.png`,        alt: 'Sierra Immo',          h: 64, href: 'https://www.sierra-immo.fr/' },
                { src: `${b}logo/revedesud.svg`,     alt: 'Rêve du Sud',          h: 68, href: 'https://www.revedesud.com/' },
                { src: `${b}logo/intramuros.jpg`,    alt: 'Intramuros',           h: 60, href: '#' },
                /* Duplicata boucle infinie */
                { src: `${b}logo/b&b.png`,          alt: 'B&B Immobilier',       h: 72, href: 'https://www.agencebb.fr/' },
                { src: `${b}logo/rastel.png`,        alt: 'Rastel Agay',          h: 68, href: 'https://www.rastelagay.com/' },
                { src: `${b}logo/saintfrancois.png`, alt: 'Saint-François Immo',  h: 76, href: 'https://www.saintfrancoisimmobilier.fr/' },
                { src: `${b}logo/sierra.png`,        alt: 'Sierra Immo',          h: 64, href: 'https://www.sierra-immo.fr/' },
                { src: `${b}logo/revedesud.svg`,     alt: 'Rêve du Sud',          h: 68, href: 'https://www.revedesud.com/' },
                { src: `${b}logo/intramuros.jpg`,    alt: 'Intramuros',           h: 60, href: '#' },
                ]
              })().map((logo, i) => (
                <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: 'inline-flex' }}>
                  <img
                    src={logo.src} alt={logo.alt}
                    style={{ height: logo.h, width: 'auto', opacity: 0.65, filter: 'grayscale(20%)', transition: 'opacity 0.3s, filter 0.3s, transform 0.3s' }}
                    onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.filter = 'grayscale(0%)'; e.target.style.transform = 'scale(1.05)' }}
                    onMouseLeave={e => { e.target.style.opacity = '0.65'; e.target.style.filter = 'grayscale(20%)'; e.target.style.transform = 'scale(1)' }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          4. COMMENT ÇA MARCHE — 4 étapes
          ════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#f8fafc' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Titre */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Comment ça marche
            </p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', margin: '0 0 12px' }}>
              Opérationnel en 4 étapes.
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Pas de formation. Pas de configuration complexe. Vous êtes prêt en quelques minutes.
            </p>
          </div>

          {/* Étapes */}
          <div ref={stepsRef} className="steps-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1.5rem', position: 'relative' }}>

            {/* Ligne de connexion — fond gris, desktop uniquement */}
            <div style={{ display: isMobile ? 'none' : 'block', position: 'absolute', top: 36, left: 'calc(12.5% + 16px)', right: 'calc(12.5% + 16px)', height: 2, background: '#e2e8f0', borderRadius: 2, zIndex: 0, pointerEvents: 'none' }}>
              {/* Barre de progression animée — se remplit gauche→droite en bleu clair */}
              <div className="steps-progress-bar" style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #1E3A5F 0%, #38bdf8 60%, #7dd3fc 100%)', width: stepsVisible ? '100%' : 0, transition: stepsVisible ? 'width 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s' : 'none' }} />
            </div>

            {[
              {
                color: '#0369a1',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Vos biens sont déjà là',
                desc: "On connecte ImmoMatch à votre logiciel métier. Vos biens se synchronisent automatiquement, vous n'avez rien à faire.",
              },
              {
                color: '#1E3A5F',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 11h6M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Importez vos prospects',
                desc: "Renseignez les critères de chaque acheteur : budget, surface, localisation, type de bien.",
              },
              {
                color: '#4f46e5',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "L'IA score chaque matching",
                desc: "L'algorithme compare chaque prospect avec chaque bien et attribue un score de compatibilité sur 100.",
              },
              {
                color: '#059669',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Envoyez l'email en 30 s",
                desc: "Les meilleurs matchings remontent en tête. Un email personnalisé est généré avec les arguments du bien.",
              },
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: stepsVisible ? 1 : 0, transform: stepsVisible ? 'none' : 'translateY(28px)', transition: `opacity 0.55s ease ${i * 0.26 + 0.1}s, transform 0.55s ease ${i * 0.26 + 0.1}s` }}>

                {/* Badge numéro + icône */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  {/* Cercle fond */}
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: `2px solid ${step.color}22`, boxShadow: `0 4px 24px ${step.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color }}>
                    {step.icon}
                  </div>
                  {/* Numéro en badge */}
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: step.color, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </div>
                </div>

                {/* Texte */}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#64748b', margin: 0, maxWidth: 260 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          5. PAIN POINT — Avant / Après
          ════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Titre centré */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: '0 0 0.75rem', lineHeight: 1.25 }}>
              La même heure. Deux réalités.
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
              Ce que font vos agents aujourd'hui — et ce qu'ImmoMatch fait à leur place.
            </p>
          </div>

          {/* Split avant / après */}
          <div style={{ position: 'relative' }}>
            {/* Flèche flottante animée — desktop uniquement */}
            {!isMobile && (
              <div className="arrow-slide" style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10, pointerEvents: 'none',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path className="arrow-draw" d="M5 12h14M13 6l6 6-6 6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="30"/>
                </svg>
              </div>
            )}
          <div className="reveal-group" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.5rem' : '5rem', alignItems: 'stretch' }}>

            {/* ── AVANT : items lents, un par un ── */}
            <div className="reveal-child left-before" style={{
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: '2rem', position: 'relative',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1.75rem' }}>
                Sans ImmoMatch
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="2"/></svg>, text: 'Exporter les biens manuellement', note: '5 min', n: 1 },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h10M4 18h7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>, text: 'Parcourir les fiches prospect', note: '20 min', n: 2 },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 6l4-4 4 4M16 18l-4 4-4-4M12 2v20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Croiser critères et budgets', note: '20 min', n: 3 },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#94a3b8" strokeWidth="2"/><path d="M2 8l10 7 10-7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>, text: 'Rédiger un email par prospect', note: '10 min', n: 4 },
                ].map(item => (
                  <div key={item.n} className={`before-item before-item-${item.n}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flexShrink: 0, opacity: 0.6 }}>{item.icon}</span>
                      <span style={{ fontSize: 14, color: '#64748b', flex: 1 }}>{item.text}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{item.note}</span>
                    </div>
                    <div style={{ marginTop: 8, height: 2, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <div className={`before-prog before-prog-${item.n}`} style={{ height: '100%', background: '#cbd5e1' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Total</span>
                <span style={{ color: '#475569', fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px' }}>~55 min</span>
                <span style={{ color: '#cbd5e1', fontSize: 12 }}>par session</span>
              </div>
            </div>

            {/* ── APRÈS : tout claque ensemble ── */}
            <div className="reveal-child right-after" style={{
              background: 'linear-gradient(150deg, #071220 0%, #0b1e38 60%, #0c2647 100%)',
              border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: 24, padding: '2.25rem',
              position: 'relative', overflow: 'hidden',
              transform: isMobile ? 'none' : 'translateY(-8px)',
              boxShadow: '0 0 0 1px rgba(56,189,248,0.08), 0 28px 70px rgba(56,189,248,0.2), 0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {/* Ligne de lumière top */}
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.85), transparent)', pointerEvents: 'none' }} />
              {/* Halo */}
              <div style={{ position: 'absolute', width: 340, height: 340, top: -130, right: -90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.11) 0%, transparent 65%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', position: 'relative' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Avec ImmoMatch</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', background: '#38bdf8', borderRadius: 999, padding: '3px 10px' }}>Solution</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                {[
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/><path d="M18 4l2 4h-4M6 20l-2-4h4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Synchronisation automatique du portefeuille' },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#38bdf8" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/></svg>, text: 'Score /100 calculé pour chaque prospect' },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M7 12h10M11 18h2" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/></svg>, text: 'Meilleurs matchings remontés en priorité' },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#38bdf8" strokeWidth="2"/><path d="M2 8l10 7 10-7" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/></svg>, text: 'Email personnalisé généré et prêt à envoyer' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="after-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', borderRadius: 10, transition: 'background 160ms, transform 160ms', cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.09)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#cbd5e1', flex: 1 }}>{item.text}</span>
                    <span style={{ fontSize: 11, color: '#0f172a', background: 'rgba(56,189,248,0.9)', borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>Instant</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(56,189,248,0.12)', position: 'relative', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>Total</span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 28, letterSpacing: '-1px' }}>30s</span>
              </div>
            </div>
          </div>
          </div>

          {/* Stat sous le split */}
          <div className="reveal" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              En moyenne, nos clients récupèrent{' '}
              <strong style={{ color: '#0f172a' }}>5 à 8 heures par semaine et par agent.</strong>
            </p>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          6. FONCTIONNALITÉS
          ════════════════════════════════════════════ */}
      <FeaturesSection />


      {/* ════════════════════════════════════════════
          8. PRICING
          ════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: '#0f1e30', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
              borderRadius: 999, padding: '4px 14px', fontSize: 12,
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: 16, border: '1px solid rgba(56,189,248,0.25)',
            }}>
              Tarifs
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', margin: '0 0 0.5rem' }}>
              Simple. Transparent. Sans surprise.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 15, margin: 0 }}>
              Une vente conclue grâce à ImmoMatch couvre 2 ans d'abonnement.
            </p>
          </div>

          <div className="reveal-group pricing-grid">
            {plans.map(plan => (
              <div key={plan.name} className={`reveal-child pricing-card ${plan.featured ? 'featured' : ''}`}>
                {plan.badge && (
                  <div style={{ marginBottom: '-0.5rem' }}>
                    <span style={{ background: '#38bdf8', color: '#0f1e30', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>{plan.name}</h3>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{plan.subtitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{plan.price}€</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}>HT / mois</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#cbd5e1', fontSize: 14 }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                        background: plan.featured ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)',
                        color: plan.featured ? '#38bdf8' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, marginTop: 1,
                      }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.stripeUrl ? (
                  <a
                    href={plan.stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={plan.ctaStyle === 'filled' ? 'btn-filled-dark' : 'btn-outline-white'}
                    style={{ marginTop: 'auto' }}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <a
                    href={plan.ctaHref || '#'}
                    className="btn-outline-white"
                    style={{ marginTop: 'auto' }}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(56,189,248,0.08)', color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 500,
            }}>
              🔒 Tarif de lancement — garanti à vie pour les premières agences
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          8. FAQ
          ════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: '0 0 0.75rem' }}>
              Questions fréquentes
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
              Pas trouvé la réponse ?{' '}
              <a href="mailto:contact@immowatch.fr" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
                Écrivez-nous.
              </a>
            </p>
          </div>
          <div className="reveal">
            {faqItems.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          9. CTA FINAL
          ════════════════════════════════════════════ */}
      <section id="demo" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d2137 0%, #060d1a 70%)', padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative' }}>
          <div className="reveal">
            <p style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>
              Prêt à gagner du temps ?
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', lineHeight: 1.1, margin: '0 0 1.25rem' }}>
              Votre prochaine vente<br />commence maintenant.
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 2.5rem' }}>
              Démo sur vos données réelles. Aucune carte bancaire. Opérationnel en 24h.
            </p>
            <a href="#" onClick={openDemo} className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
              Demander une démo gratuite
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          10. FOOTER
          ════════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', padding: '4rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#ffffff', marginBottom: 12 }}>
                Immo<span style={{ color: '#38bdf8' }}>Match</span>
              </div>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 1rem', maxWidth: 220 }}>
                Le matching prospect-bien réinventé par l'IA.
              </p>
              <a href="mailto:contact@immowatch.fr" style={{ color: '#38bdf8', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                contact@immowatch.fr
              </a>
            </div>
            {footerCols.map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, margin: '0 0 1rem', letterSpacing: '0.02em' }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      {link.internal ? (
                        <Link to={link.href} style={{ color: '#475569', fontSize: 14, textDecoration: 'none', transition: 'color 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} style={{ color: '#475569', fontSize: 14, textDecoration: 'none', transition: 'color 150ms' }}
                          onMouseEnter={e => (e.target.style.color = '#94a3b8')}
                          onMouseLeave={e => (e.target.style.color = '#475569')}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#334155', fontSize: 13, margin: 0 }}>© 2026 ImmoMatch. Tous droits réservés.</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[
                { label: 'Mentions légales', to: '/mentions-legales' },
                { label: 'CGU', to: '/cgu' },
                { label: 'Confidentialité', to: '/confidentialite' },
              ].map(item => (
                <Link key={item.to} to={item.to}
                  style={{ color: '#334155', fontSize: 13, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
