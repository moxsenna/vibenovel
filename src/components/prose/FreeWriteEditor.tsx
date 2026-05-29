import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOfflineDraft } from '../../hooks/useOfflineDraft'
import { useProjectStore } from '../../store/useProjectStore'
import { useSettingsStore } from '../../store/useSettingsStore'

interface FreeWriteEditorProps {
  chapterId: string
  prose: string
  onEdit: (text: string) => void
  onUndo?: () => void
  onRedo?: () => void
}

/**
 * Plain-canvas editor used in Free Write mode. No beat header, no AI buttons —
 * just the user's prose and the offline-aware safety net carried over from
 * BeatEditor.
 * 
 * Includes a premium "Tulis dengan AI" banner overlay if an outline has been
 * generated for this chapter, guiding the user back to the guided Beat-by-Beat mode.
 * Supports dismissal of the banner, and Alt+O shortcut to peek at the chapter's outline details.
 */
export const FreeWriteEditor: React.FC<FreeWriteEditorProps> = ({
  chapterId,
  prose,
  onEdit,
  onUndo,
  onRedo
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isOnline, loadDraft, clearDraft } = useOfflineDraft()
  const [restoreOffer, setRestoreOffer] = useState<{ text: string; timestamp: number } | null>(null)
  const [prevKey, setPrevKey] = useState<string>('')
  const currentKey = `${chapterId}__free`

  // Fetch chapter outline status
  const chapters = useProjectStore((s) => s.chapters)
  const chapter = chapters.find((c) => c.id === chapterId)
  const hasOutline = !!(
    chapter &&
    ((chapter.beats && chapter.beats.length > 0) ||
      (chapter.key_events && chapter.key_events.length > 0))
  )
  const setFreeWriteMode = useSettingsStore((s) => s.setFreeWriteMode)

  const [showOutlinePeek, setShowOutlinePeek] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Sync states when chapter changes
  useEffect(() => {
    setIsDismissed(localStorage.getItem(`vn_dismiss_ai_banner_${chapterId}`) === 'true')
    setShowOutlinePeek(false)
  }, [chapterId])

  // Alt+O Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setShowOutlinePeek((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

        {/* PEEK & OFFLINE CONTROLS */}
        <div className="flex items-center gap-3">
          {hasOutline && (
            <button
              onClick={() => setShowOutlinePeek(!showOutlinePeek)}
              title="Intip Outline Bab (Alt+O)"
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all cursor-pointer ${
                showOutlinePeek
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-sm'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              Intip Outline
              <kbd className="hidden sm:inline-block text-[9px] px-1 bg-white/10 rounded font-mono ml-0.5 text-on-surface-variant">Alt+O</kbd>
            </button>
          )}

          {!isOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="material-symbols-outlined text-[12px]">wifi_off</span>
              Offline · Lokal
            </span>
          )}
        </div>
      </div>

      {/* Collagen Peek Outline Drawer */}
      <AnimatePresence>
        {showOutlinePeek && chapter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-surface-container/60 border-b border-outline-variant/30 text-sm space-y-4 relative z-20 backdrop-blur-md">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  Rencana Penulisan Bab {chapter.chapter_number}
                </span>
                <button
                  onClick={() => setShowOutlinePeek(false)}
                  className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {chapter.title && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Judul Bab</span>
                  <p className="font-bold text-on-surface text-sm mt-0.5">{chapter.title}</p>
                </div>
              )}

              {chapter.synopsis && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Sinopsis Rencana</span>
                  <p className="text-on-surface/90 text-xs mt-0.5 leading-relaxed bg-bg-secondary/40 p-2.5 rounded-lg border border-outline-variant/10">{chapter.synopsis}</p>
                </div>
              )}

              {chapter.key_events && chapter.key_events.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block mb-1">Peristiwa Penting (Key Events)</span>
                  <ul className="space-y-1.5 ml-4">
                    {chapter.key_events.map((evt, idx) => (
                      <li key={idx} className="text-xs text-on-surface/85 list-disc leading-relaxed">
                        {evt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {chapter.emotional_tone && (
                  <div className="bg-bg-primary/30 p-2 rounded-lg border border-outline-variant/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Nada Emosi</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-wider">
                      {chapter.emotional_tone}
                    </span>
                  </div>
                )}
                {chapter.cliffhanger_type && (
                  <div className="bg-bg-primary/30 p-2 rounded-lg border border-outline-variant/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Tipe Cliffhanger</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                      {chapter.cliffhanger_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasOutline && !isDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border-b border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
              {/* Glowing decorative dot */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[22px] animate-pulse">auto_awesome</span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                    Rencana Bab &amp; Beat Ditemukan!
                  </h4>
                  <p className="text-xs text-on-surface-variant/80 max-w-xl leading-relaxed">
                    Anda sudah menyusun outline bab ini menggunakan AI. Aktifkan **Mode Pemandu (Beat-by-Beat)** untuk mulai menulis paragraf-demi-paragraf terpandu dengan AI.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 relative z-10 shrink-0 self-start sm:self-center">
                <button
                  onClick={() => {
                    localStorage.setItem(`vn_dismiss_ai_banner_${chapterId}`, 'true')
                    setIsDismissed(true)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-full border border-white/10 transition-all cursor-pointer shrink-0"
                >
                  Tolak &amp; Tulis Manual
                </button>
                <button
                  onClick={() => setFreeWriteMode(false)}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-full bg-purple-600 hover:bg-purple-500 border border-purple-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/15 flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  Tulis dengan AI (Pemandu)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        placeholder="Mulai menulis bebas... Tanpa beat indicator, tanpa auto-QA. Hanya kamu dan kalimatmu."
        className="flex-1 w-full p-6 bg-transparent text-text-primary font-serif text-base leading-relaxed resize-none focus:outline-none"
      />
    </div>
  )
}
