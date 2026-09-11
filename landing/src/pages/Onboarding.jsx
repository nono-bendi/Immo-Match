/* ════════════════════════════════════════════════════════════════
   Page /demarrer — Onboarding ImmoFlash
   Étape 1 : Votre agence
   Étape 2 : Méthode d'import  (Assisté · CSV/Excel · Site web · Démo)
   Étape 3 : Infos pour l'assistance  OU  Upload fichier  OU  URL du site
             (selon choix étape 2 — la démo saute directement l'étape 3)
   → Assisté : POST /api/contact (mail à Noa, pas de compte créé tout de suite)
   → Les autres modes : POST /api/onboard → JWT → redirect dashboard connecté
   ════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react'

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
      ? 'rgba(0,193,255,0.25)'
      : 'linear-gradient(135deg, #0099cc 0%, #00c1ff 100%)',
    color: disabled ? 'rgba(15,23,42,0.5)' : '#0f172a',
    boxShadow: disabled ? 'none' : '0 4px 24px rgba(0,193,255,0.3)',
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
      <label style={S.label}>{label}{required && <span style={{ color: '#00c1ff' }}> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={S.input(error)}
        onFocus={e => { e.target.style.borderColor = '#00c1ff'; e.target.style.background = 'rgba(0,193,255,0.06)' }}
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

/* Wordmark vectoriel de l'accueil (export Webflow, landing/landing v2/index.html) —
   repris tel quel pour que le logo soit identique sur les deux pages. */
