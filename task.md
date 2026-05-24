# Sprint 7 — Thread Tracker & RAG (VibeNovel v2)

## 🎯 Goal
Novel 200+ bab tidak kehilangan thread. Tiga deliverable:
1. **Thread Tracker fungsional** — auto-detect dari prosa (background task), manual CRUD, dangling alert per N bab
2. **RAG / Semantic Search** — chapter summaries + embeddings (Gemini text-embedding-004) di Supabase pgvector, query memunculkan top-K relevant chapters
3. **Recap Generator** — "Sebelumnya..." modal yang merangkum range bab untuk pembaca / writer onboarding

---

## 🧭 Audit Kondisi Saat Ini

| Komponen | Status | Catatan |
|---|---|---|
| `plot_threads` table di Supabase | ✅ exists | Schema lengkap dengan urgency + status |
| `ThreadTrackerPanel` placeholder | ✅ Sprint 3B | Read-only, empty state CTA mention "Sprint 7" |
| `chapter_summaries` table + pgvector | ✅ exists | Schema sudah ada extension `vector`, kolom `vector(768)`, index ivfflat |
| `chapter_summaries` writer code | ❌ | Belum ada — kosong di DB |
| Embedding generation | ❌ | Gemini text-embedding-004 belum diintegrasi |
| Thread auto-detect prompt | ❌ | Belum ada |
| `useBeatWriter` background tasks | ✅ trigger state + plot radar + lore | Tinggal tambah thread detect + chapter summary |
| `BatchGenerator.runBackgroundTasks` | ⚠️ State only | Perlu opsional thread+summary |
| Recap generator prompt | ❌ | Belum ada |
| RecapModal component | ❌ | Belum ada |

---

## ✅ Design Decisions yang Perlu Konfirmasi User

5 pertanyaan kecil:

1. **Embedding storage**: chapter_summaries di-embed pakai Gemini `text-embedding-004` (768-dim, gratis up to 1500 RPM)?
   - Saran: **Ya**, schema sudah `vector(768)`. Free tier cukup.

2. **Thread auto-detect timing**: jalan otomatis sebagai background task setelah chapter DRAFT (sama dengan state tracker), atau manual button saja?
   - Saran: **Auto** (background, fire-and-forget) supaya zero friction. Manual button tetap ada di ThreadTrackerPanel.

3. **Dangling thread alert**: muncul di mana?
   - Saran: **ThreadTrackerPanel + BatchSuccessModal warnings** + **header chip di Workspace** saat ada CRITICAL/HIGH urgency thread yang dangling >10 bab.

4. **Recap entry point**: tombol di mana?
   - Saran: **ProseToolbar** + **ContextPanel write mode** (tombol "📝 Sebelumnya..."). User pilih range, klik generate, modal show recap.

5. **RAG search UI**: Sprint 7 fokus ke service layer + autocomplete behind-the-scenes (context injector pakai semantic search), atau juga UI search bar?
   - Saran: **Service layer + context injector enhancement saja** untuk Sprint 7 (manfaatnya immediate: prose writer dapat top-3 relevant chapter summaries di context). UI search bar dedicated bisa ditunda ke Sprint 8 visualization.

---

## 📋 Checklist (5 Phases)

### Phase 1 — Embedding Service + Chapter Summaries

- [ ] **STEP 1: Embedding API Method** — Modify `src/services/ai/gemini-pool.ts`
  - [ ] `embedContent(text: string, signal?: AbortSignal): Promise<number[]>` calling Gemini `text-embedding-004` endpoint
  - [ ] Pakai key rotation (sama dengan generateContent)
  - [ ] Handle 429 dengan cooldown
  - [ ] Output 768-dim float array

- [ ] **STEP 2: Chapter Summary Prompt** — Create `src/prompts/chapter-summary.ts`
  - [ ] `buildChapterSummarySystemInstruction()` — terse, factual, 2-3 sentence summary
  - [ ] `buildChapterSummaryUserPrompt(chapter, prevSummary)` — input bab prosa + ringkasan bab sebelumnya untuk continuity
  - [ ] Output JSON: `{ summary: string, key_facts: string[] }`

- [ ] **STEP 3: Chapter Summary Service** — Create `src/services/chapter-summary.ts`
  - [ ] `generateChapterSummary(project, chapter, prevSummary?, signal?): Promise<{ summary, key_facts, embedding }>`
  - [ ] Steps: AI summary → embedContent(summary) → return both
  - [ ] Save via `lorebook.upsertChapterSummary` (new method)

