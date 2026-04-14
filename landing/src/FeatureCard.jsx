/* ════════════════════════════════════════════
   FeatureCard — section Features ImmoMatch
   Layout : image flottante (gauche/droite) + texte
   ════════════════════════════════════════════ */

export default function FeatureCard({
  label,
  title,
  description,
  imageSrc,
  imageAlt,
  /* crop : objectPosition CSS ex: 'center 30%' */
  cropPosition = 'center center',
  /* hauteur visible de la zone croppée en px */
  cropHeight = 280,
  /* rotation légère ±2deg */
  rotation = -2,
  /* true → image à droite, texte à gauche */
  reversed = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: reversed ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 'clamp(2rem, 5vw, 5rem)',
      }}
    >
      {/* ── Image flottante ────────────────────────────────── */}
      <div
        style={{
          flex: '0 0 52%',
          /* la rotation + le drop-shadow doivent déborder sans clipper */
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            /* rotation légère */
            transform: `rotate(${rotation}deg)`,
            /* ombre profonde */
            boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            /* glow sky-400 à 15% */
            filter: 'drop-shadow(0 0 32px rgba(56,189,248,0.15))',
            /* hauteur du crop */
            height: cropHeight,
          }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: cropPosition,
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* ── Texte ──────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Label */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            margin: '0 0 0.75rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
        </p>

        {/* Titre */}
        <h3
          style={{
            fontSize: 'clamp(20px, 2.4vw, 26px)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            margin: '0 0 1rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            lineHeight: 1.8,
            margin: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
