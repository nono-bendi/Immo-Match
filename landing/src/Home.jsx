import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
   HOOK — Intersection Observer (scroll reveal + stagger)
   ════════════════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger children if .reveal-group
            const children = entry.target.querySelectorAll('.reveal-child')
            if (children.length > 0) {
              children.forEach((child, i) => {
                setTimeout(() => child.classList.add('visible'), i * 80)
              })
            } else {
              entry.target.classList.add('visible')
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    )

    document.querySelectorAll('.reveal, .reveal-group').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ════════════════════════════════════════════════════════════════
   HOOK — Animated Counter
   ════════════════════════════════════════════════════════════════ */
function useCounter(target, duration = 1600) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
          const startTime = performance.now()
          const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // easeOut cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration, started])

  return [value, ref]
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT — Barre de score animée
   ════════════════════════════════════════════════════════════════ */
function AnimatedBar({ pct, gradient, delay = 0 }) {
  const [started, setStarted] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
      <div style={{
        height: '100%',
        width: started ? `${pct}%` : '0%',
        background: gradient,
        borderRadius: 99,
        transition: `width 1s ${delay}s cubic-bezier(0.34,1.1,0.64,1)`,
      }} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT — Asset Placeholder
   ════════════════════════════════════════════════════════════════ */
function AssetPlaceholder({ label, width, height, className = '' }) {
  return (
    <div
      className={`asset-placeholder ${className}`}
      style={{ width: width ? `min(${width}px, 100%)` : '100%', height: height || 'auto', minHeight: height ? `${Math.min(height, 220)}px` : 220 }}
    >
      <span style={{ fontSize: 32 }}>🖼️</span>
      <span style={{ fontWeight: 500 }}>ASSET À REMPLACER</span>
      <span style={{ color: '#b0bec5', fontSize: 13 }}>{label}</span>
      {width && height && (
        <span style={{ fontSize: 12, opacity: 0.7 }}>{width} × {height} px</span>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT — Stat Card avec compteur animé
   ════════════════════════════════════════════════════════════════ */
function StatCard({ prefix = '', value, suffix = '', label, isStatic = false, staticLabel = '' }) {
  const [count, ref] = useCounter(isStatic ? 0 : value)
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '1.5rem 1.5rem' }}>
      <div className="stat-value">
        {isStatic ? staticLabel : `${prefix}${count}${suffix}`}
      </div>
      <p style={{ color: '#64748b', fontSize: 15, textAlign: 'center', margin: 0, maxWidth: 160 }}>{label}</p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — App
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  useScrollProgress()
  useReveal()

  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock scroll when menu open
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
      cta: 'Demander une démo',
      ctaStyle: 'filled',
      featured: true,
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
    },
  ]

  /* ── FOOTER DATA ── */
  const footerCols = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Roadmap', href: '#' },
        { label: 'Nouveautés', href: '#' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Documentation', href: '/documentation', internal: true },
        { label: 'Guide de démarrage', href: '/guide-de-demarrage', internal: true },
        { label: 'Blog', href: '#' },
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
        { label: 'Partenariats', href: 'mailto:contact@immowatch.fr' },
        { label: 'Presse', href: 'mailto:contact@immowatch.fr' },
      ],
    },
  ]

  return (
    <>
      {/* ── Scroll Progress Bar ── */}
      <div id="scroll-progress" />

      {/* ════════════════════════════════════════════
          1. NAVBAR
          ════════════════════════════════════════════ */}
      <nav className="navbar">
        {/* Logo */}
        <a href="#" style={{ fontWeight: 800, fontSize: 19, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px', flexShrink: 0 }}>
          Immo<span style={{ color: '#38bdf8' }}>Match</span>
        </a>

        {/* Desktop links */}
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

        {/* Desktop CTA */}
        <a
          href="mailto:contact@immowatch.fr"
          className="btn-primary hidden md:inline-flex"
          style={{ padding: '9px 20px', fontSize: 13 }}
        >
          Essayer une démo
        </a>

        {/* Hamburger */}
        <button className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <span style={{ display: 'block', width: 16, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 28, color: '#0f172a', lineHeight: 1,
          }}
        >
          ×
        </button>
        <a href="#" style={{ fontWeight: 800, fontSize: 24, color: '#0f172a', textDecoration: 'none' }}>
          Immo<span style={{ color: '#1E3A5F' }}>Match</span>
        </a>
        {navLinks.map(link => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            style={{
              color: '#0f172a', textDecoration: 'none',
              fontSize: 20, fontWeight: 600,
            }}
          >
            {link.label}
          </a>
        ))}
        <a
          href="mailto:contact@immowatch.fr"
          onClick={() => setMenuOpen(false)}
          style={{
            background: '#1E3A5F', color: '#ffffff',
            textDecoration: 'none', padding: '14px 32px',
            borderRadius: 8, fontSize: 16, fontWeight: 600,
          }}
        >
          Demander une démo
        </a>
      </div>

      {/* ════════════════════════════════════════════
          2. HERO
          ════════════════════════════════════════════ */}
      <section
        style={{
          background: 'radial-gradient(ellipse at 20% 30%, #0d2137 0%, #060d1a 50%, #0a0618 100%)',
          padding: '9rem 1.5rem 6rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Orbs animés — 4 couleurs */}
        <div style={{ position: 'absolute', width: 700, height: 700, top: -250, left: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'floatOrb 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 580, height: 580, bottom: -180, right: '-8%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'floatOrb2 17s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 420, height: 420, top: '10%', right: '15%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'floatOrb 20s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, bottom: '5%', left: '20%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'floatOrb2 11s ease-in-out infinite reverse' }} />
        {/* Grain overlay très subtil */}
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
              Intelligence artificielle · Immobilier
            </span>
          </div>

          {/* H1 */}
          <h1
            className="reveal"
            style={{
              fontSize: 'clamp(36px, 6vw, 62px)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#f1f5f9',
              letterSpacing: '-1.5px',
              margin: '0 0 1.5rem',
            }}
          >
            Et si votre prochaine vente<br />
            <span className="text-gradient">était déjà dans votre fichier&nbsp;?</span>
          </h1>

          {/* Sous-titre */}
          <p
            className="reveal"
            style={{
              fontSize: 18, color: '#64748b', lineHeight: 1.75,
              maxWidth: 560, margin: '0 auto 2.75rem',
              fontWeight: 400,
            }}
          >
            ImmoMatch trouve les correspondances parfaites entre vos prospects et vos biens —
            scorées, argumentées, avec l'email déjà rédigé.
          </p>

          {/* CTAs */}
          <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: '1.25rem' }}>
            <a href="mailto:contact@immowatch.fr" className="btn-primary">
              Demander une démo
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how-it-works" className="btn-ghost-light">
              Voir comment ça marche
            </a>
          </div>

          {/* Mention */}
          <p className="reveal" style={{ fontSize: 13, color: '#334155', margin: '0 0 4.5rem' }}>
            Essai gratuit · Aucune carte bancaire · Opérationnel en 24h
          </p>

          {/* Mockup Dashboard */}
          <div className="reveal" style={{ maxWidth: 820, margin: '0 auto' }}>
            <AssetPlaceholder label="Mockup Dashboard ImmoMatch" width={820} height={500} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          3. BANDE LOGOS
          ════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '3rem 1.5rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p
            className="reveal"
            style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}
          >
            Leurs portefeuilles. Notre intelligence.
          </p>
          <p
            className="reveal"
            style={{ color: '#94a3b8', fontSize: 13, marginBottom: '2rem' }}
          >
            Des centaines de biens analysés et scorés pour les agences immobilières les plus actives de la région.
          </p>
          <div className="reveal logo-marquee-wrapper">
            <div className="logo-marquee-track">
              {[
                { src: 'logo/b&b.png',          alt: 'B&B Immobilier',       h: 72, href: 'https://www.agencebb.fr/' },
                { src: 'logo/rastel.png',        alt: 'Rastel Agay',          h: 68, href: 'https://www.rastelagay.com/' },
                { src: 'logo/terracota.png',     alt: 'Terracota Immobilier', h: 68, href: 'https://www.terracota-immobilier.fr/' },
                { src: 'logo/saintfrancois.png', alt: 'Saint-François Immo',  h: 76, href: 'https://www.saintfrancoisimmobilier.fr/' },
                { src: 'logo/sierra.webp',       alt: 'Sierra Immo',          h: 64, href: 'https://www.sierra-immo.fr/' },
                { src: 'logo/revedesud.png',     alt: 'Rêve du Sud',          h: 68, href: 'https://www.revedesud.com/' },
                { src: 'logo/intramuros.jpg',    alt: 'Intramuros',           h: 60, href: '#' },
                /* Duplicata pour la boucle infinie */
                { src: 'logo/b&b.png',          alt: 'B&B Immobilier',       h: 72, href: 'https://www.agencebb.fr/' },
                { src: 'logo/rastel.png',        alt: 'Rastel Agay',          h: 68, href: 'https://www.rastelagay.com/' },
                { src: 'logo/terracota.png',     alt: 'Terracota Immobilier', h: 68, href: 'https://www.terracota-immobilier.fr/' },
                { src: 'logo/saintfrancois.png', alt: 'Saint-François Immo',  h: 76, href: 'https://www.saintfrancoisimmobilier.fr/' },
                { src: 'logo/sierra.webp',       alt: 'Sierra Immo',          h: 64, href: 'https://www.sierra-immo.fr/' },
                { src: 'logo/revedesud.png',     alt: 'Rêve du Sud',          h: 68, href: 'https://www.revedesud.com/' },
                { src: 'logo/intramuros.jpg',    alt: 'Intramuros',           h: 60, href: '#' },
              ].map((logo, i) => (
                <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: 'inline-flex' }}>
                  <img
                    src={logo.src}
                    alt={logo.alt}
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
          4. COMMENT ÇA MARCHE
          ════════════════════════════════════════════ */}
      <section id="how-it-works" className="section" style={{ background: '#f8fafc' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* Titre */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ color: '#38bdf8', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, margin: '0 0 12px' }}>
              Comment ça marche
            </p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', margin: '0 0 1rem' }}>
              Trois étapes. Une nouvelle façon de travailler.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Sans changer vos outils. Sans formation longue. Résultats dès le premier jour.
            </p>
          </div>

          {/* 3 cards avec icônes 3D */}
          <div
            className="reveal-group"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[
              {
                icon: 'icone/maison.PNG',
                step: '01',
                title: 'Votre catalogue, en place en 2 minutes',
                desc: 'Importez depuis votre logiciel habituel — Excel, CSV ou synchronisation directe. Vos biens et prospects apparaissent instantanément, sans ressaisie.',
              },
              {
                icon: 'icone/croissance.PNG',
                step: '02',
                title: 'Un score pour chaque opportunité',
                desc: 'Budget, localisation, type de bien, style de vie — tout est pesé. Chaque paire prospect / bien reçoit un score de 0 à 100, avec les points forts détaillés.',
              },
              {
                icon: 'icone/mail.PNG',
                step: '03',
                title: 'L\'email est déjà écrit',
                desc: 'Personnalisé, avec les arguments qui font la différence pour ce prospect précis. Il ne reste plus qu\'à appuyer sur Envoyer.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="reveal-child card-hover"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8ecf0',
                  borderRadius: 16,
                  padding: '2rem',
                  boxShadow: '0 2px 16px rgba(15,23,42,0.05)',
                }}
              >
                {/* Icône 3D + numéro */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <img src={s.icon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.04em' }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 0.65rem', lineHeight: 1.35 }}>
                  {s.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          5. FEATURES — Blocs alternés
          ════════════════════════════════════════════ */}
      <section id="features" style={{ background: '#f8fafc', padding: '5rem 1.5rem', position: 'relative', overflow: 'clip' }}>

        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '6rem' }}>

          {/* ── Bloc 1 : image gauche, texte droite ── */}
          <div
            className="reveal"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              alignItems: 'center',
              padding: '3rem 1rem',
            }}
          >
            {/* Blob CSS organique — blob 1 */}
            <div style={{ position: 'absolute', inset: '-35%', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
              <div style={{
                position: 'absolute', inset: '10% 5% 15% 0%',
                background: 'radial-gradient(ellipse at 42% 48%, #7dd3fc 0%, #bae6fd 35%, transparent 68%)',
                borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%',
                filter: 'blur(72px)',
                opacity: 0.65,
              }} />
              <div style={{
                position: 'absolute', inset: '20% 15% 10% 20%',
                background: 'radial-gradient(ellipse at 55% 40%, #a5b4fc 0%, #c4b5fd 40%, transparent 70%)',
                borderRadius: '38% 62% 55% 45% / 45% 55% 38% 62%',
                filter: 'blur(60px)',
                opacity: 0.45,
              }} />
            </div>

            {/* ── Mock UI Scoring IA ── */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Browser chrome */}
              <div style={{ background: '#0f1e30', borderRadius: '14px 14px 0 0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginLeft: 8 }}>app.immomatch.fr/matchings</div>
              </div>
              {/* Card bien */}
              <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0f2744 100%)', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(56,189,248,0.8)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Bien analysé</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Villa 4P avec piscine · Saint-François</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>385 000 €</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>REF-2841</div>
                </div>
              </div>
              {/* Prospects */}
              <div style={{ background: '#fff', borderRadius: '0 0 14px 14px', border: '1px solid #e2e8f0', borderTop: 'none', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,23,42,0.15)' }}>
                <div style={{ padding: '10px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Meilleurs prospects</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>3 matchings · triés par score</span>
                </div>
                {[
                  { initials: 'MD', name: 'Martin Dupont', sub: 'Budget 400k · Cherche villa', score: 94, scoreColor: '#10b981', barGrad: 'linear-gradient(90deg,#10b981,#34d399)' },
                  { initials: 'SL', name: 'Sophie Leblanc', sub: 'Budget 380k · Piscine souhaitée', score: 87, scoreColor: '#10b981', barGrad: 'linear-gradient(90deg,#10b981,#6ee7b7)' },
                  { initials: 'JM', name: 'Jean-Luc Moreau', sub: 'Budget 350k · Flexible zone', score: 76, scoreColor: '#f59e0b', barGrad: 'linear-gradient(90deg,#f59e0b,#fcd34d)' },
                ].map((p, i) => {
                  const [count, ref] = useCounter(p.score, 1000)
                  return (
                    <div key={p.name} className={`score-row-${i}`} style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, background: i === 0 ? '#fafffe' : '#fff' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: i === 0 ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i === 0 ? '#15803d' : '#64748b', flexShrink: 0 }}>{p.initials}</div>
                      <div ref={ref} style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: p.scoreColor }}>{count}</span>
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 5 }}>{p.sub}</div>
                        <AnimatedBar pct={p.score} gradient={p.barGrad} delay={0.1 * i} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ padding: '12px 18px' }}>
                  <button style={{ width: '100%', background: 'linear-gradient(135deg, #1E3A5F, #2d5a8e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, letterSpacing: '0.02em' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Générer les 3 emails IA
                    <span style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', borderRadius: 99, padding: '1px 7px', fontSize: 10 }}>×3</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <img src="icone/croissance.PNG" alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Scoring IA</span>
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: '0 0 1rem', lineHeight: 1.2 }}>
                La bonne affaire,<br />au bon moment,<br />pour le bon client.
              </h2>
              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.75, margin: '0 0 1.75rem' }}>
                Pour chaque bien, ImmoMatch remonte les prospects les mieux placés — avec
                un score clair, les raisons détaillées, et un email personnalisé prêt à partir.
                Vos agents savent exactement qui appeler, et pourquoi.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Score /100 : budget, type, zone, style de vie',
                  'Points forts et signaux d\'attention par prospect',
                  'Email de proposition rédigé automatiquement',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#475569', fontSize: 15 }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '6px 14px' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2"/><path stroke="#16a34a" strokeWidth="2" strokeLinecap="round" d="M12 7v5l3 3"/></svg>
                <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Analyse complète · moins de 30 secondes</span>
              </div>
            </div>
          </div>

          {/* ── Bloc 2 : texte gauche, image droite ── */}
          <div
            className="reveal"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              alignItems: 'center',
              padding: '3rem 1rem',
            }}
          >
            {/* Blob CSS organique — blob 2 */}
            <div style={{ position: 'absolute', inset: '-35%', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
              <div style={{
                position: 'absolute', inset: '10% 0% 15% 5%',
                background: 'radial-gradient(ellipse at 58% 48%, #a78bfa 0%, #c4b5fd 35%, transparent 68%)',
                borderRadius: '38% 62% 54% 46% / 40% 56% 44% 60%',
                filter: 'blur(72px)',
                opacity: 0.65,
              }} />
              <div style={{
                position: 'absolute', inset: '20% 20% 10% 15%',
                background: 'radial-gradient(ellipse at 45% 55%, #818cf8 0%, #7dd3fc 40%, transparent 70%)',
                borderRadius: '55% 45% 38% 62% / 62% 38% 55% 45%',
                filter: 'blur(60px)',
                opacity: 0.45,
              }} />
            </div>
            <div style={{ order: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <img src="icone/agent_immobilier.PNG" alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Assistant IA</span>
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: '0 0 1rem', lineHeight: 1.2 }}>
                Votre portefeuille<br />vous parle.
              </h2>
              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.75, margin: '0 0 1.75rem' }}>
                Posez une question en français — trouvez un bien par critère, identifiez
                les prospects les plus chauds, obtenez un résumé de votre activité.
                Tout ça sans quitter l'interface, en quelques secondes.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Questions en langage naturel',
                  'Fiches biens et prospects accessibles instantanément',
                  'Emails et rapports générés à la demande',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#475569', fontSize: 15 }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* ── Mock UI Chat IA ── */}
            <div style={{ order: 1, position: 'relative', zIndex: 1 }}>
              {/* Browser chrome */}
              <div style={{ background: '#0f1e30', borderRadius: '14px 14px 0 0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginLeft: 8 }}>app.immomatch.fr/assistant</div>
              </div>
              {/* Chat body */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,23,42,0.15)' }}>
                {/* Header assistant */}
                <div style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Assistant ImmoMatch</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>● En ligne · Répond en &lt; 3 secondes</div>
                  </div>
                </div>
                {/* Messages */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Agent */}
                  <div className="msg-agent" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: '#1E3A5F', color: '#fff', borderRadius: '14px 14px 2px 14px', padding: '9px 14px', fontSize: 12, maxWidth: '80%', lineHeight: 1.55, fontWeight: 500 }}>
                      Combien on a de villas avec piscine dans le groupement ?
                    </div>
                  </div>
                  {/* Typing indicator */}
                  <div className="msg-typing" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '2px 14px 14px 14px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', animation: `blink 1.2s ${d}s infinite` }} />)}
                    </div>
                  </div>
                  {/* IA */}
                  <div className="msg-ia" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '2px 14px 14px 14px', padding: '12px 14px', fontSize: 12, color: '#0f172a', lineHeight: 1.6 }}>
                        <div style={{ marginBottom: 10 }}>J'ai trouvé <strong style={{ color: '#6d28d9' }}>3 villas avec piscine</strong> dans le groupement :</div>
                        {[
                          { name: 'Villa Rastel', zone: 'Saint-François', price: '385 000 €', tag: 'Disponible' },
                          { name: 'Domaine des Pins', zone: 'Sainte-Anne', price: '420 000 €', tag: 'Disponible' },
                          { name: 'Villa Cannelle', zone: 'Le Gosier', price: '295 000 €', tag: 'Sous offre' },
                        ].map((b, i) => (
                          <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: i === 2 ? '#fff7ed' : '#f0fdf4', borderRadius: 8, marginBottom: 6, border: `1px solid ${i === 2 ? '#fed7aa' : '#bbf7d0'}` }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{b.name} <span style={{ fontSize: 9, color: i === 2 ? '#ea580c' : '#16a34a', fontWeight: 600, background: i === 2 ? '#ffedd5' : '#dcfce7', borderRadius: 99, padding: '1px 6px' }}>{b.tag}</span></div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>{b.zone}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1E3A5F' }}>{b.price}</div>
                          </div>
                        ))}
                        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500, marginTop: 4 }}>Tu veux que je prépare un email pour l'un d'eux ? ✨</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#94a3b8' }}>Posez une question en français…</div>
                  <button style={{ background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 14, cursor: 'pointer' }}>→</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          6. STATS
          ════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            className="reveal-group"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <StatCard isStatic staticLabel="< 30s"  label="pour analyser un prospect" />
            <StatCard value={20}  suffix="+" label="biens analysés par matching" />
            <StatCard value={100} suffix="%" label="automatisé, zéro saisie manuelle" />
            <StatCard isStatic staticLabel="0"      label="ligne de code à écrire" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          7. PRICING
          ════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: '#0f1e30', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Titre */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
              borderRadius: 999, padding: '4px 14px', fontSize: 12,
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: 16, border: '1px solid rgba(56,189,248,0.25)',
            }}>
              Tarifs
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', margin: '0 0 1rem' }}>
              Simple, transparent, sans surprise
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>
              Choisissez le plan qui correspond à la taille de votre agence.
            </p>
          </div>

          {/* Cards */}
          <div className="reveal-group pricing-grid">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`reveal-child pricing-card ${plan.featured ? 'featured' : ''}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{ marginBottom: '-0.5rem' }}>
                    <span style={{
                      background: '#38bdf8', color: '#0f1e30',
                      borderRadius: 999, padding: '4px 12px',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name + subtitle */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                    {plan.price}€
                  </span>
                  <span style={{ color: '#64748b', fontSize: 14 }}>HT / mois</span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                {/* Features */}
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

                {/* CTA */}
                <a
                  href="mailto:contact@immowatch.fr"
                  className={plan.ctaStyle === 'filled' ? 'btn-filled-dark' : 'btn-outline-white'}
                  style={{ marginTop: 'auto' }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Taglines */}
          <div className="reveal" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 0.75rem' }}>
              "Une vente conclue grâce à ImmoMatch couvre 2 ans d'abonnement."
            </p>
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
          8. CTA FINAL
          ════════════════════════════════════════════ */}
      <section id="demo" style={{ background: '#f8fafc', padding: '6rem 1.5rem', textAlign: 'center', borderTop: '1px solid #e8ecf0' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div className="reveal">
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800,
              color: '#0f172a', letterSpacing: '-0.8px', margin: '0 0 1rem', lineHeight: 1.2,
            }}>
              Votre première démo dure 30 minutes.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 17, lineHeight: 1.65, margin: '0 0 0.5rem' }}>
              Votre premier matching, 30 secondes.
            </p>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.65, margin: '0 0 2.5rem' }}>
              On travaille avec vos vraies données — pour que vous voyiez immédiatement
              ce que ImmoMatch peut faire pour votre agence.
            </p>
            <a href="mailto:contact@immowatch.fr" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
              Réserver ma démo
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '1.5rem 0 0' }}>
              contact@immowatch.fr · Réponse sous 24h
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          9. FOOTER
          ════════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', padding: '4rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Top grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '2.5rem',
              marginBottom: '3rem',
            }}
          >
            {/* Brand col */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#ffffff', marginBottom: 12 }}>
                Immo<span style={{ color: '#38bdf8' }}>Match</span>
              </div>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 1rem', maxWidth: 220 }}>
                Le matching prospect-bien réinventé par l'IA.
              </p>
              <a
                href="mailto:contact@immowatch.fr"
                style={{ color: '#38bdf8', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
              >
                contact@immowatch.fr
              </a>
            </div>

            {/* Link cols */}
            {footerCols.map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, margin: '0 0 1rem', letterSpacing: '0.02em' }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      {link.internal ? (
                        <Link
                          to={link.href}
                          style={{ color: '#475569', fontSize: 14, textDecoration: 'none', transition: 'color 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          style={{ color: '#475569', fontSize: 14, textDecoration: 'none', transition: 'color 150ms' }}
                          onMouseEnter={e => (e.target.style.color = '#94a3b8')}
                          onMouseLeave={e => (e.target.style.color = '#475569')}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <p style={{ color: '#334155', fontSize: 13, margin: 0 }}>
              © 2026 ImmoMatch. Tous droits réservés.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[
                { label: 'Mentions légales', to: '/mentions-legales' },
                { label: 'CGU', to: '/cgu' },
                { label: 'Confidentialité', to: '/confidentialite' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{ color: '#334155', fontSize: 13, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                >
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
