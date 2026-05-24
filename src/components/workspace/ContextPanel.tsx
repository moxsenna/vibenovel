import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'
import { useProjectStore } from '../../store/useProjectStore'
import { StoryCompassPreview } from '../compass/StoryCompassPreview'
import { StateTimeline } from '../compass/StateTimeline'
import { MysteryLayerPanel } from '../compass/MysteryLayerPanel'
import { VoiceDNAEditor } from '../compass/VoiceDNAEditor'
import { MimicryEngineCard } from '../compass/MimicryEngineCard'
import { stateTracker } from '../../services/state-tracker'

export const ContextPanel: React.FC = () => {
  // Store hooks
  const activeMode = useUiStore((s) => s.activeMode)
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const setActiveChapterNumber = useUiStore((s) => s.setActiveChapter)
  const qaLogs = useUiStore((s) => s.qaLogs)

  const {
    activeProject,
    chapters,
    characters,
    characterStates,
    items,
    worldRules,
    mysteryLayers,
    addCharacter,
    getLatestStatesForChapter,
    upsertCharacterStates
  } = useProjectStore()

  // Character creation local states
  const [isAddingChar, setIsAddingChar] = useState(false)
  const [newCharName, setNewCharName] = useState('')
  const [newCharRole, setNewCharRole] = useState<'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'>('SUPPORTING')
  const [newCharDesc, setNewCharDesc] = useState('')

  // State generation tracking
  const [localStateGenStatus, setLocalStateGenStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')

  if (!activeProject) return null

  // Active Chapter selector
  const activeChapter = chapters.find((ch) => ch.chapter_number === activeChapterNumber)

  const handleRegenerateState = async () => {
    if (!activeChapter || !activeChapter.prose || !activeProject) return
    setLocalStateGenStatus('generating')
    try {
      const prevStates = getLatestStatesForChapter(activeChapter.chapter_number)
      const prevContext = prevStates.length > 0
        ? stateTracker.formatStatesForContext(prevStates, characters)
        : undefined

      const states = await stateTracker.generateStateSnapshot(
        activeProject,
        activeChapter,
        characters,
        prevContext
      )

      if (states.length > 0) {
        await upsertCharacterStates(activeChapter.chapter_number, states)
      }
      setLocalStateGenStatus('done')
      setTimeout(() => setLocalStateGenStatus('idle'), 3000)
    } catch (err) {
      console.error('Manual state generation failed:', err)
      setLocalStateGenStatus('error')
      setTimeout(() => setLocalStateGenStatus('idle'), 3000)
    }
  }

  const handleAddChar = () => {
    if (!newCharName.trim()) return
    addCharacter({
      project_id: activeProject.id,
      name: newCharName,
      role: newCharRole,
      description: newCharDesc,
      voice_dna: {},
      activation_keys: [newCharName],
      priority: 5,
      is_locked: false,
      genesis: 'MANUAL'
    })
    setIsAddingChar(false)
    setNewCharName('')
    setNewCharDesc('')
  }

  // Animation variants
  const panelVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: 360,
      opacity: 1,
      transition: {
        width: { type: 'spring' as const, stiffness: 300, damping: 32 },
        opacity: { duration: 0.2 }
      }
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        width: { type: 'spring' as const, stiffness: 300, damping: 32 },
        opacity: { duration: 0.15 }
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
  }

  return (
    <motion.aside
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-full border-r border-surface-variant/20 bg-surface-container-low flex flex-col flex-shrink-0 overflow-hidden hidden md:flex"
      data-tour-step="context-panel"
    >
      <div className="w-[360px] h-full flex flex-col justify-between overflow-hidden">
        {/* Scrollable Contents */}
        <div className="p-5 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {/* ── BRAINSTORM MODE ── */}
            {activeMode === 'brainstorm' && (
              <motion.div
                key="brainstorm-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <StoryCompassPreview
                  title={activeProject.title}
                  genre={activeProject.genre}
                  targetEnding={activeProject.target_ending}
                  characters={characters}
                  mysteryLayers={mysteryLayers}
                />
                <MysteryLayerPanel />
                <VoiceDNAEditor />
              </motion.div>
            )}

            {/* ── OUTLINE MODE ── */}
            {activeMode === 'outline' && (
              <motion.div
                key="outline-panel"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-5"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-on-surface-variant uppercase tracking-wider text-label-md">
                      Karakter ({characters.length})
                    </span>
                    <button
                      onClick={() => setIsAddingChar(!isAddingChar)}
                      className="w-6 h-6 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isAddingChar ? 'close' : 'add'}
                      </span>
                    </button>
                  </div>

                  {isAddingChar && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-3 bg-surface-container rounded-xl border border-primary space-y-2.5 mb-3 overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Nama Karakter..."
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary/50"
                      />
                      <select
                        value={newCharRole}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setNewCharRole(
                            e.target.value as 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
                          )
                        }
                        className="w-full h-8 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none"
                      >
                        <option value="PROTAGONIST">Protagonis</option>
                        <option value="ANTAGONIST">Antagonis</option>
                        <option value="SUPPORTING">Supporting</option>
                        <option value="MINOR">Minor</option>
                      </select>
                      <textarea
                        placeholder="Deskripsi/Voice..."
                        value={newCharDesc}
                        onChange={(e) => setNewCharDesc(e.target.value)}
                        className="w-full h-12 p-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface text-body-sm focus:outline-none resize-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setIsAddingChar(false)}
                          className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-label-md text-on-surface-variant cursor-pointer hover:bg-surface-variant/30"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleAddChar}
                          className="px-2.5 py-1 rounded btn-gradient text-white text-label-md font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    {characters.map((c) => (
                      <motion.div
                        key={c.id}
                        variants={itemVariants}
                        className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-outline-variant transition-colors"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-on-surface text-body-sm">{c.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">
                            {c.role}
                          </span>
                        </div>
                        <p className="text-label-md text-on-surface-variant leading-relaxed">
                          {c.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-semibold text-on-surface-variant uppercase tracking-wider text-label-md mb-2">
                    Benda & Artefak ({items.length})
                  </span>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className="p-3 rounded-xl bg-surface-container border border-outline-variant/30"
                      >
                        <span className="font-bold text-on-surface text-body-sm block">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mt-0.5">
                          {item.category} • {item.current_owner || 'Tanpa Pemilik'}
                        </span>
                        <p className="text-label-md text-on-surface-variant leading-relaxed mt-1">
                          {item.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {worldRules.length > 0 && (
                  <div>
                    <span className="block font-semibold text-on-surface-variant uppercase tracking-wider text-label-md mb-2">
                      Aturan Dunia ({worldRules.length})
                    </span>
                    <div className="space-y-2">
                      {worldRules.map((rule) => (
                        <motion.div
                          key={rule.id}
                          variants={itemVariants}
                          className="p-3 rounded-xl bg-surface-container border border-outline-variant/30"
                        >
                          <span className="font-bold text-on-surface text-body-sm block">
                            📜 {rule.name}
                          </span>
                          <p className="text-label-md text-on-surface-variant leading-relaxed mt-1">
                            {rule.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprint 9 — Mimicry Engine project-wide voice DNA */}
                <MimicryEngineCard placement="context-panel" />
              </motion.div>
            )}

            {/* ── WRITE MODE ── */}
            {activeMode === 'write' && (
              <motion.div
                key="write-panel"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-4"
              >
                {activeChapter ? (
                  <>
                    <motion.div
                      variants={itemVariants}
                      className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30"
                    >
                      <span className="font-bold text-on-surface block mb-1 text-body-sm">
                        Outline Bab {activeChapter.chapter_number}
                      </span>
                      <p className="text-label-md text-on-surface-variant leading-relaxed">
                        {activeChapter.synopsis || 'Draf sinopsis kosong.'}
                      </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <span className="block font-semibold text-on-surface-variant uppercase tracking-wider text-label-md mb-2">
                        Events
                      </span>
                      <div className="space-y-1.5">
                        {activeChapter.key_events?.map((ev, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-body-sm text-on-surface-variant"
                          >
                            <span
                              className="material-symbols-outlined text-[15px] text-primary mt-0.5"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                            <span>{ev}</span>
                          </div>
                        ))}
                        {(!activeChapter.key_events || activeChapter.key_events.length === 0) && (
                          <p className="text-body-sm text-on-surface-variant/50 italic">
                            Belum ada event terdaftar.
                          </p>
                        )}
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <StateTimeline
                        characterStates={characterStates}
                        characters={characters}
                        activeChapterNumber={activeChapter.chapter_number}
                        onRegenerate={activeChapter.prose && activeChapter.prose.trim().length >= 50 ? handleRegenerateState : undefined}
                        stateGenStatus={localStateGenStatus}
                      />
                    </motion.div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-outline text-[48px] block mb-2">
                      auto_stories
                    </span>
                    <p className="text-body-sm text-on-surface-variant">
                      Pilih bab di bagian bawah untuk melihat context.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── REVIEW MODE ── */}
            {activeMode === 'review' && (
              <motion.div
                key="review-panel"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div
                  variants={itemVariants}
                  className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30 text-center"
                >
                  <span className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Status Bab
                  </span>
                  <span className="text-body-sm font-bold text-primary uppercase tracking-wide">
                    {activeChapter?.status || 'OUTLINE_ONLY'}
                  </span>
                </motion.div>

                {qaLogs ? (
                  <motion.div variants={itemVariants} className="space-y-3">
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        qaLogs.passed
                          ? 'bg-[#3B5A40]/20 border-[#4A6E4F]/30 text-[#E2F0E5]'
                          : 'bg-error-container/20 border-error/30 text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] mt-0.5">
                        {qaLogs.passed ? 'check_circle' : 'warning'}
                      </span>
                      <div>
                        <span className="font-bold text-body-sm block">
                          {qaLogs.passed ? 'Lulus Validasi QA' : 'Gagal Validasi QA'}
                        </span>
                      </div>
                    </div>
                    {qaLogs.warnings.length > 0 && (
                      <div className="space-y-2">
                        {qaLogs.warnings.map((w, i) => (
                          <div
                            key={i}
                            className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 text-body-sm text-on-surface-variant"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.span
                    variants={itemVariants}
                    className="text-on-surface-variant/60 italic block text-body-sm text-center py-6"
                  >
                    Jalankan Plot Radar QA dari main canvas untuk melihat laporan validasi naskah.
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chapter Selector Footer */}
        <div className="mt-auto p-5 border-t border-outline-variant/20 bg-surface-container/30 flex justify-between items-center text-body-sm shrink-0">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">
              Bab Terpilih
            </span>
            <span className="text-on-surface font-bold mt-0.5 truncate">
              Bab {activeChapterNumber}: {activeChapter?.title || 'Belum Ada Judul'}
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setActiveChapterNumber(Math.max(1, activeChapterNumber - 1))}
              className="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-variant/30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              onClick={() => setActiveChapterNumber(activeChapterNumber + 1)}
              className="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-variant/30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
