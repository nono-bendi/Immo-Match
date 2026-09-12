import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const SITE = 'https://immoflash.app'

const { render, faqs, blogPosts } = await import('./dist/server/entry-server.mjs')

/* ── JSON-LD ──────────────────────────────────────────────────────────────────
   Un bloc par page, injecté à la place de <!--jsonld--> dans le template.
   Ton factuel : les données structurées servent à l'extraction (moteurs,
   IA génératives), pas au marketing.
   NB : le JSON-LD SoftwareApplication/Organization de l'accueil vit désormais
   directement dans landing/landing v2/index.html (page statique Webflow,
   copiée par copy-webflow.mjs — voir project_landing_prerender). */

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

/* JSON-LD BlogPosting — un bloc par article, généré depuis blogData.js
   (source unique, voir landing/src/blogData.js). */
const blogPosting = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.metaDescription,
  datePublished: post.date,
  dateModified: post.date,
  author: { '@type': 'Organization', name: 'ImmoFlash', url: `${SITE}/` },
  publisher: { '@type': 'Organization', name: 'ImmoFlash', url: `${SITE}/` },
  mainEntityOfPage: `${SITE}/blog/${post.slug}/`,
  inLanguage: 'fr',
})

/* ── Métadonnées par route (title / description / canonical / OG / JSON-LD) ──
   "/", "/mentions-legales", "/cgu", "/confidentialite" et "/cookies" ne sont
   plus prérendues ici : ce sont des pages statiques Webflow copiées par
   copy-webflow.mjs après ce script (voir landing/landing v2/). */
const routes = [
  {
    url: '/demarrer',
    title: "Démarrer — Essai gratuit 10 jours — ImmoFlash",
    desc: "Créez votre compte ImmoFlash en quelques minutes. Essai gratuit 10 jours, sans engagement ni carte bancaire, opérationnel en 24h.",
  },
  {
    // Étape intermédiaire avant Stripe (récap plan + formulaire) : jamais
    // partagée telle quelle (dépend du ?plan= choisi), exclue de l'indexation.
    url: '/souscrire',
    title: "Souscrire — ImmoFlash",
    desc: "Finalisez votre abonnement ImmoFlash.",
    noindex: true,
  },
  {
    url: '/faq',
    title: "Questions fréquentes — ImmoFlash",
    desc: "Fonctionnement du matching IA, tarifs (49 à 179 € HT/mois), conformité RGPD, compatibilité Hektor et Primmo : toutes les réponses sur ImmoFlash.",
    jsonld: [faqPage],
  },
  {
    url: '/blog',
    title: "Blog — Prospection, IA, réglementation immobilière — ImmoFlash",
    desc: "Articles de fond pour les agences immobilières : pige, rapprochement acquéreurs-biens, IA, DPE, RGPD, taux de crédit. Contenu factuel, sans remplissage.",
  },
  ...blogPosts.map((post) => ({
    url: `/blog/${post.slug}`,
    title: `${post.title} — ImmoFlash`,
    desc: post.metaDescription,
    jsonld: [blogPosting(post)],
  })),
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
    // Page interne de design system : prérendue pour rester accessible
    // (le fallback nginx renvoie désormais 404), mais exclue de l'indexation.
    url: '/showcase',
    title: "Showcase — ImmoFlash",
    desc: "Bibliothèque de composants visuels ImmoFlash.",
    noindex: true,
  },
  {
    // Page vidéo plein écran, utilisée par le lien du mail de prospection.
    url: '/video',
    title: "Vidéo de présentation — ImmoFlash",
    desc: "Découvrez ImmoFlash en vidéo : matching IA entre prospects et biens immobiliers.",
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
