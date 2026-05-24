/**
 * Chapter Reindexer — Sprint 9.5 Hardening
 *
 * Centralised service untuk menjalankan SEMUA background AI tasks pada satu
 * chapter. Dipakai oleh:
 *   1. Free Write reindex flow — saat user toggle Free Write OFF, sweep semua
 *      chapter yang punya prose tapi tidak punya state snapshot atau summary.
 *   2. Offline reconnect backfill — saat sync replay selesai, queue background
 *      tasks untuk chapters yang baru di-sync dari localStorage.
 *
 * Tasks yang dijalankan:
 *   - State snapshot extraction (state-tracker)
 *   - Plot radar QA scan (ai-router.runQARadar)
 *   - Lore extraction (ai-router.extractLore)
 *   - Thread analysis (thread-tracker)
 *   - Chapter summary + RAG embedding (chapter-summary)
 *
 * Setiap task `Promise.allSettled` jadi failure di satu task tidak cancel
 * yang lain. Hasil failure di-collect ke array warnings untuk UI feedback.
 */

import type { Chapter } from '../types/project'
import { useProjectStore } from '../store/useProjectStore'
import { aiRouter } from './ai/ai-router'
import { stateTracker } from './state-tracker'
import { generateChapterSummary, buildSummaryUpsertPayload } from './chapter-summary'
import { analyzeChapterThreads } from './thread-tracker'

export interface ReindexResult {
  chapterId: string
  chapterNumber: number
  succeeded: string[] // task names that completed
  failed: Array<{ task: string; error: string }>
}

export interface ReindexProgress {
  current: number
  total: number
  currentChapterNumber: number | null
  status: 'idle' | 'running' | 'success' | 'partial' | 'aborted'
}

/**
 * Determine which background AI artifacts are MISSING for a chapter.
 * A chapter is "missing" a task if it has prose but the corresponding
 * data isn't present in the store.
 */
export function detectMissingArtifacts(chapter: Chapter): {
  needsStateSnapshot: boolean
  needsPlotRadar: boolean
  needsLoreExtraction: boolean
  needsThreadAnalysis: boolean
  needsChapterSummary: boolean
} {
  const store = useProjectStore.getState()

  const hasProse = !!chapter.prose && chapter.prose.trim().length > 50
  if (!hasProse) {
    // No prose → nothing to index.
    return {
      needsStateSnapshot: false,
      needsPlotRadar: false,
      needsLoreExtraction: false,
      needsThreadAnalysis: false,
      needsChapterSummary: false
    }
  }

  // State snapshot: any character_state row with this chapter_number?
  const hasStates = store.characterStates.some(
    (s) => s.chapter_number === chapter.chapter_number
  )

  // QA logs already on chapter
  const hasQa = !!(chapter.qa_logs && chapter.qa_logs.length > 0)

  // Chapter summary
  const hasSummary = store.chapterSummaries.some(
    (s) => s.chapter_id === chapter.id
  )

  return {
    needsStateSnapshot: !hasStates,
    needsPlotRadar: !hasQa,
    // Lore extraction has no easy "did we run this" detector — re-run if no
    // states/summary exists (cheap proxy for "this chapter never indexed").
    needsLoreExtraction: !hasStates && !hasSummary,
    // Thread analysis: similar — re-run if never indexed.
    needsThreadAnalysis: !hasStates && !hasSummary,
    needsChapterSummary: !hasSummary
  }
}

/**
 * Reindex a single chapter — runs only the tasks that are missing.
 * Returns a ReindexResult detailing which succeeded vs failed.
 */
