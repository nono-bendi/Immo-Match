/**
 * ════════════════════════════════════════════════════════════════════
 *  ImmoMatch — Screenshot automatique (Puppeteer)
 *  Usage : node screenshot.mjs
 *  Prérequis : landing :5173 | dashboard :5174 | backend :8000
 * ════════════════════════════════════════════════════════════════════
 */

import puppeteer from 'puppeteer'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname   = dirname(fileURLToPath(import.meta.url))
const OUT         = join(__dirname, 'screenshots')
const LANDING     = 'http://localhost:5173'
const DASH        = 'http://localhost:5174'
const API         = 'http://localhost:8000'
const EMAIL       = 'noabendiaf@gmail.com'
const PASSWORD    = 'Noa83440*'
const AGENCY_SLUG = 'saint_francois'   // agency_id=1, slug=saint_francois
const VIEWPORT    = { width: 1440, height: 900, deviceScaleFactor: 2 }

// ── Pages publiques (landing Vite :5173) ──────────────────────────
const LANDING_PAGES = [
  { name: '00_home',             path: '/' },
  { name: '01_faq',              path: '/faq' },
  { name: '02_guide-demarrage',  path: '/guide-de-demarrage' },
  { name: '03_documentation',    path: '/documentation' },
  { name: '04_cgu',              path: '/cgu' },
  { name: '05_confidentialite',  path: '/confidentialite' },
  { name: '06_cookies',          path: '/cookies' },
  { name: '07_mentions-legales', path: '/mentions-legales' },
]

// ── Pages dashboard (Vite :5174, authentifiées) ───────────────────
const DASH_PAGES = [
  { name: '11_dashboard',      path: '/'                },
  { name: '12_clients',        path: '/clients'         },
  { name: '13_biens',          path: '/biens'           },
  { name: '14_matchings',      path: '/matchings'       },
  { name: '15_historique',     path: '/historique'      },
  { name: '16_calibration',    path: '/calibration'     },
  { name: '17_settings',       path: '/settings'        },
  { name: '18_administration', path: '/administration'  },
  { name: '19_new-prospect',   path: '/nouveau-prospect'},
]

// ════════════════════════════════════════════════════════════════════

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }) }

