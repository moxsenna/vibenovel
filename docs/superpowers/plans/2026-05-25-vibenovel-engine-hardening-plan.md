# VibeNovel Engine Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current VibeNovel engine risks before adding new long-series features, so prose generation, batch generation, offline drafts, and memory artifacts behave safely for long novels.

**Architecture:** This plan keeps the existing 100% client-side Vite + React + Zustand + Supabase architecture. The first pass fixes data correctness and orchestration bugs without changing the database contract except for the version-history snapshot upgrade in the final task. RAG wiring is added through the existing prose-context boundary so the hook and batch generator share the same context assembly.

**Tech Stack:** React 19, TypeScript with `verbatimModuleSyntax`, Zustand, Supabase client, Gemini/OpenRouter adapters, Vite, Vitest for focused service tests.

---

## Scope And Order

This is a hardening plan, not the new Continuity Gate feature. The purpose is to make the current engine trustworthy enough to receive Continuity Gate, Repair Loop, Timeline Ledger, and Arc Roadmap later.

Priority order:

1. Prevent false writes and noisy demo/offline Supabase calls.
2. Preserve offline Free Write drafts correctly.
3. Make Auto-Pilot truly sequential for state memory.
4. Wire RAG into prose generation through one shared helper.
5. Fix Co-Author approval state, character state UUID safety, and outline pacing warnings.
6. Clean remaining lint and version-history restore correctness.

Do not refactor unrelated UI or rename user-facing modes during this plan.

## File Map

- Modify `package.json` - add test scripts after installing Vitest.
- Create `vitest.config.ts` - node-environment Vitest config for service tests.
- Create `src/test/factories.ts` - small typed factories for `Chapter`, `Project`, and related fixtures.
- Create `src/services/offline-draft-sync.ts` - pure offline draft to chapter patch builder.
- Create `src/services/__tests__/offline-draft-sync.test.ts` - unit tests for beat and Free Write draft replay.
- Modify `src/hooks/useBeatWriter.ts` - use the new offline draft patch helper and RAG prose input helper.
- Modify `src/store/parts/chapters.ts` - guard Supabase chapter updates in demo/offline mode and support beat snapshots for versions.
- Modify `src/services/batch-generator.ts` - await background memory tasks before continuing to the next chapter.
- Modify `src/services/ai/types.ts` - add optional `ragMemory` to `ProseGenerateInput`.
- Modify `src/services/prose-context.ts` - add async `buildProseInputWithRag()` wrapper.
- Modify `src/prompts/prose-writer.ts` - inject Layer 3 RAG memory when present.
- Modify `src/store/useChatStore.ts` - preflight duplicate approval and unknown character-state targets.
- Modify `src/store/parts/lorebook.ts` - make `addCharacter()` return the final ID.
- Modify `src/types/project.ts` - allow `ChapterVersion.beats`.
- Modify `src/lib/database.types.ts` - add `chapter_versions.beats`.
- Modify `supabase/schema.sql` - add idempotent `chapter_versions.beats JSONB`.
- Modify `src/services/state-tracker.ts` - discard unmatched character states instead of using non-UUID fallbacks.
- Modify `src/components/onboarding/ImportWizard.tsx` - use returned character IDs for imported character states.
- Modify `src/store/parts/outlines.ts` - track cliffhanger history in pacing validation.
- Modify `src/pages/Workspace.tsx` - fix exhaustive-deps warning and compass-open stale dependency.
- Modify `src/components/modals/VersionHistoryModal.tsx` - restore prose plus beats.
- Modify `src/components/workspace/ProseWriterPanel.tsx` - restore whole chapter snapshots instead of dumping into the active beat.
- Update `task.md`, `walkthrough.md`, and, only if behavior/schema changes need architectural record, `architecture.md`.

## Verification Commands

Run these at the end of every task that touches TypeScript:

```powershell
npm.cmd run test -- --runInBand
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

If Vitest does not support `--runInBand` in the installed version, use:

```powershell
npm.cmd run test -- --pool=forks --poolOptions.forks.singleFork=true
```

---

### Task 1: Add Focused Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/factories.ts`

- [x] **Step 1: Install Vitest**

Run:

```powershell
npm.cmd install -D vitest
```

