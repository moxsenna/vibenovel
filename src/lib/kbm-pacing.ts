/**
 * KBM Pacing Validator
 *
 * Rules-based validator for the Emotional Rollercoaster pattern and
 * Dopamine Cycle. This is WARNING-ONLY — it does not block outline
 * generation, but returns warnings that are:
 * 1. Displayed in the UI (yellow chip on tone)
 * 2. Injected into the NEXT chapter's prompt for AI self-correction
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface PacingValidationResult {
  valid: boolean
  warnings: string[]
}

export type EmotionalTone =
  | 'TENSION'
  | 'RELIEF'
  | 'DOPAMINE'
  | 'SHOCK'
  | 'BREATHER'
  | 'MYSTERY'
  | 'CONFLICT'

export type CliffhangerType =
  | 'REVELATION'
  | 'DANGER'
  | 'DECISION'
  | 'BETRAYAL'
  | 'COUNTDOWN'
  | 'EMOTIONAL'

// ── Emotional Rollercoaster Validator ──────────────────────────────────────

/**
 * Validates that emotional tones across chapters follow the rollercoaster pattern.
 * Returns warnings (NOT errors) — generation is never blocked.
 *
 * Rules:
 * 1. No 3 consecutive chapters with the same emotional tone
 * 2. No 5 consecutive chapters without a BREATHER or RELIEF
 * 3. No 3 consecutive CONFLICT/TENSION without a lighter tone
 */
