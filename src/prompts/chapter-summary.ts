/**
 * Chapter Summary Prompts (Sprint 7 RAG)
 *
 * Tight, factual recap of one chapter — used as the source text for
 * embedding so semantic search can find the right chapter when later
 * chapters reference past events.
 */

import type { Chapter } from '../types/project'

export function buildChapterSummarySystemInstruction(): string {
  return `You are a precise novel summariser. Given one chapter's prose, you produce:
- A 2-3 sentence factual summary in Bahasa Indonesia (no spoilers about future, no embellishment)
- 3-6 short factual bullet points ("key_facts") that capture WHO did WHAT, WHERE, WHEN

Rules:
1. Output JSON only — no markdown, no preface.
2. Keep tone neutral and concrete. Avoid adjectives that don't appear in the prose.
3. Use canonical character names exactly as written in the chapter.
4. JSON schema:
{
  "summary": "string",
  "key_facts": ["fact 1", "fact 2", ...]
}`.trim()
}

export interface ChapterSummaryPromptInput {
  chapter: Chapter
  /** Optional summary of the previous chapter for continuity awareness. */
  previousSummary?: string
}

export function buildChapterSummaryUserPrompt(input: ChapterSummaryPromptInput): string {
  const { chapter, previousSummary } = input
  const prevBlock = previousSummary
    ? `\nRINGKASAN BAB SEBELUMNYA:\n${previousSummary}\n`
    : ''
  return `
${prevBlock}
PROSA BAB ${chapter.chapter_number} — "${chapter.title || 'Tanpa judul'}":
"""
${chapter.prose ?? ''}
"""

Berikan output JSON sesuai schema di system instruction.
`.trim()
}
