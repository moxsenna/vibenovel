# Rencana Implementasi: Story Logic Contract & Canon Guardrails

Dokumen ini adalah rencana perbaikan sistem VibeNovel agar kasus seperti outline
yang melanggar premis awal tidak terulang. Fokus dokumen ini adalah memperbaiki
aplikasi, bukan memperbaiki data prototype cerita tertentu.

## 1. Ringkasan Masalah

Kasus yang ditemukan:

- User memberi premis bahwa cerita dimulai dari pernikahan 5 tahun dengan suami
  miskin yang penyayang.
- Setelah kejadian ajaib, protagonis regresi ke sebelum menikah.
- Setelah regresi, protagonis memilih menikah dengan pria kaya.
- Outline yang dihasilkan justru membuka Bab 1 ketika protagonis sudah menikah
  dengan pria kaya.

Ini adalah pelanggaran canon inti, bukan sekadar variasi kreatif.

Masalah utama aplikasi:

1. Premis obrolan belum diubah menjadi canon yang terstruktur.
2. Story Compass dianggap lengkap terlalu cepat.
3. Outline Engine hanya menerima ringkasan karakter, ending, mystery, dan
   synopsis sebelumnya, bukan kontrak logika cerita.
4. Output AI langsung disimpan setelah JSON parse, tanpa validasi runtime
   terhadap canon.
5. Thinking mode membantu kualitas reasoning model, tetapi bukan pengganti
   validasi sistem.
6. Beberapa fitur memori 4-layer belum tersambung penuh ke jalur generation.

## 2. Prinsip Desain

Perbaikan tidak boleh membuat sistem khusus untuk setiap genre.

Yang dibutuhkan adalah satu kerangka generik:

```text
Premise Chat
  -> Story Contract Extraction
  -> User Approval
  -> Story Compass / Lorebook
  -> Arc Roadmap
  -> Chapter Outline
  -> Contract Validation
  -> Canon Proposal Gate, jika AI membutuhkan entitas baru
  -> Prose Generation
  -> Continuity Validation
```

Genre dan trope hanya menjadi preset yang mengisi contract, bukan membuat sistem
baru per genre.

Prinsip wajib:

- Chat bukan canon.
- Draft bukan canon.
- Data baru menjadi canon hanya setelah user approve dan persistence sukses.
- AI output tidak boleh langsung dipercaya.
- AI boleh mengusulkan canon baru, tetapi tidak boleh meng-canon-kan sendiri.
- Thinking adalah quality boost, bukan safety layer.
- Validator deterministik harus memblokir pelanggaran canon yang bisa dideteksi.
- Semua rule penting harus dapat diaudit di UI.

## 3. Story Logic Contract Universal

Tambahkan konsep baru bernama `StoryContract`.

`StoryContract` adalah kontrak logika cerita lintas genre. Ia menjelaskan janji
cerita, urutan sebab-akibat, entitas canon, dan larangan kontradiksi.

Contoh bentuk konseptual:

```ts
interface StoryContract {
  core_promise: string
  reader_promise: string
  opening_contract: OpeningContract
  narrative_mechanics: NarrativeMechanic[]
  causality_rules: CausalityRule[]
  canon_entities: CanonEntity[]
  relationship_addressing: RelationshipAddressRule[]
  arc_order: ArcStep[]
  forbidden_contradictions: ForbiddenContradiction[]
  required_reveals: RequiredReveal[]
  tone_contract: ToneContract
}
```

### 3.1 Core Promise

Janji utama cerita kepada pembaca.

Contoh:

```json
{
  "core_promise": "Seorang istri yang menyesali sikapnya belajar menghargai suami miskin penyayang dan menebus kesalahannya."
}
```

Untuk thriller, field ini tetap sama bentuknya:

```json
{
  "core_promise": "Seorang jurnalis membongkar kasus pembunuhan yang ternyata terhubung dengan keluarganya sendiri."
}
```

### 3.2 Opening Contract

Menentukan kondisi pembuka cerita.

```ts
interface OpeningContract {
  must_start_with: string
  must_not_start_with: string[]
  opening_timeline?: string
  opening_relationship_state?: string
  first_chapter_required_facts: string[]
}
```

Contoh untuk kasus regresi:

```json
{
  "must_start_with": "Timeline asli: protagonis sudah menikah 5 tahun dengan suami miskin yang penyayang.",
  "must_not_start_with": [
    "Protagonis sudah menikah dengan pria kaya.",
    "Protagonis sudah berada di timeline kedua."
  ],
  "opening_timeline": "timeline_asli",
  "first_chapter_required_facts": [
    "Suami pertama miskin tetapi penyayang.",
    "Protagonis merasa tersiksa karena kemiskinan.",
    "Konflik awal berasal dari tekanan ekonomi dan keluhan protagonis."
  ]
}
```

### 3.3 Narrative Mechanics

Mekanisme cerita khusus, tetapi formatnya generik.

```ts
interface NarrativeMechanic {
  type:
    | 'linear'
    | 'regression'
    | 'reincarnation'
    | 'transmigration'
    | 'secret_identity'
    | 'whodunit'
    | 'revenge'
    | 'slow_burn'
    | 'forced_marriage'
    | 'multi_timeline'
    | 'other'
  description: string
  trigger?: string
  constraints: string[]
}
```

