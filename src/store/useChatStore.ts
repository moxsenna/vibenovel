import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProjectStore } from './useProjectStore'
import { useSettingsStore } from './useSettingsStore'
import { useUiStore } from './useUiStore'
import { aiRouter } from '../services/ai/ai-router'
import {
  buildCoAuthorSystemInstruction,
  detectCompassGap,
} from '../prompts/brainstorm-agent'
import { describeDraftTypeForUser, getCompassProgress } from '../lib/compassProgress'
import {
  normalizeCharacterRole,
  normalizeMysteryBreadcrumbs
} from '../services/story-contract-validator'
import type { CompassState } from '../prompts/brainstorm-agent'
import type {
  Character,
  Item,
  WorldRule,
  MysteryLayer,
  CharacterState,
  StoryContract
} from '../types/project'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  draftData?: {
    type: 'story_contract' | 'character' | 'item' | 'world_rule' | 'ending' | 'mystery' | 'character_state'
    status: 'pending' | 'approved' | 'rejected' | 'edited'
    data: Record<string, unknown>
  }
}

interface ChatState {
  // project_id -> ChatMessage[]
  messages: Record<string, ChatMessage[]>
  loading: boolean
  // Anti-melantur: track consecutive off-topic turns per project
  offTopicCounters: Record<string, number>
  // Non-persistent state for active request aborting
  activeControllers: Record<string, AbortController>
  // Transient guard for approval/edit actions that trigger AI continuation
  activeDraftActions: Record<string, boolean>
}

interface GenerateAiResponseOptions {
  internalContext?: string
}

interface ChatActions {
  sendMessage: (projectId: string, content: string) => Promise<void>
  generateAiResponse: (
    projectId: string,
    content: string,
    options?: GenerateAiResponseOptions
  ) => Promise<void>
  regenerateResponse: (projectId: string) => Promise<void>
  stopResponse: (projectId: string) => void
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateMessageDraftStatus: (
    projectId: string,
    messageId: string,
    status: 'approved' | 'rejected' | 'edited',
    editedData?: Record<string, unknown>
  ) => Promise<void>
  clearChat: (projectId: string) => void
  getProjectMessages: (projectId: string) => ChatMessage[]
}

export type ChatStore = ChatState & ChatActions

const EMPTY_ARRAY: ChatMessage[] = []

// ─── Helper: Build compass state snapshot from project store ──────────────

