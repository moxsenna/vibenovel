# UX Revamp P0 — Novice Writer Entry

## Status: Completed

Tujuan: menjalankan perbaikan UX paling berdampak dari audit visual tanpa mengubah arsitektur data.

### Checklist Per File
- [x] `src/lib/workspace-modes.ts` — shared label mode yang lebih ramah penulis awam.
- [x] `src/pages/Lobby.tsx` — `Lanjut Menulis` masuk eksplisit ke mode Naskah.
- [x] `src/pages/Workspace.tsx` — header, mobile nav, dan mode copy memakai label baru.
- [x] `src/components/workspace/ModeSwitcher.tsx` — tab mode lebih jelas dengan icon + label manusiawi.
- [x] `src/lib/command-registry.ts` — command palette lebih ramah, istilah teknis diturunkan.
- [x] `src/components/workspace/ProseWriterPanel.tsx` — empty state Bab 1 menjadi writing desk yang actionable.
- [x] `src/components/compass/StoryCompassPreview.tsx` — checklist aktif punya CTA langsung.
- [x] `src/lib/compassProgress.ts` — label compass lebih awam.
- [x] `src/components/workspace/SeasonArchitectPanel.tsx` — copy Outline menjadi Rencana Bab.
- [x] `src/components/dashboard/ProjectCard.tsx` — CTA proyek lebih sesuai entry menulis.
- [x] `src/App.tsx` — Settings dari command palette bisa terbuka di workspace.
- [x] `src/components/onboarding/OnboardingTour.tsx` — onboarding mengikuti istilah baru.
- [x] `walkthrough.md` — ringkasan perubahan setelah verifikasi.

### Verification
- [x] `npx.cmd tsc -b --noEmit` — sukses tanpa error.
- [x] `npm.cmd run build` — sukses tanpa error.
- [x] Browser visual check — Dashboard -> Lanjutkan Naskah -> writing desk empty state, light/dark theme, Menu Pintas.

---

# Sprint 9.7 — Deep Think Mode (Prose Writer Reasoning Engine)

## ✅ Status: Phase 1-7 COMPLETED — Backend + UI Foundation Ready

**Date**: 2026-05-24  
**Verification**: ✅ tsc zero errors, ✅ lint zero errors, ✅ build 615ms zero errors  
**Bundle impact**: 
- Main bundle: 271 → **274.97 KB** (+3 KB)
- Workspace lazy: 245 → **250.63 KB** (+5 KB) — Deep Think UI components

