/**
 * LoadingSplash — Sprint 9
 *
 * Full-screen loading state for lazy route Suspense fallbacks.
 * Match the lobby loading style untuk konsistensi visual saat transisi.
 */

import React from 'react'

interface LoadingSplashProps {
  label?: string
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({ label = 'Memuat workspace...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    <p className="text-body-md text-on-surface-variant/80">{label}</p>
  </div>
)
