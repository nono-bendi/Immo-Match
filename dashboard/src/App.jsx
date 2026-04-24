import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AgencyProvider } from './contexts/AgencyContext'
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
import AdministrationPage from './pages/AdministrationPage'
import NewProspectPage from './pages/NewProspectPage'
import CalibrationPage from './pages/CalibrationPage'
import LandingPage from './pages/LandingPage'

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
  const { isAuthenticated, user } = useAuth()

  // Clé tutorial par utilisateur — chaque nouveau compte voit le tutorial
  const tutoKey = user ? `immoMatch_tuto_done_${user.id}` : 'immoMatch_tuto_done'
  const [showTuto, setShowTuto] = useState(false)
  const [newBienId, setNewBienId] = useState(null)

  // Afficher le tutorial dès que l'utilisateur est connu et qu'il ne l'a pas encore vu
  useEffect(() => {
    if (user) {
      const key = `immoMatch_tuto_done_${user.id}`
      setShowTuto(!window.localStorage.getItem(key))
    }
  }, [user?.id])

  useEffect(() => {
    const handler = (e) => setNewBienId(e.detail.bienId)
    window.addEventListener('openNewBienModal', handler)
    return () => window.removeEventListener('openNewBienModal', handler)
  }, [])

  const closeTuto = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(tutoKey, '1')
    }
    setShowTuto(false)
  }

  return (
    <>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />

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
                  <Route path="/administration" element={<AdministrationPage />} />
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
    <BrowserRouter basename="/dashboard">
      <AuthProvider>
        <AgencyProvider>
          <AppRoutes />
        </AgencyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App