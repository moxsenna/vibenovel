/**
 * Chapter Summary Service (Sprint 7)
 *
 * Reads a chapter's prose, calls Gemini for a tight summary + key facts,
 * embeds the summary via `text-embedding-004`, and returns a payload ready
 * for `lorebookPart.upsertChapterSummary`.
 */

import { geminiPool } from './ai/gemini-pool'
import {
  buildChapterSummarySystemInstruction,
  buildChapterSummaryUserPrompt
} from '../prompts/chapter-summary'
import type { Chapter, ChapterSummary } from '../types/project'

export interface SummaryResult {
  summary: string
  key_facts: string[]
  embedding: number[] | null
}

interface ChapterSummaryRaw {
  summary?: unknown
  key_facts?: unknown
}

function parseSummaryJson(raw: string): SummaryResult {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
  let parsed: ChapterSummaryRaw
  try {
    parsed = JSON.parse(cleaned) as ChapterSummaryRaw
  } catch {
    throw new Error('Chapter summary response is not valid JSON')
  }
  const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
  const keyFacts = Array.isArray(parsed.key_facts)
    ? parsed.key_facts.filter((f): f is string => typeof f === 'string')
    : []
  if (!summary) throw new Error('Chapter summary missing `summary` field')
  return { summary, key_facts: keyFacts, embedding: null }
}

export async function generateChapterSummary(
  chapter: Chapter,
  previousSummary?: string,
  signal?: AbortSignal
): Promise<SummaryResult> {
  if (!chapter.prose || chapter.prose.trim().length < 50) {
    throw new Error('Prosa bab terlalu pendek untuk diringkas.')
  }

  const systemInstruction = buildChapterSummarySystemInstruction()
  const userPrompt = buildChapterSummaryUserPrompt({ chapter, previousSummary })

  const raw = await geminiPool.generateContent(
    userPrompt,
    systemInstruction,
    true, // jsonMode
    'gemini-2.0-flash',
    signal
  )
  const result = parseSummaryJson(raw)

  // Embed the summary text. Embedding failure is non-fatal — the summary
  // still has value via `key_facts` keyword-search fallback.
  try {
    result.embedding = await geminiPool.embedContent(result.summary, signal)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    console.warn('[ChapterSummary] embedding failed, falling back to keyword-only:', e)
    result.embedding = null
  }

  return result
}

/**
 * Build the upsert payload (without `id` / `created_at`) so the lorebook
 * store can finalise the insert.
 */
export function buildSummaryUpsertPayload(
  chapter: Chapter,
  result: SummaryResult
): Omit<ChapterSummary, 'id' | 'created_at'> {
  return {
    chapter_id: chapter.id,
    project_id: chapter.project_id,
    summary: result.summary,
    embedding: result.embedding,
    key_facts: result.key_facts
  }
}
