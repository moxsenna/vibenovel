import React, { useState } from 'react'
import type { GenesisMode } from '../../types/project'
import { ImportWizard } from '../onboarding/ImportWizard'

interface ProjectCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (
    title: string,
    genre: string,
    targetChapters: number,
    wordCount: number,
    mode: GenesisMode
  ) => void
}

const GENRES = ['Drama Rumah Tangga', 'Romance Office', 'Fantasi Kerajaan', 'Thriller Misteri']

export const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Drama Rumah Tangga')
  const [targetChapters, setTargetChapters] = useState(200)
  const [wordCount, setWordCount] = useState(1500)
  const [importWizardOpen, setImportWizardOpen] = useState(false)

  if (!isOpen) return null

  const handleCreate = (mode: GenesisMode) => {
    if (mode === 'IMPORTED') {
      // The wizard handles project creation itself (with extracted data).
      setImportWizardOpen(true)
      return
    }
    if (!title.trim()) return
    onCreate(title, genre, targetChapters, wordCount, mode)
    setTitle('')
  }

  const handleWizardClose = () => {
    setImportWizardOpen(false)
    // Close the parent modal too — the wizard navigates to the new project
    // on completion, so leaving this open would be confusing.
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-surface-container-high rounded-[20px] w-full max-w-[500px] p-8 shadow-2xl relative inner-glow border border-outline-variant/30">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest border border-outline-variant absolute top-6 right-6 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
          </button>

          <h3 className="text-headline-md text-on-surface mb-6">Buat Proyek Baru</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                Judul Novel
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Suami Bayaran Terbaik"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder-outline text-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
              <p className="mt-1 text-[10px] text-on-surface-variant/60 italic">
                💡 Untuk import naskah, judul akan auto-detect dari teks — boleh dilewati.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary-container text-body-sm cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Target Bab
                </label>
                <input
                  type="number"
                  value={targetChapters}
                  onChange={(e) => setTargetChapters(parseInt(e.target.value) || 200)}
                  className="w-full h-11 px-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary-container text-body-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                Kata per Bab
              </label>
              <select
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value) || 1500)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary-container text-body-sm cursor-pointer"
              >
                <option value={1000}>1000 kata (Pacing Cepat)</option>
                <option value={1500}>1500 kata (KBM Sweet Spot)</option>
                <option value={2000}>2000 kata (Buku Komersial)</option>
                <option value={3000}>3000 kata (Panjang & Mendalam)</option>
              </select>
            </div>

            <div className="border-t border-outline-variant/50 my-6 pt-5">
              <span className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-3">
                Bagaimana Anda ingin memulai?
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCreate('FRESH_BRAINSTORM')}
                  className="p-4 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary-container hover:bg-surface-container-high cursor-pointer text-left transition-all flex flex-col gap-2 glow-hover"
                >
                  <span className="text-2xl">🌱</span>
                  <span className="text-body-sm font-bold text-on-surface">Mulai Dari Nol</span>
                  <span className="text-label-md text-on-surface-variant">
                    Brainstorm dulu dengan AI Co-Author.
                  </span>
                </button>
                <button
                  onClick={() => handleCreate('IMPORTED')}
                  className="p-4 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary-container hover:bg-surface-container-high cursor-pointer text-left transition-all flex flex-col gap-2 glow-hover"
                >
                  <span className="text-2xl">📖</span>
                  <span className="text-body-sm font-bold text-on-surface">Lanjut Cerita Saya</span>
                  <span className="text-label-md text-on-surface-variant">
                    Import naskah yang sudah ada.
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportWizard isOpen={importWizardOpen} onClose={handleWizardClose} />
    </>
  )
}
