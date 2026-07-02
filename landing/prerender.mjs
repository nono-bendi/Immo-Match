import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const SITE = 'https://immoflash.app'

/* ── Métadonnées uniques par route (title / description / canonical / OG) ── */
const routes = [
  {
    url: '/',
    title: "Logiciel de matching immobilier par IA — ImmoFlash",
    desc: "ImmoFlash croise vos prospects acheteurs et votre catalogue de biens, score chaque matching sur 100 et rédige l'email. Essai gratuit 10 jours.",
  },
  {
    url: '/demarrer',
    title: "Démarrer — Essai gratuit 10 jours — ImmoFlash",
    desc: "Créez votre compte ImmoFlash en quelques minutes. Essai gratuit 10 jours, sans engagement ni carte bancaire, opérationnel en 24h.",
  },
  {
    url: '/faq',
    title: "Questions fréquentes — ImmoFlash",
    desc: "Fonctionnement du matching IA, tarifs, conformité RGPD, intégrations Hektor et Primmo : toutes les réponses sur ImmoFlash.",
  },
  {
    url: '/guide-de-demarrage',
    title: "Guide de démarrage — ImmoFlash",
    desc: "De la création du compte au premier matching IA envoyé : le guide pas à pas pour mettre en route ImmoFlash dans votre agence immobilière.",
  },
  {
    url: '/documentation',
    title: "Documentation — ImmoFlash",
    desc: "Documentation complète d'ImmoFlash : gestion des prospects, matchings IA, emails personnalisés, synchronisation du catalogue de biens.",
  },
  {
    url: '/mentions-legales',
    title: "Mentions légales — ImmoFlash",
    desc: "Mentions légales du site immoflash.app, édité par Nowa (Montauroux, France).",
  },
  {
    url: '/cgu',
    title: "Conditions Générales d'Utilisation — ImmoFlash",
    desc: "Conditions générales d'utilisation du logiciel de matching immobilier ImmoFlash.",
  },
  {
    url: '/confidentialite',
    title: "Politique de confidentialité — ImmoFlash",
    desc: "Politique de confidentialité d'ImmoFlash : données hébergées en Europe, conformité RGPD, contrat de sous-traitance Article 28.",
  },
  {
    url: '/cookies',
    title: "Politique de cookies — ImmoFlash",
    desc: "Politique de cookies du site immoflash.app : cookies utilisés, finalités et gestion du consentement.",
  },
]

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
const { render } = await import('./dist/server/entry-server.mjs')

/* Remplace le contenu d'un attribut content="…" pour une balise meta donnée.
   Les remplacements passent par des fonctions pour neutraliser les `$` éventuels. */
const setMeta = (html, attr, name, value) =>
  html.replace(
    new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`),
    (_, a, b) => a + value + b
  )

for (const route of routes) {
  try {
    const appHtml = render(route.url)
    // Canonical avec slash final : nginx redirige /faq → /faq/ (fichiers statiques)
    const canonical = route.url === '/' ? `${SITE}/` : `${SITE}${route.url}/`

    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${route.title}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + canonical + b)
      .replace('<!--app-html-->', () => appHtml)
    html = setMeta(html, 'name', 'description', route.desc)
    html = setMeta(html, 'property', 'og:title', route.title)
    html = setMeta(html, 'property', 'og:description', route.desc)
    html = setMeta(html, 'property', 'og:url', canonical)
    html = setMeta(html, 'name', 'twitter:title', route.title)
    html = setMeta(html, 'name', 'twitter:description', route.desc)

    const filePath = route.url === '/'
      ? toAbsolute('dist/index.html')
      : toAbsolute(`dist${route.url}/index.html`)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, html)
    console.log('pre-rendered:', route.url)
  } catch (e) {
    console.warn('skipped:', route.url, '-', e.message)
  }
}
