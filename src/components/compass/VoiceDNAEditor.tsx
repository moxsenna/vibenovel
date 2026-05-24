/**
 * Voice DNA Editor
 *
 * Per-character editor for the 🧲 Character Investment retention engine.
 * Voice DNA is stored as a flexible jsonb (`character.voice_dna`); this UI
 * standardises five canonical fields plus a `charm_factor` while still
 * allowing arbitrary extra keys (preserved on save).
 *
 * The "Recalibrate from Prose" action calls Gemini's voice DNA calibrator
 * (Sprint 4) on the character's most recent appearances.
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import { aiRouter } from '../../services/ai/ai-router'
import { gatherVoiceSamples, canRecalibrate } from '../../services/voice-dna-helper'
import type { Character } from '../../types/project'

interface CanonicalDna {
  tone: string
  vocabulary: string
  verbal_tics: string[]
  internal_monolog_style: string
  dialog_quirks: string
  charm_factor: string
}

function readCanonical(raw: Record<string, unknown> | null | undefined): CanonicalDna {
  const r = raw ?? {}
  const str = (k: string): string => (typeof r[k] === 'string' ? (r[k] as string) : '')
  const arr = (k: string): string[] =>
    Array.isArray(r[k]) ? ((r[k] as unknown[]).filter((v) => typeof v === 'string') as string[]) : []
  return {
    tone: str('tone'),
    vocabulary: str('vocabulary'),
    verbal_tics: arr('verbal_tics'),
    internal_monolog_style: str('internal_monolog_style'),
    dialog_quirks: str('dialog_quirks'),
    charm_factor: str('charm_factor')
  }
}

/**
 * Merge edited canonical fields back into the existing voice_dna jsonb,
 * preserving any custom keys the user (or earlier AI calls) added.
 */
function mergeIntoVoiceDna(
  existing: Record<string, unknown> | undefined,
  edits: CanonicalDna
): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    tone: edits.tone,
    vocabulary: edits.vocabulary,
    verbal_tics: edits.verbal_tics,
    internal_monolog_style: edits.internal_monolog_style,
    dialog_quirks: edits.dialog_quirks,
    charm_factor: edits.charm_factor
  }
}

