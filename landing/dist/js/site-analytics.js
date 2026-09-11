/* Mesure d'audience + bandeau cookies pour les pages statiques (accueil,
   mentions légales, CGU, confidentialité, cookies). Portage fidèle de
   landing/src/analytics.js et landing/src/components/CookieBanner.jsx —
   ces pages n'exécutent pas le bundle React, donc pas d'import possible. */
(function () {
  'use strict'

  var PROJECT_KEY = 'phc_yFKU2CNX4miygcMq3CXi3ebCdALEZX8qxZ6DPnbkCqgC'
  var API_HOST = 'https://us.i.posthog.com'

  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */

  var initialized = false

  // Mesure d'audience anonyme, exemptée de consentement (recommandation CNIL) :
  // persistence en mémoire uniquement, pas d'autocapture, pas de session replay.
  function startAnonymousAudienceMeasurement() {
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

  // Traçage complet : uniquement après acceptation explicite du bandeau cookies.
  function startAnalytics() {
    startAnonymousAudienceMeasurement()
    posthog.set_config({
      persistence: 'localStorage+cookie',
      autocapture: true,
      disable_session_recording: false,
    })
  }

  startAnonymousAudienceMeasurement()
  try {
    if (localStorage.getItem('cookie_consent') === 'accepted') startAnalytics()
  } catch (e) {
    // localStorage indisponible (mode privé strict) : mesure anonyme seule
  }

  function showCookieBanner() {
    var hasConsent
    try {
      hasConsent = localStorage.getItem('cookie_consent')
    } catch (e) {
      return
    }
    if (hasConsent) return

    var banner = document.createElement('div')
    banner.setAttribute(
      'style',
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'width:calc(100% - 48px);max-width:620px;background:#0f172a;border-radius:16px;' +
        'padding:16px 20px;display:flex;align-items:center;gap:16px;' +
        'box-shadow:0 8px 40px rgba(0,0,0,.35);flex-wrap:wrap;font-family:system-ui,sans-serif;'
    )
    banner.innerHTML =
      '<span style="font-size:20px">🍪</span>' +
      '<p style="flex:1;font-size:13px;color:#cbd5e1;line-height:1.5;margin:0;min-width:200px">' +
      "Nous utilisons des cookies fonctionnels et d'analyse anonymisée. " +
      '<a href="/cookies" style="color:#60a5fa;text-decoration:underline">En savoir plus</a></p>' +
      '<div style="display:flex;gap:8px;flex-shrink:0">' +
      '<button type="button" data-choice="refused" style="padding:8px 16px;border-radius:8px;' +
      'border:1px solid #334155;background:transparent;color:#94a3b8;font-size:13px;' +
      'font-weight:600;cursor:pointer;font-family:inherit">Refuser</button>' +
      '<button type="button" data-choice="accepted" style="padding:8px 16px;border-radius:8px;' +
      'border:none;background:linear-gradient(135deg,#1E3A5F,#2D5A8A);color:#fff;font-size:13px;' +
      'font-weight:600;cursor:pointer;font-family:inherit">Accepter</button></div>'

    document.body.appendChild(banner)

    var buttons = banner.querySelectorAll('button')
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (ev) {
        var choice = ev.currentTarget.getAttribute('data-choice')
        try {
          localStorage.setItem('cookie_consent', choice)
        } catch (e) {}
        if (choice === 'accepted') startAnalytics()
        banner.parentNode.removeChild(banner)
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showCookieBanner)
  } else {
    showCookieBanner()
  }
})()
