import React from 'react'
import { useSettingsStore, type ProseModelChoice } from '../../store/useSettingsStore'
import { motion, AnimatePresence } from 'framer-motion'

interface ProseToolbarProps {
  wordCount: number
  saveStatus: 'idle' | 'saving' | 'saved'
  stateGenStatus?: 'idle' | 'generating' | 'done' | 'error'
  onOpenRecap?: () => void
}

export const ProseToolbar: React.FC<ProseToolbarProps> = ({ wordCount, saveStatus, stateGenStatus, onOpenRecap }) => {
  const { activeProseModel, setActiveProseModel, freeWriteMode, setFreeWriteMode } = useSettingsStore()

  const models: { value: ProseModelChoice, label: string, icon: string }[] = [
    { value: 'gemini', label: 'Gemini (Free)', icon: '✨' },
    { value: 'claude', label: 'Claude 3.5 Sonnet', icon: '🧠' },
    { value: 'deepseek', label: 'Deepseek v4 Flash', icon: '⚡' }
  ]

  return (
    <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border-divider rounded-xl mb-4">
      
      {/* Left: Model Toggle + Free Write */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">Model:</span>
          <select 
            className="bg-bg-primary text-text-primary text-sm rounded-lg px-3 py-1.5 border border-border-divider focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            value={activeProseModel}
            onChange={(e) => setActiveProseModel(e.target.value as ProseModelChoice)}
          >
            {models.map(m => (
              <option key={m.value} value={m.value}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFreeWriteMode(!freeWriteMode)}
          title="Free Write — tanpa beat indicator & auto QA"
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
            freeWriteMode
              ? 'bg-primary/15 text-primary border-primary/40'
              : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:border-primary/30'
          }`}
        >
          <span
            className="material-symbols-outlined text-[14px]"
            style={freeWriteMode ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {freeWriteMode ? 'lock_open' : 'lock'}
          </span>
          {freeWriteMode ? 'Free Write' : 'Strict'}
        </button>

        {onOpenRecap && (
          <button
            type="button"
            onClick={onOpenRecap}
            title="Generate recap 'Sebelumnya...' untuk pembaca"
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-surface-container text-on-surface-variant border-outline-variant/40 hover:border-primary/30 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">auto_stories</span>
            Sebelumnya...
          </button>
        )}
      </div>

      {/* Right: Stats & Status */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col text-right">
          <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Word Count</span>
          <span className="text-sm text-text-primary font-medium">{wordCount}</span>
        </div>

        <div className="w-24 flex justify-end">
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.span 
                key="saving"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-warning flex items-center gap-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" /> Saving...
              </motion.span>
            )}
            {saveStatus === 'saved' && (
              <motion.span 
                key="saved"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-success flex items-center gap-1"
              >
                ✓ Saved
              </motion.span>
            )}
            {saveStatus === 'idle' && (
              <motion.span 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-text-tertiary"
              >
                Auto-save ON
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* State Gen Status (shows briefly after chapter completes) */}
      {stateGenStatus && stateGenStatus !== 'idle' && (
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
          stateGenStatus === 'generating' ? 'text-secondary border-secondary/20 bg-secondary/10' :
          stateGenStatus === 'done' ? 'text-[#7FBF84] border-[#4A6E4F]/30 bg-[#3B5A40]/20' :
          'text-error border-error/30 bg-error/10'
        }`}>
          {stateGenStatus === 'generating' && (
            <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> Ekstraksi state...</>
          )}
          {stateGenStatus === 'done' && (
            <><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> State ✓</>
          )}
          {stateGenStatus === 'error' && (
            <><span className="material-symbols-outlined text-[14px]">warning</span> State gagal</>
          )}
        </div>
      )}

    </div>
  )
}
