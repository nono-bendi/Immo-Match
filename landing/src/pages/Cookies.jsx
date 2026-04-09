import PageLayout from '../components/PageLayout'

const S = ({ children }) => (
  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '2.5rem 0 0.75rem', letterSpacing: '-0.2px' }}>
    {children}
  </h2>
)
const P = ({ children }) => (
  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, margin: '0 0 0.75rem' }}>{children}</p>
)

const cookieTable = [
  { name: 'Session (JWT)', type: 'Fonctionnel', purpose: 'Maintien de la session utilisateur authentifiée', duration: 'Durée de la session', tiers: 'Non' },
  { name: 'Préférences', type: 'Fonctionnel', purpose: 'Mémorisation des préférences d\'affichage', duration: '12 mois', tiers: 'Non' },
  { name: 'Analyse', type: 'Analytique', purpose: 'Mesure d\'audience anonymisée (pages vues, parcours)', duration: '13 mois', tiers: 'Possible' },
]

export default function Cookies() {
  return (
    <PageLayout title="Politique de cookies" category="Légal">
      <P>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, mobile, tablette) lors de la visite d'un site. Il permet de mémoriser des informations relatives à votre navigation.</P>
      <P>Cette page explique quels cookies ImmoMatch utilise, pourquoi, et comment vous pouvez les gérer.</P>

      <S>Cookies utilisés</S>
      <div style={{ overflowX: 'auto', margin: '0 0 1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Nom', 'Type', 'Finalité', 'Durée', 'Tiers'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookieTable.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: row.type === 'Fonctionnel' ? '#eff6ff' : '#fef9c3',
                    color: row.type === 'Fonctionnel' ? '#1E3A5F' : '#92400e',
                  }}>
                    {row.type}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>{row.purpose}</td>
                <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{row.duration}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>{row.tiers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <S>Cookies strictement nécessaires</S>
      <P>Ces cookies sont indispensables au fonctionnement de la plateforme ImmoMatch (authentification, sécurité, préférences essentielles). Ils ne peuvent pas être désactivés sans empêcher l'utilisation du service.</P>

      <S>Cookies analytiques</S>
      <P>Ces cookies nous permettent de mesurer l'audience de notre site et d'améliorer l'expérience utilisateur. Les données collectées sont anonymisées — elles ne permettent pas de vous identifier personnellement.</P>
      <P>Conformément aux recommandations de la CNIL, nous utilisons ces cookies sans recueillir votre consentement préalable dès lors qu'ils servent exclusivement à la production de statistiques anonymes.</P>

      <S>Cookies tiers</S>
      <P>ImmoMatch ne dépose pas de cookies publicitaires ou de tracking de tiers à des fins commerciales.</P>

      <S>Comment gérer vos cookies</S>
      <P>Vous pouvez à tout moment configurer votre navigateur pour refuser ou supprimer les cookies. La procédure varie selon le navigateur :</P>
      <ul style={{ paddingLeft: 20, margin: '0 0 1rem', color: '#475569', fontSize: 15, lineHeight: 1.75 }}>
        <li style={{ marginBottom: 6 }}>
          <strong>Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies et autres données des sites
        </li>
        <li style={{ marginBottom: 6 }}>
          <strong>Firefox</strong> : Paramètres → Vie privée et sécurité → Cookies et données du site
        </li>
        <li style={{ marginBottom: 6 }}>
          <strong>Safari</strong> : Préférences → Confidentialité → Gérer les données du site web
        </li>
        <li>
          <strong>Edge</strong> : Paramètres → Cookies et autorisations du site → Cookies et données du site
        </li>
      </ul>
      <P>Attention : la désactivation de certains cookies peut affecter le fonctionnement de la plateforme ImmoMatch.</P>

      <S>Droit applicable</S>
      <P>Cette politique est conforme aux recommandations de la Commission Nationale de l'Informatique et des Libertés (CNIL) et au Règlement Général sur la Protection des Données (RGPD).</P>
      <P>
        Pour toute question, contactez-nous à{' '}
        <a href="mailto:contact@immowatch.fr" style={{ color: '#1E3A5F', fontWeight: 600 }}>contact@immowatch.fr</a>.
      </P>

      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: '3rem', fontStyle: 'italic' }}>
        Dernière mise à jour : avril 2026
      </p>
    </PageLayout>
  )
}
