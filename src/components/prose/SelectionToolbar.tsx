import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SelectionInfo {
  start: number
  end: number
  text: string
  /** Anchor coordinates relative to viewport for floating toolbar. */
  anchorX: number
  anchorY: number
}

interface SelectionToolbarProps {
  selection: SelectionInfo | null
  /** Called when the user submits a Magic Edit instruction. */
  onMagicEdit: (selection: SelectionInfo, instruction: string) => void
  /** Called when the user wants to open the Director's Cut modal. */
  onDirectorsCut: (selection: SelectionInfo) => void
}

/**
 * Floating mini-toolbar (Notion / Medium style).
 *
 * The parent owns the selection state — when it forwards a non-null
 * `selection`, the toolbar pops up above the anchor. Buttons trigger
 * callbacks; the parent decides what to do with them.
 */
export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selection,
  onMagicEdit,
  onDirectorsCut
}) => {
  const [magicOpen, setMagicOpen] = useState(false)
  const [instruction, setInstruction] = useState('')

  // Reset prompt whenever the active selection changes — derived during render
  // to satisfy react-hooks/set-state-in-effect.
  const selectionKey = selection ? `${selection.start}__${selection.end}__${selection.text}` : '__none__'
  const [prevSelectionKey, setPrevSelectionKey] = useState<string>(selectionKey)
  if (prevSelectionKey !== selectionKey) {
    setPrevSelectionKey(selectionKey)
    setMagicOpen(false)
    setInstruction('')
  }

  const submitMagic = () => {
    if (!selection || !instruction.trim()) return
    onMagicEdit(selection, instruction.trim())
  }

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[60] bg-surface-container-high border border-primary/30 rounded-xl shadow-xl backdrop-blur-md overflow-hidden inner-glow"
          style={{
            left: clampX(selection.anchorX),
            top: Math.max(8, selection.anchorY - 56)
          }}
          onMouseDown={(e) => {
            // Prevent the textarea from collapsing the selection while we
            // click a toolbar button.
            e.preventDefault()
          }}
        >
          {magicOpen ? (
            <div className="flex items-center gap-2 p-2">
              <input
                autoFocus
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Buat lebih singkat / dramatis / lucu..."
                className="w-72 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && instruction.trim()) {
                    submitMagic()
                  } else if (e.key === 'Escape') {
                    setMagicOpen(false)
                  }
                }}
              />
              <button
                onClick={submitMagic}
                disabled={!instruction.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                Tulis Ulang
              </button>
              <button
                onClick={() => setMagicOpen(false)}
                className="px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
                aria-label="Batal"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-stretch divide-x divide-outline-variant/30">
              <ToolbarButton
                icon="auto_fix"
                label="Magic Edit"
                onClick={() => setMagicOpen(true)}
              />
              <ToolbarButton
                icon="movie_filter"
                label="Director's Cut"
                onClick={() => onDirectorsCut(selection)}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function clampX(x: number): number {
  if (typeof window === 'undefined') return x
  const padding = 8
  const max = window.innerWidth - 320 - padding
  return Math.min(Math.max(padding, x), Math.max(padding, max))
}

const ToolbarButton: React.FC<{
  icon: string
  label: string
  onClick: () => void
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 text-on-surface hover:bg-primary/10 cursor-pointer text-xs font-semibold"
  >
    <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
    {label}
  </button>
)
