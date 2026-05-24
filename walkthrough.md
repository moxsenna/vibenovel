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


---

## Session: Sprint 7 — Thread Tracker & RAG
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Embedding Service + Chapter Summaries
- Added `embedContent(text, signal?, model='text-embedding-004')` to `gemini-pool.ts`. Returns 768-dim float array via Gemini's `embedContent` REST endpoint, with the same key rotation + 429 cooldown + AbortSignal threading as `generateContent`. Aborts re-throw immediately rather than retrying.
- Created `src/prompts/chapter-summary.ts` with system + user prompt builders. JSON output schema: `{ summary: string, key_facts: string[] }`. Tone constraint: factual, no embellishment, neutral, exact character names.
- Created `src/services/chapter-summary.ts` with `generateChapterSummary(chapter, prevSummary?, signal?)`. Pipeline: generate JSON summary → embed the summary text → return `SummaryResult`. Embedding failure is intentionally non-fatal — keyword-search fallback in `rag-service.ts` still works.
- Added `ChapterSummary` interface to `src/types/project.ts`. Mirrors the existing `database.types.ts` shape (id, chapter_id, project_id, summary, embedding, key_facts).
- Extended `lorebookPart`: new state `chapterSummaries: ChapterSummary[]`, new actions `loadChapterSummaries(projectId)` and `upsertChapterSummary(payload)`. The upsert is idempotent — it deletes any existing row for the same `chapter_id` then inserts the new one, so re-running the background task doesn't pile up duplicates.
- Wired `loadChapterSummaries` into `chaptersPart.loadProjectData` via `Promise.all` (parallelised with `loadCharacterStates`).

#### Phase 2 — RAG Service & Context Injector Enhancement
- Created `src/services/rag-service.ts` exposing `searchSimilarChapters(projectId, query, topK=3, signal?)`. Two-tier path:
  1. **Primary**: embed the query via Gemini `text-embedding-004`, then `supabase.rpc('match_chapter_summaries', { p_project_id, p_query_embedding, p_match_count })` for cosine-similarity scoring (1 - distance).
  2. **Fallback**: in-memory token-overlap scoring on the `chapterSummaries` already loaded into the store. Stopword list covers common Bahasa Indonesia connectors (yang, di, ke, untuk, dengan, etc.) + common English fillers. Scores divided by `sqrt(haystackTokens.size)` so short summaries with rare matches outrank long boilerplate.
  Both paths return `RagMatch[]` with the same shape so callers don't care which served them.
- Appended idempotent `match_chapter_summaries` PL/pgSQL function to `supabase/schema.sql`. Returns `(id, chapter_id, project_id, summary, key_facts, similarity)`. Uses `<=>` cosine distance operator. Filters by `project_id` + `embedding IS NOT NULL` + min similarity threshold.
- Extended `ContextInjector`:
  - Added `ragMatchCount: number` to `PrunedContextResult`.
  - Created async variant `pruneAndInjectWithRag(...)` that wraps the existing sync `pruneAndInject`, then awaits `searchSimilarChapters` and appends a "RELATED CHAPTER MEMORY — Layer 3 RAG" block before the closing delimiter.
  - Optional `excludeChapterIds` parameter so we don't inject the chapter being generated as its own context.
  - RAG block format includes per-match similarity percent and up to 3 key_facts for downstream prompt clarity.

#### Phase 3 — Thread Tracker
- Created `src/prompts/thread-tracker.ts` with system + user prompt builders. JSON schema: `new_threads[]`, `resolved_thread_titles[]`, `updated_thread_titles[]`. Urgency calibration tied to story stakes (CRITICAL = imminent, LOW = world-building).
- Created `src/services/thread-tracker.ts`:
  - `analyzeChapterThreads(chapter, existingThreads, prevSummaries, signal?)` parses the JSON output with strict type guards.
  - `findThreadByTitle(title, threads)` does exact match → substring match for fuzzy dedup.
  - `gatherPreviousSummaries(chapter, summaries)` helper for caller use.
- Extended `lorebookPart` again with full plot-thread CRUD:
  - `addPlotThread(thread): Promise<string>` (returns id, optimistic temp UUID swap-out on Supabase confirmation).
  - `updatePlotThread(id, partial)`, `deletePlotThread(id)` — same optimistic + sync pattern as character CRUD.
  - `applyThreadAnalysis(chapterNumber, projectId, result)` — orchestrates the diff: resolves existing threads, appends timestamped notes to updated ones, inserts new threads (skipping fuzzy-match duplicates). Static import of `findThreadByTitle` to avoid Vite's INEFFECTIVE_DYNAMIC_IMPORT warning.
- Background task chain in `useBeatWriter` upgraded from 3 tasks to 5 via `Promise.allSettled` (state + radar + lore + thread + summary). Each task has its own try/catch in the trigger callbacks so a failure stays isolated.
- Same upgrade in `BatchGenerator.runBackgroundTasks` — 3 tasks (state + thread + summary) via `Promise.allSettled` with per-task error logging.
- Replaced the Sprint 3B placeholder `ThreadTrackerPanel.tsx` with full CRUD UI (~470 lines):
  - Sorted into Active vs Resolved/Abandoned groups; Active group ordered by urgency rank then `planted_at`.
  - Manual "+ Manual" button opens an inline form with title, urgency, status, planted_at, optional resolved_at, notes.
  - "Auto-detect" button calls `analyzeChapterThreads` on the active chapter and applies via `applyThreadAnalysis`. Shows feedback message on success/failure.
  - Per-card actions: edit (inline form), quick-resolve (✓ icon → status RESOLVED + resolved_at = current), delete (with confirm).
  - "🚨 Dangling" badge auto-shown for open threads with HIGH/CRITICAL urgency that aged ≥10 chapters past their `planted_at`.
- Added `validateDanglingThreads({ threads, currentChapter, staleAfter })` to `kbm-pacing.ts`. Warnings differentiate by urgency — HIGH/CRITICAL get a stronger "pembaca akan kecewa" message, LOW/MEDIUM are gentler reminders.
- Wired `validateDanglingThreads` into `outlinesPart.generateOutlineBatch` so dangling-thread warnings surface as part of the batch output (next to existing rollercoaster + hook chain warnings).

