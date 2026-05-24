import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { usePlotRadar } from '../../hooks/usePlotRadar'
import { QaSeverityFilter, type QaFilterValue } from '../ui/QaSeverityFilter'
import { ThreadTrackerPanel } from '../compass/ThreadTrackerPanel'
import { EmotionalArcPreview } from '../compass/EmotionalArcPreview'

type MobileTab = 'prose' | 'qa' | 'context'

interface MobileTabsProps {
  active: MobileTab
  onChange: (next: MobileTab) => void
}

const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'prose', label: 'Prosa', icon: 'menu_book' },
  { id: 'qa', label: 'QA', icon: 'radar' },
  { id: 'context', label: 'Konteks', icon: 'hub' }
]

const MobileTabs: React.FC<MobileTabsProps> = ({ active, onChange }) => (
  <div className="md:hidden flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant/20 mb-4">
    {MOBILE_TABS.map((tab) => {
      const isActive = active === tab.id
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            isActive ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="reviewMobileTabActive"
              className="absolute inset-0 bg-primary/15 rounded-lg border border-primary/30"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="material-symbols-outlined text-[14px] relative z-10">{tab.icon}</span>
          <span className="relative z-10">{tab.label}</span>
        </button>
      )
    })}
  </div>
)

export const ReviewPanel: React.FC = () => {
  const { chapters } = useProjectStore()
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const { triggerPlotRadar, qaStatus } = usePlotRadar()

  const activeChapter = chapters.find((c) => c.chapter_number === activeChapterNumber)
  const [filter, setFilter] = useState<QaFilterValue>('ALL')
  const [mobileTab, setMobileTab] = useState<MobileTab>('prose')

  const allLogs = useMemo(() => activeChapter?.qa_logs ?? [], [activeChapter?.qa_logs])
  const filteredLogs = useMemo(
    () => (filter === 'ALL' ? allLogs : allLogs.filter((l) => l.type === filter)),
    [allLogs, filter]
  )

  if (!activeChapter) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-on-surface-variant text-center">
        Pilih bab dari daftar untuk mereview prosa dan mengecek Plot Radar.
      </div>
    )
  }

  const handleRunQa = () => {
    if (activeChapter.prose) {
      triggerPlotRadar(activeChapter.id, activeChapter.prose)
    }
  }

  const getSeverityColor = (type: string, severity: string) => {
    if (severity === 'CRITICAL') return 'bg-error text-on-error border-error'
    if (type === 'EMOTION_FLAT') return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    if (type === 'CHEKHOVS_GUN') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    if (type === 'FILLER') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    return 'bg-secondary-container text-on-secondary-container border-outline-variant/30'
  }

  // ── Section Renderers (reused for desktop columns + mobile tabs) ──
  const proseSection = (
    <div className="bg-surface-container/75 p-6 rounded-[20px] border border-outline-variant/20 shadow-sm h-full overflow-y-auto scrollbar-hide">
      <h2 className="text-headline-sm font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-4">
        Bab {activeChapter.chapter_number}: {activeChapter.title}
      </h2>
      <div className="prose prose-invert max-w-none text-on-surface-variant font-serif text-lg leading-relaxed whitespace-pre-wrap">
        {activeChapter.prose || (
          <span className="italic text-on-surface-variant/50">
            Belum ada prosa yang ditulis untuk bab ini.
          </span>
        )}
      </div>
    </div>
  )

  const qaSection = (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-hide pr-1">
      <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">radar</span>
          Plot Radar QA
        </h3>
        <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
          Analisis mendalam plot hole, emosi, Chekhov's Gun, dan filler.
        </p>
        <div className="mt-4">
          <button
            onClick={handleRunQa}
            disabled={qaStatus === 'analyzing' || !activeChapter.prose}
            className="w-full h-10 px-4 rounded-xl btn-gradient text-white font-semibold text-label-md cursor-pointer flex items-center justify-center gap-2 hover-glow disabled:opacity-40"
          >
            {qaStatus === 'analyzing' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <span>Jalankan Pemindaian</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {allLogs.length > 0 && (
        <QaSeverityFilter value={filter} onChange={setFilter} logs={allLogs} />
      )}

      <div className="flex flex-col gap-3">
        {allLogs.length === 0 && qaStatus !== 'analyzing' && activeChapter.prose && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center text-emerald-400">
            <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
            <p className="font-medium">Bab ini bersih dari masalah!</p>
          </div>
        )}

        {filteredLogs.length === 0 && allLogs.length > 0 && (
          <div className="text-center py-6 px-3 text-on-surface-variant/60 text-sm italic">
            Tidak ada log untuk filter ini.
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filteredLogs.map((log, i) => (
            <motion.div
              key={log.id || i}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border ${getSeverityColor(log.type, log.severity)} shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded uppercase tracking-wider">
                  {log.type.replace('_', ' ')}
                </span>
                {log.severity === 'CRITICAL' && (
                  <span className="text-xs font-bold text-error px-2 py-1 bg-error/10 rounded uppercase">
                    CRITICAL
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mb-3">{log.message}</p>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-white/50 uppercase font-bold mb-1">Saran Editor:</p>
                <p className="text-sm text-white/90">{log.suggestion}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  const contextSection = (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-hide pr-1">
      <ThreadTrackerPanel />
      <EmotionalArcPreview />
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col bg-surface-container-lowest">
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden">
        {/* Mobile: tab switcher */}
        <MobileTabs active={mobileTab} onChange={setMobileTab} />

        {/* Mobile content (single section) */}
        <div className="md:hidden flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {mobileTab === 'prose' && proseSection}
              {mobileTab === 'qa' && qaSection}
              {mobileTab === 'context' && contextSection}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop: 3-column layout */}
        <div className="hidden md:flex flex-1 gap-6 overflow-hidden">
          <div className="flex-[5] min-w-0">{proseSection}</div>
          <div className="flex-[3] min-w-0">{qaSection}</div>
          <div className="flex-[2] min-w-0">{contextSection}</div>
        </div>
      </div>
    </div>
  )
}
