import type { StateCreator } from 'zustand'
import type { Project, GenesisMode } from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

const DUMMY_PROJECTS: Project[] = []

export interface ProjectsPart {
  projects: Project[]
  activeProject: Project | null
  loading: boolean
  loadProjects: () => Promise<void>
  setActiveProject: (project: Project | null) => void
  createProject: (
    title: string,
    genre: string,
    targetChapters: number,
    wordCountTarget: number,
    genesisMode: GenesisMode
  ) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearProjectState: () => void
}

const FRESH_PROJECT_RELATED_STATE: Partial<ProjectStore> = {
  chapters: [],
  characters: [],
  items: [],
  worldRules: [],
  mysteryLayers: [],
  plotThreads: [],
  characterStates: [],
  canonProposals: []
}

export const projectsPart: StateCreator<
  ProjectStore,
  [],
  [],
  ProjectsPart
> = (set, get) => ({
  projects: DUMMY_PROJECTS,
  activeProject: DUMMY_PROJECTS[0] || null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true })
    try {
      if (!isSupabaseConfigured()) {
        set({ projects: DUMMY_PROJECTS, loading: false })
        return
      }

      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        set({ projects: [], loading: false })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      set({ projects: (data ?? []) as unknown as Project[] })
    } catch (e) {
      console.error('Error fetching projects:', e)
    } finally {
      set({ loading: false })
    }
  },

  setActiveProject: (activeProject) => {
    set({ activeProject, canonProposals: [] })
    if (activeProject && isSupabaseConfigured()) {
      get().loadProjectData(activeProject.id)
    }
  },

  clearProjectState: () => {
    const reset: Partial<ProjectStore> = {
      projects: [],
      activeProject: null,
      ...FRESH_PROJECT_RELATED_STATE
    }
    set(reset)
  },

  createProject: async (title, genre, targetChapters, wordCountTarget, genesisMode) => {
    set({ loading: true })
    const newProj: Omit<Project, 'id' | 'user_id'> = {
      title,
      genre,
      target_chapters: targetChapters,
      word_count_target: wordCountTarget,
      genesis_mode: genesisMode,
      prose_provider: 'gemini',
      prose_model: 'gemini-flash-latest',
      status: 'BRAINSTORMING',
      narrative_constitution: null,
      target_ending: null,
      theme_and_tone: null,
      story_contract: {},
      series_hook: null,
      season_hooks: [],
      voice_dna_project: {}
    }

    try {
      if (isSupabaseConfigured()) {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (user) {
          const insertRow: ProjectInsert = { ...newProj, user_id: user.id } as ProjectInsert
          const { data, error } = await supabase
            .from('projects')
            .insert([insertRow])
            .select()
            .single()

          if (error) throw error
          if (data) {
            const created = data as unknown as Project
            const update: Partial<ProjectStore> = {
              projects: [created, ...get().projects],
              activeProject: created,
              ...FRESH_PROJECT_RELATED_STATE,
              loading: false
            }
            set(update)
            return created
          }
        }
      }
    } catch (e) {
      console.warn('Error saving to Supabase, creating local-only project:', e)
    }

    const localId = crypto.randomUUID()
    const createdLocal: Project = {
      id: localId,
      user_id: 'local-user',
      ...newProj
    }
    const localUpdate: Partial<ProjectStore> = {
      projects: [createdLocal, ...get().projects],
      activeProject: createdLocal,
      ...FRESH_PROJECT_RELATED_STATE
    }
    set(localUpdate)
    set({ loading: false })
    return createdLocal
  },

  updateProject: async (id, data) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      activeProject:
        state.activeProject?.id === id
          ? { ...state.activeProject, ...data }
          : state.activeProject
    }))

    try {
      if (!isSupabaseConfigured()) return
      const { error } = await supabase
        .from('projects')
        .update(data as ProjectUpdate)
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('Supabase updateProject error (staying offline):', e)
    }
  },

  deleteProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject
    }))

    try {
      if (!isSupabaseConfigured()) return
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('Supabase deleteProject error:', e)
    }
  }
})
