import type { Character, MysteryLayer, StoryContract } from '../types/project'

export type CompassSlot =
  | 'PREMISE'
  | 'PROTAGONIST'
  | 'ANTAGONIST'
  | 'ENDING'
  | 'MYSTERY'
  | 'COMPLETE'

export interface CompassProgressInput {
  title: string
  genre: string
  storyContract?: StoryContract | Record<string, unknown> | null
  targetEnding: string | null
  characters: Character[]
  mysteryLayers: MysteryLayer[]
}

export interface CompassStep {
  slot: Exclude<CompassSlot, 'COMPLETE'>
  name: string
  done: boolean
}

export interface CompassProgress {
  steps: CompassStep[]
  completed: number
  total: number
  isComplete: boolean
  nextSlot: CompassSlot
  nextLabel: string
}

export const COMPASS_SLOT_LABELS: Record<CompassSlot, string> = {
  PREMISE: 'Premis & Kontrak Cerita',
  PROTAGONIST: 'Tokoh Utama',
  ANTAGONIST: 'Lawan / Masalah Utama',
  ENDING: 'Akhir Cerita',
  MYSTERY: 'Rahasia / Twist',
  COMPLETE: 'Kompas Cerita'
}

export function getCompassSteps(input: CompassProgressInput): CompassStep[] {
  const contractKeys = input.storyContract && typeof input.storyContract === 'object'
    ? Object.keys(input.storyContract)
    : []
  const hasStoryContract = contractKeys.length > 0

  return [
    {
      slot: 'PREMISE',
      name: COMPASS_SLOT_LABELS.PREMISE,
      done: Boolean(input.title.trim()) && Boolean(input.genre.trim()) && hasStoryContract
    },
    {
      slot: 'PROTAGONIST',
      name: COMPASS_SLOT_LABELS.PROTAGONIST,
      done: input.characters.some((c) => c.role === 'PROTAGONIST')
    },
    {
      slot: 'ANTAGONIST',
      name: COMPASS_SLOT_LABELS.ANTAGONIST,
      done: input.characters.some((c) => c.role === 'ANTAGONIST')
    },
    {
      slot: 'ENDING',
      name: COMPASS_SLOT_LABELS.ENDING,
      done: Boolean(input.targetEnding?.trim())
    },
    {
      slot: 'MYSTERY',
      name: COMPASS_SLOT_LABELS.MYSTERY,
      done: input.mysteryLayers.length > 0
    }
  ]
}

export function getCompassProgress(input: CompassProgressInput): CompassProgress {
  const steps = getCompassSteps(input)
  const completed = steps.filter((step) => step.done).length
  const nextMissing = steps.find((step) => !step.done)
  const nextSlot = nextMissing?.slot ?? 'COMPLETE'

  return {
    steps,
    completed,
    total: steps.length,
    isComplete: completed === steps.length,
    nextSlot,
    nextLabel: COMPASS_SLOT_LABELS[nextSlot]
  }
}

export function describeDraftTypeForUser(
  draftType: string,
  data: Record<string, unknown>
): string {
  if (draftType === 'character') {
    const role = typeof data.role === 'string' ? data.role : ''
    if (role === 'PROTAGONIST') return COMPASS_SLOT_LABELS.PROTAGONIST
    if (role === 'ANTAGONIST') return COMPASS_SLOT_LABELS.ANTAGONIST
    return 'Karakter'
  }
  if (draftType === 'ending') return COMPASS_SLOT_LABELS.ENDING
  if (draftType === 'mystery') return COMPASS_SLOT_LABELS.MYSTERY
  if (draftType === 'story_contract') return COMPASS_SLOT_LABELS.PREMISE
  if (draftType === 'world_rule') return 'Elemen Lore'
  if (draftType === 'item') return 'Item Penting'
  if (draftType === 'character_state') return 'Status Karakter'
  return 'Draf'
}