Dengan format ini, aplikasi tidak perlu membuat `RegressionContract`,
`MysteryContract`, atau `RomanceContract` terpisah. Semua trope masuk sebagai
mechanic.

### 3.4 Causality Rules

Aturan sebab-akibat yang tidak boleh dilanggar.

```ts
interface CausalityRule {
  id: string
  rule: string
  applies_from_chapter?: number
  applies_until_chapter?: number
  severity: 'BLOCKER' | 'WARNING'
}
```

Contoh:

```json
{
  "id": "rich_husband_after_regression_only",
  "rule": "Protagonis baru boleh menikah dengan pria kaya setelah kejadian regresi.",
  "severity": "BLOCKER"
}
```

### 3.5 Canon Entities

Pisahkan role database dari role cerita.

Saat ini `characters.role` hanya menerima:

```text
PROTAGONIST | ANTAGONIST | SUPPORTING | MINOR
```

Itu benar untuk DB, tetapi tidak cukup untuk logika cerita.

Tambahkan `story_tags` atau simpan di contract:

```ts
interface CanonEntity {
  name: string
  entity_type: 'character' | 'item' | 'location' | 'organization'
  db_role?: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
  story_tags: string[]
  aliases: string[]
  required_presence?: {
    chapter_range: [number, number]
    reason: string
  }
}
```

Contoh:

```json
{
  "name": "Rangga Prasetya",
  "entity_type": "character",
  "db_role": "SUPPORTING",
  "story_tags": ["original_husband", "emotional_anchor", "sacrifice_source"],
  "aliases": ["Rangga", "Mas Rangga"]
}
```

### 3.6 Relationship Addressing

Sistem tidak perlu daftar nama yang dilarang. Yang lebih penting adalah sistem
memahami cara karakter saling memanggil.

Contoh:

- Istri memanggil suami dengan `Mas`, `Sayang`, atau nama kecil.
- Anak memanggil ibu dengan `Bu`, `Mama`, atau `Bunda`.
- Karyawan memanggil atasan dengan `Pak`, `Bu`, atau jabatan.
- Musuh bisa sengaja memakai nama lengkap untuk membuat dialog terasa dingin.

Tambahkan `relationship_addressing` di Story Contract:

```ts
interface RelationshipAddressRule {
  speaker: string
  addressee: string
  relationship: string
  allowed_terms: string[]
  default_term: string
  context_rules: string[]
  intimacy_stage?: string
}
```

Contoh:

```json
{
  "speaker": "Arini Puspita",
  "addressee": "Rangga Prasetya",
  "relationship": "istri ke suami",
  "allowed_terms": ["Mas", "Mas Rangga", "Sayang"],
  "default_term": "Mas",
  "context_rules": [
    "Gunakan 'Mas' untuk dialog sehari-hari.",
    "Gunakan 'Mas Rangga' saat Arini panik atau merasa bersalah.",
    "Gunakan 'Sayang' hanya setelah hubungan mereka membaik."
  ],
  "intimacy_stage": "strained_marriage_to_redemption"
}
```

Validator harus membedakan:

- `Mas` sebagai panggilan valid untuk Rangga dalam dialog Arini.
- Nama baru yang benar-benar tidak ada di canon.
- Salah ketik atau nama baru yang perlu dikonfirmasi user.

Jika model menulis nama asing yang bukan canon, sistem tidak langsung memakai
daftar "nama terlarang". Sistem mencoba resolve dulu:

1. Apakah ini alias canon?
2. Apakah ini panggilan relasional yang valid?
3. Apakah ini karakter baru yang perlu approval?
4. Jika tidak bisa di-resolve, munculkan warning `UNKNOWN_ENTITY`.

### 3.7 Arc Order

Urutan besar cerita.

```ts
interface ArcStep {
  id: string
  label: string
  chapter_range?: [number, number]
  required_events: string[]
  forbidden_events: string[]
}
```

Contoh:

```json
[
  {
    "id": "original_poor_marriage",
    "label": "Kehidupan awal dengan suami miskin",
    "chapter_range": [1, 10],
    "required_events": [
      "Tunjukkan suami pertama penyayang.",
      "Tunjukkan tekanan ekonomi.",
      "Tunjukkan protagonis mulai menekan suami."
    ],
    "forbidden_events": [
      "Protagonis sudah menikah dengan pria kaya."
    ]
  },
  {
    "id": "regression_trigger",
    "label": "Kejadian ajaib dan regresi",
    "chapter_range": [11, 15],
    "required_events": [
      "Pertemuan dengan pria tua misterius.",
      "Protagonis kembali ke masa sebelum menikah."
    ],
    "forbidden_events": []
  }
]
```

## 4. Perubahan Alur Co-Author

### 4.1 Alur Baru

Alur lama:

```text
User premise
  -> Co-Author ajukan character / ending / mystery
  -> Story Compass dianggap lengkap
  -> Generate outline
```

Alur baru:

