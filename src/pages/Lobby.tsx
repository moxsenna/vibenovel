import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProjectStore } from '../store/useProjectStore'
import { useUiStore } from '../store/useUiStore'
import { ProjectCard, NewProjectCard, ArchiveCard } from '../components/dashboard/ProjectCard'
import { StatsBar } from '../components/dashboard/StatsBar'
import { ProjectCreationModal } from '../components/dashboard/ProjectCreationModal'
import { SettingsModal } from '../components/modals/SettingsModal'
import { BottomNavBar } from '../components/ui/BottomNavBar'
import type { Project, GenesisMode } from '../types/project'

export const Lobby: React.FC = () => {
  const navigate = useNavigate()
  const { projects, createProject, setActiveProject, loadProjects, deleteProject } = useProjectStore()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('Semua')
  const [sortBy, setSortBy] = useState('Terbaru')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => { loadProjects() }, [loadProjects])

  // Stats
  const totalProjects = projects.length
  const totalChaptersWritten = projects.reduce((a, p) => a + (p.status === 'COMPLETED' ? p.target_chapters : 30), 0)
  const activeCount = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'PAUSED').length
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length

  // Filter & Sort
  const activeProjects = projects
    .filter((p) => p.status !== 'COMPLETED')
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => genreFilter === 'Semua' || p.genre === genreFilter)
    .sort((a, b) => {
      if (sortBy === 'Terbaru') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      if (sortBy === 'Judul') return a.title.localeCompare(b.title)
      return 0
    })

  const archivedProjects = projects.filter((p) => p.status === 'COMPLETED')

  const handleOpen = (project: Project) => {
    setActiveProject(project)
    navigate(`/project/${project.id}`)
  }

  const handleCreate = async (title: string, genre: string, targetChapters: number, wordCount: number, mode: GenesisMode) => {
    try {
      const created = await createProject(title, genre, targetChapters, wordCount, mode)
      setIsCreateModalOpen(false)
      setActiveProject(created)
      navigate(`/project/${created.id}`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus proyek ini?')) deleteProject(id)
  }

  // Mock project-specific data
  const getProjectMeta = (p: Project) => {
    const isIstri = p.title.includes('Istri Sah')
    const isCeo = p.title.includes('CEO')
    return {
      outlineProgress: isIstri ? 80 : isCeo ? 35 : 0,
      proseProgress: isIstri ? 47 : isCeo ? 21 : 0,
      chaptersWritten: isIstri ? 94 : isCeo ? 32 : 0,
      wordCount: isIstri ? 141000 : isCeo ? 48000 : 0,
      currentActivity: isIstri ? 'Menulis — Bab 95' : isCeo ? 'Bikin Outline — Bab 33' : 'Setup',
      lastActivity: isIstri ? '15 menit lalu' : isCeo ? '2 jam lalu' : ''
    }
  }

  // Animation variants
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const gridItemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* === Top NavBar (Fixed) === */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_0_15px_rgba(232,160,191,0.15)] flex justify-between items-center px-5 md:px-16 py-4 h-16">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary text-2xl fill" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
          <span className="text-display-md bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">VibeNovel</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-high"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
          <button
            onClick={toggleTheme}
            className="text-secondary hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-high"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button className="text-primary hover:opacity-80 transition-opacity relative p-2 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden cursor-pointer hover:scale-95 transition-transform duration-200 shadow-[0_0_10px_rgba(232,160,191,0.2)]">
            <img
              alt="User avatar"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80"
            />
          </div>
        </div>
      </nav>

      {/* === Main Content === */}
      <main className="pt-24 pb-32 px-5 md:px-16 max-w-[1440px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-display-lg text-on-background mb-2">Selamat malam, Bima ✨</h1>
          <p className="text-body-lg text-on-surface-variant">Novel Istri Sah menunggu kelanjutannya! ✦</p>
        </header>

        {/* Stats */}
        <StatsBar stats={[
          { label: 'Total', value: `${totalProjects} Novel`, emoji: '📚' },
          { label: 'Produktivitas', value: `${totalChaptersWritten} Bab Selesai`, emoji: '✍️' },
          { label: 'Aktif', value: `${activeCount} Sedang Ditulis`, emoji: '📝' },
          { label: 'Pencapaian', value: `${completedCount} Tamat`, emoji: '⭐' }
        ]} />

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full py-3 pl-12 pr-4 text-on-background text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all placeholder:text-outline inner-glow"
              placeholder="Cari novel..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-surface-container-highest inner-glow px-6 py-2 rounded-full text-label-lg text-on-background border-none cursor-pointer focus:outline-none"
            >
              <option value="Semua">Semua</option>
              <option value="Drama Rumah Tangga">Drama RT</option>
              <option value="Romance Office">Romance</option>
              <option value="Fantasi Kerajaan">Fantasi</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-highest inner-glow px-6 py-2 rounded-full text-label-lg text-on-background border-none cursor-pointer focus:outline-none"
            >
              <option value="Terbaru">Terbaru</option>
              <option value="Judul">Judul</option>
            </select>
          </div>
        </div>

        {/* Section: Sedang Dikerjakan */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-headline-lg text-primary font-bold">📖 Sedang Dikerjakan</h2>
            <div className="flex-grow h-[1px] bg-gradient-to-r from-outline-variant/50 to-transparent" />
          </div>

          <motion.div
            variants={gridContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {activeProjects.map((project) => {
              const meta = getProjectMeta(project)
              return (
                <motion.div key={project.id} variants={gridItemVariants}>
                  <ProjectCard
                    id={project.id}
                    title={project.title}
                    genre={project.genre || 'Drama'}
                    status={project.status}
                    targetChapters={project.target_chapters}
                    outlineProgress={meta.outlineProgress}
                    proseProgress={meta.proseProgress}
                    chaptersWritten={meta.chaptersWritten}
                    wordCount={meta.wordCount}
                    currentActivity={meta.currentActivity}
                    lastActivity={meta.lastActivity}
                    onOpen={() => handleOpen(project)}
                    onDelete={() => handleDelete(project.id)}
                  />
                </motion.div>
              )
            })}
            <motion.div variants={gridItemVariants}>
              <NewProjectCard onClick={() => setIsCreateModalOpen(true)} />
            </motion.div>
          </motion.div>
        </section>


        {/* Section: Arsip */}
        {archivedProjects.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-headline-lg text-secondary">📦 Arsip</h2>
              <div className="flex-grow h-[1px] bg-gradient-to-r from-outline-variant/50 to-transparent" />
              <button className="text-primary text-label-lg hover:underline flex items-center gap-1">
                Lihat Semua
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 opacity-80">
              {archivedProjects.map((p) => (
                <ArchiveCard key={p.id} title={p.title} totalChapters={p.target_chapters} />
              ))}
            </div>
          </section>
        )}

        {/* Placeholder Arsip for demo */}
        {archivedProjects.length === 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-headline-lg text-secondary">📦 Arsip</h2>
              <div className="flex-grow h-[1px] bg-gradient-to-r from-outline-variant/50 to-transparent" />
              <button className="text-primary text-label-lg hover:underline flex items-center gap-1">
                Lihat Semua
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 opacity-80">
              <ArchiveCard title="Cinta di Bawah Hujan" totalChapters={120} />
              <ArchiveCard title="Melodi Senja" totalChapters={85} />
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav (Mobile) */}
      <BottomNavBar activePage="home" onNavigate={(page) => page === 'write' && navigate('/project/d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')} />

      {/* Modals */}
      <ProjectCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
