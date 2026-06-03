import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOfflineDraft } from '../../hooks/useOfflineDraft'
import type { SelectionInfo } from './SelectionToolbar'
import { LogoLoader } from '../ui/LogoLoader'

interface BeatEditorProps {
  chapterId: string
  beatIndex: number
  beatDirection: string
  prose: string
  isGenerating: boolean
  onEdit: (text: string) => void
  onGenerate: () => void
  onNext: () => void
  isLastBeat: boolean
  onSelectionChange?: (sel: SelectionInfo | null) => void
  isThinking?: boolean
  currentThought?: string
  onUndo?: () => void
  onRedo?: () => void
}

export interface BeatEditorHandle {
  /** Replace the currently-tracked selection range with new text. */
  replaceSelection: (newText: string) => void
}

export const BeatEditor = forwardRef<BeatEditorHandle, BeatEditorProps>(function BeatEditor(
  {
    chapterId,
    beatIndex,
    beatDirection,
    prose,
    isGenerating,
    onEdit,
    onGenerate,
    onNext,
    isLastBeat,
    onSelectionChange,
    isThinking = false,
    currentThought = '',
    onUndo,
    onRedo
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const thoughtScrollRef = useRef<HTMLDivElement>(null)
  const { isOnline, loadDraft, clearDraft } = useOfflineDraft()
  const [restoreOffer, setRestoreOffer] = useState<{ text: string; timestamp: number } | null>(null)
  const [prevKey, setPrevKey] = useState<string>('')
  const currentKey = `${chapterId}__${beatIndex}`
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null)
  // Sprint 9.7 — Thought panel collapse state. Default open during thinking;
  // auto-collapse 500ms after the first prose chunk arrives (handled below).
  const [thoughtPanelOpen, setThoughtPanelOpen] = useState(true)
  // Track previous isThinking so we can collapse panel on transition false.
  const [prevIsThinking, setPrevIsThinking] = useState(isThinking)
  if (prevIsThinking !== isThinking) {
    setPrevIsThinking(isThinking)
    if (!isThinking && currentThought.length > 0) {
      // Defer collapse so user sees the final thought briefly before hiding.
      const timer = setTimeout(() => setThoughtPanelOpen(false), 500)
      // Cleanup if component unmounts; harmless if already fired.
      void timer
    } else if (isThinking) {
      // Re-open when a fresh thinking phase starts.
      setThoughtPanelOpen(true)
    }
  }

  // Derive restore-offer during render whenever the active beat changes.
  if (prevKey !== currentKey) {
    setPrevKey(currentKey)
    const draft = loadDraft(chapterId, beatIndex)
    if (draft && draft.text && draft.text !== prose && draft.text.length > prose.length) {
      setRestoreOffer({ text: draft.text, timestamp: draft.timestamp })
    } else {
      setRestoreOffer(null)
    }
  }

  // Auto-scroll to bottom during generation
  useEffect(() => {
    if (isGenerating && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }, [prose, isGenerating])

  // Sprint 9.7 — Auto-scroll thought panel during thinking phase.
  useEffect(() => {
    if (isThinking && thoughtScrollRef.current) {
      thoughtScrollRef.current.scrollTop = thoughtScrollRef.current.scrollHeight
    }
  }, [currentThought, isThinking])

  const handleRestore = () => {
    if (!restoreOffer) return
    onEdit(restoreOffer.text)
    clearDraft(chapterId, beatIndex)
    setRestoreOffer(null)
  }

  const handleDismissRestore = () => {
    if (restoreOffer) clearDraft(chapterId, beatIndex)
    setRestoreOffer(null)
  }

  // ── Selection tracking for floating toolbar ─────────────────────────────
  const detectSelection = () => {
    const ta = textareaRef.current
    if (!ta || !onSelectionChange) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = ta.value.slice(start, end).trim()
    if (end - start < 6 || !text) {
      lastSelectionRef.current = null
      onSelectionChange(null)
      return
    }
    lastSelectionRef.current = { start, end }
    const rect = ta.getBoundingClientRect()
    // Approximate caret coordinates: place toolbar near the start of the
    // selection on the line where the selection began.
    const anchor = computeAnchorFromTextarea(ta, start, rect)
    onSelectionChange({ start, end, text, anchorX: anchor.x, anchorY: anchor.y })
  }

  useImperativeHandle(
    ref,
    () => ({
      replaceSelection(newText: string) {
        const ta = textareaRef.current
        const range = lastSelectionRef.current
        if (!ta || !range) return
        const before = ta.value.slice(0, range.start)
        const after = ta.value.slice(range.end)
        const next = before + newText + after
        onEdit(next)
        // Clear selection so toolbar dismisses.
        lastSelectionRef.current = null
        onSelectionChange?.(null)
        // Restore caret position immediately after the inserted text.
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            const caret = before.length + newText.length
            textareaRef.current.setSelectionRange(caret, caret)
            textareaRef.current.focus()
          }
        })
      }
    }),
    [onEdit, onSelectionChange]
  )

  return (
    <div className="flex flex-col flex-1 min-h-[400px] bg-bg-secondary rounded-xl border border-border-divider overflow-hidden">
      {/* Header: Beat Direction */}
      <div className="p-4 bg-bg-primary border-b border-border-divider">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {beatIndex + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Arahan Adegan
              </h3>
              {!isOnline && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="material-symbols-outlined text-[12px]">wifi_off</span>
                  Offline · Tersimpan Lokal
                </span>
              )}
            </div>
            <p className="text-text-primary leading-relaxed">{beatDirection}</p>
          </div>
        </div>
      </div>

      {/* Sprint 9.7 — Deep Think indicator + collapsible thought panel */}
      <AnimatePresence>
        {(isThinking || (currentThought.length > 0 && thoughtPanelOpen)) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-purple-500/20"
          >
            <div className="px-4 py-2.5 bg-purple-500/8 flex items-center gap-2">
              <motion.span
                className="text-base flex items-center justify-center"
              >
                {isThinking ? <LogoLoader size={18} glow={false} /> : '💭'}
              </motion.span>
              <span className="text-xs font-semibold text-purple-300">
                {isThinking ? 'Merancang adegan...' : 'Rencana Adegan'}
              </span>
              <button
                onClick={() => setThoughtPanelOpen((v) => !v)}
                className="ml-auto text-[10px] text-purple-400/80 hover:text-purple-300 cursor-pointer flex items-center gap-1"
              >
                {thoughtPanelOpen ? 'Sembunyikan' : 'Tampilkan'}
                <span className="material-symbols-outlined text-[12px]">
                  {thoughtPanelOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>
            <AnimatePresence>
              {thoughtPanelOpen && currentThought.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    ref={thoughtScrollRef}
                    className="px-4 pb-3 max-h-32 overflow-y-auto custom-scrollbar"
                  >
                    <p className="text-[11px] text-purple-200/80 font-mono whitespace-pre-line leading-relaxed">
                      {currentThought}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Prompt */}
      <AnimatePresence>
        {restoreOffer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400">history</span>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-cyan-300">Draft offline ditemukan</p>
                <p className="text-xs text-cyan-400/80">
                  Disimpan {new Date(restoreOffer.timestamp).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={handleDismissRestore}
                className="px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                Buang
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-500 rounded-lg hover:bg-cyan-400 cursor-pointer"
              >
                Pulihkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 relative flex flex-col">
        {prose.length === 0 && !isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4 opacity-50">
              <span className="text-2xl">✍️</span>
            </div>
            <h4 className="text-lg font-medium text-text-primary mb-2">Adegan {beatIndex + 1} Kosong</h4>
            <p className="text-sm text-text-tertiary mb-6 max-w-sm">
              AI akan menulis adegan ini berdasarkan konteks bab sebelumnya, arahan adegan, dan cara bicara karakter.
            </p>
            <button
              onClick={onGenerate}
              className="px-6 py-2.5 bg-primary text-bg-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              ✨ Mulai Tulis Adegan Ini
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={prose}
            onChange={(e) => onEdit(e.target.value)}
            onSelect={detectSelection}
            onKeyUp={detectSelection}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                if (e.shiftKey) onRedo?.()
                else onUndo?.()
              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault()
                onRedo?.()
              }
            }}
            onBlur={() => {
              // Defer so click on the floating toolbar still has a valid selection.
              setTimeout(() => {
                if (
                  textareaRef.current &&
                  textareaRef.current.selectionStart === textareaRef.current.selectionEnd
                ) {
                  onSelectionChange?.(null)
                }
              }, 200)
            }}
            disabled={isGenerating || isThinking}
            placeholder={
              isThinking
                ? 'AI sedang merancang adegan...'
                : 'Mulai mengetik manual atau tunggu AI menyelesaikan...'
            }
            className="flex-1 w-full p-6 bg-transparent text-text-primary leading-relaxed resize-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-primary/50 disabled:opacity-80"
          />
        )}
      </div>

      {/* Footer Controls */}
      {prose.length > 0 && (
        <div className="p-4 bg-bg-primary border-t border-border-divider flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? '⏹ Hentikan' : '🔄 Tulis Ulang'}
            </button>
          </div>

          {!isGenerating && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onNext}
              className="px-6 py-2.5 bg-success text-on-success text-sm font-bold rounded-lg hover:bg-success/90 hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-success/20"
            >
              <span>{isLastBeat ? 'Selesaikan Bab' : 'Lanjut ke Adegan Berikutnya'}</span>
              {isLastBeat ? (
                <span className="material-symbols-outlined text-[18px] font-bold">celebrate</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>
              )}
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
})

/**
 * Approximate the caret pixel position inside a textarea using a hidden mirror
 * div. Good enough for the floating toolbar — we don't need pixel-perfect.
 */
function computeAnchorFromTextarea(
  ta: HTMLTextAreaElement,
  caret: number,
  rect: DOMRect
): { x: number; y: number } {
  // Build a mirror once per call. Cheap enough at human-typing rates.
  const div = document.createElement('div')
  const style = window.getComputedStyle(ta)
  const props: (keyof CSSStyleDeclaration)[] = [
    'boxSizing',
    'width',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textTransform',
    'whiteSpace',
    'wordSpacing'
  ]
  for (const prop of props) {
    const value = style[prop]
    if (typeof value === 'string') {
      ;(div.style as unknown as Record<string, string>)[prop as string] = value
    }
  }
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.overflowWrap = 'break-word'
  div.style.top = '0'
  div.style.left = '0'
  div.textContent = ta.value.slice(0, caret)

  const span = document.createElement('span')
  span.textContent = ta.value.slice(caret) || '.'
  div.appendChild(span)
  document.body.appendChild(div)
  const offsetX = span.offsetLeft
  const offsetY = span.offsetTop
  document.body.removeChild(div)

  return {
    x: rect.left + offsetX - ta.scrollLeft,
    y: rect.top + offsetY - ta.scrollTop
  }
}
