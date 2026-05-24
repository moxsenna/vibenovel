/**
 * Target Chapters Adjuster — Sprint 9
 *
 * Service untuk menambah / mengurangi target_chapters proyek dengan aman.
 *
 * Tiga skenario:
 *   1. expandTarget mode 'NEW_SEASON' — bump target, biarkan outline lama,
 *      season berikutnya jadi opportunity baru.
 *   2. expandTarget mode 'STRETCH' — bump target, regenerate outline-only
 *      chapters dengan pacing baru (skip locked).
 *   3. shrinkTarget — validasi locked dulu, lalu DELETE chapters > newTarget
 *      yang outline-only + clamp threads/mysteries + delete character_states
 *      dengan chapter_number > newTarget.
 *
 * GUARD: project status COMPLETED → throw error.
 */

import { useProjectStore } from '../store/useProjectStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { isLocked, validateTargetReduction } from './chapter-protection'
import type { Chapter, PlotThread, MysteryLayer } from '../types/project'

// ── Helpers ──────────────────────────────────────────────────────────────

const requireActiveAndNotCompleted = (projectId: string) => {
  const store = useProjectStore.getState()
  const project = store.projects.find((p) => p.id === projectId)
  if (!project) throw new Error('Proyek tidak ditemukan.')
  if (project.status === 'COMPLETED') {
    throw new Error('Proyek sudah selesai (COMPLETED). Buka arsip dulu kalau mau lanjutkan.')
  }
  return { project, store }
}

// ── Expand: NEW_SEASON ───────────────────────────────────────────────────

/**
 * Just bumps target_chapters. Existing outlines stay intact. Season berikutnya
 * jadi opportunity baru (tidak ada generation otomatis).
 */
export async function expandTargetNewSeason(
  projectId: string,
  newTarget: number
): Promise<void> {
  const { project, store } = requireActiveAndNotCompleted(projectId)
  if (newTarget <= project.target_chapters) {
    throw new Error('Target baru harus lebih besar dari target saat ini.')
  }
  await store.updateProject(projectId, { target_chapters: newTarget })
}

// ── Expand: STRETCH ──────────────────────────────────────────────────────

/**
 * Bumps target + regenerates outline-only chapters dengan pacing baru.
 * Skips locked chapters (prose / is_locked / IMPORTED).
 *
 * Returns count of chapters yang di-regenerate (untuk feedback UI).
 */
export async function expandTargetStretch(
  projectId: string,
  newTarget: number
): Promise<{ regenerated: number; skipped: number }> {
  const { project, store } = requireActiveAndNotCompleted(projectId)
  if (newTarget <= project.target_chapters) {
    throw new Error('Target baru harus lebih besar dari target saat ini.')
  }

  // Update target first so regenerate prompts use new target.
  await store.updateProject(projectId, { target_chapters: newTarget })

  // Regenerate outline-only chapters in sequence.
  const projectChapters = store.chapters
    .filter((c) => c.project_id === projectId)
    .sort((a, b) => a.chapter_number - b.chapter_number)

  let regenerated = 0
  let skipped = 0
  for (const ch of projectChapters) {
    if (isLocked(ch)) {
      skipped++
      continue
    }
    try {
      await store.regenerateOutline(ch.id)
      regenerated++
    } catch (e) {
      console.warn(`Gagal regenerate Bab ${ch.chapter_number}:`, e)
      skipped++
    }
  }

  return { regenerated, skipped }
}

// ── Shrink ───────────────────────────────────────────────────────────────

export interface ShrinkResult {
  deleted: number
  threadsClamped: number
  mysteriesClamped: number
  statesDeleted: number
}

/**
 * Shrinks target_chapters dengan side-effect cleanup:
 *   1. Validasi locked chapters (throw kalau ada blocker).
 *   2. DELETE chapters > newTarget yang outline-only.
 *   3. Update plot_threads: clamp planted_at, reset resolved_at kalau > newTarget.
 *   4. Update mystery_layers: reset revealed_at_chapter kalau > newTarget + clamp breadcrumbs.
 *   5. Delete character_states dengan chapter_number > newTarget (Supabase + local).
 *   6. Update project.target_chapters.
 */
