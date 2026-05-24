import React from 'react'
import { motion } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'
import type { WorkspaceMode } from '../../store/useUiStore'

const MODES = [
  { id: 'brainstorm', label: '💬 Brainstorm' },
  { id: 'outline', label: '📋 Outline' },
  { id: 'write', label: '✍ Menulis' },
  { id: 'review', label: '📊 Review' }
] as const

export const ModeSwitcher: React.FC = () => {
  const activeMode = useUiStore((s) => s.activeMode)
  const setMode = useUiStore((s) => s.setMode)

  return (
    <div className="flex justify-center space-x-2 overflow-x-auto scrollbar-hide py-1 w-full max-w-full">
      <div className="flex bg-surface-container-low p-1 rounded-full border border-surface-variant/10">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id as WorkspaceMode)}
              className="relative px-5 py-2 rounded-full text-label-lg flex items-center space-x-2 transition-all duration-300 font-semibold cursor-pointer select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="activeWorkspaceMode"
                  className="absolute inset-0 bg-primary-container rounded-full shadow-[0_0_15px_rgba(232,160,191,0.2)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {mode.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
