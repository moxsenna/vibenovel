/**
 * ReindexModal — Sprint 9.5 Hardening
 *
 * Modal yang muncul saat user toggle Free Write OFF dan ada chapters
 * yang punya prose tapi tidak punya AI artifacts (state snapshot,
 * chapter summary, dll). User bisa pilih: reindex sekarang atau later.
 *
 * Juga bisa di-trigger manual dari Settings → Tutorial tab atau
 * dari Workspace header sebagai utility tool.
 */

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import {
  reindexChapters,
  findChaptersNeedingReindex,
  type ReindexProgress,
  type ReindexResult
} from '../../services/chapter-reindexer'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ReindexModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ReindexModal: React.FC<ReindexModalProps> = ({ isOpen, onClose }) => {
  const chapters = useProjectStore((s) => s.chapters)
  const project = useProjectStore((s) => s.activeProject)
  const addToast = useUiStore((s) => s.addToast)

  const [progress, setProgress] = useState<ReindexProgress>({
    current: 0,
    total: 0,
    currentChapterNumber: null,
    status: 'idle'
  })
  const [results, setResults] = useState<ReindexResult[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  // Compute chapters needing reindex via prev-prop pattern (no setState in effect).
  const [lastProjectId, setLastProjectId] = useState(project?.id ?? null)
  const [pendingIds, setPendingIds] = useState<string[]>([])
  if (project && project.id !== lastProjectId) {
    setLastProjectId(project.id)
    setPendingIds(findChaptersNeedingReindex())
  } else if (isOpen && progress.status === 'idle' && pendingIds.length === 0) {
    // Re-scan when modal opens with idle state (lazy, render-time safe).
    const fresh = findChaptersNeedingReindex()
    if (fresh.length > 0) setPendingIds(fresh)
  }

  if (!isOpen) return null

  const isRunning = progress.status === 'running'
  const isDone = progress.status === 'success' || progress.status === 'partial'
  const totalSucceeded = results.reduce((s, r) => s + r.succeeded.length, 0)
  const totalFailed = results.reduce((s, r) => s + r.failed.length, 0)

  const chapterMeta = (id: string) => chapters.find((c) => c.id === id)

  const handleStart = async () => {
    if (pendingIds.length === 0) return
    abortRef.current = new AbortController()
    setResults([])
    setProgress({
      current: 0,
      total: pendingIds.length,
      currentChapterNumber: null,
      status: 'running'
    })

    try {
      const out = await reindexChapters(
        pendingIds,
        (p) => setProgress(p),
        abortRef.current.signal
      )
      setResults(out)
      const failed = out.reduce((s, r) => s + r.failed.length, 0)
      const succeeded = out.reduce((s, r) => s + r.succeeded.length, 0)
      addToast(
        `Sinkronisasi selesai. ${succeeded} task berhasil${failed > 0 ? `, ${failed} gagal` : ''}.`,
        failed > 0 ? 'warning' : 'success'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast(`Reindex gagal: ${msg}`, 'error')
    }
  }

  const handleAbort = () => {
    abortRef.current?.abort()
  }

  const handleSkip = () => {
    onClose()
  }

  const handleClose = () => {
    if (isRunning) return // require explicit abort
    setProgress({ current: 0, total: 0, currentChapterNumber: null, status: 'idle' })
    setResults([])
    setPendingIds([])
    onClose()
  }

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[55]">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-surface-container-high rounded-[24px] w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/30 inner-glow overflow-hidden"
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">memory</span>
              Sinkronisasi Memori AI
            </h3>
            <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
              Bangun ulang state snapshot, ringkasan, dan analisis untuk bab yang ditulis manual.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isRunning}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {progress.status === 'idle' && (
            <>
              {pendingIds.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-5xl">✓</span>
                  <p className="text-title-md font-bold text-on-surface mt-3">
                    Semua bab sudah tersinkronisasi
                  </p>
                  <p className="text-body-sm text-on-surface-variant/70 mt-1">
                    Tidak ada bab yang butuh reindex AI saat ini.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[18px]">priority_high</span>
                      Ada {pendingIds.length} bab yang butuh sinkronisasi
                    </h4>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed">
                      Bab-bab ini punya prosa tapi belum punya state snapshot, ringkasan, atau analisis thread. Reindex memastikan AI tetap "ingat" konteks bab-bab ini saat menulis lanjutannya.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-2">
                      Bab yang akan diproses
                    </h4>
                    <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
                      {pendingIds.map((id) => {
                        const ch = chapterMeta(id)
                        if (!ch) return null
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 text-body-sm text-on-surface-variant px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/15"
                          >
                            <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 w-8 text-right shrink-0">
                              {ch.chapter_number}
                            </span>
                            <span className="truncate">{ch.title || '(tanpa judul)'}</span>
                            <span className="ml-auto text-[10px] text-on-surface-variant/50 shrink-0">
                              {ch.word_count.toLocaleString()} kata
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-on-surface-variant/60 italic">
                    💡 Proses ini sequential — Bab N+1 butuh state Bab N. Estimasi {pendingIds.length}-{pendingIds.length * 2} menit untuk {pendingIds.length} bab.
                  </p>
                </>
              )}
            </>
          )}

          {(isRunning || isDone) && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-sm font-bold text-on-surface">
                    {isRunning ? 'Memproses...' : 'Selesai'}
                  </span>
                  <span className="text-body-sm text-on-surface-variant font-mono">
                    {progress.current}/{progress.total} ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      progress.status === 'partial' ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    style={{ width: `${percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {isRunning && progress.currentChapterNumber !== null && (
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">
                    Memproses Bab {progress.currentChapterNumber}…
                  </p>
                )}
              </div>

              {/* Results summary */}
              {results.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                      Berhasil
                    </div>
                    <div className="text-title-md font-bold text-emerald-400 mt-0.5">
                      {totalSucceeded}
                    </div>
                  </div>
                  <div className={`border rounded-lg px-3 py-2 ${
                    totalFailed > 0
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-surface-container-low border-outline-variant/15'
                  }`}>
                    <div className={`text-[10px] uppercase tracking-wider font-bold ${
                      totalFailed > 0 ? 'text-rose-400' : 'text-on-surface-variant/60'
                    }`}>
                      Gagal
                    </div>
                    <div className={`text-title-md font-bold mt-0.5 ${
                      totalFailed > 0 ? 'text-rose-400' : 'text-on-surface-variant/40'
                    }`}>
                      {totalFailed}
                    </div>
                  </div>
                </div>
              )}

              {/* Failed task details */}
              <AnimatePresence>
                {totalFailed > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-3 max-h-[160px] overflow-y-auto"
                  >
                    <h5 className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-2">
                      Detail kegagalan
                    </h5>
                    <ul className="space-y-1.5 text-[11px] text-on-surface-variant">
                      {results.flatMap((r) =>
                        r.failed.map((f, i) => (
                          <li key={`${r.chapterId}-${i}`} className="flex gap-1.5">
                            <span className="text-rose-400 shrink-0">⚠</span>
                            <span className="text-on-surface-variant">
                              <span className="font-bold">Bab {r.chapterNumber}</span>
                              {' — '}
                              <span className="text-on-surface-variant/80">{f.task}</span>
                              {': '}
                              <span className="italic text-on-surface-variant/70">{f.error}</span>
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-2 bg-surface-container">
          {progress.status === 'idle' && pendingIds.length > 0 && (
            <>
              <button
                onClick={handleSkip}
                className="h-10 px-4 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-label-md font-bold cursor-pointer hover:bg-surface-container-highest"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleStart}
                className="h-10 px-5 rounded-full btn-gradient text-white text-label-md font-bold cursor-pointer flex items-center gap-1.5 hover-glow"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Mulai Sinkronisasi
              </button>
            </>
          )}
          {progress.status === 'idle' && pendingIds.length === 0 && (
            <button
              onClick={handleClose}
              className="h-10 px-5 rounded-full bg-primary text-on-primary text-label-md font-bold cursor-pointer hover:opacity-90"
            >
              Tutup
            </button>
          )}
          {isRunning && (
            <button
              onClick={handleAbort}
              className="h-10 px-4 rounded-full bg-error/10 border border-error/30 text-error text-label-md font-bold cursor-pointer hover:bg-error/20"
            >
              Hentikan
            </button>
          )}
          {isDone && (
            <button
              onClick={handleClose}
              className="h-10 px-5 rounded-full bg-primary text-on-primary text-label-md font-bold cursor-pointer hover:opacity-90"
            >
              Selesai
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  )
}
