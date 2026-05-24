/**
 * Genre Blueprints — Sprint 9
 *
 * Static library of 6 genre blueprints, each with prefilled narrative
 * constitution, theme/tone, suggested chapter counts, character archetypes
 * (with placeholder names that user renames inline), and mystery skeleton.
 *
 * Storage strategy: pure TypeScript const, no DB. Zero migration cost,
 * easy to maintain, edit by editing this file + redeploying.
 *
 * User flow:
 *   1. Lobby → "Pakai Blueprint" → BlueprintSelector
 *   2. Pilih blueprint card → Preview drawer
 *   3. Inline rename placeholder names (atau skip)
 *   4. Konfirmasi → blueprint-applier insert characters + mystery_layers + project meta
 */

import type { CharacterRole, ItemCategory } from '../types/project'

// ── Types ────────────────────────────────────────────────────────────────

export interface BlueprintCharacterArchetype {
  /** Placeholder shown to user before rename (e.g. "[Nama Protagonis]"). */
  placeholder_name: string
  role: CharacterRole
  description_template: string
  /** Voice DNA hint — JSON object that gets stored as character.voice_dna. */
  voice_dna_hint: Record<string, string>
  priority: number
}

export interface BlueprintItemArchetype {
  placeholder_name: string
  category: ItemCategory
  description_template: string
  significance_template: string
  priority: number
}

export interface BlueprintMysterySkeleton {
  layer_number: number
  question_template: string
  /** Hint for breadcrumbs — chapter_number is calculated from arc_position % */
  breadcrumb_hint: string
  /** Where in the story arc the mystery typically resolves (0.0 - 1.0). */
  reveal_arc_position: number
}

export interface GenreBlueprint {
  id: string
  name: string
  emoji: string
  tagline: string
  /** Multi-paragraph narrative_constitution template. */
  narrative_constitution_template: string
  theme_and_tone: string
  suggested_chapters_min: number
  suggested_chapters_max: number
  suggested_word_count: number
  /** Suggested target_ending hint (user can edit). */
  target_ending_template: string
  /** Series hook template — drives whole-novel question. */
  series_hook_template: string
  character_archetypes: BlueprintCharacterArchetype[]
  item_archetypes: BlueprintItemArchetype[]
  mystery_layer_skeleton: BlueprintMysterySkeleton[]
  arc_pacing_hint: string
}

// ── Helper: substitute placeholder names ────────────────────────────────

/**
 * Replaces "[Nama X]" placeholders in a template string with the user's
 * custom names. The customNames map keys are placeholder strings (e.g.
 * "[Nama Protagonis]") and values are the user's chosen names.
 */
export function substituteNames(
  template: string,
  customNames: Record<string, string>
): string {
  let result = template
  for (const [placeholder, name] of Object.entries(customNames)) {
    if (!name || !name.trim()) continue
    // Escape brackets for regex
    const escaped = placeholder.replace(/[[\]]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), name)
  }
  return result
}

// ── 6 Genre Blueprints ──────────────────────────────────────────────────

