import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BatchProgress } from '../types/project'

export type WorkspaceMode = 'brainstorm' | 'outline' | 'write' | 'review' | 'visualize'

export interface QaLogs {
  passed: boolean
  warnings: string[]
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  severity?: 'info' | 'warning' | 'danger'
  onConfirm: () => void
  onCancel?: () => void
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
  /**
   * Sprint 9.6 — UX Polish.
   * When true, header is slim, ModeSwitcher hidden, sidebar collapsed.
   * Reveals via Cmd+K palette, hover top edge, or ≡ toggle. Persisted.
   */
  focusMode: boolean
  /** Sprint 9.6 — Cmd+K command palette open state (transient). */
  paletteOpen: boolean
  
  // Custom dialogs states
  toasts: Toast[]
  confirmOptions: ConfirmOptions | null
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
  /** Sprint 9.6 — Focus Mode actions */
  toggleFocusMode: () => void
  setFocusMode: (focusMode: boolean) => void
  setPaletteOpen: (open: boolean) => void
  
  // Custom dialogs actions
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
  showConfirm: (options: ConfirmOptions) => void
  hideConfirm: () => void
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
      // Sprint 9.6 — Focus Mode default ON for Notion-grade calm.
      // User existing: shock-mitigated via 6s onboarding toast pertama load.
      focusMode: true,
      paletteOpen: false,
      toasts: [],
      confirmOptions: null,

      // Actions
      setMode: (activeMode) => set({ activeMode }),
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
      setContextPanelOpen: (contextPanelOpen) => set({ contextPanelOpen }),
      openModal: (activeModal) => set({ activeModal }),
      setActiveChapter: (activeChapter) => set({ activeChapter }),
      setQaLogs: (qaLogs) => set({ qaLogs }),
      setRunningQa: (runningQa) => set({ runningQa }),
      setBatchProgress: (batchProgress) => set({ batchProgress }),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      setFocusMode: (focusMode) => set({ focusMode }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      
      addToast: (message, type, duration = 4000) => {
        const id = crypto.randomUUID()
        const newToast: Toast = { id, message, type, duration }
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }))

        // Auto remove
        setTimeout(() => {
          get().removeToast(id)
        }, duration)
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
      },

      showConfirm: (confirmOptions) => {
        set({ confirmOptions })
      },

      hideConfirm: () => {
        set({ confirmOptions: null })
      },

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
      partialize: (state) => ({
        theme: state.theme,
        focusMode: state.focusMode
      }), // Persist theme + focus mode preference
    }
  )
)