- [ ] **STEP 4: Chapter Summary CRUD in Store** — Modify `src/store/parts/lorebook.ts`
  - [ ] State: `chapterSummaries: ChapterSummary[]`
  - [ ] Type: `ChapterSummary { id, chapter_id, project_id, summary, key_facts, embedding?, created_at? }`
  - [ ] `loadChapterSummaries(projectId)`
  - [ ] `upsertChapterSummary(payload)` — INSERT or UPDATE if existing
  - [ ] Wire ke `loadProjectData` (chapters.ts)

- [ ] **STEP 5: Type & DB Types** — Modify `src/types/project.ts` + `database.types.ts`
  - [ ] Add `ChapterSummary` type matching DB schema
  - [ ] Verify `embedding: number[] | null` matches the existing DB shape

### Phase 2 — RAG Service & Context Injector Enhancement

- [ ] **STEP 6: RAG Service** — Create `src/services/rag-service.ts`
  - [ ] `searchSimilarChapters(projectId, query, topK=3): Promise<ChapterSummary[]>` — embed query → Supabase RPC for cosine similarity
  - [ ] Need a Supabase RPC function `match_chapter_summaries(project_id, query_embedding, match_count)` — provide as SQL migration in `schema.sql`
  - [ ] Fallback: `searchByKeywords` if pgvector unavailable (filter `key_facts` JSONB)

- [ ] **STEP 7: Schema Migration** — Modify `supabase/schema.sql`
  - [ ] Add idempotent migration block dengan:
    ```sql
    CREATE OR REPLACE FUNCTION match_chapter_summaries(
      p_project_id UUID,
      p_query_embedding vector(768),
      p_match_count INT DEFAULT 3
    ) RETURNS TABLE(...) ...
    ```
  - [ ] Comment block: "Run after Sprint 7 deploy"

- [ ] **STEP 8: Context Injector RAG Mode** — Modify `src/services/ai/context-injector.ts`
  - [ ] New optional `useRag: boolean` parameter pada `injectContext()`
  - [ ] If true + chapter has synopsis: call `ragService.searchSimilarChapters(projectId, synopsis, 3)`
  - [ ] Append matched summaries sebagai "RELATED CHAPTER MEMORY" block ke loreContext

### Phase 3 — Thread Tracker

- [ ] **STEP 9: Thread Detect Prompt** — Create `src/prompts/thread-tracker.ts`
  - [ ] `buildThreadTrackerSystemInstruction()` — extract / detect plot threads (planted vs. resolved) from prosa + existing thread list
  - [ ] `buildThreadTrackerUserPrompt(chapter, prosa, existingThreads, prevChapterSummaries)`
  - [ ] Output JSON: `{ new_threads: [{ title, planted_at, urgency, related_characters, notes }], resolved_thread_ids: string[], updated_threads: [{ id, status, notes }] }`

- [ ] **STEP 10: Thread Tracker Service** — Create `src/services/thread-tracker.ts`
  - [ ] `analyzeChapterThreads(project, chapter, existingThreads, prevSummaries, signal?): Promise<ThreadAnalysisResult>`
  - [ ] `mergeThreadAnalysis(state, result)` — apply new + resolved + updated to lorebook state

- [ ] **STEP 11: Thread CRUD** — Modify `src/store/parts/lorebook.ts`
  - [ ] Plot threads sudah ada di state (Sprint 3B), tambahkan:
  - [ ] `addPlotThread(payload): Promise<string>` (returns id)
  - [ ] `updatePlotThread(id, partial): Promise<void>`
  - [ ] `deletePlotThread(id): Promise<void>`
  - [ ] `applyThreadAnalysis(result): Promise<void>` — bulk apply

- [ ] **STEP 12: Wire Background Task** — Modify `src/hooks/useBeatWriter.ts` + `src/services/batch-generator.ts`
  - [ ] After chapter transit ke DRAFT, fire-and-forget thread analysis (sama pattern dengan state tracker)
  - [ ] Plus chapter summary generation
  - [ ] Promise.allSettled to keep tasks independent

- [ ] **STEP 13: ThreadTrackerPanel Full Implementation** — Modify `src/components/compass/ThreadTrackerPanel.tsx`
  - [ ] Sprint 3B placeholder → full CRUD: add/edit/delete threads, urgency picker, status select, notes textarea, dangling alert badge
  - [ ] "Auto-detect" button calls `threadTracker.analyzeChapterThreads` dengan chapter aktif

- [ ] **STEP 14: Dangling Alert** — Modify `src/lib/kbm-pacing.ts`
  - [ ] `validateDanglingThreads(threads, currentChapter)` — warn if PLANTED/ACTIVE thread `planted_at` >10 bab dari current dan belum resolved
  - [ ] Hook into outline batch flow (sudah ada pattern di Sprint 5)

### Phase 4 — Recap Generator

- [ ] **STEP 15: Recap Prompt** — Create `src/prompts/recap-generator.ts`
  - [ ] `buildRecapSystemInstruction()` — friendly "Sebelumnya..." voice, 2-4 paragraph max
  - [ ] `buildRecapUserPrompt(chapters, range)` — chapters list dengan synopsis + key_events

