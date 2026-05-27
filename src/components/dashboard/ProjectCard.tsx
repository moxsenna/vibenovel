import React from 'react'
import type { ProjectStatus } from '../../types/project'

interface ProjectCardProps {
  id: string
  title: string
  genre: string
  status: ProjectStatus
  targetChapters: number
  outlineProgress: number
  proseProgress: number
  chaptersWritten: number
  wordCount: number
  currentActivity: string
  lastActivity: string
  coverGradient?: string
  onOpen: () => void
  onDelete: () => void
  /** Sprint 9 — Spin-Off Clone (optional, falls back to noop if not wired). */
  onSpinOff?: () => void
  /** Sprint 9 — Adjust target chapter count (optional). */
  onAdjustTarget?: () => void
}

const STATUS_CONFIG: Record<ProjectStatus, { dot: string; label: string }> = {
  BRAINSTORMING: { dot: 'bg-blue-400', label: 'Ide Cerita' },
  OUTLINING: { dot: 'bg-yellow-500', label: 'Rencana Bab' },
  WRITING: { dot: 'bg-emerald-400', label: 'Naskah' },
  PAUSED: { dot: 'bg-orange-400', label: 'Dijeda' },
  COMPLETED: { dot: 'bg-secondary', label: 'Tamat' }
}

const GENRE_GRADIENTS: Record<string, string> = {
  'Drama Rumah Tangga': 'from-primary-container to-on-tertiary-container',
  'Romance Office': 'from-[#dfaf7e]/40 to-[#472a03]/60',
  'Fantasi Kerajaan': 'from-tertiary-container/40 to-on-tertiary/60',
  'Thriller Misteri': 'from-surface-bright to-surface-container-lowest'
}

const GENRE_EMOJIS: Record<string, string> = {
  'Drama Rumah Tangga': '💕',
  'Romance Office': '💼',
  'Fantasi Kerajaan': '🏰',
  'Thriller Misteri': '🔍'
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  genre,
  status,
  targetChapters,
  outlineProgress,
  proseProgress,
  chaptersWritten,
  wordCount,
  currentActivity,
  lastActivity,
  onOpen,
  onDelete,
  onSpinOff,
  onAdjustTarget
}) => {
  const statusCfg = STATUS_CONFIG[status]
  const gradient = GENRE_GRADIENTS[genre] || GENRE_GRADIENTS['Drama Rumah Tangga']
  const emoji = GENRE_EMOJIS[genre] || '📖'
  const isActive = status === 'WRITING'
  const [menuOpen, setMenuOpen] = React.useState(false)

  const wordCountFormatted = wordCount >= 1000
    ? `~${Math.round(wordCount / 1000)}rb kata`
    : `${wordCount} kata`

  return (
    <article
      onClick={onOpen}
      className={`bg-surface-container rounded-[20px] overflow-hidden inner-glow transition-all duration-300 group flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer ${
        isActive
          ? 'border border-primary-container/30 hover-glow'
          : 'border border-outline-variant/20 opacity-80 hover:opacity-100 hover:translate-y-[-4px]'
      }`}
    >
      {/* Cover Gradient Header */}
      <div className={`h-48 bg-gradient-to-br ${gradient} relative p-5 flex flex-col justify-end`}>
        {!isActive && <div className="absolute inset-0 bg-black/10" />}
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-surface/50 backdrop-blur-md rounded-full text-label-md text-on-surface-variant mb-2">
            {emoji} {genre}
          </span>
          <h3 className="text-headline-md text-white leading-tight">
            {title}
          </h3>
        </div>
        {/* Menu Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface/40 backdrop-blur-md hover:bg-surface/60 text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-high border border-outline-variant shadow-xl py-1 z-30">
              {onAdjustTarget && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdjustTarget()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
                  data-tour-step="adjust-target"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Ubah Target Bab
                </button>
              )}
              {onSpinOff && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSpinOff()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
                  data-tour-step="spin-off"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  🪞 Spin-Off Clone
                </button>
              )}
              <div className="my-1 border-t border-outline-variant/30" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setMenuOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-body-sm text-error hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Hapus Proyek
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-grow flex flex-col">
        {/* Dual Progress Bars */}
        <div className="mb-3">
          <div className="flex justify-between text-label-md text-on-surface-variant mb-1">
            <span>Rencana</span>
            <span>{outlineProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${outlineProgress}%` }}
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-label-md text-on-surface-variant mb-1">
            <span>Ditulis</span>
            <span>{proseProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${proseProgress}%` }}
            />
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant mb-4">
          {chaptersWritten} / {targetChapters} bab · {wordCountFormatted}
        </p>

        {/* Footer */}
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full text-label-md text-on-surface border border-outline-variant/30">
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {currentActivity}
            </div>
            {lastActivity && (
              <span className="text-label-md text-on-surface-variant/60 uppercase tracking-tighter">
                {lastActivity}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            className={`w-full py-3 rounded-[12px] text-label-lg transition-opacity flex justify-center items-center gap-2 shadow-lg border-t border-white/20 ${
              isActive
                ? 'bg-gradient-to-r from-primary-container to-inverse-primary text-white hover:opacity-90'
                : 'bg-gradient-to-r from-secondary-container to-on-secondary text-on-surface-variant hover:opacity-90'
            }`}
          >
            Lanjutkan Naskah
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </article>
  )
}

/* ===== New Project Card ===== */
export const NewProjectCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    data-tour-step="new-project"
    className="bg-surface-container/50 rounded-[20px] border-2 border-dashed border-primary-container/40 p-5 flex flex-col items-center justify-center gap-4 hover:bg-surface-container hover:border-primary-container transition-all duration-300 min-h-[350px] group cursor-pointer inner-glow shadow-[0_0_20px_rgba(255,220,188,0.15)]"
  >
    <span className="text-5xl group-hover:scale-110 transition-transform duration-300">✨</span>
    <span className="text-headline-md text-primary-fixed-dim">Mulai Novel Baru</span>
    <span className="text-body-sm text-on-surface-variant/80 mt-1">✦ Tuangkan ide ceritamu ✦</span>
    <span className="text-body-sm text-on-surface-variant text-center px-4">
      Tuangkan ide ceritamu ke dalam kanvas kosong.
    </span>
  </button>
)

/* ===== Archive Card ===== */
interface ArchiveCardProps {
  title: string
  totalChapters: number
}

export const ArchiveCard: React.FC<ArchiveCardProps> = ({ title, totalChapters }) => (
  <article className="bg-surface-container rounded-[20px] p-4 inner-glow flex flex-col gap-2 border border-outline-variant/20 hover:opacity-100 transition-opacity cursor-pointer">
    <div className="flex justify-between items-start">
      <span className="text-label-md text-on-secondary bg-secondary px-2 py-0.5 rounded text-xs font-bold">
        Tamat!
      </span>
      <span className="text-xl">⭐</span>
    </div>
    <h4 className="text-headline-md text-on-surface text-lg leading-snug mt-2">{title}</h4>
    <p className="text-body-sm text-on-surface-variant text-xs">{totalChapters} bab selesai</p>
    <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-auto">
      <div
        className="h-full w-full rounded-full shadow-[0_0_5px_rgba(239,189,138,0.5)]"
        style={{ backgroundColor: '#D4A574' }}
      />
    </div>
  </article>
)
