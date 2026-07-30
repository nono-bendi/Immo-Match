import { useParams, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import blogPosts from '../blogData'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Rendu d'un bloc de contenu — schéma défini dans blogData.js ── */
function Block({ block, i }) {
  if (block.h2) {
    return (
      <h2 key={i} style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '2.5rem 0 1rem', letterSpacing: '-0.3px' }}>
        {block.h2}
      </h2>
    )
  }
  if (block.p) {
    return (
      <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: '#475569', margin: '0 0 1.1rem' }}>
        {block.p}
      </p>
    )
  }
  if (block.ul) {
    return (
      <ul key={i} style={{ margin: '0 0 1.1rem', paddingLeft: '1.25rem' }}>
        {block.ul.map((item, j) => (
          <li key={j} style={{ fontSize: 16, lineHeight: 1.75, color: '#475569', marginBottom: 8 }}>
            {item}
          </li>
        ))}
      </ul>
    )
  }
  if (block.note) {
    return (
      <div key={i} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.875rem 1rem', margin: '1.25rem 0', display: 'flex', gap: 10 }}>
        <span style={{ color: '#2563eb', marginTop: 2 }}><InfoIcon /></span>
        <p style={{ color: '#1e40af', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{block.note}</p>
      </div>
    )
  }
  if (block.cta) {
    return (
      <div key={i} style={{
        background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: '1px solid #dbeafe',
        borderRadius: 12, padding: '1.5rem', margin: '2rem 0',
      }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#334155', margin: '0 0 1rem' }}>
          {block.cta.text}
        </p>
        <Link
          to={block.cta.href}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 14 }}
        >
          {block.cta.label} <ArrowIcon />
        </Link>
      </div>
    )
  }
  return null
}

function RelatedPosts({ current }) {
  const related = blogPosts
    .filter(p => p.slug !== current.slug && p.category === current.category)
    .slice(0, 2)
  const fallback = related.length
    ? related
    : blogPosts.filter(p => p.slug !== current.slug).slice(0, 2)

  if (!fallback.length) return null

  return (
    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e8ecf0' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
        À lire aussi
      </p>
      {fallback.map(p => (
        <Link
          key={p.slug}
          to={`/blog/${p.slug}`}
          style={{ display: 'block', padding: '0.9rem 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', color: '#0f172a', fontWeight: 600, fontSize: 15 }}
        >
          {p.title}
        </Link>
      ))}
    </div>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) {
    return (
      <PageLayout title="Article introuvable" category="Blog">
        <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7 }}>
          Cet article n'existe pas ou plus.
        </p>
        <Link to="/blog" style={{ color: '#1E3A5F', fontWeight: 600, textDecoration: 'none' }}>
          ← Retour au blog
        </Link>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={post.title}
      category={post.category}
      meta={`${fmtDate(post.date)} · ${post.readTime} de lecture`}
    >
      <Link
        to="/blog"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, margin: '0 0 2rem' }}
      >
        ← Tous les articles
      </Link>

      {post.content.map((block, i) => (
        <Block key={i} block={block} i={i} />
      ))}

      <RelatedPosts current={post} />
    </PageLayout>
  )
}
