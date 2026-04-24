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

export default function Confidentialite() {
  return (
    <PageLayout title="Politique de confidentialité" category="Légal">
      <P>ImmoFlash attache une grande importance à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, comment nous les utilisons, et quels sont vos droits.</P>
      <P>Elle s'applique à toute personne utilisant la plateforme ImmoFlash ou contactant ImmoFlash via notre site.</P>

      <S>1. Responsable du traitement</S>
      <P>
        Le responsable du traitement des données collectées via ImmoFlash est l'éditeur du site.
        Contact : <a href="mailto:contact@immoflash.app" style={{ color: '#1E3A5F', fontWeight: 600 }}>contact@immoflash.app</a>
      </P>

      <S>2. Données collectées</S>
      <P>Nous collectons les données suivantes :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li><strong>Données de compte</strong> : nom, prénom, email professionnel, nom de l'agence, lors de la création d'un compte ou d'une demande de démo.</Li>
        <Li><strong>Données d'utilisation</strong> : pages visitées, fonctionnalités utilisées, matchings réalisés, logs de connexion — à des fins d'amélioration du service et de sécurité.</Li>
        <Li><strong>Données de contact</strong> : messages envoyés via le formulaire de contact ou par email.</Li>
        <Li><strong>Données de facturation</strong> : pour la gestion des abonnements (traitées via notre prestataire de paiement sécurisé).</Li>
      </ul>
      <P>Nous ne collectons aucune donnée sensible au sens de l'article 9 du RGPD.</P>

      <S>3. Données des prospects de vos agences</S>
      <P>Les données de prospects et de biens que vous importez dans ImmoFlash restent sous votre responsabilité en tant que responsable de traitement. ImmoFlash agit en qualité de sous-traitant au sens du RGPD pour ces données.</P>
      <P>En tant qu'agence utilisatrice, vous êtes responsable d'informer vos prospects de l'existence d'un traitement automatisé de leurs données et de recueillir leur consentement si nécessaire.</P>

      <S>4. Finalités du traitement</S>
      <P>Vos données sont utilisées pour :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li>Créer et gérer votre compte ImmoFlash ;</Li>
        <Li>Fournir les fonctionnalités de la plateforme (matching, génération d'emails, rapports) ;</Li>
        <Li>Vous envoyer des communications relatives à votre abonnement et au service ;</Li>
        <Li>Améliorer le produit et assurer sa sécurité ;</Li>
        <Li>Respecter nos obligations légales.</Li>
      </ul>

      <S>5. Base légale des traitements</S>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li><strong>Exécution du contrat</strong> : pour la gestion de votre compte et la fourniture du service ;</Li>
        <Li><strong>Intérêt légitime</strong> : pour l'amélioration du service et la sécurité ;</Li>
        <Li><strong>Consentement</strong> : pour les communications marketing (vous pouvez vous désabonner à tout moment) ;</Li>
        <Li><strong>Obligation légale</strong> : pour la conservation des données de facturation.</Li>
      </ul>

      <S>6. Durée de conservation</S>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li><strong>Données de compte actif</strong> : pendant la durée de l'abonnement + 30 jours après résiliation ;</Li>
        <Li><strong>Données de facturation</strong> : 10 ans (obligation légale) ;</Li>
        <Li><strong>Données de contact</strong> : 3 ans après le dernier contact.</Li>
      </ul>

      <S>7. Partage des données</S>
      <P>ImmoFlash ne vend, ne loue et ne partage pas vos données personnelles à des tiers à des fins commerciales.</P>
      <P>Vos données peuvent être partagées avec :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li><strong>Anthropic (Claude AI)</strong> : pour la génération d'analyses qualitatives et d'emails. Les données transmises sont anonymisées et ne servent pas à l'entraînement de modèles selon les conditions d'utilisation de l'API.</Li>
        <Li><strong>Notre hébergeur</strong> : pour le stockage des données.</Li>
        <Li><strong>Notre prestataire de paiement</strong> : pour la gestion des abonnements.</Li>
      </ul>
      <P>Tous nos sous-traitants sont soumis à des obligations contractuelles de confidentialité et de sécurité.</P>

      <S>8. Sécurité</S>
      <P>Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données : chiffrement des communications (HTTPS/TLS), isolation des bases de données par agence, authentification sécurisée (JWT), sauvegardes régulières.</P>

      <S>9. Vos droits</S>
      <P>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 0.75rem' }}>
        <Li><strong>Droit d'accès</strong> : obtenir une copie de vos données ;</Li>
        <Li><strong>Droit de rectification</strong> : corriger des données inexactes ;</Li>
        <Li><strong>Droit à l'effacement</strong> : demander la suppression de vos données ;</Li>
        <Li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré ;</Li>
        <Li><strong>Droit d'opposition</strong> : vous opposer à certains traitements ;</Li>
        <Li><strong>Droit à la limitation</strong> : demander la suspension temporaire d'un traitement.</Li>
      </ul>
      <P>
        Pour exercer ces droits, contactez-nous à{' '}
        <a href="mailto:contact@immoflash.app" style={{ color: '#1E3A5F', fontWeight: 600 }}>contact@immoflash.app</a>.
        Nous répondons dans un délai maximum d'un mois.
      </P>
      <P>
        Vous avez également le droit d'introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: 600 }}>www.cnil.fr</a>).
      </P>

      <S>10. Cookies</S>
      <P>
        Pour toute information sur les cookies utilisés par ce site, consultez notre{' '}
        <a href="/cookies" style={{ color: '#1E3A5F', fontWeight: 600 }}>Politique de cookies</a>.
      </P>

      <S>11. Modifications</S>
      <P>Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par email ou via une notification sur la plateforme.</P>

      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: '3rem', fontStyle: 'italic' }}>
        Dernière mise à jour : avril 2026
      </p>
    </PageLayout>
  )
}