export function validateEmotionalPattern(emotionalTones: string[]): PacingValidationResult {
  const warnings: string[] = []

  if (emotionalTones.length < 3) {
    return { valid: true, warnings: [] }
  }

  // Rule 1: No 3 consecutive same tones
  for (let i = 2; i < emotionalTones.length; i++) {
    const tone = emotionalTones[i]
    if (tone === emotionalTones[i - 1] && tone === emotionalTones[i - 2]) {
      const chapNum = i + 1 // 1-indexed
      warnings.push(
        `Emosi monoton: 3 bab berturut-turut (Bab ${chapNum - 2}-${chapNum}) semua "${tone}". ` +
        `Pembaca bisa bosan. Variasikan dengan BREATHER, DOPAMINE, atau RELIEF.`
      )
    }
  }

  // Rule 2: No 5 consecutive chapters without BREATHER or RELIEF
  const lightTones = ['BREATHER', 'RELIEF', 'DOPAMINE']
  let heavyStreak = 0
  for (let i = 0; i < emotionalTones.length; i++) {
    if (lightTones.includes(emotionalTones[i])) {
      heavyStreak = 0
    } else {
      heavyStreak++
      if (heavyStreak >= 5) {
        warnings.push(
          `Tekanan terlalu lama: ${heavyStreak} bab berturut-turut tanpa jeda emosi (BREATHER/RELIEF/DOPAMINE). ` +
          `Pembaca butuh lembah agar puncak terasa tinggi. Sisipkan adegan ringan.`
        )
        heavyStreak = 0 // Reset to avoid duplicate warnings
      }
    }
  }

  // Rule 3: No 3 consecutive intense tones (CONFLICT, TENSION, SHOCK)
  const intenseTones = ['CONFLICT', 'TENSION', 'SHOCK']
  for (let i = 2; i < emotionalTones.length; i++) {
    if (
      intenseTones.includes(emotionalTones[i]) &&
      intenseTones.includes(emotionalTones[i - 1]) &&
      intenseTones.includes(emotionalTones[i - 2])
    ) {
      const chapNum = i + 1
      warnings.push(
        `Eskalasi tanpa henti: Bab ${chapNum - 2}-${chapNum} semua intens (${emotionalTones.slice(i - 2, i + 1).join(', ')}). ` +
        `Tanpa jeda, pembaca kehabisan napas emosional. Tambahkan BREATHER di bab berikutnya.`
      )
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

// ── Cliffhanger Variety Check ──────────────────────────────────────────────

/**
 * Checks that cliffhanger types are varied.
 * Returns warnings if same type used 3+ times consecutively.
 */
export function validateCliffhangerVariety(cliffhangerTypes: string[]): PacingValidationResult {
  const warnings: string[] = []

  if (cliffhangerTypes.length < 3) {
    return { valid: true, warnings: [] }
  }

  for (let i = 2; i < cliffhangerTypes.length; i++) {
    const type = cliffhangerTypes[i]
    if (type === cliffhangerTypes[i - 1] && type === cliffhangerTypes[i - 2]) {
      warnings.push(
        `Cliffhanger repetitif: 3 bab berturut-turut menggunakan tipe "${type}". ` +
        `Variasikan dengan tipe lain (REVELATION, DANGER, DECISION, BETRAYAL, COUNTDOWN, EMOTIONAL).`
      )
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

// ── Suggest Emotional Tone ─────────────────────────────────────────────────

/**
 * Suggests the next emotional tone based on the rollercoaster pattern
 * and the chapter's position in the story.
 *
 * This is a SUGGESTION — the AI may override it based on story context.
 */
export function suggestEmotionalTone(
  chapterNumber: number,
  previousTones: string[]
): string {
  // Pattern per 10 chapters (0-indexed within the group)
  const positionInCycle = (chapterNumber - 1) % 10
  const idealPattern: EmotionalTone[] = [
    'TENSION',   // 1
    'TENSION',   // 2
    'DOPAMINE',  // 3
    'BREATHER',  // 4
    'BREATHER',  // 5
    'CONFLICT',  // 6
    'CONFLICT',  // 7
    'RELIEF',    // 8
    'SHOCK',     // 9
    'TENSION'    // 10
  ]

  let suggested = idealPattern[positionInCycle]

  // If last 2 tones are the same as suggestion, force a different one
  if (previousTones.length >= 2) {
    const last = previousTones[previousTones.length - 1]
    const secondLast = previousTones[previousTones.length - 2]
    if (last === suggested && secondLast === suggested) {
      // Pick a contrasting tone
      const contrastMap: Record<string, EmotionalTone> = {
        'TENSION': 'BREATHER',
        'CONFLICT': 'RELIEF',
        'SHOCK': 'DOPAMINE',
        'BREATHER': 'TENSION',
        'RELIEF': 'MYSTERY',
        'DOPAMINE': 'CONFLICT',
        'MYSTERY': 'TENSION'
      }
      suggested = contrastMap[suggested] || 'BREATHER'
    }
  }

  return suggested
}

// ── Calculate Dopamine Beat ────────────────────────────────────────────────

/**
 * Determines if a chapter should have the dopamine beat flag.
 * Pattern: every 3-5 chapters (specifically: chapter 3, 7, 10, 13, 17, 20, ...)
 */
export function calculateDopamineBeat(chapterNumber: number): boolean {
  // Chapters in a 10-chapter cycle where dopamine hits:
  // 3 (mini-payoff), 7 (escalation reward), 10 (major payoff before next arc)
  const posInCycle = ((chapterNumber - 1) % 10) + 1
  return posInCycle === 3 || posInCycle === 7 || posInCycle === 10
}

// ── Combined Validation ────────────────────────────────────────────────────

/**
 * Run all pacing validations at once.
 * Returns combined result with all warnings.
 */
export function validatePacing(
  emotionalTones: string[],
  cliffhangerTypes: string[]
): PacingValidationResult {
  const emotionResult = validateEmotionalPattern(emotionalTones)
  const cliffhangerResult = validateCliffhangerVariety(cliffhangerTypes)

  const allWarnings = [...emotionResult.warnings, ...cliffhangerResult.warnings]

  return {
    valid: allWarnings.length === 0,
    warnings: allWarnings
  }
}

// ── Sprint 5 — False Resolution & Hook Chain Coverage ─────────────────────

/**
 * Warns if no `false_resolution` flag was set in the recent window. KBM PPC
 * novels typically expect at least one False Resolution per ~10 chapters
 * (Mesin 4 — Reader thinks problem is solved, then twist hits).
 */
export function validateFalseResolution(
  flags: boolean[],
  windowSize = 15
): PacingValidationResult {
  if (flags.length < windowSize) return { valid: true, warnings: [] }
  const window = flags.slice(-windowSize)
  if (window.some((f) => f)) return { valid: true, warnings: [] }
  return {
    valid: false,
    warnings: [
      `Belum ada FALSE RESOLUTION dalam ${windowSize} bab terakhir. ` +
        `Pertimbangkan: bab di mana pembaca pikir masalah selesai, lalu twist langsung menghancurkan asumsi mereka.`
    ]
  }
}

/**
 * Warns if the project's Hook Chain isn't populated even though the user is
 * already past the Compass setup phase. Series Hook is the single open
 * question that powers the whole novel.
 */
export interface HookChainCoverageInput {
  seriesHook: string | null | undefined
  seasonHooks: string[] | null | undefined
  hasOutlinedChapters: boolean
}

export function validateHookChainCoverage(
  input: HookChainCoverageInput
): PacingValidationResult {
  const warnings: string[] = []
  if (!input.seriesHook || !input.seriesHook.trim()) {
    warnings.push(
      'Series Hook belum diisi. Tetapkan satu pertanyaan besar yang menjaga pembaca dari bab 1 sampai akhir novel.'
    )
  }
  if (input.hasOutlinedChapters && (!input.seasonHooks || input.seasonHooks.length === 0)) {
    warnings.push(
      'Season Hooks belum ada. Setiap season butuh 1 driving question (~30-50 bab) agar mid-novel tidak terasa stagnan.'
    )
  }
  return {
    valid: warnings.length === 0,
    warnings
  }
}
