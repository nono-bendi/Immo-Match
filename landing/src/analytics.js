import posthog from 'posthog-js'

// Conformité CNIL : aucun traçage tant que l'utilisateur n'a pas explicitement
// accepté les cookies. PostHog n'est initialisé qu'après consentement.
let started = false

export function startAnalytics() {
  if (started) return
  started = true
  posthog.init('phc_yFKU2CNX4miygcMq3CXi3ebCdALEZX8qxZ6DPnbkCqgC', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
  })
}

// Au chargement : ne démarre que si un consentement "accepted" a déjà été donné.
export function maybeStartAnalytics() {
  try {
    if (localStorage.getItem('cookie_consent') === 'accepted') {
      startAnalytics()
    }
  } catch {
    // localStorage indisponible (mode privé strict) : on ne trace pas
  }
}
