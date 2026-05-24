import type { StateCreator } from 'zustand'
import type {
  Character,
  CharacterState,
  Item,
  WorldRule,
  MysteryLayer,
  PlotThread,
  ChapterSummary
} from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { findThreadByTitle } from '../../services/thread-tracker'

type CharacterInsert = Database['public']['Tables']['characters']['Insert']
type CharacterUpdate = Database['public']['Tables']['characters']['Update']
type ItemInsert = Database['public']['Tables']['items']['Insert']
type ItemUpdate = Database['public']['Tables']['items']['Update']
type WorldRuleInsert = Database['public']['Tables']['world_rules']['Insert']
type WorldRuleUpdate = Database['public']['Tables']['world_rules']['Update']
type CharacterStateInsert = Database['public']['Tables']['character_states']['Insert']
type MysteryLayerInsert = Database['public']['Tables']['mystery_layers']['Insert']
type MysteryLayerUpdate = Database['public']['Tables']['mystery_layers']['Update']
type PlotThreadInsert = Database['public']['Tables']['plot_threads']['Insert']
type PlotThreadUpdate = Database['public']['Tables']['plot_threads']['Update']
type ChapterSummaryInsert = Database['public']['Tables']['chapter_summaries']['Insert']

export interface ExtractedLorePayload {
  new_characters?: unknown[]
  new_items?: unknown[]
  new_rules?: unknown[]
}

export interface LorebookPart {
  characters: Character[]
  characterStates: CharacterState[]
  items: Item[]
  worldRules: WorldRule[]
  mysteryLayers: MysteryLayer[]
  plotThreads: PlotThread[]

  // Character CRUD
  addCharacter: (char: Omit<Character, 'id'>) => Promise<void>
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>

