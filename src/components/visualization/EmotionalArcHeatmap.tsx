import React, { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import type { Chapter } from '../../types/project'

// ── Lens Definitions ──────────────────────────────────────────────────────

type Lens = 'tone' | 'cliffhanger' | 'filler' | 'wordcount' | 'status'

const LENSES: Array<{ id: Lens; label: string; emoji: string }> = [
  { id: 'tone', label: 'Tone', emoji: '🎭' },
  { id: 'cliffhanger', label: 'Cliffhanger', emoji: '🪝' },
  { id: 'filler', label: 'Filler', emoji: '🥱' },
  { id: 'wordcount', label: 'Word Count', emoji: '📝' },
  { id: 'status', label: 'Status', emoji: '🏷️' }
]

// ── Color Palettes per Lens ───────────────────────────────────────────────

const TONE_COLORS: Record<string, string> = {
  CONFLICT: '#f43f5e',
  TENSION: '#fb7185',
  RELIEF: '#34d399',
  DOPAMINE: '#fbbf24',
  SHOCK: '#a855f7',
  BREATHER: '#22d3ee',
  ROMANCE: '#f472b6',
  MELANCHOLY: '#60a5fa',
  MYSTERY: '#818cf8'
}

const CLIFFHANGER_COLORS: Record<string, string> = {
  REVELATION: '#fbbf24',
  DANGER: '#f43f5e',
  DECISION: '#a855f7',
  BETRAYAL: '#dc2626',
  COUNTDOWN: '#fb923c',
  EMOTIONAL: '#f472b6'
}

const FILLER_COLORS: Record<string, string> = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#f43f5e'
}

const STATUS_COLORS: Record<Chapter['status'], string> = {
  OUTLINE_ONLY: '#94a3b8',
  GENERATING: '#fbbf24',
  DRAFT: '#60a5fa',
  FINAL: '#34d399',
  IMPORTED: '#a855f7'
}

const STATUS_LABEL: Record<Chapter['status'], string> = {
  OUTLINE_ONLY: 'Outline Only',
  GENERATING: 'Generating',
  DRAFT: 'Draft',
  FINAL: 'Final',
  IMPORTED: 'Imported'
}

const NEUTRAL = '#475569'

// ── Helpers ──────────────────────────────────────────────────────────────

const matchKey = (raw: string | null | undefined, palette: Record<string, string>): string | null => {
  if (!raw) return null
  const upper = raw.toUpperCase()
  for (const key of Object.keys(palette)) {
    if (upper.includes(key)) return key
  }
  return null
}

const wordCountColor = (count: number, max: number): string => {
  if (max <= 0 || count <= 0) return NEUTRAL
  const ratio = Math.min(1, count / max)
  // Cold blue (low) → warm orange (high). Hue 220 → 30.
  const hue = 220 - 190 * ratio
  const sat = 60 + 25 * ratio
  const light = 55 - 10 * ratio
  return `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`
}

interface CellData {
  chapter: Chapter
  color: string
  legendKey: string | null
  value: string
}

// ── Component ────────────────────────────────────────────────────────────