export const GENRE_BLUEPRINTS: GenreBlueprint[] = [
  {
    id: 'drama-rumah-tangga',
    name: 'Drama Rumah Tangga',
    emoji: '💔',
    tagline: 'Pengkhianatan, perselingkuhan, dan keadilan keluarga',
    narrative_constitution_template: `Ini adalah novel drama rumah tangga KBM commercial. Tujuannya membuat pembaca terbawa emosi: sakit hati, marah, lega, balas dendam manis. Pacing cepat, paragraf pendek, dialog tajam.

Pilar emosional:
- Konflik utama: pengkhianatan dalam keluarga (selingkuh, anak haram, harta warisan, atau rahasia masa lalu).
- Protagonis [Nama Protagonis] adalah istri/ibu/anak yang tertindas tapi punya kekuatan diam yang akan meledak.
- Antagonis [Nama Antagonis] manipulatif dan terlihat sempurna di mata orang luar.
- Setiap 5-10 bab harus ada twist baru yang memperkuat dendam protagonis.
- Akhir cerita: protagonis menemukan jati diri + pelaku menerima konsekuensi.

KBM Retention Engine:
- Setiap bab WAJIB punya cliffhanger (DECISION/REVELATION/BETRAYAL paling sering).
- Dopamine beat tiap 3-5 bab: momen kecil di mana protagonis menang kecil-kecilan.
- False resolution di tengah cerita: pembaca pikir masalah selesai, ternyata twist baru.`,
    theme_and_tone: 'Tegang, melankolis, penuh emosi terpendam, dramatis. Dialog tajam dan deskripsi atmosfer rumah tangga.',
    suggested_chapters_min: 150,
    suggested_chapters_max: 250,
    suggested_word_count: 1500,
    target_ending_template: '[Nama Protagonis] berdiri tegak setelah kehilangan semuanya, menemukan kembali jati dirinya, dan [Nama Antagonis] menerima konsekuensi yang setimpal — bukan dengan kekerasan, tapi dengan kebenaran yang akhirnya terungkap.',
    series_hook_template: 'Apakah [Nama Protagonis] akan menemukan keberanian untuk membongkar pengkhianatan [Nama Antagonis] sebelum semuanya hancur?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Istri/ibu/anak yang lembut tapi tegas. Awalnya patuh dan menerima, tapi punya garis batas yang sekali dilanggar akan memicu transformasi besar. Cerdas secara emosional, sering membaca situasi sebelum bicara.',
        voice_dna_hint: { tone: 'lembut tapi tegas', pace: 'tenang dengan ledakan emosi', signature: 'sering merefleksikan kenangan masa lalu' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Antagonis]',
        role: 'ANTAGONIST',
        description_template: 'Manipulatif, karismatik di luar, dingin di dalam. Tampak sempurna di mata orang luar — keluarga, tetangga, kolega. Punya rahasia besar yang sengaja ditutupi sejak awal.',
        voice_dna_hint: { tone: 'manis menusuk', pace: 'terkontrol penuh', signature: 'sering menggunakan diam sebagai senjata' },
        priority: 9
      },
      {
        placeholder_name: '[Nama Pendukung Setia]',
        role: 'SUPPORTING',
        description_template: 'Sahabat lama / keluarga jauh / asisten rumah tangga yang menjadi sandaran emosional protagonis. Tahu rahasia kecil yang akan jadi kunci pembongkaran di akhir cerita.',
        voice_dna_hint: { tone: 'hangat, lugas', pace: 'cepat saat panik', signature: 'selalu membawa makanan saat menjenguk' },
        priority: 7
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Cincin Pernikahan]',
        category: 'JEWELRY',
        description_template: 'Cincin pernikahan yang awalnya simbol kasih, lalu menjadi simbol pengkhianatan saat kebenaran terungkap.',
        significance_template: 'Akan dilepas oleh [Nama Protagonis] di momen klimaks sebagai deklarasi kebebasan.',
        priority: 9
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Siapa sebenarnya [Nama Antagonis] di balik wajah sempurnanya?',
        breadcrumb_hint: 'Telepon misterius di malam hari, parfum tidak dikenal di kerah baju, jadwal kerja yang tidak konsisten.',
        reveal_arc_position: 0.45
      },
      {
        layer_number: 2,
        question_template: 'Apa peran sebenarnya [Nama Pendukung Setia] dalam pernikahan ini?',
        breadcrumb_hint: 'Ekspresi yang tidak konsisten, pengetahuan yang terlalu detail tentang rahasia keluarga.',
        reveal_arc_position: 0.75
      }
    ],
    arc_pacing_hint: 'Setup 15% — Inciting twist 25% — Mid betrayal reveal 45% — False resolution 55% — Crisis/dark night 70% — Confrontation 85% — Justice ending 95%'
  },

  {
    id: 'romance-office',
    name: 'Romance Office',
    emoji: '💼',
    tagline: 'CEO arogan, asisten cerdas, benci-jadi-cinta',
    narrative_constitution_template: `Ini adalah novel romance office KBM premium. Tujuannya: bikin pembaca senyum-senyum sendiri, gemes, dan baper. Tegang seksi, manis, kaya kelas atas.

Pilar emosional:
- [Nama Protagonis] adalah karyawan/asisten cerdas yang awalnya menderita di bawah CEO arogan.
- [Nama Antagonis] sebenarnya bukan villain tapi rival cinta atau ex yang ngancem hubungan.
- "[Nama Pasangan]" adalah CEO/bos yang dingin tapi diam-diam jatuh cinta.
- Slow burn: tegang seksi, sentuhan tidak sengaja, pertukaran tatapan, sampai pengakuan di tengah hujan.
- Ending: Pasangan utama bersatu setelah salah satu mengorbankan ego/posisi.

KBM Retention Engine:
- Cliffhanger romantis: hampir-ciuman, pengakuan terputus, salah paham yang fatal.
- Dopamine beat: momen kecil sweet (pegangan tangan, bunga di meja, pesan singkat manis).
- False resolution: pembaca kira mereka putus, tapi ternyata salah paham besar.`,
    theme_and_tone: 'Manis, slow burn, tegang seksi, glamor perkantoran, banyak banter dan sarkasme.',
    suggested_chapters_min: 100,
    suggested_chapters_max: 200,
    suggested_word_count: 1500,
    target_ending_template: '[Nama Protagonis] dan [Nama Pasangan] akhirnya bersatu setelah [Nama Pasangan] mengorbankan posisi/ego untuk membela [Nama Protagonis] di depan dunia. Pernikahan / lamaran sederhana di lokasi pertama mereka bertemu.',
    series_hook_template: 'Akankah [Nama Protagonis] berhasil menembus dinding dingin [Nama Pasangan] sebelum [Nama Antagonis] merebut hatinya?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Karyawan cerdas dan pekerja keras dari latar belakang sederhana. Punya idealisme dan harga diri tinggi. Cantik tanpa sadar diri.',
        voice_dna_hint: { tone: 'cerdas, sering sarkastik', pace: 'cepat saat bekerja', signature: 'suka bercanda dengan diri sendiri di kepala' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Pasangan]',
        role: 'SUPPORTING',
        description_template: 'CEO/bos perusahaan besar. Dingin di luar tapi menyimpan luka masa lalu yang membuat sulit percaya orang. Diam-diam mengagumi etos kerja [Nama Protagonis].',
        voice_dna_hint: { tone: 'dingin berwibawa, dalam', pace: 'tegas dan terukur', signature: 'jarang bicara tapi observasinya tajam' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Antagonis]',
        role: 'ANTAGONIST',
        description_template: 'Rival cinta — bisa ex-pacar [Nama Pasangan] atau pesaing bisnis yang mengincar [Nama Pasangan] demi keuntungan. Cantik/tampan dan licin.',
        voice_dna_hint: { tone: 'manis menusuk, posesif', pace: 'lambat berhitung', signature: 'selalu tampil sempurna di publik' },
        priority: 8
      },
      {
        placeholder_name: '[Nama Sahabat]',
        role: 'SUPPORTING',
        description_template: 'Sahabat tempat curhat [Nama Protagonis], biasanya rekan kerja. Lucu, frontal, sering meledek dan memberi nasihat blakblakan.',
        voice_dna_hint: { tone: 'kocak, frontal', pace: 'cepat dan ramai', signature: 'selalu punya gosip' },
        priority: 7
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Pena Mahal]',
        category: 'KEY_ITEM',
        description_template: 'Pena mahal hadiah dari [Nama Pasangan] yang awalnya dianggap simbol arogansinya, tapi belakangan terungkap punya nilai sentimental.',
        significance_template: 'Akan menjadi tanda saat [Nama Pasangan] memberi pena ini, dia menyerahkan sesuatu yang berarti.',
        priority: 8
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Apa luka masa lalu [Nama Pasangan] yang membuatnya begitu dingin?',
        breadcrumb_hint: 'Foto lama yang disembunyikan, mimpi buruk berulang, reaksi berlebihan terhadap topik tertentu.',
        reveal_arc_position: 0.50
      },
      {
        layer_number: 2,
        question_template: 'Apa rencana sebenarnya [Nama Antagonis]?',
        breadcrumb_hint: 'Pertemuan rahasia dengan investor, pesan yang dihapus, senyum yang berbeda saat sendirian.',
        reveal_arc_position: 0.80
      }
    ],
    arc_pacing_hint: 'Hate at first sight 5% — Forced proximity 20% — Slow burn build 30-50% — First kiss/almost 55% — Mid-novel betrayal 65% — Dark night 80% — Grand gesture + reunion 95%'
  },

  {
    id: 'fantasi-kerajaan',
    name: 'Fantasi Kerajaan',
    emoji: '👑',
    tagline: 'Reinkarnasi, takhta, sihir, dan cinta abadi',
    narrative_constitution_template: `Ini adalah novel fantasi kerajaan dengan elemen reinkarnasi/transmigrasi populer di KBM. Tujuannya: imersi total ke dunia kerajaan, intrik istana, dan romansa epik.

Pilar emosional:
- [Nama Protagonis] adalah jiwa modern yang terreinkarnasi sebagai bangsawan/putri/budak di dunia kerajaan kuno, atau anak kerajaan yang hilang.
- [Nama Antagonis] adalah saingan takhta atau penyihir gelap yang mengincar [Nama Protagonis].
- [Nama Pasangan] adalah pangeran/kesatria/jenderal yang awalnya rival, lalu jadi pelindung.
- Sistem sihir / hierarki bangsawan jelas dan konsisten — pelanggaran aturan harus punya konsekuensi.
- Ending: [Nama Protagonis] mendapatkan kembali takhta yang sah / mengubah nasib kerajaan / bersatu dengan [Nama Pasangan].

KBM Retention Engine:
- Cliffhanger: pengkhianatan istana, attempted assassination, pengungkapan identitas.
- Dopamine beat: kemenangan kecil di pertarungan sihir / momen romantis di taman istana.
- False resolution: musuh tampak kalah, tapi ternyata punya rencana lebih besar.`,
    theme_and_tone: 'Epik, dramatis, romantis, penuh intrik politik dan magic system yang konsisten.',
    suggested_chapters_min: 200,
    suggested_chapters_max: 400,
    suggested_word_count: 2000,
    target_ending_template: '[Nama Protagonis] berhasil menyatukan kerajaan / merebut takhta yang sah / mematahkan kutukan keluarga, dan menikah dengan [Nama Pasangan] di puncak kuil suci. Era baru kerajaan dimulai.',
    series_hook_template: 'Bagaimana [Nama Protagonis] bisa selamat dari konspirasi istana sambil menemukan cinta sejati di dunia yang asing?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Reinkarnasi jiwa modern di tubuh bangsawan kerajaan / putri yang hilang. Memiliki pengetahuan modern yang jadi senjata di dunia kuno. Cerdas, adaptif, kadang impulsif.',
        voice_dna_hint: { tone: 'modern di pikiran, formal di lisan', pace: 'cepat saat berpikir, lambat saat bicara di istana', signature: 'sering membandingkan situasi dengan dunia modernnya' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Pasangan]',
        role: 'SUPPORTING',
        description_template: 'Pangeran/jenderal/kesatria yang awalnya menganggap [Nama Protagonis] musuh atau ancaman, lalu jadi pelindung dan kekasih. Punya kekuatan sihir/militer yang signifikan.',
        voice_dna_hint: { tone: 'tegas, formal kerajaan', pace: 'tenang dan terukur', signature: 'menggunakan istilah militer dalam percakapan biasa' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Antagonis]',
        role: 'ANTAGONIST',
        description_template: 'Saingan takhta / penyihir gelap / saudara tiri yang dengki. Memiliki sumber kekuatan yang rapuh tapi berbahaya. Karismatik dan licik di hadapan raja/ratu.',
        voice_dna_hint: { tone: 'manis berbisa, formal', pace: 'lambat menghitung', signature: 'selalu tersenyum saat mengancam' },
        priority: 9
      },
      {
        placeholder_name: '[Nama Mentor]',
        role: 'SUPPORTING',
        description_template: 'Penasihat tua / penyihir senior / pendeta yang membimbing [Nama Protagonis] memahami sihir / politik kerajaan. Tahu rahasia silsilah keluarga.',
        voice_dna_hint: { tone: 'bijak, kuno', pace: 'lambat berdeskripsi', signature: 'sering bicara dalam perumpamaan' },
        priority: 8
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Pusaka Keluarga]',
        category: 'MAGICAL',
        description_template: 'Pusaka keluarga / lambang kerajaan yang hanya bisa diaktifkan oleh keturunan sah. Sumber kekuatan utama [Nama Protagonis].',
        significance_template: 'Pusaka ini akan terungkap memiliki kekuatan tersembunyi di klimaks cerita.',
        priority: 10
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Apa identitas asli [Nama Protagonis] dalam silsilah kerajaan?',
        breadcrumb_hint: 'Mimpi tentang kehidupan lama, tanda lahir misterius, reaksi pusaka keluarga terhadapnya.',
        reveal_arc_position: 0.40
      },
      {
        layer_number: 2,
        question_template: 'Apa motif terdalam [Nama Antagonis] mengincar takhta?',
        breadcrumb_hint: 'Ritual rahasia di malam hari, bisikan dari sosok bayangan, perjanjian dengan kekuatan gelap.',
        reveal_arc_position: 0.65
      },
      {
        layer_number: 3,
        question_template: 'Bagaimana cara mematahkan kutukan kerajaan untuk menyelamatkan negeri?',
        breadcrumb_hint: 'Naskah kuno yang ditemukan [Nama Mentor], legenda yang diceritakan rakyat jelata.',
        reveal_arc_position: 0.85
      }
    ],
    arc_pacing_hint: 'Reinkarnasi/Awakening 5% — Setup dunia 15% — First conflict 25% — Identitas reveal 40% — Mid crisis 55% — Antagonis gerak 70% — Final confrontation 90% — Coronation/Wedding 100%'
  },

  {
    id: 'thriller-misteri',
    name: 'Thriller Misteri',
    emoji: '🔍',
    tagline: 'Pembunuhan, kebenaran tersembunyi, dan ras melawan waktu',
    narrative_constitution_template: `Ini adalah novel thriller misteri dengan tempo cepat. Tujuannya: bikin pembaca tidak bisa berhenti karena setiap bab membawa pertanyaan baru yang lebih besar.

Pilar emosional:
- [Nama Protagonis] adalah detektif/jurnalis/orang biasa yang terjebak dalam kasus pembunuhan/penculikan/konspirasi.
- [Nama Antagonis] adalah pelaku yang hidup di antara karakter lain — bisa saja teman, keluarga, atau kekasih.
- Setiap bab WAJIB membawa pembaca lebih dekat ke jawaban tapi juga membuka pertanyaan baru.
- Setting realistis (kota modern Indonesia) atau klasik (kota pelosok dengan rahasia tertimbun).
- Ending: pelaku terungkap dengan cara yang shock tapi masuk akal — semua breadcrumb dari awal harus konsisten.

KBM Retention Engine:
- Cliffhanger: penemuan mayat baru, ancaman langsung pada protagonis, pengungkapan identitas yang tidak disangka.
- Dopamine beat: protagonis berhasil decode satu petunjuk, momen narrow escape.
- False resolution: pelaku "sudah tertangkap" di tengah cerita, tapi ternyata masih bebas.
- Setiap detail kecil HARUS bisa di-trace ulang di akhir cerita — pembaca akan re-read mencari clue.`,
    theme_and_tone: 'Tegang, gelap, fast-paced, paranoid. Atmosfer kota / kota kecil yang menyimpan rahasia.',
    suggested_chapters_min: 80,
    suggested_chapters_max: 150,
    suggested_word_count: 1800,
    target_ending_template: '[Nama Protagonis] memecahkan kasus dengan harga personal yang besar — kehilangan orang dekat atau idealismenya. [Nama Antagonis] terungkap sebagai sosok yang paling tidak terduga, dengan motif yang mengakar pada masa lalu yang tertanam dari awal cerita.',
    series_hook_template: 'Siapa di antara orang dekat [Nama Protagonis] yang menyembunyikan rahasia mematikan?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Detektif / jurnalis / orang biasa yang terlibat tidak sengaja dalam kasus. Punya luka pribadi dari masa lalu yang membuat investigasi ini personal. Tajam, paranoid, sering tidak tidur.',
        voice_dna_hint: { tone: 'analitis, paranoid', pace: 'cepat saat berbahaya, lambat saat berpikir', signature: 'sering bicara dengan diri sendiri' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Antagonis]',
        role: 'ANTAGONIST',
        description_template: 'Pelaku sebenarnya — orang yang awalnya tampak biasa atau bahkan ramah pada [Nama Protagonis]. Memiliki kemampuan bertopeng tinggi dan motif yang berakar pada peristiwa masa lalu.',
        voice_dna_hint: { tone: 'normal di publik, dingin di privasi', pace: 'kontrol penuh', signature: 'pertanyaan-pertanyaan halus yang sebenarnya gali info' },
        priority: 9
      },
      {
        placeholder_name: '[Nama Partner]',
        role: 'SUPPORTING',
        description_template: 'Partner investigasi / sahabat / kolega yang membantu [Nama Protagonis]. Mungkin punya rahasia kecil sendiri yang awalnya tampak tidak relevan.',
        voice_dna_hint: { tone: 'kalem, pragmatis', pace: 'tenang di tengah krisis', signature: 'selalu bawa kopi' },
        priority: 8
      },
      {
        placeholder_name: '[Nama Korban Pertama]',
        role: 'MINOR',
        description_template: 'Korban pertama yang memicu seluruh kasus. Identitas dan hubungannya dengan [Nama Protagonis] akan terungkap perlahan.',
        voice_dna_hint: { tone: '-', pace: '-', signature: '-' },
        priority: 5
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Bukti Misterius]',
        category: 'KEY_ITEM',
        description_template: 'Item / dokumen / foto yang ditemukan di TKP, awalnya tampak tidak berarti tapi ternyata kunci pemecahan kasus.',
        significance_template: 'Maknanya akan terungkap di klimaks ketika [Nama Protagonis] menyatukan semua puzzle.',
        priority: 10
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Siapa pembunuh / pelaku [Nama Korban Pertama]?',
        breadcrumb_hint: 'CCTV yang rusak, alibi yang tidak konsisten, motif tersembunyi di antara orang-orang dekat korban.',
        reveal_arc_position: 0.85
      },
      {
        layer_number: 2,
        question_template: 'Apa rahasia masa lalu [Nama Protagonis] yang membuat kasus ini personal?',
        breadcrumb_hint: 'Kilas balik singkat, reaksi emosional yang berlebihan, panggilan telepon yang dihindari.',
        reveal_arc_position: 0.55
      },
      {
        layer_number: 3,
        question_template: 'Bagaimana [Nama Antagonis] terhubung dengan [Nama Protagonis] sejak awal?',
        breadcrumb_hint: 'Kebetulan-kebetulan kecil, kehadiran [Nama Antagonis] di momen-momen krusial, kenyamanan yang mencurigakan.',
        reveal_arc_position: 0.95
      }
    ],
    arc_pacing_hint: 'Pembunuhan/Hilangnya korban 1-3 — Investigation begins 5-15% — False suspect 25% — Personal stakes 40% — False resolution 55% — Threat to protagonist 70% — Final twist 85% — Truth + cost 95%'
  },

  {
    id: 'action-aksi',
    name: 'Action Aksi',
    emoji: '⚔️',
    tagline: 'Mata-mata, kontrak gelap, dan pertarungan habis-habisan',
    narrative_constitution_template: `Ini adalah novel action dengan ritme tempur tinggi. Tujuannya: adrenalin, taktik, dan loyalitas.

Pilar emosional:
- [Nama Protagonis] adalah agen / mantan tentara / pembunuh bayaran yang ditarik kembali ke dunia kekerasan oleh kontrak terakhir.
- [Nama Antagonis] adalah mantan rekan / penghianat / mafia yang punya hubungan masa lalu dengan [Nama Protagonis].
- Setiap aksi punya bobot taktis: persenjataan akurat, manuver realistis, konsekuensi luka nyata.
- Tema: pengkhianatan dalam dunia hitam, kode kehormatan, pencarian identitas.
- Ending: [Nama Protagonis] memilih antara kekerasan vs penebusan — biasanya hibrida bittersweet.

KBM Retention Engine:
- Cliffhanger: serangan tak terduga, identitas pengkhianat terungkap, anggota tim hilang.
- Dopamine beat: berhasil eksekusi misi sulit, reuni dengan rekan lama, mengalahkan musuh tangguh.
- False resolution: misi tampak selesai, tapi target ternyata umpan untuk perangkap lebih besar.`,
    theme_and_tone: 'Cepat, brutal, taktis. Banyak deskripsi aksi pendek dan tajam, dialog ringkas, atmosfer paranoid.',
    suggested_chapters_min: 80,
    suggested_chapters_max: 180,
    suggested_word_count: 1800,
    target_ending_template: '[Nama Protagonis] menyelesaikan kontrak terakhirnya tapi kehilangan sesuatu yang berharga — rekan, idealisme, atau jati diri. Memilih untuk menghilang dari dunia kekerasan, atau menjadi pelindung diam-diam.',
    series_hook_template: 'Dapatkah [Nama Protagonis] menyelesaikan kontrak terakhir tanpa kehilangan jati dirinya kepada bayang-bayang masa lalu?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Mantan agen / pembunuh bayaran / tentara elite yang ingin pensiun tapi ditarik kembali ke dunia kekerasan. Skill mematikan, kode kehormatan personal, luka batin yang dalam.',
        voice_dna_hint: { tone: 'datar, taktis', pace: 'cepat saat aksi, hening saat refleksi', signature: 'analisis kontingensi sebelum bertindak' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Antagonis]',
        role: 'ANTAGONIST',
        description_template: 'Mantan rekan / mentor yang berkhianat, atau mafia / agen musuh yang punya hubungan personal dengan [Nama Protagonis]. Skillnya setara, motifnya rumit.',
        voice_dna_hint: { tone: 'tenang sinis', pace: 'lambat saat menjelaskan rencana', signature: 'memanggil [Nama Protagonis] dengan kode lama' },
        priority: 9
      },
      {
        placeholder_name: '[Nama Rekan]',
        role: 'SUPPORTING',
        description_template: 'Partner kerja / hacker / penembak jitu yang loyal pada [Nama Protagonis]. Punya keahlian komplementer dan banyak humor gelap.',
        voice_dna_hint: { tone: 'sarkastik, profesional', pace: 'cepat dan ramai di radio', signature: 'meledek protagonis di tengah misi' },
        priority: 8
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Senjata Tanda Tangan]',
        category: 'WEAPON',
        description_template: 'Senjata khas [Nama Protagonis] yang punya nilai sentimental dari mentor lama. Identifier yang dikenal di dunia hitam.',
        significance_template: 'Akan rusak / hilang di klimaks sebagai simbol kehilangan jati diri lama.',
        priority: 9
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Siapa sebenarnya yang memberi kontrak terakhir pada [Nama Protagonis]?',
        breadcrumb_hint: 'Pembayaran via channel yang tidak dikenal, target yang aneh, pesan terenkripsi.',
        reveal_arc_position: 0.50
      },
      {
        layer_number: 2,
        question_template: 'Apa peristiwa masa lalu antara [Nama Protagonis] dan [Nama Antagonis]?',
        breadcrumb_hint: 'Kilas balik tentang misi terakhir, luka yang sama, nama-nama anggota tim yang hilang.',
        reveal_arc_position: 0.70
      }
    ],
    arc_pacing_hint: 'Pensiun palsu 5% — Kontrak datang 10% — Misi awal 20% — Reuni dengan rekan 35% — Twist klien 50% — Pengkhianat reveal 70% — Final raid 85% — Bittersweet ending 95%'
  },

  {
    id: 'slice-of-life-romance',
    name: 'Slice of Life Romance',
    emoji: '🌸',
    tagline: 'Cinta yang tumbuh perlahan dalam hari-hari biasa',
    narrative_constitution_template: `Ini adalah novel slice of life romance. Tujuannya: hangat, manis, dan menyentuh tanpa banyak drama tinggi. Pembaca datang ke novel ini untuk merasa nyaman.

Pilar emosional:
- [Nama Protagonis] dan [Nama Pasangan] adalah dua orang biasa dengan kehidupan biasa — pekerja kantor, mahasiswa, pengusaha kecil.
- Konflik bukan dari villain tapi dari kehidupan: keluarga, pekerjaan, mimpi yang bertabrakan.
- Pacing pelan, observasi detail-detail kecil yang manis.
- Ending: pasangan utama membangun hidup sederhana yang berarti.

KBM Retention Engine (lighter):
- Cliffhanger emosional ringan: pengakuan terputus, salah paham yang menyentuh.
- Dopamine beat: makan bersama, momen kecil yang berarti, reuni keluarga.
- False resolution: salah satu pihak hampir menyerah pada hubungan, tapi sadar bahwa ini yang dia mau.`,
    theme_and_tone: 'Hangat, lembut, kontemplatif. Banyak deskripsi tempat dan rasa makanan, dialog hangat dengan jeda alami.',
    suggested_chapters_min: 80,
    suggested_chapters_max: 150,
    suggested_word_count: 1500,
    target_ending_template: '[Nama Protagonis] dan [Nama Pasangan] memutuskan membangun hidup sederhana bersama — mungkin membuka kafe, pindah ke kota kecil, atau memulai keluarga. Tidak ada grand gesture, hanya kesepakatan tenang.',
    series_hook_template: 'Bisakah [Nama Protagonis] dan [Nama Pasangan] menemukan ritme hidup bersama di tengah mimpi-mimpi yang berbeda?',
    character_archetypes: [
      {
        placeholder_name: '[Nama Protagonis]',
        role: 'PROTAGONIST',
        description_template: 'Karyawan biasa / mahasiswa / pengusaha kecil yang sedang mencari makna di kehidupan sehari-hari. Reflektif, lembut, peka pada detail.',
        voice_dna_hint: { tone: 'kontemplatif, observatif', pace: 'pelan dan bermakna', signature: 'sering mendeskripsikan sensasi sehari-hari' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Pasangan]',
        role: 'SUPPORTING',
        description_template: 'Tetangga / rekan kerja / teman lama yang muncul kembali. Punya pekerjaan dan mimpinya sendiri yang kadang bertabrakan dengan [Nama Protagonis].',
        voice_dna_hint: { tone: 'hangat, jujur', pace: 'tenang', signature: 'sering bertanya hal-hal kecil tentang hari' },
        priority: 10
      },
      {
        placeholder_name: '[Nama Sahabat]',
        role: 'SUPPORTING',
        description_template: 'Sahabat lama [Nama Protagonis], ada di setiap fase hidup. Frontal, lucu, kadang menjadi suara akal sehat saat [Nama Protagonis] ragu.',
        voice_dna_hint: { tone: 'kocak, lugas', pace: 'cepat', signature: 'selalu komen pedes tapi sayang' },
        priority: 7
      },
      {
        placeholder_name: '[Nama Orang Tua]',
        role: 'SUPPORTING',
        description_template: 'Salah satu orang tua [Nama Protagonis] yang punya harapan dan tekanan halus tentang masa depan anaknya. Bukan villain, hanya generasi berbeda.',
        voice_dna_hint: { tone: 'lembut tapi keras kepala', pace: 'lambat', signature: 'sering bercerita masa muda mereka' },
        priority: 6
      }
    ],
    item_archetypes: [
      {
        placeholder_name: '[Tempat Khusus]',
        category: 'OTHER',
        description_template: 'Kafe / taman / toko kecil yang menjadi tempat pertemuan rutin [Nama Protagonis] dan [Nama Pasangan]. Sederhana tapi punya makna.',
        significance_template: 'Akan menjadi setting akhir cerita — keputusan besar dibuat di sini.',
        priority: 7
      }
    ],
    mystery_layer_skeleton: [
      {
        layer_number: 1,
        question_template: 'Apa yang sebenarnya [Nama Protagonis] cari dalam hidup?',
        breadcrumb_hint: 'Kebiasaan kecil yang berulang, nostalgia tertentu, ketidakpuasan halus pada pekerjaan.',
        reveal_arc_position: 0.65
      }
    ],
    arc_pacing_hint: 'Daily life setup 10% — Pertemuan 15% — Kedekatan tumbuh 30% — Konflik mimpi 50% — Jarak 65% — Refleksi 75% — Keputusan tenang 90% — Hidup sederhana bersama 100%'
  }
]

// ── Lookup helpers ──────────────────────────────────────────────────────

export function getBlueprintById(id: string): GenreBlueprint | undefined {
  return GENRE_BLUEPRINTS.find((b) => b.id === id)
}

export function getBlueprintByGenre(genre: string): GenreBlueprint | undefined {
  return GENRE_BLUEPRINTS.find((b) => b.name === genre)
}

/** Returns array of unique genre names from blueprints + project-defined genres. */
export function getAllGenreNames(projectGenres: string[]): string[] {
  const set = new Set<string>(GENRE_BLUEPRINTS.map((b) => b.name))
  for (const g of projectGenres) {
    if (g && g.trim()) set.add(g)
  }
  return Array.from(set).sort()
}