  // Item CRUD
  addItem: (item: Omit<Item, 'id'>) => Promise<void>
  updateItem: (id: string, data: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  // WorldRule CRUD
  addWorldRule: (rule: Omit<WorldRule, 'id'>) => Promise<void>
  updateWorldRule: (id: string, data: Partial<WorldRule>) => Promise<void>
  deleteWorldRule: (id: string) => void

  // Mystery Layer CRUD (Sprint 5)
  addMysteryLayer: (layer: Omit<MysteryLayer, 'id'>) => Promise<void>
  updateMysteryLayer: (id: string, data: Partial<MysteryLayer>) => Promise<void>
  deleteMysteryLayer: (id: string) => Promise<void>

  // Plot Thread CRUD (Sprint 7)
  addPlotThread: (thread: Omit<PlotThread, 'id'>) => Promise<string>
  updatePlotThread: (id: string, data: Partial<PlotThread>) => Promise<void>
  deletePlotThread: (id: string) => Promise<void>
  /**
   * Apply a thread tracker analysis result to the lorebook in one
   * transaction-ish batch (optimistic local first, then sync each row).
   */
  applyThreadAnalysis: (
    chapterNumber: number,
    projectId: string,
    result: import('../../services/thread-tracker').ThreadAnalysisResult
  ) => Promise<void>

  // Chapter Summary CRUD (Sprint 7 RAG)
  chapterSummaries: ChapterSummary[]
  loadChapterSummaries: (projectId: string) => Promise<void>
  upsertChapterSummary: (
    payload: Omit<ChapterSummary, 'id' | 'created_at'>
  ) => Promise<void>

  extractedLore: ExtractedLorePayload | null
  setExtractedLore: (lore: ExtractedLorePayload | null) => void
  clearExtractedLore: () => void

  // Character States (Layer 2)
  loadCharacterStates: (projectId: string) => Promise<void>
  upsertCharacterStates: (chapterNumber: number, states: CharacterState[]) => Promise<void>
  getLatestStatesForChapter: (chapterNumber: number) => CharacterState[]
}

export const lorebookPart: StateCreator<
  ProjectStore,
  [],
  [],
  LorebookPart
> = (set, get) => ({
  characters: [],
  characterStates: [],
  items: [],
  worldRules: [],
  mysteryLayers: [],
  plotThreads: [],
  chapterSummaries: [],

  addCharacter: async (char) => {
    const tempId = crypto.randomUUID()
    const newChar: Character = { id: tempId, ...char }
    set((state) => ({ characters: [...state.characters, newChar] }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('characters')
          .insert([char as CharacterInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as Character
          set((state) => ({
            characters: state.characters.map((c) => (c.id === tempId ? final : c))
          }))
        }
      }
    } catch (e) {
      console.warn('Supabase addCharacter error, keeping locally:', e)
    }
  },

  updateCharacter: async (id, data) => {
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...data } : c))
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('characters')
          .update(data as CharacterUpdate)
          .eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase updateCharacter error:', e)
    }
  },

  deleteCharacter: async (id) => {
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id)
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('characters').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deleteCharacter error:', e)
    }
  },

  addItem: async (item) => {
    const tempId = crypto.randomUUID()
    const newItem: Item = { id: tempId, ...item }
    set((state) => ({ items: [...state.items, newItem] }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('items')
          .insert([item as ItemInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as Item
          set((state) => ({
            items: state.items.map((i) => (i.id === tempId ? final : i))
          }))
        }
      }
    } catch (e) {
      console.warn('Supabase addItem error, keeping locally:', e)
    }
  },

  updateItem: async (id, data) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...data } : i))
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('items')
          .update(data as ItemUpdate)
          .eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase updateItem error:', e)
    }
  },

  deleteItem: async (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id)
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deleteItem error:', e)
    }
  },

  addWorldRule: async (rule) => {
    const tempId = crypto.randomUUID()
    const newRule: WorldRule = { id: tempId, ...rule }
    set((state) => ({ worldRules: [...state.worldRules, newRule] }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('world_rules')
          .insert([rule as WorldRuleInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as WorldRule
          set((state) => ({
            worldRules: state.worldRules.map((r) => (r.id === tempId ? final : r))
          }))
        }
      }
    } catch (e) {
      console.warn('Supabase addWorldRule error, keeping locally:', e)
    }
  },

  updateWorldRule: async (id, data) => {
    set((state) => ({
      worldRules: state.worldRules.map((r) => (r.id === id ? { ...r, ...data } : r))
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('world_rules')
          .update(data as WorldRuleUpdate)
          .eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase updateWorldRule error:', e)
    }
  },

  deleteWorldRule: async (id) => {
    set((state) => ({
      worldRules: state.worldRules.filter((r) => r.id !== id)
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('world_rules').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deleteWorldRule error:', e)
    }
  },

  // ── Mystery Layer CRUD ──────────────────────────────────────────────
  addMysteryLayer: async (layer) => {
    const tempId = crypto.randomUUID()
    const newLayer: MysteryLayer = { id: tempId, ...layer }
    set((state) => ({ mysteryLayers: [...state.mysteryLayers, newLayer] }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('mystery_layers')
          .insert([layer as MysteryLayerInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as MysteryLayer
          set((state) => ({
            mysteryLayers: state.mysteryLayers.map((l) => (l.id === tempId ? final : l))
          }))
        }
      }
    } catch (e) {
      console.warn('Supabase addMysteryLayer error, keeping locally:', e)
    }
  },

  updateMysteryLayer: async (id, data) => {
    set((state) => ({
      mysteryLayers: state.mysteryLayers.map((l) => (l.id === id ? { ...l, ...data } : l))
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('mystery_layers')
          .update(data as MysteryLayerUpdate)
          .eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase updateMysteryLayer error:', e)
    }
  },

  deleteMysteryLayer: async (id) => {
    set((state) => ({
      mysteryLayers: state.mysteryLayers.filter((l) => l.id !== id)
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('mystery_layers').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deleteMysteryLayer error:', e)
    }
  },

  // ── Plot Thread CRUD (Sprint 7) ─────────────────────────────────────
  addPlotThread: async (thread) => {
    const tempId = crypto.randomUUID()
    const newThread: PlotThread = { id: tempId, ...thread }
    set((state) => ({ plotThreads: [...state.plotThreads, newThread] }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('plot_threads')
          .insert([thread as PlotThreadInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as PlotThread
          set((state) => ({
            plotThreads: state.plotThreads.map((t) => (t.id === tempId ? final : t))
          }))
          return final.id
        }
      }
    } catch (e) {
      console.warn('Supabase addPlotThread error, keeping locally:', e)
    }
    return tempId
  },

  updatePlotThread: async (id, data) => {
    set((state) => ({
      plotThreads: state.plotThreads.map((t) => (t.id === id ? { ...t, ...data } : t))
    }))
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('plot_threads')
          .update(data as PlotThreadUpdate)
          .eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase updatePlotThread error:', e)
    }
  },

  deletePlotThread: async (id) => {
    set((state) => ({
      plotThreads: state.plotThreads.filter((t) => t.id !== id)
    }))
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('plot_threads').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deletePlotThread error:', e)
    }
  },

  applyThreadAnalysis: async (chapterNumber, projectId, result) => {
    const existing = get().plotThreads

    // 1. Mark resolved threads
    for (const title of result.resolvedThreadTitles) {
      const match = findThreadByTitle(title, existing)
      if (match && match.status !== 'RESOLVED') {
        await get().updatePlotThread(match.id, {
          status: 'RESOLVED',
          resolved_at: chapterNumber
        })
      }
    }

    // 2. Update note-only changes for active threads
    for (const upd of result.updatedThreadTitles) {
      const match = findThreadByTitle(upd.title, get().plotThreads)
      if (match && match.status !== 'RESOLVED') {
        const mergedNotes = match.notes
          ? `${match.notes}\n[Bab ${chapterNumber}] ${upd.notes}`
          : upd.notes
        await get().updatePlotThread(match.id, {
          status: 'ACTIVE',
          notes: mergedNotes
        })
      }
    }

    // 3. Insert new threads
    for (const draft of result.newThreads) {
      // Skip duplicates that look like an existing thread.
      if (findThreadByTitle(draft.title, get().plotThreads)) continue
      await get().addPlotThread({
        project_id: projectId,
        title: draft.title,
        planted_at: chapterNumber,
        status: 'PLANTED',
        resolved_at: null,
        urgency: draft.urgency,
        related_characters: draft.relatedCharacters,
        related_items: draft.relatedItems,
        notes: draft.notes
      })
    }
  },

  // ── Chapter Summaries (Sprint 7 RAG) ────────────────────────────────
  loadChapterSummaries: async (projectId) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('chapter_summaries')
          .select('*')
          .eq('project_id', projectId)
        if (error) throw error
        if (data) {
          set({ chapterSummaries: data as unknown as ChapterSummary[] })
        }
      }
    } catch (e) {
      console.error('Failed to load chapter summaries:', e)
    }
  },

  upsertChapterSummary: async (payload) => {
    // Optimistic local update — replace any existing summary for the same
    // chapter (1:1 relation) before persisting to Supabase.
    const optimistic: ChapterSummary = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...payload
    }
    set((state) => {
      const filtered = state.chapterSummaries.filter(
        (s) => s.chapter_id !== payload.chapter_id
      )
      return { chapterSummaries: [...filtered, optimistic] }
    })

    try {
      if (isSupabaseConfigured()) {
        // Delete any existing row for this chapter (idempotent insert).
        await supabase
          .from('chapter_summaries')
          .delete()
          .eq('chapter_id', payload.chapter_id)
        const { data, error } = await supabase
          .from('chapter_summaries')
          .insert([payload as ChapterSummaryInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as ChapterSummary
          set((state) => ({
            chapterSummaries: state.chapterSummaries.map((s) =>
              s.id === optimistic.id ? final : s
            )
          }))
        }
      }
    } catch (e) {
      console.warn('Supabase upsertChapterSummary error, keeping locally:', e)
    }
  },

  extractedLore: null,
  setExtractedLore: (lore) => set({ extractedLore: lore }),
  clearExtractedLore: () => set({ extractedLore: null }),

  loadCharacterStates: async (projectId) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('character_states')
          .select('*')
          .eq('project_id', projectId)
          .order('chapter_number', { ascending: true })
        if (error) throw error
        if (data) {
          set({ characterStates: data as unknown as CharacterState[] })
        }
      }
    } catch (e) {
      console.error('Failed to load character states:', e)
    }
  },

  upsertCharacterStates: async (chapterNumber, states) => {
    set((prevState) => {
      const filtered = prevState.characterStates.filter(
        (s) => s.chapter_number !== chapterNumber
      )
      return { characterStates: [...filtered, ...states] }
    })

    try {
      if (isSupabaseConfigured()) {
        const { activeProject } = get()
        if (activeProject) {
          await supabase
            .from('character_states')
            .delete()
            .eq('project_id', activeProject.id)
            .eq('chapter_number', chapterNumber)

          const rows: CharacterStateInsert[] = states.map(
            (s) =>
              ({
                ...s,
                project_id: activeProject.id
              }) as CharacterStateInsert
          )
          const { error } = await supabase.from('character_states').insert(rows)
          if (error) throw error
        }
      }
    } catch (e) {
      console.error('Supabase upsertCharacterStates error:', e)
    }
  },

  getLatestStatesForChapter: (chapterNumber) => {
    const { characterStates } = get()

    const previousStates = characterStates.filter(
      (s) => s.chapter_number < chapterNumber
    )

    const latestMap = new Map<string, CharacterState>()
    for (const state of previousStates) {
      const existing = latestMap.get(state.character_id)
      if (!existing || state.chapter_number > existing.chapter_number) {
        latestMap.set(state.character_id, state)
      }
    }

    return Array.from(latestMap.values())
  }
})
