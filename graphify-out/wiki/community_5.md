# Community 5: Core Architecture Systems

This community represents the **Core Architecture Systems** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `100% Client-Side SPA Constraint` | **RATIONALE** | `architecture.md` | N/A |
| `4-Layer Context Assembly (context-injector.ts)` | **CODE** | `src/services/ai/context-injector.ts` | N/A |
| `4-Layer Memory & Context Pruning System` | **RATIONALE** | `architecture.md` | N/A |
| `AI Router Coordinator (ai-router.ts)` | **CODE** | `src/services/ai/ai-router.ts` | N/A |
| `Anti-Flicker Dual-Theme Architecture` | **RATIONALE** | `architecture.md` | N/A |
| `BYOK & Local Encrypted Keyring Security` | **RATIONALE** | `architecture.md` | N/A |
| `Beat-by-Beat Prose Canvas Panel` | **CODE** | `src/components/workspace/ProseCanvasPanel.tsx` | N/A |
| `CoAuthor Chat UI Interface` | **CODE** | `src/components/chat/CoAuthorChat.tsx` | N/A |
| `CoAuthor Chat Zustand Store` | **CODE** | `src/store/useChatStore.ts` | N/A |
| `Dual-Theme UI Zustand Store` | **CODE** | `src/store/useUiStore.ts` | N/A |
| `Gemini Key Pool Manager (gemini-pool.ts)` | **CODE** | `src/services/ai/gemini-pool.ts` | N/A |
| `Gemini Multi-Key Cooldown Pool` | **RATIONALE** | `architecture.md` | N/A |
| `OpenRouter Integration Adapter (openrouter-adapter.ts)` | **CODE** | `src/services/ai/openrouter-adapter.ts` | N/A |
| `Project Zustand Store` | **CODE** | `src/store/useProjectStore.ts` | N/A |
| `React Component Framework Logo` | **IMAGE** | `src/assets/react.svg` | N/A |
| `SVG Icon Sprite` | **IMAGE** | `public/icons.svg` | N/A |
| `Settings Zustand Store (API Keys)` | **CODE** | `src/store/useSettingsStore.ts` | N/A |
| `Supabase Client & Auth Instantiation` | **CODE** | `src/lib/supabase.ts` | N/A |
| `Supabase Generated TypeScript Interfaces` | **CODE** | `src/lib/database.types.ts` | N/A |
| `Supabase Row-Level Security (RLS) Policy` | **RATIONALE** | `architecture.md` | N/A |
| `System Architecture & Specs` | **DOCUMENT** | `architecture.md` | N/A |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `System Architecture & Specs` --**rationale_for**--> `100% Client-Side SPA Constraint` _(EXTRACTED)_
- `System Architecture & Specs` --**rationale_for**--> `4-Layer Memory & Context Pruning System` _(EXTRACTED)_
- `System Architecture & Specs` --**rationale_for**--> `Gemini Multi-Key Cooldown Pool` _(EXTRACTED)_
- `System Architecture & Specs` --**rationale_for**--> `Anti-Flicker Dual-Theme Architecture` _(EXTRACTED)_
- `System Architecture & Specs` --**rationale_for**--> `BYOK & Local Encrypted Keyring Security` _(EXTRACTED)_
- `System Architecture & Specs` --**rationale_for**--> `Supabase Row-Level Security (RLS) Policy` _(EXTRACTED)_
- `4-Layer Context Assembly (context-injector.ts)` --**implements**--> `4-Layer Memory & Context Pruning System` _(INFERRED)_
- `Dual-Theme UI Zustand Store` --**implements**--> `Anti-Flicker Dual-Theme Architecture` _(INFERRED)_
- `Settings Zustand Store (API Keys)` --**implements**--> `BYOK & Local Encrypted Keyring Security` _(INFERRED)_
- `Supabase Client & Auth Instantiation` --**implements**--> `Supabase Row-Level Security (RLS) Policy` _(INFERRED)_
- `CoAuthor Chat UI Interface` --**references**--> `SVG Icon Sprite` _(EXTRACTED)_
- `Beat-by-Beat Prose Canvas Panel` --**references**--> `React Component Framework Logo` _(EXTRACTED)_
- `AI Router Coordinator (ai-router.ts)` --**calls**--> `Gemini Key Pool Manager (gemini-pool.ts)` _(EXTRACTED)_
- `AI Router Coordinator (ai-router.ts)` --**calls**--> `OpenRouter Integration Adapter (openrouter-adapter.ts)` _(EXTRACTED)_
- `Beat-by-Beat Prose Canvas Panel` --**calls**--> `AI Router Coordinator (ai-router.ts)` _(INFERRED)_
- `CoAuthor Chat UI Interface` --**calls**--> `AI Router Coordinator (ai-router.ts)` _(INFERRED)_
- `AI Router Coordinator (ai-router.ts)` --**calls**--> `4-Layer Context Assembly (context-injector.ts)` _(INFERRED)_
- `Gemini Key Pool Manager (gemini-pool.ts)` --**semantically_similar_to**--> `OpenRouter Integration Adapter (openrouter-adapter.ts)` _(INFERRED)_
- `4-Layer Context Assembly (context-injector.ts)` --**calls**--> `Supabase Client & Auth Instantiation` _(INFERRED)_
- `Project Zustand Store` --**semantically_similar_to**--> `CoAuthor Chat Zustand Store` _(INFERRED)_
- `CoAuthor Chat UI Interface` --**calls**--> `CoAuthor Chat Zustand Store` _(EXTRACTED)_
- `Beat-by-Beat Prose Canvas Panel` --**semantically_similar_to**--> `CoAuthor Chat UI Interface` _(INFERRED)_
- `Supabase Client & Auth Instantiation` --**references**--> `Supabase Generated TypeScript Interfaces` _(EXTRACTED)_

## Cross-Community Bridges
_No outbound or inbound boundary bridges._

---
[← Back to Wiki Home](index.md)