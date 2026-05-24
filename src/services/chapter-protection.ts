/**
 * Chapter Protection — Sprint 9
 *
 * Helpers untuk menentukan bab mana yang "locked" (tidak boleh dihapus
 * atau disentuh oleh AI tanpa persetujuan eksplisit user).
 *
 * Locked criteria (any of):
 *   1. `chapter.is_locked === true` (manual lock by user)
 *   2. `chapter.prose` non-empty (sudah ditulis)
 *   3. `chapter.status === 'IMPORTED'` (hasil import dari naskah eksisting)
 */

import type { Chapter } from '../types/project'

/**
 * Returns true if the chapter is protected from deletion / regeneration.
 */
export function isLocked(chapter: Chapter): boolean {
  if (chapter.is_locked) return true
  if (chapter.prose && chapter.prose.trim().length > 0) return true
  if (chapter.status === 'IMPORTED') return true
  return false
}

/**
 * Returns chapters that are above `targetChapter` AND locked.
 * Sorted ascending by chapter_number.
 */
export function getLockedChaptersAbove(
  chapters: Chapter[],
  targetChapter: number
): Chapter[] {
  return chapters
    .filter((c) => c.chapter_number > targetChapter && isLocked(c))
    .sort((a, b) => a.chapter_number - b.chapter_number)
}

export interface ReductionValidation {
  ok: boolean
  /** Locked chapters di atas newTarget yang menghalangi reduction. */
  blockingChapters: Chapter[]
  /** Minimum target_chapters yang aman (= chapter_number paling tinggi yang locked). */
  minAllowed: number
}

/**
 * Validates whether shrinking target_chapters to `newTarget` is safe.
 *
 * If any chapter > newTarget is locked, blocks the reduction and returns
 * the minimum allowed value (highest locked chapter_number).
 */
export function validateTargetReduction(
  chapters: Chapter[],
  newTarget: number
): ReductionValidation {
  const blocking = getLockedChaptersAbove(chapters, newTarget)
  if (blocking.length === 0) {
    return { ok: true, blockingChapters: [], minAllowed: newTarget }
  }
  const maxLocked = Math.max(...blocking.map((c) => c.chapter_number))
  return {
    ok: false,
    blockingChapters: blocking,
    minAllowed: maxLocked
  }
}

/**
 * Counts chapter outline-only above target (these will be deleted on shrink).
 */
export function countOutlineOnlyAbove(
  chapters: Chapter[],
  targetChapter: number
): number {
  return chapters.filter(
    (c) => c.chapter_number > targetChapter && !isLocked(c)
  ).length
}
