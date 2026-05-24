/**
 * Project Cloner — Sprint 9
 *
 * Spin-Off Clone:
 *   1. Insert new project row dengan title auto-incremented.
 *   2. Copy lorebook (characters, items, world_rules, mystery_layers).
 *   3. Copy project meta (narrative_constitution, theme_and_tone, target_ending,
 *      hooks, voice_dna_project).
 *   4. Skip chapters, character_states, plot_threads, chapter_summaries, qa_logs.
 *
 * Result: fresh canvas dengan dunia + tokoh sama, cerita baru.
 */

import { useProjectStore } from '../store/useProjectStore'
import type { Project } from '../types/project'

/**
 * Returns the next available spin-off name.
 * Pattern:
 *   - First clone:  "{src} — Spin-Off"
 *   - Second clone: "{src} — Spin-Off (2)"
 *   - Nth clone:    "{src} — Spin-Off (N)"
 */
export function getNextSpinOffName(sourceTitle: string, allProjects: Project[]): string {
  const baseRoot = sourceTitle.replace(/ — Spin-Off( \(\d+\))?$/, '')
  const baseName = `${baseRoot} — Spin-Off`
  // Existing matches: exact baseName OR "baseName (N)"
  const existing = allProjects
    .map((p) => p.title)
    .filter((t) => t === baseName || t.startsWith(`${baseName} (`))
  if (existing.length === 0) return baseName

  // Find max N used.
  let maxN = 1
  for (const t of existing) {
    if (t === baseName) {
      maxN = Math.max(maxN, 1)
      continue
    }
    const match = t.match(/ \((\d+)\)$/)
    if (match) {
      const n = parseInt(match[1], 10)
      if (!Number.isNaN(n)) maxN = Math.max(maxN, n)
    }
  }
  return `${baseName} (${maxN + 1})`
}

/**
 * Clone a project as a Spin-Off — copies lorebook + meta, skips chapters.
 * Returns the freshly created project (already in store + Supabase if configured).
 */
export async function cloneProjectAsSpinOff(
  sourceProjectId: string,
  customTitle?: string
): Promise<Project> {
  const store = useProjectStore.getState()
  const source = store.projects.find((p) => p.id === sourceProjectId)
  if (!source) {
    throw new Error('Project sumber tidak ditemukan.')
  }

  const finalTitle =
    customTitle?.trim() || getNextSpinOffName(source.title, store.projects)

  // 1. Create the new project shell. createProject only takes the basic 5 args
  //    so we follow up with updateProject to copy meta fields.
  const newProj = await store.createProject(
    finalTitle,
    source.genre,
    source.target_chapters,
    source.word_count_target,
    'FRESH_BRAINSTORM' // Spin-Off uses BRAINSTORM mode (no migration)
  )

  // 2. Copy meta fields from source.
  await store.updateProject(newProj.id, {
    narrative_constitution: source.narrative_constitution,
    theme_and_tone: source.theme_and_tone,
    target_ending: source.target_ending,
    series_hook: source.series_hook,
    season_hooks: source.season_hooks ?? [],
    voice_dna_project: source.voice_dna_project ?? {}
  })

  // Re-load the freshly populated source data so we copy the in-memory
  // lorebook (the active store data may have been swapped to the new
  // project after createProject called setActiveProject).
  // Re-fetch via loadProjectData for source to repopulate.
  await store.loadProjectData(sourceProjectId)
  const sourceCharacters = store.characters.filter((c) => c.project_id === sourceProjectId)
  const sourceItems = store.items.filter((i) => i.project_id === sourceProjectId)
  const sourceRules = store.worldRules.filter((r) => r.project_id === sourceProjectId)
  const sourceLayers = store.mysteryLayers.filter((m) => m.project_id === sourceProjectId)

  // 3. Switch active project to the new one before copying so addX writes to it.
  //    addCharacter etc. use the project_id we pass directly, but the local
  //    state flag still reflects activeProject — so we set it here.
  await store.loadProjectData(newProj.id)

  // 4. Copy each lorebook entity to the new project.
  for (const c of sourceCharacters) {
    await store.addCharacter({
      project_id: newProj.id,
      name: c.name,
      role: c.role,
      description: c.description,
      voice_dna: c.voice_dna ?? {},
      activation_keys: c.activation_keys ?? [c.name],
      priority: c.priority ?? 5,
      is_locked: false,
      genesis: 'BRAINSTORMED'
    })
  }

  for (const i of sourceItems) {
    await store.addItem({
      project_id: newProj.id,
      name: i.name,
      category: i.category,
      description: i.description,
      significance: i.significance,
      activation_keys: i.activation_keys ?? [i.name],
      current_owner: i.current_owner ?? '',
      priority: i.priority ?? 5,
      genesis: 'BRAINSTORMED'
    })
  }

  for (const r of sourceRules) {
    await store.addWorldRule({
      project_id: newProj.id,
      name: r.name,
      category: r.category,
      description: r.description,
      activation_keys: r.activation_keys ?? [],
      priority: r.priority ?? 5,
      genesis: 'BRAINSTORMED'
    })
  }

  for (const m of sourceLayers) {
    await store.addMysteryLayer({
      project_id: newProj.id,
      layer_number: m.layer_number,
      central_question: m.central_question,
      revealed_at_chapter: null, // reset — fresh canvas
      answer: m.answer,
      opens_next_question: m.opens_next_question,
      breadcrumbs: [], // reset — fresh canvas
      status: 'PLANNED',
      season_id: null
    })
  }

  // 5. Refresh activeProject reference — pull latest from store.
  const refreshed = useProjectStore.getState().projects.find((p) => p.id === newProj.id)
  return refreshed ?? newProj
}
