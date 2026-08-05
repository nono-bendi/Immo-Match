import posthog from 'posthog-js'

const PROJECT_KEY = 'phc_yFKU2CNX4miygcMq3CXi3ebCdALEZX8qxZ6DPnbkCqgC'
const API_HOST = 'https://us.i.posthog.com'

let initialized = false

// Mesure d'audience anonyme, exemptée de consentement (recommandation CNIL
// sur les cookies de mesure d'audience) : persistence en mémoire uniquement
// (aucun cookie/localStorage, chaque page vue repart d'un identifiant
// aléatoire — impossible de relier une visite à une autre), pas
// d'autocapture des clics/saisies, pas de session replay, pas de profil
// individuel. L'IP est anonymisée côté PostHog (Project Settings >
// Anonymize IPs). Démarre sans attendre de consentement.
export function startAnonymousAudienceMeasurement() {
  if (initialized) return
  initialized = true
  posthog.init(PROJECT_KEY, {
    api_host: API_HOST,
    person_profiles: 'identified_only',
    persistence: 'memory',
    autocapture: false,
    disable_session_recording: true,
    capture_pageview: true,
    capture_pageleave: false,
  })
}

// Traçage complet (profils, autocapture, éventuel session replay) :
// uniquement après acceptation explicite du bandeau cookies. Upgrade la
// même instance PostHog plutôt que d'en recréer une (persistence bascule
// sur localStorage+cookie, donc suivi cross-session à partir de ce moment).
export function startAnalytics() {
  startAnonymousAudienceMeasurement()
  posthog.set_config({
    persistence: 'localStorage+cookie',
    autocapture: true,
    disable_session_recording: false,
  })
}

// Au chargement : la mesure d'audience anonyme démarre toujours (exemptée) ;
// le traçage complet ne démarre en plus que si un consentement "accepted"
// a déjà été donné lors d'une visite précédente.
export function maybeStartAnalytics() {
  startAnonymousAudienceMeasurement()
  try {
    if (localStorage.getItem('cookie_consent') === 'accepted') {
      startAnalytics()
    }
  } catch {
    // localStorage indisponible (mode privé strict) : mesure anonyme seule
  }
}
