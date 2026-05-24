/**
 * Mystery Layer Panel — CRUD UI + breadcrumb timeline
 *
 * Surface for the 🧅 Bawang Berlapis retention engine. Each layer is a
 * "central question" the reader is chasing across many chapters. Layers
 * can be PLANNED, ACTIVE (currently teasing), or REVEALED (already
 * answered, opens_next_question now drives a new layer).
 *
 * The breadcrumb timeline lets users scatter SUBTLE hints at specific
 * chapter numbers; the outline engine prompt picks up breadcrumbs whose
 * chapter is within ±3 of the chapter being generated.
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import type { MysteryLayer } from '../../types/project'

const STATUS_STYLE: Record<MysteryLayer['status'], { label: string; cls: string }> = {
  PLANNED: { label: 'Planned', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACTIVE: { label: 'Active', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  REVEALED: { label: 'Revealed', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
}

export const MysteryLayerPanel: React.FC = () => {
  const {
    activeProject,
    mysteryLayers,
    addMysteryLayer,
    updateMysteryLayer,
    deleteMysteryLayer
  } = useProjectStore()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!activeProject) return null

  const ordered = [...mysteryLayers].sort((a, b) => a.layer_number - b.layer_number)

  return (
    <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
          🧅 Mystery Layers
        </h3>
        <button
          onClick={() => {
            setCreating(true)
            setEditingId(null)
          }}
          className="text-xs font-bold px-2 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Layer Baru
        </button>
      </div>

      <p className="text-xs text-on-surface-variant/70 leading-relaxed mb-4">
        Bawang berlapis: tiap layer punya satu pertanyaan sentral yang
        membuka pertanyaan berikutnya saat dijawab. Tebar breadcrumb
        sebelum bab reveal untuk efek &ldquo;ahaaa&rdquo; klasik.
      </p>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <MysteryLayerForm
              targetChapters={activeProject.target_chapters}
              defaultLayerNumber={ordered.length + 1}
              onCancel={() => setCreating(false)}
              onSubmit={async (payload) => {
                await addMysteryLayer({
                  ...payload,
                  project_id: activeProject.id
                })
                setCreating(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {ordered.length === 0 && !creating ? (
        <div className="text-center py-6 px-3">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl mb-2 block">
            layers
          </span>
          <p className="text-body-sm text-on-surface-variant/70">
            Belum ada mystery layer.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-3 text-xs font-bold text-primary underline cursor-pointer"
          >
            Buat layer pertama
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ordered.map((layer) => (
            <MysteryLayerCard
              key={layer.id}
              layer={layer}
              targetChapters={activeProject.target_chapters}
              isEditing={editingId === layer.id}
              onEditToggle={(open) => setEditingId(open ? layer.id : null)}
              onUpdate={(partial) => updateMysteryLayer(layer.id, partial)}
              onDelete={() => deleteMysteryLayer(layer.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Layer Card ────────────────────────────────────────────────────────────

interface CardProps {
  layer: MysteryLayer
  targetChapters: number
  isEditing: boolean
  onEditToggle: (open: boolean) => void
  onUpdate: (partial: Partial<MysteryLayer>) => void
  onDelete: () => void
}

const MysteryLayerCard: React.FC<CardProps> = ({
  layer,
  targetChapters,
  isEditing,
  onEditToggle,
  onUpdate,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_STYLE[layer.status]
  const showConfirm = useUiStore((s) => s.showConfirm)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/15"
    >
      <div className="flex items-start gap-3">
        <div className="text-[10px] font-mono font-bold text-on-surface-variant w-7 shrink-0 pt-0.5 text-center">
          L{layer.layer_number}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full cursor-pointer"
          >
            <p className="text-sm font-semibold text-on-surface line-clamp-2">
              {layer.central_question || <span className="italic text-on-surface-variant/50">(belum ada pertanyaan)</span>}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.cls} uppercase tracking-wider`}
              >
                {status.label}
              </span>
              {layer.revealed_at_chapter && (
                <span className="text-[10px] text-on-surface-variant/70">
                  Reveal: Bab {layer.revealed_at_chapter}
                </span>
              )}
              <span className="text-[10px] text-on-surface-variant/70">
                {layer.breadcrumbs.length} breadcrumb
              </span>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEditToggle(!isEditing)}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            aria-label="Edit layer"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button
            onClick={() => {
              showConfirm({
                title: 'Hapus Layer Misteri?',
                message: `Apakah Anda yakin ingin menghapus Layer Misteri L${layer.layer_number}? Seluruh data breadcrumb di dalamnya akan hilang secara permanen.`,
                confirmText: 'Ya, Hapus',
                cancelText: 'Batal',
                severity: 'danger',
                onConfirm: onDelete
              })
            }}
            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 cursor-pointer"
            aria-label="Hapus layer"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && !isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="space-y-2 text-xs leading-relaxed pl-9">
              {layer.answer && (
                <p>
                  <span className="text-on-surface-variant/70 font-semibold">Jawaban:</span>{' '}
                  <span className="text-on-surface">{layer.answer}</span>
                </p>
              )}
              {layer.opens_next_question && (
                <p>
                  <span className="text-on-surface-variant/70 font-semibold">Buka pertanyaan baru:</span>{' '}
                  <span className="text-on-surface">{layer.opens_next_question}</span>
                </p>
              )}
              <BreadcrumbTimeline
                breadcrumbs={layer.breadcrumbs}
                revealedAt={layer.revealed_at_chapter}
                targetChapters={targetChapters}
                onChange={(next) => onUpdate({ breadcrumbs: next })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <MysteryLayerForm
              targetChapters={targetChapters}
              defaultLayerNumber={layer.layer_number}
              initial={layer}
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

// ── Breadcrumb Timeline ──────────────────────────────────────────────────

interface TimelineProps {
  breadcrumbs: { chapter: number; hint: string }[]
  revealedAt: number | null
  targetChapters: number
  onChange: (next: { chapter: number; hint: string }[]) => void
}

const BreadcrumbTimeline: React.FC<TimelineProps> = ({
  breadcrumbs,
  revealedAt,
  targetChapters,
  onChange
}) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draftChapter, setDraftChapter] = useState<string>('1')
  const [draftHint, setDraftHint] = useState<string>('')

  const sorted = useMemo(() => [...breadcrumbs].sort((a, b) => a.chapter - b.chapter), [breadcrumbs])

  const startAdd = () => {
    setEditingIdx(-1)
    setDraftChapter('1')
    setDraftHint('')
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setDraftChapter(String(sorted[idx].chapter))
    setDraftHint(sorted[idx].hint)
  }

  const commit = () => {
    const ch = parseInt(draftChapter, 10)
    if (Number.isNaN(ch) || ch < 1 || !draftHint.trim()) {
      setEditingIdx(null)
      return
    }
    if (editingIdx === -1) {
      onChange([...breadcrumbs, { chapter: ch, hint: draftHint.trim() }])
    } else if (editingIdx !== null) {
      const target = sorted[editingIdx]
      const next = breadcrumbs.map((b) =>
        b.chapter === target.chapter && b.hint === target.hint
          ? { chapter: ch, hint: draftHint.trim() }
          : b
      )
      onChange(next)
    }
    setEditingIdx(null)
  }

  const remove = (idx: number) => {
    const target = sorted[idx]
    onChange(breadcrumbs.filter((b) => !(b.chapter === target.chapter && b.hint === target.hint)))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-on-surface-variant/70 font-semibold uppercase tracking-wider text-[10px]">
          🍞 Breadcrumb Timeline
        </p>
        <button
          onClick={startAdd}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          + Tambah
        </button>
      </div>

      {/* Visual timeline */}
      {sorted.length > 0 && (
        <div className="relative mb-3 px-1 py-3 bg-surface-container-low/60 rounded-lg overflow-x-auto">
          <div className="relative h-10 min-w-full" style={{ width: `${Math.max(targetChapters * 4, 200)}px` }}>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-outline-variant/40" />
            {sorted.map((b, idx) => {
              const pct = Math.min(100, Math.max(0, (b.chapter / targetChapters) * 100))
              return (
                <button
                  key={`${b.chapter}-${idx}`}
                  onClick={() => startEdit(idx)}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${pct}%` }}
                  title={`Bab ${b.chapter}: ${b.hint}`}
                >
                  <span className="block w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-container hover:scale-125 transition-transform" />
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-on-surface-variant whitespace-nowrap">
                    {b.chapter}
                  </span>
                </button>
              )
            })}
            {revealedAt && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${Math.min(100, (revealedAt / targetChapters) * 100)}%` }}
                title={`Reveal di bab ${revealedAt}`}
              >
                <span className="block w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-container" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline list with edit */}
      <ul className="space-y-1.5">
        {sorted.map((b, idx) => (
          <li
            key={`${b.chapter}-${idx}`}
            className="flex items-start gap-2 text-xs text-on-surface"
          >
            <span className="font-mono text-on-surface-variant/70 shrink-0 w-12">
              Bab {b.chapter}
            </span>
            <span className="flex-1 italic text-on-surface-variant">&ldquo;{b.hint}&rdquo;</span>
            <button
              onClick={() => startEdit(idx)}
              className="text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
              aria-label="Edit breadcrumb"
            >
              <span className="material-symbols-outlined text-[12px]">edit</span>
            </button>
            <button
              onClick={() => remove(idx)}
              className="text-on-surface-variant/70 hover:text-error cursor-pointer"
              aria-label="Hapus breadcrumb"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Add/Edit form */}
      <AnimatePresence>
        {editingIdx !== null && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="bg-surface-container-low p-2 rounded-lg flex items-end gap-2 border border-outline-variant/20">
              <div className="w-20">
                <label className="text-[9px] uppercase text-on-surface-variant/60 block mb-0.5">Bab</label>
                <input
                  type="number"
                  min={1}
                  max={targetChapters}
                  value={draftChapter}
                  onChange={(e) => setDraftChapter(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase text-on-surface-variant/60 block mb-0.5">Hint</label>
                <input
                  value={draftHint}
                  onChange={(e) => setDraftHint(e.target.value)}
                  placeholder="Petunjuk halus, bukan reveal"
                  className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit()
                    if (e.key === 'Escape') setEditingIdx(null)
                  }}
                />
              </div>
              <button
                onClick={commit}
                className="px-3 py-1 rounded bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                {editingIdx === -1 ? 'Tambah' : 'Simpan'}
              </button>
              <button
                onClick={() => setEditingIdx(null)}
                className="px-2 py-1 text-on-surface-variant text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Add / Edit Form ──────────────────────────────────────────────────────

interface FormProps {
  targetChapters: number
  defaultLayerNumber: number
  initial?: MysteryLayer
  onCancel: () => void
  onSubmit: (payload: Omit<MysteryLayer, 'id' | 'project_id'> & { project_id?: string }) => Promise<void> | void
}

const MysteryLayerForm: React.FC<FormProps> = ({
  targetChapters,
  defaultLayerNumber,
  initial,
  onCancel,
  onSubmit
}) => {
  const [layerNumber, setLayerNumber] = useState<string>(
    String(initial?.layer_number ?? defaultLayerNumber)
  )
  const [centralQuestion, setCentralQuestion] = useState<string>(initial?.central_question ?? '')
  const [revealedAtChapter, setRevealedAtChapter] = useState<string>(
    initial?.revealed_at_chapter ? String(initial.revealed_at_chapter) : ''
  )
  const [answer, setAnswer] = useState<string>(initial?.answer ?? '')
  const [opensNext, setOpensNext] = useState<string>(initial?.opens_next_question ?? '')
  const [status, setStatus] = useState<MysteryLayer['status']>(initial?.status ?? 'PLANNED')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!centralQuestion.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        layer_number: parseInt(layerNumber, 10) || defaultLayerNumber,
        central_question: centralQuestion.trim(),
        revealed_at_chapter: revealedAtChapter ? parseInt(revealedAtChapter, 10) : null,
        answer: answer.trim() || null,
        opens_next_question: opensNext.trim() || null,
        breadcrumbs: initial?.breadcrumbs ?? [],
        status
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">Layer #</label>
          <input
            type="number"
            min={1}
            value={layerNumber}
            onChange={(e) => setLayerNumber(e.target.value)}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MysteryLayer['status'])}
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="PLANNED">PLANNED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="REVEALED">REVEALED</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
          Pertanyaan Sentral
        </label>
        <input
          value={centralQuestion}
          onChange={(e) => setCentralQuestion(e.target.value)}
          placeholder="Misal: Kenapa Kania menolak Dirga?"
          className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
            Reveal di Bab
          </label>
          <input
            type="number"
            min={1}
            max={targetChapters}
            value={revealedAtChapter}
            onChange={(e) => setRevealedAtChapter(e.target.value)}
            placeholder="opsional"
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
            Buka Pertanyaan Berikutnya
          </label>
          <input
            value={opensNext}
            onChange={(e) => setOpensNext(e.target.value)}
            placeholder="opsional"
            className="w-full px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5">
          Jawaban (opsional, isi saat REVEALED)
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={2}
          placeholder="Jawaban pertanyaan sentral"
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
          disabled={submitting || !centralQuestion.trim()}
          className="px-3 py-1 rounded bg-primary text-on-primary text-xs font-bold cursor-pointer disabled:opacity-40"
        >
          {submitting ? 'Menyimpan...' : initial ? 'Simpan' : 'Tambah Layer'}
        </button>
      </div>
    </div>
  )
}
