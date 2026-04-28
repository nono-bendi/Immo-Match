// =====================================================
// src/components/ProtectedRoute.jsx
// Crée ce fichier dans dashboard/src/components/
// =====================================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Pendant le chargement initial, afficher un loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si pas connecté, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si connecté, afficher le contenu
  return children
}

export default ProtectedRoute