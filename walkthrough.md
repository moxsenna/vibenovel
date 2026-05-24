# VibeNovel v2 — Integration & Orchestration Walkthrough

Dokumen penutupan yang merinci keberhasilan penyelarasan integrasi Supabase (Sprint 1A) dan Pemecahan Komponen Modular serta Poles UI (Sprint 1B) di dalam direktori **`d:\Coding\vibenovel`**.

---

## 🚀 Sprint 1B — Component Extraction & UI Polish

Pada Sprint 1B, kita memecah monolith `Lobby.tsx` dan `Workspace.tsx` menjadi komponen-komponen terpisah, mengintegrasikan **Framer Motion** untuk efek micro-animations kelas premium, dan memoles responsivitas mobile (375px).

### 🛠️ Komponen Modular yang Diekstrak

1. **`src/components/workspace/ModeSwitcher.tsx`**
   - **Deskripsi**: Menu tab horizontal untuk perpindahan mode di Workspace header (Brainstorm, Outline, Menulis, Review).
   - **Premium Animation**: Menggunakan `layoutId="activeWorkspaceMode"` dari `framer-motion` untuk menghadirkan sliding pill highlight yang bergeser mulus mengikuti tab aktif.
   - **Toko**: Menggunakan `useUiStore` untuk menyinkronkan mode aktif.

2. **`src/components/workspace/ContextPanel.tsx`**
   - **Deskripsi**: Sidebar panel kiri (~30% viewport width) yang dinamis menampilkan informasi berdasarkan mode aktif.
     - *Brainstorm*: Story Compass (5-segment progress bar & checklist) yang memberitahu langkah-langkah esensial penulisan novel dengan badge penunjuk "Yuk isi ini dulu!".
     - *Outline*: Pustaka Lore / Lorebook (Character list, Items, World Rules).
     - *Write*: Chapter synopsis, key events, dan detail lokasi/tone.
     - *Review*: Plot Radar QA logs.
   - **Premium Animation**: Animasi slide-in/slide-out pegas (`type: 'spring'`) saat sidebar dibuka/ditutup. Menggunakan stagger effects untuk memunculkan item list satu per satu.
   - **Anti-Layout-Shift**: Dibungkus dalam container lebar tetap (`w-[360px]`) di dalam elemen transisi sehingga teks utama tidak flicker atau bergoyang saat sidebar bergeser.

3. **`src/components/chat/CoAuthorChat.tsx`**
   - **Deskripsi**: Interface obrolan interaktif dengan asisten penulis (Co-Author) kecerdasan buatan.
   - **Fitur**: Auto-scroll ke bagian bawah setiap kali ada pesan baru atau loading state berubah. Menggunakan `AnimatePresence` untuk memunculkan pesan baru dengan efek slide-up dan fade-in.

4. **`src/components/chat/AiMessageBubble.tsx` & `src/components/chat/ApprovalCard.tsx`**
   - **Deskripsi**: Bubble chat asisten AI dengan radial gradient radial "Malam Kreatif" dan kartu interaktif penentu draf lore.
   - **Aksi**: Tombol Setuju (hijau neon premium), Edit Dulu (container warna sekunder), dan Tolak/Refresh (garis luar) terintegrasi langsung dengan `useChatStore`.

5. **`src/components/dashboard/` & `src/components/modals/`**
   - **Deskripsi**: Modul card, stats, modal pembuatan proyek, dan modal pengaturan yang diekstrak secara rapi dari `Lobby.tsx` untuk menjaga performa dan keterbacaan kode.

---

## 📱 Mobile Responsiveness (375px Target)

- **Hiding Sidebar**: Sidebar `ContextPanel` disembunyikan sepenuhnya di layar kecil (`<768px`) untuk memaksimalkan ruang canvas penulisan.
- **Bottom Navigation**: Untuk menggantikan panel navigasi atas dan kiri pada perangkat mobile, kita menambahkan bottom navigation bar di `Lobby.tsx` dan `Workspace.tsx` yang ramping, ramah jempol, serta memiliki visual indicator aktif yang menonjol ke atas.
- **Responsive Controls**: Filter pencarian, grid novel, dan tombol aksi diatur ke dalam layout flex-col pada mobile dan kembali ke flex-row secara dinamis di desktop.

---

## 🧪 Hasil Verifikasi & Kualitas Kode

Sesuai aturan ketat penutupan sprint:

1. **TypeScript Type Safety Check:**
   - Perintah: `npx tsc -b --noEmit`
   - Status: **SUCCESS (Zero errors)**. Tidak ditemukan kesalahan ketidakcocokan tipe data atau import.

2. **Vite Production Bundling:**
   - Perintah: `npm run build`
   - Status: **SUCCESS (Zero errors / warnings)**. Seluruh modul dikompilasi sempurna dalam waktu **489ms**!

---

## 🏁 Sprint 1A — Supabase & Auth Integration: Walkthrough

Sebagai rangkuman sesi sebelumnya, berikut adalah perbaikan-perbaikan kritis di Sprint 1A yang tetap terjaga integritas fungsinya di Sprint 1B:

