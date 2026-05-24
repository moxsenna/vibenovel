import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/useProjectStore'
import type {
  CharacterRole,
  ItemCategory,
  LoreCategory
} from '../../types/project'

/**
 * Permissive shape of an extracted lore record. Fields are optional because
 * Gemini occasionally omits some properties; the modal uses defaults whenever
 * a value is missing or has the wrong type.
 */
type ExtractedRecord = Record<string, unknown>

const str = (rec: ExtractedRecord, key: string): string => {
  const v = rec[key]
  return typeof v === 'string' ? v : ''
}

const role = (rec: ExtractedRecord): CharacterRole => {
  const v = rec.role
  if (v === 'PROTAGONIST' || v === 'ANTAGONIST' || v === 'SUPPORTING' || v === 'MINOR') {
    return v
  }
  return 'MINOR'
}

const itemCategory = (rec: ExtractedRecord): ItemCategory => {
  const v = rec.category
  const valid: ItemCategory[] = [
    'WEAPON',
    'MAGICAL',
    'DOCUMENT',
    'JEWELRY',
    'VEHICLE',
    'KEY_ITEM',
    'OTHER'
  ]
  return valid.includes(v as ItemCategory) ? (v as ItemCategory) : 'OTHER'
}

const ruleCategory = (rec: ExtractedRecord): LoreCategory => {
  const v = rec.category
  const valid: LoreCategory[] = [
    'MAGIC_SYSTEM',
    'SOCIAL_RULE',
    'GEOGRAPHY',
    'TECHNOLOGY',
    'OTHER'
  ]
  return valid.includes(v as LoreCategory) ? (v as LoreCategory) : 'OTHER'
}

export const LoreDiffModal: React.FC = () => {
  const {
    activeProject,
    extractedLore,
    clearExtractedLore,
    addCharacter,
    addItem,
    addWorldRule
  } = useProjectStore()

  if (!extractedLore || !activeProject) return null

  const characters = (extractedLore.new_characters ?? []) as ExtractedRecord[]
  const items = (extractedLore.new_items ?? []) as ExtractedRecord[]
  const rules = (extractedLore.new_rules ?? []) as ExtractedRecord[]

  const handleApproveAll = async () => {
    for (const char of characters) {
      await addCharacter({
        project_id: activeProject.id,
        name: str(char, 'name') || 'Tanpa Nama',
        role: role(char),
        description: str(char, 'description'),
        voice_dna: {},
        activation_keys: [],
        priority: 5,
        is_locked: false,
        genesis: 'AUTO_EXTRACTED'
      })
    }

    for (const item of items) {
      await addItem({
        project_id: activeProject.id,
        name: str(item, 'name') || 'Tanpa Nama',
        category: itemCategory(item),
        description: str(item, 'description'),
        significance: str(item, 'significance'),
        activation_keys: [],
        current_owner: '',
        priority: 5,
        genesis: 'AUTO_EXTRACTED'
      })
    }

    for (const rule of rules) {
      await addWorldRule({
        project_id: activeProject.id,
        name: str(rule, 'name') || 'Tanpa Nama',
        category: ruleCategory(rule),
        description: str(rule, 'description'),
        priority: 5,
        activation_keys: [],
        genesis: 'AUTO_EXTRACTED'
      })
    }

    clearExtractedLore()
  }

  const totalNewEntities = characters.length + items.length + rules.length

  if (totalNewEntities === 0) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-vibe-dark-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-vibe-dark-surface/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">✨</span> Penemuan Lore Baru
            </h2>
            <button
              onClick={clearExtractedLore}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex flex-col gap-6">
            <p className="text-white/70">
              AI telah mengekstrak {totalNewEntities} entitas baru dari tulisan Anda. Apakah Anda ingin menyimpannya ke Pustaka Lore agar AI mengingatnya di bab-bab selanjutnya?
            </p>

            {characters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                  Karakter Baru
                </h3>
                {characters.map((c, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-vibe-accent">{str(c, 'name')}</h4>
                        <span className="text-xs font-mono text-vibe-accent/70 px-2 py-0.5 rounded bg-vibe-accent/10 mt-1 inline-block">
                          {role(c)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 mt-2">{str(c, 'description')}</p>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                  Item Penting Baru
                </h3>
                {items.map((item, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-lg font-bold text-emerald-400">{str(item, 'name')}</h4>
                    <span className="text-xs font-mono text-emerald-400/70 px-2 py-0.5 rounded bg-emerald-400/10 mt-1 inline-block">
                      {itemCategory(item)}
                    </span>
                    <p className="text-sm text-white/80 mt-2">
                      <span className="text-white/50">Deskripsi:</span> {str(item, 'description')}
                    </p>
                    <p className="text-sm text-white/80 mt-1">
                      <span className="text-white/50">Signifikansi:</span> {str(item, 'significance')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {rules.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                  Aturan Dunia Baru
                </h3>
                {rules.map((rule, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-lg font-bold text-purple-400">{str(rule, 'name')}</h4>
                    <p className="text-sm text-white/80 mt-2">{str(rule, 'description')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-vibe-dark-surface flex items-center justify-end gap-3">
            <button
              onClick={clearExtractedLore}
              className="px-6 py-2 rounded-xl text-white/70 hover:bg-white/10 font-medium transition-colors"
            >
              Abaikan Semua
            </button>
            <button
              onClick={handleApproveAll}
              className="px-6 py-2 rounded-xl bg-vibe-accent text-vibe-dark-bg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
              Setujui & Simpan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
