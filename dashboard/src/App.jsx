import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import TutorialModal from './components/TutorialModal'
import NewBienModal from './components/NewBienModal'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import BiensPage from './pages/BiensPage'
import MatchingsPage from './pages/MatchingsPage'
import HistoriquePage from './pages/HistoriquePage'
import SettingsPage from './pages/SettingsPage'
import NewProspectPage from './pages/NewProspectPage'
import CalibrationPage from './pages/CalibrationPage'

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const [showTuto, setShowTuto] = useState(() => {
    if (typeof window === 'undefined') return false
    return !window.localStorage.getItem('immoMatch_tuto_done')
  })
  const [newBienId, setNewBienId] = useState(null)

  useEffect(() => {
    const handler = (e) => setNewBienId(e.detail.bienId)
    window.addEventListener('openNewBienModal', handler)
    return () => window.removeEventListener('openNewBienModal', handler)
  }, [])

  const closeTuto = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('immoMatch_tuto_done', '1')
    }
    setShowTuto(false)
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/clients/nouveau" element={<NewProspectPage />} />
                  <Route path="/biens" element={<BiensPage />} />
                  <Route path="/matchings" element={<MatchingsPage />} />
                  <Route path="/historique" element={<HistoriquePage />} />
                  <Route path="/parametres" element={<SettingsPage />} />
                  <Route path="/calibration" element={<CalibrationPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      <TutorialModal open={isAuthenticated && showTuto} onClose={closeTuto} />
      {newBienId && <NewBienModal bienId={newBienId} onClose={() => setNewBienId(null)} />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App