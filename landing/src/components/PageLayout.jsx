import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ── Scroll to top on mount ── */
function ScrollTop() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return null
}

export default function PageLayout({ title, category, children }) {
  useEffect(() => {
    document.title = `${title} — ImmoMatch`
  }, [title])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <ScrollTop />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link
          to="/"
          style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', textDecoration: 'none', letterSpacing: '-0.5px' }}
        >
          Immo<span style={{ color: '#1E3A5F' }}>Match</span>
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          ← Retour au site
        </Link>
      </nav>

      {/* ── En-tête de page ── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf0', padding: '3rem 1.5rem 2.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {category && (
            <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              {category}
            </p>
          )}
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: 0 }}>
            {title}
          </h1>
        </div>
      </div>

      {/* ── Contenu ── */}
      <main style={{ flex: 1, padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* ── Footer minimal ── */}
      <footer style={{ background: '#0f172a', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', textDecoration: 'none' }}>
            Immo<span style={{ color: '#38bdf8' }}>Match</span>
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
            {[
              { label: 'Mentions légales', to: '/mentions-legales' },
              { label: 'CGU', to: '/cgu' },
              { label: 'Confidentialité', to: '/confidentialite' },
              { label: 'Cookies', to: '/cookies' },
              { label: 'FAQ', to: '/faq' },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{ color: '#475569', fontSize: 13, textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
