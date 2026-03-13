// =====================================================
// src/components/UserMenu.jsx - LIEN PARAMÈTRES CORRIGÉ
// =====================================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Settings, ChevronDown } from 'lucide-react'

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(' ').filter(p => p.length > 0)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const handleSettings = () => {
    navigate('/parametres')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton profil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-9 h-9 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(user?.nom)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user?.nom}</p>
          <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrateur' : user?.role === 'demo' ? 'Démo' : 'Agent'}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {/* Header du menu */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.nom}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          {/* Options */}
          <div className="py-1">
            <button
              onClick={handleSettings}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
            >
              <Settings size={16} className="text-gray-400" />
              Paramètres
            </button>
          </div>

          {/* Déconnexion */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu