/* ════════════════════════════════════════════════════════════════
   Page /souscrire?plan=agence|cabinet|reseau
   Étape intermédiaire avant Stripe : récap du plan, formulaire (agence,
   contact, logiciel métier actuel), explication de la suite.
   → POST /api/contact (mail à Noa) → redirect vers le lien Stripe du plan
   ════════════════════════════════════════════════════════════════ */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import HeroBackground from '../components/HeroBackground'

/* ════ Styles partagés (repris de Onboarding.jsx pour la même DA) ══ */

const S = {
  input: (err) => ({
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${err ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, padding: '13px 16px',
    color: '#f1f5f9', fontSize: 15, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms',
  }),
  label: {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#f1f5f9',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7,
  },
  btnPrimary: (disabled) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px 28px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
    fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled
      ? 'rgba(0,193,255,0.25)'
      : 'linear-gradient(135deg, #0099cc 0%, #00c1ff 100%)',
    color: disabled ? 'rgba(15,23,42,0.5)' : '#0f172a',
    boxShadow: disabled ? 'none' : '0 4px 24px rgba(0,193,255,0.3)',
    transition: 'all 150ms',
  }),
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
      {hint && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f1f5f9' }}>{hint}</p>}
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

/* Wordmark vectoriel de l'accueil (export Webflow) — identique sur toutes les pages. */
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

/* ════ Plans (miroir de plans.py + copy de la section tarifs de l'accueil) ══ */

const PLANS = {
  agence: {
    name: 'Essentiel', price: 49, tagline: "L'agence solo qui veut démarrer",
    features: ['1 utilisateur', "Jusqu'à 50 biens actifs", '20 matchings IA / mois', '20 emails personnalisés / mois', '30 questions agent IA / mois', 'Synchronisation avec votre logiciel métier', 'Support email — réponse 48h'],
    stripeUrl: 'https://buy.stripe.com/5kQ4gB0KYbmsggA4Mk0Fi01',
  },
  cabinet: {
    name: 'Pro', price: 89, tagline: "L'agence active avec une équipe",
    features: ["Jusqu'à 3 agents", "Jusqu'à 200 biens actifs", 'Matchings IA illimités', '80 emails personnalisés / mois', '200 questions agent IA / mois', 'Synchronisation avec votre logiciel métier', 'Rapport mensuel PDF automatique', 'Support email — réponse 24h'],
    stripeUrl: 'https://buy.stripe.com/9B65kFdxKaio4xS3Ig0Fi02',
  },
  reseau: {
    name: 'Réseau', price: 179, tagline: 'Les agences multi-bureaux',
    features: ["Jusqu'à 10 agents", 'Biens illimités', 'Matchings IA illimités', 'Emails personnalisés illimités', 'Questions agent IA illimitées', "Jusqu'à 3 bureaux dans un compte", 'Dashboard multi-agences centralisé', 'Rapport avancé + export Excel', 'Synchronisation prioritaire (toutes les 2h)', 'Onboarding dédié inclus (visio 1h)', 'Support prioritaire — réponse 12h'],
    stripeUrl: 'https://buy.stripe.com/fZu3cxdxK76c5BW1A80Fi00',
  },
}

/* ════ Page principale ═══════════════════════════════════════════ */

export default function Souscrire() {
  const [searchParams] = useSearchParams()
  const planKey = PLANS[searchParams.get('plan')] ? searchParams.get('plan') : 'cabinet'
  const plan = PLANS[planKey]

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [agence, setAgence] = useState('')
  const [logiciel, setLogiciel] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  function validate() {
    const e = {}
    if (!nom.trim()) e.nom = 'Obligatoire'
    if (!email.trim() || !email.includes('@') || !email.split('@')[1]?.includes('.')) e.email = 'Email invalide'
    if (!agence.trim()) e.agence = 'Obligatoire'
    setFieldErrors(e)
    return !Object.keys(e).length
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nom.trim(),
          email: email.trim().toLowerCase(),
          sujet: `Nouvel abonnement — Plan ${plan.name}`,
          message: `Agence : ${agence.trim()}\nPlan choisi : ${plan.name} (${plan.price} € HT/mois)\nLogiciel métier actuel : ${logiciel.trim() || '(non précisé)'}`,
        }),
      })
      const data = await res.json()
      if (!data.ok) { setApiError("Erreur lors de l'envoi. Réessayez ou écrivez-nous directement à contact@immoflash.app."); setLoading(false); return }
      window.location.href = plan.stripeUrl
    } catch {
      setApiError('Impossible de contacter le serveur.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#031e39',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      color: '#f1f5f9',
    }}>
      <HeroBackground />

      <header style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="/" style={{ display: 'inline-flex', textDecoration: 'none', color: '#f1f5f9' }} aria-label="ImmoFlash">
          <Logo height={20} />
        </a>
        <a href="/#Tarifs" style={{ fontSize: 13, color: '#f1f5f9', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={e => e.target.style.color = '#f1f5f9'}
          onMouseLeave={e => e.target.style.color = '#f1f5f9'}>
          ← Retour aux tarifs
        </a>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 620,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 28,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(0,193,255,0.05), 0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
          padding: '2.5rem 2.5rem 2rem',
        }}>
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            {/* Titre en Anomaly (police d'affichage de l'accueil) : texte pur, sans
                chiffres ni symbole — ce type de police custom gère mal les glyphes
                hors alphabet (le prix est affiché séparément, en Montserrat). */}
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontFamily: "'Anomaly', Arial, sans-serif", fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.03em', wordSpacing: '0.25em', margin: '0 0 0.5rem', color: '#f1f5f9' }}>
              Plan{'  '}<span style={{ color: '#7ee6ff' }}>{plan.name}</span>
            </h1>
            <p style={{ fontFamily: "'Montserrat', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: '#00c1ff', margin: '0 0 0.5rem' }}>
              {plan.price} € <span style={{ fontSize: 13, fontWeight: 600, color: '#7ee6ff' }}>HT/mois</span>
            </p>
            <p style={{ color: '#f1f5f9', fontSize: 15, margin: 0 }}>{plan.tagline}</p>
          </div>

          {/* Récap des fonctionnalités du plan */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 16px' }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#f1f5f9' }}>
                  <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,193,255,0.15)', color: '#00c1ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, marginTop: 2 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Comment ça va se passer */}
          <div style={{ background: 'rgba(0,193,255,0.06)', border: '1px solid rgba(0,193,255,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#7ee6ff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Comment ça va se passer</p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#f1f5f9', lineHeight: 1.7, listStyle: 'decimal' }}>
              <li>Vous réglez votre abonnement en toute sécurité sur Stripe.</li>
              <li>On vous recontacte sous 24-48h pour récupérer l'accès à votre logiciel métier (export, identifiants FTP...) et mettre en place la synchronisation.</li>
              <li>Votre catalogue est synchronisé, votre compte est opérationnel.</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit}>
            <Field label="Nom complet" value={nom} onChange={setNom} placeholder="Sophie Martin" required error={fieldErrors.nom} autoFocus />
            <Field label="Email professionnel" type="email" value={email} onChange={setEmail} placeholder="sophie@agence.fr" required error={fieldErrors.email} />
            <Field label="Nom de votre agence" value={agence} onChange={setAgence} placeholder="Martin Immobilier" required error={fieldErrors.agence} />
            <Field label="Logiciel métier utilisé" value={logiciel} onChange={setLogiciel} placeholder="Hektor, Apimo, Netty, aucun…" hint="Pour préparer la mise en place de la synchronisation" />

            {apiError && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: '0.5rem' }}>{apiError}</p>}

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" disabled={loading} style={S.btnPrimary(loading)}>
                {loading ? <><Spinner /> Envoi…</> : <>Continuer vers le paiement →</>}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#f1f5f9', marginTop: '1rem' }}>
              En continuant, vous acceptez les <a href="/cgu" style={{ color: '#f1f5f9', fontWeight: 700, textDecoration: 'underline' }}>CGU</a> et la <a href="/confidentialite" style={{ color: '#f1f5f9', fontWeight: 700, textDecoration: 'underline' }}>Politique de confidentialité</a>
            </p>
          </form>
        </div>
      </main>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg) } }
        ::placeholder { color: #f1f5f9; }
      `}</style>
    </div>
  )
}
