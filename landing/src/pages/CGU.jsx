import PageLayout from '../components/PageLayout'

const S = ({ children }) => (
  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '2.5rem 0 0.75rem', letterSpacing: '-0.2px' }}>
    {children}
  </h2>
)
const P = ({ children }) => (
  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, margin: '0 0 0.75rem' }}>{children}</p>
)
const Li = ({ children }) => (
  <li style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, marginBottom: 8 }}>{children}</li>
)

export default function CGU() {
  return (
    <PageLayout title="Conditions Générales d'Utilisation" category="Légal">
      <P>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ImmoFlash, accessible à l'adresse immoflash.app, éditée par ImmoFlash.</P>
      <P>En utilisant ImmoFlash, vous acceptez sans réserve les présentes conditions.</P>

      <S>1. Description du service</S>
      <P>ImmoFlash est une plateforme SaaS (Software as a Service) permettant aux agences immobilières de :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li>Importer et gérer leur portefeuille de biens immobiliers ;</Li>
        <Li>Gérer leur base de prospects acheteurs ;</Li>
        <Li>Générer des matchings automatisés scorés entre prospects et biens ;</Li>
        <Li>Générer et envoyer des emails personnalisés ;</Li>
        <Li>Consulter des rapports et statistiques d'activité.</Li>
      </ul>

      <S>2. Accès au service</S>
      <P>L'accès à ImmoFlash est réservé aux professionnels de l'immobilier ayant souscrit à l'un des plans proposés. Un essai gratuit de 10 jours est disponible sans engagement.</P>
      <P>Chaque compte est associé à une agence. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.</P>

      <S>3. Conditions financières</S>
      <P>ImmoFlash est proposé selon trois plans tarifaires (Starter, Pro, Agence+), dont les prix et les fonctionnalités sont détaillés sur la page <a href="/#pricing" style={{ color: '#1E3A5F', fontWeight: 600 }}>Tarifs</a>.</P>
      <P>Les abonnements sont facturés mensuellement ou annuellement selon le choix de l'utilisateur. Les prix sont exprimés hors taxes. La TVA applicable est celle en vigueur au moment de la facturation.</P>
      <P>Aucun remboursement n'est accordé pour les périodes entamées, sauf disposition légale contraire.</P>

      <S>4. Obligations de l'utilisateur</S>
      <P>L'utilisateur s'engage à :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li>Utiliser ImmoFlash dans le cadre légal applicable à son activité professionnelle ;</Li>
        <Li>Ne pas partager ses identifiants avec des tiers non autorisés ;</Li>
        <Li>Ne pas tenter de contourner les mesures de sécurité de la plateforme ;</Li>
        <Li>Respecter les droits des tiers, notamment en matière de données personnelles de ses propres clients ;</Li>
        <Li>Ne pas utiliser ImmoFlash à des fins illicites, frauduleuses ou contraires aux présentes CGU.</Li>
      </ul>

      <S>5. Données utilisateurs</S>
      <P>Les données importées dans ImmoFlash (biens, prospects, coordonnées) restent la propriété de l'agence utilisatrice. ImmoFlash s'engage à ne pas les utiliser à d'autres fins que la fourniture du service.</P>
      <P>L'agence est responsable de la licéité des données qu'elle importe, notamment au regard du RGPD pour les données personnelles de ses prospects.</P>

      <S>6. Disponibilité du service</S>
      <P>ImmoFlash s'engage à maintenir le service disponible 24h/24 et 7j/7, sous réserve de maintenances programmées communiquées à l'avance. Des interruptions ponctuelles peuvent survenir pour cause de maintenance ou d'incidents techniques. ImmoFlash ne pourra être tenu responsable des conséquences d'une indisponibilité temporaire.</P>

      <S>7. Propriété intellectuelle</S>
      <P>L'ensemble des éléments constitutifs de la plateforme ImmoFlash (code, design, algorithmes, modèles d'IA, marque) sont la propriété exclusive d'ImmoFlash et sont protégés par les lois relatives à la propriété intellectuelle.</P>
      <P>L'utilisateur dispose d'un droit d'utilisation non exclusif et non transférable de la plateforme, limité à la durée de son abonnement.</P>

      <S>8. Limitation de responsabilité</S>
      <P>ImmoFlash est un outil d'aide à la décision. Les scores et recommandations générés sont fournis à titre indicatif. L'utilisateur demeure seul responsable des décisions commerciales prises sur la base des informations fournies par la plateforme.</P>
      <P>La responsabilité d'ImmoFlash ne pourra pas être engagée pour des pertes commerciales indirectes liées à l'utilisation ou à la non-utilisation du service.</P>

      <S>9. Résiliation</S>
      <P>L'utilisateur peut résilier son abonnement à tout moment depuis son espace de compte. La résiliation prend effet à la fin de la période de facturation en cours.</P>
      <P>ImmoFlash se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement.</P>

      <S>10. Modification des CGU</S>
      <P>ImmoFlash se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont informés par email de toute modification substantielle. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.</P>

      <S>11. Droit applicable</S>
      <P>Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux français.</P>

      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: '3rem', fontStyle: 'italic' }}>
        Dernière mise à jour : avril 2026
      </p>
    </PageLayout>
  )
}
