import React from 'react'
import { motion } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import type { PlotThread } from '../../types/project'

const STATUS_STYLE: Record<PlotThread['status'], { label: string; cls: string }> = {
  PLANTED: { label: 'Planted', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACTIVE: { label: 'Active', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  RESOLVED: { label: 'Resolved', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ABANDONED: { label: 'Abandoned', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
}

const URGENCY_DOT: Record<PlotThread['urgency'], string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-rose-500 animate-pulse'
}

export const ThreadTrackerPanel: React.FC = () => {
  const { plotThreads } = useProjectStore()

  return (
    <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
          Thread Tracker
        </h3>
        <span className="text-xs text-on-surface-variant/70 font-semibold">
          {plotThreads.length} thread
        </span>
      </div>

      {plotThreads.length === 0 ? (
        <div className="text-center py-6 px-3">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl mb-2">
            radar
          </span>
          <p className="text-body-sm text-on-surface-variant/70 leading-relaxed">
            Belum ada thread terdeteksi.
          </p>
          <p className="text-xs text-on-surface-variant/50 mt-2 italic">
            Auto-detect aktif di Sprint 7.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto scrollbar-hide pr-1">
          {plotThreads.map((thread, i) => {
            const status = STATUS_STYLE[thread.status]
            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/15 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${URGENCY_DOT[thread.urgency]}`}
                    title={`Urgency: ${thread.urgency}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {thread.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.cls} uppercase tracking-wider`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70 font-medium">
                        Bab {thread.planted_at}
                        {thread.resolved_at ? ` → ${thread.resolved_at}` : ''}
                      </span>
                    </div>
                    {thread.notes && (
                      <p className="text-xs text-on-surface-variant/80 mt-2 line-clamp-2">
                        {thread.notes}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
