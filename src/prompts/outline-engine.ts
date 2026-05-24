/**
 * Outline Engine Prompt Builder
 * 
 * Builds system instructions and user prompts for the Outline Engine (Gemini Core).
 * Enforces KBM PPC Retention Engine principles:
 * - 🧅 Bawang Berlapis (Layered Mystery) — breadcrumb injection
 * - 🎢 Emotional Rollercoaster — tone variation enforcement
 * - 🪝 Hook Chain — cliffhanger protocol (6 types)
 * - 💔 False Resolution — twist setup
 * - 🧲 Character Investment — vulnerability moments
 * - Dopamine Cycle — micro-victory every 3-5 chapters
 */

import type { Character, Item, WorldRule, MysteryLayer } from '../types/project'
import { getArcPosition } from '../lib/kbm-pacing'

// ── Types ──────────────────────────────────────────────────────────────────

export interface OutlinePromptParams {
  // Story Compass
  title: string
  genre: string
  narrativeConstitution: string | null
  targetEnding: string | null
  themeAndTone: string | null
  targetChapters: number

  // Lorebook
  characters: Character[]
  items: Item[]
  worldRules: WorldRule[]
  mysteryLayers: MysteryLayer[]

  // Sprint 5 — Hook Chain (project-level)
  seriesHook?: string | null
  seasonHooks?: string[]

  // Current generation context
  chapterNumber: number
  previousOutlineSummaries: string[]    // synopsis of previously generated chapters
  emotionalHistory: string[]            // emotional tones of previous chapters

  // Pacing warnings from kbm-pacing.ts
  pacingWarnings: string[]
}

// ── System Instruction ─────────────────────────────────────────────────────

export function buildOutlineSystemInstruction(): string {
  return `You are the VibeNovel Outline Engine — a world-class KBM (Karyanya Bisa Menghasilkan) web novel outline architect.

YOUR MISSION: Generate a highly structured, commercially optimized chapter outline for an Indonesian PPC (Pay-Per-Chapter) web novel.

CORE OUTPUT RULES:
1. Output MUST be 100% valid JSON. Do NOT wrap in markdown code fences.
2. Output MUST match the exact schema provided in the user prompt — no extra fields, no missing fields.
3. All text content (synopsis, events, etc.) MUST be in Bahasa Indonesia.
4. Every chapter MUST end with a cliffhanger — this is NON-NEGOTIABLE for PPC novels.

KBM PPC RETENTION ENGINE (5 MESIN WAJIB):

🧅 BAWANG BERLAPIS (Layered Mystery):
- If the user provides active mystery layers with breadcrumbs, you MUST subtly weave relevant breadcrumbs into the chapter when the chapter number is near a breadcrumb's planned chapter.
- Breadcrumbs must be SUBTLE. They are not reveals — they are tiny hints that only make sense in retrospect.
- Never reveal a mystery answer before its designated reveal chapter.

🎢 EMOTIONAL ROLLERCOASTER:
- Vary emotional tones across consecutive chapters. Follow this general pattern per 10 chapters:
  Bab 1-2: TENSION (rising), Bab 3: DOPAMINE (mini-payoff), Bab 4-5: BREATHER (humor/romance),
  Bab 6-7: CONFLICT (escalation), Bab 8: RELIEF (false resolution), Bab 9: SHOCK (twist), Bab 10: TENSION (cliffhanger)
- NEVER assign the same emotional tone 3 times consecutively. If previous chapters had the same tone, you MUST change it.
- If pacing warnings are provided, address them by adjusting the tone.

🪝 HOOK CHAIN (Cliffhanger Protocol — 6 Types, MANDATORY):
Every chapter MUST end with one of these cliffhanger types:
  REVELATION — A shocking truth is uncovered
  DANGER — Imminent physical or emotional threat
  DECISION — Character faces impossible choice
  BETRAYAL — Trust is broken
  COUNTDOWN — Time is running out
  EMOTIONAL — Heart-wrenching emotional climax
Vary the types across chapters. Do not use the same type 3 times in a row.

🪝 HOOK CHAIN — 5-LEVEL HIERARCHY:
- SERIES HOOK: a single open question that powers the ENTIRE novel from bab 1 to the last bab.
- SEASON HOOKS: each season has one driving question that lasts ~30-50 chapters.
- SUB-ARC HOOK: a 10-15 chapter mini-arc question.
- CHAPTER HOOK: this chapter's cliffhanger (the type field above).
- MICRO HOOK: at least one open question, contradictory detail, or unspoken subtext per scene.
When series_hook / season_hooks are provided, weave subtle reminders of those hooks into the synopsis or open_threads when the chapter is appropriate.

💔 FALSE RESOLUTION:
- Every 8-10 chapters, create a moment where the reader thinks the problem is solved... then destroy it.
- When you craft such a chapter, set "falseResolution": true in the JSON output. This flag is consumed by the validator and surfaced as a 💔 chip in the UI.
- Mark these chapters implicitly in the synopsis.

🧲 CHARACTER INVESTMENT:
- Show character vulnerability and relatable moments. Readers pay for characters they love.
- Use Voice DNA and character descriptions to inform scene choices.

DOPAMINE CYCLE:
- Every 3-5 chapters, include a micro-victory (dopamineBeat: true).
- This is a small win that makes the reader feel rewarded before the next escalation.

PAYWALL ADVICE:
- Chapters 1-8: Recommend FREE (hook readers)
- Chapter 9+: Recommend LOCKED after the first major twist
- Every 15-20 chapters: Recommend unlocking 1 chapter to re-engage hesitant readers
`
}

