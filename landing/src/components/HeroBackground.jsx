/* ════════════════════════════════════════════════════════════════
   Fond animé du hero — identique à celui de la landing (Webflow) :
   même scène Unicorn Studio (WebGL), même poster de secours, même
   logique de reveal. Utilisé sur /demarrer et /souscrire pour garder
   exactement le même fond que la page d'accueil.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'

const UNICORN_SCRIPT_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.6/dist/unicornStudio.umd.js'
const UNICORN_PROJECT_ID = 'JAJ1F2fAB9wmATqMOozQ'

let unicornScriptPromise = null
function loadUnicornScript() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.UnicornStudio) return Promise.resolve()
  if (unicornScriptPromise) return unicornScriptPromise
  unicornScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = UNICORN_SCRIPT_SRC
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('unicornstudio script failed to load'))
    document.head.appendChild(script)
  })
  return unicornScriptPromise
}

export default function HeroBackground() {
  const rootRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let mutationObserver = null
    let intersectionObserver = null

    loadUnicornScript().then(() => {
      if (cancelled || !window.UnicornStudio) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.UnicornStudio.init().then((scenes) => {
            if (cancelled || !scenes || !scenes.length) return
            const container = rootRef.current?.querySelector('.hero_background-unicorn')
            if (container && window.IntersectionObserver) {
              intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                  scenes.forEach((scene) => { if (scene) scene.paused = !entry.isIntersecting })
                })
              }, { threshold: 0 })
              intersectionObserver.observe(container)
            }
          }).catch((err) => console.error(err))
        })
      })
    }).catch((err) => console.error(err))

    /* Reveal : on bascule du poster statique vers le canvas WebGL une
       fois qu'il a de vraies dimensions de rendu (évite un flash noir). */
    const bgEl = rootRef.current
    if (bgEl) {
      const unicorn = bgEl.querySelector('.hero_background-unicorn')
      const poster = bgEl.querySelector('.hero_background-poster')
      if (unicorn && poster) {
        let hasRevealed = false
        const revealUnicorn = () => {
          if (hasRevealed) return
          const canvas = unicorn.querySelector('canvas')
          if (!canvas || canvas.width === 0 || canvas.height === 0) return
          hasRevealed = true
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                bgEl.classList.add('is-unicorn-ready')
                if (mutationObserver) mutationObserver.disconnect()
              }, 150)
            })
          })
        }
        mutationObserver = new MutationObserver(revealUnicorn)
        mutationObserver.observe(unicorn, { childList: true, subtree: true })
        revealUnicorn()
      }
    }

    return () => {
      cancelled = true
      if (mutationObserver) mutationObserver.disconnect()
      if (intersectionObserver) intersectionObserver.disconnect()
      // On repart d'un état propre au changement de route (SPA) : la page
      // Webflow d'origine ne se pose jamais la question (rechargement complet).
      if (window.UnicornStudio?.destroy) {
        try { window.UnicornStudio.destroy() } catch { /* no-op */ }
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="hero_background"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}
    >
      <style>{`
        .hero_background-poster {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 1; visibility: visible;
          transition: opacity 0.7s ease, visibility 0s linear 0.7s;
          pointer-events: none; z-index: 1;
        }
        .hero_background-unicorn {
          position: absolute; inset: 0; width: 100%; height: 100%;
          opacity: 0; transition: opacity 0.7s ease; pointer-events: none; z-index: 2;
        }
        .hero_background.is-unicorn-ready .hero_background-unicorn { opacity: 1; }
        .hero_background.is-unicorn-ready .hero_background-poster { opacity: 0; visibility: hidden; }
        @media (prefers-reduced-motion: reduce) {
          .hero_background-poster, .hero_background-unicorn { transition-duration: 0.01ms; }
        }
      `}</style>
      <img
        fetchpriority="high"
        decoding="async"
        alt=""
        src="/images/Hero-Background.avif"
        loading="eager"
        className="hero_background-poster"
      />
      <div
        data-us-production="true"
        data-us-project={UNICORN_PROJECT_ID}
        data-us-scale="1"
        data-us-dpi="1"
        data-us-fps="24"
        className="hero_background-unicorn"
      />
    </div>
  )
}
