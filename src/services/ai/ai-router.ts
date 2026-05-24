import type {
  Project,
  QaLog,
  Chapter,
  Character,
  Item,
  WorldRule,
  CharacterRole,
  ItemCategory,
  LoreCategory,
  MysteryLayer
} from '../../types/project'
import { geminiPool } from './gemini-pool'
import { openRouterAdapter } from './openrouter-adapter'
import { buildOutlineSystemInstruction, buildOutlineUserPrompt } from '../../prompts/outline-engine'
import { buildProseSystemInstruction, buildProseUserPrompt } from '../../prompts/prose-writer'
import { useSettingsStore } from '../../store/useSettingsStore'
import type {
  OutlineGenerateInput,
  OutlineResponse,
  ProseGenerateInput,
  QuickScanResult,
  ImportedChapterData,
  VoiceDnaResult,
  ThinkingChunk
} from './types'
import {
  buildPlotRadarSystemInstruction,
  buildPlotRadarUserPrompt
} from '../../prompts/plot-radar'
import {
  buildLoreExtractorSystemInstruction,
  buildLoreExtractorUserPrompt
} from '../../prompts/lore-extractor'
import {
  buildQuickScanSystemInstruction,
  buildQuickScanUserPrompt,
  buildDeepChapterAnalysisSystemInstruction,
  buildDeepChapterAnalysisUserPrompt,
  buildVoiceDnaCalibrationSystemInstruction,
  buildVoiceDnaCalibrationUserPrompt,
  type QuickScanInput,
  type DeepChapterInput,
  type VoiceDnaCalibrationInput
} from '../../prompts/import-analyzer'
import {
  buildDirectorsCutSystemInstruction,
  buildDirectorsCutUserPrompt,
  buildInlineEditSystemInstruction,
  buildInlineEditUserPrompt,
  type DirectorsCutVariant,
  type DirectorsCutInput,
  type InlineEditInput
} from '../../prompts/rewrite'
import {
  buildRecapSystemInstruction,
  buildRecapUserPrompt,
  type RecapPromptInput
} from '../../prompts/recap-generator'
import {
  buildMimicrySystemInstruction,
  buildMimicryUserPrompt
} from '../../prompts/mimicry-engine'

interface CoAuthorDraft {
  type: 'character' | 'item' | 'world_rule' | 'ending' | 'mystery' | 'character_state'
  data: Record<string, unknown>
}

interface ExtractedLore {
  new_characters?: Record<string, unknown>[]
  new_items?: Record<string, unknown>[]
  new_rules?: Record<string, unknown>[]
}

class AiRouter {
  /**
   * Co-Author chat helper using Gemini Core Engine (gratis).
   * Receives a dynamic systemInstruction from the brainstorm-agent prompt builder.
   */
  public async chatCoAuthor(
    _project: Project,
    systemInstruction: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    userInput: string,
    signal?: AbortSignal
  ): Promise<{ reply: string; draftData?: CoAuthorDraft }> {
    // Format full conversation context
    const fullHistory = history
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Co-Author'}: ${msg.content}`)
      .join('\n\n')

    const prompt = `Berikut adalah riwayat obrolan kita sejauh ini:
${fullHistory}

User: ${userInput}

Silakan balas dengan persona Co-Author sesuai instruksi sistem. Jika kamu mengajukan elemen konkret baru (karakter, item, aturan dunia, ending, atau mystery layer), sertakan data JSON-nya di akhir balasan dalam blok:
<DRAFT_DATA>
{ ... }
</DRAFT_DATA>

Ingat: hanya SATU draf per pesan. Pastikan JSON valid (tanda kutip ganda, tidak ada trailing comma).`

    const response = await geminiPool.generateContent(
      prompt,
      systemInstruction,
      false,
      'gemini-flash-latest',
      signal
    )

    // ── Parse DRAFT_DATA ───────────────────────────────────────────────
    const draftMatch = response.match(/<DRAFT_DATA>([\s\S]*?)<\/DRAFT_DATA>/)
    let draftData: CoAuthorDraft | undefined
    const cleanedReply = response.replace(/<DRAFT_DATA>[\s\S]*?<\/DRAFT_DATA>/, '').trim()

    if (draftMatch && draftMatch[1]) {
      try {
        let jsonStr = draftMatch[1].trim()
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

        const parsed = JSON.parse(jsonStr) as Partial<CoAuthorDraft>

        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.type === 'string' &&
          parsed.data &&
          typeof parsed.data === 'object'
        ) {
          const validTypes: CoAuthorDraft['type'][] = [
            'character',
            'item',
            'world_rule',
            'ending',
            'mystery',
            'character_state'
          ]
          if (validTypes.includes(parsed.type as CoAuthorDraft['type'])) {
            draftData = {
              type: parsed.type as CoAuthorDraft['type'],
              data: parsed.data as Record<string, unknown>
            }
          } else {
            console.warn(`Unknown draft type "${parsed.type}", ignoring draft data.`)
          }
        }
      } catch (e) {
        console.error('Failed to parse DRAFT_DATA JSON from AI output:', e)
      }
    }

