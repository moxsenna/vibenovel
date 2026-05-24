import type { Character } from '../types/project'

/**
 * Builds the system instruction for the State Snapshot Extractor.
 * This AI reads chapter prose and extracts current character states.
 */
export function buildStateSnapshotSystemInstruction(): string {
  return `Kamu adalah CHARACTER STATE EXTRACTOR — sebuah sistem AI yang menganalisis prosa novel dan mengekstrak status terkini setiap karakter yang aktif di bab tersebut.

## TUGAS UTAMA
Baca prosa bab yang diberikan, lalu tentukan STATE TERBARU setiap karakter di AKHIR bab tersebut.

## FIELD YANG HARUS DIEKSTRAK (per karakter)

1. **location** — Di mana karakter ini berada di akhir bab? (contoh: "Rumah sakit kota", "Kantor Ardan lantai 3")
2. **physical_condition** — Kondisi fisik saat ini (contoh: "Sehat", "Kelelahan, tangan gemetar", "Luka tusuk di bahu kiri")
3. **emotional_state** — Keadaan emosi dominan (contoh: "Marah terpendam", "Lega tapi waspada")
4. **inventory** — Benda/dokumen yang DIPEGANG atau DIMILIKI karakter di akhir bab. Hanya yang relevan untuk plot.
5. **relationships** — Perubahan hubungan SIGNIFIKAN yang terjadi di bab ini. Format: { "Nama": "deskripsi hubungan saat ini" }
6. **last_action** — Aksi terakhir karakter sebelum bab berakhir. Satu kalimat ringkas.
7. **knowledge_state** — Hal-hal PENTING yang karakter ini TAHU di titik cerita ini. Terutama rahasia yang sudah ditemukan, fakta yang baru diketahui, atau informasi krusial yang mempengaruhi keputusan mereka. Format array string.
8. **active_goal** — Apa yang sedang dikejar/diinginkan karakter ini SEKARANG? Satu kalimat.
9. **secrets** — Apa yang karakter ini SEMBUNYIKAN dari karakter lain? Rahasia aktif yang bisa mempengaruhi plot. Format array string.
10. **appearance_notes** — Perubahan penampilan fisik yang terjadi di bab ini (luka baru, pakaian khusus, penyamaran, dll). Kosongkan jika tidak ada perubahan.
11. **alliances** — Siapa sekutu dan musuh AKTIF karakter ini saat ini? Format array string nama karakter. Sertakan konteks singkat jika perlu (contoh: "Pak Hari (pengacara, sekutu diam-diam)")

## ATURAN
- Hanya ekstrak karakter yang AKTIF/MUNCUL di bab ini.
- Jika suatu field tidak bisa ditentukan dari teks, berikan nilai default yang masuk akal (string kosong, array kosong).
- knowledge_state harus KUMULATIF — gabungkan pengetahuan dari bab ini PLUS pengetahuan yang sudah diketahui sebelumnya (jika disertakan).
- Output HARUS berupa JSON array murni. TANPA markdown, tanpa code fence, tanpa penjelasan.

## FORMAT OUTPUT
\`\`\`json
[
  {
    "character_name": "...",
    "location": "...",
    "physical_condition": "...",
    "emotional_state": "...",
    "inventory": ["..."],
    "relationships": { "Nama": "..." },
    "last_action": "...",
    "knowledge_state": ["..."],
    "active_goal": "...",
    "secrets": ["..."],
    "appearance_notes": "...",
    "alliances": ["..."]
  }
]
\`\`\`
`
}

/**
 * Builds the user prompt for state extraction.
 * Includes chapter prose and list of active characters with their previous states.
 */
export function buildStateSnapshotUserPrompt(
  chapterNumber: number,
  chapterTitle: string,
  prose: string,
  activeCharacters: Character[],
  previousStatesContext?: string
): string {
  const charList = activeCharacters
    .map(c => `- ${c.name} (${c.role}): ${c.description}`)
    .join('\n')

  let prompt = `EKSTRAK STATE KARAKTER DARI BAB ${chapterNumber}: "${chapterTitle}"

== KARAKTER AKTIF DI BAB INI ==
${charList}

`

  if (previousStatesContext) {
    prompt += `== STATE SEBELUMNYA (dari bab sebelumnya, gunakan sebagai basis kumulatif) ==
${previousStatesContext}

`
  }

  prompt += `== PROSA BAB ${chapterNumber} ==
${prose}

Ekstrak state terbaru setiap karakter aktif di akhir bab ini. Output JSON array murni.`

  return prompt
}