```text
User premise
  -> Co-Author mengekstrak Story Contract
  -> User approve / edit Story Contract
  -> Co-Author mengisi Story Compass berdasarkan contract
  -> User approve elemen penting
  -> Generate Arc Roadmap
  -> User approve roadmap
  -> Generate chapter outline
```

### 4.2 Draft Type Baru

Tambahkan draft type:

```ts
type DraftType =
  | 'story_contract'
  | 'character'
  | 'item'
  | 'world_rule'
  | 'ending'
  | 'mystery'
  | 'character_state'
```

### 4.3 Prompt Co-Author

Prompt Co-Author harus memiliki fase baru:

- Jika premise mentah baru masuk, jangan langsung ajukan karakter.
- Ekstrak dulu:
  - core promise
  - opening contract
  - narrative mechanics
  - causality rules
  - arc order kasar
  - canon entities yang disebut user
- Minta user approve Story Contract.

### 4.4 Guard Progress

`Story Compass` tidak boleh dianggap complete jika:

- `story_contract` belum ada.
- `narrative_constitution` kosong.
- opening contract kosong.
- protagonist belum ada.
- primary opposition belum ada.
- target ending belum ada.
- minimal satu retention driver belum ada: mystery, revenge objective,
  romance tension, investigation question, survival goal, atau equivalent.

## 5. Penyimpanan Data

Keputusan: gunakan kolom JSONB khusus. Story Contract tidak disimpan di
`narrative_constitution` agar tidak bercampur dengan teks bebas.

Tambahkan:

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS story_contract JSONB NOT NULL DEFAULT '{}'::jsonb;
```

Alasan:

- Struktur jelas.
- Validator mudah memakai field.
- UI bisa render per section.
- Story Contract bisa berkembang tanpa menambah banyak kolom baru.
- `narrative_constitution` tetap dipakai sebagai ringkasan naratif manusiawi,
  sedangkan `story_contract` menjadi sumber kebenaran mesin.

Perubahan ini adalah keputusan arsitektur, jadi `architecture.md` wajib
diupdate sebelum implementasi schema.

## 6. Outline Engine Baru

### 6.1 Dua Tahap Generation

Jangan langsung generate detail bab dari Story Compass.

Tahap 1: Arc Roadmap

```text
StoryContract + StoryCompass
  -> ArcRoadmap
```

Tahap 2: Chapter Outline

```text
StoryContract + ArcRoadmap + previous outlines
  -> ChapterOutline
```

### 6.2 ArcRoadmap Schema

```ts
interface ArcRoadmap {
  total_chapters: number
  arcs: ArcStep[]
  chapter_intents: ChapterIntent[]
}

interface ChapterIntent {
  chapter_number: number
  arc_id: string
  purpose: string
  required_facts: string[]
  forbidden_facts: string[]
  required_characters: string[]
  allowed_timeline?: string
  reveal_permissions: string[]
}
```

### 6.3 Chapter Outline Prompt

Outline prompt harus menyertakan:

- Story Contract lengkap.
- Chapter Intent untuk bab yang sedang dibuat.
- Daftar karakter canon.
- Relationship addressing map, termasuk panggilan seperti `Mas`, `Sayang`,
  `Bu`, `Pak`, nama kecil, dan panggilan formal.
- Timeline yang diizinkan.
- Required facts.
- Forbidden facts.
- Reveal permissions.

Jika prompt hanya mengandalkan `previousOutlineSummaries`, model mudah
menyimpang pada bab awal karena belum ada context historis.

## 7. Validator Runtime

Buat service baru:

```text
src/services/story-contract-validator.ts
```

Validator tidak perlu sempurna sejak awal. Mulai dari rule deterministik yang
murah dan jelas.

### 7.1 Validasi Draft Co-Author

Sebelum menyimpan draft:

- `character.role` harus enum valid.
- Jika role cerita custom, simpan ke `story_tags`, bukan `role`.
- Nama karakter tidak boleh duplikat.
- Nama karakter yang disetujui harus masuk Lorebook.
- Mystery breadcrumbs harus berbentuk `{ chapter, hint }[]`.
- `revealed_at_chapter` tidak boleh melebihi target chapters.

### 7.2 Validasi Outline

Sebelum menyimpan chapter outline:

- `chapterNumber` harus sama dengan request.
- `activeCharacters` harus subset dari karakter Lorebook.
- `activeItems` harus subset dari items Lorebook.
- Panggilan relasional di dialog harus bisa di-resolve ke karakter canon melalui
  `relationship_addressing`.
- Nama karakter baru yang tidak ada di Lorebook harus diklasifikasi sebagai:
  alias canon, panggilan relasional, atau `UNKNOWN_ENTITY` yang perlu approval.
- Tidak boleh melanggar opening contract.
- Tidak boleh melanggar arc order.
- Tidak boleh reveal mystery sebelum reveal chapter.
- `timeInStory` harus kompatibel dengan chapter intent.
- Bab 1 harus memenuhi `first_chapter_required_facts`.

Output:

```ts
interface StoryValidationResult {
  passed: boolean
  issues: StoryValidationIssue[]
}

