import React, { useState } from 'react'
import type { GenesisMode } from '../../types/project'
import { ImportWizard } from '../onboarding/ImportWizard'
import { BlueprintSelector } from '../onboarding/BlueprintSelector'
import {
  GENRE_BLUEPRINTS,
  type GenreBlueprint,
  getAllGenreNames
} from '../../lib/genre-blueprints'

export interface BlueprintSelection {
  blueprint: GenreBlueprint
  customNames: Record<string, string>
}

interface ProjectCreationModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Sprint 9: extended to optionally pass `blueprintSelection`. Lobby uses
   * this to invoke `applyBlueprint` after the project is created.
   */
  onCreate: (
    title: string,
    genre: string,
    targetChapters: number,
    wordCount: number,
    mode: GenesisMode,
    blueprintSelection?: BlueprintSelection
  ) => void
}

const FALLBACK_GENRES = GENRE_BLUEPRINTS.map((b) => b.name)

export const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState(FALLBACK_GENRES[0] ?? 'Drama Rumah Tangga')
  const [targetChapters, setTargetChapters] = useState(200)
  const [wordCount, setWordCount] = useState(1500)
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [blueprintSelectorOpen, setBlueprintSelectorOpen] = useState(false)

  if (!isOpen) return null

  const allGenres = getAllGenreNames([])

  const handleCreateBrainstorm = () => {
    if (!title.trim()) return
    onCreate(title, genre, targetChapters, wordCount, 'FRESH_BRAINSTORM')
    setTitle('')
  }

  const handleOpenImport = () => {
    setImportWizardOpen(true)
  }

  const handleOpenBlueprint = () => {
    setBlueprintSelectorOpen(true)
  }

  const handleBlueprintConfirmed = (
    blueprint: GenreBlueprint,
    customNames: Record<string, string>
  ) => {
    setBlueprintSelectorOpen(false)
    // Auto-fill title kalau kosong → "Novel Drama Rumah Tangga Baru"
    const finalTitle = title.trim() || `Novel ${blueprint.name} Baru`
    // Auto-pick suggested chapter count + word count from blueprint
    const finalChapters = Math.max(blueprint.suggested_chapters_min, targetChapters)
    const finalWords = blueprint.suggested_word_count
    const finalGenre = blueprint.name
    onCreate(finalTitle, finalGenre, finalChapters, finalWords, 'FRESH_BLUEPRINT', {
      blueprint,
      customNames
    })
    setTitle('')
  }

  const handleWizardClose = () => {
    setImportWizardOpen(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-surface-container-high rounded-[20px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative inner-glow border border-outline-variant/30">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest border border-outline-variant absolute top-6 right-6 cursor-pointer transition-colors"
            aria-label="Tutup"
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
                💡 Untuk import naskah & blueprint, judul akan auto-detect — boleh dilewati.
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
                  {allGenres.map((g) => (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleCreateBrainstorm}
                  className="p-4 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary-container hover:bg-surface-container-high cursor-pointer text-left transition-all flex flex-col gap-2 glow-hover"
                >
                  <span className="text-2xl">🌱</span>
                  <span className="text-body-sm font-bold text-on-surface">Mulai Dari Nol</span>
                  <span className="text-label-md text-on-surface-variant">
                    Rapikan ide dulu dengan AI Co-Author.
                  </span>
                </button>
                <button
                  onClick={handleOpenBlueprint}
                  className="p-4 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary-container hover:bg-surface-container-high cursor-pointer text-left transition-all flex flex-col gap-2 glow-hover relative"
                >
                  <span className="text-2xl">🎨</span>
                  <span className="text-body-sm font-bold text-on-surface">Pakai Blueprint</span>
                  <span className="text-label-md text-on-surface-variant">
                    6 template genre siap pakai.
                  </span>
                  <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                    NEW
                  </span>
                </button>
                <button
                  onClick={handleOpenImport}
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
      <BlueprintSelector
        isOpen={blueprintSelectorOpen}
        onClose={() => setBlueprintSelectorOpen(false)}
        onSelect={handleBlueprintConfirmed}
      />
    </>
  )
}
