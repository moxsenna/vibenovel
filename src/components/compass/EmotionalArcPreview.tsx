import React from 'react'
import { motion } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'

const TONE_DOT: Record<string, string> = {
  CONFLICT: 'bg-rose-500',
  TENSION: 'bg-rose-400',
  RELIEF: 'bg-emerald-400',
  DOPAMINE: 'bg-amber-400',
  SHOCK: 'bg-purple-500',
  BREATHER: 'bg-cyan-400',
  ROMANCE: 'bg-pink-400',
  MELANCHOLY: 'bg-blue-400'
}

const toneColor = (tone: string | null): string => {
  if (!tone) return 'bg-gray-500/40'
  const upper = tone.toUpperCase()
  for (const key of Object.keys(TONE_DOT)) {
    if (upper.includes(key)) return TONE_DOT[key]
  }
  return 'bg-gray-500/40'
}

export const EmotionalArcPreview: React.FC = () => {
  const { chapters } = useProjectStore()
  const activeChapterNumber = useUiStore((s) => s.activeChapter)

  const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)

  return (
    <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
          Emotional Arc
        </h3>
        <span className="text-xs text-on-surface-variant/70 font-semibold">
          {sorted.filter((c) => c.emotional_tone).length}/{sorted.length} bab
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-6 px-3">
          <p className="text-body-sm text-on-surface-variant/70 leading-relaxed">
            Generate outline dulu untuk melihat arc.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto scrollbar-hide pr-1">
          {sorted.map((c, i) => {
            const isActive = c.chapter_number === activeChapterNumber
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 border border-primary/40'
                    : 'hover:bg-surface-container/60 border border-transparent'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 w-6 text-right shrink-0">
                  {c.chapter_number}
                </span>
                <div className={`w-2 h-2 rounded-full shrink-0 ${toneColor(c.emotional_tone)}`} />
                <span className="text-xs text-on-surface-variant truncate flex-1">
                  {c.emotional_tone || (
                    <span className="italic text-on-surface-variant/40">belum ada tone</span>
                  )}
                </span>
                {c.dopamine_beat && (
                  <span
                    className="text-[10px]"
                    title="Dopamine beat"
                  >
                    ⚡
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-outline-variant/15 flex flex-wrap gap-x-3 gap-y-1.5">
        {[
          ['CONFLICT', 'Konflik'],
          ['RELIEF', 'Lega'],
          ['DOPAMINE', 'Dopamin'],
          ['SHOCK', 'Kejut'],
          ['BREATHER', 'Jeda']
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[key]}`} />
            <span className="text-[10px] text-on-surface-variant/70 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
