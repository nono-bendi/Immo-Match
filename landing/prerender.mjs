import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const SITE = 'https://immoflash.app'

const { render, faqs } = await import('./dist/server/entry-server.mjs')

/* ── JSON-LD ──────────────────────────────────────────────────────────────────
   Un bloc par page, injecté à la place de <!--jsonld--> dans le template.
   Ton factuel : les données structurées servent à l'extraction (moteurs,
   IA génératives), pas au marketing. */

const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ImmoFlash',
  url: `${SITE}/`,
  description:
    "Logiciel SaaS de matching immobilier pour agences : il croise le catalogue de biens avec chaque prospect acheteur, attribue un score de correspondance sur 100 et génère un email de proposition personnalisé. Compatible avec les logiciels Hektor et Primmo. Hébergement en Europe, conforme RGPD.",
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Real Estate Software',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      name: 'Essentiel',
      price: '49',
      priceCurrency: 'EUR',
      description: '49 € HT/mois — 1 utilisateur, 20 matchings IA par mois, emails personnalisés inclus.',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '89',
      priceCurrency: 'EUR',
      description: "89 € HT/mois — jusqu'à 3 agents, matchings IA et emails illimités.",
    },
    {
      '@type': 'Offer',
      name: 'Réseau',
      price: '179',
      priceCurrency: 'EUR',
      description: "179 € HT/mois — jusqu'à 10 agents, matchings illimités, questions à l'agent IA illimitées.",
    },
  ],
  featureList: [
    'Matching IA entre prospects acheteurs et biens immobiliers, score sur 100',
    "Génération automatique d'emails personnalisés",
    'Assistant IA conversationnel sur le portefeuille',
    'Synchronisation du catalogue de biens toutes les 6 heures (Hektor, Primmo)',
    'Import Excel/CSV, tableau de bord et rapports mensuels',
    'Conformité RGPD, hébergement européen, contrat de sous-traitance Article 28',
  ],
  audience: { '@type': 'Audience', audienceType: 'Agences immobilières, agents immobiliers, mandataires' },
  inLanguage: 'fr',
  countryOfOrigin: 'FR',
}

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nowa',
  legalName: 'Bendiaf Noa',
  brand: { '@type': 'Brand', name: 'ImmoFlash' },
  url: `${SITE}/`,
  email: 'contact@immoflash.app',
  foundingDate: '2025',
  founder: { '@type': 'Person', name: 'Noa Bendiaf' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Montauroux',
    postalCode: '83440',
    addressCountry: 'FR',
  },
}

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap((section) =>
    section.items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    }))
  ),
}

/* ── Métadonnées par route (title / description / canonical / OG / JSON-LD) ── */
const routes = [
  {
    url: '/',
    title: "Logiciel de matching immobilier par IA — ImmoFlash",
    desc: "ImmoFlash croise vos prospects acheteurs et votre catalogue de biens, score chaque matching sur 100 et rédige l'email. Essai gratuit 10 jours.",
    jsonld: [softwareApplication, organization],
  },
  {
    url: '/demarrer',
    title: "Démarrer — Essai gratuit 10 jours — ImmoFlash",
    desc: "Créez votre compte ImmoFlash en quelques minutes. Essai gratuit 10 jours, sans engagement ni carte bancaire, opérationnel en 24h.",
  },
  {
    url: '/faq',
    title: "Questions fréquentes — ImmoFlash",
    desc: "Fonctionnement du matching IA, tarifs (49 à 179 € HT/mois), conformité RGPD, compatibilité Hektor et Primmo : toutes les réponses sur ImmoFlash.",
    jsonld: [faqPage],
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
  {
    // Page interne de design system : prérendue pour rester accessible
    // (le fallback nginx renvoie désormais 404), mais exclue de l'indexation.
    url: '/showcase',
    title: "Showcase — ImmoFlash",
    desc: "Bibliothèque de composants visuels ImmoFlash.",
    noindex: true,
  },
]

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')

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

    const headExtra = []
    if (route.jsonld?.length) {
      headExtra.push(
        `<script type="application/ld+json">\n${JSON.stringify(route.jsonld.length === 1 ? route.jsonld[0] : route.jsonld, null, 2)}\n    </script>`
      )
    }
    if (route.noindex) {
      headExtra.push('<meta name="robots" content="noindex, nofollow" />')
    }

    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${route.title}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + canonical + b)
      .replace('<!--jsonld-->', () => headExtra.join('\n    '))
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
