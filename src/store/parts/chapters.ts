import type { StateCreator } from 'zustand'
import type {
  Chapter,
  Character,
  Item,
  WorldRule,
  MysteryLayer,
  PlotThread,
  ChapterVersion
} from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database, Json } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type ChapterInsert = Database['public']['Tables']['chapters']['Insert']
type ChapterUpdate = Database['public']['Tables']['chapters']['Update']
type ChapterVersionRow = Database['public']['Tables']['chapter_versions']['Row']

const DUMMY_CHAPTERS: Chapter[] = []

function isJsonRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseChapterVersionBeats(value: Json): Chapter['beats'] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!isJsonRecord(entry)) return []

    const { id, number, direction, prose } = entry
    if (typeof id !== 'string' || typeof number !== 'number' || typeof direction !== 'string') {
      return []
    }

    return [{
      id,
      number,
      direction,
      ...(typeof prose === 'string' ? { prose } : {})
    }]
  })
}

function serializeChapterVersionBeats(beats: Chapter['beats'] = []): Json {
  return beats.map((beat): Json => ({
    id: beat.id,
    number: beat.number,
    direction: beat.direction,
    prose: beat.prose
  }))
}

function mapChapterVersionRow(row: ChapterVersionRow): ChapterVersion {
  return {
    id: row.id,
    chapter_id: row.chapter_id,
    prose: row.prose,
    word_count: row.word_count,
    change_summary: row.change_summary,
    beats: parseChapterVersionBeats(row.beats),
    created_at: row.created_at
  }
}

export interface ChaptersPart {
  chapters: Chapter[]
  loadProjectData: (projectId: string) => Promise<void>
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<void>
  addChapter: (chapter: Omit<Chapter, 'id'>) => Promise<string>
  deleteChapter: (id: string) => Promise<void>
  fetchChapterVersions: (chapterId: string) => Promise<ChapterVersion[]>
  createChapterVersion: (
    chapterId: string,
    prose: string,
    wordCount: number,
    summary: string,
    beats?: Chapter['beats']
  ) => Promise<void>
}

export const chaptersPart: StateCreator<
  ProjectStore,
  [],
  [],
  ChaptersPart
> = (set, get) => ({
  chapters: DUMMY_CHAPTERS,

  loadProjectData: async (projectId) => {
    if (!isSupabaseConfigured()) {
      set({ loading: false })
      return
    }

    set({ loading: true })
    try {
      const [
        { data: chapters },
        { data: characters },
        { data: items },
        { data: rules },
        { data: layers },
        { data: threads }
      ] = await Promise.all([
        supabase
          .from('chapters')
          .select('*')
          .eq('project_id', projectId)
          .order('chapter_number', { ascending: true }),
        supabase
          .from('characters')
          .select('*')
          .eq('project_id', projectId)
          .order('priority', { ascending: false }),
        supabase
          .from('items')
          .select('*')
          .eq('project_id', projectId)
          .order('priority', { ascending: false }),
        supabase
          .from('world_rules')
          .select('*')
          .eq('project_id', projectId)
          .order('priority', { ascending: false }),
        supabase
          .from('mystery_layers')
          .select('*')
          .eq('project_id', projectId)
          .order('layer_number', { ascending: true }),
        supabase
          .from('plot_threads')
          .select('*')
          .eq('project_id', projectId)
          .order('planted_at', { ascending: true })
      ])

      const next: Partial<ProjectStore> = {
        chapters: (chapters ?? []) as unknown as Chapter[],
        characters: (characters ?? []) as unknown as Character[],
        items: (items ?? []) as unknown as Item[],
        worldRules: (rules ?? []) as unknown as WorldRule[],
        mysteryLayers: (layers ?? []) as unknown as MysteryLayer[],
        plotThreads: (threads ?? []) as unknown as PlotThread[]
      }
      set(next)
      await Promise.all([
        get().loadCharacterStates(projectId),
        get().loadChapterSummaries(projectId)
      ])
    } catch (e) {
      console.warn('Error syncing project data from Supabase, keeping local state:', e)
    } finally {
      set({ loading: false })
    }
  },

  updateChapter: async (id, data) => {
    set((state) => ({
      chapters: state.chapters.map((ch) => (ch.id === id ? { ...ch, ...data } : ch))
    }))

    if (!isSupabaseConfigured()) return

    try {
      const { error } = await supabase
        .from('chapters')
        .update(data as ChapterUpdate)
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('Supabase updateChapter error:', e)
    }
  },

  addChapter: async (chapter) => {
    const tempId = crypto.randomUUID()
    const newChapter: Chapter = { id: tempId, ...chapter }
    set((state) => ({
      chapters: [...state.chapters, newChapter].sort(
        (a, b) => a.chapter_number - b.chapter_number
      )
    }))

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('chapters')
          .insert([chapter as unknown as ChapterInsert])
          .select()
          .single()
        if (error) throw error
        if (data) {
          const final = data as unknown as Chapter
          set((state) => ({
            chapters: state.chapters
              .map((ch) => (ch.id === tempId ? final : ch))
              .sort((a, b) => a.chapter_number - b.chapter_number)
          }))
          return final.id
        }
      }
    } catch (e) {
      console.warn('Supabase addChapter error, keeping locally:', e)
    }
    return tempId
  },

  deleteChapter: async (id) => {
    set((state) => ({
      chapters: state.chapters.filter((ch) => ch.id !== id)
    }))

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('chapters').delete().eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supabase deleteChapter error:', e)
    }
  },

  fetchChapterVersions: async (chapterId) => {
    try {
      if (!isSupabaseConfigured()) return []
      const { data, error } = await supabase
        .from('chapter_versions')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map(mapChapterVersionRow)
    } catch (e) {
      console.error('Supabase fetchChapterVersions error:', e)
      return []
    }
  },

  createChapterVersion: async (chapterId, prose, wordCount, summary, beats) => {
    try {
      if (!isSupabaseConfigured()) return
      const { error } = await supabase.from('chapter_versions').insert([{
        chapter_id: chapterId,
        prose,
        word_count: wordCount,
        change_summary: summary,
        beats: serializeChapterVersionBeats(beats)
      }])
      if (error) throw error
    } catch (e) {
      console.error('Supabase createChapterVersion error:', e)
    }
  }
})