export async function shrinkTarget(
  projectId: string,
  newTarget: number
): Promise<ShrinkResult> {
  const { project, store } = requireActiveAndNotCompleted(projectId)
  if (newTarget >= project.target_chapters) {
    throw new Error('Target baru harus lebih kecil dari target saat ini.')
  }

  const projectChapters = store.chapters.filter((c) => c.project_id === projectId)
  const validation = validateTargetReduction(projectChapters, newTarget)
  if (!validation.ok) {
    throw new Error(
      `Tidak bisa kurangi ke ${newTarget} bab. Ada ${validation.blockingChapters.length} bab terkunci di atas. Minimum aman: ${validation.minAllowed}.`
    )
  }

  // 1. Delete outline-only chapters > newTarget.
  const toDelete = projectChapters.filter(
    (c: Chapter) => c.chapter_number > newTarget && !isLocked(c)
  )
  let deleted = 0
  for (const ch of toDelete) {
    await store.deleteChapter(ch.id)
    deleted++
  }

  // 2. Clamp plot_threads.
  const threads = useProjectStore.getState().plotThreads.filter(
    (t) => projectChapters.some((c) => c.project_id === t.project_id)
  )
  let threadsClamped = 0
  for (const t of threads) {
    const updates: Partial<PlotThread> = {}
    if (t.planted_at > newTarget) {
      updates.planted_at = newTarget
    }
    if (t.resolved_at !== null && t.resolved_at > newTarget) {
      updates.resolved_at = null
      updates.status = 'ACTIVE'
    }
    if (Object.keys(updates).length > 0) {
      await useProjectStore.getState().updatePlotThread(t.id, updates)
      threadsClamped++
    }
  }

  // 3. Clamp mystery_layers.
  const layers = useProjectStore.getState().mysteryLayers
  let mysteriesClamped = 0
  for (const m of layers) {
    const updates: Partial<MysteryLayer> = {}
    if (m.revealed_at_chapter !== null && m.revealed_at_chapter > newTarget) {
      updates.revealed_at_chapter = null
      updates.status = 'ACTIVE'
    }
    // Filter breadcrumbs to keep only those <= newTarget.
    const validBreadcrumbs = (m.breadcrumbs ?? []).filter((bc) => bc.chapter <= newTarget)
    if (validBreadcrumbs.length !== (m.breadcrumbs ?? []).length) {
      updates.breadcrumbs = validBreadcrumbs
    }
    if (Object.keys(updates).length > 0) {
      await useProjectStore.getState().updateMysteryLayer(m.id, updates)
      mysteriesClamped++
    }
  }

  // 4. Delete character_states dengan chapter_number > newTarget.
  // Local + Supabase. Local store hanya mempertahankan states.
  const allStates = useProjectStore.getState().characterStates
  const survivingStates = allStates.filter((s) => s.chapter_number <= newTarget)
  const statesDeleted = allStates.length - survivingStates.length
  if (statesDeleted > 0) {
    useProjectStore.setState({ characterStates: survivingStates })
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('character_states')
          .delete()
          .eq('project_id', projectId)
          .gt('chapter_number', newTarget)
      } catch (e) {
        console.warn('Supabase delete character_states (shrink) error:', e)
      }
    }
  }

  // 5. Update project target.
  await store.updateProject(projectId, { target_chapters: newTarget })

  return {
    deleted,
    threadsClamped,
    mysteriesClamped,
    statesDeleted
  }
}

// ── Preview helper for the modal UI ──────────────────────────────────────

export interface ShrinkPreview {
  outlineOnlyToDelete: number
  threadsAffected: number
  mysteriesAffected: number
  statesAffected: number
  blockingLocked: number
  minAllowed: number
}

export function previewShrink(projectId: string, newTarget: number): ShrinkPreview {
  const store = useProjectStore.getState()
  const projectChapters = store.chapters.filter((c) => c.project_id === projectId)
  const validation = validateTargetReduction(projectChapters, newTarget)

  const outlineOnlyToDelete = projectChapters.filter(
    (c) => c.chapter_number > newTarget && !isLocked(c)
  ).length

  const threadsAffected = store.plotThreads.filter(
    (t) =>
      t.planted_at > newTarget ||
      (t.resolved_at !== null && t.resolved_at > newTarget)
  ).length

  const mysteriesAffected = store.mysteryLayers.filter(
    (m) =>
      (m.revealed_at_chapter !== null && m.revealed_at_chapter > newTarget) ||
      (m.breadcrumbs ?? []).some((bc) => bc.chapter > newTarget)
  ).length

  const statesAffected = store.characterStates.filter(
    (s) => s.chapter_number > newTarget
  ).length

  return {
    outlineOnlyToDelete,
    threadsAffected,
    mysteriesAffected,
    statesAffected,
    blockingLocked: validation.blockingChapters.length,
    minAllowed: validation.minAllowed
  }
}
