import { useState, useEffect, useRef } from 'react'
import { Bell, Home, Star, Users, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      console.error('Erreur notifications:', err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true)
      if (unreadCount > 0) {
        try {
          await fetch(`${API_URL}/notifications/mark-read`, { method: 'POST' })
          setUnreadCount(0)
          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
        } catch (err) {
          console.error('Erreur mark-read:', err)
        }
      }
    } else {
      setIsOpen(false)
    }
  }

  const handleNotificationClick = (notif) => {
    if (notif.type === 'new_bien') {
      const match = notif.link?.match(/\/nouveau-bien\/(\d+)/)
      if (match) {
        window.dispatchEvent(new CustomEvent('openNewBienModal', { detail: { bienId: parseInt(match[1]) } }))
      }
    } else if (notif.link) {
      navigate(notif.link)
    }
    setIsOpen(false)
  }

  const handleClear = async (e) => {
    e.stopPropagation()
    try {
      await fetch(`${API_URL}/notifications/clear`, { method: 'DELETE' })
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Erreur clear:', err)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'sync': return <RefreshCw size={16} className="text-emerald-500" />
      case 'match':
      case 'matching': return <Star size={16} className="text-amber-500" />
      case 'prospect': return <Users size={16} className="text-blue-500" />
      case 'new_bien': return <Home size={16} className="text-emerald-600" />
      default: return <Home size={16} className="text-gray-500" />
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-[#DCE7F3] transition-colors"
      >
        <Bell size={22} className="text-[#1E3A5F]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-[#1E3A5F]">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-gray-100">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1E3A5F] truncate">{notif.title}</p>
                    <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell