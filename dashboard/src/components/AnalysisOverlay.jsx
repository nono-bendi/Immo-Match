import { useState, useEffect } from 'react'

function AnalysisOverlay({ isVisible, totalProspects, currentProspect, currentProspectName, isCompleted }) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTimePerProspect, setEstimatedTimePerProspect] = useState(0)
  
  useEffect(() => {
    if (isVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedTime(0)
      setEstimatedTimePerProspect(0)
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isVisible])

  // Calculer le temps moyen par prospect
  useEffect(() => {
    if (currentProspect > 0 && elapsedTime > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstimatedTimePerProspect(elapsedTime / currentProspect)
    }
  }, [currentProspect, elapsedTime])

  if (!isVisible) return null

  // Pour un seul prospect, on simule une progression basée sur le temps (environ 15s par analyse)
  const isSingleProspect = totalProspects === 1
  let progress
  if (isCompleted) {
    progress = 100
  } else if (isSingleProspect) {
    // Courbe asymptotique : avance toujours, de plus en plus lentement, ne bloque jamais
    progress = 98 * (1 - Math.exp(-elapsedTime / 18))
  } else {
    progress = totalProspects > 0 ? ((currentProspect - 1) / totalProspects) * 100 : 0
  }

  const remainingProspects = totalProspects - currentProspect
  const remainingTime = Math.max(0, Math.round(remainingProspects * estimatedTimePerProspect))

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="fixed inset-0 bg-[#1E3A5F]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        
        {/* Loader SVG */}
        <div className="relative w-32 h-40 mx-auto mb-4">
          <style>{`
            .loader-container {
              --fill-color: #1E3A5F;
              --shine-color: #1E3A5F33;
              transform: scale(0.6);
              width: 100px;
              height: 100px;
              position: relative;
              filter: drop-shadow(0 0 10px var(--shine-color));
            }
            .loader-container #pegtopone {
              position: absolute;
              animation: flowe-one 1s linear infinite;
            }
            .loader-container #pegtoptwo {
              position: absolute;
              opacity: 0;
              transform: scale(0) translateY(-200px) translateX(-100px);
              animation: flowe-two 1s linear infinite;
              animation-delay: 0.3s;
            }
            .loader-container #pegtopthree {
              position: absolute;
              opacity: 0;
              transform: scale(0) translateY(-200px) translateX(100px);
              animation: flowe-three 1s linear infinite;
              animation-delay: 0.6s;
            }
            .loader-container svg g path:first-child {
              fill: var(--fill-color);
            }
            @keyframes flowe-one {
              0% { transform: scale(0.5) translateY(-200px); opacity: 0; }
              25% { transform: scale(0.75) translateY(-100px); opacity: 1; }
              50% { transform: scale(1) translateY(0px); opacity: 1; }
              75% { transform: scale(0.5) translateY(50px); opacity: 1; }
              100% { transform: scale(0) translateY(100px); opacity: 0; }
            }
            @keyframes flowe-two {
              0% { transform: scale(0.5) rotateZ(-10deg) translateY(-200px) translateX(-100px); opacity: 0; }
              25% { transform: scale(1) rotateZ(-5deg) translateY(-100px) translateX(-50px); opacity: 1; }
              50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(-25px); opacity: 1; }
              75% { transform: scale(0.5) rotateZ(5deg) translateY(50px) translateX(0px); opacity: 1; }
              100% { transform: scale(0) rotateZ(10deg) translateY(100px) translateX(25px); opacity: 0; }
            }
            @keyframes flowe-three {
              0% { transform: scale(0.5) rotateZ(10deg) translateY(-200px) translateX(100px); opacity: 0; }
              25% { transform: scale(1) rotateZ(5deg) translateY(-100px) translateX(50px); opacity: 1; }
              50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(25px); opacity: 1; }
              75% { transform: scale(0.5) rotateZ(-5deg) translateY(50px) translateX(0px); opacity: 1; }
              100% { transform: scale(0) rotateZ(-10deg) translateY(100px) translateX(-25px); opacity: 0; }
            }
          `}</style>
          
          <div className="loader-container absolute inset-0 flex items-center justify-center mt-6">
            <svg id="pegtopone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <filter id="shine1"><feGaussianBlur stdDeviation="3"></feGaussianBlur></filter>
                <mask id="mask1"><path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white"></path></mask>
                <radialGradient id="grad1a" cx="50" cy="66" fx="50" fy="66" r="30" gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="black" stopOpacity="0.3"></stop>
                  <stop offset="50%" stopColor="black" stopOpacity="0.1"></stop>
                  <stop offset="100%" stopColor="black" stopOpacity="0"></stop>
                </radialGradient>
                <radialGradient id="grad1b" cx="55" cy="20" fx="55" fy="20" r="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0.3"></stop>
                  <stop offset="50%" stopColor="white" stopOpacity="0.1"></stop>
                  <stop offset="100%" stopColor="white" stopOpacity="0"></stop>
                </radialGradient>
              </defs>
              <g>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="currentColor"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1a)"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1b)"></path>
              </g>
            </svg>
            <svg id="pegtoptwo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
              <g>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="currentColor"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1a)"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1b)"></path>
              </g>
            </svg>
            <svg id="pegtopthree" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
              <g>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="currentColor"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1a)"></path>
                <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#grad1b)"></path>
              </g>
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-[#1E3A5F] mb-1">Analyse en cours</h2>
        <p className="text-gray-500 mb-6 text-sm">L'IA analyse les correspondances...</p>

        {/* Prospect en cours */}
        {currentProspectName && (
          <div className="bg-[#DCE7F3] rounded-lg px-4 py-2 mb-4">
            <p className="text-sm text-[#1E3A5F] font-medium">
              {currentProspectName}
            </p>
          </div>
        )}

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{isSingleProspect ? 'Analyse...' : `${currentProspect} / ${totalProspects} prospects`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Temps */}
        <div className="flex justify-center gap-6 text-sm text-gray-400">
          <span>Écoulé : {formatTime(elapsedTime)}</span>
          {!isSingleProspect && currentProspect > 1 && remainingTime > 0 && (
            <span>Restant : ~{formatTime(remainingTime)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalysisOverlay