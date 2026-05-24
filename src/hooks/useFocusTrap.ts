/**
 * useFocusTrap — Sprint 9
 *
 * Traps keyboard focus inside a container ref while open. Supports:
 *  - Tab cycles through focusable elements (forward + reverse with Shift).
 *  - Escape calls `onEscape` (if provided).
 *  - Auto-focuses the first focusable element on open.
 *  - Restores focus to the element that had it before open on cleanup.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null)
 *   useFocusTrap(ref, isOpen, onClose)
 *   return <div ref={ref}>...modal...</div>
 */

import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onEscape?: () => void
): void {
  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Auto-focus first focusable on mount.
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)

    if (focusables.length > 0) {
      // Slight delay so DOM has settled.
      requestAnimationFrame(() => focusables[0].focus())
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const list = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that had it before.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try {
          previouslyFocused.focus()
        } catch {
          // ignore — element may have been removed.
        }
      }
    }
  }, [containerRef, isOpen, onEscape])
}
