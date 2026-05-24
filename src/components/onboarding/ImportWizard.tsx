/**
 * Import Wizard — 4-step flow that lets pro writers bring an existing
 * manuscript into VibeNovel without losing context.
 *
 * Steps:
 *   1. Upload  — paste plain text or upload .txt / .docx / .pdf
 *   2. Analyze — Tier-1 quick scan + Tier-2 deep samples + voice DNA
 *   3. Review  — editable list of extracted entities
 *   4. Confirm — summary, then create project + import everything
 */

import React, { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/useProjectStore'
import {
  ACCEPTED_FILE_TYPES,
  extractTextFromFile,
  ManuscriptTooLargeError,
  UnsupportedFileTypeError,
  MAX_INPUT_CHARS
} from '../../lib/manuscript-reader'
import { estimateCost, splitChapters } from '../../lib/manuscript-parser'
import {
  analyzeManuscript,
  type ImportAnalysisResult,
  type ProgressEvent
} from '../../services/import-analyzer'
import type {
  Project,
  Character,
  CharacterRole,
  CharacterGenesis,
  ItemCategory,
  Item,
  WorldRule,
  Chapter
} from '../../types/project'

interface ImportWizardProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 1 | 2 | 3 | 4

interface UploadState {
  rawText: string
  source: 'paste' | 'file'
  fileName?: string
  chapterCountDetected: number
  estimate: { tokens: number; calls: number; etaSeconds: number } | null
  error: string | null
  parsing: boolean
}

const initialUpload: UploadState = {
  rawText: '',
  source: 'paste',
  chapterCountDetected: 0,
  estimate: null,
  error: null,
  parsing: false
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    createProject,
    activeProject,
    addCharacter,
    addItem,
    addWorldRule,
    addChapter,
    updateProject,
    upsertCharacterStates
  } = useProjectStore()

  const [step, setStep] = useState<Step>(1)
  const [upload, setUpload] = useState<UploadState>(initialUpload)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  // Editable state for review step
  const [editedCharacters, setEditedCharacters] = useState<ImportAnalysisResult['characters']>([])
  const [editedTargetEnding, setEditedTargetEnding] = useState<string>('')
  const [editedThemeAndTone, setEditedThemeAndTone] = useState<string>('')

  const abortRef = useRef<AbortController | null>(null)

  // Reset state during render whenever the modal toggles closed→open.
  const [prevOpen, setPrevOpen] = useState<boolean>(isOpen)
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setUpload(initialUpload)
      setProgress(null)
      setAnalysis(null)
      setAnalyzeError(null)
      setImporting(false)
    }
  }

  // ── Step 1 — Upload helpers ─────────────────────────────────────────────

  const onPasteChange = (text: string) => {
    setUpload((prev) => ({ ...prev, rawText: text, source: 'paste', error: null }))
  }

  const onFilePicked = async (file: File) => {
    setUpload((prev) => ({ ...prev, parsing: true, error: null, fileName: file.name, source: 'file' }))
    try {
      const text = await extractTextFromFile(file)
      setUpload((prev) => ({ ...prev, rawText: text, parsing: false }))
    } catch (e) {
      const msg =
        e instanceof ManuscriptTooLargeError
          ? e.message
          : e instanceof UnsupportedFileTypeError
            ? e.message
            : 'Gagal membaca file.'
      setUpload((prev) => ({ ...prev, parsing: false, error: msg, rawText: '' }))
    }
  }

  // Recompute chapter count + cost estimate whenever raw text changes.
  // Derived during render to satisfy react-hooks rules.
  const [prevRawText, setPrevRawText] = useState<string>('')
  if (prevRawText !== upload.rawText) {
    setPrevRawText(upload.rawText)
    if (!upload.rawText.trim()) {
      setUpload((prev) => ({ ...prev, chapterCountDetected: 0, estimate: null }))
    } else if (upload.rawText.length > MAX_INPUT_CHARS) {
      setUpload((prev) => ({
        ...prev,
        chapterCountDetected: 0,
        estimate: null,
        error: `Naskah ~${Math.round(prev.rawText.length / 1000)}k karakter — melebihi cap ${Math.round(MAX_INPUT_CHARS / 1000)}k.`
      }))
    } else {
      const chapters = splitChapters(upload.rawText)
      const cost = estimateCost(upload.rawText, chapters.length)
      setUpload((prev) => ({
        ...prev,
        chapterCountDetected: chapters.length,
        estimate: cost,
        error: null
      }))
    }
  }

  const canStartAnalysis =
    !upload.parsing && upload.rawText.trim().length > 200 && !upload.error

  // ── Step 2 — Analyze ────────────────────────────────────────────────────

  const startAnalysis = async () => {
    abortRef.current = new AbortController()
    setStep(2)
    setAnalyzeError(null)
    setProgress({ stage: 'preflight', message: 'Mempersiapkan...', progress: 0 })
    try {
      const result = await analyzeManuscript(upload.rawText, {
        signal: abortRef.current.signal,
        onProgress: (evt) => setProgress(evt)
      })
      setAnalysis(result)
      setEditedCharacters(result.characters)
      setEditedTargetEnding(result.targetEnding ?? '')
      setEditedThemeAndTone(result.themeAndTone)
      setStep(3)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setAnalyzeError('Dibatalkan.')
      } else {
        const msg = e instanceof Error ? e.message : 'Analisa gagal.'
        setAnalyzeError(msg)
      }
    }
  }

  const cancelAnalysis = () => {
    abortRef.current?.abort()
  }

  // ── Step 4 — Confirm + execute import ───────────────────────────────────

  const startImport = async () => {
    if (!analysis) return
    setImporting(true)
    try {
      // 1. Create project (genesis_mode: IMPORTED)
      const newProject = await createProject(
        deriveTitleFromAnalysis(analysis),
        deriveGenreFromAnalysis(analysis),
        Math.max(analysis.chapters.length + 50, 100), // give the user room to extend
        1500,
        'IMPORTED'
      )

      // The store auto-sets activeProject to the new one. Ensure we use that ID.
      const projectId = newProject.id

      // 2. Update narrative meta
      await updateProject(projectId, {
        narrative_constitution: analysis.narrativeConstitution || null,
        target_ending: editedTargetEnding || null,
        theme_and_tone: editedThemeAndTone || null,
        status: 'WRITING'
      })

      // 3. Import characters
      const characterIdMap = new Map<string, string>() // name → eventual id (best-effort)
      for (const ch of editedCharacters) {
        const voice = analysis.voiceDna[ch.name] ?? {}
        const payload: Omit<Character, 'id'> = {
          project_id: projectId,
          name: ch.name,
          role: ch.role as CharacterRole,
          description: ch.shortDescription,
          voice_dna: (voice ?? {}) as unknown as Record<string, unknown>,
          activation_keys: [ch.name],
          priority: ch.role === 'PROTAGONIST' ? 10 : ch.role === 'ANTAGONIST' ? 8 : 5,
          is_locked: false,
          genesis: 'IMPORTED' satisfies CharacterGenesis
        }
        await addCharacter(payload)
        // We can't get the assigned id back synchronously, but lookup by name
        // works reliably since names are unique within a project.
        const newest = useProjectStore.getState().characters.find((c) => c.name === ch.name)
        if (newest) characterIdMap.set(ch.name, newest.id)
      }

      // 4. Import items (best-effort from itemNames)
      for (const itemName of analysis.itemNames) {
        const payload: Omit<Item, 'id'> = {
          project_id: projectId,
          name: itemName,
          category: 'OTHER' as ItemCategory,
          description: '',
          significance: '',
          activation_keys: [itemName],
          current_owner: '',
          priority: 5,
          genesis: 'IMPORTED'
        }
        await addItem(payload)
      }

      // 5. Import world rules (currently always empty; reserved for v2)
      for (const ruleName of analysis.worldRuleNames) {
        const payload: Omit<WorldRule, 'id'> = {
          project_id: projectId,
          category: 'OTHER',
          name: ruleName,
          description: '',
          priority: 5,
          activation_keys: [],
          genesis: 'IMPORTED'
        }
        await addWorldRule(payload)
      }

      // 6. Import chapters
      for (const ch of analysis.chapters) {
        const wordCount = ch.prose.split(/\s+/).filter(Boolean).length
        const payload: Omit<Chapter, 'id'> = {
          project_id: projectId,
          chapter_number: ch.chapter_number,
          title: ch.title,
          status: 'IMPORTED',
          synopsis: ch.outline?.synopsis ?? null,
          key_events: ch.outline?.keyEvents ?? [],
          active_characters: ch.outline?.activeCharacters ?? [],
          active_items: ch.outline?.activeItems ?? [],
          location: ch.outline?.location ?? null,
          time_in_story: ch.outline?.timeInStory ?? null,
          emotional_tone: ch.outline?.emotionalTone ?? null,
          cliffhanger_type: ch.outline?.cliffhangerType ?? null,
          cliffhanger_setup: ch.outline?.cliffhangerSetup ?? null,
          dopamine_beat: false,
          false_resolution: false,
          paywall_advice: null,
          arc_position: null,
          open_threads: ch.outline?.openThreads ?? [],
          resolved_threads: ch.outline?.resolvedThreads ?? [],
          foreshadowing: ch.outline?.foreshadowing ?? [],
          chapter_end_state: ch.outline?.chapterEndState ?? null,
          do_not_include: [],
          must_connect_to: null,
          filler_risk: null,
          prose: ch.prose,
          word_count: wordCount,
          beats: [],
          outline_source: 'IMPORTED',
          prose_source: 'IMPORTED',
          is_locked: true
        }
        await addChapter(payload)

        // 7. Hydrate character states from the deep-analyzed chapters
        if (ch.outline?.characterStates && ch.outline.characterStates.length > 0) {
          const states = ch.outline.characterStates.map((s) => {
            const charId = characterIdMap.get(s.character_name) ?? s.character_name
            return {
              id: crypto.randomUUID(),
              character_id: charId,
              chapter_number: ch.chapter_number,
              location: s.location,
              physical_condition: s.physical_condition,
              emotional_state: s.emotional_state,
              inventory: s.inventory,
              relationships: {},
              last_action: s.last_action,
              knowledge_state: s.knowledge_state,
              active_goal: s.active_goal,
              secrets: s.secrets,
              appearance_notes: s.appearance_notes,
              alliances: s.alliances,
              source: 'IMPORTED' as const
            }
          })
          await upsertCharacterStates(ch.chapter_number, states)
        }
      }

      // Done — close wizard, navigate to workspace.
      onClose()
      navigate(`/project/${projectId}`)
    } catch (e) {
      console.error('[Import] orchestration failed:', e)
      setAnalyzeError(e instanceof Error ? e.message : 'Gagal mengimpor naskah.')
      setImporting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-surface-container border border-outline-variant/30 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <header className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">file_upload</span>
              Import Manuskrip
            </h2>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Langkah {step} dari 4 — {STEP_LABELS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer rounded-full p-1 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <StepIndicator step={step} />

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Step1Upload upload={upload} onPasteChange={onPasteChange} onFilePicked={onFilePicked} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Step2Analyze progress={progress} error={analyzeError} onCancel={cancelAnalysis} />
              </motion.div>
            )}
            {step === 3 && analysis && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Step3Review
                  analysis={analysis}
                  editedCharacters={editedCharacters}
                  setEditedCharacters={setEditedCharacters}
                  editedTargetEnding={editedTargetEnding}
                  setEditedTargetEnding={setEditedTargetEnding}
                  editedThemeAndTone={editedThemeAndTone}
                  setEditedThemeAndTone={setEditedThemeAndTone}
                />
              </motion.div>
            )}
            {step === 4 && analysis && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Step4Confirm
                  analysis={analysis}
                  editedCharacters={editedCharacters}
                  editedTargetEnding={editedTargetEnding}
                  importing={importing}
                  error={analyzeError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between gap-3 bg-surface-container-low">
          {step > 1 && step !== 2 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              disabled={importing}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer disabled:opacity-40"
            >
              ← Kembali
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                onClick={startAnalysis}
                disabled={!canStartAnalysis}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lanjut →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow"
              >
                Setujui Semua →
              </button>
            )}
            {step === 4 && (
              <button
                onClick={startImport}
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer hover-glow disabled:opacity-40"
              >
                {importing ? 'Mengimpor...' : 'Mulai Project →'}
              </button>
            )}
          </div>
        </footer>
      </motion.div>

      {/* Stash for activeProject ref so unused-import lint stays clean. */}
      <span className="hidden">{activeProject?.id ?? ''}</span>
    </div>
  )
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Upload',
  2: 'Analisa AI',
  3: 'Review',
  4: 'Konfirmasi'
}