// ── User Prompt ────────────────────────────────────────────────────────────

export function buildOutlineUserPrompt(params: OutlinePromptParams): string {
  const {
    title,
    genre,
    narrativeConstitution,
    targetEnding,
    themeAndTone,
    targetChapters,
    characters,
    items,
    worldRules,
    mysteryLayers,
    seriesHook,
    seasonHooks,
    chapterNumber,
    previousOutlineSummaries,
    emotionalHistory,
    pacingWarnings
  } = params

  // Build character summary
  const charSummary = characters.length > 0
    ? characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')
    : 'Belum ada karakter.'

  // Build item summary
  const itemSummary = items.length > 0
    ? items.map(i => `- ${i.name} (${i.category}): ${i.description}. Pemilik: ${i.current_owner}`).join('\n')
    : 'Belum ada item.'

  // Build world rules summary
  const worldSummary = worldRules.length > 0
    ? worldRules.map(w => `- ${w.name} (${w.category}): ${w.description}`).join('\n')
    : 'Belum ada aturan dunia khusus.'

  // Build mystery layers with breadcrumb context
  const mysterySummary = mysteryLayers.length > 0
    ? mysteryLayers.map(m => {
        const breadcrumbsNear = m.breadcrumbs
          .filter(b => Math.abs(b.chapter - chapterNumber) <= 3)
          .map(b => `  → Bab ${b.chapter}: "${b.hint}"`)
          .join('\n')
        return `- Layer ${m.layer_number} (${m.status}): "${m.central_question}"${
          m.revealed_at_chapter ? ` [Terungkap di bab ${m.revealed_at_chapter}]` : ''
        }${breadcrumbsNear ? `\n  Breadcrumbs dekat bab ini:\n${breadcrumbsNear}` : ''}`
      }).join('\n')
    : 'Belum ada mystery layers.'

  // Build previous outlines context (last 5 max for token efficiency)
  const recentOutlines = previousOutlineSummaries.slice(-5)
  const prevContext = recentOutlines.length > 0
    ? recentOutlines.map((s, idx) => {
        const chapNum = chapterNumber - recentOutlines.length + idx
        return `Bab ${chapNum}: ${s}`
      }).join('\n')
    : 'Ini adalah bab pertama.'

  // Emotional history for rollercoaster
  const recentEmotions = emotionalHistory.slice(-5)
  const emotionContext = recentEmotions.length > 0
    ? `Emotional tones 5 bab terakhir: [${recentEmotions.join(', ')}]`
    : 'Belum ada data emosi sebelumnya.'

  // Hook Chain context (Sprint 5)
  const hookChainBlock = (() => {
    const lines: string[] = []
    if (seriesHook && seriesHook.trim()) {
      lines.push(`SERIES HOOK (drives the whole novel): ${seriesHook.trim()}`)
    }
    if (seasonHooks && seasonHooks.length > 0) {
      lines.push('SEASON HOOKS:')
      seasonHooks.forEach((h, i) => lines.push(`  S${i + 1}: ${h}`))
    }
    return lines.length > 0 ? '\n' + lines.join('\n') : ''
  })()

  // Pacing warnings
  const warningBlock = pacingWarnings.length > 0
    ? `\n⚠️ PACING WARNINGS (address these in your outline):\n${pacingWarnings.map(w => `- ${w}`).join('\n')}`
    : ''

  return `NOVEL INFORMATION:
Title: "${title}"
Genre: ${genre}
Target Total Chapters: ${targetChapters}
Narrative Constitution: ${narrativeConstitution || 'Belum ditetapkan.'}
Target Ending: ${targetEnding || 'Belum ditetapkan.'}
Theme & Tone: ${themeAndTone || 'Belum ditetapkan.'}

PUSTAKA LORE — KARAKTER:
${charSummary}

PUSTAKA LORE — ITEM:
${itemSummary}

PUSTAKA LORE — ATURAN DUNIA:
${worldSummary}

MYSTERY LAYERS (Bawang Berlapis):
${mysterySummary}
${hookChainBlock}

PREVIOUS CHAPTER OUTLINES:
${prevContext}

${emotionContext}
${warningBlock}

─────────────────────────────────
GENERATE OUTLINE FOR: Chapter ${chapterNumber} of ${targetChapters}
─────────────────────────────────

Position in story arc: ${getArcPosition(chapterNumber, targetChapters)}

JSON Output Schema (output RAW JSON only, no markdown):
{
  "chapterNumber": ${chapterNumber},
  "title": "string (judul pendek dramatis dalam Bahasa Indonesia)",
  "synopsis": "string (2-3 kalimat sinopsis detail dalam Bahasa Indonesia)",
  "keyEvents": ["event 1 dalam Bahasa Indonesia", "event 2", "event 3"],
  "activeCharacters": ["nama karakter 1", "nama karakter 2"],
  "activeItems": ["nama item jika relevan"],
  "location": "string (lokasi adegan)",
  "timeInStory": "string (waktu dalam cerita, misal 'Sabtu sore, 10 tahun lalu')",
  "emotionalTone": "TENSION | RELIEF | DOPAMINE | SHOCK | BREATHER | MYSTERY | CONFLICT",
  "cliffhangerType": "REVELATION | DANGER | DECISION | BETRAYAL | COUNTDOWN | EMOTIONAL",
  "cliffhangerSetup": "string (setup spesifik untuk akhir bab)",
  "dopamineBeat": boolean,
  "falseResolution": boolean,
  "paywallAdvice": "string (rekomendasi FREE atau LOCKED)",
  "arcPosition": "string (misal 'Season 1: Pengkhianatan, Arc: Penolakan Dirga')",
  "openThreads": ["thread baru yang dibuka"],
  "resolvedThreads": ["thread yang terselesaikan di bab ini"],
  "foreshadowing": ["petunjuk tersembunyi untuk bab mendatang"],
  "chapterEndState": {
    "NamaKarakter": { "location": "string", "emotion": "string" }
  },
  "doNotInclude": ["elemen yang JANGAN muncul di bab ini"],
  "mustConnectTo": "string (catatan koneksi ke bab sebelumnya)",
  "fillerRisk": "low | medium | high"
}`
}

// ── Helper: Arc Position Description ───────────────────────────────────────
// `getArcPosition` is now exported from `src/lib/kbm-pacing.ts` so it can be
// re-used by Timeline View (Sprint 8) — see `computeArcBands` for the
// structured equivalent.
