/**
 * BatchProgressPanel — floating bottom-right indicator for Auto-Pilot.
 *
 * Auto-shows whenever `useUiStore.batchProgress.status === 'running'`
 * or `'paused'`. Drives Pause / Resume / Abort actions through the
 * `useBatchGenerator` hook.
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useBatchGenerator } from '../../hooks/useBatchGenerator'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  running: { label: '🚀 Auto-Pilot', cls: 'bg-primary/15 text-primary border-primary/30' },
  paused: { label: '⏸ Paused', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
}

export const BatchProgressPanel: React.FC = () => {
  const progress = useUiStore((s) => s.batchProgress)
  const showConfirm = useUiStore((s) => s.showConfirm)
  const deepThinkEnabled = useSettingsStore((s) => s.deepThinkEnabled)
  const deepThinkInBatch = useSettingsStore((s) => s.deepThinkInBatch)
  const { pauseBatch, resumeBatch, abortBatch } = useBatchGenerator()

  // Tick once per second so the elapsed-time stat refreshes without
  // calling impure `Date.now()` during render.
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const visible = progress?.status === 'running' || progress?.status === 'paused'
  if (!progress || !visible) return null

  const elapsed = Math.max(0, Math.round((now - progress.startedAt) / 1000))
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const badge = STATUS_BADGE[progress.status] ?? STATUS_BADGE.running

  // Build the per-chapter strip — at most 12 visible nodes for compact UX.
  const chapters: { number: number; state: 'done' | 'current' | 'pending' | 'skipped' | 'error' }[] = []
  for (let n = progress.startChapter; n <= progress.endChapter; n++) {
    const done = progress.completed.find((c) => c.chapterNumber === n)
    const errored = progress.errors.find((e) => e.chapterNumber === n)
    if (errored) chapters.push({ number: n, state: 'error' })
    else if (done) chapters.push({ number: n, state: 'done' })
    else if (n === progress.currentChapterNumber) chapters.push({ number: n, state: 'current' })
    else chapters.push({ number: n, state: 'pending' })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-4 right-4 z-[55] w-[min(380px,calc(100vw-2rem))] bg-surface-container-high border border-primary/40 rounded-2xl shadow-xl backdrop-blur-md inner-glow"
      >
        <header className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${badge.cls}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-on-surface-variant font-mono">
            {progress.current}/{progress.total} · {pct}%
          </span>
        </header>

        {/* Sprint 9.7 — Deep Think active label */}
        {deepThinkEnabled && deepThinkInBatch && (
          <div className="px-4 py-1.5 bg-purple-500/8 border-b border-purple-500/15 flex items-center gap-1.5">
            <span className="text-xs">🧠</span>
            <span className="text-[10px] font-medium text-purple-300/90">
              Deep Think aktif — adegan dirancang dulu sebelum ditulis
            </span>
          </div>
        )}

        <div className="px-4 py-3 space-y-3">
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-outline-variant/30 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Current chapter */}
          {progress.currentChapterNumber && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant truncate">
                Bab {progress.currentChapterNumber} · Beat{' '}
                {progress.currentBeatIndex + 1}/{progress.beatsTotal}
              </span>
              <span className="text-on-surface-variant font-mono">
                {progress.currentWordCount} kata
              </span>
            </div>
          )}

          {/* Chapter strip */}
          <div className="flex flex-wrap gap-1.5">
            {chapters.map((c) => (
              <ChapterDot key={c.number} number={c.number} state={c.state} />
            ))}
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70">
            <span>~{progress.totalWordCount.toLocaleString('id-ID')} kata total</span>
            <span>⏱ {formatElapsed(elapsed)}</span>
          </div>
        </div>

        <footer className="px-4 py-3 border-t border-outline-variant/20 flex items-center justify-end gap-2 bg-surface-container-low">
          {progress.status === 'running' && (
            <button
              onClick={pauseBatch}
              className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-variant/30 cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">pause</span>
              Pause
            </button>
          )}
          {progress.status === 'paused' && (
            <button
              onClick={resumeBatch}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover-glow cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
              Resume
            </button>
          )}
          <button
            onClick={() => {
              showConfirm({
                title: 'Hentikan Auto-Pilot?',
                message: 'Apakah Anda yakin ingin membatalkan proses Auto-Pilot? Bab yang saat ini sedang ditulis akan tetap tersimpan sebagai draf.',
                confirmText: 'Ya, Hentikan',
                cancelText: 'Batal',
                severity: 'warning',
                onConfirm: abortBatch
              })
            }}
            className="px-3 py-1.5 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-bold hover:bg-error/20 cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">stop_circle</span>
            Abort
          </button>
        </footer>
      </motion.div>
    </AnimatePresence>
  )
}

const ChapterDot: React.FC<{ number: number; state: 'done' | 'current' | 'pending' | 'skipped' | 'error' }> = ({
  number,
  state
}) => {
  const cls: Record<string, string> = {
    done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    current: 'bg-primary/25 text-primary border-primary/50 animate-pulse',
    pending: 'bg-surface-container-low text-on-surface-variant/60 border-outline-variant/30',
    skipped: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-error/15 text-error border-error/40'
  }
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-mono font-bold border ${cls[state]}`}
      title={`Bab ${number} — ${state}`}
    >
      {number}
    </span>
  )
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