#### Phase 4 — Recap Generator
- Created `src/prompts/recap-generator.ts` with system + user prompt builders. Tone: warm Indonesian web-novel narrator. 2-4 short paragraphs, plain text only.
- Added `aiRouter.generateRecap(input, signal?)` — uses Gemini Flash 2.0 (cheap, story summary task), returns trimmed plain text.
- Created `src/components/modals/RecapModal.tsx` (~225 lines):
  - Range picker (start/end chapter) with smart defaults (`defaultRangeEnd` prop sets initial end).
  - Live "(N bab tersedia)" counter.
  - Generate button calls `aiRouter.generateRecap` with the chapters in range.
  - Result rendered in `prose-invert` styled article block with `whitespace-pre-line` for paragraph breaks.
  - Footer actions: Copy to clipboard (with check-mark feedback), Save to Supabase `recaps` table (only shown when `isSupabaseConfigured()`).
  - Uses render-time prev-prop pattern for `defaultRangeEnd` syncing — no setState in effect.
- Updated `ProseToolbar.tsx` to accept optional `onOpenRecap` callback and render a "📝 Sebelumnya..." button when provided.
- Wired up in `ProseWriterPanel.tsx`: local `recapOpen` state, mounted `<RecapModal>` with `defaultRangeEnd = chapter.chapter_number - 1`, passed `onOpenRecap={() => setRecapOpen(true)}` to ProseToolbar.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (716ms)** ✅
  - Main bundle: 894.60 KB / 254.76 KB gzipped (+27 KB from Sprint 6 — wajar untuk 7 file baru + 10 modifikasi)
  - Lazy chunks unchanged: pdf-worker (1232 KB), pdf runtime (410 KB), mammoth (497 KB)
  - 11 PWA precache entries (1872.75 KiB)
  - Initial build had `INEFFECTIVE_DYNAMIC_IMPORT` warning for `thread-tracker.ts` (lazy import inside `applyThreadAnalysis` clashed with static imports elsewhere). Fixed by promoting to static `import { findThreadByTitle }`. Build now warning-free other than the existing 500KB chunk-size advisory.

### Files Created (7)
| File | Lines | Description |
|---|---|---|
| `src/prompts/chapter-summary.ts` | ~50 | Summary + key_facts JSON prompt |
| `src/prompts/thread-tracker.ts` | ~85 | Thread detection JSON prompt |
| `src/prompts/recap-generator.ts` | ~50 | "Sebelumnya..." narrative prompt |
| `src/services/chapter-summary.ts` | ~95 | Summary generator + embedder |
| `src/services/thread-tracker.ts` | ~165 | Thread analyser + fuzzy match |
| `src/services/rag-service.ts` | ~145 | pgvector + keyword fallback search |
| `src/components/modals/RecapModal.tsx` | ~225 | Recap UI with copy + save |

### Files Modified (14)
| File | Change |
|---|---|
| `src/services/ai/gemini-pool.ts` | `embedContent` method (text-embedding-004) |
| `src/services/ai/ai-router.ts` | `generateRecap` method + recap prompt imports |
| `src/services/ai/context-injector.ts` | `pruneAndInjectWithRag` async variant + `ragMatchCount` |
| `src/services/batch-generator.ts` | `runBackgroundTasks` `Promise.allSettled` 3-task upgrade |
| `src/types/project.ts` | `ChapterSummary` interface |
| `src/lib/kbm-pacing.ts` | `validateDanglingThreads` validator |
| `src/store/parts/lorebook.ts` | chapter_summaries + plot_threads CRUD + applyThreadAnalysis |
| `src/store/parts/chapters.ts` | parallel loadChapterSummaries in `loadProjectData` |
| `src/store/parts/outlines.ts` | wire validateDanglingThreads into batch |
| `src/hooks/useBeatWriter.ts` | 5-task allSettled background chain |
| `src/components/compass/ThreadTrackerPanel.tsx` | full CRUD replace placeholder |
| `src/components/prose/ProseToolbar.tsx` | `onOpenRecap` optional prop + Recap button |
| `src/components/workspace/ProseWriterPanel.tsx` | RecapModal mount + state |
| `supabase/schema.sql` | `match_chapter_summaries` RPC migration |

### Manual Verification Pending (User-Side)
- Generate prose untuk 1 bab → setelah DRAFT, chapter_summary auto-tersimpan, embedding ada di Supabase, thread analysis populate ThreadTrackerPanel
- Outline batch 5+ bab → dangling thread warning muncul kalau ada CRITICAL/HIGH urgency thread yang sudah lewat 10 bab
- Klik "📝 Sebelumnya..." di ProseToolbar → RecapModal show range picker → Generate → recap text muncul → Copy + Save berfungsi
- RAG: bab dengan synopsis yang reference kejadian bab sebelumnya → context-injector pull related summaries via pgvector RPC (kalau migration sudah dijalankan) atau keyword fallback
- ThreadTrackerPanel: tambah manual thread → save ke Supabase, edit inline, mark resolved cepat via ✓ button, hapus dengan confirm

### Next Steps (Sprint 8 — Visualization)
- `EmotionalArcHeatmap` (Recharts) — visualisasi rollercoaster tone per bab
- `ConstellationMap` (D3.js) — entity graph karakter + item + thread connections
- `TimelineView` — in-story timeline dengan plot threads + character locations
- `WordCountAnalytics` — per-chapter word count + cumulative trend
- `npm install recharts d3` (lazy-load D3 + Recharts agar bundle utama tetap kecil)


---

## Session: Sprint 8 — Visualization
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Dependencies + Lazy Infrastructure
- `npm install -D recharts d3-force d3-selection d3-scale @types/d3-force @types/d3-selection @types/d3-scale` (46 packages added).
- Added `'visualize'` to `WorkspaceMode` union in `src/store/useUiStore.ts`.
- `ModeSwitcher.tsx` and `Workspace.tsx` `MODES` array now expose tab ke-5 "🌌 Visualisasi". Mobile bottom nav uses `analytics` icon for the new mode.
- Created `src/components/visualization/VisualizationPanel.tsx` — lazy wrapper that:
  - Uses `React.lazy` + `Suspense` boundary per viz so Recharts/D3 chunks only ship when the user opens the mode.
  - Renders 2x2 grid (lg+) / single column (mobile) with header section per viz.
  - Empty state for projects with zero chapters → CTA navigate to Outline mode.

