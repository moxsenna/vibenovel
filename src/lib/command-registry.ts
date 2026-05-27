/**
 * Command Registry — Sprint 9.6
 *
 * Static command list untuk Ctrl/Cmd+K Menu Pintas palette.
 * Setiap command bisa langsung di-handle saat user pilih, atau parameterized
 * (e.g., navigate to chapter N — disolve di runtime via context).
 *
 * Commands dikelompokkan ke 4 group:
 *  - Navigasi: switch mode, jump to chapter
 *  - Tools: AI tools (Recap, Mimicry, Reindex, Director's Cut hint)
 *  - Pengaturan: toggle focus mode, theme, free write, open settings
 *  - Lainnya: meta (logout, dll — future)
 */

import { WORKSPACE_MODES } from './workspace-modes'

export type CommandGroup = 'navigasi' | 'tools' | 'pengaturan' | 'lainnya'

export interface PaletteCommand {
  id: string
  label: string
  description?: string
  icon: string // Material Symbols name
  group: CommandGroup
  /** Search keywords (Indonesian + English) for fuzzy match. */
  keywords: string[]
  /** Optional shortcut hint to display, e.g. "Cmd+1". */
  shortcut?: string
  /** Handler is invoked dengan context object yang punya store actions. */
  handler: (ctx: CommandContext) => void | Promise<void>
}

export interface CommandContext {
  setMode: (mode: 'brainstorm' | 'outline' | 'write' | 'review' | 'visualize') => void
  setActiveChapter: (n: number) => void
  toggleFocusMode: () => void
  toggleContextPanel: () => void
  toggleTheme: () => void
  toggleFreeWrite: () => void
  openModal: (name: string | null) => void
  navigate: (path: string) => void
  /** Currently active project (for chapter list parameterization). */
  activeProjectId: string | null
  /** Open recap modal callback if Workspace exposes it. */
  openRecap?: () => void
}

// ── Navigation Commands ──────────────────────────────────────────────────

const navigationCommands: PaletteCommand[] = [
  ...WORKSPACE_MODES.map((mode): PaletteCommand => ({
    id: `mode.${mode.id}`,
    label: mode.commandLabel,
    description: mode.description,
    icon: mode.icon,
    group: 'navigasi',
    keywords: mode.keywords,
    shortcut: mode.shortcut,
    handler: (ctx) => ctx.setMode(mode.id)
  })),
  {
    id: 'panel.toggle',
    label: 'Buka / Tutup Panel Konteks',
    description: 'Tampilkan atau sembunyikan catatan cerita di samping',
    icon: 'menu',
    group: 'navigasi',
    keywords: ['panel', 'sidebar', 'context', 'catatan', 'toggle', 'buka', 'tutup'],
    handler: (ctx) => ctx.toggleContextPanel()
  }
]

// ── Tools Commands ───────────────────────────────────────────────────────

const toolsCommands: PaletteCommand[] = [
  {
    id: 'tool.recap',
    label: 'Buat Recap Pembaca',
    description: '"Sebelumnya..." untuk pembaca',
    icon: 'auto_stories',
    group: 'tools',
    keywords: ['recap', 'sebelumnya', 'ringkasan', 'summary'],
    handler: (ctx) => {
      // Recap modal lives di ProseWriterPanel — guide user via mode switch.
      ctx.setMode('write')
      ctx.openRecap?.()
    }
  },
  {
    id: 'tool.mimicry',
    label: 'Buka Gaya Tulisanmu',
    description: 'Pelajari gaya tulisan dari contoh naskah',
    icon: 'auto_fix_high',
    group: 'tools',
    keywords: ['mimicry', 'gaya', 'voice dna', 'tulisan', 'style'],
    handler: (ctx) => ctx.openModal('settings')
  },
  {
    id: 'tool.reindex',
    label: 'Sinkronisasi Memori AI',
    description: 'Rapikan ingatan AI setelah import atau tulis manual',
    icon: 'memory',
    group: 'tools',
    keywords: ['reindex', 'sinkronisasi', 'memori', 'sync', 'rebuild'],
    handler: (ctx) => ctx.openModal('reindex')
  }
]

// ── Settings Commands ────────────────────────────────────────────────────

const settingsCommands: PaletteCommand[] = [
  {
    id: 'setting.focus',
    label: 'Mode Fokus',
    description: 'Sembunyikan panel agar layar menulis lebih lapang',
    icon: 'center_focus_strong',
    group: 'pengaturan',
    keywords: ['focus', 'fokus', 'distraction', 'mode', 'lapang', 'bersih'],
    handler: (ctx) => ctx.toggleFocusMode()
  },
  {
    id: 'setting.theme',
    label: 'Ganti Tema',
    description: 'Ganti antara Malam Kreatif dan Jurnal Cantik',
    icon: 'palette',
    group: 'pengaturan',
    keywords: ['theme', 'tema', 'dark', 'light', 'gelap', 'terang'],
    handler: (ctx) => ctx.toggleTheme()
  },
  {
    id: 'setting.freewrite',
    label: 'Tulis Bebas',
    description: 'Menulis manual tanpa arahan beat dari AI',
    icon: 'lock_open',
    group: 'pengaturan',
    keywords: ['free write', 'bebas', 'drafting', 'lepas'],
    handler: (ctx) => ctx.toggleFreeWrite()
  },
  {
    id: 'setting.open',
    label: 'Buka Pengaturan',
    description: 'API keys, gaya tulisan, dan tutorial',
    icon: 'settings',
    group: 'pengaturan',
    keywords: ['settings', 'pengaturan', 'config', 'api key', 'byok'],
    handler: (ctx) => ctx.openModal('settings')
  }
]

// ── Other Commands ───────────────────────────────────────────────────────

const otherCommands: PaletteCommand[] = [
  {
    id: 'meta.lobby',
    label: 'Kembali ke Beranda',
    description: 'Tutup proyek dan ke daftar novel',
    icon: 'home',
    group: 'lainnya',
    keywords: ['lobby', 'beranda', 'home', 'kembali', 'dashboard'],
    handler: (ctx) => ctx.navigate('/')
  }
]

// ── Combined Registry ───────────────────────────────────────────────────

export const COMMANDS: PaletteCommand[] = [
  ...navigationCommands,
  ...toolsCommands,
  ...settingsCommands,
  ...otherCommands
]

/**
 * Score command relevance against user's query.
 * Higher score = better match. 0 = no match.
 *
 * Algorithm:
 *  - Empty query: all commands score 1 (sorted by group order).
 *  - Word-starts match in label: +10 per token.
 *  - Substring match in label: +5 per token.
 *  - Word-starts in keyword: +3 per token.
 *  - Substring in keyword: +1 per token.
 */
export function scoreCommand(cmd: PaletteCommand, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 1

  const tokens = q.split(/\s+/).filter(Boolean)
  let score = 0

  const label = cmd.label.toLowerCase()
  const description = (cmd.description ?? '').toLowerCase()
  const keywordBlob = cmd.keywords.join(' ').toLowerCase()

  for (const token of tokens) {
    // Label word-starts (e.g. "out" matches "outline" at word boundary)
    if (new RegExp(`\\b${escapeRegex(token)}`).test(label)) score += 10
    else if (label.includes(token)) score += 5

    if (new RegExp(`\\b${escapeRegex(token)}`).test(keywordBlob)) score += 3
    else if (keywordBlob.includes(token)) score += 1

    if (description.includes(token)) score += 0.5
  }

  return score
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Filter + sort commands by query.
 * Returns commands with score > 0, sorted desc by score.
 * If query empty, returns all in group order.
 */
export function filterCommands(query: string): PaletteCommand[] {
  if (!query.trim()) return COMMANDS
  const scored = COMMANDS.map((c) => ({ cmd: c, score: scoreCommand(c, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.map((s) => s.cmd)
}
