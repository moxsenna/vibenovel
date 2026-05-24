import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import type { Character, MysteryLayer } from '../../types/project'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompassStep {
  name: string
  done: boolean
}

interface StoryCompassPreviewProps {
  title: string
  genre: string
  targetEnding: string | null
  characters: Character[]
  mysteryLayers: MysteryLayer[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StoryCompassPreview: React.FC<StoryCompassPreviewProps> = ({
  title,
  genre,
  targetEnding,
  characters,
  mysteryLayers,
}) => {
  // ── Compass Calculations ─────────────────────────────────────────────────
  const compassSteps: CompassStep[] = [
    { name: 'Premis & Genre', done: !!title && !!genre },
    { name: 'Tokoh Utama', done: characters.some((c) => c.role === 'PROTAGONIST') },
    { name: 'Antagonis', done: characters.some((c) => c.role === 'ANTAGONIST') },
    { name: 'Target Ending', done: !!targetEnding },
    { name: 'Lapisan Misteri', done: mysteryLayers.length > 0 },
  ]
  const compassCompleted = compassSteps.filter((s) => s.done).length
  const activeCompassIdx = compassSteps.findIndex((s) => !s.done)
  const isComplete = compassCompleted === 5

  // ── Animation Variants ───────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
    },
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header & Progress */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-headline-md text-primary flex items-center gap-2">
          🧭 Story Compass
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-label-md text-on-surface-variant">
              Progress Fundamental
            </span>
            <span className={`text-label-md font-bold ${isComplete ? 'text-[#4A6E4F]' : 'text-primary'}`}>
              {compassCompleted}/5 {isComplete ? '✅ Lengkap!' : 'wajib terisi'}
            </span>
          </div>
          {/* 5-Segment Progress Bar */}
          <div className="h-2 w-full rounded-full overflow-hidden flex gap-1 bg-surface-bright/20">
            {compassSteps.map((step, i) => (
              <div
                key={i}
                className={`h-full flex-1 transition-all duration-500 ${
                  i === 0 ? 'rounded-l-full' : ''
                } ${i === 4 ? 'rounded-r-full' : ''} ${
                  step.done
                    ? 'bg-primary shadow-[0_0_8px_rgba(232,160,191,0.5)]'
                    : 'bg-surface-bright/30'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Compass Checklist */}
      <motion.div variants={itemVariants} className="space-y-3">
        {compassSteps.map((step, i) => {
          const isTarget = i === activeCompassIdx

          if (isTarget) {
            return (
              <div
                key={i}
                className="bg-surface-container-highest p-4 rounded-xl border border-secondary shadow-[0_0_15px_rgba(239,189,138,0.1)] relative"
              >
                <div className="absolute -right-2 -top-3 bg-secondary text-on-secondary px-3 py-1 rounded-full text-label-md text-[10px] shadow-sm animate-pulse">
                  ← Yuk isi ini dulu!
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-1 animate-spin-slow">
                    radio_button_unchecked
                  </span>
                  <div>
                    <p className="text-body-md text-secondary font-bold">{step.name}</p>
                    <p className="text-body-sm text-on-surface-variant italic mt-1">
                      Sedang dibahas di chat...
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div
              key={i}
              className={`glass-panel p-3 rounded-xl flex items-start gap-3 transition-all hover:bg-surface-container-high ${
                !step.done ? 'opacity-50' : 'hover:scale-[1.01]'
              }`}
            >
              <span
                className={`material-symbols-outlined mt-1 ${
                  step.done ? 'text-primary' : 'text-outline'
                }`}
                style={step.done ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {step.done ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div>
                <p className="text-body-md text-on-surface font-semibold">{step.name}</p>
                {step.done && i === 0 && (
                  <p className="text-body-sm text-on-surface-variant font-mono mt-0.5">
                    {genre}
                  </p>
                )}
                {step.done && i === 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {characters
                      .filter((c) => c.role === 'PROTAGONIST')
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full"
                        >
                          <div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center text-[8px] font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-[10px] text-on-surface font-medium">
                            {c.name}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
                {step.done && i === 2 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {characters
                      .filter((c) => c.role === 'ANTAGONIST')
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1 bg-error-container/20 border border-error/20 px-2 py-0.5 rounded-full"
                        >
                          <div className="w-4 h-4 rounded-full bg-error text-on-error flex items-center justify-center text-[8px] font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-[10px] text-on-surface font-medium">
                            {c.name}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Optional items divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 py-2">
        <div className="h-px bg-surface-variant flex-1" />
        <span className="text-label-md text-on-surface-variant">
          Opsional (bisa nanti)
        </span>
        <div className="h-px bg-surface-variant flex-1" />
      </motion.div>
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {['Item Penting', 'Aturan Dunia', 'Tokoh Pendukung'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full border border-surface-variant text-on-surface-variant text-label-md text-xs hover:bg-surface-variant/30 cursor-pointer transition-colors"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* Generate Outline CTA — only when compass is complete */}
      {isComplete && (
        <motion.div
          variants={itemVariants}
          className="mt-4 space-y-3"
        >
          <SeriesHookField />
          <div className="p-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-center">
            <span className="material-symbols-outlined text-primary text-[32px] block mb-2">
              auto_awesome
            </span>
            <p className="text-body-md text-on-surface font-bold mb-1">
              Story Compass Lengkap!
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Pindah ke tab <strong>Outline</strong> untuk mulai generate outline bab-per-bab.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Sprint 5 — Series Hook Field ──────────────────────────────────────────

const SeriesHookField: React.FC = () => {
  const { activeProject, updateProject } = useProjectStore()
  const [editing, setEditing] = useState<string>(activeProject?.series_hook ?? '')
  const [saving, setSaving] = useState(false)
  const [savedTick, setSavedTick] = useState(false)

  // Sync edit buffer when project changes externally.
  const stored = activeProject?.series_hook ?? ''
  const [prevStored, setPrevStored] = useState(stored)
  if (stored !== prevStored) {
    setPrevStored(stored)
    setEditing(stored)
  }

  if (!activeProject) return null

  const dirty = editing !== (activeProject.series_hook ?? '')

  const save = async () => {
    if (!dirty) return
    setSaving(true)
    try {
      await updateProject(activeProject.id, { series_hook: editing.trim() || null })
      setSavedTick(true)
      setTimeout(() => setSavedTick(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[16px]">link</span>
          🪝 Series Hook
        </span>
        {savedTick && <span className="text-[10px] text-emerald-400 font-bold">✓ Tersimpan</span>}
      </div>
      <p className="text-[10px] text-on-surface-variant/70 italic mb-2">
        Satu pertanyaan besar yang menjaga pembaca dari bab 1 sampai akhir novel.
      </p>
      <textarea
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        rows={2}
        placeholder="Misal: Akankah Kania berhasil menemukan timeline tanpa kematian Dirga?"
        className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs leading-relaxed focus:outline-none focus:border-primary/50 resize-none"
      />
      {dirty && (
        <div className="flex justify-end mt-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold cursor-pointer disabled:opacity-40"
          >
            {saving ? 'Menyimpan...' : 'Simpan Series Hook'}
          </button>
        </div>
      )}
    </div>
  )
}
