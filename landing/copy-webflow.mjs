import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* Copie l'accueil + les pages légales (export Webflow statique, voir
   landing/landing v2/) par-dessus le résultat de prerender.mjs. Ces pages
   ne passent plus par React : le bundle du site (main.jsx) ne s'y charge
   jamais, seul js/site-analytics.js tourne. Les chemins css/js/images/fonts
   ont déjà été réécrits en absolu (/css/…) dans le dossier source. */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, 'landing v2')
const DIST = path.join(__dirname, 'dist')

const pages = [
  { from: 'index.html', to: 'index.html' },
  { from: 'mentions-legales.html', to: 'mentions-legales/index.html' },
  { from: 'conditions-generales-dutilisation.html', to: 'cgu/index.html' },
  { from: 'confidentialite.html', to: 'confidentialite/index.html' },
  { from: 'cookies.html', to: 'cookies/index.html' },
  { from: '404.html', to: '404.html' },
]

for (const { from, to } of pages) {
  const dest = path.join(DIST, to)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(path.join(SRC, from), dest)
  console.log('webflow copied:', to)
}

for (const dir of ['css', 'js', 'images', 'fonts']) {
  fs.cpSync(path.join(SRC, dir), path.join(DIST, dir), { recursive: true })
  console.log('webflow copied:', dir + '/')
}