interface StoryValidationIssue {
  severity: 'BLOCKER' | 'WARNING'
  code: string
  message: string
  suggestion: string
}
```

### 7.3 Retry Logic

Jika ada `BLOCKER`:

1. Jangan simpan outline.
2. Retry AI dengan prompt koreksi:

```text
Output sebelumnya melanggar Story Contract:
- [code] message

Regenerate chapter outline. Preserve valid fields where possible.
Do not violate forbidden facts.
```

3. Maksimal 2 retry.
4. Jika masih gagal, tampilkan error kepada user dan simpan log.

Jika hanya `WARNING`:

- Simpan boleh dilanjutkan.
- Tampilkan warning chip di ChapterOutlineCard.

### 7.4 Canon Proposal Flow

Tujuan: sistem tetap menolak canon liar, tetapi tidak mematikan fleksibilitas
cerita ketika bab memang membutuhkan karakter/item/lokasi baru.

Prinsip:

- Karakter baru tidak boleh otomatis masuk Lorebook.
- AI boleh menyatakan kebutuhan canon baru.
- User harus approve/edit/reject sebelum canon baru dipakai.
- Jika user reject, generator harus regenerate tanpa entitas baru tersebut.
- Jika entitas baru hanya figuran sekali lewat, sistem boleh memakai deskripsi
  generik tanpa nama, misalnya `seorang tetangga`, `petugas kasir`,
  `sopir ojek`, dan tidak perlu masuk Lorebook.

#### 7.4.1 Klasifikasi Entitas Baru

Saat validator menemukan nama/entitas yang belum canon, jangan langsung
perlakukan semuanya sama. Klasifikasikan dulu:

```ts
type UnknownEntityClassification =
  | 'CANON_ALIAS'
  | 'RELATIONSHIP_ADDRESS_TERM'
  | 'GENERIC_BACKGROUND_ROLE'
  | 'NEW_CANON_REQUIRED'
  | 'ILLEGAL_HALLUCINATION'
```

Makna:

- `CANON_ALIAS`: nama itu alias dari karakter/item/lokasi canon.
- `RELATIONSHIP_ADDRESS_TERM`: kata seperti `Mas`, `Sayang`, `Bu`, `Pak`,
  `Kak`, atau nama kecil yang resolve lewat `relationship_addressing`.
- `GENERIC_BACKGROUND_ROLE`: figuran tanpa nama dan tidak membawa konsekuensi
  plot jangka panjang.
- `NEW_CANON_REQUIRED`: entitas baru memang diperlukan untuk fungsi bab.
- `ILLEGAL_HALLUCINATION`: entitas baru muncul tanpa fungsi jelas atau
  bertentangan dengan Story Contract.

#### 7.4.2 Canon Proposal Schema

Tambahkan konsep `CanonProposal`.

```ts
interface CanonProposal {
  id: string
  project_id: string
  chapter_number: number
  source: 'outline' | 'prose' | 'co_author' | 'validator'
  source_id?: string
  proposal_type: 'character' | 'item' | 'location' | 'world_rule' | 'relationship_addressing'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MERGED'
  reason: string
  evidence: string[]
  payload: Record<string, unknown>
  suggested_contract_patch?: Partial<StoryContract>
  validation_issues: StoryValidationIssue[]
  created_at: string
  resolved_at?: string
}
```

Contoh proposal karakter:

```json
{
  "proposal_type": "character",
  "reason": "Bab ini membutuhkan pemilik kontrakan untuk menekan protagonis soal tunggakan.",
  "evidence": [
    "Key event menyebut pemilik kontrakan datang menagih.",
    "Konflik ini tidak cocok diberikan ke karakter utama yang sudah ada."
  ],
  "payload": {
    "name": "Ibu Ratna",
    "role": "SUPPORTING",
    "description": "Pemilik kontrakan yang tegas dan menjadi sumber tekanan ekonomi awal.",
    "voice_dna": {
      "tone": "Galak, cepat menyela, tetapi masih realistis sebagai pemilik kontrakan."
    },
    "activation_keys": ["Ibu Ratna", "pemilik kontrakan"],
    "priority": 6,
    "genesis": "BRAINSTORMED",
    "story_tags": ["landlord", "early_pressure_source"]
  },
  "suggested_contract_patch": {
    "canon_entities": [
      {
        "name": "Ibu Ratna",
        "entity_type": "character",
        "db_role": "SUPPORTING",
        "story_tags": ["landlord", "early_pressure_source"],
        "aliases": ["Bu Ratna"]
      }
    ]
  }
}
```

#### 7.4.3 Trigger Proposal

Canon Proposal dibuat jika salah satu kondisi terjadi:

- Outline mencantumkan `activeCharacters` atau `activeItems` yang belum ada di
  Lorebook/alias canon.
- Named-entity scan menemukan nama baru di `synopsis`, `keyEvents`,
  `cliffhangerSetup`, `openThreads`, atau `foreshadowing`.
- Prose post-check menemukan nama orang/item/lokasi baru yang tidak ada di
  outline, Lorebook, alias, atau relationship addressing.
- AI Semantic Validator dengan thinking menandai issue `NEW_CANON_REQUIRED`.
- Co-Author secara eksplisit mengusulkan karakter/item/lokasi tambahan.

#### 7.4.4 Alur Outline

Alur saat generate outline:

```text
Generate Candidate Outline
  -> Deterministic Validator
  -> Entity Classifier
  -> AI Semantic Validator with Thinking
  -> if clean: save outline
  -> if NEW_CANON_REQUIRED: create CanonProposal and pause save
  -> if ILLEGAL_HALLUCINATION: retry/regenerate without entity
