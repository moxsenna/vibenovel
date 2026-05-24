import React, { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { computeArcBands } from '../../lib/kbm-pacing'
import type { Chapter, MysteryLayer, PlotThread } from '../../types/project'

const TONE_DOT: Record<string, string> = {
  CONFLICT: 'bg-rose-500',
  TENSION: 'bg-rose-400',
  RELIEF: 'bg-emerald-400',
  DOPAMINE: 'bg-amber-400',
  SHOCK: 'bg-purple-500',
  BREATHER: 'bg-cyan-400',
  ROMANCE: 'bg-pink-400',
  MELANCHOLY: 'bg-blue-400',
  MYSTERY: 'bg-indigo-400'
}

const URGENCY_COLOR: Record<PlotThread['urgency'], string> = {
  LOW: '#94a3b8',
  MEDIUM: '#60a5fa',
  HIGH: '#fb923c',
  CRITICAL: '#f43f5e'
}

const STATUS_BADGE: Record<Chapter['status'], string> = {
  OUTLINE_ONLY: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  GENERATING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DRAFT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  FINAL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  IMPORTED: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
}

const toneClass = (tone: string | null): string => {
  if (!tone) return 'bg-gray-500/40'
  const upper = tone.toUpperCase()
  for (const k of Object.keys(TONE_DOT)) {
    if (upper.includes(k)) return TONE_DOT[k]
  }
  return 'bg-gray-500/40'
}

interface BreadcrumbAtChapter {
  layer: MysteryLayer
  hint: string
}

interface RevealAtChapter {
  layer: MysteryLayer
}

export const TimelineView: React.FC = () => {
  const chapters = useProjectStore((s) => s.chapters)
  const project = useProjectStore((s) => s.activeProject)
  const mysteryLayers = useProjectStore((s) => s.mysteryLayers)
  const plotThreads = useProjectStore((s) => s.plotThreads)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const setMode = useUiStore((s) => s.setMode)
  const activeChapter = useUiStore((s) => s.activeChapter)

  const [compact, setCompact] = useState(false)

  const sorted = useMemo(
    () => [...chapters].sort((a, b) => a.chapter_number - b.chapter_number),
    [chapters]
  )

  const totalChapters = project?.target_chapters || sorted.length || 1

  const arcBands = useMemo(() => computeArcBands(totalChapters), [totalChapters])

  // Group chapters by arc band
  const chaptersByBand = useMemo(() => {
    const grouped = new Map<string, Chapter[]>()
    for (const band of arcBands) {
      grouped.set(
        band.id,
        sorted.filter(
          (ch) => ch.chapter_number >= band.startChapter && ch.chapter_number <= band.endChapter
        )
      )
    }
    return grouped
  }, [sorted, arcBands])

  // Mystery breadcrumbs / reveals indexed by chapter_number
  const breadcrumbsByChapter = useMemo(() => {
    const map = new Map<number, BreadcrumbAtChapter[]>()
    for (const layer of mysteryLayers) {
      for (const bc of layer.breadcrumbs ?? []) {
        const list = map.get(bc.chapter) ?? []
        list.push({ layer, hint: bc.hint })
        map.set(bc.chapter, list)
      }
    }
    return map
  }, [mysteryLayers])

  const revealsByChapter = useMemo(() => {
    const map = new Map<number, RevealAtChapter[]>()
    for (const layer of mysteryLayers) {
      if (layer.revealed_at_chapter !== null) {
        const list = map.get(layer.revealed_at_chapter) ?? []
        list.push({ layer })
        map.set(layer.revealed_at_chapter, list)
      }
    }
    return map
  }, [mysteryLayers])

  // Plot thread spans (top N visible threads)
  const threadSpans = useMemo(() => {
    const visible = plotThreads
      .filter((t) => t.status !== 'ABANDONED')
      .map((t) => {
        const start = t.planted_at
        const end = t.resolved_at ?? totalChapters
        const isDangling = t.status !== 'RESOLVED' && end - start > 10
        return { thread: t, start, end, isDangling }
      })
      .sort((a, b) => a.start - b.start)
    return visible.slice(0, 10) // Cap to 10 lanes for legibility
  }, [plotThreads, totalChapters])

  const characterById = useProjectStore((s) => s.characters)
  const charNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of characterById) map.set(c.id, c.name)
    return map
  }, [characterById])

  const handleNavigate = (n: number) => {
    setActiveChapter(n)
    setMode('write')
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/70">
        Belum ada bab di timeline.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-body-sm text-on-surface-variant/70">
          {arcBands.length} arc bands • {sorted.length} bab • {threadSpans.length} thread aktif
        </div>
        <button
          onClick={() => setCompact((v) => !v)}
          className="px-3 py-1.5 rounded-full text-label-md font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          aria-pressed={compact}
        >
          {compact ? '🔍 Expand' : '📦 Compact'}
        </button>
      </div>

      <div className="flex gap-3 max-h-[600px] overflow-y-auto pr-1">
        {/* Plot Thread Lifespan Bars (left sticky column) */}
        {threadSpans.length > 0 && (
          <aside
            className="w-32 sticky top-0 self-start shrink-0 hidden md:flex flex-col gap-1.5 border-r border-outline-variant/15 pr-2"
            aria-label="Plot thread lifespan bars"
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-1">
              Threads
            </div>
            {threadSpans.map(({ thread, start, end, isDangling }) => {
              const span = totalChapters || 1
              const top = ((start - 1) / span) * 100
              const height = Math.max(2, ((end - start + 1) / span) * 100)
              return (
                <div key={thread.id} className="relative h-[420px] flex">
                  <div
                    className="w-1 rounded-full"
                    style={{
                      backgroundColor: URGENCY_COLOR[thread.urgency],
                      marginTop: `${top}%`,
                      height: `${height}%`,
                      borderStyle: isDangling ? 'dashed' : 'solid',
                      opacity: thread.status === 'RESOLVED' ? 0.5 : 1
                    }}
                    title={`${thread.title} (${thread.urgency}) • ${thread.status} • bab ${start}-${end}${
                      isDangling ? ' • dangling' : ''
                    }`}
                  />
                  <div className="ml-1.5 flex-1 min-w-0 mt-1">
                    <div className="text-[10px] font-bold text-on-surface truncate">
                      {thread.title}
                    </div>
                    <div className="text-[9px] text-on-surface-variant/60 uppercase">
                      {thread.urgency}
                    </div>
                  </div>
                </div>
              )
            })}
          </aside>
        )}

        {/* Main timeline */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {arcBands.map((band) => {
            const items = chaptersByBand.get(band.id) ?? []
            if (items.length === 0) return null
            return (
              <section key={band.id} aria-label={band.label}>
                {/* Arc band divider */}
                <div className="sticky top-0 z-10 bg-surface-container/95 backdrop-blur-sm py-1.5 border-b border-outline-variant/30 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-title-sm font-bold text-on-surface">{band.label}</span>
                    <span className="text-[11px] text-on-surface-variant/70">
                      Bab {band.startChapter}–{band.endChapter}
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/70 mt-0.5">
                    {band.description}
                  </div>
                </div>

                {/* Chapter rows */}
                <div className="flex flex-col gap-1.5">
                  {items.map((ch) => {
                    const breadcrumbs = breadcrumbsByChapter.get(ch.chapter_number) ?? []
                    const reveals = revealsByChapter.get(ch.chapter_number) ?? []
                    const isActive = ch.chapter_number === activeChapter

                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleNavigate(ch.chapter_number)}
                        className={`text-left rounded-lg px-3 py-2 transition-colors cursor-pointer border ${
                          isActive
                            ? 'bg-primary/10 border-primary/40'
                            : 'bg-surface-container-low border-outline-variant/15 hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${toneClass(ch.emotional_tone)}`}
                            title={ch.emotional_tone || 'tanpa tone'}
                          />
                          <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 w-8 text-right">
                            {ch.chapter_number}
                          </span>
                          <span className="text-body-sm font-bold text-on-surface truncate flex-1 min-w-0">
                            {ch.title || '(tanpa judul)'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${STATUS_BADGE[ch.status]}`}
                          >
                            {ch.status}
                          </span>
                          {ch.dopamine_beat && <span title="Dopamine">⚡</span>}
                          {ch.false_resolution && <span title="False Resolution">💔</span>}
                          {ch.is_locked && <span title="Locked">🔒</span>}
                        </div>

                        {!compact && (
                          <div className="ml-[26px] mt-1 flex flex-wrap gap-1.5 text-[10px] text-on-surface-variant/80">
                            {ch.time_in_story && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container">
                                ⏱ {ch.time_in_story}
                              </span>
                            )}
                            {ch.location && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container">
                                📍 {ch.location}
                              </span>
                            )}
                            {ch.active_characters?.slice(0, 4).map((cid, i) => {
                              const name = charNameById.get(cid) ?? cid
                              return (
                                <span
                                  key={`${ch.id}-char-${i}`}
                                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                                >
                                  👤 {name}
                                </span>
                              )
                            })}
                            {ch.active_characters && ch.active_characters.length > 4 && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant/60">
                                +{ch.active_characters.length - 4}
                              </span>
                            )}
                            {breadcrumbs.map((bc, i) => (
                              <span
                                key={`bc-${i}`}
                                className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                title={`Layer ${bc.layer.layer_number}: ${bc.hint}`}
                              >
                                🍞 {bc.layer.central_question.slice(0, 30)}
                                {bc.layer.central_question.length > 30 ? '…' : ''}
                              </span>
                            ))}
                            {reveals.map((rv, i) => (
                              <span
                                key={`rv-${i}`}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                title={rv.layer.answer ?? rv.layer.central_question}
                              >
                                ✨ Reveal: {rv.layer.central_question.slice(0, 30)}
                                {rv.layer.central_question.length > 30 ? '…' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
