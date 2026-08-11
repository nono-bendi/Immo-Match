import { useEffect, useRef } from 'react'

/* ════════════════════════════════════════════════════════════════
   VIDEO — Page plein écran pour la vidéo de présentation
   Accès : /video?a=<id> (lien utilisé dans le mail de prospection)
   Trace play/25%/50%/75%/fin par agence via /api/video-track, pour
   distinguer un vrai visionnage d'un scan de sécurité email (qui ne
   déclenche jamais la lecture d'une vidéo HTML).
   ════════════════════════════════════════════════════════════════ */
export default function Video() {
  const videoRef = useRef(null)
  const firedRef = useRef(new Set())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const a = params.get('a') || ''

    const track = (event) => {
      if (firedRef.current.has(event)) return
      firedRef.current.add(event)
      fetch('/api/video-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, event }),
      }).catch(() => {})
    }

    track('page_view')

    const video = videoRef.current
    if (!video) return
    const onPlay = () => track('play')
    const onTimeUpdate = () => {
      if (!video.duration) return
      const pct = video.currentTime / video.duration
      if (pct >= 0.25) track('progress_25')
      if (pct >= 0.5) track('progress_50')
      if (pct >= 0.75) track('progress_75')
    }
    const onEnded = () => track('ended')
    video.addEventListener('play', onPlay)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#060d18',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 960 }}>
        <video
          ref={videoRef}
          src="/assets/hero.mp4"
          poster="/assets/hero-poster.jpg"
          controls autoPlay muted playsInline
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
