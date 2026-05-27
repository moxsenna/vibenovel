import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import type { ChapterVersion, Chapter } from '../../types/project'

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  chapter: Chapter
  onRestore: (version: ChapterVersion) => void | Promise<void>
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  chapter,
  onRestore
}) => {
  const { fetchChapterVersions } = useProjectStore()
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [loadedChapterId, setLoadedChapterId] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    fetchChapterVersions(chapter.id).then((v) => {
      if (cancelled) return
      setVersions(v)
      setSelectedVersion(null)
      setLoadedChapterId(chapter.id)
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, chapter.id, fetchChapterVersions])

  if (!isOpen) return null
  const loading = loadedChapterId !== chapter.id
  const selected =
    selectedVersion && versions.some((version) => version.id === selectedVersion.id)
      ? selectedVersion
      : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[85vh] h-[600px] bg-surface-primary rounded-2xl shadow-xl flex flex-col overflow-hidden border border-border-subtle"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-container-low shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Riwayat Cloud (Snapshot)
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Pilih versi lama untuk dipulihkan. Snapshot tersimpan otomatis setiap 15 menit atau sebelum AI mengedit secara destruktif.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Version List */}
          <div className="w-64 shrink-0 border-r border-border-subtle flex flex-col bg-surface-container-lowest overflow-y-auto custom-scrollbar p-2 gap-1">
            {loading ? (
              <div className="p-4 text-center text-text-muted text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                Memuat riwayat...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                Belum ada snapshot yang tersimpan di cloud.
              </div>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition-colors cursor-pointer shrink-0 ${
                    selected?.id === v.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-surface-hover border border-transparent'
                  }`}
                >
                  <span className="text-[11px] font-bold text-primary mb-1 uppercase tracking-wider">
                    {v.created_at ? new Date(v.created_at).toLocaleString('id-ID', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric'
                    }) : 'Waktu tidak diketahui'}
                  </span>
                  <span className="text-sm text-text-main font-semibold line-clamp-1">
                    {v.change_summary}
                  </span>
                  <span className="text-[10px] text-text-muted mt-1 font-mono">
                    {v.word_count} kata
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Right: Preview & Restore */}
          <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden min-w-0">
            {selected ? (
              <>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-text-main font-serif leading-relaxed whitespace-pre-wrap">
                    {selected.prose || <em className="text-text-muted">Kanvas kosong</em>}
                  </div>
                </div>
                <div className="p-4 border-t border-border-subtle bg-surface-container-low flex justify-end gap-3 shrink-0">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer border border-border-subtle"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Apakah Anda yakin ingin mengganti teks saat ini dengan versi riwayat ini? Anda bisa menekan Undo (Ctrl+Z) setelahnya jika berubah pikiran.')) {
                        await onRestore(selected)
                        onClose()
                      }
                    }}
                    className="px-4 py-2 text-sm font-bold bg-primary text-bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow shadow-primary/20 cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span>
                    Pulihkan Versi Ini
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center gap-3">
                <span className="material-symbols-outlined text-4xl opacity-50">history</span>
                <p>Pilih salah satu snapshot dari daftar di sebelah kiri untuk melihat isinya.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
