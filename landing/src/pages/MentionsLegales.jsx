import PageLayout from '../components/PageLayout'

const S = ({ children }) => (
  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '2.5rem 0 0.75rem', letterSpacing: '-0.2px' }}>
    {children}
  </h2>
)
const P = ({ children }) => (
  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, margin: '0 0 0.75rem' }}>{children}</p>
)

export default function MentionsLegales() {
  return (
    <PageLayout title="Mentions légales" category="Légal">
      <P>Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, les informations suivantes sont portées à la connaissance des utilisateurs du site ImmoMatch.</P>

      <S>Éditeur du site</S>
      <P>
        <strong>Bendiaf Noa</strong><br />
        Entrepreneur Individuel<br />
        Nom commercial : Nowa<br />
        8 Impasse des Sangliers<br />
        83440 Montauroux — France<br /><br />
        SIRET : 990 077 331 00017<br />
        SIREN : 990 077 331<br />
        Code APE : 6201Z — Programmation informatique<br />
        Immatriculé au Registre National des Entreprises depuis le 06/08/2025<br /><br />
        Email : <a href="mailto:contact@immowatch.fr" style={{ color: '#1E3A5F', fontWeight: 600 }}>contact@immowatch.fr</a>
      </P>

      <S>Directeur de la publication</S>
      <P>Bendiaf Noa — contact@immowatch.fr</P>

      <S>Hébergement</S>
      <P>
        Le site ImmoMatch est hébergé par :<br />
        <strong>Hetzner Online GmbH</strong><br />
        Industriestr. 25<br />
        91710 Gunzenhausen — Allemagne<br />
        <a href="https://www.hetzner.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: 600 }}>www.hetzner.com</a>
      </P>

      <S>Propriété intellectuelle</S>
      <P>
        L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, algorithmes…) est la propriété exclusive de Bendiaf Noa / ImmoMatch, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
      </P>
      <P>
        Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de l'éditeur.
      </P>

      <S>Données personnelles</S>
      <P>
        Les informations recueillies sur ce site font l'objet d'un traitement informatique destiné à la gestion des demandes de démonstration et à la relation commerciale. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.
      </P>
      <P>
        Pour exercer ces droits : <a href="mailto:contact@immowatch.fr" style={{ color: '#1E3A5F', fontWeight: 600 }}>contact@immowatch.fr</a>
      </P>
      <P>
        Pour plus d'informations, consultez notre{' '}
        <a href="/confidentialite" style={{ color: '#1E3A5F', fontWeight: 600 }}>Politique de confidentialité</a>.
      </P>

      <S>Cookies</S>
      <P>
        Ce site utilise des cookies à des fins de fonctionnement et d'analyse d'audience.{' '}
        <a href="/cookies" style={{ color: '#1E3A5F', fontWeight: 600 }}>En savoir plus</a>.
      </P>

      <S>Droit applicable et juridiction</S>
      <P>
        Tout litige en relation avec l'utilisation du site ImmoMatch est soumis au droit français. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents.
      </P>

      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: '3rem', fontStyle: 'italic' }}>
        Dernière mise à jour : avril 2026
      </p>
    </PageLayout>
  )
}