export const EmotionalArcHeatmap: React.FC = () => {
  const chapters = useProjectStore((s) => s.chapters)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const setMode = useUiStore((s) => s.setMode)

  const [lens, setLens] = useState<Lens>('tone')
  const [hovered, setHovered] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...chapters].sort((a, b) => a.chapter_number - b.chapter_number),
    [chapters]
  )

  const maxWords = useMemo(
    () => sorted.reduce((m, c) => Math.max(m, c.word_count || 0), 0),
    [sorted]
  )

  const cells: CellData[] = useMemo(() => {
    return sorted.map((ch) => {
      let color = NEUTRAL
      let legendKey: string | null = null
      let value = '—'

      switch (lens) {
        case 'tone': {
          const key = matchKey(ch.emotional_tone, TONE_COLORS)
          if (key) {
            color = TONE_COLORS[key]
            legendKey = key
            value = ch.emotional_tone || key
          } else if (ch.emotional_tone) {
            value = ch.emotional_tone
          } else {
            value = 'belum ada tone'
          }
          break
        }
        case 'cliffhanger': {
          const key = matchKey(ch.cliffhanger_type, CLIFFHANGER_COLORS)
          if (key) {
            color = CLIFFHANGER_COLORS[key]
            legendKey = key
            value = ch.cliffhanger_type || key
          } else if (ch.cliffhanger_type) {
            value = ch.cliffhanger_type
          } else {
            value = 'tidak ada cliffhanger'
          }
          break
        }
        case 'filler': {
          const raw = (ch.filler_risk || '').toLowerCase()
          if (raw && FILLER_COLORS[raw]) {
            color = FILLER_COLORS[raw]
            legendKey = raw
            value = `risk: ${raw}`
          } else {
            value = 'belum dianalisis'
          }
          break
        }
        case 'wordcount': {
          const wc = ch.word_count || 0
          color = wordCountColor(wc, maxWords)
          legendKey = wc === 0 ? 'empty' : 'wc'
          value = `${wc.toLocaleString()} kata`
          break
        }
        case 'status': {
          color = STATUS_COLORS[ch.status] ?? NEUTRAL
          legendKey = ch.status
          value = STATUS_LABEL[ch.status] ?? ch.status
          break
        }
      }

      return { chapter: ch, color, legendKey, value }
    })
  }, [sorted, lens, maxWords])

  const legend = useMemo(() => {
    switch (lens) {
      case 'tone':
        return Object.entries(TONE_COLORS).map(([k, v]) => ({ key: k, label: k, color: v }))
      case 'cliffhanger':
        return Object.entries(CLIFFHANGER_COLORS).map(([k, v]) => ({ key: k, label: k, color: v }))
      case 'filler':
        return [
          { key: 'low', label: 'Low risk', color: FILLER_COLORS.low },
          { key: 'medium', label: 'Medium', color: FILLER_COLORS.medium },
          { key: 'high', label: 'High risk', color: FILLER_COLORS.high }
        ]
      case 'wordcount':
        return [
          { key: 'cold', label: 'Sedikit kata', color: wordCountColor(1, 100) },
          { key: 'mid', label: 'Sedang', color: wordCountColor(50, 100) },
          { key: 'hot', label: 'Banyak kata', color: wordCountColor(100, 100) }
        ]
      case 'status':
        return (Object.keys(STATUS_COLORS) as Chapter['status'][]).map((k) => ({
          key: k,
          label: STATUS_LABEL[k],
          color: STATUS_COLORS[k]
        }))
    }
  }, [lens])

  const handleNavigate = (chapterNumber: number) => {
    setActiveChapter(chapterNumber)
    setMode('write')
  }

  const handleKeyDown = (e: React.KeyboardEvent, chapterNumber: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNavigate(chapterNumber)
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/70">
        Generate outline dulu untuk lihat heatmap.
      </div>
    )
  }

  // Auto-tighten cell width on dense projects.
  const cellWidth = sorted.length > 100 ? 16 : sorted.length > 60 ? 18 : 22

  return (
    <div className="flex flex-col gap-4">
      {/* Lens selector */}
      <div className="flex flex-wrap gap-1.5 sticky top-0 z-10 bg-surface-container -mx-1 px-1 pb-1">
        {LENSES.map((l) => (
          <button
            key={l.id}
            onClick={() => setLens(l.id)}
            className={`px-3 py-1.5 rounded-full text-label-md font-bold transition-all cursor-pointer ${
              lens === l.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
            aria-pressed={lens === l.id}
          >
            {l.emoji} {l.label}
          </button>
        ))}
      </div>

      {/* Heatmap strip */}
      <div className="overflow-x-auto pb-2 scrollbar-hide" aria-label={`Heatmap lens ${lens}`}>
        <div className="flex gap-[2px] min-w-fit">
          {cells.map((cell) => {
            const ch = cell.chapter
            const isHovered = hovered === ch.chapter_number
            return (
              <button
                key={ch.id}
                role="gridcell"
                tabIndex={0}
                aria-label={`Bab ${ch.chapter_number}, ${cell.value}, tap untuk navigasi`}
                onClick={() => handleNavigate(ch.chapter_number)}
                onKeyDown={(e) => handleKeyDown(e, ch.chapter_number)}
                onMouseEnter={() => setHovered(ch.chapter_number)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(ch.chapter_number)}
                onBlur={() => setHovered(null)}
                className={`relative flex flex-col items-center justify-end gap-0.5 cursor-pointer transition-all rounded-md ${
                  isHovered ? 'ring-2 ring-on-surface scale-110 z-10' : ''
                }`}
                style={{
                  width: `${cellWidth}px`,
                  height: '56px',
                  backgroundColor: cell.color,
                  outline: 'none'
                }}
              >
                {/* Overlays */}
                <div className="absolute top-0.5 left-0.5 right-0.5 flex flex-wrap justify-center gap-0 leading-none text-[8px]">
                  {ch.dopamine_beat && <span title="Dopamine">⚡</span>}
                  {ch.false_resolution && <span title="False Resolution">💔</span>}
                  {ch.is_locked && <span title="Locked">🔒</span>}
                </div>
                <span className="absolute bottom-0 left-0 right-0 text-[8px] font-mono font-bold text-white/90 text-center pb-0.5 [text-shadow:0_0_2px_rgba(0,0,0,0.7)]">
                  {ch.chapter_number}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tooltip area */}
      <div className="min-h-[44px] px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/15 text-body-sm">
        {hovered !== null
          ? (() => {
              const c = cells.find((x) => x.chapter.chapter_number === hovered)
              if (!c) return null
              return (
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-bold text-on-surface">
                    Bab {c.chapter.chapter_number}
                  </span>
                  <span className="text-on-surface-variant truncate max-w-[40ch]">
                    {c.chapter.title || '(tanpa judul)'}
                  </span>
                  <span className="ml-auto text-on-surface-variant font-medium">
                    {c.value}
                  </span>
                </div>
              )
            })()
          : (
            <span className="text-on-surface-variant/60 italic">
              Hover atau fokus cell untuk detail. Klik / Enter untuk navigasi ke bab.
            </span>
          )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2 border-t border-outline-variant/15">
        {legend.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-[11px] text-on-surface-variant/80 font-medium">
              {l.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 ml-auto text-[11px] text-on-surface-variant/70">
          <span>⚡ Dopamine</span>
          <span>💔 False Resolution</span>
          <span>🔒 Locked</span>
        </div>
      </div>
    </div>
  )
}