#### Phase 2 — Emotional Arc Heatmap (multi-lens)
- `src/components/visualization/EmotionalArcHeatmap.tsx` (~285 lines).
- 5 lenses via chip selector: **Tone / Cliffhanger / Filler / Word Count / Status**. Each lens has its own color mapper:
  - Tone: 9-color palette (CONFLICT, TENSION, RELIEF, DOPAMINE, SHOCK, BREATHER, ROMANCE, MELANCHOLY, MYSTERY).
  - Cliffhanger: 6 unique colors per cliffhanger type.
  - Filler: 3 levels (low=emerald, medium=amber, high=rose).
  - Word Count: HSL gradient interpolating cold blue → warm orange, normalized to project's max wordcount.
  - Status: 5 chapter statuses each unique color.
- Cell layout: scrollable horizontal strip, auto-tighten width (16/18/22 px) based on chapter count.
- Cell overlays: ⚡ dopamine_beat, 💔 false_resolution, 🔒 is_locked.
- Hover/focus tooltip section below the strip shows `Bab N — Title — current lens value`.
- Click cell → `setActiveChapter(n) + setMode('write')`. Keyboard nav: Tab + Enter/Space activates click. `aria-label` per cell with full lens value.
- Legend bar regenerates per lens. `useMemo` discipline for both cell computation and legend.

#### Phase 3 — Constellation Map (D3 force-directed)
- `src/components/visualization/ConstellationMap.tsx` (~620 lines).
- `useIsMobile()` hook with `ResizeObserver` for breakpoint detection (<768px).
- Mobile fallback: `ConstellationListFallback` groups entities by type, shows top-3 connections per node sorted by edge weight. Avoids unusable D3 layout on small screens.
- Desktop: pure React SVG rendering with d3-force computing positions in `useEffect`. State ticker via `setTick` re-renders SVG on each simulation tick — keeps DOM ownership in React, avoids the classic D3 vs React conflict.
- Filters panel:
  - Node type checkboxes (👤 Character / 🗝️ Item / 🧵 Thread).
  - Edge type checkboxes (co-appearance / ownership / threaded-in).
  - Dual-handle chapter range sliders that scope which entities are "active" within the bab range.
- Range reset on `totalChapters` change uses **prev-prop-during-render pattern** (no `useEffect`-driven setState — satisfies the React 19 strict purity rule that ESLint `react-hooks/set-state-in-effect` enforces).
- Edge construction:
  - Co-appearance: char↔char weighted by shared chapter count.
  - Ownership: item→char via `current_owner` matched via `findCharacterIdByActivation` (name + activation_keys fuzzy match).
  - Threaded-in: thread→char via `related_characters` lookup.
- Node shapes per type: circle (character, color by role), rounded square (item, color by category), hexagon (thread, color by urgency).
- Interactions: drag node (sets `node.fx/fy`, restarts simulation alpha 0.3), click node toggles selection (highlights connected edges + nodes, dims rest), hover shows tooltip card, mouse pan + wheel zoom (clamped 0.3 - 3x), reset button.
- `useMemo` for graph construction. Cap 50 nodes by `priority + chapter coverage * 0.5` to keep D3 performant on large casts.

#### Phase 4 — Timeline View (arc bands + markers)
- `src/components/visualization/TimelineView.tsx` (~260 lines).
- Uses `computeArcBands(totalChapters)` from `kbm-pacing.ts` to group chapters into 10 dramatic arc sections (Opening → Setup → Inciting → Rising → Midpoint → Complications → Crisis → Climax Approach → Climax → Resolution). Each section has emoji, name, ratio end, and one-line description.
- Per-band `<section>` with sticky header (`Bab X-Y` + description tooltip) and chapters that fall in that range.
- Per-chapter row:
  - Tone color dot + chapter number + title + status badge.
  - Indicator chips: ⚡ dopamine, 💔 false_resolution, 🔒 locked.
  - Compact mode hides metadata; expanded shows time_in_story chip, location chip, top-4 character chips (overflow indicator), 🍞 mystery breadcrumb chips, ✨ mystery reveal chips.
- Plot Thread Lifespan Bars in sticky left sidebar (desktop only):
  - Vertical bar per active thread, span from `planted_at` → `resolved_at` (or `target_chapters` if dangling).
  - Color by urgency, dashed when dangling >10 chapters past planted.
  - Cap to 10 lanes for legibility.
- Click row → `setActiveChapter + setMode('write')`. Compact toggle button.
- All transformations memoized: arc band grouping, breadcrumbs index by chapter, reveals index by chapter, thread spans.

#### Phase 5 — Word Count Analytics (Recharts)
- `src/components/visualization/WordCountAnalytics.tsx` (~225 lines).
- 4 stat cards above the chart: Total Kata, Avg/bab, ≥ Target count, < Target count (rose accent for below).
- Recharts `ComposedChart` (responsive container, 320 px height):
  - `Bar` per chapter, `Cell`-colored by status.
  - `Line` cumulative wordcount on right Y-axis.
  - `ReferenceLine` dashed amber at `word_count_target`.
  - Custom `<ChartTooltip>` shows chapter title, words/target, ±delta % (emerald above, rose below), status, and cumulative.
- Click bar → `setActiveChapter + setMode('write')` via Recharts `onClick` event with type-safe payload coercion.
- Empty states: zero chapters vs chapters-but-no-prose-yet messages.
- Cumulative computed via immutable `reduce` (no mutable accumulator — satisfies ESLint `react-hooks/immutability`).

