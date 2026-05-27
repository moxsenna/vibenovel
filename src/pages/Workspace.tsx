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
import { HoverModeRevealer } from '../components/workspace/HoverModeRevealer'
import { SkipLink } from '../components/ui/SkipLink'
import { getCompassProgress } from '../lib/compassProgress'

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
  const setContextPanelOpen = useUiStore((s) => s.setContextPanelOpen)
  const focusMode = useUiStore((s) => s.focusMode)
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
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
    characters,
    mysteryLayers
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

  // Sprint 9.6 — first-launch onboarding toast for UX polish update.
  // Shown once per device when user opens Workspace post-v9.6.
  const addToast = useUiStore((s) => s.addToast)
  useEffect(() => {
    try {
      const flag = localStorage.getItem('vn_ux_polish_v96_seen')
      if (flag === null) {
        addToast(
          '✨ UI baru: tekan Cmd/Ctrl+K untuk Aksi Cepat, klik ikon fokus untuk lihat panel lengkap.',
          'info',
          7000
        )
        localStorage.setItem('vn_ux_polish_v96_seen', '1')
      }
    } catch {
      // ignore localStorage errors (private mode etc.)
    }
  }, [addToast])

  // Automatically open Story Compass sidebar if entering Brainstorm tab with an incomplete compass
  useEffect(() => {
    if (activeMode === 'brainstorm' && activeProject) {
      const progress = getCompassProgress({
        title: activeProject.title,
        genre: activeProject.genre,
        storyContract: activeProject.story_contract,
        targetEnding: activeProject.target_ending,
        characters,
        mysteryLayers
      })

      if (!progress.isComplete) {
        setContextPanelOpen(true)
      }
    }
  }, [
    activeMode,
    activeProject,
    characters,
    mysteryLayers,
    setContextPanelOpen
  ])

  useEffect(() => {
    try {
      const flag = localStorage.getItem('vn_deepthink_v97_seen')
      if (flag === null) {
        // Slight delay so this doesn't overlap with the v9.6 toast on a
        // brand-new install; the toast queue stacks them visually anyway,
        // but the spacing reads better.
        const timer = setTimeout(() => {
          addToast(
            '🧠 Fitur baru: AI sekarang merencanakan adegan dulu sebelum menulis. Bikin prosa lebih tajam (subtext, cliffhanger). Bisa dimatikan di ⋯ Lainnya.',
            'info',
            8000
          )
          try {
            localStorage.setItem('vn_deepthink_v97_seen', '1')
          } catch {
            // ignore
          }
        }, 1500)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore localStorage errors (private mode etc.)
    }
  }, [addToast])

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
      {/*
        Sprint 9.6 — Focus Mode aware header.
        - focusMode ON: 36px slim breadcrumb + auto-save + Aksi Cepat hint.
          ModeSwitcher hidden, accessible via hover top edge or Cmd+K.
        - focusMode OFF: full original header with project title chips,
          theme toggle, notifications, ModeSwitcher row.
      */}
      {focusMode ? (
        <header className="flex-shrink-0 z-50">
          <div className="bg-surface-dim/85 backdrop-blur-md flex items-center justify-between gap-3 w-full px-4 md:px-8 py-2 border-b border-surface-variant/20">
            {/* Left: back + breadcrumb */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => navigate('/')}
                aria-label="Kembali ke Beranda"
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <button
                onClick={toggleContextPanel}
                aria-label={contextPanelOpen ? 'Tutup panel' : 'Buka panel'}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded cursor-pointer shrink-0 md:hidden"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {contextPanelOpen ? 'menu_open' : 'menu'}
                </span>
              </button>
              <div className="text-label-md text-on-surface-variant min-w-0 truncate flex items-center gap-1.5">
                <span className="text-primary font-semibold truncate">
                  {activeProject.title}
                </span>
                <span className="text-on-surface-variant/40">·</span>
                <span className="text-on-surface-variant/80 hidden sm:inline">
                  {activeMode === 'brainstorm' && '💬 Brainstorm'}
                  {activeMode === 'outline' && '📋 Outline'}
                  {activeMode === 'write' && '✍ Menulis'}
                  {activeMode === 'review' && '📊 Review'}
                  {activeMode === 'visualize' && '🌌 Visualisasi'}
                </span>
              </div>
            </div>

            {/* Right: Aksi Cepat + chapters + focus toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Buka Aksi Cepat"
                className="hidden md:flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-on-surface bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Aksi Cepat
                <kbd className="font-mono text-[9px] bg-surface-container px-1 py-0.5 rounded">⌘K</kbd>
              </button>
              <span className="text-[11px] text-on-surface-variant/70 hidden sm:inline">
                {chapters.length}/{activeProject.target_chapters} bab
              </span>
              <button
                onClick={toggleFocusMode}
                aria-label="Keluar Mode Fokus"
                title="Mode Fokus aktif — klik untuk lihat panel lengkap"
                className="text-primary hover:bg-primary/10 transition-colors p-1 rounded cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  center_focus_strong
                </span>
              </button>
            </div>
          </div>
          {/* Hover-reveal ModeSwitcher when focus mode is on */}
          <HoverModeRevealer />
        </header>
      ) : (
        <header className="flex-shrink-0 z-50">
          <div className="bg-surface-dim/80 backdrop-blur-md flex flex-col w-full px-5 md:px-16 py-4 space-y-4 border-b border-surface-variant/20 shadow-sm">
            {/* Row 1: Navigation & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 text-on-surface-variant hover:text-primary transition-colors group cursor-pointer"
                >
                  <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                    arrow_back
                  </span>
                  <span className="text-label-lg hidden sm:inline">Beranda</span>
                </button>
              </div>
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Buka Aksi Cepat"
                  title="Aksi Cepat (Cmd+K)"
                  className="flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-on-surface bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  <span className="hidden md:inline">Aksi Cepat</span>
                  <kbd className="font-mono text-[9px] bg-surface-container px-1 py-0.5 rounded">⌘K</kbd>
                </button>
                <span className="text-label-md text-on-surface-variant hidden sm:inline font-semibold">
                  {chapters.length}/{activeProject.target_chapters} bab
                </span>
                <button
                  onClick={toggleFocusMode}
                  aria-label="Aktifkan Mode Fokus"
                  title="Mode Fokus — sembunyikan toolbar"
                  className="text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/10 rounded-full p-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">center_focus_weak</span>
                </button>
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
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Animated Sidebar (Desktop only) */}
        <AnimatePresence mode="wait">
          {contextPanelOpen && <ContextPanel />}
        </AnimatePresence>

        {/* Floating Sidebar Toggle Button (Desktop only) */}
        <button
          onClick={toggleContextPanel}
          className="absolute top-1/2 -translate-y-1/2 hidden md:flex w-[20px] h-[48px] bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-all duration-200 rounded-r-xl shadow-[2px_0_8px_rgba(0,0,0,0.1)] z-40 items-center justify-center cursor-pointer group border-l-0"
          style={{
            left: contextPanelOpen ? '360px' : '0px',
            transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms, color 200ms'
          }}
          aria-label={contextPanelOpen ? 'Tutup Kompas Cerita' : 'Buka Kompas Cerita'}
        >
          <span className="material-symbols-outlined text-[16px] transition-transform group-hover:scale-110">
            {contextPanelOpen ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

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
