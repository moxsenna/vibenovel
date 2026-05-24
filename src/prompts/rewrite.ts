/**
 * Director's Cut + Inline Edit Prompts
 *
 * Two surgical-rewrite flows:
 *   • Director's Cut — generate one of three variants (Tighter, Emotional,
 *     Dramatic) for an arbitrary selection. Sequential streaming so users can
 *     stop early once they're happy.
 *   • Inline Edit — single rewrite driven by a free-form instruction. Uses
 *     the cheaper Gemini Flash Lite model since selections are usually short.
 */

import type { Character } from '../types/project'

export type DirectorsCutVariant = 'tighter' | 'emotional' | 'dramatic'

const KBM_BASE = `
Kamu adalah editor prosa untuk novel KBM (paragraf pendek, dialog-heavy,
emosi melodrama). Saat menulis ulang, JAGA voice DNA karakter dan jangan
menambahkan adegan baru — hanya ubah cara kalimat-kalimat eksisting
disampaikan.
`.trim()

const VARIANT_DIRECTIVE: Record<DirectorsCutVariant, string> = {
  tighter: `
Variant: TIGHTER.
- Pangkas kata-kata yang tidak perlu, kalimat panjang dipotong jadi lebih
  ritmis.
- Pertahankan SEMUA informasi & subteks penting.
- Hasil akhir lebih punchy dan cepat dibaca, ideal untuk web novel.
`.trim(),
  emotional: `
Variant: EMOTIONAL.
- Tambah lapisan emosi internal & sensorik (denyut jantung, dada sesak,
  napas memendek).
- Dialog jadi lebih rentan, lebih pelan, lebih dalam.
- Pertahankan plot persis sama.
`.trim(),
  dramatic: `
Variant: DRAMATIC.
- Naikkan stakes & taruhan emosi. Pakai cliffhanger micro di tengah scene
  bila masuk akal.
- Boleh perpanjang kalimat klimaks demi efek, tapi jangan ubah fakta plot.
- Bayangkan akhir adegan menggantung pada satu kata atau satu pandangan.
`.trim()
}

export function buildDirectorsCutSystemInstruction(variant: DirectorsCutVariant): string {
  return `
${KBM_BASE}

${VARIANT_DIRECTIVE[variant]}

Output: HANYA prosa hasil rewrite, tanpa preface, tanpa markdown, tanpa
"Berikut hasilnya". Mulai langsung dengan kalimat pertama hasil rewrite.
`.trim()
}

export interface DirectorsCutInput {
  selection: string
  beatContext?: string
  characters: Character[]
  customInstruction?: string
}

export function buildDirectorsCutUserPrompt(input: DirectorsCutInput): string {
  const charBlock = input.characters.length
    ? input.characters
        .map((c) => {
          const dna = c.voice_dna && Object.keys(c.voice_dna).length > 0
            ? JSON.stringify(c.voice_dna)
            : '(default)'
          return `- ${c.name} [${c.role}] — ${c.description || '(no description)'} — voice: ${dna}`
        })
        .join('\n')
    : '(tidak ada konteks karakter)'

  return `
KONTEKS BAB:
${input.beatContext || '(tidak diberikan)'}

KARAKTER YANG TERLIBAT:
${charBlock}

${input.customInstruction ? `ARAHAN KHUSUS USER:\n${input.customInstruction}\n` : ''}

PROSA YANG AKAN DI-REWRITE:
"""
${input.selection}
"""

Tulis ulang prosa di atas sesuai variant yang ditugaskan. Output HANYA prosa
baru.
`.trim()
}

// ── Inline Edit (Magic Edit) ──────────────────────────────────────────────

export function buildInlineEditSystemInstruction(): string {
  return `
${KBM_BASE}

Kamu menerima sepotong prosa pendek dan satu instruksi singkat dari user.
Tulis ulang prosa tersebut sesuai instruksi, tanpa keluar dari plot.

Output: HANYA prosa hasil rewrite. Tanpa preface, tanpa markdown.
Pertahankan jumlah kata kira-kira sama kecuali instruksi minta lebih singkat
atau lebih panjang.
`.trim()
}

export interface InlineEditInput {
  selection: string
  instruction: string
  beatContext?: string
}

export function buildInlineEditUserPrompt(input: InlineEditInput): string {
  return `
KONTEKS BAB (untuk referensi voice/setting saja):
${input.beatContext || '(tidak diberikan)'}

INSTRUKSI USER:
${input.instruction}

PROSA YANG DI-REWRITE:
"""
${input.selection}
"""

Tulis ulang prosa di atas sesuai instruksi. HANYA prosa baru.
`.trim()
}