- [ ] **STEP 16: Recap Method in AI Router** — Modify `src/services/ai/ai-router.ts`
  - [ ] `generateRecap(input, signal): Promise<string>` — uses Gemini Flash (cheap, story summary task)

- [ ] **STEP 17: RecapModal** — Create `src/components/modals/RecapModal.tsx`
  - [ ] Range picker (start/end bab)
  - [ ] Generate button → streaming recap text
  - [ ] Copy to clipboard
  - [ ] Save to `recaps` table di Supabase (schema already exists)

- [ ] **STEP 18: Recap Entry Points**
  - [ ] Modify `src/components/prose/ProseToolbar.tsx` — tombol "📝 Sebelumnya..."
  - [ ] Modify `src/components/workspace/ContextPanel.tsx` — Write mode "Recap" CTA

### Phase 5 — Verification

- [ ] **STEP 19: TypeScript** — `npx tsc -b --noEmit` zero errors
- [ ] **STEP 20: ESLint** — `npm run lint` zero errors
- [ ] **STEP 21: Production Build** — `npm run build` zero errors
- [ ] **STEP 22: Manual Test** (user-side):
  - [ ] Generate prose untuk 1 bab → setelah DRAFT, chapter_summary auto-tersimpan
  - [ ] Generate 5 bab → ThreadTrackerPanel populated dengan auto-detected threads
  - [ ] Bab 11 mention thread yang ditebar bab 1 → tetap visible di panel sebagai ACTIVE
  - [ ] Outline batch warning: "3 thread dangling di Bab X"
  - [ ] Klik "Sebelumnya..." → modal show 3-paragraph recap
  - [ ] RAG: outline bab 30 dengan reference ke kejadian bab 5 → context injector pull summary bab 5

---

## 📐 File Summary

### NEW (5 files)
- `src/prompts/chapter-summary.ts` (~80 lines)
- `src/prompts/thread-tracker.ts` (~110 lines)
- `src/prompts/recap-generator.ts` (~70 lines)
- `src/services/chapter-summary.ts` (~120 lines)
- `src/services/thread-tracker.ts` (~140 lines)
- `src/services/rag-service.ts` (~100 lines)
- `src/components/modals/RecapModal.tsx` (~250 lines)

### MODIFY (10 files)
- `src/services/ai/gemini-pool.ts` — `embedContent` method (text-embedding-004)
- `src/services/ai/ai-router.ts` — `generateRecap` + `analyzeChapterThreads` + `summarizeChapter`
- `src/services/ai/context-injector.ts` — RAG fallback option
- `src/types/project.ts` — `ChapterSummary` type
- `src/lib/database.types.ts` — verify chapter_summaries shape
- `src/lib/kbm-pacing.ts` — `validateDanglingThreads`
- `src/store/parts/lorebook.ts` — chapter_summaries CRUD + plot_threads CRUD + apply analysis
- `src/store/parts/chapters.ts` — load chapter_summaries di loadProjectData
- `src/hooks/useBeatWriter.ts` — fire thread analysis + summary background tasks
- `src/services/batch-generator.ts` — same in `runBackgroundTasks`
- `src/components/compass/ThreadTrackerPanel.tsx` — full CRUD
- `src/components/prose/ProseToolbar.tsx` — Recap button
- `supabase/schema.sql` — `match_chapter_summaries` RPC migration

### NO INSTALL needed

---

## 🔑 Notes & Risks

- **Embedding cost**: `text-embedding-004` is FREE up to 1500 RPM on Gemini free tier. Cocok untuk batch + per-chapter background.
- **pgvector RPC**: `match_chapter_summaries` butuh PL/pgSQL function. Saya tulis idempotent migration di `schema.sql`. User yang belum deploy akan dapat warning di RAG fallback.
- **Thread detection accuracy**: AI prompt akan menerima existing threads list untuk avoid duplicates. Heuristic: title similarity threshold di service layer untuk dedup.
- **Recap saved**: tabel `recaps` di Supabase punya schema. Ringkasan disimpan untuk reuse.
- **Background task chain**: useBeatWriter sekarang sudah jalan state + radar + lore. Tambah thread detect + chapter summary akan jadi 5 task per chapter. Pakai `Promise.allSettled` agar 1 task gagal tidak block lainnya.
- **Token impact prose-writer**: RAG context injection tambah ~200-500 char per call. Negligible.

---

## 📅 Estimasi
~3 hari sesuai sprint plan. Phase 1+2 (embedding + RAG infra) ~1.5 hari. Phase 3 (thread tracker) ~1 hari. Phase 4 (recap) ~0.5 hari. Phase 5 verify ringan.
