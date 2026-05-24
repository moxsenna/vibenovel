/**
 * BatchSuccessModal — appears after Auto-Pilot finishes (success / error /
 * aborted) with a stats summary, error log, and a CTA to jump straight to
 * the first generated chapter.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/useUiStore'
import type { BatchProgress } from '../../types/project'

const STATUS_HEADLINE: Record<BatchProgress['status'], { emoji: string; title: string; cls: string }> = {
  idle: { emoji: '⏸', title: 'Idle', cls: 'text-on-surface-variant' },
  running: { emoji: '🚀', title: 'Berjalan...', cls: 'text-primary' },
  paused: { emoji: '⏸', title: 'Dijeda', cls: 'text-amber-400' },
  aborted: { emoji: '⛔', title: 'Dibatalkan', cls: 'text-amber-400' },
  success: { emoji: '🎉', title: 'Auto-Pilot Selesai!', cls: 'text-emerald-400' },
  error: { emoji: '⚠️', title: 'Auto-Pilot Berhenti karena Error', cls: 'text-error' }
}

export const BatchSuccessModal: React.FC = () => {
  const progress = useUiStore((s) => s.batchProgress)
  const setBatchProgress = useUiStore((s) => s.setBatchProgress)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const setMode = useUiStore((s) => s.setMode)
  const navigate = useNavigate()

  const visible =
    progress &&
    (progress.status === 'success' || progress.status === 'error' || progress.status === 'aborted')

  if (!visible || !progress) return null

  const headline = STATUS_HEADLINE[progress.status]
  // Use the immutable `endedAt` snapshot the generator records when the
  // batch transitions to a terminal status. Falls back to startedAt so the
  // value never goes negative while the modal is mounting.
  const elapsed = Math.max(
    0,
    Math.round(((progress.endedAt ?? progress.startedAt) - progress.startedAt) / 1000)
  )
  const firstCompleted = progress.completed[0]

  const close = () => setBatchProgress(null)

  const openFirstChapter = () => {
    if (!firstCompleted) return close()
    setActiveChapter(firstCompleted.chapterNumber)
    setMode('write')
    navigate(`/project/${progress.projectId}`)
    close()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-surface-container border border-outline-variant/30 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        >
          <header className="px-6 py-5 border-b border-outline-variant/20 flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {headline.emoji}
            </span>
            <div className="flex-1">
              <h2 className={`text-headline-sm font-bold ${headline.cls}`}>{headline.title}</h2>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">
                Range Bab {progress.startChapter}–{progress.endChapter}
              </p>
            </div>
            <button
              onClick={close}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer rounded-full p-1 hover:bg-surface-container-high"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Bab Selesai" value={progress.completed.length} icon="menu_book" />
              <Stat
                label="Total Kata"
                value={progress.totalWordCount.toLocaleString('id-ID')}
                icon="text_fields"
              />
              <Stat label="Bab Di-skip" value={progress.skipped} icon="skip_next" />
              <Stat label="Waktu" value={formatElapsed(elapsed)} icon="schedule" />
            </div>

            {progress.completed.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-on-surface-variant/70 font-bold mb-2">
                  Bab yang dihasilkan
                </h3>
                <ul className="space-y-1 max-h-[180px] overflow-y-auto scrollbar-hide pr-1">
                  {progress.completed.map((c) => (
                    <li
                      key={c.chapterId}
                      className="flex items-center justify-between text-sm bg-surface-container-low px-3 py-2 rounded-lg"
                    >
                      <span className="text-on-surface">Bab {c.chapterNumber}</span>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {c.wordCount.toLocaleString('id-ID')} kata
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {progress.errors.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-error font-bold mb-2">
                  Error
                </h3>
                <ul className="space-y-1">
                  {progress.errors.map((e, i) => (
                    <li
                      key={`${e.chapterNumber}-${i}`}
                      className="text-xs bg-error/10 text-error border border-error/20 rounded-lg px-3 py-2"
                    >
                      <span className="font-bold">Bab {e.chapterNumber}:</span> {e.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {progress.warnings.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-2">
                  Peringatan
                </h3>
                <ul className="space-y-1">
                  {progress.warnings.slice(-8).map((w, i) => (
                    <li
                      key={i}
                      className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg px-3 py-2"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-end gap-2">
            <button
              onClick={close}
              className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
            >
              Tutup
            </button>
            {firstCompleted && (
              <button
                onClick={openFirstChapter}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow"
              >
                Lihat Bab {firstCompleted.chapterNumber} →
              </button>
            )}
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

const Stat: React.FC<{ label: string; value: number | string; icon: string }> = ({
  label,
  value,
  icon
}) => (
  <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="material-symbols-outlined text-primary text-[16px]">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</span>
    </div>
    <div className="text-xl font-bold text-on-surface">{value}</div>
  </div>
)

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
