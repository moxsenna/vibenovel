import type { WorkspaceMode } from '../store/useUiStore'

export interface WorkspaceModeConfig {
  id: WorkspaceMode
  label: string
  shortLabel: string
  icon: string
  commandLabel: string
  description: string
  keywords: string[]
  shortcut: string
}

export const WORKSPACE_MODES: readonly WorkspaceModeConfig[] = [
  {
    id: 'brainstorm',
    label: 'Ide Cerita',
    shortLabel: 'Ide',
    icon: 'chat',
    commandLabel: 'Buka Ide Cerita',
    description: 'Ngobrol dengan Co-Author dan lengkapi dasar cerita',
    keywords: ['brainstorm', 'chat', 'diskusi', 'ide', 'cerita', 'co-author', 'ngobrol'],
    shortcut: 'Ctrl+1'
  },
  {
    id: 'outline',
    label: 'Rencana Bab',
    shortLabel: 'Rencana',
    icon: 'list_alt',
    commandLabel: 'Buka Rencana Bab',
    description: 'Susun alur bab sebelum mulai menulis',
    keywords: ['outline', 'rangka', 'rencana', 'bab', 'alur', 'storyboard', 'lorebook'],
    shortcut: 'Ctrl+2'
  },
  {
    id: 'write',
    label: 'Naskah',
    shortLabel: 'Naskah',
    icon: 'edit',
    commandLabel: 'Buka Naskah',
    description: 'Tempat menulis dan melanjutkan bab',
    keywords: ['write', 'menulis', 'naskah', 'prose', 'prosa', 'tulis', 'edit'],
    shortcut: 'Ctrl+3'
  },
  {
    id: 'review',
    label: 'Cek Cerita',
    shortLabel: 'Cek',
    icon: 'radar',
    commandLabel: 'Cek Cerita',
    description: 'Periksa alur, emosi, dan hal yang terasa janggal',
    keywords: ['review', 'qa', 'plot radar', 'tinjau', 'cek', 'alur', 'masalah'],
    shortcut: 'Ctrl+4'
  },
  {
    id: 'visualize',
    label: 'Peta Cerita',
    shortLabel: 'Peta',
    icon: 'analytics',
    commandLabel: 'Buka Peta Cerita',
    description: 'Lihat peta emosi, tokoh, timeline, dan jumlah kata',
    keywords: ['visualize', 'visualisasi', 'peta', 'chart', 'grafik', 'heatmap'],
    shortcut: 'Ctrl+5'
  }
] as const

export const getWorkspaceMode = (mode: WorkspaceMode): WorkspaceModeConfig =>
  WORKSPACE_MODES.find((item) => item.id === mode) ?? WORKSPACE_MODES[0]
