/**
 * TargetChaptersAdjustmentModal — Sprint 9
 *
 * UI untuk Tambah/Kurangi target_chapters dengan validasi LOCKED chapters.
 *
 * Mode otomatis berdasarkan input:
 *   - newTarget > current: pilih radio "Tambah Season Baru" / "Peregangan Alur"
 *   - newTarget < current: shrink dengan side-effect preview + 2-step confirm
 *   - newTarget === current: Submit disabled
 *
 * GUARD: project status COMPLETED → render disabled state with friendly message.
 */

import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '../../types/project'
import {
  expandTargetNewSeason,
  expandTargetStretch,
  shrinkTarget,
  previewShrink
} from '../../services/target-chapters-adjuster'
import { useProjectStore } from '../../store/useProjectStore'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface TargetChaptersAdjustmentModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
}

type ExpandMode = 'NEW_SEASON' | 'STRETCH'

export const TargetChaptersAdjustmentModal: React.FC<TargetChaptersAdjustmentModalProps> = ({
  isOpen,
  project,
  onClose
}) => {
  const [newTarget, setNewTarget] = useState(project?.target_chapters ?? 100)
  const [expandMode, setExpandMode] = useState<ExpandMode>('NEW_SEASON')
  const [confirmShrink, setConfirmShrink] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  // Sync newTarget when modal opens with a different project
  // (prev-prop-during-render pattern, no useEffect setState).
  const [lastProjectId, setLastProjectId] = useState(project?.id ?? null)
  if (project && project.id !== lastProjectId) {
    setLastProjectId(project.id)
    setNewTarget(project.target_chapters)
    setExpandMode('NEW_SEASON')
    setConfirmShrink(false)
    setFeedback(null)
  }

  const direction: 'expand' | 'shrink' | 'same' = useMemo(() => {
    if (!project) return 'same'
    if (newTarget > project.target_chapters) return 'expand'
    if (newTarget < project.target_chapters) return 'shrink'
    return 'same'
  }, [newTarget, project])

  const shrinkPreview = useMemo(() => {
    if (!project || direction !== 'shrink') return null
    return previewShrink(project.id, newTarget)
  }, [project, newTarget, direction])

  if (!isOpen || !project) return null

  // ── COMPLETED guard ────────────────────────────────────────────────────
  if (project.status === 'COMPLETED') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-surface-container-high rounded-[20px] w-full max-w-[480px] p-7 shadow-2xl border border-outline-variant/30 inner-glow"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏁</span>
            <h3 className="text-headline-sm font-bold text-on-surface">Proyek sudah tamat</h3>
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed mb-5">
            Status proyek ini <span className="font-bold">COMPLETED</span>. Untuk mengubah target bab,
            ubah dulu status proyek (misalnya jadi PAUSED atau WRITING) lewat Workspace.
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-full bg-primary text-on-primary font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Mengerti
          </button>
        </motion.div>
      </div>
    )
  }

  const canSubmit =
    direction !== 'same' &&
    newTarget > 0 &&
    (direction !== 'shrink' || confirmShrink)

  const handleSubmit = async () => {
    if (!canSubmit || !project) return
    setSubmitting(true)
    setFeedback(null)
    try {
      if (direction === 'expand') {
        if (expandMode === 'NEW_SEASON') {
          await expandTargetNewSeason(project.id, newTarget)
          setFeedback({
            kind: 'ok',
            text: `Target naik ke ${newTarget} bab. Outline lama tetap utuh.`
          })
        } else {
          const result = await expandTargetStretch(project.id, newTarget)
          setFeedback({
            kind: 'ok',
            text: `Target naik ke ${newTarget} bab. ${result.regenerated} outline regenerated, ${result.skipped} di-skip (locked).`
          })
        }
      } else if (direction === 'shrink') {
        const result = await shrinkTarget(project.id, newTarget)
        setFeedback({
          kind: 'ok',
          text: `Target turun ke ${newTarget} bab. ${result.deleted} outline dihapus, ${result.threadsClamped} thread + ${result.mysteriesClamped} mystery di-clamp, ${result.statesDeleted} character state dibersihkan.`
        })
      }
      // Reload project data to refresh UI
      await useProjectStore.getState().loadProjectData(project.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setFeedback({ kind: 'err', text: `Gagal: ${msg}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
              <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
              Ubah Target Bab
            </h3>
            <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
              Saat ini: <span className="font-bold text-on-surface">{project.target_chapters} bab</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
              Target Baru
            </label>
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value, 10) || 0)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-lg font-bold"
            />
          </div>

          {/* EXPAND mode selector */}
          {direction === 'expand' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-body-sm text-on-surface-variant">
                Naik dari {project.target_chapters} → {newTarget}. Pilih cara ekspansi:
              </p>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="radio"
                  name="expand-mode"
                  value="NEW_SEASON"
                  checked={expandMode === 'NEW_SEASON'}
                  onChange={() => setExpandMode('NEW_SEASON')}
                  className="mt-1 accent-primary cursor-pointer"
                />
                <div>
                  <span className="font-bold text-on-surface">🌱 Tambah Season Baru</span>
                  <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                    Outline lama tetap utuh. Bab baru ({project.target_chapters + 1}-{newTarget}) jadi season berikutnya yang fresh.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="radio"
                  name="expand-mode"
                  value="STRETCH"
                  checked={expandMode === 'STRETCH'}
                  onChange={() => setExpandMode('STRETCH')}
                  className="mt-1 accent-primary cursor-pointer"
                />
                <div>
                  <span className="font-bold text-on-surface">🪢 Peregangan Alur</span>
                  <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                    Geser klimaks ke bab {newTarget}. Outline yang belum ditulis di-regenerate dengan pacing baru. Bab locked tetap aman.
                  </p>
                </div>
              </label>
            </motion.div>
          )}

          {/* SHRINK preview */}
          {direction === 'shrink' && shrinkPreview && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {shrinkPreview.blockingLocked > 0 ? (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30">
                  <h4 className="font-bold text-error mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    Tidak bisa kurangi ke {newTarget}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Ada <span className="font-bold">{shrinkPreview.blockingLocked} bab terkunci</span> di atas target ini. Minimum aman: <span className="font-bold">{shrinkPreview.minAllowed} bab</span>.
                  </p>
                  <p className="text-[11px] text-on-surface-variant/70 mt-2">
                    Bab terkunci = ada prosa, manual lock, atau status IMPORTED.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      Konsekuensi
                    </h4>
                    <ul className="text-body-sm text-on-surface-variant space-y-0.5 ml-1">
                      <li>🗑 <span className="font-bold">{shrinkPreview.outlineOnlyToDelete}</span> outline-only chapters akan DIHAPUS PERMANEN.</li>
                      <li>🧵 <span className="font-bold">{shrinkPreview.threadsAffected}</span> plot thread akan di-clamp (planted_at / resolved_at di-reset).</li>
                      <li>🔮 <span className="font-bold">{shrinkPreview.mysteriesAffected}</span> mystery layer akan di-reset (revealed_at + breadcrumbs).</li>
                      <li>📝 <span className="font-bold">{shrinkPreview.statesAffected}</span> character state snapshot akan dibersihkan.</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmShrink}
                      onChange={(e) => setConfirmShrink(e.target.checked)}
                      className="mt-1 accent-primary cursor-pointer"
                    />
                    <span className="text-body-sm text-on-surface">
                      Saya mengerti operasi ini tidak bisa di-undo. Lanjutkan.
                    </span>
                  </label>
                </>
              )}
            </motion.div>
          )}

          {direction === 'same' && (
            <p className="text-body-sm text-on-surface-variant/70 italic text-center py-4">
              Target sama dengan saat ini.
            </p>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key={feedback.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`p-3 rounded-xl text-body-sm ${
                  feedback.kind === 'ok'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-error/10 border border-error/30 text-error'
                }`}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 bg-surface-container">
          <button
            onClick={onClose}
            className="px-5 h-11 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-label-lg font-bold cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || (shrinkPreview?.blockingLocked ?? 0) > 0}
            className="px-6 h-11 rounded-full btn-gradient text-white text-label-lg font-bold cursor-pointer flex items-center gap-2 hover-glow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                Memproses...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Terapkan
              </>
            )}
          </button>
        </footer>
      </motion.div>
    </div>
  )
}
