/**
 * SkipLink — Sprint 9 a11y
 *
 * Visually hidden link that becomes visible on focus. Keyboard users can
 * press Tab once to bypass repeated nav landmarks and jump directly to
 * the main content area.
 *
 * Pair with `<main id="main-content">` in the page.
 */

import React from 'react'

interface SkipLinkProps {
  targetId?: string
  label?: string
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  label = 'Lewati ke konten utama'
}) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-on-primary"
  >
    {label}
  </a>
)