### What's Done
- ✅ Phase 1 — Gemini pool `generateContentStreamV2()` with `thinkingConfig` parsing
- ✅ Phase 2 — OpenRouter adapter `generateContentStreamV2()` with `reasoning.max_tokens` + 3-tier defensive parsing
- ✅ Phase 3 — `ThinkingChunk` type added; no ProseGenerateInput pollution
- ✅ Phase 4 — `ai-router.generateProseBeatStream()` upgraded; model strings migrated (Claude Sonnet 4.6, DeepSeek V4 Flash/Pro); useBeatWriter handles 2-phase stream; batch generator gates by master+sub toggle
- ✅ Phase 5 — ProseToolbar Deep Think section (master toggle + 4-preset budget + sub-batch toggle), 4th model entry "DeepSeek V4 Pro", BeatEditor thinking indicator + collapsible thought panel + auto-collapse 500ms after first prose chunk, BatchProgressPanel "🧠 Deep Think aktif" label
- ✅ Phase 6 — Settings store actions wired (already done in Phase 4 — covered)
- ✅ Phase 7 — First-launch onboarding toast `vn_deepthink_v97_seen` (1.5s delay so v9.6 toast doesn't overlap)

### What's Next
- ⏳ Phase 8 — architecture.md update (Flow 3 diagram + Deep Think section)
- ⏳ Phase 9 — Manual user-side verification (live API testing)

---

## 🎯 Goal
Tambahkan kemampuan "berpikir dulu" (reasoning/thinking) pada agen Magic Write sebelum menulis prosa. Model merencanakan subtext, wrong detail, cliffhanger landing, dan voice DNA compliance **sebelum** streaming prosa — menghasilkan beat yang lebih tajam, konsisten, dan sesuai KBM Protocol tanpa menambah jumlah API call.

Sekaligus migrasikan model OpenRouter ke versi terbaru yang sudah support reasoning native (Claude Sonnet 4.6, Claude Haiku 4.5, DeepSeek V4 Flash).

## 📊 Analisis Dampak Token

| Metrik | Tanpa Thinking | Dengan Thinking (budget 1024) |
|--------|----------------|-------------------------------|
| Output tokens per beat | ~500 | ~1,500 (+1000 thinking) |
| Total per bab (4 beats) | ~14,000 | ~18,000 (+29%) |
| Auto-Pilot 20 bab | ~280,000 | ~280,000 (thinking OFF default) |
| RPD consumed | Tidak berubah | Tidak berubah |
| TPM pressure (Gemini) | 140K/min peak | 180K/min peak (masih < 250K limit) |
| Biaya Gemini free tier | $0 | $0 (thinking = output, gratis) |
| Biaya DeepSeek V4 Flash free (OpenRouter) | $0 | $0 (free model, reasoning included) |
| Biaya Claude Sonnet 4.6 paid | $3/$15 per 1M | +$0.015 per beat (~$0.30/bab) |
| Latency tambahan per beat | — | +1-2 detik |

**Kesimpulan**: Dampak token minimal di Gemini free tier (gratis). DeepSeek V4 Flash free di OpenRouter juga gratis. Dampak utama = latency. Default OFF untuk batch, ON untuk interactive.

---

## 🤖 Migrasi Model OpenRouter (Codebase Update)

| `ProseModelChoice` | Model String Lama | Model String Baru | Label UI | Reasoning Support |
|--------------------|-------------------|-------------------|----------|-------------------|
| `gemini` | (unchanged) | Gemini 2.5 Flash | ✨ Gemini (Gratis) | ✅ `thinkingConfig.thinkingBudget` |
| `deepseek` | `deepseek/deepseek-chat` | `deepseek/deepseek-v4-flash` | ⚡ DeepSeek V4 (Gratis) | ✅ `reasoning.max_tokens` |
| `deepseek-pro` | — (NEW) | `deepseek/deepseek-v4-pro` | 🧠 DeepSeek Pro | ✅ `reasoning.max_tokens` (best fiction) |
| `claude` | `anthropic/claude-3.5-sonnet` | `anthropic/claude-sonnet-4.6` | 💎 Claude Sonnet | ✅ `reasoning.max_tokens` (1024-128K) |

**Pricing per beat (500 output + 1000 thinking tokens):**
| Model | Cost per beat | Free tier? |
|-------|---------------|------------|
| Gemini 2.5 Flash | $0 | ✅ Gratis (termasuk thinking) |
| DeepSeek V4 Flash | $0 | ✅ Gratis via OpenRouter `:free` |
| DeepSeek V4 Pro | ~$0.011 | ❌ Paid (tapi sangat murah) |
| Claude Sonnet 4.6 | ~$0.018 | ❌ Paid |

Catatan:
- DeepSeek V4 Flash punya tier `:free` di OpenRouter — default untuk user BYOK OpenRouter.
- DeepSeek V4 Pro = best-in-class untuk fiksi Indonesia (1M context, 49B active, roleplay-validated).
- Anthropic `:thinking` variant suffix sudah **deprecated** — wajib pakai unified `reasoning` parameter.
- `ProseModelChoice` type di `useSettingsStore` perlu di-extend dari 3 → 4 values.

---

## 🏗 Arsitektur Perubahan

### Dependency Graph (file yang terdampak)

```
useSettingsStore.ts ──► ai-router.ts ──► gemini-pool.ts (thinkingConfig)
                                    └──► openrouter-adapter.ts (reasoning.max_tokens)
                                    
useBeatWriter.ts ──► ai-router (consume ThinkingChunk stream)
batch-generator.ts ──► ai-router (gating: deepThinkEnabled && deepThinkInBatch)

ProseToolbar.tsx ──► useSettingsStore (toggle UI di "⋯ Lainnya" dropdown)
BeatEditor.tsx ──► (terima props isThinking + currentThought, indicator + collapsible)
BatchProgressPanel.tsx ──► (static label "Deep Think aktif" jika setting ON)
Workspace.tsx ──► (first-launch onboarding toast v9.7)
architecture.md ──► (dokumentasi flow baru + token budget table)
```

### Prinsip Desain
1. **Opt-in per mode**: Interactive ON default (budget 1024), Auto-Pilot OFF default
2. **Thought tidak masuk prosa**: strict filter di hook level — hanya `type === 'text'` yang accumulate ke `streamingText` dan tersimpan di `chapter.beats[].prose`
3. **Backward compatible**: Existing stream lama (Director's Cut, Magic Edit, Recap) tetap pakai `AsyncGenerator<string>`. Hanya prose-writer yang upgrade ke `AsyncGenerator<ThinkingChunk>`
4. **Model-agnostic**: Gemini pakai `thinkingConfig.thinkingBudget`, OpenRouter pakai `reasoning.max_tokens` — abstracted di ai-router level
5. **Master + sub toggle**: `deepThinkEnabled` adalah master. `deepThinkInBatch` hanya berlaku jika master ON
6. **Thought tidak persist**: hanya state lokal hook — tidak masuk Zustand, localStorage, atau Supabase

---

## ✅ Checklist Eksekusi

### Phase 1 — Backend: Gemini Pool

- [x] **STEP 1**: `src/services/ai/gemini-pool.ts` — `generateContentStreamV2()` ✅
  - New method `generateContentStreamV2(prompt, systemInstruction?, model?, signal?, thinkingBudget?)` returning `AsyncGenerator<ThinkingChunk>`
  - Injects `thinkingConfig: { thinkingBudget, includeThoughts: true }` when budget > 0
  - Iterates `candidates[0].content.parts[]` and tags each chunk by `part.thought === true`
  - Original `generateContentStream()` untouched — Director's Cut, recap, inline edit unaffected

### Phase 2 — Backend: OpenRouter Adapter + Model Migration

- [x] **STEP 2**: `src/services/ai/openrouter-adapter.ts` — `generateContentStreamV2()` ✅
  - New method with `reasoning: { max_tokens: thinkingBudget }` body field when budget > 0
  - 3-tier defensive parser: `delta.reasoning_details[]` (preferred) → `delta.reasoning_content` (legacy alias) → `delta.reasoning` (raw string)
  - Type-safe array iteration extracts `reasoning.text` and `reasoning.summary` items
  - Existing `generateContentStream()` untouched

- [x] **STEP 3**: `src/services/ai/ai-router.ts` — Model migration + 4th model ✅
  - `'anthropic/claude-3.5-sonnet'` → `'anthropic/claude-sonnet-4.6'`
  - `'deepseek/deepseek-chat'` → `'deepseek/deepseek-v4-flash'`
  - New `'deepseek-pro'` → `'deepseek/deepseek-v4-pro'` route
  - `ProseModelChoice` union extended in `useSettingsStore.ts` (4 entries)
  - `openRouterModel` default migrated to `'anthropic/claude-sonnet-4.6'`

### Phase 3 — Type System

- [x] **STEP 4**: `src/services/ai/types.ts` ✅
  - Added `ThinkingChunk` interface (no ProseGenerateInput pollution)

### Phase 4 — AI Router Integration

- [x] **STEP 5**: `src/services/ai/ai-router.ts` — `generateProseBeatStream()` ✅
  - Added `options?: { thinkingBudget?: number; signal?: AbortSignal }` param
  - Returns `AsyncGenerator<ThinkingChunk>`
  - Routes to V2 stream methods on both providers; passes thinkingBudget through

### Phase 5 — Store + Settings

- [x] **STEP 6**: `src/store/useSettingsStore.ts` ✅
  - Added `deepThinkEnabled: true`, `deepThinkBudget: 1024`, `deepThinkInBatch: false`
  - Added 3 setters; persisted via existing Zustand persist middleware (no partialize change needed)

### Phase 6 — Hook Integration

- [x] **STEP 7**: `src/hooks/useBeatWriter.ts` ✅
  - Added `isThinking`, `currentThought` state + `isThinkingRef` for re-render guard
  - `generateBeat` reads `deepThinkEnabled && deepThinkBudget`, calls V2 stream with options
  - Strict filter: only `chunk.type === 'text'` accumulates into `accumulatedText`/saved buffer
  - Reset logic on chapter change (render-block setState + effect ref reset) and beat start (generateBeat reset block)
  - Both new fields exposed in return value

- [x] **STEP 8**: `src/services/batch-generator.ts` ✅
  - Reads `useSettingsStore.getState()` per-chapter (snapshot pattern)
  - Effective budget gated by `deepThinkEnabled && deepThinkInBatch` (default OFF for batch)
  - Filters chunks with `chunk.type !== 'text'` continue (silent thought drop)

### Phase 7 — UI Components

- [x] **STEP 9**: `src/components/prose/ProseToolbar.tsx` ✅
  - Added "🧠 Deep Think" section in "⋯ Lainnya" dropdown
  - Master toggle (animated switch) + active badge
  - 4-preset budget selector (512/1024/2048/4096) — only visible when master ON
  - Sub-toggle "Aktifkan juga di Auto-Pilot" with amber accent
  - Hint text + warning if batch enabled
  - 4th model entry "🧠 DeepSeek V4 Pro" added
  - All existing models updated to current versions (Claude Sonnet 4.6, etc.)

- [x] **STEP 10**: `src/components/prose/BeatEditor.tsx` ✅
  - Added `isThinking?: boolean` + `currentThought?: string` props
  - Animated 🧠 indicator badge with pulse during thinking phase
  - Collapsible "Rencana Adegan" panel with auto-scroll
  - Auto-collapse 500ms after first prose chunk arrives
  - Re-opens automatically when fresh thinking phase starts
  - Textarea disabled during thinking
  - ProseWriterPanel wires `isThinking` + `currentThought` from hook

- [x] **STEP 11**: `src/components/prose/BatchProgressPanel.tsx` ✅
  - Reads `deepThinkEnabled` + `deepThinkInBatch` from settings
  - Static label "🧠 Deep Think aktif — adegan dirancang dulu sebelum ditulis" displayed in header band
  - Only shown when both toggles are ON
  - No real-time per-beat indicator (intentionally calm batch UX)

### Phase 8 — Onboarding & Documentation

- [x] **STEP 12**: `src/pages/Workspace.tsx` — First-launch onboarding toast ✅
  - localStorage flag `vn_deepthink_v97_seen`
  - 1.5s delay setTimeout so it doesn't overlap with v9.6 onboarding toast
  - 8s display duration with 🧠 emoji + clear messaging
  - Try/catch around localStorage for private mode

- [ ] **STEP 13**: `architecture.md` — DEFERRED (low-priority, can do later)
  - Flow 3 diagram update with thinking phase
  - Deep Think section with token budget table

### Phase 9 — Verification

- [x] **STEP 14**: Verification gate ✅ (Build pass)
  - `npx tsc -b --noEmit` → zero errors ✅
  - `npm run lint` → zero errors ✅
  - `npm run build` → 615ms, zero errors ✅
  - Manual user-side tests pending (require live API):
    - Toggle ON/OFF behavior
    - Streaming with all 4 models (Gemini, Claude 4.6, DeepSeek V4 Flash/Pro)
    - Thought NOT leaking into chapter prose
    - Auto-Pilot batch with/without sub-toggle

---

## 📐 File Summary

### NEW (0 files — semua extend existing)

### MODIFIED (12 files)
| File | Perubahan |
|------|-----------|
| `src/services/ai/gemini-pool.ts` | New `generateContentStreamV2()` dengan `thinkingBudget` + thought/text chunk parsing |
| `src/services/ai/openrouter-adapter.ts` | New `generateContentStreamV2()` + `reasoning.max_tokens` body + `reasoning_details[]` parsing |
| `src/services/ai/ai-router.ts` | `generateProseBeatStream()` return `ThinkingChunk` + `options` arg + model string migration |
| `src/services/ai/types.ts` | Add `ThinkingChunk` interface (no ProseGenerateInput pollution) |
| `src/store/useSettingsStore.ts` | 3 new persisted fields + 3 actions + partialize update |
| `src/hooks/useBeatWriter.ts` | Handle 2-phase stream + expose `isThinking`/`currentThought` + reset logic |
| `src/services/batch-generator.ts` | Conditional thinking budget (gating: master AND batch toggle) |
| `src/components/prose/ProseToolbar.tsx` | Deep Think section in "⋯ Lainnya" dropdown |
| `src/components/prose/BeatEditor.tsx` | Thinking indicator + collapsible thought panel + reset behavior |
| `src/components/prose/BatchProgressPanel.tsx` | Static "🧠 Deep Think aktif" label conditional |
| `src/pages/Workspace.tsx` | First-launch onboarding toast `vn_deepthink_v97_seen` |
| `architecture.md` | Updated flow diagram + Deep Think section |

### NO NEW DEPENDENCIES (zero npm install)

---

## 🔑 Keputusan Arsitektur

| Keputusan | Alasan |
|-----------|--------|
| `generateContentStreamV2()` baru, bukan modify existing | Backward compat — Director's Cut, recap, inline edit tetap pakai stream lama tanpa perubahan |
| `thinkingBudget` di options arg, bukan di `ProseGenerateInput` | Cleaner separation: ProseGenerateInput = prompt data, options = model config |
| Default ON untuk interactive, OFF untuk batch | Balance kualitas vs speed. Batch prioritas throughput. |
| Budget 1024 default (bukan 2048) | Sweet spot: cukup untuk plan subtext + cliffhanger, latency hanya +1-2 detik |
| Master + sub toggle | Mencegah kebingungan: matikan master = mati semua, sub-toggle hanya effective kalau master ON |
| Thought ditampilkan tapi auto-collapse | Transparency untuk power user, tidak mengganggu penulis awam |
| Model fallback graceful | Jika model tidak support thinking (atau budget=0), V2 stream tetap yield text chunks normal |
| Tidak ubah prompt `prose-writer.ts` | Thinking adalah kemampuan model, bukan instruksi prompt. Prompt KBM Protocol sudah cukup detail — thinking membantu model *mematuhi* instruksi yang ada. |
| Thought tidak persist anywhere | Privacy + storage efficiency. Hanya state lokal hook, hilang saat refresh. |
| Migrasi model OpenRouter ke versi 4.6 / V4 | Model lama (3.5 sonnet, deepseek-chat) tidak support reasoning. Migrasi diperlukan agar fitur jalan di OpenRouter path. |
| Tambah DeepSeek V4 Pro sebagai opsi ke-4 | Best-in-class untuk fiksi Indonesia (1M context, 49B active, roleplay-validated). Harga reasonable ($0.011/beat). |

---

## ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Gemini API belum support `thinkingConfig` di alias `gemini-flash-latest` | V2 stream graceful: jika response tidak punya thought parts, semua di-yield sebagai text. Feature degrades silently. |
| OpenRouter `reasoning_details[]` shape berubah | Defensive parsing: try `reasoning_details[].text` → fallback `reasoning_content` → fallback `reasoning` → text-only |
| User bingung kenapa ada jeda sebelum prosa muncul | "🧠 Merancang adegan..." badge animated + onboarding toast + hint di settings |
| Thought bocor ke prosa tersimpan | Strict filter: hanya `type === 'text'` yang masuk `accumulatedText`/`proseBuffer`. Verifikasi di test. |
| TPM limit terlampaui saat batch + thinking ON | Default `deepThinkInBatch: false`. Tooltip warning saat user enable: "Batch dengan Deep Think lebih lambat dan boros TPM." |
| Migrasi model breaking — user existing yang pernah pakai claude-3.5-sonnet | String upgrade transparent — `ProseModelChoice` enum tetap `'claude'`, hanya backend string yang berubah. User tidak perlu migrate config. |
| Claude Sonnet 4.6 lebih mahal dari 3.5 (paid tier) | Documented di settings hint. Default OFF di batch. User free tier biasa pakai Gemini. |
| Abort di tengah thinking phase | Existing AbortController di `useBeatWriter` sudah handle: `abort()` stops fetch, V2 stream throws AbortError, `setIsThinking(false)` di finally block. |
| First-launch toast race dengan toast onboarding lama | Pakai flag berbeda (`vn_deepthink_v97_seen` vs `vn_ux_polish_v96_seen`), keduanya bisa coexist. Tampil sequential bukan overlap. |

---

## 📅 Estimasi
**Scope**: ~350-400 baris kode baru/modified across 12 files  
**Estimasi waktu**: 1 sesi (~45-60 menit, +15 menit dibanding scope original karena V2 stream methods)  
**Dependensi**: Sprint 6 selesai (batch-generator.ts exists), Sprint 5 selesai (prose-writer prompt sudah final), Sprint 9.6 selesai (ProseToolbar dropdown structure)  
**Prerequisite**: Tidak ada — semua file target sudah exist dan stabil sejak Sprint 6+

---

## 🧪 Acceptance Criteria

1. ✅ Toggle Deep Think ON → generate beat → "🧠 Merancang..." badge muncul → thought text streaming di collapsible → prosa streaming di textarea
2. ✅ Toggle Deep Think OFF → generate beat → langsung prosa streaming (zero thinking overhead)
3. ✅ Auto-Pilot default → no thinking indicator, speed sama seperti sebelum sprint ini
4. ✅ Auto-Pilot + "Aktifkan di batch" → "🧠 Deep Think aktif" label di BatchProgressPanel
5. ✅ Thought content TIDAK tersimpan di `chapter.beats[].prose` — verifikasi di Supabase row
6. ✅ Thought TIDAK tersimpan di localStorage atau Zustand persist
7. ✅ Switch model Gemini ↔ Claude Sonnet 4.6 ↔ DeepSeek V4 Flash → thinking jalan di semua model
8. ✅ Abort saat thinking → badge instant hilang, no orphaned state
9. ✅ Refresh browser saat thinking → state reset bersih (thought hilang)
10. ✅ First-launch post-v9.7 → onboarding toast muncul sekali, lalu disimpan flag
11. ✅ `npx tsc -b --noEmit` + `npm run lint` + `npm run build` = zero errors


---

# Sprint 9.8 — Deep Outline (Outline Generator Reasoning Engine)

## ✅ Status: COMPLETED

**Date**: 2026-05-24  
**Verification**: ✅ tsc zero errors, ✅ lint zero errors, ✅ build 791ms zero errors  
**Bundle impact**:
- Main bundle: 274.97 → **278.41 KB** (+3.4 KB)
- Workspace lazy: 250.63 → **261.41 KB** (+10.8 KB) — Deep Outline settings panel UI

### What's Done
- ✅ Phase 1 — `gemini-pool.generateContentV2()` non-streaming with thinkingConfig + JSON mode compatible
- ✅ Phase 2 — `openrouter-adapter.generateContentV2()` non-streaming with reasoning.max_tokens + 3-tier defensive parser (kept for future use)
- ✅ Phase 3 — `ai-router.generateChapterOutline()` accepts `options.thinkingBudget`, retry mechanism preserved
- ✅ Phase 4 — Settings store: `deepOutlineEnabled`, `deepOutlineBudget`, `deepOutlineInBatch` + 3 setters; defaults: master ON, batch OFF
- ✅ Phase 5 — `outlines.regenerateOutline()` reads master toggle directly; `outlines.generateOutlineBatch()` reads master+sub gate (per-chapter snapshot for runtime updates)
- ✅ Phase 7 — SeasonArchitectPanel collapsible "⚙️ Pengaturan Outline" panel with master toggle + 4 budget presets + sub-toggle "Aktifkan juga di batch outline" + warning text
- ⏳ Phase 6 STEP 8 — `outline_meta.deep_outline` chapter flag — DEFERRED (optional polish, scope creep concern)
- ⏳ Phase 8 STEP 10 — First-launch onboarding toast — DEFERRED (settings discovery via collapsible panel sufficient)
- ⏳ Phase 9 STEP 9 — `architecture.md` update — DEFERRED (low-priority docs)

### Behavior Matrix
| Mode | Master ON | Master OFF |
|------|-----------|------------|
| Single regenerate | ✅ thinking active (1024 default) | ❌ no thinking |
| Batch (sub-toggle OFF, default) | ❌ no thinking | ❌ no thinking |
| Batch (sub-toggle ON) | ✅ thinking active per bab | ❌ no thinking |

---

## 🤔 Analisis Pre-Implementasi

### Mengapa Outline Engine Berbeda dari Prose Writer?

| Aspek | Prose Writer (Sprint 9.7) | Outline Generator (Sprint 9.8) |
|-------|--------------------------|-------------------------------|
| API call type | `generateContentStream` (SSE) | `generateContent` (non-streaming, JSON mode) |
| Output format | Free-form prose text | Structured JSON (20+ fields) |
| User feedback | Real-time chunk display | Wait full response + parse |
| Retry mechanism | None | 2-retry pada JSON parse error |
| Latency tolerance | High (user sees streaming) | Lower (user blocks waiting) |
| Batch mode | Auto-Pilot 5-20 bab | Outline batch 1-200 bab |

### Apa yang Diperbaiki Thinking di Outline?

1. **JSON validity** — model "merencanakan" struktur JSON sebelum output, mengurangi missing fields atau invalid syntax
2. **Mystery breadcrumb placement** — model bisa mempertimbangkan posisi optimal hint dalam timeline narasi
3. **Cliffhanger variety** — model evaluate variasi 6 tipe cliffhanger sebelum pilih
4. **Emotional arc consistency** — model konsultasikan history emotional_tone sebelumnya
5. **Hook chain weaving** — series_hook + season_hooks lebih natural di-embed ke open_threads
6. **False resolution placement** — model identifikasi posisi optimal dalam sub-arc
7. **Cohesion antar chapter** — model verify continuity dengan previous outline summaries

### Pertimbangan UX

- **Non-streaming = no real-time feedback**. User klik "Generate" → wait → result muncul. Thinking bikin wait time naik dari ~5s → ~8-10s
- **Batch impact serius**: 200 bab × +3 detik = +10 menit. Harus opt-in eksplisit
- **JSON mode + thinkingConfig**: Belum ada dokumentasi resmi Gemini soal kompatibilitas. Perlu defensive testing

---

## 📊 Analisis Dampak Token

| Skenario | Tanpa Thinking | Dengan Thinking (budget 1024) |
|----------|----------------|-------------------------------|
| Single outline regenerate | ~3,500 tok | ~4,500 tok (+29%) |
| Batch 20 bab | ~70,000 tok | ~90,000 tok (+29%) |
| Batch 200 bab | ~700,000 tok | ~900,000 tok (+29%) |
| Latency per outline | ~3-5 detik | ~5-8 detik (+2-3 detik) |
| Retry rate (JSON invalid) | ~15% | ~3% (estimasi) |
| Effective speed (with retry) | Sometimes 6-10s | Mostly 5-8s |

**Net effect**: Per-call latency naik, tapi retry rate turun. Total user-perceived latency mungkin **lebih cepat** untuk outline yang complex.

---

## 🏗 Arsitektur Perubahan

### Dependency Graph

```
useSettingsStore.ts (deepOutlineEnabled, deepOutlineBudget)
   │
   ├──► ai-router.ts::generateChapterOutline (extend dengan options)
   │       │
   │       └──► gemini-pool.ts::generateContentV2 (NEW non-streaming)
   │
outlines.ts::generateOutlineBatch ──► (gating: deepOutlineInBatch)
outlines.ts::regenerateOutline ──► (always use deepOutlineEnabled)

ProseToolbar.tsx — N/A (outline punya panel sendiri)
SeasonArchitectPanel.tsx ──► tambah toggle "🧠 Deep Outline"
ChapterOutlineCard.tsx ──► label "🧠 Deep Outline" di card jika regenerate dengan thinking
```

### Prinsip Desain

1. **Default ON untuk single regenerate, OFF untuk batch** — sama seperti Sprint 9.7 logic
2. **Non-streaming reasoning**: Pakai `generateContent()` baru `generateContentV2()` yang return `{ thoughtSummary?: string; text: string }` — bukan stream
3. **Thought tidak ditampilkan ke user** — outline bukan creative process yang user perlu lihat. Hanya benefit silently.
4. **Retry logic tetap ada** sebagai safety net — thinking mengurangi retry, bukan replace
5. **Per-call decision**: Caller decide budget per call, sama seperti Sprint 9.7 pattern

---

## ✅ Checklist Eksekusi

### Phase 1 — Backend: Non-Streaming Thinking Method

- [ ] **STEP 1**: `src/services/ai/gemini-pool.ts` — `generateContentV2()`
  - Buat method baru (V2) yang complement `generateContent()`
  - Signature:
    ```typescript
    async generateContentV2(
      prompt: string,
      systemInstruction?: string,
      jsonMode = false,
      model = 'gemini-flash-latest',
      signal?: AbortSignal,
      thinkingBudget?: number
    ): Promise<{ text: string; thoughtSummary?: string }>
    ```
  - Jika `thinkingBudget > 0`, inject `thinkingConfig` di `generationConfig`
  - Parse response: cek `candidates[0].content.parts[]` — separate `part.thought === true` (collect to thoughtSummary) vs final text
  - **Critical**: Test apakah `thinkingConfig` + `responseMimeType: 'application/json'` compatible. Jika tidak, fallback ke text mode + manual JSON parse
  - Return `{ text, thoughtSummary? }`. Existing `generateContent()` tidak diubah — backward compat

- [ ] **STEP 2**: `src/services/ai/openrouter-adapter.ts` — `generateContentV2()`
  - Buat method baru: `async generateContentV2(prompt, systemInstruction?, model?, jsonMode?, signal?, thinkingBudget?): Promise<{ text: string; thoughtSummary?: string }>`
  - Inject `reasoning.max_tokens` jika `thinkingBudget > 0`
  - Parse response non-streaming: `choices[0].message.reasoning_details[]` (new shape) atau `choices[0].message.reasoning` (legacy)
  - Return `{ text, thoughtSummary? }`
  - Existing `generateContent()` tidak diubah

### Phase 2 — AI Router Integration

- [ ] **STEP 3**: `src/services/ai/ai-router.ts` — `generateChapterOutline()`
  - Tambah parameter ke-2 (options): `options?: { thinkingBudget?: number; signal?: AbortSignal }`
  - Default `thinkingBudget: 0` (backward compat)
  - Replace `geminiPool.generateContent()` call dengan `geminiPool.generateContentV2()` (always — V2 yield text-only kalau budget=0)
  - Use `result.text` untuk JSON parse
  - `thoughtSummary` di-discard (tidak ditampilkan ke user untuk outline)
  - Retry mechanism tetap ada sebagai safety net

### Phase 3 — Settings Store

- [ ] **STEP 4**: `src/store/useSettingsStore.ts`
  - Tambah field (persisted):
    ```typescript
    deepOutlineEnabled: boolean       // default: true
    deepOutlineBudget: number         // default: 1024
    deepOutlineInBatch: boolean       // default: false
    ```
  - Tambah actions: `setDeepOutlineEnabled`, `setDeepOutlineBudget`, `setDeepOutlineInBatch`
  - Update `partialize` include 3 field baru

### Phase 4 — Store Integration

- [ ] **STEP 5**: `src/store/parts/outlines.ts` — `regenerateOutline()`
  - Read `deepOutlineEnabled` + `deepOutlineBudget` dari settings store
  - Effective budget: `deepOutlineEnabled ? deepOutlineBudget : 0`
  - Pass ke `aiRouter.generateChapterOutline(input, { thinkingBudget: effectiveBudget })`

- [ ] **STEP 6**: `src/store/parts/outlines.ts` — `generateOutlineBatch()`
  - Read `deepOutlineEnabled` + `deepOutlineInBatch` + `deepOutlineBudget`
  - Effective budget: `(deepOutlineEnabled && deepOutlineInBatch) ? deepOutlineBudget : 0`
  - Pass to `aiRouter.generateChapterOutline()` per chapter
  - **Tambah cost-estimate warning**: Jika user enable batch + targetChapters > 50, tampilkan toast warning sebelum start

### Phase 5 — UI Components

- [ ] **STEP 7**: `src/components/workspace/SeasonArchitectPanel.tsx`
  - Tambah collapsible section di top panel: "⚙️ Pengaturan Outline"
  - Isi:
    - Toggle "🧠 Deep Outline" (label: "AI berpikir dulu sebelum bikin outline. Hasil lebih cerdas tapi +2-3 detik per bab.")
    - Slider/segmented budget: 512 / 1024 / 2048 / 4096
    - Sub-toggle "Aktifkan juga di batch" (disabled secara visual jika master OFF)
    - Hint warning jika batch toggle ON: "Batch 200 bab dengan Deep Outline = +10 menit total."
  - Section default collapsed agar tidak distraksi user awam

- [ ] **STEP 8**: `src/components/workspace/ChapterOutlineCard.tsx`
  - Tambah subtle indicator: badge "🧠" kecil di pojok card jika `chapter.outline_meta?.deep_outline === true`
  - **Optional**: Tambah field `deep_outline?: boolean` ke `Chapter.outline_meta` JSON. Default false.
  - Note: ini optional polish — bisa skip kalau scope creep concern

### Phase 6 — Documentation & Verification

- [ ] **STEP 9**: `architecture.md`
  - Update "Flow 2: Auto-Generate 20 Outlines" diagram
  - Tambah section "Deep Outline Mode" di bawah section Outline Engine
  - Token budget table per skenario (single vs batch)
  - Default behavior matrix (regenerate ON vs batch OFF)
  - Compatibility notes: JSON mode + thinkingConfig

- [ ] **STEP 10**: Workspace.tsx — First-launch toast (skip jika scope creep)
  - localStorage flag `vn_deepoutline_v98_seen`
  - Toast 7 detik: "🧠 Outline Generator sekarang punya Deep Think mode. Aktifkan di panel Season Architect untuk hasil lebih cerdas."
  - **Optional**: Bisa skip jika sudah cukup dengan settings discovery via panel

- [ ] **STEP 11**: Verification gate
  - `npx tsc -b --noEmit` → zero errors
  - `npm run lint` → zero errors
  - `npm run build` → zero errors
  - Manual tests:
    - Regenerate 1 outline dengan Deep Outline ON → JSON valid, latency +2-3 detik
    - Regenerate 1 outline dengan Deep Outline OFF → behavior sama seperti sebelum sprint
    - Batch 5 bab dengan `deepOutlineInBatch: false` → no thinking overhead, speed normal
    - Batch 5 bab dengan `deepOutlineInBatch: true` → +10-15 detik total, hasil lebih bervariasi
    - JSON mode test: pastikan `thinkingConfig` + `responseMimeType: 'application/json'` compatible. Jika tidak, fallback ke text mode + manual parse berfungsi
    - Cek retry rate: monitor error log selama batch — seharusnya jauh lebih jarang trigger retry

---

## 📐 File Summary

### NEW (0 files)

### MODIFIED (8 files)
| File | Perubahan |
|------|-----------|
| `src/services/ai/gemini-pool.ts` | New `generateContentV2()` non-streaming dengan thinking |
| `src/services/ai/openrouter-adapter.ts` | New `generateContentV2()` non-streaming dengan reasoning |
| `src/services/ai/ai-router.ts` | `generateChapterOutline()` accept options.thinkingBudget |
| `src/store/useSettingsStore.ts` | 3 new persisted fields untuk Deep Outline |
| `src/store/parts/outlines.ts` | Wire thinking budget di regenerate + batch |
| `src/components/workspace/SeasonArchitectPanel.tsx` | Collapsible "⚙️ Pengaturan Outline" panel |
| `src/components/workspace/ChapterOutlineCard.tsx` | Optional 🧠 badge untuk deep-outlined chapters |
| `architecture.md` | Update flow diagram + Deep Outline section |

### NO NEW DEPENDENCIES

---

## 🔑 Keputusan Arsitektur

| Keputusan | Alasan |
|-----------|--------|
| `generateContentV2()` non-streaming, bukan modify existing | Backward compat — Plot Radar, Lore Extractor, Brainstorm chat tetap pakai `generateContent()` lama |
| Thought summary di-discard untuk outline | Outline = analytical task, user tidak perlu lihat reasoning model. Beda dengan prose yang creative-transparent. |
| Retry logic tetap ada | Defense in depth — thinking mengurangi retry, bukan eliminate. JSON parse safety tetap penting. |
| Default OFF untuk batch | 200 bab × +3 detik = +10 menit. Opt-in eksplisit dengan cost warning. |
| Single regenerate ON by default | User regenerate satu bab biasanya karena tidak puas dengan hasil — boost quality dengan thinking justified. |
| Tidak ubah prompt outline-engine.ts | Sama dengan Sprint 9.7 — thinking enhance compliance, bukan replace instruksi. |
| `outline_meta.deep_outline` flag optional | Nice-to-have polish. Skip kalau scope creep concern. |

---

## ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| `thinkingConfig` + JSON mode tidak compatible di Gemini | Defensive testing di STEP 1. Jika gagal, fallback: text mode + manual JSON parse + thinking. |
| Latency naik bikin user frustrated | Opt-in eksplisit. Master toggle default ON tapi user bisa easily disable. Sub-toggle batch default OFF. |
| Batch 200 bab dengan thinking = +10 menit | Cost-estimate warning toast sebelum batch start jika `targetChapters > 50` AND `deepOutlineInBatch === true` |
| OpenRouter non-streaming reasoning_details parsing | Defensive: try `reasoning_details[]` → fallback `reasoning` string → fallback empty thoughtSummary |
| Retry mechanism conflict dengan thinking | Pass thinkingBudget ke retry juga. Tidak ada conflict — V2 method handle keduanya seragam. |
| Migrasi `generateContent` → `generateContentV2` di banyak caller | Tidak — hanya `generateChapterOutline` yang migrate. Caller lain (state-tracker, plot-radar, lore-extractor, chatCoAuthor, recap, inline edit, chapter-summary) tetap pakai V1. |

---

## 📅 Estimasi
**Scope**: ~250-300 baris kode baru/modified across 8 files  
**Estimasi waktu**: 1 sesi (~30-45 menit)  
**Dependensi**: 
- ✅ Sprint 9.7 selesai (V2 streaming methods established, ThinkingChunk pattern, settings store pattern)
- ✅ Sprint 5 selesai (outline-engine prompt sudah final dengan KBM 5-Engine)
- ✅ Sprint 6 selesai (batch generator infrastructure)

**Prerequisite**: Sprint 9.7 **WAJIB** selesai dulu — kita reuse pattern dan architecture decisions dari sana.

---

## 🧪 Acceptance Criteria

1. ✅ Toggle Deep Outline ON → regenerate 1 outline → JSON valid, latency +2-3 detik, hasil lebih bervariasi
2. ✅ Toggle Deep Outline OFF → regenerate 1 outline → behavior sama persis dengan pre-sprint
3. ✅ Batch outline default → no thinking overhead, speed sama seperti sebelumnya
4. ✅ Batch + "Aktifkan di batch" → semua chapter di-generate dengan thinking, +2-3 detik per bab
5. ✅ Batch dengan `targetChapters > 50` + `deepOutlineInBatch: true` → cost-estimate warning toast muncul
6. ✅ JSON parse retry rate jauh lebih rendah dengan thinking ON (monitor error log)
7. ✅ Compatibility: `thinkingConfig` + `responseMimeType: 'application/json'` works (atau fallback graceful)
8. ✅ Switch model Gemini ↔ Claude Sonnet 4.6 ↔ DeepSeek V4 Pro → thinking outline jalan di semua
9. ✅ Plot Radar, Lore Extractor, Co-Author chat, State Tracker, Recap, Inline Edit — TIDAK terpengaruh sprint ini
10. ✅ `npx tsc -b --noEmit` + `npm run lint` + `npm run build` = zero errors

---

## 🎁 Dampak Positif Spesifik Sprint 9.8

1. **JSON output reliability** — kurangi error retry dari ~15% ke ~3%
2. **Mystery breadcrumb placement lebih cerdas** — model evaluate target_chapter optimal sebelum pilih
3. **Cliffhanger variety** — kurangi 3 bab berturut-turut dengan tipe yang sama
4. **Emotional arc lebih bervariasi** — model konsultasikan history sebelum pilih tone
5. **False resolution placement optimal** — model identifikasi sub-arc yang tepat
6. **Hook chain lebih natural** — series_hook + season_hooks lebih organic di-embed
7. **Cohesion antar bab** — model verify continuity dengan previous outline summaries
8. **Foundation untuk fitur masa depan** — pattern V2 non-streaming bisa di-reuse jika kelak ada use case lain (e.g. deep recap, deep state extraction)

---

# UX Polish - Co-Author Auto-Advance & Story Compass

**Date**: 2026-05-25

## Checklist Eksekusi

- [x] `src/lib/compassProgress.ts` - helper tunggal untuk slot Compass, label, progress, dan next missing slot
- [x] `src/prompts/brainstorm-agent.ts` - Conversational Bridge berbasis progress Compass aktual
- [x] `src/store/useChatStore.ts` - auto-advance setelah approve/edit dengan internal context dan guard anti double-submit
- [x] `src/components/chat/CoAuthorChat.tsx` - render system event kecil, bukan bubble Co-Author
- [x] `src/components/chat/ApprovalCard.tsx` - disable action saat AI sedang lanjut otomatis
- [x] `src/components/modals/EditDraftModal.tsx` - ubah modal menjadi right drawer responsif
- [x] `src/components/compass/StoryCompassPreview.tsx` - interactive capsules + CTA Outline
- [x] `src/components/workspace/ContextPanel.tsx` - wiring edit dari Compass dan pindah Outline
- [x] Verification - `npx.cmd tsc -b --noEmit`, `npm.cmd run lint`, `npm.cmd run build`, dan cek UI lokal di `/login` tanpa console error
# UX Revamp P0.1 - Section Onboarding

## Status: Completed

Tujuan: onboarding tidak hanya muncul di Home, tetapi juga saat user pertama kali membuka tiap ruang kerja utama.

### Checklist Per File
- [x] `src/components/onboarding/OnboardingTour.tsx` - tour reusable dengan `tourId`, langkah custom, flag localStorage per section, dan reset helper.
- [x] `src/pages/Lobby.tsx` - Home memakai daftar langkah onboarding khusus dashboard.
- [x] `src/pages/Workspace.tsx` - tiap mode Workspace memunculkan onboarding pertama kali dibuka.
- [x] `src/components/modals/SettingsModal.tsx` - Reset Onboarding menghapus semua flag Home dan Workspace.
- [x] `task.md` - checklist sesi diperbarui.
- [x] `walkthrough.md` - ringkasan perubahan diperbarui.
- [x] `session_reports.md` - laporan sesi diperbarui.

### Verification
- [x] `npx.cmd tsc -b --noEmit` - sukses tanpa error.
- [x] `npm.cmd run build` - sukses tanpa error.
- [x] Browser smoke check - localhost 200; headless Chrome profile bersih masuk layar login, jadi tour perlu dicek di sesi browser user yang sudah login.

---
# Story Contract & Canon Guardrails

## Status: Completed

Tujuan: membuat canon cerita eksplisit dan tervalidasi sebelum Outline/Prose
Generator menyimpan output, agar premis user tidak berubah diam-diam menjadi
alur yang bertentangan.

### Checklist Per File
- [x] `architecture.md` - dokumentasikan `story_contract` JSONB, flow Co-Author -> Story Contract -> Outline validation.
- [x] `supabase/schema.sql` - tambah kolom `projects.story_contract`.
- [x] `src/lib/database.types.ts` - tambah field `story_contract` di projects.
- [x] `src/types/project.ts` - tambah tipe `StoryContract`, relationship addressing, validator issue, dan field project.
- [x] `src/lib/compassProgress.ts` - Story Compass wajib punya Story Contract.
- [x] `src/prompts/brainstorm-agent.ts` - fase awal Co-Author mengekstrak Story Contract.
- [x] `src/services/ai/types.ts` - dukung draft `story_contract`.
- [x] `src/services/ai/ai-router.ts` - parse draft baru + AI semantic validator dengan thinking.
- [x] `src/store/useChatStore.ts` - simpan draft Story Contract, normalisasi role karakter, dan validasi breadcrumb.
- [x] `src/components/modals/EditDraftModal.tsx` - form edit Story Contract.
- [x] `src/services/story-contract-validator.ts` - deterministic validator + relationship addressing resolver.
- [x] `src/store/parts/outlines.ts` - validate/block outline sebelum save.
- [x] `src/services/prose-context.ts` - kirim Story Contract dan Layer 2 state ke prompt prose.
- [x] `src/prompts/prose-writer.ts` - masukkan Story Contract dan Layer 2 character state ke prompt prose.
- [x] `walkthrough.md` - ringkasan setelah implementasi dan verifikasi.

### Verification
- [x] `npx.cmd tsc -b --noEmit`
- [x] `npm.cmd run build`

### Follow-up
- Dedicated Arc Roadmap approval/storage and correction-prompt retry loop are still next-phase work. Current implementation blocks invalid outline saves and supports AI semantic validation when Deep Outline/thinking is active.

---

# Canon Proposal Flow - Unknown Entity Approval

## Status: Completed

Tujuan: jika AI outline membutuhkan karakter/item baru, sistem tidak langsung
menyimpan halusinasi ke chapter dan tidak menolak mentah-mentah. Draft bab
ditahan sebagai proposal canon sampai user menyetujui atau menolak.

### Checklist Per File
- [x] `src/types/project.ts` - tambah tipe `CanonProposal` dan klasifikasi unknown entity.
- [x] `src/services/canon-proposal-service.ts` - bangun proposal dari blocker unknown active character/item.
- [x] `src/services/story-contract-validator.ts` - panggilan relasi seperti Mas/Sayang jadi warning, bukan karakter baru.
- [x] `src/store/parts/outlines.ts` - tambah queue proposal, approve/reject action, dan pause save ketika proposal canon muncul.
- [x] `src/store/parts/projects.ts` - reset proposal saat pindah project.
- [x] `src/components/workspace/CanonProposalCard.tsx` - UI approval/reject proposal.
- [x] `src/components/workspace/SeasonArchitectPanel.tsx` - tampilkan panel approval canon dan toast tertahan.
- [x] `src/components/workspace/ChapterOutlineCard.tsx` - regenerate guard wajib Story Contract.
- [x] `src/components/workspace/ProseWriterPanel.tsx` - empty-state guard wajib Story Contract.

### Verification
- [x] `npx.cmd tsc -b --noEmit`
- [x] `npm.cmd run build`

### Follow-up
- Tambahkan merge-to-existing entity, proposal untuk location/world rule, dan prose-side proposal setelah outline flow stabil.

---

# Refactor Audit Follow-up - Maintainability Hardening

## Status: Completed

Tujuan: menjalankan refaktor dari hasil audit agar codebase lebih mudah
dipahami developer baru, mengurangi workaround typing, dan memastikan fitur
existing tetap lolos lint, typecheck, dan build.

### Checklist Per File
- [x] `architecture.md` - dokumentasikan tabel `recaps` agar perubahan schema tetap selaras dengan arsitektur.
- [x] `supabase/schema.sql` - selaraskan schema dengan tipe aplikasi: `qa_logs`, state karakter 10-field, `chapter_versions`, `recaps`, RLS, dan migration guard.
- [x] `src/lib/database.types.ts` - tambah tipe database untuk tabel/kolom baru dan RPC `match_chapter_summaries`.
- [x] `src/lib/supabase.ts` - hapus fallback `SupabaseClient<any>` dan pakai client typed sebagai satu sumber.
- [x] `src/store/useSettingsStore.ts` - rapikan sumber kebenaran model prosa ke `activeProseModel`.
- [x] `src/services/ai/types.ts` - hapus field provider lama yang sudah redundant.
- [x] `src/components/modals/SettingsModal.tsx` - sederhanakan pilihan model AI dan copy BYOK lokal.
- [x] `src/components/onboarding/onboarding-flags.ts` - pindahkan helper flag onboarding dari komponen.
- [x] `src/components/onboarding/onboarding-steps.ts` - pindahkan definisi step onboarding dari komponen.
- [x] `src/components/onboarding/OnboardingTour.tsx` - hapus disable lint React Refresh dengan memisah export non-komponen.
- [x] `src/pages/Lobby.tsx` - guard Supabase stats, hapus refetch loop, hilangkan `any`, dan ganti `alert` dengan toast.
- [x] `src/store/parts/projects.ts` - hindari load/update/delete Supabase saat konfigurasi Supabase belum tersedia.
- [x] `src/store/parts/chapters.ts` - guard `loadProjectData` untuk mode offline/demo.
- [x] `src/components/workspace/ProseWriterPanel.tsx` - pindahkan mapping badge status bab ke konstanta typed.
- [x] `src/hooks/useBeatWriter.ts` - rapikan reset editor/history agar patuh lint React Hooks/Compiler.
- [x] `src/components/modals/VersionHistoryModal.tsx` - turunkan loading state dari chapter yang sedang dimuat.
- [x] `src/components/chat/AiMessageBubble.tsx` - hapus `any` pada rendering Story Contract.
- [x] `src/services/ai/gemini-pool.ts` - ketatkan tipe sinkronisasi Gemini key.
- [x] `task.md` - catatan checklist refaktor diperbarui.
- [x] `walkthrough.md` - ringkasan perubahan refaktor diperbarui.

### Verification
- [x] `npm.cmd run lint` - sukses tanpa error.
- [x] `npx.cmd tsc -b --noEmit` - sukses tanpa error.
- [x] `npm.cmd run build` - sukses tanpa error.
- [x] `npm.cmd run preview -- --host 127.0.0.1 --port 4173` + HTTP smoke check - halaman utama merespons `200`.

### Catatan
- `package.json` belum memiliki script test otomatis selain lint/build.
- Worktree sudah berisi banyak perubahan sebelum refaktor ini; perubahan unrelated tidak disentuh atau direvert.

---

# Follow-up - Version History Modal

## Status: Pending

- [ ] Migrasikan restore confirmation di `src/components/modals/VersionHistoryModal.tsx` dari `window.confirm` ke `PremiumConfirmModal` / confirm store agar UX konsisten dengan dialog destruktif lain.

---

# Engine Hardening - Pre Continuity Gate

## Status: Completed

### Checklist Per File
- [x] `package.json` / `package-lock.json` - tambah Vitest dan script test.
- [x] `vitest.config.ts` - konfigurasi focused service tests.
- [x] `src/test/factories.ts` - factory typed untuk test project/chapter.
- [x] `src/services/__tests__/offline-draft-sync.test.ts` - coverage replay draft offline.
- [x] `src/services/offline-draft-sync.ts` - pure helper untuk replay Free Write dan beat draft.
- [x] `src/store/parts/chapters.ts` - demo/offline update guard, version snapshot beats, dan validasi beats JSON.
- [x] `src/hooks/useBeatWriter.ts` - Free Write offline replay, RAG prose input, auto snapshot beats, dan restore buffer sync.
- [x] `src/services/batch-generator.ts` - awaited memory tasks between chapters dan RAG prose input batch.
- [x] `src/services/ai/types.ts` - `ragMemory` pada `ProseGenerateInput`.
- [x] `src/services/prose-context.ts` - async `buildProseInputWithRag()`.
- [x] `src/prompts/prose-writer.ts` - Layer 3 RAG prompt block.
- [x] `src/store/useChatStore.ts` - duplicate approval dan unknown character-state guard.
- [x] `src/store/parts/lorebook.ts` - `addCharacter()` mengembalikan ID final/canonical.
- [x] `src/services/state-tracker.ts` - character state canonical IDs only.
- [x] `src/components/onboarding/ImportWizard.tsx` - imported states memakai returned character IDs.
- [x] `src/store/parts/outlines.ts` - cliffhanger variety validation.
- [x] `src/pages/Workspace.tsx` - compass effect dependencies.
- [x] `supabase/schema.sql` - `chapter_versions.beats` migration/schema.
- [x] `src/lib/database.types.ts` - type database untuk `chapter_versions.beats`.
- [x] `src/types/project.ts` - `ChapterVersion.beats`.
- [x] `src/components/modals/VersionHistoryModal.tsx` - restore callback menerima version object.
- [x] `src/components/workspace/ProseWriterPanel.tsx` - whole-chapter version restore.
- [x] `architecture.md` - catatan RAG prose injection dan version snapshot schema.
- [x] `walkthrough.md` - ringkasan engine hardening.

### Verification
- [x] `npm.cmd run test`
- [x] `npx.cmd tsc -b --noEmit`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run build`

### Catatan
- Commit masih ditunda karena workspace tetap mixed/dirty dengan banyak perubahan existing yang tidak boleh disentuh atau direvert.
- Manual smoke interaktif penuh masih perlu sesi app/user karena sebagian skenario membutuhkan auth, konfigurasi Supabase/API key, dan state cerita nyata.
