/**
 * Import Cache — localStorage-backed analysis cache.
 *
 * Saves the result of `analyzeManuscript` keyed by SHA-256 hash of the raw
 * input so users who paste the same text twice (or rerun the wizard after a
 * crash) skip the API entirely.
 */
import type { ImportAnalysisResult } from '../services/import-analyzer'

const KEY_PREFIX = 'vn_import_cache_'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEnvelope {
  cachedAt: number
  result: ImportAnalysisResult
}

export function getCachedAnalysis(hash: string): ImportAnalysisResult | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + hash)
    if (!raw) return null
    const env = JSON.parse(raw) as CacheEnvelope
    if (!env.cachedAt || Date.now() - env.cachedAt > TTL_MS) {
      localStorage.removeItem(KEY_PREFIX + hash)
      return null
    }
    return env.result
  } catch {
    return null
  }
}

export function setCachedAnalysis(hash: string, result: ImportAnalysisResult): void {
  try {
    const env: CacheEnvelope = { cachedAt: Date.now(), result }
    localStorage.setItem(KEY_PREFIX + hash, JSON.stringify(env))
  } catch (e) {
    console.warn('[ImportCache] setCachedAnalysis failed (likely storage full):', e)
  }
}

export function clearImportCache(): void {
  try {
    const keysToDelete: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(KEY_PREFIX)) keysToDelete.push(key)
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* noop */
  }
}
