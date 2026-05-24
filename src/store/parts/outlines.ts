import type { StateCreator } from 'zustand'
import type { OutlineProgress, Chapter } from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import { aiRouter } from '../../services/ai/ai-router'
import { useSettingsStore } from '../useSettingsStore'
import { validatePacing, validateFalseResolution, validateHookChainCoverage, validateDanglingThreads } from '../../lib/kbm-pacing'
import type { OutlineResponse } from '../../services/ai/types'

export interface OutlinesPart {
  outlineGenerating: boolean
  outlineProgress: OutlineProgress | null
  _outlineAbortFlag: boolean
  generateOutlineBatch: (startChapter: number, endChapter: number) => Promise<{ generated: number; skipped: number; warnings: string[] }>
  abortOutlineGeneration: () => void
  regenerateOutline: (chapterId: string) => Promise<void>
  lockOutline: (chapterId: string, locked: boolean) => Promise<void>
}

// Helper: Arc Position Description
// (moved to `src/lib/kbm-pacing.ts` so visualization components can import
// the structured `computeArcBands` helper without pulling the outline store.)

export const outlinesPart: StateCreator<
  ProjectStore,
  [],
  [],
  OutlinesPart
> = (set, get) => ({
  outlineGenerating: false,
  outlineProgress: null,
  _outlineAbortFlag: false,

  generateOutlineBatch: async (startChapter, endChapter) => {
    const { activeProject, characters, items, worldRules, mysteryLayers, chapters } = get()
    if (!activeProject) throw new Error('No active project')

    // ── Story Compass completeness guard (safety net) ──────────────────
    const compassMissing: string[] = []
    if (!activeProject.title || !activeProject.genre) compassMissing.push('Premis & Genre')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) compassMissing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) compassMissing.push('Antagonis')
    if (!activeProject.target_ending) compassMissing.push('Target Ending')
    if (mysteryLayers.length === 0) compassMissing.push('Lapisan Misteri')
    if (compassMissing.length > 0) {
      throw new Error(`Story Compass belum lengkap! Belum terisi: ${compassMissing.join(', ')}. Lengkapi di mode Brainstorm terlebih dahulu.`)
    }

    const totalToGenerate = endChapter - startChapter + 1
    set({
      outlineGenerating: true,
      _outlineAbortFlag: false,
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
    const falseResolutionFlags: boolean[] = []

    const priorChapters = chapters
      .filter((ch) => ch.chapter_number < startChapter && ch.emotional_tone)
      .sort((a, b) => a.chapter_number - b.chapter_number)
    for (const ch of priorChapters) {
      if (ch.emotional_tone) emotionalHistory.push(ch.emotional_tone)
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
            continue
          }
          if (existingChapter.outline_source === 'MANUAL') {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (outline manual).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            continue
          }
          if (existingChapter.is_locked) {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (terkunci).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
            continue
          }
          if (existingChapter.prose) {
            skipped++
            allWarnings.push(`Bab ${chapNum} di-skip (sudah ada prosa).`)
            if (existingChapter.synopsis) generatedSynopses.push(existingChapter.synopsis)
            if (existingChapter.emotional_tone) emotionalHistory.push(existingChapter.emotional_tone)
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

        const pacingResult = validatePacing(emotionalHistory, [])
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
          }, { thinkingBudget: effectiveOutlineBudget })

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

          if (existingChapter) {
            await get().updateChapter(existingChapter.id, chapterData)
          } else {
            await get().addChapter(chapterData)
          }

          generatedSynopses.push(outline.synopsis || '')
          emotionalHistory.push(outline.emotionalTone || '')
          falseResolutionFlags.push(outline.falseResolution || false)
          generated++

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
    set({ _outlineAbortFlag: true })
  },

  regenerateOutline: async (chapterId) => {
    const { activeProject, chapters, characters, items, worldRules, mysteryLayers } = get()
    if (!activeProject) return

    // ── Story Compass completeness guard (safety net) ──────────────────
    const compassMissing: string[] = []
    if (!activeProject.title || !activeProject.genre) compassMissing.push('Premis & Genre')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) compassMissing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) compassMissing.push('Antagonis')
    if (!activeProject.target_ending) compassMissing.push('Target Ending')
    if (mysteryLayers.length === 0) compassMissing.push('Lapisan Misteri')
    if (compassMissing.length > 0) {
      throw new Error(`Story Compass belum lengkap! Belum terisi: ${compassMissing.join(', ')}. Lengkapi di mode Brainstorm terlebih dahulu.`)
    }

    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter) return

    const priorChapters = chapters
      .filter((ch) => ch.chapter_number < chapter.chapter_number)
      .sort((a, b) => a.chapter_number - b.chapter_number)
    const prevSummaries = priorChapters.map((ch) => ch.synopsis || '').filter(Boolean).slice(-5)
    const emotionalHistory = priorChapters.map((ch) => ch.emotional_tone || '').filter(Boolean).slice(-5)
    const pacingResult = validatePacing(emotionalHistory, [])

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
        seasonHooks: activeProject.season_hooks
      }, { thinkingBudget: effectiveOutlineBudget })

      await get().updateChapter(chapterId, {
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
      })
    } catch (e: unknown) {
      console.error('Failed to regenerate outline:', e)
      throw e
    }
  },

  lockOutline: async (chapterId, locked) => {
    await get().updateChapter(chapterId, { is_locked: locked })
  }
})
