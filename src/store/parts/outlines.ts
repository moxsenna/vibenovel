import type { StateCreator } from 'zustand'
import type {
  CanonProposal,
  Chapter,
  ItemCategory,
  OutlineProgress,
  StoryContract
} from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import { aiRouter } from '../../services/ai/ai-router'
import { useSettingsStore } from '../useSettingsStore'
import { validatePacing, validateFalseResolution, validateHookChainCoverage, validateDanglingThreads } from '../../lib/kbm-pacing'
import type { OutlineResponse } from '../../services/ai/types'
import { buildOutlineCanonProposals } from '../../services/canon-proposal-service'
import {
  isNonEmptyStoryContract,
  mergeValidationResults,
  normalizeCharacterRole,
  validateOutlineAgainstStoryContract,
  validationHasBlocker
} from '../../services/story-contract-validator'

export interface OutlinesPart {
  outlineGenerating: boolean
  outlineProgress: OutlineProgress | null
  canonProposals: CanonProposal[]
  _outlineAbortFlag: boolean
  _outlineAbortController: AbortController | null
  generateOutlineBatch: (startChapter: number, endChapter: number) => Promise<{ generated: number; skipped: number; warnings: string[] }>
  abortOutlineGeneration: () => void
  regenerateOutline: (chapterId: string, autoFixInstruction?: string) => Promise<void>
  approveCanonProposal: (proposalId: string) => Promise<void>
  rejectCanonProposal: (proposalId: string) => void
  clearCanonProposals: () => void
  lockOutline: (chapterId: string, locked: boolean) => Promise<void>
}

// Helper: Arc Position Description
// (moved to `src/lib/kbm-pacing.ts` so visualization components can import
// the structured `computeArcBands` helper without pulling the outline store.)

