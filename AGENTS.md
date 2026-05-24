# VibeNovel v2 AI Agent Coding Guidelines & Rules

Seluruh asisten coding AI (termasuk Antigravity dan agen AI masa depan) yang bekerja pada repositori ini **WAJIB** mematuhi pedoman, desain, arsitektur, dan instruksi teknis yang ditetapkan dalam dokumen dasar berikut:

1. **Rencana Implementasi Utama**: [implementation_plan_v3.md](file:///d:/Coding/vibenovel/implementation_plan_v3.md)
2. **Arsitektur Sistem Premium**: [architecture.md](file:///d:/Coding/vibenovel/architecture.md)
Seluruh asisten coding AI **WAJIB** mengikuti Master Sprint Plan yang telah disetujui di [sprint_plan.md](file:///d:/Coding/vibenovel/sprint_plan.md).

---

## 🛑 Aturan & Batasan Utama (Critical Enforcement)

### 1. Ketaatan terhadap verbatimModuleSyntax & TypeScript
* Repositori ini memiliki konfigurasi `verbatimModuleSyntax: true` diaktifkan di `tsconfig.json`.
* **ATURAN**: Setiap kali mengimpor tipe data, interface, atau type alias (e.g., dari `src/types/project.ts`), Anda **WAJIB** menggunakan pemanggilan *type-only* (`import type { ... }`).
* **CONTOH BENAR**:
  ```typescript
  import type { Project, Chapter, Character } from '../types/project'
  ```
* **CONTOH SALAH**:
  ```typescript
  import { Project, Chapter, Character } from '../types/project'
  ```

### 2. Client-Side Only Architecture (PWA & PWA-Ready)
* VibeNovel v2 dirancang 100% berjalan di client-side (SPA). Tidak diperbolehkan membangun server-side rendering (SSR), NextJS API routes, atau custom backend server.
* Seluruh integrasi Supabase dan pemanggilan asisten AI (Gemini Multi-API dan OpenRouter) dijalankan langsung dari browser melalui service layer client-side.
* Hal ini penting agar bundle static di `dist/` dapat langsung dibungkus oleh Capacitor CLI untuk platform mobile Android/iOS tanpa modifikasi.

### 3. Keamanan BYOK (Bring Your Own Key) & Local Keyring
* Seluruh API key milik user (Gemini keys dan OpenRouter key) **hanya boleh disimpan secara lokal** di browser client menggunakan local storage (Zustand persist middleware) — **tidak terenkripsi end-to-end**, tapi tidak pernah meninggalkan perangkat user.
* **DILARANG KERAS** mengirimkan, mencatat, membocorkan, atau mengunggah API key pengguna ke database eksternal atau server penampung lainnya.
* **DILARANG** men-log porsi apapun dari nilai API key ke `console` (termasuk prefix/suffix). Pakai indeks atau label generik (`key #0`) untuk debugging.

### 4. Sinkronisasi Tema (Anti-Flicker)
* Tema default adalah `dark` (Malam Kreatif) dengan opsi toggling ke `light` (Jurnal Cantik).
* Kode visual penanganan tema harus disinkronisasikan secara instan ke elemen root DOM `document.documentElement` untuk mencegah flicker/layout shift warna putih saat pemuatan halaman awal.

### 5. Memory System 4-Layer
* Logika asisten Beat-by-Beat prose writer wajib mengikuti mekanisme Context Pruning & memory system 4-layer:
  1. *Static Lorebook Context* (Narrative Constitution, Characters + Voice DNA, World Rules, Target Ending).
  2. *Dynamic State Object* (Character States per bab, Timeline Tracker, Plot Thread, Item Ownership).
  3. *RAG Long-Term Memory* (Chapter summaries + semantic search vector database).
  4. *Sliding Window* (500 kata terakhir bab sebelumnya + outline bab berjalan).

---

> [!IMPORTANT]
> Jangan pernah mengubah struktur arsitektur database Supabase, format state Zustand, maupun antarmuka AI router tanpa melakukan review silang dan menyelaraskan perubahan tersebut ke dalam dokumen `architecture.md` terlebih dahulu.

---

<!-- BEGIN:vibenovel-sprint-rules -->
## 🗺️ Master Sprint Plan & Execution Rules



### 🗺️ Ringkasan Jalan Sprint (10 Sprints)
* **Sprint 1A** — Supabase & Auth (Fase 1)
* **Sprint 1B** — Component Extraction & UI Polish (Fase 1)
* **Sprint 1C** — Brainstorm Agent (Real AI) (Fase 1)
* **Sprint 1D** — Outline Engine (Real AI) (Fase 1)
* **Sprint 2A** — Beat-by-Beat Prose Writer (Fase 2)
* **Sprint 2B** — State Tracker & Context Injection Upgrade (Fase 2)
* **Sprint 3A** — Plot Radar & Lore Extraction (Fase 3)
* **Sprint 3B** — Review Mode & PWA (Fase 3)
* **Sprint 4** — Pro Writer Features (Fase 4)
* **Sprint 5** — KBM Retention Engine (Fase 5)
* **Sprint 6** — Auto-Pilot Batch Generation (Fase 6)
* **Sprint 7** — Thread Tracker & RAG (Fase 7)
* **Sprint 8** — Visualization (Fase 8)
* **Sprint 9** — Genre Blueprints & Polish (Fase 9)
* **Sprint 10** — Capacitor & Production (Fase 10)

### 🔑 Aturan Eksekusi Per Sprint (WAJIB DIPATUHI)
1. **Sebelum mulai sprint**: Baca ulang bagian relevan dari [implementation_plan_v3.md](file:///d:/Coding/vibenovel/implementation_plan_v3.md) dan [architecture.md](file:///d:/Coding/vibenovel/architecture.md).
2. **Selama sprint**: Update [task.md](file:///d:/Coding/vibenovel/task.md) dengan checklist per-file.
3. **Sebelum close sprint**: Jalankan pengecekan build (`npx tsc -b --noEmit` & `npm run build`), pastikan **wajib sukses (zero errors)** + verifikasi manual.
4. **Setelah close sprint**: Update [walkthrough.md](file:///d:/Coding/vibenovel/walkthrough.md) dengan ringkasan perubahan.
5. **Kapan saja**: Jika ada keputusan arsitektur baru, update [architecture.md](file:///d:/Coding/vibenovel/architecture.md) terlebih dahulu sebelum menulis kode.

> [!CAUTION]
> **JANGAN PERNAH LONCAT SPRINT!**
> Sprint berikutnya tidak boleh dimulai sebelum sprint sebelumnya diselesaikan dan diverifikasi. Setiap sprint membangun di atas fondasi sprint sebelumnya. Melompati urutan akan menyebabkan technical debt, inkonsistensi database, dan regresi kode.
<!-- END:vibenovel-sprint-rules -->

