import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BatchProgress } from '../types/project'

export type WorkspaceMode = 'brainstorm' | 'outline' | 'write' | 'review'

export interface QaLogs {
  passed: boolean
  warnings: string[]
}

interface UiState {
  activeMode: WorkspaceMode
  contextPanelOpen: boolean
  activeModal: string | null
  activeChapter: number
  theme: 'light' | 'dark'
  qaLogs: QaLogs | null
  runningQa: boolean
  /** Sprint 6 — Auto-Pilot batch progress (transient, never persisted). */
  batchProgress: BatchProgress | null
}

interface UiActions {
  setMode: (mode: WorkspaceMode) => void
  toggleContextPanel: () => void
  setContextPanelOpen: (open: boolean) => void
  openModal: (name: string | null) => void
  setActiveChapter: (chapter: number) => void
  toggleTheme: () => void
  setQaLogs: (logs: QaLogs | null) => void
  setRunningQa: (running: boolean) => void
  setBatchProgress: (progress: BatchProgress | null) => void
}

export type UiStore = UiState & UiActions

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeMode: 'brainstorm',
      contextPanelOpen: true,
      activeModal: null,
      activeChapter: 1,
      theme: 'dark', // default
      qaLogs: null,
      runningQa: false,
      batchProgress: null,

      // Actions
      setMode: (activeMode) => set({ activeMode }),
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
      setContextPanelOpen: (contextPanelOpen) => set({ contextPanelOpen }),
      openModal: (activeModal) => set({ activeModal }),
      setActiveChapter: (activeChapter) => set({ activeChapter }),
      setQaLogs: (qaLogs) => set({ qaLogs }),
      setRunningQa: (runningQa) => set({ runningQa }),
      setBatchProgress: (batchProgress) => set({ batchProgress }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: nextTheme })

        // Update body / html element classes
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }),
    {
      name: 'vibenovel-ui-state',
      partialize: (state) => ({ theme: state.theme }), // Only persist the theme key
    }
  )
)