export async function reindexChapter(chapterId: string): Promise<ReindexResult> {
  const store = useProjectStore.getState()
  const chapter = store.chapters.find((c) => c.id === chapterId)
  if (!chapter || !store.activeProject) {
    return {
      chapterId,
      chapterNumber: 0,
      succeeded: [],
      failed: [{ task: 'lookup', error: 'Chapter atau project tidak ditemukan.' }]
    }
  }

  const missing = detectMissingArtifacts(chapter)
  const succeeded: string[] = []
  const failed: Array<{ task: string; error: string }> = []
  const proseText = chapter.prose ?? ''

  // Build cumulative context for downstream tasks.
  const prevStates = store.getLatestStatesForChapter(chapter.chapter_number)
  const prevContext =
    prevStates.length > 0
      ? stateTracker.formatStatesForContext(prevStates, store.characters)
      : undefined

  const tasks: Array<{ name: string; run: () => Promise<void> }> = []

  if (missing.needsStateSnapshot) {
    tasks.push({
      name: 'state_snapshot',
      run: async () => {
        const states = await stateTracker.generateStateSnapshot(
          store.activeProject!,
          { ...chapter, prose: proseText },
          store.characters,
          prevContext
        )
        if (states.length > 0) {
          await store.upsertCharacterStates(chapter.chapter_number, states)
        }
      }
    })
  }

  if (missing.needsPlotRadar) {
    tasks.push({
      name: 'plot_radar',
      run: async () => {
        const logs = await aiRouter.runQARadar(
          { ...chapter, prose: proseText },
          prevContext
        )
        await store.updateChapter(chapter.id, { qa_logs: logs })
      }
    })
  }

  if (missing.needsLoreExtraction) {
    tasks.push({
      name: 'lore_extraction',
      run: async () => {
        const lore = await aiRouter.extractLore(
          proseText,
          store.characters,
          store.items,
          store.worldRules
        )
        // Stash extracted lore so user can review via existing LoreDiffModal.
        store.setExtractedLore(lore)
      }
    })
  }

  if (missing.needsThreadAnalysis) {
    tasks.push({
      name: 'thread_analysis',
      run: async () => {
        const prevSummaries = store.chapterSummaries
          .filter((s) => s.chapter_id !== chapter.id)
          .slice(-5)
          .map((s) => s.summary)
        const result = await analyzeChapterThreads(
          { ...chapter, prose: proseText },
          store.plotThreads,
          prevSummaries
        )
        await store.applyThreadAnalysis(
          chapter.chapter_number,
          store.activeProject!.id,
          result
        )
      }
    })
  }

  if (missing.needsChapterSummary) {
    tasks.push({
      name: 'chapter_summary',
      run: async () => {
        const prevSummary = store.chapterSummaries
          .filter((s) => s.chapter_id !== chapter.id)
          .slice(-1)[0]?.summary
        const result = await generateChapterSummary(
          { ...chapter, prose: proseText },
          prevSummary
        )
        await store.upsertChapterSummary(
          buildSummaryUpsertPayload({ ...chapter, prose: proseText }, result)
        )
      }
    })
  }

  if (tasks.length === 0) {
    return { chapterId, chapterNumber: chapter.chapter_number, succeeded: [], failed: [] }
  }

  // Run all missing tasks in parallel — same pattern as useBeatWriter.
  const settled = await Promise.allSettled(tasks.map((t) => t.run()))
  for (let i = 0; i < tasks.length; i++) {
    const result = settled[i]
    if (result.status === 'fulfilled') {
      succeeded.push(tasks[i].name)
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason)
      failed.push({ task: tasks[i].name, error: msg })
    }
  }

  return {
    chapterId,
    chapterNumber: chapter.chapter_number,
    succeeded,
    failed
  }
}

/**
 * Reindex multiple chapters sequentially with progress callback.
 * Sequential bukan paralel karena state snapshot Bab N+1 butuh state Bab N.
 */
export async function reindexChapters(
  chapterIds: string[],
  onProgress?: (progress: ReindexProgress) => void,
  signal?: AbortSignal
): Promise<ReindexResult[]> {
  const results: ReindexResult[] = []
  const total = chapterIds.length

  if (total === 0) {
    onProgress?.({ current: 0, total: 0, currentChapterNumber: null, status: 'success' })
    return results
  }

  onProgress?.({ current: 0, total, currentChapterNumber: null, status: 'running' })

  for (let i = 0; i < chapterIds.length; i++) {
    if (signal?.aborted) {
      onProgress?.({
        current: i,
        total,
        currentChapterNumber: null,
        status: 'aborted'
      })
      return results
    }

    const id = chapterIds[i]
    const store = useProjectStore.getState()
    const chapter = store.chapters.find((c) => c.id === id)
    onProgress?.({
      current: i,
      total,
      currentChapterNumber: chapter?.chapter_number ?? null,
      status: 'running'
    })

    const result = await reindexChapter(id)
    results.push(result)
  }

  const hasFailures = results.some((r) => r.failed.length > 0)
  onProgress?.({
    current: total,
    total,
    currentChapterNumber: null,
    status: hasFailures ? 'partial' : 'success'
  })

  return results
}

/**
 * Find all chapters in the active project that have prose but are MISSING
 * AI artifacts. Used to power the Free Write reindex prompt.
 */
export function findChaptersNeedingReindex(): string[] {
  const store = useProjectStore.getState()
  if (!store.activeProject) return []

  const projectId = store.activeProject.id
  return store.chapters
    .filter((c) => c.project_id === projectId)
    .filter((c) => {
      const missing = detectMissingArtifacts(c)
      return (
        missing.needsStateSnapshot ||
        missing.needsChapterSummary ||
        missing.needsPlotRadar ||
        missing.needsThreadAnalysis ||
        missing.needsLoreExtraction
      )
    })
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map((c) => c.id)
}
