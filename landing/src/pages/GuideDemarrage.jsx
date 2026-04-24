import { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'

/* ── Composants internes ── */
const Step = ({ number, title, time, children }) => (
  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem' }}>
    <div style={{ flexShrink: 0 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1E3A5F, #38bdf8)',
        color: '#fff', fontWeight: 800, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {number}
      </div>
      {/* Ligne verticale */}
      <div style={{ width: 2, background: '#e2e8f0', margin: '8px auto 0', height: 'calc(100% - 56px)' }} />
    </div>
    <div style={{ flex: 1, paddingBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
        {time && (
          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
            ⏱ {time}
          </span>
        )}
      </div>
      {children}
    </div>
  </div>
)

const Tip = ({ children }) => (
  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.875rem 1rem', margin: '1rem 0', display: 'flex', gap: 10 }}>
    <span style={{ flexShrink: 0, fontSize: 16 }}>💡</span>
    <p style={{ color: '#1e40af', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{children}</p>
  </div>
)

const Warning = ({ children }) => (
  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '0.875rem 1rem', margin: '1rem 0', display: 'flex', gap: 10 }}>
    <span style={{ flexShrink: 0, fontSize: 16 }}>⚠️</span>
    <p style={{ color: '#92400e', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{children}</p>
  </div>
)

const Action = ({ children }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', margin: '1rem 0' }}>
    <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.65, margin: 0, fontFamily: 'monospace' }}>{children}</p>
  </div>
)

const P = ({ children }) => (
  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, margin: '0 0 0.75rem' }}>{children}</p>
)

const Li = ({ children }) => (
  <li style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, marginBottom: 6 }}>{children}</li>
)

/* ── Sommaire flottant ── */
const steps = [
  { id: 'compte', label: 'Créer votre compte' },
  { id: 'agence', label: 'Configurer votre agence' },
  { id: 'smtp', label: 'Configurer l\'email' },
  { id: 'biens', label: 'Importer vos biens' },
  { id: 'prospects', label: 'Ajouter vos prospects' },
  { id: 'matching', label: 'Lancer un matching' },
  { id: 'email', label: 'Envoyer une proposition' },
  { id: 'suite', label: 'La suite' },
]

export default function GuideDemarrage() {
  const [active, setActive] = useState('compte')

  useEffect(() => {
    const handleScroll = () => {
      for (const s of steps) {
        const el = document.getElementById(s.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120) setActive(s.id)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <PageLayout title="Guide de démarrage" category="Ressources">
      <P>
        Ce guide vous accompagne de la création de votre compte jusqu'à votre premier email de proposition envoyé.
        Comptez <strong>30 à 45 minutes</strong> pour tout mettre en place — avec vos vraies données.
      </P>

      {/* Progression */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '3rem' }}>
        {steps.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
              background: active === s.id ? '#1E3A5F' : '#f1f5f9',
              color: active === s.id ? '#fff' : '#64748b',
              transition: 'all 150ms',
            }}
          >
            <span style={{ fontWeight: 700 }}>{i + 1}</span> {s.label}
          </a>
        ))}
      </div>

      {/* ── Étape 1 ── */}
      <div id="compte">
        <Step number={1} title="Créer votre compte" time="2 min">
          <P>Votre compte ImmoMatch est créé par l'équipe lors de votre démo ou de votre souscription. Vous recevez un email avec vos identifiants :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Email</strong> : votre adresse professionnelle</Li>
            <Li><strong>Mot de passe</strong> : temporaire, à changer dès la première connexion</Li>
          </ul>
          <Action>→ Rendez-vous sur votre espace ImmoMatch et connectez-vous avec ces identifiants.</Action>
          <Tip>Si vous n'avez pas reçu vos identifiants, vérifiez vos spams ou écrivez à contact@immoflash.app.</Tip>
        </Step>
      </div>

      {/* ── Étape 2 ── */}
      <div id="agence">
        <Step number={2} title="Configurer votre agence" time="5 min">
          <P>Avant d'importer vos données, personnalisez l'identité de votre agence. Ces informations apparaissent dans les emails envoyés à vos prospects.</P>
          <P>Rendez-vous dans <strong>Administration → Paramètres de l'agence</strong> :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Nom de l'agence</strong> : tel qu'il apparaîtra dans les emails et rapports</Li>
            <Li><strong>Logo</strong> : format PNG ou JPG, fond transparent recommandé</Li>
            <Li><strong>Couleur principale</strong> : code hexadécimal (ex. #1E3A5F) pour l'identité visuelle des emails</Li>
            <Li><strong>Adresse et téléphone</strong> : affichés en pied des emails</Li>
          </ul>
          <Tip>Un logo de bonne qualité et une couleur cohérente avec votre charte graphique rendent vos emails de proposition nettement plus professionnels.</Tip>
        </Step>
      </div>

      {/* ── Étape 3 ── */}
      <div id="smtp">
        <Step number={3} title="Configurer l'envoi d'emails (SMTP)" time="5 min">
          <P>Pour envoyer des emails depuis votre adresse professionnelle, ImmoMatch a besoin de vos paramètres SMTP. Rendez-vous dans <strong>Administration → Configuration email</strong>.</P>

          <P><strong>Paramètres à renseigner :</strong></P>
          <div style={{ overflowX: 'auto', margin: '0 0 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Champ', 'Exemple', 'Description'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Serveur SMTP', 'smtp.gmail.com', 'Adresse du serveur sortant'],
                  ['Port', '587', 'Port TLS standard (ou 465 pour SSL)'],
                  ['Utilisateur', 'votre@agence.fr', 'Votre adresse email complète'],
                  ['Mot de passe', '••••••••', 'Mot de passe ou mot de passe d\'application'],
                  ['Nom expéditeur', 'Sophie — Agence Riviera', 'Nom affiché chez le destinataire'],
                  ['Email de réponse', 'sophie@agence.fr', 'Adresse de réponse (Reply-To)'],
                ].map(([field, ex, desc]) => (
                  <tr key={field} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>{field}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>{ex}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Warning>
            Si vous utilisez Gmail, vous devez créer un <strong>mot de passe d'application</strong> (pas votre mot de passe Google habituel).
            Allez dans : Compte Google → Sécurité → Validation en 2 étapes → Mots de passe des applications.
          </Warning>
          <Tip>Après enregistrement, ImmoMatch envoie un email de test à votre adresse. Vérifiez qu'il arrive correctement avant de passer à la suite.</Tip>
        </Step>
      </div>

      {/* ── Étape 4 ── */}
      <div id="biens">
        <Step number={4} title="Importer vos biens" time="5–10 min">
          <P>Vos biens sont le cœur d'ImmoMatch. Plus la fiche est complète, plus le matching est précis.</P>

          <P><strong>Option A — Import depuis un fichier CSV ou Excel :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Rendez-vous dans <strong>Biens → Importer</strong></Li>
            <Li>Téléchargez le modèle CSV fourni par ImmoMatch</Li>
            <Li>Remplissez-le avec vos données (référence, type, prix, surface, ville, description…)</Li>
            <Li>Importez le fichier — les biens apparaissent instantanément</Li>
          </ul>

          <P><strong>Option B — Synchronisation automatique (Hektor / logiciel métier) :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Rendez-vous dans <strong>Administration → Synchronisation</strong></Li>
            <Li>Renseignez l'URL de votre flux FTP ou XML</Li>
            <Li>La synchronisation se fait toutes les 6 heures automatiquement</Li>
          </ul>

          <P><strong>Option C — Saisie manuelle :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Cliquez sur <strong>Biens → Nouveau bien</strong></Li>
            <Li>Remplissez la fiche : type, prix, surface, pièces, ville, description, photos</Li>
            <Li>Enregistrez — le bien est disponible immédiatement pour le matching</Li>
          </ul>

          <Tip>
            Les <strong>photos</strong> sont particulièrement importantes : elles sont intégrées dans les emails de proposition.
            Ajoutez au minimum 3 photos par bien pour maximiser l'impact.
          </Tip>
          <Tip>
            La <strong>description</strong> est lue par l'IA pour l'analyse qualitative.
            Plus elle est riche (ambiance, atouts, destination idéale), plus le score est pertinent.
          </Tip>
        </Step>
      </div>

      {/* ── Étape 5 ── */}
      <div id="prospects">
        <Step number={5} title="Ajouter vos premiers prospects" time="5–10 min">
          <P>Un prospect bien qualifié donne un matching bien ciblé. Prenez 2 minutes par prospect pour renseigner les critères essentiels.</P>

          <P>Rendez-vous dans <strong>Clients → Nouveau client</strong> :</P>

          <div style={{ overflowX: 'auto', margin: '0 0 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Champ', 'Importance', 'Conseil'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Nom / Email / Téléphone', '★★★', 'Indispensable pour l\'envoi d\'email'],
                  ['Budget maximum', '★★★', 'Critère pondéré à 25 pts dans le score'],
                  ['Type de bien recherché', '★★★', 'Appartement, maison, terrain… (20 pts)'],
                  ['Ville / Zone souhaitée', '★★★', 'Critère de localisation (15 pts)'],
                  ['Surface minimum', '★★☆', 'Affine les résultats'],
                  ['Nombre de pièces', '★★☆', 'Affine les résultats'],
                  ['Notes libres', '★★☆', 'Lu par l\'IA : style de vie, urgence, destination…'],
                  ['Statut', '★☆☆', 'Actif, En attente, Archivé'],
                ].map(([field, imp, conseil]) => (
                  <tr key={field} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>{field}</td>
                    <td style={{ padding: '8px 12px', color: '#f59e0b', letterSpacing: 2 }}>{imp}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{conseil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Tip>
            Le champ <strong>Notes libres</strong> est analysé par l'IA. Notez-y ce que vous retenez de vos échanges :
            "Couple avec enfants, cherche calme, investissement locatif envisagé à terme, pas pressé avant juin."
            Ces détails font la différence dans l'analyse qualitative.
          </Tip>
        </Step>
      </div>

      {/* ── Étape 6 ── */}
      <div id="matching">
        <Step number={6} title="Lancer votre premier matching" time="1 min">
          <P>C'est le moment clé. Avec au moins 1 bien et 1 prospect dans votre base, vous pouvez lancer votre premier matching.</P>

          <P><strong>Depuis la page Matchings :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Cliquez sur <strong>Nouveau matching</strong></Li>
            <Li>Sélectionnez un prospect (ou laissez ImmoMatch analyser toute la base)</Li>
            <Li>Cliquez sur <strong>Lancer l'analyse</strong></Li>
            <Li>L'IA analyse les correspondances en quelques secondes</Li>
          </ul>

          <P><strong>Comprendre les résultats :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Score /100</strong> : adéquation globale (objectif 0–60 + qualitatif IA 0–40)</Li>
            <Li><strong>Points forts</strong> : ce qui correspond parfaitement aux critères</Li>
            <Li><strong>Points d'attention</strong> : écarts à mentionner honnêtement</Li>
            <Li><strong>Recommandation</strong> : synthèse rédigée par l'IA pour l'agent</Li>
          </ul>

          <Tip>Triez les résultats par score décroissant. Les biens au-dessus de 70/100 sont vos meilleures opportunités à traiter en priorité.</Tip>
          <Warning>Un score faible (en dessous de 40) ne signifie pas que le bien est mauvais — il signifie simplement qu'il ne correspond pas à ce prospect précis.</Warning>
        </Step>
      </div>

      {/* ── Étape 7 ── */}
      <div id="email">
        <Step number={7} title="Envoyer votre première proposition" time="2 min">
          <P>Pour chaque matching, ImmoMatch génère automatiquement un email de proposition personnalisé. Voici comment l'envoyer :</P>

          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Depuis la page de résultats du matching, cliquez sur un bien pour ouvrir sa fiche</Li>
            <Li>Cliquez sur <strong>Générer l'email</strong> — l'IA rédige le message en quelques secondes</Li>
            <Li>Relisez l'email généré (vous pouvez le modifier librement)</Li>
            <Li>Cliquez sur <strong>Envoyer</strong> — l'email part depuis votre adresse professionnelle</Li>
          </ul>

          <P><strong>Ce que contient l'email généré :</strong></P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Accroche personnalisée pour ce prospect</Li>
            <Li>Présentation du bien avec photos intégrées</Li>
            <Li>Arguments spécifiques liés aux critères du prospect</Li>
            <Li>Points d'attention mentionnés de manière transparente</Li>
            <Li>Vos coordonnées et un appel à l'action</Li>
          </ul>

          <Tip>
            L'email est généré en HTML et s'affiche correctement dans tous les clients mail (Gmail, Outlook, Apple Mail).
            Vous pouvez prévisualiser le rendu avant l'envoi.
          </Tip>
        </Step>
      </div>

      {/* ── Étape 8 ── */}
      <div id="suite">
        <Step number={8} title="La suite — aller plus loin" time="">
          <P>Félicitations — vous avez effectué votre premier cycle complet sur ImmoMatch. Voici ce que vous pouvez explorer ensuite :</P>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
            {[
              {
                title: 'Agent IA conversationnel',
                desc: 'Posez des questions en français sur votre portefeuille. "Quels prospects ont un budget > 300k à Nice ?" — réponse instantanée.',
              },
              {
                title: 'Rapports mensuels',
                desc: 'Suivez vos performances : matchings réalisés, emails envoyés, taux de conversion. Disponibles en Administration → Rapports.',
              },
              {
                title: 'Gestion des rôles',
                desc: 'Ajoutez vos agents avec des permissions adaptées (Admin ou Agent). Chaque agent voit ses propres matchings.',
              },
              {
                title: 'Archivage et relances',
                desc: 'Archivez les prospects inactifs. Consultez l\'historique des emails envoyés par prospect pour organiser vos relances.',
              },
            ].map(card => (
              <div key={card.title} style={{ background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 10, padding: '1.25rem' }}>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, margin: '0 0 0.5rem' }}>{card.title}</p>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </Step>
      </div>

      {/* CTA final */}
      <div style={{ background: '#0f1e30', borderRadius: 12, padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ fontWeight: 700, color: '#ffffff', fontSize: 18, margin: '0 0 0.5rem' }}>
          Besoin d'aide pour vous lancer ?
        </p>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 1.25rem' }}>
          Notre équipe accompagne chaque agence lors du démarrage — gratuitement, sur votre première session.
        </p>
        <a
          href="mailto:contact@immoflash.app"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', fontSize: 14 }}
        >
          Planifier ma session de démarrage
        </a>
      </div>
    </PageLayout>
  )
}
