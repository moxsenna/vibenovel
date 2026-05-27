import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProjectStore } from '../store/useProjectStore'
import { useUiStore } from '../store/useUiStore'
import { ProjectCard, NewProjectCard, ArchiveCard } from '../components/dashboard/ProjectCard'
import { StatsBar } from '../components/dashboard/StatsBar'
import { ProjectCreationModal } from '../components/dashboard/ProjectCreationModal'
import type { BlueprintSelection } from '../components/dashboard/ProjectCreationModal'
import { SettingsModal } from '../components/modals/SettingsModal'
import { TargetChaptersAdjustmentModal } from '../components/modals/TargetChaptersAdjustmentModal'
import { OnboardingTour } from '../components/onboarding/OnboardingTour'
import { HOME_ONBOARDING_STEPS } from '../components/onboarding/onboarding-steps'
import { BottomNavBar } from '../components/ui/BottomNavBar'
import { SkipLink } from '../components/ui/SkipLink'
import type { Project, GenesisMode, Chapter } from '../types/project'
import { applyBlueprint } from '../services/blueprint-applier'
import { cloneProjectAsSpinOff, getNextSpinOffName } from '../services/project-cloner'
import { getAllGenreNames } from '../lib/genre-blueprints'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const Lobby: React.FC = () => {
  const navigate = useNavigate()
  const { projects, createProject, setActiveProject, loadProjects, deleteProject, activeProject, chapters: activeChapterList } = useProjectStore()
  type DashboardChapter = Pick<Chapter, 'project_id' | 'status' | 'word_count' | 'chapter_number'>
  const [allChapters, setAllChapters] = useState<DashboardChapter[]>([])
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const setMode = useUiStore((s) => s.setMode)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const setContextPanelOpen = useUiStore((s) => s.setContextPanelOpen)

  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('Semua')
  const [sortBy, setSortBy] = useState('Terbaru')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [adjustTargetProject, setAdjustTargetProject] = useState<Project | null>(null)
  const [cloningProjectId, setCloningProjectId] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()

    // Fetch all chapters of this user for real-time stats compiled in Lobby
    const fetchChaptersStats = async () => {
      if (!isSupabaseConfigured()) return
      try {
        const { data } = await supabase
          .from('chapters')
          .select('project_id, status, word_count, chapter_number')
        setAllChapters((data ?? []) as DashboardChapter[])
      } catch (err) {
        console.warn('Error fetching dynamic stats from Supabase:', err)
      }
    }
    fetchChaptersStats()
  }, [loadProjects])

  // Stats
  const totalProjects = projects.length

  const totalChaptersWritten = isSupabaseConfigured() && allChapters.length > 0
    ? allChapters.filter((ch) => ch.status === 'DRAFT' || ch.status === 'FINAL' || ch.status === 'IMPORTED').length
    : activeChapterList.filter((ch) => ch.status === 'DRAFT' || ch.status === 'FINAL' || ch.status === 'IMPORTED').length

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
    setMode('write')
    setActiveChapter(1)
    setContextPanelOpen(false)
    navigate(`/project/${project.id}`)
  }

  const handleCreate = async (
    title: string,
    genre: string,
    targetChapters: number,
    wordCount: number,
    mode: GenesisMode,
    blueprintSelection?: BlueprintSelection
  ) => {
    try {
      const created = await createProject(title, genre, targetChapters, wordCount, mode)
      // Sprint 9: kalau user pilih blueprint, apply lorebook dari template.
      if (mode === 'FRESH_BLUEPRINT' && blueprintSelection) {
        try {
          await applyBlueprint(
            created,
            blueprintSelection.blueprint,
            blueprintSelection.customNames
          )
        } catch (err) {
          console.error('Blueprint apply failed:', err)
          addToast('Proyek dibuat, tapi blueprint gagal dipakai. Bisa diisi manual via Ide Cerita.', 'warning')
        }
      }
      setIsCreateModalOpen(false)
      setActiveProject(created)
      setActiveChapter(1)
      if (mode === 'FRESH_BRAINSTORM') {
        setMode('brainstorm')
        setContextPanelOpen(true)
      } else if (mode === 'FRESH_BLUEPRINT') {
        setMode('outline')
        setContextPanelOpen(true)
      } else {
        setMode('write')
        setContextPanelOpen(false)
      }
      navigate(`/project/${created.id}`)
    } catch (e) {
      console.error(e)
    }
  }

  const showConfirm = useUiStore((s) => s.showConfirm)
  const addToast = useUiStore((s) => s.addToast)

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Hapus Proyek?',
      message: 'Apakah Anda yakin ingin menghapus proyek ini? Seluruh data bab, outline, dan lorebook di dalamnya akan dihapus secara permanen.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      severity: 'danger',
      onConfirm: () => deleteProject(id)
    })
  }

  const handleSpinOff = (project: Project) => {
    const suggested = getNextSpinOffName(project.title, projects)
    showConfirm({
      title: '🪞 Buat Spin-Off Clone?',
      message: `Akan dibuat proyek baru "${suggested}" dengan dunia, tokoh, dan lore yang sama. Tidak ada bab yang ikut di-copy — fresh canvas untuk cerita baru.`,
      confirmText: 'Ya, Clone',
      cancelText: 'Batal',
      severity: 'info',
      onConfirm: async () => {
        if (cloningProjectId) return
        setCloningProjectId(project.id)
        try {
          const created = await cloneProjectAsSpinOff(project.id, suggested)
          addToast(`Spin-Off "${created.title}" berhasil dibuat.`, 'success')
          setActiveProject(created)
          navigate(`/project/${created.id}`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          addToast(`Gagal Spin-Off: ${msg}`, 'error')
        } finally {
          setCloningProjectId(null)
        }
      }
    })
  }

  const handleAdjustTarget = (project: Project) => {
    setAdjustTargetProject(project)
  }

  // Dynamically compile stats per project
  const getProjectMeta = (p: Project) => {
    // Filter chapters for this specific project
    const projChapters = isSupabaseConfigured() && allChapters.length > 0
      ? allChapters.filter((ch) => ch.project_id === p.id)
      : (p.id === activeProject?.id ? activeChapterList : [])

    const chaptersWritten = projChapters.filter(
      (ch) => ch.status === 'DRAFT' || ch.status === 'FINAL' || ch.status === 'IMPORTED'
    ).length

    const wordCount = projChapters.reduce((acc, ch) => acc + (ch.word_count || 0), 0)

    const outlineProgress = p.target_chapters > 0
      ? Math.round(Math.min(100, (projChapters.length / p.target_chapters) * 100))
      : 0

    const proseProgress = p.target_chapters > 0
      ? Math.round(Math.min(100, (chaptersWritten / p.target_chapters) * 100))
      : 0

    // Get current activity
    let currentActivity = 'Setup'
    if (p.status === 'COMPLETED') {
      currentActivity = 'Tamat'
    } else if (projChapters.length > 0) {
      // Find the first chapter that isn't FINAL or outline only, or fallback to last chapter
      const activeCh = [...projChapters]
        .sort((a, b) => a.chapter_number - b.chapter_number)
        .find((ch) => ch.status !== 'FINAL') || projChapters[projChapters.length - 1]
      if (activeCh) {
        const modeLabel = activeCh.status === 'OUTLINE_ONLY' ? 'Rencana' : 'Naskah'
        currentActivity = `${modeLabel} — Bab ${activeCh.chapter_number}`
      }
    }

    // Last activity (relative)
    let lastActivity = ''
    if (p.updated_at) {
      const diffMs = new Date().getTime() - new Date(p.updated_at).getTime()
      const diffMin = Math.floor(diffMs / 60000)
      const diffHrs = Math.floor(diffMin / 60)
      const diffDays = Math.floor(diffHrs / 24)

      if (diffMin < 1) lastActivity = 'Baru saja'
      else if (diffMin < 60) lastActivity = `${diffMin} menit lalu`
      else if (diffHrs < 24) lastActivity = `${diffHrs} jam lalu`
      else lastActivity = `${diffDays} hari lalu`
    }

    return {
      outlineProgress,
      proseProgress,
      chaptersWritten,
      wordCount,
      currentActivity,
      lastActivity
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

  const uncompletedProjects = projects.filter((p) => p.status !== 'COMPLETED')
  const latestUncompleted = uncompletedProjects.length > 0
    ? [...uncompletedProjects].sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime()
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime()
        return timeB - timeA
      })[0]
    : null

  const welcomeSubtitle =
    projects.length === 0
      ? 'Setiap mahakarya dimulai dari kalimat pertama. Mari buat novel pertama Anda! ✦'
      : !latestUncompleted
        ? 'Semua karya Anda telah selesai ditulis dengan indah. Siap merajut kisah baru berikutnya? ✦'
        : `Novel ${latestUncompleted.title} menunggu kelanjutannya! ✦`

  return (
    <div className="min-h-screen bg-background text-on-background">
      <SkipLink />
      {/* === Top NavBar (Fixed) === */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_0_15px_rgba(232,160,191,0.15)] flex justify-between items-center px-5 md:px-16 py-4 h-16">
        <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
          <img
            src={theme === 'dark' ? '/Logo11.webp' : '/Logo22.webp'}
            alt="VibeNovel Logo"
            className="h-12 w-auto object-contain transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-high"
            aria-label="Pengaturan"
            data-tour-step="settings"
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
      <main
        id="main-content"
        role="main"
        className="pt-24 pb-32 px-5 md:px-16 max-w-[1440px] mx-auto"
      >
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-display-lg text-on-background mb-2">Selamat malam, Bima ✨</h1>
          <p className="text-body-lg text-on-surface-variant">{welcomeSubtitle}</p>
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
              {getAllGenreNames(projects.map((p) => p.genre)).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
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
                    onSpinOff={() => handleSpinOff(project)}
                    onAdjustTarget={() => handleAdjustTarget(project)}
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
        {archivedProjects.length > 0 ? (
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
        ) : (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-headline-lg text-secondary">📦 Arsip</h2>
              <div className="flex-grow h-[1px] bg-gradient-to-r from-outline-variant/50 to-transparent" />
            </div>
            <div className="p-8 text-center bg-surface-container/50 rounded-[20px] border border-dashed border-outline-variant/20 opacity-70 inner-glow">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 block mb-2">archive</span>
              <p className="text-body-sm text-on-surface-variant">Belum ada novel yang tamat. Selesaikan petualangan menulis Anda untuk mengarsipkannya di sini! ✦</p>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav (Mobile) */}
      <BottomNavBar
        activePage="home"
        onNavigate={(page) => {
          if (page === 'write') {
            if (latestUncompleted) {
              handleOpen(latestUncompleted)
            } else if (projects.length > 0) {
              handleOpen(projects[0])
            } else {
              addToast('Buat novel baru terlebih dahulu untuk mulai menulis.', 'info')
            }
          }
        }}
      />

      {/* Modals */}
      <ProjectCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TargetChaptersAdjustmentModal
        isOpen={adjustTargetProject !== null}
        project={adjustTargetProject}
        onClose={() => setAdjustTargetProject(null)}
      />
      <OnboardingTour tourId="home" steps={HOME_ONBOARDING_STEPS} />
    </div>
  )
}
