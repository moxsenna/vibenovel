/**
 * Prose Context Builder
 *
 * Pure helper that assembles a `ProseGenerateInput` from project state.
 * Used by both the interactive `useBeatWriter` hook AND the batch
 * generator (Sprint 6) so they always produce identical prompts.
 *
 * Side-effect free.
 */

import type {
  Chapter,
  Character,
  CharacterState,
  Item,
  Project,
  WorldRule
} from '../types/project'
import type { ProseGenerateInput } from './ai/types'
import { stateTracker } from './state-tracker'

export interface BuildProseInputArgs {
  project: Project
  chapter: Chapter
  beatIndex: number
  characters: Character[]
  items: Item[]
  worldRules: WorldRule[]
  /**
   * Latest character states for any chapter strictly before
   * `chapter.chapter_number`. Caller decides how to retrieve.
   */
  previousStates: CharacterState[]
  /**
   * All chapters (used to find the previous chapter with prose for the
   * Layer 4 sliding window).
   */
  allChapters: Chapter[]
  /**
   * Optional override for `previousBeatsProse`. Useful when a caller has
   * already accumulated streamed text outside the chapter.beats array.
   */
  overrideBeatsProse?: string[]
}

/**
 * Build a ProseGenerateInput object that matches the AI router's
 * expectations. Pure function — no React, no Zustand.
 */
export function buildProseInput(args: BuildProseInputArgs): ProseGenerateInput {
  const {
    project,
    chapter,
    beatIndex,
    characters,
    items,
    worldRules,
    previousStates,
    allChapters,
    overrideBeatsProse
  } = args

  // Previous beats in this chapter (or override).
  const previousBeatsProse =
    overrideBeatsProse ??
    (chapter.beats ?? [])
      .slice(0, beatIndex)
      .map((b) => b.prose || '')
      .filter((p) => p.trim().length > 0)

  // Active lore context — only entities the chapter says are present.
  const activeCharDetails = characters.filter((c) =>
    chapter.active_characters?.includes(c.name)
  )
  const activeItemDetails = items.filter((i) => chapter.active_items?.includes(i.name))
  const loreContext = [
    ...activeCharDetails.map((c) => `CHAR: ${c.name} - ${c.description}`),
    ...activeItemDetails.map((i) => `ITEM: ${i.name} - ${i.description}`),
    ...worldRules.map((w) => `RULE: ${w.name} - ${w.description}`)
  ].join('\n')

  // Voice DNA per active character — fed to the prose writer as a
  // natural-language brief inside the prompt builder.
  const voiceDna = activeCharDetails.reduce<Record<string, Record<string, unknown>>>(
    (acc, char) => {
      if (char.voice_dna && Object.keys(char.voice_dna).length > 0) {
        acc[char.name] = char.voice_dna as Record<string, unknown>
      }
      return acc
    },
    {}
  )

  // ── Layer 2: cumulative character states ──────────────────────────
  const characterStatesContext =
    previousStates.length > 0
      ? stateTracker.formatStatesForContext(previousStates, characters)
      : undefined

  // ── Layer 4: sliding window — last ~500 words of previous chapter ─
  const prevChapter = allChapters
    .filter((c) => c.chapter_number < chapter.chapter_number && c.prose)
    .sort((a, b) => b.chapter_number - a.chapter_number)[0]
  const slidingWindowPrevChapter = prevChapter?.prose
    ? prevChapter.prose.split(/\s+/).slice(-500).join(' ')
    : undefined

  return {
    title: project.title,
    genre: project.genre,
    narrativeConstitution: project.narrative_constitution || '',
    chapterTitle: chapter.title || '',
    chapterNumber: chapter.chapter_number,
    synopsis: chapter.synopsis || '',
    location: chapter.location || '',
    emotionalTone: chapter.emotional_tone || '',
    cliffhangerType: chapter.cliffhanger_type || '',
    cliffhangerSetup: chapter.cliffhanger_setup || '',
    beats: (chapter.beats ?? []).map((b) => ({ number: b.number, direction: b.direction })),
    beatIndex,
    previousBeatsProse,
    slidingWindowPrevChapter,
    loreContext,
    characterStates: characterStatesContext,
    voiceDna,
    // Sprint 9 — null-safe project-wide voice DNA from Mimicry Engine.
    projectVoiceDna: project.voice_dna_project ?? {}
  }
}

/**
 * Initialise the chapter's `beats[]` from `key_events` when empty.
 * Returns the (possibly new) beats array. Caller is responsible for
 * persisting via `updateChapter` if desired.
 */
export function ensureBeatsForChapter(chapter: Chapter): Chapter['beats'] {
  if (chapter.beats && chapter.beats.length > 0) return chapter.beats
  if (!chapter.key_events || chapter.key_events.length === 0) return []
  return chapter.key_events.map((event, idx) => ({
    id: crypto.randomUUID(),
    number: idx + 1,
    direction: event,
    prose: ''
  }))
}
