import type { StateCreator } from 'zustand'
import type { Project, GenesisMode } from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

const DUMMY_PROJECTS: Project[] = [
  {
    id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    user_id: 'dummy-user-123',
    title: 'Istri Sah vs Selingkuhan',
    genre: 'Drama Rumah Tangga',
    genesis_mode: 'FRESH_BRAINSTORM',
    target_chapters: 200,
    word_count_target: 1500,
    prose_provider: 'gemini',
    prose_model: 'gemini-flash-latest',
    status: 'WRITING',
    narrative_constitution:
      'Kisah melodrama KBM yang penuh keputusasaan, rahasia keluarga, time-travel, dan balas dendam manis.',
    target_ending:
      'Kania menemukan timeline yang tepat. Dirga selamat, tapi Kania kehilangan semua ingatan tentang perjalanan waktunya — termasuk ingatan bahwa dia pernah mencintai Dirga.',
    theme_and_tone: 'Tegang, melankolis, penuh emosi terpendam, dramatis',
    series_hook: null,
    season_hooks: []
  },
  {
    id: 'a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d',
    user_id: 'dummy-user-123',
    title: 'CEO Arogan yang Jatuh Cinta',
    genre: 'Romance Office',
    genesis_mode: 'FRESH_BLUEPRINT',
    target_chapters: 150,
    word_count_target: 1500,
    prose_provider: 'gemini',
    prose_model: 'gemini-flash-latest',
    status: 'OUTLINING',
    narrative_constitution:
      'Romansa perkantoran kelas tinggi dengan bumbu benci jadi cinta, perebutan kekuasaan warisan, dan kesalahpahaman manis.',
    target_ending:
      'CEO mengorbankan posisinya demi menyelamatkan bisnis kecil wanita impiannya, bersatu dalam kesederhanaan yang kaya cinta.',
    theme_and_tone: 'Benci-jadi-cinta, glamor perkantoran, manis',
    series_hook: null,
    season_hooks: []
  }
]

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
  characterStates: []
}

export const projectsPart: StateCreator<
  ProjectStore,
  [],
  [],
  ProjectsPart
> = (set, get) => ({
  projects: DUMMY_PROJECTS,
  activeProject: DUMMY_PROJECTS[0],
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
    set({ activeProject })
    if (activeProject) {
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
      series_hook: null,
      season_hooks: []
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
