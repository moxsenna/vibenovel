# VibeNovel v2 — Session Reports

---

## Session: Sprint 1C — Brainstorm Agent (Real AI)
**Date**: 2026-05-21  
**Duration**: ~15 minutes  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Prompt Builder (`src/prompts/brainstorm-agent.ts`)
- Created `buildCoAuthorSystemInstruction(compassState, currentGap)` — a dynamic system prompt builder that generates persona-rich instructions for the Gemini API based on current Story Compass completion state.
- Implemented `detectCompassGap()` — scans through 5 mandatory elements (Premise, Protagonist, Antagonist, Ending, Mystery Layer) and returns the first missing gap.
- Implemented `getCoAuthorMode()` — returns SETUP (if gaps exist) or CONSULTATION (if complete).
- Each gap has specific guidance with example `<DRAFT_DATA>` JSON templates for the AI to follow.
- Enforced KBM Melodrama constraints in the system prompt: high emotional stakes, short paragraphs, dialog-heavy, cliffhanger culture.
- Anti-melantur rules baked into the system instruction: AI must redirect off-topic conversations, and after 3x off-topic, must forcefully propose a draft.

#### STEP 2: Compass UI Extraction (`src/components/compass/StoryCompassPreview.tsx`)
- Extracted ~140 lines of inline Story Compass rendering from `ContextPanel.tsx` into a standalone, reusable component.
- Features: 5-step segmented progress bar, pulsating gap indicator ("Yuk isi ini dulu!"), character chips for Protagonist/Antagonist, and a "Story Compass Lengkap!" CTA when all 5 elements are filled.
- Updated `ContextPanel.tsx` to import and render `StoryCompassPreview` cleanly in brainstorm mode, reducing the file by ~130 lines.

#### STEP 3: AI Router Integration (`src/services/ai/ai-router.ts`)
- Updated `chatCoAuthor()` to accept the dynamic `systemInstruction` from the prompt builder.
- Implemented robust `<DRAFT_DATA>` XML parsing with:
  - Markdown code fence cleanup (models sometimes wrap JSON in triple backticks)
  - Trailing comma removal (common LLM artifact)
  - Type validation (only accepts `character`, `item`, `world_rule`, `ending`, `mystery`)
  - Graceful fallback: if JSON parse fails, the chat reply still shows without a draft card.

#### STEP 4: Chat Store Refactor (`src/store/useChatStore.ts`)
- **BYOK Guard**: If no Gemini keys are configured, returns a friendly system message with a link to Google AI Studio.
- **Real AI Connection**: Replaced the entire mock `setTimeout` responder (~180 lines of hardcoded responses) with a single `aiRouter.chatCoAuthor()` call.
- **Compass State Injection**: Before each AI call, builds a `CompassState` snapshot from `useProjectStore` and passes it through `buildCoAuthorSystemInstruction()` to detect the current gap.
- **Draft Data Mapping**: AI-generated draft data is mapped to `ChatMessage.draftData` with `status: 'pending'`, which triggers the existing `ApprovalCard` UI.
- **Anti-Melantur Counter**: Tracks consecutive off-topic turns per project. After 3x, injects a forceful system prompt override. Resets when a draft is proposed or on-topic discussion resumes.
- **Approval Flow**: "Setuju!" button executes the same optimistic UUID syncing CRUD operations built in Sprint 1A (`addCharacter`, `addItem`, `addWorldRule`, `updateProject` for ending, local `setState` for mystery layers).
- **Error Handling**: Rate limit (429), missing key, and generic errors all produce user-friendly Indonesian messages.

### Challenges Encountered
- **None significant.** The existing architecture from Sprint 1A/1B was clean and well-structured, making the integration straightforward.
- The `ContextPanel.tsx` extraction required careful attention to ensure the removed compass calculations didn't break remaining modes (Outline, Write, Review).

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)**
- `npm run build` → **SUCCESS (Zero errors, 999ms build)**
  - Bundle: 680.97 KB JS (199.16 KB gzipped), 69.05 KB CSS (10.90 KB gzipped)
  - Chunk size warning is informational; code splitting deferred to Sprint 10.

### Files Created
| File | Lines | Description |
|---|---|---|
| `src/prompts/brainstorm-agent.ts` | ~220 | Dynamic system prompt builder with gap detection |
| `src/components/compass/StoryCompassPreview.tsx` | ~210 | Modular Story Compass preview component |

### Files Modified
| File | Change Summary |
|---|---|
| `src/store/useChatStore.ts` | Full rewrite: mock → real AI, BYOK guard, anti-melantur |
| `src/services/ai/ai-router.ts` | Robust DRAFT_DATA parsing with JSON cleanup |
| `src/components/workspace/ContextPanel.tsx` | Import StoryCompassPreview, remove ~130 lines of inline code |

### Next Steps (Sprint 1D — Outline Engine)
- Generate rich outline per chapter using Gemini with the 20+ field schema.
- Build Season Architect panel with outline cards.
- Implement 5 entry points (batch, single regenerate, manual, import, range).

---

## Session: Sprint 1D — Outline Engine (Real AI)
**Date**: 2026-05-21  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Prompt Builder (`src/prompts/outline-engine.ts`)
- Created `buildOutlineSystemInstruction()` to enforce all 5 KBM Retention Engine principles (Layered Mystery, Emotional Rollercoaster, Hook Chain, False Resolution, Character Investment) and Dopamine Cycle.
- Created `buildOutlineUserPrompt()` to serialize the full Story Compass state, including active characters, items, mystery layers with breadcrumbs, and previous chapter contexts.

#### STEP 2: KBM Pacing Validator (`src/lib/kbm-pacing.ts`)
- Implemented `validateEmotionalPattern()` to detect monotonous emotion sequences (e.g., 3 consecutive identical tones, 5 chapters without breathers).
- Implemented `validateCliffhangerVariety()` to ensure cliffhanger types are varied.
- Designed the validator to be **warning-only** (non-blocking) to prevent excessive API costs and generation delays.

#### STEP 3 & 4: AI Types and Router Refactor (`src/services/ai/types.ts`, `src/services/ai/ai-router.ts`)
- Enriched `OutlineGenerateInput` to accept structured objects rather than raw strings.
- Refactored `aiRouter.generateChapterOutline()` to use the new prompt builder.
- Added a JSON parsing retry mechanism with stricter prompts if the initial response contains markdown fences or invalid JSON.

#### STEP 5: Project Store Outline Actions (`src/store/useProjectStore.ts`)
- Added comprehensive CRUD and batch generation actions (`generateOutlineBatch`, `regenerateOutline`, `addChapter`, `lockOutline`, `deleteChapter`).
- Implemented **Sequential Await** logic for batch generation: outlines are generated one by one, passing the previous chapter's context to the next, preventing AI amnesia.
- Added an **Emergency Stop** (`abortOutlineGeneration`) flag to allow users to cancel long-running batch generations.

#### STEP 6: Chapter Outline Card (`src/components/workspace/ChapterOutlineCard.tsx`)
- Built an interactive, expandable card component using Framer Motion.
- Display features: status badges, emotional tone chips, cliffhanger types, and complete 20+ field outline details.
- Action features: single chapter regeneration, functional manual edit (saves to Zustand/Supabase with a `MANUAL` flag), locking, and deletion.

#### STEP 7 & 8: Season Architect Panel (`src/components/workspace/SeasonArchitectPanel.tsx`, `src/pages/Workspace.tsx`)
- Replaced the static outline view in Workspace with the full-featured `SeasonArchitectPanel`.
- Created a dynamic range selector for batch generation (allowing users to pick custom start and end chapters).
- Implemented real-time progress tracking UI with status indicators (✅ generated, 🔄 current, ⬜ pending) and summary warnings from the pacing validator.

### Design Decisions Honored
- **Batch Outline Range**: Dynamic (start-end inputs) rather than hardcoded 1-20.
- **Emotional Rollercoaster Validator**: Warning-only (warnings are shown in the UI and injected into the next chapter's prompt for self-correction).
- **Manual Outline Entry**: Functional (users can edit and save outlines directly).
- **Season/Sub-Arc Auto-Generation**: Handled via a JSON string field (`arcPosition`) on the chapter level rather than complex relational tables.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)**
- `npm run build` → **SUCCESS (Zero errors, ~680ms build)**

### Files Created
| File | Lines | Description |
|---|---|---|
| `src/prompts/outline-engine.ts` | ~190 | Dedicated prompt builder for the outline engine |
| `src/lib/kbm-pacing.ts` | ~160 | Rules-based warning-only pacing validator |
| `src/components/workspace/ChapterOutlineCard.tsx` | ~390 | Expandable, interactive chapter outline card |
| `src/components/workspace/SeasonArchitectPanel.tsx` | ~290 | Full-featured outline batch manager UI |

### Files Modified
| File | Change Summary |
|---|---|
| `src/services/ai/types.ts` | Enriched outline generation input interfaces |
| `src/services/ai/ai-router.ts` | Prompt builder integration and JSON parse retries |
| `src/store/useProjectStore.ts` | Batch generation loop, CRUD actions, sequential await, emergency stop |
| `src/pages/Workspace.tsx` | Replaced inline outline cards with SeasonArchitectPanel |

### Next Steps (Sprint 2A — Beat-by-Beat Prose Writer)
- Build the core Prose Writer engine using Gemini/OpenRouter (Claude).
- Implement interactive prose canvas (BeatEditor).
- Combine outline beats with the previous chapter's sliding window to generate immersive text.

---

## Session: Sprint 2A — Beat-by-Beat Prose Writer
**Date**: 2026-05-22  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Setting up Types & Prompt Builder
- Modified `src/services/ai/types.ts` to include models (`ProseModelChoice`) and `ProseGenerateInput`.
- Created `src/prompts/prose-writer.ts` containing the KBM Melodrama Protocol to enforce short paragraphs, dialogue-heavy beats, and seamless text continuity.

#### STEP 2: Upgrading AI Routers for Streaming
- Modified `src/services/ai/gemini-pool.ts` by adding `generateContentStream()` for SSE-based streaming token delivery.
- Modified `src/services/ai/openrouter-adapter.ts` with `stream: true` to support chunk-by-chunk writing (for Claude/Deepseek models).
- Updated `src/services/ai/ai-router.ts` to provide an AsyncGenerator `generateProseBeatStream()` that automatically routes to the chosen provider.

#### STEP 3: Hooks & State Management
- Updated `src/store/useSettingsStore.ts` to persistently store `activeProseModel` (Gemini, Claude, or Deepseek).
- Created `src/hooks/useBeatWriter.ts` to orchestrate streaming, dynamic beat indices, and implement a **Debounced Save** (saving to Zustand/Supabase automatically after 2 seconds of inactivity to prevent data loss).

#### STEP 4 & 5: Beat UI Components & Workspace Assembly
- Created `src/components/prose/BeatIndicator.tsx` to handle dynamic progress bar rendering based on the number of `keyEvents`.
- Created `src/components/prose/ProseToolbar.tsx` with a Quick Toggle dropdown for AI models and an auto-save indicator.
- Created `src/components/prose/BeatEditor.tsx` with a flexible text area that auto-scrolls during streaming generation and accepts manual edits.
- Created `src/components/workspace/ProseWriterPanel.tsx` to integrate all of the above.
- Refactored `src/pages/Workspace.tsx` to use the clean `<ProseWriterPanel />` and removed unused legacy placeholder logic.

### Design Decisions Honored
- **Provider Toggle UI**: Quick toggle in the Prose Toolbar (supports Gemini, Claude 3.5 Sonnet, Deepseek v4 Flash).
- **Jumlah Ketukan (Beats)**: Dynamic (mapped 1:1 with `key_events` from the Outline generation).
- **Auto-Save**: Debounced per beat (saving locally and syncing to the cloud automatically).
- **Architecture Guardrail**: Implemented real-time STREAMING via SSE instead of blocking UX.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)**
- `npm run build` → **SUCCESS (Zero errors)**

### Next Steps (Sprint 2B — State Tracker & Context Injection Upgrade)
- Generate state snapshot automatically after a chapter finishes writing.
- Display the State Snapshot in the Write mode Context Panel.
- Read and inject previous character states directly from Supabase (expanding the 4-layer memory).

---

## Session: Sprint 2B — State Tracker & Context Injection Upgrade
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Type Expansion & State Structures
- Modified `src/types/project.ts` to expand `CharacterState` interface with 5 new crucial fields (3 wajib: `knowledge_state`, `active_goal`, `secrets`; 2 opsional: `appearance_notes`, `alliances`).
- Expanded `ProseGenerateInput` and `BrainstormResponse` in `src/services/ai/types.ts` to support character states and the `character_state` draft type.

#### STEP 2: State Extraction & Prompt Modul
- Created `src/prompts/state-snapshot.ts` detailing the prompt building instructions for the 10-field character state background extractor, supporting cumulative history injection.
- Created `src/services/state-tracker.ts` using Gemini Core (free) to analyze written chapter prose, perform retries on parsing JSON arrays, and format character states into readable contexts.

#### STEP 3: Store & Sync Actions
- Integrated state persistency into `src/store/useProjectStore.ts` with state selectors (`getLatestStatesForChapter`, `upsertCharacterStates`) and automatic load hooks inside `loadProjectData`.

#### STEP 4: Chat Brainstorming & Draf State Approval
- Updated the Co-Author AI prompt in `src/prompts/brainstorm-agent.ts` to support character state updates.
- Refactored `src/store/useChatStore.ts` to parse the `<DRAFT_DATA>` XML block matching `character_state` draft types.
- Modifed `src/components/chat/AiMessageBubble.tsx` to beautifully display formatted character state updates inside the chat.
- Modified `src/components/chat/ApprovalCard.tsx` with `whitespace-pre-line` support to preserve newlines for complex character states during approvals.

#### STEP 5: Layer 2 & Layer 4 Context Injection
- Upgraded `src/services/ai/context-injector.ts` to deterministic match active characters, pull their latest character states (Layer 2 Dynamic State), and slice the last 500 words of the previous chapter's prose (Layer 4 Sliding Window) within a strict token budget.

#### STEP 6: Hook Integration & Bugfixes
- Integrated the auto-trigger state snapshot generation in `src/hooks/useBeatWriter.ts` that runs in the background immediately after the writing panel transitions to `DRAFT`.
- Cleared a TypeScript compilation warning regarding unused variables inside the hook.

#### STEP 7: UI Panel & Component Assembly
- Created `src/components/compass/StateTimeline.tsx` that renders character states, custom role badges, knowledge tags, collapsible secrets, and manual extraction controls.
- Upgraded `src/components/workspace/ContextPanel.tsx` in Write mode to embed `<StateTimeline />` with direct manual regenerate handlers.
- Modified `src/components/prose/ProseToolbar.tsx` and `ProseWriterPanel.tsx` to pass and display the current background extraction status indicator.

### Design Decisions Honored
- **Manual + Auto Trigger**: Character states are extracted automatically, but can also be manually regenerated using the "🔄 Regenerate State" button in the Context Panel.
- **Co-Author Dinamis**: Co-Author AI can draft and update character states inside the Brainstorm chat, which users can approve, edit, or reject.
- **10-Field Schema**: Tracks exact location, condition, goals, secrets, appearance notes, and alliances to prevent plot holes.
- **Zero Flickering**: Seamless state updates sync in-memory (Zustand) and persistently (Supabase) without layout shifts.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)**
- `npm run build` → **SUCCESS (Zero errors, ~551ms build)**

### Next Steps (Sprint 3A — Plot Radar & Lore Extraction)
- Build dynamic timeline tracker (Plot Radar) for subplot arcs.
- Implement automated lore-extraction logic from prose to Lorebook items.

---

## Session: Refactoring — Zustand Parts Modularization (useProjectStore Refactor)
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Creating Modular Parts Directory
- Created `src/store/parts/` directory to house clean, modular store parts, completely replacing the monolith pattern while retaining simple, human-friendly naming (no dry jargon like "Zustand Slice Pattern").

#### STEP 2: Extraction of Modul Proyek (`projects.ts`)
- Created `src/store/parts/projects.ts` containing the core states for active projects and full CRUD database sync handlers (`loadProjects`, `loadProjectData`, `addProject`, `updateProject`, `deleteProject`).

#### STEP 3: Extraction of Modul Bab (`chapters.ts`)
- Created `src/store/parts/chapters.ts` housing the active chapters lists, optimistic state handlers, loading overlays, and parallel loading logic.

#### STEP 4: Extraction of Modul Pustaka Lore (`lorebook.ts`)
- Created `src/store/parts/lorebook.ts` to manage all 4 layers of story lore: Characters, Character States (Layer 2), Items, World Rules, Mystery Layers, and Plot Threads.

#### STEP 5: Extraction of Modul Outline (`outlines.ts`)
- Created `src/store/parts/outlines.ts` managing outlines, batch pacing validators, sequential generators, and dynamic progress bar indicators.

#### STEP 6: Reconstructing Main Store (`useProjectStore.ts`)
- Refactored `src/store/useProjectStore.ts` into a lightweight, 20-line global orchestrator that imports and merges all 4 parts, maintaining transparent, backwards-compatible exports for all UI components.

#### STEP 7: Fixing PostgreSQL / Supabase Client Type Mismatches
- Avoided TS compiler failures by casting `_supabase as any` in each module, exactly mirroring the original monolith's bypass.
- Moved `OutlineProgress` structure to `src/types/project.ts` to share cleanly across the UI and store files.
- Resolved `getArcPosition` unused variable warning by exporting it as a modular helper.

### Verification Results
- **TypeScript**: `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- **Production Build**: `npm run build` → **SUCCESS (Zero errors, ~1.38s build)** ✅
- **Graphify watch**: Rebuilt AST code topology successfully with 713 nodes and 981 edges!

---

## Session: Sprint 3A — Plot Radar & Lore Extraction
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: AI Prompt Templates (`src/prompts/plot-radar.ts`, `src/prompts/lore-extractor.ts`)
- Created `buildPlotRadarSystemInstruction` and `buildPlotRadarUserPrompt` to evaluate 4 critical QA criteria: Plot Hole, Emotional Impact Validator (Filler), Chekhov's Gun Tracker, and Log Persistence.
- Created `buildLoreExtractorSystemInstruction` and `buildLoreExtractorUserPrompt` to automatically extract new Characters, Items, and World Rules from newly written prose.

#### STEP 2: Service Layer & AI Router (`src/services/ai/ai-router.ts`)
- Modified `aiRouter.runQARadar()` to accept chapter prose and previous context, returning an array of structured `QaLog` objects.
- Registered `aiRouter.extractLore()` to parse JSON results for newly extracted lore entities from Gemini.

#### STEP 3: State Management & Hooks (`src/hooks/usePlotRadar.ts`, `src/hooks/useLoreExtractor.ts`, `src/store/parts/lorebook.ts`)
- Created `usePlotRadar.ts` and `useLoreExtractor.ts` as orchestrator hooks connecting the AI router to Zustand and the UI.
- Updated `lorebook.ts` to hold `extractedLore` globally, allowing any component (like the global modal) to consume it.
- Upgraded `src/hooks/useBeatWriter.ts` to trigger a `Promise.all` background execution of State Snapshot Generation, Plot Radar QA, and Lore Extraction automatically when the chapter is finished (status `DRAFT`).

#### STEP 4: UI Components (`src/components/workspace/ReviewPanel.tsx`, `src/components/modals/LoreDiffModal.tsx`)
- Created `ReviewPanel.tsx` to serve as a Prose Reader + QA Logs viewer side-by-side in the Review Mode Canvas, rendering color-coded severity badges (CRITICAL, EMOTION_FLAT, etc).
- Created `LoreDiffModal.tsx` as an interactive Framer Motion popup overlay that appears automatically when new lore is detected, allowing the user to approve and save them all at once into the project.
- Replaced the hardcoded legacy review canvas inside `src/pages/Workspace.tsx` with the new modular `<ReviewPanel />`.

#### STEP 5: Refactoring & Cleanup
- Fixed all TypeScript `verbatimModuleSyntax` errors (`import type`).
- Removed obsolete unused state variables (`runningQa`, `setQaLogs`, `handleRunQa`, `activeChapterNumber`) from `Workspace.tsx`.
- Addressed missing payload properties (`project_id`, `current_owner`) for `addCharacter`, `addItem`, and `addWorldRule` in `LoreDiffModal.tsx`.

### Verification Results
- **TypeScript**: `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- **Production Build**: `npm run build` → **SUCCESS (Zero errors, ~1.51s build)** ✅
  - New bundle chunk sizes are optimized and no breaking layout shifts occur.

### Next Steps (Sprint 3B — Review Mode & PWA)
- Convert web app to a Progressive Web App (PWA) with Service Workers.
- Finalize the interactive editor inside Review Mode.


---

## Session: Sprint 3B — Review Mode & PWA
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### Phase 1: Review Mode Upgrade
- Created `src/components/compass/ThreadTrackerPanel.tsx` (~85 lines) as a read-only list of `plotThreads` from the project store, with status badges (PLANTED/ACTIVE/RESOLVED/ABANDONED), urgency dots (CRITICAL pulsing animation), and a friendly empty state pointing to Sprint 7 for auto-detection.
- Created `src/components/compass/EmotionalArcPreview.tsx` (~110 lines) with one row per chapter: chapter number + tone label + colored dot mapped across 8 tone categories (CONFLICT, RELIEF, DOPAMINE, SHOCK, BREATHER, etc), plus a dopamine ⚡ marker, active-chapter highlight, and a color legend at the bottom.
- Created `src/components/ui/QaSeverityFilter.tsx` (~70 lines) — tab chip filter (Semua / Plot Hole / Emosi / Chekhov / Filler) with Framer Motion `layoutId="qaFilterActive"` underline animation, count badges per tab, and auto-disable for empty tabs.
- Rewrote `src/components/workspace/ReviewPanel.tsx` from a flat layout into a **3-column desktop layout** (Prose 5fr / QA 3fr / Konteks 2fr) and a **mobile tab switcher** (Prosa / QA / Konteks) using `AnimatePresence` for section transitions. Wired up `QaSeverityFilter`, `ThreadTrackerPanel`, and `EmotionalArcPreview`. Preserved the existing "Jalankan Pemindaian" Plot Radar button and analyzing state.

#### Phase 2: PWA Setup
- Installed `vite-plugin-pwa@1.3.0` as a devDependency.
- Configured `vite.config.ts` with the `VitePWA` plugin:
  - `registerType: 'autoUpdate'` for seamless service worker updates.
  - Manifest: name, short_name "VibeNovel", theme_color `#1a1c2c`, background_color `#0f1019`, display "standalone", orientation "portrait", lang "id", icons referencing `favicon.svg` for both `any` and `maskable` purposes.
  - Workbox runtime caching strategies:
    - Google Fonts CSS → `StaleWhileRevalidate` (7 days)
    - Google Fonts files → `CacheFirst` (1 year)
    - Supabase REST API → `NetworkFirst` (10s timeout, 1 day fallback cache)
    - Supabase Auth → `NetworkFirst` (5s timeout, 5 min cache)
    - Gemini & OpenRouter APIs → `NetworkOnly` (intentionally never cached because responses are context-dependent)
    - Local images & fonts → `CacheFirst` (30 days)
- Updated `index.html` with PWA meta tags: dual `theme-color` for dark/light mode, `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `mobile-web-app-capable`, and a `description`.
- Created `src/components/ui/PwaUpdatePrompt.tsx` (~110 lines): a Framer Motion toast bottom-right with two states — "Versi Baru Tersedia — Reload" (manual dismiss) and "Siap Dipakai Offline" (auto-dismiss 4s). Uses `useRegisterSW` from `vite-plugin-pwa/react`.
- Mounted `<PwaUpdatePrompt />` in `src/main.tsx`.
- Added `vite-plugin-pwa/client` and `vite-plugin-pwa/react` to `tsconfig.app.json` types so the `virtual:pwa-register/react` virtual module resolves.

#### Phase 3: Offline Draft Fallback
- Created `src/hooks/useOfflineDraft.ts` (~155 lines):
  - Subscribes to `online`/`offline` browser events plus `navigator.onLine`.
  - `saveDraft(chapterId, beatIndex, text)` stores a JSON payload in localStorage under `vn_draft_{chapterId}_{beatIndex}` with a timestamp.
  - `loadDraft(chapterId, beatIndex)` returns the cached payload if any.
  - `clearDraft(chapterId, beatIndex)` removes the entry after successful sync.
  - `syncPendingDrafts(callback)` iterates every pending draft, invokes the callback for each, and reports `{ synced, failed }` counts.
  - `listPendingDrafts()` helper for inspection.
- Modified `src/components/prose/BeatEditor.tsx`:
  - Added `chapterId` prop.
  - Header badge "🔌 Offline · Tersimpan Lokal" displayed when `!isOnline`.
  - Restore prompt panel with timestamp + Pulihkan/Buang buttons when a draft is found that's longer than the current prose.
- Modified `src/components/workspace/ProseWriterPanel.tsx` to pass `chapterId` to BeatEditor.
- Modified `src/hooks/useBeatWriter.ts`:
  - Imported `useOfflineDraft` and pulled `isOnline`, `saveDraft`, `clearDraft`, `syncPendingDrafts`.
  - On debounced save: if offline, persist text to localStorage via `saveDraft` before calling `updateChapter`. If online, call `clearDraft` after the update succeeds.
  - Background AI tasks (state snapshot, plot radar, lore extraction) are skipped when offline to save bandwidth and avoid wasted retries.
  - Added a `useEffect` that flushes all pending drafts via `syncPendingDrafts` whenever `isOnline` toggles to true. Each draft is replayed via `updateChapter` and only cleared from localStorage on success.

### Challenges Encountered
- **None significant.** The PWA plugin integration was straightforward thanks to the clean Vite config established in Sprint 1A. The biggest decision was whether to generate PNG icons or reference the SVG directly — chose SVG to honor the user's "pakai yg ada dulu" decision and defer PNG variants to Sprint 9 polish.
- The TypeScript virtual module type for `virtual:pwa-register/react` required adding `vite-plugin-pwa/react` to `tsconfig.app.json` types array (not just `vite-plugin-pwa/client`).

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (462ms)** ✅
  - `dist/manifest.webmanifest` (0.45 KB)
  - `dist/sw.js` + `dist/workbox-*.js` (5.65 KB workbox runtime)
  - 8 precache entries totaling 851.64 KiB
  - Main bundle 765.88 KB (221.10 KB gzipped) — chunk size warning is informational, code splitting deferred to Sprint 10.

### Files Created
| File | Lines | Description |
|---|---|---|
| `src/components/compass/ThreadTrackerPanel.tsx` | ~85 | Read-only plot threads list with status & urgency badges |
| `src/components/compass/EmotionalArcPreview.tsx` | ~110 | Compact tone-per-chapter list with color dots and legend |
| `src/components/ui/QaSeverityFilter.tsx` | ~70 | Animated tab chip filter for QA logs |
| `src/components/ui/PwaUpdatePrompt.tsx` | ~110 | Toast for SW update + offline-ready notification |
| `src/hooks/useOfflineDraft.ts` | ~155 | localStorage draft queue with online/offline event handling |

### Files Modified
| File | Change Summary |
|---|---|
| `src/components/workspace/ReviewPanel.tsx` | Full rewrite into 3-column desktop + mobile tab layout |
| `src/components/prose/BeatEditor.tsx` | Offline badge + restore prompt + `chapterId` prop |
| `src/components/workspace/ProseWriterPanel.tsx` | Pass `chapterId` to BeatEditor |
| `src/hooks/useBeatWriter.ts` | Offline-aware debounced save + sync-on-reconnect effect |
| `src/main.tsx` | Mount `PwaUpdatePrompt` at root |
| `vite.config.ts` | Add VitePWA plugin with manifest + workbox runtime caching |
| `index.html` | PWA meta tags (theme-color, apple-touch-icon, etc.) |
| `tsconfig.app.json` | Add PWA virtual module types |

### Manual Verification Pending (User-Side)
- Chrome DevTools → Application → Manifest valid + Service Worker registered & activated.
- Chrome desktop "Install" prompt appears.
- Offline flow test: Network → Offline → type in BeatEditor → reload → restore prompt appears → toggle Online → console logs sync count + drafts cleared.

### Next Steps (Sprint 4 — Pro Writer Features)
- Build the 4-step Import Wizard (paste/upload manuscript → AI analyze → review draft Compass → confirm).
- Implement Free Write mode (canvas without enforcement).
- Build Director's Cut Modal (3 rewrite variants per selection).
- Wire surgical inline edit per text selection.


---

## Session: QA Cleanup — Sprint 1A → 3B Hardening
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors/warnings

### What Was Done

A comprehensive QA pass across all code shipped between Sprints 1A–3B, addressing 102 ESLint errors + 4 warnings that had accumulated because `npm run lint` was never part of the verification gate.

#### Phase 1: React Hooks Correctness (5 critical violations fixed)
- **`ProseWriterPanel.tsx`**: Refactored to call `useBeatWriter` unconditionally by extracting an inner component (`ProseWriterInner`) gated on a non-null `chapter`. Eliminates the `hooks/rules-of-hooks` violation that risked corrupting hook order on chapter switches.
- **`ContextPanel.tsx`**: Moved `localStateGenStatus` `useState` call above the `if (!activeProject) return null` early-return so hook order is stable.
- **`ReviewPanel.tsx`**: Hoisted the inline `MobileTabs` sub-component to module scope (it was being recreated on every render). Wrapped `allLogs` in `useMemo` to stabilise its identity for the downstream `useMemo` of `filteredLogs`.
- **`useBeatWriter.ts`**: Re-ordered declarations so `triggerStateGeneration` is wrapped in `useCallback` and declared *before* the effects that reference it, eliminating the "accessed before declared" closure trap. Replaced the setState-in-effect for `stateGenStatus` reset with the prev-prop-during-render pattern, eliminating cascading-render warnings. Removed obsolete `eslint-disable-next-line` directives.
- **`BeatEditor.tsx`**: Replaced the setState-in-effect that drove the offline-draft restore prompt with the same prev-prop-during-render pattern keyed on `${chapterId}__${beatIndex}`.
- **`useAuth.ts`**: Initialised `loading` lazily based on `isSupabaseConfigured()` so demo mode never enters the loading state — removing the need for setState-in-effect on the demo path.

#### Phase 2: BYOK Security
- **`gemini-pool.ts`**: Replaced every `console.warn`/`console.error` that logged `key.substring(0, 8)` (which leaked 4 characters of the actual API key secret) with a `keyLabel(pool, key)` helper that emits non-sensitive `key #N` indices. AGENTS.md aturan #3 compliance.
- **`AGENTS.md`**: Updated rule #3 — dropped the inaccurate "terenkripsi pasif" claim about Zustand persist (it's plain JSON in localStorage, not encrypted) and added an explicit ban on logging any portion of API key values.

#### Phase 3: Type Safety
- **Centralised loose Supabase typing**: Added `supabase` (loose `SupabaseClient<any, 'public'>`) and `supabaseStrict` (strictly typed) exports in `src/lib/supabase.ts`. The strict client's generic chaining collapses table builders to `never` at insert/update sites under the current TS toolchain, so the storefront CRUD layer uses the loose client with row-shape assertions while leaving the strict client available for analytics queries that benefit from full inference.
- **Eliminated 80+ `as any` casts** across `src/store/parts/{projects,chapters,lorebook,outlines}.ts`, `src/services/ai/{ai-router,gemini-pool,openrouter-adapter,types}.ts`, `src/services/state-tracker.ts`, `src/components/{chat,modals,workspace}/*.tsx`, `src/store/useChatStore.ts`, and `src/types/project.ts`. Replacements use `Record<string, unknown>`, generated `Database['public']['Tables'][...]['Insert' | 'Update']` types, named union narrowings (e.g. `CharacterRole`, `ItemCategory`, `LoreCategory`), and small typed accessor helpers (`str`, `arr`, `num`, `bool`) that narrow `unknown` JSON payloads safely.
- **`useChatStore.ts`**: Centralised draft data validation — the chat store now uses typed accessor helpers when promoting AI-proposed drafts into typed `Character`/`Item`/`WorldRule`/`MysteryLayer`/`CharacterState` records, preventing silent shape drift.

#### Phase 4: Style & Polish
- **`Lobby.tsx`**: Added `loadProjects` to the `useEffect` dependency array (was previously stale-closure prone).
- **`outlines.ts`**: Updated finished-batch status from `'done'` → `'success'` (the actual `OutlineProgress.status` union value).
- **`openrouter-adapter.ts`**: Removed unused `e` parameters in catch blocks; `error: any` → `error: unknown`.
- **`PwaUpdatePrompt.tsx`**: Removed obsolete `eslint-disable-next-line no-console` directive (the eslint config already permits console.info).

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅ (was: 102 errors + 4 warnings)
- `npm run build` → **SUCCESS (512ms)** ✅
  - `dist/manifest.webmanifest`, `dist/sw.js`, `dist/workbox-*.js` all generated
  - 8 precache entries (853.15 KiB)
  - Main bundle: 767.17 KB JS / 83.79 KB CSS (chunk-size warning informational, code splitting still planned for Sprint 10)

### Files Modified (Cleanup-only — no behaviour changes intended)
| File | Why |
|---|---|
| `src/lib/supabase.ts` | Dual export: loose `supabase` + strict `supabaseStrict` |
| `src/store/parts/projects.ts` | Removed `as any`, typed Insert/Update |
| `src/store/parts/chapters.ts` | Removed `as any`, typed Insert/Update, `as unknown as ChapterInsert` for BeatOutline JSON conflict |
| `src/store/parts/lorebook.ts` | Removed `as any`, typed Insert/Update for characters/items/world_rules/character_states |
| `src/store/parts/outlines.ts` | Removed `as any`, error narrowing, status alignment |
| `src/store/useChatStore.ts` | Typed draft promotion with helper accessors |
| `src/services/ai/ai-router.ts` | Typed CoAuthorDraft, ExtractedLore, named union casts |
| `src/services/ai/gemini-pool.ts` | `keyLabel()` helper replaces leaky `substring(0,8)` logs |
| `src/services/ai/openrouter-adapter.ts` | Removed unused catch params, `unknown` errors |
| `src/services/ai/types.ts` | `Record<string, any>` → `Record<string, unknown>` |
| `src/services/state-tracker.ts` | Typed accessor helpers in `parseStateResponse` |
| `src/types/project.ts` | `Record<string, any>` → `Record<string, unknown>` for voice_dna, relationships, arc_position, chapter_end_state |
| `src/components/chat/AiMessageBubble.tsx` | Typed accessor helpers, removed unsafe field reads |
| `src/components/chat/CoAuthorChat.tsx` | Typed `prompt()` value with explicit string narrowing |
| `src/components/modals/LoreDiffModal.tsx` | Typed extracted record helpers + role/category narrowing |
| `src/components/workspace/ChapterOutlineCard.tsx` | Removed `as any`, error narrowing |
| `src/components/workspace/ContextPanel.tsx` | Moved hook above early return, typed select onChange |
| `src/components/workspace/ProseWriterPanel.tsx` | Refactored to gate `useBeatWriter` on a defined chapter |
| `src/components/workspace/ReviewPanel.tsx` | Hoisted MobileTabs to module scope, useMemo for allLogs |
| `src/components/workspace/SeasonArchitectPanel.tsx` | Error narrowing |
| `src/components/prose/BeatEditor.tsx` | Prev-prop-during-render pattern for restore prompt |
| `src/components/ui/PwaUpdatePrompt.tsx` | Removed obsolete eslint-disable directive |
| `src/hooks/useAuth.ts` | Lazy-init loading; eliminated demo-mode setState-in-effect |
| `src/hooks/useBeatWriter.ts` | useCallback ordering, typed voiceDna, error narrowing |
| `src/pages/Lobby.tsx` | Added missing useEffect dep |
| `AGENTS.md` | Honest BYOK rule #3 (no false "encrypted" claim, explicit log ban) |

### Recommendation for Future Sprints
Add `npm run lint` to the per-sprint verification gate alongside `tsc -b --noEmit` and `npm run build` so type-safety and React-hooks regressions are caught immediately rather than accumulating across sprints. The 102→0 cleanup took ~30 minutes; doing it incrementally would have been near-zero overhead.


---

## Session: Sprint 4 — Pro Writer Features
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Import Wizard (4-step flow)
- `src/lib/manuscript-reader.ts` (~110 lines) — file extraction utilities. Plain `.txt` via FileReader (zero deps), `.docx` via dynamic `import('mammoth')`, `.pdf` via dynamic `import('pdfjs-dist')` with worker chunk also lazy-loaded. Hard cap `MAX_INPUT_CHARS = 1.5M` (~300k tokens) with friendly `ManuscriptTooLargeError` + `UnsupportedFileTypeError`.
- `src/lib/manuscript-parser.ts` (~205 lines) — pure-JS pre-processing: `splitChapters` regex (Bab/Chapter/BAB/CHAPTER + Arabic/Roman numerals + 2500-word fallback), `extractCharacterSeeds` (capitalized-token heuristic with Indonesian sentence-noise filter), `estimateCost` (token + call + ETA estimate), `hashText` (SHA-256 base64 short for cache keys), `chunkForAnalysis`, `buildQuickScanSample` (200 words/bab compressed sample).
- `src/lib/import-cache.ts` (~50 lines) — localStorage-backed analysis cache with 7-day TTL, keyed by SHA-256 hash. Re-pasting the same manuscript skips all API calls.
- `src/prompts/import-analyzer.ts` (~210 lines) — Three prompt builders: `buildQuickScanSystemInstruction/UserPrompt` (Tier 1, single call with compressed sample, returns confirmed chapters + characters + theme + synopsis), `buildDeepChapterAnalysisSystemInstruction/UserPrompt` (Tier 2, full chapter prose → 20+ field outline + character states), `buildVoiceDnaCalibrationSystemInstruction/UserPrompt` (calibrate protagonist's voice from 2-3 samples).
- `src/services/import-analyzer.ts` (~245 lines) — orchestrator implementing the two-tier pipeline: hash → check cache → quick scan → deep analyze last chapter + bab 1 + midpoint → voice DNA calibration → cache result. Every async step honours an `AbortSignal`. `onProgress` callback drives the wizard's progress UI with stages (`preflight`, `cache-hit`, `quick-scan`, `deep-analysis`, `voice-dna`, `finalising`, `done`).
- `src/services/ai/ai-router.ts` extended with `quickScanManuscript`, `analyzeImportedChapter`, `calibrateVoiceDna`, all using JSON mode + AbortSignal.
- `src/services/ai/gemini-pool.ts` — added optional `signal` parameter on both `generateContent` and `generateContentStream`. Aborts re-throw `AbortError` immediately rather than retrying.
- `src/services/ai/types.ts` — added `QuickScanResult`, `ImportedChapterData`, `VoiceDnaResult` shapes.
- `src/components/onboarding/ImportWizard.tsx` (~600 lines) — 4-step Framer Motion wizard. Step 1 Upload (drag-drop file input + paste textarea + cost preview chip). Step 2 Analyze (progress bar + cancel button). Step 3 Review (editable character list, theme + ending textareas, chapter list with ✦ markers for deep-analyzed bab). Step 4 Confirm (4 SummaryCards). On confirm: `createProject('IMPORTED')` → import all characters with voice DNA → import items + world rules → import chapters with `outline_source: 'IMPORTED'` + `is_locked: true` → upsert `IMPORTED` character states for deep-analyzed chapters → navigate to new project workspace.
- `src/components/dashboard/ProjectCreationModal.tsx` — "Lanjut Cerita Saya" button now opens `<ImportWizard>` instead of immediately creating a project.
- `src/store/parts/outlines.ts` — `generateOutlineBatch` skips chapters with `outline_source === 'IMPORTED'` with a friendly warning (the existing MANUAL/locked/prose checks already covered most cases, this gives a more accurate message).
- `src/components/workspace/ChapterOutlineCard.tsx` — "📥 Imported" badge + regenerate confirmation that flips `outline_source` to `MANUAL` so the existing regenerate path can proceed.

#### Phase 2 — Free Write Mode
- `src/store/useSettingsStore.ts` — `freeWriteMode: boolean` flag (persisted via Zustand persist middleware).
- `src/components/prose/ProseToolbar.tsx` — toggle button with `lock`/`lock_open` icon and live "Strict"/"Free Write" label.
- `src/hooks/useBeatWriter.ts` — when free write is on: skips auto-init of beats from `key_events`, skips background AI tasks (state snapshot, plot radar, lore extraction). Skipping is conditional: offline mode also disables background AI tasks (carryover from Sprint 3B).
- `src/components/prose/FreeWriteEditor.tsx` (~115 lines) — plain canvas editor with Free Write header chip, offline-aware draft restore (key `vn_draft_{chapterId}_-1` to namespace away from beat editor drafts), auto-grow textarea height.
- `src/components/workspace/ProseWriterPanel.tsx` — renders `<FreeWriteEditor>` instead of `<BeatIndicator>` + `<BeatEditor>` when toggle is active. Synopsis card hidden in free-write mode (less visual noise).

#### Phase 3 — Director's Cut + Inline Edit
- `src/prompts/rewrite.ts` (~135 lines) — KBM-base instruction shared by both flows. Director's Cut variant directives (Tighter, Emotional, Dramatic) each enforce a different rewriting principle while preserving plot facts. Magic Edit prompt narrows to surgical rewrite with custom instruction.
- `src/services/ai/ai-router.ts` — `generateDirectorsCutVariant(variant, input, signal)` returns a streaming AsyncGenerator (Gemini 2.0 Flash). `inlineEdit(input, signal)` is a single non-streaming call to **Gemini 2.0 Flash Lite** for token efficiency on short selections.
- `src/components/modals/DirectorsCutModal.tsx` (~280 lines) — 3-card grid (`md:grid-cols-3`, `grid-cols-1` mobile). Sequential generation: Tighter streams first, then Emotional, then Dramatic. Each card shows live `VariantStatusChip` (Pending/Streaming/Done/Error/Aborted). When user clicks "Pakai" on any variant, `abortRef.abort()` halts pending streams immediately — saves up to 67% tokens. Custom instruction textarea + "Generate Ulang" button restart all 3 with the user's added directive. Trigger management uses prev-prop-during-render + microtask deferral inside `useEffect` to satisfy the React 19 `set-state-in-effect` lint rule.
- `src/components/prose/SelectionToolbar.tsx` (~135 lines) — Floating mini-toolbar (Notion / Medium style) with two buttons: Magic Edit (opens inline prompt input) and Director's Cut (opens modal). Position computed from viewport coordinates supplied by parent. Toolbar uses `position: fixed` and clamps `x` so it never overflows the right edge. Custom `onMouseDown preventDefault` keeps the textarea selection alive while the user clicks the toolbar.
- `src/components/prose/BeatEditor.tsx` — converted to `forwardRef<BeatEditorHandle, ...>` exposing a `replaceSelection(text)` imperative method. Selection tracking via `onSelect` + `onKeyUp` events: computes `start`/`end` from textarea, derives anchor coordinates by mounting a hidden mirror `<div>` that copies the textarea's typography to compute the caret position. Selections shorter than 6 characters don't show the toolbar (avoids accidental triggers).
- `src/components/workspace/ProseWriterPanel.tsx` — wires `<SelectionToolbar>` + `<DirectorsCutModal>` and forwards a ref to `<BeatEditor>` so successful Magic Edits / Director's Cut accepts can splice the prose buffer directly. Magic Edit calls `aiRouter.inlineEdit(...)`, strips quote artifacts, calls `replaceSelection(clean)`. Director's Cut accept path mirrors but uses the variant text from the modal.

#### Phase 4 — Polish
- `src/pages/Workspace.tsx` — header chips: "📥 Imported" appears next to project title when `genesis_mode === 'IMPORTED'`, "🔓 Free Write" appears when `freeWriteMode` is on.

### Token Optimization Strategy (As Implemented)
1. **Local chapter splitter** — regex-based, no AI.
2. **Local stats** — pure JS.
3. **Local character seeds** — capitalized-token heuristic gives the AI a head start (it validates rather than discovers).
4. **Tier 1 Quick Scan** — 1 call, compressed input (200 words/bab × 6000 word cap).
5. **Tier 2 Deep Analysis** — exactly 3 calls max (last chapter + bab 1 + midpoint). Other chapters imported as raw prose with empty outline (lazy-fill on demand).
6. **Cumulative context budget** — quick scan compresses input to single prompt rather than per-chunk re-injection.
7. **localStorage cache** — repeat paste = 0 API calls.
8. **Pre-flight estimate** — wizard shows expected calls + ETA before user confirms.
9. **Sequential variants + cancel** — Director's Cut variants stream one at a time; clicking Pakai aborts the rest.
10. **Flash Lite for Magic Edit** — `gemini-2.0-flash-lite` is cheaper and faster for short selections.

### Challenges Encountered
- **React 19 `set-state-in-effect` rule** — multiple components needed migration to the prev-prop-during-render pattern + `queueMicrotask` deferral inside effects. Cleanest fix: derive trackers via state during render, then trigger async work in an effect keyed on the tracker, with the actual setState-touching calls wrapped in `queueMicrotask`.
- **`erasableSyntaxOnly` tsconfig flag** — broke parameter properties in error subclasses (`ManuscriptTooLargeError`, `UnsupportedFileTypeError`). Refactored to explicit field declarations + assignments.
- **PDF.js worker setup** — `pdfjs-dist` requires `GlobalWorkerOptions.workerSrc` to be set. Resolved with `import('pdfjs-dist/build/pdf.worker.min.mjs?url')` returning a URL string, registered the first time `readPdf` runs. Worker bundles as a separate 1.23MB chunk that only loads on PDF upload.
- **Strictly-typed Supabase + database.types collision** — earlier sessions already worked around this with the loose `supabase` export; the wizard's import payload uses the existing `addChapter`/`addCharacter` helpers, so no new typing pain.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (683ms)** ✅
  - Main bundle: 816.75 KB (235.95 KB gzipped) — +49 KB from Sprint 3B baseline
  - **Lazy-loaded chunks (NOT in main bundle)**:
    - `pdf.worker.min-iDqQPrd3.mjs` — 1232.30 KB (PDF worker, only loads on `.pdf` upload)
    - `pdf-oVpDdk77.js` — 410.01 KB / 121.75 KB gzipped (pdfjs runtime)
    - `lib-Dti9iQw3.js` — 497.26 KB / 125.49 KB gzipped (mammoth)
  - PWA: 11 precache entries, sw.js + workbox.js generated as expected

### Files Created (10)
| File | Lines | Description |
|---|---|---|
| `src/lib/manuscript-reader.ts` | ~110 | Lazy-loaded file extraction (txt/docx/pdf) |
| `src/lib/manuscript-parser.ts` | ~205 | Pure-JS chapter splitter, name seeds, hashing, cost estimate |
| `src/lib/import-cache.ts` | ~50 | localStorage SHA-256 cache (7-day TTL) |
| `src/prompts/import-analyzer.ts` | ~210 | Tier 1 + Tier 2 + Voice DNA prompts |
| `src/prompts/rewrite.ts` | ~135 | Director's Cut + Magic Edit prompts |
| `src/services/import-analyzer.ts` | ~245 | Two-tier orchestrator with AbortSignal |
| `src/components/onboarding/ImportWizard.tsx` | ~600 | 4-step Framer Motion wizard |
| `src/components/modals/DirectorsCutModal.tsx` | ~280 | Sequential streaming + cancel-on-pick modal |
| `src/components/prose/SelectionToolbar.tsx` | ~135 | Floating mini-toolbar (Notion-style) |
| `src/components/prose/FreeWriteEditor.tsx` | ~115 | Plain canvas with offline draft fallback |

### Files Modified (12)
| File | Change |
|---|---|
| `src/services/ai/ai-router.ts` | 5 new methods + AbortSignal threading + new type imports |
| `src/services/ai/gemini-pool.ts` | Added optional `signal` to generateContent + generateContentStream |
| `src/services/ai/types.ts` | New shape types for import + voice DNA |
| `src/components/dashboard/ProjectCreationModal.tsx` | IMPORTED path now opens ImportWizard |
| `src/components/prose/BeatEditor.tsx` | forwardRef + selection tracking + replaceSelection imperative |
| `src/components/prose/ProseToolbar.tsx` | Free Write toggle chip |
| `src/components/workspace/ProseWriterPanel.tsx` | Hosts SelectionToolbar + DirectorsCutModal, refs BeatEditor |
| `src/components/workspace/ChapterOutlineCard.tsx` | IMPORTED badge + opt-in unlock |
| `src/pages/Workspace.tsx` | Header chips for IMPORTED + Free Write |
| `src/store/useSettingsStore.ts` | freeWriteMode flag |
| `src/store/parts/outlines.ts` | IMPORTED skip with specific warning |
| `src/hooks/useBeatWriter.ts` | Respect freeWriteMode for both beat init and background AI tasks |

### Dependencies Installed (2, both lazy-loaded)
- `mammoth@^1.x` — DOCX extraction (~250KB, only loaded on `.docx` upload)
- `pdfjs-dist@^4.x` — PDF extraction (~1.6MB total + worker, only loaded on `.pdf` upload)

### Manual Verification Pending (User-Side)
- Path B-1 paste flow with fake manuscript
- Path B-2/3/4 file upload flows (txt/docx/pdf)
- Cache hit verification (paste same text → instant)
- Hard cap rejection (>1.5M chars)
- Path C Free Write toggle + write without enforcement
- Path D Director's Cut sequential streaming + cancel-on-pick
- Path E Magic Edit replacement
- Anti-tabrakan: regenerate batch with imported chapters → friendly skip warning visible
- Mobile responsiveness at 375px

### Next Steps (Sprint 5 — KBM Retention Engine)
- 🧅 Mystery Layer system: CRUD + breadcrumb injection ke outline
- 🎢 Emotional Rollercoaster validation enhancement
- 🪝 Hook Chain tracking (Series/Season/Sub-Arc/Chapter/Micro)
- 💔 False Resolution flag per sub-arc
- 🧲 Character Investment: charm factor di Brainstorm Agent
- Voice DNA editor + auto-populate from prose (now we have raw data from import!)

---

## Session: Hotfix — Model Locking & Co-Author Chat Stop/Regenerate
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done
- **Updated and Locked `gemini-pool.ts`**: Reassigned the `model` parameter inside `generateContent` and `generateContentStream` to `'gemini-flash-latest'` at the very beginning of each function. This locks the target model name in all interpolated URL fetches to `gemini-flash-latest`.
- **Refactored Code References**:
  - `src/services/ai/ai-router.ts`: Replaced all hardcoded old model strings (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-2.5-flash`) in `geminiPool` calls with `'gemini-flash-latest'`.
  - `src/services/state-tracker.ts`: Replaced `'gemini-2.0-flash'` with `'gemini-flash-latest'` in state tracking content generation.
  - `src/store/parts/projects.ts` (Store): Swapped model values for initial project creations and dummy presets to `'gemini-flash-latest'`.
- **Co-Author Chat Stop & Regenerate**:
  - **`useChatStore.ts`**: Added non-persistent `activeControllers` map in Zustand state. Extracted Gemini API requests into a dedicated, reusable `generateAiResponse` action passing `AbortSignal`.
  - Created **`stopResponse`** action which invokes `abort()` on the project's active `AbortController` and appends a clean system message (`🛑 Generasi dihentikan oleh pengguna`).
  - Created **`regenerateResponse`** action which cleans the message history up to the last user message and triggers a fresh AI generation.
  - **`ai-router.ts`**: Propagated the `AbortSignal` all the way to `geminiPool.generateContent`.
  - **`CoAuthorChat.tsx`**: Integrated stop and regenerate buttons into the UI. Swaps the send button for a Stop button during active generation, and floats a premium "Generate Ulang" pill button with Framer Motion transitions centered above the input bar when the last message is from the assistant.
- **Type-Safety & Build Integrity**:
  - Addressed TypeScript compilation warnings (such as `TS6133` for unused model parameters) by reassigning parameters elegantly.
  - Verified compilation via `npx tsc -b --noEmit` and completed a full production build (`npm run build`) successfully with zero errors.
  - Synced changes in the knowledge graph database using `graphify update .`.

### Files Modified (6)
| File | Change |
|---|---|
| `src/services/ai/gemini-pool.ts` | Lock `model` parameter reassignment to `'gemini-flash-latest'` inside methods |
| `src/services/ai/ai-router.ts` | Update all 12 hardcoded model string arguments to `'gemini-flash-latest'` & support `AbortSignal` in `chatCoAuthor` |
| `src/services/state-tracker.ts` | Update state extractor prompt generation parameter to `'gemini-flash-latest'` |
| `src/store/parts/projects.ts` | Switch dummy and newly created project model presets to `'gemini-flash-latest'` |
| `src/store/useChatStore.ts` | Manage `activeControllers`, `generateAiResponse`, `stopResponse`, and `regenerateResponse` actions |
| `src/components/chat/CoAuthorChat.tsx` | Render stop/send button swap, floating Framer Motion Regenerate button |




---

## Session: Sprint 5 — KBM Retention Engine
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Mystery Layer Foundation
- Added `addMysteryLayer`, `updateMysteryLayer`, `deleteMysteryLayer` to `lorebookPart` (mirror of character CRUD pattern). Each method does optimistic UUID insert into Zustand state, then sync to Supabase `mystery_layers` table with overwrite-by-real-id on success.
- Updated `useChatStore.updateMessageDraftStatus` so chat-approved mystery layer drafts now flow through `projectStore.addMysteryLayer` instead of direct `useProjectStore.setState`. Backward-compatible because old draft data already provides all fields.
- Created `src/components/compass/MysteryLayerPanel.tsx` (~510 lines) with three sub-components:
  - **MysteryLayerCard** — collapsible card showing layer_number, central_question, status badge (PLANNED/ACTIVE/REVEALED), reveal-at chapter, breadcrumb count. Edit/Delete icons. Expand reveals answer + opens_next_question + BreadcrumbTimeline.
  - **BreadcrumbTimeline** — horizontal scrollable timeline `min-width: targetChapters × 4px` with dots positioned by `(chapter / targetChapters) × 100%`. Click any dot to edit; "+ Tambah" opens inline form with chapter number + hint text. Reveal chapter rendered as larger emerald dot.
  - **MysteryLayerForm** — add/edit form with 6 fields (layer_number, status select, central_question, revealed_at_chapter, opens_next_question, answer textarea).
- Wired into `ContextPanel` brainstorm mode below `<StoryCompassPreview />`.

#### Phase 2 — Voice DNA Editor
- Created `src/services/voice-dna-helper.ts` (~45 lines):
  - `gatherVoiceSamples(name, chapters)` — picks up to 3 most-recent chapters whose prose mentions the character, slices ~200 words each.
  - `canRecalibrate(character, chapters)` — predicate to enable/disable the recalibrate button (need at least 2 sample passages).
- Created `src/components/compass/VoiceDNAEditor.tsx` (~330 lines):
  - Renders all characters sorted PROTAGONIST → ANTAGONIST → SUPPORTING → MINOR.
  - Each character collapses into 6 canonical fields: `tone`, `vocabulary`, `verbal_tics[]`, `internal_monolog_style`, `dialog_quirks`, `charm_factor`. Verbal tics use a tag-input pattern (Enter to add, × to remove).
  - **Charm Factor** field has a visible hint: "🧲 Character Investment Trap — momen vulnerable atau memorable yang bikin pembaca sayang."
  - **🔄 Recalibrate from Prose** button wires through to Sprint 4's `aiRouter.calibrateVoiceDna`. The merged result populates the editing form (NOT auto-saved) so the user reviews and clicks Simpan.
  - `mergeIntoVoiceDna(existing, edits)` preserves any custom keys saved earlier (e.g. extra observations from chat brainstorm) when writing back.
- Wired into ContextPanel brainstorm mode below `<MysteryLayerPanel />`.

#### Phase 3 — False Resolution + Hook Chain
- **Type updates** in `src/types/project.ts` and `src/lib/database.types.ts`:
  - `Chapter.false_resolution: boolean`
  - `Project.series_hook: string | null`, `Project.season_hooks: string[]`
- **Schema migration** in `supabase/schema.sql`:
  - CREATE TABLE definitions for `projects` and `chapters` updated inline.
  - Appended an idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` block at the end of the file so users with pre-Sprint-5 databases can run just that section.
- **Outline engine prompt** in `src/prompts/outline-engine.ts`:
  - System instruction adds the **HOOK CHAIN 5-LEVEL HIERARCHY** explanation (Series → Season → Sub-Arc → Chapter → Micro) with explicit instruction to weave Series/Season hooks into open_threads when relevant.
  - System instruction strengthens **FALSE RESOLUTION** guidance: AI must set `falseResolution: true` when it crafts a false-resolution chapter.
  - Output JSON schema now contains `falseResolution: boolean`.
  - User prompt receives an optional `hookChainBlock` rendered when `seriesHook` or `seasonHooks` are non-empty.
- **OutlineGenerateInput** extended with `seriesHook?: string | null` and `seasonHooks?: string[]`. Both `generateOutlineBatch` and `regenerateOutline` in `outlines.ts` now pass the project's hooks.
- **Pacing validator** in `src/lib/kbm-pacing.ts`:
  - `validateFalseResolution(flags, windowSize=15)` warns when no false_resolution flag exists in the window.
  - `validateHookChainCoverage({seriesHook, seasonHooks, hasOutlinedChapters})` warns when the project has outlined chapters but no series/season hooks.
- **Outline batch flow** in `src/store/parts/outlines.ts`:
  - Initialise `falseResolutionFlags[]` from prior chapters.
  - Surface `validateHookChainCoverage` result once at batch start.
  - After each generated chapter, push the new flag and run `validateFalseResolution`. The first drought warning is appended to `allWarnings`; subsequent identical warnings are deduped.
- **ChapterOutlineCard** adds a "💔 False Resolution" chip alongside the existing dopamine chip when `chapter.false_resolution === true`.
- **StoryCompassPreview** gets a new `<SeriesHookField />` sub-component shown only when the compass has 5/5 mandatory items. The field uses a dirty-state save button that auto-clears after 1.5s "✓ Tersimpan" feedback. Stored value is synced via render-time prev-state pattern (no setState-in-effect).

#### Phase 4 — Prose Writer Strengthening
- Rewrote `src/prompts/prose-writer.ts` system instruction to add three explicit protocols:
  1. **MICRO-HOOK PROTOCOL** (mandatory every beat): subtext in dialog, one "wrong" detail per description, open question at every scene break.
  2. **CLIFFHANGER PROTOCOL** (mandatory final beat): per-type quick reference for all 6 cliffhanger types so the model knows what hitting hard looks like.
  3. **FALSE RESOLUTION HANDLING**: when the chapter flag is true, structure prose so the conflict feels resolved before the final beat then break it.
- Added **`voiceDnaToBrief(name, dna)`** helper that converts a Voice DNA jsonb into a natural-language brief like "Kania — tone-nya lembut tapi tegas; vocabulary campuran Betawi halus; sering mengucap "ya elah", "duh"; …". Replaces the previous `JSON.stringify(voiceDna, null, 2)` dump that the model often ignored.
- The brief accepts both `verbal_tics`/`internal_monolog_style`/`dialog_quirks` (canonical snake_case from VoiceDNAEditor) and `verbalTics`/`internalMonologStyle`/`dialogQuirks` (camelCase from `calibrateVoiceDna` output) so a freshly recalibrated character works without an intermediate save round-trip.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (712ms)** ✅
  - Main bundle: 849.39 KB / 243.68 KB gzipped (+33 KB from Sprint 4 — wajar untuk dua panel UI baru + 2 validators baru + Series Hook field + prompt enhancements)
  - Lazy chunks unchanged (mammoth, pdfjs-dist still lazy-loaded)
  - 11 PWA precache entries (1826.26 KiB)

### Files Created (3)
| File | Lines | Description |
|---|---|---|
| `src/components/compass/MysteryLayerPanel.tsx` | ~510 | Mystery Layer CRUD + breadcrumb timeline visual |
| `src/components/compass/VoiceDNAEditor.tsx` | ~330 | Per-character voice DNA editor + Recalibrate |
| `src/services/voice-dna-helper.ts` | ~45 | Sample-gathering helpers for recalibration |

### Files Modified (16)
| File | Change Summary |
|---|---|
| `src/types/project.ts` | Added `false_resolution`, `series_hook`, `season_hooks` |
| `src/lib/database.types.ts` | Mirror chapter + project types |
| `supabase/schema.sql` | Inline column adds + idempotent ALTER migration block |
| `src/store/parts/lorebook.ts` | Mystery Layer CRUD methods |
| `src/store/parts/projects.ts` | Dummy data + safe defaults for new project fields |
| `src/store/parts/chapters.ts` | Dummy data + safe defaults for new chapter fields |
| `src/store/parts/outlines.ts` | Track false_resolution flags, run new validators, pass hookChain |
| `src/store/useChatStore.ts` | Mystery layer drafts go via `addMysteryLayer` (Supabase) |
| `src/lib/kbm-pacing.ts` | `validateFalseResolution` + `validateHookChainCoverage` |
| `src/services/ai/types.ts` | `OutlineGenerateInput.seriesHook/seasonHooks`, `OutlineResponse.falseResolution` |
| `src/services/ai/ai-router.ts` | Pass through hook chain context |
| `src/prompts/outline-engine.ts` | Schema + system + user prompt updates |
| `src/prompts/prose-writer.ts` | Full rewrite with micro-hook, cliffhanger protocol, voice DNA brief |
| `src/components/workspace/ChapterOutlineCard.tsx` | False Resolution chip |
| `src/components/workspace/ContextPanel.tsx` | Wire MysteryLayerPanel + VoiceDNAEditor |
| `src/components/compass/StoryCompassPreview.tsx` | Series Hook field |
| `src/components/onboarding/ImportWizard.tsx` | Default `false_resolution: false` in chapter payload |

### Manual Verification Pending (User-Side)
- 3 mystery layers → breadcrumb timeline scroll horizontal → outline bab dengan breadcrumb dekat mention hint
- Edit Voice DNA Kania manual → save → next prose follows new voice
- Recalibrate from Prose → AI extract → user accept → save
- Outline batch 10 bab → minimal 1 bab `false_resolution: true`
- Chapter card chips: cliffhanger + dopamine ⚡ + paywall + 💔 false-resolution
- Series Hook field appears when 5/5 compass items filled → save → next outline batch injects hook
- Mobile responsiveness at 375px

### Next Steps (Sprint 6 — Auto-Pilot Batch Generation)
- `batch-generator.ts` service for sequential prose generation across N chapters.
- `useBatchGenerator.ts` hook untuk progress + pause/resume.
- `BatchProgressPanel.tsx` per-chapter status indicator.
- `BatchSuccessModal.tsx` post-batch stats + warnings.
- 2× hard error → batch berhenti otomatis.


---

## Session: Sprint 6 — Auto-Pilot Batch Generation
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Service Foundation
- Added 5 new types to `src/types/project.ts`:
  - `BatchStatus` union (idle/running/paused/aborted/success/error)
  - `BatchOptions` with `startChapter`, `endChapter`, `skipExisting`, `safetyStopAfterErrors`
  - `BatchProgress` with `endedAt: number | null` (pure elapsed-time anchor for the success modal)
  - `BatchCompletedEntry`, `BatchErrorEntry`
- Created `src/services/prose-context.ts` (~140 lines) with `buildProseInput()` extracted from `useBeatWriter.generateBeat`. Pure function — no React, no Zustand. Returns the `ProseGenerateInput` shape consumed by `aiRouter.generateProseBeatStream`. Added `ensureBeatsForChapter(chapter)` helper for the (chapter has key_events but no beats) bootstrap case.
- Refactored `useBeatWriter.generateBeat` to use the new shared helpers — net reduction from ~50 lines of inline gathering logic to a single `buildProseInput(...)` call. The interactive single-beat flow and the batch generator now produce IDENTICAL prompts because they share the same builder.
- Created `src/services/batch-generator.ts` (~360 lines) with `BatchGenerator` class:
  - `start(options, callbacks)` — sequential per-chapter loop. Each iteration checks abort/pause flags + consecutive error counter, locates the chapter snapshot fresh from the project store (so loop sees previous-iteration writes), applies skip rules (locked, IMPORTED, DRAFT/FINAL when `skipExisting`), then calls `generateOneChapter()`.
  - `generateOneChapter()` — initialises beats from key_events if needed, iterates each beat, pipes streamed chunks into a throttled save (800ms debounce) so the live UI sees progress without flooding `updateChapter`. After all beats: marks chapter `DRAFT`, then fires `runBackgroundTasks()` (state snapshot only — plot radar + lore extraction were intentionally deferred to keep next chapter unblocked).
  - `pause()` — sets `pauseRequested = true`. The loop checks this flag at the top of each chapter iteration so the current chapter finishes cleanly before halting.
  - `abort()` — sets `abortRequested = true` AND calls `abortController.abort()` so the in-flight stream cancels immediately. Partial prose is persisted before bailing.
  - `isHardError()` filters out 429 / "rate limit" / "cooldown" so the safety counter only ticks for genuinely fatal errors. The gemini-pool's existing cooldown-rotation handles soft rate limits transparently.
  - `loadPersistedBatchProgress(projectId)` and `clearPersistedBatchProgress(projectId)` exposed for future "resume from refresh" UX. Persistence is automatic via `persistProgress()` called on every `onProgress` tick — only writes when status is running or paused; auto-clears on success/error/aborted.

#### Phase 2 — Hook + Store Integration
- Added `batchProgress: BatchProgress | null` (transient, never persisted) and `setBatchProgress` action to `useUiStore`.
- Created `src/hooks/useBatchGenerator.ts` (~110 lines):
  - Holds the `BatchGenerator` instance in a `useRef` so it survives re-renders.
  - `startBatch(options)` calls `gen.start(...)` with `onProgress` wired to `setBatchProgress`.
  - `pauseBatch()`, `abortBatch()` proxy directly to the generator.
  - `resumeBatch()` reads `progress.currentChapterNumber` to restart from the paused position. Falls back to `endChapter` if no resume position is known.
  - `clearProgress()` clears both Zustand state and localStorage.
  - Returns memoised value so consumer components don't re-render unnecessarily.

#### Phase 3 — UI Components
- Created `src/components/prose/BatchProgressPanel.tsx` (~155 lines): floating fixed-position panel bottom-right (responsive `w-[min(380px,calc(100vw-2rem))]`). Auto-shows when status is running or paused. Sections: status badge + progress percent header → progress bar → current chapter+beat indicator → chapter dot strip with 5 visual states → cumulative stats (total words, elapsed time) → action footer (Pause/Resume + Abort with confirm).
- Created `src/components/modals/BatchSuccessModal.tsx` (~170 lines): auto-shows when status transits to terminal (`success`/`error`/`aborted`). 4 stat cards via `Stat` sub-component, per-chapter completed list, error log + warnings sections, CTA "Lihat Bab N →" that uses `useUiStore.setActiveChapter` + `setMode('write')` + `navigate('/project/{id}')` for one-click jump.
- Modified `src/components/workspace/SeasonArchitectPanel.tsx` to add the "🚀 Auto-Pilot Prose" button in the inline range modal alongside "Generate Outline". Confirmation prompt fires when batch size > 10 chapters with explicit warning about OpenRouter cost. Uses the same `rangeStart`/`rangeEnd` state already maintained for outline batch.
- Mounted `<BatchProgressPanel />` and `<BatchSuccessModal />` in `src/pages/Workspace.tsx` so they're available globally regardless of current mode.

#### Phase 4 — Polish & Edge Cases
- Persistent progress: localStorage key `vn_batch_progress_{projectId}` written on every `onProgress` callback while running/paused, cleared automatically on terminal status. The hook exposes `loadPersisted(projectId)` for a future restore prompt; the actual UI for "Batch terputus, lanjutkan?" is deferred to Sprint 9 polish — currently a refresh during batch leaves the persisted snapshot intact but doesn't auto-prompt.
- Mid-batch provider switch: `aiRouter.generateProseBeatStream` re-reads `useSettingsStore.activeProseModel` per call, so flipping the prose model toggle in `ProseToolbar` mid-batch picks up on the NEXT chapter — current chapter finishes with the previously selected model. Documented in batch-generator JSDoc.

### React 19 Pitfall — `react-hooks/purity` Rule
The new lint rule blocks `Date.now()` calls during render. Two fixes applied:
1. **BatchProgressPanel** uses `useState<number>(() => Date.now())` + `setInterval(setNow, 1000)` so elapsed time refreshes once per second via committed state, never via render-time impure call.
2. **BatchSuccessModal** initially tried a render-time prev-state pattern with `setEndedAt(Date.now())` — the lint rule flagged that too because `Date.now()` is impure regardless of where it's called inside the component body. Final fix: added `endedAt: number | null` to the `BatchProgress` shape itself, written by `BatchGenerator.finalise()` once when the batch transits to a terminal status. The modal then reads `progress.endedAt` as a pure value, with `progress.startedAt` as the fallback so the elapsed never goes negative while React is committing the new state.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (1.22s)** ✅
  - Main bundle: 867.62 KB / 248.02 KB gzipped (+18 KB from Sprint 5 — wajar untuk service + hook + 2 UI components)
  - Lazy chunks unchanged: pdf-worker (1232 KB), pdf runtime (410 KB), mammoth (497 KB) — all still lazy-loaded only on import wizard usage
  - 11 PWA precache entries (1845.22 KiB)

### Files Created (5)
| File | Lines | Description |
|---|---|---|
| `src/services/prose-context.ts` | ~140 | Pure prose-input builder (DRY shared with useBeatWriter) |
| `src/services/batch-generator.ts` | ~360 | Sequential per-chapter orchestrator with pause/abort/safety-stop |
| `src/hooks/useBatchGenerator.ts` | ~110 | React binding over the generator with memoised API |
| `src/components/prose/BatchProgressPanel.tsx` | ~155 | Floating bottom-right live progress panel |
| `src/components/modals/BatchSuccessModal.tsx` | ~170 | Post-batch summary modal with CTA |

### Files Modified (5)
| File | Change Summary |
|---|---|
| `src/types/project.ts` | New batch types + `endedAt` field |
| `src/store/useUiStore.ts` | `batchProgress` transient state + setter |
| `src/hooks/useBeatWriter.ts` | Refactored to use shared `buildProseInput` + `ensureBeatsForChapter` |
| `src/components/workspace/SeasonArchitectPanel.tsx` | Auto-Pilot button + cost-warning confirmation |
| `src/pages/Workspace.tsx` | Mount BatchProgressPanel + BatchSuccessModal globally |

### Manual Verification Pending (User-Side)
- Klik "Auto-Pilot 5 Bab" → 5 bab ter-generate sequential dengan progress panel update
- Pause → resume → lanjut dari beat terakhir bab aktif
- Abort mid-stream → bab aktif berhenti, partial prose tersimpan sebagai DRAFT (status `GENERATING` selama in-flight, `DRAFT` saat semua beat selesai)
- 2x hard error berturut → safety auto-stop triggered
- Refresh browser mid-batch → localStorage entry persists (UI restore prompt deferred to Sprint 9)
- BatchSuccessModal: stats akurat (count, words, time)
- Mid-batch toggle Gemini ↔ Claude di toolbar → next chapter pakai model baru
- Mobile (375px): floating panel tidak overlap content + abort confirm muncul

### Next Steps (Sprint 7 — Thread Tracker & RAG)
- `src/services/thread-tracker.ts` — auto-detect plot threads from prose + manual CRUD
- "Sebelumnya..." Recap Generator
- Supabase pgvector semantic search untuk chapter summaries
- Dangling thread alert per 10 bab


---

## Session: Sprint 7 — Thread Tracker & RAG
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Embedding Service + Chapter Summaries
- Added `embedContent(text, signal?, model='text-embedding-004')` to `gemini-pool.ts`. Returns 768-dim float array via Gemini's `embedContent` REST endpoint, with the same key rotation + 429 cooldown + AbortSignal threading as `generateContent`. Aborts re-throw immediately rather than retrying.
- Created `src/prompts/chapter-summary.ts` with system + user prompt builders. JSON output schema: `{ summary: string, key_facts: string[] }`. Tone constraint: factual, no embellishment, neutral, exact character names.
- Created `src/services/chapter-summary.ts` with `generateChapterSummary(chapter, prevSummary?, signal?)`. Pipeline: generate JSON summary → embed the summary text → return `SummaryResult`. Embedding failure is intentionally non-fatal — keyword-search fallback in `rag-service.ts` still works.
- Added `ChapterSummary` interface to `src/types/project.ts`. Mirrors the existing `database.types.ts` shape (id, chapter_id, project_id, summary, embedding, key_facts).
- Extended `lorebookPart`: new state `chapterSummaries: ChapterSummary[]`, new actions `loadChapterSummaries(projectId)` and `upsertChapterSummary(payload)`. The upsert is idempotent — it deletes any existing row for the same `chapter_id` then inserts the new one, so re-running the background task doesn't pile up duplicates.
- Wired `loadChapterSummaries` into `chaptersPart.loadProjectData` via `Promise.all` (parallelised with `loadCharacterStates`).

#### Phase 2 — RAG Service & Context Injector Enhancement
- Created `src/services/rag-service.ts` exposing `searchSimilarChapters(projectId, query, topK=3, signal?)`. Two-tier path:
  1. **Primary**: embed the query via Gemini `text-embedding-004`, then `supabase.rpc('match_chapter_summaries', { p_project_id, p_query_embedding, p_match_count })` for cosine-similarity scoring (1 - distance).
  2. **Fallback**: in-memory token-overlap scoring on the `chapterSummaries` already loaded into the store. Stopword list covers common Bahasa Indonesia connectors (yang, di, ke, untuk, dengan, etc.) + common English fillers. Scores divided by `sqrt(haystackTokens.size)` so short summaries with rare matches outrank long boilerplate.
- Appended idempotent `match_chapter_summaries` PL/pgSQL function to `supabase/schema.sql`. Returns `(id, chapter_id, project_id, summary, key_facts, similarity)`. Uses `<=>` cosine distance operator.
- Extended `ContextInjector` with `pruneAndInjectWithRag(...)` async variant that wraps the existing sync `pruneAndInject`, then awaits `searchSimilarChapters` and appends a "RELATED CHAPTER MEMORY — Layer 3 RAG" block before the closing delimiter. Optional `excludeChapterIds` parameter so we don't inject the chapter being generated as its own context.

#### Phase 3 — Thread Tracker
- Created `src/prompts/thread-tracker.ts` with system + user prompt builders. JSON schema: `new_threads[]`, `resolved_thread_titles[]`, `updated_thread_titles[]`. Urgency calibration tied to story stakes.
- Created `src/services/thread-tracker.ts` with `analyzeChapterThreads`, `findThreadByTitle` (exact → substring fuzzy match), `gatherPreviousSummaries`.
- Extended `lorebookPart` with full plot-thread CRUD: `addPlotThread` / `updatePlotThread` / `deletePlotThread` (optimistic + Supabase sync), plus `applyThreadAnalysis(chapterNumber, projectId, result)` that resolves existing threads, appends timestamped notes, inserts new threads (skipping fuzzy duplicates).
- Background task chain in `useBeatWriter` upgraded from 3 to 5 via `Promise.allSettled` (state + radar + lore + thread + summary). Same upgrade in `BatchGenerator.runBackgroundTasks` (state + thread + summary).
- Replaced the Sprint 3B `ThreadTrackerPanel.tsx` placeholder with full CRUD UI (~470 lines): grouping (Active vs Resolved), urgency-rank ordering, manual add inline form, AI auto-detect button, quick-resolve action, "🚨 Dangling" badge for HIGH/CRITICAL urgency threads aged >10 chapters.
- Added `validateDanglingThreads` to `kbm-pacing.ts` and wired into `generateOutlineBatch` so the dangling-thread warning surfaces alongside rollercoaster + hook chain warnings.

#### Phase 4 — Recap Generator
- Created `src/prompts/recap-generator.ts` with the "Sebelumnya..." narrative voice prompt.
- Added `aiRouter.generateRecap(input, signal?)` using Gemini Flash 2.0.
- Created `src/components/modals/RecapModal.tsx` (~225 lines) with range picker, generate button, prose display, copy-to-clipboard, save-to-Supabase footer (only when configured).
- Updated `ProseToolbar.tsx` with optional `onOpenRecap` prop + button. Wired up in `ProseWriterPanel.tsx`.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (716ms)** ✅
  - Main bundle: 894.60 KB / 254.76 KB gzipped (+27 KB from Sprint 6)
  - 11 PWA precache entries (1872.75 KiB)
  - Initial build had `INEFFECTIVE_DYNAMIC_IMPORT` warning fixed by promoting `findThreadByTitle` to static import in `lorebook.ts`.

### Files Created (7) and Modified (14)
See `task.md` for full breakdown.

### Manual Verification Pending (User-Side)
- Per-chapter background tasks: chapter_summary auto-saves with embedding, thread analysis populates ThreadTrackerPanel
- Outline batch surfaces dangling-thread warning when CRITICAL/HIGH urgency thread aged >10 chapters
- Recap modal: range picker → generate → copy + save
- RAG: pgvector RPC search vs keyword fallback path

### Next Steps (Sprint 8 — Visualization)
- EmotionalArcHeatmap (Recharts), ConstellationMap (D3), TimelineView, WordCountAnalytics
- `npm install recharts d3` (lazy-load to keep main bundle small)


---

## Session: Visual Polish — Premium Themed Edit Draft Modal
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — Build & TypeScript zero errors

### What Was Done

#### STEP 1: Created Dynamic Custom Modal (`src/components/modals/EditDraftModal.tsx`)
- Designed and built a fully themed React component matching the application's Material 3 custom properties ("Malam Kreatif" / "Jurnal Cantik").
- Integrated with `framer-motion` for buttery smooth transitions (`AnimatePresence`, spring-based `scale` / `opacity` / `y` offset animations).
- Implemented **specialized form layouts** for each of the 6 AI draft types:
  - **`character`**: Interactive inputs for Name, Role (Protagonist, Antagonist, Supporting, Minor select dropdown), and detailed Description.
  - **`item`**: Inputs for Name, Category (dropdown), Current Owner, Description, and narrative Significance.
  - **`world_rule`**: Inputs for Name, Lore Category (dropdown), and Description.
  - **`ending`**: Expansive textarea dedicated to outlining the target resolution of the novel.
  - **`mystery`**: Inputs for Layer Number, Central Question, Answer/Solution, and Follow-up Questions.
  - **`character_state`**: Advanced tracker inputs covering Location (📍), Emotional State (🎭), Physical Condition (💊), Active Goal (🎯), Last Action (⚡), plus array inputs for Inventory, Knowledge, and Secrets (rendered as user-friendly comma-separated fields).
- Added a fallback JSON-editor for unknown or generic draft types.

#### STEP 2: Integrated Modal into Co-Author Chat (`src/components/chat/CoAuthorChat.tsx`)
- Replaced the browser's ugly native `window.prompt()` callback inside `onEdit`.
- Introduced React local states (`editingMessage`, `setEditingMessage`) to manage active edits with type safety.
- Complied fully with VibeNovel's strict `verbatimModuleSyntax` rules by importing types using `import type` only (`import type { ChatMessage }`).
- Spliced the edited draft records directly back into the `useChatStore`'s `updateMessageDraftStatus` engine, enabling users to edit *any* proposed detail of characters/items/states before saving them to the library or database.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅ (our files compile with zero type issues, ensuring complete code integrity)
- `npm run build` → **SUCCESS (Zero errors)** ✅
- **Visual Check**: Seamless integration with backdrop blurring (`backdrop-blur-sm bg-black/60`), glowing container borders, and premium typography scales.

### Files Created (1)
| File | Lines | Description |
|---|---|---|
| `src/components/modals/EditDraftModal.tsx` | ~450 | Specialized multi-mode form modal for all Co-Author drafts |

### Files Modified (1)
| File | Change Summary |
|---|---|
| `src/components/chat/CoAuthorChat.tsx` | Replaced `window.prompt` with kustom `EditDraftModal`, typed imports |



---

## Session: Sprint 8 — Visualization
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### STEP 1: Dependencies
Installed Recharts (~370 KB) and three discrete D3 packages — `d3-force` (~15 KB), `d3-selection` (~15 KB), `d3-scale` (~10 KB) — plus their type packages. Avoided the full `d3` umbrella to keep the lazy chunk small.

#### STEP 2: Mode Switcher (5th Tab)
- Added `'visualize'` to the `WorkspaceMode` union in `src/store/useUiStore.ts`.
- Added the 5th tab "🌌 Visualisasi" to `MODES` arrays in both `ModeSwitcher.tsx` and `Workspace.tsx`. The Framer Motion `layoutId="activeWorkspaceMode"` sliding pill now interpolates across 5 positions instead of 4.
- Mobile bottom nav uses `material-symbols-outlined: analytics` for the visualize icon.
- Wired `<VisualizationPanel />` import in `Workspace.tsx` and rendered it for `activeMode === 'visualize'`.

#### STEP 3: Lazy Wrapper (`VisualizationPanel.tsx` ~145 lines)
- `React.lazy()` wraps each of the four heavy viz components, ensuring Recharts and D3 are downloaded **only** when the user opens this mode.
- Each viz wrapped in its own `<Suspense>` boundary so a slow fetch on one doesn't block the others.
- Empty state for projects with zero chapters → friendly card with "🎯 Buka Outline Engine" CTA.
- Active project guard, header banner with chapter count, 2x2 grid (lg+) / single column mobile, max-width 1600 px.

#### STEP 4: Emotional Arc Heatmap (`EmotionalArcHeatmap.tsx` ~285 lines)
- Pivot from Sprint 3B's tone-only preview to a 5-lens heatmap: **Tone / Cliffhanger / Filler / Word Count / Status**. Each lens has a dedicated color mapper and legend that swap when the user changes lens.
- HSL gradient interpolator for Word Count: cold blue (low) → warm orange (high), normalized to project's max wordcount per render.
- Horizontal scrollable strip of 1-cell-per-chapter tiles. Cell width auto-tightens (16/18/22 px) based on chapter density.
- Each cell is a `<button>` with full keyboard support (Tab + Enter/Space activates), `aria-label="Bab N, [lens] [value], tap untuk navigasi"`, and visible focus ring.
- Cell overlays: ⚡ for `dopamine_beat`, 💔 for `false_resolution`, 🔒 for `is_locked`. Number watermark at the bottom of each tile.
- Hover/focus tooltip section docked below the strip (avoiding tooltip jank from absolute positioning at high cell counts).
- `useMemo` discipline for cell array, max words, and legend data — sidebar typing in other modes won't trigger heatmap recompute.

#### STEP 5: Constellation Map (`ConstellationMap.tsx` ~620 lines)
- Two render paths driven by `useIsMobile()` hook (`window.innerWidth < 768`):
  - **Mobile**: `ConstellationListFallback` groups entities by type (👤 Char / 🗝️ Item / 🧵 Thread), each entity card lists top-3 connections sorted by edge weight with type-coded colored dots. Avoids the unusable D3 layout on small screens.
  - **Desktop**: D3 force-directed simulation rendering pure React SVG. d3-force computes positions in a `useEffect`, the `simulation.on('tick', ...)` callback bumps a state ticker that re-renders the SVG. React owns the DOM; D3 owns the math. No DOM ownership conflict.
- Filters panel (always visible above the canvas):
  - Node type checkboxes: 👤 Character / 🗝️ Item / 🧵 Thread.
  - Edge type checkboxes: co-appearance / ownership / threaded-in.
  - Dual-handle chapter range sliders that filter which chapters' `active_characters`/`active_items` are counted toward node visibility.
- Range reset on `totalChapters` change uses **prev-prop-during-render pattern** (no `useEffect`-driven setState — required by the React 19 strict purity rule that ESLint `react-hooks/set-state-in-effect` enforces).
- Edge construction:
  - **Co-appearance**: char↔char weighted by shared chapter count (intersection of `chapters` Sets).
  - **Ownership**: item→char via `current_owner` matched through `findCharacterIdByActivation` (name + activation_keys fuzzy match).
  - **Threaded-in**: thread→char via `related_characters` IDs.
- Node shapes per type for visual distinction:
  - Character: `<circle>`, color by role (PROTAGONIST=purple, ANTAGONIST=rose, SUPPORTING=emerald, MINOR=slate).
  - Item: rounded `<rect>`, color by category (7 categories).
  - Thread: hexagon `<polygon>`, color by urgency (LOW/MEDIUM/HIGH/CRITICAL).
- Interactions:
  - **Drag node**: `node.fx/fy` set on mousedown, simulation `alphaTarget(0.3).restart()`, cleared on mouseup.
  - **Click node**: toggles selection; selected node + connected nodes/edges full opacity, others dim to 0.2.
  - **Hover node**: tooltip card top-right with name, role/category/urgency, description snippet, chapter count.
  - **Pan**: SVG mousedown initiates pan (`transform.x/y` updated on mousemove).
  - **Zoom**: wheel event scales (`transform.k`), clamped between 0.3x and 3x.
  - **Reset button**: bottom-right corner resets transform to identity.
- `useMemo` for entire graph build (nodes + edges from filter args). Cap at 50 nodes by `priority + chapter coverage * 0.5` so D3 stays interactive on large casts. Warning shown when cap is hit.

#### STEP 6: Timeline View (`TimelineView.tsx` ~260 lines)
- Uses `computeArcBands(totalChapters)` from `kbm-pacing.ts` (newly centralized) to group chapters into 10 dramatic arc sections by ratio: Opening (0-5%) → Setup (5-15%) → Inciting (15-25%) → Rising (25-40%) → Midpoint (40-50%) → Complications (50-65%) → Crisis (65-75%) → Climax Approach (75-85%) → Climax (85-95%) → Resolution (95-100%).
- Each band rendered as a `<section>` with sticky header showing `🎬 Opening` + `Bab 1-10` + one-line description tooltip.
- Per-chapter row inside each band:
  - Tone color dot + chapter number (mono font) + truncated title + status badge.
  - Indicator badges: ⚡ dopamine, 💔 false_resolution, 🔒 locked.
  - Expanded mode (default) shows: ⏱ time_in_story chip, 📍 location chip, top-4 character chips (with "+N" overflow indicator), 🍞 mystery breadcrumb chips per layer (with hint tooltip), ✨ mystery reveal chips (with answer tooltip).
- **Plot Thread Lifespan Bars** in sticky left sidebar (desktop only):
  - Vertical bar per active thread, span from `planted_at` → `resolved_at` (or `target_chapters` if dangling).
  - Color by urgency (CRITICAL=rose, HIGH=orange, MEDIUM=blue, LOW=slate).
  - Dashed border style when dangling >10 chapters past planted.
  - Capped at 10 lanes for legibility.
- Compact toggle button collapses rows to just the dot + number + title row, hiding chips.
- Click row → `setActiveChapter + setMode('write')`.
- All transformations memoized: arc grouping, breadcrumb index, reveal index, thread spans, character name lookup.

#### STEP 7: Word Count Analytics (`WordCountAnalytics.tsx` ~225 lines)
- Top row of 4 stat cards: **Total Kata**, **Avg/bab**, **≥ Target** (emerald), **< Target** (rose). Counts only chapters with prose written (`word_count > 0`).
- Recharts `<ComposedChart>` inside a `<ResponsiveContainer>` (320 px height):
  - `<Bar>` per chapter, `<Cell>`-colored by status (5 statuses each unique color).
  - `<Line>` cumulative wordcount on the right Y-axis (purple).
  - `<ReferenceLine>` dashed amber at `word_count_target`, with label.
  - Custom `<ChartTooltip>` shows chapter title, words/target, ±delta % (emerald above, rose below), status, cumulative.
- Click bar via Recharts `onClick` event → `setActiveChapter + setMode('write')`. Recharts' chart-event payload type is internal (`MouseHandlerDataParam`), so the handler uses safe `unknown` coercion.
- Empty states for both "no chapters" and "chapters but no prose yet" cases.
- Cumulative computed via immutable `reduce` (no mutable accumulator — satisfies ESLint `react-hooks/immutability`).

#### STEP 8: Centralization & Lint Cleanup
- Migrated `getArcPosition` from both `src/store/parts/outlines.ts` and `src/prompts/outline-engine.ts` into `src/lib/kbm-pacing.ts` next to the new `computeArcBands` and `ArcBand` interface. The old call sites now import from kbm-pacing. Single source of truth for arc-band logic across the prompt builder, store, and Timeline view.
- Fixed pre-existing lint error in `src/components/modals/EditDraftModal.tsx` (`useEffect` reset → prev-prop-during-render pattern using `lastInitialData` + `lastIsOpen` shadow state). The lint gate could not close clean otherwise.
- Recharts chart click handler typed with `unknown` coercion to avoid depending on internal `MouseHandlerDataParam` type.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (1.40s)** ✅
  - **Main bundle**: 920.44 KB / **258.89 KB gzipped** (+25 KB vs Sprint 7 — 4 new viz wrappers + lazy infrastructure).
  - **Lazy chunks** (only loaded when `activeMode === 'visualize'`):
    | Chunk | Raw | Gzip |
    |---|---|---|
    | EmotionalArcHeatmap | 6.41 KB | 2.66 KB |
    | TimelineView | 7.22 KB | 2.56 KB |
    | ConstellationMap | 27.42 KB | 9.89 KB |
    | WordCountAnalytics | 377.21 KB | 109.71 KB |
  - Recharts is the heavyweight (~370 KB), but it's behind `React.lazy` so users who never open Visualisasi never download it.
  - PWA precache: 15 entries (2309.89 KiB) — service worker rebuilt cleanly.

### Files Created (5)
| File | Lines | Description |
|---|---|---|
| `src/components/visualization/VisualizationPanel.tsx` | ~145 | Lazy wrapper + 2x2 grid + empty state |
| `src/components/visualization/EmotionalArcHeatmap.tsx` | ~285 | Multi-lens heatmap (5 lenses) |
| `src/components/visualization/ConstellationMap.tsx` | ~620 | D3 force-directed + mobile list fallback + filters |
| `src/components/visualization/TimelineView.tsx` | ~260 | Arc bands + mystery markers + thread spans |
| `src/components/visualization/WordCountAnalytics.tsx` | ~225 | Recharts ComposedChart + stats cards |

### Files Modified (7)
| File | Change |
|---|---|
| `src/store/useUiStore.ts` | `'visualize'` added to `WorkspaceMode` union |
| `src/components/workspace/ModeSwitcher.tsx` | 5th tab "🌌 Visualisasi" |
| `src/pages/Workspace.tsx` | Render `<VisualizationPanel />`, bottom nav `analytics`, MODES array |
| `src/lib/kbm-pacing.ts` | `ArcBand` + `computeArcBands` + centralized `getArcPosition` |
| `src/store/parts/outlines.ts` | Removed local `getArcPosition` duplicate |
| `src/prompts/outline-engine.ts` | Imports `getArcPosition` from `../lib/kbm-pacing` |
| `src/components/modals/EditDraftModal.tsx` | Lint fix: `useEffect` → prev-prop-during-render pattern |

### Manual Verification Pending (User-Side)
- Mode ke-5 muncul di ModeSwitcher (desktop) + bottom nav (mobile) dengan icon `analytics`.
- Heatmap: switch antar 5 lens (Tone/Cliffhanger/Filler/WordCount/Status), warna update, hover tooltip sync, klik cell navigate ke bab.
- Constellation desktop: drag node bekerja, klik highlight edges connected, hover tooltip muncul, filter checkboxes hide/show nodes, range slider scope chapters, zoom + pan responsive.
- Constellation mobile (<768px): list fallback rendered, top-3 connections per entity ditampilkan.
- Timeline: 10 arc bands grouping correct, mystery breadcrumb 🍞 + reveal ✨ inline, thread bars span correctly di sticky left column, compact toggle works.
- Word Count: 4 stat cards akurat, bar warna sesuai status, line cumulative naik monoton, ReferenceLine target tampil, click bar navigate.
- Empty states: project baru tanpa chapters → friendly empty + Outline CTA.
- Network tab: lazy chunks (EmotionalArcHeatmap, ConstellationMap, TimelineView, WordCountAnalytics) hanya download saat `activeMode === 'visualize'`.

### Next Steps (Sprint 9 — Genre Blueprints & Polish)
- Genre Blueprint library (Drama Rumah Tangga, Romance Office, Action, Mystery, dll) — preset narrative_constitution + theme_and_tone + suggested arc structure.
- Onboarding flow polish: tutorial overlay, sample project quick-start.
- Performance pass: code-split routes, prefetch hints, Lighthouse audit.
- Accessibility pass: focus trap modals, screen reader labels review, color contrast audit.
- Final UI polish: loading skeletons, error boundaries per route, friendly 404 page.


---

## Session: Visual Polish — Premium Themed Dialogs & Toasts Engine
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### STEP 1: Created Dynamic Custom Edit Modal (`src/components/modals/EditDraftModal.tsx`)
- Designed and built a fully themed React component matching the application's Material 3 custom properties ("Malam Kreatif" / "Jurnal Cantik").
- Integrated with `framer-motion` for spring-based `scale` / `opacity` / `y` animations.
- Implemented **specialized form layouts** for each of the 6 AI draft types:
  - **`character`**: Name, Role (select dropdown), and detailed Description.
  - **`item`**: Name, Category (dropdown), Current Owner, Description, and Significance.
  - **`world_rule`**: Name, Lore Category (dropdown), and Description.
  - **`ending`**: Expansive textarea dedicated to outlining the target ending.
  - **`mystery`**: Layer Number, Central Question, Answer/Solution, and Follow-up Questions.
  - **`character_state`**: Advanced fields covering Location (📍), Emotional State (🎭), Physical Condition (💊), Active Goal (🎯), Last Action (⚡), plus array inputs for Inventory, Knowledge, and Secrets.
- Replaced the browser's native `window.prompt()` callback inside `CoAuthorChat.tsx`.

#### STEP 2: Built Centralized Custom Dialog Engine (`src/store/useUiStore.ts`)
- Added transient state slices for themed modal confirmations (`confirmOptions`) and a list of active floating toasts (`toasts`) with auto-expiry.
- Created robust store actions: `addToast`, `removeToast`, `showConfirm`, and `hideConfirm`.

#### STEP 3: Created Reusable Premium Dialog Components
- **`src/components/ui/PremiumConfirmModal.tsx` `[NEW]`**:
  - Implemented glassmorphism layout (`backdrop-blur bg-black/60`) and spring animations.
  - Added **Severity Tinting** accents (danger-red for delete, warning-amber for overwrite, info-pink/purple for general alerts) matching the active app theme.
- **`src/components/ui/PremiumToastContainer.tsx` `[NEW]`**:
  - Implemented a floating notification queue at the bottom-right of the screen with smooth slide-in/slide-out animations and distinct alert type styles.
- **Root Mounting (`src/App.tsx`)**: Mounted both global components at the root inside `<BrowserRouter>` to listen for events application-wide.

#### STEP 4: Eradicated 21+ Native Alerts & Confirms Across Workspace
Replaced all pre-existing native popups with our themed custom dialogs:
- **`Lobby.tsx`**: Upgraded project delete confirmation to a custom `danger` confirm modal.
- **`SeasonArchitectPanel.tsx`**: Upgraded range validations, API key guards, and generator errors to warning/error toasts, and autopilot batch warning to a custom `warning` confirm modal.
- **`ChapterOutlineCard.tsx`**: Upgraded manual overwrite warnings to custom confirm modals, delete actions to `danger` confirms, and locked outline warnings/errors to toasts.
- **`useBeatWriter.ts`**: Refactored beats outline warnings and prose streaming errors to show up as toasts.
- **`ProseWriterPanel.tsx`**: Refactored selection Magic Edit failure warnings to styled toasts.
- **`BatchProgressPanel.tsx`**: Upgraded autopilot stop/abort action warning to a custom `warning` confirm modal.
- **`ThreadTrackerPanel.tsx` & `MysteryLayerPanel.tsx`**: Upgraded plot thread and mystery layer deletion warnings to custom `danger` confirm modals.

### Verification Results
- `npx tsc -b --noEmit` ➔ **SUCCESS (Zero errors)** ✅
- `npm run lint` ➔ **SUCCESS (Zero errors, zero warnings)** ✅ (resolved a missing dependency warning in `useBeatWriter.ts`)
- `npm run build` ➔ **SUCCESS (778ms)** ✅ (bundles rebuilt cleanly with updated service worker precaching)

### Files Created (3)
| File | Lines | Description |
|---|---|---|
| `src/components/modals/EditDraftModal.tsx` | ~450 | Specialized multi-mode form modal for Co-Author drafts |
| `src/components/ui/PremiumConfirmModal.tsx` | ~110 | Reusable themed confirm dialog with severity styles and blur |
| `src/components/ui/PremiumToastContainer.tsx` | ~75 | Floating toast container queue with slide-in spring animations |

### Files Modified (9)
| File | Change Summary |
|---|---|
| `src/store/useUiStore.ts` | Added state and actions for global toasts and custom confirms |
| `src/App.tsx` | Mounted `PremiumConfirmModal` and `PremiumToastContainer` globally at root |
| `src/pages/Lobby.tsx` | Replaced delete project `confirm` with custom confirm |
| `src/components/chat/CoAuthorChat.tsx` | Replaced `window.prompt` draft editor with `EditDraftModal` |
| `src/components/workspace/SeasonArchitectPanel.tsx` | Replaced batch/autopilot alerts/confirms with custom toasts/confirms |
| `src/components/workspace/ChapterOutlineCard.tsx` | Replaced overwrite/delete alerts/confirms with custom toasts/confirms |
| `src/components/prose/BatchProgressPanel.tsx` | Replaced batch abort `confirm` with custom confirm |
| `src/components/compass/ThreadTrackerPanel.tsx` & `MysteryLayerPanel.tsx` | Replaced delete `confirm` calls with custom confirms |
| `src/hooks/useBeatWriter.ts` | Replaced alerts with toasts, resolved exhaustive-deps warning |
| `src/components/workspace/ProseWriterPanel.tsx` | Replaced Magic Edit failure `alert` with toast |

---

## Session: Bug Fix — Story Compass Validation & Safeguards
**Date**: 2026-05-24  
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### STEP 1: Implemented Store-Level Safeguards (`src/store/parts/outlines.ts`)
- Added core business logic validation rules to prevent outline generation/regeneration if the Story Compass is incomplete.
- Built a validation helper to check the 5 essential Story Compass components:
  1. **Premis & Genre** (must have a theme, premise, and genre defined in the project details).
  2. **Tokoh Utama / Protagonist** (must have at least one character marked as `is_protagonist`).
  3. **Antagonis** (must have at least one character marked as `is_antagonist`).
  4. **Target Ending** (must have `target_ending` defined).
  5. **Lapisan Misteri** (must have at least one mystery layer defined).
- Injected these robust safeguards directly at the top of:
  - `generateOutlineBatch(projectId, chapterCount)`
  - `regenerateOutline(projectId, outlineId)`
- Programs throw a highly descriptive and structured Error listing all missing elements if the validation fails, ensuring data integrity.

#### STEP 2: Designed Premium UI Warnings & Guards in SeasonArchitectPanel (`src/components/workspace/SeasonArchitectPanel.tsx`)
- Integrated `characters` and `mysteryLayers` selector from `useProjectStore` into the panel.
- Built a memoized `compassStatus` object that tracks and evaluates completeness across all five Story Compass layers.
- **Header Action Block**: Disabled the header "Generate Outline" button if the Story Compass is incomplete, rendering a premium tooltip showing exactly what elements are missing.
- **Empty State Upgrade**:
  - Replaced the simple "Generate" button in the empty state with a disabled version accompanied by an informative tooltip when incomplete.
  - Implemented a premium, themed **Warning Banner** directly within the empty state layout, listing each missing Story Compass component with clear action items linking to their respective configuration panels.
- **Trigger Security**: Added a fallback check to the generate outline modal launcher that triggers a styled error toast notification if clicked programmatically without a complete compass.

#### STEP 3: Integrated Safeguards in Chapter Card (`src/components/workspace/ChapterOutlineCard.tsx`)
- Added parallel `isCompassComplete` evaluation into individual chapter card displays.
- Disabled the "Regenerate" outline button when the Story Compass is incomplete, preventing the user from bypassing validation rules for existing outline items.
- Added premium warning tooltips on hover to explain why the action is restricted.

### Verification Results
- `npx tsc -b --noEmit` ➔ **SUCCESS (Zero errors)** ✅
- `npm run lint` ➔ **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` ➔ **SUCCESS (1.35s)** ✅ (Service worker rebuilt cleanly with all static files cached)

### Files Modified (3)
| File | Change Summary |
|---|---|
| `src/store/parts/outlines.ts` | Programmatic safeguards in `generateOutlineBatch` and `regenerateOutline` throwing descriptive errors. |
| `src/components/workspace/SeasonArchitectPanel.tsx` | Memoized UI compass validation, disabled header/empty actions with tooltips, custom warning banner with deep links, and toast triggers. |
| `src/components/workspace/ChapterOutlineCard.tsx` | UI guard blocking outline regeneration when Story Compass is incomplete with tooltips. |


---

## Session: Sprint 9 — Genre Blueprints & Polish
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Genre Blueprints Library
- 6 blueprint entries di `src/lib/genre-blueprints.ts` (~620 lines): Drama Rumah Tangga, Romance Office, Fantasi Kerajaan, Thriller Misteri, Action Aksi, Slice of Life Romance.
- Setiap blueprint multi-paragraf `narrative_constitution_template` dengan 5 KBM Retention Engine principles + arc_pacing_hint + character_archetypes (3-4 dengan placeholder bracketed names + voice_dna_hint) + item_archetypes + mystery_layer_skeleton (1-3 dengan reveal_arc_position 0.0-1.0).
- Helper `substituteNames(template, customNames)` regex-replace bracketed placeholders. `getAllGenreNames(projectGenres)` derive Lobby filter dari blueprints + custom existing genres.
- BlueprintSelector 2-step modal: grid 6 cards → preview drawer dengan inline rename per archetype. Skip-all = pakai placeholder default (bracket-stripped), atau archetype yang user kosongin tidak di-insert sama sekali.
- ProjectCreationModal: 3-CTA layout. Klik "Pakai Blueprint" → BlueprintSelector → onConfirmed callback dengan blueprint + customNames map → handleCreate dengan genesis_mode FRESH_BLUEPRINT.
- `blueprint-applier.ts` orchestrate: updateProject (narrative_constitution + theme_and_tone + target_ending + series_hook substituted) + addCharacter loop + addItem loop + addMysteryLayer loop dengan breadcrumbs di-seed otomatis di chapter ratio 0.2 + 0.5 dari reveal target.

#### Phase 2 — Spin-Off Clone + Target Adjustment
- `getNextSpinOffName(sourceTitle, allProjects)`: regex match existing `/^${title} — Spin-Off( \(\d+\))?$/` → return next available. "X — Spin-Off" → "X — Spin-Off (2)" → "X — Spin-Off (3)".
- `cloneProjectAsSpinOff(sourceProjectId, customTitle?)`: createProject dengan `FRESH_BRAINSTORM` (no migration), updateProject copy meta (narrative_constitution + theme + ending + hooks + voice_dna_project), copy lorebook (characters + items + world_rules + mystery_layers dengan revealed_at/breadcrumbs di-reset jadi null/[]), skip chapters/states/threads/summaries.
- ProjectCard menu extended: "Ubah Target Bab" + "Spin-Off Clone" + Hapus. Optional callbacks (backwards compat).
- `chapter-protection.ts`: `isLocked(c) = c.is_locked || c.prose || c.status === 'IMPORTED'`. `validateTargetReduction` returns `{ ok, blockingChapters, minAllowed }`.
- `target-chapters-adjuster.ts`:
  - GUARD: COMPLETED status throws "Proyek sudah selesai. Buka arsip dulu."
  - `expandTargetNewSeason` — bump target only.
  - `expandTargetStretch` — bump + loop regenerateOutline (skip locked). Returns `{ regenerated, skipped }`.
  - `shrinkTarget` — validate locked guard, lalu DELETE outline-only chapters > newTarget (cascade chapter_summaries via DB), clamp `plot_threads.planted_at` + reset `resolved_at`/status, clamp `mystery_layers.revealed_at_chapter` + filter breadcrumbs > newTarget, delete character_states `chapter_number > newTarget` (Supabase + local), update project.target_chapters. Returns `{ deleted, threadsClamped, mysteriesClamped, statesDeleted }`.
  - `previewShrink` — read-only preview tanpa side effect.
- TargetChaptersAdjustmentModal: COMPLETED guard render disabled state. Direction otomatis (`expand` / `shrink` / `same`). Expand dengan radio NEW_SEASON vs STRETCH. Shrink dengan side-effect preview cards + 2-step "Saya mengerti" checkbox. prev-prop-during-render pattern untuk reset state on project change.

#### Phase 3 — Mimicry Engine
- Schema migration: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_dna_project JSONB NOT NULL DEFAULT '{}'::jsonb`. Idempotent. Project interface + database.types.ts + DUMMY_PROJECTS + createProject default semua di-update.
- Mimicry prompt: 8-field JSON schema (diction, sentence_rhythm, paragraph_density, dialogue_style, signature_phrasing, taboo_phrasing, pace_descriptor, emotional_color). System instruction explicitly forbids copying narrative content, character names, or locations — hanya pola struktural.
- `aiRouter.extractProjectVoiceDna(sample, signal?)` via Gemini Flash. Defensive normalization: string-coerce nested objects, drop null values, validate object shape.
- MimicryEngineCard single component dengan prop `placement: 'context-panel' | 'settings'` (compact 4-row textarea vs full 8-row, 3-item preview vs 8-item). Privacy disclaimer inline. Word counter + 300-char warning. Saved DNA preview cards dengan opsi Hapus.
- prose-context: `projectVoiceDna: project.voice_dna_project ?? {}` (null-safe untuk project lama tanpa migration).
- prose-writer prompt: inject `[PROJECT VOICE STYLE]` block dengan instruksi "Gabungkan dengan voice DNA per-karakter — voice karakter prioritas saat dialog, voice proyek prioritas saat narasi" — hanya jika dictionary non-empty.
- Mounted di ContextPanel outline mode + SettingsModal tab Writing — dual entry point ke single component.

#### Phase 4 — Onboarding Tour + A11y + Settings Refactor
- OnboardingTour portal-based 5-step coach mark. **Lazy initial state** untuk localStorage check (no setState-in-effect, satisfies React 19 strict purity rule). `data-tour-step` attribute selector + getBoundingClientRect → cutout ring via `box-shadow: 0 0 0 9999px` dim trick. Tooltip auto-position (right → left → below → centered fallback). Step dots progress. Lewati / Kembali / Lanjut buttons. Respects `prefers-reduced-motion` via Framer's `useReducedMotion()`.
- SettingsModal 3-tab refactor dengan Framer `layoutId="settingsTabIndicator"` sliding underline. Keys / Writing / Tutorial. Free Write custom toggle component dengan accent. MimicryEngineCard di Writing tab.
- A11y polish:
  - useFocusTrap hook (~85 lines): Tab/Shift-Tab cycle dengan FOCUSABLE_SELECTOR (a/button/input/select/textarea/[tabindex]), Escape callback, auto-focus first via requestAnimationFrame, restore focus on cleanup. Applied to 3 modal kunci.
  - SkipLink anchor `href="#main-content"`, `focus:not-sr-only` reveal pattern.
  - `<main id="main-content" role="main">` di Lobby + Workspace.
  - Global `prefers-reduced-motion` CSS di index.css — disable animations + transitions + scroll-behavior.

#### Phase 5 — Performance + Verification
- App.tsx: Workspace di-lazy via `React.lazy` + Suspense fallback `<LoadingSplash />` (full-screen spinner match Lobby loader).
- vite.config.ts: `build.rollupOptions.output.codeSplitting.groups[]` (Vite 8 / Rolldown API). Awalnya pakai deprecated `manualChunks` → TS error karena Rolldown API berbeda. Fix: pindah ke `advancedChunks` (deprecated tapi masih jalan dengan warning) → akhirnya `codeSplitting.groups[]` (current API). 4 vendor groups: vendor-react, vendor-supabase, vendor-motion, vendor-store.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors)** ✅
  - One initial fail in OnboardingTour (`setState-in-effect`) → fixed by lazy initial state pattern.
- `npm run build` → **SUCCESS (1.31s)** ✅

### Bundle Sizes (vs Sprint 8 baseline)
| Asset | Sprint 8 | Sprint 9 |
|---|---|---|
| Main entry (raw) | 920 KB | **259 KB** (−72%) |
| Main entry (gzip) | 259 KB | **77 KB** (−70%) |
| Workspace | (in main) | 225 KB / 53 KB gzip (lazy) |
| vendor-react | (in main) | 189 KB / 60 KB gzip |
| vendor-supabase | (in main) | 200 KB / 52 KB gzip |
| vendor-motion | (in main) | 125 KB / 41 KB gzip |
| vendor-store | (in main) | 2.6 KB / 1.3 KB gzip |
| EmotionalArcHeatmap | 6.4 KB | 6.5 KB (lazy) |
| TimelineView | 7.2 KB | 7.3 KB (lazy) |
| ConstellationMap | 27.4 KB | 27.5 KB (lazy) |
| WordCountAnalytics | 377 KB | 377 KB (lazy, Recharts) |

User pertama buka Lobby download ~570 KB total (main + 4 vendor chunks) vs 920 KB monolith Sprint 8. Plus iterative app updates tidak invalidate vendor chunks — heavy cache savings on iterative ships.

### Files Created (13)
1. `src/lib/genre-blueprints.ts` (~620 lines) — 6 blueprints + helpers
2. `src/components/onboarding/BlueprintSelector.tsx` (~290 lines) — 2-step modal
3. `src/components/onboarding/OnboardingTour.tsx` (~250 lines) — 5-step coach mark portal
4. `src/components/compass/MimicryEngineCard.tsx` (~220 lines) — voice DNA extractor
5. `src/components/modals/TargetChaptersAdjustmentModal.tsx` (~280 lines)
6. `src/components/ui/SkipLink.tsx` (~30 lines)
7. `src/components/ui/LoadingSplash.tsx` (~20 lines)
8. `src/services/blueprint-applier.ts` (~120 lines)
9. `src/services/project-cloner.ts` (~140 lines)
10. `src/services/chapter-protection.ts` (~80 lines)
11. `src/services/target-chapters-adjuster.ts` (~210 lines)
12. `src/prompts/mimicry-engine.ts` (~50 lines)
13. `src/hooks/useFocusTrap.ts` (~85 lines)

### Files Modified (16)
1. `src/types/project.ts` — `voice_dna_project?` field
2. `src/lib/database.types.ts` — sync schema
3. `src/store/parts/projects.ts` — default `{}` + dummy + createProject
4. `src/components/dashboard/ProjectCreationModal.tsx` — 3-CTA + Blueprint flow
5. `src/components/dashboard/ProjectCard.tsx` — context menu + tour attrs
6. `src/pages/Lobby.tsx` — handlers + skip-link + tour mount + landmark
7. `src/pages/Workspace.tsx` — skip-link + main role
8. `src/components/workspace/ContextPanel.tsx` — Mimicry mount + tour attr
9. `src/components/workspace/ModeSwitcher.tsx` — tour attr
10. `src/services/ai/ai-router.ts` — `extractProjectVoiceDna`
11. `src/services/prose-context.ts` — `projectVoiceDna` injection
12. `src/services/ai/types.ts` — ProseGenerateInput field
13. `src/prompts/prose-writer.ts` — `[PROJECT VOICE STYLE]` block
14. `src/components/modals/SettingsModal.tsx` — full 3-tab refactor
15. `src/App.tsx` — lazy Workspace + Suspense
16. `src/index.css` — prefers-reduced-motion CSS
17. `vite.config.ts` — codeSplitting.groups[]
18. `supabase/schema.sql` — voice_dna_project migration

### Challenges Encountered
1. **Lobby was reformatted between sessions** — earlier read showed original handleDelete but file had been refactored to use `showConfirm` from useUiStore. Re-read to align with new pattern.
2. **Vite 8 / Rolldown API differs from Rollup**. Initial `manualChunks: { 'vendor-react': [...] }` triggered TS2769 because Rolldown doesn't support that shape. First migration to `advancedChunks` worked but emitted deprecation warning. Final fix: `codeSplitting.groups[]` (current API).
3. **OnboardingTour useEffect setState-in-effect lint error** — fixed by switching to lazy initial state for the localStorage check (synchronous, no effect needed).

### Manual Verification Pending (User-Side)
See walkthrough.md for full checklist.

### Next Steps (Sprint 10 — Capacitor & Production)
- Capacitor CLI setup, Android platform integration.
- Splash screen, app icon, back button handling.
- Performance optimization pass (Lighthouse audit + fixes).
- Play Store preparation (signing, metadata, screenshots).
- E2E testing — 10 chapter dari nol sampai final.


---

## Session: Sprint 9.5 — QA Hardening
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### Background
External QA report (`systems_architecture_qa_report.md`) audit revealed mixed-accuracy findings. Cross-checked tiap claim vs kode aktual:

| Claim | Status | Catatan |
|---|---|---|
| 1.1 Cascade overlap rate-limit | ✅ Accurate | 5 concurrent Promise.allSettled + small key pool = 429 cascade real |
| 1.1 Cross-chapter contamination | ⚠️ Overstated | Closure correctly captures chapter.id, ref-guard prevents re-trigger |
| 1.2 Offline AI Blackout (no backfill) | ✅ Accurate | useBeatWriter skip background AI when !isOnline. Reconnect sync replay PROSE saja. |
| 1.2 Out-of-order override (no vector clock) | ✅ Accurate | Real gap, deferred to Sprint 10 |
| 1.3 Stale chat approval | ✅ Accurate | updateMessageDraftStatus → addCharacter() tanpa duplicate detection |
| 2.1 Free Write Memory Blackhole | ✅ **Accurate & significant** | Confirmed di code: `if (isCompleted && isOnline && !freeWriteMode && ...)` — semua background AI di-skip. Toggle-off tidak trigger backfill. |
| 2.2 Import Wizard abort = DB pollution | ❌ **Inaccurate** | abort() hanya cancel analyzeManuscript() (AI analysis, ZERO DB writes). DB writes terjadi di handleConfirm SETELAH user klik "Setujui Semua". |

Sprint 9.5 fokus eksekusi 3 fix paling impactful tanpa schema migration.

### What Was Done

#### Fix #1 — Free Write Memory Reindexer (chapter-reindexer.ts ~250 lines)
- `detectMissingArtifacts(chapter)` — returns `{ needsStateSnapshot, needsPlotRadar, needsLoreExtraction, needsThreadAnalysis, needsChapterSummary }`. Cheap proxy: chapter has prose >50 chars + corresponding store entries don't exist (state row by chapter_number, qa_logs on chapter, summary by chapter_id).
- `reindexChapter(chapterId)` — runs only missing tasks via `Promise.allSettled`. Each task uses cumulative context (prevStates formatted via `stateTracker.formatStatesForContext`, prev chapter summaries for thread analysis). Returns `{ chapterId, chapterNumber, succeeded[], failed[] }`.
- `reindexChapters(ids, onProgress, signal)` — sequential loop (Bab N+1 butuh state Bab N untuk proper context). Honors AbortSignal between iterations. Calls `onProgress({ current, total, currentChapterNumber, status })` at start, per-iteration, and at terminal status (success/partial/aborted).
- `findChaptersNeedingReindex()` — scan project chapters, filter via `detectMissingArtifacts`, sort by chapter_number.

#### ReindexModal (~270 lines)
- 3-state UI:
  - **Idle preview**: list pendingIds dengan chapter number + title + word count (max-h scrollable). Estimasi waktu inline ("Estimasi N-2N menit untuk N bab"). 2-button footer.
  - **Running**: progress bar (animated bg-primary), percent display, "Memproses Bab N…" indicator. Abort button.
  - **Done**: success/fail stat cards (emerald/rose backgrounds), failed task details collapsible (max-h-160 scrollable). Close button.
- Empty state ramah ("Semua bab sudah tersinkronisasi ✓") kalau `pendingIds.length === 0` saat modal idle.
- Focus trap + close-disabled-during-running guard.
- Toast notification terintegrasi via `useUiStore.addToast` saat selesai.

#### FreeWriteIndexerWatcher (~50 lines)
- Global watcher mounted di Workspace. Hooks: freeWriteMode (settingsStore), activeProject + chapters (projectStore), activeModal (uiStore).
- `prevFreeWriteRef` track previous value via `useRef` (no setState in render).
- `useEffect`: detect transition true → false → 800ms `setTimeout` debounce → call `findChaptersNeedingReindex()` → `setAutoOpen(true)` kalau non-empty.
- Manual trigger via `useUiStore.openModal('reindex')` — `activeModal === 'reindex'` juga buka modal.
- `handleClose` clears both autoOpen state + activeModal flag.

#### Settings Tutorial Tab Manual Trigger
- Section baru "Sinkronisasi Memori AI" di Tutorial tab `SettingsModal.tsx`.
- Tombol "Buka Reindexer" call `onClose()` (close settings) lalu `openModal('reindex')` (open reindexer).
- Pesan: "Build ulang state snapshot, ringkasan, dan analisis thread untuk bab yang ditulis manual atau saat offline. Berguna setelah lama pakai Free Write atau import naskah lama."

#### Fix #2 — Offline Reconnect AI Backfill (useBeatWriter.ts)
- Modified reconnect sync `useEffect`:
  - Track `syncedChapterIds: Set<string>` di local scope (closes over set di `syncPendingDrafts` callback).
  - Setiap successful sync (callback returns true) push id ke set.
  - Setelah `syncPendingDrafts` resolve dengan `synced > 0`, sequential `for...of` loop call `reindexChapter(id)` untuk tiap id di set.
  - Best-effort: failures di-log via `console.warn` dengan detail tasks yang gagal.
  - `cancelled` flag honored di between iterations untuk graceful unmount.
- Hasil: prosa yang ditulis offline + di-flush saat reconnect sekarang dapat AI artifacts otomatis. Tidak ada lagi gap context untuk Bab N+1.

#### Fix #3 — Chat Approval Conflict Detection (useChatStore.ts)
- Added `useUiStore` import + `uiStore` getState reference.
- Helper functions di scope `updateMessageDraftStatus`:
  - `findCharByName(name)` — `projectStore.characters.find(c => c.name.toLowerCase() === name.toLowerCase())`
  - `findItemByName(name)` — sama untuk items
  - `findRuleByName(name)` — sama untuk world_rules
- Untuk type `character`, `item`, `world_rule` drafts: cek existing entry SEBELUM call `addX()`. Kalau existing:
  - `uiStore.addToast(message, 'warning', 7000)` — pesan spesifik per type
  - Return state tanpa execute add (skip duplicate)
- Pesan toast example untuk character: `"⚠️ Tokoh \"Kania\" sudah ada di Lorebook. Setujui draft ini akan menggandakan. Edit manual via Story Compass kalau mau update tokoh existing."`
- Pendekatan ini lebih pragmatic dari full optimistic lock dengan `updated_at` timestamp — tidak butuh schema migration ke 3 tables, dan menangkap real-world stale-approval scenario.

### Why Some QA Recommendations Were NOT Implemented

| QA Recommendation | Decision | Reasoning |
|---|---|---|
| 3.1 Background Task Queue | Skip | Existing `geminiPool` already handles 429 + cooldown rotation. Adding queue infrastructure adds complexity without solving real bug. |
| 1.1 Cross-chapter contamination | Skip | Verified at code level: closure correctly captures chapter.id, `stateGenTriggeredRef` prevents re-trigger after one fire. False positive. |
| 2.2 Import Wizard DB pollution | Skip | Verified: `cancelAnalysis()` only aborts AI analyze step. DB writes (`createProject`, `addChapter`) happen in `handleConfirm` AFTER user explicit approval. Mid-analysis abort = zero pollution. QA misread the flow. |
| 3.4 Optimistic Lock dengan `updated_at` | Replaced | Required schema migration to 3 tables (characters, items, world_rules). Replaced dengan duplicate-by-name detection — pragmatic MVP fix. Full lock optional di Sprint 10 jika MVP feedback menunjukkan masih jadi issue. |

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (765ms)** ✅

### Bundle Sizes (vs Sprint 9)
| Asset | Sprint 9 | Sprint 9.5 |
|---|---|---|
| Main entry (raw) | 259.34 KB | 260.24 KB (+0.9 KB) |
| Main entry (gzip) | 77.26 KB | 77.44 KB (+0.18 KB) |
| Workspace lazy | 225.42 KB | 238.76 KB (+13.3 KB) |
| Visualization chunks | unchanged | unchanged |
| Vendor chunks | unchanged | unchanged |

Negligible cost untuk significant continuity hardening. PWA precache: 21 entries (2413.60 KiB).

### Files Created (3)
1. `src/services/chapter-reindexer.ts` — orchestrator service (250 lines)
2. `src/components/modals/ReindexModal.tsx` — 3-state modal UI (270 lines)
3. `src/components/onboarding/FreeWriteIndexerWatcher.tsx` — global watcher (50 lines)

### Files Modified (4)
1. `src/hooks/useBeatWriter.ts` — reconnect sync flow extended dengan reindex backfill
2. `src/store/useChatStore.ts` — duplicate-by-name detection
3. `src/components/modals/SettingsModal.tsx` — Tutorial tab manual reindex trigger
4. `src/pages/Workspace.tsx` — mount FreeWriteIndexerWatcher

### Challenges Encountered
1. **`useUiStore.openModal('reindex')` channel** — chose to reuse the existing `activeModal: string | null` field rather than introducing a dedicated `reindexOpen` flag. Watcher subscribes to `activeModal === 'reindex'` for manual trigger path while keeping `autoOpen` local state for Free Write toggle path.
2. **`detectMissingArtifacts` heuristic** — no `last_indexed_at` column, so used cheap proxy: state snapshot row + chapter summary row both missing means chapter "never indexed". Lore extraction has no per-chapter signal so re-runs alongside the anchor checks. Pragmatic vs adding migration column.
3. **Sequential reindex bottleneck** — Bab N+1 butuh state Bab N for proper character context. Cannot parallelize. UI explicitly tells user "Estimasi N-2N menit untuk N bab" sehingga ekspektasi reasonable.

### Manual Verification Pending (User-Side)
- Free Write toggle ON → tulis bab 5-10 raw → toggle OFF → ReindexModal auto-muncul → progress sequential → semua bab dapat state + summary
- Offline mode test: Network → Offline → BeatEditor → restore prompt + draft saved → Network → Online → console "Synced N pending draft(s)" → reindexChapter triggered
- Co-Author Chat: AI propose karakter "Kania" → manual tambah karakter "Kania" via Story Compass → approve chat draft → toast warning muncul, no duplicate insertion
- Settings → Tutorial tab → "Buka Reindexer" → modal muncul independen dari Free Write state
- Mobile (375px) ReindexModal scrolling, abort confirm

### Next Steps (Sprint 10 — Capacitor & Production)
- Capacitor CLI setup, Android platform integration
- Splash screen, app icon, back button handling, deep links
- Lighthouse audit pass (Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 90)
- Play Store preparation (signing keystore, metadata YAML, 8 screenshots @ 1080×1920, 5 listing copy variants)
- E2E testing — 10 chapter dari nol sampai final via Playwright atau manual checklist
- Optional follow-up: full optimistic lock dengan `updated_at` migration kalau MVP feedback shows stale approval masih jadi issue
