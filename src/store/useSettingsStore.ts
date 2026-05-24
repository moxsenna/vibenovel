import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProseModelChoice = 'gemini' | 'claude' | 'deepseek'

interface SettingsState {
  geminiKeys: string[]
  openRouterKey: string | null
  openRouterModel: string
  defaultProseProvider: 'gemini' | 'openrouter'
  activeProseModel: ProseModelChoice
  wordCountDefault: number
  freeWriteMode: boolean
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
}

export type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initial state
      geminiKeys: [],
      openRouterKey: null,
      openRouterModel: 'anthropic/claude-3.5-sonnet', // Upgraded default
      defaultProseProvider: 'gemini',
      activeProseModel: 'gemini',
      wordCountDefault: 1500,
      freeWriteMode: false,

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
    }),
    {
      name: 'vibenovel-settings-state', // Encrypted and saved only locally
    }
  )
)
