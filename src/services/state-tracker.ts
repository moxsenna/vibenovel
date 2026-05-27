import type { Project, Chapter, Character, CharacterState } from '../types/project'
import { geminiPool } from './ai/gemini-pool'
import { buildStateSnapshotSystemInstruction, buildStateSnapshotUserPrompt } from '../prompts/state-snapshot'

/**
 * State Tracker Service
 * 
 * Automatically extracts character states from completed chapter prose
 * using Gemini Core (free). This forms Layer 2 of the 4-Layer Memory System.
 */
class StateTracker {
  /**
   * Generate a state snapshot for all active characters in a completed chapter.
   * Uses Gemini Core (free) — this is a non-prose operation.
   */
  public async generateStateSnapshot(
    _project: Project,
    chapter: Chapter,
    allCharacters: Character[],
    previousStatesContext?: string
  ): Promise<CharacterState[]> {
    if (!chapter.prose || chapter.prose.trim().length < 50) {
      throw new Error('Prosa bab terlalu pendek atau kosong untuk mengekstrak state.')
    }

    // Filter to only active characters in this chapter
    const activeCharacters = allCharacters.filter(c =>
      chapter.active_characters?.includes(c.name) || c.role === 'PROTAGONIST'
    )

    if (activeCharacters.length === 0) {
      console.warn('Tidak ada karakter aktif di bab ini.')
      return []
    }

    const systemInstruction = buildStateSnapshotSystemInstruction()
    const userPrompt = buildStateSnapshotUserPrompt(
      chapter.chapter_number,
      chapter.title || `Bab ${chapter.chapter_number}`,
      chapter.prose,
      activeCharacters,
      previousStatesContext
    )

    // Retry logic (up to 2 retries for JSON parse failures)
    let lastError: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await geminiPool.generateContent(
          userPrompt,
          systemInstruction,
          false,
          'gemini-flash-latest'
        )

        const parsed = this.parseStateResponse(response, chapter, activeCharacters)
        return parsed
      } catch (error) {
        console.error(`State extraction attempt ${attempt + 1} failed:`, error)
        lastError = error
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Gagal mengekstrak state karakter setelah 3 percobaan.')
  }

  /**
   * Parse the AI response JSON into CharacterState array.
   */
  private parseStateResponse(
    rawResponse: string,
    chapter: Chapter,
    activeCharacters: Character[]
  ): CharacterState[] {
    // Clean up potential markdown formatting
    let cleanJson = rawResponse.trim()
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    const parsed = JSON.parse(cleanJson)
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not a JSON array')
    }

    return parsed
      .map((stateRaw: Record<string, unknown>): CharacterState | null => {
        const str = (k: string): string => (typeof stateRaw[k] === 'string' ? (stateRaw[k] as string) : '')
        const arr = (k: string): string[] => (Array.isArray(stateRaw[k]) ? (stateRaw[k] as string[]) : [])

        const matchedChar = activeCharacters.find(
          (c) => c.name.toLowerCase() === str('character_name').toLowerCase()
        )
        if (!matchedChar) return null

        return {
          id: crypto.randomUUID(),
          character_id: matchedChar.id,
          chapter_number: chapter.chapter_number,
          location: str('location'),
          physical_condition: str('physical_condition'),
          emotional_state: str('emotional_state'),
          inventory: arr('inventory'),
          relationships: (stateRaw.relationships as Record<string, unknown>) || {},
          last_action: str('last_action'),
          knowledge_state: arr('knowledge_state'),
          active_goal: str('active_goal'),
          secrets: arr('secrets'),
          appearance_notes: str('appearance_notes'),
          alliances: arr('alliances'),
          source: 'AUTO_GENERATED' as const
        } satisfies CharacterState
      })
      .filter((state): state is CharacterState => Boolean(state))
  }

  /**
   * Format existing character states into a context string for cumulative injection.
   */
  public formatStatesForContext(states: CharacterState[], characters: Character[]): string {
    if (states.length === 0) return ''

    return states.map(state => {
      const charName = characters.find(c => c.id === state.character_id)?.name || state.character_id
      const lines = [
        `== ${charName} (setelah Bab ${state.chapter_number}) ==`,
        `📍 Lokasi: ${state.location || 'Tidak diketahui'}`,
        `💊 Kondisi: ${state.physical_condition || 'Normal'}`,
        `🎭 Emosi: ${state.emotional_state || 'Netral'}`,
      ]

      if (state.inventory.length > 0) {
        lines.push(`🎒 Inventaris: ${state.inventory.join(', ')}`)
      }

      if (state.knowledge_state.length > 0) {
        lines.push(`🧠 Tahu: ${state.knowledge_state.join('; ')}`)
      }

      if (state.active_goal) {
        lines.push(`🎯 Tujuan: ${state.active_goal}`)
      }

      if (state.secrets.length > 0) {
        lines.push(`🤫 Rahasia: ${state.secrets.join('; ')}`)
      }

      if (state.appearance_notes) {
        lines.push(`👁 Penampilan: ${state.appearance_notes}`)
      }

      if (state.alliances.length > 0) {
        lines.push(`🤝 Aliansi: ${state.alliances.join(', ')}`)
      }

      if (Object.keys(state.relationships).length > 0) {
        const rels = Object.entries(state.relationships)
          .map(([name, desc]) => `${name} → ${desc}`)
          .join(', ')
        lines.push(`🔗 Hubungan: ${rels}`)
      }

      lines.push(`⚡ Aksi terakhir: ${state.last_action || '-'}`)

      return lines.join('\n')
    }).join('\n\n')
  }
}

export const stateTracker = new StateTracker()
