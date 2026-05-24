import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import type { Chapter } from '../../types/project'

const STATUS_COLORS: Record<Chapter['status'], string> = {
  OUTLINE_ONLY: '#94a3b8',
  GENERATING: '#fbbf24',
  DRAFT: '#60a5fa',
  FINAL: '#34d399',
  IMPORTED: '#a855f7'
}

interface ChartRow {
  chapter_number: number
  title: string
  status: Chapter['status']
  word_count: number
  cumulative: number
  target: number
  delta_pct: number | null
  chapter_id: string
}

interface ChartTooltipPayload {
  payload: ChartRow
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  return (
    <div className="bg-surface-container-high border border-outline-variant/40 rounded-lg shadow-lg px-3 py-2 text-body-sm">
      <div className="font-bold text-on-surface">
        Bab {row.chapter_number}
        <span className="text-on-surface-variant/70 font-normal"> — {row.title || '(tanpa judul)'}</span>
      </div>
      <div className="text-on-surface-variant mt-1">
        {row.word_count.toLocaleString()} kata
        <span className="text-on-surface-variant/60"> (target {row.target.toLocaleString()})</span>
        {row.delta_pct !== null && (
          <span
            className={`ml-2 font-bold ${
              row.delta_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {row.delta_pct >= 0 ? '+' : ''}
            {row.delta_pct.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="text-on-surface-variant/70 text-[11px] mt-1">
        Status: {row.status} • Cumulative: {row.cumulative.toLocaleString()} kata
      </div>
    </div>
  )
}

export const WordCountAnalytics: React.FC = () => {
  const chapters = useProjectStore((s) => s.chapters)
  const project = useProjectStore((s) => s.activeProject)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const setMode = useUiStore((s) => s.setMode)

  const target = project?.word_count_target ?? 0

  const data: ChartRow[] = useMemo(() => {
    const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)
    return sorted.reduce<ChartRow[]>((acc, ch) => {
      const wc = ch.word_count || 0
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
      const delta_pct = target > 0 && wc > 0 ? ((wc - target) / target) * 100 : null
      acc.push({
        chapter_number: ch.chapter_number,
        title: ch.title || '',
        status: ch.status,
        word_count: wc,
        cumulative: prev + wc,
        target,
        delta_pct,
        chapter_id: ch.id
      })
      return acc
    }, [])
  }, [chapters, target])

  const stats = useMemo(() => {
    const writtenChapters = data.filter((d) => d.word_count > 0)
    const total = data.reduce((s, d) => s + d.word_count, 0)
    const avg = writtenChapters.length > 0 ? total / writtenChapters.length : 0
    const aboveTarget = target > 0 ? writtenChapters.filter((d) => d.word_count >= target).length : 0
    const belowTarget = writtenChapters.length - aboveTarget
    return { total, avg, aboveTarget, belowTarget, written: writtenChapters.length }
  }, [data, target])

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/70">
        Belum ada bab dengan prosa untuk dianalisis.
      </div>
    )
  }

  const hasProse = data.some((d) => d.word_count > 0)
  if (!hasProse) {
    return (
      <div className="text-center py-8 text-on-surface-variant/70">
        Bab sudah ada, tapi belum ada prosa. Mulai menulis dulu untuk melihat distribusi kata.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Total Kata" value={stats.total.toLocaleString()} />
        <StatCard label="Rata-rata / bab" value={stats.avg > 0 ? Math.round(stats.avg).toLocaleString() : '—'} />
        <StatCard
          label="≥ Target"
          value={`${stats.aboveTarget}/${stats.written}`}
          accent="emerald"
        />
        <StatCard
          label="< Target"
          value={`${stats.belowTarget}/${stats.written}`}
          accent="rose"
        />
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
            onClick={(payload: unknown) => {
              const data = payload as
                | { activePayload?: Array<{ payload: ChartRow }> }
                | undefined
              const item = data?.activePayload?.[0]?.payload
              if (item) {
                setActiveChapter(item.chapter_number)
                setMode('write')
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
            <XAxis
              dataKey="chapter_number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              stroke="#64748b"
              label={{ value: 'Bab', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              stroke="#64748b"
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              stroke="#64748b"
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />

            {target > 0 && (
              <ReferenceLine
                yAxisId="left"
                y={target}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                label={{ value: `Target ${target.toLocaleString()}`, position: 'right', fill: '#fbbf24', fontSize: 10 }}
              />
            )}

            <Bar yAxisId="left" dataKey="word_count" name="Kata per bab" cursor="pointer">
              {data.map((row) => (
                <Cell key={row.chapter_id} fill={STATUS_COLORS[row.status]} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Total kumulatif"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant/80">
        {(Object.keys(STATUS_COLORS) as Chapter['status'][]).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: STATUS_COLORS[k] }}
            />
            <span>{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: string; accent?: 'emerald' | 'rose' }> = ({
  label,
  value,
  accent
}) => (
  <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2.5">
    <div className="text-[10px] uppercase tracking-wide text-on-surface-variant/60 font-bold">
      {label}
    </div>
    <div
      className={`text-title-md font-bold mt-0.5 ${
        accent === 'emerald'
          ? 'text-emerald-400'
          : accent === 'rose'
          ? 'text-rose-400'
          : 'text-on-surface'
      }`}
    >
      {value}
    </div>
  </div>
)
