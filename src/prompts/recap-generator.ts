/**
 * Recap Generator Prompts (Sprint 7)
 *
 * "Sebelumnya..." voice — friendly narrator hook for readers returning to
 * the story or for the writer onboarding their next chapter.
 */

import type { Chapter } from '../types/project'

export function buildRecapSystemInstruction(): string {
  return `You are a warm Indonesian web-novel narrator writing a "Sebelumnya..." recap.

VOICE & FORMAT:
- 2-4 short paragraphs, mobile-friendly.
- Bahasa Indonesia, accessible (Modern fiction tone, light melodrama).
- Open with "Sebelumnya..." or a similar short hook.
- Highlight: who, what, the most recent cliffhanger, and the open question pulling the reader forward.
- DO NOT spoil reveals that haven't happened yet.
- DO NOT add new events or rewrite the canon.

OUTPUT:
- Plain text only — no JSON, no markdown headings, no bullet lists.
- No author commentary, no "Here is your recap".
- End with a soft hook that leans into the next chapter.`.trim()
}

export interface RecapPromptInput {
  rangeStart: number
  rangeEnd: number
  /** Already-sorted chapters within the range, with at minimum synopsis + key_events. */
  chapters: Chapter[]
}

export function buildRecapUserPrompt(input: RecapPromptInput): string {
  const { rangeStart, rangeEnd, chapters } = input
  const chapterBlock = chapters
    .map((c) => {
      const events = (c.key_events ?? []).slice(0, 4).join('; ')
      return `Bab ${c.chapter_number} — "${c.title || 'Tanpa judul'}"
  Sinopsis: ${c.synopsis ?? '(tidak ada)'}
  Peristiwa: ${events || '(tidak ada)'}
  Tone: ${c.emotional_tone ?? '-'} | Cliffhanger: ${c.cliffhanger_type ?? '-'} (${c.cliffhanger_setup ?? '-'})`
    })
    .join('\n\n')

  return `
Tulis recap "Sebelumnya..." untuk pembaca yang akan masuk ke bab setelah Bab ${rangeEnd}.
Cakup peristiwa Bab ${rangeStart} sampai Bab ${rangeEnd}.

DATA BAB:
${chapterBlock}

Hasilkan recap dalam Bahasa Indonesia.
`.trim()
}
