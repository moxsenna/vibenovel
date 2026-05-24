import type { Project, Character, CharacterState, Item, WorldRule, Chapter } from '../../types/project'
import { searchSimilarChapters } from '../rag-service'

export interface PrunedContextResult {
  contextString: string
  activeCharacterNames: string[]
  activeItemNames: string[]
  activeRuleNames: string[]
  injectedStateCount: number
  ragMatchCount: number
}

class ContextInjector {
  /**
   * Matches keywords in text against active lorebook elements and compiles a compact context block.
   * This is our deterministic keyword-matching context pruning algorithm.
   * 
   * NOW includes Layer 2 (Dynamic State) injection from CharacterState data.
   */
  public pruneAndInject(
    project: Project,
    textToScan: string,
    allCharacters: Character[],
    allItems: Item[],
    allRules: WorldRule[],
    previousChapters: Chapter[] = [],
    characterStates: CharacterState[] = []
  ): PrunedContextResult {
    const lowercaseText = textToScan.toLowerCase()

    const activeCharacters: Character[] = []
    const activeItems: Item[] = []
    const activeRules: WorldRule[] = []

    // 1. Scan and Match Characters
    allCharacters.forEach((char) => {
      // Direct name match or activation keys match
      const keys = [...(char.activation_keys || []), char.name]
      const matches = keys.some((key) => lowercaseText.includes(key.toLowerCase()))
      if (matches || char.role === 'PROTAGONIST') {
        // Protagonists are always injected to keep their profile consistent!
        activeCharacters.push(char)
      }
    })

    // 2. Scan and Match Items
    allItems.forEach((item) => {
      const keys = [...(item.activation_keys || []), item.name]
      const matches = keys.some((key) => lowercaseText.includes(key.toLowerCase()))
      if (matches || item.priority >= 9) {
        // High priority items are always injected
        activeItems.push(item)
      }
    })

    // 3. Scan and Match World Rules (Lore)
    allRules.forEach((rule) => {
      const keys = [...(rule.activation_keys || []), rule.name]
      const matches = keys.some((key) => lowercaseText.includes(key.toLowerCase()))
      if (matches || rule.priority >= 9) {
        activeRules.push(rule)
      }
    })

    // 4. Assemble the context string
    let contextBlock = `=== STORY LOREBOOK CONTEXT ===\n`

    // ── Layer 1: Static Lorebook ──────────────────────────────────────────

    // Narrative Constitution
    if (project.narrative_constitution) {
      contextBlock += `[NARRATIVE CONSTITUTION (Priority: 10)]\n${project.narrative_constitution}\n\n`
    }
    
    // Theme & Tone
    if (project.theme_and_tone) {
      contextBlock += `[THEME & TONE (Priority: 9)]\n${project.theme_and_tone}\n\n`
    }

    // Characters (profiles)
    if (activeCharacters.length > 0) {
      contextBlock += `[CHARACTERS]\n`
      activeCharacters.forEach((char) => {
        contextBlock += `- Name: ${char.name} (${char.role})\n`
        contextBlock += `  Description: ${char.description}\n`
        if (char.voice_dna && Object.keys(char.voice_dna).length > 0) {
          contextBlock += `  Voice Style: ${JSON.stringify(char.voice_dna)}\n`
        }
      })
      contextBlock += `\n`
    }

    // Items
    if (activeItems.length > 0) {
      contextBlock += `[IMPORTANT ITEMS & ARTIFACTS]\n`
      activeItems.forEach((item) => {
        contextBlock += `- Name: ${item.name} (${item.category})\n`
        contextBlock += `  Description: ${item.description}\n`
        contextBlock += `  Significance: ${item.significance}\n`
        if (item.current_owner) {
          contextBlock += `  Current Owner: ${item.current_owner}\n`
        }
      })
      contextBlock += `\n`
    }

    // World Rules
    if (activeRules.length > 0) {
      contextBlock += `[WORLD RULES & LORE]\n`
      activeRules.forEach((rule) => {
        contextBlock += `- Lore: ${rule.name} (${rule.category})\n`
        contextBlock += `  Rules: ${rule.description}\n`
      })
      contextBlock += `\n`
    }

    // ── Layer 2: Dynamic Character States ──────────────────────────────

    let injectedStateCount = 0
    if (characterStates.length > 0) {
      // Only inject states for characters that are ACTIVE in this context
      const activeCharIds = new Set(activeCharacters.map(c => c.id))
      const relevantStates = characterStates.filter(s => activeCharIds.has(s.character_id))

      if (relevantStates.length > 0) {
        contextBlock += `[CHARACTER STATES — Layer 2: Dynamic]\n`
        relevantStates.forEach((state) => {
          const charName = activeCharacters.find(c => c.id === state.character_id)?.name || state.character_id

          contextBlock += `== ${charName} (setelah Bab ${state.chapter_number}) ==\n`
          contextBlock += `📍 Lokasi: ${state.location || 'Tidak diketahui'}\n`
          contextBlock += `💊 Kondisi: ${state.physical_condition || 'Normal'}\n`
          contextBlock += `🎭 Emosi: ${state.emotional_state || 'Netral'}\n`

          if (state.inventory.length > 0) {
            contextBlock += `🎒 Inventaris: ${state.inventory.join(', ')}\n`
          }

          if (state.knowledge_state && state.knowledge_state.length > 0) {
            contextBlock += `🧠 Tahu: ${state.knowledge_state.join('; ')}\n`
          }

          if (state.active_goal) {
            contextBlock += `🎯 Tujuan: ${state.active_goal}\n`
          }

          if (state.secrets && state.secrets.length > 0) {
            contextBlock += `🤫 Rahasia: ${state.secrets.join('; ')}\n`
          }

          if (state.appearance_notes) {
            contextBlock += `👁 Penampilan: ${state.appearance_notes}\n`
          }

          if (state.alliances && state.alliances.length > 0) {
            contextBlock += `🤝 Aliansi: ${state.alliances.join(', ')}\n`
          }

          if (Object.keys(state.relationships).length > 0) {
            const rels = Object.entries(state.relationships)
              .map(([name, desc]) => `${name} → ${desc}`)
              .join(', ')
            contextBlock += `🔗 Hubungan: ${rels}\n`
          }

          contextBlock += `⚡ Aksi terakhir: ${state.last_action || '-'}\n\n`
          injectedStateCount++
        })
      }
    }

    // ── Layer 4: Sliding Window ────────────────────────────────────────

    if (previousChapters.length > 0) {
      contextBlock += `[PREVIOUS CHAPTER CONTEXT (Pacing continuity)]\n`
      // Sort and grab last 3 chapters
      const recentChapters = [...previousChapters]
        .sort((a, b) => a.chapter_number - b.chapter_number)
        .slice(-3)

      recentChapters.forEach((ch) => {
        if (ch.synopsis) {
          contextBlock += `Bab ${ch.chapter_number} ("${ch.title || 'Tanpa Judul'}"): ${ch.synopsis}\n`
        }
      })

      // Include last 500 words of the most recent chapter's prose (if available)
      const lastChapter = recentChapters[recentChapters.length - 1]
      if (lastChapter?.prose) {
        const words = lastChapter.prose.split(/\s+/)
        const last500Words = words.slice(-500).join(' ')
        contextBlock += `\n[SLIDING WINDOW — 500 kata terakhir Bab ${lastChapter.chapter_number}]\n${last500Words}\n`
      }

      contextBlock += `\n`
    }

    contextBlock += `===========================`

    return {
      contextString: contextBlock,
      activeCharacterNames: activeCharacters.map((c) => c.name),
      activeItemNames: activeItems.map((i) => i.name),
      activeRuleNames: activeRules.map((r) => r.name),
      injectedStateCount,
      ragMatchCount: 0
    }
  }

