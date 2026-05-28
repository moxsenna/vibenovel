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
import { useSettingsStore, type ProseModelChoice } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { MimicryEngineCard } from '../compass/MimicryEngineCard'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { resetAllOnboardingFlags } from '../onboarding/onboarding-flags'
import { useProjectStore } from '../../store/useProjectStore'
import { useChatStore } from '../../store/useChatStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'keys' | 'writing' | 'tutorial' | 'debug'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'keys', label: 'Kunci', icon: '🔑' },
  { id: 'writing', label: 'Naskah', icon: '✍' },
  { id: 'tutorial', label: 'Tutorial', icon: '🎓' },
  { id: 'debug', label: 'Debug', icon: '🐞' }
]

const PROSE_MODELS: Array<{
  value: ProseModelChoice
  label: string
  helper: string
  icon: string
  requiresOpenRouter: boolean
}> = [
  {
    value: 'gemini',
    label: 'Gemini Flash',
    helper: 'Gratis, memakai key Gemini.',
    icon: 'auto_awesome',
    requiresOpenRouter: false
  },
  {
    value: 'auto',
    label: 'Auto-Pilot (Nemotron 120B)',
    helper: 'OpenRouter gratis. Konteks 1M token, kualitas tinggi.',
    icon: 'rocket_launch',
    requiresOpenRouter: true
  },
  {
    value: 'claude',
    label: 'Claude Sonnet 4.6',
    helper: 'OpenRouter berbayar, kualitas prosa premium.',
    icon: 'diamond',
    requiresOpenRouter: true
  },
  {
    value: 'deepseek',
    label: 'DeepSeek V4 Flash',
    helper: 'OpenRouter berbayar, cepat dan hemat.',
    icon: 'bolt',
    requiresOpenRouter: true
  },
  {
    value: 'deepseek-pro',
    label: 'DeepSeek V4 Pro',
    helper: 'OpenRouter berbayar, opsi kualitas tertinggi.',
    icon: 'psychology',
    requiresOpenRouter: true
  }
]

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    geminiKeys,
    openRouterFreeKey,
    openRouterPaidKey,
    autoPilotEnabled,
    activeProseModel,
    freeWriteMode,
    addGeminiKey,
    removeGeminiKey,
    setOpenRouterFreeKey,
    setOpenRouterPaidKey,
    setAutoPilotEnabled,
    setActiveProseModel,
    setFreeWriteMode
  } = useSettingsStore()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const addToast = useUiStore((s) => s.addToast)
  const openModal = useUiStore((s) => s.openModal)

  const {
    activeProject,
    mysteryLayers,
    characters,
    items,
    worldRules,
    plotThreads,
    chapters,
    characterStates
  } = useProjectStore()

  const chatMessagesCount = useChatStore((s) => s.getProjectMessages(activeProject?.id || '').length)

  const [activeTab, setActiveTab] = useState<Tab>('keys')
  const [newKeyInput, setNewKeyInput] = useState('')
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  if (!isOpen) return null

  const handleResetOnboarding = () => {
    try {
      resetAllOnboardingFlags()
      addToast('Semua tutorial direset. Buka ulang halaman atau pindah bagian untuk melihatnya lagi.', 'success')
    } catch {
      addToast('Gagal reset tutorial.', 'error')
    }
  }

  const handleDownloadDebugData = () => {
    if (!activeProject) {
      addToast('Buka proyek terlebih dahulu untuk mengekspor data debug.', 'warning')
      return
    }

    const chatMessages = useChatStore.getState().getProjectMessages(activeProject.id)

    const debugData = {
      exported_at: new Date().toISOString(),
      app_version: 'VibeNovel v2 - Sprint 9',
      story_compass: {
        project: activeProject,
        mystery_layers: mysteryLayers
      },
      lorebook: {
        characters: characters,
        items: items,
        world_rules: worldRules,
        plot_threads: plotThreads
      },
      outline: {
        chapters: chapters
      },
      states: {
        character_states: characterStates
      },
      co_author_chat_history: chatMessages
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(debugData, null, 2)
    )}`

    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    downloadAnchor.setAttribute(
      'download',
      `vibenovel_debug_${activeProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addToast('Seluruh data Story Compass, Lorebook, dan Outline berhasil diunduh! 🐞', 'success')
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
                  Kunci API tersimpan lokal di browser dan hanya dipakai saat request langsung ke provider.
                </p>

                {/* Gemini Section */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">auto_awesome</span>
                    Gemini untuk Bantuan AI (Gratis)
                  </h4>
                  <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
                    Dipakai untuk chat ide, rencana bab, cek cerita, dan bantuan AI lain. Tambah lebih dari 1 key untuk rotasi.
                  </p>

                  {geminiKeys.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {geminiKeys.map((item, idx) => {
                        const keyStr = typeof item === 'string' ? item : item.key
                        const labelStr = typeof item === 'string' ? null : item.label
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30"
                          >
                            <div className="flex flex-col">
                              {labelStr && <span className="text-[11px] text-on-surface-variant font-bold uppercase">{labelStr}</span>}
                              <span className="font-mono text-label-md text-on-surface">
                                {keyStr.substring(0, 8)}••••••{keyStr.substring(keyStr.length - 4)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeGeminiKey(idx)}
                              className="w-7 h-7 rounded-lg bg-error-container/20 border border-error/20 text-error hover:bg-error-container/30 cursor-pointer flex items-center justify-center"
                              aria-label={`Hapus key #${idx}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      placeholder="Masukkan Gemini API Key..."
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="w-full sm:flex-[2] h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder-outline text-body-sm focus:outline-none focus:border-primary-container transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Label (Opsional)"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      className="w-full sm:flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder-outline text-body-sm focus:outline-none focus:border-primary-container transition-all"
                    />
                    <button
                      onClick={() => {
                        if (newKeyInput.trim()) {
                          addGeminiKey({ key: newKeyInput.trim(), label: newKeyLabel.trim() })
                          setNewKeyInput('')
                          setNewKeyLabel('')
                        }
                      }}
                      className="w-full sm:w-auto h-10 px-4 rounded-xl btn-gradient text-white text-label-md cursor-pointer flex items-center justify-center gap-1.5 hover-glow shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Tambah
                    </button>
                  </div>
                </section>

                {/* Prose Model */}
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
                    <span className="material-symbols-outlined text-[18px] text-primary">history_edu</span>
                    AI Penulis Naskah
                  </h4>
                  <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
                    Pilihan ini adalah sumber utama yang dipakai Prose Writer dan menu Naskah.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {PROSE_MODELS.map((model) => {
                      const selected = activeProseModel === model.value
                      return (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => setActiveProseModel(model.value)}
                          className={`text-left rounded-xl border px-3 py-3 transition-all cursor-pointer ${
                            selected
                              ? 'border-primary bg-primary/12 text-on-surface'
                              : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40 text-on-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">
                              {model.icon}
                            </span>
                            <span className="font-bold text-body-sm">{model.label}</span>
                            {selected && (
                              <span className="material-symbols-outlined text-[16px] text-primary ml-auto">
                                check
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                            {model.helper}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                  <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                      <div>
                        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                          OpenRouter API Key (Berbayar)
                        </label>
                        <input
                          type="password"
                          placeholder="sk-or-•••••••••••• (untuk Claude/DeepSeek Pro)"
                          value={openRouterPaidKey || ''}
                          onChange={(e) => setOpenRouterPaidKey(e.target.value || null)}
                          className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                        />
                        <p className="text-[11px] text-on-surface-variant/70 mt-2">
                          Wajib hanya jika memilih Claude atau DeepSeek berbayar.
                        </p>
                      </div>
                      <div>
                        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                          OpenRouter API Key (Gratis)
                        </label>
                        <input
                          type="password"
                          placeholder="sk-or-•••••••••••• (untuk model gratis Auto-Pilot)"
                          value={openRouterFreeKey || ''}
                          onChange={(e) => setOpenRouterFreeKey(e.target.value || null)}
                          className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                        />
                        <p className="text-[11px] text-on-surface-variant/70 mt-2">
                          Dipakai oleh Auto-Pilot untuk model gratis (DeepSeek Flash, Nemotron, dll).
                        </p>
                      </div>
                    </div>

                    {/* Auto-Pilot Toggle */}
                    <section className="bg-surface-container-low p-4 rounded-xl border border-primary/20 mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-on-surface text-body-md flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-primary">rocket_launch</span>
                            Auto-Pilot AI Router
                          </h4>
                          <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-relaxed">
                            Otomatis rutekan setiap tugas AI ke model gratis terspesialisasi. Brainstorm → DeepSeek Flash, Outline → GPT-OSS, Prosa → Nemotron 120B, Rewrite → Gemma 4.
                          </p>
                        </div>
                        <button
                          onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
                          disabled={!openRouterFreeKey}
                          className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                            autoPilotEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                          }`}
                          aria-pressed={autoPilotEnabled}
                          aria-label="Toggle Auto-Pilot"
                        >
                          <span
                            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                              autoPilotEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      {!openRouterFreeKey && (
                        <p className="text-[10px] text-error mt-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Masukkan OpenRouter Free Key terlebih dahulu untuk mengaktifkan.
                        </p>
                      )}
                    </section>
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
                    Tour singkat muncul saat pertama kali kamu membuka Home dan tiap ruang kerja. Reset di sini kalau mau ulang.
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

            {activeTab === 'debug' && (
              <motion.div
                key="debug"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40">
                  <h4 className="font-bold text-on-surface text-body-md mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">download</span>
                    Ekspor Data Proyek (Debug Mode)
                  </h4>
                  <p className="text-[12px] text-on-surface-variant/80 leading-relaxed mb-4">
                    Unduh salinan lengkap Story Compass, Lorebook, dan Outline naskah cerita Anda dalam satu berkas JSON terstruktur. Sangat berguna untuk pencadangan manual atau analisis naskah.
                  </p>

                  {activeProject ? (
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-3 mb-4">
                      <div className="flex justify-between items-center text-body-sm">
                        <span className="text-on-surface-variant">Judul Novel:</span>
                        <span className="font-bold text-on-surface">{activeProject.title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant pt-2.5 border-t border-outline-variant/20">
                        <div>📖 {chapters.length} Bab Outline</div>
                        <div>👥 {characters.length} Karakter</div>
                        <div>✨ {mysteryLayers.length} Lapisan Misteri</div>
                        <div>📦 {items.length} Benda & Artefak</div>
                        <div>📜 {worldRules.length} Aturan Dunia</div>
                        <div>🧵 {plotThreads.length} Plot Threads</div>
                        <div className="col-span-2 pt-1 border-t border-outline-variant/10 text-primary font-semibold flex items-center gap-1.5">
                          <span>💬</span>
                          <span>{chatMessagesCount} Riwayat Diskusi Co-Author</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-error-container/10 p-4 rounded-xl border border-error/20 text-xs text-error mb-4">
                      ⚠️ Tidak ada proyek aktif terdeteksi. Silakan buka proyek terlebih dahulu dari dashboard.
                    </div>
                  )}

                  <button
                    onClick={handleDownloadDebugData}
                    disabled={!activeProject}
                    className="w-full h-11 rounded-full btn-gradient text-white text-label-md font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover-glow"
                  >
                    <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                    Unduh Seluruh Data (.json)
                  </button>
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