#### Phase 6 — Verification & Polish
- Centralised `getArcPosition` from `outline-engine.ts` and `outlines.ts` into `src/lib/kbm-pacing.ts` next to the new `computeArcBands`/`ArcBand` interface, then re-exported. The two callers now import from kbm-pacing instead of duplicating the helper.
- Fixed pre-existing lint error in `EditDraftModal.tsx` (`useEffect` reset → prev-prop-during-render pattern) so the lint gate could close clean.
- `WordCountAnalytics` Recharts chart-click handler typed with safe `unknown` coercion since recharts' `MouseHandlerDataParam` shape is internal.

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (1.40s)** ✅
  - Main bundle: **920.44 KB / 258.89 KB gzipped** (+25 KB vs Sprint 7 — acceptable; 4 viz wrappers + lazy infrastructure).
  - Lazy chunks confirmed (only loaded on `activeMode === 'visualize'`):
    | Chunk | Size | Gzip |
    |---|---|---|
    | EmotionalArcHeatmap | 6.41 KB | 2.66 KB |
    | TimelineView | 7.22 KB | 2.56 KB |
    | ConstellationMap | 27.42 KB | 9.89 KB |
    | WordCountAnalytics | 377.21 KB | 109.71 KB |
  - Recharts is the heavyweight (~370 KB), but it's behind `React.lazy` so users who never open Visualisasi never download it.
  - PWA precache: 15 entries (2309.89 KiB) — service worker rebuilt cleanly.

### Files Created (5)
| File | Lines | Description |
|---|---|---|
| `src/components/visualization/VisualizationPanel.tsx` | ~145 | Lazy wrapper + 2x2 grid + empty state |
| `src/components/visualization/EmotionalArcHeatmap.tsx` | ~285 | Multi-lens heatmap (5 lenses) |
| `src/components/visualization/ConstellationMap.tsx` | ~620 | D3 force-directed + mobile list fallback + filters |
| `src/components/visualization/TimelineView.tsx` | ~260 | Arc bands + mystery markers + thread spans |
| `src/components/visualization/WordCountAnalytics.tsx` | ~225 | Recharts ComposedChart + stats cards |

### Files Modified (6)
| File | Change |
|---|---|
| `src/store/useUiStore.ts` | `'visualize'` added to `WorkspaceMode` union |
| `src/components/workspace/ModeSwitcher.tsx` | 5th tab "🌌 Visualisasi" |
| `src/pages/Workspace.tsx` | Render `<VisualizationPanel />` + bottom nav `analytics` icon + import |
| `src/lib/kbm-pacing.ts` | `ArcBand` interface + `computeArcBands` + centralized `getArcPosition` |
| `src/store/parts/outlines.ts` | Removed local duplicate; arc helper now in kbm-pacing |
| `src/prompts/outline-engine.ts` | Imports `getArcPosition` from `../lib/kbm-pacing` |
| `src/components/modals/EditDraftModal.tsx` | Lint fix: `useEffect` → prev-prop-during-render pattern |

### Manual Verification Pending (User-Side)
- Mode ke-5 muncul di ModeSwitcher (desktop) + bottom nav (mobile) dengan icon `analytics`.
- Heatmap: switch antar 5 lens (Tone/Cliffhanger/Filler/WordCount/Status), warna update, hover tooltip sync, klik cell navigate ke bab.
- Constellation desktop: drag node bekerja, klik highlight edges connected, hover tooltip muncul, filter checkboxes hide/show nodes, range slider scope chapters, zoom + pan responsive.
- Constellation mobile (<768px): list fallback rendered, top-3 connections per entity ditampilkan.
- Timeline: 10 arc bands grouping correct, mystery breadcrumb 🍞 + reveal ✨ inline, thread bars span correctly di sticky left column, compact toggle works.
- Word Count: 4 stat cards akurat, bar warna sesuai status, line cumulative naik monoton, ReferenceLine target tampil, click bar navigate.
- Empty states: project baru tanpa chapters → friendly empty + Outline CTA.
- Network tab: lazy chunks (EmotionalArcHeatmap, ConstellationMap, TimelineView, WordCountAnalytics) hanya download saat `activeMode === 'visualize'`.

### Next Steps (Sprint 9 — Genre Blueprints & Polish)
- Genre Blueprint library (Drama Rumah Tangga, Romance Office, Action, Mystery, dll) — preset narrative_constitution + theme_and_tone + suggested arc structure.
- Onboarding flow polish: tutorial overlay, sample project quick-start.
- Performance pass: code-split routes, prefetch hints, Lighthouse audit.
- Accessibility pass: focus trap modals, screen reader labels review, color contrast audit.
- Final UI polish: loading skeletons, error boundaries per route, friendly 404 page.


---

## Session: Sprint 9 — Genre Blueprints & Polish
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### What Was Done

#### Phase 1 — Genre Blueprints + Lobby Integration
- Created `src/lib/genre-blueprints.ts` (~620 lines): static TypeScript const dengan 6 blueprint entries (Drama Rumah Tangga, Romance Office, Fantasi Kerajaan, Thriller Misteri, Action Aksi, Slice of Life Romance). Setiap blueprint punya: narrative_constitution_template multi-paragraf, theme_and_tone, suggested chapter range, target_ending_template, series_hook_template, character_archetypes (3-4 per blueprint dengan placeholder bracketed names + voice_dna_hint), item_archetypes, mystery_layer_skeleton (1-3 per blueprint dengan reveal_arc_position 0.0-1.0), arc_pacing_hint. Helper `substituteNames(template, customNames)` untuk replace placeholders, `getAllGenreNames(projectGenres)` untuk derive Lobby filter dari blueprints + custom genres.
- Created `BlueprintSelector.tsx` (~290 lines): 2-step modal — grid 6 cards → preview drawer dengan narrative_constitution preview (≤200px scrollable), inline rename per character archetype dengan input editable, mystery skeleton list, arc pacing hint. Skip-all behavior — user yang lewatin rename, archetype-nya tidak di-insert (cek di applier).
- Refactored `ProjectCreationModal.tsx`: layout berubah dari 2-CTA jadi 3-CTA grid (🌱 Mulai Dari Nol / 🎨 Pakai Blueprint NEW badge / 📖 Lanjut Cerita Saya). Klik Blueprint → state `selectedBlueprint` + `customNames` → submit dengan `genesis_mode: 'FRESH_BLUEPRINT'` + payload BlueprintSelection. Auto-fill title kalau kosong → `Novel ${blueprint.name} Baru`, suggested chapter count, suggested word count.
- Created `src/services/blueprint-applier.ts`: `applyBlueprint(project, blueprint, userCharacterNames)` orchestrates updateProject (narrative_constitution + theme_and_tone + target_ending + series_hook semua disubstitusi nama) + addCharacter per archetype (skip kalau placeholder belum di-rename) + addItem per item archetype + addMysteryLayer dengan breadcrumbs di-seed di chapter ratio 0.2 dan 0.5 dari reveal target.
- `Lobby.tsx`: `handleCreate` punya cabang baru — kalau `mode === 'FRESH_BLUEPRINT'` dan `blueprintSelection` ada, jalankan `applyBlueprint` setelah `createProject`. Genre filter dropdown sekarang `getAllGenreNames(projects.map(p => p.genre))` — single source of truth.

