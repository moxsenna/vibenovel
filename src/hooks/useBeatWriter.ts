import { useState, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { aiRouter } from '../services/ai/ai-router'
import { stateTracker } from '../services/state-tracker'
import { buildProseInputWithRag, ensureBeatsForChapter } from '../services/prose-context'
import { generateChapterSummary, buildSummaryUpsertPayload } from '../services/chapter-summary'
import { analyzeChapterThreads } from '../services/thread-tracker'
import { reindexChapter } from '../services/chapter-reindexer'
import { buildOfflineDraftChapterPatch } from '../services/offline-draft-sync'
import { usePlotRadar } from './usePlotRadar'
import { useLoreExtractor } from './useLoreExtractor'
import { useOfflineDraft } from './useOfflineDraft'
import type { Chapter } from '../types/project'

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
    upsertChapterSummary,
    createChapterVersion
  } = useProjectStore()
  const chapter = chapters.find((c) => c.id === chapterId)
  const addToast = useUiStore((s) => s.addToast)
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  // Sprint 9.7 — Deep Think settings. Read once per render so generateBeat
  // captures the current values via closure when invoked.
  const deepThinkEnabled = useSettingsStore((s) => s.deepThinkEnabled)
  const deepThinkBudget = useSettingsStore((s) => s.deepThinkBudget)

  const getEditorProse = (
    targetChapter: typeof chapter,
    beatIndex: number,
    isFreeWrite: boolean
  ) =>
    isFreeWrite
      ? targetChapter?.prose || ''
      : targetChapter?.beats?.[beatIndex]?.prose || ''

  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const initialEditorProse = getEditorProse(chapter, 0, freeWriteMode)
  const [activeProse, setActiveProse] = useState(initialEditorProse)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [stateGenStatus, setStateGenStatus] = useState<StateGenStatus>('idle')
  // Sprint 9.7 — Deep Think state. Both reset on chapter/beat change.
  const [isThinking, setIsThinking] = useState(false)
  const [currentThought, setCurrentThought] = useState('')

  const { triggerPlotRadar } = usePlotRadar()
  const { triggerLoreExtraction } = useLoreExtractor()
  const { isOnline, saveDraft, clearDraft, syncPendingDrafts } = useOfflineDraft()

  // Refs that survive re-renders without triggering them
  const abortControllerRef = useRef<AbortController | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateGenTriggeredRef = useRef(false)
  // Sprint 9.7 — Track thinking phase via ref so the stream loop can guard
  // duplicate `setIsThinking(false)` setState calls without re-renders.
  const isThinkingRef = useRef(false)

  // ── Two-Layer History: Local Undo/Redo (Sprint 9.9) ──
  const [past, setPast] = useState<string[]>([])
  const [future, setFuture] = useState<string[]>([])
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedTextRef = useRef(initialEditorProse)

  const pushToHistory = useCallback((newText: string, oldText: string) => {
    setPast((p) => {
      const next = [...p, oldText]
      if (next.length > 50) next.shift() // Max 50 stack
      return next
    })
    setFuture([])
    lastSavedTextRef.current = newText
  }, [setPast, setFuture])

  // Reset state-gen-status during render whenever the active chapter changes,
  // avoiding the cascading-renders warning that comes from setState-in-effect.
  const [prevChapterId, setPrevChapterId] = useState<string>(chapterId)
  if (prevChapterId !== chapterId) {
    setPrevChapterId(chapterId)
    setStateGenStatus('idle')
    setCurrentBeatIndex(0)
    setIsThinking(false)
    setCurrentThought('')
    setPast([])
    setFuture([])
    // isThinkingRef is reset by generateBeat's finally block + the
    // chapterId useEffect below — keeping it out of render satisfies the
    // React 19 react-hooks/refs purity rule.
  }

  // Initialize activeProse when switching chapters, beats, or editor mode.
  // We keep this guarded during render to avoid a set-state-in-effect cascade.
  const proseSourceKey = `${chapter?.id ?? 'missing'}:${freeWriteMode ? 'free' : 'beat'}:${currentBeatIndex}`
  const [prevProseSourceKey, setPrevProseSourceKey] = useState(proseSourceKey)
  if (prevProseSourceKey !== proseSourceKey) {
    const initProse = getEditorProse(chapter, currentBeatIndex, freeWriteMode)
    setPrevProseSourceKey(proseSourceKey)
    setActiveProse(initProse)
    setPast([])
    setFuture([])
  }

  const lastProseSourceKeyRef = useRef(proseSourceKey)
  useEffect(() => {
    if (lastProseSourceKeyRef.current === proseSourceKey) return
    lastProseSourceKeyRef.current = proseSourceKey
    lastSavedTextRef.current = activeProse
  }, [proseSourceKey, activeProse])

  // ── Auto-Snapshot (Setiap 15 Menit) ──
  useEffect(() => {
    if (!chapter || !activeProject || !isOnline) return
    const interval = setInterval(() => {
      const fullProse = freeWriteMode
        ? (chapter.prose || '')
        : (chapter.beats?.map(b => b.prose || '').join('\n\n') || '')
      const wordCount = fullProse.split(/\s+/).filter(w => w.length > 0).length

      if (wordCount > 10) {
         createChapterVersion(
           chapter.id,
           fullProse,
           wordCount,
           'Auto-Snapshot (15 Menit)',
           chapter.beats ?? []
         )
      }
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [chapter, activeProject, isOnline, freeWriteMode, createChapterVersion])

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
    [chapter, activeProject, characters, getLatestStatesForChapter, upsertCharacterStates, setStateGenStatus]
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

          const patchResult = buildOfflineDraftChapterPatch(targetChapter, d)
          if (!patchResult) return false

          await updateChapter(d.chapterId, patchResult.patch)
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
      triggerChapterSummary,
      setSaveStatus
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
      setActiveProse('')
      // Sprint 9.7 — Reset thought state for the new beat.
      setCurrentThought('')
      setIsThinking(false)

      const controller = new AbortController()
      abortControllerRef.current = controller
      const effectiveBudget = deepThinkEnabled ? deepThinkBudget : 0

      try {
        const prevStates = getLatestStatesForChapter(chapter.chapter_number)
        const input = await buildProseInputWithRag({
          project: activeProject,
          chapter,
          beatIndex,
          characters,
          items,
          worldRules,
          previousStates: prevStates,
          allChapters: chapters
        }, {
          signal: controller.signal
        })

        const stream = aiRouter.generateProseBeatStream(activeProject, input, {
          thinkingBudget: effectiveBudget,
          signal: controller.signal
        })
        let accumulatedText = ''
        let thoughtBuffer = ''

        for await (const chunk of stream) {
          if (controller.signal.aborted) {
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
            setActiveProse(accumulatedText)
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
  }, [setIsGenerating])

  const handleManualEdit = useCallback(
    (beatIndex: number, text: string) => {
      // If currently on this beat and it's not generating, mirror to active buffer immediately.
      if (beatIndex === currentBeatIndex && !isGenerating) {
        if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)
        historyTimeoutRef.current = setTimeout(() => {
          if (text !== lastSavedTextRef.current) {
            pushToHistory(text, lastSavedTextRef.current)
          }
        }, 1000)

        setActiveProse(text)
      }
      debouncedSaveBeat(beatIndex, text)
    },
    [currentBeatIndex, isGenerating, debouncedSaveBeat, pushToHistory, setActiveProse]
  )

  const restoreChapterSnapshot = useCallback(
    async (prose: string, wordCount: number, beats: Chapter['beats']) => {
      if (!chapter) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current)
        historyTimeoutRef.current = null
      }

      const restoredBeatIndex = beats[currentBeatIndex] ? currentBeatIndex : 0
      const nextActiveProse = freeWriteMode
        ? prose
        : (beats[restoredBeatIndex]?.prose || '')

      setIsGenerating(false)
      isThinkingRef.current = false
      setIsThinking(false)
      setCurrentThought('')
      setSaveStatus('saving')
      setPast([])
      setFuture([])
      lastSavedTextRef.current = nextActiveProse

      const updatePromise = updateChapter(chapter.id, {
        prose,
        word_count: wordCount,
        beats,
        status: prose.trim().length > 10 ? 'DRAFT' : 'GENERATING',
        prose_source: beats.length > 0 ? 'MIXED' : 'MANUAL_WRITE'
      })

      setCurrentBeatIndex(restoredBeatIndex)
      setActiveProse(nextActiveProse)

      await updatePromise

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    [
      chapter,
      currentBeatIndex,
      freeWriteMode,
      updateChapter,
      setIsGenerating,
      setIsThinking,
      setCurrentThought,
      setSaveStatus,
      setPast,
      setFuture,
      setCurrentBeatIndex,
      setActiveProse
    ]
  )

  const undo = useCallback(() => {
    if (past.length === 0) return
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)

    setPast((p) => {
      const prev = p[p.length - 1]
      const current = activeProse

      setFuture((f) => current !== prev ? [current, ...f] : f)
      setActiveProse(prev)
      lastSavedTextRef.current = prev
      debouncedSaveBeat(currentBeatIndex, prev)
      return p.slice(0, -1)
    })
  }, [past, activeProse, currentBeatIndex, debouncedSaveBeat, setFuture, setActiveProse, setPast])

  const redo = useCallback(() => {
    if (future.length === 0) return
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)

    setFuture((f) => {
      const next = f[0]
      const current = activeProse

      setPast((p) => {
        const nextPast = [...p, current]
        if (nextPast.length > 50) nextPast.shift()
        return nextPast
      })

      setActiveProse(next)
      lastSavedTextRef.current = next
      debouncedSaveBeat(currentBeatIndex, next)
      return f.slice(1)
    })
  }, [future, activeProse, currentBeatIndex, debouncedSaveBeat, setPast, setActiveProse, setFuture])

  return {
    chapter,
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
    regenerateState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0
  }
}
