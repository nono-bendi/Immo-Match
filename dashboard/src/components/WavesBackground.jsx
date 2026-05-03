import { useTheme } from '../contexts/ThemeContext'

export default function WavesBackground() {
  const { dark } = useTheme()

  const wash = dark
    ? 'linear-gradient(180deg, #0f1e30 0%, #142336 40%, #1c2e44 100%)'
    : 'linear-gradient(180deg, #e3edf9 0%, #dce8f6 40%, #e6eef8 100%)'

  const blendMode = dark ? 'screen' : 'normal'

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    >
      <style>{`
        @keyframes wavesDrift {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(-30px); }
        }
        @keyframes wavesDrift2 {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(40px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-waves-bg] g { animation: none !important; }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, background: wash }} />

      <svg
        data-waves-bg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: blendMode }}
      >
        <defs>
          <linearGradient id="wavesBgGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#bae6fd" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wavesBgGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#a5b4fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wavesBgGrad3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7dd3fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.35" />
          </linearGradient>
          <filter id="wavesBgBlur">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <g style={{ animation: 'wavesDrift 28s ease-in-out infinite', transformOrigin: 'center' }}>
          <path d="M0,180 C240,120 480,260 720,200 C960,140 1200,280 1440,220 L1440,0 L0,0 Z"
            fill="url(#wavesBgGrad1)" filter="url(#wavesBgBlur)" />
        </g>
        <g style={{ animation: 'wavesDrift2 34s ease-in-out infinite', transformOrigin: 'center' }}>
          <path d="M0,420 C300,360 600,520 900,440 C1140,380 1280,500 1440,460 L1440,160 C1200,220 960,80 720,140 C480,200 240,60 0,120 Z"
            fill="url(#wavesBgGrad2)" filter="url(#wavesBgBlur)" />
        </g>
        <g style={{ animation: 'wavesDrift 38s ease-in-out infinite reverse', transformOrigin: 'center' }}>
          <path d="M0,720 C300,660 600,820 900,740 C1200,660 1280,800 1440,760 L1440,460 C1200,540 960,360 720,440 C480,520 240,360 0,440 Z"
            fill="url(#wavesBgGrad3)" filter="url(#wavesBgBlur)" opacity="0.6" />
        </g>
        <g style={{ animation: 'wavesDrift2 42s ease-in-out infinite', transformOrigin: 'center' }}>
          <path d="M0,900 L0,820 C300,860 600,720 900,800 C1200,880 1280,760 1440,820 L1440,900 Z"
            fill="url(#wavesBgGrad1)" opacity="0.7" />
        </g>
      </svg>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3, mixBlendMode: 'overlay' }}>
        <filter id="wavesBgGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#wavesBgGrain)" />
      </svg>
    </div>
  )
}
