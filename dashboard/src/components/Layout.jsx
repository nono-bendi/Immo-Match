import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import TutorialModal from './TutorialModal'
import AgentChat from './AgentChat'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

function TrialBanner({ user }) {
  const [daysLeft, setDaysLeft] = useState(null)

  useEffect(() => {
    if (!user?.trial_expires_at) return
    const update = () => {
      const diff = new Date(user.trial_expires_at) - new Date()
      setDaysLeft(Math.max(0, Math.ceil(diff / 86400000)))
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [user?.trial_expires_at])

  if (!user?.is_trial || daysLeft === null) return null

  const urgent = daysLeft <= 1
  return (
    <div style={{
      background: urgent ? 'linear-gradient(90deg,#7f1d1d,#991b1b)' : 'linear-gradient(90deg,#1e3a5f,#0ea5e9)',
      color: '#fff', fontSize: 13, fontWeight: 600,
      padding: '7px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 10, flexShrink: 0,
    }}>
      <span style={{ opacity: 0.8 }}>⏱</span>
      {daysLeft === 0
        ? 'Votre accès démo expire aujourd\'hui'
        : `Accès démo — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
      <span style={{ opacity: 0.6, fontWeight: 400 }}>·</span>
      <a href="mailto:contact@immoflash.app" style={{ color: '#7dd3fc', fontWeight: 700, textDecoration: 'none' }}>
        Passer en version complète →
      </a>
    </div>
  )
}

function Layout({ children }) {
  const { user } = useAuth()
  // Clé tutorial par utilisateur
  const tutoKey = user ? `immo_tutorial_seen_${user.id}` : 'immo_tutorial_seen'
  const [showTuto, setShowTuto] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    if (user) setShowTuto(!localStorage.getItem(`immo_tutorial_seen_${user.id}`))
  }, [user?.id])

  const handleCloseTuto = () => {
    localStorage.setItem(tutoKey, '1')
    setShowTuto(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
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

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

        <footer className="px-6 py-2.5 text-center text-xs text-gray-400 border-t border-gray-200 bg-white flex-shrink-0">
          ImmoFlash v1.0 &nbsp;•&nbsp; Développé par <span className="font-medium tracking-wide text-gray-500">NOWA</span> &nbsp;•&nbsp; © 2026
        </footer>
      </div>

      <TutorialModal open={showTuto} onClose={handleCloseTuto} />
      <AgentChat />
    </div>
  )
}

export default Layout