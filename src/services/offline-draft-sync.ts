import type { Chapter } from '../types/project'

export interface PendingProseDraft {
  chapterId: string
  beatIndex: number
  text: string
  timestamp: number
}

export interface OfflineDraftPatchResult {
  patch: Partial<Chapter>
  fullProse: string
  wordCount: number
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

function draftStatus(text: string): Chapter['status'] {
  return text.trim().length > 10 ? 'DRAFT' : 'GENERATING'
}

export function buildOfflineDraftChapterPatch(
  chapter: Chapter,
  draft: PendingProseDraft
): OfflineDraftPatchResult | null {
  if (chapter.id !== draft.chapterId) return null

  const text = draft.text.trimEnd()

  if (draft.beatIndex === -1) {
    const wordCount = countWords(text)
    return {
      fullProse: text,
      wordCount,
      patch: {
        prose: text,
        word_count: wordCount,
        status: draftStatus(text),
        prose_source: 'MANUAL_WRITE'
      }
    }
  }

  const beats = [...(chapter.beats ?? [])]
  if (!beats[draft.beatIndex]) return null

  beats[draft.beatIndex] = {
    ...beats[draft.beatIndex],
    prose: text
  }

  const fullProse = beats.map((beat) => beat.prose || '').join('\n\n').trim()
  const wordCount = countWords(fullProse)
  const isCompleted = beats.every((beat) => (beat.prose || '').trim().length > 10)

  return {
    fullProse,
    wordCount,
    patch: {
      beats,
      prose: fullProse,
      word_count: wordCount,
      status: isCompleted ? 'DRAFT' : 'GENERATING',
      prose_source: 'GENERATED'
    }
  }
}
