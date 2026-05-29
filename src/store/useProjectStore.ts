import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { projectsPart } from './parts/projects'
import { chaptersPart } from './parts/chapters'
import { lorebookPart } from './parts/lorebook'
import { outlinesPart } from './parts/outlines'
import type { ProjectsPart } from './parts/projects'
import type { ChaptersPart } from './parts/chapters'
import type { LorebookPart } from './parts/lorebook'
import type { OutlinesPart } from './parts/outlines'

export type ProjectStore = ProjectsPart & ChaptersPart & LorebookPart & OutlinesPart

export const useProjectStore = create<ProjectStore>()(
  persist(
    (...args) => ({
      ...projectsPart(...args),
      ...chaptersPart(...args),
      ...lorebookPart(...args),
      ...outlinesPart(...args),
    }),
    {
      name: 'vibenovel-outline-session',
      partialize: (state) => ({
        outlineProgress: state.outlineProgress,
        canonProposals: state.canonProposals,
      }),
    }
  )
)
