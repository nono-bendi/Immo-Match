import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import faqs from '../faqData'

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #e8ecf0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', padding: '1.1rem 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>{q}</span>
        <span style={{
          flexShrink: 0, fontSize: 20, color: '#94a3b8', lineHeight: 1,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease',
        }}>+</span>
      </button>
      {/* Toujours dans le DOM (masqué en CSS) : les crawlers IA et moteurs
          de recherche lisent le HTML prérendu, jamais l'état après clic. */}
      <p style={{
        display: open ? 'block' : 'none',
        color: '#64748b', fontSize: 15, lineHeight: 1.75, margin: '0 0 1.1rem', paddingRight: 32,
      }}>
        {a}
      </p>
    </div>
  )
}

export default function FAQ() {
  return (
    <PageLayout title="Questions fréquentes" category="FAQ">
      <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 3rem' }}>
        Vous avez une question sur ImmoFlash ? Vous trouverez probablement la réponse ici.
        Sinon, écrivez-nous à{' '}
        <a href="mailto:contact@immoflash.app" style={{ color: '#1E3A5F', fontWeight: 600, textDecoration: 'none' }}>
          contact@immoflash.app
        </a>.
      </p>

      {faqs.map(section => (
        <div key={section.section} style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
            {section.section}
          </h2>
          {section.items.map(item => (
            <AccordionItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      ))}

      {/* CTA bas de page */}
      <div style={{
        marginTop: '3rem', padding: '2rem', background: '#f8fafc',
        border: '1px solid #e8ecf0', borderRadius: 12, textAlign: 'center',
      }}>
        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 17, margin: '0 0 0.5rem' }}>
          Vous ne trouvez pas votre réponse ?
        </p>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 1.25rem' }}>
          Notre équipe répond sous 24h.
        </p>
        <a
          href="mailto:contact@immoflash.app"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', fontSize: 14 }}
        >
          Nous écrire
        </a>
      </div>
    </PageLayout>
  )
}