```

Jika `NEW_CANON_REQUIRED`:

1. Jangan simpan outline sebagai canon final.
2. Simpan candidate outline sebagai `pendingCandidate` atau simpan di
   `CanonProposal.evidence`.
3. Tampilkan `CanonProposalCard`.
4. User memilih:
   - `Setujui`: buat Lorebook entry, patch Story Contract jika perlu, lalu
     regenerate/continue outline dengan entitas baru sudah canon.
   - `Edit Dulu`: user edit payload, lalu simpan.
   - `Gabungkan`: map nama baru ke karakter/item canon yang sudah ada.
   - `Tolak`: retry outline dengan instruksi "jangan memakai entitas baru ini".

#### 7.4.5 Alur Prose

Alur saat generate prose:

```text
Generate Beat Prose
  -> Prose Entity Scan
  -> Relationship Addressing Resolver
  -> if clean: append prose
  -> if NEW_CANON_REQUIRED: hold buffer and show CanonProposalCard
  -> if ILLEGAL_HALLUCINATION: regenerate beat or ask user
```

Aturan prose:

- Strict mode: karakter bernama baru tidak boleh langsung masuk naskah final.
- Free Write mode: nama baru boleh tetap ada, tetapi tampilkan warning dan
  tawarkan `Tambahkan ke Lorebook`.
- Jika nama baru muncul hanya sekali dan bisa diganti figuran generik, prefer
  regenerate dengan deskripsi tanpa nama.
- Jika prose membutuhkan karakter baru yang sudah disetujui di outline yang sama,
  prose harus memakai Lorebook entry hasil approval, bukan membuat ulang.

#### 7.4.6 UI/UX

Tambahkan `CanonProposalCard` dengan aksi:

- `Setujui & Tambahkan`
- `Edit Dulu`
- `Gabungkan dengan Existing`
- `Regenerate Tanpa Ini`

Lokasi UI:

- Di `ChapterOutlineCard` saat outline generation terblokir.
- Di toast/side panel `Rencana Bab` untuk batch generation.
- Di Prose Writer saat beat tertahan karena nama baru.
- Di Co-Author chat jika proposal datang dari diskusi.

Copy UI harus menjelaskan dampak singkat:

```text
AI membutuhkan karakter baru untuk bab ini:
Ibu Ratna - pemilik kontrakan yang menagih tunggakan.

Karakter ini belum ada di Lorebook. Setujui agar boleh menjadi canon,
atau regenerate bab tanpa karakter ini.
```

#### 7.4.7 Persistence

Ada dua tahap implementasi.

Tahap cepat:

- Simpan proposal pending di state lokal/Zustand selama generation berlangsung.
- Candidate outline/prose tidak disimpan sampai proposal diselesaikan.
- Cocok untuk validasi konsep.

Tahap kuat:

Tambahkan tabel:

```sql
CREATE TABLE IF NOT EXISTS canon_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('outline', 'prose', 'co_author', 'validator')),
  source_id UUID,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('character', 'item', 'location', 'world_rule', 'relationship_addressing')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'MERGED')),
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_contract_patch JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

Rekomendasi:

- Mulai dari tahap cepat jika ingin mengurangi migrasi.
- Naik ke tabel `canon_proposals` jika batch generation panjang sudah sering
  dipakai, karena user bisa meninggalkan halaman saat ada proposal pending.

#### 7.4.8 Prompt Contract

Tambahkan instruksi ke Outline Engine dan Prose Writer:

```text
Jangan menciptakan karakter bernama baru diam-diam.
Jika bab membutuhkan entitas baru:
1. Jelaskan fungsi naratifnya.
2. Pastikan tidak bisa digantikan karakter canon yang sudah ada.
3. Ajukan sebagai CanonProposal.
4. Jangan simpan sebagai canon sampai user approve.
```

Untuk prose:

```text
Jika tokoh baru hanya figuran sekali lewat, gunakan deskripsi generik tanpa nama.
Contoh: "seorang tetangga", bukan "Pak Darto", kecuali Pak Darto akan menjadi canon.
```

#### 7.4.9 Guardrail Agar Tidak Kebanyakan Proposal

Tambahkan batas:

- Maksimal 2 proposal canon baru per chapter generation.
- Jika lebih dari 2, AI harus regenerate dengan memakai karakter existing atau
  figuran generik.
- Validator harus bertanya "apakah fungsi ini bisa dipenuhi karakter existing?"
  sebelum membuat proposal.
- Proposal nama yang mirip karakter existing harus diarahkan ke `MERGED`, bukan
  entry baru.

#### 7.4.10 Contoh Kasus

Kasus A: nama liar tanpa fungsi

