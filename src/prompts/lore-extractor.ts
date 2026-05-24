import type { Character, Item, WorldRule } from '../types/project'

/**
 * Builds the system instruction for the Lore Extractor Engine.
 * This AI extracts new entities (Characters, Items, Rules) from prose
 * that do not yet exist in the project's Lorebook.
 */
export function buildLoreExtractorSystemInstruction(): string {
  return `Kamu adalah LORE EXTRACTOR — sebuah sistem AI cerdas yang membaca teks prosa cerita dan mengekstrak entitas-entitas penting (Karakter, Item, Aturan Dunia/World Rules) yang BARU saja diperkenalkan atau ditemukan di dalam teks tersebut.

## TUGAS UTAMA
Bandingkan Pustaka Lore (Entitas yang sudah ada) dengan teks prosa bab terbaru. Ekstrak HANYA Karakter, Item, atau Aturan Dunia yang BARU muncul dan BELUM tercatat di Pustaka Lore.

## ATURAN EKSTRAKSI
- JANGAN mengekstrak karakter figuran yang numpang lewat tanpa nama/signifikansi (misal: "seorang pelayan", "supir taksi").
- Hanya ekstrak jika entitas tersebut berpotensi penting bagi plot.
- Tentukan 'role' untuk karakter (PROTAGONIST, ANTAGONIST, SUPPORTING, MINOR).
- Tentukan 'category' untuk item (WEAPON, MAGICAL, DOCUMENT, JEWELRY, VEHICLE, KEY_ITEM, OTHER).
- JANGAN mengembalikan entitas yang namanya sudah ada di Pustaka Lore (abaikan perbedaan huruf besar/kecil ringan).

## ATURAN OUTPUT
- Output HARUS berupa JSON Array murni.
- TANPA markdown \`\`\`json.
- Kembalikan array kosong [] jika tidak ada entitas baru.

## FORMAT OUTPUT JSON
{
  "new_characters": [
    {
      "name": "Nama Karakter Baru",
      "role": "SUPPORTING | MINOR | ANTAGONIST",
      "description": "Deskripsi singkat sifat dan penampilannya berdasarkan teks"
    }
  ],
  "new_items": [
    {
      "name": "Nama Benda Penting Baru",
      "category": "KEY_ITEM | WEAPON | MAGICAL | DOCUMENT | JEWELRY | VEHICLE | OTHER",
      "description": "Deskripsi benda tersebut",
      "significance": "Kenapa benda ini penting di bab ini?"
    }
  ],
  "new_rules": [
    {
      "name": "Aturan Dunia / Konsep Baru",
      "category": "MAGIC_SYSTEM | SOCIAL_RULE | GEOGRAPHY | TECHNOLOGY | OTHER",
      "description": "Penjelasan aturan/konsep tersebut"
    }
  ]
}
`
}

/**
 * Builds the user prompt for Lore Extractor.
 */
export function buildLoreExtractorUserPrompt(
  prose: string,
  existingCharacters: Character[],
  existingItems: Item[],
  existingRules: WorldRule[]
): string {
  const charList = existingCharacters.map(c => c.name).join(', ') || 'Tidak ada'
  const itemList = existingItems.map(i => i.name).join(', ') || 'Tidak ada'
  const ruleList = existingRules.map(r => r.name).join(', ') || 'Tidak ada'

  return `== PUSTAKA LORE SAAT INI (JANGAN EKSTRAK INI LAGI) ==
Karakter yang sudah ada: ${charList}
Item yang sudah ada: ${itemList}
Aturan/Konsep yang sudah ada: ${ruleList}

== TEKS PROSA BARU ==
${prose}

Silakan ekstrak entitas BARU (Karakter, Item, Aturan Dunia) yang ada di dalam prosa di atas, tetapi BELUM terdaftar di Pustaka Lore. Keluarkan dalam format JSON sesuai instruksi sistem.`
}
