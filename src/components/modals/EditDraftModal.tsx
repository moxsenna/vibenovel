import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CharacterRole, ItemCategory, LoreCategory } from '../../types/project'

interface EditDraftModalProps {
  isOpen: boolean
  onClose: () => void
  draftType: 'character' | 'item' | 'world_rule' | 'ending' | 'mystery' | 'character_state' | string
  initialData: Record<string, unknown>
  onSave: (updatedData: Record<string, unknown>) => void
}

export const EditDraftModal: React.FC<EditDraftModalProps> = ({
  isOpen,
  onClose,
  draftType,
  initialData,
  onSave
}) => {
  // Local state holding form fields
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({ ...initialData }))
  const [jsonDraftText, setJsonDraftText] = useState(() => JSON.stringify(initialData, null, 2))
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  // Prev-prop-during-render pattern: reset form when modal opens or initialData
  // identity changes — avoids effect-driven setState that would cascade renders.
  const [lastInitialData, setLastInitialData] = useState(initialData)
  const [lastIsOpen, setLastIsOpen] = useState(isOpen)
  if (
    isOpen &&
    (initialData !== lastInitialData || isOpen !== lastIsOpen)
  ) {
    setLastInitialData(initialData)
    setLastIsOpen(isOpen)
    setFormData({ ...initialData })
  } else if (!isOpen && lastIsOpen) {
    setLastIsOpen(false)
  }

  if (!isOpen) return null

  // Helper to safely get string values
  const getStr = (key: string): string => {
    const val = formData[key]
    return typeof val === 'string' ? val : ''
  }

  // Helper to safely get number values
  const getNum = (key: string, fallback: number): number => {
    const val = formData[key]
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10)
      return isNaN(parsed) ? fallback : parsed
    }
    return fallback
  }

  // Helper to handle simple field changes
  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  // Helper for array fields (comma-separated text input mapped to string[])
  const handleArrayChange = (key: string, commaString: string) => {
    const arr = commaString
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')
    handleChange(key, arr)
  }

  // Helper to turn string[] back to comma-separated string for input display
  const getArrayString = (key: string): string => {
    const val = formData[key]
    if (Array.isArray(val)) {
      return val.join(', ')
    }
    return ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  // Category labels and icons for display
  const getCategoryMeta = () => {
    switch (draftType) {
      case 'character':
        return { label: 'Karakter', icon: 'person' }
      case 'item':
        return { label: 'Item/Pusaka', icon: 'auto_stories' }
      case 'world_rule':
        return { label: 'Aturan Dunia (Lore)', icon: 'public' }
      case 'ending':
        return { label: 'Target Ending', icon: 'flag' }
      case 'mystery':
        return { label: 'Misteri/Plot Thread', icon: 'psychology' }
      case 'character_state':
        return { label: 'Status Karakter (Chapter)', icon: 'clinical_notes' }
      default:
        return { label: 'Draf Data', icon: 'draft' }
    }
  }

  const meta = getCategoryMeta()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-stretch justify-end z-50">
        {/* Backdrop transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 cursor-default"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ x: '100%', opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="bg-surface-container-high w-full sm:w-[min(450px,92vw)] h-screen p-5 md:p-6 shadow-2xl relative inner-glow border-l border-outline-variant/30 z-10 flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest border border-outline-variant absolute top-5 right-5 cursor-pointer transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
          </button>

          {/* Header */}
          <h3 className="text-headline-sm md:text-headline-md text-on-surface mb-5 pr-10 flex items-center gap-2.5 flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">{meta.icon}</span>
            Edit Draf {meta.label}
          </h3>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-5 pb-3">

            {/* CHARACTER FORM */}
            {draftType === 'character' && (
              <>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Nama Karakter</label>
                  <input
                    type="text"
                    required
                    value={getStr('name')}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Masukkan nama karakter..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Peran Karakter</label>
                  <select
                    value={getStr('role')}
                    onChange={(e) => handleChange('role', e.target.value as CharacterRole)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md cursor-pointer"
                  >
                    <option value="PROTAGONIST">Protagonis (Utama)</option>
                    <option value="ANTAGONIST">Antagonis (Lawan)</option>
                    <option value="SUPPORTING">Pendukung</option>
                    <option value="MINOR">Minor (Sampingan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Deskripsi Karakter</label>
                  <textarea
                    rows={4}
                    value={getStr('description')}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Deskripsikan latar belakang, fisik, kepribadian..."
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                  />
                </div>
              </>
            )}

            {/* ITEM FORM */}
            {draftType === 'item' && (
              <>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Nama Item</label>
                  <input
                    type="text"
                    required
                    value={getStr('name')}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Masukkan nama item..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Kategori Item</label>
                  <select
                    value={getStr('category')}
                    onChange={(e) => handleChange('category', e.target.value as ItemCategory)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md cursor-pointer"
                  >
                    <option value="KEY_ITEM">Key Item (Penting Plot)</option>
                    <option value="WEAPON">Senjata</option>
                    <option value="MAGICAL">Benda Magis / Pusaka</option>
                    <option value="DOCUMENT">Dokumen / Petunjuk</option>
                    <option value="JEWELRY">Perhiasan</option>
                    <option value="VEHICLE">Kendaraan</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Pemilik Saat Ini (Opsional)</label>
                  <input
                    type="text"
                    value={getStr('current_owner')}
                    onChange={(e) => handleChange('current_owner', e.target.value)}
                    placeholder="Nama karakter pemilik..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Deskripsi Item</label>
                  <textarea
                    rows={3}
                    value={getStr('description')}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Bentuk fisik, asal-usul item..."
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Signifikansi Naratif</label>
                  <textarea
                    rows={2}
                    value={getStr('significance')}
                    onChange={(e) => handleChange('significance', e.target.value)}
                    placeholder="Mengapa item ini penting bagi jalannya cerita?"
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                  />
                </div>
              </>
            )}

            {/* WORLD RULE FORM */}
            {draftType === 'world_rule' && (
              <>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Nama Aturan / Elemen</label>
                  <input
                    type="text"
                    required
                    value={getStr('name')}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Contoh: Batas Energi Sihir, Hukum Kasta..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Kategori Lore</label>
                  <select
                    value={getStr('category')}
                    onChange={(e) => handleChange('category', e.target.value as LoreCategory)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md cursor-pointer"
                  >
                    <option value="MAGIC_SYSTEM">Sistem Sihir / Supranatural</option>
                    <option value="SOCIAL_RULE">Hukum / Aturan Sosial / Kasta</option>
                    <option value="GEOGRAPHY">Geografi / Wilayah Dunia</option>
                    <option value="TECHNOLOGY">Teknologi / Peradaban</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Deskripsi Aturan</label>
                  <textarea
                    rows={4}
                    value={getStr('description')}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Jelaskan secara mendalam aturan dunia ini dan cara kerjanya..."
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                  />
                </div>
              </>
            )}

            {/* ENDING FORM */}
            {draftType === 'ending' && (
              <div>
                <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Target Ending Cerita</label>
                <textarea
                  rows={8}
                  required
                  value={getStr('target_ending')}
                  onChange={(e) => handleChange('target_ending', e.target.value)}
                  placeholder="Bagaimana novel ini harus berakhir? Tulis resolusi, nasib tokoh utama, dan twist penutup..."
                  className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none leading-relaxed"
                />
              </div>
            )}

            {/* STORY CONTRACT FORM */}
            {draftType === 'story_contract' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Form Kontrak</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdvancedMode) {
                        try {
                          const parsed = JSON.parse(jsonDraftText)
                          setFormData(parsed)
                          setIsAdvancedMode(false)
                        } catch {
                          window.alert('JSON belum valid. Perbaiki error sebelum kembali ke Mode Visual.')
                        }
                      } else {
                        setJsonDraftText(JSON.stringify(formData, null, 2))
                        setIsAdvancedMode(true)
                      }
                    }}
                    className="text-label-sm text-primary hover:bg-primary/10 px-3 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isAdvancedMode ? 'view_list' : 'code'}</span>
                    {isAdvancedMode ? 'Mode Visual' : 'Mode JSON'}
                  </button>
                </div>

                {!isAdvancedMode ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Premis Utama</label>
                      <textarea
                        rows={3}
                        required
                        value={getStr('core_promise')}
                        onChange={(e) => handleChange('core_promise', e.target.value)}
                        placeholder="Premis cerita..."
                        className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Janji Pembaca (Reader Promise)</label>
                      <textarea
                        rows={3}
                        required
                        value={getStr('reader_promise')}
                        onChange={(e) => handleChange('reader_promise', e.target.value)}
                        placeholder="Apa yang dijanjikan ke pembaca..."
                        className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest space-y-4">
                      <h4 className="text-label-md font-bold text-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">movie_creation</span>
                        Kondisi Pembuka Cerita
                      </h4>
                      <div>
                        <label className="block text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">Timeline Pembuka</label>
                        <input
                          type="text"
                          value={(formData.opening_contract as Record<string, string>)?.opening_timeline || ''}
                          onChange={(e) => {
                            const oc = (formData.opening_contract as Record<string, unknown>) || {};
                            handleChange('opening_contract', { ...oc, opening_timeline: e.target.value });
                          }}
                          className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">Wajib Dimulai Dengan</label>
                        <textarea
                          rows={2}
                          value={(formData.opening_contract as Record<string, string>)?.must_start_with || ''}
                          onChange={(e) => {
                            const oc = (formData.opening_contract as Record<string, unknown>) || {};
                            handleChange('opening_contract', { ...oc, must_start_with: e.target.value });
                          }}
                          className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">Status Relasi Awal</label>
                        <input
                          type="text"
                          value={(formData.opening_contract as Record<string, string>)?.opening_relationship_state || ''}
                          onChange={(e) => {
                            const oc = (formData.opening_contract as Record<string, unknown>) || {};
                            handleChange('opening_contract', { ...oc, opening_relationship_state: e.target.value });
                          }}
                          className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Nada & Suasana (Tone)</label>
                      <textarea
                        rows={2}
                        value={(formData.tone_contract as Record<string, string>)?.description || ''}
                        onChange={(e) => {
                          const tc = (formData.tone_contract as Record<string, unknown>) || {};
                          handleChange('tone_contract', { ...tc, description: e.target.value });
                        }}
                        placeholder="Deskripsi suasana cerita..."
                        className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <textarea
                      rows={22}
                      required
                      value={jsonDraftText}
                      onChange={(e) => setJsonDraftText(e.target.value)}
                      spellCheck={false}
                      className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm font-mono resize-none leading-relaxed"
                    />
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      Mode JSON untuk edit struktur lanjutan seperti babak cerita (arcs), karakter canon, dll.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MYSTERY FORM */}
            {draftType === 'mystery' && (
              <>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Level Lapisan</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={getNum('layer_number', 1)}
                      onChange={(e) => handleChange('layer_number', parseInt(e.target.value, 10) || 1)}
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Pertanyaan Utama</label>
                    <input
                      type="text"
                      required
                      value={getStr('central_question')}
                      onChange={(e) => handleChange('central_question', e.target.value)}
                      placeholder="Contoh: Siapa pembunuh sebenarnya?"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Jawaban / Solusi Misteri</label>
                  <textarea
                    rows={3}
                    value={getStr('answer')}
                    onChange={(e) => handleChange('answer', e.target.value)}
                    placeholder="Jawaban dari misteri ini (atau plot twist-nya)..."
                    className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Membuka Misteri Berikutnya (Opsional)</label>
                  <input
                    type="text"
                    value={getStr('opens_next_question')}
                    onChange={(e) => handleChange('opens_next_question', e.target.value)}
                    placeholder="Pertanyaan misteri level selanjutnya..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
              </>
            )}

            {/* CHARACTER STATE FORM */}
            {draftType === 'character_state' && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Nama Karakter</label>
                    <input
                      type="text"
                      required
                      value={getStr('character_name')}
                      onChange={(e) => handleChange('character_name', e.target.value)}
                      placeholder="Nama Karakter..."
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Bab Berjalan</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={getNum('chapter_number', 1)}
                      onChange={(e) => handleChange('chapter_number', parseInt(e.target.value, 10) || 1)}
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">📍 Lokasi</label>
                    <input
                      type="text"
                      value={getStr('location')}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Lokasi saat ini..."
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">🎭 Keadaan Emosi</label>
                    <input
                      type="text"
                      value={getStr('emotional_state')}
                      onChange={(e) => handleChange('emotional_state', e.target.value)}
                      placeholder="Contoh: Cemas, Dendam..."
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">💊 Kondisi Fisik</label>
                    <input
                      type="text"
                      value={getStr('physical_condition')}
                      onChange={(e) => handleChange('physical_condition', e.target.value)}
                      placeholder="Contoh: Terluka, Lelah..."
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">🎯 Tujuan Aktif</label>
                    <input
                      type="text"
                      value={getStr('active_goal')}
                      onChange={(e) => handleChange('active_goal', e.target.value)}
                      placeholder="Apa yang dia kejar di bab ini?"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">⚡ Tindakan Terakhir</label>
                  <input
                    type="text"
                    value={getStr('last_action')}
                    onChange={(e) => handleChange('last_action', e.target.value)}
                    placeholder="Aksi kunci yang dia lakukan di bab ini..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">🎒 Inventaris (Pisahkan dengan Koma)</label>
                  <input
                    type="text"
                    value={getArrayString('inventory')}
                    onChange={(e) => handleArrayChange('inventory', e.target.value)}
                    placeholder="Contoh: Kunci Emas, Belati, Surat..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">🧠 State Pengetahuan (Apa yang Dia Tahu)</label>
                  <input
                    type="text"
                    value={getArrayString('knowledge_state')}
                    onChange={(e) => handleArrayChange('knowledge_state', e.target.value)}
                    placeholder="Contoh: Tahu rahasia Arini, Tahu jalan pintas..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">🤫 Rahasia (Apa yang Disembunyikan)</label>
                  <input
                    type="text"
                    value={getArrayString('secrets')}
                    onChange={(e) => handleArrayChange('secrets', e.target.value)}
                    placeholder="Contoh: Sebenarnya menyukai Budi..."
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
                  />
                </div>
              </>
            )}

            {/* Fallback field editor if unknown type */}
            {!['character', 'item', 'world_rule', 'ending', 'mystery', 'character_state'].includes(draftType) && (
              <div>
                <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Isi Data</label>
                <textarea
                  rows={6}
                  value={JSON.stringify(formData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setFormData(parsed)
                    } catch {
                      // ignore parse errors during typing
                    }
                  }}
                  placeholder="Format JSON..."
                  className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm resize-none"
                />
              </div>
            )}

            {/* Actions Buttons Footer */}
            <div className="sticky bottom-0 -mx-1 flex items-center gap-3 pt-4 border-t border-outline-variant/30 bg-surface-container-high flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface text-label-lg font-bold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl btn-gradient text-white text-label-lg font-bold cursor-pointer flex items-center justify-center gap-1.5 hover-glow"
              >
                <span className="material-symbols-outlined text-[18px]">done</span>
                Simpan & Terapkan
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
