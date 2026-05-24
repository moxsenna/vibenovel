# Community 6: CoAuthor Chat & Brainstorming

This community represents the **CoAuthor Chat & Brainstorming** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `.chatCoAuthor()` | **CODE** | `src/services/ai/ai-router.ts` | L18 |
| `.generateChapterOutline()` | **CODE** | `src/services/ai/ai-router.ts` | L89 |
| `.generateProseBeat()` | **CODE** | `src/services/ai/ai-router.ts` | L167 |
| `.runQARadar()` | **CODE** | `src/services/ai/ai-router.ts` | L230 |
| `AiRouter` | **CODE** | `src/services/ai/ai-router.ts` | L13 |
| `ChatActions` | **CODE** | `src/store/useChatStore.ts` | L32 |
| `ChatMessage` | **CODE** | `src/store/useChatStore.ts` | L12 |
| `ChatState` | **CODE** | `src/store/useChatStore.ts` | L24 |
| `ChatStore` | **CODE** | `src/store/useChatStore.ts` | L45 |
| `CompassGap` | **CODE** | `src/prompts/brainstorm-agent.ts` | L18 |
| `CompassState` | **CODE** | `src/prompts/brainstorm-agent.ts` | L5 |
| `EMPTY_ARRAY` | **CODE** | `src/store/useChatStore.ts` | L47 |
| `brainstorm-agent.ts` | **CODE** | `src/prompts/brainstorm-agent.ts` | L1 |
| `buildBibleSummary()` | **CODE** | `src/prompts/brainstorm-agent.ts` | L198 |
| `buildCoAuthorSystemInstruction()` | **CODE** | `src/prompts/brainstorm-agent.ts` | L246 |
| `detectCompassGap()` | **CODE** | `src/prompts/brainstorm-agent.ts` | L28 |
| `getCoAuthorMode()` | **CODE** | `src/prompts/brainstorm-agent.ts` | L39 |
| `getCompassState()` | **CODE** | `src/store/useChatStore.ts` | L51 |
| `getGapGuidance()` | **CODE** | `src/prompts/brainstorm-agent.ts` | L46 |
| `useChatStore.ts` | **CODE** | `src/store/useChatStore.ts` | L1 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `brainstorm-agent.ts` --**contains**--> `CompassState` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `CompassGap` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `detectCompassGap()` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `getCoAuthorMode()` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `getGapGuidance()` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `buildBibleSummary()` _(EXTRACTED)_
- `brainstorm-agent.ts` --**contains**--> `buildCoAuthorSystemInstruction()` _(EXTRACTED)_
- `useChatStore.ts` --**imports_from**--> `brainstorm-agent.ts` _(EXTRACTED)_
- `useChatStore.ts` --**imports**--> `CompassState` _(EXTRACTED)_
- `useChatStore.ts` --**imports**--> `detectCompassGap()` _(EXTRACTED)_
- `buildCoAuthorSystemInstruction()` --**calls**--> `getCoAuthorMode()` _(EXTRACTED)_
- `buildCoAuthorSystemInstruction()` --**calls**--> `getGapGuidance()` _(EXTRACTED)_
- `buildCoAuthorSystemInstruction()` --**calls**--> `buildBibleSummary()` _(EXTRACTED)_
- `useChatStore.ts` --**imports**--> `buildCoAuthorSystemInstruction()` _(EXTRACTED)_
- `AiRouter` --**method**--> `.chatCoAuthor()` _(EXTRACTED)_
- `AiRouter` --**method**--> `.generateChapterOutline()` _(EXTRACTED)_
- `AiRouter` --**method**--> `.generateProseBeat()` _(EXTRACTED)_
- `AiRouter` --**method**--> `.runQARadar()` _(EXTRACTED)_
- `useChatStore.ts` --**imports**--> `AiRouter` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `ChatMessage` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `ChatState` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `ChatActions` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `ChatStore` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `EMPTY_ARRAY` _(EXTRACTED)_
- `useChatStore.ts` --**contains**--> `getCompassState()` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `CoAuthorChat.tsx` --**imports_from**--> `useChatStore.ts` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `Workspace.tsx` --**imports**--> `AiRouter` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `brainstorm-agent.ts` --**imports_from**--> `project.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `brainstorm-agent.ts` --**imports**--> `Character` (links to [Community 1: Story Compass & Projects](community_1.md))
- `brainstorm-agent.ts` --**imports**--> `Item` (links to [Community 1: Story Compass & Projects](community_1.md))
- `brainstorm-agent.ts` --**imports**--> `WorldRule` (links to [Community 1: Story Compass & Projects](community_1.md))
- `brainstorm-agent.ts` --**imports**--> `MysteryLayer` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ai-router.ts` --**contains**--> `AiRouter` (links to [Community 3: AI Router & Configuration](community_3.md))
- `useChatStore.ts` --**imports_from**--> `ai-router.ts` (links to [Community 3: AI Router & Configuration](community_3.md))
- `useChatStore.ts` --**imports_from**--> `useProjectStore.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `useChatStore.ts` --**imports**--> `useProjectStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useChatStore.ts` --**imports_from**--> `useSettingsStore.ts` (links to [Community 3: AI Router & Configuration](community_3.md))
- `useChatStore.ts` --**imports**--> `useSettingsStore` (links to [Community 3: AI Router & Configuration](community_3.md))
- `useChatStore.ts` --**contains**--> `useChatStore` (links to [Community 9: CoAuthor Chat Components](community_9.md))

---
[← Back to Wiki Home](index.md)