function getCompassState(projectId: string): CompassState {
  const projectStore = useProjectStore.getState()
  const activeProj =
    projectStore.projects.find((p) => p.id === projectId) ||
    projectStore.activeProject

  return {
    title: activeProj?.title || '',
    genre: activeProj?.genre || '',
    targetChapters: activeProj?.target_chapters || 200,
    narrativeConstitution: activeProj?.narrative_constitution || null,
    storyContract: activeProj?.story_contract || null,
    targetEnding: activeProj?.target_ending || null,
    themeAndTone: activeProj?.theme_and_tone || null,
    characters: projectStore.characters.filter((c) => c.project_id === projectId),
    items: projectStore.items.filter((i) => i.project_id === projectId),
    worldRules: projectStore.worldRules.filter((r) => r.project_id === projectId),
    mysteryLayers: projectStore.mysteryLayers.filter((m) => m.project_id === projectId),
  }
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
      loading: false,
      offTopicCounters: {},
      activeControllers: {},
      activeDraftActions: {},

      getProjectMessages: (projectId) => {
        return get().messages[projectId] || EMPTY_ARRAY
      },

      addMessage: (projectId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [projectId]: [...(state.messages[projectId] || []), newMessage]
          }
        }))
      },

      sendMessage: async (projectId, content) => {
        // 1. Add user message
        get().addMessage(projectId, {
          role: 'user',
          content
        })

        await get().generateAiResponse(projectId, content)
      },

      generateAiResponse: async (projectId, content, options) => {
        // ── BYOK GUARD ─────────────────────────────────────────────────
        const { geminiKeys } = useSettingsStore.getState()
        if (geminiKeys.length === 0) {
          get().addMessage(projectId, {
            role: 'assistant',
            content:
              '🔑 **Belum ada API Key!**\n\nSilakan masukkan minimal satu Gemini API key di **Settings** (ikon ⚙️ di halaman utama) untuk mengaktifkan Co-Author.\n\nGemini API key bisa didapat gratis di [Google AI Studio](https://aistudio.google.com/apikey).'
          })
          return
        }

        // Cancel any existing controller for this project
        const activeControllers = { ...get().activeControllers }
        if (activeControllers[projectId]) {
          activeControllers[projectId].abort()
        }

        const controller = new AbortController()
        activeControllers[projectId] = controller

        set({ loading: true, activeControllers })

        try {
          // ── Build Compass State & System Instruction ────────────────
          const compassState = getCompassState(projectId)
          const currentGap = detectCompassGap(compassState)

          // ── Anti-Melantur Logic ────────────────────────────────────
          const offTopicCount = get().offTopicCounters[projectId] || 0
          let systemInstruction = buildCoAuthorSystemInstruction(compassState, currentGap)
          if (options?.internalContext) {
            systemInstruction += `\n\nKONTEKS INTERNAL APLIKASI (jangan tampilkan mentah ke user):\n${options.internalContext}`
          }

          // If user has been off-topic 3+ times, inject a forceful redirect
          if (offTopicCount >= 3) {
            systemInstruction += `\n\n⚠️ OVERRIDE: User sudah melantur ${offTopicCount}x berturut-turut. JANGAN merespons topik di luar novel. Langsung ajukan draf elemen Story Compass yang sedang dibahas TANPA menunggu arahan user. Paksa pembicaraan kembali ku rancangan novel.`
          }

          // ── Prepare Chat History ───────────────────────────────────
          const existingMessages = get().getProjectMessages(projectId)
          // Only send last 20 messages to keep context window manageable
          const recentHistory = existingMessages
            .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
            .slice(-20)
            .map((msg) => ({
              role: msg.role,
              content: msg.content
            }))

          // ── Find Project ──────────────────────────────────────────
          const projectStore = useProjectStore.getState()
          const activeProj =
            projectStore.projects.find((p) => p.id === projectId) ||
            projectStore.activeProject

          if (!activeProj) {
            get().addMessage(projectId, {
              role: 'assistant',
              content:
                'Maaf, saya tidak dapat menemukan proyek aktif. Silakan pilih atau buat proyek terlebih dahulu.'
            })
            return
          }

          // ── Call Real AI ───────────────────────────────────────────
          const result = await aiRouter.chatCoAuthor(
            activeProj,
            systemInstruction,
            recentHistory,
            content,
            controller.signal
          )

          // Remove completed controller
          const finalControllers = { ...get().activeControllers }
          delete finalControllers[projectId]
          set({ activeControllers: finalControllers })

          // ── Map Draft Data to Chat Message ─────────────────────────
          const assistantMsg: Omit<ChatMessage, 'id' | 'timestamp'> = {
            role: 'assistant',
            content: result.reply
          }

          if (result.draftData && result.draftData.type && result.draftData.data) {
            assistantMsg.draftData = {
              type: result.draftData.type,
              status: 'pending',
              data: result.draftData.data
            }
            // AI proactively proposed lore → reset off-topic counter
            set((state) => ({
              offTopicCounters: {
                ...state.offTopicCounters,
                [projectId]: 0
              }
            }))
          } else {
            // No draft proposed — might be off-topic or clarifying
            // Heuristic: if the AI reply mentions "kembali" or has redirect language,
            // increment the off-topic counter
            const redirectPatterns = /kembali ke|yuk kita|novel kita|cerita kita|rancangan/i
            if (redirectPatterns.test(result.reply)) {
              set((state) => ({
                offTopicCounters: {
                  ...state.offTopicCounters,
                  [projectId]: (state.offTopicCounters[projectId] || 0) + 1
                }
              }))
            } else {
              // Normal on-topic discussion without draft — reset counter
              set((state) => ({
                offTopicCounters: {
                  ...state.offTopicCounters,
                  [projectId]: 0
                }
              }))
            }
          }

          get().addMessage(projectId, assistantMsg)
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            console.log('Co-Author chat generation aborted.')
            return
          }

          console.error('Co-Author AI error:', e)

          const err = e as { message?: string }

          // Provide a user-friendly error message
          let errorMsg = 'Maaf, terjadi kesalahan saat menghubungi Co-Author AI.'
          if (err.message?.includes('429') || err.message?.includes('rate')) {
            errorMsg =
              '⏳ **Rate Limited!** Semua API key sedang cooldown. Tunggu beberapa detik lalu coba lagi, atau tambahkan key tambahan di Settings.'
          } else if (err.message?.includes('No Gemini API keys')) {
            errorMsg =
              '🔑 **Belum ada API Key!** Silakan masukkan Gemini API key di Settings.'
          } else if (err.message) {
            errorMsg += `\n\nDetail: ${err.message}`
          }

          get().addMessage(projectId, {
            role: 'assistant',
            content: errorMsg
          })
        } finally {
          const finalControllers = { ...get().activeControllers }
          if (finalControllers[projectId] === controller) {
            delete finalControllers[projectId]
          }
          set({ loading: false, activeControllers: finalControllers })
        }
      },

      regenerateResponse: async (projectId) => {
        const existingMessages = get().getProjectMessages(projectId)
        if (existingMessages.length === 0) return

        // Find last user message index
        let lastUserIdx = -1
        for (let i = existingMessages.length - 1; i >= 0; i--) {
          if (existingMessages[i].role === 'user') {
            lastUserIdx = i
            break
          }
        }

        if (lastUserIdx === -1) return

        const lastUserMsg = existingMessages[lastUserIdx]

        // Keep messages up to and including the last user message
        const cleanedMessages = existingMessages.slice(0, lastUserIdx + 1)
        set((state) => ({
          messages: {
            ...state.messages,
            [projectId]: cleanedMessages
          }
        }))

        // Now call the AI generation logic with the last user message's content
        await get().generateAiResponse(projectId, lastUserMsg.content)
      },

      stopResponse: (projectId) => {
        const activeControllers = { ...get().activeControllers }
        const controller = activeControllers[projectId]
        if (controller) {
          controller.abort()
          delete activeControllers[projectId]
          set({ activeControllers, loading: false })

          get().addMessage(projectId, {
            role: 'system',
            content: '🛑 *Generasi dihentikan oleh pengguna.*'
          })
        }
      },

      updateMessageDraftStatus: async (projectId, messageId, status, editedData) => {
        const actionKey = `${projectId}:${messageId}`
        const currentMessages = get().messages[projectId] || []
        const currentMessage = currentMessages.find((message) => message.id === messageId)
        const currentDraft = currentMessage?.draftData
        if (!currentDraft) return
        if (status !== 'rejected' && currentDraft.status !== 'pending') return

        if (status !== 'rejected' && (get().loading || get().activeDraftActions[actionKey])) {
          return
        }

        if (status !== 'rejected') {
          set((state) => ({
            activeDraftActions: {
              ...state.activeDraftActions,
              [actionKey]: true
            }
          }))
        }

        const clearActiveDraftAction = () => {
          set((state) => {
            const activeDraftActions = { ...state.activeDraftActions }
            delete activeDraftActions[actionKey]
            return { activeDraftActions }
          })
        }

        const dataForPreflight = (status === 'edited' && editedData
          ? editedData
          : currentDraft.data) as Record<string, unknown>

        const readName = (...keys: string[]) => {
          for (const key of keys) {
            const value = dataForPreflight[key]
            if (typeof value === 'string' && value.trim()) return value.trim()
          }
          return ''
        }

        const projectStoreForPreflight = useProjectStore.getState()
        const uiStoreForPreflight = useUiStore.getState()

        if (status === 'approved' || status === 'edited') {
          if (currentDraft.type === 'character') {
            const name = readName('name', 'character_name')
            const exists = projectStoreForPreflight.characters.some(
              (character) => character.name.toLowerCase() === name.toLowerCase()
            )
            if (name && exists) {
              uiStoreForPreflight.addToast(
                `Tokoh "${name}" sudah ada di Lorebook. Edit tokoh existing dari Story Compass agar tidak membuat duplikat.`,
                'warning',
                7000
              )
              clearActiveDraftAction()
              return
            }
          }

          if (currentDraft.type === 'item') {
            const name = readName('name', 'item_name')
            const exists = projectStoreForPreflight.items.some(
              (item) => item.name.toLowerCase() === name.toLowerCase()
            )
            if (name && exists) {
              uiStoreForPreflight.addToast(
                `Item "${name}" sudah ada di Lorebook. Edit item existing dari Story Compass agar tidak membuat duplikat.`,
                'warning',
                7000
              )
              clearActiveDraftAction()
              return
            }
          }

          if (currentDraft.type === 'world_rule') {
            const name = readName('name', 'rule_name')
            const exists = projectStoreForPreflight.worldRules.some(
              (rule) => rule.name.toLowerCase() === name.toLowerCase()
            )
            if (name && exists) {
              uiStoreForPreflight.addToast(
                `World rule "${name}" sudah ada. Edit rule existing dari Story Compass agar tidak membuat duplikat.`,
                'warning',
                7000
              )
              clearActiveDraftAction()
              return
            }
          }

          if (currentDraft.type === 'character_state') {
            const name = readName('character_name', 'name')
            const exists = projectStoreForPreflight.characters.some(
              (character) => character.name.toLowerCase() === name.toLowerCase()
            )
            if (!name || !exists) {
              uiStoreForPreflight.addToast(
                `State karakter tidak disimpan karena "${name || 'karakter ini'}" belum ada di Lorebook.`,
                'warning',
                7000
              )
              clearActiveDraftAction()
              return
            }
          }
        }

        let shouldContinue = false
        let actionLabel = 'Draf'

        set((state) => {
          const projectMsgs = state.messages[projectId] || []
          const targetMsg = projectMsgs.find((m) => m.id === messageId)
          if (
            !targetMsg?.draftData ||
            (status !== 'rejected' && targetMsg.draftData.status !== 'pending')
          ) {
            return state
          }

          const updatedMsgs = projectMsgs.map((msg) => {
            if (msg.id === messageId && msg.draftData) {
              return {
                ...msg,
                draftData: {
                  ...msg.draftData,
                  status,
                  data: status === 'edited' && editedData ? editedData : msg.draftData.data
                }
              }
            }
            return msg
          })

          // Execute action in project store if approved
          if (status === 'approved' || status === 'edited') {
            const msg = projectMsgs.find((m) => m.id === messageId)
            if (msg && msg.draftData) {
              const dataToUse = (status === 'edited' && editedData
                ? editedData
                : msg.draftData.data) as Record<string, unknown>
              const projectStore = useProjectStore.getState()
              actionLabel = describeDraftTypeForUser(msg.draftData.type, dataToUse)

              const str = (k: string): string => {
                const v = dataToUse[k]
                return typeof v === 'string' ? v : ''
              }
              const num = (k: string, fallback: number): number => {
                const v = dataToUse[k]
                return typeof v === 'number' ? v : fallback
              }
              const arr = (k: string): string[] => {
                const v = dataToUse[k]
                return Array.isArray(v) ? (v as string[]) : []
              }
              const bool = (k: string, fallback: boolean): boolean => {
                const v = dataToUse[k]
                return typeof v === 'boolean' ? v : fallback
              }
              const summarizeStoryContract = (contract: Record<string, unknown>): string | null => {
                const corePromise = typeof contract.core_promise === 'string'
                  ? contract.core_promise
                  : ''
                const readerPromise = typeof contract.reader_promise === 'string'
                  ? contract.reader_promise
                  : ''
                return [corePromise, readerPromise].filter(Boolean).join('\n\n') || null
              }

              if (msg.draftData.type === 'story_contract') {
                projectStore.updateProject(projectId, {
                  story_contract: dataToUse as unknown as StoryContract,
                  narrative_constitution:
                    summarizeStoryContract(dataToUse) ||
                    projectStore.activeProject?.narrative_constitution ||
                    null
                })
                shouldContinue = true
              } else if (msg.draftData.type === 'character') {
                const name = str('name') || str('character_name') || 'Tanpa Nama'
                projectStore.addCharacter({
                  project_id: projectId,
                  name,
                  role: normalizeCharacterRole(str('role')),
                  description: str('description'),
                  voice_dna: (dataToUse.voice_dna as Record<string, unknown>) || {},
                  activation_keys: arr('activation_keys').length
                    ? arr('activation_keys')
                    : [name],
                  priority: num('priority', 5),
                  is_locked: bool('is_locked', false),
                  genesis: (str('genesis') as Character['genesis']) || 'BRAINSTORMED'
                })
                shouldContinue = true
              } else if (msg.draftData.type === 'item') {
                const name = str('name') || str('item_name') || 'Tanpa Nama'
                projectStore.addItem({
                  project_id: projectId,
                  name,
                  category: (str('category') as Item['category']) || 'OTHER',
                  description: str('description'),
                  significance: str('significance'),
                  activation_keys: arr('activation_keys').length
                    ? arr('activation_keys')
                    : [name],
                  current_owner: str('current_owner'),
                  priority: num('priority', 5),
                  genesis: (str('genesis') as Item['genesis']) || 'BRAINSTORMED'
                })
                shouldContinue = true
              } else if (msg.draftData.type === 'world_rule') {
                const name = str('name') || str('rule_name') || 'Tanpa Nama'
                projectStore.addWorldRule({
                  project_id: projectId,
                  category: (str('category') as WorldRule['category']) || 'OTHER',
                  name,
                  description: str('description'),
                  priority: num('priority', 5),
                  activation_keys: arr('activation_keys'),
                  genesis: (str('genesis') as WorldRule['genesis']) || 'BRAINSTORMED'
                })
                shouldContinue = true
              } else if (msg.draftData.type === 'ending') {
                projectStore.updateProject(projectId, {
                  target_ending: str('target_ending'),
                  status: 'OUTLINING'
                })
                shouldContinue = true
              } else if (msg.draftData.type === 'mystery') {
                const currentLayers = useProjectStore.getState().mysteryLayers
                const newLayer: Omit<MysteryLayer, 'id'> = {
                  project_id: projectId,
                  layer_number: num('layer_number', currentLayers.length + 1),
                  central_question: str('central_question'),
                  revealed_at_chapter:
                    typeof dataToUse.revealed_at_chapter === 'number'
                      ? (dataToUse.revealed_at_chapter as number)
                      : null,
                  answer: typeof dataToUse.answer === 'string' ? (dataToUse.answer as string) : null,
                  opens_next_question:
                    typeof dataToUse.opens_next_question === 'string'
                      ? (dataToUse.opens_next_question as string)
                      : null,
                  breadcrumbs: normalizeMysteryBreadcrumbs(dataToUse.breadcrumbs),
                  status: (str('status') as MysteryLayer['status']) || 'ACTIVE'
                }
                projectStore.addMysteryLayer(newLayer)
                shouldContinue = true
              } else if (msg.draftData.type === 'character_state') {
                const characters = useProjectStore.getState().characters
                const matchedChar = characters.find(
                  (c) => c.name.toLowerCase() === str('character_name').toLowerCase()
                )
                if (!matchedChar) {
                  useUiStore.getState().addToast(
                    `State karakter tidak disimpan karena "${str('character_name')}" belum ada di Lorebook.`,
                    'warning',
                    7000
                  )
                  return state
                }
                const chapterNum = num('chapter_number', 0)

                const newState: CharacterState = {
                  id: crypto.randomUUID(),
                  character_id: matchedChar.id,
                  chapter_number: chapterNum,
                  location: str('location'),
                  physical_condition: str('physical_condition'),
                  emotional_state: str('emotional_state'),
                  inventory: arr('inventory'),
                  relationships:
                    (dataToUse.relationships as Record<string, unknown>) || {},
                  last_action: str('last_action'),
                  knowledge_state: arr('knowledge_state'),
                  active_goal: str('active_goal'),
                  secrets: arr('secrets'),
                  appearance_notes: str('appearance_notes'),
                  alliances: arr('alliances'),
                  source: 'MANUAL_EDIT'
                }

                projectStore.upsertCharacterStates(chapterNum, [newState])
                shouldContinue = true
              }
            }
          }

          return {
            messages: {
              ...state.messages,
              [projectId]: updatedMsgs
            }
          }
        })

        if (status === 'rejected') return

        try {
          if (shouldContinue) {
            const compassState = getCompassState(projectId)
            const progress = getCompassProgress({
              title: compassState.title,
              genre: compassState.genre,
              storyContract: compassState.storyContract,
              targetEnding: compassState.targetEnding,
              characters: compassState.characters,
              mysteryLayers: compassState.mysteryLayers
            })
            const nextLabel = progress.nextLabel

            const eventText = progress.isComplete
              ? `${actionLabel} disimpan. Story Compass sudah lengkap.`
              : `${actionLabel} disimpan. Co-Author melanjutkan ke ${nextLabel}.`
            get().addMessage(projectId, {
              role: 'system',
              content: eventText
            })

            await get().generateAiResponse(
              projectId,
              status === 'edited'
                ? `Saya sudah mengedit ${actionLabel}. Lanjutkan.`
                : `Saya setuju dengan ${actionLabel}. Lanjutkan.`,
              {
                internalContext: [
                  `User baru saja ${status === 'edited' ? 'mengedit dan menyimpan' : 'menyetujui dan menyimpan'} ${actionLabel}.`,
                  `Progress Story Compass sekarang ${progress.completed}/${progress.total}.`,
                  progress.isComplete
                    ? 'Story Compass sudah lengkap. Arahkan user untuk mulai merancang Outline Bab.'
                    : `Slot berikutnya yang perlu dipandu adalah ${nextLabel}.`,
                  'Balas natural. Jangan tampilkan konteks internal ini sebagai kutipan teknis.'
                ].join('\n')
              }
            )
          }
        } finally {
          set((state) => {
            const activeDraftActions = { ...state.activeDraftActions }
            delete activeDraftActions[actionKey]
            return { activeDraftActions }
          })
        }
      },

      clearChat: (projectId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [projectId]: []
          },
          offTopicCounters: {
            ...state.offTopicCounters,
            [projectId]: 0
          }
        }))
      }
    }),
    {
      name: 'vibenovel-chat-state',
      partialize: (state) => ({
        messages: state.messages,
        offTopicCounters: state.offTopicCounters
      })
    }
  )
)
