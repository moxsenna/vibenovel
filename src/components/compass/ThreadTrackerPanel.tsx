/**
 * ThreadTrackerPanel — Full CRUD UI (Sprint 7).
 *
 * Replaces the Sprint 3B read-only placeholder. Lets users:
 *   • View threads grouped by status (Active/Planted vs Resolved/Abandoned)
 *   • Add a thread manually (title, urgency, notes)
 *   • Edit / delete existing threads
 *   • Mark a thread RESOLVED / ABANDONED inline
 *   • Trigger AI auto-detect on the active chapter (background task path)
 *
 * Threads with HIGH/CRITICAL urgency that have aged past 10 chapters are
 * surfaced with a "🚨 Dangling" badge.
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { analyzeChapterThreads } from '../../services/thread-tracker'
import type { PlotThread } from '../../types/project'

const STATUS_STYLE: Record<PlotThread['status'], { label: string; cls: string }> = {
  PLANTED: { label: 'Planted', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACTIVE: { label: 'Active', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  RESOLVED: { label: 'Resolved', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ABANDONED: { label: 'Abandoned', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
}

const URGENCY_DOT: Record<PlotThread['urgency'], string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-rose-500 animate-pulse'
}

const DANGLE_THRESHOLD = 10

export const ThreadTrackerPanel: React.FC = () => {
  const {
    activeProject,
    plotThreads,
    chapters,
    chapterSummaries,
    addPlotThread,
    updatePlotThread,
    deletePlotThread,
    applyThreadAnalysis
  } = useProjectStore()
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null)

  const activeChapter = chapters.find((c) => c.chapter_number === activeChapterNumber)

  const sorted = useMemo(() => {
    const open: PlotThread[] = []
    const closed: PlotThread[] = []
    for (const t of plotThreads) {
      if (t.status === 'RESOLVED' || t.status === 'ABANDONED') closed.push(t)
      else open.push(t)
    }
    open.sort((a, b) => {
      const urgRank: Record<PlotThread['urgency'], number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3
      }
      return urgRank[a.urgency] - urgRank[b.urgency] || a.planted_at - b.planted_at
    })
    closed.sort((a, b) => (b.resolved_at ?? 0) - (a.resolved_at ?? 0))
    return { open, closed }
  }, [plotThreads])

  const runAutoDetect = async () => {
    if (!activeProject || !activeChapter || !activeChapter.prose) {
      setAnalyzeMessage('Bab aktif belum punya prosa untuk dianalisis.')
      return
    }
    setAnalyzing(true)
    setAnalyzeMessage(null)
    try {
      const prevSummaries = chapterSummaries
        .filter((s) => s.chapter_id !== activeChapter.id)
        .slice(-5)
        .map((s) => s.summary)
      const result = await analyzeChapterThreads(activeChapter, plotThreads, prevSummaries)
      await applyThreadAnalysis(activeChapter.chapter_number, activeProject.id, result)
      const summary =
        `${result.newThreads.length} baru, ${result.resolvedThreadTitles.length} resolved, ${result.updatedThreadTitles.length} updated.`
      setAnalyzeMessage(`✓ ${summary}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analisis gagal.'
      setAnalyzeMessage(`⚠️ ${msg}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
          🪝 Thread Tracker
        </h3>
        <span className="text-xs text-on-surface-variant/70 font-semibold">
          {plotThreads.length} thread
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => {
            setCreating(true)
            setEditingId(null)
          }}
          className="text-xs font-bold px-2 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Manual
        </button>
        <button
          onClick={runAutoDetect}
          disabled={analyzing || !activeChapter?.prose}
          title={
            activeChapter?.prose
              ? 'Deteksi thread baru dari prosa bab aktif'
              : 'Butuh bab aktif yang punya prosa.'
          }
          className="text-xs font-bold px-2 py-1 rounded-lg bg-secondary-container text-on-secondary-container border border-outline-variant/30 cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {analyzing ? (
            <>
              <div className="w-3 h-3 border-2 border-on-secondary-container/30 border-t-on-secondary-container rounded-full animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[14px]">auto_fix</span>
              Auto-detect
            </>
          )}
        </button>
        {analyzeMessage && (
          <span className="text-[10px] text-on-surface-variant italic">{analyzeMessage}</span>
        )}
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <ThreadForm
              defaultPlantedAt={activeChapterNumber}
              onCancel={() => setCreating(false)}
              onSubmit={async (payload) => {
                if (!activeProject) return
                await addPlotThread({ ...payload, project_id: activeProject.id })
                setCreating(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {plotThreads.length === 0 && !creating ? (
        <div className="text-center py-6 px-3">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl mb-2 block">
            radar
          </span>
          <p className="text-body-sm text-on-surface-variant/70">
            Belum ada thread.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-3 text-xs font-bold text-primary underline cursor-pointer"
          >
            Buat thread pertama
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto scrollbar-hide pr-1">
          {sorted.open.length > 0 && (
            <ThreadGroup
              label="Aktif"
              threads={sorted.open}
              currentChapter={activeChapterNumber}
              editingId={editingId}
              onEditToggle={setEditingId}
              onUpdate={updatePlotThread}
              onDelete={deletePlotThread}
            />
          )}
          {sorted.closed.length > 0 && (
            <ThreadGroup
              label="Selesai / Ditinggalkan"
              threads={sorted.closed}
              currentChapter={activeChapterNumber}
              editingId={editingId}
              onEditToggle={setEditingId}
              onUpdate={updatePlotThread}
              onDelete={deletePlotThread}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Thread Group ─────────────────────────────────────────────────────────

interface GroupProps {
  label: string
  threads: PlotThread[]
  currentChapter: number
  editingId: string | null
  onEditToggle: (id: string | null) => void
  onUpdate: (id: string, data: Partial<PlotThread>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const ThreadGroup: React.FC<GroupProps> = ({
  label,
  threads,
  currentChapter,
  editingId,
  onEditToggle,
  onUpdate,
  onDelete
}) => (
  <div className="space-y-2">
    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold pl-1">
      {label}
    </p>
    {threads.map((thread) => (
      <ThreadCard
        key={thread.id}
        thread={thread}
        currentChapter={currentChapter}
        isEditing={editingId === thread.id}
        onEditToggle={(open) => onEditToggle(open ? thread.id : null)}
        onUpdate={(partial) => onUpdate(thread.id, partial)}
        onDelete={() => onDelete(thread.id)}
      />
    ))}
  </div>
)

// ── Thread Card ──────────────────────────────────────────────────────────

interface CardProps {
  thread: PlotThread
  currentChapter: number
  isEditing: boolean
  onEditToggle: (open: boolean) => void
  onUpdate: (partial: Partial<PlotThread>) => void
  onDelete: () => void
}

const ThreadCard: React.FC<CardProps> = ({
  thread,
  currentChapter,
  isEditing,
  onEditToggle,
  onUpdate,
  onDelete
}) => {
  const status = STATUS_STYLE[thread.status]
  const isOpen = thread.status === 'PLANTED' || thread.status === 'ACTIVE'
  const isDangling =
    isOpen &&
    (thread.urgency === 'HIGH' || thread.urgency === 'CRITICAL') &&
    currentChapter - thread.planted_at >= DANGLE_THRESHOLD

  const showConfirm = useUiStore((s) => s.showConfirm)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-surface-container/60 p-3 rounded-xl border ${
        isDangling ? 'border-rose-500/40' : 'border-outline-variant/15'
      } group`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${URGENCY_DOT[thread.urgency]}`}
          title={`Urgency: ${thread.urgency}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface line-clamp-2">{thread.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.cls} uppercase tracking-wider`}
            >
              {status.label}
            </span>
            <span className="text-[10px] text-on-surface-variant/70">
              Bab {thread.planted_at}
              {thread.resolved_at ? ` → ${thread.resolved_at}` : ''}
            </span>
            {isDangling && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                🚨 Dangling
              </span>
            )}
          </div>
          {thread.notes && !isEditing && (
            <p className="text-xs text-on-surface-variant/80 mt-2 line-clamp-3 whitespace-pre-line">
              {thread.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onEditToggle(!isEditing)}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            aria-label="Edit thread"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
          {isOpen && (
            <button
              onClick={() => onUpdate({ status: 'RESOLVED', resolved_at: currentChapter })}
              title="Tandai resolved"
              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
            </button>
          )}
          <button
            onClick={() => {
              showConfirm({
                title: 'Hapus Plot Thread?',
                message: `Apakah Anda yakin ingin menghapus plot thread "${thread.title}"?`,
                confirmText: 'Ya, Hapus',
                cancelText: 'Batal',
                severity: 'danger',
                onConfirm: onDelete
              })
            }}
            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 cursor-pointer"
            aria-label="Hapus thread"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <ThreadForm
              defaultPlantedAt={thread.planted_at}
              initial={thread}
              onCancel={() => onEditToggle(false)}
              onSubmit={async (payload) => {
                onUpdate(payload)
                onEditToggle(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Form (Add / Edit) ────────────────────────────────────────────────────

interface FormProps {
  defaultPlantedAt: number
  initial?: PlotThread
  onCancel: () => void
  onSubmit: (
    payload: Omit<PlotThread, 'id' | 'project_id'> & { project_id?: string }
  ) => Promise<void> | void
}

const ThreadForm: React.FC<FormProps> = ({
  defaultPlantedAt,
  initial,
  onCancel,
  onSubmit
}) => {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [plantedAt, setPlantedAt] = useState(String(initial?.planted_at ?? defaultPlantedAt))
  const [resolvedAt, setResolvedAt] = useState(
    initial?.resolved_at ? String(initial.resolved_at) : ''
  )
  const [urgency, setUrgency] = useState<PlotThread['urgency']>(initial?.urgency ?? 'MEDIUM')
  const [status, setStatus] = useState<PlotThread['status']>(initial?.status ?? 'PLANTED')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        planted_at: parseInt(plantedAt, 10) || defaultPlantedAt,
        resolved_at: resolvedAt ? parseInt(resolvedAt, 10) : null,
        urgency,
        status,
        related_characters: initial?.related_characters ?? [],
        related_items: initial?.related_items ?? [],
        notes: notes.trim()
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 space-y-2">
      <div>
        <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5 font-semibold">
          Judul Thread
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Misteri Pria Tua Pasar Malam"
          className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">Urgency</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as PlotThread['urgency'])}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PlotThread['status'])}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="PLANTED">PLANTED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="ABANDONED">ABANDONED</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">Planted Bab</label>
          <input
            type="number"
            min={1}
            value={plantedAt}
            onChange={(e) => setPlantedAt(e.target.value)}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {(status === 'RESOLVED' || status === 'ABANDONED') && (
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
            Resolved Bab (opsional)
          </label>
          <input
            type="number"
            min={1}
            value={resolvedAt}
            onChange={(e) => setResolvedAt(e.target.value)}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
          Catatan
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Konteks atau breadcrumb tambahan"
          className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1 rounded text-on-surface-variant text-xs cursor-pointer hover:text-on-surface"
        >
          Batal
        </button>
        <button
          onClick={submit}
          disabled={submitting || !title.trim()}
          className="px-3 py-1 rounded bg-primary text-on-primary text-xs font-bold cursor-pointer disabled:opacity-40"
        >
          {submitting ? 'Menyimpan...' : initial ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </div>
  )
}
