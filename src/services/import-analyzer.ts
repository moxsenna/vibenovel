/**
 * Import Analyzer Orchestrator
 *
 * Drives the two-tier extraction pipeline outlined in Sprint 4:
 *   1. Local pre-processing (chapter split + name seeds + cost estimate +
 *      hash for cache lookup).
 *   2. Tier 1 quick scan — single Gemini call.
 *   3. Tier 2 deep analysis — last chapter, bab 1, midpoint (max 3 calls).
 *   4. Voice DNA calibration for the protagonist (1 call).
 *   5. Cache the result keyed by SHA-256 hash.
 *
 * Every async step honours an `AbortSignal` so the wizard can cancel
 * mid-flight without orphaning fetches.
 */

import { aiRouter } from './ai/ai-router'
import {
  splitChapters,
  extractCharacterSeeds,
  hashText,
  buildQuickScanSample,
  type ParsedChapter
} from '../lib/manuscript-parser'
import { getCachedAnalysis, setCachedAnalysis } from '../lib/import-cache'
import type {
  QuickScanResult,
  ImportedChapterData,
  VoiceDnaResult
} from './ai/types'

export type ProgressStage =
  | 'preflight'
  | 'cache-hit'
  | 'quick-scan'
  | 'deep-analysis'
  | 'voice-dna'
  | 'finalising'
  | 'done'

export interface ProgressEvent {
  stage: ProgressStage
  message: string
  /** 0..1 fraction. */
  progress?: number
}

export interface ImportedChapterRecord {
  chapter_number: number
  title: string
  prose: string
  /** Deep analysis present only for the last chapter and a couple of samples. */
  outline: ImportedChapterData | null
}

export interface ImportAnalysisResult {
  hash: string
  themeAndTone: string
  synopsis: string
  narrativeConstitution: string
  targetEnding: string | null
  characters: QuickScanResult['characters']
  voiceDna: Record<string, VoiceDnaResult>
  chapters: ImportedChapterRecord[]
  /** Items / world rules surface from chapter analysis (best-effort). */
  itemNames: string[]
  worldRuleNames: string[]
}

export interface AnalyzeOptions {
  signal?: AbortSignal
  onProgress?: (event: ProgressEvent) => void
}

function emit(opts: AnalyzeOptions, evt: ProgressEvent) {
  opts.onProgress?.(evt)
}

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
}

/**
 * Pick up to three "strategic" chapters for deep analysis: bab 1, midpoint,
 * and the last chapter. The last chapter is most important because its
 * `characterStates` becomes the State Snapshot starting point.
 */
function pickStrategicSamples(chapters: ParsedChapter[]): {
  first?: ParsedChapter
  middle?: ParsedChapter
  last?: ParsedChapter
} {
  if (chapters.length === 0) return {}
  if (chapters.length === 1) return { last: chapters[0] }
  if (chapters.length === 2) return { first: chapters[0], last: chapters[1] }
  return {
    first: chapters[0],
    middle: chapters[Math.floor(chapters.length / 2)],
    last: chapters[chapters.length - 1]
  }
}

/**
 * Take ~200 word samples from chapters where the named character speaks /
 * appears. Used for the Voice DNA calibration call.
 */
function gatherVoiceSamples(name: string, chapters: ParsedChapter[]): string[] {
  const needle = name.toLowerCase()
  const samples: string[] = []
  for (const ch of chapters) {
    if (samples.length >= 3) break
    if (!ch.raw_text.toLowerCase().includes(needle)) continue
    const words = ch.raw_text.split(/\s+/).filter(Boolean)
    samples.push(words.slice(0, 200).join(' '))
  }
  return samples
}