#### Phase 2 — Spin-Off Clone + Target Chapters Adjustment
- Created `src/services/project-cloner.ts`: `getNextSpinOffName` regex-match existing spin-offs → return next available name (`"X — Spin-Off"`, `"X — Spin-Off (2)"`, dst). `cloneProjectAsSpinOff(sourceProjectId, customTitle?)`: insert new project dengan `genesis_mode: 'FRESH_BRAINSTORM'` + status BRAINSTORMING (no migration), copy meta fields (narrative_constitution, theme_and_tone, target_ending, series_hook, season_hooks, voice_dna_project), copy lorebook (characters + items + world_rules + mystery_layers dengan revealed_at/breadcrumbs di-reset), skip chapters/states/threads/summaries/qa_logs — fresh canvas dengan dunia + tokoh sama.
- `ProjectCard.tsx`: dropdown menu diperpanjang dari 1 item (Hapus) jadi 3 (Ubah Target Bab + Spin-Off Clone + separator + Hapus). New optional callbacks `onSpinOff` + `onAdjustTarget` di props (both optional — backwards compat). `data-tour-step` attributes untuk tutorial highlight.
- Created `src/services/chapter-protection.ts`: `isLocked(chapter)` returns true if `is_locked || prose || status === 'IMPORTED'`. `getLockedChaptersAbove(chapters, n)` + `validateTargetReduction(chapters, newTarget)` returns `{ ok, blockingChapters, minAllowed }` untuk preview UI dan adjuster guard. `countOutlineOnlyAbove` helper.
- Created `src/services/target-chapters-adjuster.ts` (~210 lines):
  - **GUARD**: `requireActiveAndNotCompleted` throws kalau project status COMPLETED.
  - `expandTargetNewSeason(projectId, newTarget)` — sekedar bump target_chapters, outline lama tetap.
  - `expandTargetStretch(projectId, newTarget)` — bump target lalu loop regenerateOutline untuk chapters yang tidak locked. Returns `{ regenerated, skipped }`.
  - `shrinkTarget(projectId, newTarget)` — validateTargetReduction dulu, lalu DELETE outline-only chapters > newTarget (cascade chapter_summaries via DB), clamp `plot_threads.planted_at` + reset `resolved_at` ke null + status ACTIVE kalau di atas newTarget, clamp `mystery_layers.revealed_at_chapter` + filter breadcrumbs > newTarget, delete character_states `chapter_number > newTarget` (Supabase + local), update project.target_chapters. Returns `{ deleted, threadsClamped, mysteriesClamped, statesDeleted }`.
  - `previewShrink(projectId, newTarget)` — read-only preview untuk modal.
- Created `TargetChaptersAdjustmentModal.tsx` (~280 lines): COMPLETED guard render special state. Direction otomatis (`expand` / `shrink` / `same`). Expand mode: radio NEW_SEASON vs STRETCH. Shrink mode: side-effect preview cards (deleted/threads/mysteries/states) + 2-step "Saya mengerti operasi ini tidak bisa di-undo" checkbox confirmation. Submit button disabled kalau direction === same atau ada blocking locked atau confirm box belum dicentang. Feedback toast inline. prev-prop-during-render pattern untuk reset state on project change.
- `Lobby.tsx`: handlers `handleSpinOff` (showConfirm dialog dengan suggested name → `cloneProjectAsSpinOff` → addToast → navigate ke project baru) + `handleAdjustTarget` (open modal). Mounted `<TargetChaptersAdjustmentModal>` di bottom.