### 1. Optimistic UUID Syncing (Lorebook Items CRUD)
- **Fungsi**: CRUD `addCharacter`, `addItem`, dan `addWorldRule` di [useProjectStore.ts](file:///d:/Coding/vibenovel/src/store/useProjectStore.ts) menggunakan optimistic update. Kita mengambil record asli database via `.select().single()` saat sukses, kemudian menimpa ID sementara dengan UUID resmi Supabase agar aksi update/delete bab/karakter berikutnya tidak gagal.

### 2. State & Loading Syncing (Project Creation)
- **Fungsi**: Memperbaiki loading spinner tersangkut dan memastikan proyek baru langsung terpasang sebagai `activeProject` saat berhasil dibuat di database.

### 3. Otentikasi & Guard Validations
- **Fungsi**: Menerapkan dynamic Offline/Demo Mode jika koneksi Supabase di `.env.local` tidak diatur, dan mewajibkan redirect `/login` jika Supabase diaktifkan.

---

## 🚀 Sprint 1C — Brainstorm Agent (Real AI)

Pada Sprint 1C, mock responder obrolan di `useChatStore` diganti sepenuhnya dengan panggilan nyata ke Gemini API menggunakan pool rotasi key dari `gemini-pool.ts`. Co-Author Chat kini sadar status (state-aware) dan mampu membimbing user melalui pengisian Story Compass secara bertahap.

### 🛠️ File Baru

1. **[src/prompts/brainstorm-agent.ts](file:///d:/Coding/vibenovel/src/prompts/brainstorm-agent.ts)**
   - `buildCoAuthorSystemInstruction()` menghasilkan sistem prompt Gemini yang dinamis berdasarkan elemen Story Compass yang masih kosong.
   - `detectCompassGap()` mendeteksi elemen pertama yang belum terisi (Premis → Protagonis → Antagonis → Ending → Mystery → Complete).
   - Setiap gap memiliki panduan spesifik dengan template `<DRAFT_DATA>` JSON agar AI mengajukan draf yang bisa di-parse otomatis oleh UI.
   - Aturan melodrama KBM dan anti-melantur bawaan di dalam sistem prompt.

2. **[src/components/compass/StoryCompassPreview.tsx](file:///d:/Coding/vibenovel/src/components/compass/StoryCompassPreview.tsx)**
   - Komponen modular yang diekstrak dari `ContextPanel.tsx`.
   - Menampilkan progress bar 5 segmen, checklist dinamis, badge pulsasi "Yuk isi ini dulu!", chip karakter, dan CTA "Story Compass Lengkap!" saat semua 5 elemen terisi.

### 🔧 File yang Dimodifikasi

3. **[src/store/useChatStore.ts](file:///d:/Coding/vibenovel/src/store/useChatStore.ts)** — Rewrite total:
   - **BYOK Guard**: Cek API key sebelum kirim pesan; jika kosong, tampilkan pesan error + link Google AI Studio.
   - **Real AI**: Mock `setTimeout` dihapus → panggilan `aiRouter.chatCoAuthor()` dengan system instruction dinamis.
   - **Compass State Injection**: Sebelum setiap panggilan AI, snapshot state Story Compass dari `useProjectStore` dikirim untuk mendeteksi gap.
   - **Draft Data Mapping**: Draf dari AI di-map ke `ChatMessage.draftData` dengan `status: 'pending'` → merender `ApprovalCard`.
   - **Anti-Melantur**: Counter off-topic per proyek. Setelah 3x, override sistem prompt untuk paksa AI mengajukan draf.
   - **Approval Flow**: Klik "Setuju!" menjalankan CRUD optimistic ke Supabase/lokal (addCharacter, addItem, addWorldRule, updateProject, mystery layer lokal).
   - **Error Handling**: Rate limit (429), missing key, dan error generik menghasilkan pesan ramah dalam Bahasa Indonesia.

4. **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)**
   - Metode `chatCoAuthor()` diperbarui dengan parsing `<DRAFT_DATA>` yang lebih andal: pembersihan code fence markdown, penghapusan trailing comma, validasi tipe draf.

5. **[src/components/workspace/ContextPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ContextPanel.tsx)**
   - Bagian brainstorm mode diganti dengan render `<StoryCompassPreview />` (~130 baris inline dihapus).

### 🧪 Hasil Verifikasi

1. **TypeScript**: `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
2. **Production Build**: `npm run build` → **SUCCESS (Zero errors, 999ms)** ✅

---

## 🎯 Langkah Berikutnya (Sprint 1D — Outline Engine)
- **Fase**: Generate rich outline per chapter menggunakan Gemini.
- **Fokus**: Season Architect panel, ChapterOutlineCard, 5 entry points (batch, single regenerate, manual, import, range), dan emotional rollercoaster pattern validator.


---

## 🗺 Sprint 1D — Outline Engine (Real AI)

Sprint 1D mentransformasi Season Architect dari placeholder statis menjadi mesin generator outline yang mematuhi 5 prinsip KBM Retention Engine. Outline kini diproduksi sequential (bukan paralel) agar setiap bab "ingat" konteks bab sebelumnya, dan validator pacing menjaga emotional rollercoaster tetap variatif.

### 🛠 File Baru

1. **[src/prompts/outline-engine.ts](file:///d:/Coding/vibenovel/src/prompts/outline-engine.ts)** (~190 baris)
   - `buildOutlineSystemInstruction()` mengarahkan AI dengan rules retention: Layered Mystery, Emotional Rollercoaster, Hook Chain, False Resolution, Character Investment.
   - `buildOutlineUserPrompt()` memasukkan Story Compass state lengkap, karakter aktif, items, mystery layers + breadcrumb, dan konteks bab sebelumnya.

2. **[src/lib/kbm-pacing.ts](file:///d:/Coding/vibenovel/src/lib/kbm-pacing.ts)** (~160 baris)
   - `validateEmotionalPattern()` mendeteksi 3 bab tone identik berturut-turut dan 5 bab tanpa breather.
   - `validateCliffhangerVariety()` memastikan tipe cliffhanger bervariasi.
   - **Warning-only**: tidak memblokir generation, hasil di-inject ke prompt bab berikutnya untuk koreksi mandiri.

3. **[src/components/workspace/ChapterOutlineCard.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ChapterOutlineCard.tsx)** (~390 baris)
   - Card expand/collapse dengan Framer Motion: collapsed menampilkan tone chip + cliffhanger chip; expanded menampilkan 20+ field detail.
   - Inline manual edit form (functional, tersimpan ke Zustand + Supabase dengan flag `outline_source: 'MANUAL'`).

4. **[src/components/workspace/SeasonArchitectPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/SeasonArchitectPanel.tsx)** (~290 baris)
   - Range selector dinamis (start-end inputs).
   - Progress UI dengan status indicator (✅ generated, 🔄 current, ⬜ pending).
   - **Emergency stop button** memanggil abort flag di store untuk membatalkan batch generation.

### 🔧 File yang Dimodifikasi

- **[src/services/ai/types.ts](file:///d:/Coding/vibenovel/src/services/ai/types.ts)** — `OutlineGenerateInput` di-enrich dengan compass state lengkap, `emotionalHistory`, dan `existingOutlines`.
- **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)** — `generateChapterOutline()` memakai prompt builder; ditambahkan JSON parse retry dengan prompt yang lebih ketat jika output pertama mengandung markdown fence.
- **[src/store/useProjectStore.ts](file:///d:/Coding/vibenovel/src/store/useProjectStore.ts)** — `generateOutlineBatch(start, end)` dengan **Sequential Await** (tidak Promise.all), `regenerateOutline(chapterId)`, `lockOutline(chapterId, locked)`, dan abort flag.
- **[src/pages/Workspace.tsx](file:///d:/Coding/vibenovel/src/pages/Workspace.tsx)** — placeholder outline diganti `<SeasonArchitectPanel />`.

### 🧪 Verifikasi
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (~680ms)** ✅

---

## ✍ Sprint 2A — Beat-by-Beat Prose Writer

Pada Sprint 2A kita membangun mesin penulis prosa yang men-stream output AI ketukan demi ketukan. Beat dipetakan 1:1 dari `key_events` outline, sehingga jumlahnya dinamis per bab. UX lebih hidup karena teks muncul bertahap (SSE) bukan blokir total.

### 🛠 File Baru

1. **[src/prompts/prose-writer.ts](file:///d:/Coding/vibenovel/src/prompts/prose-writer.ts)** — KBM Melodrama Protocol: paragraf pendek, dialog-heavy, mobile-first formatting, continuity dari beat sebelumnya.
2. **[src/components/prose/BeatIndicator.tsx](file:///d:/Coding/vibenovel/src/components/prose/BeatIndicator.tsx)** — Progress bar dinamis (e.g. "3 of 5 events") yang otomatis menyesuaikan dengan jumlah beats per bab.
3. **[src/components/prose/ProseToolbar.tsx](file:///d:/Coding/vibenovel/src/components/prose/ProseToolbar.tsx)** — Quick toggle dropdown 3 model (Gemini, Claude 3.5 Sonnet, Deepseek), word count, debounced save indicator.
4. **[src/components/prose/BeatEditor.tsx](file:///d:/Coding/vibenovel/src/components/prose/BeatEditor.tsx)** — Textarea dengan auto-scroll saat streaming + manual edit fallback.
5. **[src/components/workspace/ProseWriterPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ProseWriterPanel.tsx)** — Composer yang menyatukan toolbar, indicator, dan editor.
6. **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — Orchestrator streaming: AbortController untuk cancel, debounced save 2 detik, auto-status `DRAFT` saat semua beat terisi.

### 🔧 File yang Dimodifikasi

- **[src/services/ai/gemini-pool.ts](file:///d:/Coding/vibenovel/src/services/ai/gemini-pool.ts)** — `generateContentStream()` memakai SSE Gemini.
- **[src/services/ai/openrouter-adapter.ts](file:///d:/Coding/vibenovel/src/services/ai/openrouter-adapter.ts)** — `stream: true` dengan parsing chunk-by-chunk.
- **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)** — `generateProseBeatStream()` AsyncGenerator routing.
- **[src/store/useSettingsStore.ts](file:///d:/Coding/vibenovel/src/store/useSettingsStore.ts)** — persist `activeProseModel` dan `openRouterKey`.
- **[src/pages/Workspace.tsx](file:///d:/Coding/vibenovel/src/pages/Workspace.tsx)** — Write mode kini render `<ProseWriterPanel />`.

### 🧪 Verifikasi
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS** ✅

---

## 🧠 Sprint 2B — State Tracker & Context Injection Upgrade

Sprint 2B menyalakan **Layer 2 (Dynamic State)** dan **Layer 4 (Sliding Window)** dari arsitektur memori 4-layer. Setiap kali bab selesai, AI mengekstraksi state karakter (lokasi, kondisi, knowledge, secrets, alliances) dan menyimpannya ke `character_states`. Saat menulis bab berikutnya, state terbaru otomatis di-inject ke prompt agar tidak ada plot hole "karakter di dua tempat sekaligus".

### 🛠 File Baru

1. **[src/prompts/state-snapshot.ts](file:///d:/Coding/vibenovel/src/prompts/state-snapshot.ts)** — Prompt extraction 10 field (location, physical_condition, emotional_state, knowledge_state, active_goal, secrets, appearance_notes, alliances, inventory, last_action) dengan cumulative history injection.
2. **[src/services/state-tracker.ts](file:///d:/Coding/vibenovel/src/services/state-tracker.ts)** — Extractor pakai Gemini Core (gratis), retry parse JSON array, dan formatter untuk konteks readable.
3. **[src/components/compass/StateTimeline.tsx](file:///d:/Coding/vibenovel/src/components/compass/StateTimeline.tsx)** — Visualisasi state per karakter, knowledge tag chips, secrets collapsible, dan tombol manual regenerate.

### 🔧 File yang Dimodifikasi

- **[src/types/project.ts](file:///d:/Coding/vibenovel/src/types/project.ts)** — `CharacterState` di-expand dengan 5 field anti-plot-hole (3 wajib + 2 opsional).
- **[src/services/ai/types.ts](file:///d:/Coding/vibenovel/src/services/ai/types.ts)** — `ProseGenerateInput` menerima `characterStates` context, `BrainstormResponse` mendukung draft type `character_state`.
- **[src/services/ai/context-injector.ts](file:///d:/Coding/vibenovel/src/services/ai/context-injector.ts)** — Deterministic active-character match → pull latest state → slice 500 kata terakhir bab sebelumnya, dengan token budget yang ketat.
- **[src/store/useProjectStore.ts](file:///d:/Coding/vibenovel/src/store/useProjectStore.ts)** — `getLatestStatesForChapter()`, `upsertCharacterStates()`, dan auto-load di `loadProjectData()`.
- **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — Setelah bab transit ke `DRAFT`, background task `triggerStateGeneration()` jalan tanpa memblokir UI.
- **[src/components/chat/AiMessageBubble.tsx](file:///d:/Coding/vibenovel/src/components/chat/AiMessageBubble.tsx)** & **[ApprovalCard.tsx](file:///d:/Coding/vibenovel/src/components/chat/ApprovalCard.tsx)** — Render formatted character state updates dengan `whitespace-pre-line`.
- **[src/components/workspace/ContextPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ContextPanel.tsx)** & **[ProseWriterPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ProseWriterPanel.tsx)** & **[ProseToolbar.tsx](file:///d:/Coding/vibenovel/src/components/prose/ProseToolbar.tsx)** — Embed `<StateTimeline />` + status indicator extractor di Write mode.

### 🧪 Verifikasi
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (~551ms)** ✅

---

## 🧩 Refactoring — Zustand Parts Modularization

Setelah Sprint 2B, `useProjectStore.ts` membengkak >800 baris karena akumulasi CRUD untuk 4 layer (projects, chapters, lorebook, outlines). Kami pecah menjadi 4 modul independen di `src/store/parts/` tanpa mengubah API publik.

### 🛠 File Baru di `src/store/parts/`

| File | Tanggung Jawab |
|---|---|
| **[projects.ts](file:///d:/Coding/vibenovel/src/store/parts/projects.ts)** | Active project, CRUD (`loadProjects`, `addProject`, `updateProject`, `deleteProject`), full project sync |
| **[chapters.ts](file:///d:/Coding/vibenovel/src/store/parts/chapters.ts)** | Chapters list, optimistic handlers, parallel loading saat masuk workspace |
| **[lorebook.ts](file:///d:/Coding/vibenovel/src/store/parts/lorebook.ts)** | Characters, Character States (Layer 2), Items, World Rules, Mystery Layers, Plot Threads |
| **[outlines.ts](file:///d:/Coding/vibenovel/src/store/parts/outlines.ts)** | Outlines, batch sequential generator, pacing validator, abort flag |

### 🔧 File yang Dimodifikasi

- **[src/store/useProjectStore.ts](file:///d:/Coding/vibenovel/src/store/useProjectStore.ts)** — Tinggal ~20 baris orchestrator yang mengkomposisi 4 part dengan API backward-compatible.
- **[src/types/project.ts](file:///d:/Coding/vibenovel/src/types/project.ts)** — `OutlineProgress` dipindah ke shared types untuk dipakai UI + store.

### 🧪 Verifikasi
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (~1.38s)** ✅
- Graphify rebuild AST topology: 713 nodes, 981 edges.

---

## 📡 Sprint 3A — Plot Radar & Lore Extraction

Sprint 3A menyalakan **mesin QA otomatis** yang memeriksa setiap bab usai ditulis. Ada 4 dimensi pemeriksaan: Plot Hole, Emotional Impact (Filler Detector), Chekhov's Gun Tracker, dan Continuity. Bonus: lore baru yang muncul di prosa (karakter / item / world rule yang belum ada di Bible) otomatis di-extract dan ditawarkan ke user via modal approval.

### 🛠 File Baru

1. **[src/prompts/plot-radar.ts](file:///d:/Coding/vibenovel/src/prompts/plot-radar.ts)** — System & user prompt builder untuk 4 kriteria QA, output array `QaLog`.
2. **[src/prompts/lore-extractor.ts](file:///d:/Coding/vibenovel/src/prompts/lore-extractor.ts)** — Extract `new_characters`, `new_items`, `new_rules` dari prosa.
3. **[src/hooks/usePlotRadar.ts](file:///d:/Coding/vibenovel/src/hooks/usePlotRadar.ts)** — On-demand atau auto QA trigger.
4. **[src/hooks/useLoreExtractor.ts](file:///d:/Coding/vibenovel/src/hooks/useLoreExtractor.ts)** — Background extractor + diff dengan lorebook existing.
5. **[src/components/workspace/ReviewPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ReviewPanel.tsx)** — Prose reader + QA logs viewer dengan severity color (CRITICAL / EMOTION_FLAT / CHEKHOVS_GUN / FILLER).
6. **[src/components/modals/LoreDiffModal.tsx](file:///d:/Coding/vibenovel/src/components/modals/LoreDiffModal.tsx)** — Modal Framer Motion yang muncul otomatis saat lore baru terdeteksi, user approve sekaligus untuk masuk ke project.

### 🔧 File yang Dimodifikasi

- **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)** — `runQARadar()` dan `extractLore()` memakai prompt builder + parse JSON robust.
- **[src/store/parts/lorebook.ts](file:///d:/Coding/vibenovel/src/store/parts/lorebook.ts)** — `extractedLore` global state + setter untuk konsumsi modal.
- **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — `Promise.all` background trigger 3 task (state snapshot + plot radar + lore extraction) sekali bab transit `DRAFT`.
- **[src/pages/Workspace.tsx](file:///d:/Coding/vibenovel/src/pages/Workspace.tsx)** — Review canvas legacy diganti `<ReviewPanel />`.

### 🧪 Verifikasi
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (~1.51s)** ✅

---

## 📱 Sprint 3B — Review Mode & PWA

Sprint 3B menyelesaikan Fase 3 dengan 3 milestone besar: **Review Mode kaya** (3-section layout dengan Thread Tracker + Emotional Arc + filter QA), **PWA installable** (manifest + service worker + workbox runtime caching), dan **Offline draft fallback** (localStorage queue + auto-sync saat online).

### 🛠 File Baru

1. **[src/components/compass/ThreadTrackerPanel.tsx](file:///d:/Coding/vibenovel/src/components/compass/ThreadTrackerPanel.tsx)**
   - Read-only list `plotThreads` dengan status badge (PLANTED/ACTIVE/RESOLVED/ABANDONED) dan urgency dot (CRITICAL pulsing).
   - Empty state ramah: "Auto-detect aktif di Sprint 7".

2. **[src/components/compass/EmotionalArcPreview.tsx](file:///d:/Coding/vibenovel/src/components/compass/EmotionalArcPreview.tsx)**
   - List compact 1 baris per bab: chapter number + tone label + dot warna (8 tone) + dopamine ⚡ marker.
   - Highlight bab aktif dengan border ring + legend warna di bawah.

3. **[src/components/ui/QaSeverityFilter.tsx](file:///d:/Coding/vibenovel/src/components/ui/QaSeverityFilter.tsx)**
   - Tab chip filter (Semua / Plot Hole / Emosi / Chekhov / Filler) dengan animated underline `layoutId="qaFilterActive"`.
   - Counter badge per tab + auto-disable untuk tab kosong.

4. **[src/components/ui/PwaUpdatePrompt.tsx](file:///d:/Coding/vibenovel/src/components/ui/PwaUpdatePrompt.tsx)**
   - Toast bottom-right dengan dua mode: "Versi Baru Tersedia — Reload" dan "Siap Dipakai Offline" (auto-dismiss 4s).
   - Pakai `useRegisterSW` dari `vite-plugin-pwa/react`.

5. **[src/hooks/useOfflineDraft.ts](file:///d:/Coding/vibenovel/src/hooks/useOfflineDraft.ts)**
   - Subscribe `online`/`offline` events + `navigator.onLine` flag.
   - `saveDraft` / `loadDraft` / `clearDraft` dengan key `vn_draft_{chapterId}_{beatIndex}`.
   - `syncPendingDrafts(callback)` flush queue + report jumlah synced/failed.
   - `listPendingDrafts()` helper inspeksi.

### 🔧 File yang Dimodifikasi

- **[src/components/workspace/ReviewPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ReviewPanel.tsx)** — Rewrite jadi **3-column desktop** (Prose 5fr / QA 3fr / Konteks 2fr) + **mobile tab switcher** (Prosa / QA / Konteks) dengan animated underline.
- **[src/components/prose/BeatEditor.tsx](file:///d:/Coding/vibenovel/src/components/prose/BeatEditor.tsx)** — Badge "Offline · Tersimpan Lokal" di header beat saat offline + restore prompt dengan timestamp draft + tombol Pulihkan/Buang.
- **[src/components/workspace/ProseWriterPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ProseWriterPanel.tsx)** — Pass `chapterId` prop ke `BeatEditor`.
- **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — Saat offline simpan draft ke localStorage, saat online clear draft + skip background AI tasks (state snapshot, plot radar, lore extraction). Effect `useEffect` flush pending drafts begitu `isOnline` toggle true.
- **[src/main.tsx](file:///d:/Coding/vibenovel/src/main.tsx)** — Mount `<PwaUpdatePrompt />` di root.
- **[vite.config.ts](file:///d:/Coding/vibenovel/vite.config.ts)** — `VitePWA` plugin: registerType auto-update, manifest, workbox runtime caching:
  - Google Fonts CSS → `StaleWhileRevalidate`
  - Google Fonts files → `CacheFirst` (1 tahun)
  - Supabase REST → `NetworkFirst` (10s timeout)
  - Supabase Auth → `NetworkFirst` (5s timeout)
  - Gemini & OpenRouter API → `NetworkOnly` (sengaja tidak di-cache karena context-dependent)
  - Static images & fonts → `CacheFirst`
- **[index.html](file:///d:/Coding/vibenovel/index.html)** — `theme-color` dual (dark `#1a1c2c` / light `#fff8e7`), `apple-touch-icon`, `mobile-web-app-capable`, `description`.
- **[tsconfig.app.json](file:///d:/Coding/vibenovel/tsconfig.app.json)** — Tambah types `vite-plugin-pwa/client` & `/react` agar virtual module `virtual:pwa-register/react` resolve.

### 🎨 Design Decisions yang Dipenuhi

- **Ikon PWA**: pakai `favicon.svg` yang ada di-reference langsung di manifest dengan `purpose: "any"` + `"maskable"` (PNG variants ditunda ke Sprint 9 polish).
- **Offline strategy**: cache-first untuk static + network-first untuk Supabase (full offline-first sync queue ditunda ke Sprint 10).
- **Thread Tracker scope**: read-only di Sprint 3B, CRUD + auto-detect di Sprint 7.
- **Emotional Arc**: list compact dengan dot color (heatmap visual penuh di Sprint 8).

### 🧪 Verifikasi

- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run build` → **SUCCESS (462ms)** ✅
  - `dist/sw.js` ✅
  - `dist/workbox-*.js` ✅
  - `dist/manifest.webmanifest` ✅
  - 8 precache entries (851.64 KiB)

---

## 🎯 Status Fase

| Fase | Sprint | Status |
|---|---|---|
| **Fase 1** Foundation | 1A, 1B, 1C, 1D | ✅ Complete |
| **Fase 2** Prose Writer | 2A, 2B | ✅ Complete |
| **Fase 3** Quality Guard | 3A, 3B | ✅ Complete |
| **Fase 4** Pro Writer | 4 | ⏳ Next |
| **Fase 5–10** | 5, 6, 7, 8, 9, 10 | ⏳ Pending |


---

## ✍ Sprint 4 — Pro Writer Features

Sprint 4 membuka tiga jalur kerja baru untuk pro writer: **import manuscript** lengkap (paste, txt, docx, pdf — semua lazy-loaded), **Free Write mode** untuk lepas dari enforcement outline + auto QA, dan **Director's Cut + Inline Edit** dengan floating toolbar mirip Notion. Token strategy 9-pillar memangkas penggunaan Gemini hingga ~70% dibanding pendekatan naif.

### 🛠 File Baru (10)

1. **[src/lib/manuscript-reader.ts](file:///d:/Coding/vibenovel/src/lib/manuscript-reader.ts)** — file extraction utilities. `.txt` via FileReader, `.docx` via dynamic `import('mammoth')`, `.pdf` via dynamic `import('pdfjs-dist')` + lazy worker chunk. Hard cap `MAX_INPUT_CHARS = 1.5M` (~300k token).
2. **[src/lib/manuscript-parser.ts](file:///d:/Coding/vibenovel/src/lib/manuscript-parser.ts)** — pure-JS pre-processing: chapter splitter regex (Bab/Chapter, Arabic + Roman + 2500-word fallback), character name seeds (capitalized-token heuristic dengan filter Indonesian sentence-noise), hashText (SHA-256), `estimateCost`, `buildQuickScanSample`.
3. **[src/lib/import-cache.ts](file:///d:/Coding/vibenovel/src/lib/import-cache.ts)** — localStorage cache keyed by SHA-256 hash, TTL 7 hari. Repeat paste = 0 API calls.
4. **[src/prompts/import-analyzer.ts](file:///d:/Coding/vibenovel/src/prompts/import-analyzer.ts)** — Tier 1 Quick Scan (1 call, compressed input) + Tier 2 Deep Chapter Analysis + Voice DNA Calibration prompt builders.
5. **[src/prompts/rewrite.ts](file:///d:/Coding/vibenovel/src/prompts/rewrite.ts)** — Director's Cut variant prompts (Tighter / Emotional / Dramatic) + Magic Edit prompt.
6. **[src/services/import-analyzer.ts](file:///d:/Coding/vibenovel/src/services/import-analyzer.ts)** — orchestrator dengan AbortSignal + onProgress; pipeline hash-cache → Tier 1 → Tier 2 (last + first + middle chapter) → Voice DNA → finalize.
7. **[src/components/onboarding/ImportWizard.tsx](file:///d:/Coding/vibenovel/src/components/onboarding/ImportWizard.tsx)** — 4-step Framer Motion wizard. Upload → Analyze (progress + cancel) → Review (editable lists) → Confirm (4 SummaryCards). On confirm: createProject IMPORTED → import chars/items/world rules dengan voice DNA → import chapters dengan `outline_source: 'IMPORTED'` + `is_locked: true` → upsert IMPORTED character states → navigate ke workspace.
8. **[src/components/modals/DirectorsCutModal.tsx](file:///d:/Coding/vibenovel/src/components/modals/DirectorsCutModal.tsx)** — 3-card grid sequential streaming. Klik "Pakai" mid-stream = abort variant lain. Custom instruction textarea untuk re-generate semua 3 dengan arahan baru.
9. **[src/components/prose/SelectionToolbar.tsx](file:///d:/Coding/vibenovel/src/components/prose/SelectionToolbar.tsx)** — floating mini-toolbar Notion/Medium-style dengan Magic Edit (inline prompt input) + Director's Cut (open modal). Position fixed dengan clamp X agar tidak overflow viewport.
10. **[src/components/prose/FreeWriteEditor.tsx](file:///d:/Coding/vibenovel/src/components/prose/FreeWriteEditor.tsx)** — plain canvas dengan Free Write header chip, offline draft restore, auto-grow textarea.

### 🔧 File yang Dimodifikasi (12)

- **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)** — 5 metode baru: `quickScanManuscript`, `analyzeImportedChapter`, `calibrateVoiceDna`, `generateDirectorsCutVariant` (streaming), `inlineEdit` (Gemini Flash Lite). Semua menerima AbortSignal.
- **[src/services/ai/gemini-pool.ts](file:///d:/Coding/vibenovel/src/services/ai/gemini-pool.ts)** — AbortSignal threading di `generateContent` + `generateContentStream`. AbortError dilempar langsung tanpa retry.
- **[src/components/dashboard/ProjectCreationModal.tsx](file:///d:/Coding/vibenovel/src/components/dashboard/ProjectCreationModal.tsx)** — tombol "Lanjut Cerita Saya" buka ImportWizard.
- **[src/components/prose/BeatEditor.tsx](file:///d:/Coding/vibenovel/src/components/prose/BeatEditor.tsx)** — `forwardRef` dengan `BeatEditorHandle.replaceSelection`, selection tracking via `onSelect`/`onKeyUp`, anchor coordinates lewat hidden mirror div.
- **[src/components/prose/ProseToolbar.tsx](file:///d:/Coding/vibenovel/src/components/prose/ProseToolbar.tsx)** — Free Write toggle chip (lock / lock_open icon).
- **[src/components/workspace/ProseWriterPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ProseWriterPanel.tsx)** — host SelectionToolbar + DirectorsCutModal, render FreeWriteEditor saat freeWriteMode aktif.
- **[src/components/workspace/ChapterOutlineCard.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ChapterOutlineCard.tsx)** — "📥 Imported" badge + opt-in unlock yang flip `outline_source` ke `MANUAL`.
- **[src/pages/Workspace.tsx](file:///d:/Coding/vibenovel/src/pages/Workspace.tsx)** — header chips untuk IMPORTED + Free Write.
- **[src/store/useSettingsStore.ts](file:///d:/Coding/vibenovel/src/store/useSettingsStore.ts)** — `freeWriteMode` flag (persisted).
- **[src/store/parts/outlines.ts](file:///d:/Coding/vibenovel/src/store/parts/outlines.ts)** — IMPORTED skip dengan warning spesifik.
- **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — respect freeWriteMode (skip beat init + skip background AI tasks).

### 💰 Token Optimization (10 Pillars)

| Pillar | Implementasi | Hemat |
|---|---|---|
| 1. Local chapter splitter | `splitChapters` regex | 1 call dihindari per import |
| 2. Local stats | `estimateCost` | gratis |
| 3. Local character name seeds | `extractCharacterSeeds` | AI tinggal validate, bukan discover |
| 4. Tier 1 Quick Scan | 1 call + compressed input (~6k token) | vs naive 30+ calls |
| 5. Tier 2 Deep Analysis | max 3 calls (last + bab 1 + midpoint) | sisanya raw prose, lazy-fill nanti |
| 6. Cumulative context budget | quick-scan compress 200 kata/bab | 5-10x lebih kecil |
| 7. localStorage cache | SHA-256 hash → result | 100% saat paste sama |
| 8. Pre-flight estimate UI | wizard tampil token + ETA sebelum mulai | user informed consent |
| 9. Sequential variants + cancel | Director's Cut abort-on-pick | hemat 67% kalau user puas variant 1 |
| 10. Flash Lite for Magic Edit | `gemini-2.0-flash-lite` | model murah untuk selection pendek |

### 📊 Bundle Impact

- Main bundle: **816.75 KB** (235.95 KB gzipped) — +49 KB dari Sprint 3B (untuk wizard UI)
- **Lazy chunks** (TIDAK masuk bundle utama):
  - `pdf.worker.min` — 1232 KB (load saat user upload `.pdf`)
  - `pdf-*.js` — 410 KB (pdfjs runtime)
  - `lib-*.js` — 497 KB (mammoth)
- User yang paste teks atau upload `.txt` tidak terbebani dependency size apapun.

### 🧪 Verifikasi

- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅ — gate baru per Sprint 1A→3B QA recommendation
- `npm run build` → **SUCCESS (683ms)** ✅
- 11 PWA precache entries (1791.10 KiB)

### 🎯 Status Fase

| Fase | Sprint | Status |
|---|---|---|
| Fase 1 | 1A, 1B, 1C, 1D | ✅ |
| Fase 2 | 2A, 2B | ✅ |
| Fase 3 | 3A, 3B | ✅ |
| **Fase 4** | **4** | **✅** |
| Fase 5 | 5 (KBM Retention Engine) | ⏳ Next |


---

## 🧅 Sprint 5 — KBM Retention Engine

Sprint 5 mengubah 5 mesin retensi KBM PPC dari "rules tertanam di prompt" jadi engine yang user bisa kontrol langsung di UI. Pro writer sekarang bisa drop breadcrumb misteri di chapter spesifik via klik timeline, recalibrate Voice DNA dari prosa yang sudah ditulis (manfaatkan `aiRouter.calibrateVoiceDna` dari Sprint 4), dan Outline Engine secara aktif memperingatkan "drought" False Resolution.

### 🛠 File Baru (3)

1. **[src/components/compass/MysteryLayerPanel.tsx](file:///d:/Coding/vibenovel/src/components/compass/MysteryLayerPanel.tsx)** (~510 baris) — CRUD UI untuk Mystery Layers. Tiap layer punya status badge (PLANNED/ACTIVE/REVEALED), expand-collapse card menampilkan central_question + answer + opens_next_question, dan **breadcrumb timeline visual horizontal** dengan dot positioning relatif ke target_chapters. User klik dot atau "+ Tambah" untuk add/edit breadcrumb di chapter X.

2. **[src/components/compass/VoiceDNAEditor.tsx](file:///d:/Coding/vibenovel/src/components/compass/VoiceDNAEditor.tsx)** (~330 baris) — per-character collapsible editor dengan 6 canonical fields: `tone`, `vocabulary`, `verbal_tics[]` (tag input), `internal_monolog_style`, `dialog_quirks`, `charm_factor`. Tombol **🔄 Recalibrate from Prose** call `aiRouter.calibrateVoiceDna` pada 2-3 sample bab terbaru yang menyebut karakter ini. Existing custom keys di voice_dna jsonb dipreservasi saat save.

3. **[src/services/voice-dna-helper.ts](file:///d:/Coding/vibenovel/src/services/voice-dna-helper.ts)** (~45 baris) — `gatherVoiceSamples` ranking & slicing, `canRecalibrate` predicate untuk button enable/disable.

### 🔧 File yang Dimodifikasi

- **[src/types/project.ts](file:///d:/Coding/vibenovel/src/types/project.ts)** — `Chapter.false_resolution: boolean` (default false), `Project.series_hook: string | null`, `Project.season_hooks: string[]`
- **[src/lib/database.types.ts](file:///d:/Coding/vibenovel/src/lib/database.types.ts)** — mirror types
- **[supabase/schema.sql](file:///d:/Coding/vibenovel/supabase/schema.sql)** — kolom baru di CREATE TABLE definitions + idempotent ALTER block di akhir file untuk DB existing
- **[src/store/parts/lorebook.ts](file:///d:/Coding/vibenovel/src/store/parts/lorebook.ts)** — `addMysteryLayer`, `updateMysteryLayer`, `deleteMysteryLayer` dengan optimistic UUID + Supabase sync (mirror character CRUD pattern)
- **[src/store/parts/outlines.ts](file:///d:/Coding/vibenovel/src/store/parts/outlines.ts)** — track `falseResolutionFlags[]` selama batch, panggil `validateFalseResolution` setelah tiap bab, `validateHookChainCoverage` sekali di awal, pass `seriesHook` + `seasonHooks` ke router
- **[src/store/useChatStore.ts](file:///d:/Coding/vibenovel/src/store/useChatStore.ts)** — chat-approved mystery layers sekarang lewat `addMysteryLayer` (Supabase), bukan direct `setState`
- **[src/lib/kbm-pacing.ts](file:///d:/Coding/vibenovel/src/lib/kbm-pacing.ts)** — `validateFalseResolution(flags, windowSize=15)` + `validateHookChainCoverage({seriesHook, seasonHooks, hasOutlinedChapters})`
- **[src/services/ai/types.ts](file:///d:/Coding/vibenovel/src/services/ai/types.ts)** — `OutlineGenerateInput.seriesHook?` + `.seasonHooks?` + `OutlineResponse.falseResolution?`
- **[src/services/ai/ai-router.ts](file:///d:/Coding/vibenovel/src/services/ai/ai-router.ts)** — pass through hook chain context ke buildOutlineUserPrompt
- **[src/prompts/outline-engine.ts](file:///d:/Coding/vibenovel/src/prompts/outline-engine.ts)** — sistem instruction tambah HOOK CHAIN 5-LEVEL HIERARCHY + FALSE RESOLUTION instruksi set flag, JSON schema sekarang berisi `falseResolution`, user prompt inject `hookChainBlock`
- **[src/prompts/prose-writer.ts](file:///d:/Coding/vibenovel/src/prompts/prose-writer.ts)** — full rewrite dengan MICRO-HOOK PROTOCOL (subtext, wrong detail, open questions per scene) + CLIFFHANGER PROTOCOL detail per tipe + FALSE RESOLUTION HANDLING. Voice DNA jsonb dikonversi ke natural-language brief via `voiceDnaToBrief()` agar model lebih konsisten daripada raw JSON.
- **[src/components/workspace/ChapterOutlineCard.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ChapterOutlineCard.tsx)** — chip "💔 False Resolution" muncul saat `chapter.false_resolution === true`
- **[src/components/workspace/ContextPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/ContextPanel.tsx)** — Brainstorm mode render `<MysteryLayerPanel />` + `<VoiceDNAEditor />` di bawah `<StoryCompassPreview />`
- **[src/components/compass/StoryCompassPreview.tsx](file:///d:/Coding/vibenovel/src/components/compass/StoryCompassPreview.tsx)** — `SeriesHookField` sub-component muncul saat compass complete; dirty-state save button hanya muncul kalau ada perubahan
- **[src/components/onboarding/ImportWizard.tsx](file:///d:/Coding/vibenovel/src/components/onboarding/ImportWizard.tsx)** — chapter payload include `false_resolution: false` default
- **[src/store/parts/projects.ts](file:///d:/Coding/vibenovel/src/store/parts/projects.ts)** + **[src/store/parts/chapters.ts](file:///d:/Coding/vibenovel/src/store/parts/chapters.ts)** — dummy data updated dengan default values

### 🎯 5 Mesin Retensi → Status

| Mesin | Sebelum Sprint 5 | Sesudah Sprint 5 |
|---|---|---|
| 🧅 Bawang Berlapis | Type ada, dummy data ada, prompt menerima breadcrumbs | **CRUD UI lengkap** + breadcrumb timeline visual + Supabase sync |
| 🎢 Emotional Rollercoaster | Validator 3-rule sudah strong | (tidak diubah, sudah cukup) |
| 🪝 Hook Chain | Cliffhanger Protocol per chapter aktif | **5-level hierarchy** terdokumentasi di prompt + Series Hook field di Compass |
| 💔 False Resolution | Hanya disebut di prompt | **Per-chapter flag** auto-set + drought validator + UI chip |
| 🧲 Character Investment | Voice DNA jsonb tanpa UI | **Voice DNA Editor** + Recalibrate from Prose + charm_factor field |
| ⚡ Dopamine Cycle | Working | (tidak diubah) |
| 💰 Paywall Advisor | Working | (tidak diubah) |

### 🧪 Verifikasi

- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (712ms)** ✅
  - Main bundle: 849.39 KB / 243.68 KB gzipped (+33 KB dari Sprint 4)
  - Lazy chunks unchanged (mammoth, pdfjs-dist)
  - 11 PWA precache entries (1826.26 KiB)

### 🎯 Status Fase

| Fase | Sprint | Status |
|---|---|---|
| Fase 1 | 1A, 1B, 1C, 1D | ✅ |
| Fase 2 | 2A, 2B | ✅ |
| Fase 3 | 3A, 3B | ✅ |
| Fase 4 | 4 | ✅ |
| **Fase 5** | **5** | **✅** |
| Fase 6 | 6 (Auto-Pilot Batch) | ⏳ Next |


---

## 🚀 Sprint 6 — Auto-Pilot Batch Generation

Sprint 6 menutup Fase 6 dengan engine batch prose yang menulis 5-10+ bab secara sequential. Sequential bukan paralel — Layer 2 character states + Layer 4 sliding window butuh state freshness dari bab sebelumnya. Floating progress panel + pause/resume/abort + safety auto-stop + localStorage persistence buat UX yang aman bahkan untuk batch panjang.

### 🛠 File Baru (5)

1. **[src/services/prose-context.ts](file:///d:/Coding/vibenovel/src/services/prose-context.ts)** (~140 baris) — pure helper dengan `buildProseInput()` (extracted dari useBeatWriter agar batch-generator + interactive hook sama-sama pakai builder yang sama, DRY) + `ensureBeatsForChapter()`. Side-effect free, zero React, zero Zustand.

2. **[src/services/batch-generator.ts](file:///d:/Coding/vibenovel/src/services/batch-generator.ts)** (~360 baris) — `BatchGenerator` class:
   - `start(options, callbacks)` — sequential per-chapter loop
   - `pause()` — graceful (post-chapter halt)
   - `abort()` — hard (cancels in-flight stream via AbortController)
   - Throttled save (800ms) saat streaming agar UI update smooth
   - Background `runBackgroundTasks` (state snapshot) fire-and-forget per chapter setelah DRAFT — tidak block next chapter
   - Skip rules mirror outline batch: `is_locked`, `IMPORTED`, `DRAFT`/`FINAL`
   - Hard error counter dengan rate-limit exemption — `isHardError()` filters out 429
   - localStorage persistent helpers `loadPersistedBatchProgress` / `clearPersistedBatchProgress` keyed by `vn_batch_progress_{projectId}`

3. **[src/hooks/useBatchGenerator.ts](file:///d:/Coding/vibenovel/src/hooks/useBatchGenerator.ts)** (~110 baris) — React binding. Owns `BatchGenerator` instance via ref, mirrors progress to `useUiStore.batchProgress`. Exposes `startBatch`, `pauseBatch`, `resumeBatch`, `abortBatch`, `clearProgress`, `loadPersisted`.

4. **[src/components/prose/BatchProgressPanel.tsx](file:///d:/Coding/vibenovel/src/components/prose/BatchProgressPanel.tsx)** (~155 baris) — floating bottom-right panel:
   - Status badge (running/paused) + progress bar + percent
   - Current chapter + beat indicator
   - Chapter dot strip dengan 5 states (done/current/pending/skipped/error)
   - Elapsed timer (1s tick state-based untuk avoid React 19 `Date.now()` purity rule)
   - Pause/Resume toggle + Abort button (red, dengan confirmation)

5. **[src/components/modals/BatchSuccessModal.tsx](file:///d:/Coding/vibenovel/src/components/modals/BatchSuccessModal.tsx)** (~170 baris) — auto-show saat status terminal (`success` / `error` / `aborted`):
   - 4 stat cards (chapters, words, skipped, time)
   - Per-chapter completed list dengan word count
   - Error log + warnings panel
   - CTA "Lihat Bab N →" navigate langsung ke first generated chapter

### 🔧 File yang Dimodifikasi

- **[src/types/project.ts](file:///d:/Coding/vibenovel/src/types/project.ts)** — `BatchStatus`, `BatchOptions`, `BatchProgress` (dengan `endedAt: number | null` untuk pure elapsed calculation), `BatchCompletedEntry`, `BatchErrorEntry`
- **[src/store/useUiStore.ts](file:///d:/Coding/vibenovel/src/store/useUiStore.ts)** — `batchProgress` field (transient, tidak persist) + `setBatchProgress` action
- **[src/hooks/useBeatWriter.ts](file:///d:/Coding/vibenovel/src/hooks/useBeatWriter.ts)** — refactored `generateBeat` agar pakai `buildProseInput()` + `ensureBeatsForChapter()` shared helpers (~50 baris jadi ~10 baris)
- **[src/components/workspace/SeasonArchitectPanel.tsx](file:///d:/Coding/vibenovel/src/components/workspace/SeasonArchitectPanel.tsx)** — tombol "🚀 Auto-Pilot Prose" di samping "Generate Outline" + confirmation prompt untuk batch >10 bab (cost warning)
- **[src/pages/Workspace.tsx](file:///d:/Coding/vibenovel/src/pages/Workspace.tsx)** — mount `<BatchProgressPanel />` + `<BatchSuccessModal />` (auto-show via store state)

### 🧪 Verifikasi

- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (1.22s)** ✅
  - Main bundle: 867.62 KB / 248.02 KB gzipped (+18 KB dari Sprint 5)
  - Lazy chunks unchanged
  - 11 PWA precache entries (1845.22 KiB)

### 🚧 React 19 Pitfall — Resolved

`react-hooks/purity` lint rule mendeteksi `Date.now()` di render body. Solusi:
- **BatchProgressPanel** pakai `useState<number>` + `setInterval(setNow, 1000)` agar elapsed live tanpa impure call
- **BatchSuccessModal** pakai immutable `progress.endedAt` snapshot yang ditulis sekali oleh `BatchGenerator.finalise()` saat status transit ke terminal — pure value, no setState during render

### 🎯 Status Fase

| Fase | Sprint | Status |
|---|---|---|
| Fase 1 | 1A, 1B, 1C, 1D | ✅ |
| Fase 2 | 2A, 2B | ✅ |
| Fase 3 | 3A, 3B | ✅ |
| Fase 4 | 4 | ✅ |
| Fase 5 | 5 | ✅ |
| **Fase 6** | **6** | **✅** |
| Fase 7 | 7 (Thread Tracker & RAG) | ⏳ Next |