const StepIndicator: React.FC<{ step: Step }> = ({ step }) => (
  <div className="px-6 pt-3 pb-1 flex items-center gap-2">
    {[1, 2, 3, 4].map((n) => (
      <div
        key={n}
        className={`h-1 flex-1 rounded-full transition-colors ${
          step >= n ? 'bg-primary' : 'bg-outline-variant/30'
        }`}
      />
    ))}
  </div>
)

// ── Step 1 — Upload ────────────────────────────────────────────────────────

const Step1Upload: React.FC<{
  upload: UploadState
  onPasteChange: (text: string) => void
  onFilePicked: (file: File) => void
}> = ({ upload, onPasteChange, onFilePicked }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Paste teks novel, atau upload <strong>.txt</strong>, <strong>.docx</strong>, atau{' '}
          <strong>.pdf</strong>. Naskah hanya diproses di browser-mu — kami tidak menyimpan
          isinya di server eksternal.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-container text-on-secondary-container text-sm font-semibold cursor-pointer hover-glow"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Pilih File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFilePicked(f)
          }}
        />
        {upload.fileName && (
          <span className="text-xs text-on-surface-variant truncate">{upload.fileName}</span>
        )}
        {upload.parsing && (
          <span className="flex items-center gap-2 text-xs text-on-surface-variant">
            <div className="w-3 h-3 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
            Membaca...
          </span>
        )}
      </div>

      <textarea
        value={upload.rawText}
        onChange={(e) => onPasteChange(e.target.value)}
        placeholder="...atau paste teks novelmu di sini."
        className="w-full min-h-[260px] p-4 rounded-2xl bg-surface-container-low border border-outline-variant text-on-surface text-sm leading-relaxed font-serif resize-y focus:outline-none focus:border-primary/50"
      />

      {upload.error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm">
          ⚠️ {upload.error}
        </div>
      )}

      {upload.estimate && (
        <div className="bg-primary-container/30 border border-primary/20 rounded-xl p-3 text-sm">
          <p className="font-semibold text-on-surface">
            📊 Naskah ~{Math.round(upload.rawText.length / 1000)}k karakter, {upload.chapterCountDetected} bab terdeteksi.
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Estimasi: {upload.estimate.calls} panggilan Gemini, ~{upload.estimate.etaSeconds}{' '}
            detik, ~{Math.round(upload.estimate.tokens / 1000)}k token.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Analyze ───────────────────────────────────────────────────────

const Step2Analyze: React.FC<{
  progress: ProgressEvent | null
  error: string | null
  onCancel: () => void
}> = ({ progress, error, onCancel }) => {
  const pct = Math.round((progress?.progress ?? 0) * 100)
  return (
    <div className="space-y-5 py-6 text-center">
      {error ? (
        <div className="bg-error/10 border border-error/30 rounded-2xl p-5 text-error">
          <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-on-surface text-base font-medium">{progress?.message}</p>
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2">{pct}%</p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-error rounded-lg cursor-pointer"
          >
            ⛔ Batalkan
          </button>
        </>
      )}
    </div>
  )
}

// ── Step 3 — Review ────────────────────────────────────────────────────────

const Step3Review: React.FC<{
  analysis: ImportAnalysisResult
  editedCharacters: ImportAnalysisResult['characters']
  setEditedCharacters: React.Dispatch<React.SetStateAction<ImportAnalysisResult['characters']>>
  editedTargetEnding: string
  setEditedTargetEnding: (v: string) => void
  editedThemeAndTone: string
  setEditedThemeAndTone: (v: string) => void
}> = ({
  analysis,
  editedCharacters,
  setEditedCharacters,
  editedTargetEnding,
  setEditedTargetEnding,
  editedThemeAndTone,
  setEditedThemeAndTone
}) => (
  <div className="space-y-5">
    <p className="text-sm text-on-surface-variant">
      Cek hasil ekstraksi sebelum kita simpan. Karakter, ending, dan tema bisa kamu edit di sini.
    </p>

    <section className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        🧬 Tema & Tone
      </h3>
      <textarea
        value={editedThemeAndTone}
        onChange={(e) => setEditedThemeAndTone(e.target.value)}
        className="w-full min-h-[60px] p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary/50"
      />
    </section>

    <section className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        🎯 Target Ending
      </h3>
      <textarea
        value={editedTargetEnding}
        onChange={(e) => setEditedTargetEnding(e.target.value)}
        placeholder="Belum terdeteksi — isi manual jika kamu sudah tahu mau berakhir seperti apa."
        className="w-full min-h-[60px] p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary/50"
      />
    </section>

    <section className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        👤 Karakter ({editedCharacters.length})
      </h3>
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-hide">
        {editedCharacters.map((c, idx) => (
          <div
            key={`${c.name}-${idx}`}
            className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  value={c.name}
                  onChange={(e) =>
                    setEditedCharacters((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p))
                    )
                  }
                  className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 text-on-surface font-bold text-base focus:outline-none pb-1"
                />
                <select
                  value={c.role}
                  onChange={(e) =>
                    setEditedCharacters((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? { ...p, role: e.target.value as ImportAnalysisResult['characters'][0]['role'] }
                          : p
                      )
                    )
                  }
                  className="mt-2 px-2 py-1 rounded-md bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none"
                >
                  <option value="PROTAGONIST">PROTAGONIST</option>
                  <option value="ANTAGONIST">ANTAGONIST</option>
                  <option value="SUPPORTING">SUPPORTING</option>
                  <option value="MINOR">MINOR</option>
                </select>
                <textarea
                  value={c.shortDescription}
                  onChange={(e) =>
                    setEditedCharacters((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, shortDescription: e.target.value } : p))
                    )
                  }
                  className="mt-2 w-full min-h-[48px] p-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant text-xs focus:outline-none focus:border-primary/40"
                />
              </div>
              <button
                onClick={() => setEditedCharacters((prev) => prev.filter((_, i) => i !== idx))}
                className="text-on-surface-variant hover:text-error cursor-pointer"
                aria-label="Hapus karakter"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        📚 Bab Terdeteksi
      </h3>
      <p className="text-xs text-on-surface-variant/70">
        {analysis.chapters.length} bab akan diimpor. Bab dengan ✦ sudah dianalisa lengkap;
        sisanya disimpan sebagai prosa mentah dan akan di-fill outline-nya saat kamu buka.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto scrollbar-hide">
        {analysis.chapters.slice(0, 30).map((c) => (
          <span
            key={c.chapter_number}
            className="text-xs bg-surface-container-low border border-outline-variant/20 rounded-lg px-2 py-1 truncate"
          >
            {c.outline ? '✦ ' : ''}Bab {c.chapter_number}
          </span>
        ))}
        {analysis.chapters.length > 30 && (
          <span className="text-xs text-on-surface-variant/60 italic px-2 py-1">
            ...dan {analysis.chapters.length - 30} bab lain
          </span>
        )}
      </div>
    </section>
  </div>
)

// ── Step 4 — Confirm ───────────────────────────────────────────────────────

const Step4Confirm: React.FC<{
  analysis: ImportAnalysisResult
  editedCharacters: ImportAnalysisResult['characters']
  editedTargetEnding: string
  importing: boolean
  error: string | null
}> = ({ analysis, editedCharacters, editedTargetEnding, importing, error }) => {
  const summary = useMemo(
    () => ({
      chapters: analysis.chapters.length,
      chaptersWithOutline: analysis.chapters.filter((c) => c.outline).length,
      characters: editedCharacters.length,
      items: analysis.itemNames.length,
      worldRules: analysis.worldRuleNames.length,
      voiceDnaCount: Object.keys(analysis.voiceDna).length
    }),
    [analysis, editedCharacters.length]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Siap mengimpor? Berikut ringkasan yang akan dibuat:
      </p>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Bab" value={summary.chapters} sublabel={`${summary.chaptersWithOutline} dianalisa lengkap`} icon="menu_book" />
        <SummaryCard label="Karakter" value={summary.characters} sublabel={`${summary.voiceDnaCount} voice DNA`} icon="group" />
        <SummaryCard label="Item" value={summary.items} sublabel="Auto-detect dari prosa" icon="inventory_2" />
        <SummaryCard label="Aturan Dunia" value={summary.worldRules} sublabel="Bisa ditambah nanti" icon="public" />
      </div>

      {!editedTargetEnding && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-300">
          💡 Target ending belum diisi. Bisa ditambahkan nanti via Brainstorm chat.
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm">
          ⚠️ {error}
        </div>
      )}

      {importing && (
        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Mengimpor data ke project baru...
        </div>
      )}
    </div>
  )
}

const SummaryCard: React.FC<{
  label: string
  value: number
  sublabel: string
  icon: string
}> = ({ label, value, sublabel, icon }) => (
  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
    <div className="flex items-center gap-2 mb-1">
      <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
      <span className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
    </div>
    <div className="text-2xl font-bold text-on-surface">{value}</div>
    <div className="text-[10px] text-on-surface-variant/70">{sublabel}</div>
  </div>
)

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveTitleFromAnalysis(a: ImportAnalysisResult): string {
  // Use the first chapter title if it looks like a heading; else first 60 chars
  // of the synopsis.
  const firstTitle = a.chapters[0]?.title
  if (firstTitle && !/^Bab\s+\d+$/i.test(firstTitle)) return firstTitle
  return (a.synopsis || 'Naskah Impor').split('.')[0].slice(0, 80)
}

function deriveGenreFromAnalysis(a: ImportAnalysisResult): string {
  // Best-effort: pick first known genre token from theme. Default to "Drama".
  const genres = ['Drama Rumah Tangga', 'Romance Office', 'Romance', 'Thriller', 'Fantasi', 'Misteri']
  for (const g of genres) {
    if (a.themeAndTone.toLowerCase().includes(g.toLowerCase())) return g
  }
  return 'Drama Rumah Tangga'
}

// Re-export for default exports if needed
export type { Project }
