/**
 * OnboardingTour
 *
 * Reusable coach-mark overlay. Each tour owns a separate localStorage flag,
 * so Home and every Workspace mode can teach itself the first time it opens.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getOnboardingFlag } from './onboarding-flags'
import { HOME_ONBOARDING_STEPS, type TourStep } from './onboarding-steps'

interface OnboardingTourProps {
  tourId?: string
  steps?: readonly TourStep[]
  onClose?: () => void
  /** Force open even if the saved flag is set. Useful for testing/reset flows. */
  forceOpen?: boolean
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8

const findTargetRect = (selector: string | null): TargetRect | null => {
  if (!selector || typeof document === 'undefined') return null
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

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourId = 'home',
  steps = HOME_ONBOARDING_STEPS,
  onClose,
  forceOpen = false
}) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (forceOpen) return true
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(getOnboardingFlag(tourId)) === null
    } catch {
      return false
    }
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect | null>(null)
  const reducedMotion = useReducedMotion()

  const currentStep = steps[stepIndex]

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
      localStorage.setItem(getOnboardingFlag(tourId), '1')
    } catch {
      // Ignore localStorage errors in private browsing.
    }
    setOpen(false)
    onClose?.()
  }

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
      return
    }
    finishTour()
  }

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  const tooltipPos = useMemo(() => {
    if (!rect || typeof window === 'undefined') {
      return { centered: true } as const
    }

    const tooltipWidth = 360
    const margin = 16
    const fitsRight = rect.left + rect.width + margin + tooltipWidth < window.innerWidth
    const fitsLeft = rect.left - margin - tooltipWidth > 0

    if (fitsRight) {
      return {
        centered: false,
        top: Math.max(margin, Math.min(window.innerHeight - 220, rect.top)),
        left: rect.left + rect.width + margin
      } as const
    }

    if (fitsLeft) {
      return {
        centered: false,
        top: Math.max(margin, Math.min(window.innerHeight - 220, rect.top)),
        left: Math.max(margin, rect.left - margin - tooltipWidth)
      } as const
    }

    return {
      centered: false,
      top: Math.min(window.innerHeight - 260, rect.top + rect.height + margin),
      left: Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, rect.left))
    } as const
  }, [rect])

  if (!open || !currentStep || steps.length === 0 || typeof document === 'undefined') return null

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
        key={`tour-${tourId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding ${tourId}, step ${stepIndex + 1}: ${currentStep.title}`}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" onClick={handleNext}>
          {rect && (
            <motion.div
              key={`hl-${tourId}-${stepIndex}`}
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
            <span className="w-10 h-10 rounded-2xl bg-primary-container/80 text-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">{currentStep.icon}</span>
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-title-md font-bold text-on-surface">{currentStep.title}</h3>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mt-0.5">
                Langkah {stepIndex + 1} dari {steps.length}
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
                  Kembali
                </button>
              )}
              <button
                onClick={handleNext}
                className="h-9 px-4 rounded-full btn-gradient text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 hover-glow"
              >
                {stepIndex === steps.length - 1 ? 'Selesai' : 'Lanjut'}
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 mt-4 pt-3 border-t border-outline-variant/15">
            {steps.map((_, i) => (
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
