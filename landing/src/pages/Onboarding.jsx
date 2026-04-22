/* ════════════════════════════════════════════════════════════════
   Page /demarrer — Onboarding ImmoMatch
   Étape 1 : Votre agence
   Étape 2 : Méthode d'import  (Hektor FTP · CSV/Excel · Démo)
   Étape 3 : Config FTP  OU  Upload fichier  (selon choix étape 2)
   → POST /api/onboard → JWT → redirect dashboard connecté
   ════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const API_URL       = import.meta.env.VITE_API_URL       ?? ''
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ||
  (typeof window !== 'undefined' ? window.location.origin + '/' : '/')

/* ════ Styles partagés ═══════════════════════════════════════════ */

const S = {
  input: (err) => ({
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${err ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, padding: '13px 16px',
    color: '#f1f5f9', fontSize: 15, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms',
  }),
  label: {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7,
  },
  btnPrimary: (disabled) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px 28px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
    fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled
      ? 'rgba(56,189,248,0.25)'
      : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    color: disabled ? 'rgba(15,23,42,0.5)' : '#0f172a',
    boxShadow: disabled ? 'none' : '0 4px 24px rgba(56,189,248,0.3)',
    transition: 'all 150ms',
  }),
  btnBack: {
    padding: '14px 20px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
  },
}

/* ════ Composants ════════════════════════════════════════════════ */

