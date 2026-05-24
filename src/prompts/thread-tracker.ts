/**
 * Thread Tracker Prompts (Sprint 7)
 *
 * Detects new plot threads planted in a chapter and resolves / updates
 * existing ones. Designed to run as a background task right after a
 * chapter transitions to DRAFT status.
 */

import type { Chapter, PlotThread } from '../types/project'

export function buildThreadTrackerSystemInstruction(): string {
  return `You analyse one chapter of a serialised novel and emit STRUCTURED PLOT THREADS.

DEFINITIONS:
- A plot thread is a question, promise, or unresolved tension introduced or referenced in the prose.
- "Planted" = newly introduced, awaiting resolution.
- "Active" = referenced again, still unresolved.
- "Resolved" = explicitly answered or closed in this chapter.

OUTPUT RULES:
1. Output JSON only — no markdown, no preface.
2. NEVER fabricate threads that don't appear in the prose.
3. Match the schema exactly:
{
  "new_threads": [
    {
      "title": "string (short, imperative, < 80 chars)",
      "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "related_characters": ["name1", "name2"],
      "related_items": ["item1"],
      "notes": "string (1-2 sentence rationale)"
    }
  ],
  "resolved_thread_titles": ["existing thread title 1", ...],
  "updated_thread_titles": [
    { "title": "existing title", "notes": "what changed" }
  ]
}

URGENCY CALIBRATION:
- CRITICAL: imminent danger, life-or-death stakes, time-bound.
- HIGH: directly drives the next 1-3 chapters.
- MEDIUM: arc-level question that pays off within ~10 chapters.
- LOW: world-building or background mystery.

Use Bahasa Indonesia for all string values.`.trim()
}

export interface ThreadTrackerPromptInput {
  chapter: Chapter
  /** Existing thread list so the AI can avoid duplicates and know what to resolve. */
  existingThreads: PlotThread[]
  /** Previous chapter summaries for arc context (max 5). */
  previousSummaries: string[]
}

export function buildThreadTrackerUserPrompt(input: ThreadTrackerPromptInput): string {
  const { chapter, existingThreads, previousSummaries } = input

  const existingBlock = existingThreads.length === 0
    ? '(belum ada thread)'
    : existingThreads
        .map(
          (t) =>
            `- "${t.title}" [${t.status}, urgency ${t.urgency}, planted bab ${t.planted_at}]`
        )
        .join('\n')

  const prevBlock = previousSummaries.length === 0
    ? '(tidak ada konteks sebelumnya)'
    : previousSummaries.slice(-5).join('\n')

  return `
KONTEKS BAB SEBELUMNYA:
${prevBlock}

THREAD YANG SUDAH ADA (jangan duplikasi; tandai sebagai resolved kalau bab ini menyelesaikannya):
${existingBlock}

PROSA BAB ${chapter.chapter_number} — "${chapter.title || 'Tanpa judul'}":
"""
${chapter.prose ?? ''}
"""

OUTLINE BAB INI:
- Synopsis: ${chapter.synopsis ?? '(tidak ada)'}
- Open threads di outline: ${(chapter.open_threads ?? []).join('; ') || '(none)'}
- Resolved threads di outline: ${(chapter.resolved_threads ?? []).join('; ') || '(none)'}

Berikan output JSON sesuai schema di system instruction.
`.trim()
}