  /**
   * Async variant that augments the pruned context with semantic RAG matches
   * over chapter summaries. The base lorebook + state + sliding-window block
   * is identical to `pruneAndInject`; an extra "RELATED CHAPTER MEMORY"
   * section is appended when the RAG search finds relevant past chapters.
   */
  public async pruneAndInjectWithRag(
    project: Project,
    textToScan: string,
    allCharacters: Character[],
    allItems: Item[],
    allRules: WorldRule[],
    previousChapters: Chapter[] = [],
    characterStates: CharacterState[] = [],
    ragOptions: { topK?: number; signal?: AbortSignal; excludeChapterIds?: string[] } = {}
  ): Promise<PrunedContextResult> {
    const base = this.pruneAndInject(
      project,
      textToScan,
      allCharacters,
      allItems,
      allRules,
      previousChapters,
      characterStates
    )

    let ragMatchCount = 0
    let ragBlock = ''
    try {
      const matches = await searchSimilarChapters(
        project.id,
        textToScan,
        ragOptions.topK ?? 3,
        ragOptions.signal
      )
      const filtered = ragOptions.excludeChapterIds
        ? matches.filter((m) => !ragOptions.excludeChapterIds!.includes(m.summary.chapter_id))
        : matches
      if (filtered.length > 0) {
        ragBlock = `\n[RELATED CHAPTER MEMORY — Layer 3 RAG]\n`
        for (const { summary, similarity } of filtered) {
          ragBlock += `(similarity ${(similarity * 100).toFixed(0)}%) ${summary.summary}\n`
          if (summary.key_facts.length > 0) {
            ragBlock += `  facts: ${summary.key_facts.slice(0, 3).join(' · ')}\n`
          }
        }
        ragBlock += '\n'
        ragMatchCount = filtered.length
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      console.warn('[ContextInjector] RAG augmentation failed, returning base context:', e)
    }

    if (ragBlock) {
      // Insert the RAG block before the closing delimiter line.
      const closingDelim = `===========================`
      const augmented = base.contextString.endsWith(closingDelim)
        ? base.contextString.slice(0, -closingDelim.length) + ragBlock + closingDelim
        : base.contextString + ragBlock
      return { ...base, contextString: augmented, ragMatchCount }
    }

    return base
  }
}

export const contextInjector = new ContextInjector()
