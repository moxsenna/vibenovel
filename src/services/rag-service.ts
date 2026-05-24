/**
 * RAG Service (Sprint 7)
 *
 * Wraps Supabase pgvector cosine-similarity search over chapter summaries.
 * Falls back to a deterministic keyword scorer when:
 *   • Supabase isn't configured
 *   • The `match_chapter_summaries` RPC isn't installed
 *   • Embeddings aren't yet populated for any summary
 *
 * Callers always get back the top-K most relevant `ChapterSummary` rows
 * regardless of which path was taken — the AI prose writer doesn't need
 * to care which fallback served the request.
 */

import { geminiPool } from './ai/gemini-pool'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useProjectStore } from '../store/useProjectStore'
import type { ChapterSummary } from '../types/project'

export interface RagMatch {
  summary: ChapterSummary
  similarity: number
}

interface RpcRow {
  id: string
  chapter_id: string
  project_id: string
  summary: string
  key_facts: unknown
  similarity: number
}

const DEFAULT_TOP_K = 3

/**
 * Search the project's chapter summaries for the top-K most semantically
 * similar entries to the query.
 */
export async function searchSimilarChapters(
  projectId: string,
  query: string,
  topK: number = DEFAULT_TOP_K,
  signal?: AbortSignal
): Promise<RagMatch[]> {
  if (!query.trim()) return []

  // Try the embedding + pgvector RPC path first.
  if (isSupabaseConfigured()) {
    try {
      const embedding = await geminiPool.embedContent(query, signal)
      const { data, error } = await supabase.rpc('match_chapter_summaries', {
        p_project_id: projectId,
        p_query_embedding: embedding,
        p_match_count: topK
      })
      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as RpcRow[]).map((row) => ({
          summary: {
            id: row.id,
            chapter_id: row.chapter_id,
            project_id: row.project_id,
            summary: row.summary,
            key_facts: Array.isArray(row.key_facts)
              ? (row.key_facts as string[])
              : [],
            embedding: null // we don't echo it back
          },
          similarity: row.similarity
        }))
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      console.warn('[RAG] pgvector path failed, falling back to keyword:', e)
    }
  }

  // Fallback: keyword scoring against in-memory summaries.
  return keywordSearchLocal(projectId, query, topK)
}

/**
 * Keyword-based fallback that runs entirely in-memory using the summaries
 * already loaded into the project store. Scores by token-overlap weighted
 * by inverse length so short summaries with rare matches outrank long
 * boilerplate.
 */
export function keywordSearchLocal(
  projectId: string,
  query: string,
  topK: number = DEFAULT_TOP_K
): RagMatch[] {
  const summaries = useProjectStore
    .getState()
    .chapterSummaries.filter((s) => s.project_id === projectId)
  if (summaries.length === 0) return []

  const queryTokens = tokenize(query)
  if (queryTokens.size === 0) return []

  const scored: RagMatch[] = []
  for (const s of summaries) {
    const haystack = `${s.summary}\n${s.key_facts.join('\n')}`
    const haystackTokens = tokenize(haystack)
    if (haystackTokens.size === 0) continue
    let overlap = 0
    for (const t of queryTokens) {
      if (haystackTokens.has(t)) overlap++
    }
    if (overlap === 0) continue
    const score = overlap / Math.sqrt(haystackTokens.size)
    scored.push({ summary: s, similarity: score })
  }

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}

const STOPWORDS = new Set([
  'yang',
  'di',
  'ke',
  'dari',
  'untuk',
  'dengan',
  'pada',
  'oleh',
  'dan',
  'atau',
  'tetapi',
  'tapi',
  'ini',
  'itu',
  'saya',
  'kamu',
  'dia',
  'mereka',
  'kami',
  'kita',
  'adalah',
  'ialah',
  'akan',
  'sudah',
  'telah',
  'belum',
  'tidak',
  'bukan',
  'the',
  'and',
  'or',
  'but',
  'a',
  'an',
  'of',
  'to',
  'in'
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  )
}
