import { useState, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { aiRouter } from '../services/ai/ai-router'
import { stateTracker } from '../services/state-tracker'
import { buildProseInput, ensureBeatsForChapter } from '../services/prose-context'
import { usePlotRadar } from './usePlotRadar'
import { useLoreExtractor } from './useLoreExtractor'
import { useOfflineDraft } from './useOfflineDraft'

type StateGenStatus = 'idle' | 'generating' | 'done' | 'error'

export function useBeatWriter(chapterId: string) {
  const {
    activeProject,
    chapters,
    updateChapter,
    characters,
    items,
    worldRules,
    getLatestStatesForChapter,
    upsertCharacterStates
  } = useProjectStore()
  const chapter = chapters.find((c) => c.id === chapterId)

  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [stateGenStatus, setStateGenStatus] = useState<StateGenStatus>('idle')

  // Reset state-gen-status during render whenever the active chapter changes,
  // avoiding the cascading-renders warning that comes from setState-in-effect.
  const [prevChapterId, setPrevChapterId] = useState<string>(chapterId)
  if (prevChapterId !== chapterId) {
    setPrevChapterId(chapterId)
    setStateGenStatus('idle')
    setCurrentBeatIndex(0)
  }

  const { triggerPlotRadar } = usePlotRadar()
  const { triggerLoreExtraction } = useLoreExtractor()
  const { isOnline, saveDraft, clearDraft, syncPendingDrafts } = useOfflineDraft()
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)

  // Refs that survive re-renders without triggering them
  const abortControllerRef = useRef<AbortController | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateGenTriggeredRef = useRef(false)

  // Reset the trigger flag when the chapter id changes (refs don't trigger renders).
  useEffect(() => {
    stateGenTriggeredRef.current = false
  }, [chapterId])

  // Initialize beats based on key_events if beats array is empty.
  // Skipped in Free Write mode — pro writers manage chapter content themselves.
  useEffect(() => {
    if (freeWriteMode) return
    if (chapter && (!chapter.beats || chapter.beats.length === 0) && chapter.key_events.length > 0) {
      const initialBeats = ensureBeatsForChapter(chapter)
      if (initialBeats.length > 0) {
        updateChapter(chapter.id, { beats: initialBeats })
      }
    }
  }, [chapter, updateChapter, freeWriteMode])

  /**
   * Auto-generate character state snapshot after chapter is complete.
   * Runs in the background — does not block the UI.
   *
   * Declared as a useCallback ABOVE the effects that reference it so the
   * function reference is stable and resolvable in closures.
   */
  const triggerStateGeneration = useCallback(
    async (proseText: string) => {
      if (!chapter || !activeProject) return

      setStateGenStatus('generating')
      try {
        const prevStates = getLatestStatesForChapter(chapter.chapter_number)
        const prevContext =
          prevStates.length > 0
            ? stateTracker.formatStatesForContext(prevStates, characters)
            : undefined

        const chapterWithProse = { ...chapter, prose: proseText }
        const states = await stateTracker.generateStateSnapshot(
          activeProject,
          chapterWithProse,
          characters,
          prevContext
        )

        if (states.length > 0) {
          await upsertCharacterStates(chapter.chapter_number, states)
        }
        setStateGenStatus('done')
      } catch (err) {
        console.error('State generation failed:', err)
        setStateGenStatus('error')
      }
    },
    [chapter, activeProject, characters, getLatestStatesForChapter, upsertCharacterStates]
  )

  // ── Offline → Online sync ───────────────────────────────────────────
  // When connectivity returns, replay all pending drafts back into the store.
  // Each successful sync clears its localStorage entry.
  useEffect(() => {
    if (!isOnline) return
    let cancelled = false
    const run = async () => {
      try {
        const result = await syncPendingDrafts(async (d) => {
          // Only sync drafts that belong to a chapter we currently have loaded.
          const targetChapter = chapters.find((c) => c.id === d.chapterId)
          if (!targetChapter) return false
          const updatedBeats = [...(targetChapter.beats || [])]
          if (!updatedBeats[d.beatIndex]) return false
          updatedBeats[d.beatIndex] = { ...updatedBeats[d.beatIndex], prose: d.text }
          const fullProse = updatedBeats.map((b) => b.prose || '').join('\n\n').trim()
          const wordCount = fullProse.split(/\s+/).filter((w) => w.length > 0).length
          await updateChapter(d.chapterId, {
            beats: updatedBeats,
            prose: fullProse,
            word_count: wordCount
          })
          return true
        })
        if (!cancelled && result.synced > 0) {
          console.info(`[OfflineDraft] Synced ${result.synced} pending draft(s).`)
        }
      } catch (e) {
        console.warn('[OfflineDraft] sync run failed:', e)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isOnline, chapters, updateChapter, syncPendingDrafts])

  // Debounced save
  const debouncedSaveBeat = useCallback(
    (beatIndex: number, text: string) => {
      if (!chapter) return

      setSaveStatus('saving')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      saveTimeoutRef.current = setTimeout(async () => {
        const updatedBeats = [...(chapter.beats || [])]
        if (updatedBeats[beatIndex]) {
          updatedBeats[beatIndex] = { ...updatedBeats[beatIndex], prose: text }

          // Compute overall prose and word count
          const fullProse = updatedBeats.map((b) => b.prose || '').join('\n\n').trim()
          const wordCount = fullProse.split(/\s+/).filter((w) => w.length > 0).length

          // Auto-update chapter status if all beats have some prose
          const isCompleted = updatedBeats.every((b) => (b.prose || '').trim().length > 10)
          const status = isCompleted ? 'DRAFT' : 'GENERATING'

          // Cache to localStorage when offline so the buffer survives a refresh
          // and is replayed via syncPendingDrafts when connectivity returns.
          if (!isOnline) {
            saveDraft(chapter.id, beatIndex, text)
          }

          await updateChapter(chapter.id, {
            beats: updatedBeats,
            prose: fullProse,
            word_count: wordCount,
            status
          })

          // Drop the offline copy once the optimistic Supabase write was issued.
          if (isOnline) {
            clearDraft(chapter.id, beatIndex)
          }

          // ── Auto-trigger QA, Lore & State Snapshot generation ───────────
          // Only when online AND not in Free Write mode; offline / free-write
          // skip background AI tasks to save bandwidth and respect the user's
          // choice to write without enforcement.
          if (isCompleted && isOnline && !freeWriteMode && !stateGenTriggeredRef.current) {
            stateGenTriggeredRef.current = true
            Promise.all([
              triggerStateGeneration(fullProse),
              triggerPlotRadar(chapter.id, fullProse),
              triggerLoreExtraction(fullProse)
            ]).catch((err) =>
              console.error('Background generation tasks failed:', err)
            )
          }
        }
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 2000)
    },
    [
      chapter,
      updateChapter,
      isOnline,
      saveDraft,
      clearDraft,
      freeWriteMode,
      triggerStateGeneration,
      triggerPlotRadar,
      triggerLoreExtraction
    ]
  )

  /**
   * Manual trigger for state regeneration (e.g. after user edits prose).
   */
  const regenerateState = useCallback(async () => {
    if (!chapter?.prose || !activeProject) return
    stateGenTriggeredRef.current = true
    await triggerStateGeneration(chapter.prose)
  }, [chapter, activeProject, triggerStateGeneration])

  const generateBeat = useCallback(
    async (beatIndex: number) => {
      if (!chapter || !activeProject) return
      if (!chapter.beats || chapter.beats.length === 0) {
        alert('Belum ada beats yang disiapkan. Pastikan Outline sudah di-generate.')
        return
      }

      setIsGenerating(true)
      setStreamingText('')

      abortControllerRef.current = new AbortController()

      try {
        const prevStates = getLatestStatesForChapter(chapter.chapter_number)
        const input = buildProseInput({
          project: activeProject,
          chapter,
          beatIndex,
          characters,
          items,
          worldRules,
          previousStates: prevStates,
          allChapters: chapters
        })

        const stream = aiRouter.generateProseBeatStream(activeProject, input)
        let accumulatedText = ''

        for await (const chunk of stream) {
          if (abortControllerRef.current.signal.aborted) {
            break
          }
          accumulatedText += chunk
          setStreamingText(accumulatedText)
          debouncedSaveBeat(beatIndex, accumulatedText)
        }
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err.name !== 'AbortError') {
          console.error('Generation error:', e)
          alert('Gagal generate prosa: ' + (err.message || 'Unknown Error'))
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [
      chapter,
      activeProject,
      chapters,
      characters,
      items,
      worldRules,
      getLatestStatesForChapter,
      debouncedSaveBeat
    ]
  )

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }, [])

  const handleManualEdit = useCallback(
    (beatIndex: number, text: string) => {
      // If currently on this beat and it's not generating, mirror to streaming buffer.
      if (beatIndex === currentBeatIndex && !isGenerating) {
        setStreamingText(text)
      }
      debouncedSaveBeat(beatIndex, text)
    },
    [currentBeatIndex, isGenerating, debouncedSaveBeat]
  )

  return {
    chapter,
    currentBeatIndex,
    setCurrentBeatIndex,
    isGenerating,
    streamingText,
    saveStatus,
    stateGenStatus,
    generateBeat,
    stopGeneration,
    handleManualEdit,
    regenerateState
  }
}