async function waitReady(page) {
  // Attendre que le spinner React disparaisse ET qu'il y ait du contenu
  await page.waitForFunction(
    () => !document.querySelector('.animate-spin') && document.body.innerText.trim().length > 30,
    { timeout: 10000 }
  ).catch(() => {})
  await delay(700)
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

async function disableAnimations(page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }`
  })
}

async function shot(page, name, dir) {
  const file = join(dir, `${name}.png`)
  try {
    await page.screenshot({ path: file, fullPage: true })
  } catch {
    // Page trop haute pour le rendu headless → fallback viewport uniquement
    await page.screenshot({ path: file, fullPage: false })
    console.log(`  ⚠  ${name}.png (viewport only — page trop longue)`)
    return
  }
  console.log(`  ✓  ${name}.png`)
}

// Scroll au milieu pour déclencher le lazy-load, revenir en haut, screenshot
async function scrollShot(page, name, dir) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await delay(350)
  await page.evaluate(() => window.scrollTo(0, 0))
  await delay(200)
  await shot(page, name, dir)
}

// ── Guide ImmoMatch : fermer le modal tuto s'il apparaît ──────────
async function dismissTutorial(page) {
  // Attendre max 2 s que le texte "Guide ImmoMatch" apparaisse
  const appeared = await page.waitForFunction(
    () => [...document.querySelectorAll('span')]
            .some(s => s.textContent.trim() === 'Guide ImmoMatch'),
    { timeout: 2000 }
  ).then(() => true).catch(() => false)

  if (!appeared) return // pas de tuto → on continue

  // Cliquer le bouton ✕ dans le header : bouton frère du span "Guide ImmoMatch"
  const closed = await page.evaluate(() => {
    const span = [...document.querySelectorAll('span')]
      .find(s => s.textContent.trim() === 'Guide ImmoMatch')
    if (!span) return false
    // Remonter jusqu'au div header, trouver le bouton sibling
    const header = span.closest('div')?.parentElement
    const btn = header?.querySelector('button')
    if (btn) { btn.click(); return true }
    // Fallback : cliquer l'overlay (premier div fixed inset-0 z-1000)
    const overlay = [...document.querySelectorAll('div')].find(d => {
      const s = d.style
      return s.position === 'fixed' && s.inset === '0px' && parseInt(s.zIndex) >= 1000
    })
    if (overlay) { overlay.click(); return true }
    return false
  })

  if (!closed) return

  // Attendre que le modal disparaisse (le span n'est plus dans le DOM)
  await page.waitForFunction(
    () => ![...document.querySelectorAll('span')]
            .some(s => s.textContent.trim() === 'Guide ImmoMatch'),
    { timeout: 3000 }
  ).catch(() => {})

  await delay(300)
}

// ── Login avec les vraies credentials ─────────────────────────────
async function login(page) {
  console.log('  → Navigation vers /login …')
  await page.goto(`${DASH}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 })

  // Attendre que les champs soient présents
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await waitReady(page)

  // Vider les champs (au cas où il y aurait une valeur pré-remplie)
  await page.$eval('input[type="email"]',    el => el.value = '')
  await page.$eval('input[type="password"]', el => el.value = '')

  // Saisie réaliste caractère par caractère
  await page.type('input[type="email"]',    EMAIL,    { delay: 45 })
  await page.type('input[type="password"]', PASSWORD, { delay: 45 })

  // Clic sur le bouton submit
  await page.click('button[type="submit"]')

  // Attendre la disparition du formulaire de login OU la redirection
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
    page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 20000 }
    ),
  ]).catch(() => {})

  await waitReady(page)

  const url = page.url()
  if (url.includes('/login')) {
    // Vérifier si un message d'erreur est affiché
    const errText = await page.$eval('body', el => el.innerText).catch(() => '')
    throw new Error(`Toujours sur /login après submit. Page contient: ${errText.slice(0, 200)}`)
  }
  console.log(`  ✓  Connecté — redirigé vers ${url}`)
}

// ── Screenshot d'une modal sur une page donnée ────────────────────
async function shotModal(page, dashDir, { name, path, selector, label }) {
  try {
    await page.goto(`${DASH}${path}`, { waitUntil: 'networkidle0', timeout: 20000 })
    await waitReady(page)
    await dismissTutorial(page)

    // Cliquer sur le premier élément avec le sélecteur
    const el = await page.$(selector)
    if (!el) { console.error(`  ✗  ${name} — sélecteur introuvable : ${selector}`); return }

    await el.click()
    await delay(1200) // laisser la modal s'animer

    // Attendre que la modal soit visible
    await page.waitForFunction(
      () => document.querySelector('[role="dialog"], .modal, [class*="modal"], [class*="Modal"]') !== null
        || document.querySelector('[class*="overlay"], [class*="Overlay"]') !== null,
      { timeout: 6000 }
    ).catch(() => {})

    await delay(400)
    await shot(page, name, dashDir)
  } catch (e) {
    console.error(`  ✗  ${name} — ${e.message}`)
  }
}

