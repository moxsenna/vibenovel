# Sprint 9.5 — QA Hardening (VibeNovel v2) ✅ DONE

## 🎯 Goal
Address 3 valid concurrency / continuity gaps identified by external QA audit (`systems_architecture_qa_report.md`):

1. ✅ **Free Write Memory Blackhole** — Lazy reindexer triggers when user toggles Free Write OFF, sweeps chapters with prose tapi tanpa AI artifacts.
2. ✅ **Offline Reconnect AI Backfill** — Sync flow setelah reconnection sekarang queue background AI tasks untuk synced chapters (state snapshot, summary, threads, lore, plot radar).
3. ✅ **Stale Chat Approval Conflict Detection** — Duplicate-by-name detection sebelum addCharacter/Item/WorldRule. Warning toast kalau sudah ada entry dengan nama sama, blokir doubling.

QA findings yang **TIDAK** dieksekusi:
- ❌ "Background Task Queue" (Mitigation 3.1) — overkill, existing `geminiPool` sudah handle 429 + cooldown rotation
- ❌ "Cross-chapter contamination" (1.1 overstated) — code closure correctly captures chapter.id, ref-guard mencegah re-trigger
- ❌ "Import Wizard DB pollution" (2.2 inaccurate) — abort hanya cancel AI analyze, DB writes terjadi di handleConfirm setelah user setuju
- ❌ "Optimistic Lock with updated_at" (3.4) — butuh schema migration untuk 3 tables, deferred ke Sprint 10. Replaced dengan duplicate-by-name detection sebagai pragmatic fix.

---

## 📋 Checklist — ALL DONE

### Fix #1 — Free Write Reindexer ✅
- [x] **STEP 1**: `src/services/chapter-reindexer.ts` (~250 lines):
  - `detectMissingArtifacts(chapter)` — returns flags untuk state snapshot, plot radar, lore extraction, thread analysis, chapter summary
  - `reindexChapter(chapterId)` — runs only missing tasks via `Promise.allSettled`, returns succeeded/failed lists
  - `reindexChapters(ids, onProgress, signal)` — sequential loop dengan progress callback + abort
  - `findChaptersNeedingReindex()` — scan project untuk chapters yang punya prose tapi tidak punya artifacts
- [x] **STEP 2**: `src/components/modals/ReindexModal.tsx` (~270 lines):
  - 3 states: idle preview, running progress bar + current chapter, done summary cards
  - Empty state ramah saat semua sudah tersinkronisasi
  - Failed task details collapsible
  - Abort controller dengan focus trap
- [x] **STEP 3**: `src/components/onboarding/FreeWriteIndexerWatcher.tsx` (~50 lines):
  - Mount global di Workspace
  - Detect freeWriteMode true → false transition via ref + 800ms debounce
  - Auto-open ReindexModal kalau `findChaptersNeedingReindex()` non-empty
  - Manual trigger via `useUiStore.openModal('reindex')`
- [x] **STEP 4**: Wire manual trigger di `SettingsModal.tsx` Tutorial tab — section "Sinkronisasi Memori AI" dengan tombol "Buka Reindexer"
- [x] **STEP 5**: Mount `<FreeWriteIndexerWatcher />` di `Workspace.tsx`

### Fix #2 — Offline Reconnect AI Backfill ✅
- [x] **STEP 6**: Modify `useBeatWriter.ts` reconnect sync flow:
  - Track `syncedChapterIds: Set<string>` selama replay loop
  - Setelah `syncPendingDrafts` selesai, sequential loop call `reindexChapter(id)` untuk tiap chapter yang baru di-sync
  - Best-effort: failures di-log, tidak block UI
  - `cancelled` flag honored di between iterations untuk graceful unmount

### Fix #3 — Chat Approval Conflict Detection ✅
- [x] **STEP 7**: Modify `useChatStore.updateMessageDraftStatus`:
  - Helper `findCharByName/findItemByName/findRuleByName` — case-insensitive lookup
  - Untuk character/item/world_rule drafts: jika existing entry dengan nama sama ditemukan, show warning toast (7 detik) dan SKIP `addCharacter`/`addItem`/`addWorldRule`
  - Pesan toast spesifik per type, mengarahkan user ke "edit manual via Story Compass"
  - Mystery layers + character_state + ending tidak terkena duplicate detection (acceptable — intentional add patterns)

### Verification ✅
- [x] **STEP 8**: TypeScript `npx tsc -b --noEmit` zero errors
- [x] **STEP 9**: ESLint `npm run lint` zero errors
- [x] **STEP 10**: Production Build `npm run build` zero errors

---

## 📐 File Summary

### NEW (3 files)
- `src/services/chapter-reindexer.ts` — reindex orchestrator (250 lines)
- `src/components/modals/ReindexModal.tsx` — UI dengan progress + results (270 lines)
- `src/components/onboarding/FreeWriteIndexerWatcher.tsx` — global watcher (50 lines)

### MODIFIED (4 files)
- `src/hooks/useBeatWriter.ts` — sync flow extended dengan reindex backfill
- `src/store/useChatStore.ts` — duplicate detection helpers + warning paths
- `src/components/modals/SettingsModal.tsx` — Sinkronisasi Memori AI section
- `src/pages/Workspace.tsx` — mount FreeWriteIndexerWatcher

### NO INSTALL (zero new deps)

---

## 📊 Bundle Impact

| | Sprint 9 | Sprint 9.5 | Δ |
|---|---|---|---|
| Main entry (raw) | 259.34 KB | 260.24 KB | +0.9 KB |
| Main entry (gzip) | 77.26 KB | 77.44 KB | +0.18 KB |
| Workspace lazy | 225.42 KB | 238.76 KB | +13.3 KB (reindexer + modal) |

Negligible cost untuk significant continuity hardening.

---

## 🔑 Notes & Observations

- **No schema migration**: Stale chat approval fix dipakai pendekatan duplicate-by-name detection daripada `updated_at` optimistic lock. Lebih pragmatic untuk MVP, tapi kalau di masa depan butuh true conflict resolution dengan diff merge, schema migration tetap bisa dilakukan di Sprint 10.
- **Reindexer is sequential**: Bab N+1 butuh state Bab N untuk context, jadi tidak bisa diparallelkan. Warning di UI: "Estimasi N-2N menit untuk N bab".
- **Pragmatic skip on missing detector**: `detectMissingArtifacts` pakai cheap proxy (state snapshot + summary as anchor). Lore extraction tidak punya per-chapter detector — di-rerun kalau anchor data missing. Acceptable tradeoff vs adding `last_indexed_at` column.
- **Free Write watcher uses `useEffect`, bukan store subscribe**: simpler implementation, sufficient since watcher is always mounted in Workspace.