function Logo({ height = 20 }) {
  return (
    <svg height={height} viewBox="0 0 511 71" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path d="M16.875 0V69.8182H0V0H16.875Z" fill="currentColor" />
      <path d="M27.4688 69.8182V17.4545H43.321V27.0682H43.9006C44.9915 23.8864 46.8324 21.375 49.4233 19.5341C52.0142 17.6932 55.1051 16.7727 58.696 16.7727C62.3324 16.7727 65.446 17.7045 68.0369 19.5682C70.6278 21.4318 72.2756 23.9318 72.9801 27.0682H73.5256C74.5028 23.9545 76.4119 21.4659 79.2528 19.6023C82.0938 17.7159 85.446 16.7727 89.3097 16.7727C94.2642 16.7727 98.2869 18.3636 101.378 21.5455C104.469 24.7045 106.014 29.0455 106.014 34.5682V69.8182H89.3438V38.3864C89.3438 35.7727 88.6733 33.7841 87.3324 32.4205C85.9915 31.0341 84.2528 30.3409 82.1165 30.3409C79.821 30.3409 78.0142 31.0909 76.696 32.5909C75.4006 34.0682 74.7528 36.0568 74.7528 38.5568V69.8182H58.7301V38.2159C58.7301 35.7841 58.071 33.8636 56.7528 32.4545C55.4347 31.0455 53.696 30.3409 51.5369 30.3409C50.0824 30.3409 48.7983 30.6932 47.6847 31.3977C46.571 32.0795 45.696 33.0568 45.0597 34.3295C44.446 35.6023 44.1392 37.1023 44.1392 38.8295V69.8182H27.4688Z" fill="currentColor" />
      <path d="M116.344 69.8182V17.4545H132.196V27.0682H132.776C133.866 23.8864 135.707 21.375 138.298 19.5341C140.889 17.6932 143.98 16.7727 147.571 16.7727C151.207 16.7727 154.321 17.7045 156.912 19.5682C159.503 21.4318 161.151 23.9318 161.855 27.0682H162.401C163.378 23.9545 165.287 21.4659 168.128 19.6023C170.969 17.7159 174.321 16.7727 178.185 16.7727C183.139 16.7727 187.162 18.3636 190.253 21.5455C193.344 24.7045 194.889 29.0455 194.889 34.5682V69.8182H178.219V38.3864C178.219 35.7727 177.548 33.7841 176.207 32.4205C174.866 31.0341 173.128 30.3409 170.991 30.3409C168.696 30.3409 166.889 31.0909 165.571 32.5909C164.276 34.0682 163.628 36.0568 163.628 38.5568V69.8182H147.605V38.2159C147.605 35.7841 146.946 33.8636 145.628 32.4545C144.31 31.0455 142.571 30.3409 140.412 30.3409C138.957 30.3409 137.673 30.6932 136.56 31.3977C135.446 32.0795 134.571 33.0568 133.935 34.3295C133.321 35.6023 133.014 37.1023 133.014 38.8295V69.8182H116.344Z" fill="currentColor" />
      <path d="M229.662 70.8068C224.162 70.8068 219.435 69.6818 215.48 67.4318C211.548 65.1591 208.514 62 206.378 57.9545C204.264 53.8864 203.207 49.1705 203.207 43.8068C203.207 38.4205 204.264 33.7045 206.378 29.6591C208.514 25.5909 211.548 22.4318 215.48 20.1818C219.435 17.9091 224.162 16.7727 229.662 16.7727C235.162 16.7727 239.878 17.9091 243.81 20.1818C247.764 22.4318 250.798 25.5909 252.912 29.6591C255.048 33.7045 256.116 38.4205 256.116 43.8068C256.116 49.1705 255.048 53.8864 252.912 57.9545C250.798 62 247.764 65.1591 243.81 67.4318C239.878 69.6818 235.162 70.8068 229.662 70.8068ZM229.764 58.2273C231.764 58.2273 233.457 57.6136 234.844 56.3864C236.23 55.1591 237.287 53.4545 238.014 51.2727C238.764 49.0909 239.139 46.5682 239.139 43.7045C239.139 40.7955 238.764 38.25 238.014 36.0682C237.287 33.8864 236.23 32.1818 234.844 30.9545C233.457 29.7273 231.764 29.1136 229.764 29.1136C227.696 29.1136 225.946 29.7273 224.514 30.9545C223.105 32.1818 222.026 33.8864 221.276 36.0682C220.548 38.25 220.185 40.7955 220.185 43.7045C220.185 46.5682 220.548 49.0909 221.276 51.2727C222.026 53.4545 223.105 55.1591 224.514 56.3864C225.946 57.6136 227.696 58.2273 229.764 58.2273Z" fill="currentColor" />
      <path d="M264.656 69.8182V0H312.315V13.7045H281.531V28.0227H309.281V41.7614H281.531V69.8182H264.656Z" fill="#00c1ff" />
      <path d="M337.483 0V69.8182H320.812V0H337.483Z" fill="#00c1ff" />
      <path d="M362.855 70.7045C359.514 70.7045 356.548 70.1477 353.957 69.0341C351.389 67.8977 349.355 66.1932 347.855 63.9205C346.378 61.625 345.639 58.75 345.639 55.2955C345.639 52.3864 346.151 49.9318 347.173 47.9318C348.196 45.9318 349.605 44.3068 351.401 43.0568C353.196 41.8068 355.264 40.8636 357.605 40.2273C359.946 39.5682 362.446 39.125 365.105 38.8977C368.082 38.625 370.48 38.3409 372.298 38.0455C374.116 37.7273 375.435 37.2841 376.253 36.7159C377.094 36.125 377.514 35.2955 377.514 34.2273V34.0568C377.514 32.3068 376.912 30.9545 375.707 30C374.503 29.0455 372.878 28.5682 370.832 28.5682C368.628 28.5682 366.855 29.0455 365.514 30C364.173 30.9545 363.321 32.2727 362.957 33.9545L347.582 33.4091C348.037 30.2273 349.207 27.3864 351.094 24.8864C353.003 22.3636 355.616 20.3864 358.935 18.9545C362.276 17.5 366.287 16.7727 370.969 16.7727C374.31 16.7727 377.389 17.1705 380.207 17.9659C383.026 18.7386 385.48 19.875 387.571 21.375C389.662 22.8523 391.276 24.6705 392.412 26.8295C393.571 28.9886 394.151 31.4545 394.151 34.2273V69.8182H378.469V62.5227H378.06C377.128 64.2955 375.935 65.7955 374.48 67.0227C373.048 68.25 371.355 69.1705 369.401 69.7841C367.469 70.3977 365.287 70.7045 362.855 70.7045ZM368.003 59.7955C369.798 59.7955 371.412 59.4318 372.844 58.7045C374.298 57.9773 375.457 56.9773 376.321 55.7045C377.185 54.4091 377.616 52.9091 377.616 51.2045V46.2273C377.139 46.4773 376.56 46.7045 375.878 46.9091C375.219 47.1136 374.491 47.3068 373.696 47.4886C372.901 47.6705 372.082 47.8295 371.241 47.9659C370.401 48.1023 369.594 48.2273 368.821 48.3409C367.253 48.5909 365.912 48.9773 364.798 49.5C363.707 50.0227 362.866 50.7045 362.276 51.5455C361.707 52.3636 361.423 53.3409 361.423 54.4773C361.423 56.2045 362.037 57.5227 363.264 58.4318C364.514 59.3409 366.094 59.7955 368.003 59.7955Z" fill="#00c1ff" />
      <path d="M450.06 33.4432L434.753 33.8523C434.594 32.7614 434.162 31.7955 433.457 30.9545C432.753 30.0909 431.832 29.4205 430.696 28.9432C429.582 28.4432 428.287 28.1932 426.81 28.1932C424.878 28.1932 423.23 28.5795 421.866 29.3523C420.526 30.125 419.866 31.1705 419.889 32.4886C419.866 33.5114 420.276 34.3977 421.116 35.1477C421.98 35.8977 423.514 36.5 425.719 36.9545L435.81 38.8636C441.037 39.8636 444.923 41.5227 447.469 43.8409C450.037 46.1591 451.332 49.2273 451.355 53.0455C451.332 56.6364 450.264 59.7614 448.151 62.4205C446.06 65.0795 443.196 67.1477 439.56 68.625C435.923 70.0795 431.764 70.8068 427.082 70.8068C419.605 70.8068 413.707 69.2727 409.389 66.2045C405.094 63.1136 402.639 58.9773 402.026 53.7955L418.491 53.3864C418.855 55.2955 419.798 56.75 421.321 57.75C422.844 58.75 424.787 59.25 427.151 59.25C429.287 59.25 431.026 58.8523 432.366 58.0568C433.707 57.2614 434.389 56.2045 434.412 54.8864C434.389 53.7045 433.866 52.7614 432.844 52.0568C431.821 51.3295 430.219 50.7614 428.037 50.3523L418.901 48.6136C413.651 47.6591 409.741 45.8977 407.173 43.3295C404.605 40.7386 403.332 37.4432 403.355 33.4432C403.332 29.9432 404.264 26.9545 406.151 24.4773C408.037 21.9773 410.719 20.0682 414.196 18.75C417.673 17.4318 421.776 16.7727 426.503 16.7727C433.594 16.7727 439.185 18.2614 443.276 21.2386C447.366 24.1932 449.628 28.2614 450.06 33.4432Z" fill="#00c1ff" />
      <path d="M476.233 39.9545V69.8182H459.562V0H475.688V27.0682H476.267C477.449 23.8409 479.381 21.3182 482.062 19.5C484.767 17.6818 488.074 16.7727 491.983 16.7727C495.665 16.7727 498.869 17.5909 501.597 19.2273C504.324 20.8409 506.438 23.125 507.938 26.0795C509.46 29.0341 510.21 32.4886 510.188 36.4432V69.8182H493.517V39.7159C493.54 36.8068 492.813 34.5341 491.335 32.8977C489.858 31.2614 487.778 30.4432 485.097 30.4432C483.347 30.4432 481.801 30.8295 480.46 31.6023C479.142 32.3523 478.108 33.4318 477.358 34.8409C476.631 36.25 476.256 37.9545 476.233 39.9545Z" fill="#00c1ff" />
    </svg>
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
              background: done ? '#00c1ff' : active ? 'rgba(0,193,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${done || active ? '#00c1ff' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, transition: 'all 300ms',
              color: done ? '#0f172a' : active ? '#00c1ff' : '#334155',
            }}>
              {done
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : n}
            </div>
            {n < total && (
              <div style={{
                width: 48, height: 2, margin: '0 4px',
                background: done ? '#00c1ff' : 'rgba(255,255,255,0.08)',
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
  const [importMode, setImportMode] = useState(null)   // 'assisted' | 'demo' | 'csv' | 'scrape'

  /* ── State assisté (pas de compte créé, on envoie une demande) ── */
  const [assistedSent, setAssistedSent] = useState(false)

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
  useEffect(() => { document.title = 'Démarrer — ImmoFlash' }, [])

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
      if (importMode === 'assisted') {
        if (!siteUrl.trim()) { setFieldErrors({ siteUrl: 'Obligatoire' }); return }
        submitAssisted()
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
      const res = await fetch(`${API_URL}/scrape-preview`, {
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
    if (importMode === 'csv' && file) fd.append('file', file)
    // Scrape : on envoie les biens déjà récupérés — pas de re-scraping côté serveur
    if (importMode === 'scrape' && scrapePreview) {
      fd.append('biens_json', JSON.stringify(scrapePreview.biens))
    }

    try {
      const res = await fetch(`${API_URL}/onboard`, { method: 'POST', body: fd })
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

  /* ── Soumission — mode assisté : pas de compte créé, juste un mail à l'équipe ── */
  async function submitAssisted() {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nom.trim(),
          email: email.trim().toLowerCase(),
          sujet: 'Nouvelle demande de démo assistée',
          message: `Agence : ${agence.trim()}\nSite à scraper : ${siteUrl.trim()}`,
        }),
      })
      const data = await res.json()
      if (!data.ok) { setApiError("Erreur lors de l'envoi. Réessayez ou écrivez-nous directement à contact@immoflash.app."); setLoading(false); return }
      setAssistedSent(true)
      setLoading(false)
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
      background: '#050c15',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      color: '#f1f5f9',
    }}>
      {/* ── Scène lumineuse ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>

        {/* Grille de points */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Halo cyan — coin haut gauche, intense */}
        <div style={{ position: 'absolute', width: 1000, height: 800, top: -300, left: -250, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(6,182,212,0.26) 0%, rgba(14,165,233,0.10) 40%, transparent 68%)', filter: 'blur(50px)' }} />

        {/* Halo indigo — coin bas droite */}
        <div style={{ position: 'absolute', width: 900, height: 750, bottom: -280, right: -200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,60,220,0.28) 0%, rgba(124,58,237,0.10) 40%, transparent 68%)', filter: 'blur(50px)' }} />

        {/* Halo bleu — coin haut droite, secondaire */}
        <div style={{ position: 'absolute', width: 500, height: 420, top: -100, right: -80, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,193,255,0.12) 0%, transparent 65%)', filter: 'blur(45px)' }} />

        {/* Halo violet — coin bas gauche, secondaire */}
        <div style={{ position: 'absolute', width: 460, height: 380, bottom: -80, left: -60, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.13) 0%, transparent 65%)', filter: 'blur(40px)' }} />

        {/* Lueur centrale douce derrière le formulaire */}
        <div style={{ position: 'absolute', width: 600, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(14,165,233,0.06) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        {/* Ligne lumineuse en haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 5%, rgba(0,193,255,0.2) 30%, rgba(139,92,246,0.18) 70%, transparent 95%)' }} />

      </div>

      {/* ── Header ── */}
      <header style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="/" style={{ display: 'inline-flex', textDecoration: 'none', color: '#f1f5f9' }} aria-label="ImmoFlash">
          <Logo height={20} />
        </a>
        <a href={`${DASHBOARD_URL.replace(/\/$/, '')}/login`} style={{ fontSize: 13, color: '#475569', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={e => e.target.style.color = '#94a3b8'}
          onMouseLeave={e => e.target.style.color = '#475569'}>
          Déjà un compte ? <span style={{ color: '#00c1ff', fontWeight: 600 }}>Se connecter</span>
        </a>
      </header>

      {/* ── Contenu centré ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 560,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 28,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(0,193,255,0.05), 0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          padding: '2.5rem 2.5rem 2rem',
        }}>

          {/* ════ SUCCÈS — mode assisté (pas de compte, on revient vers eux) ════ */}
          {assistedSent ? (
            <div key="assisted-success" style={{ textAlign: 'center', animation: 'stepIn 320ms ease' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.75rem',
                background: 'rgba(0,193,255,0.1)', border: '2px solid rgba(0,193,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#00c1ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 1rem', color: '#f1f5f9' }}>
                Demande envoyée !
              </h1>

              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                On prépare votre démo personnalisée avec vos vrais biens et on revient vers vous sous 24-48h à <strong style={{ color: '#00c1ff' }}>{email}</strong>.
              </p>
            </div>
          ) : result ? (
            <div key="success" style={{ textAlign: 'center', animation: 'stepIn 320ms ease' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.75rem',
                background: 'rgba(0,193,255,0.1)', border: '2px solid rgba(0,193,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#00c1ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 1rem', color: '#f1f5f9' }}>
                Votre espace est prêt !
              </h1>

              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                {result.nb_biens > 0
                  ? <><strong style={{ color: '#00c1ff' }}>{result.nb_biens} biens</strong> importés avec succès. </>
                  : ''}
                Vous allez être redirigé automatiquement.
              </p>

              {/* Lien de reconnexion */}
              <div style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ⚠ Notez votre email de connexion
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  Aucun mot de passe n'a été créé. Pour revenir à votre espace, rendez-vous sur la page de connexion et entrez votre email :
                </p>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontFamily: 'monospace', fontSize: 14, color: '#00c1ff', wordBreak: 'break-all' }}>
                  {email}
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,193,255,0.08)', border: '1px solid rgba(0,193,255,0.2)', borderRadius: 999, padding: '10px 22px' }}>
                <Spinner size={15} color="#00c1ff" />
                <span style={{ fontSize: 14, color: '#00c1ff', fontWeight: 600 }}>Chargement de votre dashboard…</span>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(0,193,255,0.08)', border: '1px solid rgba(0,193,255,0.18)', borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 600, color: '#7ee6ff', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                      Gratuit · 10 jours · Sans carte bancaire
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
                    En continuant, vous acceptez les <a href="/cgu" style={{ color: '#334155' }}>CGU</a> et la <a href="/confidentialite" style={{ color: '#334155' }}>Politique de confidentialité</a>
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

                  {/* Ce à quoi ils ont droit pendant l'essai */}
                  <div style={{ background: 'rgba(0,193,255,0.06)', border: '1px solid rgba(0,193,255,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1, color: '#00c1ff' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                      <strong style={{ color: '#94a3b8' }}>Ce à quoi vous aurez droit</strong><br/>
                      10 jours d'essai gratuit, sans carte bancaire. Vos biens sont importés une seule fois pour tester avec vos vraies données — le catalogue reste figé pendant l'essai (pas de mise à jour automatique, ça c'est en version complète).
                    </div>
                  </div>

                  {[
                    {
                      id: 'assisted',
                      badge: 'Recommandé',
                      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>,
                      title: 'On s’en occupe pour vous',
                      desc: 'Donnez-nous le lien de votre site, on récupère vos biens et prépare votre démo personnalisée — un peu plus long, mais le meilleur résultat',
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
                          background: sel ? 'rgba(0,193,255,0.09)' : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${sel ? '#00c1ff' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 14, padding: '17px 18px', marginBottom: '0.75rem',
                          transition: 'all 170ms',
                          transform: sel ? 'translateX(4px)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                          background: sel ? 'rgba(0,193,255,0.13)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${sel ? 'rgba(0,193,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: sel ? '#00c1ff' : '#475569', transition: 'all 170ms',
                        }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: sel ? '#f1f5f9' : '#94a3b8' }}>{m.title}</span>
                            {m.badge && <span style={{ fontSize: 10, fontWeight: 700, background: '#00c1ff', color: '#0f172a', borderRadius: 999, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.badge}</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{m.desc}</p>
                        </div>
                        {/* Radio */}
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${sel ? '#00c1ff' : '#334155'}`,
                          background: sel ? '#00c1ff' : 'transparent',
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

              {/* ════ ÉTAPE 3a — Assisté (pas d'import auto, on prépare la démo nous-mêmes) ════ */}
              {step === 3 && importMode === 'assisted' && (
                <div key="step3-assisted" style={{ animation: 'stepIn 280ms ease' }}>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
                      Le lien de votre site
                    </h1>
                    <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                      On récupère vos biens directement dessus — aucun fichier à préparer de votre côté.
                    </p>
                  </div>

                  {/* Info box */}
                  <div style={{ background: 'rgba(0,193,255,0.06)', border: '1px solid rgba(0,193,255,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1, color: '#00c1ff' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                      <strong style={{ color: '#94a3b8' }}>Pas d'accès instantané</strong><br/>
                      On prépare votre démo à la main avec vos vrais biens — comptez 24 à 48h, on vous écrit dès que c'est prêt.
                    </div>
                  </div>

                  <Field label="Site de votre agence" value={siteUrl} onChange={setSiteUrl} placeholder="www.mon-agence.fr" required error={fieldErrors.siteUrl} autoFocus hint="Idéalement la page qui liste vos annonces" />

                  {apiError && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: '0.75rem' }}>{apiError}</p>}

                  <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
                    <button onClick={back} className="ob-back" style={S.btnBack}>← Retour</button>
                    <button onClick={next} disabled={loading} className="ob-primary" style={S.btnPrimary(loading)}>
                      {loading ? <><Spinner />Envoi…</> : <>Envoyer ma demande →</>}
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
                            Exemple : <span style={{ fontFamily: 'monospace', color: '#7ee6ff' }}>mon-agence.fr<strong style={{ color: '#f1f5f9' }}>/vente</strong></span>
                            {' '}ou{' '}
                            <span style={{ fontFamily: 'monospace', color: '#7ee6ff' }}>mon-agence.fr<strong style={{ color: '#f1f5f9' }}>/annonces</strong></span>
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
                          background: 'rgba(0,193,255,0.05)',
                          border: '1px solid rgba(0,193,255,0.18)',
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
                                      ? 'rgba(0,193,255,0.2)'
                                      : active
                                        ? 'rgba(0,193,255,0.1)'
                                        : 'rgba(255,255,255,0.04)',
                                    border: `1.5px solid ${done || active ? 'rgba(0,193,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 400ms',
                                  }}>
                                    {done ? (
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 13l4 4L19 7" stroke="#00c1ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    ) : active ? (
                                      <Spinner size={13} color="#00c1ff" />
                                    ) : (
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155' }} />
                                    )}
                                  </div>
                                  {/* Texte */}
                                  <div>
                                    <p style={{
                                      margin: 0, fontSize: 13, fontWeight: active ? 700 : 500,
                                      color: done ? '#00c1ff' : active ? '#f1f5f9' : '#334155',
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
                      <div style={{ background: 'rgba(0,193,255,0.06)', border: '1px solid rgba(0,193,255,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,193,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c1ff', flexShrink: 0 }}>
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
                              {b.prix && <span style={{ fontSize: 13, fontWeight: 700, color: '#00c1ff', flexShrink: 0 }}>{Number(b.prix).toLocaleString('fr-FR')} €</span>}
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
                      border: `2px dashed ${dragging ? '#00c1ff' : file ? 'rgba(0,193,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 16, padding: '2.75rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                      background: dragging ? 'rgba(0,193,255,0.07)' : file ? 'rgba(0,193,255,0.04)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 200ms', marginBottom: '1.25rem',
                    }}
                  >
                    <input id="file-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFileChecked(f) }} />
                    {file ? (
                      <>
                        <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem', background: 'rgba(0,193,255,0.12)', border: '1px solid rgba(0,193,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c1ff' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M9 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{file.name}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#00c1ff' }}>Fichier prêt · Cliquer pour changer</p>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#64748b' }}>Glissez votre fichier ici</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>ou <span style={{ color: '#00c1ff' }}>parcourir</span> · .xlsx, .xls, .csv</p>
                      </>
                    )}
                  </div>

                  {/* Colonnes attendues */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: '0.25rem' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Colonnes attendues</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Reference', 'Type', 'Ville', 'Quartier', 'Prix', 'Surface', 'Pieces', 'Chambres', 'Description', 'Etat', 'Date'].map(col => (
                        <span key={col} style={{ fontSize: 12, background: 'rgba(0,193,255,0.07)', border: '1px solid rgba(0,193,255,0.15)', color: '#7ee6ff', borderRadius: 6, padding: '3px 9px', fontFamily: 'monospace' }}>{col}</span>
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
          box-shadow: 0 10px 36px rgba(0,193,255,0.55), 0 0 0 1px rgba(0,193,255,0.25) !important;
          filter: brightness(1.07);
        }
        .ob-primary:not(:disabled):hover::after {
          opacity: 1;
          animation: shimmer 600ms ease forwards;
        }
        .ob-primary:not(:disabled):active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 4px 16px rgba(0,193,255,0.3) !important;
        }

        /* ── Bouton retour ── */
        .ob-back {
          transition: border-color 160ms, color 160ms, background 160ms, transform 160ms !important;
        }
        .ob-back:hover {
          border-color: rgba(0,193,255,0.35) !important;
          color: #cbd5e1 !important;
          background: rgba(0,193,255,0.06) !important;
        }
        .ob-back:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  )
}
