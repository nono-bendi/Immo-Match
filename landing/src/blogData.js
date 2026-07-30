/* ── Données Blog — source unique ─────────────────────────────────────────────
   Utilisées par /blog (liste), /blog/:slug (article) ET par prerender.mjs
   (title/description par URL + JSON-LD BlogPosting).

   Contenu structuré en blocs pour rester simple à faire évoluer :
   { h2 }  titre de section
   { p }   paragraphe
   { ul }  liste à puces (tableau de strings)
   { note } encart "à retenir"
   { cta } encart d'appel à l'action vers /demarrer

   Ton : factuel et autoporteux (voir faqData.js) — utile pour le lecteur
   d'abord, cité par les moteurs de réponse IA en second lieu. */

const blogPosts = [
  {
    slug: 'pige-immobiliere-guide-complet',
    category: 'Prospection',
    title: 'Pige immobilière : le guide complet pour trouver des mandats en 2026',
    excerpt: "Porte-à-porte, téléphone, veille digitale : les canaux de pige qui fonctionnent encore, comment structurer un plan réaliste, et les erreurs qui coûtent des mandats.",
    metaDescription: "Pige immobilière : les 3 canaux qui fonctionnent en 2026, comment bâtir un plan de prospection réaliste et les erreurs qui coûtent des mandats. Guide complet.",
    date: '2026-07-21',
    readTime: '7 min',
    content: [
      { p: "La pige immobilière consiste à repérer des biens mis en vente directement par leurs propriétaires — annonce entre particuliers, panneau, réseau — pour leur proposer un mandat de vente. C'est la première source de rentrée de mandats pour la majorité des agences indépendantes, et c'est aussi l'activité la plus chronophage du métier." },

      { h2: 'Les trois canaux, et où ils en sont réellement' },
      { p: "Le porte-à-porte et l'appel téléphonique restent les canaux qui convertissent le mieux, parce qu'ils créent un contact direct avant que le propriétaire ait déjà signé ailleurs. Le revers : c'est aussi le plus coûteux en temps, et le taux de contacts utiles par heure investie baisse si la zone est déjà bien couverte par la concurrence." },
      { p: "La pige digitale (veille sur les annonces entre particuliers, alertes automatiques sur les plateformes) a pris une place importante ces dernières années. Elle ne remplace pas le contact humain, mais elle permet de repérer une annonce le jour de sa mise en ligne plutôt que trois semaines après — un avantage décisif, la plupart des propriétaires signant avec la première agence qui leur propose un argumentaire crédible." },
      { p: "Le réseau — notaires, syndics, artisans, anciens clients — est le canal le plus lent à construire mais le plus rentable à long terme : les mandats qui en viennent arrivent souvent sans concurrence directe." },

      { h2: 'Construire un plan de pige réaliste' },
      { p: "La pige échoue rarement par manque de méthode et presque toujours par manque de régularité. Un plan tenable ressemble davantage à un quota hebdomadaire modeste et respecté (par exemple : un créneau fixe de porte-à-porte, un nombre de relances téléphoniques défini) qu'à une opération ponctuelle intensive suivie de trois semaines sans activité." },
      { ul: [
        "Bloquer un créneau récurrent dans l'agenda, pas \"quand il y a le temps\"",
        "Fixer un nombre d'actions par semaine, pas un objectif de mandats (le mandat est une conséquence, pas une variable qu'on contrôle directement)",
        "Cibler une zone géographique resserrée plutôt que disperser l'effort",
        "Noter systématiquement chaque contact, même négatif — un refus aujourd'hui est un rendez-vous possible dans six mois",
      ] },

      { h2: "Le script qui n'agace pas" },
      { p: "La différence entre un démarchage qui obtient un rendez-vous et un démarchage qui ferme la porte tient rarement à l'argumentaire commercial et presque toujours à la première phrase. Se présenter avec une observation concrète et locale (une vente récente dans la rue, une évolution du marché du quartier) fonctionne mieux qu'une accroche générique sur les services de l'agence — le propriétaire veut d'abord savoir si l'interlocuteur connaît vraiment son secteur." },
      { note: "À retenir : la pige vend une compétence locale avant de vendre une agence. Le meilleur argument d'entrée est toujours une information précise et vérifiable sur le quartier du propriétaire, pas une liste de services." },

      { h2: 'Les erreurs qui coûtent des mandats' },
      { ul: [
        "Relancer trop tard : un propriétaire qui vient de refuser une première visite reste rarement disponible plus de quelques semaines avant de signer ailleurs",
        "Relancer sans rien de nouveau à dire — la relance \"juste pour prendre des nouvelles\" est perçue comme de l'insistance, pas comme du suivi",
        "Ne pas structurer le suivi : sans trace écrite de chaque contact (date, réaction, prochaine relance prévue), la moitié des prospects piges sont tout simplement oubliés",
        "Négliger les biens qui ne correspondent pas immédiatement à un acheteur identifié — un mandat obtenu aujourd'hui peut trouver son acheteur dans le portefeuille existant demain",
      ] },

      { h2: 'Après le mandat : ne pas perdre le bénéfice de la pige' },
      { p: "Un mandat signé n'est que la moitié du travail. La question qui suit immédiatement — quel acheteur, parmi tous ceux déjà en portefeuille, correspond à ce bien — se pose pour chaque nouveau mandat, et se pose rarement une seule fois : un bien qui ne trouve pas preneur en trois semaines mérite d'être recroisé avec les prospects entrés depuis." },
      { cta: {
        text: "C'est précisément l'étape qu'ImmoFlash automatise : dès qu'un bien entre au catalogue, il est comparé à l'ensemble des prospects acheteurs actifs de l'agence, avec un score de correspondance et un email de proposition prêt à envoyer.",
        label: 'Voir comment ça fonctionne',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'prospects-dormants-fichier-agence',
    category: 'Prospection',
    title: 'Combien de prospects dorment dans votre fichier ? La méthode pour les réveiller',
    excerpt: "Un prospect entré il y a huit mois et jamais recontacté n'est pas un prospect mort — c'est un prospect jamais recroisé avec les bons biens. Méthode d'audit et de réactivation.",
    metaDescription: "Un prospect ancien n'est pas un prospect perdu. Méthode pour auditer un fichier de prospects acheteurs, repérer les dossiers dormants et les réactiver sans être lourd.",
    date: '2026-07-23',
    readTime: '6 min',
    content: [
      { p: "Dans la plupart des agences, l'attention se porte naturellement sur les prospects entrés récemment : ce sont eux qu'on a en tête, eux qu'on rappelle en premier. Les dossiers plus anciens glissent en bas de la liste, non pas parce qu'ils ne sont plus pertinents, mais simplement parce que personne ne les recroise plus avec les nouveaux biens qui entrent au catalogue." },

      { h2: 'Pourquoi un fichier se fige' },
      { p: "C'est un biais structurel, pas un problème de rigueur individuelle : un agent traite en priorité ce qui est visible et récent. Un prospect entré il y a huit mois, dont le dernier contact remonte à six, n'apparaît plus dans aucune liste de tâches — il faut aller le chercher activement, et personne n'a le temps de reparcourir manuellement plusieurs centaines de fiches à chaque nouveau mandat." },
      { p: "Le résultat : un bien qui vient d'entrer est comparé mentalement aux dix ou vingt prospects les plus récents, jamais aux cent cinquante autres. Statistiquement, l'acheteur idéal d'un bien donné n'a aucune raison d'être forcément parmi les plus récents." },

      { h2: 'Faire l\'audit de son portefeuille' },
      { p: "Un audit simple consiste à segmenter le fichier selon deux axes : l'ancienneté du dernier contact, et la validité présumée des critères (un budget ou une zone recherchée évoluent rarement du jour au lendemain, sauf changement de situation explicite du prospect)." },
      { ul: [
        "Prospects actifs (contact dans les 30 derniers jours) — suivi courant",
        "Prospects tièdes (1 à 6 mois sans contact) — à recroiser dès qu'un bien correspondant entre au catalogue",
        "Prospects dormants (plus de 6 mois) — souvent la catégorie la plus volumineuse, et la plus négligée",
      ] },
      { p: "La catégorie \"dormants\" n'est pas à supprimer par défaut. Une partie de ces prospects n'a simplement jamais reçu de proposition pertinente — pas parce qu'il n'y en avait pas eu, mais parce que personne n'a fait le rapprochement." },

      { h2: 'Réactiver sans être lourd' },
      { p: "La règle qui fait la différence entre une relance perçue comme utile et une relance perçue comme insistante est simple : ne recontacter qu'avec quelque chose de concret à proposer. \"Un bien qui correspond à ce que vous cherchiez vient d'arriver\" fonctionne. \"Cela fait longtemps qu'on ne s'est pas parlé\" ne fonctionne pas — et confirme au prospect qu'il n'était pas vraiment suivi." },
      { note: "À retenir : un prospect dormant réactivé avec une proposition concrète et pertinente convertit souvent mieux qu'un prospect \"chaud\" sans bien à lui proposer. L'ancienneté du contact importe moins que la pertinence du moment où on le recontacte." },

      { h2: "Le vrai coût d'un fichier dormant" },
      { p: "Le coût n'est pas visible dans les tableaux de bord habituels, parce qu'il s'agit précisément de ventes qui n'apparaissent nulle part : l'acheteur idéal d'un mandat qui traîne trois mois sur le marché était peut-être dans le fichier depuis le début, jamais recroisé faute de temps pour reparcourir l'ensemble du portefeuille à chaque nouvelle entrée." },
      { cta: {
        text: "C'est le calcul qu'ImmoFlash fait automatiquement à chaque nouveau bien : comparer l'ensemble du portefeuille de prospects — récents et anciens — plutôt que les seuls dossiers en tête de liste, et faire remonter les correspondances avec un score.",
        label: "Essayer sur votre portefeuille",
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'rapprochement-acquereurs-biens-crm',
    category: 'Méthode & outils',
    title: 'Rapprochement acquéreurs-biens : pourquoi votre CRM laisse filer des ventes',
    excerpt: "Un CRM immobilier classique matche par filtres stricts. Un prospect à 5 % au-dessus du budget affiché, une pièce en moins que demandé : le bien n'apparaît jamais dans ses résultats.",
    metaDescription: "Le matching d'un CRM immobilier fonctionne par filtres stricts et élimine des opportunités valables. Comment un rapprochement acquéreurs-biens plus fin évite de perdre des ventes.",
    date: '2026-07-24',
    readTime: '6 min',
    content: [
      { p: "Le rapprochement acquéreurs-biens désigne l'action de recroiser un bien — en particulier un bien qui vient d'entrer au catalogue — avec l'ensemble des prospects acheteurs actifs, pour identifier ceux à qui il devrait être proposé. C'est une fonction que la plupart des CRM immobiliers proposent nativement, mais avec une limite structurelle qu'on découvre surtout quand elle fait manquer une vente." },

      { h2: 'Comment fonctionne un matching par filtres stricts' },
      { p: "Un CRM classique compare des champs : budget maximum du prospect contre prix du bien, surface minimum contre surface annoncée, zone recherchée contre localisation. Le fonctionnement est binaire — un critère hors norme et le bien disparaît des résultats, quelle que soit la marge d'écart." },
      { p: "Prenons un exemple concret : un prospect au budget affiché de 300 000 € et un bien à 315 000 €. Le filtre l'élimine, alors qu'un écart de 5 % se négocie couramment, et que le prospect aurait pu être intéressé s'il avait su que le bien existait. Le même problème se pose pour une surface légèrement inférieure à l'idéal, ou une pièce en moins sur un bien par ailleurs très proche du projet du prospect." },

      { h2: 'Le rapprochement manuel ne passe pas à l\'échelle' },
      { p: "En théorie, un agent qui connaît bien son portefeuille peut compenser cette limite en gardant certains dossiers en tête et en faisant le lien lui-même. En pratique, cela fonctionne pour une vingtaine de prospects récents — pas pour un portefeuille de plusieurs centaines de fiches accumulées sur plusieurs années. Le rapprochement manuel repose alors sur la mémoire, qui privilégie mécaniquement les dossiers récents (voir notre article sur les prospects dormants)." },

      { h2: "Ce qu'un bon processus de rapprochement doit couvrir" },
      { ul: [
        "Recroiser chaque nouveau bien avec l'ensemble du portefeuille actif, pas seulement les prospects les plus récents",
        "Prioriser par degré de correspondance plutôt que par un simple binaire oui/non, pour distinguer une opportunité forte d'une opportunité marginale",
        "Prendre en compte des critères qualitatifs (destination du projet, contraintes explicitées dans les échanges) en plus des critères chiffrés",
        "Produire un argumentaire exploitable, pas seulement une liste — savoir qu'un prospect correspond ne suffit pas s'il faut ensuite reconstruire manuellement pourquoi",
      ] },
      { note: "À retenir : un filtre strict élimine ; un score priorise. La différence semble sémantique, elle change concrètement le nombre d'opportunités qui remontent jusqu'à l'agent." },

      { h2: "Le rôle de l'IA dans cette étape précise" },
      { p: "C'est l'angle sur lequel une logique de score par IA apporte quelque chose qu'un filtre ne peut pas reproduire : au lieu d'éliminer un prospect dès qu'un critère sort de la fourchette, elle évalue l'ensemble du dossier — écart de budget, marge de négociation probable, cohérence du projet — et attribue un score qui reflète la probabilité réelle de conversion plutôt qu'une correspondance parfaite ou nulle." },
      { cta: {
        text: "C'est le principe d'ImmoFlash : il ne remplace pas le CRM de l'agence, il s'ajoute par-dessus comme couche de rapprochement — chaque bien est comparé à tout le portefeuille de prospects, avec un score sur 100 et l'argumentaire qui va avec.",
        label: 'Voir comment ça fonctionne',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'ia-agent-immobilier-usages-concrets',
    category: 'Outils & IA',
    title: "IA pour agent immobilier : 7 usages concrets qui font gagner du temps",
    excerpt: "Au-delà du discours marketing, sept usages de l'intelligence artificielle réellement adoptés par les agences en 2026 — et ce qu'elle ne fait toujours pas à la place de l'agent.",
    metaDescription: "7 usages concrets de l'intelligence artificielle pour un agent immobilier en 2026 : rédaction d'annonces, matching, emails, assistant sur le portefeuille. Sans le battage marketing.",
    date: '2026-07-25',
    readTime: '6 min',
    content: [
      { p: "L'intelligence artificielle est devenue un argument commercial sur à peu près tous les logiciels immobiliers, ce qui rend difficile de distinguer ce qui fait réellement gagner du temps de ce qui relève de l'habillage marketing. Voici sept usages concrets, adoptés par des agences dans leur pratique quotidienne — pas des promesses de laboratoire." },

      { h2: "1. Rédaction d'annonces" },
      { p: "À partir des caractéristiques d'un bien (surface, pièces, points forts notés par l'agent), générer une première version de texte d'annonce cohérente et sans faute. L'agent relit, ajuste le ton, ajoute ce qui ne peut venir que d'une visite réelle — mais part d'une base rédigée plutôt que d'une page blanche." },

      { h2: '2. Matching acheteur-bien par score' },
      { p: "Comparer un bien à l'ensemble des prospects acheteurs actifs et attribuer un score de correspondance, plutôt qu'un filtre strict qui élimine dès qu'un critère sort de la fourchette (voir notre article sur le rapprochement acquéreurs-biens)." },

      { h2: "3. Génération d'emails de proposition personnalisés" },
      { p: "Pour chaque correspondance identifiée, rédiger un email qui explique concrètement pourquoi ce bien précis correspond à ce prospect précis — budget, critères respectés, points d'attention — plutôt qu'un email générique envoyé à toute une liste." },

      { h2: "4. Assistant conversationnel sur le portefeuille" },
      { p: "Pouvoir poser une question en langage naturel — \"j'ai rentré un T3 à 245 000 € ce matin, qui parmi mes prospects pourrait être intéressé ?\" — et obtenir une réponse construite à partir des données réelles du portefeuille, sans reconstruire manuellement une recherche par filtres." },

      { h2: "5. Estimation assistée" },
      { p: "Croiser automatiquement les transactions comparables disponibles pour proposer une fourchette de prix de départ. Cela reste une aide au diagnostic, pas une estimation finale : l'état réel du bien, sa visite et le contexte local restent le jugement de l'agent." },

      { h2: "6. Tri et priorisation des leads entrants" },
      { p: "Quand les demandes arrivent en volume (portail d'annonces, formulaire de site), un premier tri automatique par pertinence évite qu'un lead qualifié attende plusieurs jours simplement parce qu'il est arrivé au milieu d'un pic de demandes moins abouties." },

      { h2: "7. Rapports et synthèses automatiques" },
      { p: "Générer un rapport mensuel d'activité (biens traités, matchings envoyés, taux de réponse) sans reconstruire un tableau à la main chaque fin de mois — utile pour le suivi interne comme pour rendre compte à un mandant en gestion multi-bureaux." },

      { h2: "Ce que l'IA ne fait pas" },
      { p: "Elle ne remplace ni la relation de confiance construite en rendez-vous, ni la négociation, ni le jugement sur un dossier complexe, ni la visite. Les agences qui en tirent le plus de bénéfice l'utilisent comme un accélérateur sur les tâches répétitives et chronophages — pas comme un substitut à l'expertise commerciale." },
      { note: "À retenir : les usages qui durent sont ceux qui font gagner du temps sur une tâche précise et vérifiable, pas ceux qui promettent de \"remplacer\" une partie du métier." },

      { cta: {
        text: "ImmoFlash couvre les usages 2, 3 et 4 de cette liste — matching, emails personnalisés et assistant conversationnel sur le portefeuille — pensés spécifiquement pour le rapprochement acquéreurs-biens en agence.",
        label: 'Découvrir le fonctionnement',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'dpe-loi-climat-biens-difficiles-vendre',
    category: 'Réglementation',
    title: 'DPE et loi Climat : quels biens deviennent difficiles à vendre',
    excerpt: "Interdiction de location des logements classés G depuis 2025, F à partir de 2028 : ce que la loi Climat et Résilience change pour un mandat de vente — et ce qu'elle ne change pas.",
    metaDescription: "Calendrier de la loi Climat et Résilience (interdiction de location des DPE G, F, E), impact réel sur la vente d'un bien et comment argumenter un mandat classé F ou G.",
    date: '2026-07-27',
    readTime: '7 min',
    content: [
      { p: "Un logement classé F ou G au DPE ne devient pas invendable au sens strict : la loi Climat et Résilience n'interdit pas sa vente, elle interdit progressivement sa mise en location. C'est une nuance importante, parce qu'elle change la nature du problème pour un mandat de vente — il ne s'agit pas d'un bien qu'on ne peut plus vendre, mais d'un bien dont le profil d'acheteur potentiel se réduit." },

      { h2: 'Le calendrier, précisément' },
      { ul: [
        "Logements classés G : interdits à la location en France métropolitaine depuis le 1er janvier 2025",
        "Logements classés F : interdits à la location à partir du 1er janvier 2028",
        "Logements classés E : interdits à la location à partir du 1er janvier 2034",
      ] },
      { p: "Ces échéances concernent la mise en location, pas la vente elle-même — un logement classé G peut être vendu et habité par son propriétaire sans restriction. Ce qui disparaît, c'est la possibilité de le mettre en location en l'état une fois l'échéance passée." },

      { h2: "Ce que ça change concrètement pour un mandat" },
      { p: "L'effet principal se lit sur le profil d'acheteur. Un investisseur qui cherche un bien locatif écarte logiquement un G proche ou déjà concerné par l'interdiction, sauf à intégrer d'emblée un budget travaux dans son calcul de rentabilité. Un bien classé F ou G se retrouve donc à devoir convaincre soit des acheteurs en résidence principale peu sensibles à cette contrainte, soit des acheteurs investisseurs qui acceptent explicitement un projet de rénovation." },
      { p: "Ce rétrécissement du public acheteur a une conséquence directe sur le délai de vente et sur la marge de négociation — pas nécessairement sur la possibilité de vendre." },

      { h2: 'Comment argumenter un bien classé F ou G sans travestir son état' },
      { p: "L'approche qui fonctionne le mieux consiste à intégrer la contrainte dans l'argumentaire plutôt qu'à l'éviter : chiffrer un ordre de grandeur de travaux de rénovation énergétique, mentionner les dispositifs d'aide existants (à vérifier au cas par cas, les barèmes évoluant régulièrement), et présenter le prix du bien en cohérence avec cet effort à prévoir. Un acheteur qui découvre la contrainte en cours de négociation la perçoit comme un problème caché ; un acheteur informé dès la visite l'intègre dans son projet." },

      { h2: 'Le DPE comme critère de matching, pas seulement comme mention légale' },
      { p: "Le classement énergétique est affiché obligatoirement dans toute annonce depuis la réforme du DPE, mais il joue aussi un rôle en amont, au moment de rapprocher un bien des prospects acheteurs : certains excluent d'emblée les DPE F et G, d'autres cherchent spécifiquement un bien à rénover pour le valoriser. Bien qualifier cette dimension du projet d'un prospect — pas seulement son budget et sa zone recherchée — évite de proposer un bien énergivore à quelqu'un qui l'exclut par principe, ou d'écarter à tort un profil qui y serait au contraire intéressé." },
      { note: "Cet article présente le cadre général de la loi Climat et Résilience. Les obligations précises (audit énergétique, dispositifs d'aide) évoluent régulièrement : vérifier la réglementation en vigueur au moment de la transaction, ou se référer à un professionnel du diagnostic." },

      { cta: {
        text: "Dans ImmoFlash, la destination du projet (résidence principale, investissement locatif, rénovation) fait partie des critères qualitatifs analysés par l'IA pour affiner le score de matching — au-delà du seul budget et de la seule localisation.",
        label: 'Voir comment ça fonctionne',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'taux-credit-immobilier-argumentaire-agence',
    category: 'Marché immobilier',
    title: "Taux de crédit immobilier : ce que leur évolution change dans votre argumentaire",
    excerpt: "Après le pic de 2023-2024, les taux de crédit se sont progressivement détendus. Ce que ce mouvement change concrètement dans la conversation avec un acheteur qui hésite.",
    metaDescription: "Comment l'évolution des taux de crédit immobilier change la capacité d'emprunt d'un acheteur, et comment en tenir compte dans l'argumentaire commercial d'une agence.",
    date: '2026-07-28',
    readTime: '6 min',
    content: [
      { p: "Les taux de crédit immobilier ont connu une hausse marquée en 2023 et 2024, suivie d'une détente progressive. Le niveau exact évolue en continu et dépend du profil de l'emprunteur, de la durée et de l'apport — il n'existe pas de chiffre unique valable pour tous les dossiers, et ce n'est pas l'objet de cet article de l'annoncer. Ce qui reste vrai, en revanche, c'est l'effet mécanique d'une variation de taux sur la capacité d'emprunt, et donc sur des dossiers qui semblaient bloqués il y a un an ou deux." },

      { h2: "Pourquoi un demi-point de taux change tout pour un dossier" },
      { p: "À mensualité constante, une baisse de taux augmente directement la capacité d'emprunt — l'ordre de grandeur généralement observé est d'environ 5 à 6 % de capacité en plus par demi-point de baisse sur un prêt long (25 ans), mais le calcul exact dépend du profil et doit être fait par un courtier ou une banque, pas approximé sur une annonce." },
      { p: "Concrètement, cela signifie qu'un prospect qui a arrêté sa recherche au moment où son projet ne passait plus, en fonction des taux du moment, mérite d'être recontacté pour recalculer sa capacité réelle aujourd'hui — pas parce que la situation a nécessairement changé de façon spectaculaire, mais parce qu'elle a pu changer suffisamment pour rouvrir un projet mis en pause." },

      { h2: "Le prospect qui a arrêté de chercher n'est pas un prospect perdu" },
      { p: "C'est un cas particulier — et fréquent — des prospects dormants évoqués dans un autre article : un dossier mis en pause pour une raison de marché (taux, prix) reste valide tant que le projet lui-même n'a pas disparu. Une simple relance qui propose de refaire le point sur la capacité d'emprunt, sans pression commerciale, rouvre souvent des dossiers qu'on croyait clos." },

      { h2: "Ce qui ne dépend pas des taux" },
      { p: "L'argumentaire sur la rareté d'un bien, sa localisation ou son état ne doit jamais se réduire à la conjoncture des taux. Un acheteur convaincu par un bien précis trouve une solution de financement adaptée à son projet ; un acheteur qui n'est convaincu par rien attend toujours \"que les taux baissent encore\", quelle que soit leur évolution réelle. Distinguer les deux évite de perdre du temps à attendre un contexte de marché plutôt qu'à avancer sur un dossier concret." },

      { h2: 'Le rôle du courtier dans la conversation' },
      { p: "Recommander un courtier tôt dans le projet, plutôt qu'au moment de l'offre, permet à l'acheteur d'arriver en visite avec une capacité d'emprunt déjà établie — ce qui accélère la décision et évite les visites de biens hors budget réel. L'agence n'a pas vocation à se substituer au courtier sur le calcul, mais gagne à structurer systématiquement cette étape dans son parcours acheteur." },
      { note: "Les taux cités dans la presse générale sont des moyennes nationales indicatives. Le taux réel d'un dossier dépend du profil de l'emprunteur, de son apport, de la durée et de la banque — toujours renvoyer vers un courtier ou une simulation bancaire pour un chiffre fiable." },

      { cta: {
        text: "Recroiser régulièrement les prospects dont le projet était \"en pause\" avec les nouveaux biens qui entrent au catalogue est l'un des usages concrets d'ImmoFlash : le portefeuille entier est réévalué à chaque nouvelle entrée, pas seulement les dossiers les plus récents.",
        label: 'Voir comment ça fonctionne',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'relancer-prospect-immobilier-sans-braquer',
    category: 'Prospection',
    title: 'Comment relancer un prospect acheteur sans le braquer : la méthode en 4 étapes',
    excerpt: "Trop de relances tuent la relance. Trop peu, et le prospect achète ailleurs. La méthode pour trouver le bon rythme et la bonne raison de recontacter.",
    metaDescription: "Méthode en 4 étapes pour relancer un prospect acheteur immobilier sans le braquer : raison concrète, rythme, canal, et savoir quand s'arrêter.",
    date: '2026-07-29',
    readTime: '5 min',
    content: [
      { p: "La relance est l'étape où la plupart des agences perdent en efficacité — non par manque d'effort, mais par manque de méthode. Relancer trop souvent et sans motif précis lasse le prospect ; relancer trop rarement laisse le champ libre à une agence concurrente. Quatre principes simples changent nettement le taux de réponse." },

      { h2: '1. Ne relancer qu\'avec une raison concrète' },
      { p: "\"Je me permets de revenir vers vous suite à notre dernier échange\" n'apporte aucune information nouvelle au prospect — cela ressemble à une relance de principe, pas à un suivi réel. \"Un bien qui correspond à ce que vous cherchiez vient d'entrer au catalogue\" fonctionne, parce qu'il y a une raison tangible de reprendre contact maintenant plutôt que la semaine dernière ou la semaine prochaine." },

      { h2: '2. Trouver le bon rythme' },
      { p: "Il n'existe pas de fréquence universelle, mais un principe simple : la relance doit être déclenchée par un événement (nouveau bien pertinent, baisse de prix, évolution notable du marché), pas par un calendrier fixe déconnecté du dossier. Un prospect recontacté trois fois en deux semaines sans rien de nouveau à chaque fois se sent sollicité ; le même prospect recontacté trois fois sur deux mois, à chaque fois avec un bien pertinent, se sent suivi." },

      { h2: '3. Choisir le bon canal' },
      { p: "Un email qui présente un bien concret — photos, caractéristiques, argumentaire de correspondance — laisse au prospect le temps d'évaluer l'opportunité et reste consultable. Un appel à froid sans rien de visuel à l'appui fonctionne pour reprendre contact rapidement, mais convertit moins bien pour présenter une opportunité complexe. Le SMS, bref et direct, convient surtout pour signaler qu'un email vient d'être envoyé ou fixer un rendez-vous déjà convenu." },
      { note: "À retenir : le canal doit correspondre à ce qu'on a à dire. Présenter un bien mérite un support qu'on peut consulter et partager (email) ; fixer un rendez-vous déjà décidé mérite un canal rapide (SMS, appel)." },

      { h2: "4. Savoir quand arrêter" },
      { p: "Un prospect qui ne répond à aucune sollicitation depuis plusieurs relances, y compris avec des biens pertinents, envoie un signal qu'il vaut mieux respecter que forcer. Continuer à relancer au même rythme dégrade la relation et le temps investi serait mieux utilisé ailleurs. Cela ne signifie pas supprimer le dossier — un projet peut redevenir actif plus tard — mais espacer nettement le suivi jusqu'à un signal explicite de reprise d'intérêt." },

      { cta: {
        text: "ImmoFlash génère automatiquement l'email de relance à chaque correspondance identifiée entre un prospect et un nouveau bien — avec l'argumentaire concret qui justifie pourquoi ce bien précis mérite d'être proposé maintenant.",
        label: 'Voir un exemple concret',
        href: '/demarrer',
      } },
    ],
  },

  {
    slug: 'rgpd-agence-immobiliere-guide',
    category: 'Réglementation',
    title: "RGPD en agence immobilière : ce qu'il faut vraiment respecter",
    excerpt: "Base légale de la prospection, durée de conservation des fiches prospects, sous-traitants numériques : le RGPD appliqué concrètement à une agence, sans jargon juridique.",
    metaDescription: "RGPD en agence immobilière : base légale de la prospection, durée de conservation des fiches prospects, obligations vis-à-vis des logiciels utilisés (CRM, IA). Guide pratique.",
    date: '2026-07-30',
    readTime: '7 min',
    content: [
      { p: "Le RGPD est souvent perçu en agence comme une contrainte abstraite, gérée une fois puis oubliée. En pratique, il touche des décisions très concrètes du quotidien : comment justifier l'envoi d'un email à un prospect, combien de temps garder une fiche, et quelles obligations transfèrent aux logiciels utilisés. Cet article n'est pas un conseil juridique — en cas de doute sur un cas précis, la CNIL ou un avocat spécialisé reste la référence — mais il couvre les points qui reviennent le plus souvent." },

      { h2: 'La base légale de la prospection' },
      { p: "Contacter un prospect avec lequel l'agence est déjà en relation (demande de renseignement, visite, mandat de recherche) relève généralement de l'intérêt légitime : la démarche commerciale est une conséquence directe et attendue de la relation engagée. La situation est différente pour un fichier acheté ou constitué sans relation préalable — un consentement explicite est alors nécessaire avant toute sollicitation commerciale." },

      { h2: 'Combien de temps garder une fiche prospect' },
      { p: "La CNIL recommande, pour les données utilisées à des fins de prospection commerciale, une conservation de trois ans à compter du dernier contact avec la personne concernée. Passé ce délai sans interaction, la fiche doit en principe être supprimée ou anonymisée, sauf obligation légale contraire. C'est un repère utile pour structurer l'archivage plutôt que d'accumuler indéfiniment des fiches inactives." },

      { h2: 'Vos sous-traitants sont aussi votre responsabilité' },
      { p: "Tout logiciel qui traite des données personnelles pour le compte de l'agence — CRM, outil d'emailing, logiciel de matching par IA — agit comme sous-traitant au sens du RGPD. Cela implique un contrat de sous-traitance conforme à l'article 28 du règlement, qui encadre notamment la finalité du traitement, la durée de conservation et les garanties de sécurité. Une agence reste responsable du traitement même quand l'exécution technique est déléguée à un prestataire : vérifier que chaque outil utilisé fournit ce contrat n'est pas une formalité optionnelle." },
      { ul: [
        "Exiger un contrat de sous-traitance Article 28 de chaque logiciel traitant des données de prospects ou clients",
        "Vérifier où sont hébergées les données (l'hébergement en Europe simplifie la conformité, un hébergement hors UE impose des garanties supplémentaires)",
        "Limiter les données transmises à des services tiers (IA générative comprise) à ce qui est strictement nécessaire au traitement demandé",
      ] },

      { h2: 'Le droit à l\'oubli et le désabonnement' },
      { p: "Chaque email de prospection doit permettre au destinataire de s'opposer facilement à recevoir de nouvelles sollicitations — un moyen simple et visible, pas une démarche à plusieurs étapes. Au-delà de l'obligation, c'est aussi une pratique qui évite l'accumulation de contacts non désirés dans un fichier, ce qui dégrade la qualité globale du portefeuille." },

      { h2: 'Mythes à abandonner' },
      { ul: [
        "\"Il faut un DPO (délégué à la protection des données)\" — obligatoire uniquement pour les autorités publiques et les structures pratiquant un traitement à grande échelle de données sensibles ou une surveillance systématique ; ce n'est pas le cas d'une agence immobilière classique",
        "\"Un consentement signé une fois couvre tout, indéfiniment\" — un consentement doit rester spécifique à une finalité et peut être retiré à tout moment ; il ne dispense pas de respecter la durée de conservation recommandée",
        "\"Le RGPD interdit la prospection commerciale\" — non, il l'encadre ; l'intérêt légitime reste une base légale valable pour un prospect déjà en relation avec l'agence",
      ] },
      { note: "Cet article présente les principes généraux applicables à la majorité des agences. Il ne remplace pas un avis juridique sur une situation spécifique — la CNIL propose des fiches pratiques dédiées au secteur immobilier en cas de doute." },

      { cta: {
        text: "ImmoFlash applique ces principes à son propre fonctionnement : hébergement exclusivement européen, contrat de sous-traitance Article 28 fourni à chaque agence cliente, et anonymisation des critères de recherche transmis à l'IA (aucun nom, email ni téléphone ne quitte le serveur de l'agence).",
        label: 'En savoir plus',
        href: '/demarrer',
      } },
    ],
  },
]

export default blogPosts