#### Phase 3 — Mimicry Engine
- Migration: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_dna_project JSONB NOT NULL DEFAULT '{}'::jsonb;` di `supabase/schema.sql`. Idempotent. Project interface + database.types.ts + DUMMY_PROJECTS + createProject default semua di-update dengan `voice_dna_project: {}`.
- Created `src/prompts/mimicry-engine.ts` — system prompt instruksi extract 8 fitur struktural (diction, sentence_rhythm, paragraph_density, dialogue_style, signature_phrasing, taboo_phrasing, pace_descriptor, emotional_color) JANGAN copy konten cerita / nama karakter / lokasi. User prompt embed sample dengan word count + warning kalau di bawah 300 kata.
- `aiRouter.extractProjectVoiceDna(sample, signal?)` — Gemini Flash `geminiPool.generateContent` dengan JSON parsing + retry-resistant defensive normalization (string-coerce nested objects, drop null values).
- Created `MimicryEngineCard.tsx` (~220 lines): single component dengan prop `placement: 'context-panel' | 'settings'` (compact vs full-width). Textarea max 5000 char dengan word counter + warning di bawah 300 kata, "🪄 Ekstrak Voice DNA" button, hasil JSON tampil sebagai key-value cards yang user bisa edit + save. Privacy disclaimer "🔒 Sample tidak disimpan ke server, hanya fitur struktural diekstrak.". Saved DNA preview shows top 3 (compact) atau 8 (settings) entries dengan opsi Hapus.
- Wire ke prose generation: `prose-context.ts` include `projectVoiceDna: project.voice_dna_project ?? {}` (null-safe). `prose-writer.ts` inject block `[PROJECT VOICE STYLE]` dengan instruksi "Gabungkan dengan voice DNA per-karakter — voice karakter prioritas saat dialog, voice proyek prioritas saat narasi" — hanya muncul kalau dictionary non-empty.
- Mounted di **dua tempat**: ContextPanel outline mode (placement="context-panel" — di bawah Lorebook), SettingsModal Tab "Writing" (placement="settings" — full width). Komponen sama, props beda.

#### Phase 4 — Onboarding Tutorial + A11y Polish + Settings Re-organization
- Created `OnboardingTour.tsx` (~250 lines): portal-based 5-step coach mark overlay. Steps: 1. Welcome center (no target), 2. Buat Proyek Baru (NewProjectCard), 3. Mode Switcher (Workspace), 4. Context Panel (sidebar), 5. Settings & API Keys (Lobby nav settings icon). Trigger pakai **lazy initial state** `localStorage.getItem('vn_onboarding_done_v1') === null` (no setState-in-effect, satisfies React 19 strict purity rule). Highlight target via `data-tour-step` selector + getBoundingClientRect → cutout ring dengan `box-shadow: 0 0 0 9999px` dim trick. Tooltip card auto-position (right of target → left → below → centered fallback). Step dots progress indicator. Lewati / Kembali / Lanjut → buttons. Respects `prefers-reduced-motion` via Framer's `useReducedMotion()` — fade-only, no scale/spring.
- `data-tour-step` attributes ditambah di: `NewProjectCard`, `ModeSwitcher` root, `ContextPanel` aside, Lobby Settings icon button.
- SettingsModal full refactor — sekarang **3 tabs** dengan Framer Motion `layoutId="settingsTabIndicator"` sliding underline:
  - **🔑 Keys**: existing BYOK Gemini multi-key + OpenRouter. Indonesian privacy disclaimer di header.
  - **✍ Writing**: theme toggle, Free Write toggle (custom switch component dengan accent), MimicryEngineCard placement="settings" (full-width, 8 fields preview).
  - **🎓 Tutorial**: "Reset Onboarding" button (clears localStorage flag + addToast feedback), about/version section.
- A11y polish:
  - Created `useFocusTrap.ts` (~85 lines): trap Tab/Shift-Tab dengan FOCUSABLE_SELECTOR (a, button, input, select, textarea, [tabindex]), Escape calls onEscape callback, auto-focus first focusable on mount via requestAnimationFrame, restore focus to previously-focused element on cleanup. Applied to SettingsModal, BlueprintSelector, TargetChaptersAdjustmentModal.
  - Created `SkipLink.tsx`: visually hidden anchor, `focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200]`, anchor href `#main-content`. Mounted di Lobby + Workspace (top of return).
  - Lobby + Workspace `<main id="main-content" role="main">` landmark. Lobby's `<nav>` already implicit landmark.
  - Global `prefers-reduced-motion` CSS di index.css — disables animations + transitions + scroll-behavior untuk OS-level user preference.

