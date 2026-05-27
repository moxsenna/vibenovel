import type { Chapter, Project } from '../types/project'

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    user_id: 'user-1',
    title: 'Test Novel',
    genre: 'Drama',
    genesis_mode: 'FRESH_BRAINSTORM',
    target_chapters: 100,
    word_count_target: 1500,
    prose_provider: 'gemini',
    prose_model: 'gemini-flash-latest',
    status: 'WRITING',
    narrative_constitution: null,
    target_ending: null,
    theme_and_tone: null,
    story_contract: {},
    series_hook: null,
    season_hooks: [],
    voice_dna_project: {},
    ...overrides
  }
}

export function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'chapter-1',
    project_id: 'project-1',
    chapter_number: 1,
    title: 'Bab 1',
    status: 'OUTLINE_ONLY',
    synopsis: 'A test chapter.',
    key_events: ['Beat one', 'Beat two'],
    active_characters: [],
    active_items: [],
    location: null,
    time_in_story: null,
    emotional_tone: null,
    cliffhanger_type: null,
    cliffhanger_setup: null,
    dopamine_beat: false,
    false_resolution: false,
    paywall_advice: null,
    arc_position: null,
    open_threads: [],
    resolved_threads: [],
    foreshadowing: [],
    chapter_end_state: null,
    do_not_include: [],
    must_connect_to: null,
    filler_risk: null,
    prose: null,
    word_count: 0,
    beats: [],
    qa_logs: [],
    outline_source: 'GENERATED',
    prose_source: 'GENERATED',
    is_locked: false,
    ...overrides
  }
}
