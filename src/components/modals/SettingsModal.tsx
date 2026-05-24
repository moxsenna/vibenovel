/**
 * SettingsModal — Sprint 9
 *
 * 3-tab refactor:
 *   🔑 Keys     — BYOK Gemini + OpenRouter (existing)
 *   ✍ Writing   — Theme toggle, Free Write toggle, Mimicry Engine
 *   🎓 Tutorial — Reset onboarding flag + about/version info
 *
 * Sliding pill animation between tabs via Framer Motion layoutId.
 */

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { MimicryEngineCard } from '../compass/MimicryEngineCard'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'keys' | 'writing' | 'tutorial'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'keys', label: 'Keys', icon: '🔑' },
  { id: 'writing', label: 'Writing', icon: '✍' },
  { id: 'tutorial', label: 'Tutorial', icon: '🎓' }
]

const ONBOARDING_FLAG = 'vn_onboarding_done_v1'

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    geminiKeys,
    openRouterKey,
    openRouterModel,
    defaultProseProvider,
    freeWriteMode,
    addGeminiKey,
    removeGeminiKey,
    setOpenRouterKey,
    setOpenRouterModel,
    setDefaultProseProvider,
    setFreeWriteMode
  } = useSettingsStore()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const addToast = useUiStore((s) => s.addToast)
  const openModal = useUiStore((s) => s.openModal)

  const [activeTab, setActiveTab] = useState<Tab>('keys')
  const [newKeyInput, setNewKeyInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  if (!isOpen) return null

  const handleResetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_FLAG)
      addToast('Tutorial onboarding direset. Reload halaman untuk melihatnya lagi.', 'success')
    } catch {
      addToast('Gagal reset tutorial.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-surface-container-high rounded-[24px] w-full max-w-[640px] max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/30 inner-glow overflow-hidden"
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Pengaturan
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Tab strip */}
        <div className="px-6 pt-3 border-b border-outline-variant/15 shrink-0">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-label-md font-bold cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="mr-1">{tab.icon}</span> {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                <p className="text-[11px] text-on-surface-variant/70 italic">
                  🔒 Kunci API tersimpan lokal di browser. Tidak pernah meninggalkan device-mu.
                </p>

                {/* Gemini Section */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">auto_awesome</span>
                    Gemini (Core Engine — Gratis)
                  </h4>
                  <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
                    Untuk brainstorm, outline, state tracker, mimicry, dan QA. Tambah lebih dari 1 key untuk rotasi.
                  </p>

                  {geminiKeys.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {geminiKeys.map((key, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30"
                        >
                          <span className="font-mono text-label-md text-on-surface">
                            {key.substring(0, 8)}••••••{key.substring(key.length - 4)}
                          </span>
                          <button
                            onClick={() => removeGeminiKey(idx)}
                            className="w-7 h-7 rounded-lg bg-error-container/20 border border-error/20 text-error hover:bg-error-container/30 cursor-pointer flex items-center justify-center"
                            aria-label={`Hapus key #${idx}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Masukkan Gemini API Key..."
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder-outline text-body-sm focus:outline-none focus:border-primary-container transition-all"
                    />
                    <button
                      onClick={() => {
                        if (newKeyInput.trim()) {
                          addGeminiKey(newKeyInput.trim())
                          setNewKeyInput('')
                        }
                      }}
                      className="h-10 px-4 rounded-xl btn-gradient text-white text-label-md cursor-pointer flex items-center gap-1.5 hover-glow"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Tambah
                    </button>
                  </div>
                </section>

                {/* Prose Provider */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
                    <span className="material-symbols-outlined text-[18px] text-primary">history_edu</span>
                    Prose Writer (Menulis Cerita)
                  </h4>
                  <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
                    Penyedia AI untuk menulis bab. Gunakan Gemini gratis atau OpenRouter (Claude/Deepseek).
                  </p>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        checked={defaultProseProvider === 'gemini'}
                        onChange={() => setDefaultProseProvider('gemini')}
                        className="cursor-pointer accent-primary"
                      />
                      Gemini (Gratis)
                    </label>
                    <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        checked={defaultProseProvider === 'openrouter'}
                        onChange={() => setDefaultProseProvider('openrouter')}
                        className="cursor-pointer accent-primary"
                      />
                      OpenRouter (Berbayar)
                    </label>
                  </div>
                  {defaultProseProvider === 'openrouter' && (
                    <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                      <div>
                        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                          OpenRouter API Key
                        </label>
                        <input
                          type="password"
                          placeholder="sk-or-••••••••••••"
                          value={openRouterKey || ''}
                          onChange={(e) => setOpenRouterKey(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                        />
                      </div>
                      <div>
                        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                          Model Cerita
                        </label>
                        <select
                          value={openRouterModel}
                          onChange={(e) => setOpenRouterModel(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary-container text-body-sm cursor-pointer"
                        >
                          <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                          <option value="deepseek/deepseek-chat">Deepseek V3 (Ekonomis)</option>
                          <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                        </select>
                      </div>
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === 'writing' && (
              <motion.div
                key="writing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                {/* Theme toggle */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-on-surface text-body-md">Tema</h4>
                      <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                        Mode {theme === 'dark' ? 'gelap (Malam Kreatif)' : 'terang (Jurnal Cantik)'}.
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-4 h-9 rounded-full bg-surface-container-low border border-outline-variant text-on-surface text-label-md font-bold cursor-pointer hover:bg-surface-container-highest"
                    >
                      {theme === 'dark' ? '🌙 Dark' : '☀ Light'}
                    </button>
                  </div>
                </section>

                {/* Free Write toggle */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-on-surface text-body-md">Free Write Mode</h4>
                      <p className="text-[11px] text-on-surface-variant/70 mt-0.5 leading-relaxed">
                        Lepas semua enforcement KBM (cliffhanger, dopamine, rollercoaster). Pakai untuk drafting bebas.
                      </p>
                    </div>
                    <button
                      onClick={() => setFreeWriteMode(!freeWriteMode)}
                      className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${
                        freeWriteMode ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                      aria-pressed={freeWriteMode}
                      aria-label="Toggle Free Write Mode"
                    >
                      <span
                        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                          freeWriteMode ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </section>

                {/* Mimicry — full width */}
                <MimicryEngineCard placement="settings" />
              </motion.div>
            )}

            {activeTab === 'tutorial' && (
              <motion.div
                key="tutorial"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface text-body-md mb-2">Tutorial Onboarding</h4>
                  <p className="text-[12px] text-on-surface-variant/80 leading-relaxed mb-4">
                    Tour singkat 5 step yang muncul pertama kali kamu buka VibeNovel. Reset di sini kalau mau ulang.
                  </p>
                  <button
                    onClick={handleResetOnboarding}
                    className="px-4 h-10 rounded-full bg-surface-container-low border border-outline-variant text-on-surface text-label-md font-bold cursor-pointer hover:bg-surface-container-highest flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Reset Onboarding
                  </button>
                </section>

                {/* Sprint 9.5 — Manual Reindex trigger */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface text-body-md mb-2">
                    Sinkronisasi Memori AI
                  </h4>
                  <p className="text-[12px] text-on-surface-variant/80 leading-relaxed mb-4">
                    Build ulang state snapshot, ringkasan, dan analisis thread untuk bab yang ditulis manual atau saat offline. Berguna setelah lama pakai Free Write atau import naskah lama.
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      openModal('reindex')
                    }}
                    className="px-4 h-10 rounded-full bg-surface-container-low border border-outline-variant text-on-surface text-label-md font-bold cursor-pointer hover:bg-surface-container-highest flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">memory</span>
                    Buka Reindexer
                  </button>
                </section>

                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface text-body-md mb-2">Tentang VibeNovel</h4>
                  <p className="text-[12px] text-on-surface-variant/80 leading-relaxed">
                    AI-powered novel writer untuk platform KBM App. 100% client-side PWA. Bring Your Own Key (Gemini + OpenRouter).
                  </p>
                  <p className="text-[11px] text-on-surface-variant/60 italic mt-2">
                    Sprint 9 — Genre Blueprints & Polish.
                  </p>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-outline-variant/20 flex justify-end shrink-0 bg-surface-container">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-full bg-primary text-on-primary text-label-lg font-bold cursor-pointer hover:opacity-90"
          >
            Tutup
          </button>
        </footer>
      </motion.div>
    </div>
  )
}
