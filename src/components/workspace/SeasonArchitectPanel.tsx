import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useBatchGenerator } from '../../hooks/useBatchGenerator'
import { ChapterOutlineCard } from './ChapterOutlineCard'
import { CanonProposalCard } from './CanonProposalCard'
import { isNonEmptyStoryContract } from '../../services/story-contract-validator'

export const SeasonArchitectPanel: React.FC = () => {
  const activeProject = useProjectStore((s) => s.activeProject)
  const chapters = useProjectStore((s) => s.chapters)
  const characters = useProjectStore((s) => s.characters)
  const mysteryLayers = useProjectStore((s) => s.mysteryLayers)
  const outlineGenerating = useProjectStore((s) => s.outlineGenerating)
  const outlineProgress = useProjectStore((s) => s.outlineProgress)
  const generateOutlineBatch = useProjectStore((s) => s.generateOutlineBatch)
  const abortOutlineGeneration = useProjectStore((s) => s.abortOutlineGeneration)
  const regenerateOutline = useProjectStore((s) => s.regenerateOutline)
  const canonProposals = useProjectStore((s) => s.canonProposals)
  const approveCanonProposal = useProjectStore((s) => s.approveCanonProposal)
  const rejectCanonProposal = useProjectStore((s) => s.rejectCanonProposal)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const addToast = useUiStore((s) => s.addToast)
  const showConfirm = useUiStore((s) => s.showConfirm)
  const setMode = useUiStore((s) => s.setMode)
  const geminiKeys = useSettingsStore((s) => s.geminiKeys)
  const { startBatch, isRunning: batchRunning, progress: batchProgress } = useBatchGenerator()

  // Range selector state
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(5)
  const [showRangeModal, setShowRangeModal] = useState(() => {
    const progress = useProjectStore.getState().outlineProgress
    return !!(
      progress &&
      (progress.status === 'success' ||
        progress.status === 'error' ||
        progress.status === 'cancelled')
    )
  })

  // Completed result display
  const [showResult, setShowResult] = useState(() => {
    const progress = useProjectStore.getState().outlineProgress
    return !!(
      progress &&
      (progress.status === 'success' ||
        progress.status === 'error' ||
        progress.status === 'cancelled')
    )
  })
  const [resolvingCanonProposalId, setResolvingCanonProposalId] = useState<string | null>(null)

  // Sprint 9.8 — Deep Outline settings panel
  const [showOutlineSettings, setShowOutlineSettings] = useState(false)
  const deepOutlineEnabled = useSettingsStore((s) => s.deepOutlineEnabled)
  const deepOutlineBudget = useSettingsStore((s) => s.deepOutlineBudget)
  const deepOutlineInBatch = useSettingsStore((s) => s.deepOutlineInBatch)
  const setDeepOutlineEnabled = useSettingsStore((s) => s.setDeepOutlineEnabled)
  const setDeepOutlineBudget = useSettingsStore((s) => s.setDeepOutlineBudget)
  const setDeepOutlineInBatch = useSettingsStore((s) => s.setDeepOutlineInBatch)
  const outlineBudgetPresets = [512, 1024, 2048, 4096]

  // Auto-Fix state
  const [autoFixingWarningIndex, setAutoFixingWarningIndex] = useState<number | null>(null)
  const [fixedWarningIndices, setFixedWarningIndices] = useState<number[]>([])

  // Reset fixed warnings when result modal opens/closes
  React.useEffect(() => {
    if (!showResult) {
      setFixedWarningIndices([])
    }
  }, [showResult])

  // ── Story Compass Completeness Check ───────────────────────────────────
  const compassStatus = useMemo(() => {
    if (!activeProject) return { isComplete: false, missing: [] as string[] }
    const missing: string[] = []
    if (!activeProject.title || !activeProject.genre) missing.push('Premis & Genre')
    if (!isNonEmptyStoryContract(activeProject.story_contract)) missing.push('Story Contract')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) missing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) missing.push('Antagonis')
    if (!activeProject.target_ending) missing.push('Target Ending')
    if (mysteryLayers.length === 0) missing.push('Lapisan Misteri')
    return { isComplete: missing.length === 0, missing }
  }, [activeProject, characters, mysteryLayers])

  const pendingCanonProposals = useMemo(() => {
    if (!activeProject) return []
    return canonProposals.filter(
      (proposal) => proposal.project_id === activeProject.id && proposal.status === 'PENDING'
    )
  }, [activeProject, canonProposals])

  if (!activeProject) return null

  const handleOpenGenerateModal = () => {
    // Guard: Story Compass must be complete
    if (!compassStatus.isComplete) {
      addToast(
        `Kompas cerita belum lengkap. Yang belum terisi: ${compassStatus.missing.join(', ')}. Lengkapi di Ide Cerita terlebih dahulu.`,
        'warning'
      )
      return
    }

    // Smart defaults: start from last chapter + 1
    const lastChapter = chapters.length > 0
      ? Math.max(...chapters.map((ch) => ch.chapter_number))
      : 0
    setRangeStart(lastChapter + 1)
    setRangeEnd(Math.min(lastChapter + 5, activeProject.target_chapters))
    setShowRangeModal(true)
    setShowResult(false)
  }

  const handleGenerate = async () => {
    if (geminiKeys.length === 0) {
      addToast('Belum ada Gemini API key. Masukkan key di Pengaturan terlebih dahulu.', 'error')
      return
    }
    if (rangeStart > rangeEnd) {
      addToast('Bab awal harus lebih kecil atau sama dengan bab akhir.', 'warning')
      return
    }
    if (rangeEnd > activeProject.target_chapters) {
      addToast(`Bab akhir tidak boleh melebihi target (${activeProject.target_chapters}).`, 'warning')
      return
    }

    setShowResult(false)
    try {
      const result = await generateOutlineBatch(rangeStart, rangeEnd)
      setShowResult(true)
      if (result.warnings.some((warning) => warning.includes('tertahan'))) {
        addToast('Generate tertahan karena ada proposal canon yang perlu disetujui.', 'warning')
      } else {
        addToast(`Berhasil generate outline Bab ${rangeStart} sampai ${rangeEnd}!`, 'success')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal generate outline batch.'
      addToast(`Gagal: ${msg}`, 'error')
    }
  }

  const handleAutoPilot = async () => {
    if (geminiKeys.length === 0) {
      addToast('Belum ada Gemini API key. Masukkan key di Pengaturan terlebih dahulu.', 'error')
      return
    }
    if (rangeStart > rangeEnd) {
      addToast('Bab awal harus lebih kecil atau sama dengan bab akhir.', 'warning')
      return
    }
    if (rangeEnd > activeProject.target_chapters) {
      addToast(`Bab akhir tidak boleh melebihi target (${activeProject.target_chapters}).`, 'warning')
      return
    }
    const total = rangeEnd - rangeStart + 1

    const proceedWithAutopilot = async () => {
      try {
        await startBatch({
          startChapter: rangeStart,
          endChapter: rangeEnd,
          skipExisting: true,
          safetyStopAfterErrors: 2
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Auto-Pilot gagal.'
        addToast(`Gagal: ${msg}`, 'error')
      }
    }

    if (total > 10) {
      showConfirm({
        title: 'Mulai Auto-Pilot?',
        message: `Auto-Pilot ${total} bab akan menghasilkan ribuan kata dan banyak panggilan AI. Jika Anda menggunakan OpenRouter (Claude/Deepseek) ini bisa memerlukan biaya token berbayar.`,
        confirmText: 'Ya, Jalankan',
        cancelText: 'Batal',
        severity: 'warning',
        onConfirm: proceedWithAutopilot
      })
    } else {
      await proceedWithAutopilot()
    }
  }

  const handleApproveCanonProposal = async (proposalId: string) => {
    setResolvingCanonProposalId(proposalId)
    try {
      await approveCanonProposal(proposalId)
      addToast('Proposal canon disetujui. Lorebook dan draft bab sudah disinkronkan.', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal menyetujui proposal canon.'
      addToast(`Gagal: ${msg}`, 'error')
    } finally {
      setResolvingCanonProposalId(null)
    }
  }

  const handleRejectCanonProposal = (proposalId: string) => {
    rejectCanonProposal(proposalId)
    addToast('Draft bab ditolak. Regenerate bab tersebut agar AI memakai canon yang ada.', 'warning')
  }

  const progressPercent = outlineProgress
    ? Math.round((outlineProgress.current / Math.max(outlineProgress.total, 1)) * 100)
    : 0

  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header Card ── */}
        <div className="bg-surface-container/75 p-5 rounded-[20px] border border-outline-variant/20 shadow-sm inner-glow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-headline-md text-on-surface font-bold">Rencana Bab</h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Susun alur tiap bab sebelum masuk ke naskah.
              </p>
            </div>
            <button
              onClick={handleOpenGenerateModal}
              disabled={outlineGenerating || !compassStatus.isComplete}
              title={!compassStatus.isComplete ? `Kompas cerita belum lengkap: ${compassStatus.missing.join(', ')}` : undefined}
              className="h-10 px-5 rounded-xl btn-gradient text-white font-semibold text-label-lg cursor-pointer flex items-center gap-2 hover-glow disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {outlineGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Buat Rencana Bab</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-4 text-body-sm">
            <span className="text-on-surface-variant">
              📋 <span className="font-bold text-on-surface">{chapters.length}</span> rencana
            </span>
            <span className="text-on-surface-variant">
              🎯 Target: <span className="font-bold text-on-surface">{activeProject.target_chapters}</span> bab
            </span>
            <span className="text-on-surface-variant">
              ✍ Ditulis: <span className="font-bold text-on-surface">{chapters.filter(ch => ch.prose).length}</span> bab
            </span>
          </div>
        </div>

        {/* Sprint 9.8 — Deep Outline Settings (collapsible) */}
        <div className="bg-surface-container/60 rounded-2xl border border-outline-variant/15 overflow-hidden">
          <button
            onClick={() => setShowOutlineSettings((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-surface-container-high/40"
          >
            <span className="flex items-center gap-2 text-body-sm font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Opsi Rencana Bab
              {deepOutlineEnabled && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold">
                  AI teliti
                </span>
              )}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">
              {showOutlineSettings ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          <AnimatePresence>
            {showOutlineSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-outline-variant/15"
              >
                <div className="px-4 py-3 space-y-3">
                  {/* Master toggle */}
                  <button
                    onClick={() => setDeepOutlineEnabled(!deepOutlineEnabled)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-surface-container cursor-pointer"
                  >
                    <span
                      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                        deepOutlineEnabled ? 'bg-purple-500' : 'bg-outline-variant/40'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          deepOutlineEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </span>
                    <div className="flex-1">
                      <div className="text-body-sm font-medium text-on-surface">
                        AI teliti
                      </div>
                      <div className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                        AI berpikir dulu sebelum menyusun rencana. Hasil lebih rapi, tapi sedikit lebih lama.
                      </div>
                    </div>
                  </button>

                  {deepOutlineEnabled && (
                    <>
                      <div>
                        <div className="text-[10px] text-on-surface-variant/60 mb-1 px-2 uppercase tracking-wider font-bold">
                          Budget berpikir (token)
                        </div>
                        <div className="flex gap-1 px-2">
                          {outlineBudgetPresets.map((b) => (
                            <button
                              key={b}
                              onClick={() => setDeepOutlineBudget(b)}
                              className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                                deepOutlineBudget === b
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setDeepOutlineInBatch(!deepOutlineInBatch)}
                        className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-surface-container cursor-pointer"
                      >
                        <span
                          className={`w-7 h-4 rounded-full relative transition-colors flex-shrink-0 ${
                            deepOutlineInBatch ? 'bg-amber-500' : 'bg-outline-variant/40'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                              deepOutlineInBatch ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </span>
                        <span className="flex-1 text-[11px] text-on-surface">
                          Aktifkan juga di batch outline
                        </span>
                      </button>

                      {deepOutlineInBatch && (
                        <div className="text-[10px] text-amber-400 px-2 leading-relaxed">
                          ⚠️ Batch 200 bab dengan AI teliti = +10 menit total. Pertimbangkan
                          biaya token kalau pakai OpenRouter.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Range Selector / Generate Modal ── */}
        {pendingCanonProposals.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-500/25 bg-surface-container/75 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[22px] text-amber-400">fact_check</span>
                <div>
                  <h3 className="text-body-md font-bold text-on-surface">
                    Approval Canon Diperlukan
                  </h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed mt-1">
                    AI mencoba memakai karakter atau item yang belum ada di Lorebook. Setujui jika memang canon baru, atau tolak agar bab diregenerate dengan canon yang sudah ada.
                  </p>
                </div>
              </div>
            </div>
            {pendingCanonProposals.map((proposal) => (
              <CanonProposalCard
                key={proposal.id}
                proposal={proposal}
                disabled={resolvingCanonProposalId !== null}
                onApprove={handleApproveCanonProposal}
                onReject={handleRejectCanonProposal}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {showRangeModal && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-surface-container rounded-[20px] p-5 border border-primary/30 shadow-md overflow-hidden"
            >
              {/* ── Not generating: Range input ── */}
              {!outlineGenerating && !showResult && (
                <div className="space-y-4">
                  <h4 className="text-body-md font-bold text-on-surface">
                    Buat Banyak Rencana Bab
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-body-sm text-on-surface-variant font-semibold">Mulai Bab</label>
                    <input
                      type="number"
                      min={1}
                      max={activeProject.target_chapters}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm text-center focus:outline-none focus:border-primary"
                    />
                    <span className="text-on-surface-variant">sampai Bab</span>
                    <input
                      type="number"
                      min={rangeStart}
                      max={activeProject.target_chapters}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || rangeStart))}
                      className="w-20 h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm text-center focus:outline-none focus:border-primary"
                    />
                    <span className="text-body-sm text-on-surface-variant font-mono">
                      ({rangeEnd - rangeStart + 1} bab)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleGenerate}
                      className="h-9 px-5 rounded-lg btn-gradient text-white font-semibold text-label-md cursor-pointer hover-glow flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      Buat Rencana
                    </button>
                    <button
                      onClick={handleAutoPilot}
                      disabled={batchRunning || !!batchProgress?.currentChapterNumber}
                      title="Tulis prosa otomatis dari outline yang sudah ada"
                      className="h-9 px-4 rounded-lg bg-secondary-container text-on-secondary-container font-semibold text-label-md cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                      Auto-Pilot Naskah
                    </button>
                    <button
                      onClick={() => setShowRangeModal(false)}
                      className="h-9 px-4 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* ── Generating: Progress ── */}
              {outlineGenerating && outlineProgress && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-body-md font-bold text-on-surface flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary"
                      />
                      Menyusun rencana bab...
                    </h4>
                    <button
                      onClick={abortOutlineGeneration}
                      disabled={useProjectStore.getState()._outlineAbortFlag}
                      className="h-8 px-4 rounded-lg bg-error/10 border border-error/20 text-error text-label-md cursor-pointer hover:bg-error/20 flex items-center gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {useProjectStore.getState()._outlineAbortFlag ? (
                        <>
                          <motion.span 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="material-symbols-outlined text-[14px]"
                          >
                            progress_activity
                          </motion.span>
                          Menghentikan...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">stop</span>
                          Berhenti
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                    <motion.div
                      className="h-full btn-gradient rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>
                      Bab <span className="font-bold text-primary">{outlineProgress.currentChapter}</span>
                      {' '} ({outlineProgress.generated} generated, {outlineProgress.skipped} skipped)
                    </span>
                    <span className="font-mono font-bold">{progressPercent}%</span>
                  </div>

                  {/* Chapter Status Indicators */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: outlineProgress.total }, (_, i) => {
                      const chapNum = rangeStart + i
                      const isGenerated = chapNum < outlineProgress.currentChapter
                      const isCurrent = chapNum === outlineProgress.currentChapter
                      return (
                        <motion.div
                          key={i}
                          initial={isCurrent ? { scale: 0.9, opacity: 0 } : false}
                          animate={isCurrent ? { scale: 1, opacity: 1 } : false}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all relative overflow-hidden ${
                            isGenerated
                              ? 'bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_rgba(var(--color-primary),0.2)]'
                              : isCurrent
                                ? 'bg-surface-container-high text-secondary border-secondary/50 shadow-[0_0_15px_rgba(var(--color-secondary),0.15)]'
                                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 opacity-70'
                          }`}
                          title={`Bab ${chapNum}`}
                        >
                          {isCurrent && (
                            <motion.div
                              className="absolute inset-[-2px] rounded-xl border-[2px] border-transparent border-t-secondary/80 border-r-secondary/80"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                          )}
                          
                          {isCurrent && (
                            <div className="absolute inset-0 bg-secondary/10 animate-pulse" />
                          )}

                          <span className="relative z-10 flex items-center justify-center">
                            {isGenerated ? (
                              <span className="material-symbols-outlined text-[16px] drop-shadow-sm">check</span>
                            ) : (
                              chapNum
                            )}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Result: Done ── */}
              {!outlineGenerating && showResult && outlineProgress && (
                <div className="space-y-3">
                  <h4 className={`text-body-md font-bold ${
                    outlineProgress.status === 'cancelled' ? 'text-tertiary' : 'text-primary'
                  }`}>
                    {outlineProgress.status === 'cancelled'
                      ? '⚠️ Generasi Dibatalkan'
                      : '✅ Rencana Bab Selesai!'}
                  </h4>
                  <div className="flex flex-wrap gap-4 text-body-sm">
                    <span className="text-on-surface">
                      ✨ <span className="font-bold">{outlineProgress.generated}</span> bab ter-generate
                    </span>
                    {outlineProgress.skipped > 0 && (
                      <span className="text-on-surface-variant">
                        ⏭ <span className="font-bold">{outlineProgress.skipped}</span> di-skip
                      </span>
                    )}
                  </div>
                  {outlineProgress.warnings.length > 0 && (
                    <div className="bg-surface-container/50 border border-tertiary/20 rounded-xl p-4 flex flex-col mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">warning</span>
                        <span className="text-label-lg font-bold text-tertiary uppercase tracking-wider">
                          Hasil Validasi ({outlineProgress.warnings.length - fixedWarningIndices.length} Catatan)
                        </span>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2.5 scrollbar-thin scrollbar-thumb-tertiary/20">
                        {outlineProgress.warnings.map((w: string, i: number) => {
                          if (fixedWarningIndices.includes(i)) return null

                          const isBlocker = w.includes('[BLOCKER]') || w.includes('tertahan') || w.includes('Gagal generate')
                          
                          const parts = w.split(/ - /)
                          const header = parts.length > 1 ? parts[0] : ''
                          const detail = parts.length > 1 ? parts.slice(1).join(' - ') : w

                          const babMatch = header.match(/Bab (\d+)/)
                          const chapterNum = babMatch ? parseInt(babMatch[1]) : null
                          
                          const chapterExists = chapterNum ? chapters.some(c => c.chapter_number === chapterNum) : false

                          const matchingProposal = chapterNum
                            ? canonProposals.find(
                                (p) => {
                                  const name = typeof p.payload.name === 'string' ? p.payload.name : ''
                                  return (
                                    p.project_id === activeProject.id &&
                                    p.chapter_number === chapterNum &&
                                    p.status === 'PENDING' &&
                                    name &&
                                    w.toLowerCase().includes(name.toLowerCase())
                                  )
                                }
                              )
                            : null
                          
                          return (
                            <div key={i} className={`p-3 rounded-lg border flex gap-3 ${
                              isBlocker 
                                ? 'bg-error/5 border-error/20' 
                                : 'bg-surface-container-low border-outline-variant/30 hover:border-tertiary/30 transition-colors'
                            }`}>
                              <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${
                                isBlocker ? 'text-error' : 'text-tertiary'
                              }`}>
                                {isBlocker ? 'error' : 'info'}
                              </span>
                              <div>
                                {header && (
                                  <div className={`text-[11px] font-bold mb-0.5 ${isBlocker ? 'text-error/80' : 'text-on-surface-variant'}`}>
                                    {header.replace(/\[(WARNING|BLOCKER)\]/, '').trim()}
                                  </div>
                                )}
                                <p className={`text-body-sm leading-relaxed ${isBlocker ? 'text-error' : 'text-on-surface'}`}>
                                  {detail}
                                </p>
                                
                                {matchingProposal ? (
                                  <button
                                    onClick={async () => {
                                      setAutoFixingWarningIndex(i)
                                      try {
                                        await handleApproveCanonProposal(matchingProposal.id)
                                        setFixedWarningIndices((prev) => [...prev, i])
                                      } catch (err: unknown) {
                                        // Toast error is handled in handleApproveCanonProposal
                                      }
                                      setAutoFixingWarningIndex(null)
                                    }}
                                    disabled={autoFixingWarningIndex !== null}
                                    className="mt-3 h-8 px-3 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-label-md flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer font-bold"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {autoFixingWarningIndex === i ? 'progress_activity' : 'add_circle'}
                                    </span>
                                    {autoFixingWarningIndex === i ? 'Menambahkan...' : `Tambahkan "${matchingProposal.payload.name || 'Canon Baru'}" ke Lorebook`}
                                  </button>
                                ) : (
                                  chapterNum && chapterExists && (
                                    <button
                                      onClick={async () => {
                                        setAutoFixingWarningIndex(i)
                                        const chapterId = chapters.find((c) => c.chapter_number === chapterNum)?.id
                                        if (chapterId) {
                                          try {
                                            await regenerateOutline(chapterId, detail)
                                            setFixedWarningIndices((prev) => [...prev, i])
                                            addToast(`Berhasil memperbaiki secara otomatis Bab ${chapterNum}`, 'success')
                                          } catch (err: unknown) {
                                            const msg = err instanceof Error ? err.message : String(err)
                                            addToast(msg, 'warning')
                                          }
                                        } else {
                                          addToast('Bab tidak ditemukan.', 'error')
                                        }
                                        setAutoFixingWarningIndex(null)
                                      }}
                                      disabled={autoFixingWarningIndex !== null}
                                      className="mt-3 h-8 px-3 rounded-md bg-secondary/10 text-secondary border border-secondary/20 text-label-md flex items-center gap-1.5 hover:bg-secondary/20 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        {autoFixingWarningIndex === i ? 'psychology' : 'auto_awesome'}
                                      </span>
                                      {autoFixingWarningIndex === i ? 'Memperbaiki...' : 'Perbaiki Otomatis'}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-outline-variant/20 mt-4">
                    {outlineProgress.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setMode('write')
                          setActiveChapter(rangeStart)
                          setShowRangeModal(false)
                          setShowResult(false)
                          addToast(`Dialihkan ke editor Bab ${rangeStart}!`, 'success')
                        }}
                        className="h-9 px-5 rounded-lg btn-gradient text-white font-bold text-label-md cursor-pointer hover-glow flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        Tulis Naskah Sekarang
                      </button>
                    )}
                    
                    {outlineProgress.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setShowResult(false)
                          const lastChapter = chapters.length > 0
                            ? Math.max(...chapters.map((ch) => ch.chapter_number))
                            : 0
                          setRangeStart(lastChapter + 1)
                          setRangeEnd(Math.min(lastChapter + 5, activeProject.target_chapters))
                        }}
                        className="h-9 px-4 rounded-lg bg-secondary-container text-on-secondary-container font-semibold text-label-md cursor-pointer hover-glow flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">schema</span>
                        Generate Outline Lagi
                      </button>
                    )}

                    <button
                      onClick={() => { setShowRangeModal(false); setShowResult(false) }}
                      className="h-9 px-4 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30 flex items-center gap-1.5 ml-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chapter Cards ── */}
        {chapters.length > 0 ? (
          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
              >
                <ChapterOutlineCard
                  chapter={ch}
                  isActive={activeChapterNumber === ch.chapter_number}
                  onSelect={() => setActiveChapter(ch.chapter_number)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[72px] text-on-surface-variant/30 block mb-4">
              description
            </span>
            <h4 className="text-headline-sm text-on-surface font-bold mb-2">
              Belum ada rencana bab
            </h4>
            <p className="text-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
              Lengkapi Kompas Cerita di Ide Cerita terlebih dahulu, lalu kembali ke sini untuk menyusun rencana bab-per-bab.
            </p>

            {/* Compass incomplete warning */}
            {!compassStatus.isComplete && (
              <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-tertiary/10 border border-tertiary/25 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>
                  <span className="text-label-md font-bold text-tertiary">Kompas Cerita Belum Lengkap</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {compassStatus.missing.map((item) => (
                    <li key={item} className="text-body-sm text-on-surface-variant list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-on-surface-variant/70 mt-2 italic">
                  Kembali ke Ide Cerita untuk melengkapi elemen di atas.
                </p>
              </div>
            )}

            <button
              onClick={handleOpenGenerateModal}
              disabled={outlineGenerating || !compassStatus.isComplete}
              title={!compassStatus.isComplete ? `Kompas cerita belum lengkap: ${compassStatus.missing.join(', ')}` : undefined}
              className="h-10 px-6 rounded-xl btn-gradient text-white font-semibold text-label-lg cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Buat Rencana Bab Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
