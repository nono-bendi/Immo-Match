import { Home, Users, UserPlus, Shuffle, Building2, History, Settings, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const menuItems = [
    { icon: Home,      label: 'Dashboard',        path: '/' },
    { icon: UserPlus,  label: 'Nouveau prospect',  path: '/clients/nouveau' },
    { icon: Users,     label: 'Clients',           path: '/clients' },
    { icon: Building2, label: 'Biens',             path: '/biens' },
    { icon: Shuffle,   label: 'Matchings',         path: '/matchings' },
    { icon: History,          label: 'Historique',   path: '/historique' },
    { icon: SlidersHorizontal, label: 'Calibration',  path: '/calibration' },
  ]

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(' ').filter(p => p.length > 0)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <aside className={`
      fixed lg:sticky top-0 left-0 z-40
      w-64 h-screen
      bg-gradient-to-b from-[#1E3A5F] to-[#152a45]
      px-4 py-6 flex flex-col shadow-2xl shrink-0
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>

      {/* Logo + bouton fermer sur mobile */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex-shrink-0 flex items-center justify-center">
<img 
  src="/icon2.png" 
  alt="ImmoMatch" 
  style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)' }} 
/>
</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base tracking-tight">ImmoMatch</h1>
          <p className="text-white/50 text-xs truncate">Saint François Immo</p>
        </div>
        {/* Bouton fermer visible seulement sur mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu</p>
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <li key={index}>
                <NavLink
                  to={item.path}
                  end={item.path === '/clients' || item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white text-[#1E3A5F] shadow-lg shadow-black/10 font-semibold"
                      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-sm">{item.label}</span>
                      {isActive && <ChevronRight size={15} />}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 pt-4 shrink-0">
        <NavLink
          to="/parametres"
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 text-white"
              : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
          }
        >
          <Settings size={19} />
          <span className="text-sm">Paramètres</span>
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-3 mt-3 bg-white/5 rounded-xl">
          <div className="w-9 h-9 bg-[#2D5A8A] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(user?.nom)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.nom || 'Utilisateur'}</p>
            <p className="text-white/50 text-xs capitalize">{user?.role === 'admin' ? 'Administrateur' : 'Agent'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar