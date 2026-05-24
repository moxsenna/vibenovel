# Community 3: AI Router & Configuration

This community represents the **AI Router & Configuration** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `.generateContent()` | **CODE** | `src/services/ai/openrouter-adapter.ts` | L7 |
| `AISettings` | **CODE** | `src/services/ai/types.ts` | L1 |
| `BrainstormInput` | **CODE** | `src/services/ai/types.ts` | L13 |
| `BrainstormResponse` | **CODE** | `src/services/ai/types.ts` | L22 |
| `ChatMessageParam` | **CODE** | `src/services/ai/types.ts` | L8 |
| `KeyStatus` | **CODE** | `src/services/ai/gemini-pool.ts` | L3 |
| `OpenRouterAdapter` | **CODE** | `src/services/ai/openrouter-adapter.ts` | L3 |
| `OutlineGenerateInput` | **CODE** | `src/services/ai/types.ts` | L30 |
| `OutlineResponse` | **CODE** | `src/services/ai/types.ts` | L43 |
| `ProseGenerateInput` | **CODE** | `src/services/ai/types.ts` | L67 |
| `ProseResponse` | **CODE** | `src/services/ai/types.ts` | L86 |
| `QARadarInput` | **CODE** | `src/services/ai/types.ts` | L92 |
| `QARadarResponse` | **CODE** | `src/services/ai/types.ts` | L101 |
| `SettingsActions` | **CODE** | `src/store/useSettingsStore.ts` | L12 |
| `SettingsModal()` | **CODE** | `src/components/modals/SettingsModal.tsx` | L9 |
| `SettingsModal.tsx` | **CODE** | `src/components/modals/SettingsModal.tsx` | L1 |
| `SettingsModalProps` | **CODE** | `src/components/modals/SettingsModal.tsx` | L4 |
| `SettingsState` | **CODE** | `src/store/useSettingsStore.ts` | L4 |
| `SettingsStore` | **CODE** | `src/store/useSettingsStore.ts` | L21 |
| `ai-router.ts` | **CODE** | `src/services/ai/ai-router.ts` | L1 |
| `gemini-pool.ts` | **CODE** | `src/services/ai/gemini-pool.ts` | L1 |
| `openrouter-adapter.ts` | **CODE** | `src/services/ai/openrouter-adapter.ts` | L1 |
| `types.ts` | **CODE** | `src/services/ai/types.ts` | L1 |
| `useSettingsStore` | **CODE** | `src/store/useSettingsStore.ts` | L23 |
| `useSettingsStore.ts` | **CODE** | `src/store/useSettingsStore.ts` | L1 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `SettingsModal.tsx` --**imports_from**--> `useSettingsStore.ts` _(EXTRACTED)_
- `SettingsModal.tsx` --**imports**--> `useSettingsStore` _(EXTRACTED)_
- `SettingsModal.tsx` --**contains**--> `SettingsModalProps` _(EXTRACTED)_
- `SettingsModal.tsx` --**contains**--> `SettingsModal()` _(EXTRACTED)_
- `SettingsModal()` --**calls**--> `useSettingsStore` _(EXTRACTED)_
- `ai-router.ts` --**imports_from**--> `gemini-pool.ts` _(EXTRACTED)_
- `ai-router.ts` --**imports_from**--> `openrouter-adapter.ts` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `OpenRouterAdapter` _(EXTRACTED)_
- `ai-router.ts` --**imports_from**--> `types.ts` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `OutlineGenerateInput` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `OutlineResponse` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `ProseGenerateInput` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `ProseResponse` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `QARadarInput` _(EXTRACTED)_
- `ai-router.ts` --**imports**--> `QARadarResponse` _(EXTRACTED)_
- `gemini-pool.ts` --**imports_from**--> `useSettingsStore.ts` _(EXTRACTED)_
- `gemini-pool.ts` --**imports**--> `useSettingsStore` _(EXTRACTED)_
- `gemini-pool.ts` --**contains**--> `KeyStatus` _(EXTRACTED)_
- `openrouter-adapter.ts` --**imports_from**--> `useSettingsStore.ts` _(EXTRACTED)_
- `openrouter-adapter.ts` --**imports**--> `useSettingsStore` _(EXTRACTED)_
- `openrouter-adapter.ts` --**contains**--> `OpenRouterAdapter` _(EXTRACTED)_
- `OpenRouterAdapter` --**method**--> `.generateContent()` _(EXTRACTED)_
- `types.ts` --**contains**--> `AISettings` _(EXTRACTED)_
- `types.ts` --**contains**--> `ChatMessageParam` _(EXTRACTED)_
- `types.ts` --**contains**--> `BrainstormInput` _(EXTRACTED)_
- `types.ts` --**contains**--> `BrainstormResponse` _(EXTRACTED)_
- `types.ts` --**contains**--> `OutlineGenerateInput` _(EXTRACTED)_
- `types.ts` --**contains**--> `OutlineResponse` _(EXTRACTED)_
- `types.ts` --**contains**--> `ProseGenerateInput` _(EXTRACTED)_
- `types.ts` --**contains**--> `ProseResponse` _(EXTRACTED)_
- `types.ts` --**contains**--> `QARadarInput` _(EXTRACTED)_
- `types.ts` --**contains**--> `QARadarResponse` _(EXTRACTED)_
- `useSettingsStore.ts` --**contains**--> `SettingsState` _(EXTRACTED)_
- `useSettingsStore.ts` --**contains**--> `SettingsActions` _(EXTRACTED)_
- `useSettingsStore.ts` --**contains**--> `SettingsStore` _(EXTRACTED)_
- `useSettingsStore.ts` --**contains**--> `useSettingsStore` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `Lobby.tsx` --**imports_from**--> `SettingsModal.tsx` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**imports**--> `SettingsModal()` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Workspace.tsx` --**imports_from**--> `ai-router.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `ai-router.ts` --**imports_from**--> `project.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ai-router.ts` --**imports**--> `Project` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ai-router.ts` --**imports**--> `GeminiPool` (links to [Community 10: Gemini API Pool Layer](community_10.md))
- `ai-router.ts` --**contains**--> `AiRouter` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `useChatStore.ts` --**imports_from**--> `ai-router.ts` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `gemini-pool.ts` --**contains**--> `GeminiPool` (links to [Community 10: Gemini API Pool Layer](community_10.md))
- `useChatStore.ts` --**imports_from**--> `useSettingsStore.ts` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `useChatStore.ts` --**imports**--> `useSettingsStore` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))

---
[← Back to Wiki Home](index.md)