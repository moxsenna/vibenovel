import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Lobby } from './pages/Lobby'
import { useUiStore } from './store/useUiStore'
import { useAuth } from './hooks/useAuth'
import { PremiumConfirmModal } from './components/ui/PremiumConfirmModal'
import { PremiumToastContainer } from './components/ui/PremiumToastContainer'
import { LoadingSplash } from './components/ui/LoadingSplash'
import { CommandPalette } from './components/ui/CommandPalette'

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

/**
 * Global keyboard shortcut listener — Sprint 9.6.
 * Cmd/Ctrl+K opens command palette anywhere in the app.
 * Cmd/Ctrl+1..5 switches workspace mode (only effective when in Workspace).
 */
function GlobalKeybinds() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const setMode = useUiStore((s) => s.setMode)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Mode switching shortcuts
      const modes: Record<string, 'brainstorm' | 'outline' | 'write' | 'review' | 'visualize'> = {
        '1': 'brainstorm',
        '2': 'outline',
        '3': 'write',
        '4': 'review',
        '5': 'visualize'
      }
      if (modes[e.key]) {
        // Only on workspace route — but no easy hook to detect router state here,
        // so just dispatch unconditionally; setMode is a no-op visually outside.
        e.preventDefault()
        setMode(modes[e.key])
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen, setMode])

  return null
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
      <GlobalKeybinds />
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
      <CommandPalette />
    </BrowserRouter>
  )
}

export default App
