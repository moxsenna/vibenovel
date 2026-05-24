import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { useUiStore } from '../../store/useUiStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useBatchGenerator } from '../../hooks/useBatchGenerator'
import { ChapterOutlineCard } from './ChapterOutlineCard'

export const SeasonArchitectPanel: React.FC = () => {
  const activeProject = useProjectStore((s) => s.activeProject)
  const chapters = useProjectStore((s) => s.chapters)
  const characters = useProjectStore((s) => s.characters)
  const mysteryLayers = useProjectStore((s) => s.mysteryLayers)
  const outlineGenerating = useProjectStore((s) => s.outlineGenerating)
  const outlineProgress = useProjectStore((s) => s.outlineProgress)
  const generateOutlineBatch = useProjectStore((s) => s.generateOutlineBatch)
  const abortOutlineGeneration = useProjectStore((s) => s.abortOutlineGeneration)
  const setActiveChapter = useUiStore((s) => s.setActiveChapter)
  const activeChapterNumber = useUiStore((s) => s.activeChapter)
  const addToast = useUiStore((s) => s.addToast)
  const showConfirm = useUiStore((s) => s.showConfirm)
  const geminiKeys = useSettingsStore((s) => s.geminiKeys)
  const { startBatch, isRunning: batchRunning, progress: batchProgress } = useBatchGenerator()

  // Range selector state
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(5)
  const [showRangeModal, setShowRangeModal] = useState(false)

  // Completed result display
  const [showResult, setShowResult] = useState(false)

  // Sprint 9.8 — Deep Outline settings panel
  const [showOutlineSettings, setShowOutlineSettings] = useState(false)
  const deepOutlineEnabled = useSettingsStore((s) => s.deepOutlineEnabled)
  const deepOutlineBudget = useSettingsStore((s) => s.deepOutlineBudget)
  const deepOutlineInBatch = useSettingsStore((s) => s.deepOutlineInBatch)
  const setDeepOutlineEnabled = useSettingsStore((s) => s.setDeepOutlineEnabled)
  const setDeepOutlineBudget = useSettingsStore((s) => s.setDeepOutlineBudget)
  const setDeepOutlineInBatch = useSettingsStore((s) => s.setDeepOutlineInBatch)
  const outlineBudgetPresets = [512, 1024, 2048, 4096]

  // ── Story Compass Completeness Check ───────────────────────────────────
  const compassStatus = useMemo(() => {
    if (!activeProject) return { isComplete: false, missing: [] as string[] }
    const missing: string[] = []
    if (!activeProject.title || !activeProject.genre) missing.push('Premis & Genre')
    if (!characters.some((c) => c.role === 'PROTAGONIST')) missing.push('Tokoh Utama (Protagonis)')
    if (!characters.some((c) => c.role === 'ANTAGONIST')) missing.push('Antagonis')
    if (!activeProject.target_ending) missing.push('Target Ending')
    if (mysteryLayers.length === 0) missing.push('Lapisan Misteri')
    return { isComplete: missing.length === 0, missing }
  }, [activeProject, characters, mysteryLayers])

  if (!activeProject) return null

  const handleOpenGenerateModal = () => {
    // Guard: Story Compass must be complete
    if (!compassStatus.isComplete) {
      addToast(
        `Story Compass belum lengkap! Yang belum terisi: ${compassStatus.missing.join(', ')}. Lengkapi di mode Brainstorm terlebih dahulu.`,
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
      addToast('Belum ada Gemini API key. Masukkan key di Settings terlebih dahulu.', 'error')
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
      await generateOutlineBatch(rangeStart, rangeEnd)
      setShowResult(true)
      addToast(`Berhasil generate outline Bab ${rangeStart} sampai ${rangeEnd}!`, 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal generate outline batch.'
      addToast(`Gagal: ${msg}`, 'error')
    }
  }

  const handleAutoPilot = async () => {
    if (geminiKeys.length === 0) {
      addToast('Belum ada Gemini API key. Masukkan key di Settings terlebih dahulu.', 'error')
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
              <h3 className="text-headline-md text-on-surface font-bold">Season Architect</h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Rancang alur per bab. Tentukan dopamine hit, paywall, dan cliffhanger.
              </p>
            </div>
            <button
              onClick={handleOpenGenerateModal}
              disabled={outlineGenerating || !compassStatus.isComplete}
              title={!compassStatus.isComplete ? `Story Compass belum lengkap: ${compassStatus.missing.join(', ')}` : undefined}
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
                  <span>Generate Outline</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-4 text-body-sm">
            <span className="text-on-surface-variant">
              📋 <span className="font-bold text-on-surface">{chapters.length}</span> outline
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
              Pengaturan Outline
              {deepOutlineEnabled && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold">
                  🧠 Deep Outline
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
                        🧠 Deep Outline
                      </div>
                      <div className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                        AI berpikir dulu sebelum bikin outline. Hasil lebih cerdas (mystery
                        breadcrumb tepat, cliffhanger variatif), tapi +2-3 detik per bab.
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
                          ⚠️ Batch 200 bab dengan Deep Outline = +10 menit total. Pertimbangkan
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
                    🚀 Generate Outline Batch
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
                      Generate Outline
                    </button>
                    <button
                      onClick={handleAutoPilot}
                      disabled={batchRunning || !!batchProgress?.currentChapterNumber}
                      title="Tulis prosa otomatis dari outline yang sudah ada"
                      className="h-9 px-4 rounded-lg bg-secondary-container text-on-secondary-container font-semibold text-label-md cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                      🚀 Auto-Pilot Prose
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
                    <h4 className="text-body-md font-bold text-on-surface">
                      ⏳ Generating Outline...
                    </h4>
                    <button
                      onClick={abortOutlineGeneration}
                      className="h-8 px-4 rounded-lg bg-error/10 border border-error/20 text-error text-label-md cursor-pointer hover:bg-error/20 flex items-center gap-1.5 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[14px]">stop</span>
                      Berhenti
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
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                            isGenerated
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : isCurrent
                                ? 'bg-secondary/20 text-secondary border-secondary/30 animate-pulse'
                                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
                          }`}
                          title={`Bab ${chapNum}`}
                        >
                          {isGenerated ? '✅' : isCurrent ? '🔄' : chapNum}
                        </div>
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
                      : '✅ Outline Selesai!'}
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
                    <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-3 space-y-1">
                      <span className="text-label-md font-bold text-tertiary uppercase tracking-wider">
                        ⚠️ Peringatan Pacing
                      </span>
                      {outlineProgress.warnings.map((w: string, i: number) => (
                        <p key={i} className="text-body-sm text-on-surface-variant">{w}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowRangeModal(false); setShowResult(false) }}
                    className="h-9 px-4 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-label-md cursor-pointer hover:bg-surface-variant/30"
                  >
                    Tutup
                  </button>
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
              Belum ada outline
            </h4>
            <p className="text-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
              Lengkapi Story Compass di mode Brainstorm terlebih dahulu, lalu kembali ke sini untuk generate outline bab-per-bab.
            </p>

            {/* Compass incomplete warning */}
            {!compassStatus.isComplete && (
              <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-tertiary/10 border border-tertiary/25 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>
                  <span className="text-label-md font-bold text-tertiary">Story Compass Belum Lengkap</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {compassStatus.missing.map((item) => (
                    <li key={item} className="text-body-sm text-on-surface-variant list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-on-surface-variant/70 mt-2 italic">
                  Kembali ke mode Brainstorm untuk melengkapi elemen di atas.
                </p>
              </div>
            )}

            <button
              onClick={handleOpenGenerateModal}
              disabled={outlineGenerating || !compassStatus.isComplete}
              title={!compassStatus.isComplete ? `Story Compass belum lengkap: ${compassStatus.missing.join(', ')}` : undefined}
              className="h-10 px-6 rounded-xl btn-gradient text-white font-semibold text-label-lg cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Generate Outline Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