const VALID_ITEM_CATEGORIES: ItemCategory[] = [
  'WEAPON',
  'MAGICAL',
  'DOCUMENT',
  'JEWELRY',
  'VEHICLE',
  'KEY_ITEM',
  'OTHER'
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPayloadString(payload: Record<string, unknown>, key: string, fallback = ''): string {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function readPayloadNumber(payload: Record<string, unknown>, key: string, fallback: number): number {
  const value = payload[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readPayloadStringArray(payload: Record<string, unknown>, key: string, fallback: string[]): string[] {
  const value = payload[key]
  if (!Array.isArray(value)) return fallback
  const list = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return list.length > 0 ? list : fallback
}

function readPayloadRecord(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key]
  return isRecord(value) ? value : {}
}

function normalizeItemCategory(value: unknown): ItemCategory {
  return VALID_ITEM_CATEGORIES.includes(value as ItemCategory)
    ? (value as ItemCategory)
    : 'OTHER'
}

function proposalName(proposal: CanonProposal): string {
  return readPayloadString(proposal.payload, 'name')
}

function proposalDedupeKey(proposal: CanonProposal): string {
  return [
    proposal.project_id,
    proposal.chapter_number,
    proposal.source,
    proposal.proposal_type,
    proposalName(proposal).toLowerCase()
  ].join(':')
}

function appendCanonProposals(current: CanonProposal[], incoming: CanonProposal[]): CanonProposal[] {
  if (incoming.length === 0) return current
  const incomingKeys = new Set(incoming.map(proposalDedupeKey))
  return [
    ...current.filter((proposal) => {
      if (proposal.status !== 'PENDING') return true
      return !incomingKeys.has(proposalDedupeKey(proposal))
    }),
    ...incoming
  ]
}

function mergeStoryContractPatch(
  contract: StoryContract | Record<string, unknown> | undefined,
  patch?: Partial<StoryContract>
): Record<string, unknown> {
  const base: Record<string, unknown> = isRecord(contract) ? { ...contract } : {}
  const existing = Array.isArray(base.canon_entities)
    ? base.canon_entities.filter(isRecord)
    : []
  const incoming = Array.isArray(patch?.canon_entities)
    ? patch.canon_entities
    : []

  if (incoming.length === 0) return base

  const merged = [...existing]
  const seen = new Set(
    existing.map((entity) =>
      `${String(entity.entity_type || '').toLowerCase()}:${String(entity.name || '').toLowerCase()}`
    )
  )

  for (const entity of incoming) {
    const key = `${entity.entity_type.toLowerCase()}:${entity.name.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(entity as unknown as Record<string, unknown>)
  }

  return {
    ...base,
    canon_entities: merged
  }
}

export const outlinesPart: StateCreator<
  ProjectStore,
  [],
  [],
  OutlinesPart
> = (set, get) => ({
  outlineGenerating: false,
  outlineProgress: null,
  canonProposals: [],
  _outlineAbortFlag: false,
  _outlineAbortController: null,

  generateOutlineBatch: async (startChapter, endChapter) => {
    const { activeProject, characters, items, worldRules, mysteryLayers, chapters } = get()
    if (!activeProject) throw new Error('No active project')

    // ── Story Compass completeness guard (safety net) ──────────────────
    const compassMissing: string[] = []
    if (!activeProject.title || !activeProject.genre) compassMissing.push('Premis & Genre')
    if (!isNonEmptyStoryContract(activeProject.story_contract)) compassMissing.push('Story Contract')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) compassMissing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) compassMissing.push('Antagonis')
    if (!activeProject.target_ending) compassMissing.push('Target Ending')
    if (mysteryLayers.length === 0) compassMissing.push('Lapisan Misteri')
    if (compassMissing.length > 0) {
      throw new Error(`Kompas Cerita belum lengkap! Belum terisi: ${compassMissing.join(', ')}. Lengkapi di Ide Cerita terlebih dahulu.`)
    }

    const totalToGenerate = endChapter - startChapter + 1
    const abortController = new AbortController()
    set({
      outlineGenerating: true,
      _outlineAbortFlag: false,
      _outlineAbortController: abortController,
      outlineProgress: {
        current: 0,
        total: totalToGenerate,
        status: 'generating',
        currentChapter: startChapter,
        generated: 0,
        skipped: 0,
        warnings: []
      }
    })

    let generated = 0
    let skipped = 0
    const allWarnings: string[] = []
    const generatedSynopses: string[] = []
    const emotionalHistory: string[] = []
    const cliffhangerHistory: string[] = []
    const falseResolutionFlags: boolean[] = []

    const priorChapters = chapters
      .filter((ch) => ch.chapter_number < startChapter && ch.emotional_tone)
      .sort((a, b) => a.chapter_number - b.chapter_number)
    for (const ch of priorChapters) {
      if (ch.emotional_tone) emotionalHistory.push(ch.emotional_tone)
      if (ch.cliffhanger_type) cliffhangerHistory.push(ch.cliffhanger_type)
      if (ch.synopsis) generatedSynopses.push(ch.synopsis)
      falseResolutionFlags.push(ch.false_resolution || false)
    }

    // Sprint 5 — Hook Chain coverage warning surfaced once per batch.
    const hookCoverage = validateHookChainCoverage({
      seriesHook: activeProject.series_hook,
      seasonHooks: activeProject.season_hooks,
      hasOutlinedChapters: chapters.length > 0
    })
    if (hookCoverage.warnings.length > 0) {
      allWarnings.push(...hookCoverage.warnings)
    }

    // Sprint 7 — Dangling thread alert surfaced once per batch.
    const danglingResult = validateDanglingThreads({
      threads: get().plotThreads,
      currentChapter: startChapter
    })
    if (danglingResult.warnings.length > 0) {
      allWarnings.push(...danglingResult.warnings)
    }

    try {
      for (let chapNum = startChapter; chapNum <= endChapter; chapNum++) {
        if (get()._outlineAbortFlag) {
          set((state) => ({
            outlineProgress: state.outlineProgress
              ? { ...state.outlineProgress, status: 'cancelled' }
              : null
          }))
          break
        }

        const existingChapter = chapters.find((ch) => ch.chapter_number === chapNum)
        if (existingChapter) {
          if (existingChapter.outline_source === 'IMPORTED') {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (imported — unlock dulu di card untuk regenerate).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            if (existingChapter.cliffhanger_type) cliffhangerHistory.push(existingChapter.cliffhanger_type)
            continue
          }
          if (existingChapter.outline_source === 'MANUAL') {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (outline manual).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            if (existingChapter.cliffhanger_type) cliffhangerHistory.push(existingChapter.cliffhanger_type)
            continue
          }
          if (existingChapter.is_locked) {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (terkunci).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            if (existingChapter.cliffhanger_type) cliffhangerHistory.push(existingChapter.cliffhanger_type)
            continue
          }
          if (existingChapter.prose) {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (sudah ada prosa).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            if (existingChapter.cliffhanger_type) cliffhangerHistory.push(existingChapter.cliffhanger_type)
            continue
          }
        }

        set((state) => ({
          outlineProgress: state.outlineProgress
            ? {
                ...state.outlineProgress,
                current: chapNum - startChapter,
                currentChapter: chapNum,
                generated,
                skipped
              }
            : null
        }))

        const pacingResult = validatePacing(emotionalHistory, cliffhangerHistory)
        const pacingWarnings = pacingResult.warnings

        // Sprint 9.8 — Deep Outline gating in batch mode. Master AND batch
        // toggle must both be ON; default OFF for batch since 200 bab × 2-3s
        // adds ~10 minutes total.
        const settings = useSettingsStore.getState()
        const effectiveOutlineBudget =
          settings.deepOutlineEnabled && settings.deepOutlineInBatch ? settings.deepOutlineBudget : 0

        try {
          const outline: OutlineResponse = await aiRouter.generateChapterOutline({
            title: activeProject.title,
            genre: activeProject.genre,
            narrativeConstitution: activeProject.narrative_constitution || '',
            storyContract: activeProject.story_contract || {},
            targetEnding: activeProject.target_ending || '',
            themeAndTone: activeProject.theme_and_tone || '',
            targetChapters: activeProject.target_chapters,
            mysteryLayers: mysteryLayers.map((m) => ({
              layer_number: m.layer_number,
              central_question: m.central_question,
              revealed_at_chapter: m.revealed_at_chapter,
              answer: m.answer,
              breadcrumbs: m.breadcrumbs,
              status: m.status
            })),
            characters: characters.map((c) => ({
              name: c.name,
              role: c.role,
              description: c.description,
              voice_dna: c.voice_dna
            })),
            items: items.map((i) => ({
              name: i.name,
              category: i.category,
              description: i.description,
              current_owner: i.current_owner
            })),
            worldRules: worldRules.map((w) => ({
              name: w.name,
              category: w.category,
              description: w.description
            })),
            chapterNumber: chapNum,
            previousChapterSummaries: generatedSynopses.slice(-5),
            emotionalHistory: emotionalHistory.slice(-5),
            pacingWarnings,
            seriesHook: activeProject.series_hook,
            seasonHooks: activeProject.season_hooks
          }, { thinkingBudget: effectiveOutlineBudget, signal: get()._outlineAbortController?.signal })

          const chapterData: Omit<Chapter, 'id'> = {
            project_id: activeProject.id,
            chapter_number: chapNum,
            title: outline.title || `Bab ${chapNum}`,
            status: 'OUTLINE_ONLY',
            synopsis: outline.synopsis || null,
            key_events: outline.keyEvents || [],
            active_characters: outline.activeCharacters || [],
            active_items: outline.activeItems || [],
            location: outline.location || null,
            time_in_story: outline.timeInStory || null,
            emotional_tone: outline.emotionalTone || null,
            cliffhanger_type: outline.cliffhangerType || null,
            cliffhanger_setup: outline.cliffhangerSetup || null,
            dopamine_beat: outline.dopamineBeat || false,
            false_resolution: outline.falseResolution || false,
            paywall_advice: outline.paywallAdvice || null,
            arc_position: typeof outline.arcPosition === 'string'
              ? { label: outline.arcPosition }
              : outline.arcPosition || null,
            open_threads: outline.openThreads || [],
            resolved_threads: outline.resolvedThreads || [],
            foreshadowing: outline.foreshadowing || [],
            chapter_end_state: outline.chapterEndState || null,
            do_not_include: outline.doNotInclude || [],
            must_connect_to: outline.mustConnectTo || null,
            filler_risk: outline.fillerRisk || null,
            prose: null,
            word_count: 0,
            beats: [],
            outline_source: 'GENERATED',
            prose_source: 'GENERATED',
            is_locked: false
          }

          const deterministicValidation = validateOutlineAgainstStoryContract({
            storyContract: activeProject.story_contract,
            chapter: chapterData,
            characters,
            items,
            mysteryLayers
          })
          const semanticValidation =
            isNonEmptyStoryContract(activeProject.story_contract) && effectiveOutlineBudget > 0
              ? await aiRouter.validateStorySemanticsWithThinking(
                  {
                    storyContract: activeProject.story_contract || {},
                    chapterNumber: chapNum,
                    outline
                  },
                  { thinkingBudget: Math.max(1024, effectiveOutlineBudget) }
                )
              : { passed: true, issues: [] }
          const storyValidation = mergeValidationResults(deterministicValidation, semanticValidation)
          if (storyValidation.issues.length > 0) {
            allWarnings.push(
              ...storyValidation.issues.map(
                (issue) => `Bab ${chapNum}: [${issue.severity}] ${issue.code} - ${issue.message}`
              )
            )
          }
          // Simpan chapter ke memori/database meskipun melanggar blocker, agar bisa di-Auto-Fix
          if (existingChapter) {
            await get().updateChapter(existingChapter.id, chapterData)
          } else {
            await get().addChapter(chapterData)
          }

          generatedSynopses.push(outline.synopsis || '')
          emotionalHistory.push(outline.emotionalTone || '')
          if (outline.cliffhangerType) cliffhangerHistory.push(outline.cliffhangerType)
          falseResolutionFlags.push(outline.falseResolution || false)
          generated++

          if (validationHasBlocker(storyValidation)) {
            const proposals = buildOutlineCanonProposals({
              projectId: activeProject.id,
              chapter: chapterData,
              existingChapterId: existingChapter?.id,
              characters,
              items,
              issues: storyValidation.issues
            })

            if (proposals.length > 0) {
              const message = `Bab ${chapNum} tertahan: AI mengusulkan ${proposals.length} canon baru. Setujui atau tolak proposal di panel Rencana Bab sebelum melanjutkan.`
              allWarnings.push(message)
              set((state) => ({
                canonProposals: appendCanonProposals(state.canonProposals, proposals),
                outlineProgress: state.outlineProgress
                  ? { ...state.outlineProgress, warnings: allWarnings }
                  : null
              }))
              break
            }

            // Hentikan batch agar tidak melanjutkan ke bab berikutnya yang didasari fondasi bab yang salah (blocker).
            break
          }

          if (pacingWarnings.length > 0) {
            allWarnings.push(...pacingWarnings.map((w) => `Bab ${chapNum}: ${w}`))
          }

          // After every batch chapter, check if False Resolution droughts.
          const frResult = validateFalseResolution(falseResolutionFlags)
          if (frResult.warnings.length > 0) {
            // Push only once — avoid spamming the same warning.
            const last = allWarnings[allWarnings.length - 1]
            if (!last || !last.includes('FALSE RESOLUTION')) {
              allWarnings.push(...frResult.warnings)
            }
          }

        } catch (genError: unknown) {
          const err = genError as { message?: string }
          console.error(`Failed to generate outline for chapter ${chapNum}:`, genError)
          allWarnings.push(`Bab ${chapNum}: Gagal generate — ${err.message || 'Unknown error'}`)
        }
      }
    } finally {
      set((state) => ({
        outlineGenerating: false,
        _outlineAbortController: null,
        outlineProgress: state.outlineProgress
          ? {
              ...state.outlineProgress,
              current: totalToGenerate,
              status: state._outlineAbortFlag ? 'cancelled' : 'success',
              generated,
              skipped,
              warnings: allWarnings
            }
          : null
      }))
    }

    return { generated, skipped, warnings: allWarnings }
  },

  abortOutlineGeneration: () => {
    const { _outlineAbortController } = get()
    if (_outlineAbortController) {
      _outlineAbortController.abort()
    }
    set({ _outlineAbortFlag: true })
  },

  regenerateOutline: async (chapterId, autoFixInstruction) => {
    const { activeProject, chapters, characters, items, worldRules, mysteryLayers } = get()
    if (!activeProject) return

    // ── Story Compass completeness guard (safety net) ──────────────────
    const compassMissing: string[] = []
    if (!activeProject.title || !activeProject.genre) compassMissing.push('Premis & Genre')
    if (!isNonEmptyStoryContract(activeProject.story_contract)) compassMissing.push('Story Contract')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) compassMissing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) compassMissing.push('Antagonis')
    if (!activeProject.target_ending) compassMissing.push('Target Ending')
    if (mysteryLayers.length === 0) compassMissing.push('Lapisan Misteri')
    if (compassMissing.length > 0) {
      throw new Error(`Kompas Cerita belum lengkap! Belum terisi: ${compassMissing.join(', ')}. Lengkapi di Ide Cerita terlebih dahulu.`)
    }

    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter) return

    const priorChapters = chapters
      .filter((ch) => ch.chapter_number < chapter.chapter_number)
      .sort((a, b) => a.chapter_number - b.chapter_number)
    const prevSummaries = priorChapters.map((ch) => ch.synopsis || '').filter(Boolean).slice(-5)
    const emotionalHistory = priorChapters.map((ch) => ch.emotional_tone || '').filter(Boolean).slice(-5)
    const cliffhangerHistory = priorChapters.map((ch) => ch.cliffhanger_type || '').filter(Boolean).slice(-5)
    const pacingResult = validatePacing(emotionalHistory, cliffhangerHistory)

    // Sprint 9.8 — Single regenerate uses master toggle directly. Default
    // ON since user regenerates because they're not happy with previous —
    // boost quality is justified.
    const settings = useSettingsStore.getState()
    const effectiveOutlineBudget = settings.deepOutlineEnabled ? settings.deepOutlineBudget : 0

    try {
      const outline: OutlineResponse = await aiRouter.generateChapterOutline({
        title: activeProject.title,
        genre: activeProject.genre,
        narrativeConstitution: activeProject.narrative_constitution || '',
        storyContract: activeProject.story_contract || {},
        targetEnding: activeProject.target_ending || '',
        themeAndTone: activeProject.theme_and_tone || '',
        targetChapters: activeProject.target_chapters,
        mysteryLayers: mysteryLayers.map((m) => ({
          layer_number: m.layer_number,
          central_question: m.central_question,
          revealed_at_chapter: m.revealed_at_chapter,
          answer: m.answer,
          breadcrumbs: m.breadcrumbs,
          status: m.status
        })),
        characters: characters.map((c) => ({
          name: c.name, role: c.role, description: c.description, voice_dna: c.voice_dna
        })),
        items: items.map((i) => ({
          name: i.name, category: i.category, description: i.description, current_owner: i.current_owner
        })),
        worldRules: worldRules.map((w) => ({
          name: w.name, category: w.category, description: w.description
        })),
        chapterNumber: chapter.chapter_number,
        previousChapterSummaries: prevSummaries,
        emotionalHistory,
        pacingWarnings: pacingResult.warnings,
        seriesHook: activeProject.series_hook,
        seasonHooks: activeProject.season_hooks,
        autoFixInstruction
      }, { thinkingBudget: effectiveOutlineBudget })

      const chapterPatch: Partial<Chapter> = {
        title: outline.title,
        synopsis: outline.synopsis,
        key_events: outline.keyEvents || [],
        active_characters: outline.activeCharacters || [],
        active_items: outline.activeItems || [],
        location: outline.location,
        time_in_story: outline.timeInStory,
        emotional_tone: outline.emotionalTone,
        cliffhanger_type: outline.cliffhangerType,
        cliffhanger_setup: outline.cliffhangerSetup,
        dopamine_beat: outline.dopamineBeat || false,
        false_resolution: outline.falseResolution || false,
        paywall_advice: outline.paywallAdvice,
        arc_position: typeof outline.arcPosition === 'string'
          ? { label: outline.arcPosition }
          : outline.arcPosition || null,
        open_threads: outline.openThreads || [],
        resolved_threads: outline.resolvedThreads || [],
        foreshadowing: outline.foreshadowing || [],
        chapter_end_state: outline.chapterEndState || null,
        do_not_include: outline.doNotInclude || [],
        must_connect_to: outline.mustConnectTo,
        filler_risk: outline.fillerRisk,
        outline_source: 'GENERATED'
      }

      const validationChapter: Chapter = { ...chapter, ...chapterPatch }
      const deterministicValidation = validateOutlineAgainstStoryContract({
        storyContract: activeProject.story_contract,
        chapter: validationChapter,
        characters,
        items,
        mysteryLayers
      })
      const semanticValidation =
        isNonEmptyStoryContract(activeProject.story_contract) && effectiveOutlineBudget > 0
          ? await aiRouter.validateStorySemanticsWithThinking(
              {
                storyContract: activeProject.story_contract || {},
                chapterNumber: chapter.chapter_number,
                outline
              },
              { thinkingBudget: Math.max(1024, effectiveOutlineBudget) }
            )
          : { passed: true, issues: [] }
      const storyValidation = mergeValidationResults(deterministicValidation, semanticValidation)
      if (validationHasBlocker(storyValidation)) {
        const proposals = buildOutlineCanonProposals({
          projectId: activeProject.id,
          chapter: validationChapter,
          existingChapterId: chapter.id,
          characters,
          items,
          issues: storyValidation.issues
        })

        if (proposals.length > 0) {
          set((state) => ({
            canonProposals: appendCanonProposals(state.canonProposals, proposals)
          }))
          throw new Error(
            `Outline Bab ${chapter.chapter_number} tertahan karena butuh approval canon baru: ${proposals
              .map((proposal) => proposalName(proposal))
              .filter(Boolean)
              .join(', ')}.`
          )
        }

        throw new Error(
          `Outline melanggar Story Contract: ${storyValidation.issues
            .filter((issue) => issue.severity === 'BLOCKER')
            .map((issue) => issue.message)
            .join('; ')}`
        )
      }

      await get().updateChapter(chapterId, chapterPatch)
    } catch (e: unknown) {
      console.error('Failed to regenerate outline:', e)
      throw e
    }
  },

  approveCanonProposal: async (proposalId) => {
    const proposal = get().canonProposals.find((item) => item.id === proposalId)
    if (!proposal || proposal.status !== 'PENDING') return

    const name = proposalName(proposal)
    if (!name) {
      throw new Error('Proposal canon tidak memiliki nama yang valid.')
    }

    if (proposal.proposal_type === 'character') {
      const exists = get().characters.some((character) => character.name.toLowerCase() === name.toLowerCase())
      if (!exists) {
        await get().addCharacter({
          project_id: proposal.project_id,
          name,
          role: normalizeCharacterRole(proposal.payload.role),
          description: readPayloadString(proposal.payload, 'description', `Karakter pendukung: ${name}.`),
          voice_dna: readPayloadRecord(proposal.payload, 'voice_dna'),
          activation_keys: readPayloadStringArray(proposal.payload, 'activation_keys', [name]),
          priority: readPayloadNumber(proposal.payload, 'priority', 5),
          is_locked: false,
          genesis: 'BRAINSTORMED'
        })
      }
    }

    if (proposal.proposal_type === 'item') {
      const exists = get().items.some((item) => item.name.toLowerCase() === name.toLowerCase())
      if (!exists) {
        await get().addItem({
          project_id: proposal.project_id,
          name,
          category: normalizeItemCategory(proposal.payload.category),
          description: readPayloadString(proposal.payload, 'description', `Item canon: ${name}.`),
          significance: readPayloadString(proposal.payload, 'significance', 'Diusulkan oleh AI saat validasi outline.'),
          activation_keys: readPayloadStringArray(proposal.payload, 'activation_keys', [name]),
          current_owner: readPayloadString(proposal.payload, 'current_owner'),
          priority: readPayloadNumber(proposal.payload, 'priority', 5),
          genesis: 'BRAINSTORMED'
        })
      }
    }

    const activeProject = get().activeProject
    if (activeProject?.id === proposal.project_id && proposal.suggested_contract_patch) {
      await get().updateProject(proposal.project_id, {
        story_contract: mergeStoryContractPatch(activeProject.story_contract, proposal.suggested_contract_patch)
      })
    }

    const resolvedAt = new Date().toISOString()
    set((state) => ({
      canonProposals: state.canonProposals.map((item) =>
        item.id === proposalId
          ? { ...item, status: 'APPROVED', resolved_at: resolvedAt }
          : item
      )
    }))

    const remainingPendingInGroup = get().canonProposals.filter(
      (item) => item.group_id === proposal.group_id && item.status === 'PENDING'
    )
    if (remainingPendingInGroup.length > 0) return

    const group = get().canonProposals.filter((item) => item.group_id === proposal.group_id)
    const candidateChapter = proposal.candidate_chapter || group.find((item) => item.candidate_chapter)?.candidate_chapter
    const existingChapterId = proposal.existing_chapter_id || group.find((item) => item.existing_chapter_id)?.existing_chapter_id
    if (candidateChapter) {
      if (existingChapterId) {
        await get().updateChapter(existingChapterId, candidateChapter)
      } else {
        await get().addChapter(candidateChapter)
      }
    }

    set((state) => ({
      canonProposals: state.canonProposals.filter((item) => item.group_id !== proposal.group_id)
    }))
  },

  rejectCanonProposal: (proposalId) => {
    const proposal = get().canonProposals.find((item) => item.id === proposalId)
    if (!proposal) return
    set((state) => ({
      canonProposals: state.canonProposals.filter((item) => item.group_id !== proposal.group_id)
    }))
  },

  clearCanonProposals: () => {
    set({ canonProposals: [] })
  },

  lockOutline: async (chapterId, locked) => {
    await get().updateChapter(chapterId, { is_locked: locked })
  }
})
