import React from 'react'
import { motion } from 'framer-motion'
import type { BeatOutline } from '../../types/project'

interface BeatIndicatorProps {
  beats: BeatOutline[]
  currentIndex: number
  onSelectBeat: (index: number) => void
}

export const BeatIndicator: React.FC<BeatIndicatorProps> = ({ beats, currentIndex, onSelectBeat }) => {
  if (!beats || beats.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-text-primary">Struktur Bab (Adegan)</span>
        <span className="text-text-tertiary">{currentIndex + 1} / {beats.length}</span>
      </div>
      
      <div className="flex gap-2 w-full">
        {beats.map((beat, index) => {
          const isActive = index === currentIndex
          const isCompleted = (beat.prose?.trim().length || 0) > 10
          const isPast = index < currentIndex

          return (
            <button
              key={beat.id}
              onClick={() => onSelectBeat(index)}
              className="group relative flex-1 h-3 rounded-full overflow-hidden bg-bg-secondary transition-all cursor-pointer"
              title={beat.direction}
            >
              {/* Tooltip on hover */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-secondary text-text-secondary text-xs rounded-lg shadow-xl pointer-events-none transition-opacity z-10 border border-border-divider">
                <p className="font-semibold text-text-primary mb-1">Adegan {index + 1}</p>
                <p className="line-clamp-3">{beat.direction}</p>
              </div>

              {/* Progress Fill */}
              <motion.div 
                className={`absolute inset-0 origin-left ${
                  isActive ? 'bg-primary' : isCompleted ? 'bg-success' : 'bg-transparent'
                } ${isPast && !isCompleted ? 'bg-warning' : ''}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
