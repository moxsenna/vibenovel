import React, { useState } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    geminiKeys, openRouterKey, openRouterModel, defaultProseProvider,
    addGeminiKey, removeGeminiKey, setOpenRouterKey, setOpenRouterModel, setDefaultProseProvider
  } = useSettingsStore()

  const [newKeyInput, setNewKeyInput] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container-high rounded-[20px] w-full max-w-[550px] p-8 shadow-2xl relative inner-glow border border-outline-variant/30">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest border border-outline-variant absolute top-6 right-6 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
        </button>

        <h3 className="text-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">engineering</span>
          Pengaturan AI Engine
        </h3>

        <div className="space-y-6 text-body-sm max-h-[480px] overflow-y-auto pr-1 scrollbar-hide">
          {/* Gemini Section */}
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/50">
            <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
              <span className="material-symbols-outlined text-[18px] text-tertiary">auto_awesome</span>
              Gemini (Core Engine - Gratis)
            </h4>
            <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
              Digunakan untuk brainstorm, outline, state tracker, dan QA. Masukkan lebih dari 1 key untuk rotasi (round-robin).
            </p>

            {geminiKeys.length > 0 && (
              <div className="space-y-2 mb-4">
                {geminiKeys.map((key, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30">
                    <span className="font-mono text-label-md text-on-surface">
                      {key.substring(0, 8)}••••••{key.substring(key.length - 4)}
                    </span>
                    <button
                      onClick={() => removeGeminiKey(idx)}
                      className="w-7 h-7 rounded-lg bg-error-container/20 border border-error/20 text-error hover:bg-error-container/30 cursor-pointer flex items-center justify-center transition-colors"
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
          </div>

          {/* Prose Writer Section */}
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/50">
            <h4 className="font-bold text-on-surface flex items-center gap-2 mb-3 text-body-md">
              <span className="material-symbols-outlined text-[18px] text-primary">history_edu</span>
              Prose Writer (Menulis Cerita)
            </h4>
            <p className="text-label-md text-on-surface-variant mb-4 leading-relaxed">
              Penyedia AI untuk menulis bab novel. Gunakan Gemini gratis atau OpenRouter (Claude/Deepseek).
            </p>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
                <input type="radio" checked={defaultProseProvider === 'gemini'} onChange={() => setDefaultProseProvider('gemini')} className="cursor-pointer accent-primary" />
                Gemini (Gratis)
              </label>
              <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
                <input type="radio" checked={defaultProseProvider === 'openrouter'} onChange={() => setDefaultProseProvider('openrouter')} className="cursor-pointer accent-primary" />
                OpenRouter (Berbayar)
              </label>
            </div>

            {defaultProseProvider === 'openrouter' && (
              <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                <div>
                  <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">OpenRouter API Key</label>
                  <input
                    type="password"
                    placeholder="sk-or-••••••••••••"
                    value={openRouterKey || ''}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container transition-all"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Model Cerita</label>
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
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-outline-variant/30">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
          <span className="text-label-md text-on-surface-variant">Kunci API tersimpan lokal di browser Anda.</span>
          <button
            onClick={onClose}
            className="ml-auto h-10 px-5 rounded-xl bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface text-label-lg cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
