/**
 * ProseToolbar — Sprint 9.6 slim refactor.
 *
 * Layout baru: 3 elemen utama
 *   [✓ Tersimpan · N kata]  flex-1  [⋯ Lainnya ▾]
 *
 * Dropdown "⋯ Lainnya" berisi: Model selector, Free Write toggle,
 * Sebelumnya... (recap). State gen status hilang dari toolbar — kalau
 * gagal, toast notification; kalau berhasil, quiet.
 */

import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore, type ProseModelChoice } from '../../store/useSettingsStore'

interface ProseToolbarProps {
  wordCount: number
  saveStatus: 'idle' | 'saving' | 'saved'
  stateGenStatus?: 'idle' | 'generating' | 'done' | 'error'
  onOpenRecap?: () => void
  onOpenHistory?: () => void
}

export const ProseToolbar: React.FC<ProseToolbarProps> = ({
  wordCount,
  saveStatus,
  stateGenStatus,
  onOpenRecap,
  onOpenHistory
}) => {
  const {
    activeProseModel,
    setActiveProseModel,
    freeWriteMode,
    setFreeWriteMode,
    deepThinkEnabled,
    setDeepThinkEnabled,
    deepThinkBudget,
    setDeepThinkBudget,
    deepThinkInBatch,
    setDeepThinkInBatch
  } = useSettingsStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const models: { value: ProseModelChoice; label: string; icon: string }[] = [
    { value: 'gemini', label: 'Gemini Flash (Gratis)', icon: '✨' },
    { value: 'claude', label: 'Claude Sonnet 4.6', icon: '💎' },
    { value: 'deepseek', label: 'DeepSeek V4 Flash (Gratis)', icon: '⚡' },
    { value: 'deepseek-pro', label: 'DeepSeek V4 Pro', icon: '🧠' }
  ]

  // Sprint 9.7 — Deep Think budget presets (in tokens). 1024 is the
  // default sweet spot: enough for plan + cliffhanger landing, +1-2s latency.
  const budgetPresets = [
    { value: 512, label: '512' },
    { value: 1024, label: '1024' },
    { value: 2048, label: '2048' },
    { value: 4096, label: '4096' }
  ]

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary border border-border-divider rounded-xl mb-4">
      {/* Left: Save status + word count */}
      <div className="flex items-center gap-3 min-w-0">
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' && (
            <motion.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-warning flex items-center gap-1.5 shrink-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              Menyimpan...
            </motion.span>
          )}
          {saveStatus === 'saved' && (
            <motion.span
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-success flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Tersimpan
            </motion.span>
          )}
          {saveStatus === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-text-tertiary shrink-0"
            >
              Auto-save aktif
            </motion.span>
          )}
        </AnimatePresence>

        <span className="text-xs text-text-tertiary/60">·</span>

        <span className="text-xs text-text-secondary tabular-nums shrink-0">
          <span className="font-bold">{wordCount.toLocaleString()}</span> kata
        </span>

        {/* Optional state gen indicator — only shows on error, success/active is silent */}
        {stateGenStatus === 'error' && (
          <span className="text-[11px] text-error flex items-center gap-1 px-2 py-0.5 rounded bg-error/10 border border-error/30">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            Konteks gagal dibaca
          </span>
        )}
      </div>

      {/* Right: History & ⋯ Lainnya dropdown */}
      <div className="flex items-center gap-2">
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/40 hover:border-primary/30 hover:text-primary cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">history</span>
            Riwayat
          </button>
        )}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/40 hover:border-primary/30 hover:text-on-surface cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
            Lainnya
            <span className="material-symbols-outlined text-[14px]">
              {menuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-1.5 w-72 bg-surface-container-high border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden z-30"
              role="menu"
            >
              {/* Model selector */}
              <div className="px-3 pt-3 pb-2 border-b border-outline-variant/15">
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-1.5">
                  Model AI Penulis
                </div>
                <div className="space-y-1">
                  {models.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setActiveProseModel(m.value)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-body-sm cursor-pointer transition-colors ${
                        activeProseModel === m.value
                          ? 'bg-primary/15 text-primary'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="flex-1 truncate">{m.label}</span>
                      {activeProseModel === m.value && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Write toggle */}
              <button
                onClick={() => {
                  setFreeWriteMode(!freeWriteMode)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface hover:bg-surface-container cursor-pointer text-left border-b border-outline-variant/15"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={freeWriteMode ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {freeWriteMode ? 'lock_open' : 'lock'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {freeWriteMode ? '🪶 Mode Bebas (aktif)' : '📜 Mode Pemandu (aktif)'}
                  </div>
                  <div className="text-[10px] text-on-surface-variant/60">
                    {freeWriteMode
                      ? 'Klik untuk kembali ke beat enforcement'
                      : 'Klik untuk drafting bebas tanpa beat'}
                  </div>
                </div>
              </button>

              {/* Sprint 9.7 — Deep Think section */}
              <div className="px-3 pt-3 pb-2 border-b border-outline-variant/15">
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-1.5 flex items-center gap-1">
                  <span>🧠 Deep Think</span>
                  {deepThinkEnabled && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] normal-case tracking-normal">
                      Aktif
                    </span>
                  )}
                </div>

                {/* Master toggle */}
                <button
                  onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-container cursor-pointer mb-2"
                >
                  <span
                    className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                      deepThinkEnabled ? 'bg-primary' : 'bg-outline-variant/40'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        deepThinkEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span className="flex-1 text-body-sm font-medium text-on-surface">
                    Aktifkan Deep Think
                  </span>
                </button>

                {/* Budget selector — only visible when master is ON */}
                {deepThinkEnabled && (
                  <>
                    <div className="text-[10px] text-on-surface-variant/60 mb-1 px-2">
                      Budget berpikir (token)
                    </div>
                    <div className="flex gap-1 px-2 mb-2">
                      {budgetPresets.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setDeepThinkBudget(p.value)}
                          className={`flex-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            deepThinkBudget === p.value
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Sub-toggle: enable in batch mode */}
                    <button
                      onClick={() => setDeepThinkInBatch(!deepThinkInBatch)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-container cursor-pointer"
                    >
                      <span
                        className={`w-7 h-4 rounded-full relative transition-colors flex-shrink-0 ${
                          deepThinkInBatch ? 'bg-amber-500' : 'bg-outline-variant/40'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                            deepThinkInBatch ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span className="flex-1 text-[11px] text-on-surface">
                        Aktifkan juga di Auto-Pilot
                      </span>
                    </button>

                    <div className="text-[10px] text-on-surface-variant/60 px-2 mt-2 leading-relaxed">
                      AI merencanakan adegan dulu sebelum menulis. +1-2 detik per beat, tapi
                      subtext &amp; cliffhanger lebih tajam.
                      {deepThinkInBatch && (
                        <div className="mt-1 text-amber-400">
                          ⚠️ Auto-Pilot 20 bab = +1-2 menit total.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Recap */}
              {onOpenRecap && (
                <button
                  onClick={() => {
                    onOpenRecap()
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface hover:bg-surface-container cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Sebelumnya...</div>
                    <div className="text-[10px] text-on-surface-variant/60">
                      Generate recap untuk pembaca
                    </div>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
