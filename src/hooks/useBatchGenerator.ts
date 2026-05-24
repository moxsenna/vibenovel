/**
 * useBatchGenerator — React binding for the Auto-Pilot engine.
 *
 * Owns a single `BatchGenerator` instance per hook invocation and mirrors
 * its progress into `useUiStore.batchProgress` so any component can show
 * the floating progress panel without prop drilling.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useProjectStore } from '../store/useProjectStore'
import {
  BatchGenerator,
  loadPersistedBatchProgress,
  clearPersistedBatchProgress
} from '../services/batch-generator'
import type { BatchOptions, BatchProgress } from '../types/project'

export interface UseBatchGenerator {
  progress: BatchProgress | null
  isRunning: boolean
  isPaused: boolean
  startBatch: (options: BatchOptions) => Promise<void>
  pauseBatch: () => void
  resumeBatch: () => Promise<void>
  abortBatch: () => void
  clearProgress: () => void
  /** Restore a persisted progress entry without resuming generation. */
  loadPersisted: (projectId: string) => BatchProgress | null
}

export function useBatchGenerator(): UseBatchGenerator {
  const setBatchProgress = useUiStore((s) => s.setBatchProgress)
  const progress = useUiStore((s) => s.batchProgress)
  const generatorRef = useRef<BatchGenerator | null>(null)
  const lastOptionsRef = useRef<BatchOptions | null>(null)
  const [running, setRunning] = useState(false)

  const ensureGenerator = useCallback((): BatchGenerator => {
    if (!generatorRef.current) {
      generatorRef.current = new BatchGenerator(useProjectStore)
    }
    return generatorRef.current
  }, [])

  const startBatch = useCallback(
    async (options: BatchOptions) => {
      const gen = ensureGenerator()
      lastOptionsRef.current = options
      setRunning(true)
      try {
        await gen.start(options, {
          onProgress: (p) => setBatchProgress(p)
        })
      } finally {
        setRunning(false)
      }
    },
    [ensureGenerator, setBatchProgress]
  )

  const resumeBatch = useCallback(async () => {
    const gen = ensureGenerator()
    if (!progress || progress.status !== 'paused') return
    const remainingStart = (progress.currentChapterNumber ?? progress.startChapter) + 0
    const options: BatchOptions = lastOptionsRef.current ?? {
      startChapter: remainingStart,
      endChapter: progress.endChapter,
      skipExisting: true,
      safetyStopAfterErrors: 2
    }
    // When resuming we start from the chapter that was paused.
    const resumeOptions: BatchOptions = {
      ...options,
      startChapter: remainingStart,
      endChapter: progress.endChapter
    }
    setRunning(true)
    try {
      await gen.start(resumeOptions, {
        onProgress: (p) => setBatchProgress(p)
      })
    } finally {
      setRunning(false)
    }
  }, [ensureGenerator, progress, setBatchProgress])

  const pauseBatch = useCallback(() => {
    generatorRef.current?.pause()
  }, [])

  const abortBatch = useCallback(() => {
    generatorRef.current?.abort()
  }, [])

  const clearProgress = useCallback(() => {
    if (progress) clearPersistedBatchProgress(progress.projectId)
    setBatchProgress(null)
  }, [progress, setBatchProgress])

  return useMemo(
    () => ({
      progress,
      isRunning: running,
      isPaused: progress?.status === 'paused',
      startBatch,
      pauseBatch,
      resumeBatch,
      abortBatch,
      clearProgress,
      loadPersisted: loadPersistedBatchProgress
    }),
    [progress, running, startBatch, pauseBatch, resumeBatch, abortBatch, clearProgress]
  )
}
