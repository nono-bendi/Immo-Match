import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import blogPosts from '../blogData'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="blog-card"
      style={{
        display: 'block', padding: '1.5rem', borderRadius: 12,
        border: '1px solid #e8ecf0', textDecoration: 'none',
        marginBottom: '1.25rem', transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(56,189,248,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eef5'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 12, color: '#94a3b8' }}>
        <span style={{ fontWeight: 700, color: '#1E3A5F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {post.category}
        </span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{fmtDate(post.date)}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{post.readTime}</span>
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.35 }}>
        {post.title}
      </h2>
      <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, margin: '0 0 0.75rem' }}>
        {post.excerpt}
      </p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#1E3A5F' }}>
        Lire l'article <ArrowIcon />
      </span>
    </Link>
  )
}

export default function Blog() {
  const posts = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <PageLayout title="Blog" category="Ressources">
      <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 2.5rem' }}>
        Prospection, réglementation, outils : des articles de fond sur les problématiques concrètes
        des agences immobilières — sans remplissage.
      </p>

      {posts.map(post => (
        <PostCard key={post.slug} post={post} />
      ))}
    </PageLayout>
  )
}
