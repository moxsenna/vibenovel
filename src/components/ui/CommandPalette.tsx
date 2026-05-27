/**
 * CommandPalette ("Menu Pintas") — Sprint 9.6
 *
 * Cmd+K / Ctrl+K command palette inspired by Notion / Linear / Raycast.
 * Notion-grade calm — dark glass, fuzzy search, keyboard nav.
 *
 * Trigger: Cmd+K (any platform), or programmatic via setPaletteOpen(true).
 *
 * Layout:
 *   [Search input — autofocus]
 *   ─── Recent (collapsed if no recent or query active) ───
 *   ─── Navigasi ───
 *     • Ide Cerita
 *     • Rencana Bab
 *     ...
 *   ─── Tools ───
 *   ─── Pengaturan ───
 *
 * Keyboard:
 *   ArrowDown / ArrowUp — navigate list
 *   Enter — execute selected command
 *   Escape — close palette
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/useUiStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import {
  COMMANDS,
  filterCommands,
  type CommandContext,
  type CommandGroup,
  type PaletteCommand
} from '../../lib/command-registry'

const RECENT_KEY = 'vn_palette_recent_v1'
const RECENT_LIMIT = 5

const GROUP_LABEL: Record<CommandGroup, string> = {
  navigasi: 'Navigasi',
  tools: 'Bantuan AI',
  pengaturan: 'Pengaturan',
  lainnya: 'Lainnya'
}

const loadRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, RECENT_LIMIT) : []
  } catch {
    return []
  }
}

const pushRecent = (id: string) => {
  try {
    const current = loadRecent().filter((x) => x !== id)
    const next = [id, ...current].slice(0, RECENT_LIMIT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

interface CommandPaletteProps {
  /** Optional Recap opener exposed by Workspace ProseWriterPanel. */
  onOpenRecap?: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenRecap }) => {
  const paletteOpen = useUiStore((s) => s.paletteOpen)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const setMode = useUiStore((s) => s.setMode)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode)
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const openModal = useUiStore((s) => s.openModal)
  const setFreeWriteMode = useSettingsStore((s) => s.setFreeWriteMode)
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  const activeProject = useProjectStore((s) => s.activeProject)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync recent when palette opens (lazy initial)
  const [lastOpen, setLastOpen] = useState(paletteOpen)
  if (paletteOpen !== lastOpen) {
    setLastOpen(paletteOpen)
    if (paletteOpen) {
      setQuery('')
      setHighlightIndex(0)
      setRecentIds(loadRecent())
    }
  }

  // Auto-focus input when opened
  useEffect(() => {
    if (paletteOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [paletteOpen])

  // Build context for command handlers — stable identity per render
  const buildContext = useCallback(
    (): CommandContext => ({
      setMode,
      setActiveChapter,
      toggleFocusMode,
      toggleContextPanel,
      toggleTheme,
      toggleFreeWrite: () => setFreeWriteMode(!freeWriteMode),
      openModal,
      navigate,
      activeProjectId: activeProject?.id ?? null,
      openRecap: onOpenRecap
    }),
    [
      setMode,
      setActiveChapter,
      toggleFocusMode,
      toggleContextPanel,
      toggleTheme,
      setFreeWriteMode,
      freeWriteMode,
      openModal,
      navigate,
      activeProject,
      onOpenRecap
    ]
  )

  // Filtered command list — memoized
  const filteredCommands = useMemo(() => filterCommands(query), [query])

  // Recent commands (only shown when query empty)
  const recentCommands = useMemo(() => {
    if (query.trim()) return []
    return recentIds
      .map((id) => COMMANDS.find((c) => c.id === id))
      .filter((c): c is PaletteCommand => !!c)
  }, [recentIds, query])

  // Build display list: [recent...] then [filtered minus recent...] grouped
  const displayList = useMemo(() => {
    if (query.trim()) {
      return filteredCommands.map((cmd) => ({ cmd, isRecent: false }))
    }
    const recentSet = new Set(recentCommands.map((c) => c.id))
    const others = filteredCommands.filter((c) => !recentSet.has(c.id))
    return [
      ...recentCommands.map((cmd) => ({ cmd, isRecent: true })),
      ...others.map((cmd) => ({ cmd, isRecent: false }))
    ]
  }, [filteredCommands, recentCommands, query])

  // Clamp highlight when list changes
  if (highlightIndex >= displayList.length && displayList.length > 0) {
    setHighlightIndex(0)
  }

  const executeCommand = useCallback(
    async (cmd: PaletteCommand) => {
      pushRecent(cmd.id)
      setRecentIds(loadRecent())
      try {
        await cmd.handler(buildContext())
      } catch (e) {
        console.error('[CommandPalette] handler failed:', e)
      } finally {
        setPaletteOpen(false)
      }
    },
    [buildContext, setPaletteOpen]
  )

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setPaletteOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => (i + 1) % Math.max(1, displayList.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex(
          (i) => (i - 1 + Math.max(1, displayList.length)) % Math.max(1, displayList.length)
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = displayList[highlightIndex]
        if (item) executeCommand(item.cmd)
      }
    },
    [displayList, highlightIndex, executeCommand, setPaletteOpen]
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const child = listRef.current.querySelector(`[data-cmd-index="${highlightIndex}"]`)
    if (child && 'scrollIntoView' in child) {
      ;(child as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [highlightIndex])

  // Group items for display when query empty
  const groupedDisplay = useMemo(() => {
    type Section = {
      group: CommandGroup | 'recent'
      label: string
      items: { cmd: PaletteCommand; index: number }[]
    }
    const sections: Section[] = []
    let cursor = 0

    if (recentCommands.length > 0 && !query.trim()) {
      sections.push({
        group: 'recent',
        label: 'Terbaru',
        items: recentCommands.map((cmd) => ({ cmd, index: cursor++ }))
      })
    }

    if (query.trim()) {
      // Flat group when searching
      sections.push({
        group: 'navigasi',
        label: 'Hasil',
        items: displayList.map(({ cmd }) => ({ cmd, index: cursor++ }))
      })
      // Re-base cursor: when searching, just one section, indexes already 0..n-1
      return [
        {
          group: 'navigasi' as const,
          label: 'Hasil',
          items: displayList.map(({ cmd }, i) => ({ cmd, index: i }))
        }
      ]
    }

    const recentSet = new Set(recentCommands.map((c) => c.id))
    const groups: CommandGroup[] = ['navigasi', 'tools', 'pengaturan', 'lainnya']
    for (const g of groups) {
      const items = filteredCommands.filter((c) => c.group === g && !recentSet.has(c.id))
      if (items.length === 0) continue
      sections.push({
        group: g,
        label: GROUP_LABEL[g],
        items: items.map((cmd) => ({ cmd, index: cursor++ }))
      })
    }
    return sections
  }, [filteredCommands, recentCommands, displayList, query])

  if (!paletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="palette-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4"
        onClick={() => setPaletteOpen(false)}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Menu Pintas"
        aria-modal="true"
      >
        <motion.div
          key="palette-card"
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -4 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-[640px] bg-surface-container-high rounded-2xl border border-outline-variant/40 shadow-2xl inner-glow overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/15">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              bolt
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ketik yang ingin kamu lakukan..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlightIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 text-body-md focus:outline-none"
              aria-label="Cari aksi"
            />
            <span className="text-[10px] text-on-surface-variant/60 font-mono px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/20">
              ESC
            </span>
          </div>

          {/* List */}
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto py-2"
            role="listbox"
          >
            {displayList.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-body-md text-on-surface-variant">
                  Tidak ada perintah untuk &ldquo;{query}&rdquo;.
                </p>
                <p className="text-[11px] text-on-surface-variant/60 mt-1">
                  Coba kata kunci lain atau hapus query.
                </p>
              </div>
            ) : (
              groupedDisplay.map((section) => (
                <div key={section.group} className="mb-1">
                  <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 sticky top-0 bg-surface-container-high">
                    {section.label}
                  </div>
                  {section.items.map(({ cmd, index }) => {
                    const isHighlighted = index === highlightIndex
                    return (
                      <button
                        key={cmd.id}
                        data-cmd-index={index}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setHighlightIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                          isHighlighted
                            ? 'bg-primary/15 text-primary'
                            : 'text-on-surface hover:bg-surface-container'
                        }`}
                        role="option"
                        aria-selected={isHighlighted}
                      >
                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            isHighlighted ? 'text-primary' : 'text-on-surface-variant/70'
                          }`}
                        >
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-body-md font-medium truncate">
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div
                              className={`text-[11px] truncate ${
                                isHighlighted
                                  ? 'text-primary/80'
                                  : 'text-on-surface-variant/60'
                              }`}
                            >
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                              isHighlighted
                                ? 'bg-primary/20 text-primary'
                                : 'bg-surface-container-low text-on-surface-variant/70 border border-outline-variant/20'
                            }`}
                          >
                            {cmd.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-outline-variant/15 flex items-center justify-between text-[10px] text-on-surface-variant/60">
            <span>
              <kbd className="font-mono px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant/20 mr-1">
                ↑↓
              </kbd>
              navigasi
            </span>
            <span>
              <kbd className="font-mono px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant/20 mr-1">
                ↵
              </kbd>
              pilih
            </span>
            <span>
              {COMMANDS.length} perintah tersedia
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
