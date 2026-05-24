/**
 * Batch Generator — Sprint 6 Auto-Pilot Engine
 *
 * Orchestrates sequential prose generation across multiple chapters using
 * the same prompt + context pipeline as the interactive `useBeatWriter`
 * hook (via `buildProseInput`).
 *
 * Design highlights:
 *   • SEQUENTIAL by mandate — Layer 2 character states + Layer 4 sliding
 *     window need fresh data from the previous chapter.
 *   • PAUSE is graceful — finishes the current chapter, then halts.
 *   • ABORT is hard — cancels the in-flight stream immediately.
 *   • SAFETY STOP — N consecutive hard errors (5xx, parse failures,
 *     non-user AbortError) breaks the run. Rate limits don't count;
 *     gemini-pool's cooldown rotation handles those.
 */

import { aiRouter } from './ai/ai-router'
import { stateTracker } from './state-tracker'
import { buildProseInput, ensureBeatsForChapter } from './prose-context'
import { analyzeChapterThreads } from './thread-tracker'
import { generateChapterSummary, buildSummaryUpsertPayload } from './chapter-summary'
import type {
  BatchOptions,
  BatchProgress,
  BatchStatus,
  Chapter,
  Project
} from '../types/project'
import type { useProjectStore } from '../store/useProjectStore'

type ProjectStoreApi = typeof useProjectStore

/** Subset of the project store that the batch generator needs. */
type StoreSnapshot = ReturnType<ProjectStoreApi['getState']>

export interface BatchCallbacks {
  onProgress: (progress: BatchProgress) => void
}

const PROGRESS_KEY_PREFIX = 'vn_batch_progress_'

function progressKey(projectId: string): string {
  return `${PROGRESS_KEY_PREFIX}${projectId}`
}

/**
 * Persist progress so a refresh in the middle of a long batch can offer a
 * resume prompt. We only persist when the batch is running or paused; on
 * completion / error / abort the entry is cleared.
 */
function persistProgress(progress: BatchProgress) {
  try {
    if (progress.status === 'running' || progress.status === 'paused') {
      localStorage.setItem(progressKey(progress.projectId), JSON.stringify(progress))
    } else {
      localStorage.removeItem(progressKey(progress.projectId))
    }
  } catch {
    /* localStorage full or disabled — non-fatal */
  }
}

export function loadPersistedBatchProgress(projectId: string): BatchProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(projectId))
    if (!raw) return null
    return JSON.parse(raw) as BatchProgress
  } catch {
    return null
  }
}

export function clearPersistedBatchProgress(projectId: string): void {
  try {
    localStorage.removeItem(progressKey(projectId))
  } catch {
    /* noop */
  }
}

/** True if the error was raised by `signal.abort()` from user action. */
function isUserAbort(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err && typeof err === 'object' && 'name' in err) {
    return (err as { name?: string }).name === 'AbortError'
  }
  return false
}

/** Hard errors that should advance the consecutive-error counter. */
function isHardError(err: unknown): boolean {
  if (isUserAbort(err)) return false
  const message = err instanceof Error ? err.message : String(err)
  // Rate limit (429) is soft — the pool handles it.
  if (/429|rate limit|cooldown/i.test(message)) return false
  return true
}

const SAVE_DEBOUNCE_MS = 800

export class BatchGenerator {
  private store: ProjectStoreApi
  private abortController: AbortController | null = null
  private pauseRequested = false
  private abortRequested = false
  private currentProgress: BatchProgress | null = null