```text
Outline Bab 1 tiba-tiba menyebut Tono sebagai suami Arini.
```

Hasil:

- Klasifikasi: `ILLEGAL_HALLUCINATION`.
- Aksi: block + retry.
- Tidak ada proposal, karena fungsi suami sudah dipenuhi Rangga/Adrian sesuai
  Story Contract.

Kasus B: karakter baru memang perlu

```text
Bab 5 membutuhkan pemilik kontrakan yang menagih tunggakan.
```

Hasil:

- Klasifikasi: `NEW_CANON_REQUIRED`.
- Aksi: tampilkan proposal `Ibu Ratna`.
- User approve sebelum masuk Lorebook.

Kasus C: figuran sekali lewat

```text
Prose butuh kasir minimarket yang hanya menyerahkan struk.
```

Hasil:

- Klasifikasi: `GENERIC_BACKGROUND_ROLE`.
- Aksi: gunakan `kasir itu`, tidak perlu nama dan tidak masuk Lorebook.

## 8. Thinking Mode: Posisi yang Benar

Thinking mode tetap berguna, tetapi harus diposisikan benar. Dalam rencana ini,
thinking tidak hanya dipakai untuk generation reasoning, tetapi juga dipakai
untuk validator semantik berbasis AI. Namun, validator deterministik tetap
menjadi gate pertama.

### 8.1 Masalah Saat Ini

- Co-Author tidak memakai thinking.
- Deep Outline single regenerate default ON.
- Deep Outline batch default OFF.
- Deep Think prose batch default OFF.
- Thought summary outline dibuang.
- Tidak ada evaluator yang memakai thought sebagai audit.

### 8.2 Perbaikan

- Tambahkan indikator jelas ketika batch memakai thinking atau tidak.
- Untuk `ArcRoadmap` dan `StoryContract Extraction`, gunakan thinking default ON.
- Untuk batch outline, jika target batch kecil, tawarkan thinking ON secara default.
- Untuk batch besar, tampilkan estimasi waktu dan biaya.
- Jangan gunakan thought sebagai sumber canon.
- Gunakan validator deterministik sebagai gate pertama.
- Tambahkan AI Semantic Validator dengan thinking untuk mendeteksi pelanggaran
  yang sulit ditangkap rule sederhana, seperti urutan emosi yang salah,
  relasi yang berubah tanpa sebab, atau chapter intent yang dipenuhi secara
  dangkal tetapi melanggar janji cerita.

### 8.3 Validator Berlapis

Validator berjalan dalam dua lapis:

```text
AI Output
  -> Deterministic Validator
  -> AI Semantic Validator with Thinking
  -> Save / Retry / Block
```

Lapis 1: Deterministic Validator

- Cepat.
- Murah.
- Tidak memakai model.
- Cocok untuk enum, schema, chapter number, active character, timeline,
  required facts, reveal chapter, dan relationship addressing yang eksplisit.

Lapis 2: AI Semantic Validator with Thinking

- Memakai `thinkingBudget` default ON.
- Input: Story Contract, Chapter Intent, output outline/prose, dan hasil
  deterministic validator.
- Output wajib JSON issue list.
- Thought summary tidak disimpan sebagai canon.
- Yang dipakai aplikasi hanya final JSON verdict.

Contoh output:

```json
{
  "passed": false,
  "issues": [
    {
      "severity": "BLOCKER",
      "code": "OPENING_PROMISE_VIOLATION",
      "message": "Bab 1 membuka cerita di timeline kedua, padahal opening contract meminta timeline asli.",
      "suggestion": "Regenerate Bab 1 dari pernikahan miskin timeline asli."
    }
  ]
}
```

Prinsip penting:

- AI validator boleh membantu membaca makna.
- AI validator tidak boleh menciptakan canon baru.
- Jika AI validator ingin menambah asumsi, itu harus menjadi draft untuk user,
  bukan langsung masuk Story Contract.

## 9. Memory System 4-Layer: Perbaikan Wiring

Arsitektur menyebut 4-layer memory, tetapi implementasi belum tersambung penuh.

### 9.1 Masalah

- `context-injector.ts` hampir tidak dipakai oleh jalur prose utama.
- `buildProseInput()` membuat `characterStates`, tetapi prompt prose tidak
  memasukkan field `characterStates`.
- RAG chapter summaries tidak dipakai di jalur prose utama.
- Batch generator menjalankan state snapshot sebagai background fire-and-forget,
  sehingga bab berikutnya bisa mulai sebelum state sebelumnya tersedia.

### 9.2 Perbaikan

- Masukkan `characterStates` ke `buildProseUserPrompt()`.
- Gunakan `contextInjector.pruneAndInjectWithRag()` di `buildProseInput()` atau
  service orchestration sebelum prose generation.
- Untuk batch prose, await state snapshot minimal sebelum lanjut ke bab berikutnya.
- Jika state snapshot gagal, lanjut boleh dilakukan hanya dengan warning eksplisit.
- RAG tidak perlu untuk bab awal, tetapi wajib tersedia untuk bab panjang setelah
  summary mulai ada.

## 10. UI/UX Perubahan

