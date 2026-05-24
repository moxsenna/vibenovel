import type { StateCreator } from 'zustand'
import type {
  Character,
  CharacterState,
  Item,
  WorldRule,
  MysteryLayer,
  PlotThread
} from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type CharacterInsert = Database['public']['Tables']['characters']['Insert']
type CharacterUpdate = Database['public']['Tables']['characters']['Update']
type ItemInsert = Database['public']['Tables']['items']['Insert']
type ItemUpdate = Database['public']['Tables']['items']['Update']
type WorldRuleInsert = Database['public']['Tables']['world_rules']['Insert']
type WorldRuleUpdate = Database['public']['Tables']['world_rules']['Update']
type CharacterStateInsert = Database['public']['Tables']['character_states']['Insert']
type MysteryLayerInsert = Database['public']['Tables']['mystery_layers']['Insert']
type MysteryLayerUpdate = Database['public']['Tables']['mystery_layers']['Update']

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
