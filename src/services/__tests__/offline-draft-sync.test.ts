import { describe, expect, it } from 'vitest'
import { makeChapter } from '../../test/factories'
import { buildOfflineDraftChapterPatch } from '../offline-draft-sync'

describe('buildOfflineDraftChapterPatch', () => {
  it('replays a Free Write draft into chapter prose', () => {
    const chapter = makeChapter({
      id: 'chapter-free',
      prose: 'old text',
      beats: []
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-free',
      beatIndex: -1,
      text: 'new free write prose with enough words to become draft',
      timestamp: 1
    })

    expect(result?.patch.prose).toBe('new free write prose with enough words to become draft')
    expect(result?.patch.prose_source).toBe('MANUAL_WRITE')
    expect(result?.patch.status).toBe('DRAFT')
    expect(result?.patch.word_count).toBe(10)
  })

  it('replays a beat draft into the correct beat and full prose', () => {
    const chapter = makeChapter({
      id: 'chapter-beat',
      beats: [
        { id: 'b1', number: 1, direction: 'one', prose: 'first beat' },
        { id: 'b2', number: 2, direction: 'two', prose: '' }
      ]
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-beat',
      beatIndex: 1,
      text: 'second beat text',
      timestamp: 1
    })

    expect(result?.patch.beats?.[1]?.prose).toBe('second beat text')
    expect(result?.patch.prose).toBe('first beat\n\nsecond beat text')
    expect(result?.patch.prose_source).toBe('GENERATED')
  })

  it('returns null when a beat draft points to a missing beat', () => {
    const chapter = makeChapter({
      id: 'chapter-beat',
      beats: [{ id: 'b1', number: 1, direction: 'one', prose: '' }]
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-beat',
      beatIndex: 4,
      text: 'lost text',
      timestamp: 1
    })

    expect(result).toBeNull()
  })
})
