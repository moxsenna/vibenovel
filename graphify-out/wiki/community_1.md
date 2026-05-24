# Community 1: Story Compass & Projects

This community represents the **Story Compass & Projects** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `.pruneAndInject()` | **CODE** | `src/services/ai/context-injector.ts` | L15 |
| `BeatOutline` | **CODE** | `src/types/project.ts` | L99 |
| `Chapter` | **CODE** | `src/types/project.ts` | L106 |
| `Character` | **CODE** | `src/types/project.ts` | L28 |
| `CharacterGenesis` | **CODE** | `src/types/project.ts` | L4 |
| `CharacterRole` | **CODE** | `src/types/project.ts` | L3 |
| `CharacterState` | **CODE** | `src/types/project.ts` | L65 |
| `CompassStep` | **CODE** | `src/components/compass/StoryCompassPreview.tsx` | L7 |
| `ContextInjector` | **CODE** | `src/services/ai/context-injector.ts` | L10 |
| `DUMMY_CHAPTERS` | **CODE** | `src/store/useProjectStore.ts` | L118 |
| `DUMMY_CHARACTERS` | **CODE** | `src/store/useProjectStore.ts` | L52 |
| `DUMMY_ITEMS` | **CODE** | `src/store/useProjectStore.ts` | L91 |
| `DUMMY_PROJECTS` | **CODE** | `src/store/useProjectStore.ts` | L19 |
| `EmotionalPattern` | **CODE** | `src/types/project.ts` | L173 |
| `Item` | **CODE** | `src/types/project.ts` | L41 |
| `ItemCategory` | **CODE** | `src/types/project.ts` | L5 |
| `LoreCategory` | **CODE** | `src/types/project.ts` | L6 |
| `MysteryLayer` | **CODE** | `src/types/project.ts` | L160 |
| `PlotThread` | **CODE** | `src/types/project.ts` | L147 |
| `Project` | **CODE** | `src/types/project.ts` | L8 |
| `ProjectActions` | **CODE** | `src/store/useProjectStore.ts` | L207 |
| `ProjectState` | **CODE** | `src/store/useProjectStore.ts` | L195 |
| `ProjectStatus` | **CODE** | `src/types/project.ts` | L2 |
| `ProjectStore` | **CODE** | `src/store/useProjectStore.ts` | L239 |
| `PrunedContextResult` | **CODE** | `src/services/ai/context-injector.ts` | L3 |
| `Season` | **CODE** | `src/types/project.ts` | L78 |
| `StoryCompassPreview()` | **CODE** | `src/components/compass/StoryCompassPreview.tsx` | L22 |
| `StoryCompassPreview.tsx` | **CODE** | `src/components/compass/StoryCompassPreview.tsx` | L1 |
| `StoryCompassPreviewProps` | **CODE** | `src/components/compass/StoryCompassPreview.tsx` | L12 |
| `SubArc` | **CODE** | `src/types/project.ts` | L89 |
| `WorldRule` | **CODE** | `src/types/project.ts` | L54 |
| `context-injector.ts` | **CODE** | `src/services/ai/context-injector.ts` | L1 |
| `project.ts` | **CODE** | `src/types/project.ts` | L1 |
| `supabase` | **CODE** | `src/store/useProjectStore.ts` | L6 |
| `useProjectStore.ts` | **CODE** | `src/store/useProjectStore.ts` | L1 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `StoryCompassPreview.tsx` --**imports_from**--> `project.ts` _(EXTRACTED)_
- `StoryCompassPreview.tsx` --**imports**--> `Character` _(EXTRACTED)_
- `StoryCompassPreview.tsx` --**imports**--> `MysteryLayer` _(EXTRACTED)_
- `StoryCompassPreview.tsx` --**contains**--> `CompassStep` _(EXTRACTED)_
- `StoryCompassPreview.tsx` --**contains**--> `StoryCompassPreviewProps` _(EXTRACTED)_
- `StoryCompassPreview.tsx` --**contains**--> `StoryCompassPreview()` _(EXTRACTED)_
- `context-injector.ts` --**imports_from**--> `project.ts` _(EXTRACTED)_
- `context-injector.ts` --**imports**--> `Project` _(EXTRACTED)_
- `context-injector.ts` --**imports**--> `Character` _(EXTRACTED)_
- `context-injector.ts` --**imports**--> `Item` _(EXTRACTED)_
- `context-injector.ts` --**imports**--> `WorldRule` _(EXTRACTED)_
- `context-injector.ts` --**imports**--> `Chapter` _(EXTRACTED)_
- `context-injector.ts` --**contains**--> `PrunedContextResult` _(EXTRACTED)_
- `context-injector.ts` --**contains**--> `ContextInjector` _(EXTRACTED)_
- `ContextInjector` --**method**--> `.pruneAndInject()` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `supabase` _(EXTRACTED)_
- `useProjectStore.ts` --**imports_from**--> `project.ts` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `Project` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `Chapter` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `Character` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `Item` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `WorldRule` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `PlotThread` _(EXTRACTED)_
- `useProjectStore.ts` --**imports**--> `MysteryLayer` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `DUMMY_PROJECTS` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `DUMMY_CHARACTERS` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `DUMMY_ITEMS` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `DUMMY_CHAPTERS` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `ProjectState` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `ProjectActions` _(EXTRACTED)_
- `useProjectStore.ts` --**contains**--> `ProjectStore` _(EXTRACTED)_
- `project.ts` --**contains**--> `ProjectStatus` _(EXTRACTED)_
- `project.ts` --**contains**--> `CharacterRole` _(EXTRACTED)_
- `project.ts` --**contains**--> `CharacterGenesis` _(EXTRACTED)_
- `project.ts` --**contains**--> `ItemCategory` _(EXTRACTED)_
- `project.ts` --**contains**--> `LoreCategory` _(EXTRACTED)_
- `project.ts` --**contains**--> `Project` _(EXTRACTED)_
- `project.ts` --**contains**--> `Character` _(EXTRACTED)_
- `project.ts` --**contains**--> `Item` _(EXTRACTED)_
- `project.ts` --**contains**--> `WorldRule` _(EXTRACTED)_
- `project.ts` --**contains**--> `CharacterState` _(EXTRACTED)_
- `project.ts` --**contains**--> `Season` _(EXTRACTED)_
- `project.ts` --**contains**--> `SubArc` _(EXTRACTED)_
- `project.ts` --**contains**--> `BeatOutline` _(EXTRACTED)_
- `project.ts` --**contains**--> `Chapter` _(EXTRACTED)_
- `project.ts` --**contains**--> `PlotThread` _(EXTRACTED)_
- `project.ts` --**contains**--> `MysteryLayer` _(EXTRACTED)_
- `project.ts` --**contains**--> `EmotionalPattern` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `CoAuthorChat.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `ContextPanel.tsx` --**imports_from**--> `StoryCompassPreview.tsx` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `ContextPanel.tsx` --**imports**--> `StoryCompassPreview()` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `ProjectCard.tsx` --**imports_from**--> `project.ts` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `ProjectCard.tsx` --**imports**--> `ProjectStatus` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `ProjectCreationModal.tsx` --**imports_from**--> `project.ts` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `ContextPanel.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useProjectStore.ts` --**imports_from**--> `supabase.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useProjectStore.ts` --**imports**--> `supabase` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useProjectStore.ts` --**imports**--> `isSupabaseConfigured()` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Lobby.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**imports_from**--> `project.ts` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**imports**--> `Project` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Workspace.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Workspace.tsx` --**imports_from**--> `context-injector.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Workspace.tsx` --**imports**--> `ContextInjector` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `brainstorm-agent.ts` --**imports_from**--> `project.ts` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `brainstorm-agent.ts` --**imports**--> `Character` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `brainstorm-agent.ts` --**imports**--> `Item` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `brainstorm-agent.ts` --**imports**--> `WorldRule` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `brainstorm-agent.ts` --**imports**--> `MysteryLayer` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `ai-router.ts` --**imports_from**--> `project.ts` (links to [Community 3: AI Router & Configuration](community_3.md))
- `ai-router.ts` --**imports**--> `Project` (links to [Community 3: AI Router & Configuration](community_3.md))
- `useChatStore.ts` --**imports_from**--> `useProjectStore.ts` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `useProjectStore.ts` --**imports**--> `GenesisMode` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `useProjectStore.ts` --**contains**--> `useProjectStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `project.ts` --**contains**--> `GenesisMode` (links to [Community 4: Dashboard & Navigation](community_4.md))

---
[← Back to Wiki Home](index.md)