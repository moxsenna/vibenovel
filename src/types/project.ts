export type GenesisMode = 'FRESH_BRAINSTORM' | 'FRESH_BLUEPRINT' | 'IMPORTED'
export type ProjectStatus = 'BRAINSTORMING' | 'OUTLINING' | 'WRITING' | 'PAUSED' | 'COMPLETED'
export type CharacterRole = 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
export type CharacterGenesis = 'BRAINSTORMED' | 'IMPORTED' | 'AUTO_EXTRACTED' | 'MANUAL'
export type ItemCategory = 'WEAPON' | 'MAGICAL' | 'DOCUMENT' | 'JEWELRY' | 'VEHICLE' | 'KEY_ITEM' | 'OTHER'
export type LoreCategory = 'MAGIC_SYSTEM' | 'SOCIAL_RULE' | 'GEOGRAPHY' | 'TECHNOLOGY' | 'OTHER'

export interface Project {
  id: string
  user_id: string
  title: string
  genre: string
  genesis_mode: GenesisMode
  target_chapters: number
  word_count_target: number
  word_count_min?: number
  word_count_max?: number
  prose_provider: 'gemini' | 'openrouter'
  prose_model: string
  status: ProjectStatus
  narrative_constitution: string | null
  target_ending: string | null
  theme_and_tone: string | null
  // Sprint 5 — Hook Chain (top-level project hooks)
  series_hook: string | null
  season_hooks: string[]
  // Sprint 9 — Mimicry Engine: project-wide voice DNA jsonb (extracted from
  // a writing sample provided by the user). Optional/nullable for projects
  // created before the v2 schema migration.
  voice_dna_project?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Character {
  id: string
  project_id: string
  name: string
  role: CharacterRole
  description: string
  voice_dna: Record<string, unknown>
  activation_keys: string[]
  priority: number
  is_locked: boolean
  genesis: CharacterGenesis
}

export interface Item {
  id: string
  project_id: string
  name: string
  category: ItemCategory
  description: string
  significance: string
  activation_keys: string[]
  current_owner: string
  priority: number
  genesis: CharacterGenesis
}

export interface WorldRule {
  id: string
  project_id: string
  category: LoreCategory
  name: string
  description: string
  priority: number
  activation_keys: string[]
  genesis: CharacterGenesis
}

export interface CharacterState {
  id: string
  character_id: string
  chapter_number: number

  // Core state
  location: string
  physical_condition: string
  emotional_state: string
  inventory: string[]
  relationships: Record<string, unknown>
  last_action: string

  // Anti-plot-hole fields (wajib)
  knowledge_state: string[]   // Apa yang karakter ini TAHU di titik cerita ini
  active_goal: string         // Apa yang sedang dia kejar SEKARANG
  secrets: string[]           // Apa yang dia sembunyikan dari karakter lain

  // Long-serial polish (opsional)
  appearance_notes: string    // Perubahan fisik: luka, potongan rambut, penyamaran
  alliances: string[]         // Sekutu/musuh AKTIF saat ini

  source: 'AUTO_GENERATED' | 'MANUAL_EDIT' | 'IMPORTED'
}

export interface Season {
  id: string
  project_id: string
  season_number: number
  title: string
  premise: string
  target_goal: string
  start_chapter: number
  end_chapter: number
}

export interface SubArc {
  id: string
  season_id: string
  title: string
  start_chapter: number
  end_chapter: number
  goal: string
  mini_climax: string
}

export interface BeatOutline {
  id: string
  number: number
  direction: string
  prose?: string
}

export interface QaLog {
  id: string
  type: 'PLOT_HOLE' | 'EMOTION_FLAT' | 'CHEKHOVS_GUN' | 'FILLER'
  severity: 'WARNING' | 'CRITICAL'
  message: string
  suggestion: string
}

export interface Chapter {
  id: string
  project_id: string
  chapter_number: number
  title: string
  status: 'OUTLINE_ONLY' | 'GENERATING' | 'DRAFT' | 'FINAL' | 'IMPORTED'
  