  constructor(store: ProjectStoreApi) {
    this.store = store
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  isRunning(): boolean {
    return this.currentProgress?.status === 'running'
  }

  isPaused(): boolean {
    return this.currentProgress?.status === 'paused'
  }

  /**
   * Request a graceful pause. The generator will finish the current
   * chapter (or beat) and halt before starting the next.
   */
  pause(): void {
    if (this.currentProgress?.status === 'running') {
      this.pauseRequested = true
    }
  }

  /** Resume from a paused state by calling `start()` again with same range. */

  /** Hard abort — cancels in-flight network requests immediately. */
  abort(): void {
    this.abortRequested = true
    this.abortController?.abort()
  }

  // ── Main Loop ────────────────────────────────────────────────────────

  async start(
    options: BatchOptions,
    callbacks: BatchCallbacks
  ): Promise<BatchProgress> {
    const { activeProject } = this.store.getState()
    if (!activeProject) {
      throw new Error('Tidak ada project aktif.')
    }

    const total = options.endChapter - options.startChapter + 1
    if (total <= 0) {
      throw new Error('Range bab tidak valid.')
    }

    this.pauseRequested = false
    this.abortRequested = false

    const initial: BatchProgress = {
      projectId: activeProject.id,
      status: 'running',
      startChapter: options.startChapter,
      endChapter: options.endChapter,
      current: 0,
      total,
      currentChapterId: null,
      currentChapterNumber: null,
      currentBeatIndex: 0,
      beatsTotal: 0,
      currentWordCount: 0,
      totalWordCount: 0,
      startedAt: Date.now(),
      endedAt: null,
      completed: [],
      skipped: 0,
      errors: [],
      warnings: [],
      consecutiveErrors: 0
    }
    this.currentProgress = initial
    callbacks.onProgress(initial)
    persistProgress(initial)

    for (let chapNum = options.startChapter; chapNum <= options.endChapter; chapNum++) {
      if (this.abortRequested) {
        this.finalise(callbacks, 'aborted')
        return this.currentProgress
      }
      if (this.pauseRequested) {
        this.finalise(callbacks, 'paused')
        return this.currentProgress
      }
      if (
        this.currentProgress.consecutiveErrors >= options.safetyStopAfterErrors
      ) {
        this.currentProgress.warnings.push(
          `Auto-stop: ${options.safetyStopAfterErrors} hard error berturut-turut.`
        )
        this.finalise(callbacks, 'error')
        return this.currentProgress
      }

      // Locate the chapter snapshot fresh each iteration so previous-state
      // updates from the loop are visible.
      const snapshot = this.store.getState()
      const chapter = snapshot.chapters.find((c) => c.chapter_number === chapNum)
      if (!chapter) {
        this.currentProgress.skipped++
        this.currentProgress.warnings.push(
          `Bab ${chapNum} di-skip — outline belum ada.`
        )
        this.advanceProgress(callbacks)
        continue
      }

      // Skip rules — mirror outline-batch behaviour.
      if (options.skipExisting) {
        if (chapter.is_locked) {
          this.currentProgress.skipped++
          this.currentProgress.warnings.push(`Bab ${chapNum} di-skip (terkunci).`)
          this.advanceProgress(callbacks)
          continue
        }
        if (
          chapter.status === 'DRAFT' ||
          chapter.status === 'FINAL' ||
          chapter.status === 'IMPORTED'
        ) {
          this.currentProgress.skipped++
          this.currentProgress.warnings.push(
            `Bab ${chapNum} di-skip (sudah ${chapter.status.toLowerCase()}).`
          )
          this.advanceProgress(callbacks)
          continue
        }
      }

      try {
        await this.generateOneChapter(chapter, activeProject, snapshot, callbacks)
        this.currentProgress.consecutiveErrors = 0
      } catch (err) {
        if (isUserAbort(err) && this.abortRequested) {
          this.finalise(callbacks, 'aborted')
          return this.currentProgress
        }
        const message = err instanceof Error ? err.message : String(err)
        this.currentProgress.errors.push({
          chapterId: chapter.id,
          chapterNumber: chapter.chapter_number,
          message
        })
        if (isHardError(err)) {
          this.currentProgress.consecutiveErrors++
        }
      }

      this.advanceProgress(callbacks)
    }

    this.finalise(callbacks, 'success')
    return this.currentProgress
  }

  // ── Per-Chapter Execution ────────────────────────────────────────────

  private async generateOneChapter(
    chapter: Chapter,
    project: Project,
    snapshot: StoreSnapshot,
    callbacks: BatchCallbacks
  ): Promise<void> {
    if (!this.currentProgress) return

    // Ensure the chapter has beats — if outline is generic and key_events
    // exist but `beats[]` empty, populate it now.
    let beats = chapter.beats
    if (!beats || beats.length === 0) {
      beats = ensureBeatsForChapter(chapter)
      if (beats.length === 0) {
        throw new Error('Outline bab ini belum punya key_events.')
      }
      await snapshot.updateChapter(chapter.id, { beats })
    }

    this.currentProgress.currentChapterId = chapter.id
    this.currentProgress.currentChapterNumber = chapter.chapter_number
    this.currentProgress.currentBeatIndex = 0
    this.currentProgress.beatsTotal = beats.length
    this.currentProgress.currentWordCount = 0
    callbacks.onProgress({ ...this.currentProgress })

    // Start fresh — replace any partial prose if we're regenerating from
    // scratch (skipExisting=false case).
    const liveBeats = beats.map((b) => ({ ...b, prose: b.prose ?? '' }))

    for (let beatIndex = 0; beatIndex < liveBeats.length; beatIndex++) {
      if (this.abortRequested) {
        // Persist whatever we have on the partial chapter before bailing.
        await this.persistChapterProse(chapter.id, liveBeats, snapshot)
        throw new DOMException('Aborted', 'AbortError')
      }

      this.currentProgress.currentBeatIndex = beatIndex
      callbacks.onProgress({ ...this.currentProgress })

      // Build prose input using the SAME helper as useBeatWriter.
      const previousStates = snapshot.getLatestStatesForChapter(chapter.chapter_number)
      const previousBeatsProse = liveBeats
        .slice(0, beatIndex)
        .map((b) => b.prose || '')
        .filter((p) => p.trim().length > 0)
      const input = buildProseInput({
        project,
        chapter: { ...chapter, beats: liveBeats },
        beatIndex,
        characters: snapshot.characters,
        items: snapshot.items,
        worldRules: snapshot.worldRules,
        previousStates,
        allChapters: snapshot.chapters,
        overrideBeatsProse: previousBeatsProse
      })

      this.abortController = new AbortController()
      const stream = aiRouter.generateProseBeatStream(project, input)

      let acc = ''
      let lastSave = Date.now()
      try {
        for await (const chunk of stream) {
          if (this.abortController.signal.aborted) break
          acc += chunk

          // Throttle UI updates so we don't flood callbacks.
          const now = Date.now()
          if (now - lastSave > SAVE_DEBOUNCE_MS) {
            liveBeats[beatIndex] = { ...liveBeats[beatIndex], prose: acc }
            await this.persistChapterProse(chapter.id, liveBeats, snapshot)
            this.currentProgress.currentWordCount = countWords(joinProse(liveBeats))
            callbacks.onProgress({ ...this.currentProgress })
            lastSave = now
          }
        }
      } finally {
        this.abortController = null
      }

      liveBeats[beatIndex] = { ...liveBeats[beatIndex], prose: acc }
      await this.persistChapterProse(chapter.id, liveBeats, snapshot)
      this.currentProgress.currentWordCount = countWords(joinProse(liveBeats))
      callbacks.onProgress({ ...this.currentProgress })
    }

    // Mark chapter as DRAFT now that all beats are filled.
    const fullProse = joinProse(liveBeats)
    const wordCount = countWords(fullProse)
    await snapshot.updateChapter(chapter.id, {
      beats: liveBeats,
      prose: fullProse,
      word_count: wordCount,
      status: 'DRAFT'
    })

    // Fire-and-forget background tasks — state snapshot + plot radar +
    // lore extraction. We don't await them in the main loop because they
    // can reuse the same gemini-pool slot; the next chapter just needs
    // the state once it's persisted.
    void this.runBackgroundTasks(chapter, fullProse, snapshot)

    this.currentProgress.completed.push({
      chapterId: chapter.id,
      chapterNumber: chapter.chapter_number,
      wordCount
    })
    this.currentProgress.totalWordCount += wordCount
  }

  private async persistChapterProse(
    chapterId: string,
    beats: Chapter['beats'],
    snapshot: StoreSnapshot
  ): Promise<void> {
    const fullProse = joinProse(beats)
    const wordCount = countWords(fullProse)
    await snapshot.updateChapter(chapterId, {
      beats,
      prose: fullProse,
      word_count: wordCount,
      status: 'GENERATING'
    })
  }

  private async runBackgroundTasks(
    chapter: Chapter,
    fullProse: string,
    snapshot: StoreSnapshot
  ): Promise<void> {
    const { activeProject } = snapshot
    if (!activeProject) return

    const tasks: Promise<unknown>[] = []

    // ── Layer 2: character state snapshot ───────────────────────────
    tasks.push(
      (async () => {
        try {
          const prevStates = snapshot.getLatestStatesForChapter(chapter.chapter_number)
          const prevContext =
            prevStates.length > 0
              ? stateTracker.formatStatesForContext(prevStates, snapshot.characters)
              : undefined
          const states = await stateTracker.generateStateSnapshot(
            activeProject,
            { ...chapter, prose: fullProse },
            snapshot.characters,
            prevContext
          )
          if (states.length > 0) {
            await snapshot.upsertCharacterStates(chapter.chapter_number, states)
          }
        } catch (e) {
          console.warn('[Batch] state snapshot failed:', e)
        }
      })()
    )

    // ── Sprint 7: thread analysis ───────────────────────────────────
    tasks.push(
      (async () => {
        try {
          const prevSummaries = snapshot.chapterSummaries
            .filter((s) => s.chapter_id !== chapter.id)
            .slice(-5)
            .map((s) => s.summary)
          const result = await analyzeChapterThreads(
            { ...chapter, prose: fullProse },
            snapshot.plotThreads,
            prevSummaries
          )
          await snapshot.applyThreadAnalysis(
            chapter.chapter_number,
            activeProject.id,
            result
          )
        } catch (e) {
          console.warn('[Batch] thread analysis failed:', e)
        }
      })()
    )

    // ── Sprint 7: chapter summary + embedding ───────────────────────
    tasks.push(
      (async () => {
        try {
          const prevSummary = snapshot.chapterSummaries
            .filter((s) => s.chapter_id !== chapter.id)
            .slice(-1)[0]?.summary
          const result = await generateChapterSummary(
            { ...chapter, prose: fullProse },
            prevSummary
          )
          await snapshot.upsertChapterSummary(
            buildSummaryUpsertPayload({ ...chapter, prose: fullProse }, result)
          )
        } catch (e) {
          console.warn('[Batch] chapter summary failed:', e)
        }
      })()
    )

    await Promise.allSettled(tasks)
  }

  // ── Progress helpers ─────────────────────────────────────────────────

  private advanceProgress(callbacks: BatchCallbacks): void {
    if (!this.currentProgress) return
    this.currentProgress.current++
    callbacks.onProgress({ ...this.currentProgress })
    persistProgress(this.currentProgress)
  }

  private finalise(callbacks: BatchCallbacks, status: BatchStatus): void {
    if (!this.currentProgress) return
    this.currentProgress.status = status
    this.currentProgress.currentChapterId = null
    this.currentProgress.currentChapterNumber = null
    this.currentProgress.endedAt = Date.now()
    callbacks.onProgress({ ...this.currentProgress })
    persistProgress(this.currentProgress)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function joinProse(beats: Chapter['beats']): string {
  return (beats ?? [])
    .map((b) => b.prose || '')
    .join('\n\n')
    .trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}
