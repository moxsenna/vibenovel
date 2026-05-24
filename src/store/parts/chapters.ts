import type { StateCreator } from 'zustand'
import type {
  Chapter,
  Character,
  Item,
  WorldRule,
  MysteryLayer,
  PlotThread
} from '../../types/project'
import type { ProjectStore } from '../useProjectStore'
import type { Database } from '../../lib/database.types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type ChapterInsert = Database['public']['Tables']['chapters']['Insert']
type ChapterUpdate = Database['public']['Tables']['chapters']['Update']

const DUMMY_CHARACTERS: Character[] = [
  {
    id: 'c1',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Kania Savitri',
    role: 'PROTAGONIST',
    description:
      'Keras kepala tapi rapuh di dalam. Dia menderita dalam keheningan demi menyelamatkan Dirga.',
    voice_dna: { tone: 'lembut tapi tegas', betawi: true },
    activation_keys: ['Kania', 'Savitri'],
    priority: 10,
    is_locked: false,
    genesis: 'BRAINSTORMED'
  },
  {
    id: 'c2',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Ardan Wijaya',
    role: 'ANTAGONIST',
    description: 'Ambisius, manipulatif, tampan, kaya raya, menghalalkan segala cara.',
    voice_dna: { tone: 'dingin, berwibawa, tajam' },
    activation_keys: ['Ardan', 'Wijaya'],
    priority: 8,
    is_locked: false,
    genesis: 'BRAINSTORMED'
  },
  {
    id: 'c3',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Dirga Pratama',
    role: 'SUPPORTING',
    description: 'Tulus, pekerja keras, sabar, mencintai Kania sepenuh jiwanya.',
    voice_dna: { tone: 'hangat, rendah, penuh cinta' },
    activation_keys: ['Dirga', 'Pratama'],
    priority: 9,
    is_locked: false,
    genesis: 'BRAINSTORMED'
  }
]

const DUMMY_ITEMS: Item[] = [
  {
    id: 'i1',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Jam Saku Perak',
    category: 'MAGICAL',
    description: 'Jam saku perak tua berdenyut milik ayah Kania, pemicu time-travel.',
    significance: 'Alat time travel utama Kania untuk memutar waktu.',
    activation_keys: ['jam saku', 'saku perak'],
    current_owner: 'Kania Savitri',
    priority: 10,
    genesis: 'BRAINSTORMED'
  },
  {
    id: 'i2',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Cincin Berlian',
    category: 'JEWELRY',
    description: 'Cincin murah yang dibeli Dirga setelah menabung berbulan-bulan.',
    significance: 'Simbol lamaran gagal Dirga ke Kania di awal cerita.',
    activation_keys: ['cincin', 'lamaran'],
    current_owner: 'Dirga Pratama',
    priority: 9,
    genesis: 'BRAINSTORMED'
  }
]

