/* ── Données FAQ — source unique ──────────────────────────────────────────────
   Utilisées par la page /faq (accordéon) ET par prerender.mjs (JSON-LD FAQPage).
   Les réponses doivent rester factuelles et autoporteuses : elles sont citées
   telles quelles par les moteurs de réponse IA (ChatGPT, Perplexity, etc.). */

const faqs = [
  {
    section: 'Le produit',
    items: [
      {
        q: 'Qu\'est-ce qu\'ImmoFlash exactement ?',
        a: 'ImmoFlash est un logiciel SaaS conçu pour les agences immobilières. Il analyse automatiquement votre portefeuille de biens et votre base de prospects pour générer des correspondances précises — avec un score de 0 à 100, une analyse argumentée, et un email de proposition personnalisé. L\'objectif : trouver le bon acheteur pour chaque bien, sans y passer des heures.',
      },
      {
        q: 'Quelle est la différence entre ImmoFlash et le matching de mon CRM immobilier ?',
        a: 'Le matching natif d\'un CRM immobilier fonctionne par filtres stricts : si un bien dépasse le budget de 5 % ou a une pièce de moins que demandé, il n\'apparaît jamais. ImmoFlash utilise une logique floue propulsée par l\'IA : il évalue chaque paire prospect-bien sur des critères objectifs (budget, localisation, surface, pièces) et qualitatifs (notes libres, destination du projet, DPE), puis attribue un score sur 100 avec une analyse argumentée. Il détecte ainsi les opportunités qu\'un filtre strict élimine. ImmoFlash ne remplace pas votre CRM : il s\'ajoute par-dessus, comme couche d\'intelligence dédiée au rapprochement acquéreurs-biens.',
      },
      {
        q: 'Comment fonctionne le score /100 ?',
        a: 'Le score ImmoFlash est calculé en deux parties. Une partie objective (60 points maximum) évalue l\'adéquation sur des critères mesurables : budget par rapport au prix du bien, type de bien recherché, localisation souhaitée, surface, nombre de pièces. Une partie qualitative (40 points maximum) est générée par l\'IA : elle analyse les notes libres sur le prospect, le DPE, la destination prévue (résidence principale, investissement, rénovation) et d\'autres signaux contextuels. Le total donne une vision immédiate des meilleures opportunités à traiter en priorité.',
      },
      {
        q: 'L\'IA peut-elle se tromper ?',
        a: 'ImmoFlash est un assistant, pas un décideur. Il propose des scores et des analyses — c\'est l\'agent qui choisit ce qu\'il fait de ces informations. Le système limite les biais grâce à son approche hybride (règles objectives + IA qualitative). Plus vous l\'utilisez, plus il s\'affine. En pratique, les agents constatent rapidement que les opportunités remontées correspondent à ce qu\'ils auraient identifié eux-mêmes — mais en quelques secondes plutôt qu\'en plusieurs heures.',
      },
    ],
  },
  {
    section: 'Mise en place',
    items: [
      {
        q: 'ImmoFlash est-il compatible avec Hektor ou Primmo ?',
        a: 'Oui. ImmoFlash synchronise automatiquement le catalogue de biens depuis les logiciels Hektor et Primmo, avec une mise à jour toutes les 6 heures. Pour les autres logiciels métier, l\'import se fait en quelques minutes depuis un fichier Excel ou CSV. Dans tous les cas, vous conservez votre logiciel actuel : ImmoFlash vient en complément.',
      },
      {
        q: 'Combien de temps prend la mise en place ?',
        a: 'La plupart des agences sont opérationnelles en moins de 24 heures. L\'import de vos biens (Excel, CSV ou synchronisation directe) prend en général moins de 10 minutes. La création de vos premiers prospects est guidée. Lors de votre démo, nous le faisons ensemble avec vos données réelles pour que vous voyiez immédiatement les résultats.',
      },
      {
        q: 'Est-ce que je dois changer mes outils actuels ?',
        a: 'Non. ImmoFlash s\'intègre à votre flux de travail existant. Vous continuez à utiliser votre logiciel métier pour la gestion courante — ImmoFlash ajoute simplement une couche d\'intelligence pour le matching. L\'import se fait depuis Excel, CSV ou via synchronisation directe selon votre logiciel.',
      },
      {
        q: 'Faut-il former toute l\'équipe ?',
        a: 'La prise en main est rapide — la plupart des agents sont autonomes après une session de 2 heures. Nous accompagnons chaque agence lors du démarrage. Le support est inclus dans tous les plans. L\'interface a été conçue avec un seul objectif : qu\'un agent immobilier puisse l\'utiliser sans formation technique longue.',
      },
    ],
  },
  {
    section: 'Fonctionnalités',
    items: [
      {
        q: 'Les emails générés sont-ils vraiment personnalisés ?',
        a: 'Oui. Chaque email est généré spécifiquement pour la paire prospect / bien concernée. Il met en avant les points forts qui correspondent aux critères du prospect, mentionne les points d\'attention de manière honnête, et utilise un ton adapté. Le résultat est un email HTML de qualité, prêt à envoyer — ou à relire et ajuster en 30 secondes.',
      },
      {
        q: 'Puis-je envoyer les emails directement depuis ImmoFlash ?',
        a: 'Oui. ImmoFlash inclut un module d\'envoi email configuré avec les paramètres SMTP de votre agence. Les emails partent depuis votre adresse, avec votre identité visuelle. Un historique des envois est conservé par prospect.',
      },
      {
        q: 'Qu\'est-ce que l\'assistant IA conversationnel ?',
        a: 'C\'est une interface de dialogue intégrée qui vous permet d\'interroger votre portefeuille en langage naturel. Exemples : "Quels prospects ont un budget entre 200k et 300k à Nice ?", "Montre-moi les biens disponibles avec plus de 3 pièces", "Génère un email pour ce prospect et ce bien". Vous n\'avez pas besoin de naviguer dans des menus — vous posez la question, ImmoFlash répond.',
      },
      {
        q: 'Y a-t-il des rapports et des statistiques ?',
        a: 'Oui. ImmoFlash génère des rapports mensuels HTML avec les statistiques de votre agence : nombre de matchings réalisés, taux de conversion, mails envoyés, activité par agent. Ces rapports sont disponibles en téléchargement et peuvent être partagés avec votre direction.',
      },
    ],
  },
  {
    section: 'Tarifs & engagement',
    items: [
      {
        q: 'Combien coûte ImmoFlash ?',
        a: 'ImmoFlash propose trois plans, sans engagement : Essentiel à 49 € HT/mois (1 utilisateur, 20 matchings IA par mois), Pro à 89 € HT/mois (jusqu\'à 3 agents, matchings et emails illimités) et Réseau à 179 € HT/mois (jusqu\'à 10 agents, questions à l\'agent IA illimitées). Un essai gratuit de 10 jours est disponible, sans carte bancaire, avec toutes les fonctionnalités du plan Pro.',
      },
      {
        q: 'Y a-t-il un engagement minimum ?',
        a: 'Nos plans sont disponibles au mois, sans engagement minimum. Vous pouvez passer à un plan supérieur ou inférieur à tout moment. Un engagement annuel est possible et permet de bénéficier d\'un tarif préférentiel — contactez-nous pour en discuter.',
      },
      {
        q: 'Comment fonctionne l\'essai gratuit ?',
        a: 'L\'essai dure 10 jours, sans carte bancaire. Pendant cette période, vous avez accès à toutes les fonctionnalités du plan Pro avec vos données réelles. À l\'issue de l\'essai, vous choisissez le plan adapté ou vous nous contactez pour prolonger si vous avez besoin de plus de temps.',
      },
      {
        q: 'Que se passe-t-il si je dépasse le quota de matchings ?',
        a: 'Sur le plan Essentiel, au-delà des 20 matchings inclus, vous pouvez passer au plan Pro à tout moment. Nous vous prévenons par email avant d\'atteindre la limite — aucune interruption de service ne survient sans votre accord.',
      },
      {
        q: 'Une vente couvre-t-elle vraiment l\'abonnement ?',
        a: 'Dans l\'immense majorité des cas, oui. Une commission moyenne sur une vente immobilière en France représente plusieurs milliers d\'euros. Notre plan Pro est à 89 € HT par mois — soit environ 1 070 € par an. Si ImmoFlash permet à votre agence de conclure une vente supplémentaire dans l\'année grâce à un rapprochement qu\'elle aurait raté, l\'investissement est largement amorti.',
      },
    ],
  },
  {
    section: 'Données & sécurité',
    items: [
      {
        q: 'Mes données sont-elles sécurisées ?',
        a: 'Les données de votre agence sont stockées dans une base de données isolée — chaque agence dispose de sa propre instance, séparée des autres. Les accès sont protégés par authentification JWT. Toutes les communications sont chiffrées (HTTPS). Nous n\'utilisons pas vos données pour entraîner des modèles ou les transmettre à des tiers.',
      },
      {
        q: 'Qui a accès aux données de mon agence ?',
        a: 'Uniquement les utilisateurs que vous créez dans votre espace ImmoFlash. Les rôles (Admin, Agent) permettent de définir les niveaux d\'accès. L\'équipe ImmoFlash peut accéder aux données en cas de demande de support technique, avec votre accord explicite.',
      },
      {
        q: 'Que se passe-t-il si j\'arrête mon abonnement ?',
        a: 'Vos données restent accessibles pendant 30 jours après la fin de votre abonnement, le temps de les exporter si besoin. Après cette période, elles sont supprimées définitivement. Nous vous fournissons un export complet en CSV sur simple demande.',
      },
    ],
  },
]

export default faqs
