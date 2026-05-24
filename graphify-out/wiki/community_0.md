# Community 0: Workspace & UI Theme Sync

This community represents the **Workspace & UI Theme Sync** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `App()` | **CODE** | `src/App.tsx` | L38 |
| `App.tsx` | **CODE** | `src/App.tsx` | L1 |
| `AuthLoader()` | **CODE** | `src/App.tsx` | L10 |
| `AuthMode` | **CODE** | `src/pages/Login.tsx` | L6 |
| `AuthState` | **CODE** | `src/hooks/useAuth.ts` | L5 |
| `ContextPanel()` | **CODE** | `src/components/workspace/ContextPanel.tsx` | L7 |
| `ContextPanel.tsx` | **CODE** | `src/components/workspace/ContextPanel.tsx` | L1 |
| `Database` | **CODE** | `src/lib/database.types.ts` | L6 |
| `Json` | **CODE** | `src/lib/database.types.ts` | L4 |
| `Lobby()` | **CODE** | `src/pages/Lobby.tsx` | L13 |
| `Login()` | **CODE** | `src/pages/Login.tsx` | L8 |
| `Login.tsx` | **CODE** | `src/pages/Login.tsx` | L1 |
| `MODES` | **CODE** | `src/components/workspace/ModeSwitcher.tsx` | L6 |
| `MODES` | **CODE** | `src/pages/Workspace.tsx` | L15 |
| `ModeSwitcher()` | **CODE** | `src/components/workspace/ModeSwitcher.tsx` | L13 |
| `ModeSwitcher.tsx` | **CODE** | `src/components/workspace/ModeSwitcher.tsx` | L1 |
| `ProtectedRoute()` | **CODE** | `src/App.tsx` | L24 |
| `QaLogs` | **CODE** | `src/store/useUiStore.ts` | L6 |
| `UiActions` | **CODE** | `src/store/useUiStore.ts` | L21 |
| `UiState` | **CODE** | `src/store/useUiStore.ts` | L11 |
| `UiStore` | **CODE** | `src/store/useUiStore.ts` | L32 |
| `Workspace()` | **CODE** | `src/pages/Workspace.tsx` | L22 |
| `Workspace.tsx` | **CODE** | `src/pages/Workspace.tsx` | L1 |
| `WorkspaceMode` | **CODE** | `src/store/useUiStore.ts` | L4 |
| `database.types.ts` | **CODE** | `src/lib/database.types.ts` | L1 |
| `isSupabaseConfigured()` | **CODE** | `src/lib/supabase.ts` | L26 |
| `main.tsx` | **CODE** | `src/main.tsx` | L1 |
| `supabase` | **CODE** | `src/lib/supabase.ts` | L14 |
| `supabase.ts` | **CODE** | `src/lib/supabase.ts` | L1 |
| `supabaseAnonKey` | **CODE** | `src/lib/supabase.ts` | L5 |
| `supabaseUrl` | **CODE** | `src/lib/supabase.ts` | L4 |
| `useAuth()` | **CODE** | `src/hooks/useAuth.ts` | L12 |
| `useAuth.ts` | **CODE** | `src/hooks/useAuth.ts` | L1 |
| `useProjectStore` | **CODE** | `src/store/useProjectStore.ts` | L241 |
| `useUiStore` | **CODE** | `src/store/useUiStore.ts` | L34 |
| `useUiStore.ts` | **CODE** | `src/store/useUiStore.ts` | L1 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `App.tsx` --**imports_from**--> `Login.tsx` _(EXTRACTED)_
- `App.tsx` --**imports**--> `Login()` _(EXTRACTED)_
- `App.tsx` --**imports**--> `Lobby()` _(EXTRACTED)_
- `App.tsx` --**imports_from**--> `Workspace.tsx` _(EXTRACTED)_
- `App.tsx` --**imports**--> `Workspace()` _(EXTRACTED)_
- `App.tsx` --**imports_from**--> `useUiStore.ts` _(EXTRACTED)_
- `App.tsx` --**imports**--> `useUiStore` _(EXTRACTED)_
- `App.tsx` --**imports_from**--> `useAuth.ts` _(EXTRACTED)_
- `App.tsx` --**imports**--> `useAuth()` _(EXTRACTED)_
- `App.tsx` --**contains**--> `AuthLoader()` _(EXTRACTED)_
- `App.tsx` --**contains**--> `ProtectedRoute()` _(EXTRACTED)_
- `App.tsx` --**contains**--> `App()` _(EXTRACTED)_
- `main.tsx` --**imports_from**--> `App.tsx` _(EXTRACTED)_
- `ProtectedRoute()` --**calls**--> `useAuth()` _(EXTRACTED)_
- `App()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `App()` --**calls**--> `useAuth()` _(EXTRACTED)_
- `ContextPanel.tsx` --**imports_from**--> `useUiStore.ts` _(EXTRACTED)_
- `ContextPanel.tsx` --**imports**--> `useUiStore` _(EXTRACTED)_
- `ContextPanel.tsx` --**imports**--> `useProjectStore` _(EXTRACTED)_
- `ContextPanel.tsx` --**contains**--> `ContextPanel()` _(EXTRACTED)_
- `Workspace.tsx` --**imports_from**--> `ContextPanel.tsx` _(EXTRACTED)_
- `Workspace.tsx` --**imports**--> `ContextPanel()` _(EXTRACTED)_
- `ContextPanel()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `ContextPanel()` --**calls**--> `useProjectStore` _(EXTRACTED)_
- `ModeSwitcher.tsx` --**imports_from**--> `useUiStore.ts` _(EXTRACTED)_
- `ModeSwitcher.tsx` --**imports**--> `useUiStore` _(EXTRACTED)_
- `ModeSwitcher.tsx` --**imports**--> `WorkspaceMode` _(EXTRACTED)_
- `ModeSwitcher.tsx` --**contains**--> `MODES` _(EXTRACTED)_
- `ModeSwitcher.tsx` --**contains**--> `ModeSwitcher()` _(EXTRACTED)_
- `Workspace.tsx` --**imports_from**--> `ModeSwitcher.tsx` _(EXTRACTED)_
- `Workspace.tsx` --**imports**--> `ModeSwitcher()` _(EXTRACTED)_
- `ModeSwitcher()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `useAuth.ts` --**imports_from**--> `supabase.ts` _(EXTRACTED)_
- `useAuth.ts` --**imports**--> `supabase` _(EXTRACTED)_
- `useAuth.ts` --**imports**--> `isSupabaseConfigured()` _(EXTRACTED)_
- `useAuth.ts` --**contains**--> `AuthState` _(EXTRACTED)_
- `useAuth.ts` --**contains**--> `useAuth()` _(EXTRACTED)_
- `useAuth()` --**calls**--> `isSupabaseConfigured()` _(EXTRACTED)_
- `database.types.ts` --**contains**--> `Json` _(EXTRACTED)_
- `database.types.ts` --**contains**--> `Database` _(EXTRACTED)_
- `supabase.ts` --**imports_from**--> `database.types.ts` _(EXTRACTED)_
- `supabase.ts` --**imports**--> `Database` _(EXTRACTED)_
- `supabase.ts` --**contains**--> `supabaseUrl` _(EXTRACTED)_
- `supabase.ts` --**contains**--> `supabaseAnonKey` _(EXTRACTED)_
- `supabase.ts` --**contains**--> `supabase` _(EXTRACTED)_
- `supabase.ts` --**contains**--> `isSupabaseConfigured()` _(EXTRACTED)_
- `Login.tsx` --**imports_from**--> `supabase.ts` _(EXTRACTED)_
- `Login.tsx` --**imports**--> `supabase` _(EXTRACTED)_
- `Login.tsx` --**imports**--> `isSupabaseConfigured()` _(EXTRACTED)_
- `Login()` --**calls**--> `isSupabaseConfigured()` _(EXTRACTED)_
- `Lobby()` --**calls**--> `useProjectStore` _(EXTRACTED)_
- `Lobby()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `Login.tsx` --**imports_from**--> `useUiStore.ts` _(EXTRACTED)_
- `Login.tsx` --**imports**--> `useUiStore` _(EXTRACTED)_
- `Login.tsx` --**contains**--> `AuthMode` _(EXTRACTED)_
- `Login.tsx` --**contains**--> `Login()` _(EXTRACTED)_
- `Login()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `Workspace.tsx` --**imports**--> `useProjectStore` _(EXTRACTED)_
- `Workspace.tsx` --**imports_from**--> `useUiStore.ts` _(EXTRACTED)_
- `Workspace.tsx` --**imports**--> `useUiStore` _(EXTRACTED)_
- `Workspace.tsx` --**imports**--> `WorkspaceMode` _(EXTRACTED)_
- `Workspace.tsx` --**contains**--> `MODES` _(EXTRACTED)_
- `Workspace.tsx` --**contains**--> `Workspace()` _(EXTRACTED)_
- `Workspace()` --**calls**--> `useUiStore` _(EXTRACTED)_
- `Workspace()` --**calls**--> `useProjectStore` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `WorkspaceMode` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `QaLogs` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `UiState` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `UiActions` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `UiStore` _(EXTRACTED)_
- `useUiStore.ts` --**contains**--> `useUiStore` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `App.tsx` --**imports_from**--> `Lobby.tsx` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `CoAuthorChat.tsx` --**imports**--> `useProjectStore` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `Workspace.tsx` --**imports_from**--> `CoAuthorChat.tsx` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `Workspace.tsx` --**imports**--> `CoAuthorChat()` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `CoAuthorChat()` --**calls**--> `useProjectStore` (links to [Community 9: CoAuthor Chat Components](community_9.md))
- `ContextPanel.tsx` --**imports_from**--> `StoryCompassPreview.tsx` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ContextPanel.tsx` --**imports**--> `StoryCompassPreview()` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ContextPanel.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `useProjectStore.ts` --**imports_from**--> `supabase.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `useProjectStore.ts` --**imports**--> `supabase` (links to [Community 1: Story Compass & Projects](community_1.md))
- `useProjectStore.ts` --**imports**--> `isSupabaseConfigured()` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Lobby.tsx` --**imports**--> `useProjectStore` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**imports_from**--> `useUiStore.ts` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**imports**--> `useUiStore` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Lobby.tsx` --**contains**--> `Lobby()` (links to [Community 4: Dashboard & Navigation](community_4.md))
- `Workspace.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Workspace.tsx` --**imports_from**--> `ai-router.ts` (links to [Community 3: AI Router & Configuration](community_3.md))
- `Workspace.tsx` --**imports**--> `AiRouter` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `Workspace.tsx` --**imports_from**--> `context-injector.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Workspace.tsx` --**imports**--> `ContextInjector` (links to [Community 1: Story Compass & Projects](community_1.md))
- `useChatStore.ts` --**imports**--> `useProjectStore` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `useProjectStore.ts` --**contains**--> `useProjectStore` (links to [Community 1: Story Compass & Projects](community_1.md))

---
[← Back to Wiki Home](index.md)