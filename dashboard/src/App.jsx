import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AgencyProvider } from './contexts/AgencyContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import TutorialModal from './components/TutorialModal'
import NewBienModal from './components/NewBienModal'

const LoginPage        = lazy(() => import('./pages/LoginPage'))
const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const ClientsPage      = lazy(() => import('./pages/ClientsPage'))
const BiensPage        = lazy(() => import('./pages/BiensPage'))
const MatchingsPage    = lazy(() => import('./pages/MatchingsPage'))
const MatchingsPageV2  = lazy(() => import('./pages/MatchingsPageV2'))
const HistoriquePage   = lazy(() => import('./pages/HistoriquePage'))
const SettingsPage     = lazy(() => import('./pages/SettingsPage'))
const AdministrationPage = lazy(() => import('./pages/AdministrationPage'))
const NewProspectPage  = lazy(() => import('./pages/NewProspectPage'))
const CalibrationPage  = lazy(() => import('./pages/CalibrationPage'))
const LandingPage      = lazy(() => import('./pages/LandingPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

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
  const tutoKey = user ? `immoFlash_tuto_done_${user.id}` : 'immoFlash_tuto_done'
  const [showTuto, setShowTuto] = useState(false)
  const [newBienId, setNewBienId] = useState(null)

  // Afficher le tutorial dès que l'utilisateur est connu et qu'il ne l'a pas encore vu
  useEffect(() => {
    if (user) {
      const key = `immoFlash_tuto_done_${user.id}`
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
      <Suspense fallback={<PageLoader />}>
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
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/clients" element={<ClientsPage />} />
                      <Route path="/clients/nouveau" element={<NewProspectPage />} />
                      <Route path="/biens" element={<BiensPage />} />
                      <Route path="/matchings" element={<MatchingsPageV2 />} />
                      <Route path="/matchings-v1" element={<MatchingsPage />} />
                      <Route path="/historique" element={<HistoriquePage />} />
                      <Route path="/parametres" element={<SettingsPage />} />
                      <Route path="/administration" element={<AdministrationPage />} />
                      <Route path="/calibration" element={<CalibrationPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

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