function Field({ label, type = 'text', value, onChange, placeholder, required, error, autoFocus, hint }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={S.label}>{label}{required && <span style={{ color: '#38bdf8' }}> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={S.input(error)}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = 'rgba(56,189,248,0.06)' }}
        onBlur={e => { e.target.style.borderColor = error ? '#f87171' : 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
      />
      {hint && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#334155' }}>{hint}</p>}
      {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>}
    </div>
  )
}

function Spinner({ size = 18, color = '#0f172a' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, flexShrink: 0,
      border: `2.5px solid ${color}44`, borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

/* ════ Stepper ═══════════════════════════════════════════════════ */

function Stepper({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: done ? '#38bdf8' : active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${done || active ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, transition: 'all 300ms',
              color: done ? '#0f172a' : active ? '#38bdf8' : '#334155',
            }}>
              {done
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : n}
            </div>
            {n < total && (
              <div style={{
                width: 48, height: 2, margin: '0 4px',
                background: done ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                transition: 'background 300ms',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ════ Page principale ═══════════════════════════════════════════ */

export default function Onboarding() {
  /* ── State compte ── */
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [agence, setAgence] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  /* ── State wizard ── */
  const [step, setStep] = useState(1)
  const [importMode, setImportMode] = useState(null)   // 'demo' | 'csv' | 'hektor_ftp'

  /* ── State FTP ── */
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPass, setFtpPass] = useState('')
  const [ftpPath, setFtpPath] = useState('/Annonces.csv')

  /* ── State upload ── */
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  /* ── State scrape ── */
  const [siteUrl, setSiteUrl] = useState('')
  const [scrapePreview, setScrapePreview] = useState(null)
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeError, setScrapeError] = useState(null)
  const [scrapeStepIdx, setScrapeStepIdx] = useState(0)
  const scrapeTimers = useRef([])

  /* ── Séquence de messages pendant le scraping ── */
  const SCRAPE_STEPS = [
    { text: 'Connexion au site…',                    sub: 'Récupération du contenu de la page' },
    { text: 'Lecture des annonces…',                 sub: 'Parcours de la structure HTML' },
    { text: 'Extraction par intelligence artificielle…', sub: 'Claude analyse chaque annonce' },
    { text: 'Structuration des données…',            sub: 'Prix, surfaces, types, localisations' },
    { text: 'Finalisation…',                         sub: 'Presque prêt !' },
  ]
  const SCRAPE_DELAYS = [0, 3500, 8000, 15000, 22000]

  useEffect(() => {
    // Nettoyer les timers précédents
    scrapeTimers.current.forEach(clearTimeout)
    scrapeTimers.current = []
    if (!scrapeLoading) { setScrapeStepIdx(0); return }
    SCRAPE_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => setScrapeStepIdx(i), delay)
      scrapeTimers.current.push(t)
    })
    return () => scrapeTimers.current.forEach(clearTimeout)
  }, [scrapeLoading])

  /* ── State async ── */
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(null)

  /* ── Titre de la page ── */
  useEffect(() => { document.title = 'Démarrer — ImmoMatch' }, [])

  /* ── Drag & drop (avant tout return conditionnel) ── */
  const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB

  const setFileChecked = useCallback((f) => {
    if (!f) return
    if (f.size > MAX_FILE_SIZE) {
      setApiError('Fichier trop volumineux (max 10 Mo). Divisez votre fichier si nécessaire.')
      return
    }
    setFile(f)
    setApiError(null)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFileChecked(f)
  }, [setFileChecked])
  const onDragOver  = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  /* ── Validation ── */
  function validateStep1() {
    const e = {}
    if (!nom.trim()) e.nom = 'Obligatoire'
    if (!email.trim() || !email.includes('@') || !email.split('@')[1]?.includes('.')) e.email = 'Email invalide'
    if (!agence.trim()) e.agence = 'Obligatoire'
    setFieldErrors(e)
    return !Object.keys(e).length
  }

  function validateFtp() {
    const e = {}
    if (!ftpHost.trim()) e.ftpHost = 'Obligatoire'
    if (!ftpUser.trim()) e.ftpUser = 'Obligatoire'
    if (!ftpPass.trim()) e.ftpPass = 'Obligatoire'
    if (!ftpPath.trim()) e.ftpPath = 'Obligatoire'
    setFieldErrors(e)
    return !Object.keys(e).length
  }

  /* ── Navigation ── */
  function next() {
    setApiError(null)
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      if (!importMode) return
      if (importMode === 'demo') submit()
      else setStep(3)
    } else if (step === 3) {
      if (importMode === 'hektor_ftp') {
        if (!validateFtp()) return
        submit()
      } else if (importMode === 'csv') {
        if (!file) { setApiError('Veuillez sélectionner un fichier.'); return }
        submit()
      } else if (importMode === 'scrape') {
        if (!scrapePreview) return
        submit()
      }
    }
  }

  async function analyserSite() {
    if (!siteUrl.trim()) return
    setScrapeLoading(true)
    setScrapeError(null)
    setScrapePreview(null)
    try {
      const res = await fetch(`${API_URL}/api/scrape-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setScrapeError(data.detail || "Erreur d'analyse."); return }
      if (!data.nb_biens) {
        setScrapeError('Aucun bien trouvé. Essayez une URL de page listing plus spécifique (ex: /vente ou /annonces).')
        return
      }
      setScrapePreview(data)
    } catch {
      setScrapeError('Impossible de contacter le serveur.')
    } finally {
      setScrapeLoading(false)
    }
  }

  function back() {
    setApiError(null)
    if (step === 2) setStep(1)
    if (step === 3) { setStep(2); setFile(null); setScrapePreview(null); setScrapeError(null) }
  }

  /* ── Soumission ── */
  async function submit() {
    setLoading(true)
    setApiError(null)

    const fd = new FormData()
    fd.append('nom', nom.trim())
    fd.append('email', email.trim().toLowerCase())
    fd.append('agence_nom', agence.trim())
    fd.append('mode', importMode)
    if (importMode === 'hektor_ftp') {
      fd.append('ftp_host', ftpHost.trim())
      fd.append('ftp_user', ftpUser.trim())
      fd.append('ftp_pass', ftpPass.trim())
      fd.append('ftp_path', ftpPath.trim())
    }
    if (importMode === 'csv' && file) fd.append('file', file)
    // Scrape : on envoie les biens déjà récupérés — pas de re-scraping côté serveur
    if (importMode === 'scrape' && scrapePreview) {
      fd.append('biens_json', JSON.stringify(scrapePreview.biens))
    }

    try {
      const res = await fetch(`${API_URL}/api/onboard`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail || 'Erreur serveur.'); setLoading(false); return }
      setResult(data)
      setTimeout(() => {
        window.location.href = `${DASHBOARD_URL.replace(/\/$/, '')}/?token=${data.access_token}`
      }, 2800)
    } catch {
      setApiError('Impossible de contacter le serveur.')
      setLoading(false)
    }
  }

  /* ── Nombre d'étapes ── */
  const totalSteps = importMode === 'demo' ? 2 : 3

  /* ══════════════════════════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#020b14',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#f1f5f9',
    }}>
      {/* ── Halos condensés ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {/* Halo principal — spotlight centré derrière le formulaire */}
        <div style={{ position: 'absolute', width: 700, height: 700, top: '50%', left: '50%', transform: 'translate(-50%, -58%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.28) 0%, rgba(56,189,248,0.10) 35%, transparent 65%)', filter: 'blur(35px)' }} />
        {/* Halo secondaire bleu froid — coin haut gauche */}
        <div style={{ position: 'absolute', width: 340, height: 340, top: -80, left: -60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 70%)', filter: 'blur(28px)' }} />
        {/* Halo violet — coin bas droit */}
        <div style={{ position: 'absolute', width: 360, height: 360, bottom: -80, right: -60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        {/* Grain subtil */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.6 }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: 18, color: '#f1f5f9' }}>
          Immo<span style={{ color: '#38bdf8' }}>Match</span>
        </Link>
        <a href={`${DASHBOARD_URL}login`} style={{ fontSize: 13, color: '#475569', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={e => e.target.style.color = '#94a3b8'}
          onMouseLeave={e => e.target.style.color = '#475569'}>
          Déjà un compte ? <span style={{ color: '#38bdf8', fontWeight: 600 }}>Se connecter</span>
        </a>
      </header>

      {/* ── Contenu centré ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* ════ SUCCÈS ════ */}
          {result ? (
            <div key="success" style={{ textAlign: 'center', animation: 'stepIn 320ms ease' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.75rem',
                background: 'rgba(56,189,248,0.1)', border: '2px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 1rem', color: '#f1f5f9' }}>
                Votre espace est prêt !
              </h1>

              {result.syncing ? (
                <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                  La synchronisation Hektor est en cours en arrière-plan.<br/>
                  Vos biens apparaîtront dans votre dashboard dans quelques instants.
                </p>
              ) : (
                <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                  {result.nb_biens > 0
                    ? <><strong style={{ color: '#38bdf8' }}>{result.nb_biens} biens</strong> importés avec succès. </>
                    : ''}
                  Vous allez être redirigé automatiquement.
                </p>
              )}

              {/* Lien de reconnexion */}
              <div style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ⚠ Notez votre email de connexion
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  Aucun mot de passe n'a été créé. Pour revenir à votre espace, rendez-vous sur la page de connexion et entrez votre email :
                </p>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontFamily: 'monospace', fontSize: 14, color: '#38bdf8', wordBreak: 'break-all' }}>
                  {email}
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '10px 22px' }}>
                <Spinner size={15} color="#38bdf8" />
                <span style={{ fontSize: 14, color: '#38bdf8', fontWeight: 600 }}>Chargement de votre dashboard…</span>
              </div>
            </div>
          ) : (
            <>
              {/* ── Stepper ── */}
              <Stepper step={step} total={totalSteps} />

              {/* ════ ÉTAPE 1 — Votre agence ════ */}
              {step === 1 && (
                <div key="step1" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 600, color: '#7dd3fc', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                      Gratuit · 6 jours · Sans carte bancaire
                    </div>
                    <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
                      Créons votre espace
                    </h1>
                    <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
                      30 secondes et vous êtes opérationnel.
                    </p>
                  </div>

                  <Field label="Nom complet" value={nom} onChange={setNom} placeholder="Sophie Martin" required error={fieldErrors.nom} autoFocus />
                  <Field label="Email professionnel" type="email" value={email} onChange={setEmail} placeholder="sophie@agence.fr" required error={fieldErrors.email} />
                  <Field label="Nom de votre agence" value={agence} onChange={setAgence} placeholder="Martin Immobilier" required error={fieldErrors.agence} />

                  <div style={{ marginTop: '1.75rem' }}>
                    <button onClick={next} className="ob-primary" style={S.btnPrimary(false)}>
                      Continuer <span style={{ fontSize: 17 }}>→</span>
                    </button>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: 12, color: '#1e3a5f', marginTop: '1rem' }}>
                    En continuant, vous acceptez les <Link to="/cgu" style={{ color: '#334155' }}>CGU</Link> et la <Link to="/confidentialite" style={{ color: '#334155' }}>Politique de confidentialité</Link>
                  </p>
                </div>
              )}

              {/* ════ ÉTAPE 2 — Méthode d'import ════ */}
              {step === 2 && (
                <div key="step2" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
                      Comment sont gérés<br />vos biens ?
                    </h1>
                    <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
                      Choisissez votre source, on s'occupe du reste.
                    </p>
                  </div>

                  {[
                    {
                      id: 'hektor_ftp',
                      badge: 'Recommandé',
                      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18 4l2 4h-4M6 20l-2-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                      title: 'Logiciel Hektor',
                      desc: 'Connexion directe via FTP — vos biens se synchronisent automatiquement',
                    },
                    {
                      id: 'csv',
                      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M3 15h18M9 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
                      title: 'Fichier Excel / CSV',
                      desc: 'Importez un export depuis votre logiciel ou un fichier structuré',
                    },
                    {
                      id: 'scrape',
                      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M2 12h20M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
                      title: 'Mon site web',
                      desc: 'On extrait vos biens directement depuis votre site agence — aucun export requis',
                    },
                    {
                      id: 'demo',
                      badge: '0 effort',
                      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                      title: 'Données de démo',
                      desc: '20 vrais biens anonymisés du Var · matchings et prospects pré-calculés',
                    },
                  ].map(m => {
                    const sel = importMode === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setImportMode(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                          background: sel ? 'rgba(56,189,248,0.09)' : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${sel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 14, padding: '17px 18px', marginBottom: '0.75rem',
                          transition: 'all 170ms',
                          transform: sel ? 'translateX(4px)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                          background: sel ? 'rgba(56,189,248,0.13)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${sel ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: sel ? '#38bdf8' : '#475569', transition: 'all 170ms',
                        }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: sel ? '#f1f5f9' : '#94a3b8' }}>{m.title}</span>
                            {m.badge && <span style={{ fontSize: 10, fontWeight: 700, background: '#38bdf8', color: '#0f172a', borderRadius: 999, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.badge}</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{m.desc}</p>
                        </div>
                        {/* Radio */}
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${sel ? '#38bdf8' : '#334155'}`,
                          background: sel ? '#38bdf8' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 170ms',
                        }}>
                          {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0f172a' }} />}
                        </div>
                      </button>
                    )
                  })}

                  {apiError && (
                    <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: '1rem' }}>
                      {apiError}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
                    <button onClick={back} className="ob-back" style={S.btnBack}>← Retour</button>
                    <button
                      onClick={next}
                      disabled={!importMode || loading}
                      className="ob-primary" style={S.btnPrimary(!importMode || loading)}
                    >
                      {loading ? <><Spinner /> En cours…</> : importMode === 'demo' ? <>Accéder à ma démo →</> : <>Continuer <span style={{ fontSize: 17 }}>→</span></>}
                    </button>
                  </div>
                </div>
              )}

              {/* ════ ÉTAPE 3a — Hektor FTP ════ */}
              {step === 3 && importMode === 'hektor_ftp' && (
                <div key="step3-ftp" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
                      Vos accès FTP Hektor
                    </h1>
                    <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                      Ces informations vous sont fournies par le support Hektor.
                    </p>
                  </div>

                  {/* Info box */}
                  <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1, color: '#38bdf8' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                      <strong style={{ color: '#94a3b8' }}>Vous n'avez pas vos accès FTP ?</strong><br/>
                      Contactez le support Hektor et demandez vos "identifiants d'export FTP". Ils vous fourniront le serveur, l'identifiant, le mot de passe et le chemin du fichier CSV.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                    <Field label="Serveur FTP" value={ftpHost} onChange={setFtpHost} placeholder="ftp.hektor.fr" required error={fieldErrors.ftpHost} autoFocus />
                    <Field label="Port" value="21" onChange={() => {}} placeholder="21" hint="Généralement 21" />
                  </div>
                  <Field label="Identifiant" value={ftpUser} onChange={setFtpUser} placeholder="mon_agence_ftp" required error={fieldErrors.ftpUser} />
                  <Field label="Mot de passe FTP" type="password" value={ftpPass} onChange={setFtpPass} placeholder="••••••••••" required error={fieldErrors.ftpPass} />
                  <Field label="Chemin du fichier" value={ftpPath} onChange={setFtpPath} placeholder="/Annonces.csv" required error={fieldErrors.ftpPath} hint='Généralement "/Annonces.csv" ou "/export/Annonces.csv"' />

                  {apiError && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: '0.75rem' }}>{apiError}</p>}

                  <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
                    <button onClick={back} className="ob-back" style={S.btnBack}>← Retour</button>
                    <button onClick={next} disabled={loading} className="ob-primary" style={S.btnPrimary(loading)}>
                      {loading ? <><Spinner />Connexion en cours…</> : <>Connecter Hektor →</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ════ ÉTAPE 3c — Site web (scraping) ════ */}
              {step === 3 && importMode === 'scrape' && (
                <div key="step3-scrape" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 0.4rem', color: '#f1f5f9' }}>
                      Votre site immobilier
                    </h1>
                    <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                      On extrait jusqu'à <strong style={{ color: '#94a3b8' }}>15 biens</strong> automatiquement — sans export, sans fichier.
                    </p>
                  </div>

                  {!scrapePreview ? (
                    <>
                      {/* Encart "quelle URL coller" */}
                      <div style={{
                        background: 'rgba(251,191,36,0.06)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: 12,
                        padding: '13px 16px',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        gap: 11,
                        alignItems: 'flex-start',
                      }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1, color: '#fbbf24' }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
                          <strong style={{ color: '#fbbf24' }}>Collez l'URL de votre page de biens à vendre</strong> — pas la page d'accueil.<br/>
                          <span style={{ color: '#64748b' }}>
                            Exemple : <span style={{ fontFamily: 'monospace', color: '#7dd3fc' }}>mon-agence.fr<strong style={{ color: '#f1f5f9' }}>/vente</strong></span>
                            {' '}ou{' '}
                            <span style={{ fontFamily: 'monospace', color: '#7dd3fc' }}>mon-agence.fr<strong style={{ color: '#f1f5f9' }}>/annonces</strong></span>
                          </span>
                        </div>
                      </div>

                      <Field
                        label="URL de la page listing"
                        value={siteUrl}
                        onChange={v => { setSiteUrl(v); setScrapeError(null) }}
                        placeholder="https://www.mon-agence.fr/vente"
                        error={scrapeError}
                        autoFocus
                      />
                      <p style={{ margin: '-0.6rem 0 1.25rem', fontSize: 12, color: '#334155' }}>
                        Maximum 15 biens extraits · Vous pourrez en ajouter d'autres ensuite.
                      </p>

                      {/* ── Live status pendant l'analyse ── */}
                      {scrapeLoading && (
                        <div style={{
                          background: 'rgba(56,189,248,0.05)',
                          border: '1px solid rgba(56,189,248,0.18)',
                          borderRadius: 14,
                          padding: '18px 20px',
                          marginBottom: '1.25rem',
                          animation: 'stepIn 280ms ease',
                        }}>
                          {/* Étapes avec état */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {SCRAPE_STEPS.map((s, i) => {
                              const done    = i < scrapeStepIdx
                              const active  = i === scrapeStepIdx
                              const pending = i > scrapeStepIdx
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: pending ? 0.3 : 1, transition: 'opacity 400ms' }}>
                                  {/* Icône état */}
                                  <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    background: done
                                      ? 'rgba(56,189,248,0.2)'
                                      : active
                                        ? 'rgba(56,189,248,0.1)'
                                        : 'rgba(255,255,255,0.04)',
                                    border: `1.5px solid ${done || active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 400ms',
                                  }}>
                                    {done ? (
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 13l4 4L19 7" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    ) : active ? (
                                      <Spinner size={13} color="#38bdf8" />
                                    ) : (
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155' }} />
                                    )}
                                  </div>
                                  {/* Texte */}
                                  <div>
                                    <p style={{
                                      margin: 0, fontSize: 13, fontWeight: active ? 700 : 500,
                                      color: done ? '#38bdf8' : active ? '#f1f5f9' : '#334155',
                                      transition: 'color 400ms',
                                    }}>{s.text}</p>
                                    {active && (
                                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569', animation: 'stepIn 300ms ease' }}>
                                        {s.sub}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={back} disabled={scrapeLoading} style={{ ...S.btnBack, opacity: scrapeLoading ? 0.4 : 1, cursor: scrapeLoading ? 'not-allowed' : 'pointer' }}>← Retour</button>
                        <button
                          onClick={analyserSite}
                          disabled={!siteUrl.trim() || scrapeLoading}
                          className="ob-primary" style={S.btnPrimary(!siteUrl.trim() || scrapeLoading)}
                        >
                          {scrapeLoading
                            ? <><Spinner />Analyse en cours…</>
                            : <>Analyser mon site →</>}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Aperçu des biens trouvés */}
                      <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
                              {scrapePreview.nb_biens} bien{scrapePreview.nb_biens > 1 ? 's' : ''} trouvé{scrapePreview.nb_biens > 1 ? 's' : ''}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#475569', wordBreak: 'break-all' }}>{scrapePreview.url}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {scrapePreview.biens.slice(0, 4).map((b, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {[b.type, b.ville, b.surface ? `${b.surface}m²` : null, b.pieces ? `${b.pieces}p` : null].filter(Boolean).join(' · ')}
                              </span>
                              {b.prix && <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>{Number(b.prix).toLocaleString('fr-FR')} €</span>}
                            </div>
                          ))}
                          {scrapePreview.nb_biens > 4 && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
                              + {scrapePreview.nb_biens - 4} autres biens
                            </p>
                          )}
                        </div>
                      </div>

                      {apiError && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem' }}>{apiError}</p>}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setScrapePreview(null); setScrapeError(null) }} className="ob-back" style={S.btnBack}>← Changer l'URL</button>
                        <button onClick={next} disabled={loading} className="ob-primary" style={S.btnPrimary(loading)}>
                          {loading ? <><Spinner />Création en cours…</> : <>Créer mon compte →</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ════ ÉTAPE 3b — Upload CSV/Excel ════ */}
              {step === 3 && importMode === 'csv' && (
                <div key="step3-csv" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
                      Importez votre fichier
                    </h1>
                    <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                      Fichier Excel (.xlsx) ou CSV standard.
                    </p>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDrop={handleDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                    onClick={() => document.getElementById('file-input').click()}
                    style={{
                      border: `2px dashed ${dragging ? '#38bdf8' : file ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 16, padding: '2.75rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                      background: dragging ? 'rgba(56,189,248,0.07)' : file ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 200ms', marginBottom: '1.25rem',
                    }}
                  >
                    <input id="file-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFileChecked(f) }} />
                    {file ? (
                      <>
                        <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M9 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{file.name}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#38bdf8' }}>Fichier prêt · Cliquer pour changer</p>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#64748b' }}>Glissez votre fichier ici</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>ou <span style={{ color: '#38bdf8' }}>parcourir</span> · .xlsx, .xls, .csv</p>
                      </>
                    )}
                  </div>

                  {/* Colonnes attendues */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: '0.25rem' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Colonnes attendues</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Reference', 'Type', 'Ville', 'Quartier', 'Prix', 'Surface', 'Pieces', 'Chambres', 'Description', 'Etat', 'Date'].map(col => (
                        <span key={col} style={{ fontSize: 12, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', color: '#7dd3fc', borderRadius: 6, padding: '3px 9px', fontFamily: 'monospace' }}>{col}</span>
                      ))}
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: '#334155' }}>Seules Reference, Type, Ville et Prix sont obligatoires. Les autres colonnes sont facultatives.</p>
                  </div>

                  {apiError && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: '1rem' }}>{apiError}</p>}

                  <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
                    <button onClick={back} className="ob-back" style={S.btnBack}>← Retour</button>
                    <button onClick={next} disabled={!file || loading} className="ob-primary" style={S.btnPrimary(!file || loading)}>
                      {loading ? <><Spinner />Import en cours…</> : <>Importer mes biens →</>}
                    </button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes stepIn   { from { opacity: 0; transform: translateX(22px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes shimmer  { 0% { background-position: -200% center } 100% { background-position: 200% center } }

        ::placeholder { color: #334155; }

        /* ── Bouton primaire ── */
        .ob-primary {
          position: relative; overflow: hidden;
          transition: transform 180ms cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 180ms ease,
                      filter 180ms ease !important;
        }
        .ob-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 200ms;
        }
        .ob-primary:not(:disabled):hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow: 0 10px 36px rgba(56,189,248,0.55), 0 0 0 1px rgba(56,189,248,0.25) !important;
          filter: brightness(1.07);
        }
        .ob-primary:not(:disabled):hover::after {
          opacity: 1;
          animation: shimmer 600ms ease forwards;
        }
        .ob-primary:not(:disabled):active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 4px 16px rgba(56,189,248,0.3) !important;
        }

        /* ── Bouton retour ── */
        .ob-back {
          transition: border-color 160ms, color 160ms, background 160ms, transform 160ms !important;
        }
        .ob-back:hover {
          border-color: rgba(56,189,248,0.35) !important;
          color: #cbd5e1 !important;
          background: rgba(56,189,248,0.06) !important;
        }
        .ob-back:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  )
}