Expected: `package-lock.json` and `package.json` include `vitest`.

- [x] **Step 2: Add scripts to `package.json`**

Add these scripts while preserving existing scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [x] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts']
  }
})
```

- [x] **Step 4: Create `src/test/factories.ts`**

```typescript
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
```

- [x] **Step 5: Run empty test harness**

Run:

```powershell
npm.cmd run test
```

Expected: Vitest starts and reports no tests or passes once Task 2 adds tests. If Vitest exits non-zero because no test files exist, proceed to Task 2 and verify there.

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 because the workspace already contained many unrelated modified files, including pre-existing edits in `src/hooks/useBeatWriter.ts`. Stage/commit only after reviewing mixed-file diffs.

```powershell
git add package.json package-lock.json vitest.config.ts src/test/factories.ts
git commit -m "test: add focused service test harness"
```

---

### Task 2: Fix Offline Free Write Draft Replay

**Files:**
- Create: `src/services/offline-draft-sync.ts`
- Create: `src/services/__tests__/offline-draft-sync.test.ts`
- Modify: `src/hooks/useBeatWriter.ts`

- [x] **Step 1: Write failing tests**

Create `src/services/__tests__/offline-draft-sync.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { makeChapter } from '../../test/factories'
import { buildOfflineDraftChapterPatch } from '../offline-draft-sync'