### 10.1 Story Contract Review

Tambahkan panel review setelah user memberikan premis:

- Core Promise
- Opening Contract
- Narrative Mechanics
- Causality Rules
- Arc Order
- Canon Entities
- Relationship Addressing
- Forbidden Contradictions

User bisa edit field sebelum approve.

### 10.2 Story Compass Status

Ubah progress dari 5/5 menjadi lebih jujur:

```text
Foundation:
- Story Contract
- Protagonist
- Primary Opposition
- Emotional Anchor / Key Relationship
- Target Ending
- Retention Driver
```

`Emotional Anchor / Key Relationship` penting karena banyak cerita komersial
tidak cukup dijelaskan oleh protagonist + antagonist.

### 10.3 Outline Warning

Di Season Architect:

- Tampilkan apakah Story Contract sudah approved.
- Tampilkan apakah Arc Roadmap sudah approved.
- Tampilkan apakah AI teliti aktif untuk batch.
- Tampilkan validation warnings di setiap ChapterOutlineCard.

## 11. File-Level Plan

### Phase 1: Types & Contract Model

Files:

- `src/types/project.ts`
- `src/services/story-contract-validator.ts`
- `src/prompts/story-contract.ts`
- `src/lib/compassProgress.ts`

Tasks:

- Tambah tipe `StoryContract`.
- Tambah tipe `RelationshipAddressRule`.
- Tambah tipe validation result.
- Tambah draft type `story_contract`.
- Update compass progress agar contract wajib.

### Phase 2: Co-Author Contract Extraction

Files:

- `src/prompts/brainstorm-agent.ts`
- `src/services/ai/types.ts`
- `src/services/ai/ai-router.ts`
- `src/store/useChatStore.ts`
- `src/components/modals/EditDraftModal.tsx`

Tasks:

- Tambah prompt fase Story Contract.
- Parse draft `story_contract`.
- Render modal edit untuk story contract.
- Simpan hanya setelah persistence sukses.
- Normalisasi role custom ke `story_tags`.

### Phase 3: Persistence

Files:

- `architecture.md`
- `supabase/schema.sql`
- `src/lib/database.types.ts`
- `src/store/parts/projects.ts`

Tasks:

- Update arsitektur terlebih dahulu.
- Tambah kolom `story_contract JSONB`.
- Update type DB.
- Load/save story contract.

### Phase 4: Arc Roadmap

Files:

- `src/prompts/arc-roadmap.ts`
- `src/services/ai/ai-router.ts`
- `src/store/parts/outlines.ts`
- `src/components/workspace/SeasonArchitectPanel.tsx`

Tasks:

- Generate roadmap sebelum chapter outline.
- User approve roadmap.
- Store roadmap di project atau table baru.
- Chapter outline wajib memakai chapter intent dari roadmap.

### Phase 5: Outline Validation

Files:

- `src/services/story-contract-validator.ts`
- `src/store/parts/outlines.ts`
- `src/components/workspace/ChapterOutlineCard.tsx`

Tasks:

- Validate outline sebelum save.
- Jalankan deterministic validator.
- Jalankan AI semantic validator dengan thinking untuk kasus semantik.
- Retry jika blocker.
- Simpan warning di `qa_logs` atau field baru khusus outline validation.
- Tampilkan warning/blocker di UI.

### Phase 6: Canon Proposal Flow

Files:

- `src/types/project.ts`
- `src/services/story-contract-validator.ts`
- `src/services/canon-proposal-service.ts`
- `src/services/entity-scanner.ts`
- `src/store/parts/outlines.ts`
- `src/hooks/useBeatWriter.ts`
- `src/components/workspace/CanonProposalCard.tsx`
- `src/components/workspace/ChapterOutlineCard.tsx`
- `src/components/workspace/ProseWriterPanel.tsx`
- Optional DB phase: `supabase/schema.sql`, `src/lib/database.types.ts`

Tasks:

- Tambah tipe `CanonProposal`.
- Tambah entity scanner untuk outline/prose.
- Tambah classifier `UnknownEntityClassification`.
- Jika `NEW_CANON_REQUIRED`, pause save dan tampilkan proposal.
- Jika user approve, buat Lorebook entry dan patch Story Contract bila perlu.
- Jika user merge, map entitas baru ke canon existing/alias.
- Jika user reject, regenerate tanpa entitas baru.
- Bedakan strict mode dan free write mode untuk prose.
- Batasi maksimal 2 proposal canon baru per chapter.

### Phase 7: Prose Memory Wiring

Files:

- `src/services/prose-context.ts`
- `src/prompts/prose-writer.ts`
- `src/services/batch-generator.ts`
- `src/hooks/useBeatWriter.ts`

Tasks:

- Masukkan character state context ke prompt.
- Gunakan context injector dan RAG.
- Await state snapshot di batch sebelum chapter berikutnya.
- Pastikan prose tidak menulis karakter/item yang tidak ada di outline kecuali
  user sedang free write.

### Phase 8: QA & Regression Tests

Files:

- Tambah test runner jika belum ada.
- `src/services/story-contract-validator.test.ts`
- `src/lib/compassProgress.test.ts`

