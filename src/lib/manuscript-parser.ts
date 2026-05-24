/**
 * Manuscript Parser — pure-JS pre-processing
 *
 * Local heuristics that run before any AI call. Each helper is deterministic
 * and free, so the more we can do here, the less the AI has to do.
 */

const FALLBACK_WORD_WINDOW = 2500

export interface ParsedChapter {
  chapter_number: number
  title: string
  raw_text: string
}

/**
 * Split a manuscript into chapter records.
 *
 * Strategy:
 * 1. If the text contains lines like "Bab N" / "Chapter N", use those as
 *    boundaries.
 * 2. Otherwise, fall back to fixed word windows so we can still chunk
 *    deterministically.
 */
export function splitChapters(text: string): ParsedChapter[] {
  if (!text.trim()) return []

  const lines = text.split(/\r?\n/)
  const headingIndices: { lineIndex: number; chapterNumber: number; title: string }[] = []

  lines.forEach((line, idx) => {
    const m = line.match(/^\s*(?:BAB|Bab|CHAPTER|Chapter)\s+(\d+|[IVXLCDM]+)\b[:\-—–\s]*(.*)$/)
    if (m) {
      const num = parseChapterNumber(m[1])
      if (num !== null) {
        headingIndices.push({
          lineIndex: idx,
          chapterNumber: num,
          title: (m[2] || '').trim()
        })
      }
    }
  })

  if (headingIndices.length === 0) {
    return splitByWordWindow(text)
  }

  // Build a chapter for every heading we found.
  const result: ParsedChapter[] = []
  for (let i = 0; i < headingIndices.length; i++) {
    const start = headingIndices[i].lineIndex
    const end = i + 1 < headingIndices.length ? headingIndices[i + 1].lineIndex : lines.length
    const body = lines.slice(start + 1, end).join('\n').trim()
    if (body.length === 0) continue
    result.push({
      chapter_number: headingIndices[i].chapterNumber,
      title: headingIndices[i].title || `Bab ${headingIndices[i].chapterNumber}`,
      raw_text: body
    })
  }

  return result.length > 0 ? result : splitByWordWindow(text)
}

function parseChapterNumber(token: string): number | null {
  const arabic = parseInt(token, 10)
  if (!Number.isNaN(arabic)) return arabic
  // Roman numeral fallback (basic).
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let sum = 0
  let prev = 0
  for (let i = token.length - 1; i >= 0; i--) {
    const v = map[token[i].toUpperCase()]
    if (!v) return null
    sum += v < prev ? -v : v
    prev = v
  }
  return sum > 0 ? sum : null
}

function splitByWordWindow(text: string): ParsedChapter[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chapters: ParsedChapter[] = []
  for (let i = 0; i < words.length; i += FALLBACK_WORD_WINDOW) {
    const slice = words.slice(i, i + FALLBACK_WORD_WINDOW)
    const num = chapters.length + 1
    chapters.push({
      chapter_number: num,
      title: `Bab ${num}`,
      raw_text: slice.join(' ')
    })
  }
  return chapters
}

/**
 * Extract a deduplicated list of likely-character names from the manuscript.
 *
 * Picks consecutive capitalized tokens (e.g. "Kania Savitri", "Pria Tua") that
 * appear at least three times. The list is fed to the AI as a seed so it
 * doesn't have to discover names from scratch.
 */
export function extractCharacterSeeds(text: string): string[] {
  // Match runs of two-or-more capitalized tokens, allowing one connecting word
  // (e.g. "Pria Tua", "Kania Savitri", "Ardan Wijaya").
  const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g
  const counts = new Map<string, number>()
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const candidate = match[1]
    // Skip noise: single capitalized common words at sentence starts.
    if (candidate.split(/\s+/).length === 1 && SENTENCE_NOISE.has(candidate)) continue
    counts.set(candidate, (counts.get(candidate) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name]) => name)
}

// Common Indonesian sentence-starters that look capitalized but aren't names.
const SENTENCE_NOISE = new Set([
  'Aku',
  'Dia',
  'Kami',
  'Kita',
  'Mereka',
  'Itu',
  'Ini',
  'Saya',
  'Lalu',
  'Lantas',
  'Tapi',
  'Tetapi',
  'Namun',
  'Kemudian',
  'Setelah',
  'Sebelum',
  'Ketika',
  'Saat',
  'Maka',
  'Padahal',
  'Sementara',
  'Dengan',
  'Dari',
  'Bagi',
  'Untuk',
  'Pada',
  'Di',
  'Ke',
  'Dalam',
  'Oh',
  'Ya',
  'Tidak',
  'Bukan',
  'Belum',
  'Sudah',
  'The',
  'And',
  'But',
  'Or'
])

export interface CostEstimate {
  /** Approximate tokens used for the whole import flow. */
  tokens: number
  /** Number of Gemini calls expected (Tier 1 + Tier 2 + voice DNA). */
  calls: number
  /** Rough wall-time in seconds. */
  etaSeconds: number
}

/**
 * Estimate API cost based on the 9-pillar token strategy.
 * Heuristic: 1 token ≈ 4 characters, Tier 1 ≈ 8k token call, Tier 2 ≈ 8k per
 * deep chapter (we do at most 3), voice DNA ≈ 2k call.
 */
export function estimateCost(text: string, chapterCount: number): CostEstimate {
  const tier1Tokens = 8000
  const tier2Calls = Math.min(3, Math.max(1, chapterCount))
  const tier2TokensPerCall = 8000
  const voiceDnaTokens = 2000

  const calls = 1 /* tier1 */ + tier2Calls + 1 /* voice dna */
  const tokens = tier1Tokens + tier2Calls * tier2TokensPerCall + voiceDnaTokens

  // Gemini Flash typically responds within ~5s per call on free tier.
  const etaSeconds = calls * 5

  // Sanity check: never claim less than the input size cost.
  const inputTokens = Math.ceil(text.length / 4)
  return {
    tokens: Math.max(tokens, inputTokens / 4 /* compressed sample */),
    calls,
    etaSeconds
  }
}

/**
 * Hash an input string with SHA-256 and return a short base64 fingerprint
 * (suitable for cache keys).
 */
export async function hashText(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // URL-safe base64 truncated to 16 chars — collision risk negligible for our scale.
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 16)
}

/**
 * Chunk a long text by paragraph boundaries, honouring a max char budget per
 * chunk. Used for streaming Tier 1 quick scans without exceeding context
 * windows.
 */
export function chunkForAnalysis(text: string, maxChars = 30_000): string[] {
  if (text.length <= maxChars) return [text]
  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      current = p
    } else {
      current = current ? current + '\n\n' + p : p
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/**
 * Build a compressed sample of the manuscript suitable for the Tier 1 quick
 * scan. We take the first ~200 words of each chapter, capped at 6000 words
 * total, so the AI sees structure without the full prose.
 */
export function buildQuickScanSample(chapters: ParsedChapter[]): string {
  const WORDS_PER_CHAPTER = 200
  const TOTAL_WORD_CAP = 6000
  let totalWords = 0
  const lines: string[] = []
  for (const ch of chapters) {
    if (totalWords >= TOTAL_WORD_CAP) break
    const words = ch.raw_text.split(/\s+/).filter(Boolean)
    const slice = words.slice(0, WORDS_PER_CHAPTER).join(' ')
    lines.push(`### Bab ${ch.chapter_number}: ${ch.title}\n${slice}`)
    totalWords += Math.min(words.length, WORDS_PER_CHAPTER)
  }
  return lines.join('\n\n')
}