export const VoiceDNAEditor: React.FC = () => {
  const { characters, chapters, updateCharacter } = useProjectStore()

  const sortedCharacters = useMemo(
    () =>
      [...characters].sort((a, b) => {
        const order: Record<Character['role'], number> = {
          PROTAGONIST: 0,
          ANTAGONIST: 1,
          SUPPORTING: 2,
          MINOR: 3
        }
        return order[a.role] - order[b.role]
      }),
    [characters]
  )

  return (
    <div className="bg-surface-container-high p-5 rounded-2xl border border-outline-variant/20 shadow-sm inner-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">graphic_eq</span>
          🎤 Voice DNA
        </h3>
        <span className="text-xs text-on-surface-variant/70 font-semibold">
          {sortedCharacters.length} karakter
        </span>
      </div>

      <p className="text-xs text-on-surface-variant/70 leading-relaxed mb-4">
        Setiap karakter punya pola bicara yang unik. Voice DNA dipakai oleh
        Prose Writer agar dialog konsisten lintas bab.
      </p>

      {sortedCharacters.length === 0 ? (
        <div className="text-center py-6 px-3 text-on-surface-variant/60 text-sm italic">
          Belum ada karakter. Tambah dari mode Outline atau via Brainstorm chat.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCharacters.map((c) => (
            <CharacterDnaCard
              key={c.id}
              character={c}
              canRecalibrateProse={canRecalibrate(c, chapters)}
              onSave={async (next) => {
                await updateCharacter(c.id, {
                  voice_dna: mergeIntoVoiceDna(c.voice_dna, next)
                })
              }}
              onRecalibrate={async () => {
                const { samples } = gatherVoiceSamples(c.name, chapters)
                if (samples.length === 0) {
                  throw new Error(`Belum ada prosa yang menyebut ${c.name}.`)
                }
                const dna = await aiRouter.calibrateVoiceDna({
                  characterName: c.name,
                  samples
                })
                return {
                  tone: dna.tone || '',
                  vocabulary: dna.vocabulary || '',
                  verbal_tics: dna.verbalTics || [],
                  internal_monolog_style: dna.internalMonologStyle || '',
                  dialog_quirks: dna.dialogQuirks || '',
                  charm_factor: '' // not produced by the calibrator; user-edited
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Per-character card ────────────────────────────────────────────────────

interface CardProps {
  character: Character
  canRecalibrateProse: boolean
  onSave: (next: CanonicalDna) => Promise<void>
  /**
   * Run a recalibration. The card merges the AI result into the local
   * editing state but does NOT auto-save — the user reviews + clicks Simpan.
   */
  onRecalibrate: () => Promise<CanonicalDna>
}

const CharacterDnaCard: React.FC<CardProps> = ({
  character,
  canRecalibrateProse,
  onSave,
  onRecalibrate
}) => {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState<CanonicalDna>(() =>
    readCanonical(character.voice_dna as Record<string, unknown> | undefined)
  )
  const [recalibrating, setRecalibrating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Sync from store when not actively editing.
  const synced = readCanonical(character.voice_dna as Record<string, unknown> | undefined)
  const [prevSynced, setPrevSynced] = useState(JSON.stringify(synced))
  if (!expanded) {
    const stored = JSON.stringify(synced)
    if (stored !== prevSynced) {
      setPrevSynced(stored)
      setEditing(synced)
    }
  }

  const handleRecalibrate = async () => {
    setRecalibrating(true)
    setFeedback(null)
    try {
      const dna = await onRecalibrate()
      setEditing((prev) => ({
        ...prev,
        ...dna,
        // preserve charm_factor — calibrator doesn't fill it.
        charm_factor: dna.charm_factor || prev.charm_factor
      }))
      setFeedback('✨ Voice DNA berhasil dikalibrasi. Cek hasilnya, lalu klik Simpan.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recalibrate gagal.'
      setFeedback(`⚠️ ${msg}`)
    } finally {
      setRecalibrating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await onSave(editing)
      setFeedback('✓ Tersimpan.')
      setTimeout(() => setFeedback(null), 1500)
    } finally {
      setSaving(false)
    }
  }

  const previewSummary = editing.tone || editing.dialog_quirks || '(belum ada voice DNA)'

  return (
    <motion.div
      layout
      className="bg-surface-container/60 rounded-xl border border-outline-variant/15 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-surface-container/40"
      >
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-on-surface truncate">{character.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-on-surface-variant/10 text-on-surface-variant uppercase">
              {character.role}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant/70 line-clamp-1 italic">{previewSummary}</p>
        </div>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70 shrink-0">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-outline-variant/10">
              <DnaField
                label="Tone"
                value={editing.tone}
                placeholder="lembut tapi tegas"
                onChange={(v) => setEditing((prev) => ({ ...prev, tone: v }))}
              />
              <DnaField
                label="Vocabulary"
                value={editing.vocabulary}
                placeholder="campuran Betawi halus, formal-santai"
                onChange={(v) => setEditing((prev) => ({ ...prev, vocabulary: v }))}
              />
              <DnaArrayField
                label="Verbal Tics"
                values={editing.verbal_tics}
                placeholder="frasa khas yang berulang"
                onChange={(arr) => setEditing((prev) => ({ ...prev, verbal_tics: arr }))}
              />
              <DnaField
                label="Internal Monolog Style"
                value={editing.internal_monolog_style}
                placeholder="cepat, gelisah, penuh keraguan"
                onChange={(v) => setEditing((prev) => ({ ...prev, internal_monolog_style: v }))}
              />
              <DnaField
                label="Dialog Quirks"
                value={editing.dialog_quirks}
                placeholder="suka memotong kalimat sendiri saat panik"
                onChange={(v) => setEditing((prev) => ({ ...prev, dialog_quirks: v }))}
              />
              <DnaField
                label="Charm Factor"
                placeholder="apa yang bikin pembaca jatuh cinta? misal: kerja keras diam-diam demi kue ultah"
                value={editing.charm_factor}
                onChange={(v) => setEditing((prev) => ({ ...prev, charm_factor: v }))}
                hint="🧲 Character Investment Trap — momen vulnerable atau memorable yang bikin pembaca sayang."
              />

              {feedback && (
                <p className="text-xs text-on-surface-variant italic">{feedback}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/10">
                <button
                  onClick={handleRecalibrate}
                  disabled={recalibrating || !canRecalibrateProse}
                  title={
                    canRecalibrateProse
                      ? 'Tarik gaya bicara dari 2-3 bab terbaru dengan karakter ini.'
                      : 'Butuh minimal 2 bab dengan prosa yang menyebut karakter ini.'
                  }
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container border border-outline-variant/30 cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {recalibrating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-on-secondary-container/30 border-t-on-secondary-container rounded-full animate-spin" />
                      Mengkalibrasi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">refresh</span>
                      Recalibrate from Prose
                    </>
                  )}
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-primary text-on-primary cursor-pointer disabled:opacity-40"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const DnaField: React.FC<{
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  hint?: string
}> = ({ label, value, placeholder, onChange, hint }) => (
  <div>
    <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5 font-semibold">
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary/50"
    />
    {hint && <p className="text-[10px] text-on-surface-variant/60 italic mt-0.5">{hint}</p>}
  </div>
)

const DnaArrayField: React.FC<{
  label: string
  values: string[]
  placeholder: string
  onChange: (arr: string[]) => void
}> = ({ label, values, placeholder, onChange }) => {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (values.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...values, trimmed])
    setDraft('')
  }

  return (
    <div>
      <label className="text-[10px] uppercase text-on-surface-variant/60 block mb-0.5 font-semibold">
        {label}
      </label>
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
              className="text-primary/70 hover:text-primary cursor-pointer"
              aria-label="Hapus tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={addTag}
          disabled={!draft.trim()}
          className="px-2 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
        >
          + Tambah
        </button>
      </div>
    </div>
  )
}
