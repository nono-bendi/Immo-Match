import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import TutorialModal from './TutorialModal'
import { useTheme } from '../contexts/ThemeContext'

function Layout({ children }) {
  const [showTuto, setShowTuto] = useState(() => !localStorage.getItem('immo_tutorial_seen'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dark, toggle } = useTheme()

  const handleCloseTuto = () => {
    localStorage.setItem('immo_tutorial_seen', '1')
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
      </div>

      <TutorialModal open={showTuto} onClose={handleCloseTuto} />
    </div>
  )
}

export default Layout