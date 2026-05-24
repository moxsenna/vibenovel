import { useState, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { aiRouter } from '../services/ai/ai-router'
import { stateTracker } from '../services/state-tracker'
import { buildProseInput, ensureBeatsForChapter } from '../services/prose-context'
import { generateChapterSummary, buildSummaryUpsertPayload } from '../services/chapter-summary'
import { analyzeChapterThreads } from '../services/thread-tracker'
import { reindexChapter } from '../services/chapter-reindexer'
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
    upsertCharacterStates,
    plotThreads,
    chapterSummaries,
    applyThreadAnalysis,
    upsertChapterSummary
  } = useProjectStore()
  const chapter = chapters.find((c) => c.id === chapterId)
  const addToast = useUiStore((s) => s.addToast)

  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [stateGenStatus, setStateGenStatus] = useState<StateGenStatus>('idle')
  // Sprint 9.7 — Deep Think state. Both reset on chapter/beat change.
  const [isThinking, setIsThinking] = useState(false)
  const [currentThought, setCurrentThought] = useState('')

  const { triggerPlotRadar } = usePlotRadar()
  const { triggerLoreExtraction } = useLoreExtractor()
  const { isOnline, saveDraft, clearDraft, syncPendingDrafts } = useOfflineDraft()
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  // Sprint 9.7 — Deep Think settings. Read once per render so generateBeat
  // captures the current values via closure when invoked.
  const deepThinkEnabled = useSettingsStore((s) => s.deepThinkEnabled)
  const deepThinkBudget = useSettingsStore((s) => s.deepThinkBudget)

  // Refs that survive re-renders without triggering them
  const abortControllerRef = useRef<AbortController | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateGenTriggeredRef = useRef(false)
  // Sprint 9.7 — Track thinking phase via ref so the stream loop can guard
  // duplicate `setIsThinking(false)` setState calls without re-renders.
  const isThinkingRef = useRef(false)

  // Reset state-gen-status during render whenever the active chapter changes,
  // avoiding the cascading-renders warning that comes from setState-in-effect.
  const [prevChapterId, setPrevChapterId] = useState<string>(chapterId)
  if (prevChapterId !== chapterId) {
    setPrevChapterId(chapterId)
    setStateGenStatus('idle')
    setCurrentBeatIndex(0)
    setIsThinking(false)
    setCurrentThought('')
    // isThinkingRef is reset by generateBeat's finally block + the
    // chapterId useEffect below — keeping it out of render satisfies the
    // React 19 react-hooks/refs purity rule.
  }

  // Reset the trigger flag when the chapter id changes (refs don't trigger renders).
  useEffect(() => {
    stateGenTriggeredRef.current = false
    isThinkingRef.current = false
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

  /**
   * Sprint 7 — Background thread analysis + chapter summary embedding.
   * Runs alongside state snapshot. Both are independent (Promise.allSettled
   * in caller) so a failure in one doesn't cancel the other.
   */
  const triggerThreadAnalysis = useCallback(
    async (proseText: string) => {
      if (!chapter || !activeProject) return
      const chapterWithProse = { ...chapter, prose: proseText }
      const prevSummaries = chapterSummaries
        .filter((s) => s.chapter_id !== chapter.id)
        .slice(-5)
        .map((s) => s.summary)
      try {
        const result = await analyzeChapterThreads(
          chapterWithProse,
          plotThreads,
          prevSummaries
        )
        await applyThreadAnalysis(chapter.chapter_number, activeProject.id, result)
      } catch (err) {
        console.error('Thread analysis failed:', err)
      }
    },
    [chapter, activeProject, plotThreads, chapterSummaries, applyThreadAnalysis]
  )

  const triggerChapterSummary = useCallback(
    async (proseText: string) => {
      if (!chapter || !activeProject) return
      const chapterWithProse = { ...chapter, prose: proseText }
      const prevSummary = chapterSummaries
        .filter((s) => s.chapter_id !== chapter.id)
        .slice(-1)[0]?.summary
      try {
        const result = await generateChapterSummary(chapterWithProse, prevSummary)
        await upsertChapterSummary(buildSummaryUpsertPayload(chapterWithProse, result))
      } catch (err) {
        console.error('Chapter summary failed:', err)
      }
    },
    [chapter, activeProject, chapterSummaries, upsertChapterSummary]
  )

  // ── Offline → Online sync ───────────────────────────────────────────
  // When connectivity returns, replay all pending drafts back into the store.
  // Each successful sync clears its localStorage entry. Sprint 9.5 hardening:
  // queue background AI tasks (state snapshot, plot radar, lore, thread,
  // chapter summary) for synced chapters since they were skipped while offline.
  useEffect(() => {
    if (!isOnline) return
    let cancelled = false
    const syncedChapterIds = new Set<string>()
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
          syncedChapterIds.add(d.chapterId)
          return true
        })
        if (cancelled) return
        if (result.synced > 0) {
          console.info(`[OfflineDraft] Synced ${result.synced} pending draft(s).`)

          // Sprint 9.5 — Reconnection AI Backfill.
          // Run reindex sequentially per chapter that just synced. Best-effort,
          // failures logged but don't block UI.
          for (const id of syncedChapterIds) {
            if (cancelled) return
            try {
              const reindexResult = await reindexChapter(id)
              if (reindexResult.failed.length > 0) {
                console.warn(
                  `[OfflineDraft] Reindex partial for chapter ${id}:`,
                  reindexResult.failed
                )
              }
            } catch (e) {
              console.warn(`[OfflineDraft] Reindex failed for chapter ${id}:`, e)
            }
          }
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
        // ── Free Write path: no beats array, save directly to chapter.prose ──
        if (freeWriteMode || !chapter.beats || chapter.beats.length === 0) {
          const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length

          if (!isOnline) {
            saveDraft(chapter.id, -1, text)
          }

          await updateChapter(chapter.id, {
            prose: text,
            word_count: wordCount,
            status: text.trim().length > 10 ? 'DRAFT' : 'GENERATING'
          })

          if (isOnline) {
            clearDraft(chapter.id, -1)
          }

          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
          return
        }

        // ── Beat-based path (standard mode) ──
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
            Promise.allSettled([
              triggerStateGeneration(fullProse),
              triggerPlotRadar(chapter.id, fullProse),
              triggerLoreExtraction(fullProse),
              triggerThreadAnalysis(fullProse),
              triggerChapterSummary(fullProse)
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
      triggerLoreExtraction,
      triggerThreadAnalysis,
      triggerChapterSummary
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
        addToast('Belum ada beats yang disiapkan. Pastikan Outline sudah di-generate.', 'warning')
        return
      }

      setIsGenerating(true)
      setStreamingText('')
      // Sprint 9.7 — Reset thought state for the new beat.
      setCurrentThought('')
      setIsThinking(false)

      abortControllerRef.current = new AbortController()
      const effectiveBudget = deepThinkEnabled ? deepThinkBudget : 0

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

        const stream = aiRouter.generateProseBeatStream(activeProject, input, {
          thinkingBudget: effectiveBudget,
          signal: abortControllerRef.current.signal
        })
        let accumulatedText = ''
        let thoughtBuffer = ''

        for await (const chunk of stream) {
          if (abortControllerRef.current.signal.aborted) {
            break
          }
          if (chunk.type === 'thought') {
            // Mark that the model is currently thinking; first text chunk
            // flips this back to false.
            if (!isThinkingRef.current) {
              isThinkingRef.current = true
              setIsThinking(true)
            }
            thoughtBuffer += chunk.content
            setCurrentThought(thoughtBuffer)
          } else if (chunk.type === 'text') {
            // First prose chunk = thinking phase ended. Strict filter:
            // ONLY text chunks accumulate into the saved buffer.
            if (isThinkingRef.current) {
              isThinkingRef.current = false
              setIsThinking(false)
            }
            accumulatedText += chunk.content
            setStreamingText(accumulatedText)
            debouncedSaveBeat(beatIndex, accumulatedText)
          }
        }
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err.name !== 'AbortError') {
          console.error('Generation error:', e)
          addToast('Gagal generate prosa: ' + (err.message || 'Unknown Error'), 'error')
        }
      } finally {
        setIsGenerating(false)
        isThinkingRef.current = false
        setIsThinking(false)
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
      debouncedSaveBeat,
      addToast,
      deepThinkEnabled,
      deepThinkBudget
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
    isThinking,
    currentThought,
    generateBeat,
    stopGeneration,
    handleManualEdit,
    regenerateState
  }
}
