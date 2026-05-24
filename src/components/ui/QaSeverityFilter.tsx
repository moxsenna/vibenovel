import React from 'react'
import { motion } from 'framer-motion'
import type { QaLog } from '../../types/project'

export type QaFilterValue = 'ALL' | QaLog['type']

interface QaSeverityFilterProps {
  value: QaFilterValue
  onChange: (next: QaFilterValue) => void
  logs: QaLog[]
}

const TABS: { value: QaFilterValue; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Semua', icon: 'inbox' },
  { value: 'PLOT_HOLE', label: 'Plot Hole', icon: 'report' },
  { value: 'EMOTION_FLAT', label: 'Emosi', icon: 'sentiment_neutral' },
  { value: 'CHEKHOVS_GUN', label: 'Chekhov', icon: 'history_edu' },
  { value: 'FILLER', label: 'Filler', icon: 'water_drop' }
]

export const QaSeverityFilter: React.FC<QaSeverityFilterProps> = ({ value, onChange, logs }) => {
  const counts = TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'ALL'
      ? logs.length
      : logs.filter((l) => l.type === tab.value).length
    return acc
  }, {} as Record<QaFilterValue, number>)

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant/20 overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => {
        const count = counts[tab.value]
        const isActive = value === tab.value
        const isEmpty = count === 0 && tab.value !== 'ALL'
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            disabled={isEmpty}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? 'text-primary'
                : isEmpty
                ? 'text-on-surface-variant/30 cursor-not-allowed'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="qaFilterActive"
                className="absolute inset-0 bg-primary/15 rounded-lg border border-primary/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="material-symbols-outlined text-[14px] relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
            {count > 0 && (
              <span
                className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-primary text-on-primary' : 'bg-on-surface-variant/15 text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
