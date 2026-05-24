/**
 * Blueprint Applier — Sprint 9
 *
 * Takes a freshly-created project + a chosen blueprint + the user's
 * inline-renamed character placeholders, and inserts the prefilled
 * lorebook (characters, items, mystery layers) plus updates the
 * project-level meta fields.
 *
 * Uses existing store actions for optimistic local + Supabase sync.
 */

import { useProjectStore } from '../store/useProjectStore'
import type { GenreBlueprint, BlueprintCharacterArchetype } from '../lib/genre-blueprints'
import { substituteNames } from '../lib/genre-blueprints'
import type { Project } from '../types/project'

/**
 * Build a customNames map from each archetype's placeholder.
 *
 * If the user supplied a name in `userNames`, use that. Otherwise the
 * placeholder remains and we strip it from descriptions to avoid leaking
 * the bracketed string into the UI.
 */
const buildSubstitutionMap = (
  archetypes: BlueprintCharacterArchetype[],
  userNames: Record<string, string>
): Record<string, string> => {
  const map: Record<string, string> = { ...userNames }
  // For any archetype the user didn't rename, fall back to a sensible default.
  for (const a of archetypes) {
    if (!map[a.placeholder_name] || !map[a.placeholder_name].trim()) {
      // Strip the brackets to keep prose readable. e.g. "[Nama Protagonis]" → "Protagonis".
      map[a.placeholder_name] = a.placeholder_name.replace(/^\[Nama\s*/i, '').replace(/\]$/, '').trim() || 'Tokoh'
    }
  }
  return map
}

export interface BlueprintApplyResult {
  charactersAdded: number
  itemsAdded: number
  mysteryLayersAdded: number
}

export async function applyBlueprint(
  project: Project,
  blueprint: GenreBlueprint,
  userCharacterNames: Record<string, string>
): Promise<BlueprintApplyResult> {
  const store = useProjectStore.getState()

  const subs = buildSubstitutionMap(blueprint.character_archetypes, userCharacterNames)

  // 1. Update project-level meta
  await store.updateProject(project.id, {
    narrative_constitution: substituteNames(blueprint.narrative_constitution_template, subs),
    theme_and_tone: blueprint.theme_and_tone,
    target_ending: substituteNames(blueprint.target_ending_template, subs),
    series_hook: substituteNames(blueprint.series_hook_template, subs),
    season_hooks: []
  })

  // 2. Insert characters
  let charactersAdded = 0
  for (const arch of blueprint.character_archetypes) {
    const name = subs[arch.placeholder_name] || arch.placeholder_name
    if (!name || name === arch.placeholder_name) continue // skip skipped archetypes
    await store.addCharacter({
      project_id: project.id,
      name,
      role: arch.role,
      description: substituteNames(arch.description_template, subs),
      voice_dna: arch.voice_dna_hint as Record<string, unknown>,
      activation_keys: [name],
      priority: arch.priority,
      is_locked: false,
      genesis: 'BRAINSTORMED'
    })
    charactersAdded++
  }

  // 3. Insert items
  let itemsAdded = 0
  for (const item of blueprint.item_archetypes) {
    // Item placeholder names are bracketed like "[Cincin Pernikahan]" — keep
    // the inner text only (no leak). User can edit name later.
    const cleanName = item.placeholder_name.replace(/^\[/, '').replace(/\]$/, '').trim() || 'Item Penting'
    await store.addItem({
      project_id: project.id,
      name: cleanName,
      category: item.category,
      description: substituteNames(item.description_template, subs),
      significance: substituteNames(item.significance_template, subs),
      activation_keys: [cleanName],
      current_owner: '',
      priority: item.priority,
      genesis: 'BRAINSTORMED'
    })
    itemsAdded++
  }

  // 4. Insert mystery layers
  let mysteryLayersAdded = 0
  const targetChapters = project.target_chapters || 100
  for (const myst of blueprint.mystery_layer_skeleton) {
    const revealChapter = Math.max(
      1,
      Math.round(targetChapters * myst.reveal_arc_position)
    )
    // Seed a couple of breadcrumbs early in the story.
    const breadcrumbs = [
      {
        chapter: Math.max(1, Math.round(revealChapter * 0.2)),
        hint: substituteNames(myst.breadcrumb_hint, subs)
      },
      {
        chapter: Math.max(1, Math.round(revealChapter * 0.5)),
        hint: substituteNames(myst.breadcrumb_hint, subs)
      }
    ]

    await store.addMysteryLayer({
      project_id: project.id,
      layer_number: myst.layer_number,
      central_question: substituteNames(myst.question_template, subs),
      revealed_at_chapter: null,
      answer: null,
      opens_next_question: null,
      breadcrumbs,
      status: 'PLANNED',
      season_id: null
    })
    mysteryLayersAdded++
  }

  return { charactersAdded, itemsAdded, mysteryLayersAdded }
}
