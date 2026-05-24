/**
 * Voice DNA Helper
 *
 * Reuses Sprint 4's `aiRouter.calibrateVoiceDna` to recalibrate a character's
 * voice from the most recent prose. Picks 2-3 sample passages and calls the
 * Gemini Core voice DNA prompt builder.
 */

import type { Chapter, Character } from '../types/project'

export interface VoiceSampleSelection {
  characterName: string
  samples: string[]
}

/**
 * Pick up to 3 prose samples (~200 words each) from the most recent chapters
 * that mention the character's name.
 */
export function gatherVoiceSamples(
  characterName: string,
  chapters: Chapter[],
  maxSamples = 3,
  wordsPerSample = 200
): VoiceSampleSelection {
  const needle = characterName.toLowerCase()
  const ranked = [...chapters]
    .filter((c) => c.prose && c.prose.toLowerCase().includes(needle))
    .sort((a, b) => b.chapter_number - a.chapter_number)

  const samples: string[] = []
  for (const c of ranked) {
    if (samples.length >= maxSamples) break
    const words = (c.prose ?? '').split(/\s+/).filter(Boolean)
    if (words.length === 0) continue
    samples.push(words.slice(0, wordsPerSample).join(' '))
  }
  return { characterName, samples }
}

/**
 * Returns true if the character has enough prose to warrant a recalibration.
 * Used to enable / disable the recalibrate button in the editor UI.
 */
export function canRecalibrate(character: Character, chapters: Chapter[]): boolean {
  const samples = gatherVoiceSamples(character.name, chapters, 2, 80).samples
  return samples.length >= 2
}
