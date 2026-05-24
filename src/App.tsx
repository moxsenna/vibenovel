import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Lobby } from './pages/Lobby'
import { useUiStore } from './store/useUiStore'
import { useAuth } from './hooks/useAuth'
import { PremiumConfirmModal } from './components/ui/PremiumConfirmModal'
import { PremiumToastContainer } from './components/ui/PremiumToastContainer'
import { LoadingSplash } from './components/ui/LoadingSplash'

// Sprint 9 — Lazy-load Workspace route. ProseWriter, ContextPanel, modals,
// and visualization chunks all load on demand when user opens a project.
const Workspace = lazy(() =>
  import('./pages/Workspace').then((m) => ({ default: m.Workspace }))
)

// Loading spinner while checking auth
function AuthLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
          history_edu
        </span>
        <p className="text-on-surface-variant text-body-md">Memuat VibeNovel...</p>
      </div>
    </div>
  )
}

// Protected route — redirects to /login if not authenticated (only when Supabase is configured)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth()

  if (loading) return <AuthLoader />

  // If Supabase not configured → allow access (demo mode)
  if (!isConfigured) return <>{children}</>

  // Supabase configured → require auth
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

function App() {
  const theme = useUiStore((s) => s.theme)
  const { user, isConfigured } = useAuth()

  // Sync theme class on mount + whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            // If already logged in → redirect to dashboard
            isConfigured && user
              ? <Navigate to="/" replace />
              : <Login />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSplash />}>
                <Workspace />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global themed custom dialogs */}
      <PremiumConfirmModal />
      <PremiumToastContainer />
    </BrowserRouter>
  )
}

export default App

