/**
 * HoverModeRevealer — Sprint 9.6
 *
 * Saat Focus Mode aktif, ModeSwitcher disembunyikan.
 * Ketika cursor mendekati top edge viewport (top 16px) selama 200ms,
 * ModeSwitcher slide-down. Auto-hide 1.5s setelah cursor menjauh.
 *
 * Mounted hanya saat focusMode === true. Saat focusMode false, header
 * sudah full-size, jadi component ini noop.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModeSwitcher } from './ModeSwitcher'

const HOVER_TRIGGER_PX = 16
const SHOW_DELAY_MS = 200
const HIDE_DELAY_MS = 1500

export const HoverModeRevealer: React.FC = () => {
  const [revealed, setRevealed] = useState(false)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Cursor in trigger zone
      if (e.clientY <= HOVER_TRIGGER_PX) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current)
          hideTimerRef.current = null
        }
        if (!revealed && !showTimerRef.current) {
          showTimerRef.current = setTimeout(() => {
            setRevealed(true)
            showTimerRef.current = null
          }, SHOW_DELAY_MS)
        }
      } else {
        // Cursor left trigger zone
        if (showTimerRef.current) {
          clearTimeout(showTimerRef.current)
          showTimerRef.current = null
        }
        if (revealed && !hideTimerRef.current) {
          hideTimerRef.current = setTimeout(() => {
            setRevealed(false)
            hideTimerRef.current = null
          }, HIDE_DELAY_MS)
        }
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      clearTimers()
    }
  }, [revealed, clearTimers])

  return (
    <AnimatePresence>
      {revealed && (
        <motion.div
          key="hover-mode-revealer"
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-9 left-0 right-0 z-40 px-5 md:px-16 py-3 bg-surface-dim/95 backdrop-blur-md border-b border-surface-variant/20 shadow-lg"
          onMouseEnter={() => {
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current)
              hideTimerRef.current = null
            }
          }}
          onMouseLeave={() => {
            hideTimerRef.current = setTimeout(() => {
              setRevealed(false)
              hideTimerRef.current = null
            }, HIDE_DELAY_MS)
          }}
        >
          <ModeSwitcher />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
