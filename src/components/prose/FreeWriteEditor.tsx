import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOfflineDraft } from '../../hooks/useOfflineDraft'

interface FreeWriteEditorProps {
  chapterId: string
  prose: string
  onEdit: (text: string) => void
}

/**
 * Plain-canvas editor used in Free Write mode. No beat header, no AI buttons —
 * just the user's prose and the offline-aware safety net carried over from
 * BeatEditor.
 */
export const FreeWriteEditor: React.FC<FreeWriteEditorProps> = ({
  chapterId,
  prose,
  onEdit
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isOnline, loadDraft, clearDraft } = useOfflineDraft()
  const [restoreOffer, setRestoreOffer] = useState<{ text: string; timestamp: number } | null>(null)
  const [prevKey, setPrevKey] = useState<string>('')
  const currentKey = `${chapterId}__free`

  if (prevKey !== currentKey) {
    setPrevKey(currentKey)
    const draft = loadDraft(chapterId, -1)
    if (draft && draft.text && draft.text !== prose && draft.text.length > prose.length) {
      setRestoreOffer({ text: draft.text, timestamp: draft.timestamp })
    } else {
      setRestoreOffer(null)
    }
  }

  // Auto-grow textarea height as the user writes.
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = ''
    ta.style.height = `${Math.max(ta.scrollHeight, 480)}px`
  }, [prose])

  return (
    <div className="flex flex-col flex-1 bg-bg-secondary rounded-xl border border-primary/40 overflow-hidden inner-glow">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-primary border-b border-primary/30">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock_open
          </span>
          Free Write
        </span>
        {!isOnline && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="material-symbols-outlined text-[12px]">wifi_off</span>
            Offline · Lokal
          </span>
        )}
      </div>

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
                onClick={() => {
                  if (restoreOffer) clearDraft(chapterId, -1)
                  setRestoreOffer(null)
                }}
                className="px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                Buang
              </button>
              <button
                onClick={() => {
                  if (!restoreOffer) return
                  onEdit(restoreOffer.text)
                  clearDraft(chapterId, -1)
                  setRestoreOffer(null)
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-500 rounded-lg hover:bg-cyan-400 cursor-pointer"
              >
                Pulihkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        ref={textareaRef}
        value={prose}
        onChange={(e) => onEdit(e.target.value)}
        placeholder="Mulai menulis bebas... Tanpa beat indicator, tanpa auto-QA. Hanya kamu dan kalimatmu."
        className="flex-1 w-full p-6 bg-transparent text-text-primary font-serif text-base leading-relaxed resize-none focus:outline-none"
      />
    </div>
  )
}