#### Phase 5 — Performance + Verification
- `App.tsx`: `Workspace` di-lazy via `React.lazy(() => import('./pages/Workspace').then((m) => ({ default: m.Workspace })))`. Wrapped dalam `<Suspense fallback={<LoadingSplash />}>`. Created `LoadingSplash.tsx` — full-screen spinner + label, match Lobby loading style.
- `vite.config.ts`: tambah `build.rollupOptions.output.codeSplitting.groups[]` (Vite 8 / Rolldown API, bukan deprecated `manualChunks`). 4 vendor groups: vendor-react (react+react-dom+react-router-dom+scheduler), vendor-supabase (@supabase/*), vendor-motion (framer-motion), vendor-store (zustand).

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (1.31s)** ✅

### Bundle Size Wins (vs Sprint 8)
| | Sprint 8 | Sprint 9 | Δ |
|---|---|---|---|
| Main entry (raw) | 920 KB | **259 KB** | **−72%** |
| Main entry (gzip) | 259 KB | **77 KB** | **−70%** |

Lazy chunks:
- `Workspace`: 225 KB / 53 KB gzip — only loads when user opens project
- `vendor-react`: 189 KB / 60 KB gzip — cached, app updates don't invalidate
- `vendor-supabase`: 200 KB / 52 KB gzip — same
- `vendor-motion`: 125 KB / 41 KB gzip — same
- `vendor-store`: 2.6 KB / 1.3 KB gzip
- Visualization chunks (4): unchanged from Sprint 8 (Recharts heavyweight tetap lazy)
- PWA precache: 21 entries (2399 KiB)

Total user pertama buka Lobby: ~570 KB (main + 4 vendor chunks) vs 920 KB monolith. Plus iterative app updates tidak invalidate vendor JS — huge bandwidth saving on iterative ships.

### Files Created (13)
| File | Lines | Description |
|---|---|---|
| `src/lib/genre-blueprints.ts` | ~620 | 6 blueprint entries + helpers |
| `src/components/onboarding/BlueprintSelector.tsx` | ~290 | 2-step modal grid + preview |
| `src/components/onboarding/OnboardingTour.tsx` | ~250 | 5-step coach mark portal |
| `src/components/compass/MimicryEngineCard.tsx` | ~220 | Voice DNA extractor card |
| `src/components/modals/TargetChaptersAdjustmentModal.tsx` | ~280 | Preview + 2-step shrink confirm |
| `src/components/ui/SkipLink.tsx` | ~30 | A11y skip link |
| `src/components/ui/LoadingSplash.tsx` | ~20 | Suspense fallback |
| `src/services/blueprint-applier.ts` | ~120 | Substitute names + insert lorebook |
| `src/services/project-cloner.ts` | ~140 | getNextSpinOffName + cloneProjectAsSpinOff |
| `src/services/chapter-protection.ts` | ~80 | isLocked + validateTargetReduction |
| `src/services/target-chapters-adjuster.ts` | ~210 | Expand/shrink dengan side-effect cleanup |
| `src/prompts/mimicry-engine.ts` | ~50 | JSON schema 8 fields |
| `src/hooks/useFocusTrap.ts` | ~85 | Tab cycle + Escape + restore focus |

### Files Modified (16)
| File | Change |
|---|---|
| `src/types/project.ts` | `voice_dna_project?: Record<string, unknown>` |
| `src/lib/database.types.ts` | sync `voice_dna_project` |
| `src/store/parts/projects.ts` | default `{}` di createProject + dummy projects |
| `src/components/dashboard/ProjectCreationModal.tsx` | 3-CTA layout + Blueprint flow |
| `src/components/dashboard/ProjectCard.tsx` | context menu Spin-Off + Adjust + onSpinOff/onAdjustTarget callbacks + tour data attrs |
| `src/pages/Lobby.tsx` | derived genre filter + onboarding trigger + skip-link + Spin-Off/AdjustTarget handlers + landmark |
| `src/pages/Workspace.tsx` | skip-link + main role + landmark |
| `src/components/workspace/ContextPanel.tsx` | render MimicryEngineCard outline mode + tour data attr |
| `src/components/workspace/ModeSwitcher.tsx` | tour data attr |
| `src/services/ai/ai-router.ts` | `extractProjectVoiceDna` method |
| `src/services/prose-context.ts` | include `projectVoiceDna` (null-safe) |
| `src/services/ai/types.ts` | `projectVoiceDna?` di ProseGenerateInput |
| `src/prompts/prose-writer.ts` | inject `[PROJECT VOICE STYLE]` block |
| `src/components/modals/SettingsModal.tsx` | 3-tab refactor + Mimicry section + Reset Onboarding + theme/free-write toggle |
| `src/App.tsx` | lazy Workspace route + Suspense |
| `src/index.css` | `prefers-reduced-motion` global override |
| `vite.config.ts` | `codeSplitting.groups[]` vendor chunks |
| `supabase/schema.sql` | `ALTER TABLE projects ADD COLUMN voice_dna_project jsonb` |

### Manual Verification Pending (User-Side)
- Lobby → "Buat Proyek Baru" → "Pakai Blueprint" → pilih Drama RT → preview → rename "[Nama Protagonis]" → konfirmasi → masuk Workspace dengan compass auto-filled.
- ProjectCard menu → "Spin-Off Clone" → confirm dialog → new project muncul tanpa chapters. Klik 2x → "Spin-Off (2)".
- "Ubah Target Bab" → tambah 200→300 (Tambah Season) → verify project.target_chapters update + chapters lama tetap.
- "Ubah Target Bab" → kurangi 200→50 dengan locked chapter di bab 60 → blocking dialog "min 60".
- "Ubah Target Bab" pada project COMPLETED → modal disabled state.
- Mimicry: paste 500 kata di Settings tab Writing → Ekstrak → 8 cards muncul → Simpan. Lalu di ContextPanel outline mode → MimicryEngineCard juga show data sama.
- Generate prose 1 bab di project dengan voice_dna_project → cek output mimic style.
- Onboarding: clear localStorage → reload → tour muncul → click through 5 steps → finish → reload → tour tidak muncul.
- Settings → Tutorial tab → Reset Onboarding → reload → tour kembali muncul.
- OS toggle reduced-motion → reload → semua scale/spring hilang, fade-only.
- Lighthouse mobile preset audit (4 score targets: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 90).
- Network tab: Workspace + vendor chunks lazy-loaded, hanya download saat navigate ke /project/:id.

### Next Steps (Sprint 10 — Capacitor & Production)
- Capacitor CLI setup, Android platform integration.
- Splash screen, app icon, back button handling.
- Performance optimization pass (Lighthouse audit + fixes).
- Play Store preparation (signing, metadata, screenshots).
- E2E testing — 10 chapter dari nol sampai final.


---

## Session: Sprint 9.5 — QA Hardening (Concurrency & Continuity Fixes)
**Date**: 2026-05-24
**Status**: ✅ COMPLETED — TypeScript, ESLint, and Production Build all zero errors

### Background
External QA audit (`systems_architecture_qa_report.md`) identified 7 concurrency / logical collision points. Cross-check against actual code revealed:

- ✅ 4 valid issues — actionable fixes
- ⚠️ 1 partially accurate — not critical
- ❌ 2 inaccurate — Import Wizard "DB pollution" tidak terjadi (abort hanya cancel AI analyze, DB writes di handleConfirm setelah user setuju), "Cross-chapter contamination" overstated (closure correctly captures chapter.id)

Sprint 9.5 fokus eksekusi 3 fix paling impactful tanpa schema migration.

### What Was Done

#### Fix #1 — Free Write Memory Blackhole Resolution
- Created `src/services/chapter-reindexer.ts` (~250 lines): orchestrator service untuk re-run semua background AI tasks (state snapshot, plot radar, lore extraction, thread analysis, chapter summary) pada chapter yang punya prose tapi tidak punya artifacts.
  - `detectMissingArtifacts(chapter)` returns flags per task (cheap proxy: chapter has prose + corresponding store entries don't exist)
  - `reindexChapter(chapterId)` runs only missing tasks via `Promise.allSettled`, returns `{ chapterId, chapterNumber, succeeded[], failed[] }`
  - `reindexChapters(ids, onProgress, signal)` sequential loop (Bab N+1 butuh state Bab N) dengan progress callback + AbortSignal honoring
  - `findChaptersNeedingReindex()` scan project untuk chapters yang butuh sync, sorted by chapter_number
- Created `src/components/modals/ReindexModal.tsx` (~270 lines): 3-state modal:
  - **Idle preview**: list chapter yang butuh sync (max-height scrollable) + estimasi waktu + 2-action footer ("Nanti Saja" / "Mulai Sinkronisasi")
  - **Running**: progress bar (animated bg-primary, atau bg-amber kalau partial), current chapter indicator, abort button
  - **Done**: success/fail stat cards (emerald/rose), failed task details collapsible (max-height 160px scrollable), close button
  - Empty state ramah ("Semua bab sudah tersinkronisasi ✓") kalau pendingIds kosong
  - Focus trap via existing `useFocusTrap` hook
- Created `src/components/onboarding/FreeWriteIndexerWatcher.tsx` (~50 lines): global watcher mounted di Workspace:
  - `prevFreeWriteRef` track previous freeWriteMode value
  - `useEffect` detect transition true → false → 800ms debounce → `findChaptersNeedingReindex` → auto-open ReindexModal kalau ada
  - Manual trigger via `useUiStore.openModal('reindex')`
- Wired manual trigger di `SettingsModal.tsx` Tutorial tab dalam section "Sinkronisasi Memori AI" dengan tombol "Buka Reindexer" (memory icon).
- Mounted `<FreeWriteIndexerWatcher />` di `Workspace.tsx`.

#### Fix #2 — Offline Reconnect AI Backfill
- Modified `useBeatWriter.ts` reconnect sync flow:
  - Track `syncedChapterIds: Set<string>` selama replay loop. Setiap successful sync push id ke set.
  - Setelah `syncPendingDrafts` selesai dengan `synced > 0`, sequential loop call `reindexChapter(id)` untuk tiap chapter di set
  - Best-effort: failures di-log via `console.warn`, partial reindex (some tasks failed) juga di-log dengan detail tasks yang gagal
  - `cancelled` flag honored di between iterations untuk graceful unmount (cleanup function dari useEffect)
- Hasil: chapter yang ditulis offline sekarang otomatis dapat AI artifacts saat user reconnect — tidak ada lagi gap context untuk Bab N+1.

#### Fix #3 — Chat Approval Conflict Detection
- Modified `useChatStore.updateMessageDraftStatus`:
  - Helper functions: `findCharByName / findItemByName / findRuleByName` — case-insensitive name matching against current store
  - Untuk type `character`, `item`, `world_rule`: cek existing entry SEBELUM call `addCharacter`/`addItem`/`addWorldRule`
  - Kalau existing → call `useUiStore.addToast(message, 'warning', 7000)` dengan pesan spesifik: "Tokoh/Item/World rule [nama] sudah ada di Lorebook. Edit manual via Story Compass kalau mau update yang existing." Lalu return state tanpa add (skip the duplicate insert)
  - Mystery layers + character_state + ending TIDAK terkena duplicate detection (intentional — mystery layers naturally additive, character states keyed by chapter, ending is updateProject)
- Pendekatan duplicate-by-name lebih pragmatic dari full optimistic lock dengan `updated_at` timestamp — tidak butuh schema migration dan menangkap real-world stale-approval scenario yang QA report sebutkan.

### Why Some QA Recommendations Were NOT Implemented

| QA Recommendation | Decision | Reasoning |
|---|---|---|
| 3.1 Background Task Queue | ❌ Skip | Existing `geminiPool` already handles 429 + cooldown rotation transparently. Adding queue adds complexity without solving real bug. |
| 1.1 Cross-chapter contamination | ❌ Skip | Code closure correctly captures `chapter.id` Bab 51, ref-guard `stateGenTriggeredRef` prevents re-trigger. False positive in QA report. |
| 2.2 Import Wizard DB pollution | ❌ Skip | Verified: `cancelAnalysis()` only aborts AI analysis. DB writes happen in `handleConfirm` AFTER user clicks "Setujui Semua". Mid-analysis abort = zero pollution. QA misread the flow. |
| 3.4 Optimistic Lock with `updated_at` | ❌ Replaced | Required schema migration to 3 tables. Replaced with duplicate-by-name detection — pragmatic MVP fix. Full lock can be added in Sprint 10 if needed. |

### Verification Results
- `npx tsc -b --noEmit` → **SUCCESS (Zero errors)** ✅
- `npm run lint` → **SUCCESS (Zero errors, zero warnings)** ✅
- `npm run build` → **SUCCESS (765ms)** ✅
  - Main bundle: 260.24 KB / 77.44 KB gzipped (+0.9 KB / +0.18 KB gzip vs Sprint 9 — negligible)
  - Workspace lazy chunk: 238.76 KB / 56.17 KB gzipped (+13.3 KB — reindexer modal + watcher + service)
  - Lazy chunks unchanged (visualization, vendor, pdf, mammoth)
  - PWA precache: 21 entries (2413.60 KiB)

### Files Created (3)
| File | Lines | Description |
|---|---|---|
| `src/services/chapter-reindexer.ts` | ~250 | Orchestrator: detectMissing + reindexChapter + reindexChapters + findChaptersNeedingReindex |
| `src/components/modals/ReindexModal.tsx` | ~270 | 3-state modal (idle / running / done) dengan progress + results |
| `src/components/onboarding/FreeWriteIndexerWatcher.tsx` | ~50 | Global watcher untuk Free Write toggle off |

### Files Modified (4)
| File | Change |
|---|---|
| `src/hooks/useBeatWriter.ts` | Sync flow track syncedChapterIds + reindex backfill loop |
| `src/store/useChatStore.ts` | Duplicate-by-name detection untuk character/item/world_rule drafts |
| `src/components/modals/SettingsModal.tsx` | "Sinkronisasi Memori AI" section di Tutorial tab |
| `src/pages/Workspace.tsx` | Mount FreeWriteIndexerWatcher globally |

### Manual Verification Pending (User-Side)
- Toggle Free Write ON → tulis bab 5-10 raw → toggle OFF → ReindexModal auto-muncul → klik Mulai → progress muncul → semua bab dapat state snapshot + summary
- Network → Offline → tulis prosa di beat editor → save terdraft di localStorage → Network → Online → console log "Synced N pending draft(s)" → reindexChapter triggered untuk chapter yang di-sync
- Co-Author Chat: ajukan karakter "Kania" → sebelum approve, manual tambah karakter "Kania" via Story Compass → approve chat draft → toast warning muncul, tidak ada duplicate
- Settings → Tutorial tab → "Buka Reindexer" → modal muncul terlepas dari Free Write state
- Mobile (375px) ReindexModal responsive

### Next Steps (Sprint 10 — Capacitor & Production)
- Capacitor CLI setup, Android platform integration
- Splash screen, app icon, back button handling
- Lighthouse audit pass (Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 90)
- Play Store preparation (signing, metadata, screenshots)
- E2E testing — 10 chapter dari nol sampai final
- Optional follow-up: full optimistic lock dengan `updated_at` migration kalau MVP feedback menunjukkan stale approval masih jadi masalah
