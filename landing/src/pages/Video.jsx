/* ════════════════════════════════════════════════════════════════
   VIDEO — Page plein écran pour la vidéo de présentation
   Accès : /video (lien utilisé dans le mail de prospection)
   ════════════════════════════════════════════════════════════════ */
export default function Video() {
  return (
    <div style={{
      minHeight: '100vh', background: '#060d18',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 960 }}>
        <video
          src="/assets/hero.mp4"
          poster="/assets/hero-poster.jpg"
          controls autoPlay playsInline
          style={{ width: '100%', display: 'block', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        />
      </div>
      <a href="/" style={{
        marginTop: '1.75rem', display: 'inline-flex', alignItems: 'center', gap: 8,
        color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour à l'accueil ImmoFlash
      </a>
    </div>
  )
}
