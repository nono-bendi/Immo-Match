# Playbook — publication automatique d'un article de blog

Ce fichier est le mode d'emploi complet pour une routine cloud programmée
(2x/mois) qui écrit et publie un nouvel article sur https://immoflash.app/blog/
sans intervention humaine. Tu (l'agent qui exécute cette routine) n'as aucun
contexte de conversation précédent : tout ce dont tu as besoin est ici et
dans le dépôt.

Le déploiement en production est géré séparément par un cron sur le VPS qui
tire automatiquement les nouveaux commits de `main` (voir
`scripts/auto_deploy_blog.sh`) — ton seul travail est d'aller jusqu'au push
sur `main`, correctement construit et vérifié. **Tu n'as pas d'accès SSH au
serveur de production et tu ne dois pas essayer d'y accéder** — c'est
intentionnel (aucun identifiant ne doit être manipulé par cette routine).

## 1. Choisir le sujet

Ouvrir `landing/BLOG_TOPICS.md`. Prendre le **premier** sujet encore marqué
`pending` dans la section "En réserve". Si la liste est vide, générer 4 à 5
nouveaux sujets toi-même en respectant les consignes en bas de ce fichier
plutôt que de t'arrêter — mais vérifier d'abord qu'un sujet équivalent n'a
pas déjà été traité (section "Déjà publiés").

## 2. Rédiger l'article

Lire `landing/src/blogData.js` en entier pour t'imprégner du ton et de la
structure — c'est la référence, pas une suggestion.

**Ton** : factuel, direct, sans superlatifs marketing ("le meilleur",
"révolutionnaire"). Chaque article doit être utile même à quelqu'un qui
n'installera jamais ImmoFlash. Le lien vers ImmoFlash en fin d'article est
un bonus pertinent, jamais le point de départ de l'article.

**Structure JS** — un nouvel objet ajouté au tableau exporté par
`blogData.js`, avec les champs :
- `slug` (déjà défini dans BLOG_TOPICS.md pour le sujet choisi)
- `category` (une catégorie cohérente avec celles déjà utilisées :
  Prospection, Méthode & outils, Outils & IA, Réglementation, Marché
  immobilier — ou une nouvelle catégorie si vraiment aucune ne convient)
- `title`, `excerpt` (1-2 phrases), `metaDescription` (150-160 caractères,
  pour la balise meta), `date` (date du jour au format `YYYY-MM-DD`),
  `readTime` (estimation du type `"6 min"`)
- `content` : tableau de blocs, dans cet ordre logique habituel (intro →
  sections H2 → note optionnelle → cta final). Types de blocs disponibles :
  - `{ p: "..." }` — paragraphe
  - `{ h2: "..." }` — titre de section
  - `{ ul: ["...", "..."] }` — liste à puces
  - `{ note: "..." }` — encart "à retenir" (bleu, avec icône info)
  - `{ cta: { text: "...", label: "...", href: "/demarrer" } }` — toujours
    en dernier bloc, un seul par article

Longueur cible : 600 à 1200 mots utiles (le compte de mots du texte des
blocs `p`/`ul`, pas de remplissage pour atteindre un chiffre).

**Aucun emoji** dans le contenu ni dans le code — c'est une règle du projet.
Si une icône est nécessaire, utiliser du SVG inline comme dans
`landing/src/pages/BlogPost.jsx`.

## 3. Vérification factuelle — la règle la plus importante

Cet article est publié sous le nom réel d'ImmoFlash (éditeur : Nowa), sans
relecture humaine avant mise en ligne. Une erreur factuelle (mauvaise date
de loi, mauvais taux, mauvaise règle RGPD) publiée sans contrôle est le
risque principal de cette automatisation.

- Toute affirmation chiffrée ou datée sur la réglementation (DPE, RGPD,
  fiscalité, droit immobilier) doit être vérifiée avec l'outil de recherche
  web avant d'être écrite. Ne jamais réutiliser de mémoire un chiffre déjà
  vu dans un article existant sans le revérifier — les règles changent.
- Si une information ne peut pas être vérifiée avec confiance (ex : taux de
  crédit du jour, barème d'aide qui change souvent), ne pas l'affirmer comme
  un fait daté. Soit reformuler en ordre de grandeur explicitement qualifié
  ("généralement", "à vérifier au moment de la transaction"), soit renvoyer
  vers un professionnel (courtier, notaire, CNIL) plutôt que d'inventer un
  chiffre. Voir `taux-credit-immobilier-argumentaire-agence` dans
  `blogData.js` pour un exemple de cette approche.
- Ne jamais inventer de statistique d'usage, de témoignage client, ou de cas
  concret présenté comme réel. Les exemples chiffrés doivent être
  explicitement des illustrations ("par exemple, un prospect à X €...").
- **En cas de doute réel sur un sujet réglementaire après recherche,
  choisir un autre sujet de la liste plutôt que de publier une information
  incertaine.** Un cycle sans publication est toujours préférable à un
  article qui présente un risque juridique ou de réputation pour l'éditeur.

## 4. Construire et vérifier

```
cd landing
npm run build
```

Ce script construit le bundle, le SSR, puis exécute `prerender.mjs` qui lit
automatiquement `blogPosts` depuis `blogData.js` — **aucune autre
modification n'est nécessaire dans `prerender.mjs`**, il génère déjà la
route, le JSON-LD `BlogPosting` et les métadonnées pour tout nouvel article
du tableau.

Vérifier que le build a réussi et que la page existe réellement :

```
grep -o '<title>[^<]*</title>' dist/blog/<le-nouveau-slug>/index.html
```

Doit afficher le bon titre. Si le build échoue ou si la page attendue
n'existe pas dans `dist/blog/`, **ne pas commiter** — corriger l'erreur ou
abandonner ce cycle.

`routers/seo.py` (sitemap) lit désormais dynamiquement le contenu de
`landing/dist/blog/` au moment de la requête — il n'y a **rien à modifier
dans le backend Python** pour un article standard, et donc aucun
redémarrage de service n'est nécessaire côté VPS.

Optionnel mais recommandé : ajouter une ligne pour le nouvel article dans
`landing/public/llms.txt` (section "## Blog") — utile pour les moteurs de
réponse IA. Ne pas bloquer la publication si cette étape est oubliée.

## 5. Mettre à jour le backlog

Dans `landing/BLOG_TOPICS.md`, déplacer le sujet traité de "En réserve" vers
"Déjà publiés" (cocher `[x]`, ajouter le slug et le titre final).

## 6. Fichiers à toucher — et à ne surtout pas toucher

À modifier dans ce cycle :
- `landing/src/blogData.js` (nouvel article)
- `landing/dist/` (régénéré par `npm run build` — commiter le résultat)
- `landing/BLOG_TOPICS.md` (sujet déplacé vers "Déjà publiés")
- `landing/public/llms.txt` (optionnel, cf. ci-dessus)

À ne jamais toucher dans ce cycle, même si `git status` les montre comme
modifiés localement au moment du clone (cela peut arriver — laisser ces
fichiers intacts, ne pas les ajouter au commit) :
- `dashboard/` (application séparée, déploiement différent)
- `landing/dist/assets/hero.mp4`, `hero-poster.jpg` ou tout autre asset
  binaire non lié au blog
- `routers/*.py`, `backend.py` ou tout autre fichier backend en dehors de
  `routers/seo.py` — et `routers/seo.py` ne doit être modifié que si le
  mécanisme de sitemap dynamique lui-même est cassé, jamais pour ajouter un
  slug (ce n'est plus nécessaire, voir section 4)
- Tout fichier hors de `landing/` qui apparaîtrait modifié sans rapport
  avec cette tâche

Si `git status` montre des fichiers modifiés sans rapport avec le blog au
moment de commiter, ne stage que les fichiers listés ci-dessus explicitement
par leur chemin — jamais `git add -A` ni `git add .`.

## 7. Commit et push

```
git add landing/src/blogData.js landing/dist landing/BLOG_TOPICS.md landing/public/llms.txt
git commit -m "landing : ajoute l'article de blog <titre court>

Publication automatique (routine programmee) - sujet : <slug>"
git push origin main
```

Push direct sur `main` — c'est la pratique de ce dépôt (pas de branche ni de
PR pour ce type de changement).

## 8. Fin de cycle

Ne rien faire de plus. Le cron sur le VPS (`scripts/auto_deploy_blog.sh`,
exécuté périodiquement) détectera le nouveau commit sur `main` et le
déploiera automatiquement — c'est un mécanisme séparé, hors du périmètre de
cette routine.

## Consignes pour générer de nouveaux sujets (si le backlog est vide)

Rester dans le périmètre : problématiques concrètes des agences
immobilières françaises (prospection, méthode commerciale, réglementation,
outils) — pas de sujets grand public déconnectés du métier. Vérifier dans
"Déjà publiés" (`BLOG_TOPICS.md`) et dans `blogData.js` qu'un sujet
équivalent n'existe pas déjà avant d'en écrire un nouveau.
