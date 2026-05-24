import React, { useRef, useState } from 'react'
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
import { useBeatWriter } from '../../hooks/useBeatWriter'
import { useUiStore } from '../../store/useUiStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { aiRouter } from '../../services/ai/ai-router'
import type { Chapter } from '../../types/project'

export const ProseWriterPanel: React.FC = () => {
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel)
  const contextPanelOpen = useUiStore((s) => s.contextPanelOpen)
  const chapters = useProjectStore((s) => s.chapters)
  const chapter = chapters.find((c) => c.chapter_number === activeChapterNumber)

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary p-8">
        Silakan pilih bab dari panel konteks untuk mulai menulis.
      </div>
    )
  }

  return (
    <ProseWriterInner
      chapter={chapter}
      contextPanelOpen={contextPanelOpen}
      toggleContextPanel={toggleContextPanel}
    />
  )
}

interface ProseWriterInnerProps {
  chapter: Chapter
  contextPanelOpen: boolean
  toggleContextPanel: () => void
}

const ProseWriterInner: React.FC<ProseWriterInnerProps> = ({
  chapter,
  contextPanelOpen,
  toggleContextPanel
}) => {
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  const {
    currentBeatIndex,
    setCurrentBeatIndex,
    isGenerating,
    streamingText,
    saveStatus,
    stateGenStatus,
    generateBeat,
    stopGeneration,
    handleManualEdit
  } = useBeatWriter(chapter.id)

  const beatEditorRef = useRef<BeatEditorHandle>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [directorsCutSelection, setDirectorsCutSelection] = useState<string | null>(null)

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
      alert('Magic Edit gagal: ' + (e instanceof Error ? e.message : 'Unknown'))
    } finally {
      setSelection(null)
    }
  }

  const handleDirectorsCut = (sel: SelectionInfo) => {
    setDirectorsCutSelection(sel.text)
  }

  const handleDirectorsCutAccept = (text: string) => {
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
        />

        {freeWriteMode ? (
          <FreeWriteEditor
            chapterId={chapter.id}
            prose={chapter.prose || ''}
            onEdit={handleFreeWriteEdit}
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
                prose={isGenerating ? streamingText : (activeBeat.prose || '')}
                isGenerating={isGenerating}
                onEdit={(text) => handleManualEdit(currentBeatIndex, text)}
                onGenerate={() => (isGenerating ? stopGeneration() : generateBeat(currentBeatIndex))}
                onNext={handleNextBeat}
                isLastBeat={!!isLastBeat}
                onSelectionChange={setSelection}
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
    </motion.div>
  )
}
