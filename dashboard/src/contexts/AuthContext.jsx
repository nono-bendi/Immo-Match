// =====================================================
// src/contexts/AuthContext.jsx
// Crée ce fichier dans dashboard/src/contexts/
// =====================================================

import { createContext, useContext, useState, useEffect } from 'react'

import { API_URL } from '../config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Vérifie le token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setToken(storedToken)
        } else {
          // Token invalide, on le supprime
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error)
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de connexion')
      }

      // Stocker le token
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Fonction d'inscription
  const register = async (email, password, nom) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nom })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur d\'inscription')
      }

      // Stocker le token
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Fonction pour les requêtes authentifiées
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }

    const response = await fetch(url, { ...options, headers })

    // Si 401, déconnexion automatique
    if (response.status === 401) {
      logout()
      throw new Error('Session expirée')
    }

    return response
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    authFetch
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook pour utiliser l'auth
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext