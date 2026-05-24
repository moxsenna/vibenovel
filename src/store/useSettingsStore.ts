import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProseModelChoice = 'gemini' | 'claude' | 'deepseek' | 'deepseek-pro'

interface SettingsState {
  geminiKeys: string[]
  openRouterKey: string | null
  openRouterModel: string
  defaultProseProvider: 'gemini' | 'openrouter'
  activeProseModel: ProseModelChoice
  wordCountDefault: number
  freeWriteMode: boolean
  /**
   * Sprint 9.7 — Deep Think Mode toggles for Prose Writer.
   * Master toggle controls whether thinking is used at all in interactive
   * mode. Sub-toggle `deepThinkInBatch` only takes effect if master is ON.
   */
  deepThinkEnabled: boolean
  deepThinkBudget: number
  deepThinkInBatch: boolean
  /**
   * Sprint 9.8 — Deep Outline Mode toggles for Outline Generator.
   * Independent of Deep Think (different surfaces, different latency
   * profiles). Master + sub-toggle pattern same as Sprint 9.7.
   */
  deepOutlineEnabled: boolean
  deepOutlineBudget: number
  deepOutlineInBatch: boolean
}

interface SettingsActions {
  addGeminiKey: (key: string) => void
  removeGeminiKey: (index: number) => void
  setOpenRouterKey: (key: string | null) => void
  setOpenRouterModel: (model: string) => void
  setDefaultProseProvider: (provider: 'gemini' | 'openrouter') => void
  setActiveProseModel: (model: ProseModelChoice) => void
  setWordCountDefault: (count: number) => void
  setFreeWriteMode: (enabled: boolean) => void
  setDeepThinkEnabled: (enabled: boolean) => void
  setDeepThinkBudget: (budget: number) => void
  setDeepThinkInBatch: (enabled: boolean) => void
  setDeepOutlineEnabled: (enabled: boolean) => void
  setDeepOutlineBudget: (budget: number) => void
  setDeepOutlineInBatch: (enabled: boolean) => void
}

export type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initial state
      geminiKeys: [],
      openRouterKey: null,
      openRouterModel: 'anthropic/claude-sonnet-4.6',
      defaultProseProvider: 'gemini',
      activeProseModel: 'gemini',
      wordCountDefault: 1500,
      freeWriteMode: false,
      // Sprint 9.7 — Deep Think defaults: ON for interactive, OFF for batch.
      deepThinkEnabled: true,
      deepThinkBudget: 1024,
      deepThinkInBatch: false,
      // Sprint 9.8 — Deep Outline defaults: ON for single regenerate, OFF
      // for batch (200 chapters × +2-3s = +10 minutes — opt-in only).
      deepOutlineEnabled: true,
      deepOutlineBudget: 1024,
      deepOutlineInBatch: false,

      // Actions
      addGeminiKey: (key) => set((state) => {
        const trimmed = key.trim()
        if (!trimmed || state.geminiKeys.includes(trimmed)) return state
        return { geminiKeys: [...state.geminiKeys, trimmed] }
      }),
      removeGeminiKey: (index) => set((state) => ({
        geminiKeys: state.geminiKeys.filter((_, i) => i !== index),
      })),
      setOpenRouterKey: (openRouterKey) => set({ openRouterKey }),
      setOpenRouterModel: (openRouterModel) => set({ openRouterModel }),
      setDefaultProseProvider: (defaultProseProvider) => set({ defaultProseProvider }),
      setActiveProseModel: (activeProseModel) => set({ activeProseModel }),
      setWordCountDefault: (wordCountDefault) => set({ wordCountDefault }),
      setFreeWriteMode: (freeWriteMode) => set({ freeWriteMode }),
      setDeepThinkEnabled: (deepThinkEnabled) => set({ deepThinkEnabled }),
      setDeepThinkBudget: (deepThinkBudget) => set({ deepThinkBudget }),
      setDeepThinkInBatch: (deepThinkInBatch) => set({ deepThinkInBatch }),
      setDeepOutlineEnabled: (deepOutlineEnabled) => set({ deepOutlineEnabled }),
      setDeepOutlineBudget: (deepOutlineBudget) => set({ deepOutlineBudget }),
      setDeepOutlineInBatch: (deepOutlineInBatch) => set({ deepOutlineInBatch }),
    }),
    {
      name: 'vibenovel-settings-state', // Encrypted and saved only locally
    }
  )
)
