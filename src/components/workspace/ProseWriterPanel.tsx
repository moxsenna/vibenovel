import React, { useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BeatIndicator } from '../prose/BeatIndicator'
import { ProseToolbar } from '../prose/ProseToolbar'
import { BeatEditor, type BeatEditorHandle } from '../prose/BeatEditor'
import { FreeWriteEditor } from '../prose/FreeWriteEditor'
import {
  SelectionToolbar,
  type SelectionInfo
} from '../prose/SelectionToolbar'
import { DirectorsCutModal } from '../modals/DirectorsCutModal'
import { RecapModal } from '../modals/RecapModal'
import { VersionHistoryModal } from '../modals/VersionHistoryModal'
import { useBeatWriter } from '../../hooks/useBeatWriter'
import { useUiStore } from '../../store/useUiStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { aiRouter } from '../../services/ai/ai-router'
import type { Chapter } from '../../types/project'
import { isNonEmptyStoryContract } from '../../services/story-contract-validator'

const CHAPTER_STATUS_BADGES: Record<Chapter['status'], { className: string; text: string }> = {
  OUTLINE_ONLY: {
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    text: 'Rencana'
  },
  DRAFT: {
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    text: 'Draft'
  },
  FINAL: {
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
    text: 'Selesai'
  },
  GENERATING: {
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse',
    text: 'Menulis...'
  },
  IMPORTED: {
    className: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    text: 'Impor'
  }
}

