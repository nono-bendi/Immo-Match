// src/components/AnimatedScore.jsx
import { useEffect, useState } from 'react'

function AnimatedScore({ score, size = 'md', className = '' }) {
  const [displayScore, setDisplayScore] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (hasAnimated) return
    
    let current = 0
    const increment = score / 25
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        setHasAnimated(true)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, 30)

    return () => clearInterval(timer)
  }, [score, hasAnimated])

  const getScoreColor = () => {
    if (score >= 75) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl'
  }

  return (
    <div className={`${getScoreColor()} ${sizeClasses[size]} rounded-lg flex items-center justify-center text-white font-bold animate-count-up ${className}`}>
      {displayScore}
    </div>
  )
}

export default AnimatedScore