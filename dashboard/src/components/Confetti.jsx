// src/components/Confetti.jsx
import { useEffect, useState } from 'react'

function Confetti({ show, duration = 2000 }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (show) {
      // Générer les particules
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random(),
        size: 6 + Math.random() * 6,
        isCircle: Math.random() > 0.5
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParticles(newParticles)

      // Nettoyer après l'animation
      const timer = setTimeout(() => setParticles([]), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!show && particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  )
}

export default Confetti