// ════════════════════════════════════════════════════════════════════
async function main() {
  ensureDir(OUT)
  console.log(`\n════ ImmoMatch Screenshots — ${new Date().toLocaleTimeString()} ════`)
  console.log(`Dossier : ${OUT}\n`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
           '--disable-dev-shm-usage', '--window-size=1440,900'],
  })

  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  // ── 1. Landing ─────────────────────────────────────────────────
  console.log('── Landing (port 5173) ──────────────────────────────────')
  const landDir = join(OUT, 'landing')
  ensureDir(landDir)

  for (const { name, path } of LANDING_PAGES) {
    try {
      await page.goto(`${LANDING}${path}`, { waitUntil: 'networkidle0', timeout: 20000 })
      await disableAnimations(page)
      await waitReady(page)
      await dismissTutorial(page)
      await scrollShot(page, name, landDir)
    } catch (e) {
      console.error(`  ✗  ${name} — ${e.message}`)
    }
  }

  // ── 2. Dashboard login (avant auth) ────────────────────────────
  console.log('\n── Dashboard (port 5174) ────────────────────────────────')
  const dashDir = join(OUT, 'dashboard')
  ensureDir(dashDir)

  try {
    await page.goto(`${DASH}/login`, { waitUntil: 'networkidle0', timeout: 20000 })
    await disableAnimations(page)
    await waitReady(page)
    await dismissTutorial(page)
    await shot(page, '10_login', dashDir)
  } catch (e) {
    console.error(`  ✗  10_login — ${e.message}`)
  }

  // ── 3. Login puis pages authentifiées ──────────────────────────
  await login(page)
  await disableAnimations(page)
  await dismissTutorial(page) // tuto qui peut s'ouvrir dès la première connexion

  for (const { name, path } of DASH_PAGES) {
    try {
      await page.goto(`${DASH}${path}`, { waitUntil: 'networkidle0', timeout: 20000 })
      await disableAnimations(page)
      await waitReady(page)
      await dismissTutorial(page)
      await scrollShot(page, name, dashDir)
    } catch (e) {
      console.error(`  ✗  ${name} — ${e.message}`)
    }
  }

  // ── 4. Modals ──────────────────────────────────────────────────
  console.log('\n── Modals ────────────────────────────────────────────────')

  // Modal Bien (BiensPage — bouton title="Voir" sur la première ligne)
  await shotModal(page, dashDir, {
    name:     '20_modal-bien',
    path:     '/biens',
    selector: '[title="Voir"]',
    label:    'BienModal',
  })

  // Modal Prospect/Client (ClientsPage — bouton title="Voir")
  await shotModal(page, dashDir, {
    name:     '21_modal-client',
    path:     '/clients',
    selector: '[title="Voir"]',
    label:    'ProspectModal',
  })

  // ── 5. Page publique (backend :8000) ───────────────────────────
  console.log('\n── Page publique (backend :8000) ────────────────────────')
  const publicDir = join(OUT, 'public')
  ensureDir(publicDir)

  // Récupérer le premier bien_id via l'API
  let bienId = 16
  try {
    const apiResp = await page.evaluate(async (url) => {
      const r = await fetch(url)
      const j = await r.json()
      return j
    }, `${API}/biens?limit=1`)
    const firstBien = Array.isArray(apiResp) ? apiResp[0] : (apiResp.items?.[0] || apiResp.biens?.[0])
    if (firstBien?.id) bienId = firstBien.id
  } catch (e) {
    console.log(`  ℹ  Impossible de récupérer bien_id via API, utilisation de ${bienId}`)
  }

  const publicUrl = `${API}/public/bien/${AGENCY_SLUG}/${bienId}`
  console.log(`  → ${publicUrl}`)
  try {
    await page.goto(publicUrl, { waitUntil: 'networkidle0', timeout: 20000 })
    await disableAnimations(page)
    await delay(800)
    await dismissTutorial(page)
    await scrollShot(page, '30_public-bien', publicDir)
  } catch (e) {
    console.error(`  ✗  30_public-bien — ${e.message}`)
  }

  await browser.close()

  const total = LANDING_PAGES.length + 1 + DASH_PAGES.length + 2 + 1
  console.log(`\n════ Terminé — ${total} screenshots ════`)
  console.log(`  → screenshots/landing/   (${LANDING_PAGES.length})`)
  console.log(`  → screenshots/dashboard/ (1 login + ${DASH_PAGES.length} pages + 2 modals)`)
  console.log(`  → screenshots/public/    (1 page publique)\n`)
}

main().catch(err => {
  console.error('\nErreur fatale :', err.message)
  process.exit(1)
})
