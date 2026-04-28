import { createContext, useContext, useState, useEffect } from 'react'
import { API_URL } from '../config'

const AgencyContext = createContext(null)

export function AgencyProvider({ children }) {
  const [agency, setAgency] = useState(null)

  const loadAgency = async (token) => {
    if (!token) {
      setAgency(null)
      return
    }
    try {
      const res = await fetch(`${API_URL}/auth/agency`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAgency(data)
        // Injecter la couleur primaire comme CSS variable
        document.documentElement.style.setProperty('--color-primary', data.couleur_primaire || '#2563eb')
      }
    } catch {
      // silencieux
    }
  }

  // Chargement initial
  useEffect(() => {
    const token = localStorage.getItem('token')
    loadAgency(token)
  }, [])

  // Rechargement quand le token change (login / logout)
  useEffect(() => {
    const handler = (e) => loadAgency(e.detail?.token)
    window.addEventListener('auth-token-changed', handler)
    return () => window.removeEventListener('auth-token-changed', handler)
  }, [])

  const value = { agency, loadAgency, setAgency }

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  const ctx = useContext(AgencyContext)
  if (!ctx) throw new Error('useAgency must be used within AgencyProvider')
  return ctx
}

export default AgencyContext
