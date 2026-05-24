import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Chapter } from '../../types/project'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'

interface ChapterOutlineCardProps {
  chapter: Chapter
  isActive: boolean
  onSelect: () => void
}

export const ChapterOutlineCard: React.FC<ChapterOutlineCardProps> = ({
  chapter,
  isActive,
  onSelect
}) => {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editSynopsis, setEditSynopsis] = useState(chapter.synopsis || '')
  const [editTitle, setEditTitle] = useState(chapter.title || '')
  const [regenerating, setRegenerating] = useState(false)

  const updateChapter = useProjectStore((s) => s.updateChapter)
  const regenerateOutline = useProjectStore((s) => s.regenerateOutline)
  const lockOutline = useProjectStore((s) => s.lockOutline)
  const deleteChapter = useProjectStore((s) => s.deleteChapter)
  
  const showConfirm = useUiStore((s) => s.showConfirm)
  const addToast = useUiStore((s) => s.addToast)
  const characters = useProjectStore((s) => s.characters)
  const mysteryLayers = useProjectStore((s) => s.mysteryLayers)
  const activeProject = useProjectStore((s) => s.activeProject)

  // ── Story Compass completeness check for Regenerate guard ──
  const isCompassComplete = useMemo(() => {
    if (!activeProject) return false
    return (
      !!activeProject.title &&
      !!activeProject.genre &&
      characters.some((c) => c.role === 'PROTAGONIST') &&
      characters.some((c) => c.role === 'ANTAGONIST') &&
      !!activeProject.target_ending &&
      mysteryLayers.length > 0
    )
  }, [activeProject, characters, mysteryLayers])

  const ch = chapter

  // Emotional tone color mapping
  const toneColors: Record<string, string> = {
    'TENSION': 'bg-error/15 text-error border-error/20',
    'CONFLICT': 'bg-error/15 text-error border-error/20',
    'SHOCK': 'bg-error/20 text-error border-error/30',
    'RELIEF': 'bg-tertiary/15 text-tertiary border-tertiary/20',
    'BREATHER': 'bg-tertiary/15 text-tertiary border-tertiary/20',
    'DOPAMINE': 'bg-secondary/15 text-secondary border-secondary/20',
    'MYSTERY': 'bg-primary/15 text-primary border-primary/20'
  }

  const cliffhangerIcons: Record<string, string> = {
    'REVELATION': '💡',
    'DANGER': '⚠️',
    'DECISION': '⚖️',
    'BETRAYAL': '🗡️',
    'COUNTDOWN': '⏰',
    'EMOTIONAL': '💔'
  }

  const handleSaveManualEdit = async () => {
    await updateChapter(ch.id, {
      title: editTitle,
      synopsis: editSynopsis,
      outline_source: 'MANUAL'
    })
    setEditing(false)
  }

  const handleRegenerate = async () => {
    const proceedWithRegen = async () => {
      if (ch.prose) {
        addToast('Bab ini sudah ada prosa. Hapus prosa dulu sebelum regenerate outline.', 'error')
        return
      }
      setRegenerating(true)
      try {
        await regenerateOutline(ch.id)
        addToast(`Outline Bab ${ch.chapter_number} berhasil diregenerasi!`, 'success')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error'
        addToast(`Gagal: ${msg}`, 'error')
      } finally {
        setRegenerating(false)
      }
    }

    if (ch.outline_source === 'MANUAL') {
      showConfirm({
        title: 'Overwrite Outline?',
        message: 'Outline ini dibuat manual. Apakah Anda yakin ingin menulis ulang (overwrite) data outline ini dengan AI?',
        confirmText: 'Ya, Overwrite',
        cancelText: 'Batal',
        severity: 'warning',
        onConfirm: proceedWithRegen
      })
      return
    }

    if (ch.outline_source === 'IMPORTED') {
      showConfirm({
        title: 'Regenerate Outline Import?',
        message: 'Bab ini diimpor dari naskah Anda. Proses regenerasi akan mengubah sumber outline menjadi GENERATED dan mengganti data yang ada. Lanjutkan?',
        confirmText: 'Ya, Lanjutkan',
        cancelText: 'Batal',
        severity: 'warning',
        onConfirm: async () => {
          await updateChapter(ch.id, { is_locked: false, outline_source: 'MANUAL' })
          await proceedWithRegen()
        }
      })
      return
    }

    await proceedWithRegen()
  }

  const handleDelete = async () => {
    showConfirm({
      title: 'Hapus Outline?',
      message: `Apakah Anda yakin ingin menghapus outline Bab ${ch.chapter_number}? Tindakan ini akan menghapus data outline secara permanen.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      severity: 'danger',
      onConfirm: async () => {
        await deleteChapter(ch.id)
        addToast(`Outline Bab ${ch.chapter_number} berhasil dihapus!`, 'success')
      }
    })
  }

  const handleToggleLock = async () => {
    await lockOutline(ch.id, !ch.is_locked)
  }

  // Get arc position label
  const arcLabel = (() => {
    const ap = ch.arc_position
    if (!ap || typeof ap !== 'object') return null
    if ('label' in ap && typeof ap.label === 'string') {
      return ap.label
    }
    if ('subArc' in ap) {
      const season = 'season' in ap ? ap.season : '?'
      const subArc = 'subArc' in ap ? ap.subArc : ''
      return `Season ${String(season)}: ${String(subArc)}`
    }
    return JSON.stringify(ap)
  })()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-surface-container rounded-[20px] border shadow-sm transition-all cursor-pointer inner-glow ${
        isActive
          ? 'border-primary scale-[1.01] shadow-md'
          : 'border-outline-variant/20 hover:border-primary/40'
      }`}
    >
      {/* ── Collapsed Header ── */}
      <div
        className="p-5"
        onClick={() => { onSelect(); setExpanded(!expanded) }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-body-sm font-bold text-on-surface whitespace-nowrap">
              Bab {ch.chapter_number}
            </span>
            <span className="text-body-sm text-on-surface-variant truncate">
              • {ch.title || 'Tanpa judul'}
            </span>
            {ch.is_locked && (
              <span className="text-[12px]" title="Terkunci">🔒</span>
            )}
            {ch.outline_source === 'MANUAL' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 font-bold uppercase">
                Manual
              </span>
            )}
            {ch.outline_source === 'IMPORTED' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/20 font-bold uppercase">
                📥 Imported
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Emotional Tone Chip */}
            {ch.emotional_tone && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                toneColors[ch.emotional_tone] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
              }`}>
                🎭 {ch.emotional_tone}
              </span>
            )}

            {/* Cliffhanger Chip */}
            {ch.cliffhanger_type && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant/30">
                {cliffhangerIcons[ch.cliffhanger_type] || '🪝'} {ch.cliffhanger_type}
              </span>
            )}

            {/* Dopamine Indicator */}
            {ch.dopamine_beat && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/20">
                ⚡ Dopamine
              </span>
            )}

            {/* False Resolution Indicator (Sprint 5) */}
            {ch.false_resolution && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                💔 False Resolution
              </span>
            )}

            {/* Status Badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
              {ch.status}
            </span>
          </div>
        </div>

        {/* Synopsis Preview */}
        {!expanded && ch.synopsis && (
          <p className="text-body-sm text-on-surface-variant leading-relaxed mt-2.5 line-clamp-2">
            {ch.synopsis}
          </p>
        )}
      </div>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-outline-variant/10 pt-4">
              {/* ── Edit Mode ── */}
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider block mb-1">
                      Judul
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider block mb-1">
                      Sinopsis
                    </label>
                    <textarea
                      value={editSynopsis}
                      onChange={(e) => setEditSynopsis(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing(false)}
                      className="h-9 px-4 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveManualEdit}
                      className="h-9 px-4 rounded-lg btn-gradient text-white font-semibold text-label-md cursor-pointer hover-glow"
                    >
                      Simpan (Manual)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Synopsis */}
                  {ch.synopsis && (
                    <div>
                      <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                        Sinopsis
                      </span>
                      <p className="text-body-sm text-on-surface leading-relaxed">
                        {ch.synopsis}
                      </p>
                    </div>
                  )}

                  {/* Key Events */}
                  {ch.key_events?.length > 0 && (
                    <div>
                      <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                        Peristiwa Utama
                      </span>
                      <ul className="list-disc list-inside text-body-sm text-on-surface space-y-0.5">
                        {ch.key_events.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Characters & Items Row */}
                  <div className="flex flex-wrap gap-4">
                    {ch.active_characters?.length > 0 && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                          Karakter
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ch.active_characters.map((name, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 font-semibold">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ch.active_items?.length > 0 && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                          Item
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ch.active_items.map((name, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15 font-semibold">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location & Time */}
                  <div className="flex flex-wrap gap-4 text-body-sm">
                    {ch.location && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">📍 Lokasi</span>
                        <span className="text-on-surface">{ch.location}</span>
                      </div>
                    )}
                    {ch.time_in_story && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">🕐 Waktu</span>
                        <span className="text-on-surface">{ch.time_in_story}</span>
                      </div>
                    )}
                  </div>

                  {/* Arc Position */}
                  {arcLabel && (
                    <div>
                      <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">🗺️ Posisi Arc</span>
                      <span className="text-body-sm text-on-surface">{arcLabel}</span>
                    </div>
                  )}

                  {/* Cliffhanger Setup */}
                  {ch.cliffhanger_setup && (
                    <div>
                      <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">🪝 Setup Cliffhanger</span>
                      <p className="text-body-sm text-on-surface italic">{ch.cliffhanger_setup}</p>
                    </div>
                  )}

                  {/* Threads */}
                  <div className="flex flex-wrap gap-4">
                    {ch.open_threads?.length > 0 && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">📖 Thread Dibuka</span>
                        <ul className="list-disc list-inside text-body-sm text-on-surface space-y-0.5">
                          {ch.open_threads.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {ch.resolved_threads?.length > 0 && (
                      <div>
                        <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">✅ Thread Selesai</span>
                        <ul className="list-disc list-inside text-body-sm text-on-surface space-y-0.5">
                          {ch.resolved_threads.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Foreshadowing */}
                  {ch.foreshadowing?.length > 0 && (
                    <div>
                      <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">🔮 Foreshadowing</span>
                      <ul className="list-disc list-inside text-body-sm text-on-surface/70 italic space-y-0.5">
                        {ch.foreshadowing.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Paywall & Filler Risk */}
                  <div className="flex flex-wrap gap-3">
                    {ch.paywall_advice && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                        💰 {ch.paywall_advice}
                      </span>
                    )}
                    {ch.filler_risk && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                        ch.filler_risk === 'high'
                          ? 'bg-error/10 text-error border-error/20'
                          : ch.filler_risk === 'medium'
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
                      }`}>
                        📊 Risiko Filler: {ch.filler_risk.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRegenerate() }}
                      disabled={regenerating || ch.is_locked || !isCompassComplete}
                      title={!isCompassComplete ? 'Story Compass belum lengkap — lengkapi di Brainstorm terlebih dahulu' : undefined}
                      className="h-8 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {regenerating ? (
                        <div className="w-3 h-3 border-2 border-on-surface-variant/30 border-t-on-surface-variant rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                      )}
                      Regenerate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTitle(ch.title || '')
                        setEditSynopsis(ch.synopsis || '')
                        setEditing(true)
                      }}
                      className="h-8 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLock() }}
                      className="h-8 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {ch.is_locked ? 'lock_open' : 'lock'}
                      </span>
                      {ch.is_locked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete() }}
                      className="h-8 px-3 rounded-lg bg-error/10 border border-error/20 text-error text-label-md cursor-pointer hover:bg-error/20 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
