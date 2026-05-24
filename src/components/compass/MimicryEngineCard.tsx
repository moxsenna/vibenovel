/**
 * MimicryEngineCard — Sprint 9
 *
 * Project-wide voice DNA extractor. Takes a writing sample (300-5000 char),
 * sends to Gemini Flash via aiRouter.extractProjectVoiceDna, displays
 * structural features as editable key-value cards, saves to project.voice_dna_project.
 *
 * Single component, two placements:
 *   - placement="context-panel" (outline mode sidebar) — compact
 *   - placement="settings" (Writing tab) — full-width
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { aiRouter } from '../../services/ai/ai-router'
import { MIMICRY_MIN_LENGTH } from '../../prompts/mimicry-engine'

const MAX_LENGTH = 5000

interface MimicryEngineCardProps {
  placement?: 'context-panel' | 'settings'
}

// Prefer human-friendly labels for known keys
const KEY_LABELS: Record<string, string> = {
  diction: '🗣 Diction',
  sentence_rhythm: '📏 Sentence Rhythm',
  paragraph_density: '📑 Paragraph Density',
  dialogue_style: '💬 Dialogue Style',
  signature_phrasing: '✨ Signature Phrasing',
  taboo_phrasing: '🚫 Taboo Phrasing',
  pace_descriptor: '⏱ Pace',
  emotional_color: '🎨 Emotional Color'
}

export const MimicryEngineCard: React.FC<MimicryEngineCardProps> = ({
  placement = 'context-panel'
}) => {
  const project = useProjectStore((s) => s.activeProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const addToast = useUiStore((s) => s.addToast)

  const [sample, setSample] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [hasDraft, setHasDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const wordCount = useMemo(
    () => sample.trim().split(/\s+/).filter(Boolean).length,
    [sample]
  )

  const savedDna = (project?.voice_dna_project ?? {}) as Record<string, unknown>
  const savedKeys = Object.keys(savedDna).filter((k) => savedDna[k])

  const canExtract =
    sample.trim().length > 0 && sample.length <= MAX_LENGTH && !extracting

  const handleExtract = async () => {
    if (!canExtract) return
    setExtracting(true)
    setError(null)
    try {
      const result = await aiRouter.extractProjectVoiceDna(sample)
      setDraft(result)
      setHasDraft(true)
      setShowSaved(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async () => {
    if (!project) return
    try {
      await updateProject(project.id, {
        voice_dna_project: draft as Record<string, unknown>
      })
      addToast('Voice DNA proyek tersimpan. Akan dipakai saat generate prosa.', 'success')
      setShowSaved(true)
      setHasDraft(false)
      setSample('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast(`Gagal simpan: ${msg}`, 'error')
    }
  }

  const handleClearSaved = async () => {
    if (!project) return
    try {
      await updateProject(project.id, { voice_dna_project: {} })
      addToast('Voice DNA proyek dihapus.', 'info')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast(`Gagal hapus: ${msg}`, 'error')
    }
  }

  const isCompact = placement === 'context-panel'

  return (
    <section
      className={`bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-sm inner-glow ${
        isCompact ? 'p-4 space-y-3' : 'p-6 space-y-4'
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`text-on-surface font-bold flex items-center gap-2 ${isCompact ? 'text-title-sm' : 'text-title-lg'}`}>
            <span className="material-symbols-outlined text-primary text-[20px]">auto_fix_high</span>
            Mimicry Engine
          </h3>
          <p className="text-[11px] text-on-surface-variant/70 mt-0.5 leading-relaxed">
            🔒 Sample tidak disimpan ke server, hanya fitur struktural yang diekstrak.
          </p>
        </div>
        {savedKeys.length > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            ✓ Aktif
          </span>
        )}
      </header>

      {/* Saved DNA preview */}
      {savedKeys.length > 0 && !hasDraft && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant/60">
              Voice DNA Tersimpan
            </span>
            <button
              onClick={handleClearSaved}
              className="text-[10px] text-error hover:underline cursor-pointer"
            >
              Hapus
            </button>
          </div>
          {savedKeys.slice(0, isCompact ? 3 : 8).map((k) => (
            <div
              key={k}
              className="text-[11px] bg-surface-container-low rounded-lg border border-outline-variant/15 px-2.5 py-1.5"
            >
              <div className="font-bold text-on-surface">
                {KEY_LABELS[k] ?? k}
              </div>
              <div className="text-on-surface-variant/80 leading-snug">
                {String(savedDna[k] ?? '')}
              </div>
            </div>
          ))}
          {isCompact && savedKeys.length > 3 && (
            <p className="text-[10px] text-on-surface-variant/60 italic">
              +{savedKeys.length - 3} field lain.
            </p>
          )}
        </div>
      )}

      {/* Input + Extract */}
      {!hasDraft && (
        <div className="space-y-2">
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value.slice(0, MAX_LENGTH))}
            rows={isCompact ? 4 : 8}
            placeholder={`Tempel sample tulisanmu di sini (min ${MIMICRY_MIN_LENGTH} kata, maks ${MAX_LENGTH} karakter). Bisa potongan novel sebelumnya, blog post, atau draft mentah.`}
            className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-sm resize-none transition-all"
          />
          <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70">
            <span>
              {wordCount} kata • {sample.length}/{MAX_LENGTH} char
              {wordCount > 0 && wordCount < MIMICRY_MIN_LENGTH && (
                <span className="text-amber-400 ml-2">⚠ Di bawah {MIMICRY_MIN_LENGTH} kata.</span>
              )}
            </span>
            <button
              onClick={handleExtract}
              disabled={!canExtract}
              className="h-8 px-3 rounded-full btn-gradient text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 hover-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {extracting ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[14px]">progress_activity</span>
                  Extracting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Ekstrak Voice DNA
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-error bg-error/10 border border-error/30 rounded-lg p-2">
              ⚠ {error}
            </p>
          )}
        </div>
      )}

      {/* Draft review */}
      <AnimatePresence>
        {hasDraft && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <p className="text-[11px] text-on-surface-variant/70">
              Hasil ekstraksi. Edit kalau perlu, lalu simpan.
            </p>
            {Object.entries(draft).map(([k, v]) => (
              <div
                key={k}
                className="bg-surface-container-low rounded-lg border border-outline-variant/15 px-2.5 py-2"
              >
                <label className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant/60 block mb-1">
                  {KEY_LABELS[k] ?? k}
                </label>
                <textarea
                  value={v}
                  rows={2}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [k]: e.target.value }))
                  }
                  className="w-full text-[11px] text-on-surface bg-transparent border-none focus:outline-none resize-none leading-snug"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setHasDraft(false)
                  setDraft({})
                }}
                className="flex-1 h-9 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] font-bold cursor-pointer hover:bg-surface-container-highest"
              >
                Buang
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-9 rounded-full btn-gradient text-white text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1 hover-glow"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                Simpan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSaved && savedKeys.length > 0 && (
        <p className="text-[11px] text-emerald-400 italic">
          ✓ Voice DNA proyek aktif. Akan dipakai untuk semua bab yang di-generate berikutnya.
        </p>
      )}
    </section>
  )
}