Tasks:

- Test opening contract.
- Test role normalization.
- Test relationship addressing, misalnya `Mas` resolve ke suami yang benar.
- Test unknown entity detection untuk nama baru yang belum ada di Lorebook.
- Test `NEW_CANON_REQUIRED` membuat proposal, bukan save otomatis.
- Test `ILLEGAL_HALLUCINATION` retry/regenerate tanpa proposal.
- Test free write memberi warning, bukan block keras.
- Test mystery breadcrumb shape.
- Test chapter intent validation.
- Test story contract required before outline.

## 12. Acceptance Criteria

Perbaikan dianggap berhasil jika:

1. User memberi premis kompleks, aplikasi mengekstrak Story Contract dan meminta
   approval sebelum outline.
2. Story Compass tidak bisa complete jika contract belum approved.
3. Outline Bab 1 tidak bisa tersimpan jika melanggar opening contract.
4. Karakter dengan story role custom tetap tersimpan dengan DB role valid dan
   story tags.
5. Panggilan seperti `Mas`, `Sayang`, `Bu`, atau `Pak` bisa di-resolve ke
   karakter yang tepat berdasarkan `relationship_addressing`.
6. Nama karakter baru yang belum ada di Lorebook ditandai sebagai
   `UNKNOWN_ENTITY` dan butuh approval, bukan otomatis menjadi canon.
7. Jika nama baru memang dibutuhkan, sistem membuat `CanonProposal` dengan
   alasan, evidence, payload, dan opsi approve/edit/merge/reject.
8. Jika nama baru hanya halusinasi, sistem retry/regenerate tanpa membuat
   proposal.
9. Jika prose strict mode membuat nama baru, buffer ditahan sampai user approve
   atau regenerate.
10. Jika free write mode membuat nama baru, sistem memberi warning dan tawaran
   `Tambahkan ke Lorebook`, bukan block keras.
11. Breadcrumb mystery invalid tidak masuk database.
12. Batch outline menunjukkan apakah thinking aktif.
13. AI semantic validator dengan thinking menghasilkan JSON issue list untuk
   pelanggaran makna yang tidak tertangkap validator deterministik.
14. Prose prompt menerima Layer 2 character state.
15. Batch prose tidak melanjutkan ke bab berikutnya tanpa state snapshot atau
   warning eksplisit.
16. Semua perubahan lolos:

```bash
npx tsc -b --noEmit
npm run build
```

## 13. Risiko dan Mitigasi

### Risiko: Terlalu banyak validasi membuat AI terasa kaku

Mitigasi:

- Bedakan `BLOCKER` dan `WARNING`.
- Hanya blocker untuk pelanggaran canon fatal.
- Warning untuk variasi kreatif yang masih aman.

### Risiko: Story Contract terasa menambah langkah

Mitigasi:

- Buat review UI ringkas.
- Auto-fill dari premis.
- User hanya perlu approve/edit, bukan mengisi manual dari nol.

### Risiko: Token prompt membengkak

Mitigasi:

- Kirim contract ringkas ke Outline Engine.
- Kirim only relevant chapter intent.
- Kirim full contract hanya untuk roadmap generation.

### Risiko: Banyak schema change

Mitigasi:

- Mulai dengan satu kolom JSONB.
- Hindari table baru sampai pola stabil.

### Risiko: Canon Proposal membuat generation sering berhenti

Mitigasi:

- Jangan propose untuk figuran sekali lewat.
- Batasi maksimal 2 proposal per chapter.
- Selalu cek apakah karakter existing bisa memenuhi fungsi yang sama.
- Untuk batch panjang, kumpulkan proposal sebagai review queue jika user memilih
  mode semi-otomatis.

### Risiko: AI sengaja "malas" memakai karakter existing dan sering minta baru

Mitigasi:

- Prompt harus memerintahkan reuse karakter existing lebih dulu.
- AI Semantic Validator wajib menjawab pertanyaan: "apakah entitas baru ini
  benar-benar tidak bisa diganti karakter canon?"
- Proposal dengan fungsi duplikat harus diarahkan ke `MERGED`.

## 14. Prioritas Implementasi

Urutan prioritas:

1. Story Contract type + extraction prompt.
2. Story Contract approval UI.
3. Compass guard wajib contract.
4. Outline validator untuk blocker dasar.
5. Role/story tag normalization.
6. Canon Proposal Flow untuk unknown entity yang memang dibutuhkan.
7. Arc Roadmap.
8. Prose memory wiring.
9. RAG integration penuh.

Paling penting untuk mencegah kasus yang sama:

- Opening Contract.
- Causality Rules.
- Active character validation.
- Relationship addressing resolution.
- Unknown entity detection.
- Canon Proposal approval gate.
- Block save on validation blocker.

## 15. Catatan Penting

Jangan membuat sistem khusus per genre. Buat satu `StoryContract` universal.

Genre blueprint hanya mengisi default:

- trope umum,
- tone,
- common arc shape,
- suggested retention driver,
- common character archetypes.

User premise tetap menjadi sumber kebenaran utama setelah diekstrak,
di-review, dan di-approve sebagai Story Contract.
