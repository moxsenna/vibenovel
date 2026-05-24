import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiRouter } from '../../services/ai/ai-router'
import type { Chapter } from '../../types/project'
import { useProjectStore } from '../../store/useProjectStore'
import type { DirectorsCutVariant } from '../../prompts/rewrite'

interface DirectorsCutModalProps {
  isOpen: boolean
  selection: string
  chapter: Chapter | null
  onAccept: (text: string) => void
  onClose: () => void
}

const VARIANTS: { key: DirectorsCutVariant; label: string; icon: string; tagline: string }[] = [
  {
    key: 'tighter',
    label: 'Tighter',
    icon: '✂️',
    tagline: 'Pangkas, lebih ritmis, mobile-friendly.'
  },
  {
    key: 'emotional',
    label: 'Emotional',
    icon: '💔',
    tagline: 'Tambah lapisan emosi & sensorik.'
  },
  {
    key: 'dramatic',
    label: 'Dramatic',
    icon: '🎭',
    tagline: 'Naikkan stakes, micro-cliffhanger.'
  }
]

interface VariantState {
  text: string
  status: 'pending' | 'streaming' | 'done' | 'error' | 'aborted'
  error?: string
}

const initialVariantState: VariantState = { text: '', status: 'pending' }

export const DirectorsCutModal: React.FC<DirectorsCutModalProps> = ({
  isOpen,
  selection,
  chapter,
  onAccept,
  onClose
}) => {
  const characters = useProjectStore((s) => s.characters)
  const [states, setStates] = useState<Record<DirectorsCutVariant, VariantState>>({
    tighter: { ...initialVariantState },
    emotional: { ...initialVariantState },
    dramatic: { ...initialVariantState }
  })
  const [customInstruction, setCustomInstruction] = useState('')
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Generate variants sequentially. Cancel-on-pick is achieved by aborting
  // the controller as soon as `onAccept` fires.
  const runVariants = async (instruction?: string) => {
    if (!chapter) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRunning(true)
    setStates({
      tighter: { text: '', status: 'pending' },
      emotional: { text: '', status: 'pending' },
      dramatic: { text: '', status: 'pending' }
    })

    const activeCharacters = characters.filter((c) =>
      chapter.active_characters?.includes(c.name)
    )
    const beatContext = [
      chapter.synopsis,
      chapter.location ? `Lokasi: ${chapter.location}` : null,
      chapter.emotional_tone ? `Tone: ${chapter.emotional_tone}` : null
    ]
      .filter(Boolean)
      .join('\n')

    for (const v of VARIANTS) {
      if (ctrl.signal.aborted) break
      setStates((prev) => ({ ...prev, [v.key]: { text: '', status: 'streaming' } }))
      try {
        const stream = aiRouter.generateDirectorsCutVariant(
          v.key,
          {
            selection,
            beatContext,
            characters: activeCharacters,
            customInstruction: instruction
          },
          ctrl.signal
        )
        let acc = ''
        for await (const chunk of stream) {
          if (ctrl.signal.aborted) break
          acc += chunk
          setStates((prev) => ({
            ...prev,
            [v.key]: { text: acc, status: 'streaming' }
          }))
        }
        if (!ctrl.signal.aborted) {
          setStates((prev) => ({
            ...prev,
            [v.key]: { text: acc, status: 'done' }
          }))
        } else {
          setStates((prev) => ({
            ...prev,
            [v.key]: { text: acc, status: 'aborted' }
          }))
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          setStates((prev) => ({
            ...prev,
            [v.key]: { text: '', status: 'aborted' }
          }))
          break
        }
        const msg = e instanceof Error ? e.message : 'Generate gagal.'
        setStates((prev) => ({
          ...prev,
          [v.key]: { text: '', status: 'error', error: msg }
        }))
      }
    }
    setRunning(false)
  }

  // Track open/selection cycle so we can auto-start a fresh generation
  // outside the render phase. The render-phase derive only updates the
  // tracker; the actual async work runs in an effect keyed on it.
  const trigger = isOpen && chapter ? `${chapter.id}__${selection}` : ''
  const [activeTrigger, setActiveTrigger] = useState<string>('')
  if (trigger !== activeTrigger) {
    setActiveTrigger(trigger)
    if (!trigger) {
      // Modal just closed — clear the input synchronously during render so
      // the next open starts fresh.
      setCustomInstruction('')
    }
  }

  useEffect(() => {
    if (!activeTrigger) {
      abortRef.current?.abort()
      return
    }
    // Defer to a microtask so the synchronous effect body doesn't directly
    // dispatch `setState`. (react-hooks/set-state-in-effect.)
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) runVariants(undefined)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrigger])

  const handleAccept = (variant: DirectorsCutVariant) => {
    abortRef.current?.abort()
    onAccept(states[variant].text)
    onClose()
  }

  const handleRegenerate = () => {
    runVariants(customInstruction.trim() || undefined)
  }

  const handleClose = () => {
    abortRef.current?.abort()
    onClose()
  }

  if (!isOpen || !chapter) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-surface-container border border-outline-variant/30 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <header className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-2">
              🎬 Director&apos;s Cut
            </h2>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Tiga sudut alternatif untuk seleksi prosamu. Klik &ldquo;Pakai&rdquo; pada
              variant pilihan — sisanya otomatis dibatalkan.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer rounded-full p-1 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <section className="px-6 py-3 border-b border-outline-variant/15 bg-surface-container-low">
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 mb-1">
            Seleksi
          </p>
          <p className="text-sm text-on-surface-variant italic line-clamp-3">
            &ldquo;{selection}&rdquo;
          </p>
        </section>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
            {VARIANTS.map((v) => {
              const state = states[v.key]
              return (
                <article
                  key={v.key}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 flex flex-col gap-3 min-h-[280px]"
                >
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span>{v.icon}</span>
                      {v.label}
                    </h3>
                    <VariantStatusChip status={state.status} />
                  </header>
                  <p className="text-[10px] text-on-surface-variant/70 italic">
                    {v.tagline}
                  </p>

                  <div className="flex-1 bg-surface-container/50 rounded-xl p-3 text-sm text-on-surface leading-relaxed font-serif overflow-y-auto max-h-[280px]">
                    <AnimatePresence mode="wait">
                      {state.status === 'error' ? (
                        <span key="err" className="text-error text-xs">
                          ⚠️ {state.error}
                        </span>
                      ) : state.text ? (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="whitespace-pre-wrap"
                        >
                          {state.text}
                        </motion.span>
                      ) : (
                        <span className="text-on-surface-variant/50 text-xs italic">
                          {state.status === 'pending' ? 'Menunggu giliran...' : 'Menulis...'}
                        </span>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={() => handleAccept(v.key)}
                    disabled={state.status !== 'done' && state.text.length < 30}
                    className="w-full py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Pakai {v.label}
                  </button>
                </article>
              )
            })}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low">
          <label className="text-xs uppercase tracking-wider text-on-surface-variant block mb-2">
            Arahan Khusus (opsional)
          </label>
          <div className="flex items-center gap-2">
            <input
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Misal: pakai POV orang pertama, tonjolkan ironi..."
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={handleRegenerate}
              disabled={running}
              className="px-4 py-2 rounded-xl bg-secondary-container text-on-secondary-container text-sm font-bold cursor-pointer disabled:opacity-40"
            >
              {running ? 'Generating...' : 'Generate Ulang'}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}

const VariantStatusChip: React.FC<{ status: VariantState['status'] }> = ({ status }) => {
  const cfg: Record<VariantState['status'], { label: string; cls: string }> = {
    pending: { label: '⏳ Menunggu', cls: 'bg-on-surface-variant/10 text-on-surface-variant' },
    streaming: { label: '✍️ Menulis', cls: 'bg-primary/15 text-primary' },
    done: { label: '✓ Siap', cls: 'bg-emerald-500/15 text-emerald-400' },
    error: { label: '⚠️ Error', cls: 'bg-error/15 text-error' },
    aborted: { label: '⛔ Batal', cls: 'bg-amber-500/15 text-amber-400' }
  }
  const c = cfg[status]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  )
}
