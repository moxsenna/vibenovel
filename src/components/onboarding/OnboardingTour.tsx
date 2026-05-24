/**
 * OnboardingTour — Sprint 9
 *
 * 5-step coach mark overlay for first-time users.
 *
 * Trigger: localStorage.getItem('vn_onboarding_done_v1') === null
 * Reset:   SettingsModal "Tutorial" tab → "Reset Onboarding" button.
 *
 * Highlight target via `data-tour-step="..."` attribute selector.
 * Portal overlay dengan dim background + cutout ring sekitar target.
 *
 * Respects prefers-reduced-motion (skip scale/spring, use fade only).
 */

import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const ONBOARDING_FLAG = 'vn_onboarding_done_v1'

interface TourStep {
  /** Selector matched against `[data-tour-step="..."]`. */
  target: string | null // null → centered welcome (no target)
  title: string
  body: string
  emoji: string
}

const STEPS: TourStep[] = [
  {
    target: null,
    emoji: '✨',
    title: 'Selamat datang di VibeNovel',
    body: 'Mesin pencetak novel komersial bertenaga AI. Tour singkat 5 langkah biar kamu cepat akrab.'
  },
  {
    target: 'new-project',
    emoji: '🌱',
    title: 'Buat Proyek Baru',
    body: 'Klik kartu "Mulai Novel Baru" untuk bikin proyek. Tiga jalan: Mulai Dari Nol, Pakai Blueprint, atau Lanjut Cerita Saya (import).'
  },
  {
    target: 'mode-switcher',
    emoji: '🧭',
    title: 'Mode Switcher',
    body: 'Di Workspace ada 5 mode: Brainstorm, Outline, Write, Review, Visualisasi. Pindah mode sesuai aktivitas saat ini.'
  },
  {
    target: 'context-panel',
    emoji: '📂',
    title: 'Context Panel',
    body: 'Sidebar kiri menampilkan info relevan dengan mode aktif: Story Compass, Lorebook, atau State Snapshot. Bisa dilipat.'
  },
  {
    target: 'settings',
    emoji: '🔑',
    title: 'Pengaturan & API Keys',
    body: 'Tambahkan Gemini API key dulu sebelum mulai. BYOK — key tetap di browser-mu, tidak pernah pergi ke server kami.'
  }
]

interface OnboardingTourProps {
  onClose?: () => void
  /**
   * Force open even if flag is set. Useful for testing.
   */
  forceOpen?: boolean
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8

/** Find target rect via data-tour-step attribute. */
const findTargetRect = (selector: string | null): TargetRect | null => {
  if (!selector) return null
  if (typeof document === 'undefined') return null
  const el = document.querySelector(`[data-tour-step="${selector}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2
  }
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose, forceOpen = false }) => {
  // Decide whether to open on mount via lazy initial state — avoids
  // setState-in-effect (React 19 strict purity rule).
  const [open, setOpen] = useState<boolean>(() => {
    if (forceOpen) return true
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(ONBOARDING_FLAG) === null
    } catch {
      return false
    }
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect | null>(null)
  const reducedMotion = useReducedMotion()

  // Recompute rect when step or window resizes.
  const currentStep = STEPS[stepIndex]
  useEffect(() => {
    if (!open) return
    const recompute = () => setRect(findTargetRect(currentStep?.target ?? null))
    recompute()
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [open, stepIndex, currentStep?.target])

  const finishTour = () => {
    try {
      localStorage.setItem(ONBOARDING_FLAG, '1')
    } catch {
      // ignore
    }
    setOpen(false)
    onClose?.()
  }

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finishTour()
    }
  }

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  // Position the tooltip beside the highlight, or centered if no target.
  const tooltipPos = useMemo(() => {
    if (!rect || typeof window === 'undefined') {
      return { centered: true } as const
    }
    const tooltipWidth = 360
    const margin = 16
    // Try right side first; fall back to below; fall back to centered.
    const fitsRight = rect.left + rect.width + margin + tooltipWidth < window.innerWidth
    const fitsLeft = rect.left - margin - tooltipWidth > 0
    if (fitsRight) {
      return {
        centered: false,
        top: Math.max(margin, Math.min(window.innerHeight - 200, rect.top)),
        left: rect.left + rect.width + margin
      } as const
    }
    if (fitsLeft) {
      return {
        centered: false,
        top: Math.max(margin, Math.min(window.innerHeight - 200, rect.top)),
        left: Math.max(margin, rect.left - margin - tooltipWidth)
      } as const
    }
    // Place below.
    return {
      centered: false,
      top: Math.min(window.innerHeight - 240, rect.top + rect.height + margin),
      left: Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, rect.left))
    } as const
  }, [rect])

  if (!open || !currentStep || typeof document === 'undefined') return null

  const motionPreset = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 }
      }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding step ${stepIndex + 1}: ${currentStep.title}`}
      >
        {/* Backdrop dim + cutout */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" onClick={handleNext}>
          {rect && (
            <motion.div
              key={`hl-${stepIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute rounded-2xl pointer-events-none"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                outline: '2px solid rgba(255, 255, 255, 0.9)',
                outlineOffset: '2px',
                background: 'transparent'
              }}
            />
          )}
        </div>

        {/* Tooltip card */}
        <motion.div
          {...motionPreset}
          onClick={(e) => e.stopPropagation()}
          className="absolute pointer-events-auto bg-surface-container-high rounded-2xl border border-outline-variant/40 shadow-2xl inner-glow p-5 max-w-[360px]"
          style={
            tooltipPos.centered
              ? {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }
              : { top: tooltipPos.top, left: tooltipPos.left }
          }
        >
          <div className="flex items-start gap-3 mb-2">
            <span className="text-3xl">{currentStep.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-title-md font-bold text-on-surface">{currentStep.title}</h3>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mt-0.5">
                Langkah {stepIndex + 1} dari {STEPS.length}
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant leading-relaxed mb-4">
            {currentStep.body}
          </p>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={finishTour}
              className="text-[11px] text-on-surface-variant hover:text-on-surface underline cursor-pointer"
            >
              Lewati
            </button>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-[11px] font-bold cursor-pointer hover:bg-surface-container-highest"
                >
                  ← Kembali
                </button>
              )}
              <button
                onClick={handleNext}
                className="h-9 px-4 rounded-full btn-gradient text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 hover-glow"
              >
                {stepIndex === STEPS.length - 1 ? 'Selesai ✓' : 'Lanjut →'}
              </button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-4 pt-3 border-t border-outline-variant/15">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === stepIndex
                    ? 'bg-primary'
                    : i < stepIndex
                      ? 'bg-primary/40'
                      : 'bg-on-surface-variant/30'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
