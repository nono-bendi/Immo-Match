import { API_URL } from './config'

// Token en mémoire — mis à jour par AuthContext au login/logout/checkAuth
let _token = null
export function setModuleToken(t) { _token = t }

/**
 * fetch authentifié — lit le token en mémoire (priorité) ou dans localStorage.
 */
export function apiFetch(path, options = {}) {
  const token = _token || localStorage.getItem('token')
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}
