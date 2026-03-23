import { API_URL } from './config'

/**
 * fetch authentifié — lit le token dans localStorage et ajoute l'header Authorization.
 * Remplace tous les fetch(${API_URL}/...) dans l'app.
 */
export function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}
