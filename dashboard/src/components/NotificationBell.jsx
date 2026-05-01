import { useState, useEffect, useRef } from 'react'
import { Bell, Home, Star, Users, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`/notifications`)
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
          await apiFetch(`/notifications/mark-read`, { method: 'POST' })
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
      await apiFetch(`/notifications/clear`, { method: 'DELETE' })
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
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320, background: '#f2f2f7', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1c1c1e', letterSpacing: '-0.2px' }}>Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                style={{ fontSize: 12, color: '#8e8e93', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
                onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}
              >
                Tout effacer
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto', padding: '0 8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#8e8e93' }}>
                <Bell size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 16, padding: '10px 12px', cursor: 'pointer', transition: 'transform 0.25s ease', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#1c1c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.title}</p>
                      <span style={{ fontSize: 10, color: '#8e8e93', flexShrink: 0 }}>{formatTime(notif.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{notif.message}</p>
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