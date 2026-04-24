import { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import { Link } from 'react-router-dom'

/* ── Composants ── */
const H2 = ({ id, children }) => (
  <h2 id={id} style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '3rem 0 1rem', letterSpacing: '-0.4px', scrollMarginTop: 80 }}>
    {children}
  </h2>
)
const H3 = ({ id, children }) => (
  <h3 id={id} style={{ fontSize: 17, fontWeight: 700, color: '#1E3A5F', margin: '2rem 0 0.75rem', scrollMarginTop: 80 }}>
    {children}
  </h3>
)
const P = ({ children }) => (
  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.8, margin: '0 0 0.75rem' }}>{children}</p>
)
const Li = ({ children }) => (
  <li style={{ color: '#475569', fontSize: 15, lineHeight: 1.8, marginBottom: 6 }}>{children}</li>
)
const Badge = ({ color = '#eff6ff', text = '#1E3A5F', children }) => (
  <span style={{ background: color, color: text, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>
    {children}
  </span>
)
const Code = ({ children }) => (
  <code style={{ background: '#f1f5f9', color: '#334155', fontSize: 13, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
    {children}
  </code>
)
const Field = ({ name, type, req, desc }) => (
  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, color: '#1E3A5F', fontWeight: 600 }}>{name}</td>
    <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 13 }}>{type}</td>
    <td style={{ padding: '8px 12px' }}>
      {req === 'oui'
        ? <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 700 }}>Requis</span>
        : <span style={{ color: '#94a3b8', fontSize: 12 }}>Optionnel</span>}
    </td>
    <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 14 }}>{desc}</td>
  </tr>
)
const TableHead = () => (
  <thead>
    <tr style={{ background: '#f8fafc' }}>
      {['Champ', 'Type', 'Requis', 'Description'].map(h => (
        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#0f172a', fontSize: 13, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
      ))}
    </tr>
  </thead>
)

/* ── Sommaire ── */
const toc = [
  { id: 'apercu',      label: 'Vue d\'ensemble' },
  { id: 'biens',       label: 'Gestion des biens',      sub: [
    { id: 'biens-champs',   label: 'Champs disponibles' },
    { id: 'biens-import',   label: 'Import CSV / Sync' },
    { id: 'biens-statuts',  label: 'Statuts et archivage' },
  ]},
  { id: 'prospects',   label: 'Gestion des prospects',  sub: [
    { id: 'prospects-champs',  label: 'Champs disponibles' },
    { id: 'prospects-statuts', label: 'Statuts' },
  ]},
  { id: 'matching',    label: 'Le matching IA',          sub: [
    { id: 'matching-score',  label: 'Score /100 expliqué' },
    { id: 'matching-lancer', label: 'Lancer un matching' },
    { id: 'matching-resultats', label: 'Lire les résultats' },
  ]},
  { id: 'emails',      label: 'Emails IA',               sub: [
    { id: 'emails-generer', label: 'Générer un email' },
    { id: 'emails-smtp',    label: 'Configuration SMTP' },
  ]},
  { id: 'agent',       label: 'Agent IA conversationnel' },
  { id: 'rapports',    label: 'Rapports et analytics' },
  { id: 'admin',       label: 'Administration',          sub: [
    { id: 'admin-roles',   label: 'Rôles et permissions' },
    { id: 'admin-agence',  label: 'Paramètres agence' },
  ]},
  { id: 'depannage',   label: 'Dépannage' },
]

export default function Documentation() {
  const [activeId, setActiveId] = useState('apercu')

  useEffect(() => {
    const allIds = toc.flatMap(s => [s.id, ...(s.sub || []).map(x => x.id)])
    const handleScroll = () => {
      for (const id of [...allIds].reverse()) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveId(id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <PageLayout title="Documentation" category="Ressources">
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* ── Sidebar TOC ── */}
        <nav style={{ position: 'sticky', top: 80 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Sommaire
          </p>
          {toc.map(section => (
            <div key={section.id} style={{ marginBottom: 4 }}>
              <a
                href={`#${section.id}`}
                style={{
                  display: 'block', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                  color: activeId === section.id ? '#1E3A5F' : '#64748b',
                  background: activeId === section.id ? '#eff6ff' : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                {section.label}
              </a>
              {section.sub?.map(sub => (
                <a
                  key={sub.id}
                  href={`#${sub.id}`}
                  style={{
                    display: 'block', padding: '3px 8px 3px 20px', borderRadius: 6, fontSize: 12,
                    textDecoration: 'none',
                    color: activeId === sub.id ? '#1E3A5F' : '#94a3b8',
                    background: activeId === sub.id ? '#eff6ff' : 'transparent',
                    transition: 'all 150ms',
                  }}
                >
                  {sub.label}
                </a>
              ))}
            </div>
          ))}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <Link to="/guide-de-demarrage" style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
              → Guide de démarrage
            </Link>
          </div>
        </nav>

        {/* ── Contenu ── */}
        <div>

          {/* ═══ VUE D'ENSEMBLE ═══ */}
          <H2 id="apercu">Vue d'ensemble</H2>
          <P>ImmoFlash est organisé autour de trois entités principales : les <strong>biens</strong>, les <strong>prospects</strong> et les <strong>matchings</strong>. Tout le reste — emails, rapports, agent IA — gravite autour de ces trois piliers.</P>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', margin: '1.25rem 0' }}>
            {[
              { emoji: '🏠', title: 'Biens', desc: 'Votre portefeuille immobilier' },
              { emoji: '👤', title: 'Prospects', desc: 'Vos acheteurs et leurs critères' },
              { emoji: '🎯', title: 'Matchings', desc: 'Correspondances scorées par l\'IA' },
              { emoji: '✉️', title: 'Emails IA', desc: 'Propositions générées auto.' },
              { emoji: '💬', title: 'Agent IA', desc: 'Interface conversationnelle' },
              { emoji: '📊', title: 'Rapports', desc: 'Analytics et performances' },
            ].map(c => (
              <div key={c.title} style={{ background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.emoji}</div>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, margin: '0 0 3px' }}>{c.title}</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* ═══ BIENS ═══ */}
          <H2 id="biens">Gestion des biens</H2>
          <P>Un bien représente un actif immobilier de votre portefeuille — en vente ou en location. Plus la fiche est complète, plus le score de matching est précis.</P>

          <H3 id="biens-champs">Champs disponibles</H3>
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <TableHead />
              <tbody>
                <Field name="reference"    type="texte"    req="oui" desc="Référence interne unique (ex. REF-2024-001)" />
                <Field name="type_bien"    type="enum"     req="oui" desc="Appartement, Maison, Terrain, Commerce, Parking…" />
                <Field name="prix"         type="nombre"   req="oui" desc="Prix de vente en euros (hors honoraires)" />
                <Field name="surface"      type="nombre"   req="non" desc="Surface habitable en m²" />
                <Field name="nb_pieces"    type="nombre"   req="non" desc="Nombre de pièces principales" />
                <Field name="nb_chambres"  type="nombre"   req="non" desc="Nombre de chambres" />
                <Field name="ville"        type="texte"    req="oui" desc="Ville du bien" />
                <Field name="code_postal"  type="texte"    req="non" desc="Code postal (5 chiffres)" />
                <Field name="adresse"      type="texte"    req="non" desc="Adresse complète (pour usage interne uniquement)" />
                <Field name="dpe"          type="enum"     req="non" desc="Classe énergétique A à G — influencée l'analyse IA" />
                <Field name="description"  type="texte long" req="non" desc="Description commerciale — lue par l'IA pour l'analyse qualitative" />
                <Field name="photos"       type="URLs"     req="non" desc="URLs des photos (séparées par |) — intégrées dans les emails" />
                <Field name="stationnement" type="booléen" req="non" desc="Présence d'un garage ou parking" />
                <Field name="statut"       type="enum"     req="non" desc="Actif, Vendu, Archivé (défaut : Actif)" />
              </tbody>
            </table>
          </div>

          <H3 id="biens-import">Import CSV et synchronisation</H3>
          <P><strong>Import CSV :</strong> Téléchargez le modèle depuis <Code>Biens → Importer → Télécharger le modèle</Code>. Les colonnes doivent correspondre exactement aux noms de champs ci-dessus. Les lignes vides et les colonnes supplémentaires sont ignorées.</P>
          <P><strong>Synchronisation automatique :</strong> Si votre logiciel métier exporte un flux XML ou FTP compatible, configurez l'URL dans <Code>Administration → Synchronisation</Code>. La mise à jour se fait toutes les 6 heures. Les biens existants sont mis à jour, les nouveaux sont ajoutés, les disparus passent en statut "Archivé".</P>

          <H3 id="biens-statuts">Statuts et archivage</H3>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Actif</strong> : bien disponible, inclus dans les matchings</Li>
            <Li><strong>Vendu / Loué</strong> : bien sorti du marché, exclu des matchings mais conservé dans l'historique</Li>
            <Li><strong>Archivé</strong> : bien masqué, exclu des matchings, récupérable à tout moment</Li>
          </ul>
          <P>Un bien archivé peut être restauré depuis <Code>Biens → Archivés → Restaurer</Code>.</P>

          {/* ═══ PROSPECTS ═══ */}
          <H2 id="prospects">Gestion des prospects</H2>
          <P>Un prospect est un acheteur ou locataire potentiel avec des critères de recherche définis. La richesse des informations renseignées détermine directement la qualité du matching.</P>

          <H3 id="prospects-champs">Champs disponibles</H3>
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <TableHead />
              <tbody>
                <Field name="prenom / nom"   type="texte"  req="oui" desc="Identité du prospect" />
                <Field name="email"          type="email"  req="oui" desc="Adresse pour l'envoi des propositions" />
                <Field name="telephone"      type="texte"  req="non" desc="Numéro de contact" />
                <Field name="budget_max"     type="nombre" req="oui" desc="Budget maximum en euros (critère pondéré à 25 pts)" />
                <Field name="type_bien"      type="enum"   req="oui" desc="Type(s) de bien recherché (20 pts)" />
                <Field name="ville_souhaitee" type="texte" req="oui" desc="Ville ou zone souhaitée (15 pts)" />
                <Field name="surface_min"    type="nombre" req="non" desc="Surface minimum souhaitée en m²" />
                <Field name="nb_pieces_min"  type="nombre" req="non" desc="Nombre de pièces minimum" />
                <Field name="stationnement"  type="booléen" req="non" desc="Nécessite un parking / garage" />
                <Field name="notes"          type="texte long" req="non" desc="Notes libres lues par l'IA (style de vie, urgence, destination…)" />
                <Field name="statut"         type="enum"   req="non" desc="Actif, En attente, Archivé (défaut : Actif)" />
                <Field name="agent_referent" type="texte"  req="non" desc="Agent en charge du prospect" />
              </tbody>
            </table>
          </div>

          <H3 id="prospects-statuts">Statuts</H3>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Actif</strong> : prospect en recherche active, inclus dans les matchings</Li>
            <Li><strong>En attente</strong> : prospect non urgent, inclus dans les matchings mais tagué</Li>
            <Li><strong>Archivé</strong> : prospect inactif ou ayant acheté, exclu des matchings</Li>
          </ul>

          {/* ═══ MATCHING ═══ */}
          <H2 id="matching">Le matching IA</H2>
          <P>Le matching est le cœur d'ImmoFlash. Pour chaque prospect, l'algorithme analyse l'ensemble de votre portefeuille actif et génère un score de correspondance pour chaque bien.</P>

          <H3 id="matching-score">Score /100 expliqué</H3>
          <P>Le score est composé de deux parties :</P>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: '#1E3A5F', fontSize: 14, margin: '0 0 0.75rem' }}>Partie objective — 60 pts max</p>
              <ul style={{ paddingLeft: 16, margin: 0, listStyle: 'none' }}>
                {[
                  ['Budget', '25 pts'],
                  ['Type de bien', '20 pts'],
                  ['Localisation', '15 pts'],
                ].map(([k, v]) => (
                  <li key={k} style={{ fontSize: 13, color: '#334155', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{k}</span><strong>{v}</strong>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0.75rem 0 0' }}>Calculé sur la base des critères explicites du prospect.</p>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: '#166534', fontSize: 14, margin: '0 0 0.75rem' }}>Partie qualitative IA — 40 pts max</p>
              <ul style={{ paddingLeft: 16, margin: 0, listStyle: 'none' }}>
                {[
                  ['Style de vie', '~15 pts'],
                  ['DPE / confort', '~10 pts'],
                  ['Destination', '~10 pts'],
                  ['Urgence / timing', '~5 pts'],
                ].map(([k, v]) => (
                  <li key={k} style={{ fontSize: 13, color: '#334155', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{k}</span><strong>{v}</strong>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0.75rem 0 0' }}>Analysé par Claude AI depuis la description du bien et les notes du prospect.</p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', margin: '1rem 0' }}>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: '0 0 0.5rem' }}>Grille d'interprétation</p>
            {[
              { range: '85 – 100', label: 'Excellent', color: '#166534', bg: '#dcfce7', desc: 'Correspondance quasi parfaite — à contacter en priorité' },
              { range: '70 – 84',  label: 'Très bon',  color: '#1e40af', bg: '#dbeafe', desc: 'Forte adéquation — opportunité sérieuse' },
              { range: '55 – 69',  label: 'Bon',       color: '#92400e', bg: '#fef9c3', desc: 'Bonne base — quelques critères à discuter' },
              { range: '40 – 54',  label: 'Partiel',   color: '#6b7280', bg: '#f1f5f9', desc: 'Correspondance partielle — à proposer en option' },
              { range: '< 40',     label: 'Faible',    color: '#9ca3af', bg: '#f9fafb', desc: 'Peu pertinent pour ce prospect' },
            ].map(row => (
              <div key={row.range} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ background: row.bg, color: row.color, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, minWidth: 60, textAlign: 'center' }}>
                  {row.range}
                </span>
                <span style={{ fontWeight: 600, color: row.color, fontSize: 13, minWidth: 70 }}>{row.label}</span>
                <span style={{ color: '#64748b', fontSize: 13 }}>{row.desc}</span>
              </div>
            ))}
          </div>

          <H3 id="matching-lancer">Lancer un matching</H3>
          <P>Depuis <Code>Matchings → Nouveau matching</Code> :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Matching par prospect</strong> : sélectionnez un prospect, ImmoFlash analyse tous les biens actifs</Li>
            <Li><strong>Matching par bien</strong> : sélectionnez un bien, ImmoFlash remonte les prospects les plus pertinents</Li>
            <Li><strong>Matching global</strong> : analyse croisée de tous les prospects actifs contre tous les biens actifs (recommandé une fois par semaine)</Li>
          </ul>

          <H3 id="matching-resultats">Lire les résultats</H3>
          <P>Chaque résultat de matching affiche :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Score /100</strong> avec jauge visuelle</Li>
            <Li><strong>Points forts</strong> : liste des critères parfaitement satisfaits</Li>
            <Li><strong>Points d'attention</strong> : critères non satisfaits ou à nuancer</Li>
            <Li><strong>Recommandation agent</strong> : synthèse rédigée par l'IA avec la stratégie de présentation suggérée</Li>
            <Li><strong>Bouton "Générer l'email"</strong> : crée instantanément le message de proposition</Li>
          </ul>

          {/* ═══ EMAILS ═══ */}
          <H2 id="emails">Emails IA</H2>

          <H3 id="emails-generer">Générer et envoyer un email</H3>
          <P>Depuis n'importe quel résultat de matching, cliquez sur <Code>Générer l'email</Code>. L'IA rédige en quelques secondes un email HTML personnalisé incluant :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li>Accroche adaptée au profil du prospect</Li>
            <Li>Présentation du bien avec photos intégrées (si renseignées)</Li>
            <Li>Arguments ciblés sur ses critères spécifiques</Li>
            <Li>Points d'attention formulés de manière transparente</Li>
            <Li>Coordonnées de l'agence en pied de mail</Li>
          </ul>
          <P>L'email est entièrement modifiable avant envoi. Cliquez sur <Code>Envoyer</Code> pour l'expédier depuis votre adresse professionnelle configurée.</P>

          <H3 id="emails-smtp">Configuration SMTP</H3>
          <P>Rendez-vous dans <Code>Administration → Configuration email</Code>. Les paramètres nécessaires sont :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Serveur SMTP</strong> — ex. <Code>smtp.gmail.com</Code>, <Code>smtp.office365.com</Code></Li>
            <Li><strong>Port</strong> — <Code>587</Code> (TLS) ou <Code>465</Code> (SSL)</Li>
            <Li><strong>Identifiant</strong> — votre adresse email complète</Li>
            <Li><strong>Mot de passe</strong> — mot de passe ou mot de passe d'application (Gmail, Outlook)</Li>
            <Li><strong>Nom expéditeur</strong> — apparaît dans le champ "De" chez le destinataire</Li>
          </ul>
          <P>Un email de test est envoyé à votre adresse après enregistrement pour valider la configuration.</P>

          {/* ═══ AGENT IA ═══ */}
          <H2 id="agent">Agent IA conversationnel</H2>
          <P>L'agent IA est une interface de dialogue intégrée à ImmoFlash. Il comprend le langage naturel et a accès à l'ensemble de votre portefeuille en temps réel.</P>

          <P><strong>Exemples de questions :</strong></P>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', margin: '0.75rem 0 1rem' }}>
            {[
              'Quels prospects ont un budget supérieur à 350 000 € ?',
              'Montre-moi les biens disponibles à Fréjus avec plus de 4 pièces.',
              'Qui pourrait être intéressé par le bien REF-2024-042 ?',
              'Génère un email de proposition pour Mme Dupont concernant le REF-2024-018.',
              'Combien de matchings ont été réalisés ce mois-ci ?',
              'Quels prospects n\'ont pas été contactés depuis 30 jours ?',
            ].map(q => (
              <div key={q} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#38bdf8', fontWeight: 700, flexShrink: 0 }}>›</span>
                <span style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>{q}</span>
              </div>
            ))}
          </div>
          <P>L'agent peut générer des emails, lister des biens selon des critères complexes, résumer l'activité d'un prospect ou d'un bien, et répondre à des questions sur votre portefeuille.</P>

          {/* ═══ RAPPORTS ═══ */}
          <H2 id="rapports">Rapports et analytics</H2>
          <P>ImmoFlash génère un rapport mensuel disponible dans <Code>Administration → Rapports</Code>. Il inclut :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Activité générale</strong> : nombre de biens actifs, de prospects, de matchings réalisés</Li>
            <Li><strong>Emails</strong> : nombre d'emails envoyés, par agent, par bien</Li>
            <Li><strong>Scores</strong> : distribution des scores de matching, score moyen du portefeuille</Li>
            <Li><strong>Biens les plus matchés</strong> : top 5 des biens générant le plus de correspondances</Li>
            <Li><strong>Prospects les plus actifs</strong> : top 5 des prospects avec le plus de matchings</Li>
            <Li><strong>Utilisation API Claude</strong> : consommation de l'IA pour le mois en cours</Li>
          </ul>
          <P>Les rapports sont téléchargeables en HTML. Pour des besoins d'export personnalisé, contactez le support.</P>

          {/* ═══ ADMIN ═══ */}
          <H2 id="admin">Administration</H2>

          <H3 id="admin-roles">Rôles et permissions</H3>
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Fonctionnalité', 'Admin', 'Agent'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Voir les biens', '✓', '✓'],
                  ['Ajouter / modifier des biens', '✓', '✓'],
                  ['Supprimer des biens', '✓', '—'],
                  ['Voir les prospects', '✓', '✓'],
                  ['Ajouter / modifier des prospects', '✓', '✓'],
                  ['Supprimer des prospects', '✓', '—'],
                  ['Lancer des matchings', '✓', '✓'],
                  ['Envoyer des emails', '✓', '✓'],
                  ['Voir les rapports', '✓', '✓'],
                  ['Configurer l\'agence (SMTP, logo…)', '✓', '—'],
                  ['Gérer les utilisateurs', '✓', '—'],
                  ['Réinitialiser les données (démo)', '✓', '—'],
                ].map(([feat, admin, agent]) => (
                  <tr key={feat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', color: '#334155' }}>{feat}</td>
                    <td style={{ padding: '8px 12px', color: '#166534', fontWeight: 700 }}>{admin}</td>
                    <td style={{ padding: '8px 12px', color: agent === '✓' ? '#166534' : '#94a3b8', fontWeight: 700 }}>{agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3 id="admin-agence">Paramètres agence</H3>
          <P>Depuis <Code>Administration → Paramètres</Code>, vous pouvez configurer :</P>
          <ul style={{ paddingLeft: 20, margin: '0 0 1rem' }}>
            <Li><strong>Nom de l'agence</strong> : apparaît dans les emails et les rapports</Li>
            <Li><strong>Logo</strong> : PNG ou JPG, intégré dans les emails HTML</Li>
            <Li><strong>Couleur principale</strong> : code hexadécimal, appliquée à l'en-tête des emails</Li>
            <Li><strong>Adresse et téléphone</strong> : affichés en pied d'email</Li>
            <Li><strong>Configuration SMTP</strong> : paramètres d'envoi email (voir section Emails)</Li>
          </ul>

          {/* ═══ DÉPANNAGE ═══ */}
          <H2 id="depannage">Dépannage</H2>

          {[
            {
              q: 'Le matching ne donne aucun résultat',
              a: 'Vérifiez que vous avez au moins 1 bien au statut "Actif" et 1 prospect au statut "Actif" avec un budget et un type de bien renseignés.',
            },
            {
              q: 'Les emails ne partent pas',
              a: 'Vérifiez votre configuration SMTP dans Administration → Configuration email. Si vous utilisez Gmail, assurez-vous d\'utiliser un mot de passe d\'application (pas votre mot de passe Google). Cliquez sur "Envoyer un email de test" pour valider.',
            },
            {
              q: 'Les photos n\'apparaissent pas dans les emails',
              a: 'Les URLs des photos doivent être accessibles publiquement. Vérifiez que les liens ne nécessitent pas d\'authentification. Le format attendu dans l\'import CSV est : URL1|URL2|URL3 (séparées par le caractère pipe).',
            },
            {
              q: 'Le score est anormalement bas alors que le bien correspond bien',
              a: 'Vérifiez que les champs critiques du prospect sont bien renseignés (budget, type, ville). Enrichissez le champ "Notes libres" du prospect — l\'IA l\'utilise pour la partie qualitative. Vérifiez aussi que la description du bien est suffisamment détaillée.',
            },
            {
              q: 'L\'import CSV échoue',
              a: 'Vérifiez que votre fichier utilise bien le modèle fourni par ImmoFlash (les noms de colonnes doivent être identiques). Encodage attendu : UTF-8. Séparateur : virgule ou point-virgule. Supprimez les lignes d\'en-tête superflues.',
            },
            {
              q: 'L\'agent IA ne répond plus',
              a: 'L\'agent IA nécessite une connexion active à l\'API Claude (Anthropic). Vérifiez votre connexion internet. Si le problème persiste, contactez le support — cela peut indiquer un quota dépassé ou une interruption de service.',
            },
          ].map(item => (
            <div key={item.q} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, margin: '0 0 0.4rem' }}>❓ {item.q}</p>
              <P>{item.a}</P>
            </div>
          ))}

          <div style={{ background: '#0f1e30', borderRadius: 12, padding: '1.75rem', textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontWeight: 700, color: '#ffffff', fontSize: 17, margin: '0 0 0.5rem' }}>
              Votre problème n'est pas listé ici ?
            </p>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 1.25rem' }}>
              Écrivez-nous — nous répondons sous 24h ouvrées.
            </p>
            <a
              href="mailto:contact@immoflash.app"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 14 }}
            >
              Contacter le support
            </a>
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