  // Outline
  synopsis: string | null
  key_events: string[]
  active_characters: string[]
  active_items: string[]
  location: string | null
  time_in_story: string | null
  emotional_tone: string | null
  cliffhanger_type: string | null
  cliffhanger_setup: string | null
  dopamine_beat: boolean
  // Sprint 5 — False Resolution flag (KBM Retention Engine)
  false_resolution: boolean
  paywall_advice: string | null
  arc_position: Record<string, unknown> | null
  open_threads: string[]
  resolved_threads: string[]
  foreshadowing: string[]
  chapter_end_state: Record<string, unknown> | null
  do_not_include: string[]
  must_connect_to: string | null
  filler_risk: string | null
  
  // Prose
  prose: string | null
  word_count: number
  beats: BeatOutline[]
  
  // QA Logs
  qa_logs?: QaLog[]
  
  // Metadata
  outline_source: 'GENERATED' | 'MANUAL' | 'IMPORTED'
  prose_source: 'GENERATED' | 'MANUAL_WRITE' | 'IMPORTED' | 'MIXED'
  is_locked: boolean
  created_at?: string
  updated_at?: string
}

export interface PlotThread {
  id: string
  project_id: string
  title: string
  planted_at: number
  status: 'PLANTED' | 'ACTIVE' | 'RESOLVED' | 'ABANDONED'
  resolved_at: number | null
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  related_characters: string[]
  related_items: string[]
  notes: string
}

export interface MysteryLayer {
  id: string
  project_id: string
  layer_number: number
  central_question: string
  revealed_at_chapter: number | null
  answer: string | null
  opens_next_question: string | null
  breadcrumbs: { chapter: number; hint: string }[]
  status: 'ACTIVE' | 'REVEALED' | 'PLANNED'
  season_id?: string | null
}

/**
 * Sprint 7 — RAG-backed chapter summary.
 * Embedding is a 768-dim vector (Gemini `text-embedding-004`) stored in
 * pgvector. `key_facts` is a JSONB array of factual bullet points used as
 * a keyword-search fallback when pgvector is unavailable.
 */
export interface ChapterSummary {
  id: string
  chapter_id: string
  project_id: string
  summary: string
  embedding: number[] | null
  key_facts: string[]
  created_at?: string
}

export interface EmotionalPattern {
  id: string
  project_id: string
  chapter_number: number
  planned_emotion: 'TENSION' | 'RELIEF' | 'DOPAMINE' | 'SHOCK' | 'BREATHER'
  actual_emotion: string | null
  false_resolution: boolean
}

export interface OutlineProgress {
  current: number
  total: number
  status: 'generating' | 'idle' | 'cancelled' | 'error' | 'success'
  currentChapter: number
  generated: number
  skipped: number
  warnings: string[]
}

// ── Sprint 6 — Auto-Pilot Batch Prose ─────────────────────────────────────

export type BatchStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'aborted'
  | 'success'
  | 'error'

export interface BatchOptions {
  startChapter: number
  endChapter: number
  /** Skip chapters that already have prose / are locked / IMPORTED. */
  skipExisting: boolean
  /** Stop after N consecutive hard errors. Rate limits don't count. */
  safetyStopAfterErrors: number
}

export interface BatchCompletedEntry {
  chapterId: string
  chapterNumber: number
  wordCount: number
}

export interface BatchErrorEntry {
  chapterId: string | null
  chapterNumber: number
  message: string
}

export interface BatchProgress {
  projectId: string
  status: BatchStatus
  startChapter: number
  endChapter: number
  /** 0..total, increments on each chapter regardless of skipped vs generated. */
  current: number
  total: number
  currentChapterId: string | null
  currentChapterNumber: number | null
  currentBeatIndex: number
  beatsTotal: number
  /** Word count accumulated for the current chapter only. */
  currentWordCount: number
  /** Total word count for chapters completed in this batch. */
  totalWordCount: number
  startedAt: number // epoch ms
  /** Set when the batch transitions to a terminal status (success/error/aborted/paused). */
  endedAt: number | null
  completed: BatchCompletedEntry[]
  skipped: number
  errors: BatchErrorEntry[]
  warnings: string[]
  /** Hard error counter — resets on a clean chapter. */
  consecutiveErrors: number
}