export async function analyzeManuscript(
  text: string,
  opts: AnalyzeOptions = {}
): Promise<ImportAnalysisResult> {
  emit(opts, { stage: 'preflight', message: 'Mempersiapkan naskah...', progress: 0 })

  const hash = await hashText(text)
  const cached = getCachedAnalysis(hash)
  if (cached) {
    emit(opts, { stage: 'cache-hit', message: 'Hasil dari cache.', progress: 1 })
    emit(opts, { stage: 'done', message: 'Selesai.', progress: 1 })
    return cached
  }

  checkAborted(opts.signal)

  const parsedChapters = splitChapters(text)
  if (parsedChapters.length === 0) {
    throw new Error('Tidak bisa menentukan struktur bab dari naskah ini.')
  }

  const characterSeeds = extractCharacterSeeds(text)
  const compressedSample = buildQuickScanSample(parsedChapters)

  // ── Tier 1: Quick Scan ────────────────────────────────────────────────
  emit(opts, {
    stage: 'quick-scan',
    message: `Quick scan ${parsedChapters.length} bab...`,
    progress: 0.1
  })
  checkAborted(opts.signal)

  const quickScan = await aiRouter.quickScanManuscript(
    {
      compressedSample,
      detectedChapters: parsedChapters.map((c) => ({
        chapter_number: c.chapter_number,
        title: c.title
      })),
      characterSeeds
    },
    opts.signal
  )

  // ── Tier 2: Deep Chapter Analysis (max 3 calls) ───────────────────────
  const samples = pickStrategicSamples(parsedChapters)
  const sampleEntries: { key: 'first' | 'middle' | 'last'; chapter: ParsedChapter }[] = []
  if (samples.first) sampleEntries.push({ key: 'first', chapter: samples.first })
  if (samples.middle) sampleEntries.push({ key: 'middle', chapter: samples.middle })
  if (samples.last) sampleEntries.push({ key: 'last', chapter: samples.last })

  const confirmedCharacterNames = quickScan.characters.map((c) => c.name)
  const deepResults = new Map<number, ImportedChapterData>()

  for (let i = 0; i < sampleEntries.length; i++) {
    checkAborted(opts.signal)
    const { chapter } = sampleEntries[i]
    emit(opts, {
      stage: 'deep-analysis',
      message: `Analisa mendalam Bab ${chapter.chapter_number} (${i + 1}/${sampleEntries.length})...`,
      progress: 0.3 + (i / sampleEntries.length) * 0.4
    })
    try {
      const data = await aiRouter.analyzeImportedChapter(
        {
          chapterNumber: chapter.chapter_number,
          chapterTitle: chapter.title,
          proseText: chapter.raw_text,
          confirmedCharacters: confirmedCharacterNames,
          themeAndTone: quickScan.themeAndTone
        },
        opts.signal
      )
      deepResults.set(chapter.chapter_number, data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      console.warn(
        `[Import] Deep analysis failed for chapter ${chapter.chapter_number}, continuing without it:`,
        e
      )
    }
  }

  // ── Voice DNA Calibration (1 call, protagonist only) ──────────────────
  const protagonist = quickScan.characters.find((c) => c.role === 'PROTAGONIST')
  const voiceDna: Record<string, VoiceDnaResult> = {}
  if (protagonist) {
    emit(opts, {
      stage: 'voice-dna',
      message: `Mengkalibrasi voice DNA "${protagonist.name}"...`,
      progress: 0.8
    })
    checkAborted(opts.signal)
    try {
      const samplesText = gatherVoiceSamples(protagonist.name, parsedChapters)
      if (samplesText.length > 0) {
        const dna = await aiRouter.calibrateVoiceDna(
          { characterName: protagonist.name, samples: samplesText },
          opts.signal
        )
        voiceDna[protagonist.name] = dna
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      console.warn('[Import] Voice DNA calibration failed, skipping:', e)
    }
  }

  // ── Finalise: build chapter records with prose + optional outline ─────
  emit(opts, { stage: 'finalising', message: 'Menyusun hasil...', progress: 0.95 })

  const itemNames = new Set<string>()
  const worldRuleNames = new Set<string>()
  const chapters: ImportedChapterRecord[] = parsedChapters.map((c) => {
    const outline = deepResults.get(c.chapter_number) || null
    if (outline) {
      outline.activeItems?.forEach((n) => itemNames.add(n))
    }
    return {
      chapter_number: c.chapter_number,
      title: c.title,
      prose: c.raw_text,
      outline
    }
  })

  const result: ImportAnalysisResult = {
    hash,
    themeAndTone: quickScan.themeAndTone,
    synopsis: quickScan.synopsis,
    narrativeConstitution: quickScan.narrativeConstitution,
    targetEnding: quickScan.targetEnding,
    characters: quickScan.characters,
    voiceDna,
    chapters,
    itemNames: [...itemNames],
    worldRuleNames: [...worldRuleNames]
  }

  setCachedAnalysis(hash, result)
  emit(opts, { stage: 'done', message: 'Selesai.', progress: 1 })
  return result
}
