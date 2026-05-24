/**
 * Thread Tracker Service (Sprint 7)
 *
 * Detects new plot threads, resolves existing ones, and applies the diff
 * back to the project store. Runs as a background task right after a
 * chapter transitions to DRAFT — same pattern as `state-tracker`.
 */

import { geminiPool } from './ai/gemini-pool'
import {
  buildThreadTrackerSystemInstruction,
  buildThreadTrackerUserPrompt
} from '../prompts/thread-tracker'
import type {
  Chapter,
  ChapterSummary,
  PlotThread
} from '../types/project'

export interface ThreadAnalysisResult {
  newThreads: NewThreadDraft[]
  resolvedThreadTitles: string[]
  updatedThreadTitles: { title: string; notes: string }[]
}

export interface NewThreadDraft {
  title: string
  urgency: PlotThread['urgency']
  relatedCharacters: string[]
  relatedItems: string[]
  notes: string
}

interface RawAnalysis {
  new_threads?: unknown
  resolved_thread_titles?: unknown
  updated_thread_titles?: unknown
}

interface RawNewThread {
  title?: unknown
  urgency?: unknown
  related_characters?: unknown
  related_items?: unknown
  notes?: unknown
}

interface RawUpdatedThread {
  title?: unknown
  notes?: unknown
}

const VALID_URGENCY: PlotThread['urgency'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function parseAnalysisJson(raw: string): ThreadAnalysisResult {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
  let parsed: RawAnalysis
  try {
    parsed = JSON.parse(cleaned) as RawAnalysis
  } catch {
    throw new Error('Thread analysis response is not valid JSON')
  }

  const newThreadsRaw: RawNewThread[] = Array.isArray(parsed.new_threads)
    ? (parsed.new_threads as RawNewThread[])
    : []
  const newThreads: NewThreadDraft[] = newThreadsRaw
    .map((t): NewThreadDraft | null => {
      if (typeof t.title !== 'string' || !t.title.trim()) return null
      const urgency =
        typeof t.urgency === 'string' &&
        VALID_URGENCY.includes(t.urgency as PlotThread['urgency'])
          ? (t.urgency as PlotThread['urgency'])
          : 'MEDIUM'
      return {
        title: t.title.trim(),
        urgency,
        relatedCharacters: Array.isArray(t.related_characters)
          ? (t.related_characters.filter((s): s is string => typeof s === 'string') as string[])
          : [],
        relatedItems: Array.isArray(t.related_items)
          ? (t.related_items.filter((s): s is string => typeof s === 'string') as string[])
          : [],
        notes: typeof t.notes === 'string' ? t.notes.trim() : ''
      }
    })
    .filter((t): t is NewThreadDraft => t !== null)

  const resolvedTitles = Array.isArray(parsed.resolved_thread_titles)
    ? (parsed.resolved_thread_titles as unknown[]).filter(
        (s): s is string => typeof s === 'string'
      )
    : []

  const updatedRaw = Array.isArray(parsed.updated_thread_titles)
    ? (parsed.updated_thread_titles as RawUpdatedThread[])
    : []
  const updatedThreadTitles = updatedRaw
    .map((u) =>
      typeof u.title === 'string' && u.title.trim()
        ? {
            title: u.title.trim(),
            notes: typeof u.notes === 'string' ? u.notes.trim() : ''
          }
        : null
    )
    .filter((u): u is { title: string; notes: string } => u !== null)

  return {
    newThreads,
    resolvedThreadTitles: resolvedTitles,
    updatedThreadTitles
  }
}

/**
 * Run the AI analysis for a chapter. Returns the structured diff — caller
 * is responsible for applying it via `useProjectStore.applyThreadAnalysis`.
 */
export async function analyzeChapterThreads(
  chapter: Chapter,
  existingThreads: PlotThread[],
  previousSummaries: string[],
  signal?: AbortSignal
): Promise<ThreadAnalysisResult> {
  if (!chapter.prose || chapter.prose.trim().length < 50) {
    throw new Error('Prosa bab terlalu pendek untuk analisis thread.')
  }

  const systemInstruction = buildThreadTrackerSystemInstruction()
  const userPrompt = buildThreadTrackerUserPrompt({
    chapter,
    existingThreads,
    previousSummaries
  })

  const raw = await geminiPool.generateContent(
    userPrompt,
    systemInstruction,
    true, // jsonMode
    'gemini-2.0-flash',
    signal
  )
  return parseAnalysisJson(raw)
}

/**
 * Fuzzy match a thread title against the existing list to determine which
 * thread should be resolved. Levenshtein-ish via lowercased token overlap.
 */
export function findThreadByTitle(
  title: string,
  threads: PlotThread[]
): PlotThread | undefined {
  const needle = title.toLowerCase().trim()
  // 1. exact match
  const exact = threads.find((t) => t.title.toLowerCase().trim() === needle)
  if (exact) return exact
  // 2. substring match
  return threads.find(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      needle.includes(t.title.toLowerCase())
  )
}

/**
 * Helper for the background task: build the per-chapter context summaries
 * we'll feed into the prompt. Limits to the most recent 5.
 */
export function gatherPreviousSummaries(
  chapter: Chapter,
  summaries: ChapterSummary[]
): string[] {
  return summaries
    .filter((s) => {
      // We only know chapter_number on the chapter, not the summary, so
      // join through the project store later if needed. For now, accept
      // any summary that came from a chapter prior to this one — the
      // caller passes in chapters and can pre-filter if desired.
      return s.chapter_id !== chapter.id
    })
    .slice(-5)
    .map((s) => s.summary)
}