describe('buildOfflineDraftChapterPatch', () => {
  it('replays a Free Write draft into chapter prose', () => {
    const chapter = makeChapter({
      id: 'chapter-free',
      prose: 'old text',
      beats: []
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-free',
      beatIndex: -1,
      text: 'new free write prose with enough words to become a draft',
      timestamp: 1
    })

    expect(result?.patch.prose).toBe('new free write prose with enough words to become a draft')
    expect(result?.patch.prose_source).toBe('MANUAL_WRITE')
    expect(result?.patch.status).toBe('DRAFT')
    expect(result?.patch.word_count).toBe(10)
  })

  it('replays a beat draft into the correct beat and full prose', () => {
    const chapter = makeChapter({
      id: 'chapter-beat',
      beats: [
        { id: 'b1', number: 1, direction: 'one', prose: 'first beat' },
        { id: 'b2', number: 2, direction: 'two', prose: '' }
      ]
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-beat',
      beatIndex: 1,
      text: 'second beat text',
      timestamp: 1
    })

    expect(result?.patch.beats?.[1]?.prose).toBe('second beat text')
    expect(result?.patch.prose).toBe('first beat\n\nsecond beat text')
    expect(result?.patch.prose_source).toBe('GENERATED')
  })

  it('returns null when a beat draft points to a missing beat', () => {
    const chapter = makeChapter({
      id: 'chapter-beat',
      beats: [{ id: 'b1', number: 1, direction: 'one', prose: '' }]
    })

    const result = buildOfflineDraftChapterPatch(chapter, {
      chapterId: 'chapter-beat',
      beatIndex: 4,
      text: 'lost text',
      timestamp: 1
    })

    expect(result).toBeNull()
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/services/__tests__/offline-draft-sync.test.ts
```

Expected: FAIL because `../offline-draft-sync` does not exist.

- [x] **Step 3: Create `src/services/offline-draft-sync.ts`**

```typescript
import type { Chapter } from '../types/project'

export interface PendingProseDraft {
  chapterId: string
  beatIndex: number
  text: string
  timestamp: number
}

export interface OfflineDraftPatchResult {
  patch: Partial<Chapter>
  fullProse: string
  wordCount: number
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

function draftStatus(text: string): Chapter['status'] {
  return text.trim().length > 10 ? 'DRAFT' : 'GENERATING'
}

export function buildOfflineDraftChapterPatch(
  chapter: Chapter,
  draft: PendingProseDraft
): OfflineDraftPatchResult | null {
  if (chapter.id !== draft.chapterId) return null

  const text = draft.text.trimEnd()

  if (draft.beatIndex === -1) {
    const wordCount = countWords(text)
    return {
      fullProse: text,
      wordCount,
      patch: {
        prose: text,
        word_count: wordCount,
        status: draftStatus(text),
        prose_source: 'MANUAL_WRITE'
      }
    }
  }

  const beats = [...(chapter.beats ?? [])]
  if (!beats[draft.beatIndex]) return null

  beats[draft.beatIndex] = {
    ...beats[draft.beatIndex],
    prose: text
  }

  const fullProse = beats.map((beat) => beat.prose || '').join('\n\n').trim()
  const wordCount = countWords(fullProse)
  const isCompleted = beats.every((beat) => (beat.prose || '').trim().length > 10)

  return {
    fullProse,
    wordCount,
    patch: {
      beats,
      prose: fullProse,
      word_count: wordCount,
      status: isCompleted ? 'DRAFT' : 'GENERATING',
      prose_source: 'GENERATED'
    }
  }
}
```

- [x] **Step 4: Use helper in `src/hooks/useBeatWriter.ts`**

Add import:

```typescript
import { buildOfflineDraftChapterPatch } from '../services/offline-draft-sync'
```

Replace the `syncPendingDrafts` callback body with:

```typescript
const targetChapter = chapters.find((c) => c.id === d.chapterId)
if (!targetChapter) return false

const result = buildOfflineDraftChapterPatch(targetChapter, d)
if (!result) return false

await updateChapter(d.chapterId, result.patch)
syncedChapterIds.add(d.chapterId)
return true
```

- [x] **Step 5: Run tests**

Run:

```powershell
npm.cmd run test -- src/services/__tests__/offline-draft-sync.test.ts
npx.cmd tsc -b --noEmit
```

Expected: tests pass and TypeScript has zero errors.

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 for the same dirty-workspace reason as Task 1.

```powershell
git add src/services/offline-draft-sync.ts src/services/__tests__/offline-draft-sync.test.ts src/hooks/useBeatWriter.ts
git commit -m "fix: replay free write offline drafts"
```

---

### Task 3: Guard Chapter Supabase Writes In Demo Mode

**Files:**
- Modify: `src/store/parts/chapters.ts`

- [x] **Step 1: Add guard to `updateChapter`**

In `updateChapter`, after the optimistic local `set(...)`, add:

```typescript
if (!isSupabaseConfigured()) return
```

The function should become:

```typescript
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
}
```

- [ ] **Step 2: Manual verification in demo mode**

Temporarily run without Supabase env vars and generate or type prose.

Run:

```powershell
npm.cmd run dev
```

Expected:
- App opens in demo mode.
- Typing prose updates local state.
- Console does not repeatedly log `Supabase updateChapter error` for placeholder Supabase.

- [x] **Step 3: Run mechanical checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

Expected: zero TypeScript errors, zero lint errors, build succeeds.

- [ ] **Step 4: Commit**

Controller note: Deferred on 2026-05-27 because the workspace is intentionally dirty and commits would need careful staging around unrelated existing edits.

```powershell
git add src/store/parts/chapters.ts
git commit -m "fix: skip chapter sync when supabase is unconfigured"
```

---

### Task 4: Make Auto-Pilot Await Memory Artifacts Before Next Chapter

**Files:**
- Modify: `src/services/batch-generator.ts`

- [x] **Step 1: Replace fire-and-forget background task**

Replace:

```typescript
void this.runBackgroundTasks(chapter, fullProse, snapshot)
```

with:

```typescript
await this.runBackgroundTasks(chapter, fullProse, snapshot)
```

- [x] **Step 2: Update the comment above the call**

Use this exact comment:

```typescript
// Await memory tasks before the next chapter. Auto-Pilot depends on
// freshly persisted Layer 2 state and summaries so chapter N+1 does not
// continue from stale memory.
```

- [x] **Step 3: Keep failures non-fatal**

Leave the internal `try/catch` blocks inside `runBackgroundTasks()` intact. This keeps batch generation from aborting when QA, lore, or summary extraction fails, while still giving state and summary tasks a chance to finish before the next chapter prompt is built.

- [ ] **Step 4: Manual verification with two chapters**

Use a small project with two outlined chapters and one Gemini key.

Expected:
- Batch generates chapter 1.
- State snapshot logs or store state update happens before chapter 2 starts.
- Chapter 2 prompt includes Layer 2 state from chapter 1 when state extraction succeeds.

- [x] **Step 5: Run checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 for the same dirty-workspace reason as Task 3.

```powershell
git add src/services/batch-generator.ts
git commit -m "fix: await batch memory tasks between chapters"
```

---

### Task 5: Wire Layer 3 RAG Into Prose Generation

**Files:**
- Modify: `src/services/ai/types.ts`
- Modify: `src/services/prose-context.ts`
- Modify: `src/prompts/prose-writer.ts`
- Modify: `src/hooks/useBeatWriter.ts`
- Modify: `src/services/batch-generator.ts`

- [x] **Step 1: Add `ragMemory` to `ProseGenerateInput`**

In `src/services/ai/types.ts`, add:

```typescript
ragMemory?: string
```

near `characterStates?: string`.

- [x] **Step 2: Add RAG block to prose prompt**

In `src/prompts/prose-writer.ts`, add:

```typescript
const ragMemoryBlock = input.ragMemory
  ? `\n[LONG-TERM MEMORY - LAYER 3 RAG]\n${input.ragMemory}\nGunakan memori ini hanya untuk menjaga kontinuitas canon. Jangan mengulang adegan lama kecuali diminta outline.`
  : ''
```

Then inject it after `characterStateBlock`:

```typescript
${characterStateBlock}
${ragMemoryBlock}
${storyContractBlock}
```

- [x] **Step 3: Add async helper to `src/services/prose-context.ts`**

Add import:

```typescript
import { searchSimilarChapters } from './rag-service'
```

Add this function after `buildProseInput`:

```typescript
export async function buildProseInputWithRag(
  args: BuildProseInputArgs,
  options: { topK?: number; signal?: AbortSignal } = {}
): Promise<ProseGenerateInput> {
  const base = buildProseInput(args)
  const query = [
    args.chapter.title,
    args.chapter.synopsis,
    args.chapter.location,
    args.chapter.time_in_story,
    args.chapter.key_events.join('\n'),
    args.chapter.active_characters.join(', '),
    args.chapter.active_items.join(', ')
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const matches = await searchSimilarChapters(
      args.project.id,
      query,
      options.topK ?? 3,
      options.signal
    )
    const filtered = matches.filter((match) => match.summary.chapter_id !== args.chapter.id)
    if (filtered.length === 0) return base

    const ragMemory = filtered
      .map(({ summary, similarity }) => {
        const facts = summary.key_facts.length > 0
          ? `\nFacts: ${summary.key_facts.slice(0, 5).join('; ')}`
          : ''
        return `Similarity ${Math.round(similarity * 100)}%: ${summary.summary}${facts}`
      })
      .join('\n\n')

    return {
      ...base,
      ragMemory
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return base
  }
}
```

- [x] **Step 4: Use async helper in `useBeatWriter.ts`**

Change import:

```typescript
import { buildProseInputWithRag, ensureBeatsForChapter } from '../services/prose-context'
```

Replace:

```typescript
const input = buildProseInput({
```

with:

```typescript
const input = await buildProseInputWithRag({
```

Pass the signal as the second argument:

```typescript
}, { signal: abortControllerRef.current.signal })
```

- [x] **Step 5: Use async helper in `batch-generator.ts`**

Change import:

```typescript
import { buildProseInputWithRag, ensureBeatsForChapter } from './prose-context'
```

Replace:

```typescript
const input = buildProseInput({
```

with:

```typescript
const input = await buildProseInputWithRag({
```

Pass signal:

```typescript
}, { signal: this.abortController.signal })
```

- [x] **Step 6: Run checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

Expected: no type errors. Manual prompt inspection should show `[LONG-TERM MEMORY - LAYER 3 RAG]` only when summaries exist.

- [ ] **Step 7: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add src/services/ai/types.ts src/services/prose-context.ts src/prompts/prose-writer.ts src/hooks/useBeatWriter.ts src/services/batch-generator.ts
git commit -m "feat: inject rag memory into prose prompts"
```

---

### Task 6: Fix Co-Author Duplicate Approval State

**Files:**
- Modify: `src/store/useChatStore.ts`

- [x] **Step 1: Add preflight duplicate check before status mutation**

Inside `updateMessageDraftStatus`, before the `set((state) => { ... })` block, add:

```typescript
const currentMessages = get().messages[projectId] || []
const currentMessage = currentMessages.find((message) => message.id === messageId)
const currentDraft = currentMessage?.draftData
if (!currentDraft) return

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
      set((state) => {
        const activeDraftActions = { ...state.activeDraftActions }
        delete activeDraftActions[actionKey]
        return { activeDraftActions }
      })
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
      set((state) => {
        const activeDraftActions = { ...state.activeDraftActions }
        delete activeDraftActions[actionKey]
        return { activeDraftActions }
      })
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
      set((state) => {
        const activeDraftActions = { ...state.activeDraftActions }
        delete activeDraftActions[actionKey]
        return { activeDraftActions }
      })
      return
    }
  }
}
```

- [x] **Step 2: Remove duplicate early returns inside the `set` block**

Delete the inner duplicate branches that currently return `updatedMsgs` after showing duplicate toasts for character, item, and world rule. Keep the actual `addCharacter`, `addItem`, and `addWorldRule` calls.

- [ ] **Step 3: Manual verification**

Create an existing character, then approve a pending AI draft with the same name.

Expected:
- Toast appears.
- Draft remains pending.
- No duplicate character is added.
- Co-Author does not auto-continue.

- [x] **Step 4: Run checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 5: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add src/store/useChatStore.ts
git commit -m "fix: keep duplicate co-author drafts pending"
```

---

### Task 7: Make Character State IDs Supabase-Safe

**Files:**
- Modify: `src/store/parts/lorebook.ts`
- Modify: `src/store/useProjectStore.ts` if the composed `ProjectStore` type requires update.
- Modify: `src/services/state-tracker.ts`
- Modify: `src/components/onboarding/ImportWizard.tsx`
- Modify: `src/store/useChatStore.ts`

- [x] **Step 1: Make `addCharacter` return an ID**

In `LorebookPart`, change:

```typescript
addCharacter: (char: Omit<Character, 'id'>) => Promise<void>
```

to:

```typescript
addCharacter: (char: Omit<Character, 'id'>) => Promise<string>
```

In implementation, return final or temp ID:

```typescript
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
        return final.id
      }
    }
  } catch (e) {
    console.warn('Supabase addCharacter error, keeping locally:', e)
  }

  return tempId
}
```

- [x] **Step 2: Use returned ID in Import Wizard**

Replace:

```typescript
await addCharacter(payload)
const newest = useProjectStore.getState().characters.find((c) => c.name === ch.name)
if (newest) characterIdMap.set(ch.name, newest.id)
```

with:

```typescript
const characterId = await addCharacter(payload)
characterIdMap.set(ch.name, characterId)
```

- [x] **Step 3: Filter unmatched AI state rows in `state-tracker.ts`**

Replace the `return parsed.map(...)` block with:

```typescript
return parsed
  .map((stateRaw: Record<string, unknown>) => {
    const str = (k: string): string => (typeof stateRaw[k] === 'string' ? (stateRaw[k] as string) : '')
    const arr = (k: string): string[] => (Array.isArray(stateRaw[k]) ? (stateRaw[k] as string[]) : [])

    const matchedChar = activeCharacters.find(
      (c) => c.name.toLowerCase() === str('character_name').toLowerCase()
    )
    if (!matchedChar) return null

    return {
      id: crypto.randomUUID(),
      character_id: matchedChar.id,
      chapter_number: chapter.chapter_number,
      location: str('location'),
      physical_condition: str('physical_condition'),
      emotional_state: str('emotional_state'),
      inventory: arr('inventory'),
      relationships: (stateRaw.relationships as Record<string, unknown>) || {},
      last_action: str('last_action'),
      knowledge_state: arr('knowledge_state'),
      active_goal: str('active_goal'),
      secrets: arr('secrets'),
      appearance_notes: str('appearance_notes'),
      alliances: arr('alliances'),
      source: 'AUTO_GENERATED' as const
    } satisfies CharacterState
  })
  .filter((state): state is CharacterState => Boolean(state))
```

- [x] **Step 4: Block manual character_state approval when character is unknown**

In `src/store/useChatStore.ts`, inside the `character_state` branch, replace fallback:

```typescript
character_id: matchedChar?.id || str('character_name') || 'unknown',
```

with a guard:

```typescript
if (!matchedChar) {
  uiStore.addToast(
    `State karakter tidak disimpan karena "${str('character_name')}" belum ada di Lorebook.`,
    'warning',
    7000
  )
  return { messages: { ...state.messages, [projectId]: updatedMsgs } }
}
```

Then set:

```typescript
character_id: matchedChar.id,
```

- [x] **Step 5: Run checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add src/store/parts/lorebook.ts src/services/state-tracker.ts src/components/onboarding/ImportWizard.tsx src/store/useChatStore.ts
git commit -m "fix: keep character state ids canonical"
```

---

### Task 8: Restore Cliffhanger Variety Validation

**Files:**
- Modify: `src/store/parts/outlines.ts`

- [x] **Step 1: Track cliffhanger history in batch outline generation**

Near:

```typescript
const emotionalHistory: string[] = []
const falseResolutionFlags: boolean[] = []
```

add:

```typescript
const cliffhangerHistory: string[] = []
```

When reading `priorChapters`, add:

```typescript
if (ch.cliffhanger_type) cliffhangerHistory.push(ch.cliffhanger_type)
```

In skip branches for existing chapters, after emotional tone handling, add:

```typescript
if (existingChapter.cliffhanger_type) cliffhangerHistory.push(existingChapter.cliffhanger_type)
```

Replace:

```typescript
const pacingResult = validatePacing(emotionalHistory, [])
```

with:

```typescript
const pacingResult = validatePacing(emotionalHistory, cliffhangerHistory)
```

After generated outline success, add:

```typescript
if (outline.cliffhangerType) cliffhangerHistory.push(outline.cliffhangerType)
```

- [x] **Step 2: Track cliffhanger history in single regenerate**

In `regenerateOutline`, add:

```typescript
const cliffhangerHistory = priorChapters
  .map((ch) => ch.cliffhanger_type || '')
  .filter(Boolean)
  .slice(-5)
```

Replace:

```typescript
const pacingResult = validatePacing(emotionalHistory, [])
```

with:

```typescript
const pacingResult = validatePacing(emotionalHistory, cliffhangerHistory)
```

- [ ] **Step 3: Manual verification**

Create or mock three previous chapters with same `cliffhanger_type`.

Expected:
- `validatePacing` returns cliffhanger repetition warning.
- Warning appears in outline progress warnings or generated prompt warnings.

- [x] **Step 4: Run checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 5: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add src/store/parts/outlines.ts
git commit -m "fix: validate cliffhanger variety in outline pacing"
```

---

### Task 9: Fix Workspace Compass Effect Dependencies

**Files:**
- Modify: `src/pages/Workspace.tsx`

- [x] **Step 1: Import compass helper**

Add:

```typescript
import { getCompassProgress } from '../lib/compassProgress'
```

- [x] **Step 2: Replace manual completeness logic**

Replace the `isComplete` block inside the Brainstorm sidebar effect with:

```typescript
const progress = getCompassProgress({
  title: activeProject.title,
  genre: activeProject.genre,
  storyContract: activeProject.story_contract,
  targetEnding: activeProject.target_ending,
  characters,
  mysteryLayers
})

if (!progress.isComplete) {
  setContextPanelOpen(true)
}
```

- [x] **Step 3: Fix dependency list**

Use:

```typescript
}, [
  activeMode,
  activeProject,
  characters,
  mysteryLayers,
  setContextPanelOpen
])
```

This intentionally depends on the selected Zustand slices themselves so role changes, target ending changes, and Story Contract changes rerun the effect even when array length stays the same.

- [x] **Step 4: Run lint**

```powershell
npm.cmd run lint
```

Expected: no `react-hooks/exhaustive-deps` warning for `Workspace.tsx`.

- [x] **Step 5: Run full checks**

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run build
```

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add src/pages/Workspace.tsx
git commit -m "fix: refresh workspace compass effect on canon changes"
```

---

### Task 10: Restore Version Snapshots As Whole Chapters

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/lib/database.types.ts`
- Modify: `src/types/project.ts`
- Modify: `src/store/parts/chapters.ts`
- Modify: `src/hooks/useBeatWriter.ts`
- Modify: `src/components/modals/VersionHistoryModal.tsx`
- Modify: `src/components/workspace/ProseWriterPanel.tsx`

- [x] **Step 1: Add schema migration**

In `supabase/schema.sql`, add:

```sql
-- VERSION HISTORY BEAT SNAPSHOTS
-- Allows full chapter restore in beat mode without dumping the whole
-- snapshot into the active beat.
ALTER TABLE chapter_versions
  ADD COLUMN IF NOT EXISTS beats JSONB NOT NULL DEFAULT '[]';
```

- [x] **Step 2: Update `ChapterVersion` type**

In `src/types/project.ts`, add `beats`:

```typescript
export interface ChapterVersion {
  id: string
  chapter_id: string
  prose: string
  word_count: number
  change_summary: string
  beats?: BeatOutline[]
  created_at?: string
}
```

- [x] **Step 3: Update database types**

In `src/lib/database.types.ts`, add `beats: Json` to `chapter_versions.Row`, `Insert`, and `Update` shapes matching the local style in that file.

- [x] **Step 4: Extend `createChapterVersion` signature**

In `src/store/parts/chapters.ts`, change:

```typescript
createChapterVersion: (chapterId: string, prose: string, wordCount: number, summary: string) => Promise<void>
```

to:

```typescript
createChapterVersion: (
  chapterId: string,
  prose: string,
  wordCount: number,
  summary: string,
  beats?: Chapter['beats']
) => Promise<void>
```

Insert:

```typescript
beats: beats ?? []
```

into the `chapter_versions` insert payload.

- [x] **Step 5: Pass beats when taking snapshots**

In `src/hooks/useBeatWriter.ts`, change auto-snapshot and destructive edit snapshots from:

```typescript
createChapterVersion(chapter.id, fullProse, wordCount, 'Auto-Snapshot (15 Menit)')
```

to:

```typescript
createChapterVersion(
  chapter.id,
  fullProse,
  wordCount,
  'Auto-Snapshot (15 Menit)',
  freeWriteMode ? [] : chapter.beats ?? []
)
```

Apply the same fifth argument for "Sebelum AI Magic Edit" and "Sebelum AI Director's Cut" in `ProseWriterPanel.tsx`.

- [x] **Step 6: Change modal restore callback shape**

In `VersionHistoryModal.tsx`, change prop:

```typescript
onRestore: (prose: string) => void
```

to:

```typescript
onRestore: (version: ChapterVersion) => void
```

Change:

```typescript
onRestore(selected.prose)
```

to:

```typescript
onRestore(selected)
```

- [x] **Step 7: Restore whole chapter in `ProseWriterPanel.tsx`**

Import `updateChapter` from store:

```typescript
const updateChapter = useProjectStore((s) => s.updateChapter)
```

Change `onRestore`:

```typescript
onRestore={async (version) => {
  const restoredBeats = version.beats && version.beats.length > 0
    ? version.beats
    : chapter.beats

  await updateChapter(chapter.id, {
    prose: version.prose,
    word_count: version.word_count,
    beats: freeWriteMode ? chapter.beats : restoredBeats,
    status: version.prose.trim().length > 10 ? 'DRAFT' : 'GENERATING',
    prose_source: freeWriteMode ? 'MANUAL_WRITE' : 'MIXED'
  })
}}
```

- [x] **Step 8: Replace native confirm later**

Keep `window.confirm` for this task if necessary to avoid widening scope. Create a follow-up note in `task.md` to migrate this modal to `PremiumConfirmModal`.

- [x] **Step 9: Run checks**

Controller note: Subagent review on 2026-05-27 found stale editor-buffer and mode-dependent beat snapshot risks. Follow-up patch now clears pending generation/save timers on restore, syncs `activeProse`, always stores beats in snapshots, and validates `chapter_versions.beats` JSON before exposing it as `ChapterVersion.beats`.

```powershell
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 10: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains dirty and commits require careful staging around pre-existing edits.

```powershell
git add supabase/schema.sql src/lib/database.types.ts src/types/project.ts src/store/parts/chapters.ts src/hooks/useBeatWriter.ts src/components/modals/VersionHistoryModal.tsx src/components/workspace/ProseWriterPanel.tsx
git commit -m "fix: restore version snapshots as whole chapters"
```

---

### Task 11: Documentation And Final Verification

**Files:**
- Modify: `task.md`
- Modify: `walkthrough.md`
- Modify: `architecture.md` only for RAG prose wiring and version snapshot schema.

- [x] **Step 1: Update `task.md`**

Add a new section:

```markdown
# Engine Hardening - Pre Continuity Gate

## Status: Completed

### Checklist Per File
- [x] `src/store/parts/chapters.ts` - demo/offline update guard and version snapshot beats.
- [x] `src/hooks/useBeatWriter.ts` - Free Write offline replay and RAG prose input.
- [x] `src/services/batch-generator.ts` - awaited memory tasks between chapters.
- [x] `src/services/prose-context.ts` - async RAG prose helper.
- [x] `src/prompts/prose-writer.ts` - Layer 3 RAG prompt block.
- [x] `src/store/useChatStore.ts` - duplicate approval and unknown state target guard.
- [x] `src/services/state-tracker.ts` - canonical character IDs only.
- [x] `src/store/parts/outlines.ts` - cliffhanger variety validation.
- [x] `src/pages/Workspace.tsx` - compass effect dependencies.
- [x] `supabase/schema.sql` - `chapter_versions.beats` migration.

### Verification
- [x] `npm.cmd run test`
- [x] `npx.cmd tsc -b --noEmit`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run build`
```

- [x] **Step 2: Update `architecture.md`**

Add concise notes:

```markdown
### Prose Layer 3 RAG Injection

The Prose Writer now receives optional Layer 3 long-term memory through
`buildProseInputWithRag()`. This helper wraps the existing synchronous
`buildProseInput()` path, performs best-effort chapter-summary retrieval,
and falls back to the base prompt when RAG is unavailable.

### Version History Beat Snapshots

`chapter_versions` stores both full `prose` and `beats` JSONB. Full chapter
restore uses the stored beat snapshot in Beat-by-Beat mode so old versions
do not get dumped into the active beat.
```

- [x] **Step 3: Update `walkthrough.md`**

Add a dated entry:

```markdown
## 2026-05-25 - Engine Hardening Before Continuity Gate

Fixed batch memory ordering, demo-mode Supabase noise, Free Write offline
draft replay, prose RAG injection, Co-Author duplicate approval state,
character state UUID safety, cliffhanger validation, Workspace hook deps,
and whole-chapter version restore.
```

- [x] **Step 4: Run full verification**

```powershell
npm.cmd run test
npx.cmd tsc -b --noEmit
npm.cmd run lint
npm.cmd run build
```

Expected:
- Vitest: all tests pass.
- TypeScript: zero errors.
- ESLint: zero errors and zero warnings.
- Build: succeeds.

- [ ] **Step 5: Final manual smoke checks**

Controller note: Deferred on 2026-05-27. Mechanical verification is green, but full smoke requires an interactive app session with project data, Supabase/API-key configuration, offline/reconnect toggling, and real AI calls.

Run:

```powershell
npm.cmd run dev
```

Check:
- Demo mode typing prose does not spam Supabase errors.
- Free Write offline draft restores and syncs after reconnect.
- Batch two chapters waits for background memory tasks.
- Prose prompt includes RAG memory when chapter summaries exist.
- Duplicate Co-Author draft remains pending.
- Workspace lint warning is gone.

- [ ] **Step 6: Commit**

Controller note: Deferred on 2026-05-27 because the workspace remains mixed/dirty and needs careful staging around pre-existing edits.

```powershell
git add task.md walkthrough.md architecture.md
git commit -m "docs: record engine hardening changes"
```

---

## Self-Review

Spec coverage:
- Auto-Pilot stale memory is covered by Task 4.
- Demo/offline Supabase update noise is covered by Task 3.
- Free Write offline sync is covered by Task 2.
- Missing RAG in prose is covered by Task 5.
- Co-Author duplicate approval state is covered by Task 6.
- Non-UUID character states are covered by Task 7.
- Cliffhanger validation gap is covered by Task 8.
- Workspace hook warning is covered by Task 9.
- Version restore correctness is covered by Task 10.
- Docs and verification are covered by Task 11.

Known deferred work:
- Prose Continuity Gate and Repair Loop are intentionally not part of this plan.
- Timeline Ledger and long-series consistency score should start only after this hardening lands.
- `window.confirm` in `VersionHistoryModal` remains a follow-up unless the user wants UI polish included in this hardening batch.
