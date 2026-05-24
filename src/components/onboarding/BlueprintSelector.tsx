/**
 * BlueprintSelector — Sprint 9
 *
 * 2-step modal:
 *  Step 1: Grid of blueprint cards. Click a card → opens preview.
 *  Step 2: Preview drawer dengan inline rename untuk character archetypes.
 *
 * Keluaran: blueprint id + customNames map (placeholder → user name).
 */

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GENRE_BLUEPRINTS, type GenreBlueprint } from '../../lib/genre-blueprints'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface BlueprintSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (blueprint: GenreBlueprint, customNames: Record<string, string>) => void
}

export const BlueprintSelector: React.FC<BlueprintSelectorProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [previewBp, setPreviewBp] = useState<GenreBlueprint | null>(null)
  const [customNames, setCustomNames] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  if (!isOpen) return null

  const handlePickCard = (bp: GenreBlueprint) => {
    setPreviewBp(bp)
    // Pre-fill customNames with empty values for each placeholder.
    const initial: Record<string, string> = {}
    for (const a of bp.character_archetypes) {
      initial[a.placeholder_name] = ''
    }
    setCustomNames(initial)
  }

  const handleConfirm = () => {
    if (!previewBp) return
    onSelect(previewBp, customNames)
    setPreviewBp(null)
    setCustomNames({})
  }

  const handleBackToGrid = () => {
    setPreviewBp(null)
    setCustomNames({})
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-surface-container-high rounded-[24px] w-full max-w-[1100px] max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/30 inner-glow overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 min-w-0">
            {previewBp && (
              <button
                onClick={handleBackToGrid}
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center cursor-pointer transition-colors shrink-0"
                aria-label="Kembali ke daftar blueprint"
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[26px]">palette</span>
                {previewBp ? `Preview: ${previewBp.emoji} ${previewBp.name}` : 'Pilih Blueprint Genre'}
              </h2>
              <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
                {previewBp
                  ? 'Review template + isi nama tokoh sebelum dipakai. Skip kalau mau pakai placeholder default.'
                  : 'Story Compass akan auto-fill berdasarkan blueprint yang kamu pilih.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {!previewBp ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {GENRE_BLUEPRINTS.map((bp) => (
                  <button
                    key={bp.id}
                    onClick={() => handlePickCard(bp)}
                    className="text-left p-5 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/60 hover:bg-surface-container-highest transition-all cursor-pointer group inner-glow"
                  >
                    <div className="text-4xl mb-3">{bp.emoji}</div>
                    <h3 className="text-title-md font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                      {bp.name}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant/80 leading-relaxed mb-3">
                      {bp.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {bp.suggested_chapters_min}-{bp.suggested_chapters_max} bab
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                        {bp.suggested_word_count} kata/bab
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20">
                        {bp.character_archetypes.length} tokoh
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Tagline + meta row */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/15 p-5">
                  <p className="text-body-md text-on-surface italic leading-relaxed">
                    {previewBp.tagline}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px] uppercase tracking-wide font-bold">
                    <span className="px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                      📚 {previewBp.suggested_chapters_min}-{previewBp.suggested_chapters_max} bab
                    </span>
                    <span className="px-2 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/25">
                      ✍️ {previewBp.suggested_word_count} kata/bab
                    </span>
                  </div>
                </div>

                {/* Narrative Constitution preview */}
                <section>
                  <h3 className="text-title-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
                    Narrative Constitution
                  </h3>
                  <pre className="text-body-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface-container-low rounded-xl border border-outline-variant/15 p-4 max-h-[200px] overflow-y-auto font-sans">
                    {previewBp.narrative_constitution_template}
                  </pre>
                </section>

                {/* Character archetypes — inline rename */}
                <section>
                  <h3 className="text-title-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
                    Tokoh ({previewBp.character_archetypes.length})
                  </h3>
                  <p className="text-body-sm text-on-surface-variant/70 mb-3">
                    Isi nama tokoh sesuai cerita kamu. Yang dilewati akan pakai placeholder default.
                  </p>
                  <div className="space-y-2">
                    {previewBp.character_archetypes.map((arch) => (
                      <div
                        key={arch.placeholder_name}
                        className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15"
                      >
                        <div className="md:w-32 shrink-0">
                          <span className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant/60">
                            {arch.role}
                          </span>
                          <p className="text-[10px] text-on-surface-variant/50 italic mt-0.5">
                            {arch.placeholder_name}
                          </p>
                        </div>
                        <input
                          type="text"
                          placeholder={arch.placeholder_name}
                          value={customNames[arch.placeholder_name] ?? ''}
                          onChange={(e) =>
                            setCustomNames((prev) => ({
                              ...prev,
                              [arch.placeholder_name]: e.target.value
                            }))
                          }
                          className="md:w-48 h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-md transition-all shrink-0"
                        />
                        <p className="flex-1 text-[11px] text-on-surface-variant/70 leading-snug min-w-0">
                          {arch.description_template}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Mystery skeleton preview */}
                {previewBp.mystery_layer_skeleton.length > 0 && (
                  <section>
                    <h3 className="text-title-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                      Lapisan Misteri ({previewBp.mystery_layer_skeleton.length})
                    </h3>
                    <ul className="space-y-1.5">
                      {previewBp.mystery_layer_skeleton.map((m) => (
                        <li
                          key={m.layer_number}
                          className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg border border-outline-variant/15 px-3 py-2"
                        >
                          <span className="font-bold text-on-surface">Layer {m.layer_number}:</span>{' '}
                          {m.question_template}
                          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">
                            Reveal di sekitar {Math.round(m.reveal_arc_position * 100)}% perjalanan cerita.
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Arc pacing hint */}
                <section>
                  <h3 className="text-title-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">timeline</span>
                    Arc Pacing Hint
                  </h3>
                  <p className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg border border-outline-variant/15 p-3 leading-relaxed">
                    {previewBp.arc_pacing_hint}
                  </p>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {previewBp && (
          <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container">
            <button
              onClick={handleBackToGrid}
              className="px-5 h-11 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-label-lg font-bold cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              ← Pilih Lain
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 h-11 rounded-full btn-gradient text-white text-label-lg font-bold cursor-pointer flex items-center gap-2 hover-glow"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Pakai Blueprint Ini
            </button>
          </footer>
        )}
      </motion.div>
    </div>
  )
}
