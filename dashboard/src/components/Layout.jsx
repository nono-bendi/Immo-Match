import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, RefreshCw, CheckCircle2, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import TutorialModal from './TutorialModal'
import AgentChat from './AgentChat'
import WavesBackground from './WavesBackground'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

// Compte à rebours jusqu'à expiration — recalculé chaque seconde pour que
// le temps qui passe soit visible, pas juste un nombre de jours statique.
function useCountdown(expiresAt) {
  const [left, setLeft] = useState(null)
  useEffect(() => {
    if (!expiresAt) return
    const update = () => {
      const diff = Math.max(0, new Date(expiresAt) - new Date())
      setLeft({
        total: diff,
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor(diff / 3600000) % 24,
        minutes: Math.floor(diff / 60000) % 60,
        seconds: Math.floor(diff / 1000) % 60,
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  return left
}

function pad(n) { return String(n).padStart(2, '0') }

function TrialInfoModal({ left, onClose }) {
  return createPortal((
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="rounded-2xl w-full overflow-hidden" style={{ maxWidth: 480, background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'var(--gradient-primary)', padding: '20px 24px', color: '#fff', position: 'relative' }}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/15" style={{ color: '#fff' }}>
            <X size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
            <Clock size={14} /> Espace de démonstration
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>Ce que vous voyez ici, ce que vous aurez ensuite</div>
        </div>

        <div style={{ padding: '22px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={16} color="#64748b" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>Dans cette démo</div>
              <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.55 }}>
                Vos biens ont été importés une seule fois, à partir des annonces publiées sur votre site — pour que vous puissiez juger sur vos vraies annonces. Ce catalogue ne se met pas à jour automatiquement.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>En version complète</div>
              <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.55 }}>
                ImmoFlash reste connecté à votre logiciel de gestion (Hektor, Apimo, Netty…) : chaque bien ajouté, modifié ou vendu est synchronisé automatiquement, sans réimport manuel. Et bien sûr, sans limite de durée.
              </div>
            </div>
          </div>

          {left && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Temps restant sur cet accès démo</div>
              <div style={{ display: 'flex', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                {[[left.days, 'jours'], [left.hours, 'h'], [left.minutes, 'min'], [left.seconds, 's']].map(([v, label], i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1E3A5F' }}>{i === 0 ? v : pad(v)}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href="https://immoflash.app/#pricing" target="_blank" rel="noopener noreferrer"
            className="block text-center font-semibold rounded-xl text-white"
            style={{ padding: '11px', background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)', textDecoration: 'none' }}>
            Passer en version complète →
          </a>
        </div>
      </div>
    </div>
  ), document.body)
}

function TrialBanner({ user }) {
  const left = useCountdown(user?.trial_expires_at)
  const [showInfo, setShowInfo] = useState(false)

  if (!user?.is_trial || !left) return null

  const urgent = left.total <= 86400000
  const label = left.days > 0
    ? `${left.days} j ${pad(left.hours)} h restant${left.days > 1 ? 's' : ''}`
    : left.total > 0
      ? `${pad(left.hours)}:${pad(left.minutes)}:${pad(left.seconds)} restant`
      : 'expiré'

  return (
    <>
      <div style={{
        background: urgent ? 'linear-gradient(90deg,#7f1d1d,#991b1b)' : 'var(--gradient-primary)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        padding: '7px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, flexShrink: 0,
      }}>
        <Clock size={14} style={{ opacity: 0.8, flexShrink: 0 }} />
        <button onClick={() => setShowInfo(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.35)', textUnderlineOffset: 3 }}>
          Accès démo — {label} <span style={{ fontWeight: 400, opacity: 0.75 }}>(qu'est-ce que ça veut dire ?)</span>
        </button>
        <span style={{ opacity: 0.6, fontWeight: 400 }}>·</span>
        <a href="https://immoflash.app/#pricing" target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', fontWeight: 700, textDecoration: 'none' }}>
          Passer en version complète →
        </a>
      </div>
      {showInfo && <TrialInfoModal left={left} onClose={() => setShowInfo(false)} />}
    </>
  )
}

function Layout({ children }) {
  const { user } = useAuth()
  // Clé tutorial par utilisateur
  const tutoKey = user ? `immo_tutorial_seen_${user.id}` : 'immo_tutorial_seen'
  const [showTuto, setShowTuto] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dark, toggle } = useTheme()

  // Guide uniquement à la demande — plus d'ouverture automatique

  const handleCloseTuto = () => {
    localStorage.setItem(tutoKey, '1')
    setShowTuto(false)
  }

  return (
    <div className="min-h-screen flex relative layout-root">
      <WavesBackground />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Spacer pour compenser la sidebar fixed sur desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      <div className="flex-1 flex flex-col min-w-0" style={{ position: 'relative', zIndex: 1 }}>
        <TrialBanner user={user} />
        <Header
          onOpenTutorial={() => { localStorage.removeItem('immo_tutorial_seen'); setShowTuto(true) }}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          darkToggle={
            <button
              onClick={toggle}
              className="theme-toggle"
              title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Toggle dark mode"
            />
          }
        />

        <main className="flex-1 p-4 md:p-6 overflow-auto" style={{ paddingBottom: '120px' }}>
          {children}
        </main>

        <footer className="px-6 py-2.5 text-center text-xs text-gray-400 border-t border-white/60 flex-shrink-0" aria-hidden="true" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', contain: 'layout' }}>
          ImmoFlash v1.0 &nbsp;•&nbsp; Développé par <span className="font-medium tracking-wide text-gray-500">NOWA</span> &nbsp;•&nbsp; © 2026
        </footer>
      </div>

      <TutorialModal open={showTuto} onClose={handleCloseTuto} />
      <AgentChat />
    </div>
  )
}

export default Layout