import { useCurrentFrame, spring, interpolate } from 'remotion'

// ═══════════════════════════ TOKENS ═══════════════════════════
const N   = '#1E3A5F'
const N2  = '#152a45'
const B   = '#2D5A8A'
const BL  = '#60a5fa'
const SK  = '#38bdf8'
const T   = '#DCE7F3'
const EM  = '#10b981'
const EML = '#d1fae5'
const EMD = '#065f46'
const AM  = '#f59e0b'
const AML = '#fffbeb'
const AMT = '#92400e'
const G50 = '#f9fafb'
const G100= '#f3f4f6'
const G200= '#e5e7eb'
const G400= '#9ca3af'
const G500= '#6b7280'
const G600= '#4b5563'
const G700= '#374151'
const G900= '#111827'
const W   = '#ffffff'

const FPS = 120

// ═══════════════════════════ HELPERS ═══════════════════════════
const cl = (frame, [s, e], [from, to]) =>
  interpolate(frame, [s, e], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

const sp = (frame, start, cfg = {}) =>
  spring({ frame: frame - start, fps: FPS, config: { damping: 14, stiffness: 120, mass: 1, ...cfg } })

const fi = (f, s, d = 24) => cl(f, [s, s + d], [0, 1])
const fo = (f, e, d = 24) => cl(f, [e - d, e], [1, 0])
const su = (f, s, dist = 24, d = 30) => cl(f, [s, s + d], [dist, 0])
const tw = (f, s, e, text) => text.slice(0, Math.round(cl(f, [s, e], [0, text.length])))

// ═══════════════════════════ DATA ═══════════════════════════
const PROSPECT = {
  nom: 'Laurent Ferrand',
  mail: 'l.ferrand@gmail.com',
  telephone: '06 12 34 56 78',
  budget: '650 000',
  surface: '150',
  pieces: '5',
}

const MATCH = {
  score: 87,
  type: 'Maison/villa',
  ville: 'Les Arcs',
  prix: '580 000 €',
  surface: '167',
  pieces: '5',
  photo: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  points_forts: [
    "167 m² avec 4 chambres, correspond à votre besoin d'espace",
    'Plain-pied intégral avec suite parentale, critère mentionné',
    "Piscine privée et jardin 700 m², l'extérieur que vous cherchiez",
  ],
  points_attention: 'Distance plage : 22 min en voiture, pas en bord de mer direct',
  recommandation: 'Excellent match global. À proposer en priorité pour une visite.',
}

// ═══════════════════════════ ICONS ═══════════════════════════
const IcoHome = ({ size = 16, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
  </svg>
)
const IcoUsers = ({ size = 16, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IcoBiens = ({ size = 16, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IcoHistory = ({ size = 16, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/>
    <polyline points="3 3 3 11 11 11"/>
  </svg>
)
const IcoSparkles = ({ size = 16, c = W }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
)
const IcoCheck = ({ size = 16, c = EM }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoCheckCircle = ({ size = 12, c = EM }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IcoAlert = ({ size = 12, c = AM }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoLightbulb = ({ size = 12, c = N }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
  </svg>
)
const IcoSend = ({ size = 16, c = W }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IcoClock = ({ size = 14, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoChevron = ({ size = 14, c = G400, up = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points={up ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/>
  </svg>
)
const IcoRefresh = ({ size = 14, c = G600 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)
const IcoSearch = ({ size = 16, c = G400 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcoEye = ({ size = 14, c = G500 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

// ═══════════════════════════ SIDEBAR ═══════════════════════════
function Sidebar({ active = 'Matchings' }) {
  const items = [
    { label: 'Dashboard',        icon: (a) => <IcoHome   size={15} c={a ? N : 'rgba(255,255,255,0.65)'} /> },
    { label: 'Nouveau prospect', icon: (a) => <IcoUsers  size={15} c={a ? N : 'rgba(255,255,255,0.65)'} /> },
    { label: 'Clients',          icon: (a) => <IcoUsers  size={15} c={a ? N : 'rgba(255,255,255,0.65)'} /> },
    { label: 'Biens',            icon: (a) => <IcoBiens  size={15} c={a ? N : 'rgba(255,255,255,0.65)'} /> },
    { label: 'Matchings',        icon: (a) => <IcoSparkles size={15} c={a ? N : BL} /> },
    { label: 'Historique',       icon: (a) => <IcoHistory size={15} c={a ? N : 'rgba(255,255,255,0.65)'} /> },
  ]
  return (
    <div style={{ width: 216, height: '100%', background: `linear-gradient(to bottom, ${N}, ${N2})`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill={BL}/></svg>
        </div>
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: W }}>Immo</span><span style={{ color: BL }}>Match</span>
        </span>
      </div>
      <div style={{ flex: 1, padding: '0 8px' }}>
        {items.map(({ label, icon }) => {
          const a = label === active
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', margin: '2px 0', borderRadius: 9, background: a ? W : 'transparent', color: a ? N : 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: a ? 600 : 400 }}>
              {icon(a)}<span>{label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, background: BL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: W, fontSize: 11, fontWeight: 700 }}>NB</div>
        <div>
          <div style={{ color: W, fontSize: 12, fontWeight: 600 }}>Noa Bendiaf</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Admin</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════ APP CHROME ═══════════════════════════
function AppChrome({ children, active = 'Matchings', title = 'Matchings IA', sub = '' }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: G50, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, background: W, borderBottom: `1px solid ${G200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: N }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: G400 }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: G400, background: G100, padding: '5px 11px', borderRadius: 8, border: `1px solid ${G200}` }}>
            <IcoClock /><span>20 avr. 2026</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════ SCENE 1 — PROBLEM ═══════════════════════════
function Scene1({ frame }) {
  const lines = ['Vous avez des acheteurs.', 'Vous avez des biens.', 'Mais trouver le bon match\nprend des heures.']
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #080d17 0%, #0d1829 60%, #111e35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 720 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ opacity: fi(frame, 20 + i * 70, 40) * fo(frame, 235, 28), transform: `translateY(${su(frame, 20 + i * 70, 22, 35)}px)`, fontSize: i === 2 ? 54 : 46, fontWeight: i === 2 ? 700 : 300, color: i === 2 ? W : 'rgba(255,255,255,0.65)', lineHeight: 1.25, marginBottom: i < 2 ? 10 : 28, letterSpacing: i === 2 ? '-1.5px' : '-0.5px', whiteSpace: 'pre-line' }}>
            {line}
          </div>
        ))}
        {frame > 145 && (
          <div style={{ opacity: fi(frame, 145, 30) * fo(frame, 235, 22), transform: `translateY(${su(frame, 145, 14, 25)}px)`, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 40, padding: '10px 24px', color: '#fca5a5', fontSize: 17, fontWeight: 500 }}>
            <span>⏱</span> En moyenne, 3h perdues par dossier
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════ SCENE 2 — SOLUTION ═══════════════════════════
function Scene2({ frame }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #080d17 0%, #0d1829 60%, #111e35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ opacity: fi(frame, 0, 35), transform: `translateY(${su(frame, 0, 20, 30)}px)`, fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginBottom: 14, letterSpacing: '-0.3px' }}>Il y a une meilleure façon.</div>
        <div style={{ opacity: fi(frame, 30, 28), transform: `translateY(${su(frame, 30, 14, 25)}px)`, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginBottom: 22, letterSpacing: '5px', textTransform: 'uppercase' }}>Rencontrez</div>
        {frame > 55 && (
          <div style={{ opacity: fi(frame, 55, 35), transform: `scale(${0.65 + 0.35 * sp(frame, 55, { damping: 11, stiffness: 75 })})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 30 }}>
            <div style={{ width: 70, height: 70, background: 'rgba(96,165,250,0.12)', border: '2px solid rgba(96,165,250,0.35)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="38" height="38"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill={BL}/></svg>
            </div>
            <span style={{ fontSize: 66, fontWeight: 800, letterSpacing: '-2.5px' }}>
              <span style={{ color: W }}>Immo</span><span style={{ color: BL }}>Match</span>
            </span>
          </div>
        )}
        {frame > 105 && (
          <div style={{ opacity: fi(frame, 105, 35), transform: `translateY(${su(frame, 105, 14, 28)}px)` }}>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.65)', fontWeight: 300, marginBottom: 10 }}>Matching IA entre vos biens et vos acheteurs.</div>
            <div style={{ fontSize: 19, color: SK, fontWeight: 600 }}>En quelques secondes.</div>
          </div>
        )}
        {frame > 135 && (
          <div style={{ width: cl(frame, [145, 200], [0, 380]), height: 1.5, background: `linear-gradient(90deg, transparent, ${SK}, transparent)`, borderRadius: 1, margin: '36px auto 0', opacity: fi(frame, 135, 25) }} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════ SCENE 3 — FORM ═══════════════════════════
function Chip({ label, active = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 20, background: active ? N : G100, color: active ? W : G600, fontSize: 11, fontWeight: active ? 600 : 400, border: `1px solid ${active ? N : G200}`, marginRight: 5, marginBottom: 5 }}>
      {active && <span style={{ fontSize: 9 }}>✓</span>}{label}
    </div>
  )
}

function Field({ label, value, cursor = false, small = false, multiline = false }) {
  return (
    <div style={{ marginBottom: small ? 6 : 10, width: '100%' }}>
      {label && <div style={{ fontSize: 10, fontWeight: 600, color: G700, marginBottom: 3 }}>{label}</div>}
      <div style={{ padding: small ? '5px 9px' : multiline ? '8px 11px' : '7px 11px', border: `1.5px solid ${value ? N : G200}`, borderRadius: 8, fontSize: small ? 11 : 12, color: G900, background: W, boxShadow: value ? `0 0 0 3px ${T}` : 'none', minHeight: multiline ? 52 : small ? 28 : 32, display: 'flex', alignItems: multiline ? 'flex-start' : 'center', lineHeight: multiline ? 1.45 : 1 }}>
        <span>{value}</span>
        {cursor && <span style={{ display: 'inline-block', width: 1.5, height: small ? 11 : 13, background: N, marginLeft: 1 }} />}
      </div>
    </div>
  )
}

function Scene3({ frame }) {
  const nomV  = tw(frame, 0,   45,  'Laurent Ferrand')
  const mailV = tw(frame, 55,  100, 'l.ferrand@gmail.com')
  const telV  = tw(frame, 110, 145, '06 12 34 56 78')
  const budV  = tw(frame, 235, 270, '650 000')
  const surV  = tw(frame, 275, 305, '150')
  const pieV  = tw(frame, 310, 325, '5')
  const obsV  = tw(frame, 390, 450, 'Plain-pied avec piscine, proche mer')

  const cur = (s, e) => frame >= s && frame < e

  return (
    <div style={{ opacity: fi(frame, -5, 28), width: '100%', height: '100%' }}>
      <AppChrome active="Nouveau prospect" title="Nouveau prospect" sub="Renseigner le profil acheteur">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, height: '100%' }}>
          <div>
            <div style={{ background: W, borderRadius: 11, border: `1px solid ${G200}`, padding: 14, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><IcoUsers size={13} c={N} />Identité</div>
              <Field label="Nom complet" value={nomV} cursor={cur(0, 50)} />
              {frame >= 50  && <Field label="Email" value={mailV} cursor={cur(55, 105)} />}
              {frame >= 105 && <Field label="Téléphone" value={telV} cursor={cur(110, 150)} />}
            </div>
            <div style={{ background: W, borderRadius: 11, border: `1px solid ${G200}`, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><IcoHome size={13} c={N} />Critères de recherche</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: G700, marginBottom: 5 }}>Type de bien</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {frame > 150 && <Chip label="Maison" active />}
                  {frame > 162 && <Chip label="Appartement" active={false} />}
                  {frame > 170 && <Chip label="Villa" active={false} />}
                </div>
              </div>
              {frame > 185 && (
                <div style={{ marginBottom: 10, opacity: fi(frame, 185, 22) }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: G700, marginBottom: 5 }}>Villes cibles</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <Chip label="Fréjus" active />
                    {frame > 200 && <Chip label="Saint-Raphaël" active />}
                    {frame > 215 && <Chip label="Les Arcs" active={false} />}
                  </div>
                </div>
              )}
              {frame > 230 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, opacity: fi(frame, 230, 22) }}>
                  <Field label="Budget max" value={budV ? `${budV} €` : ''} cursor={cur(235, 275)} small />
                  {frame > 270 && <Field label="Surface min" value={surV ? `${surV} m²` : ''} cursor={cur(275, 310)} small />}
                  {frame > 305 && <Field label="Pièces min" value={pieV} cursor={cur(310, 330)} small />}
                </div>
              )}
            </div>
          </div>
          <div>
            {frame > 335 && (
              <div style={{ background: W, borderRadius: 11, border: `1px solid ${G200}`, padding: 14, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', opacity: fi(frame, 335, 25) }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 10 }}>Destination</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <Chip label="Résidence principale" active />
                  <Chip label="Inv. Locatif à l'année" active={false} />
                  <Chip label="Résidence secondaire" active={false} />
                </div>
              </div>
            )}
            {frame > 380 && (
              <div style={{ background: W, borderRadius: 11, border: `1px solid ${G200}`, padding: 14, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', opacity: fi(frame, 380, 22) }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 8 }}>Observations</div>
                <Field label="" value={obsV} cursor={cur(390, 460)} multiline />
              </div>
            )}
            {frame > 460 && (
              <div style={{ opacity: fi(frame, 460, 30) }}>
                <div style={{ width: '100%', padding: '13px 20px', background: `linear-gradient(135deg, ${N} 0%, ${B} 100%)`, borderRadius: 11, color: W, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 4px 18px rgba(30,58,95,0.38)`, transform: frame > 500 ? `scale(${0.97 + 0.03 * sp(frame, 500, { damping: 8, stiffness: 200 })})` : 'scale(1)' }}>
                  <IcoSparkles size={17} c={W} /> Lancer l'analyse IA
                </div>
                <div style={{ textAlign: 'center', marginTop: 7, fontSize: 10, color: G400 }}>L'IA analysera tous vos biens en catalogue</div>
              </div>
            )}
          </div>
        </div>
      </AppChrome>
    </div>
  )
}

// ═══════════════════════════ SCENE 4 — ANALYSIS ═══════════════════════════
const STAR = "M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"

function Scene4({ frame }) {
  const pct    = Math.min(97, 97 * (1 - Math.exp(-frame / 175)))
  const done   = frame > 360
  const final  = done ? 100 : pct
  const op     = fi(frame, 0, 18) * (done ? fo(frame, 400, 22) : 1)
  const spin   = (frame * 3.2) % 360

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,58,95,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, zIndex: 50 }}>
      <div style={{ background: W, borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.32)', padding: '38px 46px', width: 400, textAlign: 'center', transform: `scale(${0.78 + 0.22 * sp(frame, 0, { damping: 13, stiffness: 95 })})` }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 18px', position: 'relative' }}>
          {[0, 1, 2].map(i => {
            const ang = ((spin + i * 120) * Math.PI) / 180
            return <div key={i} style={{ position: 'absolute', left: 40 + 26 * Math.cos(ang) - 5, top: 40 + 26 * Math.sin(ang) - 5, width: 10, height: 10, borderRadius: '50%', background: N, opacity: 0.35 + 0.65 * Math.abs(Math.sin(frame / 18 + i * 2.1)) }} />
          })}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <svg viewBox="0 0 100 100" width="34" height="34"><path d={STAR} fill={N} /></svg>
          </div>
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, color: N, marginBottom: 5 }}>{done ? 'Analyse terminée !' : 'Analyse en cours'}</div>
        <div style={{ fontSize: 13, color: G500, marginBottom: 18 }}>{done ? 'Correspondances trouvées' : "L'IA analyse les correspondances..."}</div>
        {!done && <div style={{ background: T, borderRadius: 8, padding: '7px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: N }}>{PROSPECT.nom}</div>}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: G500, marginBottom: 7 }}>
            <span>Analyse...</span>
            <span style={{ fontWeight: 700, color: done ? EM : N }}>{Math.round(final)}%</span>
          </div>
          <div style={{ height: 7, background: G200, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${final}%`, background: `linear-gradient(90deg, ${N}, ${B})`, borderRadius: 4 }} />
          </div>
        </div>
        {done && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: EML, border: `1px solid ${EM}50`, borderRadius: 10, padding: '10px 18px', opacity: fi(frame, 368, 18), transform: `scale(${0.78 + 0.22 * sp(frame, 368, { damping: 9, stiffness: 140 })})` }}>
            <IcoCheckCircle size={16} c={EM} /><span style={{ color: EMD, fontWeight: 700, fontSize: 14 }}>3 matchings trouvés !</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════ SCENE 5 — RESULTS ═══════════════════════════
function ScoreBadge({ score, size = 48 }) {
  const bg = score >= 75 ? EM : score >= 50 ? AM : '#ef4444'
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: Math.round(size * 0.25), display: 'flex', alignItems: 'center', justifyContent: 'center', color: W, fontWeight: 700, fontSize: Math.round(size * 0.4), flexShrink: 0, boxShadow: `0 2px 8px ${bg}55` }}>{score}</div>
  )
}

function Scene5({ frame }) {
  const rowV    = fi(frame, 42, 32)
  const expanded = frame > 95
  const cardsOp = fi(frame, 125, 38)
  const photoOp = fi(frame, 85, 48)
  const btnHL   = frame > 580

  return (
    <div style={{ opacity: fi(frame, 0, 28), height: '100%' }}>
      <AppChrome active="Matchings" title="Matchings IA" sub="3 matchings · 1 prospect">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: N }}>Matchings IA</div>
            <div style={{ fontSize: 11, color: G400 }}>3 matchings · 1 prospect</div>
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: G400, background: W, padding: '5px 11px', borderRadius: 9, border: `1px solid ${G200}` }}><IcoClock /><span>20 avr., 14:23</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: `linear-gradient(135deg, ${N}, ${B})`, borderRadius: 9, color: W, fontSize: 12, fontWeight: 600, boxShadow: `0 4px 12px rgba(30,58,95,0.3)` }}><IcoSparkles size={14} c={W} />Lancer l'analyse</div>
          </div>
        </div>
        {/* Filter */}
        <div style={{ background: W, borderRadius: 11, padding: '10px 14px', border: `1px solid ${G200}`, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}><IcoSearch /></div>
            <div style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: `1px solid ${G200}`, borderRadius: 8, fontSize: 12, color: G400 }}>Rechercher...</div>
          </div>
          {[['Tous', N], ['75+', EM], ['50-74', AM], ['< 50', '#ef4444']].map(([l, bg], i) => (
            <div key={i} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: i === 0 ? N : `${bg}15`, color: i === 0 ? W : bg, border: `1px solid ${i === 0 ? N : bg + '30'}` }}>{l}</div>
          ))}
        </div>
        {/* Table */}
        <div style={{ background: W, borderRadius: 11, border: `1px solid ${G200}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 72px 72px 100px', gap: 8, padding: '9px 14px', background: G50, borderBottom: `1px solid ${G200}`, fontSize: 9, fontWeight: 700, color: G500, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            <div>Prospect</div><div>Meilleur match</div><div style={{ textAlign: 'center' }}>Score</div><div style={{ textAlign: 'center' }}>Biens</div><div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          <div style={{ opacity: rowV }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 72px 72px 100px', gap: 8, padding: '11px 14px', alignItems: 'center', background: expanded ? '#f0f7ff' : W }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${N}, ${B})`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: W, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>LF</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: N }}>{PROSPECT.nom}</div>
                  <div style={{ fontSize: 11, color: G400 }}>Budget 650 000 €</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: G900 }}>{MATCH.type} · {MATCH.ville}</div>
                <div style={{ fontSize: 11, color: G400 }}>{MATCH.prix} · {MATCH.surface}m²</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><ScoreBadge score={87} size={44} /></div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ padding: '3px 9px', borderRadius: 6, background: G100, color: G600, fontSize: 11, fontWeight: 600 }}>3 biens</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7 }}>
                <div style={{ padding: 7, borderRadius: 7, background: G100 }}><IcoRefresh /></div>
                <div style={{ padding: 7, borderRadius: 7, background: expanded ? N : G100 }}><IcoChevron c={expanded ? W : G600} up={expanded} /></div>
              </div>
            </div>
            {/* Expanded */}
            {expanded && (
              <div style={{ padding: '10px 14px', background: G50, borderTop: `1px solid ${G100}`, opacity: fi(frame, 98, 28) }}>
                <div style={{ background: W, borderRadius: 10, border: `1px solid ${G200}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: `1px solid ${G100}` }}>
                    <ScoreBadge score={87} size={42} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IcoHome size={12} c={G400} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: G900 }}>{MATCH.type} · {MATCH.ville}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: EML, color: EMD, fontWeight: 700 }}>Excellent</span>
                      </div>
                      <div style={{ fontSize: 11, color: G400, marginTop: 2 }}>{MATCH.prix} · {MATCH.surface} m² · {MATCH.pieces} pièces</div>
                    </div>
                    <div style={{ width: 78, height: 54, borderRadius: 8, overflow: 'hidden', opacity: photoOp, flexShrink: 0 }}>
                      <img src={MATCH.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', background: btnHL ? `linear-gradient(135deg, ${EM}, #059669)` : `linear-gradient(135deg, ${N}, ${B})`, borderRadius: 8, color: W, fontSize: 12, fontWeight: 600, flexShrink: 0, boxShadow: btnHL ? `0 4px 12px ${EM}48` : `0 2px 8px ${N}38`, transform: btnHL ? `scale(${0.95 + 0.05 * sp(frame, 580, { damping: 7, stiffness: 200 })})` : 'scale(1)' }}>
                      <IcoSend size={12} />Proposer
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, padding: '10px 13px', opacity: cardsOp }}>
                    <div style={{ background: EML, borderRadius: 8, padding: '9px 11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><IcoCheckCircle size={11} c={EM} /><span style={{ fontSize: 10, fontWeight: 700, color: EMD }}>Points forts</span></div>
                      {MATCH.points_forts.map((p, i) => (
                        <div key={i} style={{ fontSize: 10, color: '#065f46', lineHeight: 1.4, marginBottom: 3, opacity: fi(frame, 130 + i * 18, 22) }}>· {p}</div>
                      ))}
                    </div>
                    <div style={{ background: AML, borderRadius: 8, padding: '9px 11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><IcoAlert size={11} c={AM} /><span style={{ fontSize: 10, fontWeight: 700, color: AMT }}>Attention</span></div>
                      <div style={{ fontSize: 10, color: AMT, lineHeight: 1.4 }}>· {MATCH.points_attention}</div>
                    </div>
                    <div style={{ background: T, borderRadius: 8, padding: '9px 11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><IcoLightbulb size={11} c={N} /><span style={{ fontSize: 10, fontWeight: 700, color: N }}>Recommandation</span></div>
                      <div style={{ fontSize: 10, color: B, lineHeight: 1.4 }}>{MATCH.recommandation}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppChrome>
    </div>
  )
}

// ═══════════════════════════ SCENE 6 — EMAIL MODAL ═══════════════════════════
function Scene6({ frame }) {
  const sendTab = frame >= 285
  const sent    = frame >= 400
  const op      = fi(frame, 0, 20)
  const scale   = 0.62 + 0.38 * sp(frame, 0, { damping: 13, stiffness: 115 })

  return (
    <div style={{ height: '100%', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ opacity: 0.28, height: '100%', filter: 'blur(4px)', pointerEvents: 'none' }}>
        <Scene5 frame={600} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: W, borderRadius: 20, boxShadow: '0 28px 65px rgba(0,0,0,0.38)', width: 660, overflow: 'hidden', opacity: op, transform: `scale(${scale})` }}>
          {/* Header */}
          <div style={{ background: sent ? `linear-gradient(135deg, ${EM}, #059669)` : `linear-gradient(135deg, ${N}, ${B})`, padding: '17px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.18)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sent ? <IcoCheck size={22} c={W} /> : <IcoSend size={19} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: W, fontWeight: 700, fontSize: 16 }}>{sent ? 'Email envoyé !' : 'Envoyer la proposition'}</div>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12 }}>{sent ? 'Proposition transmise avec succès' : `à ${PROSPECT.nom}`}</div>
              </div>
              {!sent && (
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, gap: 3 }}>
                  {[['Aperçu', !sendTab], ['Modifier', false], ['Envoyer', sendTab]].map(([lbl, active], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 6, background: active ? W : 'transparent', color: active ? N : 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: active ? 600 : 400 }}>
                      {i === 0 && <IcoEye size={12} c={active ? N : W} />}
                      {i === 2 && <IcoSend size={11} c={active ? N : W} />}
                      {lbl}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: 22 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 76, height: 76, background: EML, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', transform: `scale(${0.5 + 0.5 * sp(frame, 400, { damping: 9, stiffness: 110 })})` }}>
                  <IcoCheck size={38} c={EM} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: G900, marginBottom: 9 }}>Proposition envoyée à {PROSPECT.nom}</div>
                <div style={{ fontSize: 13, color: G500, marginBottom: 22 }}>Email transmis pour <strong>Maison · Les Arcs</strong> à {PROSPECT.mail}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: EML, border: `1px solid ${EM}40`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: EMD, opacity: fi(frame, 420, 22) }}>
                  <IcoCheckCircle size={15} c={EM} />Email enregistré dans l'historique
                </div>
              </div>
            ) : !sendTab ? (
              <div>
                <div style={{ border: `1px solid ${G200}`, borderRadius: 11, overflow: 'hidden' }}>
                  <div style={{ background: G50, padding: '7px 13px', borderBottom: `1px solid ${G200}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
                    </div>
                    <span style={{ fontSize: 10, color: G500, marginLeft: 6 }}>Aperçu de l'email</span>
                  </div>
                  <div style={{ padding: 18, background: '#f8fafc' }}>
                    <div style={{ maxWidth: 400, margin: '0 auto' }}>
                      <div style={{ background: W, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${G200}` }}>
                        <div style={{ fontSize: 10, color: G400, marginBottom: 1 }}>De : contact@immoflash.fr</div>
                        <div style={{ fontSize: 10, color: G400, marginBottom: 1 }}>À : {PROSPECT.mail}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: G900 }}>Proposition immobilière — Maison à Les Arcs</div>
                      </div>
                      <div style={{ background: `linear-gradient(135deg, ${N}, ${B})`, borderRadius: 8, padding: '16px 18px 14px', textAlign: 'center', marginBottom: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>
                          <span style={{ color: W }}>Immo</span><span style={{ color: BL }}>Match</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Une sélection personnalisée pour vous</div>
                      </div>
                      <div style={{ background: W, borderRadius: 8, overflow: 'hidden', border: `1px solid ${G200}` }}>
                        <img src={MATCH.photo} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                        <div style={{ padding: 11 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: G900 }}>{MATCH.type} · {MATCH.ville}</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: N, marginTop: 3 }}>{MATCH.prix}</div>
                          <div style={{ fontSize: 11, color: G500, marginTop: 3 }}>{MATCH.surface} m² · {MATCH.pieces} pièces</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <div style={{ flex: 1, padding: '11px', textAlign: 'center', border: `1px solid ${G200}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: G700 }}>Annuler</div>
                  <div style={{ flex: 1, padding: '11px', textAlign: 'center', background: N, borderRadius: 10, fontSize: 13, fontWeight: 600, color: W, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><IcoSend size={13} />Continuer</div>
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Destinataire', main: PROSPECT.nom, sub: PROSPECT.mail, sc: N },
                  { label: 'Sujet', main: 'Proposition immobilière — Maison à Les Arcs', sub: null },
                  { label: 'Bien proposé', main: `${MATCH.type} à ${MATCH.ville}`, sub: MATCH.prix, sc: N },
                ].map(({ label, main, sub, sc }, i) => (
                  <div key={i} style={{ background: G50, borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: G500, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: G900 }}>{main}</div>
                    {sub && <div style={{ fontSize: 13, color: sc || G500, fontWeight: sc ? 700 : 400 }}>{sub}</div>}
                  </div>
                ))}
                <div style={{ background: AML, border: `1px solid ${AM}45`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: AMT }}><strong>Confirmation :</strong> L'email sera envoyé immédiatement à {PROSPECT.mail}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, padding: '13px', textAlign: 'center', border: `1px solid ${G200}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: G700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><IcoEye size={14} />Revoir l'aperçu</div>
                  <div style={{ flex: 1, padding: '13px', textAlign: 'center', background: EM, borderRadius: 10, fontSize: 13, fontWeight: 700, color: W, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: `0 4px 14px ${EM}48`, transform: `scale(${0.97 + 0.03 * sp(frame, 10, { damping: 6, stiffness: 200 })})` }}>
                    <IcoSend size={14} />Envoyer maintenant
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════ SCENE 7 — CLOSING ═══════════════════════════
function Scene7({ frame }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #080d17 0%, #0d1829 60%, #111e35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ opacity: fi(frame, 8, 38), transform: `translateY(${su(frame, 8, 22, 32)}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 26 }}>
          <div style={{ width: 58, height: 58, background: 'rgba(96,165,250,0.1)', border: '2px solid rgba(96,165,250,0.28)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill={BL}/></svg>
          </div>
          <span style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-2.5px' }}>
            <span style={{ color: W }}>Immo</span><span style={{ color: BL }}>Match</span>
          </span>
        </div>
        <div style={{ opacity: fi(frame, 42, 35), transform: `translateY(${su(frame, 42, 14, 28)}px)` }}>
          <div style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.75)', marginBottom: 11, letterSpacing: '-0.5px' }}>Le bon bien, pour le bon acheteur.</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: SK }}>En quelques secondes.</div>
        </div>
        {frame > 80 && (
          <div style={{ marginTop: 38, opacity: fi(frame, 80, 38), transform: `translateY(${su(frame, 80, 18, 30)}px) scale(${0.78 + 0.22 * sp(frame, 80, { damping: 11, stiffness: 95 })})` }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 34px', background: `linear-gradient(135deg, ${N}, ${B})`, borderRadius: 50, color: W, fontSize: 17, fontWeight: 700, boxShadow: `0 8px 28px rgba(30,58,95,0.45)` }}>
              <IcoSparkles size={19} c={W} />Essayer gratuitement
            </div>
          </div>
        )}
        {frame > 120 && (
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 46, opacity: fi(frame, 120, 28) }}>
            {[EM, SK, BL, AM].map((c, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 28 + i)) }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════ MAIN — 120fps · 3600f · 30s ═══════════════════════════
export function ImmoFlashVideo() {
  const frame = useCurrentFrame()

  // Scene windows
  const S1E = 255
  const S2S = 222,  S2E = 470
  const S3S = 438,  S3E = 1120
  const S4S = 1060, S4E = 1510
  const S5S = 1440, S5E = 2680
  const S6S = 2600, S6E = 3320
  const S7S = 3235

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#080d17' }}>
      {frame <= S1E && (
        <div style={{ position: 'absolute', inset: 0, opacity: fo(frame, S1E, 22) }}>
          <Scene1 frame={frame} />
        </div>
      )}
      {frame >= S2S && frame <= S2E && (
        <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, S2S, 22) * fo(frame, S2E, 22) }}>
          <Scene2 frame={frame - S2S} />
        </div>
      )}
      {frame >= S3S && frame <= S3E && (
        <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, S3S, 28) * fo(frame, S3E, 22) }}>
          <Scene3 frame={frame - S3S} />
        </div>
      )}
      {frame >= S4S && frame <= S4E && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Scene3 frame={Math.min(frame - S3S, S3E - S3S - 20)} />
          <Scene4 frame={frame - S4S} />
        </div>
      )}
      {frame >= S5S && frame <= S5E && (
        <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, S5S, 32) * fo(frame, S5E, 28) }}>
          <Scene5 frame={frame - S5S} />
        </div>
      )}
      {frame >= S6S && frame <= S6E && (
        <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, S6S, 18) * fo(frame, S6E, 28) }}>
          <Scene6 frame={frame - S6S} />
        </div>
      )}
      {frame >= S7S && (
        <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, S7S, 28) }}>
          <Scene7 frame={frame - S7S} />
        </div>
      )}
    </div>
  )
}
