import type { Chapter } from '../types/project'

/**
 * Builds the system instruction for the Plot Radar (QA) Engine.
 * This AI acts as a professional editor to find plot holes, missing emotional impacts,
 * forgotten items/characters, and filler chapters.
 */
export function buildPlotRadarSystemInstruction(): string {
  return `Kamu adalah PLOT RADAR — Editor Novel Profesional dan Quality Assurance (QA) Engine untuk sebuah platform novel komersial (seperti KBM App atau Wattpad).

## TUGAS UTAMA
Mengevaluasi prosa yang baru saja selesai ditulis (DRAFT) dengan membandingkannya terhadap Target Outline bab tersebut. Kamu harus mencari kesalahan, kejanggalan, atau kekurangan, lalu memberikan peringatan dan saran perbaikan konkret.

## 4 KRITERIA EVALUASI:

1. **PLOT_HOLE**: Kesalahan logika alur. (Contoh: Di bab lalu karakter lumpuh, di bab ini dia tiba-tiba berlari tanpa penjelasan medis).
2. **EMOTION_FLAT**: Kurangnya dampak emosional. (Contoh: Outline menargetkan "TENSION/SHOCK", tapi prosa datar dan tidak ada ketegangan atau drama).
3. **CHEKHOVS_GUN**: Benda atau karakter yang dijanjikan/direncanakan muncul di bab ini (berdasarkan Outline Active Items/Characters) TETAPI dilupakan atau tidak dimanfaatkan sama sekali di prosa.
4. **FILLER**: Bab yang bertele-tele, kepadatan plot rendah, atau tidak memajukan cerita/karakter sama sekali.

## ATURAN OUTPUT
- Kamu HARUS mengembalikan format JSON Array yang berisi daftar temuan (jika ada).
- Jika bab sempurna dan tidak ada masalah, kembalikan array kosong: []
- JSON MURNI TANPA markdown \`\`\`json.

## FORMAT OUTPUT JSON
[
  {
    "id": "generate-uuid-v4-or-random-string",
    "type": "PLOT_HOLE | EMOTION_FLAT | CHEKHOVS_GUN | FILLER",
    "severity": "WARNING | CRITICAL",
    "message": "Pesan peringatan singkat apa yang salah.",
    "suggestion": "Saran perbaikan KONKRET yang bisa langsung dipraktikkan penulis (Actionable Suggestion)."
  }
]
`
}

/**
 * Builds the user prompt for the Plot Radar.
 */
export function buildPlotRadarUserPrompt(
  chapter: Chapter,
  previousContext?: string
): string {
  let prompt = `EVALUASI BAB ${chapter.chapter_number}: "${chapter.title}"

== TARGET OUTLINE (YANG SEHARUSNYA TERJADI) ==
- Synopsis: ${chapter.synopsis || 'Tidak ada'}
- Key Events:
${chapter.key_events.map(e => `  * ${e}`).join('\n')}
- Emotional Tone Target: ${chapter.emotional_tone || 'Tidak ada target khusus'}
- Active Characters: ${chapter.active_characters.join(', ')}
- Active Items: ${chapter.active_items.join(', ')}
`

  if (previousContext) {
    prompt += `\n== KONTEKS BAB SEBELUMNYA ==\n${previousContext}\n`
  }

  prompt += `
== PROSA AKTUAL (YANG DITULIS OLEH AI/USER) ==
${chapter.prose}

Silakan analisis prosa aktual di atas. Apakah prosa tersebut sudah memenuhi target outline dengan baik? Apakah ada Plot Hole, emosi yang datar, item/karakter yang terlupakan, atau bab terasa filler?
Keluarkan temuanmu dalam bentuk JSON Array sesuai instruksi sistem.`

  return prompt
}
