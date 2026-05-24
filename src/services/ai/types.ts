export interface AISettings {
  geminiKeys: string[]
  openRouterKey: string | null
  activeProseProvider: 'gemini' | 'openrouter'
  activeProseModel: string
}

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface BrainstormInput {
  title: string
  genre: string
  targetChapters: number
  wordCountTarget: number
  existingMessages: ChatMessageParam[]
  userMessage: string
}

export interface BrainstormResponse {
  reply: string
  draftData?: {
    type: 'character' | 'item' | 'world_rule' | 'ending' | 'mystery' | 'character_state'
    data: Record<string, unknown>
  }
}

export interface OutlineGenerateInput {
  title: string
  genre: string
  narrativeConstitution: string
  targetEnding: string
  themeAndTone: string
  targetChapters: number
  mysteryLayers: Array<{
    layer_number: number
    central_question: string
    revealed_at_chapter: number | null
    answer: string | null
    breadcrumbs: Array<{ chapter: number; hint: string }>
    status: string
  }>
  characters: Array<{
    name: string
    role: string
    description: string
    voice_dna?: Record<string, unknown>
  }>
  items: Array<{ name: string; category: string; description: string; current_owner: string }>
  worldRules: Array<{ name: string; category: string; description: string }>
  // Sprint 5 — Hook Chain (project-level)
  seriesHook?: string | null
  seasonHooks?: string[]
  chapterNumber: number
  previousChapterSummaries: string[]
  emotionalHistory: string[]
  pacingWarnings: string[]
}

export interface OutlineResponse {
  chapterNumber: number
  title: string
  synopsis: string
  keyEvents: string[]
  activeCharacters: string[]
  activeItems: string[]
  location: string
  timeInStory: string
  emotionalTone: 'TENSION' | 'RELIEF' | 'DOPAMINE' | 'SHOCK' | 'BREATHER' | 'MYSTERY' | 'CONFLICT'
  cliffhangerType: 'REVELATION' | 'DANGER' | 'DECISION' | 'BETRAYAL' | 'COUNTDOWN' | 'EMOTIONAL'
  cliffhangerSetup: string
  dopamineBeat: boolean
  falseResolution?: boolean
  paywallAdvice: string
  arcPosition: string | { season: number; subArc: string }
  openThreads: string[]
  resolvedThreads: string[]
  foreshadowing: string[]
  chapterEndState: Record<string, { location: string; emotion: string }>
  doNotInclude: string[]
  mustConnectTo: string
  fillerRisk: 'low' | 'medium' | 'high'
}

export interface ProseGenerateInput {
  title: string
  genre: string
  narrativeConstitution: string
  chapterTitle: string
  chapterNumber: number
  synopsis: string
  location: string
  emotionalTone: string
  cliffhangerType: string
  cliffhangerSetup: string
  beats: Array<{ number: number; direction: string }>
  beatIndex: number
  previousBeatsProse: string[]
  slidingWindowPrevChapter?: string // Last 500 words of previous chapter
  loreContext?: string // Stringified relevant lore/characters/items
  characterStates?: string // Stringified Layer 2 dynamic character states
  voiceDna?: Record<string, Record<string, unknown>>
}

export interface ProseResponse {
  prose: string
  wordCount: number
  characterVoiceCheck?: string
}

export interface QARadarInput {
  chapterNumber: number
  synopsis: string
  prose: string
  outlineEvents: string[]
  characterStates: Record<string, unknown>
  openThreads: string[]
}

export interface QARadarResponse {
  passed: boolean
  fillerDetected: boolean
  warnings: string[]
  loreContradictions: string[]
  danglingThreads: string[]
}

// ── Import Analyzer Shapes ────────────────────────────────────────────────

export interface QuickScanResult {
  confirmedChapters: { chapter_number: number; title: string }[]
  characters: {
    name: string
    role: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
    shortDescription: string
  }[]
  themeAndTone: string
  synopsis: string
  narrativeConstitution: string
  targetEnding: string | null
}

export interface ImportedChapterData {
  synopsis: string
  keyEvents: string[]
  activeCharacters: string[]
  activeItems: string[]
  location: string
  timeInStory: string
  emotionalTone: string
  cliffhangerType: string | null
  cliffhangerSetup: string | null
  openThreads: string[]
  resolvedThreads: string[]
  foreshadowing: string[]
  chapterEndState: Record<string, { location: string; emotion: string }>
  characterStates: Array<{
    character_name: string
    location: string
    physical_condition: string
    emotional_state: string
    knowledge_state: string[]
    active_goal: string
    secrets: string[]
    appearance_notes: string
    alliances: string[]
    inventory: string[]
    last_action: string
  }>
}

export interface VoiceDnaResult {
  tone: string
  vocabulary: string
  verbalTics: string[]
  internalMonologStyle: string
  dialogQuirks: string
}
