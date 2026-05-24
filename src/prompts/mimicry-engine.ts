/**
 * Mimicry Engine Prompt — Sprint 9
 *
 * Mengekstrak fitur struktural dari sample tulisan user → JSON yang
 * jadi project-wide voice DNA. Bukan menyalin teks aslinya — hanya pola.
 *
 * Output schema (JSON):
 *   {
 *     diction: string,           // formal / casual / baku / gaul / campuran
 *     sentence_rhythm: string,   // dominan pendek / panjang / mix dengan deskripsi
 *     paragraph_density: string, // padat / longgar / variabel
 *     dialogue_style: string,    // direct / indirect / banter, ratio
 *     signature_phrasing: string,// frase / pola yang sering muncul
 *     taboo_phrasing: string,    // hal yang dihindari
 *     pace_descriptor: string,   // overall pacing description
 *     emotional_color: string    // dominant emotional palette
 *   }
 */

export const MIMICRY_MIN_LENGTH = 300

export function buildMimicrySystemInstruction(): string {
  return `Anda adalah analyst fiksi profesional. Tugas Anda menganalisis SAMPLE TULISAN dari penulis dan mengekstrak fitur struktural & gaya — BUKAN konten cerita.

Output WAJIB berupa JSON valid dengan field berikut:
{
  "diction": "string singkat — formal/casual/baku/gaul/campuran + alasan",
  "sentence_rhythm": "string singkat — dominasi panjang kalimat dan variasinya",
  "paragraph_density": "string singkat — padat/longgar/variabel",
  "dialogue_style": "string singkat — direct/indirect/banter, ratio dialog vs deskripsi",
  "signature_phrasing": "string singkat — frase atau pola yang berulang (≤3 contoh)",
  "taboo_phrasing": "string singkat — hal yang TAMPAKNYA dihindari penulis ini",
  "pace_descriptor": "string singkat — pacing overall",
  "emotional_color": "string singkat — palet emosi dominan"
}

ATURAN KRITIS:
- JANGAN pernah mengutip persis teks dari sample. Hanya deskripsi pola.
- JANGAN salin nama karakter, nama tempat, atau jalur cerita.
- Setiap field cukup 1-2 kalimat singkat.
- Output HARUS JSON valid yang bisa di-parse, tanpa markdown fence.
- JANGAN sertakan kunci di luar 8 yang ditentukan di atas.`
}

export function buildMimicryUserPrompt(sample: string): string {
  const trimmed = sample.trim()
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const warning =
    wordCount < MIMICRY_MIN_LENGTH
      ? `\n[CATATAN: Sample hanya ${wordCount} kata, di bawah minimum ${MIMICRY_MIN_LENGTH}. Hasil ekstraksi mungkin kurang akurat.]\n`
      : ''
  return `${warning}SAMPLE TULISAN PENULIS (${wordCount} kata):
"""
${trimmed}
"""

Tolong ekstrak voice DNA proyek dalam format JSON sesuai schema yang sudah ditentukan.`
}