const DUMMY_CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    chapter_number: 51,
    title: 'Pasar Malam yang Berubah',
    status: 'OUTLINE_ONLY',
    synopsis:
      'Kania menyusuri pasar malam mencari petunjuk tentang masa lalu Dirga. Di tengah keramaian, ia tak sengaja bertabrakan dengan seorang pria tua yang memegang jam saku persis seperti milik ayahnya.',
    key_events: [
      'Kania mencari petunjuk',
      'Bertabrakan dengan Pria Tua',
      'Menemukan jam saku serupa'
    ],
    active_characters: ['Kania Savitri', 'Pria Tua'],
    active_items: ['Jam Saku Perak'],
    location: 'Pasar Malam, Jakarta Selatan',
    time_in_story: 'Sabtu malam, 10 tahun lalu',
    emotional_tone: 'TENSION',
    cliffhanger_type: 'REVELATION',
    cliffhanger_setup: 'Pria tua itu menghilang namun meninggalkan jam saku identik.',
    dopamine_beat: false,
    false_resolution: false,
    paywall_advice: 'FREE',
    arc_position: { season: 2, subArc: 'Pencarian Jam Saku' },
    open_threads: ['Siapa Pria Tua itu?'],
    resolved_threads: [],
    foreshadowing: ['Denyut jam saku memicu ingatan baru'],
    chapter_end_state: { Kania: { location: 'Tengah pasar malam', emotion: 'shock' } },
    do_not_include: ['Ardan'],
    must_connect_to: 'Bab 50',
    filler_risk: 'low',
    prose: null,
    word_count: 0,
    beats: [
      {
        id: 'b1',
        number: 1,
        direction:
          'Kania menyusuri ramainya pasar malam, merasa asing di timeline masa lalu ini.'
      },
      {
        id: 'b2',
        number: 2,
        direction: 'Dia melihat pedagang arum manis dan mainan kayu, teringat janjinya dengan Dirga.'
      },
      {
        id: 'b3',
        number: 3,
        direction: 'Seseorang dengan jubah lusuh menabraknya keras. Itu pria tua bermata sendu.'
      },
      {
        id: 'b4',
        number: 4,
        direction:
          'Pria itu pergi cepat, tapi benda logam jatuh berdenting di dekat kaki Kania. Jam saku perak.'
      }
    ],
    outline_source: 'GENERATED',
    prose_source: 'GENERATED',
    is_locked: false
  },
  {
    id: 'ch2',
    project_id: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    chapter_number: 52,
    title: 'Jam Saku Berdenyut',
    status: 'OUTLINE_ONLY',
    synopsis:
      'Pria tua itu menghilang di kerumunan, meninggalkan jam saku yang jatuh. Saat Kania menyentuhnya, jam itu berdenyut aneh, memicu sekelebat ingatan yang bukan miliknya.',
    key_events: [
      'Pria tua menghilang',
      'Kania memegang jam saku baru',
      'Merasakan denyut ingatan asing'
    ],
    active_characters: ['Kania Savitri'],
    active_items: ['Jam Saku Perak'],
    location: 'Gang Belakang Pasar Malam',
    time_in_story: 'Sabtu malam, beberapa menit kemudian',
    emotional_tone: 'MYSTERY',
    cliffhanger_type: 'COUNTDOWN',
    cliffhanger_setup: 'Jam saku berdetik berlawanan arah.',
    dopamine_beat: true,
    false_resolution: false,
    paywall_advice: 'FREE',
    arc_position: { season: 2, subArc: 'Pencarian Jam Saku' },
    open_threads: ['Darimana ingatan asing itu berasal?'],
    resolved_threads: [],
    foreshadowing: [],
    chapter_end_state: { Kania: { location: 'Gang sepi', emotion: 'cemas' } },
    do_not_include: [],
    must_connect_to: 'Bab 51',
    filler_risk: 'low',
    prose: null,
    word_count: 0,
    beats: [
      { id: 'b5', number: 1, direction: 'Kania mengambil jam saku perak tersebut dari tanah.' },
      {
        id: 'b6',
        number: 2,
        direction: 'Ketika menyentuhnya, getaran listrik hangat menjalar ke dadanya.'
      },
      {
        id: 'b7',
        number: 3,
        direction:
          'Sekelebat bayangan Dirga berdarah-darah di sebuah kecelakaan mobil muncul di pikirannya.'
      },
      {
        id: 'b8',
        number: 4,
        direction: 'Dia menatap jam itu, jarum detiknya bergerak mundur dengan cepat.'
      }
    ],
    outline_source: 'GENERATED',
    prose_source: 'GENERATED',
    is_locked: false
  }
]

export interface ChaptersPart {
  chapters: Chapter[]
  loadProjectData: (projectId: string) => Promise<void>
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<void>
  addChapter: (chapter: Omit<Chapter, 'id'>) => Promise<string>
  deleteChapter: (id: string) => Promise<void>
}

export const chaptersPart: StateCreator<
  ProjectStore,
  [],
  [],
  ChaptersPart
> = (set, get) => ({
  chapters: DUMMY_CHAPTERS,

  loadProjectData: async (projectId) => {
    if (projectId === 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') {
      const dummyState: Partial<ProjectStore> = {
        chapters: DUMMY_CHAPTERS,
        characters: DUMMY_CHARACTERS,
        items: DUMMY_ITEMS,
        worldRules: [],
        mysteryLayers: [
          {
            id: 'm1',
            project_id: projectId,
            layer_number: 1,
            central_question: 'Kenapa Kania menolak lamaran Dirga di awal?',
            revealed_at_chapter: 15,
            answer:
              'Karena Kania telah memutar waktu dan melihat Dirga hancur berkeping-keping jika bersamanya.',
            opens_next_question: 'Bagaimana Kania bisa melihat masa depan?',
            breadcrumbs: [
              { chapter: 3, hint: 'Kania mencengkeram jam saku tua ayahnya' },
              { chapter: 8, hint: 'Kania menggumamkan tanggal kecelakaan yang belum terjadi' }
            ],
            status: 'REVEALED'
          },
          {
            id: 'm2',
            project_id: projectId,
            layer_number: 2,
            central_question: 'Bagaimana Kania memutar waktu?',
            revealed_at_chapter: 52,
            answer:
              'Menggunakan jam saku perak berdenyut pemberian pria misterius di pasar malam.',
            opens_next_question: 'Siapa sebenarnya pria tua misterius itu?',
            breadcrumbs: [
              { chapter: 51, hint: 'Pria tua lusuh menabrak Kania dan menjatuhkan jam saku' }
            ],
            status: 'ACTIVE'
          }
        ],
        plotThreads: [
          {
            id: 'pt1',
            project_id: projectId,
            title: 'Misteri Pria Tua Pasar Malam',
            planted_at: 51,
            status: 'ACTIVE',
            resolved_at: null,
            urgency: 'HIGH',
            related_characters: ['c1'],
            related_items: ['i1'],
            notes: 'Pria tua misterius yang menjatuhkan jam saku perak di pasar malam.'
          }
        ]
      }
      set(dummyState)
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
      await get().loadCharacterStates(projectId)
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
  }
})
