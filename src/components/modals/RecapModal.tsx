/**
 * RecapModal — "Sebelumnya..." generator (Sprint 7).
 *
 * User picks a chapter range, clicks Generate, and gets a friendly recap
 * narrating the story so far. Result can be copied to clipboard or saved
 * to the `recaps` table for reuse.
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { aiRouter } from '../../services/ai/ai-router'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

interface RecapModalProps {
  isOpen: boolean
  onClose: () => void
  /** Optional default range — used when invoked from "before chapter X". */
  defaultRangeEnd?: number
}

export const RecapModal: React.FC<RecapModalProps> = ({ isOpen, onClose, defaultRangeEnd }) => {
  const { activeProject, chapters } = useProjectStore()

  const [rangeStart, setRangeStart] = useState<number>(1)
  const [rangeEnd, setRangeEnd] = useState<number>(() => defaultRangeEnd ?? Math.max(1, chapters.length))
  const [recapText, setRecapText] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedTick, setSavedTick] = useState(false)

  // Sync range when modal opens with a fresh default.
  const [prevDefault, setPrevDefault] = useState<number | undefined>(defaultRangeEnd)
  if (defaultRangeEnd !== prevDefault) {
    setPrevDefault(defaultRangeEnd)
    if (defaultRangeEnd) setRangeEnd(defaultRangeEnd)
  }

  const chaptersInRange = useMemo(
    () =>
      chapters
        .filter((c) => c.chapter_number >= rangeStart && c.chapter_number <= rangeEnd)
        .sort((a, b) => a.chapter_number - b.chapter_number),
    [chapters, rangeStart, rangeEnd]
  )

  const canGenerate = chaptersInRange.length > 0 && rangeStart <= rangeEnd && !generating

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setRecapText('')
    try {
      const text = await aiRouter.generateRecap({
        rangeStart,
        rangeEnd,
        chapters: chaptersInRange
      })
      setRecapText(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal generate recap.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recapText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Gagal menyalin ke clipboard.')
    }
  }

  const handleSave = async () => {
    if (!activeProject || !recapText) return
    try {
      if (isSupabaseConfigured()) {
        const { error: rpcError } = await supabase.from('recaps').insert([
          {
            project_id: activeProject.id,
            chapter_range_start: rangeStart,
            chapter_range_end: rangeEnd,
            content: recapText
          }
        ])
        if (rpcError) throw rpcError
      }
      setSavedTick(true)
      setTimeout(() => setSavedTick(false), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan recap.')
    }
  }

  if (!isOpen || !activeProject) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-surface-container border border-outline-variant/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          <header className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div>
              <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-2">
                📝 Sebelumnya...
              </h2>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">
                Generate recap untuk pembaca atau referensi sendiri sebelum lanjut menulis.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer rounded-full p-1 hover:bg-surface-container-high"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="px-6 py-4 border-b border-outline-variant/15 bg-surface-container-low">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[10px] uppercase text-on-surface-variant/70 block mb-0.5 font-semibold">
                  Mulai Bab
                </label>
                <input
                  type="number"
                  min={1}
                  max={activeProject.target_chapters}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-on-surface-variant/70 block mb-0.5 font-semibold">
                  Sampai Bab
                </label>
                <input
                  type="number"
                  min={rangeStart}
                  max={activeProject.target_chapters}
                  value={rangeEnd}
                  onChange={(e) =>
                    setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || rangeStart))
                  }
                  className="w-20 px-2 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-xs text-on-surface-variant font-mono">
                ({chaptersInRange.length} bab tersedia)
              </span>
              <div className="flex-1" />
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Menulis...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                    Generate Recap
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">
                ⚠️ {error}
              </div>
            )}

            {!recapText && !generating && !error && (
              <div className="text-center py-10 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-4xl block mb-2">
                  auto_stories
                </span>
                <p className="text-sm">
                  Pilih range bab di atas, lalu klik <strong>Generate Recap</strong>.
                </p>
              </div>
            )}

            {recapText && (
              <article className="prose prose-invert max-w-none text-on-surface font-serif text-base leading-relaxed whitespace-pre-line">
                {recapText}
              </article>
            )}
          </div>

          {recapText && (
            <footer className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-end gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-variant/30 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Tersalin' : 'Salin'}
              </button>
              {isSupabaseConfigured() && (
                <button
                  onClick={handleSave}
                  className="px-3 py-2 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold cursor-pointer hover-glow flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {savedTick ? 'check' : 'save'}
                  </span>
                  {savedTick ? 'Tersimpan' : 'Simpan'}
                </button>
              )}
            </footer>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
