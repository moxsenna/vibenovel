import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../store/useProjectStore'
import { useUiStore } from '../store/useUiStore'
import { useSettingsStore } from '../store/useSettingsStore'
import type { WorkspaceMode } from '../store/useUiStore'

// Extracted Modular Components
import { ModeSwitcher } from '../components/workspace/ModeSwitcher'
import { ContextPanel } from '../components/workspace/ContextPanel'
import { CoAuthorChat } from '../components/chat/CoAuthorChat'
import { SeasonArchitectPanel } from '../components/workspace/SeasonArchitectPanel'
import { ProseWriterPanel } from '../components/workspace/ProseWriterPanel'
import { ReviewPanel } from '../components/workspace/ReviewPanel'
import { VisualizationPanel } from '../components/visualization/VisualizationPanel'
import { LoreDiffModal } from '../components/modals/LoreDiffModal'
import { BatchSuccessModal } from '../components/modals/BatchSuccessModal'
import { BatchProgressPanel } from '../components/prose/BatchProgressPanel'
import { FreeWriteIndexerWatcher } from '../components/onboarding/FreeWriteIndexerWatcher'
import { SkipLink } from '../components/ui/SkipLink'

const MODES = [
  { id: 'brainstorm', label: '💬 Brainstorm' },
  { id: 'outline', label: '📋 Outline' },
  { id: 'write', label: '✍ Menulis' },
  { id: 'review', label: '📊 Review' },
  { id: 'visualize', label: '🌌 Visualisasi' }
] as const

export const Workspace: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  // UI Store hooks
  const activeMode = useUiStore((s) => s.activeMode)
  const setMode = useUiStore((s) => s.setMode)
  const contextPanelOpen = useUiStore((s) => s.contextPanelOpen)
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)

  // Project Store hooks
  const {
    projects,
    activeProject,
    setActiveProject,
    loadProjectData,
    chapters,
    characters
  } = useProjectStore()

  // Sync project/chapter contexts
  useEffect(() => {
    if (projectId) {
      const proj = projects.find((p) => p.id === projectId)
      if (proj) {
        setActiveProject(proj)
        loadProjectData(proj.id)
      } else {
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }, [projectId, projects, setActiveProject, loadProjectData, navigate])

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Story Compass checklist selector (for mobile indicator)
  const compassSteps = [
    { name: 'Premis & Genre', done: !!activeProject.title && !!activeProject.genre },
    { name: 'Tokoh Utama', done: characters.some((c) => c.role === 'PROTAGONIST') },
    { name: 'Antagonis', done: characters.some((c) => c.role === 'ANTAGONIST') },
    { name: 'Target Ending', done: !!activeProject.target_ending },
    { name: 'Lapisan Misteri', done: false } // default fallback
  ]
  const activeCompassIdx = compassSteps.findIndex((s) => !s.done)

  return (
    <div className="h-screen w-full flex flex-col bg-surface-container-lowest overflow-hidden">
      <SkipLink />
      <LoreDiffModal />
      <BatchSuccessModal />
      <BatchProgressPanel />
      <FreeWriteIndexerWatcher />
      {/* ── Header ── */}
      <header className="flex-shrink-0 z-50">
        <div className="bg-surface-dim/80 backdrop-blur-md flex flex-col w-full px-5 md:px-16 py-4 space-y-4 border-b border-surface-variant/20 shadow-sm">
          {/* Row 1: Navigation & Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-on-surface-variant hover:text-primary transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-label-lg hidden sm:inline">Beranda</span>
            </button>
            <h1 className="text-headline-md text-primary text-center truncate flex-1 px-4 font-bold">
              {activeProject.title}
              {activeProject.genesis_mode === 'IMPORTED' && (
                <span className="ml-3 align-middle text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/30">
                  📥 Imported
                </span>
              )}
              {freeWriteMode && (
                <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                  🔓 Free Write
                </span>
              )}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-label-md text-on-surface-variant hidden sm:inline font-semibold">
                {chapters.length}/{activeProject.target_chapters} bab
              </span>
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/10 rounded-full p-2 cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button
                aria-label="Notifications"
                className="text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/10 rounded-full p-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </div>
          {/* Row 2: Animated Mode Tab Bar */}
          <ModeSwitcher />
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Animated Sidebar (Desktop only) */}
        <AnimatePresence mode="wait">
          {contextPanelOpen && <ContextPanel />}
        </AnimatePresence>

        {/* Right Side: Primary Canvas (Takes remaining viewport space) */}
        <main
          id="main-content"
          role="main"
          className="flex-1 flex flex-col overflow-hidden relative bg-surface-container-lowest"
        >
          {/* Mobile Compass Header Toggle */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-surface-variant/20 bg-surface-dim/90 backdrop-blur-sm z-10">
            <button
              onClick={toggleContextPanel}
              className="flex items-center gap-2 text-primary text-label-md cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-sm">menu</span>Compass
            </button>
            <span className="text-label-md text-secondary font-semibold">
              {activeMode === 'brainstorm' && activeCompassIdx >= 0
                ? `Membahas: ${compassSteps[activeCompassIdx]?.name}`
                : activeMode.toUpperCase()}
            </span>
          </div>

          {/* Premium Animated Canvas Mode Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden h-full"
            >
              {/* 1. BRAINSTORM CANVAS */}
              {activeMode === 'brainstorm' && (
                <CoAuthorChat projectId={activeProject.id} />
              )}

              {/* 2. OUTLINE CANVAS */}
              {activeMode === 'outline' && (
                <SeasonArchitectPanel />
              )}

              {/* 3. WRITE CANVAS */}
              {activeMode === 'write' && (
                <ProseWriterPanel />
              )}

              {/* 4. REVIEW CANVAS */}
              {activeMode === 'review' && (
                <ReviewPanel />
              )}

              {/* 5. VISUALIZE CANVAS (Sprint 8) */}
              {activeMode === 'visualize' && (
                <VisualizationPanel />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <footer className="md:hidden h-16 bg-surface-container border-t border-outline-variant/10 flex justify-around items-center shrink-0 z-20 backdrop-blur-lg">
        {MODES.map((tab) => {
          const isActive = activeMode === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as WorkspaceMode)}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isActive ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.id === 'brainstorm'
                  ? 'chat'
                  : tab.id === 'outline'
                  ? 'list_alt'
                  : tab.id === 'write'
                  ? 'edit'
                  : tab.id === 'review'
                  ? 'radar'
                  : 'analytics'}
              </span>
              <span className="text-[10px] mt-0.5 font-semibold">
                {tab.label.split(' ')[1] || tab.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </footer>
    </div>
  )
}