export const ProseWriterPanel: React.FC = () => {
  const activeProject = useProjectStore((s) => s.activeProject)
  const characters = useProjectStore((s) => s.characters)
  const mysteryLayers = useProjectStore((s) => s.mysteryLayers)
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel)
  const contextPanelOpen = useUiStore((s) => s.contextPanelOpen)
  const chapters = useProjectStore((s) => s.chapters)
  const createChapterVersion = useProjectStore((s) => s.createChapterVersion)
  const setMode = useUiStore((s) => s.setMode)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const chapter = chapters.find((c) => c.chapter_number === activeChapterNumber)

  const compassStatus = useMemo(() => {
    if (!activeProject) return { isComplete: false, missing: [] as string[] }
    const missing: string[] = []
    if (!activeProject.title || !activeProject.genre) missing.push('Premis & Genre')
    if (!isNonEmptyStoryContract(activeProject.story_contract)) missing.push('Story Contract')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) missing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) missing.push('Antagonis')
    if (!activeProject.target_ending) missing.push('Target Ending')
    if (mysteryLayers.length === 0) missing.push('Lapisan Misteri')
    return { isComplete: missing.length === 0, missing }
  }, [activeProject, characters, mysteryLayers])

  if (!chapter) {
    const hasChapters = chapters.length > 0
    const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar bg-surface-container-lowest"
      >
        <div className="max-w-xl w-full text-center space-y-8 glass-card p-8 rounded-3xl border border-outline-variant/30 shadow-xl relative overflow-hidden">
          {/* Decorative subtle background glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center space-y-3 relative z-10">
            {hasChapters ? (
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg hover-glow transition-all">
                <span className="material-symbols-outlined text-white text-[32px]">
                  menu_book
                </span>
              </div>
            ) : compassStatus.isComplete ? (
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg hover-glow transition-all">
                <span className="material-symbols-outlined text-white text-[32px]">
                  edit_note
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[32px]">
                  explore
                </span>
              </div>
            )}
            <h2 className="text-2xl md:text-3xl font-display font-bold text-on-surface tracking-tight mt-2">
              {hasChapters
                ? 'Pilih Bab untuk Menulis'
                : compassStatus.isComplete
                  ? 'Mulai Tulis Kisah Anda'
                  : 'Lengkapi Kompas Cerita Anda'}
            </h2>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
              {hasChapters
                ? 'Langkah awal petualangan imajinatif. Pilih bab di bawah ini atau buka panel bab untuk mulai menenun kata demi kata.'
                : compassStatus.isComplete
                  ? 'Proyek ini sudah dilengkapi Story Compass. Sekarang saatnya menyusun kerangka bab untuk mulai menulis Beat-by-Beat.'
                  : 'Proyek ini belum memiliki Kompas Cerita (Story Compass) yang lengkap. Mari rancang premis, tokoh, dan misteri cerita terlebih dahulu agar petualangan menulis Anda terarah.'}
            </p>
          </div>

          {/* Missing list inside card */}
          {!compassStatus.isComplete && !hasChapters && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-tertiary/15 border border-tertiary/25 text-left relative z-10">
              <div className="flex items-center gap-2 mb-2 text-tertiary">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span className="text-label-md font-bold uppercase tracking-wider">Kompas Cerita Belum Lengkap</span>
              </div>
              <ul className="space-y-1.5 ml-5">
                {compassStatus.missing.map((item) => (
                  <li key={item} className="text-body-sm text-on-surface-variant list-disc font-medium">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-on-surface-variant/70 mt-2.5 italic">
                Buka tab Ide Cerita untuk melengkapi elemen di atas bersama AI Co-Author.
              </p>
            </div>
          )}

          {/* Action Sections */}
          <div className="relative z-10 space-y-6">
            {!hasChapters ? (
              compassStatus.isComplete ? (
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={() => setMode('outline')}
                    className="btn-gradient text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">schema</span>
                    Buat Rencana Bab Pertama
                  </button>
                  <p className="text-xs text-on-surface-variant/70">
                    AI akan membantu Anda merancang outline bab secara instan.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={() => setMode('brainstorm')}
                    className="btn-gradient text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                    Lengkapi Kompas Cerita
                  </button>
                  <p className="text-xs text-on-surface-variant/70">
                    AI Co-Author akan membantu Anda mematangkan ide cerita.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {/* Panel toggle CTA if sidebar is closed */}
                {!contextPanelOpen && (
                  <button
                    onClick={toggleContextPanel}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full transition-all cursor-pointer border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_open</span>
                    Buka Panel Bab (Sidebar)
                  </button>
                )}

                {/* Chapters list in grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Daftar Bab Tersedia ({chapters.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {sortedChapters.map((c) => {
                      const badge = CHAPTER_STATUS_BADGES[c.status]

                      return (
                        <motion.button
                          key={c.id}
                          whileHover={{ scale: 1.01, x: 2 }}
                          onClick={() => {
                            setActiveChapter(c.chapter_number)
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 hover:bg-surface-container border border-outline-variant/20 hover:border-primary/30 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-surface-container-high group-hover:bg-primary/10 flex items-center justify-center font-bold text-xs text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                              {c.chapter_number}
                            </div>
                            <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                              {c.title || 'Belum Ada Judul'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className} shrink-0`}>
                            {badge.text}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <ProseWriterInner
      chapter={chapter}
      contextPanelOpen={contextPanelOpen}
      toggleContextPanel={toggleContextPanel}
      createChapterVersion={createChapterVersion}
    />
  )
}

interface ProseWriterInnerProps {
  chapter: Chapter
  contextPanelOpen: boolean
  toggleContextPanel: () => void
  createChapterVersion: (
    chapterId: string,
    prose: string,
    wordCount: number,
    summary: string,
    beats?: Chapter['beats']
  ) => Promise<void>
}

const ProseWriterInner: React.FC<ProseWriterInnerProps> = ({
  chapter,
  contextPanelOpen,
  toggleContextPanel,
  createChapterVersion
}) => {
  const addToast = useUiStore((s) => s.addToast)
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  const {
    currentBeatIndex,
    setCurrentBeatIndex,
    isGenerating,
    activeProse,
    saveStatus,
    stateGenStatus,
    isThinking,
    currentThought,
    generateBeat,
    stopGeneration,
    handleManualEdit,
    restoreChapterSnapshot,
    undo,
    redo
  } = useBeatWriter(chapter.id)

  const beatEditorRef = useRef<BeatEditorHandle>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [directorsCutSelection, setDirectorsCutSelection] = useState<string | null>(null)
  const [recapOpen, setRecapOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const activeBeat = chapter.beats?.[currentBeatIndex]
  const isLastBeat = chapter.beats && currentBeatIndex === chapter.beats.length - 1

  const handleNextBeat = () => {
    if (chapter.beats && currentBeatIndex < chapter.beats.length - 1) {
      setCurrentBeatIndex((prev) => prev + 1)
    }
  }

  const handleFreeWriteEdit = (text: string) => {
    handleManualEdit(0, text)
  }

  const beatContext = [
    chapter.synopsis,
    chapter.location ? `Lokasi: ${chapter.location}` : null,
    chapter.emotional_tone ? `Tone: ${chapter.emotional_tone}` : null
  ]
    .filter(Boolean)
    .join('\n')

  const handleMagicEdit = async (sel: SelectionInfo, instruction: string) => {
    try {
      // ── Two-Layer History: Cloud Snapshot before destructive AI ──
      const fullProse = freeWriteMode
        ? (chapter.prose || '')
        : (chapter.beats?.map(b => b.prose || '').join('\n\n') || '')
      const wordCount = fullProse.split(/\s+/).filter(w => w.length > 0).length
      if (wordCount > 0) {
        await createChapterVersion(
          chapter.id,
          fullProse,
          wordCount,
          'Sebelum AI Magic Edit',
          chapter.beats ?? []
        )
      }

      const rewritten = await aiRouter.inlineEdit({
        selection: sel.text,
        instruction,
        beatContext
      })
      // Strip leading/trailing whitespace + accidental quotes from the model.
      const clean = rewritten.trim().replace(/^["']|["']$/g, '')
      beatEditorRef.current?.replaceSelection(clean)
    } catch (e) {
      console.error('Magic Edit failed:', e)
      addToast('Magic Edit gagal: ' + (e instanceof Error ? e.message : 'Unknown'), 'error')
    } finally {
      setSelection(null)
    }
  }

  const handleDirectorsCut = (sel: SelectionInfo) => {
    setDirectorsCutSelection(sel.text)
  }

  const handleDirectorsCutAccept = async (text: string) => {
    // ── Two-Layer History: Cloud Snapshot before destructive AI ──
    const fullProse = freeWriteMode
      ? (chapter.prose || '')
      : (chapter.beats?.map(b => b.prose || '').join('\n\n') || '')
    const wordCount = fullProse.split(/\s+/).filter(w => w.length > 0).length
    if (wordCount > 0) {
      await createChapterVersion(
        chapter.id,
        fullProse,
        wordCount,
        "Sebelum AI Director's Cut",
        chapter.beats ?? []
      )
    }

    beatEditorRef.current?.replaceSelection(text)
    setDirectorsCutSelection(null)
    setSelection(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-surface-container-lowest p-4 md:p-6 overflow-hidden"
    >
      {/* Header controls inside canvas for mobile context toggle */}
      <div className="md:hidden mb-4 flex justify-between items-center">
        <button
          onClick={toggleContextPanel}
          className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg"
        >
          <span className="material-symbols-outlined text-[18px]">
            {contextPanelOpen ? 'menu_open' : 'menu'}
          </span>
          {contextPanelOpen ? 'Tutup Panel' : 'Pilih Bab'}
        </button>
      </div>

      <div className="max-w-4xl w-full mx-auto flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Bab {chapter.chapter_number}: {chapter.title || 'Tanpa Judul'}
        </h2>

        {chapter.synopsis && !freeWriteMode && (
          <p className="text-sm text-text-secondary mb-6 leading-relaxed bg-bg-secondary p-3 rounded-lg border border-border-divider">
            {chapter.synopsis}
          </p>
        )}

        <ProseToolbar
          wordCount={chapter.word_count || 0}
          saveStatus={saveStatus}
          stateGenStatus={stateGenStatus}
          onOpenRecap={() => setRecapOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        {freeWriteMode ? (
          <FreeWriteEditor
            chapterId={chapter.id}
            prose={activeProse}
            onEdit={handleFreeWriteEdit}
            onUndo={undo}
            onRedo={redo}
          />
        ) : (
          <>
            <BeatIndicator
              beats={chapter.beats || []}
              currentIndex={currentBeatIndex}
              onSelectBeat={(idx) => {
                if (!isGenerating) setCurrentBeatIndex(idx)
              }}
            />

            {activeBeat && (
              <BeatEditor
                ref={beatEditorRef}
                chapterId={chapter.id}
                beatIndex={currentBeatIndex}
                beatDirection={activeBeat.direction}
                prose={activeProse}
                isGenerating={isGenerating}
                isThinking={isThinking}
                currentThought={currentThought}
                onEdit={(text) => handleManualEdit(currentBeatIndex, text)}
                onGenerate={() => (isGenerating ? stopGeneration() : generateBeat(currentBeatIndex))}
                onNext={handleNextBeat}
                isLastBeat={!!isLastBeat}
                onSelectionChange={setSelection}
                onUndo={undo}
                onRedo={redo}
              />
            )}
          </>
        )}
      </div>

      <SelectionToolbar
        selection={selection}
        onMagicEdit={handleMagicEdit}
        onDirectorsCut={handleDirectorsCut}
      />

      <DirectorsCutModal
        isOpen={!!directorsCutSelection}
        selection={directorsCutSelection ?? ''}
        chapter={chapter}
        onAccept={handleDirectorsCutAccept}
        onClose={() => setDirectorsCutSelection(null)}
      />

      <RecapModal
        isOpen={recapOpen}
        onClose={() => setRecapOpen(false)}
        defaultRangeEnd={Math.max(1, chapter.chapter_number - 1)}
      />

      <VersionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        chapter={chapter}
        onRestore={async (version) => {
          await restoreChapterSnapshot(version.prose, version.word_count, version.beats ?? [])
        }}
      />
    </motion.div>
  )
}
