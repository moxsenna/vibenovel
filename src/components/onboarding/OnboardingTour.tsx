/* eslint-disable react-refresh/only-export-components */
/**
 * OnboardingTour
 *
 * Reusable coach-mark overlay. Each tour owns a separate localStorage flag,
 * so Home and every Workspace mode can teach itself the first time it opens.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const HOME_ONBOARDING_FLAG = 'vn_onboarding_done_v1'
const ONBOARDING_FLAG_PREFIX = 'vn_onboarding_'
const ONBOARDING_FLAG_SUFFIX = '_done_v1'

export interface TourStep {
  /** Selector matched against `[data-tour-step="..."]`. */
  target: string | null
  title: string
  body: string
  icon: string
}

export const getOnboardingFlag = (tourId: string) => {
  if (tourId === 'home') return HOME_ONBOARDING_FLAG
  return `${ONBOARDING_FLAG_PREFIX}${tourId}${ONBOARDING_FLAG_SUFFIX}`
}

export const resetAllOnboardingFlags = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.removeItem(HOME_ONBOARDING_FLAG)

  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (
      key &&
      key.startsWith(ONBOARDING_FLAG_PREFIX) &&
      key.endsWith(ONBOARDING_FLAG_SUFFIX)
    ) {
      keys.push(key)
    }
  }

  keys.forEach((key) => localStorage.removeItem(key))
}

export const HOME_ONBOARDING_STEPS: TourStep[] = [
  {
    target: null,
    icon: 'auto_awesome',
    title: 'Selamat datang di VibeNovel',
    body: 'Kamu bisa mulai dari membuat proyek baru, lanjut menulis naskah, atau membuka pengaturan bantuan AI.'
  },
  {
    target: 'new-project',
    icon: 'add_circle',
    title: 'Mulai novel baru',
    body: 'Pilih kartu ini saat ingin membuat cerita dari nol, memakai blueprint genre, atau mengimpor naskah lama.'
  },
  {
    target: 'settings',
    icon: 'settings',
    title: 'Pengaturan bantuan AI',
    body: 'Masukkan API key di sini sebelum memakai fitur bantuan AI. Kuncinya tetap tersimpan lokal di browser.'
  }
]

export const WORKSPACE_ONBOARDING_STEPS = {
  brainstorm: [
    {
      target: 'canvas-brainstorm',
      icon: 'psychology_alt',
      title: 'Ide Cerita',
      body: 'Di sini kamu merapikan premis, tokoh, konflik, dan arah ending lewat obrolan dengan Co-Author.'
    },
    {
      target: 'context-panel',
      icon: 'explore',
      title: 'Kompas Cerita',
      body: 'Panel samping menyimpan bagian penting cerita. Kalau panel sedang tertutup, buka lewat ikon menu di header.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Pakai ini untuk lompat ke fitur penting tanpa mencari tombol satu per satu.'
    }
  ],
  outline: [
    {
      target: 'canvas-outline',
      icon: 'format_list_numbered',
      title: 'Rencana Bab',
      body: 'Bagian ini membantu menyusun arah tiap bab sebelum kamu masuk ke penulisan naskah.'
    },
    {
      target: 'context-panel',
      icon: 'library_books',
      title: 'Catatan cerita',
      body: 'Tokoh, barang penting, aturan dunia, dan suara cerita tetap terlihat sebagai pegangan saat merancang bab.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Buka cepat Naskah, Ide Cerita, Pengaturan, atau aksi lain dari satu tempat.'
    }
  ],
  write: [
    {
      target: 'canvas-write',
      icon: 'history_edu',
      title: 'Naskah',
      body: 'Ini meja menulismu. Kamu bisa menulis bebas, memakai rencana bab, atau meminta AI membantu membuat adegan.'
    },
    {
      target: 'workspace-panel-toggle',
      icon: 'view_sidebar',
      title: 'Panel catatan',
      body: 'Gunakan tombol ini saat ingin melihat rencana bab, state tokoh, atau catatan cerita sambil menulis.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Saat ingin pindah mode tanpa kehilangan fokus, buka Menu Pintas dari header.'
    }
  ],
  review: [
    {
      target: 'canvas-review',
      icon: 'fact_check',
      title: 'Cek Cerita',
      body: 'Di sini kamu memeriksa lubang plot, konsistensi, alur emosi, dan catatan revisi sebelum lanjut.'
    },
    {
      target: 'context-panel',
      icon: 'radar',
      title: 'Radar cerita',
      body: 'Panel samping menampilkan ringkasan masalah dan petunjuk agar revisi terasa lebih terarah.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Gunakan Menu Pintas untuk kembali ke Naskah atau membuka Pengaturan kapan saja.'
    }
  ],
  visualize: [
    {
      target: 'canvas-visualize',
      icon: 'hub',
      title: 'Peta Cerita',
      body: 'Bagian ini memberi pandangan besar: emosi, timeline, hubungan, dan statistik naskah.'
    },
    {
      target: 'mode-switcher',
      icon: 'tabs',
      title: 'Pindah ruang kerja',
      body: 'Saat butuh kembali menulis atau merancang bab, pilih mode lain dari tab ruang kerja.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Semua perpindahan penting tetap bisa dicari dari satu tombol cepat.'
    }
  ]
} as const satisfies Record<string, readonly TourStep[]>

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