    return {
      reply: cleanedReply,
      draftData
    }
  }

  /**
   * Outline Engine: Generates a highly detailed, 20+ field outline for a specific chapter
   * using Gemini Core Engine (gratis).
   *
   * Sprint 9.8 — Accepts optional `options.thinkingBudget` for Deep Outline.
   * When > 0, switches from `geminiPool.generateContent()` to
   * `geminiPool.generateContentV2()` which injects `thinkingConfig` into
   * `generationConfig`. Thought summary is currently discarded — outline
   * is an analytical task, user doesn't need to see model reasoning.
   *
   * Retry mechanism remains as defense-in-depth — Deep Outline reduces
   * retry rate (model plans JSON shape before output) but doesn't replace
   * the safety net.
   */
  public async generateChapterOutline(
    input: OutlineGenerateInput,
    options?: { thinkingBudget?: number; signal?: AbortSignal }
  ): Promise<OutlineResponse> {
    const systemInstruction = buildOutlineSystemInstruction()
    const thinkingBudget = options?.thinkingBudget ?? 0
    const signal = options?.signal

    const userPrompt = buildOutlineUserPrompt({
      title: input.title,
      genre: input.genre,
      narrativeConstitution: input.narrativeConstitution,
      targetEnding: input.targetEnding,
      themeAndTone: input.themeAndTone,
      targetChapters: input.targetChapters,
      characters: input.characters.map<Character>((c) => ({
        id: '',
        project_id: '',
        name: c.name,
        role: c.role as CharacterRole,
        description: c.description,
        voice_dna: c.voice_dna || {},
        activation_keys: [],
        priority: 5,
        is_locked: false,
        genesis: 'BRAINSTORMED'
      })),
      items: input.items.map<Item>((i) => ({
        id: '',
        project_id: '',
        name: i.name,
        category: i.category as ItemCategory,
        description: i.description,
        significance: '',
        activation_keys: [],
        current_owner: i.current_owner,
        priority: 5,
        genesis: 'BRAINSTORMED'
      })),
      worldRules: input.worldRules.map<WorldRule>((w) => ({
        id: '',
        project_id: '',
        name: w.name,
        category: w.category as LoreCategory,
        description: w.description,
        priority: 5,
        activation_keys: [],
        genesis: 'BRAINSTORMED'
      })),
      mysteryLayers: input.mysteryLayers.map<MysteryLayer>((m) => ({
        id: '',
        project_id: '',
        layer_number: m.layer_number,
        central_question: m.central_question,
        revealed_at_chapter: m.revealed_at_chapter,
        answer: m.answer,
        opens_next_question: null,
        breadcrumbs: m.breadcrumbs,
        status: m.status as MysteryLayer['status']
      })),
      chapterNumber: input.chapterNumber,
      previousOutlineSummaries: input.previousChapterSummaries,
      emotionalHistory: input.emotionalHistory,
      pacingWarnings: input.pacingWarnings,
      seriesHook: input.seriesHook,
      seasonHooks: input.seasonHooks
    })

    let retries = 2
    let lastError: Error | null = null

    while (retries > 0) {
      try {
        const result = await geminiPool.generateContentV2(
          userPrompt,
          systemInstruction,
          true,
          'gemini-flash-latest',
          signal,
          thinkingBudget
        )
        const cleaned = result.text.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
        return JSON.parse(cleaned) as OutlineResponse
      } catch (e) {
        console.error(`Outline parse attempt failed (${retries} retries left):`, e)
        lastError = e instanceof Error ? e : new Error(String(e))
        retries--

        if (retries > 0) {
          const stricterPrompt =
            userPrompt +
            '\n\n⚠️ CRITICAL: Your previous response was NOT valid JSON. Output ONLY raw JSON. ' +
            'No markdown, no explanation, no code fences. Start with { and end with }.'

          try {
            const result = await geminiPool.generateContentV2(
              stricterPrompt,
              systemInstruction,
              true,
              'gemini-flash-latest',
              signal,
              thinkingBudget
            )
            const cleaned = result.text.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
            return JSON.parse(cleaned) as OutlineResponse
          } catch (retryError) {
            lastError = retryError instanceof Error ? retryError : new Error(String(retryError))
            retries--
          }
        }
      }
    }

    throw lastError || new Error('Outline Engine output was not valid JSON after retries.')
  }

  /**
   * Prose Writer: Generates the actual chapter prose beat-by-beat via Streaming.
   *
   * Sprint 9.7 — Returns {@link ThinkingChunk} so callers can split
   * model reasoning ("thought" chunks) from final prose ("text" chunks).
   * Caller passes `options.thinkingBudget` per call (0 = thinking off).
   *
   * Routes to Gemini (free, 2.5 Flash) or OpenRouter (Claude Sonnet 4.6,
   * DeepSeek V4 Flash :free, DeepSeek V4 Pro) depending on settings.
   */
  public async *generateProseBeatStream(
    _project: Project,
    input: ProseGenerateInput,
    options?: { thinkingBudget?: number; signal?: AbortSignal }
  ): AsyncGenerator<ThinkingChunk, void, unknown> {
    const settings = useSettingsStore.getState()
    const activeModel = settings.activeProseModel
    const thinkingBudget = options?.thinkingBudget ?? 0
    const signal = options?.signal

    const systemInstruction = buildProseSystemInstruction()
    const userPrompt = buildProseUserPrompt(input)

    if (activeModel === 'gemini') {
      const stream = geminiPool.generateContentStreamV2(
        userPrompt,
        systemInstruction,
        'gemini-flash-latest',
        signal,
        thinkingBudget
      )
      for await (const chunk of stream) {
        yield chunk
      }
    } else {
      // OpenRouter routing: claude → Sonnet 4.6, deepseek → V4 Flash (free),
      // deepseek-pro → V4 Pro (paid, best fiction quality).
      let orModel = 'anthropic/claude-sonnet-4.6'
      if (activeModel === 'claude') {
        orModel = 'anthropic/claude-sonnet-4.6'
      } else if (activeModel === 'deepseek') {
        orModel = 'deepseek/deepseek-v4-flash'
      } else if (activeModel === 'deepseek-pro') {
        orModel = 'deepseek/deepseek-v4-pro'
      }

      const stream = openRouterAdapter.generateContentStreamV2(
        userPrompt,
        systemInstruction,
        orModel,
        thinkingBudget,
        signal
      )
      for await (const chunk of stream) {
        yield chunk
      }
    }
  }

  /**
   * Plot Radar: QA validation engine running after chapter generation
   * to ensure no plot holes or amnesia. Outputs an array of QaLog.
   */
  public async runQARadar(chapter: Chapter, previousContext?: string): Promise<QaLog[]> {
    const systemInstruction = buildPlotRadarSystemInstruction()
    const userPrompt = buildPlotRadarUserPrompt(chapter, previousContext)

    let retries = 2
    let lastError: Error | null = null

    while (retries > 0) {
      try {
        const response = await geminiPool.generateContent(
          userPrompt,
          systemInstruction,
          true,
          'gemini-flash-latest'
        )

        const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
        const parsed = JSON.parse(cleaned)

        if (Array.isArray(parsed)) {
          return parsed as QaLog[]
        } else {
          throw new Error('Response is not a JSON array')
        }
      } catch (e) {
        console.error(`QA Radar parse attempt failed (${retries} retries left):`, e)
        lastError = e instanceof Error ? e : new Error(String(e))
        retries--
      }
    }

    console.error('Plot Radar failed to generate valid JSON array after retries.', lastError)
    return []
  }

  /**
   * Lore Extractor: Reads prose and extracts new characters, items, and rules.
   */
  public async extractLore(
    prose: string,
    existingCharacters: Character[],
    existingItems: Item[],
    existingRules: WorldRule[]
  ): Promise<ExtractedLore> {
    const systemInstruction = buildLoreExtractorSystemInstruction()
    const userPrompt = buildLoreExtractorUserPrompt(
      prose,
      existingCharacters,
      existingItems,
      existingRules
    )

    try {
      const response = await geminiPool.generateContent(
        userPrompt,
        systemInstruction,
        true,
        'gemini-flash-latest'
      )
      const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
      return JSON.parse(cleaned) as ExtractedLore
    } catch (e) {
      console.error('Lore Extractor failed:', e)
      return {}
    }
  }

  /**
   * Generate character state snapshot using Gemini Core (free).
   * This is a non-prose operation — always routes to Gemini regardless of provider setting.
   */
  public async generateStateSnapshot(
    systemInstruction: string,
    userPrompt: string
  ): Promise<string> {
    return geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      false,
      'gemini-flash-latest'
    )
  }

  // ── Import Analyzer ─────────────────────────────────────────────────────

  /**
   * Tier 1 — Quick Scan: confirm chapter boundaries + character list, capture
   * theme + synopsis. Compressed input keeps this to a single Gemini call.
   */
  public async quickScanManuscript(
    input: QuickScanInput,
    signal?: AbortSignal
  ): Promise<QuickScanResult> {
    const systemInstruction = buildQuickScanSystemInstruction()
    const userPrompt = buildQuickScanUserPrompt(input)
    const response = await geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      true,
      'gemini-flash-latest',
      signal
    )
    const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as QuickScanResult
  }

  /**
   * Tier 2 — Deep Chapter Analysis: full prose → 20+ field outline + state
   * snapshots. Run sparingly (last chapter + 2 strategic samples).
   */
  public async analyzeImportedChapter(
    input: DeepChapterInput,
    signal?: AbortSignal
  ): Promise<ImportedChapterData> {
    const systemInstruction = buildDeepChapterAnalysisSystemInstruction()
    const userPrompt = buildDeepChapterAnalysisUserPrompt(input)
    const response = await geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      true,
      'gemini-flash-latest',
      signal
    )
    const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as ImportedChapterData
  }

  /**
   * Voice DNA calibration — derive a character's verbal style from sample
   * passages. One Gemini call per protagonist.
   */
  public async calibrateVoiceDna(
    input: VoiceDnaCalibrationInput,
    signal?: AbortSignal
  ): Promise<VoiceDnaResult> {
    const systemInstruction = buildVoiceDnaCalibrationSystemInstruction()
    const userPrompt = buildVoiceDnaCalibrationUserPrompt(input)
    const response = await geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      true,
      'gemini-flash-latest',
      signal
    )
    const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as VoiceDnaResult
  }

  /**
   * Sprint 9 — Mimicry Engine.
   *
   * Extract project-wide voice DNA from a writing sample. Returns a record
   * with structural style features (diction, rhythm, density, dialogue
   * style, signature/taboo phrasing, pace, emotional palette).
   *
   * Privacy: sample is sent to Gemini for inference only — not stored.
   */
  public async extractProjectVoiceDna(
    sample: string,
    signal?: AbortSignal
  ): Promise<Record<string, string>> {
    const systemInstruction = buildMimicrySystemInstruction()
    const userPrompt = buildMimicryUserPrompt(sample)
    const response = await geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      true,
      'gemini-flash-latest',
      signal
    )
    const cleaned = response.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Mimicry: Output AI bukan objek JSON valid.')
    }
    // Normalize values to strings (defensive — Gemini sometimes returns nested objects).
    const normalized: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') {
        normalized[k] = v
      } else if (v != null) {
        normalized[k] = JSON.stringify(v)
      }
    }
    return normalized
  }

  // ── Director's Cut + Inline Edit ────────────────────────────────────────

  /**
   * Generate a single Director's Cut variant as a streaming response so the
   * UI can render text as it arrives. Sequential generation lets the user
   * abort the remaining variants once they've picked one.
   */
  public async *generateDirectorsCutVariant(
    variant: DirectorsCutVariant,
    input: DirectorsCutInput,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const systemInstruction = buildDirectorsCutSystemInstruction(variant)
    const userPrompt = buildDirectorsCutUserPrompt(input)
    const stream = geminiPool.generateContentStream(
      userPrompt,
      systemInstruction,
      'gemini-flash-latest',
      signal
    )
    for await (const chunk of stream) {
      yield chunk
    }
  }

  /**
   * Inline (Magic) Edit: surgical rewrite driven by a free-form instruction.
   * Uses the cheaper Flash Lite model since selections are usually short.
   */
  public async inlineEdit(
    input: InlineEditInput,
    signal?: AbortSignal
  ): Promise<string> {
    const systemInstruction = buildInlineEditSystemInstruction()
    const userPrompt = buildInlineEditUserPrompt(input)
    return geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      false,
      'gemini-flash-latest',
      signal
    )
  }

  /**
   * Sprint 7 — Recap generator. Produces a "Sebelumnya..." recap for a
   * chapter range using Gemini Flash (cheap, story summary task).
   */
  public async generateRecap(
    input: RecapPromptInput,
    signal?: AbortSignal
  ): Promise<string> {
    const systemInstruction = buildRecapSystemInstruction()
    const userPrompt = buildRecapUserPrompt(input)
    const raw = await geminiPool.generateContent(
      userPrompt,
      systemInstruction,
      false,
      'gemini-2.0-flash',
      signal
    )
    return raw.trim()
  }
}

export const aiRouter = new AiRouter()
