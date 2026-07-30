# Backlog éditorial — Blog ImmoFlash

Sujets en réserve pour la publication automatique (2x/mois, voir
[BLOG_AUTOMATION.md](BLOG_AUTOMATION.md)). L'agent prend le premier sujet
`pending`, rédige l'article, l'ajoute à `src/blogData.js`, puis repasse ce
fichier avec le statut `published` et la date.

Ne pas retirer les sujets `published` : ils servent d'historique pour éviter
les doublons. Ajouter de nouveaux sujets en bas de la liste `pending` quand
elle descend sous 4-5 entrées restantes.

## Déjà publiés (juillet 2026, rédaction initiale)

- [x] `pige-immobiliere-guide-complet` — Pige immobilière : le guide complet
- [x] `prospects-dormants-fichier-agence` — Combien de prospects dorment dans votre fichier ?
- [x] `rapprochement-acquereurs-biens-crm` — Rapprochement acquéreurs-biens : pourquoi votre CRM laisse filer des ventes
- [x] `ia-agent-immobilier-usages-concrets` — IA pour agent immobilier : 7 usages concrets
- [x] `dpe-loi-climat-biens-difficiles-vendre` — DPE et loi Climat : quels biens deviennent difficiles à vendre
- [x] `taux-credit-immobilier-argumentaire-agence` — Taux de crédit immobilier : impact sur l'argumentaire
- [x] `relancer-prospect-immobilier-sans-braquer` — Comment relancer un prospect sans le braquer
- [x] `rgpd-agence-immobiliere-guide` — RGPD en agence immobilière

## En réserve (pending — prendre dans l'ordre)

- [ ] `mandat-exclusif-vs-simple-explication-vendeur` — Mandat exclusif vs mandat simple : ce qu'il faut vraiment expliquer au vendeur. Angle : arguments honnêtes des deux côtés, pas un plaidoyer pour l'exclusif ; quand chacun est réellement dans l'intérêt du vendeur.
- [ ] `estimer-bien-immobilier-methode-erreurs` — Comment estimer un bien immobilier sans se tromper. Angle : méthode par comparables, marge d'erreur réaliste, biais du vendeur (surestimation affective) et de l'agent (sous-estimation pour sécuriser un mandat).
- [ ] `vendre-bien-indivision-succession-blocages` — Vendre un bien en indivision ou succession : les blocages courants. Angle : unanimité des indivisaires, rôle du notaire, délais réalistes — pas de conseil juridique, orienter vers notaire en cas de litige.
- [ ] `primo-accedants-capacite-achat-evolutions` — Primo-accédants : ce qui a changé dans leur capacité d'achat. Angle : dispositifs d'aide (vérifier l'actualité au moment de la rédaction, ne pas réutiliser des montants d'un article précédent sans revérifier), apport moyen attendu par les banques.
- [ ] `compromis-vente-clauses-suspensives-agence` — Compromis de vente : les clauses suspensives qui protègent l'agence. Angle : clause prêt, clause urbanisme, délai de rétractation — rôle de l'agent dans leur rédaction sans faire acte de notaire.
- [ ] `location-saisonniere-vs-longue-duree-agence` — Location saisonnière vs longue durée : ce que ça change pour une agence généraliste. Angle : charge de gestion, réglementation locale (meublés de tourisme), rentabilité perçue vs réelle.
- [ ] `refus-pret-immobilier-cours-vente-agence` — Refus de prêt en cours de vente : comment l'agent doit réagir. Angle : clause suspensive prêt, remise sur le marché rapide, éviter que le bien traîne une réputation de "vente qui a capoté".
- [ ] `diagnostics-immobiliers-obligatoires-liste` — Diagnostics immobiliers obligatoires : la liste complète et qui doit les fournir. Angle : DPE, amiante, plomb, électricité/gaz, ERP — validité de chaque diagnostic, responsabilité vendeur vs agence.
- [ ] `negociation-immobiliere-leviers-agence` — Négociation immobilière : les leviers qui marchent vraiment côté agence. Angle : au-delà du prix (délai, mobilier, date d'entrée), rôle de médiateur de l'agent entre vendeur et acheteur.
- [ ] `vendre-bien-atypique-difficultes-specifiques` — Vendre un bien atypique : les difficultés spécifiques (mitoyenneté, servitude, loft). Angle : argumentaire adapté, profil d'acheteur restreint mais plus motivé, patience nécessaire.
- [ ] `gestion-locative-complement-activite-agence` — La gestion locative comme complément d'activité pour une agence de vente. Angle : revenu récurrent vs activité de vente au coup par coup, charge de travail réelle, quand ça vaut le coup pour une petite structure.
- [ ] `honoraires-agence-justifier-vendeur` — Honoraires d'agence : comment les justifier face à un vendeur qui les conteste. Angle : ce que le pourcentage couvre réellement (pige, diffusion, négociation, sécurisation juridique), sans dénigrer les mandataires à honoraires fixes.
- [ ] `portails-annonces-comparatif-petite-agence` — Portails d'annonces : lequel donne le meilleur retour pour une petite agence. Angle : rester factuel et non sponsorisé, comparer sur des critères objectifs (coût, audience, type de bien), sans affirmer de chiffres de performance non vérifiables.
- [ ] `reseaux-mandataires-vs-agence-traditionnelle` — Réseaux de mandataires vs agence traditionnelle : ce qui attire les vendeurs aujourd'hui. Angle : reconnaître honnêtement les atouts des deux modèles, pas un article à charge contre les mandataires.

## Consignes pour générer de nouveaux sujets (quand la liste est courte)

Rester dans le périmètre : problématiques concrètes d'agences immobilières
françaises (prospection, méthode commerciale, réglementation, outils) — pas
de sujets grand public déconnectés du métier. Vérifier qu'un sujet proche
n'a pas déjà été traité dans "Déjà publiés" avant de l'ajouter.
