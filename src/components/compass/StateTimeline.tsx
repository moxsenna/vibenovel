import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CharacterState, Character } from '../../types/project'

interface StateTimelineProps {
  characterStates: CharacterState[]
  characters: Character[]
  activeChapterNumber: number
  onRegenerate?: () => void
  stateGenStatus?: 'idle' | 'generating' | 'done' | 'error'
}

export const StateTimeline: React.FC<StateTimelineProps> = ({
  characterStates,
  characters,
  activeChapterNumber,
  onRegenerate,
  stateGenStatus = 'idle'
}) => {
  const [expandedSecrets, setExpandedSecrets] = useState<Set<string>>(new Set())

  // Get the latest states for the active chapter (states up to current chapter)
  const relevantStates = characterStates
    .filter(s => s.chapter_number <= activeChapterNumber)
    .reduce((acc, state) => {
      const existing = acc.get(state.character_id)
      if (!existing || state.chapter_number > existing.chapter_number) {
        acc.set(state.character_id, state)
      }
      return acc
    }, new Map<string, CharacterState>())

  const states = Array.from(relevantStates.values())

  const toggleSecrets = (stateId: string) => {
    setExpandedSecrets(prev => {
      const next = new Set(prev)
      if (next.has(stateId)) next.delete(stateId)
      else next.add(stateId)
      return next
    })
  }

  const getCharName = (charId: string) =>
    characters.find(c => c.id === charId)?.name || charId

  const getRoleBadgeColor = (charId: string) => {
    const role = characters.find(c => c.id === charId)?.role
    switch (role) {
      case 'PROTAGONIST': return 'bg-primary/20 text-primary'
      case 'ANTAGONIST': return 'bg-error/20 text-error'
      case 'SUPPORTING': return 'bg-secondary/20 text-secondary'
      default: return 'bg-surface-variant/30 text-on-surface-variant'
    }
  }

  const getRoleName = (charId: string) => {
    const role = characters.find(c => c.id === charId)?.role
    switch (role) {
      case 'PROTAGONIST': return 'Protagonis'
      case 'ANTAGONIST': return 'Antagonis'
      case 'SUPPORTING': return 'Pendukung'
      case 'MINOR': return 'Minor'
      default: return 'Karakter'
    }
  }

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Header with Regenerate */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-on-surface-variant uppercase tracking-wider text-label-md">
          State Karakter
        </span>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={stateGenStatus === 'generating'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-label-md text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={`material-symbols-outlined text-[14px] ${stateGenStatus === 'generating' ? 'animate-spin' : ''}`}
            >
              {stateGenStatus === 'generating' ? 'progress_activity' : 'refresh'}
            </span>
            {stateGenStatus === 'generating' ? 'Ekstraksi...' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* Status indicator */}
      <AnimatePresence>
        {stateGenStatus === 'generating' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-body-sm text-secondary"
          >
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Mengekstrak state karakter dari prosa...
          </motion.div>
        )}
        {stateGenStatus === 'done' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#3B5A40]/20 border border-[#4A6E4F]/30 text-body-sm text-[#E2F0E5]"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            State berhasil disimpan!
          </motion.div>
        )}
        {stateGenStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-error/10 border border-error/30 text-body-sm text-error"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Gagal mengekstrak state. Coba regenerate manual.
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Cards */}
      {states.length > 0 ? (
        states.map(state => (
          <motion.div
            key={state.id}
            variants={itemVariants}
            className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2"
          >
            {/* Character name + role badge */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface text-body-sm">
                {getCharName(state.character_id)}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleBadgeColor(state.character_id)}`}>
                  {getRoleName(state.character_id)}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 font-mono">
                  Bab {state.chapter_number}
                </span>
              </div>
            </div>

            {/* State fields */}
            <div className="space-y-1 text-label-md text-on-surface-variant">
              <div className="flex items-start gap-1.5">
                <span className="shrink-0">📍</span>
                <span>{state.location || 'Tidak diketahui'}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="shrink-0">🎭</span>
                <span>{state.emotional_state || 'Netral'}</span>
              </div>
              {state.physical_condition && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">💊</span>
                  <span>{state.physical_condition}</span>
                </div>
              )}
              {state.active_goal && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">🎯</span>
                  <span className="text-primary font-medium">{state.active_goal}</span>
                </div>
              )}

              {/* Knowledge */}
              {state.knowledge_state && state.knowledge_state.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">🧠</span>
                  <div className="flex flex-wrap gap-1">
                    {state.knowledge_state.map((k, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/15">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              {state.inventory.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">🎒</span>
                  <div className="flex flex-wrap gap-1">
                    {state.inventory.map((item, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/15">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secrets (collapsible) */}
              {state.secrets && state.secrets.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSecrets(state.id)}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <span className="shrink-0">🤫</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      Rahasia ({state.secrets.length})
                    </span>
                    <span className="material-symbols-outlined text-[12px]">
                      {expandedSecrets.has(state.id) ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSecrets.has(state.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-5 mt-1 space-y-0.5 overflow-hidden"
                      >
                        {state.secrets.map((s, i) => (
                          <div key={i} className="text-[11px] text-error/70 italic">• {s}</div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Alliances */}
              {state.alliances && state.alliances.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">🤝</span>
                  <span>{state.alliances.join(', ')}</span>
                </div>
              )}

              {/* Appearance */}
              {state.appearance_notes && (
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">👁</span>
                  <span className="italic">{state.appearance_notes}</span>
                </div>
              )}

              {/* Last action */}
              <div className="flex items-start gap-1.5 pt-1 border-t border-outline-variant/20 mt-1">
                <span className="shrink-0">⚡</span>
                <span className="text-on-surface/80 text-[11px]">{state.last_action || '-'}</span>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <motion.div
          variants={itemVariants}
          className="text-center py-6"
        >
          <span className="material-symbols-outlined text-outline text-[36px] block mb-2">
            person_search
          </span>
          <p className="text-body-sm text-on-surface-variant/60 leading-relaxed">
            Belum ada state karakter.
            <br />
            <span className="text-label-md">
              State akan dibuat otomatis setelah bab pertama selesai ditulis.
            </span>
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
