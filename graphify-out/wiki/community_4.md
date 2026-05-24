# Community 4: Dashboard & Navigation

This community represents the **Dashboard & Navigation** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `ArchiveCard()` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L203 |
| `ArchiveCardProps` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L198 |
| `BottomNavBar()` | **CODE** | `src/components/ui/BottomNavBar.tsx` | L15 |
| `BottomNavBar.tsx` | **CODE** | `src/components/ui/BottomNavBar.tsx` | L1 |
| `BottomNavBarProps` | **CODE** | `src/components/ui/BottomNavBar.tsx` | L3 |
| `GENRES` | **CODE** | `src/components/dashboard/ProjectCreationModal.tsx` | L10 |
| `GENRE_EMOJIS` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L36 |
| `GENRE_GRADIENTS` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L29 |
| `GenesisMode` | **CODE** | `src/types/project.ts` | L1 |
| `Lobby.tsx` | **CODE** | `src/pages/Lobby.tsx` | L1 |
| `NAV_ITEMS` | **CODE** | `src/components/ui/BottomNavBar.tsx` | L8 |
| `NewProjectCard()` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L183 |
| `ProjectCard()` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L43 |
| `ProjectCard.tsx` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L1 |
| `ProjectCardProps` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L4 |
| `ProjectCreationModal()` | **CODE** | `src/components/dashboard/ProjectCreationModal.tsx` | L12 |
| `ProjectCreationModal.tsx` | **CODE** | `src/components/dashboard/ProjectCreationModal.tsx` | L1 |
| `ProjectCreationModalProps` | **CODE** | `src/components/dashboard/ProjectCreationModal.tsx` | L4 |
| `STATUS_CONFIG` | **CODE** | `src/components/dashboard/ProjectCard.tsx` | L21 |
| `StatItem` | **CODE** | `src/components/dashboard/StatsBar.tsx` | L3 |
| `StatsBar()` | **CODE** | `src/components/dashboard/StatsBar.tsx` | L13 |
| `StatsBar.tsx` | **CODE** | `src/components/dashboard/StatsBar.tsx` | L1 |
| `StatsBarProps` | **CODE** | `src/components/dashboard/StatsBar.tsx` | L9 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `ProjectCard.tsx` --**contains**--> `ProjectCardProps` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `STATUS_CONFIG` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `GENRE_GRADIENTS` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `GENRE_EMOJIS` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `ProjectCard()` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `NewProjectCard()` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `ArchiveCardProps` _(EXTRACTED)_
- `ProjectCard.tsx` --**contains**--> `ArchiveCard()` _(EXTRACTED)_
- `Lobby.tsx` --**imports_from**--> `ProjectCard.tsx` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `ProjectCard()` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `NewProjectCard()` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `ArchiveCard()` _(EXTRACTED)_
- `ProjectCreationModal.tsx` --**imports**--> `GenesisMode` _(EXTRACTED)_
- `ProjectCreationModal.tsx` --**contains**--> `ProjectCreationModalProps` _(EXTRACTED)_
- `ProjectCreationModal.tsx` --**contains**--> `GENRES` _(EXTRACTED)_
- `ProjectCreationModal.tsx` --**contains**--> `ProjectCreationModal()` _(EXTRACTED)_
- `Lobby.tsx` --**imports_from**--> `ProjectCreationModal.tsx` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `ProjectCreationModal()` _(EXTRACTED)_
- `StatsBar.tsx` --**contains**--> `StatItem` _(EXTRACTED)_
- `StatsBar.tsx` --**contains**--> `StatsBarProps` _(EXTRACTED)_
- `StatsBar.tsx` --**contains**--> `StatsBar()` _(EXTRACTED)_
- `Lobby.tsx` --**imports_from**--> `StatsBar.tsx` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `StatsBar()` _(EXTRACTED)_
- `BottomNavBar.tsx` --**contains**--> `BottomNavBarProps` _(EXTRACTED)_
- `BottomNavBar.tsx` --**contains**--> `NAV_ITEMS` _(EXTRACTED)_
- `BottomNavBar.tsx` --**contains**--> `BottomNavBar()` _(EXTRACTED)_
- `Lobby.tsx` --**imports_from**--> `BottomNavBar.tsx` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `BottomNavBar()` _(EXTRACTED)_
- `Lobby.tsx` --**imports**--> `GenesisMode` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `App.tsx` --**imports_from**--> `Lobby.tsx` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `ProjectCard.tsx` --**imports_from**--> `project.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ProjectCard.tsx` --**imports**--> `ProjectStatus` (links to [Community 1: Story Compass & Projects](community_1.md))
- `ProjectCreationModal.tsx` --**imports_from**--> `project.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Lobby.tsx` --**imports_from**--> `SettingsModal.tsx` (links to [Community 3: AI Router & Configuration](community_3.md))
- `Lobby.tsx` --**imports**--> `SettingsModal()` (links to [Community 3: AI Router & Configuration](community_3.md))
- `Lobby.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Lobby.tsx` --**imports**--> `useProjectStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Lobby.tsx` --**imports_from**--> `useUiStore.ts` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Lobby.tsx` --**imports**--> `useUiStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Lobby.tsx` --**imports_from**--> `project.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Lobby.tsx` --**imports**--> `Project` (links to [Community 1: Story Compass & Projects](community_1.md))
- `Lobby.tsx` --**contains**--> `Lobby()` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useProjectStore.ts` --**imports**--> `GenesisMode` (links to [Community 1: Story Compass & Projects](community_1.md))
- `project.ts` --**contains**--> `GenesisMode` (links to [Community 1: Story Compass & Projects](community_1.md))

---
[← Back to Wiki Home](index.md)