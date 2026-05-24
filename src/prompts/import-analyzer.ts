/**
 * Import Analyzer Prompts
 *
 * Two-tier extraction pipeline:
 *   • Tier 1 — Quick Scan: 1 call, compressed input (~6k word sample), confirms
 *     chapter boundaries and detected character names, returns theme +
 *     synopsis. Cheap, fast, sets the "skeleton".
 *   • Tier 2 — Deep Chapter Analysis: up to 3 calls, full prose for the last
 *     chapter + bab 1 + midpoint. Produces the rich 20+ field outline data
 *     plus the State Snapshot starting point. Other chapters are imported as
 *     raw prose (`outline_source: 'IMPORTED'`) and lazy-filled later.
 *   • Voice DNA Calibration: 1 call, sample passages per protagonist.
 */

const KBM_VOICE = `
Output dalam Bahasa Indonesia yang bersih, formal-santai. Patuhi gaya melodrama
KBM (paragraf pendek, dialog-heavy, internal monolog kuat) saat menyimpulkan
tone dan cliffhanger.
`.trim()

// ── Tier 1: Quick Scan ────────────────────────────────────────────────────

export function buildQuickScanSystemInstruction(): string {
  return `
Kamu adalah analis naskah yang membaca SAMPEL pendek dari sebuah novel KBM dan
menghasilkan ringkasan struktural. Output WAJIB JSON valid sesuai schema yang
diminta. Jangan menambahkan markdown atau penjelasan di luar JSON.

${KBM_VOICE}

Tujuanmu BUKAN menulis ulang cerita — kamu hanya menentukan:
1. Apakah pemisahan bab yang diberikan terasa benar.
2. Karakter mana yang nyata vs hasil deteksi palsu.
3. Tema umum dan satu paragraf sinopsis novel.

JANGAN coba mengarang detail yang tidak ada di sampel. Jika ragu, biarkan
kosong / null.
`.trim()
}

export interface QuickScanInput {
  compressedSample: string
  detectedChapters: { chapter_number: number; title: string }[]
  characterSeeds: string[]
}

export function buildQuickScanUserPrompt(input: QuickScanInput): string {
  const chapterListing = input.detectedChapters
    .slice(0, 100)
    .map((c) => `- Bab ${c.chapter_number}: ${c.title}`)
    .join('\n')

  const seedListing = input.characterSeeds.length > 0
    ? input.characterSeeds.join(', ')
    : '(belum ada deteksi)'

  return `
SAMPEL NASKAH (200 kata pertama tiap bab):
"""
${input.compressedSample}
"""

BAB TERDETEKSI (heuristik regex lokal):
${chapterListing || '(none)'}

NAMA-NAMA TERDETEKSI (heuristik lokal, mungkin ada false positive):
${seedListing}

Berikan output JSON dengan schema:
{
  "confirmedChapters": [{ "chapter_number": number, "title": string }],
  "characters": [
    { "name": string, "role": "PROTAGONIST"|"ANTAGONIST"|"SUPPORTING"|"MINOR", "shortDescription": string }
  ],
  "themeAndTone": string,
  "synopsis": string,
  "narrativeConstitution": string,
  "targetEnding": string | null
}

Penjelasan field:
- confirmedChapters: validasi bab dari heuristik (boleh hapus yang false positive)
- characters: maksimum 8 karakter paling sering muncul, role dengan tebakan terbaik
- themeAndTone: 1-2 kalimat (genre + suasana dominan)
- synopsis: 3-5 kalimat sinopsis novel keseluruhan
- narrativeConstitution: 1-2 paragraf yang merangkum aturan dunia / nada cerita
- targetEnding: deteksi ending (null jika belum jelas)

Output HANYA JSON, tanpa markdown.
`.trim()
}

// ── Tier 2: Deep Chapter Analysis ─────────────────────────────────────────

export function buildDeepChapterAnalysisSystemInstruction(): string {
  return `
Kamu adalah editor analitis. Kamu membaca prosa lengkap satu bab dan
mengisi 20+ field outline, plus snapshot keadaan karakter di akhir bab.

Output WAJIB JSON valid. JANGAN tambahkan markdown atau komentar.
${KBM_VOICE}

PRINSIP:
- Jangan mengarang. Jika info tidak ada di prosa, biarkan null/[] kosong.
- Ekstrak emotional_tone dari nuansa adegan (CONFLICT, RELIEF, DOPAMINE,
  SHOCK, BREATHER, MYSTERY, TENSION).
- cliffhangerType pakai salah satu: REVELATION, DANGER, DECISION, BETRAYAL,
  COUNTDOWN, EMOTIONAL.
- Gunakan nama karakter yang sudah dikonfirmasi di context.
`.trim()
}

export interface DeepChapterInput {
  chapterNumber: number
  chapterTitle: string
  proseText: string
  confirmedCharacters: string[]
  themeAndTone: string
}

export function buildDeepChapterAnalysisUserPrompt(input: DeepChapterInput): string {
  return `
KARAKTER TERKONFIRMASI: ${input.confirmedCharacters.join(', ') || '(none)'}
TEMA & TONE: ${input.themeAndTone}

PROSA BAB ${input.chapterNumber} — "${input.chapterTitle}":
"""
${input.proseText}
"""

Berikan output JSON dengan schema (gunakan null jika tidak yakin):
{
  "synopsis": string,
  "keyEvents": string[],
  "activeCharacters": string[],
  "activeItems": string[],
  "location": string,
  "timeInStory": string,
  "emotionalTone": string,
  "cliffhangerType": string | null,
  "cliffhangerSetup": string | null,
  "openThreads": string[],
  "resolvedThreads": string[],
  "foreshadowing": string[],
  "chapterEndState": { "<characterName>": { "location": string, "emotion": string } },
  "characterStates": [
    {
      "character_name": string,
      "location": string,
      "physical_condition": string,
      "emotional_state": string,
      "knowledge_state": string[],
      "active_goal": string,
      "secrets": string[],
      "appearance_notes": string,
      "alliances": string[],
      "inventory": string[],
      "last_action": string
    }
  ]
}

Output HANYA JSON.
`.trim()
}

// ── Voice DNA Calibration ─────────────────────────────────────────────────

export function buildVoiceDnaCalibrationSystemInstruction(): string {
  return `
Kamu adalah pendengar gaya bahasa. Diberi 2-3 sampel adegan yang melibatkan
karakter tertentu, simpulkan "Voice DNA" mereka — pola dialog dan narasi yang
membedakan suara mereka dari karakter lain.

Output WAJIB JSON valid sesuai schema. JANGAN tambah markdown.
`.trim()
}

export interface VoiceDnaCalibrationInput {
  characterName: string
  samples: string[] // 2-3 cuplikan ~200 kata
}

export function buildVoiceDnaCalibrationUserPrompt(input: VoiceDnaCalibrationInput): string {
  const samplesBlock = input.samples
    .map((s, i) => `--- Sampel ${i + 1} ---\n${s}`)
    .join('\n\n')

  return `
KARAKTER: ${input.characterName}

${samplesBlock}

Berikan output JSON:
{
  "tone": string,            // mis. "lembut tapi tegas"
  "vocabulary": string,      // mis. "kata-kata sastra dengan campuran Betawi halus"
  "verbalTics": string[],    // frasa khas yang berulang
  "internalMonologStyle": string,
  "dialogQuirks": string     // ciri khas saat ngomong
}

Output HANYA JSON.
`.trim()
}
