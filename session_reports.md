# VibeNovel v2 — Master Session Reports

Dokumen ini berisi catatan riwayat sesi pengembangan (Session Reports) proyek VibeNovel v2, yang disusun secara kronologis (dari tertua ke terbaru) dan menggunakan standar format laporan terpadu yang rapi.

---

## 🌌 Daftar Isi & Kronologi Sesi

| No | Tanggal | Waktu / Durasi | Sesi Pengembangan | Tipe Sesi | Status |
|---|---|---|---|---|---|
| 1 | 2026-05-21 | ~15 menit | [Sprint 1C — Brainstorm Agent (Real AI)](#session-1-sprint-1c--brainstorm-agent-real-ai) | Sprint 1C | ✅ COMPLETED |
| 2 | 2026-05-21 | N/A | [Sprint 1D — Outline Engine (Real AI)](#session-2-sprint-1d--outline-engine-real-ai) | Sprint 1D | ✅ COMPLETED |
| 3 | 2026-05-22 | N/A | [Sprint 2A — Beat-by-Beat Prose Writer](#session-3-sprint-2a--beat-by-beat-prose-writer) | Sprint 2A | ✅ COMPLETED |
| 4 | 2026-05-24 | N/A | [Sprint 2B — State Tracker & Context Injection Upgrade](#session-4-sprint-2b--state-tracker--context-injection-upgrade) | Sprint 2B | ✅ COMPLETED |
| 5 | 2026-05-24 | N/A | [Refactoring — Zustand Parts Modularization (useProjectStore Refactor)](#session-5-refactoring--zustand-parts-modularization-useprojectstore-refactor) | Refactor | ✅ COMPLETED |
| 6 | 2026-05-24 | N/A | [Sprint 3A — Plot Radar & Lore Extraction](#session-6-sprint-3a--plot-radar--lore-extraction) | Sprint 3A | ✅ COMPLETED |
| 7 | 2026-05-24 | N/A | [Sprint 3B — Review Mode & PWA](#session-7-sprint-3b--review-mode--pwa) | Sprint 3B | ✅ COMPLETED |
| 8 | 2026-05-24 | N/A | [Sprint 4 — Pro Writer Features](#session-8-sprint-4--pro-writer-features) | Sprint 4 | ✅ COMPLETED |
| 9 | 2026-05-24 | N/A | [Hotfix — Model Locking & Co-Author Chat Stop/Regenerate](#session-9-hotfix--model-locking--co-author-chat-stopregenerate) | Hotfix | ✅ COMPLETED |
| 10 | 2026-05-24 | N/A | [Sprint 5 — KBM Retention Engine](#session-10-sprint-5--kbm-retention-engine) | Sprint 5 | ✅ COMPLETED |
| 11 | 2026-05-24 | N/A | [Sprint 6 — Auto-Pilot Batch Generation](#session-11-sprint-6--auto-pilot-batch-generation) | Sprint 6 | ✅ COMPLETED |
| 12 | 2026-05-24 | N/A | [Sprint 7 — Thread Tracker & RAG](#session-12-sprint-7--thread-tracker--rag) | Sprint 7 | ✅ COMPLETED |
| 13 | 2026-05-24 | N/A | [Visual Polish — Premium Themed Edit Draft Modal](#session-13-visual-polish--premium-themed-edit-draft-modal) | Visual Polish | ✅ COMPLETED |
| 14 | 2026-05-24 | N/A | [Sprint 8 — Visualization](#session-14-sprint-8--visualization) | Sprint 8 | ✅ COMPLETED |
| 15 | 2026-05-24 | N/A | [Visual Polish — Premium Themed Dialogs & Toasts Engine](#session-15-visual-polish--premium-themed-dialogs--toasts-engine) | Visual Polish | ✅ COMPLETED |
| 16 | 2026-05-24 | N/A | [Bug Fix — Story Compass Validation & Safeguards](#session-16-bug-fix--story-compass-validation--safeguards) | Bug Fix | ✅ COMPLETED |
| 17 | 2026-05-24 | N/A | [Sprint 9 — Genre Blueprints & Polish](#session-17-sprint-9--genre-blueprints--polish) | Sprint 9 | ✅ COMPLETED |
| 18 | 2026-05-24 | N/A | [Sprint 9.5 — QA Hardening](#session-18-sprint-95--qa-hardening) | Sprint 9.5 | ✅ COMPLETED |
| 19 | 2026-05-24 | N/A | [Sprint 9.6 — UX Polish (Notion-Grade Calm)](#session-19-sprint-96--ux-polish-notion-grade-calm) | Sprint 9.6 | ✅ COMPLETED |
| 20 | 2026-05-24 | N/A | [Sprint 9.7 — Deep Think Mode (Prose Writer Reasoning Engine)](#session-20-sprint-97--deep-think-mode-prose-writer-reasoning-engine) | Sprint 9.7 | ✅ COMPLETED |
| 21 | 2026-05-24 | N/A | [Sprint 9.8 — Deep Outline (Outline Generator Reasoning Engine)](#session-21-sprint-98--deep-outline-outline-generator-reasoning-engine) | Sprint 9.8 | ✅ COMPLETED |
| 22 | 2026-05-25 | N/A | [Refactor Audit Follow-up - Maintainability Hardening](#session-22-refactor-audit-follow-up---maintainability-hardening) | Refactor | ✅ Completed |
| 23 | 2026-05-25 | 12:39:39 +07:00 | [Story Contract & Canon Guardrails Implementation](#session-23-story-contract--canon-guardrails-implementation) | Feature | ✅ Completed |
| 24 | 2026-05-25 | N/A | [UX Revamp P0 - Novice Writer Entry](#session-24-ux-revamp-p0---novice-writer-entry) | UX Revamp | ✅ Completed |
| 25 | 2026-05-25 | 17:52:59 +07:00 | [Canon Proposal Flow - Unknown Entity Approval](#session-25-canon-proposal-flow---unknown-entity-approval) | Feature | ✅ Completed |
| 26 | 2026-05-25 | N/A | [UX Polish - Co-Author Auto-Advance & Story Compass](#session-26-ux-polish---co-author-auto-advance--story-compass) | UX Polish | ✅ Completed |
| 27 | 2026-05-25 | N/A | [UX Revamp P0.1 - Section Onboarding](#session-27-ux-revamp-p01---section-onboarding) | UX Revamp | ✅ Completed |
| 28 | 2026-05-25 | N/A | [Hotfix - AI Draft UI Rendering](#session-28-hotfix---ai-draft-ui-rendering) | Hotfix | ✅ Completed |
| 29 | 2026-05-25 | N/A | [Hotfix - Prose Writer Empty State UX Polish](#session-29-hotfix---prose-writer-empty-state-ux-polish) | Hotfix | ✅ Completed |
| 30 | 2026-05-25 | N/A | [Hotfix - Remove All Dummy Data](#session-30-hotfix---remove-all-dummy-data) | Hotfix | ✅ Completed |
| 31 | 2026-05-25 | N/A | [Hotfix - Dynamic Lobby Welcome Subtitle](#session-31-hotfix---dynamic-lobby-welcome-subtitle) | Hotfix | ✅ Completed |
| 32 | 2026-05-25 | N/A | [Hotfix - Live Productivity & Achievement Stats](#session-32-hotfix---live-productivity--achievement-stats) | Hotfix | ✅ Completed |
| 33 | 2026-05-25 | N/A | [Hotfix - Debug Mode Story Data Export](#session-33-hotfix---debug-mode-story-data-export) | Hotfix | ✅ Completed |
| 34 | 2026-05-28 | 00:00:56 +07:00 | [Workspace Cleanup - Mixed/Dirty Commit Hardening](#session-34-workspace-cleanup---mixeddirty-commit-hardening) | Maintenance | ✅ Completed |
| 35 | 2026-05-28 | 22:54:00 +07:00 | [Dynamic Task-Specialized Multi-Model AI Router & Auto-Pilot](#session-35-dynamic-task-specialized-multi-model-ai-router--auto-pilot) | Feature | ✅ Completed |
| 36 | 2026-05-29 | N/A | [Word Count Target, KBM Formatting, & State Generation Fix](#session-36-word-count-target-kbm-formatting--state-generation-fix) | Hotfix | ✅ Completed |
| 37 | 2026-05-29 | N/A | [Onboarding Splash, Collapsible Outline Peek & AI Guided Flow Hardening](#session-37-onboarding-splash-collapsible-outline-peek--ai-guided-flow-hardening) | UI Polish | ✅ Completed |
| 38 | 2026-05-29 | N/A | [Context Panel Polish & Pacing Warnings UX](#session-38-context-panel-polish--pacing-warnings-ux) | UX Polish | ✅ Completed |

---

## Session 1: Sprint 1C — Brainstorm Agent (Real AI)
- **Date**: 2026-05-21
- **Time/Duration**: ~15 minutes
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 1C

### Summary of Work

#### STEP 1: Prompt Builder (`src/prompts/brainstorm-agent.ts`)
- Membuat `buildCoAuthorSystemInstruction(compassState, currentGap)` — pembuat sistem prompt dinamis untuk API Gemini berdasarkan status penyelesaian Story Compass saat ini.
- Mengimplementasikan `detectCompassGap()` — memindai 5 elemen wajib (Premise, Protagonist, Antagonist, Ending, Mystery Layer) dan mengembalikan gap pertama yang hilang.
- Mengimplementasikan `getCoAuthorMode()` — mengembalikan SETUP (jika ada gap) atau CONSULTATION (jika lengkap).
- Setiap gap memiliki panduan spesifik dengan template JSON `<DRAFT_DATA>` sebagai contoh untuk diikuti oleh AI.
- Menerapkan batasan KBM Melodrama dalam sistem prompt: pertaruhan emosional tinggi, paragraf pendek, padat dialog, budaya cliffhanger.
- Aturan anti-melantur diterapkan dalam instruksi sistem: AI harus mengalihkan percakapan di luar topik, dan setelah 3 kali keluar topik, harus secara paksa mengajukan draft.

#### STEP 2: Compass UI Extraction (`src/components/compass/StoryCompassPreview.tsx`)
- Mengekstrak sekitar 140 baris kode rendering inline Story Compass dari `ContextPanel.tsx` menjadi komponen mandiri yang reusable.
- Fitur: progress bar tersegmentasi 5 langkah, indikator gap berdenyut ("Yuk isi ini dulu!"), chip karakter untuk Protagonist/Antagonist, dan CTA "Story Compass Lengkap!" saat seluruh 5 elemen terisi.
- Memperbarui `ContextPanel.tsx` untuk mengimpor dan merender `StoryCompassPreview` secara bersih di mode brainstorm, mengurangi baris file sekitar 130 baris.

#### STEP 3: AI Router Integration (`src/services/ai/ai-router.ts`)
- Memperbarui `chatCoAuthor()` untuk menerima `systemInstruction` dinamis dari prompt builder.
- Mengimplementasikan parsing XML `<DRAFT_DATA>` yang tangguh dengan:
  - Pembersihan blok kode Markdown (model terkadang membungkus JSON dengan triple backticks).
  - Penghapusan koma gantung di akhir JSON (artefak umum LLM).
  - Validasi tipe (hanya menerima `character`, `item`, `world_rule`, `ending`, `mystery`).
  - Fallback aman: jika parsing JSON gagal, balasan chat tetap ditampilkan tanpa kartu draf.

#### STEP 4: Chat Store Refactor (`src/store/useChatStore.ts`)
- **BYOK Guard**: Jika kunci Gemini tidak dikonfigurasi, mengembalikan pesan sistem yang ramah dengan tautan ke Google AI Studio.
- **Koneksi AI Riil**: Menggantikan seluruh simulator `setTimeout` (~180 baris kode respons keras) dengan satu panggilan tunggal `aiRouter.chatCoAuthor()`.
- **Injeksi State Compass**: Sebelum setiap panggilan AI, membuat snapshot `CompassState` dari `useProjectStore` dan meneruskannya ke `buildCoAuthorSystemInstruction()` untuk mendeteksi gap saat ini.
- **Pemetaan Draft Data**: Data draf yang dihasilkan AI dipetakan ke `ChatMessage.draftData` dengan `status: 'pending'`, yang memicu UI `ApprovalCard` yang sudah ada.
- **Penghitung Anti-Melantur**: Melacak percakapan keluar topik berturut-turut per proyek. Setelah 3 kali, menginjeksi override instruksi sistem secara paksa. Direset ketika draft diajukan atau diskusi kembali ke topik.
- **Alur Persetujuan**: Tombol "Setuju!" menjalankan operasi CRUD sinkronisasi optimistik UUID yang dibangun di Sprint 1A (`addCharacter`, `addItem`, `addWorldRule`, `updateProject` untuk ending, `setState` lokal untuk mystery layers).
- **Penanganan Kesalahan**: Rate limit (429), kunci hilang, dan kesalahan umum menghasilkan pesan bahasa Indonesia yang ramah bagi pengguna.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/brainstorm-agent.ts` | [NEW] | Pembuat sistem prompt dinamis dengan deteksi gap |
| `src/components/compass/StoryCompassPreview.tsx` | [NEW] | Komponen pratinjau Story Compass modular |
| `src/store/useChatStore.ts` | [MODIFY] | Tulis ulang penuh: mock → AI nyata, guard BYOK, anti-melantur |
| `src/services/ai/ai-router.ts` | [MODIFY] | Parsing DRAFT_DATA tangguh dengan pembersihan JSON |
| `src/components/workspace/ContextPanel.tsx` | [MODIFY] | Impor StoryCompassPreview, hapus ~130 baris kode inline |

---

## Session 2: Sprint 1D — Outline Engine (Real AI)
- **Date**: 2026-05-21
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 1D

### Summary of Work

#### STEP 1: Prompt Builder (`src/prompts/outline-engine.ts`)
- Membuat `buildOutlineSystemInstruction()` untuk menerapkan seluruh 5 prinsip KBM Retention Engine (Layered Mystery, Emotional Rollercoaster, Hook Chain, False Resolution, Character Investment) dan Dopamine Cycle.
- Membuat `buildOutlineUserPrompt()` untuk melakukan serialisasi lengkap status Story Compass, termasuk karakter aktif, item, lapisan misteri dengan breadcrumbs, dan konteks bab-bab sebelumnya.

#### STEP 2: KBM Pacing Validator (`src/lib/kbm-pacing.ts`)
- Mengimplementasikan `validateEmotionalPattern()` untuk mendeteksi pola emosi monoton (misal: 3 nada berturut-turut yang identik, 5 bab tanpa jeda).
- Mengimplementasikan `validateCliffhangerVariety()` untuk memastikan jenis cliffhanger bervariasi.
- Merancang validator untuk bersifat **warning-only** (hanya peringatan) guna mencegah biaya API berlebih dan keterlambatan generasi.

#### STEP 3 & 4: AI Types and Router Refactor (`src/services/ai/types.ts`, `src/services/ai/ai-router.ts`)
- Memperluas `OutlineGenerateInput` agar dapat menerima objek terstruktur alih-alih string mentah.
- Merefaktor `aiRouter.generateChapterOutline()` untuk menggunakan prompt builder baru.
- Menambahkan mekanisme percobaan ulang parsing JSON dengan instruksi lebih ketat jika respons awal berisi penutup markdown atau JSON tidak valid.

#### STEP 5: Project Store Outline Actions (`src/store/useProjectStore.ts`)
- Menambahkan aksi CRUD dan batch outline komprehensif (`generateOutlineBatch`, `regenerateOutline`, `addChapter`, `lockOutline`, `deleteChapter`).
- Mengimplementasikan logika **Sequential Await** untuk generasi batch: outline dihasilkan satu per satu dengan meneruskan konteks bab sebelumnya ke bab berikutnya untuk mencegah amnesia AI.
- Menambahkan flag **Emergency Stop** (`abortOutlineGeneration`) untuk mengizinkan pengguna membatalkan generasi batch yang sedang berjalan.

#### STEP 6: Chapter Outline Card (`src/components/workspace/ChapterOutlineCard.tsx`)
- Membangun komponen kartu interaktif yang dapat diperluas menggunakan Framer Motion.
- Fitur tampilan: lencana status, chip nada emosional, jenis cliffhanger, dan detail outline 20+ field lengkap.
- Fitur aksi: regenerasi bab tunggal, pengeditan manual fungsional (menyimpan ke Zustand/Supabase dengan penanda `MANUAL`), penguncian, dan penghapusan.

#### STEP 7 & 8: Season Architect Panel (`src/components/workspace/SeasonArchitectPanel.tsx`, `src/pages/Workspace.tsx`)
- Menggantikan pratinjau outline statis di Workspace dengan `SeasonArchitectPanel` berfitur lengkap.
- Membuat pemilih rentang dinamis untuk generasi batch (memungkinkan rentang bab khusus).
- Mengimplementasikan UI pelacakan progres waktu nyata dengan indikator status (✅ dihasilkan, 🔄 aktif, ⬜ tertunda) dan ringkasan peringatan dari validator pacing.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/outline-engine.ts` | [NEW] | Pembuat prompt khusus untuk outline engine |
| `src/lib/kbm-pacing.ts` | [NEW] | Validator pacing berbasis aturan peringatan |
| `src/components/workspace/ChapterOutlineCard.tsx` | [NEW] | Kartu outline bab interaktif yang dapat diperluas |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [NEW] | UI manajemen batch outline berfitur lengkap |
| `src/services/ai/types.ts` | [MODIFY] | Memperluas antarmuka input generasi outline |
| `src/services/ai/ai-router.ts` | [MODIFY] | Integrasi prompt builder dan retry parsing JSON |
| `src/store/useProjectStore.ts` | [MODIFY] | Siklus generasi batch, aksi CRUD, sequential await, emergency stop |
| `src/pages/Workspace.tsx` | [MODIFY] | Mengganti kartu outline inline dengan SeasonArchitectPanel |

---

## Session 3: Sprint 2A — Beat-by-Beat Prose Writer
- **Date**: 2026-05-22
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 2A

### Summary of Work

#### STEP 1: Setting up Types & Prompt Builder
- Memodifikasi `src/services/ai/types.ts` untuk menyertakan model pilihan (`ProseModelChoice`) dan `ProseGenerateInput`.
- Membuat `src/prompts/prose-writer.ts` berisi Protokol KBM Melodrama untuk memaksakan paragraf pendek, adegan padat dialog, dan kontinuitas teks yang mulus.

#### STEP 2: Upgrading AI Routers for Streaming
- Memodifikasi `src/services/ai/gemini-pool.ts` dengan menambahkan `generateContentStream()` untuk pengiriman token berbasis SSE.
- Memodifikasi `src/services/ai/openrouter-adapter.ts` dengan `stream: true` untuk mendukung penulisan sepotong-sepotong (untuk model Claude/Deepseek).
- Memperbarui `src/services/ai/ai-router.ts` untuk menyediakan AsyncGenerator `generateProseBeatStream()` yang secara otomatis merutekan ke provider terpilih.

#### STEP 3: Hooks & State Management
- Memperbarui `src/store/useSettingsStore.ts` untuk menyimpan model prosa aktif (`activeProseModel`) secara persisten.
- Membuat `src/hooks/useBeatWriter.ts` untuk mengatur streaming, indeks adegan dinamis, dan menerapkan **Debounced Save** (menyimpan otomatis ke Zustand/Supabase setelah 2 detik tidak ada aktivitas).

#### STEP 4 & 5: Beat UI Components & Workspace Assembly
- Membuat `src/components/prose/BeatIndicator.tsx` untuk menangani rendering kemajuan adegan dinamis berdasarkan jumlah `keyEvents`.
- Membuat `src/components/prose/ProseToolbar.tsx` dengan dropdown pemilih cepat model AI dan indikator simpan otomatis.
- Membuat `src/components/prose/BeatEditor.tsx` dengan textarea fleksibel yang melakukan gulir otomatis selama streaming dan menerima pengeditan manual.
- Membuat `src/components/workspace/ProseWriterPanel.tsx` untuk mengintegrasikan semua komponen di atas.
- Merefaktor `src/pages/Workspace.tsx` untuk menggunakan `<ProseWriterPanel />` dan menghapus logika placeholder lama.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/prose-writer.ts` | [NEW] | Protokol KBM Melodrama dan aturan penulisan adegan |
| `src/hooks/useBeatWriter.ts` | [NEW] | Kait untuk mengelola alur penulisan adegan AI, stream, dan debounced save |
| `src/components/prose/BeatIndicator.tsx` | [NEW] | Komponen visual kemajuan adegan bab |
| `src/components/prose/ProseToolbar.tsx` | [NEW] | Toolbar dengan pilihan model cepat dan status simpan |
| `src/components/prose/BeatEditor.tsx` | [NEW] | Kanvas teks editor adegan dengan gulir otomatis stream |
| `src/components/workspace/ProseWriterPanel.tsx` | [NEW] | Panel penggabung menulis naskah adegan |
| `src/services/ai/types.ts` | [MODIFY] | Menambahkan definisi model prosa dan masukan teks |
| `src/services/ai/gemini-pool.ts` | [MODIFY] | Menambahkan metode generateContentStream |
| `src/services/ai/openrouter-adapter.ts` | [MODIFY] | Menambahkan dukungan stream untuk OpenRouter |
| `src/services/ai/ai-router.ts` | [MODIFY] | Mendukung generator prose beat stream lintas provider |
| `src/store/useSettingsStore.ts` | [MODIFY] | Menyimpan status activeProseModel |
| `src/pages/Workspace.tsx` | [MODIFY] | Integrasi ProseWriterPanel dan pembersihan sisa draf |

---

## Session 4: Sprint 2B — State Tracker & Context Injection Upgrade
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 2B

### Summary of Work

#### STEP 1: Type Expansion & State Structures
- Memodifikasi `src/types/project.ts` untuk memperluas antarmuka `CharacterState` dengan 5 bidang krusial baru (`knowledge_state`, `active_goal`, `secrets`, `appearance_notes`, `alliances`).
- Memperluas `ProseGenerateInput` dan `BrainstormResponse` di `src/services/ai/types.ts` untuk mendukung status karakter dan tipe draf `character_state`.

#### STEP 2: State Extraction & Prompt Module
- Membuat `src/prompts/state-snapshot.ts` yang mendetailkan instruksi pembuatan prompt untuk ekstraktor latar belakang status karakter 10-bidang.
- Membuat `src/services/state-tracker.ts` menggunakan Gemini Core (gratis) untuk menganalisis teks bab yang ditulis, melakukan penanganan parsing array JSON, dan memformat status karakter menjadi teks konteks.

#### STEP 3: Store & Sync Actions
- Mengintegrasikan persistensi status ke dalam `src/store/useProjectStore.ts` dengan penyeleksi status (`getLatestStatesForChapter`, `upsertCharacterStates`) dan pemuatan otomatis di `loadProjectData`.

#### STEP 4: Chat Brainstorming & Draft State Approval
- Memperbarui prompt AI Co-Author di `src/prompts/brainstorm-agent.ts` untuk mendukung pembaruan status karakter.
- Merefaktor `src/store/useChatStore.ts` untuk menganalisis blok XML `<DRAFT_DATA>` tipe draf `character_state`.
- Memodifikasi `src/components/chat/AiMessageBubble.tsx` untuk menampilkan pembaruan status karakter secara visual di chat.
- Memodifikasi `src/components/chat/ApprovalCard.tsx` dengan dukungan `whitespace-pre-line` untuk menjaga baris baru selama persetujuan.

#### STEP 5: Layer 2 & Layer 4 Context Injection
- Memperbarui `src/services/ai/context-injector.ts` untuk secara deterministik mencocokkan karakter aktif, menarik status karakter terbaru (Layer 2), dan memotong 500 kata terakhir naskah bab sebelumnya (Layer 4) dalam anggaran token yang ketat.

#### STEP 6: Hook Integration & Bugfixes
- Mengintegrasikan pemicu otomatis ekstraksi status karakter di `src/hooks/useBeatWriter.ts` yang berjalan di latar belakang segera setelah bab beralih ke status `DRAFT`.

#### STEP 7: UI Panel & Component Assembly
- Membuat `src/components/compass/StateTimeline.tsx` untuk menampilkan status karakter, peran kustom, collapsible secrets, dan kontrol ekstraksi manual.
- Memperbarui `src/components/workspace/ContextPanel.tsx` di mode menulis untuk menampilkan `<StateTimeline />` dengan tombol ekstraksi manual.
- Memodifikasi `src/components/prose/ProseToolbar.tsx` dan `ProseWriterPanel.tsx` untuk menampilkan indikator status ekstraksi latar belakang.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/state-snapshot.ts` | [NEW] | Panduan ekstraksi status karakter 10-bidang |
| `src/services/state-tracker.ts` | [NEW] | Ekstraktor latar belakang status karakter pasca menulis |
| `src/components/compass/StateTimeline.tsx` | [NEW] | Komponen linimasa status karakter aktif |
| `src/types/project.ts` | [MODIFY] | Penambahan bidang detail pada CharacterState |
| `src/services/ai/types.ts` | [MODIFY] | Sinkronisasi bentuk draf status karakter |
| `src/store/useProjectStore.ts` | [MODIFY] | CRUD sinkronisasi status karakter |
| `src/prompts/brainstorm-agent.ts` | [MODIFY] | Dukungan pembuatan draf status di prompt chat |
| `src/store/useChatStore.ts` | [MODIFY] | Operasi CRUD persetujuan draf status |
| `src/components/chat/AiMessageBubble.tsx` | [MODIFY] | Desain render khusus draf status |
| `src/components/chat/ApprovalCard.tsx` | [MODIFY] | Penyesuaian whitespace teks |
| `src/services/ai/context-injector.ts` | [MODIFY] | Integrasi Layer 2 dan Layer 4 ke generator |
| `src/hooks/useBeatWriter.ts` | [MODIFY] | Pemicu otomatis ekstraksi status pasca menulis |
| `src/components/workspace/ContextPanel.tsx` | [MODIFY] | Menampilkan StateTimeline di bilah samping |

---

## Session 5: Refactoring — Zustand Parts Modularization (useProjectStore Refactor)
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Refactor

### Summary of Work

#### STEP 1: Creating Modular Parts Directory
- Membuat direktori `src/store/parts/` untuk menampung bagian-bagian store yang modular, menggantikan pola monolit yang rumit dengan tetap mempertahankan penamaan yang ramah pengguna.

#### STEP 2: Extraction of Modul Proyek (`projects.ts`)
- Membuat `src/store/parts/projects.ts` yang berisi state inti proyek aktif beserta seluruh penangan sinkronisasi basis data CRUD proyek (`loadProjects`, `loadProjectData`, `addProject`, `updateProject`, `deleteProject`).

#### STEP 3: Extraction of Modul Bab (`chapters.ts`)
- Membuat `src/store/parts/chapters.ts` yang menampung daftar bab aktif, penangan pemuatan optimistik, dan overlay pemuatan paralel.

#### STEP 4: Extraction of Modul Pustaka Lore (`lorebook.ts`)
- Membuat `src/store/parts/lorebook.ts` untuk mengelola seluruh 4 layer lore cerita: Karakter, Status Karakter (Layer 2), Item, Aturan Dunia, Lapisan Misteri, dan Plot Thread.

#### STEP 5: Extraction of Modul Outline (`outlines.ts`)
- Membuat `src/store/parts/outlines.ts` untuk mengelola pembuatan naskah rencana bab (outline), validator pacing batch, generator sequential, dan indikator kemajuan dinamis.

#### STEP 6: Reconstructing Main Store (`useProjectStore.ts`)
- Merefaktor `src/store/useProjectStore.ts` menjadi berkas tipis yang mengimpor dan menggabungkan kelima bagian modular tersebut, menjaga kompatibilitas ekspor transparan untuk seluruh komponen UI yang memanggilnya.

#### STEP 7: Fixing PostgreSQL / Supabase Client Type Mismatches
- Menghindari kegagalan kompilator TS dengan melakukan casting `_supabase as any` di setiap modul.
- Memindahkan struktur `OutlineProgress` ke `src/types/project.ts` agar dapat digunakan bersama secara bersih.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/store/parts/projects.ts` | [NEW] | Ekstraksi state dan aksi khusus proyek |
| `src/store/parts/chapters.ts` | [NEW] | Ekstraksi state dan aksi khusus bab |
| `src/store/parts/lorebook.ts` | [NEW] | Ekstraksi state lorebook dan pustaka elemen |
| `src/store/parts/outlines.ts` | [NEW] | Ekstraksi batch outline generator dan validator |
| `src/store/useProjectStore.ts` | [MODIFY] | Penggabung ramping dari bagian-bagian store modular |

---

## Session 6: Sprint 3A — Plot Radar & Lore Extraction
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 3A

### Summary of Work

#### STEP 1: AI Prompt Templates (`src/prompts/plot-radar.ts`, `src/prompts/lore-extractor.ts`)
- Membuat `buildPlotRadarSystemInstruction` dan `buildPlotRadarUserPrompt` untuk mengevaluasi 4 kriteria QA kritis: Plot Hole, Emotional Impact (Filler), Chekhov's Gun Tracker, dan Log Persistence.
- Membuat `buildLoreExtractorSystemInstruction` dan `buildLoreExtractorUserPrompt` untuk mengekstrak Karakter, Item, dan Aturan Dunia baru secara otomatis dari naskah bab yang baru ditulis.

#### STEP 2: Service Layer & AI Router (`src/services/ai/ai-router.ts`)
- Memodifikasi `aiRouter.runQARadar()` untuk menerima teks naskah dan konteks sebelumnya, mengembalikan array objek `QaLog` terstruktur.
- Mendaftarkan `aiRouter.extractLore()` untuk menganalisis dan mengurai data entitas lore baru yang diekstrak oleh Gemini.

#### STEP 3: State Management & Hooks (`src/hooks/usePlotRadar.ts`, `src/hooks/useLoreExtractor.ts`, `src/store/parts/lorebook.ts`)
- Membuat `usePlotRadar.ts` dan `useLoreExtractor.ts` sebagai kait orkestrator yang menghubungkan router AI ke Zustand dan UI.
- Memperbarui `lorebook.ts` untuk menyimpan `extractedLore` secara global, memungkinkan modal persetujuan membacanya.
- Memperbarui `src/hooks/useBeatWriter.ts` untuk memicu eksekusi latar belakang paralel `Promise.allSettled` dari State Snapshot, Plot Radar QA, dan Lore Extraction secara otomatis ketika bab selesai ditulis (status `DRAFT`).

#### STEP 4: UI Components (`src/components/workspace/ReviewPanel.tsx`, `src/components/modals/LoreDiffModal.tsx`)
- Membuat `ReviewPanel.tsx` untuk melayani pembaca naskah berdampingan dengan log QA, merender lencana keparahan berkode warna (CRITICAL, EMOTION_FLAT, dll.).
- Membuat `LoreDiffModal.tsx` sebagai popup interaktif untuk menyetujui dan menyimpan entitas lore baru yang diekstrak sekaligus ke dalam proyek.
- Menggantikan kanvas pratinjau review statis di `Workspace.tsx` dengan komponen modular `<ReviewPanel />`.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/plot-radar.ts` | [NEW] | Prompt QA evaluasi plot hole, emosi, dan Chekhov's gun |
| `src/prompts/lore-extractor.ts` | [NEW] | Prompt ekstraksi entitas lore baru dari prosa |
| `src/hooks/usePlotRadar.ts` | [NEW] | Kait pemicu dan pemantau analisis Plot Radar |
| `src/hooks/useLoreExtractor.ts` | [NEW] | Kait pemicu ekstraksi lore dari naskah |
| `src/components/modals/LoreDiffModal.tsx` | [NEW] | Dialog persetujuan entitas lore baru hasil ekstraksi |
| `src/services/ai/ai-router.ts` | [MODIFY] | Penambahan metode runQARadar dan extractLore |
| `src/store/parts/lorebook.ts` | [MODIFY] | Penyimpanan sementara status draf hasil ekstraksi |
| `src/hooks/useBeatWriter.ts` | [MODIFY] | Eksekusi paralel 3 tugas latar belakang pasca menulis |
| `src/components/workspace/ReviewPanel.tsx` | [MODIFY] | Panel canvas review naskah dan log QA |
| `src/pages/Workspace.tsx` | [MODIFY] | Pemasangan ReviewPanel baru |

---

## Session 7: Sprint 3B — Review Mode & PWA
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Sprint 3B

### Summary of Work

#### Phase 1: Review Mode Upgrade
- Membuat `src/components/compass/ThreadTrackerPanel.tsx` sebagai penampil daftar `plotThreads` dari store proyek, lengkap dengan lencana status, indikator urgensi berdenyut, dan arahan jika kosong.
- Membuat `src/components/compass/EmotionalArcPreview.tsx` untuk menampilkan kemajuan emosi per bab: nomor bab, label nada emosi, indikator dopamine ⚡, dan legenda warna.
- Membuat `src/components/ui/QaSeverityFilter.tsx` — filter tab chip (Semua / Plot Hole / Emosi / Chekhov / Filler) dengan animasi garis bawah Framer Motion `layoutId="qaFilterActive"` dan lencana penghitung.
- Menulis ulang `src/components/workspace/ReviewPanel.tsx` menjadi tata letak 3-kolom desktop (Naskah 5fr / QA 3fr / Konteks 2fr) dan switcher tab di seluler dengan transisi `AnimatePresence`.

#### Phase 2: PWA Setup
- Menginstal `vite-plugin-pwa@1.3.0` sebagai devDependency.
- Mengonfigurasi `vite.config.ts` untuk meregenerasi manifest dan service worker (`dist/sw.js`).
- Memperbaiki ketidaksesuaian tipe kompilasi TypeScript lintas berkas store Zustand dengan menghilangkan `as any` dan memperjelas anotasi tipe.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/compass/ThreadTrackerPanel.tsx` | [NEW] | Panel pemantau status plot thread |
| `src/components/compass/EmotionalArcPreview.tsx` | [NEW] | Visualisasi nada emosional bab |
| `src/components/ui/QaSeverityFilter.tsx` | [NEW] | Filter tab log QA berdasarkan kategori keparahan |
| `vite.config.ts` | [MODIFY] | Registrasi vite-plugin-pwa dan konfigurasi manifes |
| `src/components/workspace/ReviewPanel.tsx` | [MODIFY] | Rombak total ke tata letak 3-kolom dengan sub-panel baru |

---

## Session 8: Sprint 4 — Pro Writer Features
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 4

### Summary of Work

#### Phase 1 — Import Wizard (4-step flow)
- `src/lib/manuscript-reader.ts` — Utilitas ekstraksi berkas teks biasa (.txt), Word (.docx via dynamic mammoth), dan PDF (.pdf via dynamic pdfjs-dist). Batas maksimum `MAX_INPUT_CHARS = 1.5M` dengan kesalahan ramah.
- `src/lib/manuscript-parser.ts` — Pre-processing naskah: pemisah bab regex, ekstraksi benih karakter, estimasi biaya token, dan hash berkas untuk cache.
- `src/lib/import-cache.ts` — Cache analisis berbasis localStorage dengan TTL 7 hari untuk menghindari panggilan API ulang pada naskah yang sama.
- `src/prompts/import-analyzer.ts` — Pembuat prompt analisis cepat (Tier 1), analisis mendalam (Tier 2), dan kalibrasi prototipe suara karakter (Voice DNA).
- `src/components/onboarding/ImportWizard.tsx` — Pemandu impor 4-langkah interaktif menggunakan Framer Motion. Membuat proyek baru tipe `IMPORTED`, mempopulasikan elemen naskah, karakter, item, dan status secara otomatis dari naskah.

#### Phase 2 — Free Write Mode
- Memperkenalkan `freeWriteMode` di store pengaturan dan tombol toggle di toolbar.
- Ketika diaktifkan, editor melewati penataan per-adegan dan menonaktifkan tugas latar belakang AI (state snapshot, plot radar, lore extraction).
- `src/components/prose/FreeWriteEditor.tsx` — Kanvas editor menulis bebas dengan fitur pemulihan draf aman saat offline.

#### Phase 3 — Director's Cut + Inline Edit
- `src/prompts/rewrite.ts` — Instruksi pemolesan tulisan berbasis KBM. Menyediakan variasi: Tighter (lebih padat), Emotional (lebih menyentuh), Dramatic (lebih tegang).
- `src/components/modals/DirectorsCutModal.tsx` — Grid 3-kartu variasi tulisan. Generasi streaming paralel dapat dibatalkan di tengah jalan saat pengguna memilih satu variasi, menghemat hingga 67% token.
- `src/components/prose/SelectionToolbar.tsx` — Toolbar melayang gaya Notion yang muncul saat memblok teks (>6 karakter), menyediakan akses cepat ke Magic Edit (inline AI prompt) dan Director's Cut.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/lib/manuscript-reader.ts` | [NEW] | Ekstraksi teks lazy-loaded (.txt/.docx/.pdf) |
| `src/lib/manuscript-parser.ts` | [NEW] | Pemotong bab, ekstraktor benih nama, estimasi biaya |
| `src/lib/import-cache.ts` | [NEW] | Penyimpanan cache SHA-256 lokal |
| `src/prompts/import-analyzer.ts` | [NEW] | Prompt analisis impor naskah |
| `src/prompts/rewrite.ts` | [NEW] | Prompt Director's Cut dan Magic Edit |
| `src/services/import-analyzer.ts` | [NEW] | Orkestrator analisis impor dua tingkat |
| `src/components/onboarding/ImportWizard.tsx` | [NEW] | Wizard impor Framer Motion 4-langkah |
| `src/components/modals/DirectorsCutModal.tsx` | [NEW] | Dialog stream 3 variasi tulisan |
| `src/components/prose/SelectionToolbar.tsx` | [NEW] | Toolbar melayang seleksi teks melayang |
| `src/components/prose/FreeWriteEditor.tsx` | [NEW] | Editor polos mode bebas dengan draft restore |
| `src/components/prose/BeatEditor.tsx` | [MODIFY] | forwardRef + pendeteksi seleksi naskah |
| `src/components/prose/ProseToolbar.tsx` | [MODIFY] | Penambahan toggle chip Free Write |
| `src/components/workspace/ProseWriterPanel.tsx` | [MODIFY] | Mengintegrasikan SelectionToolbar + DirectorsCutModal |

---

## Session 9: Hotfix — Model Locking & Co-Author Chat Stop/Regenerate
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Penguncian Model**: Mengunci target model pool gratisan ke `'gemini-flash-latest'` di awal pemanggilan metode `generateContent` dan `generateContentStream` pada `gemini-pool.ts` untuk memastikan kestabilan tautan URL API.
- **Pemberhentian & Regenerasi Chat Co-Author**:
  - `useChatStore.ts` — Menyimpan map `activeControllers` non-persisten. Mengekstrak permintaan API Gemini ke dalam fungsi `generateAiResponse()` terpisah yang menerima `AbortSignal`.
  - Membuat aksi `stopResponse` untuk membatalkan `AbortController` aktif milik proyek dan menyisipkan pesan sistem `🛑 Generasi dihentikan oleh pengguna`.
  - Membuat aksi `regenerateResponse` untuk menghapus percakapan hingga masukan terakhir pengguna dan memicu balasan AI baru.
  - `CoAuthorChat.tsx` — Menyediakan tombol Hentikan (Stop) selama stream aktif, dan tombol melayang "Generate Ulang" di atas kolom input ketika pesan terakhir berasal dari asisten.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/ai/gemini-pool.ts` | [MODIFY] | Mengunci parameter model ke `'gemini-flash-latest'` |
| `src/services/ai/ai-router.ts` | [MODIFY] | Menyelaraskan seluruh argumen model pool ke `'gemini-flash-latest'` dan mendukung AbortSignal |
| `src/store/useChatStore.ts` | [MODIFY] | Logika pembatalan stream chat dan regenerasi balasan |
| `src/components/chat/CoAuthorChat.tsx` | [MODIFY] | Pemasangan tombol Stop dan Regenerate melayang |

---

## Session 10: Sprint 5 — KBM Retention Engine
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 5

### Summary of Work

#### Phase 1 — Mystery Layer Foundation
- Menambahkan CRUD lapisan misteri (`addMysteryLayer`, `updateMysteryLayer`, `deleteMysteryLayer`) di store `lorebook` beserta sinkronisasi basis data Supabase `mystery_layers`.
- `src/components/compass/MysteryLayerPanel.tsx` — Panel visual manajemen misteri: daftar kartu misteri collapsible, linimasa kemunculan hint/petunjuk (BreadcrumbTimeline) berbentuk horizontal scroll, dan formulir input data misteri.

#### Phase 2 — Voice DNA Editor
- `src/services/voice-dna-helper.ts` — Helper pengumpul sampel paragraf tokoh dari naskah bab sebelumnya untuk analisis suara karakter.
- `src/components/compass/VoiceDNAEditor.tsx` — Panel penyuntingan suara 6-dimensi karakter (`tone`, `vocabulary`, `verbal_tics`, `internal_monolog_style`, `dialog_quirks`, `charm_factor`). Tombol "🔄 Recalibrate dari Prosa" memicu AI untuk memperbarui profil suara secara otomatis dari naskah yang tertulis.

#### Phase 3 — False Resolution + Hook Chain
- Menambahkan kolom `false_resolution` pada tabel `chapters`, serta `series_hook` dan `season_hooks` pada tabel `projects` di Supabase.
- Memperbarui prompt outline di `src/prompts/outline-engine.ts` untuk mendukung hirarki 5-level Hook Chain (Series → Season → Sub-Arc → Chapter → Micro) dan penentuan bendera False Resolution.
- Memperbarui `src/lib/kbm-pacing.ts` untuk memicu peringatan jika bab-bab tidak memiliki false resolution dalam 15 bab berturut-turut, atau tidak memiliki hook proyek.

#### Phase 4 — Prose Writer Strengthening
- Menambahkan 3 protokol eksplisit pada prompt prose-writer:
  1. **MICRO-HOOK PROTOCOL**: subteks dialog, satu detail salah dalam deskripsi, pertanyaan menggantung di akhir adegan.
  2. **CLIFFHANGER PROTOCOL**: referensi cepat 6 jenis cliffhanger mematikan.
  3. **FALSE RESOLUTION HANDLING**: struktur naskah yang seolah-olah menyelesaikan masalah sebelum dirusak di akhir adegan.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/compass/MysteryLayerPanel.tsx` | [NEW] | Panel manajemen lapisan misteri dan linimasa breadcrumb |
| `src/components/compass/VoiceDNAEditor.tsx` | [NEW] | Editor Voice DNA karakter dan tombol rekalibrasi |
| `src/services/voice-dna-helper.ts` | [NEW] | Utilitas ekstraksi sampel naskah untuk Voice DNA |
| `src/types/project.ts` | [MODIFY] | Menambahkan tipe false_resolution, series_hook, season_hooks |
| `src/store/parts/outlines.ts` | [MODIFY] | Menjalankan validator rollercoaster & hook chain, mengalirkan hook proyek |
| `src/lib/kbm-pacing.ts` | [MODIFY] | Validator false resolution dan kecukupan hook chain |
| `src/prompts/outline-engine.ts` | [MODIFY] | Skema outline KBM dengan false resolution dan hook chain |
| `src/prompts/prose-writer.ts` | [MODIFY] | Rombak prompt penulisan dengan mikro-hook, cliffhanger, dan ringkasan Voice DNA |

---

## Session 11: Sprint 6 — Auto-Pilot Batch Generation
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 6

### Summary of Work

#### Phase 1 — Service Foundation
- Mengekstrak logika perakitan input tulisan dari `useBeatWriter` ke `src/services/prose-context.ts::buildProseInput()`. Menjadikannya fungsi murni sehingga generator batch dan generator manual menghasilkan prompt yang identik.
- `src/services/batch-generator.ts` — Kelas `BatchGenerator` untuk penulisan berurutan otomatis: mendukung jeda (pause), pembatalan (abort) instan, penulisan aman debounced, serta batas henti darurat jika terjadi kesalahan fatal berturut-turut.
- Menyimpan progres batch ke localStorage proyek agar dapat dipulihkan jika sesi terputus.

#### Phase 2 — Hook & Store Integration
- Mengintegrasikan progres batch transient di Zustand `useUiStore::batchProgress` dan membuat kait `useBatchGenerator.ts` untuk mengendalikan generator dari UI.

#### Phase 3 — UI Components
- `src/components/prose/BatchProgressPanel.tsx` — Panel melayang di pojok kanan bawah yang menampilkan status, persentase, diagram adegan aktif, dan kontrol jeda/lanjutkan/batal.
- `src/components/modals/BatchSuccessModal.tsx` — Dialog statistik penyelesaian batch yang menyajikan jumlah kata, rata-rata kata, waktu berlalu, log kesalahan, dan pintasan satu-klik ke bab yang selesai.
- Memasang tombol "🚀 Auto-Pilot Prose" di dialog SeasonArchitectPanel.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/prose-context.ts` | [NEW] | Perakitan input naskah AI murni (DRY) |
| `src/services/batch-generator.ts` | [NEW] | Mesin orkestrasi batch prose generator |
| `src/hooks/useBatchGenerator.ts` | [NEW] | Binding kait React untuk BatchGenerator |
| `src/components/prose/BatchProgressPanel.tsx` | [NEW] | Panel UI melayang pemantau kemajuan naskah batch |
| `src/components/modals/BatchSuccessModal.tsx` | [NEW] | Modal ringkasan akhir batch dengan statistik lengkap |
| `src/store/useUiStore.ts` | [MODIFY] | Penambahan state batchProgress transien |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Penambahan tombol pemicu batch prose beserta peringatan biaya |
| `src/pages/Workspace.tsx` | [MODIFY] | Memasang komponen pemantau batch secara global |

---

## Session 12: Sprint 7 — Thread Tracker & RAG
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 7

### Summary of Work

#### Phase 1 — Embedding Service + Chapter Summaries
- Menambahkan `embedContent` di `gemini-pool.ts` untuk menarik embedding 768-dimensi menggunakan model `text-embedding-004` gratis dengan skema rotasi kunci.
- `src/services/chapter-summary.ts` — Layanan generator ringkasan bab berbentuk JSON `{ summary, key_facts }` dan langsung menghitung vektor embedding ringkasannya.
- Mengintegrasikan pemuatan ringkasan bab ke aksi pemuatan data proyek Zustand.

#### Phase 2 — RAG Service & Context Injector
- `src/services/rag-service.ts` — Mesin pencarian semantik hibrida: menggunakan pencarian kesamaan kosinus basis data Supabase `match_chapter_summaries` jika terhubung, dan fallback algoritma token-overlap memori lokal jika offline.
- Memperluas `context-injector.ts` dengan fungsi `pruneAndInjectWithRag` untuk menarik ringkasan bab yang relevan (Layer 3 RAG) dan menyuntikkannya ke prompt penulisan.

#### Phase 3 — Thread Tracker
- `src/services/thread-tracker.ts` — Analis plot thread berbasis AI pasca penulisan bab.
- Memperluas store lorebook dengan aksi CRUD plot thread optimistik Supabase dan penanganan `applyThreadAnalysis`.
- Membangun antarmuka `ThreadTrackerPanel.tsx` baru: pengelompokan aktif/selesai, tingkat keparahan, tambahkan manual, indikasi plot menggantung merah menyala jika thread aktif melewati 10 bab dari pertama kali ditanam.

#### Phase 4 — Recap Generator
- `src/prompts/recap-generator.ts` — Penyusun kilas cerita "Sebelumnya..." dalam gaya novel melodrama.
- `src/components/modals/RecapModal.tsx` — Modal pemilihan rentang bab untuk membuat kilas cerita, menyalin teks, atau menyimpannya. Tombol pemicu dipasang di toolbar utama menulis.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/prompts/chapter-summary.ts` | [NEW] | Prompt ringkasan bab faktual |
| `src/services/chapter-summary.ts` | [NEW] | Layanan penghasil ringkasan dan embedding naskah |
| `src/services/rag-service.ts` | [NEW] | Mesin pencari RAG hibrida (Supabase RPC + memori lokal) |
| `src/prompts/thread-tracker.ts` | [NEW] | Prompt analisis status plot thread dari prosa bab |
| `src/services/thread-tracker.ts` | [NEW] | Layanan pelacak plot thread otomatis asinkron |
| `src/prompts/recap-generator.ts` | [NEW] | Prompt generator sinopsis kilas balik pembaca |
| `src/components/modals/RecapModal.tsx` | [NEW] | Dialog UI pembuatan kilas balik cerita |
| `supabase/schema.sql` | [MODIFY] | Menambahkan fungsi pencarian pgvector match_chapter_summaries |
| `src/components/compass/ThreadTrackerPanel.tsx` | [MODIFY] | Rombak total panel tracker plot thread riyawat AI |
| `src/components/prose/ProseToolbar.tsx` | [MODIFY] | Menghubungkan tombol kilas balik cerita |

---

## Session 13: Visual Polish — Premium Themed Edit Draft Modal
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — Build & TypeScript zero errors
- **Type**: Visual Polish

### Summary of Work
- **Penyunting Draf Khusus**: Membangun dialog penyunting draf terpadu yang adaptif terhadap 6 tipe draf AI (`character`, `item`, `world_rule`, `ending`, `mystery`, `character_state`).
- Masing-masing draf memiliki struktur formulir penyuntingan yang rapi dan divalidasi ketat (misal: isian lokasi, kondisi fisik, emosi, dan sekret dalam tipe `character_state`).
- **Integrasi Chat**: Memasang dialog ini di komponen `CoAuthorChat.tsx` menggantikan prompt browser bawaan `window.prompt()`. Hasil suntingan mengalir kembali ke store Zustand dan Supabase.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/modals/EditDraftModal.tsx` | [NEW] | Dialog editor draf multi-fungsi terpadu |
| `src/components/chat/CoAuthorChat.tsx` | [MODIFY] | Menghubungkan EditDraftModal menggantikan prompt bawaan |

---

## Session 14: Sprint 8 — Visualization
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 8

### Summary of Work

#### STEP 1 & 2: Infrastructure & Lazy Layout
- Menginstal Recharts dan paket terpisah D3 (`d3-force`, `d3-selection`, `d3-scale`).
- Menambahkan tab "🌌 Visualisasi" sebagai opsi mode ke-5 di switcher dan tata letak utama Workspace.
- `src/components/visualization/VisualizationPanel.tsx` — Panel induk visualisasi yang memuat 4 komponen berat secara malas (`React.lazy()`) dibungkus `<Suspense>` terpisah agar tidak membebani pemuatan bundel awal.

#### STEP 3: Emotional Arc Heatmap
- Pemetaan visualisasi 5 lensa proyek per bab: **Nada Emosi / Cliffhanger / Filler / Jumlah Kata / Status Bab**.
- Sel bab interaktif mendukung navigasi keyboard, tanda watermark bab, lencana khusus (⚡ dopamine, 💔 false resolution), dan kartu tooltip informatif di bawah strip.

#### STEP 4: Constellation Map (Peta Relasi)
- Menyediakan 2 jalur rendering berdasarkan deteksi seluler (`useIsMobile`):
  - **Seluler**: Menampilkan daftar teks interaktif pengelompokan entitas beserta relasi terdekat untuk kenyamanan layar kecil.
  - **Desktop**: Peta kekuatan dinamis SVG memanfaatkan matematika D3 force-directed. React memegang DOM, D3 mengelola perhitungan koordinat tanpa konflik.
- Filter tingkat tinggi: pilih tipe node, tipe edge, serta rentang bab yang dihitung relasinya.
- Navigasi interaktif: drag node, klik untuk menyoroti tetangga (meredupkan node lain), pan, zoom roda mouse, dan tombol reset.

#### STEP 5: Timeline View (Alur Cerita Terpadu)
- Mengelompokkan bab ke dalam 10 kategori Dramatic Arc (Opening → Climax → Resolution) menggunakan rumus pembagian rasio terpusat.
- Menampilkan visualisasi batang rentang plot thread di bilah samping kiri (desktop) yang mengalir dari pertama kali ditanam hingga diselesaikan.

#### STEP 6: Word Count Analytics
- Menampilkan 4 kartu statistik performa menulis: Total kata, rata-rata bab, bab memenuhi target (hijau), di bawah target (merah).
- Grafik batang Recharts bertingkat yang dihubungkan dengan garis kemajuan kumulatif kata cerita. Klik batang langsung mengarahkan penulis ke ruang menulis bab tersebut.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/visualization/VisualizationPanel.tsx` | [NEW] | Orkestrator pemuatan malas grid 4 panel visualisasi |
| `src/components/visualization/EmotionalArcHeatmap.tsx` | [NEW] | Grafik peta panas bab dengan 5 lensa data |
| `src/components/visualization/ConstellationMap.tsx` | [NEW] | Visualisasi konstelasi D3 relasi karakter/item/thread |
| `src/components/visualization/TimelineView.tsx` | [NEW] | Linimasa alur cerita bersanding dengan bentang plot thread |
| `src/components/visualization/WordCountAnalytics.tsx` | [NEW] | Dasbor analitik grafik kata naskah Recharts |
| `src/store/useUiStore.ts` | [MODIFY] | Menambahkan mode visualisasi 'visualize' |
| `src/components/workspace/ModeSwitcher.tsx` | [MODIFY] | Memasang tab navigasi🌌 Visualisasi |
| `src/pages/Workspace.tsx` | [MODIFY] | Merender panel visualisasi dan ikon bawah seluler |
| `src/lib/kbm-pacing.ts` | [MODIFY] | Memusatkan helper dramatic arc getArcPosition dan computeArcBands |

---

## Session 15: Visual Polish — Premium Themed Dialogs & Toasts Engine
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Visual Polish

### Summary of Work
- **Arsitektur Dialog & Toast Terpadu**:
  - Menghapus 21+ penggunaan dialog konfirmasi browser bawaan (`window.confirm()`, `window.alert()`) yang merusak estetika antarmuka.
  - Memperluas `useUiStore.ts` dengan penampung status dialog konfirmasi (`confirmOptions`) dan antrean notifikasi melayang (`toasts`) dengan sistem auto-cleanup.
- **Komponen Global Premium**:
  - `PremiumConfirmModal.tsx` — Dialog konfirmasi premium bergaya glassmorphism dengan efek buram latar belakang, animasi Framer Motion, dan aksen warna khusus berdasarkan tingkat keparahan (merah bahaya, amber peringatan, pink info).
  - `PremiumToastContainer.tsx` — Antrean notifikasi di pojok kanan bawah dengan transisi spring.
- **Pembersihan Workspace**: Menggantikan seluruh konfirmasi penghapusan proyek, peringatan penulisan ulang outline, pembatalan batch, dan notifikasi kegagalan AI di seluruh komponen dengan dialog global baru.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/ui/PremiumConfirmModal.tsx` | [NEW] | Komponen dialog konfirmasi global premium |
| `src/components/ui/PremiumToastContainer.tsx` | [NEW] | Penampung antrean notifikasi toast melayang |
| `src/store/useUiStore.ts` | [MODIFY] | State dan aksi global pemanggilan dialog/toast |
| `src/App.tsx` | [MODIFY] | Memasang kontainer konfirmasi dan toast di root aplikasi |
| `src/pages/Lobby.tsx` | [MODIFY] | Menggunakan dialog premium saat menghapus proyek |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Integrasi toast peringatan key dan dialog batch |
| `src/components/workspace/ChapterOutlineCard.tsx` | [MODIFY] | Integrasi dialog saat timpa/hapus bab |
| `src/components/prose/BatchProgressPanel.tsx` | [MODIFY] | Dialog konfirmasi premium saat membatalkan batch |
| `src/components/compass/ThreadTrackerPanel.tsx` | [MODIFY] | Dialog konfirmasi premium saat menghapus thread |
| `src/components/compass/MysteryLayerPanel.tsx` | [MODIFY] | Dialog konfirmasi premium saat menghapus misteri |
| `src/hooks/useBeatWriter.ts` | [MODIFY] | Integrasi toast saat terjadi galat menulis |
| `src/components/workspace/ProseWriterPanel.tsx` | [MODIFY] | Toast error saat Magic Edit gagal |

---

## Session 16: Bug Fix — Story Compass Validation & Safeguards
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Bug Fix

### Summary of Work
- **Pengaman Lapisan Store (`outlines.ts`)**:
  - Menerapkan pengaman programatik di tingkat store Zustand untuk memblokir generasi batch outline (`generateOutlineBatch`) dan regenerasi outline tunggal (`regenerateOutline`) jika kelima komponen wajib Story Compass belum lengkap.
  - Membantu mencegah panggilan API menghasilkan outline acak tanpa data kompas yang menyebabkan anomali basis data.
- **Tampilan Validasi Premium (`SeasonArchitectPanel.tsx`)**:
  - Menghitung kelengkapan Story Compass di sisi UI dan menonaktifkan tombol pembuat outline dengan tooltip penjelas jika belum lengkap.
  - Memasang **Warning Banner** khusus di area kosong (empty state) yang mencantumkan detail komponen kompas yang hilang beserta tautan cepat untuk berpindah ke panel konfigurasinya.
- **Pengaman Kartu Bab (`ChapterOutlineCard.tsx`)**:
  - Melakukan evaluasi kelengkapan kompas di tingkat kartu bab, memblokir tombol regenerasi dengan penjelas melayang jika kompas mengalami regresi (misal: karakter dihapus).

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/store/parts/outlines.ts` | [MODIFY] | Pengaman programatik memblokir generasi outline jika kompas tidak lengkap |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Tampilan peringatan kompas hilang dan penonaktifan tombol generasi |
| `src/components/workspace/ChapterOutlineCard.tsx` | [MODIFY] | Blokir aksi regenerasi kartu jika kompas tidak lengkap |

---

## Session 17: Sprint 9 — Genre Blueprints & Polish
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 9

### Summary of Work

#### Phase 1 — Genre Blueprints Library
- Membangun perpustakaan 6 blueprint cerita siap pakai di `src/lib/genre-blueprints.ts` (Drama Rumah Tangga, Romance Office, Fantasi Kerajaan, Thriller Misteri, Action Aksi, Slice of Life Romance).
- Setiap cetak biru menyertakan template konstitusi naratif, petunjuk pacing dramatis, arketipe nama karakter dengan Voice DNA, arketipe item, dan kerangka lapisan misteri awal.
- `BlueprintSelector.tsx` — Dialog pemilihan blueprint 2-langkah: grid cetak biru → pratinjau struktur dan kustomisasi nama tokoh.
- Menghubungkan alur pembuatan proyek dari blueprint (`FRESH_BLUEPRINT`) di dasbor pembuatan proyek.

#### Phase 2 — Spin-Off Clone & Target Adjustment
- `src/services/project-cloner.ts` — Utilitas kloning proyek ke proyek baru dengan nama "X — Spin-Off" yang menyalin konstitusi naratif, detail kompas, karakter, item, misteri, dan voice DNA dengan mengosongkan progres naskah bab untuk babak baru.
- `src/services/target-chapters-adjuster.ts` — Mesin penyesuaian target bab proyek:
  - **Peningkatan Target**: Beralih ke naskah kosong baru atau otomatis memperpanjang outline (regenerasi bab baru yang aman).
  - **Pengurangan Target**: Validasi penguncian bab. Menghapus bab naskah, mereset linimasa plot thread, dan membersihkan status karakter yang melebihi batas target bab baru secara cascade.
- `TargetChaptersAdjustmentModal.tsx` — Dialog penyesuaian target bab dengan visual pratinjau bab yang akan terhapus dan checkbox konfirmasi ganda.

#### Phase 3 — Mimicry Engine (Gaya Menulis)
- `src/components/compass/MimicryEngineCard.tsx` — Panel ekstraksi gaya menulis penulis: pengguna menempelkan sampel tulisan naskah, AI mengekstrak 8 parameter gaya penulisan (`diction`, `paragraph_density`, dll.).
- Menyuntikkan blok `[PROJECT VOICE STYLE]` ke dalam generator prosa agar AI meniru gaya menulis tersebut saat merangkai narasi bab.

#### Phase 4 — Onboarding Tour & Accessibility (A11y)
- `OnboardingTour.tsx` — Pemandu sorot aplikasi 5-langkah berbasis portal. Menghormati pengaturan gerakan lambat (`prefers-reduced-motion`).
- Memasang utility `useFocusTrap` pada 3 modal utama untuk navigasi keyboard yang aman (Tab/Shift-Tab melingkar).
- Memisahkan bundel vendor besar di `vite.config.ts` (`codeSplitting.groups`) untuk performa pemuatan super cepat.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/lib/genre-blueprints.ts` | [NEW] | Pustaka blueprint 6 genre melodrama |
| `src/components/onboarding/BlueprintSelector.tsx` | [NEW] | Dialog pratinjau dan kustomisasi nama tokoh blueprint |
| `src/components/onboarding/OnboardingTour.tsx` | [NEW] | Panduan sorot (coach mark) terpandu interaktif |
| `src/components/compass/MimicryEngineCard.tsx` | [NEW] | Antarmuka peniru gaya menulis penulis (Mimicry) |
| `src/components/modals/TargetChaptersAdjustmentModal.tsx` | [NEW] | Dialog penyesuaian target bab proyek aman |
| `src/components/ui/SkipLink.tsx` | [NEW] | Pintasan navigasi keyboard ramah a11y |
| `src/components/ui/LoadingSplash.tsx` | [NEW] | Animasi pemuatan penuh layar proyek |
| `src/services/blueprint-applier.ts` | [NEW] | Orkestrator penerapan data blueprint ke proyek baru |
| `src/services/project-cloner.ts` | [NEW] | Layanan duplikasi proyek meta (Spin-Off Clone) |
| `src/services/chapter-protection.ts` | [NEW] | Aturan pengecekan perlindungan bab terkunci/terisi |
| `src/services/target-chapters-adjuster.ts` | [NEW] | Mesin pemangkas dan penambah target bab proyek |
| `src/prompts/mimicry-engine.ts` | [NEW] | Prompt ekstraksi pola penulisan naskah |
| `src/hooks/useFocusTrap.ts` | [NEW] | Kait perangkap fokus keyboard modal |
| `src/types/project.ts` | [MODIFY] | Menambahkan bidang voice_dna_project kustom |
| `src/components/dashboard/ProjectCreationModal.tsx` | [MODIFY] | Menambahkan tombol pembuat proyek cetak biru |
| `src/components/dashboard/ProjectCard.tsx` | [MODIFY] | Menambahkan menu Spin-Off dan ubah target |
| `src/pages/Lobby.tsx` | [MODIFY] | Menambahkan landmark a11y dan coach mark |
| `src/components/modals/SettingsModal.tsx` | [MODIFY] | Refaktor 3-tab penyunting dan integrasi Mimicry |
| `vite.config.ts` | [MODIFY] | Konfigurasi pemisahan chunk kode advanced |

---

## Session 18: Sprint 9.5 — QA Hardening
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 9.5

### Summary of Work

#### Fix #1 — Free Write Memory Reindexer
- `chapter-reindexer.ts` — Layanan pendeteksi hilangnya artefak AI (state snapshot, plot radar, lore, summary) akibat penulisan dalam Mode Bebas (Free Write) atau penulisan luring. Menyediakan fungsi sinkronisasi ulang berurutan dengan penanganan AbortSignal.
- `ReindexModal.tsx` — Dialog UI pemrosesan ulang bab yang menampilkan daftar bab tertunda, bar kemajuan asinkron, dan rincian statistik keberhasilan/kegagalan.
- `FreeWriteIndexerWatcher.tsx` — Komponen pemantau global yang memicu dialog reindexer secara otomatis ketika penulis menonaktifkan Mode Bebas jika terdeteksi ada bab yang belum disinkronisasi.
- Menambahkan tombol pembuka Reindexer manual di tab Tutorial pengaturan.

#### Fix #2 — Offline Reconnect AI Backfill
- Memperbarui penangan penyelarasan draf di `useBeatWriter.ts` agar setelah draf offline berhasil disinkronkan ke cloud saat kembali online, sistem secara otomatis menjalankan `reindexChapter()` untuk bab-bab tersebut agar artefak AI tidak bolong.

#### Fix #3 — Chat Approval Conflict Detection
- Memodifikasi `useChatStore.ts` untuk memeriksa apakah suatu nama entitas (karakter, item, world rule) sudah ada di Lorebook sebelum menyetujui draf asisten AI.
- Jika terdeteksi duplikasi nama, persetujuan dibatalkan dan sistem menembakkan toast warning khusus guna mencegah draf basi menduplikasi entitas di pustaka.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/chapter-reindexer.ts` | [NEW] | Orkestrator pembangunan ulang artefak AI bab terlewat |
| `src/components/modals/ReindexModal.tsx` | [NEW] | Dialog visual pemrosesan reindexer naskah bab |
| `src/components/onboarding/FreeWriteIndexerWatcher.tsx` | [NEW] | Watcher transisi mode bebas untuk menawarkan reindex |
| `src/hooks/useBeatWriter.ts` | [MODIFY] | Menjalankan pembangunan ulang artefak setelah draf luring tersinkron |
| `src/store/useChatStore.ts` | [MODIFY] | Proteksi duplikasi nama entitas draf chat Co-Author |
| `src/components/modals/SettingsModal.tsx` | [MODIFY] | Menambahkan tombol reindex manual di tab tutorial |
| `src/pages/Workspace.tsx` | [MODIFY] | Memasang FreeWriteIndexerWatcher |

---

## Session 19: Sprint 9.6 — UX Polish (Notion-Grade Calm)
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED (Phase 1, 2, 4) — Phase 3 DEFERRED. TypeScript, ESLint, Production Build all zero errors.
- **Type**: Sprint 9.6

### Summary of Work

#### Phase 1 — Cmd+K Aksi Cepat Palette & Focus Mode
- `src/lib/command-registry.ts` — Pendaftaran 14 perintah aplikasi lintas 4 grup (Navigasi, Tools, Pengaturan, Lainnya) dengan algoritma penilaian kecocokan kata kunci dwibahasa (Indo-Inggris) beserta pintasan global.
- `src/components/ui/CommandPalette.tsx` — Palet pencarian terpusat ala Notion dengan efek blur premium, rekam jejak perintah terakhir (FIFO), navigasi keyboard penuh, dan eksekusi aman berpelindung.
- Memasang pendengar keyboard global `Ctrl+K` untuk membuka palet dan `Ctrl+1..5` untuk berpindah mode cepat di `App.tsx`.

#### Phase 2 — Slim Header & Hover Mode Revealer
- Mendesain header ruang kerja Workspace menjadi sangat ramping (36-40px) saat `focusMode` aktif untuk mereduksi gangguan visual naskah (menghapus tombol yang tidak mendesak).
- `HoverModeRevealer.tsx` — Penampil switcher mode yang tersembunyi. Muncul meluncur dari atas ketika kursor didekatkan ke tepi atas layar selama 200ms, dan menutup otomatis setelah 1.5 detik kursor menjauh.

#### Phase 4 — Toolbar Slim-Down & Jargon Rename
- Menyederhanakan bilah menu editor menulis naskah (`ProseToolbar.tsx`) menjadi hanya 3 kelompok elemen visual: Status simpan (kiri), hitungan kata (tengah), dan tombol dropdown "⋯ Lainnya" (kanan).
- Dropdown "Lainnya" menampung: pilihan cepat model AI, tombol ubah Mode Pemandu/Bebas, dan pembuat sinopsis cerita kilas balik.
- Mengganti istilah-istilah teknis agar lebih ramah bagi penulis novel:
  - "Arahan Beat" → "Arahan Adegan"
  - "Struktur Bab (Beats)" → "Struktur Bab (Adegan)"
  - "Strict Mode" → "📜 Mode Pemandu"
  - "Free Write Mode" → "🪶 Mode Bebas"

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/ui/CommandPalette.tsx` | [NEW] | Palet pencarian menu pintas Cmd+K premium |
| `src/components/workspace/HoverModeRevealer.tsx` | [NEW] | Pemicu kemunculan switcher mode saat kursor menempel di atas |
| `src/lib/command-registry.ts` | [NEW] | Registrasi 14 perintah menu cepat aplikasi |
| `src/store/useUiStore.ts` | [MODIFY] | Menambahkan state focusMode dan paletteOpen |
| `src/App.tsx` | [MODIFY] | Pemasangan pendengar tombol pintas Ctrl+K dan Ctrl+1..5 |
| `src/pages/Workspace.tsx` | [MODIFY] | Header kondensasi ramping dan pemasangan HoverModeRevealer |
| `src/components/prose/ProseToolbar.tsx` | [MODIFY] | Ramping menulis toolbar dan memindahkan menu ke dropdown "Lainnya" |
| `src/components/prose/BeatEditor.tsx` | [MODIFY] | Penggantian jargon "Beat" menjadi "Adegan" di editor naskah |
| `src/components/prose/BeatIndicator.tsx` | [MODIFY] | Penggantian jargon di indikator kemajuan adegan |

---

## Session 20: Sprint 9.7 — Deep Think Mode (Prose Writer Reasoning Engine)
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 9.7

### Summary of Work
- **Dukungan Penalaran Gemini Pool V2 Streaming**:
  - `gemini-pool.ts` — Membangun fungsi `generateContentStreamV2()` untuk mendukung model "berpikir dulu" (extended thinking). Mengalirkan data thought (pemikiran) dan text (prosa) secara terpisah lewat AsyncGenerator dengan membaca penanda `part.thought === true`.
- **Dukungan OpenRouter V2 & Migrasi Model**:
  - `openRouter-adapter.ts` — Membuat `generateContentStreamV2()` penangan stream penalaran model OpenRouter dengan 3 lapis parsing defensif (`reasoning_details`, `reasoning_content`, `reasoning`).
  - Memperbarui model di router: Claude 3.5 Sonnet dimigrasikan ke **Claude Sonnet 4.6**, DeepSeek Chat dimigrasikan ke **DeepSeek V4 Flash** (gratis), dan menambahkan model premium fiksi terbaik **DeepSeek V4 Pro**.
- **Logika Stream 2-Fase Editor (`useBeatWriter.ts`)**:
  - Mengelola pemisahan data stream: jika bertipe thought, AI sedang menyusun adegan (merancang subtext, cliffhanger, kepatuhan Voice DNA) dan merendernya secara real-time di UI draf tanpa mempolusi dokumen utama. Jika bertipe text, barulah ditulis ke draf naskah.
- **Tampilan UI Editor Pemikiran (`BeatEditor.tsx`)**:
  - Memasang lencana otak berdenyut 🧠 selama fase berpikir AI aktif.
  - Memasang panel collapsible "Rencana Adegan" di atas editor naskah untuk mengalirkan jalan pikiran AI, yang akan menutup otomatis 500ms setelah draf naskah bab mulai ditulis.
- Menambahkan pengaturan Deep Think (master toggle, budget token, dan opsi jalankan pada autopilot) di dropdown "Lainnya" toolbar menulis.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/ai/types.ts` | [MODIFY] | Menambahkan tipe data pertukaran stream ThinkingChunk |
| `src/services/ai/gemini-pool.ts` | [MODIFY] | Layanan stream baru generateContentStreamV2 dengan konfigurasi pemikiran |
| `src/services/ai/openrouter-adapter.ts` | [MODIFY] | Layanan stream baru dengan parser pemikiran OpenRouter |
| `src/services/ai/ai-router.ts` | [MODIFY] | Upgrade generator naskah stream mendukung pemikiran lintas model baru |
| `src/store/useSettingsStore.ts` | [MODIFY] | State penyimpanan setelan Deep Think dan model baru |
| `src/hooks/useBeatWriter.ts` | [MODIFY] | Kait editor naskah memisahkan 2-fase stream AI (thought vs text) |
| `src/services/batch-generator.ts` | [MODIFY] | Pengaman batch: menjatuhkan pemikiran agar autopilot batch hemat waktu |
| `src/components/prose/ProseToolbar.tsx` | [MODIFY] | Pengaturan Deep Think dan model baru di dropdown "Lainnya" |
| `src/components/prose/BeatEditor.tsx` | [MODIFY] | Menampilkan panel visual Rencana Adegan pemikiran AI |
| `src/components/workspace/ProseWriterPanel.tsx` | [MODIFY] | Meneruskan status pemikiran AI ke editor |

---

## Session 21: Sprint 9.8 — Deep Outline (Outline Generator Reasoning Engine)
- **Date**: 2026-05-24
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors
- **Type**: Sprint 9.8

### Summary of Work
- **Dukungan Penalaran Non-Streaming Gemini V2**:
  - `gemini-pool.ts` — Membangun fungsi `generateContentV2()` non-streaming dengan dukungan pemikiran dan Mode JSON. Memisahkan hasil teks dan draf pemikiran secara internal. Membantu meningkatkan akurasi generasi JSON terstruktur.
- **Penerapan pada Generator Rencana Bab (Outline Engine)**:
  - `aiRouter.generateChapterOutline()` — Menggunakan panggilan `generateContentV2` dengan anggaran token berpikir jika diaktifkan. AI sekarang berpikir mendalam merancang kesinambungan misteri, cliffhanger, dan kecocokan pacing KBM sebelum merancang draf rencana bab.
- **Pengaturan & UI Panel khusus (`SeasonArchitectPanel.tsx`)**:
  - Membuat setelan terpisah untuk Deep Outline (master toggle, budget, dan batch toggle) di bawah panel collapsible baru "⚙️ Pengaturan Outline" di atas daftar kartu bab.
  - Generasi batch default menonaktifkan Deep Outline untuk efisiensi kecepatan, sementara regenerasi bab tunggal otomatis mengaktifkannya demi kualitas optimal.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/ai/gemini-pool.ts` | [MODIFY] | Metode generateContentV2 non-streaming dengan mode JSON berpikir |
| `src/services/ai/openrouter-adapter.ts` | [MODIFY] | Metode generateContentV2 symmetry OpenRouter |
| `src/services/ai/ai-router.ts` | [MODIFY] | generateChapterOutline memanfaatkan panggilan penalaran Gemini |
| `src/store/useSettingsStore.ts` | [MODIFY] | Menambahkan setelan konfigurasi Deep Outline |
| `src/store/parts/outlines.ts` | [MODIFY] | Meneruskan setelan budget berpikir pada generasi naskah bab |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Panel UI collapsible pengaturan detail Deep Outline naskah bab |

---

## Session 22: Refactor Audit Follow-up - Maintainability Hardening
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Lint, TypeScript, and production preview zero errors
- **Type**: Refactor

### Summary of Work
- **Penyelarasan Arsitektur & Kontrak**: Menyelaraskan kontrak berkas `architecture.md` dengan perubahan state Zustand terbaru.
- Menetapkan `activeProseModel` sebagai satu-satunya parameter tunggal model naskah cerita yang dipersist dan digunakan oleh router AI.
- Menegaskan pemisahan helper onboarding ke berkas flags dan steps agar komponen sirkuit navigasi bebas dari regresi.
- Menegaskan bahwa helper modul `projects.ts` dan `chapters.ts` dapat diuji secara luring/demo karena Supabase call sekarang di-guard secara ketat jika kredensial belum diisi.
- Menyinkronkan dokumentasi persistensi memori untuk `chapter_versions` dan `recaps`.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `architecture.md` | [MODIFY] | Sinkronisasi kontrak arsitektur sistem dan panduan perawatan kode |
| `session_reports.md` | [MODIFY] | Pencatatan audit sesi maintainability |

---

## Session 23: Story Contract & Canon Guardrails Implementation
- **Date**: 2026-05-25
- **Time/Duration**: 12:39:39 +07:00
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Feature

### Summary of Work
- **Implementasi Story Contract**: Mengunci premis dan canon awal cerita menjadi tipe kontrak JSONB terstruktur (`story_contract`) pada tabel Supabase proyek untuk menghindari inkonsistensi narasi (misal: perubahan hubungan antar tokoh secara tiba-tiba).
- **Layanan Validasi Canon Cerita (`story-contract-validator.ts`)**:
  - Membangun validator deterministik (hard checks / blocker) dan validator semantik AI (pemanfaatan thinking mode) sebelum outline disimpan.
  - Memverifikasi kepatuhan nama tokoh, relasi (`relationship_addressing`), latar belakang, dan alur misteri.
- **Pembaruan Co-Author & Outline**:
  - Mengubah alur brainstorming Co-Author asisten AI di fase awal agar memprioritaskan penyusunan Story Contract, bukan langsung karakter acak.
  - Memblokir penyimpanan outline bab jika draf outline dinyatakan tidak patuh (invalid) oleh validator naskah.
- Menghadirkan editor khusus Story Contract di dialog pengeditan draf asisten AI.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/story-contract-validator.ts` | [NEW] | Validator canon naskah deterministik dan semantik AI |
| `supabase/schema.sql` | [MODIFY] | Menambahkan kolom story_contract JSONB di tabel projects |
| `src/types/project.ts` | [MODIFY] | Definisi antarmuka kontrak cerita dan relasi |
| `src/lib/database.types.ts` | [MODIFY] | Pemetaan tipe Supabase kolom story_contract |
| `src/store/parts/projects.ts` | [MODIFY] | Menyimpan dan menyelaraskan story_contract proyek |
| `src/lib/compassProgress.ts` | [MODIFY] | Memasukkan Story Contract ke dalam syarat kompas |
| `src/components/compass/StoryCompassPreview.tsx` | [MODIFY] | Menampilkan status dan meluncurkan edit Story Contract |
| `src/components/workspace/ContextPanel.tsx` | [MODIFY] | Menghubungkan Story Contract ke bilah samping ide cerita |
| `src/prompts/brainstorm-agent.ts` | [MODIFY] | Memprioritaskan pengisian story_contract di instruksi chat |
| `src/store/useChatStore.ts` | [MODIFY] | Menyimpan draf story_contract yang disetujui |
| `src/prompts/outline-engine.ts` | [MODIFY] | Injeksi aturan Story Contract ke sistem outline |
| `src/components/modals/EditDraftModal.tsx` | [MODIFY] | Penyedia layout edit Story Contract |
| `src/store/parts/outlines.ts` | [MODIFY] | Menjalankan validasi Story Contract sebelum menyimpan outline |

---

## Session 24: UX Revamp P0 - Novice Writer Entry
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: UX Revamp

### Summary of Work
- **Desain Ulang Alur Masuk Penulis Pemula**:
  - Mengubah alur masuk proyek utama: ketika penulis mengklik proyek di dasbor Lobby, mereka langsung diarahkan ke mode `Naskah` (menulis) dengan bilah samping tertutup secara default, memberikan nuansa meja kerja ("Writing Desk") yang tenang alih-alih cockpit yang ramai.
  - Menyediakan tampilan kosong (empty state) ramah penulis pemula jika bab naskah belum memiliki outline cerita, lengkap dengan tombol CTA jelas.
- **Bahasa Ramah Penulis Indonesia**:
  - Menggantikan label-label teknis menjadi istilah menulis dalam bahasa Indonesia yang intuitif:
    - `Ide Cerita` (Brainstorm)
    - `Rencana Bab` (Outline)
    - `Naskah` (Write)
    - `Cek Cerita` (Review)
    - `Peta Cerita` (Visualize)
  - Mengubah penamaan grup palet Cmd+K: `Aksi Cepat` -> `Menu Pintas`, `Tools AI` -> `Bantuan AI`.
- **Modul Metadata Terpadu (`workspace-modes.ts`)**:
  - Memusatkan seluruh ikon, label, deskripsi, shortcut, dan nama perintah mode kerja ke berkas konfigurasi tunggal guna menghindari ketidakkonsistenan label.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/lib/workspace-modes.ts` | [NEW] | Konfigurasi metadata terpadu mode kerja aplikasi |
| `src/pages/Lobby.tsx` | [MODIFY] | Alur masuk menulis instan dan tata letak dasbor tenang |
| `src/pages/Workspace.tsx` | [MODIFY] | Penggunaan metadata mode terpadu dan perbaikan footer |
| `src/components/workspace/ModeSwitcher.tsx` | [MODIFY] | Penyesuaian label bahasa Indonesia dan kontras tema terang |
| `src/lib/command-registry.ts` | [MODIFY] | Menyelaraskan nama perintah Cmd+K dengan kamus baru |
| `src/components/ui/CommandPalette.tsx` | [MODIFY] | Menggunakan istilah Menu Pintas dan bahasa ramah penulis |
| `src/components/workspace/ProseWriterPanel.tsx` | [MODIFY] | Mengintegrasikan empty state menulis baru |
| `src/components/compass/StoryCompassPreview.tsx` | [MODIFY] | Menyederhanakan penjelas Kompas Cerita |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Menggunakan istilah Rencana Bab |

---

## Session 25: Canon Proposal Flow - Unknown Entity Approval
- **Date/Time**: 2026-05-25 17:52:59 +07:00
- **Status**: Completed - TypeScript and production build zero errors
- **Type**: Feature

### Summary of Work
- **Mekanisme Canon Proposal**:
  - Mengatasi keterbatasan validator outline sebelumnya: jika AI mengusulkan karakter atau item baru yang masuk akal tetapi belum canon (belum tercatat di kompas), validator sebelumnya memblokir generasi outline secara kaku.
  - Memperkenalkan model `CanonProposal` untuk menampung sementara naskah rencana bab yang terdeteksi memuat entitas baru non-canon.
  - Alih-alih langsung memblokir atau langsung menyimpan tanpa izin, sistem menampilkan daftar entitas baru tersebut di Rencana Bab sebagai proposal draf.
- **Alur Kerja Persetujuan**:
  - Jika pengguna mengklik **Setujui (Approve)**: entitas baru otomatis ditambahkan ke Lorebook, dicatat di `story_contract.canon_entities`, dan draf rencana bab segera disimpan secara resmi.
  - Jika **Tolak (Reject)**: draf ditolak dan dibuang agar pengguna dapat memicu generasi ulang naskah dengan canon lama.
- **Relasi Kata Sapaan**:
  - Memperbarui `story-contract-validator.ts` agar kata sapaan relasi seperti "Mas" atau "Sayang" tidak diidentifikasi sebagai tokoh non-canon baru, melainkan hanya menembakkan peringatan (warning) biasa.
- Menyinkronkan dan mengunci persyaratan Story Contract di seluruh tombol Season Architect, Chapter Outline Card, dan Prose Writer.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/canon-proposal-service.ts` | [NEW] | Layanan pengonversi entitas non-canon menjadi proposal persetujuan |
| `src/components/workspace/CanonProposalCard.tsx` | [NEW] | Kartu UI persetujuan draf entitas non-canon baru |
| `src/types/project.ts` | [MODIFY] | Menambahkan tipe data antrean CanonProposal |
| `src/services/story-contract-validator.ts` | [MODIFY] | Membedakan sapaan relasi sebagai warning biasa |
| `src/store/parts/outlines.ts` | [MODIFY] | Pemasangan antrean proposal dan aksi simpan terblokir |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Menampilkan daftar antrean proposal dan aksi setuju/tolak |
| `src/components/workspace/ChapterOutlineCard.tsx` | [MODIFY] | Mengetatkan pengaman outline regenerasi membutuhkan Story Contract |

---

## Session 26: UX Polish - Co-Author Auto-Advance & Story Compass
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: ✅ COMPLETED - TypeScript, ESLint, Production Build, and logged-in browser smoke test all pass
- **Type**: UX Polish

### Summary of Work
- **Orkestrasi Auto-Advance**:
  - Mengatasi jeda canggung pasca pengguna menyetujui draf asisten AI di Chat Brainstorm: setelah draf tokoh/item/misteri disetujui (`Setuju!`), Co-Author secara otomatis menembakkan kelanjutan percakapan dan memandu penulis ke slot Story Compass kosong berikutnya.
  - Menyisipkan pesan sistem `system` bernuansa tenang di panel chat untuk memberi tahu keberhasilan penyimpanan, lalu memicu respons asinkron asisten dengan parameter `internalContext`.
  - Memasang pelindung `activeDraftActions` untuk menghindari pengiriman klik ganda draf yang dapat memicu generasi ganda.
- **Penyunting Gaya Laci Meluncur (Drawer)**:
  - Mengubah dialog pengeditan draf `EditDraftModal.tsx` yang sebelumnya berupa modal di tengah layar (menutupi percakapan chat) menjadi laci ramping (drawer) yang meluncur dari sebelah kanan layar, mempertahankan keterbacaan riwayat chat di sebelah kiri.
- **Story Compass Interaktif**:
  - Menjadikan kapsul tokoh utama, tokoh antagonis, ending, dan misteri di Story Compass dapat diklik langsung untuk membuka laci pengeditan manual secara cepat tanpa melalui asisten AI.
  - Mengarahkan tombol CTA akhir Story Compass langsung ke halaman Rencana Bab saat kompas terisi lengkap.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/lib/compassProgress.ts` | [NEW] | Penilai progres Story Compass terpadu (DRY) |
| `src/store/useChatStore.ts` | [MODIFY] | Mesin auto-advance chat asisten AI dan pengaman klik ganda |
| `src/components/chat/CoAuthorChat.tsx` | [MODIFY] | Visualisasi pesan sistem ramping di linimasa chat |
| `src/components/modals/EditDraftModal.tsx` | [MODIFY] | Rombak desain dari modal tengah menjadi drawer kanan meluncur |
| `src/components/compass/StoryCompassPreview.tsx` | [MODIFY] | Kapsul kompas interaktif dan CTA Outline baru |
| `src/components/workspace/ContextPanel.tsx` | [MODIFY] | Menghubungkan klik kapsul sidebar ke drawer pengeditan |

---

## Session 27: UX Revamp P0.1 - Section Onboarding
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: UX Revamp

### Summary of Work
- **Mesin Onboarding Modular**:
  - Merefaktor komponen `OnboardingTour.tsx` agar mendukung ID pemandu terpisah (`tourId`) dan langkah tutorial yang unik per area aplikasi.
  - Menyimpan status kelayakan tayang tutorial per area di localStorage sehingga tutorial dasbor Lobby dan tutorial masing-masing mode kerja Workspace (Ide Cerita, Naskah, Cek Cerita, dll.) muncul satu kali hanya saat pertama kali area tersebut dibuka.
- **Pengaturan Reset**: Memperbarui aksi `Reset Onboarding` di pengaturan aplikasi agar membersihkan seluruh bendera onboarding lokal, memungkinkan tutorial diputar kembali dari awal secara menyeluruh.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/onboarding/OnboardingTour.tsx` | [MODIFY] | Penyesuaian ke mesin onboarding modular multi-tour |
| `src/pages/Lobby.tsx` | [MODIFY] | Memasang langkah tutorial Lobby dasbor secara eksplisit |
| `src/pages/Workspace.tsx` | [MODIFY] | Memasang tutorial kontekstual dinamis berdasarkan mode kerja aktif |
| `src/components/modals/SettingsModal.tsx` | [MODIFY] | Aksi reset membersihkan seluruh status pemandu lokal |

---

## Session 28: Hotfix - AI Draft UI Rendering
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Format UI Draf Misteri**: Memperbaiki anomali draf 'Mystery' usulan asisten AI yang sebelumnya merender string JSON mentah di dalam gelembung percakapan chat. Menghadirkan tampilan terstruktur cantik berikon khas.
- **Kunci Nama Alternatif**:
  - Mengatasi anomali model LLM yang terkadang mengembalikan kunci spesifik seperti `item_name`, `character_name`, atau `rule_name` alih-alih kunci standar `name`.
  - Memasang filter pencarian defensif di bubble chat, dialog draf, dan aksi penyimpanan Zustand untuk menghindari penyimpanan entitas berlabel "Tanpa Nama".
- Memperbaiki tag penutup `</div>` yang hilang di berkas `ProseToolbar.tsx` yang memicu kegagalan kompilasi.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/chat/AiMessageBubble.tsx` | [MODIFY] | Format khusus visual draf misteri dan penangkap kunci nama alternatif |
| `src/components/modals/EditDraftModal.tsx` | [MODIFY] | Pre-fill formulir menggunakan kunci nama alternatif jika name hilang |
| `src/store/useChatStore.ts` | [MODIFY] | Penyelamatan penamaan entitas saat draf didorong ke store |
| `src/components/prose/ProseToolbar.tsx` | [MODIFY] | Menambahkan tag penutup div yang hilang |

---

## Session 29: Hotfix - Prose Writer Empty State UX Polish
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Desain Ulang Ruang Kerja Kosong**:
  - Mengatasi kekosongan canggung dan instruksi membingungkan ketika penulis baru pertama kali membuka proyek dalam mode menulis naskah sebelum memilih bab dari panel.
  - Membangun dasbor interaktif Notion-grade yang indah dilengkapi efek pendaran glassmorphism di tengah area kerja.
- **Tombol Aksi Cepat**:
  - Jika proyek belum memiliki bab outline: menyodorkan anjuran hangat dan tombol CTA cepat menuju halaman Rencana Bab untuk menyusunnya.
  - Jika proyek sudah memiliki bab: menampilkan daftar bab interaktif di tengah kanvas lengkap dengan nomor, judul bab, lencana status menulis (Rencana, Draft, Selesai), dan indikator kemajuan. Penulis dapat langsung mengklik bab untuk mulai menulis tanpa harus membuka bilah samping.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/workspace/ProseWriterPanel.tsx` | [MODIFY] | Rombak total empty state menulis menjadi dasbor interaktif bab |

---

## Session 30: Hotfix - Remove All Dummy Data
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Pembersihan Data Proyek Palsu**: Mengosongkan data proyek tiruan `DUMMY_PROJECTS` di `src/store/parts/projects.ts` dan menginisialisasi state dengan array kosong guna menghadirkan awal aplikasi yang bersih tanpa anomali pembacaan data.
- **Pembersihan Modul Bab Tiruan**:
  - Mengosongkan konstanta tiruan `DUMMY_CHAPTERS`, `DUMMY_CHARACTERS`, dan `DUMMY_ITEMS` di `src/store/parts/chapters.ts`.
  - Menghapus pengondisian keras ID proyek contoh di metode pemuatan `loadProjectData` agar aplikasi murni bersandar pada data dinamis pengguna yang tersimpan di Supabase.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/store/parts/projects.ts` | [MODIFY] | Penghapusan proyek tiruan dan inisialisasi state bersih |
| `src/store/parts/chapters.ts` | [MODIFY] | Penghapusan data naskah tiruan dan merapikan impor mati |

---

## Session 31: Hotfix - Dynamic Lobby Welcome Subtitle
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Subjudul Dinamis Dasbor**:
  - Mengubah subjudul dasbor dasbor utama "Selamat malam, Bima ✨" menjadi dinamis dan bermotivasi tinggi, menggantikan penulisan statis novel tiruan.
  - Mengimplementasikan pengurutan proyek untuk menemukan karya aktif pengguna yang paling baru disentuh (berdasarkan stempel waktu pembaruan) untuk menyodorkan pesan hangat: `Novel [Judul] menunggu kelanjutannya! ✦`.
- **Penanganan Kondisi Khusus**:
  - Jika pengguna belum memiliki proyek (0 proyek): menyodorkan dorongan kreatif awal `Setiap mahakarya dimulai dari kalimat pertama. Mari buat novel pertama Anda! ✦`.
  - Jika seluruh karya telah rampung ditulis: merayakan keberhasilan dengan pesan kelulusan menulis `Semua karya Anda telah selesai ditulis dengan indah. Siap merajut kisah baru berikutnya? ✦`.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/pages/Lobby.tsx` | [MODIFY] | Algoritma penyusun subjudul Lobby dinamis berdasarkan status menulis aktif |

---

## Session 32: Hotfix - Live Productivity & Achievement Stats
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Statistik Produktivitas Riil**:
  - Menggantikan kalkulasi statis metrik performa menulis Lobby dasbor yang sebelumnya bersandar pada angka perkiraan statis.
  - Menghadirkan kueri Supabase asinkron saat Lobby dimuat untuk menjumlahkan bab-bab yang berstatus menulis aktif (`DRAFT`, `FINAL`, `IMPORTED`) di seluruh proyek penulis.
  - Mengompilasi status pengerjaan proyek riil (misal: menampilkan fasa menulis `Naskah — Bab 95` dan status relatif aktivitas terakhir `Baru saja` atau `3 hari lalu`).
- **Pembersihan Arsip Palsu**: Menghapus kartu novel arsip tiruan dari bagian Arsip, dan menggantikannya dengan visual kartu motivasi kosong terputus guna menjaga keselarasan indikator "0 Tamat" di dasbor.
- **Pintasan Navigasi Dinamis**: Memperbaiki tautan proyek statis pada bilah navigasi bawah seluler agar otomatis mengarahkan ke proyek aktif terakhir pengguna secara aman.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/pages/Lobby.tsx` | [MODIFY] | Mengompilasi metrik performa menulis, pencapaian arsip, dan navigasi naskah dinamis dari Supabase |

---

## Session 33: Hotfix - Debug Mode Story Data Export
- **Date**: 2026-05-25
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix

### Summary of Work
- **Pemasangan Tab Debug**: Memperkenalkan tab penalaan "Debug" (berikon 🐞) di dialog pengaturan aplikasi berdampingan dengan setelan Kunci, Naskah, dan Tutorial, lengkap dengan transisi Framer Motion yang selaras.
- **Metrik Jumlah Elemen Aktif**: Menampilkan rangkuman hitungan entitas yang terunduh dan terpasang pada proyek berjalan (jumlah bab rencana, karakter, misteri, benda, aturan dunia, dan plot thread).
- **Pengunduh JSON Satu-Klik**: Mengimplementasikan penangan `handleDownloadDebugData` yang mengompilasi seluruh elemen proyek (kompas, lorebook, outlines, dan linimasa status karakter) ke dalam berkas JSON terformat indah bersandi tanggal khusus untuk memfasilitasi kebutuhan pelaporan kesalahan atau pemindahan manual.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/components/modals/SettingsModal.tsx` | [MODIFY] | Tab Debug baru dengan visual metrik proyek dan penangan unduh berkas JSON |

---

## Session 34: Workspace Cleanup - Mixed/Dirty Commit Hardening
- **Date**: 2026-05-28
- **Time/Duration**: 00:00:56 +07:00
- **Status**: Completed - Two clean commits, workspace restored to clean state
- **Type**: Maintenance / Git Cleanup

### Summary of Work
- **Pemberkasan Aman**: Melakukan pembersihan menyeluruh terhadap area kerja yang sempat kotor akibat percampuran berkas kode naskah, aset sementara, dan dokumentasi lokal.
- Membuat salinan cadangan non-destruktif ke `D:\tmp\vibenovel-cleanup-backup` sebelum melakukan staging git.
- **Aturan Abaikan Git**: Memperbarui berkas [`.gitignore`](D:/Coding/vibenovel/.gitignore) dengan mendaftarkan aturan pengabaian folder `tmp/` dan berkas gambar hasil uji coba di tingkat root agar tidak mencemari riwayat commit.
- Membersihkan spasi gantung di akhir berkas dokumentasi HTML, dan memecah staging menjadi dua commit bersih berturut-turut untuk menjaga kerapian jejak perubahan tim.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `.gitignore` | [MODIFY] | Mendaftarkan aturan abaikan folder tmp/ dan aset gambar root |
| `architecture.md`, `session_reports.md` | [MODIFY] | Menyinkronkan catatan pembersihan sesi |

---

## Session 35: Dynamic Task-Specialized Multi-Model AI Router & Auto-Pilot
- **Date**: 2026-05-28
- **Time/Duration**: 22:54:00 +07:00
- **Status**: Completed - Build, TypeScript, and Lint all zero errors
- **Type**: Feature

### Summary of Work
- **Pemisahan Kunci API & State**:
  - Memecah penyimpanan kunci `openRouterKey` di menu pengaturan menjadi dua bidang terpisah: **OpenRouter Free Key** (untuk pemanggilan gratisan asinkron) dan **OpenRouter Paid Key** (untuk generasi kreatif naskah premium).
  - Menghadirkan opsi model `'auto'` (Rekomendasi Auto-Pilot) dan flag global `autoPilotEnabled` (default aktif) di store pengaturan.
- **Implementasi Orkestrasi Auto-Pilot (`ai-router.ts`)**:
  - *Tugas Analitik/Latar Belakang* (State Snapshot, Plot Radar, Lore Extractor, Batch Outline) diarahkan secara hemat dan gratis menuju Gemini Flash via `gemini-pool` gratisan.
  - *Co-Author Brainstorm* dialirkan instan ke Gemini Flash gratisan.
  - *Generasi Prosa Adegan*: Jika model diatur ke `'auto'` atau Auto-Pilot aktif, sistem secara otomatis memilih model berbayar premium pilihan pengguna (Claude 3.5 Sonnet) via OpenRouter Paid Key. Jika Paid Key kosong, router mengalihkan secara cerdas ke model gratisan OpenRouter atau Gemini Pool untuk menghemat biaya tanpa menghentikan proses penulisan.
- **Fallback Silang Dua-Arah**:
  - Jika Gemini Pool gratisan habis kuota/terkena rate limit (429), sistem otomatis mengalihkan kueri ke OpenRouter Free model menggunakan OpenRouter Free Key.
  - Jika adapter OpenRouter berbayar/gratis mengalami kegalangan API, router melakukan fallback ke Gemini Pool gratisan agar penulisan naskah tetap berjalan.
- **Desain UI Settings Baru**: Memasang dual kolom input kunci di SettingsModal beserta toggle switch pengaktif Auto-Pilot.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/store/useSettingsStore.ts` | [MODIFY] | Pemisahan penyimpanan kunci Free/Paid, penambahan opsi 'auto' |
| `src/services/ai/types.ts` | [MODIFY] | Sinkronisasi antarmuka model pilihan dan masukan generasi |
| `src/services/ai/openrouter-adapter.ts` | [MODIFY] | Pemetaan model gratisan dan adapter penanganan kegagalan |
| `src/services/ai/gemini-pool.ts` | [MODIFY] | Pengalihan otomatis kueri ke OpenRouter gratis jika kuota pool habis |
| `src/services/ai/ai-router.ts` | [MODIFY] | Orkestrator utama pembagian tugas cerdas Auto-Pilot dan pembungkus fallback |
| `src/components/modals/SettingsModal.tsx` | [MODIFY] | UI input ganda kunci, switch Auto-Pilot, dan opsi auto teratas |

---

## Session 36: Word Count Target, KBM Formatting, & State Generation Fix
- **Date**: 2026-05-29
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: Hotfix / Feature Polish

### Summary of Work
- **Injeksi Target Jumlah Kata**:
  - Menambahkan kolom `wordCountTarget` di antarmuka input `ProseGenerateInput` dan menyalurkan nilai `project.word_count_target` dari store proyek di `prose-context.ts`.
  - Memperbarui sistem prompt `prose-writer.ts` untuk menghitung alokasi kata per-adegan secara dinamis (`Math.ceil(wordCountTarget / beats.length)`) dan menginstruksikan AI agar menulis sepadan dengan target tersebut tanpa merusak tempo cerita.
- **Ketatan Protokol KBM**: Memperketat batasan paragraf melodrama di prompt: maksimal 2-3 kalimat per paragraf dengan baris baru yang rapat agar naskah nyaman dibaca di layar telepon genggam (format KBM).
- **Perbaikan JSON Ekstraktor Status**: Memperbaiki kegagalan ekstraksi status karakter asinkron di `state-tracker.ts` akibat pemanggilan model Gemini tanpa konfigurasi Mode JSON (`jsonMode: true`), menyebabkannya sering gagal terurai. Mengaktifkan mode JSON mengembalikan akurasi parsing menjadi tangguh.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/ai/types.ts` | [MODIFY] | Menambahkan variabel target kata prose |
| `src/services/prose-context.ts` | [MODIFY] | Mengalirkan setelan target kata proyek ke input AI |
| `src/prompts/prose-writer.ts` | [MODIFY] | Instruksi kalkulasi kata per-adegan dan pembatasan paragraf KBM |
| `src/services/state-tracker.ts` | [MODIFY] | Mengaktifkan jsonMode untuk keandalan ekstraksi JSON status karakter |

---

## Session 37: Onboarding Splash, Collapsible Outline Peek & AI Guided Flow Hardening
- **Date**: 2026-05-29
- **Time/Duration**: N/A
- **Status**: Completed - Build, PWA service worker, and TypeScript zero errors
- **Type**: UI Polish / Feature Hardening

### Summary of Work

#### STEP 1: Premium HTML/CSS Neon Loader Splash
- Menggantikan elemen kosong aplikasi `<div id="root"></div>` di `index.html` dengan logo animasi neon V-N interlinked bergaya Malam Kreatif murni berbasis HTML dan CSS.
- Menerapkan efek pendaran breathing dan sapuan liquid neon CSS keyframes beserta lingkaran blur warna-warni yang langsung berjalan instan saat berkas dimuat.
- Menghadirkan subjudul pemuatan yang menenangkan: *"Sedang memuat sistem AI menulis untuk pertama kalinya. Proses ini hanya berjalan lambat di awal."*, menghapus kecanggangan layar putih kosong selama React memuat bundel javascript.

#### STEP 2: AI Guided Transition Banner
- Memperbarui editor menulis `FreeWriteEditor.tsx` agar memantau ketersediaan naskah rencana bab (outline) bab bersangkutan dengan memeriksa ketersediaan adegan naskah secara tangguh.
- Menampilkan spanduk (banner) glassmorphism premium jika naskah rencana bab ditemukan, menawarkan tombol cepat:
  1. **Tulis dengan AI (Pemandu)**: langsung mematikan Mode Bebas dan beralih ke Mode Pemandu (Beat-by-Beat).
  2. **Tolak & Tulis Manual**: menyimpan penolakan di localStorage proyek agar spanduk menghilang dengan transisi keluar yang manis.

#### STEP 3: Collapsible Outline Peek Panel & Keyboard Shortcut
- Memasang tombol **👁️ Intip Outline** di bilah atas menulis mode bebas.
- Mengintegrasikan tombol pintas keyboard global **`Alt + O`** untuk membuka panel tersebut secara cepat.
- Panel berupa laci semi-transparan meluncur yang menyajikan rangkuman rencana bab (sinopsis, nada emosi, cliffhanger, dan adegan rencana) secara instan selama menulis.

#### STEP 4: Smart Action Loop Post-Outline
- Menyempurnakan penutupan dialog pembuatan naskah bab otomatis (outline batch) di `SeasonArchitectPanel.tsx` dengan menyajikan 3 pilihan aksi:
  1. **✍️ Tulis Naskah Sekarang**: menutup dialog, otomatis memindahkan mode kerja proyek ke menulis (`write`), dan memuat bab terkait untuk langsung ditulis.
  2. **📋 Generate Outline Lagi**: menutup panel hasil tetapi membiarkan dialog generator tetap terbuka dengan otomatis mengisi isian nomor bab rentang berikutnya.
  3. **Tutup**: membersihkan dialog secara standar.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `index.html` | [MODIFY] | Penanaman neon logo loader splash murni HTML/CSS anti-flicker |
| `src/components/prose/FreeWriteEditor.tsx` | [MODIFY] | Spanduk tawaran asisten pemandu, keyboard Alt+O, dan laci intip outline |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Aksi multi-pilihan ramah penulis pasca pembuatan outline |

---

## Session 38: Context Panel Polish & Pacing Warnings UX
- **Date**: 2026-05-29
- **Time/Duration**: N/A
- **Status**: Completed - Build and TypeScript zero errors
- **Type**: UX Polish

### Summary of Work
- **Pembenahan Kerusakan Sintaks**: Memperbaiki kerusakan penulisan prompt di `brainstorm-agent.ts` akibat kesalahan penempelan kode sesi sebelumnya.
- **Pustaka Lore yang Dapat Disunting**:
  - Menyisipkan label `📚 Pustaka Lore` di bilah samping kanan mode Rencana Bab.
  - Menjadikan kartu karakter, benda, dan aturan dunia di bilah samping tersebut dapat diklik untuk meluncurkan drawer penyunting manual secara instan.
- **Animasi Visual AI Kreatif**: Menggantikan tulisan teks statis pemrosesan AI di SeasonArchitectPanel dengan visual pendaran merah jambu ikon otak `psychology` berdenyut lambat disertai titik-titik animasi Framer Motion.
- **Visualisasi Pacing Peringatan & Aksi Auto-Fix**:
  - Mengubah tampilan datar log kesalahan pacing naskah rencana bab menjadi barisan kartu bergaya modern.
  - Memisahkan pesan header dengan detail masalah (misal: `Bab 1: TONE_MISMATCH`) menggunakan regex parser, serta mewarnai kartu berdasarkan kegentingan (merah menyala untuk blocker, oranye halus untuk peringatan).
  - **Fitur Perbaikan Otomatis (Auto-Fix)**: Memasang tombol "✨ Perbaiki Otomatis" di kartu peringatan pacing. Klik tombol otomatis mengekstrak perintah `autoFixInstruction` dan meluncurkan regenerasi outline berpikir mendalam (Deep Outline) agar AI memperbaiki anomali emosi/nada tersebut secara khusus. Kartu peringatan otomatis memudar terhapus setelah berhasil diperbaiki.

### Files Affected
| File | Action | Change Summary |
|---|---|---|
| `src/services/ai/types.ts` | [MODIFY] | Menambahkan penampung parameter instruksi perbaikan otomatis |
| `src/prompts/outline-engine.ts` | [MODIFY] | Menyisipkan blok instruksi wajib perbaikan auto-fix di prompt outline |
| `src/store/parts/outlines.ts` | [MODIFY] | Mengalirkan instruksi auto-fix ke metode regenerasi |
| `src/prompts/brainstorm-agent.ts` | [MODIFY] | Perbaikan kerusakan tag prompt |
| `src/components/workspace/ContextPanel.tsx` | [MODIFY] | Menghubungkan klik kartu lorebook bilah samping rencana bab ke editor draf |
| `src/components/compass/StoryCompassPreview.tsx` | [MODIFY] | Sinkronisasi tipe properti penyunting |
| `src/components/workspace/SeasonArchitectPanel.tsx` | [MODIFY] | Dasbor log peringatan pacing modern beranimasi dan pemicu Auto-Fix AI |
