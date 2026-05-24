import React, { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'

// Lazy-loaded heavy viz to keep main bundle slim. Recharts (~180KB) and D3
// (~40KB) only ship to users who actually open the Visualisasi mode.
const EmotionalArcHeatmap = lazy(() =>
  import('./EmotionalArcHeatmap').then((m) => ({ default: m.EmotionalArcHeatmap }))
)
const ConstellationMap = lazy(() =>
  import('./ConstellationMap').then((m) => ({ default: m.ConstellationMap }))
)
const TimelineView = lazy(() =>
  import('./TimelineView').then((m) => ({ default: m.TimelineView }))
)
const WordCountAnalytics = lazy(() =>
  import('./WordCountAnalytics').then((m) => ({ default: m.WordCountAnalytics }))
)

const VizSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant/70">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    <span className="text-body-sm">Memuat {label}…</span>
  </div>
)

const VizSection: React.FC<{
  icon: string
  title: string
  subtitle?: string
  children: React.ReactNode
}> = ({ icon, title, subtitle, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="bg-surface-container rounded-2xl border border-outline-variant/20 shadow-sm inner-glow overflow-hidden"
  >
    <header className="px-5 pt-5 pb-3 border-b border-outline-variant/15">
      <h2 className="text-title-lg text-on-surface font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-body-sm text-on-surface-variant/70 mt-1">{subtitle}</p>
      )}
    </header>
    <div className="p-5">{children}</div>
  </motion.section>
)

export const VisualizationPanel: React.FC = () => {
  const chapters = useProjectStore((s) => s.chapters)
  const activeProject = useProjectStore((s) => s.activeProject)
  const setMode = useUiStore((s) => s.setMode)

  // Empty state — no project / no chapters at all.
  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        Belum ada proyek aktif.
      </div>
    )
  }

  const hasChapters = chapters.length > 0

  if (!hasChapters) {
    return (
      <div className="flex-1 overflow-y-auto px-5 md:px-10 py-8 bg-surface-container-lowest">
        <div className="max-w-2xl mx-auto bg-surface-container rounded-2xl border border-outline-variant/20 p-10 text-center inner-glow">
          <div className="text-6xl mb-4">🌌</div>
          <h2 className="text-headline-sm text-on-surface font-bold mb-2">
            Belum ada bab untuk divisualisasikan
          </h2>
          <p className="text-body-md text-on-surface-variant/80 mb-6 leading-relaxed">
            Generate outline dulu agar Heatmap, Constellation, Timeline, dan Word Count Analytics punya data untuk ditampilkan.
          </p>
          <button
            onClick={() => setMode('outline')}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            🎯 Buka Outline Engine
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-surface-container-lowest">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header banner */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-headline-md text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">
                analytics
              </span>
              Visualisasi Novel
            </h1>
            <p className="text-body-sm text-on-surface-variant/70 mt-1">
              Bird&apos;s-eye view atas pola emosi, jaringan karakter, alur waktu, dan distribusi kata.
            </p>
          </div>
          <span className="text-label-md text-on-surface-variant/70 font-semibold">
            {chapters.length} bab • target {activeProject.target_chapters}
          </span>
        </div>

        {/* 2x2 grid on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VizSection
            icon="grid_on"
            title="Emotional Arc Heatmap"
            subtitle="Switch lens untuk lihat pola tone, cliffhanger, filler, word count, atau status."
          >
            <Suspense fallback={<VizSkeleton label="heatmap" />}>
              <EmotionalArcHeatmap />
            </Suspense>
          </VizSection>

          <VizSection
            icon="bar_chart"
            title="Word Count Analytics"
            subtitle="Bar per bab + cumulative line + target reference."
          >
            <Suspense fallback={<VizSkeleton label="grafik kata" />}>
              <WordCountAnalytics />
            </Suspense>
          </VizSection>

          <VizSection
            icon="timeline"
            title="Timeline View"
            subtitle="Arc bands, mystery markers, dan plot thread lifespan bars."
          >
            <Suspense fallback={<VizSkeleton label="timeline" />}>
              <TimelineView />
            </Suspense>
          </VizSection>

          <VizSection
            icon="hub"
            title="Constellation Map"
            subtitle="Jaringan karakter, item, dan thread. Filter + hover + drag untuk eksplorasi."
          >
            <Suspense fallback={<VizSkeleton label="constellation" />}>
              <ConstellationMap />
            </Suspense>
          </VizSection>
        </div>
      </div>
    </div>
  )
}
